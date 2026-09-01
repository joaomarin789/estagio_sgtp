import axios from 'axios';
import type {
  DashboardStats,
  Projeto,
  ProjetoForm,
  ProjetoResumo,
  RelatoriosData,
  Tarefa,
  TarefaForm,
  Usuario,
} from '../types';

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
});

export const tarefaService = {
  listar: (params?: Record<string, string>) =>
    api.get<Tarefa[]>('/tarefas', { params }).then((r) => r.data),

  buscar: (id: number) =>
    api.get<Tarefa>(`/tarefas/${id}`).then((r) => r.data),

  criar: (data: TarefaForm) =>
    api.post<Tarefa>('/tarefas', data).then((r) => r.data),

  atualizar: (id: number, data: TarefaForm) =>
    api.put<Tarefa>(`/tarefas/${id}`, data).then((r) => r.data),

  excluir: (id: number) =>
    api.delete(`/tarefas/${id}`).then((r) => r.data),

  dashboard: () =>
    api.get<DashboardStats>('/tarefas/dashboard').then((r) => r.data),

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
    api.delete<{ mensagem: string; tarefas_afetadas: number }>(`/projetos/${id}`).then((r) => r.data),
};

export const usuarioService = {
  listar: () => api.get<Usuario[]>('/usuarios').then((r) => r.data),
};

export default api;
