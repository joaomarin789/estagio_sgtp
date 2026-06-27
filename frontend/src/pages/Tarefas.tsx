import { useCallback, useEffect, useState } from 'react';
import { Plus, X } from 'lucide-react';
import { tarefaService } from '../services/api';
import type { Projeto, Tarefa, TarefaForm } from '../types';
import TaskCard from '../components/ui/TaskCard';
import TarefaModal from '../components/ui/TarefaModal';
import { emptyForm, syncTime, tarefaToForm } from '../utils/labels';

const statusChips = [
  { val: '', label: 'Todos' },
  { val: 'pendente', label: 'Pendente' },
  { val: 'em_andamento', label: 'Em curso' },
  { val: 'concluida', label: 'Concluída' },
  { val: 'bloqueada', label: 'Bloqueada' },
];

const prioChips = ['', 'critica', 'alta', 'media', 'baixa'];

export default function Tarefas() {
  const [tarefas, setTarefas] = useState<Tarefa[]>([]);
  const [projetos, setProjetos] = useState<Projeto[]>([]);
  const [atividades, setAtividades] = useState<{ id: number; descricao: string; created_at: string; acao: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<TarefaForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);
  const [view, setView] = useState<'timeline' | 'pipeline'>('timeline');

  const [filtros, setFiltros] = useState({ busca: '', status: '', prioridade: '' });

  const carregar = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params: Record<string, string> = {};
      if (filtros.busca) params.busca = filtros.busca;
      if (filtros.status) params.status = filtros.status;
      if (filtros.prioridade) params.prioridade = filtros.prioridade;

      const [tarefasData, projetosData, dash] = await Promise.all([
        tarefaService.listar(params),
        tarefaService.projetos(),
        tarefaService.dashboard(),
      ]);
      setTarefas(tarefasData);
      setProjetos(projetosData);
      setAtividades(dash.atividades_recentes);
    } catch {
      setError('Erro ao carregar tarefas.');
    } finally {
      setLoading(false);
    }
  }, [filtros]);

  useEffect(() => { carregar(); }, [carregar]);

  const abrirCriar = () => { setEditingId(null); setForm(emptyForm); setModalOpen(true); };
  const abrirEditar = (t: Tarefa) => { setEditingId(t.id); setForm(tarefaToForm(t)); setModalOpen(true); };

  const salvar = async () => {
    if (!form.titulo || !form.responsavel || !form.prazo) {
      setError('Preencha título, responsável e prazo.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      if (editingId) await tarefaService.atualizar(editingId, form);
      else await tarefaService.criar(form);
      setModalOpen(false);
      carregar();
    } catch {
      setError('Erro ao salvar tarefa.');
    } finally {
      setSaving(false);
    }
  };

  const excluir = async (id: number) => {
    try {
      await tarefaService.excluir(id);
      setDeleteConfirm(null);
      carregar();
    } catch {
      setError('Erro ao excluir tarefa.');
    }
  };

  const bloqueadas = tarefas.filter((t) => t.status === 'bloqueada').length;
  const criticas = tarefas.filter((t) => t.prioridade === 'critica' || t.prioridade === 'alta').length;
  const pendentes = tarefas.filter((t) => t.status === 'pendente').slice(0, 3);

  return (
    <>
      <div className="cockpit-header">
        <div>
          <h1>Central de tarefas · fluxo operacional</h1>
          <div className="cockpit-meta">
            <span className="pill">{tarefas.length} tickets</span>
            <span className="pill blue">{tarefas.filter((t) => t.status === 'em_andamento').length} em tempo real</span>
            {bloqueadas > 0 && <span className="pill red">{bloqueadas} bloqueada{bloqueadas !== 1 ? 's' : ''}</span>}
            <span className="pill green"><span className="pill-dot" /> Sync · {syncTime()}</span>
          </div>
        </div>
        <button type="button" className="btn btn-primary" onClick={abrirCriar}>
          <Plus size={15} /> Ticket
        </button>
      </div>

      {error && <div className="error-banner">{error}</div>}

      <div className="tasks-layout">
        <aside className="tasks-sidebar">
          <h4>Filtros operacionais</h4>
          <input
            className="search-input"
            placeholder="Ticket, título, responsável..."
            value={filtros.busca}
            onChange={(e) => setFiltros({ ...filtros, busca: e.target.value })}
          />

          <div className="chip-group">
            {statusChips.map((c) => (
              <button
                key={c.val}
                type="button"
                className={`chip ${filtros.status === c.val ? 'active' : ''}`}
                onClick={() => setFiltros({ ...filtros, status: c.val })}
              >
                {c.label}
              </button>
            ))}
          </div>

          <div className="chip-group" style={{ marginTop: 8 }}>
            {prioChips.map((p) => (
              <button
                key={p || 'all'}
                type="button"
                className={`chip ${filtros.prioridade === p ? 'active' : ''}`}
                onClick={() => setFiltros({ ...filtros, prioridade: p })}
              >
                {p ? p.charAt(0).toUpperCase() + p.slice(1) : 'Prioridade'}
              </button>
            ))}
          </div>

          <div className="view-toggle">
            <button type="button" className={view === 'timeline' ? 'active' : ''} onClick={() => setView('timeline')}>Timeline</button>
            <button type="button" className={view === 'pipeline' ? 'active' : ''} onClick={() => setView('pipeline')}>Pipeline</button>
          </div>

          {pendentes.length > 0 && (
            <div className="approval-queue">
              <h4>Fila pendente</h4>
              {pendentes.map((t) => (
                <div key={t.id} className="mini-task">
                  <strong>SGTP-{2800 + t.id}</strong>
                  {t.titulo.slice(0, 40)}
                </div>
              ))}
            </div>
          )}

          <div className="approval-queue">
            <h4>Atividade recente</h4>
            <ul className="activity-log">
              {atividades.slice(0, 5).map((a) => (
                <li key={a.id}>
                  <span className="time">{a.created_at?.slice(11, 16)}</span>
                  <span className="evt"><strong>{a.acao}</strong></span>
                </li>
              ))}
            </ul>
          </div>
        </aside>

        <div>
          <div className="team-flow-header">
            <div>
              <div className="section-label">Timeline conectada</div>
              <h3 style={{ fontSize: 14, fontWeight: 600 }}>Backlog operacional</h3>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <span className="pill red">Alta: {criticas}</span>
              <span className="pill yellow">SLA crítico: {bloqueadas}</span>
            </div>
          </div>

          {loading ? (
            <div className="loading-state">Carregando...</div>
          ) : tarefas.length === 0 ? (
            <div className="empty-state">Nenhuma tarefa encontrada</div>
          ) : view === 'timeline' ? (
            tarefas.map((t) => (
              <TaskCard
                key={t.id}
                tarefa={t}
                showActions
                onEdit={abrirEditar}
                onDelete={setDeleteConfirm}
              />
            ))
          ) : (
            <div className="card">
              <div className="card-body flush">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Ticket</th>
                      <th>Título</th>
                      <th>Status</th>
                      <th>Prioridade</th>
                      <th>Responsável</th>
                      <th>Prazo</th>
                      <th>Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tarefas.map((t) => (
                      <tr key={t.id}>
                        <td className="code-cell">SGTP-{2800 + t.id}</td>
                        <td><strong>{t.titulo}</strong></td>
                        <td>{t.status.replace('_', ' ')}</td>
                        <td>{t.prioridade}</td>
                        <td>{t.responsavel}</td>
                        <td>{t.prazo.split('T')[0]}</td>
                        <td>
                          <button type="button" className="btn-icon" onClick={() => abrirEditar(t)}>✎</button>
                          <button type="button" className="btn-icon danger" onClick={() => setDeleteConfirm(t.id)}>✕</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      <TarefaModal
        open={modalOpen}
        editing={!!editingId}
        form={form}
        projetos={projetos}
        saving={saving}
        onClose={() => setModalOpen(false)}
        onSave={salvar}
        onChange={(field, value) => setForm((prev) => ({ ...prev, [field]: value }))}
      />

      {deleteConfirm !== null && (
        <div className="modal-overlay" onClick={() => setDeleteConfirm(null)}>
          <div className="modal" style={{ maxWidth: 400 }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <h2>Confirmar exclusão</h2>
              <button type="button" className="btn-icon" onClick={() => setDeleteConfirm(null)}><X size={18} /></button>
            </div>
            <div className="modal-body">
              <p style={{ color: 'var(--text-secondary)', fontSize: 13 }}>
                Excluir esta tarefa? Ação irreversível.
              </p>
            </div>
            <div className="modal-foot">
              <button type="button" className="btn btn-ghost" onClick={() => setDeleteConfirm(null)}>Cancelar</button>
              <button type="button" className="btn btn-danger" onClick={() => excluir(deleteConfirm)}>Excluir</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
