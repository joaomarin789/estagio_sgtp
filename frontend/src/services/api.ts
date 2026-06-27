import axios from 'axios';
import type { DashboardStats, Projeto, ProjetoPortfolio, RelatoriosData, Tarefa, TarefaForm } from '../types';

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
    api.get<Projeto[]>('/tarefas/projetos').then((r) => r.data),

  portfolioProjetos: () =>
    api.get<ProjetoPortfolio[]>('/tarefas/portfolio/projetos').then((r) => r.data),
};

export default api;
