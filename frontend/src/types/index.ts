export type Prioridade = 'baixa' | 'media' | 'alta' | 'critica';
export type Status = 'pendente' | 'em_andamento' | 'concluida' | 'bloqueada';

export interface Tarefa {
  id: number;
  titulo: string;
  descricao: string | null;
  prioridade: Prioridade;
  status: Status;
  responsavel: string;
  id_responsavel: number | null;
  prazo: string;
  projeto_id: number | null;
  projeto_nome?: string;
  created_at?: string;
}

export interface TarefaForm {
  titulo: string;
  descricao: string;
  prioridade: Prioridade;
  status: Status;
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

export interface ProjetoPortfolio {
  id: number;
  nome: string;
  descricao: string | null;
  status: 'ativo' | 'pausado' | 'concluido' | 'cancelado';
  responsavel: string;
  data_inicio: string;
  data_fim: string | null;
  total_tarefas: number;
  tarefas_concluidas: number;
  tarefas_bloqueadas: number;
  tarefas_risco: number;
}

export interface DashboardStats {
  total_tarefas: number;
  tarefas_concluidas: number;
  tarefas_bloqueadas: number;
  tarefas_em_andamento: number;
  tarefas_pendentes: number;
  projetos_ativos: number;
  entregas_criticas: EntregaCritica[];
  pipeline: PipelineItem[];
  capacidade_equipe: CapacidadeItem[];
  atividades_recentes: Atividade[];
  produtividade: ProdutividadeItem[];
}

export interface EntregaCritica {
  id: number;
  titulo: string;
  responsavel: string;
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

export interface ProdutividadeItem {
  mes: string;
  concluidas: number;
  total: number;
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
