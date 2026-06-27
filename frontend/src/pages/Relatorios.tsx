import { useEffect, useState } from 'react';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell,
} from 'recharts';
import { tarefaService } from '../services/api';
import type { RelatoriosData } from '../types';
import { formatMes, prioridadeLabels, syncTime } from '../utils/labels';

const PIE_COLORS = ['#ef4444', '#f97316', '#3b82f6', '#64748b'];

const chartStyle = {
  fontSize: 11,
  borderRadius: 6,
  border: '1px solid rgba(255,255,255,0.08)',
  background: '#141b24',
  color: '#e8edf4',
};

export default function Relatorios() {
  const [data, setData] = useState<RelatoriosData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    tarefaService.relatorios()
      .then(setData)
      .catch(() => setError('Erro ao carregar relatórios.'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading-state">Carregando relatórios...</div>;
  if (error) return <div className="error-banner">{error}</div>;
  if (!data) return null;

  const ind = data.indicadores;

  const eficienciaChart = data.eficiencia_mensal.map((e) => ({
    mes: formatMes(e.mes),
    criadas: Number(e.criadas),
    concluidas: Number(e.concluidas),
  }));

  const prioridadeChart = data.por_prioridade.map((p) => ({
    name: prioridadeLabels[p.prioridade],
    value: Number(p.quantidade),
  }));

  return (
    <>
      <div className="cockpit-header">
        <div>
          <h1>Relatórios operacionais</h1>
          <div className="cockpit-meta">
            <span className="pill">Indicadores de performance</span>
            <span className="pill green"><span className="pill-dot" /> Sync · {syncTime()}</span>
          </div>
        </div>
      </div>

      <div className="kpi-strip">
        <div className="kpi-box ok">
          <label>Taxa de conclusão</label>
          <div className="val">{ind.taxa_conclusao}%</div>
        </div>
        <div className="kpi-box">
          <label>Lead time médio</label>
          <div className="val">{ind.lead_time_medio}<span style={{ fontSize: 14 }}>d</span></div>
        </div>
        <div className="kpi-box">
          <label>SLA</label>
          <div className="val">{ind.sla_percentual ?? 0}%</div>
        </div>
        <div className="kpi-box warn">
          <label>Eficiência operacional</label>
          <div className="val">{ind.eficiencia_operacional}%</div>
        </div>
        <div className="kpi-box">
          <label>Em andamento</label>
          <div className="val">{ind.em_andamento}</div>
        </div>
        <div className="kpi-box danger">
          <label>Atrasadas</label>
          <div className="val">{ind.atrasadas}</div>
        </div>
      </div>

      <div className="grid-2">
        <div className="card">
          <div className="card-head">
            <h3>Eficiência mensal</h3>
            <span>Criadas vs concluídas</span>
          </div>
          <div className="card-body">
            <div className="chart-wrap lg">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={eficienciaChart}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="mes" tick={{ fontSize: 11, fill: '#64748b' }} stroke="#334155" />
                  <YAxis tick={{ fontSize: 11, fill: '#64748b' }} stroke="#334155" />
                  <Tooltip contentStyle={chartStyle} />
                  <Legend wrapperStyle={{ fontSize: 11, color: '#94a3b8' }} />
                  <Line type="monotone" dataKey="criadas" name="Criadas" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="concluidas" name="Concluídas" stroke="#22c55e" strokeWidth={2} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-head"><h3>Por prioridade</h3></div>
          <div className="card-body">
            <div className="chart-wrap lg">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={prioridadeChart}
                    cx="50%" cy="50%"
                    innerRadius={50} outerRadius={80}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    {prioridadeChart.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={chartStyle} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 12 }}>
        <div className="card-head">
          <h3>Produtividade por responsável</h3>
        </div>
        <div className="card-body">
          <div className="chart-wrap">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={data.por_responsavel.map((r) => ({
                  nome: r.responsavel.split(' ')[0],
                  concluidas: Number(r.concluidas),
                  total: Number(r.total),
                }))}
                layout="vertical"
              >
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis type="number" tick={{ fontSize: 11, fill: '#64748b' }} stroke="#334155" />
                <YAxis type="category" dataKey="nome" tick={{ fontSize: 11, fill: '#64748b' }} stroke="#334155" width={80} />
                <Tooltip contentStyle={chartStyle} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="concluidas" name="Concluídas" fill="#22c55e" radius={[0, 3, 3, 0]} />
                <Bar dataKey="total" name="Total" fill="#3b82f6" radius={[0, 3, 3, 0]} opacity={0.5} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-head"><h3>Detalhamento por colaborador</h3></div>
        <div className="card-body flush">
          <table className="data-table">
            <thead>
              <tr>
                <th>Responsável</th>
                <th>Total</th>
                <th>Concluídas</th>
                <th>Taxa</th>
                <th>Performance</th>
              </tr>
            </thead>
            <tbody>
              {data.por_responsavel.map((r) => (
                <tr key={r.responsavel}>
                  <td><strong>{r.responsavel}</strong></td>
                  <td>{r.total}</td>
                  <td>{r.concluidas}</td>
                  <td>{r.taxa}%</td>
                  <td>
                    <div className="progress-track" style={{ width: 120 }}>
                      <div
                        className="progress-fill"
                        style={{
                          width: `${r.taxa}%`,
                          background: Number(r.taxa) >= 70 ? '#22c55e' : Number(r.taxa) >= 40 ? '#f59e0b' : '#ef4444',
                        }}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
