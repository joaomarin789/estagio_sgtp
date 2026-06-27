import { Pencil, Trash2 } from 'lucide-react';
import type { Tarefa } from '../../types';
import Badge from '../ui/Badge';
import {
  formatDate, initials, slaLabel, taskProgress, ticketId,
} from '../../utils/labels';

interface TaskCardProps {
  tarefa: Tarefa;
  onEdit?: (t: Tarefa) => void;
  onDelete?: (id: number) => void;
  showActions?: boolean;
}

export default function TaskCard({ tarefa: t, onEdit, onDelete, showActions }: TaskCardProps) {
  const sla = slaLabel(t.prazo, t.status);
  const progress = taskProgress(t.status);

  return (
    <div className={`task-card status-${t.status}`}>
      {showActions && (
        <div className="task-card-actions">
          {onEdit && (
            <button type="button" className="btn-icon" onClick={() => onEdit(t)} title="Editar">
              <Pencil size={14} />
            </button>
          )}
          {onDelete && (
            <button type="button" className="btn-icon danger" onClick={() => onDelete(t.id)} title="Excluir">
              <Trash2 size={14} />
            </button>
          )}
        </div>
      )}

      <div className="task-card-head">
        <span className="task-id">{ticketId(t.id)}</span>
        <span className="task-cat">{t.projeto_nome?.split(' ')[0]?.toUpperCase() || 'GERAL'}</span>
        <Badge type="status" value={t.status} />
        <Badge type="prioridade" value={t.prioridade} />
      </div>

      <div className="task-card-title">{t.titulo}</div>

      <div className="task-card-meta">
        <span>[{initials(t.responsavel)}] {t.responsavel.split(' ')[0]}</span>
        <span>·</span>
        <span>{formatDate(t.prazo)}</span>
        <span className={`sla ${sla.class}`}>{sla.text}</span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div className="progress-track" style={{ flex: 1 }}>
          <div className="progress-fill" style={{ width: `${progress}%` }} />
        </div>
        <span style={{ fontSize: 11, color: 'var(--text-muted)', minWidth: 32 }}>{progress}%</span>
      </div>
    </div>
  );
}
