import path, { parse } from "path";
import * as fs from 'fs-extra';
import * as XLSX from 'xlsx';
import * as https from 'https';
import { format } from 'date-fns';
import { IServiceResult, ITask } from "../shared/interfaces";
import { icmsRepository } from "../database/repositories";
import { calculateExecutionTime, calculateTaskStats, extractServicePeriodRange, LogMessages, parseDecimal, parseNumber, parseString } from "../shared/utils";
import axios from "axios";
import { ICMS } from "../database/entities";
import { EntityManager } from "typeorm";

export class IcmsService {

    // ========================================
    // PROPRIEDADES E CONFIGURAÇÕES
    // ========================================

    private readonly STORAGE_DIR = path.join(__dirname, '../../../storage');
    private baseUrl = process.env.BASE_URL || 'https://www.confaz.fazenda.gov.br/boletim-arrecadacao/sigdef-1.xlsx';
    private readonly TIMEOUT = 30000;
    private processingMethod = process.env.PROCESSING_METHOD as 'Incremental' | 'Truncate and Load' || 'Incremental';

    // ========================================
    // CONSTRUTOR E INICIALIZAÇÃO
    // ========================================

    constructor() {
        this.ensureStorageDirectory();
    }

    /**
     * Inicializa e garante que o diretório de armazenamento existe para armazenar arquivos
     */
    private async ensureStorageDirectory(): Promise<void> {
        try {
            await fs.ensureDir(this.STORAGE_DIR);
        } catch (error) {
            throw new Error(`Erro ao criar diretório de armazenamento: ${error}`);
        }
    }

    private async cleanDatabase(processingMethod: 'Incremental' | 'Truncate and Load'): Promise<string> {
        if (processingMethod === 'Incremental') {
            const message = '🔄 Modo incremental ativo - mantendo dados existentes no banco';
            return `${message}\n`;
        }

        try {
            console.log('🧹 Modo Truncate and Load - limpando base de dados ICMS...');
            console.log('🧹 Limpando registros ICMS...');
            await icmsRepository.clear();
            return '✅ Base de dados ICMS limpa com sucesso.\n';
        } catch (error) {
            return `Erro ao limpar a base de dados ICMS: ${error}\n`;
        }
    }

