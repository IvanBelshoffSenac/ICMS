import * as cron from 'node-cron';
import * as dotenv from 'dotenv';
import { NotificationService, IcmsService } from '../services';
import { IServiceResult } from '../shared/interfaces';

// Configurar dotenv
dotenv.config();

export class TaskOrchestrator {
    private isRunning: boolean = false;
    private notificationService = new NotificationService();

    constructor() {
        console.log('🎯 Orquestrador de Tarefas inicializado');
        console.log('📅 Agendamentos serão configurados dinamicamente via variáveis de ambiente');
        console.log('   • Configure SCHEDULE_ICMS no .env');
        console.log('   • Relatório: Enviado automaticamente após cada execução\n');
    }

    /**
     * Executa processamento individual do ICMS com monitoramento
     */
    private async runIcmsWithMonitoring(): Promise<IServiceResult> {
        try {
            console.log('📊 [CRON] Iniciando ICMS com monitoramento...');
            const icmsService = new IcmsService();
            const resultado = await icmsService.processAllIcmsDataWithMonitoring();
            console.log('✅ [CRON] ICMS concluído\n');
            return resultado;
        } catch (error) {
            console.error('❌ [CRON] Erro no processamento ICMS:', error);
            throw error;
        }
    }

    /**
     * Executa todos os serviços em sequência (modo forçado - COM monitoramento e notificação)
     */
    public async runAllServicesNow(): Promise<void> {
        if (this.isRunning) {
            console.log('⚠️  Processamento já em execução, aguarde a conclusão...');
            return;
        }

        console.log('🚀 === INICIANDO PROCESSAMENTO FORÇADO COM MONITORAMENTO ===\n');

        const startTime = Date.now();
        this.isRunning = true;

        try {

            const icmsResult = await this.runIcmsWithMonitoring();

            const endTime = Date.now();

            const duration = Math.round((endTime - startTime) / 1000 / 60);

            console.log('🎉 === PROCESSAMENTO COMPLETO FINALIZADO ===');
            console.log(`⏱️  Tempo total: ${duration} minutos`);
            console.log('📊 Índices habilitados foram processados e salvos no banco de dados');

            await this.notificationService.enviarRelatorioCompleto(icmsResult, 'Forçado');

        } catch (error) {

            console.error('❌ Erro durante o processamento completo:', error);

            throw error;

        } finally {

            this.isRunning = false;

        }
    }

    /**
     * Inicia o orquestrador com agendamentos CRON (com monitoramento)
     */
    public startScheduler(): void {

        // Configurações de agendamento das variáveis de ambiente ou valores padrão
        const scheduleIcms = process.env.SCHEDULE_ICMS || '0 2 1 * *';

        console.log('⚡ Configurações de agendamento:');
        console.log(`   • ICMS: ${scheduleIcms} ${process.env.SCHEDULE_ICMS ? '(customizado)' : '(padrão)'}`);

        console.log('');

        cron.schedule(scheduleIcms, async () => {
            await this.runIcmsWithMonitoring();
        }, {
            timezone: "America/Sao_Paulo"
        });
        console.log('📅 ICMS agendado');

        console.log('\n⚡ Orquestrador ativo com monitoramento - aguardando próximas execuções...');
        console.log('🔄 Para forçar execução com monitoramento: npm run force-monitored');
        console.log('🔄 Para forçar execução sem monitoramento: npm run force\n');
    }
}
