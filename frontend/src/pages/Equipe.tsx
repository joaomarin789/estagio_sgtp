import { useEffect, useState } from 'react';
import { tarefaService } from '../services/api';
import type { RelatoriosData } from '../types';
import { initials, syncTime } from '../utils/labels';

export default function Equipe() {
  const [data, setData] = useState<RelatoriosData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    tarefaService.relatorios()
      .then(setData)
      .catch(() => setError('Erro ao carregar dados da equipe.'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading-state">Carregando equipe...</div>;
  if (error) return <div className="error-banner">{error}</div>;
  if (!data) return null;

  return (
    <>
      <div className="cockpit-header">
        <div>
          <h1>Equipe · capacidade operacional</h1>
          <div className="cockpit-meta">
            <span className="pill">{data.por_responsavel.length} colaboradores</span>
            <span className="pill green"><span className="pill-dot" /> Sync · {syncTime()}</span>
          </div>
        </div>
      </div>

      <div className="kpi-strip" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
        <div className="kpi-box">
          <label>Taxa média</label>
          <div className="val">{data.indicadores.taxa_conclusao}%</div>
        </div>
        <div className="kpi-box">
          <label>Em andamento</label>
          <div className="val">{data.indicadores.em_andamento}</div>
        </div>
        <div className="kpi-box warn">
          <label>Atrasadas</label>
          <div className="val">{data.indicadores.atrasadas}</div>
        </div>
        <div className="kpi-box ok">
          <label>Eficiência</label>
          <div className="val">{data.indicadores.eficiencia_operacional}%</div>
        </div>
      </div>

      <div className="grid-2">
        {data.por_responsavel.map((r) => (
          <div key={r.responsavel} className="card">
            <div className="card-body">
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                <div className="sidebar-user-avatar">{initials(r.responsavel)}</div>
                <div>
                  <strong style={{ fontSize: 14 }}>{r.responsavel}</strong>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                    {r.total} tarefas · {r.concluidas} concluídas
                  </div>
                </div>
                <div style={{ marginLeft: 'auto', fontSize: 20, fontWeight: 700, color: Number(r.taxa) >= 70 ? 'var(--green)' : 'var(--yellow)' }}>
                  {r.taxa}%
                </div>
              </div>
              <div className="progress-track" style={{ height: 6 }}>
                <div
                  className="progress-fill"
                  style={{
                    width: `${r.taxa}%`,
                    background: Number(r.taxa) >= 70 ? 'var(--green)' : Number(r.taxa) >= 40 ? 'var(--yellow)' : 'var(--red)',
                  }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
