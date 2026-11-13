import axios from 'axios';
import type {
  DashboardStats,
  Projeto,
  ProjetoForm,
  ProjetoResumo,
  RelatoriosData,
  Status,
  Tarefa,
  TarefaForm,
  Usuario,
} from '../types';

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
});

// "Usuario atual": o sistema nao tem login, entao o usuario escolhido no
// seletor do topo da tela fica guardado no navegador e segue em toda
// requisicao no cabecalho X-Usuario-Id (lido pelo backend em identificar).
const CHAVE_USUARIO = 'sgtp_usuario_atual';

export function getUsuarioAtualId(): number | null {
  const valor = Number(localStorage.getItem(CHAVE_USUARIO));
  return Number.isInteger(valor) && valor > 0 ? valor : null;
}

export function setUsuarioAtualId(id: number) {
  localStorage.setItem(CHAVE_USUARIO, String(id));
}

api.interceptors.request.use((config) => {
  const id = getUsuarioAtualId();
  if (id) config.headers['X-Usuario-Id'] = String(id);
  return config;
});

/** Extrai a mensagem { erro } enviada pelo backend, ou usa o texto padrao. */
export function mensagemErro(err: unknown, fallback: string): string {
  if (typeof err === 'object' && err !== null && 'response' in err) {
    const resp = (err as { response?: { data?: { erro?: string } } }).response;
    if (resp?.data?.erro) return resp.data.erro;
  }
  return fallback;
}

export const tarefaService = {
  listar: (params?: Record<string, string>) =>
    api.get<Tarefa[]>('/tarefas', { params }).then((r) => r.data),

  buscar: (id: number) =>
    api.get<Tarefa>(`/tarefas/${id}`).then((r) => r.data),

  criar: (data: TarefaForm) =>
    api.post<Tarefa>('/tarefas', data).then((r) => r.data),

  atualizar: (id: number, data: TarefaForm) =>
    api.put<Tarefa>(`/tarefas/${id}`, data).then((r) => r.data),

  // UC03 - Atualizar Andamento da Tarefa
  // O motivo so e enviado (e exigido pelo backend) quando o status e 'bloqueada'.
  atualizarStatus: (id: number, status: Status, motivo?: string) =>
    api.patch<Tarefa>(`/tarefas/${id}/status`, { status, motivo }).then((r) => r.data),

  excluir: (id: number) =>
    api.delete(`/tarefas/${id}`).then((r) => r.data),

  restaurar: (id: number) =>
    api.patch<Tarefa>(`/tarefas/${id}/restaurar`).then((r) => r.data),

  relatorios: () =>
    api.get<RelatoriosData>('/tarefas/relatorios').then((r) => r.data),

  projetos: () =>
    api.get<ProjetoResumo[]>('/tarefas/projetos').then((r) => r.data),
};

export const projetoService = {
  listar: (params?: Record<string, string>) =>
    api.get<Projeto[]>('/projetos', { params }).then((r) => r.data),

  buscar: (id: number) =>
    api.get<Projeto>(`/projetos/${id}`).then((r) => r.data),

  criar: (data: ProjetoForm) =>
    api.post<Projeto>('/projetos', data).then((r) => r.data),

  atualizar: (id: number, data: ProjetoForm) =>
    api.put<Projeto>(`/projetos/${id}`, data).then((r) => r.data),

  excluir: (id: number) =>
    api.delete<{ mensagem: string }>(`/projetos/${id}`).then((r) => r.data),

  // Sequencia 01, mensagem 4.1: tarefas ativas do projeto, para a confirmacao da exclusao.
  contarTarefasVinculadas: (id: number) =>
    api.get<{ total: number }>(`/projetos/${id}/tarefas-vinculadas`).then((r) => r.data.total),

  restaurar: (id: number) =>
    api.patch<Projeto>(`/projetos/${id}/restaurar`).then((r) => r.data),
};

// UC04 - Visualizar Fluxo Operacional (DashboardController no backend)
export const dashboardService = {
  indicadores: () =>
    api.get<DashboardStats>('/dashboard').then((r) => r.data),

  // Detalha um indicador: lista as tarefas ativas de um status.
  tarefasPorStatus: (status: Status) =>
    api.get<Tarefa[]>('/dashboard/tarefas', { params: { status } }).then((r) => r.data),
};

export const usuarioService = {
  listar: () => api.get<Usuario[]>('/usuarios').then((r) => r.data),
};

export default api;
