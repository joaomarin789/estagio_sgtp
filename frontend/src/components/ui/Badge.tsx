interface BadgeProps {
  type: 'status' | 'prioridade';
  value: string;
}

const labels: Record<string, string> = {
  pendente: 'Pendente',
  em_andamento: 'Em andamento',
  concluida: 'Concluída',
  bloqueada: 'Bloqueada',
  baixa: 'Baixa',
  media: 'Média',
  alta: 'Alta',
  critica: 'Crítica',
};

export default function Badge({ type, value }: BadgeProps) {
  const cls = type === 'status'
    ? `badge badge-${value === 'em_andamento' ? 'em-andamento' : value}`
    : `badge badge-${value}`;
  return <span className={cls}>{labels[value] || value}</span>;
}
