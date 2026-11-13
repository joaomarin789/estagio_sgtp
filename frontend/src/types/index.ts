export type Prioridade = 'baixa' | 'media' | 'alta' | 'critica';
export type Status = 'pendente' | 'em_andamento' | 'concluida' | 'bloqueada';

export interface Tarefa {
  id: number;
  titulo: string;
  descricao: string | null;
  prioridade: Prioridade;
  status: Status;
  /** Motivo do impedimento; so tem valor enquanto o status e 'bloqueada'. */
  motivo_bloqueio?: string | null;
  /** Nome do responsavel; null quando a tarefa nao tem responsavel. */
  responsavel: string | null;
  id_responsavel: number | null;
  prazo: string;
  projeto_id: number | null;
  projeto_nome?: string;
  created_at?: string;
}

/**
 * Dados editaveis da tarefa. O status nao faz parte do formulario:
 * ele so muda pelo UC03 (PATCH /tarefas/:id/status).
 */
export interface TarefaForm {
  titulo: string;
  descricao: string;
  prioridade: Prioridade;
  id_responsavel: number | null;
  prazo: string;
  projeto_id: number | null;
}

/** Projeto resumido — usado no dropdown de projeto do modal de Tarefa. */
export interface ProjetoResumo {
  id: number;
  nome: string;
}

export interface Usuario {
  id_usuario: number;
  nome: string;
  perfil?: string;
}

export type StatusProjeto =
  | 'nao_iniciado'
  | 'em_andamento'
  | 'pausado'
  | 'concluido'
  | 'cancelado';

export type PrioridadeProjeto = 'baixa' | 'media' | 'alta' | 'urgente';

export interface Projeto {
  id: number;
  nome: string;
  descricao: string | null;
  status: StatusProjeto;
  prioridade: PrioridadeProjeto;
  id_responsavel: number;
  responsavel_nome: string | null;
  data_inicio: string;
  data_termino_prevista: string | null;
  total_tarefas: number;
  created_at?: string;
}

export interface ProjetoForm {
  nome: string;
  descricao: string;
  status: StatusProjeto;
  prioridade: PrioridadeProjeto;
  id_responsavel: number | null;
  data_inicio: string;
  data_termino_prevista: string;
}

export interface DashboardStats {
  total_tarefas: number;
  tarefas_concluidas: number;
  tarefas_bloqueadas: number;
  tarefas_em_andamento: number;
  tarefas_pendentes: number;
  projetos_ativos: number;
  /** Media de dias entre criacao e conclusao; null se nao ha tarefa concluida. */
  lead_time_medio: number | null;
  entregas_criticas: EntregaCritica[];
  pipeline: PipelineItem[];
  capacidade_equipe: CapacidadeItem[];
  atividades_recentes: Atividade[];
}

export interface EntregaCritica {
  id: number;
  titulo: string;
  responsavel: string | null;
  prazo: string;
  prioridade: Prioridade;
  projeto_nome: string | null;
}

export interface PipelineItem {
  status: Status;
  quantidade: number;
}

export interface CapacidadeItem {
  responsavel: string;
  total: number;
  em_andamento: number;
  concluidas: number;
}

export interface Atividade {
  id: number;
  tarefa_id: number | null;
  acao: string;
  descricao: string;
  usuario: string;
  tarefa_titulo?: string;
  created_at: string;
}

export interface RelatoriosData {
  indicadores: {
    total_tarefas: number;
    concluidas: number;
    bloqueadas: number;
    em_andamento: number;
    atrasadas: number;
    taxa_conclusao: number;
    lead_time_medio: number;
    sla_percentual: number;
    eficiencia_operacional: number;
  };
  eficiencia_mensal: { mes: string; criadas: number; concluidas: number }[];
  por_prioridade: { prioridade: Prioridade; quantidade: number; concluidas: number }[];
  por_responsavel: { responsavel: string; total: number; concluidas: number; taxa: number }[];
}
