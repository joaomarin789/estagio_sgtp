import type { Prioridade, Status, Tarefa, TarefaForm } from '../types';

export const statusLabels: Record<Status, string> = {
  pendente: 'Pendente',
  em_andamento: 'Em andamento',
  concluida: 'Concluída',
  bloqueada: 'Bloqueada',
};

export const prioridadeLabels: Record<Prioridade, string> = {
  baixa: 'Baixa',
  media: 'Média',
  alta: 'Alta',
  critica: 'Crítica',
};

export const pipelineColors: Record<Status, string> = {
  pendente: '#64748b',
  em_andamento: '#3b82f6',
  concluida: '#22c55e',
  bloqueada: '#ef4444',
};

export const pipelineStages = [
  { key: 'pendente' as Status, label: 'Entrada' },
  { key: 'em_andamento' as Status, label: 'Em curso' },
  { key: 'concluida' as Status, label: 'Entrega' },
  { key: 'bloqueada' as Status, label: 'Bloqueado' },
];

export function formatDate(dateStr: string): string {
  if (!dateStr) return '—';
  const date = new Date(dateStr + (dateStr.includes('T') ? '' : 'T00:00:00'));
  return date.toLocaleDateString('pt-BR');
}

export function formatDateTime(dateStr: string): string {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleString('pt-BR', {
    day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit',
  });
}

export function formatMes(mes: string): string {
  const [ano, mesNum] = mes.split('-');
  const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  return `${meses[parseInt(mesNum, 10) - 1]}/${ano.slice(2)}`;
}

export function ticketId(id: number): string {
  return `SGTP-${2800 + id}`;
}

export function initials(name: string): string {
  return name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase();
}

export function taskProgress(status: Status): number {
  const map: Record<Status, number> = {
    pendente: 15,
    em_andamento: 62,
    concluida: 100,
    bloqueada: 28,
  };
  return map[status];
}

export function slaLabel(prazo: string, status: Status): { text: string; class: string } {
  if (status === 'concluida') return { text: 'Concluída', class: 'ok' };
  if (status === 'bloqueada') return { text: 'SLA Pausado', class: 'danger' };
  const diff = Math.ceil((new Date(prazo + 'T23:59:59').getTime() - Date.now()) / 86400000);
  if (diff < 0) return { text: `${Math.abs(diff)}d atraso`, class: 'danger' };
  if (diff === 0) return { text: 'Vence hoje', class: 'warn' };
  if (diff <= 3) return { text: `SLA ${diff}d`, class: 'warn' };
  return { text: `Entrega ${formatDate(prazo)}`, class: 'ok' };
}

export function syncTime(): string {
  return new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

export const emptyForm: TarefaForm = {
  titulo: '',
  descricao: '',
  prioridade: 'media',
  status: 'pendente',
  id_responsavel: null,
  prazo: '',
  projeto_id: null,
};

export function tarefaToForm(t: Tarefa): TarefaForm {
  return {
    titulo: t.titulo,
    descricao: t.descricao || '',
    prioridade: t.prioridade,
    status: t.status,
    id_responsavel: t.id_responsavel,
    prazo: t.prazo.split('T')[0],
    projeto_id: t.projeto_id,
  };
}
