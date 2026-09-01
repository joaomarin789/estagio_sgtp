import { X } from 'lucide-react';
import type { PrioridadeProjeto, ProjetoForm, StatusProjeto, Usuario } from '../../types';

interface ProjetoModalProps {
  open: boolean;
  editing: boolean;
  form: ProjetoForm;
  usuarios: Usuario[];
  saving: boolean;
  onClose: () => void;
  onSave: () => void;
  onChange: (field: keyof ProjetoForm, value: string | number | null) => void;
}

export default function ProjetoModal({
  open, editing, form, usuarios, saving, onClose, onSave, onChange,
}: ProjetoModalProps) {
  if (!open) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <h2>{editing ? 'Editar Projeto' : 'Novo Projeto'}</h2>
          <button type="button" className="btn-icon" onClick={onClose}><X size={18} /></button>
        </div>
        <div className="modal-body">
          <div className="form-grid">
            <div className="form-group full">
              <label>Nome</label>
              <input value={form.nome} onChange={(e) => onChange('nome', e.target.value)} />
            </div>
            <div className="form-group full">
              <label>Descrição</label>
              <textarea value={form.descricao} onChange={(e) => onChange('descricao', e.target.value)} />
            </div>
            <div className="form-group">
              <label>Data de início</label>
              <input
                type="date"
                value={form.data_inicio}
                onChange={(e) => onChange('data_inicio', e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Término previsto</label>
              <input
                type="date"
                value={form.data_termino_prevista}
                onChange={(e) => onChange('data_termino_prevista', e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Status</label>
              <select
                value={form.status}
                onChange={(e) => onChange('status', e.target.value as StatusProjeto)}
              >
                <option value="nao_iniciado">Não iniciado</option>
                <option value="em_andamento">Em andamento</option>
                <option value="pausado">Pausado</option>
                <option value="concluido">Concluído</option>
                <option value="cancelado">Cancelado</option>
              </select>
            </div>
            <div className="form-group">
              <label>Prioridade</label>
              <select
                value={form.prioridade}
                onChange={(e) => onChange('prioridade', e.target.value as PrioridadeProjeto)}
              >
                <option value="baixa">Baixa</option>
                <option value="media">Média</option>
                <option value="alta">Alta</option>
                <option value="urgente">Urgente</option>
              </select>
            </div>
            <div className="form-group full">
              <label>Responsável</label>
              <select
                value={form.id_responsavel ?? ''}
                onChange={(e) => onChange('id_responsavel', e.target.value ? Number(e.target.value) : null)}
              >
                <option value="">Selecione...</option>
                {usuarios.map((u) => (
                  <option key={u.id_usuario} value={u.id_usuario}>{u.nome}</option>
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