    private async downloadExcelFile(url: string): Promise<string> {
        const now = Date.now();
        const dateStr = format(new Date(now), 'yyyy-MM-dd_HH-mm-ss');
        const folderName = `icms_${dateStr}`;
        const fileName = `icms_original_${dateStr}.xlsx`;
        const folderPath = path.join(this.STORAGE_DIR, folderName);

        // Garantir que a pasta específica existe
        await fs.ensureDir(folderPath);

        const filePath = path.join(folderPath, fileName);

        try {
            const response = await axios({
                method: 'GET',
                url: url,
                responseType: 'stream',
                timeout: this.TIMEOUT,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                },
                // Configuração para lidar com certificados SSL auto-assinados
                httpsAgent: new https.Agent({
                    rejectUnauthorized: false
                })
            });

            const writer = fs.createWriteStream(filePath);
            response.data.pipe(writer);

            return new Promise((resolve, reject) => {
                writer.on('finish', () => resolve(filePath));
                writer.on('error', reject);
            });
        } catch (error) {
            throw new Error(`Erro ao baixar arquivo ICMS: ${error}`);
        }
    }

    /**
     * Extrai dados completos do arquivo Excel baixado e salva como JSON
     */
    private async extractCompleteDataFromExcel(excelFilePath: string, processingMethod: 'Incremental' | 'Truncate and Load'): Promise<ICMS[]> {
        try {
            console.log(`📊 Processando arquivo Excel: ${excelFilePath} \n`);

            // Ler o arquivo Excel
            const workbook = XLSX.readFile(excelFilePath);
            const sheetName = workbook.SheetNames[0]; // Primeira aba (CNAE)
            const worksheet = workbook.Sheets[sheetName];

            // Converter para array de objetos (pulando as primeiras 2 linhas de cabeçalho)
            const rawData = XLSX.utils.sheet_to_json(worksheet, {
                header: 1,
                range: 2 // Começar da linha 3 (índice 2)
            }) as any[][];

            // Mapear os cabeçalhos (linha 3 do Excel = índice 0 do rawData)
            const headers = rawData[0] as string[];

            // Filtrar linhas válidas (que não estão completamente vazias)
            let dataRows = rawData.slice(1); // Pular linha de cabeçalhos

            // Remover linhas vazias do final
            dataRows = dataRows.filter(row => {
                // Verificar se a linha tem pelo menos os campos básicos preenchidos
                return row && (
                    (row[0] !== undefined && row[0] !== null && row[0] !== '') ||
                    (row[1] !== undefined && row[1] !== null && row[1] !== '') ||
                    (row[2] !== undefined && row[2] !== null && row[2] !== '')
                );
            });

            console.log(`📋 Encontradas ${dataRows.length} linhas de dados válidas`);

            // Criar mapeamento de colunas uma única vez
            const headerMapping = this.createHeaderMapping(headers);

            // Processar cada linha em um objeto ICMS
            const icmsData: ICMS[] = [];

            for (let i = 0; i < dataRows.length; i++) {
                const row = dataRows[i];

                // Processar linha normalmente
                const icmsRecord = this.mapRowToICMS(row, headerMapping);
                if (icmsRecord) {
                    icmsData.push(icmsRecord);
                }
            }

            if (processingMethod === 'Incremental') {
                console.log(`🔍 ${processingMethod} - Verificando lacunas e novos periodos`);

                try {

                    const icms = await icmsRepository.find({
                        select: ['periodo']
                    });

                    if (icms.length > 0) {
                        // ✅ Extrair apenas os períodos que realmente existem no banco
                        const existingPeriods = [...new Set(icms.map(record => record.periodo))].sort();
                        console.log(`🔍 Períodos existentes no banco: ${existingPeriods}`);

                        // ✅ Períodos disponíveis no arquivo
                        const periodosDisponiveis = [...new Set(icmsData.map(i => i.periodo))].sort();
                        console.log(`🔍 Períodos disponíveis no arquivo: ${periodosDisponiveis}`);

                        // ✅ Filtrar períodos que NÃO existem no banco (lacunas + novos)
                        const filteredPeriods = icmsData.filter(item => {
                            return !existingPeriods.includes(item.periodo);
                        });

                        // ✅ Cache dos novos períodos
                        const novosPeriodos = [...new Set(filteredPeriods.map(i => i.periodo))].sort();
                        console.log(`🔍 Novos períodos encontrados (lacunas + novos): ${novosPeriodos}`);

                        // ✅ Substituição eficiente
                        icmsData.splice(0, icmsData.length, ...filteredPeriods);

                        console.log(`✅ Modo Incremental: ${icmsData.length} novos registros encontrados`);
                        console.log(`📊 Cobrindo lacunas e períodos posteriores a ${existingPeriods[existingPeriods.length - 1]}`);

                        // Se não há novos dados, informar e continuar com array vazio
                        if (filteredPeriods.length === 0) {
                            console.log(`ℹ️ Nenhum período novo encontrado. Base de dados já está atualizada.`);
                        }
                    }
                } catch (error) {
                    console.error(`❌ Erro ao verificar último período no modo incremental: ${error}`);

                    // ✅ Em caso de erro, tratar como primeira execução
                    console.log(`⚠️ Tratando como primeira execução devido ao erro acima`);
                    console.log(`📊 Processando todos os ${icmsData.length} registros`);
                }
            }

            // Salvar JSON em arquivo separado, preservando o Excel original
            const jsonFilePath = excelFilePath.replace('.xlsx', '.json');
            await fs.writeJson(jsonFilePath, icmsData, { spaces: 2 });

            console.log(`\n📊 Arquivo Excel original preservado: ${excelFilePath}`);
            console.log(`\n💾 Dados JSON salvos em: ${jsonFilePath}\n`);
            console.log(`✅ Processados ${icmsData.length} registros ICMS`);

            return icmsData;

        } catch (error) {
            throw new Error(`Erro ao processar arquivo Excel: ${error}`);
        }
    }

    /**
     * Cria o mapeamento de cabeçalhos da planilha para propriedades da entidade
     */
    private createColumnMapping(): Map<string, string> {
        const mapping = new Map<string, string>();

        // Campos básicos
        mapping.set('id_uf', 'idUf');
        mapping.set('UF', 'uf');
        mapping.set('PERÍODO', 'periodo'); // Também mapear com espaço extra
        mapping.set('PERÍODO ', 'periodo'); // Cabeçalho tem espaço extra no final
        mapping.set('ANO', 'ano');
        mapping.set('MÊS', 'mes');

        // Outros tributos
        mapping.set('IPVA - Total Arrecadado de IPVA', 'ipvaTotal');
        mapping.set('ITCMD - Total Arrecadado de ITCMD', 'itcmdTotal');
        mapping.set('TAXA - Total Arrecadado de Taxas', 'taxaTotal');
        mapping.set('ORTB - Total Arrecadado de Outras Receitas Tributárias', 'outrasReceitasTributarias');
        mapping.set('TOTAL DA ARRECADAÇÃO DE OUTROS TRIBUTOS', 'totalOutrosTributos');

        // Dívidas ativas
        mapping.set('DAIC - Total Arrecadado de Dívida Ativa de ICMS', 'dividaAtivaIcms');
        mapping.set('DAIP - Total Arrecadado de Dívida Ativa de IPVA', 'dividaAtivaIpva');
        mapping.set('DAIT - Total Arrecadado de Dívida Ativa de ITCMD', 'dividaAtivaItcmd');
        mapping.set('TOTAL DE DÍVIDAS ATIVAS', 'totalDividasAtivas');

        // Seções CNAE - usar regex para mapear dinamicamente
        mapping.set('Seção: A - AGRICULTURA, PECUÁRIA, PRODUÇÃO FLORESTAL, PESCA E AQUICULTURA', 'secaoAAgricultura');
        mapping.set('Seção: B - INDÚSTRIAS EXTRATIVAS', 'secaoBIndustriasExtrativas');
        mapping.set('Seção: C - INDÚSTRIAS DE TRANSFORMAÇÃO', 'secaoCIndustriasTransformacao');
        mapping.set('Seção: D - ELETRICIDADE E GÁS', 'secaoDEletricidadeGas');
        mapping.set('Seção: E - ÁGUA, ESGOTO, ATIVIDADES DE GESTÃO DE RESÍDUOS E DESCONTAMINAÇÃO', 'secaoEAguaEsgotoResiduos');
        mapping.set('Seção: F - CONSTRUÇÃO', 'secaoFConstrucao');
        mapping.set('Seção: G - COMÉRCIO; REPARAÇÃO DE VEÍCULOS AUTOMOTORES E MOTOCICLETAS', 'secaoGComercio');
        mapping.set('Seção: H - TRANSPORTE, ARMAZENAGEM E CORREIO', 'secaoHTransporte');
        mapping.set('Seção: I - ALOJAMENTO E ALIMENTAÇÃO', 'secaoIAlojamentoAlimentacao');
        mapping.set('Seção: J - INFORMAÇÃO E COMUNICAÇÃO', 'secaoJInformacaoComunicacao');
        mapping.set('Seção: K - ATIVIDADES FINANCEIRAS, DE SEGUROS E SERVIÇOS RELACIONADOS', 'secaoKAtividadesFinanceiras');
        mapping.set('Seção: L - ATIVIDADES IMOBILIÁRIAS', 'secaoLAtividadesImobiliarias');
        mapping.set('Seção: M - ATIVIDADES PROFISSIONAIS, CIENTÍFICAS E TÉCNICAS', 'secaoMAtividadesProfissionais');
        mapping.set('Seção: N - ATIVIDADES ADMINISTRATIVAS E SERVIÇOS COMPLEMENTARES', 'secaoNAtividadesAdministrativas');
        mapping.set('Seção: O - ADMINISTRAÇÃO PÚBLICA, DEFESA E SEGURIDADE SOCIAL', 'secaoOAdministracaoPublica');
        mapping.set('Seção: P - EDUCAÇÃO', 'secaoPEducacao');
        mapping.set('Seção: Q - SAÚDE HUMANA E SERVIÇOS SOCIAIS', 'secaoQSaudeServicosSociais');
        mapping.set('Seção: R - ARTES, CULTURA, ESPORTE E RECREAÇÃO', 'secaoRArtesCulturaEsporte');
        mapping.set('Seção: S - OUTRAS ATIVIDADES DE SERVIÇOS', 'secaoSOutrasAtividadesServicos');
        mapping.set('Seção: T - SERVIÇOS DOMÉSTICOS', 'secaoTServicosDomesticos');
        mapping.set('Seção: U - ORGANISMOS INTERNACIONAIS E OUTRAS INSTITUIÇÕES EXTRATERRITORIAIS', 'secaoUOrganismosInternacionais');
        mapping.set('Seção: ZZ - TOTAL ICMS ARRECADADO DO CNAE NÃO IDENTIFICADO', 'secaoZZCnaeNaoIdentificado');

        // Totais
        mapping.set('TOTAL SEÇÕES/ICMS', 'totalIcms');
        mapping.set('TOTAL SEÇÕES/ICMS + OUTROS TRIBUTOS', 'totalIcmsOutrosTributos');

        return mapping;
    }

    /**
     * Mapeia dinamicamente divisões CNAE baseado no cabeçalho
     */
    private mapDivisionHeader(header: string): string | null {
        // Regex para divisões: "Divisão: XX - NOME"
        const divisionMatch = header.match(/^Divisão:\s*(\d+)\s*-\s*(.+)$/i);
        if (!divisionMatch) return null;

        const divisionNumber = divisionMatch[1].padStart(2, '0');

        // Mapear TODAS as divisões CNAE conhecidas (120+ colunas completas)
        const divisionMappings: Record<string, string> = {
            // Seção A - Agricultura
            '01': 'divisao01AgriculturaPecuaria',
            '02': 'divisao02ProducaoFlorestal',
            '03': 'divisao03PescaAquicultura',

            // Seção B - Indústrias Extrativas  
            '05': 'divisao05ExtracaoCarvao',
            '06': 'divisao06ExtracaoPetroleoGas',
            '07': 'divisao07ExtracaoMineraisMetalicos',
            '08': 'divisao08ExtracaoMineraisNaoMetalicos',
            '09': 'divisao09ApoioExtracaoMinerais',

            // Seção C - Indústrias de Transformação
            '10': 'divisao10ProdutosAlimenticios',
            '11': 'divisao11Bebidas',
            '12': 'divisao12ProdutosFumo',
            '13': 'divisao13ProdutosTexteis',
            '14': 'divisao14VestuarioAcessorios',
            '15': 'divisao15CourosCalcados',
            '16': 'divisao16ProdutosMadeira',
            '17': 'divisao17CelulosePapel',
            '18': 'divisao18ImpressaoGravacoes',
            '19': 'divisao19CoquePetroleoBiocombustiveis',
            '20': 'divisao20ProdutosQuimicos',
            '21': 'divisao21FarmoquimicosFarmaceuticos',
            '22': 'divisao22BorrachaPlastico',
            '23': 'divisao23MineraisNaoMetalicos',
            '24': 'divisao24Metalurgia',
            '25': 'divisao25ProdutosMetal',
            '26': 'divisao26EquipamentosInformatica',
            '27': 'divisao27MaquinasEletricas',
            '28': 'divisao28MaquinasEquipamentos',
            '29': 'divisao29VeiculosAutomotores',
            '30': 'divisao30OutrosEquipamentosTransporte',
            '31': 'divisao31Moveis',
            '32': 'divisao32ProdutosDiversos',
            '33': 'divisao33ManutencaoReparacao',

            // Seção D - Eletricidade e Gás
            '35': 'divisao35EletricidadeGasUtilidades',

            // Seção E - Água, Esgoto, Resíduos
            '36': 'divisao36Agua',
            '37': 'divisao37Esgoto',
            '38': 'divisao38Residuos',
            '39': 'divisao39Descontaminacao',

            // Seção F - Construção
            '41': 'divisao41ConstrucaoEdificios',
            '42': 'divisao42ObrasInfraestrutura',
            '43': 'divisao43ServicosEspecializadosConstrucao',

            // Seção G - Comércio
            '45': 'divisao45ComercioVeiculos',
            '46': 'divisao46ComercioAtacado',
            '47': 'divisao47ComercioVarejista',

            // Seção H - Transporte
            '49': 'divisao49TransporteTerrestre',
            '50': 'divisao50TransporteAquaviario',
            '51': 'divisao51TransporteAereo',
            '52': 'divisao52Armazenamento',
            '53': 'divisao53Correio',

            // Seção I - Alojamento e Alimentação
            '55': 'divisao55Alojamento',
            '56': 'divisao56Alimentacao',

            // Seção J - Informação e Comunicação
            '58': 'divisao58Edicao',
            '59': 'divisao59AtividadesCinematograficas',
            '60': 'divisao60RadioTelevisao',
            '61': 'divisao61Telecomunicacoes',
            '62': 'divisao62TecnologiaInformacao',
            '63': 'divisao63ServicosInformacao',

            // Seção K - Atividades Financeiras
            '64': 'divisao64ServicosFinanceiros',
            '65': 'divisao65SegurosPrevidencia',
            '66': 'divisao66AuxiliaresFinanceiros',

            // Seção L - Atividades Imobiliárias
            '68': 'divisao68AtividadesImobiliarias',

            // Seção M - Atividades Profissionais
            '69': 'divisao69JuridicasContabilidade',
            '70': 'divisao70SedesEmpresasConsultoria',
            '71': 'divisao71ArquiteturaEngenharia',
            '72': 'divisao72PesquisaDesenvolvimento',
            '73': 'divisao73PublicidadePesquisaMercado',
            '74': 'divisao74OutrasAtividadesProfissionais',
            '75': 'divisao75AtividadesVeterinarias',

            // Seção N - Atividades Administrativas
            '77': 'divisao77AlugueisNaoImobiliarios',
            '78': 'divisao78SelecaoAgenciamentoLocacao',
            '79': 'divisao79AgenciasViagens',
            '80': 'divisao80VigilanciaSeguranca',
            '81': 'divisao81ServicosEdificios',
            '82': 'divisao82ServicosEscritorioApoio',

            // Seção O - Administração Pública
            '84': 'divisao84AdministracaoPublicaDefesa',

            // Seção P - Educação
            '85': 'divisao85Educacao',

            // Seção Q - Saúde e Serviços Sociais
            '86': 'divisao86AtencaoSaudeHumana',
            '87': 'divisao87SaudeAssistenciaSocial',
            '88': 'divisao88AssistenciaSocialSemAlojamento',

            // Seção R - Artes, Cultura, Esporte
            '90': 'divisao90AtividadesArtisticas',
            '91': 'divisao91PatrimonioCulturalAmbiental',
            '92': 'divisao92JogosAzarApostas',
            '93': 'divisao93EsportivasRecreacao',

            // Seção S - Outras Atividades de Serviços
            '94': 'divisao94OrganizacoesAssociativas',
            '95': 'divisao95ReparacaoManutencaoObjetos',
            '96': 'divisao96OutrasAtividadesServicosPessoais',

            // Seção T - Serviços Domésticos
            '97': 'divisao97ServicosDomesticos',

            // Seção U - Organismos Internacionais
            '99': 'divisao99OrganismosInternacionais',

            // Seção ZZ - CNAE Não Identificado
            'ZZ': 'divisaoZZCnaeNaoIdentificado'
        };

        return divisionMappings[divisionNumber] || `divisao${divisionNumber}`;
    }

    /**
     * Cria mapeamento de colunas baseado nos cabeçalhos
     */
    private createHeaderMapping(headers: string[]): { [index: number]: string } {
        const columnMapping = this.createColumnMapping();
        const headerMapping: { [index: number]: string } = {};

        let mappedCount = 0;
        const unmappedHeaders: Array<{ index: number, header: string, cleaned: string }> = [];

        headers.forEach((header, index) => {
            if (!header) return;

            // Limpar espaços extras do header
            const cleanedHeader = header.trim().replace(/\s+/g, ' ');
            let propertyName = columnMapping.get(cleanedHeader);

            // Se não encontrou mapeamento direto, tentar mapeamento de divisão
            if (!propertyName) {
                propertyName = this.mapDivisionHeader(cleanedHeader);
            }

            // Se o cabeçalho contém "ZZ" e não foi mapeado ainda, tentar mapeamento manual
            if ((cleanedHeader.includes("DIVISÃO: ZZ") || cleanedHeader.includes("ZZ - TOTAL ICMS")) && !propertyName) {
                propertyName = 'divisaoZZCnaeNaoIdentificado';
            }

            if (propertyName) {
                headerMapping[index] = propertyName;
                mappedCount++;
            } else {
                console.warn(`⚠️ Cabeçalho não mapeado [${index}]: "${header}" (limpo: "${cleanedHeader}")`);
                unmappedHeaders.push({
                    index,
                    header,
                    cleaned: cleanedHeader
                });
            }
        });

        // Log estatísticas de mapeamento
        console.log(`📊 Mapeamento de colunas:`);
        console.log(`  ✅ Mapeadas: ${mappedCount}`);
        console.log(`  ⚠️ Não mapeadas: ${unmappedHeaders.length}`);
        console.log(`  📝 Total de colunas: ${headers.length}`);
        console.log(`  📈 Taxa de mapeamento: ${((mappedCount / headers.length) * 100).toFixed(1)}%`);

        return headerMapping;
    }

    /**
     * Mapeia uma linha da planilha para um objeto ICMS usando mapeamento pré-criado
     */
    private mapRowToICMS(row: any[], headerMapping: { [index: number]: string }): ICMS | null {
        try {
            const icms = new ICMS();
            let debugInfo: any = {};

            // Aplicar valores baseado no mapeamento
            Object.entries(headerMapping).forEach(([indexStr, propertyName]) => {
                const index = parseInt(indexStr);
                if (index >= row.length) return;

                const value = row[index];

                // Debug para campos obrigatórios
                if (['idUf', 'uf', 'periodo', 'ano', 'mes'].includes(propertyName)) {
                    debugInfo[propertyName] = { index, value, rawValue: row[index] };
                }

                // Aplicar valor baseado no tipo do campo
                if (['idUf', 'ano', 'mes'].includes(propertyName)) {
                    (icms as any)[propertyName] = parseNumber(value);
                } else if (['uf', 'periodo'].includes(propertyName)) {
                    (icms as any)[propertyName] = parseString(value);
                } else {
                    // Campos monetários
                    (icms as any)[propertyName] = parseDecimal(value);
                }
            });

            // Validações básicas
            if (!icms.uf || !icms.periodo || !icms.ano || !icms.mes) {
                return null; // Pular registros inválidos silenciosamente
            }

            return icms;

        } catch (error) {
            console.error('❌ Erro ao mapear linha para ICMS:', error);
            return null;
        }
    }

    /**
     * Salva um registro individual ICMS no banco de dados
     */
    private async saveIndividualIcmsToDatabase(icms: ICMS): Promise<ICMS> {
        try {
            return await icmsRepository.save(icms);
        } catch (error) {
            throw new Error(`Erro ao salvar ICMS no banco: ${error}`);
        }
    }

    private async processAndSaveInBatches(batches: ICMS[][], manager: EntityManager, tasks: ITask[]): Promise<PromiseSettledResult<void>[]> {
        // ✅ Retorna array de Promises para paralelização
        return Promise.allSettled(
            batches.map(async (batch, index) => {
                console.log(`🔄 Processando lote ${index + 1}/${batches.length} (${batch.length} registros)...`);

                try {
                    // Batch insert dentro da transação
                    await manager.save(ICMS, batch);

                    // Adicionar sucessos ao tracking
                    batch.forEach(record => {
                        tasks.push({
                            mes: record.mes,
                            ano: record.ano,
                            regiao: record.uf,
                            status: 'Sucesso'
                        });
                    });

                    console.log(`✅ Lote ${index + 1}/${batches.length} concluído com sucesso`);

                } catch (error) {
                    // Adicionar falhas ao tracking
                    batch.forEach(record => {
                        tasks.push({
                            mes: record.mes,
                            ano: record.ano,
                            regiao: record.uf,
                            status: 'Falha'
                        });
                    });

                    console.error(`❌ Erro no lote ${index + 1}: ${error}`);
                    throw error; // Re-throw para cancelar toda a transação
                }
            })
        );
    }

    /**
     * Divide um array em lotes menores para processamento paralelo
     */
    private chunk<T>(array: T[], size: number): T[][] {
        const chunks: T[][] = [];
        for (let i = 0; i < array.length; i += size) {
            chunks.push(array.slice(i, i + size));
        }
        return chunks;
    }


    /**
     * Processamento otimizado com transações, batch insert e paralelização
     */
    public async processAllIcmsDataWithMonitoring(): Promise<IServiceResult> {
        const startTime = Date.now();
        console.log('🚀 Iniciando processamento otimizado dos dados ICMS...\n');

        const tasks: ITask[] = [];
        const currentFilePath = await this.downloadExcelFile(this.baseUrl);
        const icmsData: ICMS[] = await this.extractCompleteDataFromExcel(currentFilePath, this.processingMethod);

        console.log(`📊 Processando ${icmsData.length} registros em lotes otimizados...`);

        try {
            // 🔥 TRANSAÇÃO + BATCH + PARALELIZAÇÃO
            await icmsRepository.manager.transaction(async (manager) => {

                const resultadoLimpeza = await this.cleanDatabase(this.processingMethod);
                console.log(resultadoLimpeza);

                const BATCH_SIZE = 100;
                const batches = this.chunk(icmsData, BATCH_SIZE);

                console.log(`📦 Dividindo em ${batches.length} lotes de até ${BATCH_SIZE} registros`);

                const results = await this.processAndSaveInBatches(batches, manager, tasks);

                // Verificar se todos os lotes foram processados com sucesso
                const failedBatches = results.filter(result => result.status === 'rejected');

                if (failedBatches.length > 0) {
                    throw new Error(`${failedBatches.length} lotes falharam no processamento. Transação cancelada.`);
                }

                console.log(`🎉 Todos os ${batches.length} lotes processados com sucesso!`);
            });

        } catch (error) {
            console.error(`💥 Erro durante o processamento otimizado: ${error}`);
            console.error(`🔄 Todos os dados foram revertidos pela transação`);

            // Marcar todos os registros como falha se a transação falhou
            icmsData.forEach(record => {
                const existingTask = tasks.find(t =>
                    t.mes === record.mes &&
                    t.ano === record.ano &&
                    t.regiao === record.uf
                );

                if (!existingTask) {
                    tasks.push({
                        mes: record.mes,
                        ano: record.ano,
                        regiao: record.uf,
                        status: 'Falha'
                    });
                }
            });
        }

        const endTime = Date.now();
        const tempoExecucao = calculateExecutionTime(startTime, endTime);
        const { sucessos, falhas } = calculateTaskStats(tasks);
        const { periodoInicio, periodoFim } = extractServicePeriodRange(icmsData);

        const resultado: IServiceResult = {
            periodoInicio,
            periodoFim,
            tempoExecucao,
            tasks,
            totalRegistros: icmsData.length,
            sucessos,
            falhas
        };

        console.log(`\n=== ✅ Processamento ICMS Otimizado Concluído ===`);
        console.log(`📊 Total de registros: ${icmsData.length}`);
        console.log(`✅ Sucessos: ${sucessos}`);
        console.log(`❌ Falhas: ${falhas}`);
        console.log(`⏱️ Tempo total: ${Math.round(tempoExecucao / 1000)} segundos`);
        console.log(`🚀 Performance: ${Math.round(icmsData.length / (tempoExecucao / 1000))} registros/segundo`);
        console.log(`📈 Taxa de sucesso: ${((sucessos / icmsData.length) * 100).toFixed(1)}%`);

        return resultado;
    }
}