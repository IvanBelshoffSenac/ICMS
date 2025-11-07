import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('icms')
export class ICMS {
    @PrimaryGeneratedColumn("uuid")
    id: string

    // Campos básicos de identificação
    @Column({ type: 'int', name: 'id_uf' })
    idUf: number;

    @Column({ type: 'varchar', length: 2, name: 'uf' })
    uf: string;

    @Column({ type: 'varchar', length: 6, name: 'periodo' })
    periodo: string; // Formato: YYYYMM

    @Column({ type: 'int', name: 'ano' })
    ano: number;

    @Column({ type: 'int', name: 'mes' })
    mes: number;

    // Outros Tributos
    @Column({ type: 'decimal', precision: 15, scale: 2, name: 'ipva_total', nullable: true })
    ipvaTotal: number;

    @Column({ type: 'decimal', precision: 15, scale: 2, name: 'itcmd_total', nullable: true })
    itcmdTotal: number;

    @Column({ type: 'decimal', precision: 15, scale: 2, name: 'taxa_total', nullable: true })
    taxaTotal: number;

    @Column({ type: 'decimal', precision: 15, scale: 2, name: 'outras_receitas_tributarias', nullable: true })
    outrasReceitasTributarias: number;

    @Column({ type: 'decimal', precision: 15, scale: 2, name: 'total_outros_tributos', nullable: true })
    totalOutrosTributos: number;

    // Dívidas Ativas
    @Column({ type: 'decimal', precision: 15, scale: 2, name: 'divida_ativa_icms', nullable: true })
    dividaAtivaIcms: number;

    @Column({ type: 'decimal', precision: 15, scale: 2, name: 'divida_ativa_ipva', nullable: true })
    dividaAtivaIpva: number;

    @Column({ type: 'decimal', precision: 15, scale: 2, name: 'divida_ativa_itcmd', nullable: true })
    dividaAtivaItcmd: number;

    @Column({ type: 'decimal', precision: 15, scale: 2, name: 'total_dividas_ativas', nullable: true })
    totalDividasAtivas: number;

    // Seção A - Agricultura, Pecuária, Produção Florestal, Pesca e Aquicultura
    @Column({ type: 'decimal', precision: 15, scale: 2, name: 'secao_a_agricultura', nullable: true })
    secaoAAgricultura: number;

    @Column({ type: 'decimal', precision: 15, scale: 2, name: 'divisao_01_agricultura_pecuaria', nullable: true })
    divisao01AgriculturaPecuaria: number;

    @Column({ type: 'decimal', precision: 15, scale: 2, name: 'divisao_02_producao_florestal', nullable: true })
    divisao02ProducaoFlorestal: number;

    @Column({ type: 'decimal', precision: 15, scale: 2, name: 'divisao_03_pesca_aquicultura', nullable: true })
    divisao03PescaAquicultura: number;

    // Seção B - Indústrias Extrativas
    @Column({ type: 'decimal', precision: 15, scale: 2, name: 'secao_b_industrias_extrativas', nullable: true })
    secaoBIndustriasExtrativas: number;

    @Column({ type: 'decimal', precision: 15, scale: 2, name: 'divisao_05_extracao_carvao', nullable: true })
    divisao05ExtracaoCarvao: number;

    @Column({ type: 'decimal', precision: 15, scale: 2, name: 'divisao_06_extracao_petroleo_gas', nullable: true })
    divisao06ExtracaoPetroleoGas: number;

    @Column({ type: 'decimal', precision: 15, scale: 2, name: 'divisao_07_extracao_minerais_metalicos', nullable: true })
    divisao07ExtracaoMineraisMetalicos: number;

    @Column({ type: 'decimal', precision: 15, scale: 2, name: 'divisao_08_extracao_minerais_nao_metalicos', nullable: true })
    divisao08ExtracaoMineraisNaoMetalicos: number;

