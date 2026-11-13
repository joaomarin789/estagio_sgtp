import { useCallback, useEffect, useState } from 'react';
import { Plus, X } from 'lucide-react';
import { dashboardService, mensagemErro, tarefaService, usuarioService } from '../services/api';
import type { ProjetoResumo, Status, Tarefa, TarefaForm, Usuario } from '../types';
import TaskCard from '../components/ui/TaskCard';
import TarefaModal from '../components/ui/TarefaModal';
import StatusSelect from '../components/ui/StatusSelect';
import { emptyForm, statusLabels, syncTime, tarefaToForm } from '../utils/labels';

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
  const [projetos, setProjetos] = useState<ProjetoResumo[]>([]);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [atividades, setAtividades] = useState<{ id: number; descricao: string; created_at: string; acao: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<TarefaForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);
  const [view, setView] = useState<'timeline' | 'pipeline'>('timeline');

  // UC03 3.1 - Bloquear Tarefa: tarefa aguardando o motivo do impedimento.
  const [bloqueio, setBloqueio] = useState<{ tarefa: Tarefa; motivo: string } | null>(null);

  // inativos = listar as tarefas excluidas, para restauracao (UC02 3.4).
  const [filtros, setFiltros] = useState({ busca: '', status: '', prioridade: '', id_projeto: '', inativos: false });

  const carregar = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params: Record<string, string> = {};
      if (filtros.busca) params.busca = filtros.busca;
      if (filtros.status) params.status = filtros.status;
      if (filtros.prioridade) params.prioridade = filtros.prioridade;
      if (filtros.id_projeto) params.id_projeto = filtros.id_projeto;
      if (filtros.inativos) params.inativos = '1';

      const [tarefasData, projetosData, usuariosData, dash] = await Promise.all([
        tarefaService.listar(params),
        tarefaService.projetos(),
        usuarioService.listar(),
        dashboardService.indicadores(),
      ]);
      setTarefas(tarefasData);
      setProjetos(projetosData);
      setUsuarios(usuariosData);
      setAtividades(dash.atividades_recentes);
    } catch {
      setError('Erro ao carregar tarefas.');
    } finally {
      setLoading(false);
    }
  }, [filtros]);

  useEffect(() => { carregar(); }, [carregar]);

  const abrirCriar = () => { setEditingId(null); setForm(emptyForm); setError(''); setModalOpen(true); };
  const abrirEditar = (t: Tarefa) => { setEditingId(t.id); setForm(tarefaToForm(t)); setError(''); setModalOpen(true); };

  const salvar = async () => {
    // O responsavel e opcional (UC02): a tarefa pode ser cadastrada sem ele.
    if (!form.titulo || !form.prazo || !form.projeto_id) {
      setError('Preencha título, prazo e projeto.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      if (editingId) await tarefaService.atualizar(editingId, form);
      else await tarefaService.criar(form);
      setModalOpen(false);
      carregar();
    } catch (err) {
      setError(mensagemErro(err, 'Erro ao salvar tarefa.'));
    } finally {
      setSaving(false);
    }
  };

  // UC03 - Atualizar Andamento da Tarefa
  const enviarStatus = async (t: Tarefa, novoStatus: Status, motivo?: string) => {
    setError('');
    try {
      await tarefaService.atualizarStatus(t.id, novoStatus, motivo);
      setBloqueio(null);
      carregar();
    } catch (err) {
      // Inclui o 403 quando o usuario atual nao e o responsavel pela tarefa.
      setError(mensagemErro(err, 'Erro ao atualizar o status da tarefa.'));
    }
  };

  // Bloquear exige o motivo: abre o modal em vez de enviar direto.
  const mudarStatus = (t: Tarefa, novoStatus: Status) => {
    if (novoStatus === 'bloqueada') {
      setError('');
      setBloqueio({ tarefa: t, motivo: '' });
      return;
    }
    enviarStatus(t, novoStatus);
  };

  const confirmarBloqueio = () => {
    if (!bloqueio) return;
    const motivo = bloqueio.motivo.trim();
    if (!motivo) {
      setError('Informe o motivo do impedimento.');
      return;
    }
    enviarStatus(bloqueio.tarefa, 'bloqueada', motivo);
  };

  const fecharBloqueio = () => {
    setBloqueio(null);
    setError('');
  };

  // UC02 3.4 - Restaurar Tarefas
  const restaurar = async (id: number) => {
    setError('');
    try {
      await tarefaService.restaurar(id);
      carregar();
    } catch (err) {
      setError(mensagemErro(err, 'Erro ao restaurar tarefa.'));
    }
  };

  const excluir = async (id: number) => {
    try {
      await tarefaService.excluir(id);
      setDeleteConfirm(null);
      carregar();
    } catch (err) {
      setError(mensagemErro(err, 'Erro ao excluir tarefa.'));
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

          <select
            className="search-input"
            style={{ marginTop: 8 }}
            value={filtros.id_projeto}
            onChange={(e) => setFiltros({ ...filtros, id_projeto: e.target.value })}
          >
            <option value="">Todos os projetos</option>
            {projetos.map((p) => (
              <option key={p.id} value={p.id}>{p.nome}</option>
            ))}
          </select>

          <div className="chip-group" style={{ marginTop: 8 }}>
            <button
              type="button"
              className={`chip ${filtros.inativos ? 'active' : ''}`}
              onClick={() => setFiltros({ ...filtros, inativos: !filtros.inativos })}
            >
              Inativas (excluídas)
            </button>
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
              <h3 style={{ fontSize: 14, fontWeight: 600 }}>
                {filtros.inativos ? 'Tarefas excluídas' : 'Backlog operacional'}
              </h3>
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
              // Tarefa excluida so pode ser restaurada; as demais acoes ficam ocultas.
              filtros.inativos ? (
                <TaskCard key={t.id} tarefa={t} showActions onRestore={restaurar} />
              ) : (
                <TaskCard
                  key={t.id}
                  tarefa={t}
                  showActions
                  onEdit={abrirEditar}
                  onDelete={setDeleteConfirm}
                  onStatusChange={mudarStatus}
                />
              )
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
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            {statusLabels[t.status]}
                            {!filtros.inativos && (
                              <StatusSelect status={t.status} onChange={(novo) => mudarStatus(t, novo)} />
                            )}
                          </div>
                        </td>
                        <td>{t.prioridade}</td>
                        <td>{t.responsavel || 'Sem responsável'}</td>
                        <td>{t.prazo.split('T')[0]}</td>
                        <td>
                          {filtros.inativos ? (
                            <button type="button" className="btn-icon" onClick={() => restaurar(t.id)} title="Restaurar">↺</button>
                          ) : (
                            <>
                              <button type="button" className="btn-icon" onClick={() => abrirEditar(t)}>✎</button>
                              <button type="button" className="btn-icon danger" onClick={() => setDeleteConfirm(t.id)}>✕</button>
                            </>
                          )}
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
        usuarios={usuarios}
        saving={saving}
        error={error}
        onClose={() => setModalOpen(false)}
        onSave={salvar}
        onChange={(field, value) => setForm((prev) => ({ ...prev, [field]: value }))}
      />

      {bloqueio !== null && (
        <div className="modal-overlay" onClick={fecharBloqueio}>
          <div className="modal" style={{ maxWidth: 440 }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <h2>Bloquear tarefa</h2>
              <button type="button" className="btn-icon" onClick={fecharBloqueio}><X size={18} /></button>
            </div>
            <div className="modal-body">
              {error && <div className="error-banner">{error}</div>}
              <div className="form-group full">
                <label>Motivo do impedimento de "{bloqueio.tarefa.titulo}"</label>
                <textarea
                  autoFocus
                  value={bloqueio.motivo}
                  onChange={(e) => setBloqueio({ ...bloqueio, motivo: e.target.value })}
                />
              </div>
            </div>
            <div className="modal-foot">
              <button type="button" className="btn btn-ghost" onClick={fecharBloqueio}>Cancelar</button>
              <button type="button" className="btn btn-danger" onClick={confirmarBloqueio}>Bloquear</button>
            </div>
          </div>
        </div>
      )}

      {deleteConfirm !== null && (
        <div className="modal-overlay" onClick={() => setDeleteConfirm(null)}>
          <div className="modal" style={{ maxWidth: 400 }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <h2>Confirmar exclusão</h2>
              <button type="button" className="btn-icon" onClick={() => setDeleteConfirm(null)}><X size={18} /></button>
            </div>
            <div className="modal-body">
              <p style={{ color: 'var(--text-secondary)', fontSize: 13 }}>
                Excluir esta tarefa? Ela deixará de aparecer nas listagens, mas o registro e o
                histórico são mantidos e ela pode ser restaurada.
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
