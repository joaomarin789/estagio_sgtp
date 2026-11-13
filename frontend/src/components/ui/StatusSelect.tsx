import type { Status } from '../../types';
import { statusLabels, transicoesStatus } from '../../utils/labels';

interface StatusSelectProps {
  status: Status;
  disabled?: boolean;
  onChange: (novoStatus: Status) => void;
}

/**
 * UC03 - Atualizar Andamento da Tarefa.
 * Mostra apenas os proximos estados permitidos pelo Diagrama de Estados.
 * Em CONCLUIDA (estado final) nao ha transicoes, entao nada e exibido.
 */
export default function StatusSelect({ status, disabled, onChange }: StatusSelectProps) {
  const proximos = transicoesStatus[status];
  if (proximos.length === 0) return null;

  return (
    <select
      className="status-select"
      value=""
      disabled={disabled}
      title="Atualizar andamento"
      onChange={(e) => {
        if (e.target.value) onChange(e.target.value as Status);
      }}
    >
      <option value="">Mover para...</option>
      {proximos.map((s) => (
        <option key={s} value={s}>{statusLabels[s]}</option>
      ))}
    </select>
  );
}
