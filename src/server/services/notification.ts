import * as nodemailer from 'nodemailer';
import * as XLSX from 'xlsx';
import * as path from 'path';
import * as fs from 'fs-extra';
import * as dotenv from 'dotenv';
import { addDays, addMonths, format, differenceInDays, setDate, setHours, setMinutes, setSeconds, isAfter, startOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { IServiceResult } from '../shared/interfaces';


dotenv.config();

export class NotificationService {

    private tempDir = path.join(process.cwd(), 'temp');

    constructor() {
        this.ensureTempDirectory();
    }

    /**
     * Calcula a próxima execução baseada no schedule CRON do serviço ICMS
     */
    private calcularProximaExecucao(): { proximaData: Date; diasAteProxima: number; dataFormatada: string; horaFormatada: string; dataHoraCompleta: string } {
        const agora = new Date();

        // Obter schedule do ICMS do ambiente ou usar padrão (todo dia 20 às 09:00)
        const schedule = process.env.SCHEDULE_ICMS || '0 9 20 * *';

        // Fallback caso o schedule não esteja configurado
        if (!schedule) {
            const proximaData = addDays(agora, 30);
            return {
                proximaData,
                diasAteProxima: 30,
                dataFormatada: format(proximaData, "dd/MM/yyyy", { locale: ptBR }),
                horaFormatada: format(proximaData, "HH:mm", { locale: ptBR }),
                dataHoraCompleta: format(proximaData, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })
            };
        }

        // Parse do CRON schedule (formato: "segundo minuto hora dia mês dia_semana")
        const cronParts = schedule.split(' ');
        const [segundo, minuto, hora, dia, mes] = cronParts;

        let proximaData: Date;

        // Para schedules mensais (dia específico do mês)
        if (dia !== '*' && mes === '*') {
            const diaDoMes = parseInt(dia);
            const horaExecucao = parseInt(hora);
            const minutoExecucao = parseInt(minuto);

            // Calcular próxima execução para o dia específico do mês
            let proximoMes = agora;
            proximoMes = setDate(proximoMes, diaDoMes);
            proximoMes = setHours(proximoMes, horaExecucao);
            proximoMes = setMinutes(proximoMes, minutoExecucao);
            proximoMes = setSeconds(proximoMes, 0);

            // Se a data já passou este mês, ir para o próximo mês
            if (isAfter(agora, proximoMes)) {
                proximoMes = addMonths(proximoMes, 1);
                proximoMes = setDate(proximoMes, diaDoMes);
            }

            proximaData = proximoMes;
        } else {
            // Para outros tipos de schedule, assumir próximo mês
            proximaData = addMonths(agora, 1);
            proximaData = setDate(proximaData, 1);
            proximaData = setHours(proximaData, parseInt(hora || '2'));
            proximaData = setMinutes(proximaData, parseInt(minuto || '0'));
            proximaData = setSeconds(proximaData, 0);
        }

        const diasAteProxima = differenceInDays(startOfDay(proximaData), startOfDay(agora));
        const dataFormatada = format(proximaData, "dd/MM/yyyy", { locale: ptBR });
        const horaFormatada = format(proximaData, "HH:mm", { locale: ptBR });
        const dataHoraCompleta = format(proximaData, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });

        return {
            proximaData,
            diasAteProxima,
            dataFormatada,
            horaFormatada,
            dataHoraCompleta
        };
    }

    /**
     * Processa a lista de destinatários de email
     */
    private processarDestinatarios(): string {
        const emailsPadrão = 'ivan.belshoff@es.senac.br';

        // Verificar se existe a variável de ambiente
        const notificationEmails = process.env.NOTIFICATION_EMAIL;

        if (!notificationEmails || notificationEmails.trim() === '') {
            console.log('📧 Usando email padrão (variável NOTIFICATION_EMAIL não configurada)');
            return emailsPadrão;
        }

        // Processar múltiplos emails separados por vírgula
        const emails = notificationEmails
            .split(',')
            .map(email => email.trim())
            .filter(email => email.length > 0 && this.validarEmail(email));

        if (emails.length === 0) {
            console.log('📧 Nenhum email válido encontrado, usando email padrão');
            return emailsPadrão;
        }

        const emailsList = emails.join(', ');
        console.log(`📧 Destinatários configurados: ${emailsList}`);
        return emailsList;
    }

    /**
     * Valida formato básico de email
     */
    private validarEmail(email: string): boolean {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    private async ensureTempDirectory(): Promise<void> {
        try {
            await fs.ensureDir(this.tempDir);
        } catch (error) {
            console.error('❌ Erro ao criar diretório temporário:', error);
        }
    }

    /**
     * Envia relatório completo do processamento por e-mail
     */
    public async enviarRelatorioCompleto(resultado: IServiceResult, modoExecucao: 'Agendado' | 'Forçado' = 'Agendado'): Promise<void> {
        console.log('📧 Iniciando envio de relatório de monitoramento...');

        try {

            // Gerar planilhas para cada serviço
            const anexo = await this.gerarPlanilha(resultado);

            // Gerar corpo do e-mail
            const corpoEmail = this.gerarCorpoEmail(resultado, modoExecucao);

            // Enviar e-mail
            await this.enviarEmail(corpoEmail, anexo, modoExecucao);

            // Limpar arquivos temporários
            await this.limparArquivosTemporarios(anexo);

            console.log('✅ Relatório de monitoramento enviado com sucesso!');

        } catch (error) {
            console.error('❌ Erro ao enviar relatório de monitoramento:', error);
            throw error;
        }
    }

    /**
     * Gera planilhas Excel para cada serviço
     */
    private async gerarPlanilha(resultado: IServiceResult): Promise<string> {

        const nomeArquivo = `relatorio_ICMS_${new Date().toISOString().split('T')[0]}.xlsx`;
        const caminhoArquivo = path.join(this.tempDir, nomeArquivo);

        // Preparar dados para a planilha
        const dadosTabela = resultado.tasks.map(task => ({
            'Mês': task.mes.toString().padStart(2, '0'),
            'Ano': task.ano,
            'Região': task.regiao,
            'Status': task.status
        }));

        // Criar workbook
        const workbook = XLSX.utils.book_new();

        // Adicionar aba com dados detalhados
        const worksheet = XLSX.utils.json_to_sheet(dadosTabela);
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Detalhes');

        // Adicionar aba com resumo
        const resumo = [{
            'Período Início': resultado.periodoInicio,
            'Período Fim': resultado.periodoFim,
            'Tempo Execução (min)': Math.round(resultado.tempoExecucao / 60),
            'Total Registros': resultado.totalRegistros,
            'Sucessos': resultado.sucessos,
            'Falhas': resultado.falhas,
            'Taxa Sucesso (%)': Math.round((resultado.sucessos / resultado.tasks.length) * 100)
        }];

        const worksheetResumo = XLSX.utils.json_to_sheet(resumo);
        XLSX.utils.book_append_sheet(workbook, worksheetResumo, 'Resumo');

        // Salvar arquivo
        XLSX.writeFile(workbook, caminhoArquivo);

        console.log(`📊 Planilha gerada: ${nomeArquivo}`);

        return caminhoArquivo;
    }

    /**
     * Gera o corpo do e-mail com resumo detalhado
     */
    private gerarCorpoEmail(resultado: IServiceResult, modoExecucao: 'Agendado' | 'Forçado' = 'Agendado'): string {

        const dataExecucao = new Date().toLocaleString('pt-BR', {
            timeZone: 'America/Sao_Paulo',
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });

        let corpoEmail = `
        <!DOCTYPE html>
        <html lang="pt-br">
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width,initial-scale=1">
            <title>Relatório de Monitoramento - ICMS</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 20px; color: #333; }
                .header { background-color: #2c3e50; color: white; padding: 20px; border-radius: 8px; text-align: center; }
                .summary { background-color: #ecf0f1; padding: 15px; margin: 20px 0; border-radius: 8px; }
                .service-section { margin: 20px 0; padding: 15px; border: 1px solid #bdc3c7; border-radius: 8px; }
                .success { color: #27ae60; font-weight: bold; }
                .error { color: #e74c3c; font-weight: bold; }
                .stats { display: inline-block; margin: 10px 15px 10px 0; }
                .footer { background-color: #34495e; color: white; padding: 15px; border-radius: 8px; text-align: center; margin-top: 30px; }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>🎯 Relatório de Monitoramento ICMS</h1>
                <p>Execução realizada em: <strong>${dataExecucao}</strong></p>
            </div>
        `;


        const taxaSucesso = Math.round((resultado.sucessos / resultado.tasks.length) * 100);
        const statusClass = taxaSucesso >= 90 ? 'success' : taxaSucesso >= 70 ? 'warning' : 'error';

        // Extrair regiões únicas dos tasks
        const regioesApuradas = [...new Set(resultado.tasks.map(task => task.regiao))].sort();

        // Calcular próxima execução
        const { dataHoraCompleta, diasAteProxima } = this.calcularProximaExecucao();
        const textoProximaExecucao = diasAteProxima === 0
            ? 'hoje'
            : diasAteProxima === 1
                ? 'amanhã'
                : `${diasAteProxima} dias`;

        corpoEmail += `
            <div class="service-section">
                <h3>📋 ICMS</h3>
                <p><strong>Período:</strong> ${resultado.periodoInicio} → ${resultado.periodoFim}</p>
                <p><strong>Tempo de Execução:</strong> ${Math.round(resultado.tempoExecucao / 60)} minutos (${resultado.tempoExecucao} segundos)</p>
                
                <p><strong>Modo de Execução:</strong> ${modoExecucao}</p>

                <p><strong>Regiões Apuradas:</strong> ${regioesApuradas.join(', ')}</p>
                
                <div class="stats">📊 <strong>Total de Registros:</strong> ${resultado.totalRegistros}</div>

                <br>
                
                <div class="stats">✅ <strong>Sucessos:</strong> ${resultado.sucessos}</div>
                <br>

                <div class="stats">❌ <strong>Falhas:</strong> ${resultado.falhas}</div>
                <br>
                
                <div class="stats ${statusClass}">🎯 <strong>Taxa de Sucesso:</strong> ${taxaSucesso}%</div>
                <br>
                
                <div class="stats">📅 <strong>Próxima Execução Agendada:</strong> ${dataHoraCompleta} (${textoProximaExecucao})</div>
            </div>
            `;


        corpoEmail += `
            <div class="footer">
                <p>🤖 <strong>Sistema de Monitoramento ICMS</strong></p>
                <p>Relatórios detalhados em anexo • Dados históricos desde ${resultado.periodoInicio}</p>
            </div>
        </body>
        </html>
        `;

        return corpoEmail;
    }

    /**
     * Envia o e-mail com anexos
     */
    private async enviarEmail(corpoEmail: string, anexo: string, modoExecucao: 'Agendado' | 'Forçado' = 'Agendado'): Promise<void> {
        console.log('📤 Enviando e-mail de relatório...');

        const transporter = nodemailer.createTransport({
            host: "smtp.office365.com",
            port: 587,
            secure: false,
            auth: {
                user: process.env.MAIL_USERNAME || "no-reply@es.senac.br",
                pass: process.env.MAIL_PASSWORD || "gHak8t%0Ad"
            },
            tls: {
                maxVersion: 'TLSv1.3',
                minVersion: 'TLSv1.2',
                ciphers: 'TLS_AES_128_GCM_SHA256',
                rejectUnauthorized: false
            },
            // Adicionar configurações específicas para Office 365
            authMethod: 'LOGIN'
        });


        // Preparar anexos (array esperado pelo nodemailer)
        const attachments = [{
            filename: path.basename(anexo),
            path: anexo
        }];

        const iconeSubject = modoExecucao === 'Agendado' ? '⏰' : '🚀';
        const subject = `${iconeSubject} Relatório ICMS ${modoExecucao} - ${new Date().toLocaleDateString('pt-BR')}`;

        // Processar destinatários
        const destinatarios = this.processarDestinatarios();

        const mailOptions = {
            from: process.env.MAIL_USERNAME,
            to: destinatarios,
            subject: subject,
            html: corpoEmail,
            attachments: attachments
        };

        return new Promise((resolve, reject) => {
            transporter.sendMail(mailOptions, (error, info) => {
                if (error) {
                    console.error('❌ Erro ao enviar e-mail:', error);
                    reject(error);
                } else {
                    console.log('✅ E-mail enviado com sucesso!');
                    console.log('📨 Message ID:', info.messageId);
                    resolve();
                }
            });
        });
    }

    /**
     * Remove arquivos temporários após envio
     */
    private async limparArquivosTemporarios(arquivo: string): Promise<void> {
        try {
            await fs.remove(arquivo);
            console.log(`🗑️ Arquivo temporário removido: ${path.basename(arquivo)}`);
        } catch (error) {
            console.warn(`⚠️ Não foi possível remover arquivo: ${arquivo}`);
        }
    }
}



export const notificationService = new NotificationService();
