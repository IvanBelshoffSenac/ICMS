import { format } from 'date-fns';
import { ICMS } from '../database/entities';

export function formatPeriodDisplay(regiao: string, mes: number, ano: number): string {
    // Criar uma data com o mês e ano especificados
    const date = new Date(ano, mes - 1, 1);
    return `${regiao} ${format(date, 'MM/yyyy')}`;
}

export const LogMessages = {
    processando: (regiao: string, mes: number, ano: number) =>
        `Processando período: ${formatPeriodDisplay(regiao, mes, ano)}`,

    sucesso: (regiao: string, mes: number, ano: number) =>
        `✅ Período ${formatPeriodDisplay(regiao, mes, ano)} processado com sucesso`,

    erro: (regiao: string, mes: number, ano: number, error: any) =>
        `✗ Erro no período ${formatPeriodDisplay(regiao, mes, ano)}: ${error}`,

    teste: (regiao: string, mes: number, ano: number) =>
        `📊 Testando  ${formatPeriodDisplay(regiao, mes, ano)}`
};

/**
 * Calcula tempo de execução em segundos
 * @param startTime Timestamp de início
 * @param endTime Timestamp de fim
 * @returns Tempo em segundos arredondado
 */
export function calculateExecutionTime(startTime: number, endTime: number): number {
    return Math.round((endTime - startTime) / 1000);
}

/**
 * Calcula estatísticas de sucesso e falha de tasks
 * @param tasks Array de tasks
 * @returns Objeto com sucessos e falhas
 */
export function calculateTaskStats(tasks: Array<{ status: 'Sucesso' | 'Falha' }>): { sucessos: number; falhas: number } {
    const sucessos = tasks.filter(t => t.status === 'Sucesso').length;
    const falhas = tasks.filter(t => t.status === 'Falha').length;
    return { sucessos, falhas };
}

/**
 * Extrai o range de períodos do array de dados ICMS
 */
export const extractServicePeriodRange = (icmsData: ICMS[]): { periodoInicio: string, periodoFim: string } => {
    if (icmsData.length === 0) {
        const currentDate = new Date();
        const currentPeriod = format(currentDate, 'MM/yyyy');
        return { periodoInicio: currentPeriod, periodoFim: currentPeriod };
    }

    // Ordenar por período para pegar início e fim
    const periodos = icmsData.map(item => item.periodo).sort();

    return {
        periodoInicio: format(new Date(parseInt(periodos[0].substring(0,4)), parseInt(periodos[0].substring(4,6)) - 1, 1), 'MM/yyyy'),
        periodoFim: format(new Date(parseInt(periodos[periodos.length - 1].substring(0,4)), parseInt(periodos[periodos.length - 1].substring(4,6)) - 1, 1), 'MM/yyyy')
    };
}

/**
 * Utilitários de parsing
 */
export const parseNumber = (value: any): number => {
    if (value === null || value === undefined || value === '') return 0;
    const num = Number(value);
    return isNaN(num) ? 0 : num;
}

export const parseString = (value: any): string => {
    return value ? String(value).trim() : '';
}

export const parseDecimal = (value: any): number | null => {
    if (value === null || value === undefined || value === '') return null;
    const num = Number(value);
    return isNaN(num) ? null : num;
}