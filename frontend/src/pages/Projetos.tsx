import { useCallback, useEffect, useState } from 'react';
import { Plus, X, Pencil, RotateCcw, Trash2 } from 'lucide-react';
import { mensagemErro, projetoService, usuarioService } from '../services/api';
import type { Projeto, ProjetoForm, Usuario } from '../types';
import ProjetoModal from '../components/ui/ProjetoModal';
import {
  emptyProjetoForm, formatDate, prioridadeProjetoLabels, projetoToForm,
  statusProjetoLabels, syncTime,
} from '../utils/labels';

const statusChips = [
  { val: '', label: 'Todos' },
  { val: 'nao_iniciado', label: 'Não iniciado' },
  { val: 'em_andamento', label: 'Em andamento' },
  { val: 'pausado', label: 'Pausado' },
  { val: 'concluido', label: 'Concluído' },
  { val: 'cancelado', label: 'Cancelado' },
];

const prioChips = [
  { val: '', label: 'Prioridade' },
  { val: 'urgente', label: 'Urgente' },
  { val: 'alta', label: 'Alta' },
  { val: 'media', label: 'Média' },
  { val: 'baixa', label: 'Baixa' },
];

const statusPill: Record<string, string> = {
  nao_iniciado: '',
  em_andamento: 'blue',
  pausado: 'yellow',
  concluido: 'green',
  cancelado: 'red',
};

