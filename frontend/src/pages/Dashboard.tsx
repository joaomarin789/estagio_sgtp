import { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { tarefaService } from '../services/api';
import type { DashboardStats, Tarefa } from '../types';
import TaskCard from '../components/ui/TaskCard';
import {
  formatDate, formatDateTime, syncTime, pipelineStages,
} from '../utils/labels';

export default function Dashboard() {
  const [data, setData] = useState<DashboardStats | null>(null);
  const [movimento, setMovimento] = useState<Tarefa[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([
      tarefaService.dashboard(),
      tarefaService.listar({ status: 'em_andamento' }),
    ])
      .then(([dash, tasks]) => {
        setData(dash);
        setMovimento(tasks.slice(0, 5));
      })
      .catch(() => setError('Não foi possível carregar o painel. Verifique backend e MySQL.'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading-state">Carregando cockpit operacional...</div>;
  if (error) return <div className="error-banner">{error}</div>;
  if (!data) return null;

  const ativas = Number(data.tarefas_em_andamento) + Number(data.tarefas_pendentes);
  const capacidadePct = data.capacidade_equipe.length
    ? Math.round(data.capacidade_equipe.reduce((s, c) => s + Number(c.em_andamento), 0) / data.capacidade_equipe.length / 3 * 100)
    : 0;
  const slaCritico = data.entregas_criticas.length;
  const pipelineMap = Object.fromEntries(data.pipeline.map((p) => [p.status, p.quantidade]));
  const bloqueadas = Number(data.tarefas_bloqueadas);

  const getPipelineCount = (key: string) => {
    if (key === 'pendente') return Number(pipelineMap.pendente || 0);
    if (key === 'em_andamento') return Number(pipelineMap.em_andamento || 0);
    if (key === 'concluida') return Number(pipelineMap.concluida || 0);
    return Number(pipelineMap.bloqueada || 0);
  };

  const maxPipeline = Math.max(...pipelineStages.map((s) => getPipelineCount(s.key)), 1);

  return (
    <>
      <div className="cockpit-header">
        <div>
          <h1>Olá, João Pedro — Cockpit operacional</h1>
          <div className="cockpit-meta">
            <span className="pill yellow">{slaCritico} vencem em breve</span>
            <span className="pill red">{bloqueadas} bloqueada{bloqueadas !== 1 ? 's' : ''}</span>
            <span className="pill green"><span className="pill-dot" /> Sync ERP · {syncTime()}</span>
            <span className="pill">v1.0.0 · prod</span>
          </div>
        </div>
        <Link to="/tarefas" className="btn btn-primary"><Plus size={15} /> Tarefa</Link>
      </div>

      <div className="kpi-strip">
        <div className="kpi-box">
          <label>Ativas</label>
          <div className="val">{ativas}</div>
          <div className="sub">+{Number(data.tarefas_em_andamento)} em curso</div>
        </div>
        <div className="kpi-box">
          <label>Projetos</label>
          <div className="val">{data.projetos_ativos}</div>
          <div className="sub">{bloqueadas > 0 ? `${bloqueadas} risco` : 'Em execução'}</div>
        </div>
        <div className="kpi-box danger">
          <label>Bloqueadas</label>
          <div className="val">{bloqueadas}</div>
          <div className="sub">Requer ação</div>
        </div>
        <div className="kpi-box">
          <label>Concluídas</label>
          <div className="val ok">{data.tarefas_concluidas}</div>
          <div className="sub">{Math.round(Number(data.tarefas_concluidas) / Number(data.total_tarefas) * 100)}% taxa</div>
        </div>
        <div className="kpi-box warn">
          <label>SLA Crítico</label>
          <div className="val">{slaCritico}</div>
          <div className="sub">Próx. 14 dias</div>
        </div>
        <div className="kpi-box">
          <label>Capacidade</label>
          <div className="val">{Math.min(capacidadePct, 100)}%</div>
          <div className="sub">{data.capacidade_equipe.length} colaboradores</div>
        </div>
      </div>

      <div className="grid-main-side">
        <div>
          <div className="card" style={{ marginBottom: 12 }}>
            <div className="card-head">
              <h3>Pipeline · Tempo real</h3>
              <span>{data.total_tarefas} itens</span>
            </div>
            <div className="card-body">
              <div className="pipeline-flow">
                {pipelineStages.map((stage) => {
                  const count = getPipelineCount(stage.key);
                  return (
                    <div key={stage.key} className="pipeline-stage">
                      <div className="pipeline-stage-bar">
                        <div className="pipeline-stage-fill" style={{ width: `${(count / maxPipeline) * 100}%` }} />
                      </div>
                      <label>{stage.label}</label>
                      <strong>{count}</strong>
                    </div>
                  );
                })}
              </div>
              <div className="pipeline-meta">
                <span><em>{bloqueadas}</em> bloqueado{bloqueadas !== 1 ? 's' : ''}</span>
                <span><em>{Number(data.tarefas_pendentes)}</em> pendentes</span>
                <span>Lead time médio: <em>2,4d</em></span>
              </div>
            </div>
          </div>

          <div className="grid-2">
            <div className="card">
              <div className="card-head">
                <h3>Gargalos · Risco</h3>
              </div>
              <div className="card-body">
                <div className="kpi-box danger" style={{ marginBottom: 8, border: 'none', padding: '8px 0' }}>
                  <div className="val" style={{ fontSize: 18 }}>{bloqueadas + slaCritico}</div>
                  <div className="sub">Itens em risco operacional</div>
                </div>
                {data.entregas_criticas.slice(0, 2).map((e) => (
                  <div key={e.id} style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 6 }}>
                    · {e.titulo}
                  </div>
                ))}
              </div>
            </div>

            <div className="card">
              <div className="card-head">
                <h3>Sprint · Capacidade</h3>
                <span>{Math.min(capacidadePct, 100)}%</span>
              </div>
              <div className="card-body">
                <div className="progress-track" style={{ height: 8, marginBottom: 8 }}>
                  <div className="progress-fill" style={{ width: `${Math.min(capacidadePct, 100)}%` }} />
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                  {data.tarefas_em_andamento} tarefas em andamento · {data.total_tarefas} total
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-head">
              <h3>Entregas críticas</h3>
              <span>Próximos 14 dias</span>
            </div>
            <ul className="critical-list card-body flush">
              {data.entregas_criticas.length === 0 ? (
                <li className="critical-item"><span>Nenhuma entrega crítica no período</span></li>
              ) : (
                data.entregas_criticas.map((e) => (
                  <li key={e.id} className="critical-item">
                    <div>
                      <strong>{e.titulo}</strong>
                      <span>{e.responsavel} · {e.projeto_nome || 'Sem projeto'}</span>
                    </div>
                    <span className={`timer ${e.prioridade === 'critica' ? 'danger' : ''}`}>
                      {formatDate(e.prazo)}
                    </span>
                  </li>
                ))
              )}
            </ul>
          </div>

          <div className="card" style={{ marginTop: 12 }}>
            <div className="card-head"><h3>Log operacional</h3></div>
            <ul className="activity-log card-body">
              {data.atividades_recentes.map((a) => {
                const cls = a.acao === 'Bloqueio' ? 'danger' : a.acao === 'Conclusão' ? 'ok' : '';
                return (
                  <li key={a.id}>
                    <span className="time">{formatDateTime(a.created_at).slice(11, 16)}</span>
                    <span className={`evt ${cls}`}>
                      <strong>{a.acao}</strong> — {a.descricao}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>

        <div>
          <div className="team-flow-header">
            <h3>Em movimento · Fluxo da equipe</h3>
            <span className="pill blue">{movimento.length} ativas</span>
          </div>
          {movimento.length === 0 ? (
            <div className="empty-state">Nenhuma tarefa em andamento</div>
          ) : (
            movimento.map((t) => <TaskCard key={t.id} tarefa={t} />)
          )}

          <div className="card" style={{ marginTop: 12 }}>
            <div className="card-head"><h3>Capacidade</h3></div>
            <div className="card-body">
              {data.capacidade_equipe.map((c) => {
                const pct = c.total > 0 ? Math.round(Number(c.em_andamento) / Number(c.total) * 100) : 0;
                return (
                  <div key={c.responsavel} className="capacity-row">
                    <div className="capacity-row-head">
                      <strong>{c.responsavel.split(' ')[0]}</strong>
                      <span>{c.em_andamento}/{c.total} · {c.concluidas} ok</span>
                    </div>
                    <div className="progress-track">
                      <div className="progress-fill" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