    @Column({ type: 'decimal', precision: 15, scale: 2, name: 'divisao_09_apoio_extracao_minerais', nullable: true })
    divisao09ApoioExtracaoMinerais: number;

    // Seção C - Indústrias de Transformação
    @Column({ type: 'decimal', precision: 15, scale: 2, name: 'secao_c_industrias_transformacao', nullable: true })
    secaoCIndustriasTransformacao: number;

    @Column({ type: 'decimal', precision: 15, scale: 2, name: 'divisao_10_produtos_alimenticios', nullable: true })
    divisao10ProdutosAlimenticios: number;

    @Column({ type: 'decimal', precision: 15, scale: 2, name: 'divisao_11_bebidas', nullable: true })
    divisao11Bebidas: number;

    @Column({ type: 'decimal', precision: 15, scale: 2, name: 'divisao_12_produtos_fumo', nullable: true })
    divisao12ProdutosFumo: number;

    @Column({ type: 'decimal', precision: 15, scale: 2, name: 'divisao_13_produtos_texteis', nullable: true })
    divisao13ProdutosTexteis: number;

    @Column({ type: 'decimal', precision: 15, scale: 2, name: 'divisao_14_vestuario_acessorios', nullable: true })
    divisao14VestuarioAcessorios: number;

    @Column({ type: 'decimal', precision: 15, scale: 2, name: 'divisao_15_couros_calcados', nullable: true })
    divisao15CourosCalcados: number;

    @Column({ type: 'decimal', precision: 15, scale: 2, name: 'divisao_16_produtos_madeira', nullable: true })
    divisao16ProdutosMadeira: number;

    @Column({ type: 'decimal', precision: 15, scale: 2, name: 'divisao_17_celulose_papel', nullable: true })
    divisao17CelulosePapel: number;

    @Column({ type: 'decimal', precision: 15, scale: 2, name: 'divisao_18_impressao_gravacoes', nullable: true })
    divisao18ImpressaoGravacoes: number;

    @Column({ type: 'decimal', precision: 15, scale: 2, name: 'divisao_19_coque_petroleo_biocombustiveis', nullable: true })
    divisao19CoquePetroleoBiocombustiveis: number;

    @Column({ type: 'decimal', precision: 15, scale: 2, name: 'divisao_20_produtos_quimicos', nullable: true })
    divisao20ProdutosQuimicos: number;

    @Column({ type: 'decimal', precision: 15, scale: 2, name: 'divisao_21_farmoquimicos_farmaceuticos', nullable: true })
    divisao21FarmoquimicosFarmaceuticos: number;

    @Column({ type: 'decimal', precision: 15, scale: 2, name: 'divisao_22_borracha_plastico', nullable: true })
    divisao22BorrachaPlastico: number;

    @Column({ type: 'decimal', precision: 15, scale: 2, name: 'divisao_23_minerais_nao_metalicos', nullable: true })
    divisao23MineraisNaoMetalicos: number;

    @Column({ type: 'decimal', precision: 15, scale: 2, name: 'divisao_24_metalurgia', nullable: true })
    divisao24Metalurgia: number;

    @Column({ type: 'decimal', precision: 15, scale: 2, name: 'divisao_25_produtos_metal', nullable: true })
    divisao25ProdutosMetal: number;

    @Column({ type: 'decimal', precision: 15, scale: 2, name: 'divisao_26_equipamentos_informatica', nullable: true })
    divisao26EquipamentosInformatica: number;

    @Column({ type: 'decimal', precision: 15, scale: 2, name: 'divisao_27_maquinas_eletricas', nullable: true })
    divisao27MaquinasEletricas: number;

    @Column({ type: 'decimal', precision: 15, scale: 2, name: 'divisao_28_maquinas_equipamentos', nullable: true })
    divisao28MaquinasEquipamentos: number;

    @Column({ type: 'decimal', precision: 15, scale: 2, name: 'divisao_29_veiculos_automotores', nullable: true })
    divisao29VeiculosAutomotores: number;