export default function Projetos() {
  const [projetos, setProjetos] = useState<Projeto[]>([]);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [aviso, setAviso] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<ProjetoForm>(emptyProjetoForm);
  const [saving, setSaving] = useState(false);
  // Projeto aguardando confirmacao de exclusao e a quantidade de tarefas vinculadas.
  const [deleteConfirm, setDeleteConfirm] = useState<{ projeto: Projeto; totalTarefas: number } | null>(null);

  // inativos = listar os projetos excluidos, para restauracao (UC01 3.4).
  const [filtros, setFiltros] = useState({ busca: '', status: '', prioridade: '', inativos: false });

  const carregar = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params: Record<string, string> = {};
      if (filtros.busca) params.busca = filtros.busca;
      if (filtros.status) params.status = filtros.status;
      if (filtros.prioridade) params.prioridade = filtros.prioridade;
      if (filtros.inativos) params.inativos = '1';

      const [projetosData, usuariosData] = await Promise.all([
        projetoService.listar(params),
        usuarioService.listar(),
      ]);
      setProjetos(projetosData);
      setUsuarios(usuariosData);
    } catch {
      setError('Erro ao carregar projetos.');
    } finally {
      setLoading(false);
    }
  }, [filtros]);

  useEffect(() => { carregar(); }, [carregar]);

  const abrirCriar = () => {
    setEditingId(null);
    setForm(emptyProjetoForm);
    setError('');
    setModalOpen(true);
  };

  const abrirEditar = (p: Projeto) => {
    setEditingId(p.id);
    setForm(projetoToForm(p));
    setError('');
    setModalOpen(true);
  };

  const salvar = async () => {
    if (!form.nome || !form.data_inicio || !form.id_responsavel) {
      setError('Preencha nome, data de início e responsável.');
      return;
    }
    if (form.data_termino_prevista && form.data_termino_prevista < form.data_inicio) {
      setError('A data de término prevista não pode ser anterior à data de início.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      if (editingId) await projetoService.atualizar(editingId, form);
      else await projetoService.criar(form);
      setModalOpen(false);
      carregar();
    } catch (err) {
      setError(mensagemErro(err, 'Erro ao salvar projeto.'));
    } finally {
      setSaving(false);
    }
  };

  // Sequencia 01, mensagem 4: ao clicar em excluir, consulta quantas tarefas
  // estao vinculadas ao projeto para informar na confirmacao.
  const solicitarExclusao = async (projeto: Projeto) => {
    setError('');
    try {
      const totalTarefas = await projetoService.contarTarefasVinculadas(projeto.id);
      setDeleteConfirm({ projeto, totalTarefas });
    } catch (err) {
      setError(mensagemErro(err, 'Erro ao consultar as tarefas do projeto.'));
    }
  };

  // Sequencia 01, mensagem 5: exclusao confirmada pelo usuario.
  const excluir = async () => {
    if (!deleteConfirm) return;
    const { projeto, totalTarefas } = deleteConfirm;
    // Fecha o modal antes: o aviso e o erro aparecem na pagina, atras dele.
    setDeleteConfirm(null);
    try {
      await projetoService.excluir(projeto.id);
      setAviso(
        totalTarefas > 0
          ? `Projeto excluído. ${totalTarefas} tarefa(s) vinculada(s) foram ocultadas junto com ele.`
          : 'Projeto excluído com sucesso.'
      );
      carregar();
    } catch (err) {
      setError(mensagemErro(err, 'Erro ao excluir projeto.'));
    }
  };

  // UC01 3.4 - Restaurar Projetos. As tarefas do projeto voltam a aparecer junto com ele.
  const restaurar = async (projeto: Projeto) => {
    setError('');
    try {
      await projetoService.restaurar(projeto.id);
      setAviso(`Projeto "${projeto.nome}" restaurado.`);
      carregar();
    } catch (err) {
      setError(mensagemErro(err, 'Erro ao restaurar projeto.'));
    }
  };

  const porStatus = (s: string) => projetos.filter((p) => p.status === s).length;

  return (
    <>
      <div className="cockpit-header">
        <div>
          <h1>Gerenciar projetos · portfólio operacional</h1>
          <div className="cockpit-meta">
            <span className="pill">{projetos.length} projetos</span>
            <span className="pill blue">{porStatus('em_andamento')} em andamento</span>
            {porStatus('pausado') > 0 && (
              <span className="pill yellow">{porStatus('pausado')} pausado(s)</span>
            )}
            <span className="pill green"><span className="pill-dot" /> Sync · {syncTime()}</span>
          </div>
        </div>
        <button type="button" className="btn btn-primary" onClick={abrirCriar}>
          <Plus size={15} /> Projeto
        </button>
      </div>

      {error && <div className="error-banner">{error}</div>}
      {aviso && (
        <div
          className="error-banner"
          style={{ background: 'var(--green-dim)', color: 'var(--green)', borderColor: 'rgba(34,197,94,0.25)' }}
        >
          {aviso}
        </div>
      )}

      <div className="tasks-layout">
        <aside className="tasks-sidebar">
          <h4>Filtros</h4>
          <input
            className="search-input"
            placeholder="Nome, descrição, responsável..."
            value={filtros.busca}
            onChange={(e) => setFiltros({ ...filtros, busca: e.target.value })}
          />

          <div className="chip-group">
            {statusChips.map((c) => (
              <button
                key={c.val || 'all'}
                type="button"
                className={`chip ${filtros.status === c.val ? 'active' : ''}`}
                onClick={() => setFiltros({ ...filtros, status: c.val })}
              >
                {c.label}
              </button>
            ))}
          </div>

          <div className="chip-group" style={{ marginTop: 8 }}>
            {prioChips.map((c) => (
              <button
                key={c.val || 'all'}
                type="button"
                className={`chip ${filtros.prioridade === c.val ? 'active' : ''}`}
                onClick={() => setFiltros({ ...filtros, prioridade: c.val })}
              >
                {c.label}
              </button>
            ))}
          </div>

          <div className="chip-group" style={{ marginTop: 8 }}>
            <button
              type="button"
              className={`chip ${filtros.inativos ? 'active' : ''}`}
              onClick={() => setFiltros({ ...filtros, inativos: !filtros.inativos })}
            >
              Inativos (excluídos)
            </button>
          </div>
        </aside>

        <div>
          <div className="team-flow-header">
            <div>
              <div className="section-label">Portfólio</div>
              <h3 style={{ fontSize: 14, fontWeight: 600 }}>
                {filtros.inativos ? 'Projetos excluídos' : 'Projetos cadastrados'}
              </h3>
            </div>
          </div>

          {loading ? (
            <div className="loading-state">Carregando...</div>
          ) : projetos.length === 0 ? (
            <div className="empty-state">Nenhum projeto encontrado</div>
          ) : (
            <div className="card">
              <div className="card-body flush">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Código</th>
                      <th>Projeto</th>
                      <th>Status</th>
                      <th>Prioridade</th>
                      <th>Responsável</th>
                      <th>Início</th>
                      <th>Término previsto</th>
                      <th>Tarefas</th>
                      <th>Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {projetos.map((p) => (
                      <tr key={p.id}>
                        <td className="code-cell">PRJ-{String(p.id).padStart(3, '0')}</td>
                        <td><strong>{p.nome}</strong></td>
                        <td>
                          <span className={`pill ${statusPill[p.status] || ''}`} style={{ fontSize: 10 }}>
                            {statusProjetoLabels[p.status]}
                          </span>
                        </td>
                        <td>{prioridadeProjetoLabels[p.prioridade]}</td>
                        <td>{p.responsavel_nome ?? '—'}</td>
                        <td>{formatDate(p.data_inicio)}</td>
                        <td>{p.data_termino_prevista ? formatDate(p.data_termino_prevista) : '—'}</td>
                        <td>{p.total_tarefas}</td>
                        <td>
                          {filtros.inativos ? (
                            <button type="button" className="btn-icon" onClick={() => restaurar(p)} title="Restaurar">
                              <RotateCcw size={14} />
                            </button>
                          ) : (
                            <>
                              <button type="button" className="btn-icon" onClick={() => abrirEditar(p)} title="Editar">
                                <Pencil size={14} />
                              </button>
                              <button type="button" className="btn-icon danger" onClick={() => solicitarExclusao(p)} title="Excluir">
                                <Trash2 size={14} />
                              </button>
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

      <ProjetoModal
        open={modalOpen}
        editing={!!editingId}
        form={form}
        usuarios={usuarios}
        saving={saving}
        onClose={() => setModalOpen(false)}
        onSave={salvar}
        onChange={(field, value) => setForm((prev) => ({ ...prev, [field]: value }))}
      />

      {deleteConfirm !== null && (
        <div className="modal-overlay" onClick={() => setDeleteConfirm(null)}>
          <div className="modal" style={{ maxWidth: 420 }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <h2>Confirmar exclusão</h2>
              <button type="button" className="btn-icon" onClick={() => setDeleteConfirm(null)}><X size={18} /></button>
            </div>
            <div className="modal-body">
              <p style={{ color: 'var(--text-secondary)', fontSize: 13 }}>
                {deleteConfirm.totalTarefas > 0 ? (
                  <>
                    Este projeto possui <strong>{deleteConfirm.totalTarefas} tarefa(s) vinculada(s)</strong>, que
                    deixarão de aparecer junto com ele. Confirma a exclusão de{' '}
                    <strong>{deleteConfirm.projeto.nome}</strong>?
                  </>
                ) : (
                  <>Excluir o projeto <strong>{deleteConfirm.projeto.nome}</strong>?</>
                )}
                {' '}Os dados são mantidos e o projeto pode ser restaurado.
              </p>
            </div>
            <div className="modal-foot">
              <button type="button" className="btn btn-ghost" onClick={() => setDeleteConfirm(null)}>Cancelar</button>
              <button type="button" className="btn btn-danger" onClick={excluir}>Excluir</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
