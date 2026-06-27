export type Prioridade = 'baixa' | 'media' | 'alta' | 'critica';
export type Status = 'pendente' | 'em_andamento' | 'concluida' | 'bloqueada';

export interface Tarefa {
  id: number;
  titulo: string;
  descricao: string | null;
  prioridade: Prioridade;
  status: Status;
  responsavel: string;
  prazo: string;
  projeto_id: number | null;
  projeto_nome?: string;
  created_at?: string;
  updated_at?: string;
}

export interface TarefaForm {
  titulo: string;
  descricao: string;
  prioridade: Prioridade;
  status: Status;
  responsavel: string;
  prazo: string;
  projeto_id: number | null;
}

export interface Projeto {
  id: number;
  nome: string;
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