    @Column({ type: 'decimal', precision: 15, scale: 2, name: 'divisao_30_outros_equipamentos_transporte', nullable: true })
    divisao30OutrosEquipamentosTransporte: number;

    @Column({ type: 'decimal', precision: 15, scale: 2, name: 'divisao_31_moveis', nullable: true })
    divisao31Moveis: number;

    @Column({ type: 'decimal', precision: 15, scale: 2, name: 'divisao_32_produtos_diversos', nullable: true })
    divisao32ProdutosDiversos: number;

    @Column({ type: 'decimal', precision: 15, scale: 2, name: 'divisao_33_manutencao_reparacao', nullable: true })
    divisao33ManutencaoReparacao: number;

    // Seção D - Eletricidade e Gás
    @Column({ type: 'decimal', precision: 15, scale: 2, name: 'secao_d_eletricidade_gas', nullable: true })
    secaoDEletricidadeGas: number;

    @Column({ type: 'decimal', precision: 15, scale: 2, name: 'divisao_35_eletricidade_gas_utilidades', nullable: true })
    divisao35EletricidadeGasUtilidades: number;

    // Seção E - Água, Esgoto, Atividades de Gestão de Resíduos
    @Column({ type: 'decimal', precision: 15, scale: 2, name: 'secao_e_agua_esgoto_residuos', nullable: true })
    secaoEAguaEsgotoResiduos: number;

    @Column({ type: 'decimal', precision: 15, scale: 2, name: 'divisao_36_agua', nullable: true })
    divisao36Agua: number;

    @Column({ type: 'decimal', precision: 15, scale: 2, name: 'divisao_37_esgoto', nullable: true })
    divisao37Esgoto: number;

    @Column({ type: 'decimal', precision: 15, scale: 2, name: 'divisao_38_residuos', nullable: true })
    divisao38Residuos: number;

    @Column({ type: 'decimal', precision: 15, scale: 2, name: 'divisao_39_descontaminacao', nullable: true })
    divisao39Descontaminacao: number;

    // Seção F - Construção
    @Column({ type: 'decimal', precision: 15, scale: 2, name: 'secao_f_construcao', nullable: true })
    secaoFConstrucao: number;

    @Column({ type: 'decimal', precision: 15, scale: 2, name: 'divisao_41_construcao_edificios', nullable: true })
    divisao41ConstrucaoEdificios: number;

    @Column({ type: 'decimal', precision: 15, scale: 2, name: 'divisao_42_obras_infraestrutura', nullable: true })
    divisao42ObrasInfraestrutura: number;

    @Column({ type: 'decimal', precision: 15, scale: 2, name: 'divisao_43_servicos_especializados_construcao', nullable: true })
    divisao43ServicosEspecializadosConstrucao: number;

    // Seção G - Comércio
    @Column({ type: 'decimal', precision: 15, scale: 2, name: 'secao_g_comercio', nullable: true })
    secaoGComercio: number;

    @Column({ type: 'decimal', precision: 15, scale: 2, name: 'divisao_45_comercio_veiculos', nullable: true })
    divisao45ComercioVeiculos: number;

    @Column({ type: 'decimal', precision: 15, scale: 2, name: 'divisao_46_comercio_atacado', nullable: true })
    divisao46ComercioAtacado: number;

    @Column({ type: 'decimal', precision: 15, scale: 2, name: 'divisao_47_comercio_varejista', nullable: true })
    divisao47ComercioVarejista: number;

    // Seção H - Transporte, Armazenagem e Correio
    @Column({ type: 'decimal', precision: 15, scale: 2, name: 'secao_h_transporte', nullable: true })
    secaoHTransporte: number;

    @Column({ type: 'decimal', precision: 15, scale: 2, name: 'divisao_49_transporte_terrestre', nullable: true })
    divisao49TransporteTerrestre: number;

