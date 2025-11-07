export interface ITask {
    mes: number;
    ano: number;
    regiao: string;
    status: 'Sucesso' | 'Falha';
}

export interface IServiceResult {
    periodoInicio: string;
    periodoFim: string;
    tempoExecucao: number; // em segundos
    tasks: ITask[];
    totalRegistros: number;
    sucessos: number;
    falhas: number;
    modoExecucao?: 'Agendado' | 'Forçado';
}