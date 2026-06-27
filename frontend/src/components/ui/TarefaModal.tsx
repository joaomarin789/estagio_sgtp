import { X } from 'lucide-react';
import type { Prioridade, Projeto, Status, TarefaForm } from '../../types';

interface TarefaModalProps {
  open: boolean;
  editing: boolean;
  form: TarefaForm;
  projetos: Projeto[];
  saving: boolean;
  onClose: () => void;
  onSave: () => void;
  onChange: (field: keyof TarefaForm, value: string | number | null) => void;
}

export default function TarefaModal({
  open, editing, form, projetos, saving, onClose, onSave, onChange,
}: TarefaModalProps) {
  if (!open) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <h2>{editing ? 'Editar Tarefa' : 'Nova Tarefa'}</h2>
          <button type="button" className="btn-icon" onClick={onClose}><X size={18} /></button>
        </div>
        <div className="modal-body">
          <div className="form-grid">
            <div className="form-group full">
              <label>Título</label>
              <input value={form.titulo} onChange={(e) => onChange('titulo', e.target.value)} />
            </div>
            <div className="form-group full">
              <label>Descrição</label>
              <textarea value={form.descricao} onChange={(e) => onChange('descricao', e.target.value)} />
            </div>
            <div className="form-group">
              <label>Prioridade</label>
              <select value={form.prioridade} onChange={(e) => onChange('prioridade', e.target.value as Prioridade)}>
                <option value="baixa">Baixa</option>
                <option value="media">Média</option>
                <option value="alta">Alta</option>
                <option value="critica">Crítica</option>
              </select>
            </div>
            <div className="form-group">
              <label>Status</label>
              <select value={form.status} onChange={(e) => onChange('status', e.target.value as Status)}>
                <option value="pendente">Pendente</option>
                <option value="em_andamento">Em andamento</option>
                <option value="concluida">Concluída</option>
                <option value="bloqueada">Bloqueada</option>
              </select>
            </div>
            <div className="form-group">
              <label>Responsável</label>
              <input value={form.responsavel} onChange={(e) => onChange('responsavel', e.target.value)} />
            </div>
            <div className="form-group">
              <label>Prazo</label>
              <input type="date" value={form.prazo} onChange={(e) => onChange('prazo', e.target.value)} />
            </div>
            <div className="form-group full">
              <label>Projeto</label>
              <select
                value={form.projeto_id ?? ''}
                onChange={(e) => onChange('projeto_id', e.target.value ? Number(e.target.value) : null)}
              >
                <option value="">Sem projeto</option>
                {projetos.map((p) => (
                  <option key={p.id} value={p.id}>{p.nome}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
        <div className="modal-foot">
          <button type="button" className="btn btn-ghost" onClick={onClose}>Cancelar</button>
          <button type="button" className="btn btn-primary" onClick={onSave} disabled={saving}>
            {saving ? 'Salvando...' : editing ? 'Atualizar' : 'Cadastrar'}
          </button>
        </div>
      </div>
    </div>
  );
}