    @Column({ type: 'decimal', precision: 15, scale: 2, name: 'divisao_50_transporte_aquaviario', nullable: true })
    divisao50TransporteAquaviario: number;

    @Column({ type: 'decimal', precision: 15, scale: 2, name: 'divisao_51_transporte_aereo', nullable: true })
    divisao51TransporteAereo: number;

    @Column({ type: 'decimal', precision: 15, scale: 2, name: 'divisao_52_armazenamento', nullable: true })
    divisao52Armazenamento: number;

    @Column({ type: 'decimal', precision: 15, scale: 2, name: 'divisao_53_correio', nullable: true })
    divisao53Correio: number;

    // Seção I - Alojamento e Alimentação
    @Column({ type: 'decimal', precision: 15, scale: 2, name: 'secao_i_alojamento_alimentacao', nullable: true })
    secaoIAlojamentoAlimentacao: number;

    @Column({ type: 'decimal', precision: 15, scale: 2, name: 'divisao_56_alimentacao', nullable: true })
    divisao56Alimentacao: number;

    @Column({ type: 'decimal', precision: 15, scale: 2, name: 'divisao_55_alojamento', nullable: true })
    divisao55Alojamento: number;

    // Seção J - Informação e Comunicação
    @Column({ type: 'decimal', precision: 15, scale: 2, name: 'secao_j_informacao_comunicacao', nullable: true })
    secaoJInformacaoComunicacao: number;

    @Column({ type: 'decimal', precision: 15, scale: 2, name: 'divisao_58_edicao', nullable: true })
    divisao58Edicao: number;

    @Column({ type: 'decimal', precision: 15, scale: 2, name: 'divisao_59_atividades_cinematograficas', nullable: true })
    divisao59AtividadesCinematograficas: number;

    @Column({ type: 'decimal', precision: 15, scale: 2, name: 'divisao_60_radio_televisao', nullable: true })
    divisao60RadioTelevisao: number;

    @Column({ type: 'decimal', precision: 15, scale: 2, name: 'divisao_61_telecomunicacoes', nullable: true })
    divisao61Telecomunicacoes: number;

    @Column({ type: 'decimal', precision: 15, scale: 2, name: 'divisao_62_tecnologia_informacao', nullable: true })
    divisao62TecnologiaInformacao: number;

    @Column({ type: 'decimal', precision: 15, scale: 2, name: 'divisao_63_servicos_informacao', nullable: true })
    divisao63ServicosInformacao: number;

    // Seção K - Atividades Financeiras
    @Column({ type: 'decimal', precision: 15, scale: 2, name: 'secao_k_atividades_financeiras', nullable: true })
    secaoKAtividadesFinanceiras: number;

    @Column({ type: 'decimal', precision: 15, scale: 2, name: 'divisao_64_servicos_financeiros', nullable: true })
    divisao64ServicosFinanceiros: number;

    @Column({ type: 'decimal', precision: 15, scale: 2, name: 'divisao_65_seguros_previdencia', nullable: true })
    divisao65SegurosPrevidencia: number;

    @Column({ type: 'decimal', precision: 15, scale: 2, name: 'divisao_66_auxiliares_financeiros', nullable: true })
    divisao66AuxiliaresFinanceiros: number;

    // Seção L - Atividades Imobiliárias
    @Column({ type: 'decimal', precision: 15, scale: 2, name: 'secao_l_atividades_imobiliarias', nullable: true })
    secaoLAtividadesImobiliarias: number;

    @Column({ type: 'decimal', precision: 15, scale: 2, name: 'divisao_68_atividades_imobiliarias', nullable: true })
    divisao68AtividadesImobiliarias: number;

    // Seção M - Atividades Profissionais, Científicas e Técnicas
    @Column({ type: 'decimal', precision: 15, scale: 2, name: 'secao_m_atividades_profissionais', nullable: true })
    secaoMAtividadesProfissionais: number;

