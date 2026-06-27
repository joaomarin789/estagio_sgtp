import { useEffect, useState } from 'react';
import { tarefaService } from '../services/api';
import type { ProjetoPortfolio } from '../types';
import { formatDate, syncTime } from '../utils/labels';

const statusLabel: Record<string, string> = {
  ativo: 'Em execução',
  pausado: 'Em risco',
  concluido: 'Entrega',
  cancelado: 'Cancelado',
};

const statusClass: Record<string, string> = {
  ativo: 'blue',
  pausado: 'yellow',
  concluido: 'green',
  cancelado: '',
};

export default function Projetos() {
  const [projetos, setProjetos] = useState<ProjetoPortfolio[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busca, setBusca] = useState('');
  const [filtro, setFiltro] = useState('todos');

  useEffect(() => {
    tarefaService.portfolioProjetos()
      .then(setProjetos)
      .catch(() => setError('Erro ao carregar portfólio de projetos.'))
      .finally(() => setLoading(false));
  }, []);

  const filtrados = projetos.filter((p) => {
    const matchBusca = !busca || p.nome.toLowerCase().includes(busca.toLowerCase()) || p.responsavel.toLowerCase().includes(busca.toLowerCase());
    const matchFiltro =
      filtro === 'todos' ||
      (filtro === 'execucao' && p.status === 'ativo') ||
      (filtro === 'risco' && (p.status === 'pausado' || Number(p.tarefas_risco) > 0)) ||
      (filtro === 'entrega' && p.status === 'concluido');
    return matchBusca && matchFiltro;
  });

  const ativos = projetos.filter((p) => p.status === 'ativo').length;
  const criticos = projetos.filter((p) => Number(p.tarefas_risco) > 0 || p.status === 'pausado').length;

  if (loading) return <div className="loading-state">Carregando portfólio...</div>;

  return (
    <>
      <div className="cockpit-header">
        <div>
          <h1>Portfólio de projetos · visão operacional</h1>
          <div className="cockpit-meta">
            <span className="pill">{ativos} projetos ativos</span>
            {criticos > 0 && <span className="pill yellow">{criticos} críticos</span>}
            <span className="pill green"><span className="pill-dot" /> Sync · {syncTime()}</span>
          </div>
        </div>
      </div>

      {error && <div className="error-banner">{error}</div>}

      <div className="card" style={{ marginBottom: 14 }}>
        <div className="card-head">
          <h3>Pipeline · Tempo real</h3>
          <span>{projetos.reduce((s, p) => s + Number(p.total_tarefas), 0)} tarefas vinculadas</span>
        </div>
        <div className="card-body">
          <div className="pipeline-flow">
            {[
              { label: 'Ativos', val: ativos },
              { label: 'Em risco', val: criticos },
              { label: 'Pausados', val: projetos.filter((p) => p.status === 'pausado').length },
              { label: 'Concluídos', val: projetos.filter((p) => p.status === 'concluido').length },
            ].map((s) => (
              <div key={s.label} className="pipeline-stage">
                <div className="pipeline-stage-bar">
                  <div className="pipeline-stage-fill" style={{ width: `${(s.val / Math.max(projetos.length, 1)) * 100}%` }} />
                </div>
                <label>{s.label}</label>
                <strong>{s.val}</strong>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="filter-bar">
        <input
          className="search-input"
          placeholder="Buscar projeto ou responsável..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
        />
        {[
          { k: 'todos', l: 'Todos' },
          { k: 'execucao', l: 'Em execução' },
          { k: 'risco', l: 'Em risco' },
          { k: 'entrega', l: 'Entrega' },
        ].map((f) => (
          <button
            key={f.k}
            type="button"
            className={`chip ${filtro === f.k ? 'active' : ''}`}
            onClick={() => setFiltro(f.k)}
          >
            {f.l}
          </button>
        ))}
      </div>

      <div className="card">
        <div className="card-body flush">
          <table className="data-table">
            <thead>
              <tr>
                <th>Código</th>
                <th>Projeto / Pipeline</th>
                <th>Status</th>
                <th>Risco</th>
                <th>SLA</th>
                <th>Squad</th>
                <th>Cap.</th>
              </tr>
            </thead>
            <tbody>
              {filtrados.map((p) => {
                const pct = p.total_tarefas > 0
                  ? Math.round(Number(p.tarefas_concluidas) / Number(p.total_tarefas) * 100)
                  : 0;
                const cap = Math.min(48 + pct / 2 + Number(p.tarefas_risco) * 8, 98);
                const risco = Number(p.tarefas_risco) > 1 ? 'Alto' : Number(p.tarefas_risco) === 1 ? 'Moderado' : 'Baixo';
                return (
                  <tr key={p.id}>
                    <td className="code-cell">PRJ-{String(p.id).padStart(3, '0')}</td>
                    <td>
                      <strong>{p.nome}</strong>
                      <div className="proj-progress" style={{ marginTop: 6 }}>
                        <div className="progress-track">
                          <div className="progress-fill" style={{ width: `${pct}%` }} />
                        </div>
                        <span>{pct}%</span>
                      </div>
                      {Number(p.tarefas_bloqueadas) > 0 && (
                        <div style={{ fontSize: 11, color: 'var(--yellow)', marginTop: 4 }}>
                          {p.tarefas_bloqueadas} bloqueada(s)
                        </div>
                      )}
                    </td>
                    <td>
                      <span className={`pill ${statusClass[p.status] || ''}`} style={{ fontSize: 10 }}>
                        {statusLabel[p.status]}
                      </span>
                    </td>
                    <td style={{ color: risco === 'Alto' ? 'var(--red)' : risco === 'Moderado' ? 'var(--yellow)' : 'var(--text-muted)' }}>
                      {risco}
                    </td>
                    <td style={{ color: p.data_fim ? 'var(--text-secondary)' : 'var(--text-muted)' }}>
                      {p.data_fim ? formatDate(p.data_fim) : '—'}
                    </td>
                    <td>{p.responsavel.split(' ')[0]}</td>
                    <td>{Math.round(cap)}%</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