    @Column({ type: 'decimal', precision: 15, scale: 2, name: 'divisao_69_juridicas_contabilidade', nullable: true })
    divisao69JuridicasContabilidade: number;

    @Column({ type: 'decimal', precision: 15, scale: 2, name: 'divisao_70_sedes_empresas_consultoria', nullable: true })
    divisao70SedesEmpresasConsultoria: number;

    @Column({ type: 'decimal', precision: 15, scale: 2, name: 'divisao_71_arquitetura_engenharia', nullable: true })
    divisao71ArquiteturaEngenharia: number;

    @Column({ type: 'decimal', precision: 15, scale: 2, name: 'divisao_72_pesquisa_desenvolvimento', nullable: true })
    divisao72PesquisaDesenvolvimento: number;

    @Column({ type: 'decimal', precision: 15, scale: 2, name: 'divisao_73_publicidade_pesquisa_mercado', nullable: true })
    divisao73PublicidadePesquisaMercado: number;

    @Column({ type: 'decimal', precision: 15, scale: 2, name: 'divisao_74_outras_atividades_profissionais', nullable: true })
    divisao74OutrasAtividadesProfissionais: number;

    @Column({ type: 'decimal', precision: 15, scale: 2, name: 'divisao_75_atividades_veterinarias', nullable: true })
    divisao75AtividadesVeterinarias: number;

    // Seção N - Atividades Administrativas e Serviços Complementares
    @Column({ type: 'decimal', precision: 15, scale: 2, name: 'secao_n_atividades_administrativas', nullable: true })
    secaoNAtividadesAdministrativas: number;

    @Column({ type: 'decimal', precision: 15, scale: 2, name: 'divisao_77_alugueis_nao_imobiliarios', nullable: true })
    divisao77AlugueisNaoImobiliarios: number;

    @Column({ type: 'decimal', precision: 15, scale: 2, name: 'divisao_78_selecao_agenciamento_locacao', nullable: true })
    divisao78SelecaoAgenciamentoLocacao: number;

    @Column({ type: 'decimal', precision: 15, scale: 2, name: 'divisao_79_agencias_viagens', nullable: true })
    divisao79AgenciasViagens: number;

    @Column({ type: 'decimal', precision: 15, scale: 2, name: 'divisao_80_vigilancia_seguranca', nullable: true })
    divisao80VigilanciaSeguranca: number;

    @Column({ type: 'decimal', precision: 15, scale: 2, name: 'divisao_81_servicos_edificios', nullable: true })
    divisao81ServicosEdificios: number;

    @Column({ type: 'decimal', precision: 15, scale: 2, name: 'divisao_82_servicos_escritorio_apoio', nullable: true })
    divisao82ServicosEscritorioApoio: number;

    // Seção O - Administração Pública, Defesa e Seguridade Social
    @Column({ type: 'decimal', precision: 15, scale: 2, name: 'secao_o_administracao_publica', nullable: true })
    secaoOAdministracaoPublica: number;

    @Column({ type: 'decimal', precision: 15, scale: 2, name: 'divisao_84_administracao_publica_defesa', nullable: true })
    divisao84AdministracaoPublicaDefesa: number;

    // Seção P - Educação
    @Column({ type: 'decimal', precision: 15, scale: 2, name: 'secao_p_educacao', nullable: true })
    secaoPEducacao: number;

    @Column({ type: 'decimal', precision: 15, scale: 2, name: 'divisao_85_educacao', nullable: true })
    divisao85Educacao: number;

    // Seção Q - Saúde Humana e Serviços Sociais
    @Column({ type: 'decimal', precision: 15, scale: 2, name: 'secao_q_saude_servicos_sociais', nullable: true })
    secaoQSaudeServicosSociais: number;

    @Column({ type: 'decimal', precision: 15, scale: 2, name: 'divisao_86_atencao_saude_humana', nullable: true })
    divisao86AtencaoSaudeHumana: number;

    @Column({ type: 'decimal', precision: 15, scale: 2, name: 'divisao_87_saude_assistencia_social', nullable: true })
    divisao87SaudeAssistenciaSocial: number;

    @Column({ type: 'decimal', precision: 15, scale: 2, name: 'divisao_88_assistencia_social_sem_alojamento', nullable: true })
    divisao88AssistenciaSocialSemAlojamento: number;

    // Seção R - Artes, Cultura, Esporte e Recreação
    @Column({ type: 'decimal', precision: 15, scale: 2, name: 'secao_r_artes_cultura_esporte', nullable: true })
    secaoRArtesCulturaEsporte: number;

    @Column({ type: 'decimal', precision: 15, scale: 2, name: 'divisao_90_atividades_artisticas', nullable: true })
    divisao90AtividadesArtisticas: number;

    @Column({ type: 'decimal', precision: 15, scale: 2, name: 'divisao_91_patrimonio_cultural_ambiental', nullable: true })
    divisao91PatrimonioCulturalAmbiental: number;

    @Column({ type: 'decimal', precision: 15, scale: 2, name: 'divisao_92_jogos_azar_apostas', nullable: true })
    divisao92JogosAzarApostas: number;

    @Column({ type: 'decimal', precision: 15, scale: 2, name: 'divisao_93_esportivas_recreacao', nullable: true })
    divisao93EsportivasRecreacao: number;

    // Seção S - Outras Atividades de Serviços
    @Column({ type: 'decimal', precision: 15, scale: 2, name: 'secao_s_outras_atividades_servicos', nullable: true })
    secaoSOutrasAtividadesServicos: number;

    @Column({ type: 'decimal', precision: 15, scale: 2, name: 'divisao_94_organizacoes_associativas', nullable: true })
    divisao94OrganizacoesAssociativas: number;

    @Column({ type: 'decimal', precision: 15, scale: 2, name: 'divisao_95_reparacao_manutencao_objetos', nullable: true })
    divisao95ReparacaoManutencaoObjetos: number;

    @Column({ type: 'decimal', precision: 15, scale: 2, name: 'divisao_96_outras_atividades_servicos_pessoais', nullable: true })
    divisao96OutrasAtividadesServicosPessoais: number;

    // Seção T - Serviços Domésticos
    @Column({ type: 'decimal', precision: 15, scale: 2, name: 'secao_t_servicos_domesticos', nullable: true })
    secaoTServicosDomesticos: number;

    @Column({ type: 'decimal', precision: 15, scale: 2, name: 'divisao_97_servicos_domesticos', nullable: true })
    divisao97ServicosDomesticos: number;

    // Seção U - Organismos Internacionais e Outras Instituições Extraterritoriais
    @Column({ type: 'decimal', precision: 15, scale: 2, name: 'secao_u_organismos_internacionais', nullable: true })
    secaoUOrganismosInternacionais: number;

    @Column({ type: 'decimal', precision: 15, scale: 2, name: 'divisao_99_organismos_internacionais', nullable: true })
    divisao99OrganismosInternacionais: number;

    // Seção ZZ - Total ICMS Arrecadado do CNAE Não Identificado
    @Column({ type: 'decimal', precision: 15, scale: 2, name: 'secao_zz_cnae_nao_identificado', nullable: true })
    secaoZZCnaeNaoIdentificado: number;

    @Column({ type: 'decimal', precision: 15, scale: 2, name: 'divisao_zz_cnae_nao_identificado', nullable: true })
    divisaoZZCnaeNaoIdentificado: number;

    // Totais
    @Column({ type: 'decimal', precision: 15, scale: 2, name: 'total_icms', nullable: true })
    totalIcms: number;

    @Column({ type: 'decimal', precision: 15, scale: 2, name: 'total_icms_outros_tributos', nullable: true })
    totalIcmsOutrosTributos: number;

    // Campos de controle
    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;
}