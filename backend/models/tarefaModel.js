const pool = require('../config/db');

const PRIORIDADE_TAREFA_TO_DB = { baixa: 'BAIXA', media: 'MEDIA', alta: 'ALTA', critica: 'CRITICA' };
const PRIORIDADE_TAREFA_TO_APP = { BAIXA: 'baixa', MEDIA: 'media', ALTA: 'alta', CRITICA: 'critica' };
const STATUS_TAREFA_TO_DB = { pendente: 'PENDENTE', em_andamento: 'EM_ANDAMENTO', concluida: 'CONCLUIDA', bloqueada: 'BLOQUEADA' };
const STATUS_TAREFA_TO_APP = { PENDENTE: 'pendente', EM_ANDAMENTO: 'em_andamento', CONCLUIDA: 'concluida', BLOQUEADA: 'bloqueada' };

function mapTarefaRow(row) {
  return {
    ...row,
    prioridade: PRIORIDADE_TAREFA_TO_APP[row.prioridade],
    status: STATUS_TAREFA_TO_APP[row.status],
  };
}

const TAREFA_SELECT = `
  SELECT t.id_tarefa AS id, t.titulo, t.descricao, t.prioridade, t.status, t.prazo,
         t.id_projeto AS projeto_id, t.id_responsavel, t.data_criacao AS created_at,
         u.nome AS responsavel, p.nome AS projeto_nome
  FROM tarefa t
  LEFT JOIN usuario u ON t.id_responsavel = u.id_usuario
  LEFT JOIN projeto p ON t.id_projeto = p.id_projeto
`;

const TarefaModel = {
  async findAll(filtros = {}) {
    let query = `${TAREFA_SELECT} WHERE 1=1`;
    const params = [];

    if (filtros.busca) {
      query += ` AND (t.titulo LIKE ? OR t.descricao LIKE ? OR u.nome LIKE ?)`;
      const termo = `%${filtros.busca}%`;
      params.push(termo, termo, termo);
    }
    if (filtros.status) {
      query += ` AND t.status = ?`;
      params.push(STATUS_TAREFA_TO_DB[filtros.status]);
    }
    if (filtros.prioridade) {
      query += ` AND t.prioridade = ?`;
      params.push(PRIORIDADE_TAREFA_TO_DB[filtros.prioridade]);
    }
    if (filtros.responsavel) {
      query += ` AND u.nome LIKE ?`;
      params.push(`%${filtros.responsavel}%`);
    }

    query += ` ORDER BY
      FIELD(t.prioridade, 'CRITICA', 'ALTA', 'MEDIA', 'BAIXA'),
      t.prazo ASC`;

    const [rows] = await pool.execute(query, params);
    return rows.map(mapTarefaRow);
  },

  async findById(id) {
    const [rows] = await pool.execute(`${TAREFA_SELECT} WHERE t.id_tarefa = ?`, [id]);
    return rows[0] ? mapTarefaRow(rows[0]) : undefined;
  },

  async create(data) {
    const { titulo, descricao, prioridade, status, id_responsavel, prazo, projeto_id } = data;
    const [result] = await pool.execute(
      `INSERT INTO tarefa (titulo, descricao, prioridade, status, prazo, id_projeto, id_responsavel)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        titulo,
        descricao || null,
        PRIORIDADE_TAREFA_TO_DB[prioridade],
        STATUS_TAREFA_TO_DB[status],
        prazo,
        projeto_id || null,
        id_responsavel,
      ]
    );
    return this.findById(result.insertId);
  },

  async update(id, data) {
    const { titulo, descricao, prioridade, status, id_responsavel, prazo, projeto_id } = data;
    const dbStatus = STATUS_TAREFA_TO_DB[status];
    await pool.execute(
      `UPDATE tarefa
       SET titulo=?, descricao=?, prioridade=?, status=?, prazo=?, id_projeto=?, id_responsavel=?,
           data_conclusao = CASE WHEN ? = 'CONCLUIDA' THEN COALESCE(data_conclusao, NOW()) ELSE NULL END
       WHERE id_tarefa=?`,
      [
        titulo,
        descricao || null,
        PRIORIDADE_TAREFA_TO_DB[prioridade],
        dbStatus,
        prazo,
        projeto_id || null,
        id_responsavel,
        dbStatus,
        id,
      ]
    );
    return this.findById(id);
  },

  async delete(id) {
    const [result] = await pool.execute('DELETE FROM tarefa WHERE id_tarefa = ?', [id]);
    return result.affectedRows > 0;
  },

  async getDashboardStats() {
    const [totais] = await pool.execute(`
      SELECT
        COUNT(*) AS total_tarefas,
        SUM(CASE WHEN status = 'CONCLUIDA' THEN 1 ELSE 0 END) AS tarefas_concluidas,
        SUM(CASE WHEN status = 'BLOQUEADA' THEN 1 ELSE 0 END) AS tarefas_bloqueadas,
        SUM(CASE WHEN status = 'EM_ANDAMENTO' THEN 1 ELSE 0 END) AS tarefas_em_andamento,
        SUM(CASE WHEN status = 'PENDENTE' THEN 1 ELSE 0 END) AS tarefas_pendentes
      FROM tarefa
    `);

    const [projetos] = await pool.execute(`
      SELECT COUNT(*) AS projetos_ativos FROM projeto WHERE status = 'EM_ANDAMENTO'
    `);

    const [entregasCriticasRaw] = await pool.execute(`
      SELECT t.id_tarefa AS id, t.titulo, u.nome AS responsavel, t.prazo, t.prioridade, p.nome AS projeto_nome
      FROM tarefa t
      LEFT JOIN usuario u ON t.id_responsavel = u.id_usuario
      LEFT JOIN projeto p ON t.id_projeto = p.id_projeto
      WHERE t.prioridade IN ('CRITICA', 'ALTA')
        AND t.status NOT IN ('CONCLUIDA')
        AND t.prazo <= DATE_ADD(CURDATE(), INTERVAL 14 DAY)
      ORDER BY t.prazo ASC
      LIMIT 5
    `);
    const entregasCriticas = entregasCriticasRaw.map((r) => ({
      ...r,
      prioridade: PRIORIDADE_TAREFA_TO_APP[r.prioridade],
    }));

    const [pipelineRaw] = await pool.execute(`
      SELECT status, COUNT(*) AS quantidade
      FROM tarefa
      GROUP BY status
    `);
    const pipeline = pipelineRaw.map((r) => ({ ...r, status: STATUS_TAREFA_TO_APP[r.status] }));

    const [capacidade] = await pool.execute(`
      SELECT u.nome AS responsavel,
        COUNT(*) AS total,
        SUM(CASE WHEN t.status = 'EM_ANDAMENTO' THEN 1 ELSE 0 END) AS em_andamento,
        SUM(CASE WHEN t.status = 'CONCLUIDA' THEN 1 ELSE 0 END) AS concluidas
      FROM tarefa t
      JOIN usuario u ON t.id_responsavel = u.id_usuario
      GROUP BY u.id_usuario, u.nome
      ORDER BY total DESC
      LIMIT 6
    `);

    const [atividadesRaw] = await pool.execute(`
      SELECT h.id_historico AS id, h.id_tarefa AS tarefa_id, h.acao, h.descricao, u.nome AS usuario,
             h.data_hora AS created_at, t.titulo AS tarefa_titulo
      FROM historico_atividade h
      LEFT JOIN tarefa t ON h.id_tarefa = t.id_tarefa
      LEFT JOIN usuario u ON h.id_usuario = u.id_usuario
      ORDER BY h.data_hora DESC
      LIMIT 8
    `);
    const ACAO_LABELS = {
      CRIACAO: 'Criação',
      EDICAO: 'Edição',
      EXCLUSAO: 'Exclusão',
      MUDANCA_STATUS: 'Mudança de status',
      ATRIBUICAO: 'Atribuição',
    };
    const atividades = atividadesRaw.map((r) => ({ ...r, acao: ACAO_LABELS[r.acao] || r.acao }));

    const [produtividade] = await pool.execute(`
      SELECT
        DATE_FORMAT(data_criacao, '%Y-%m') AS mes,
        SUM(CASE WHEN status = 'CONCLUIDA' THEN 1 ELSE 0 END) AS concluidas,
        COUNT(*) AS total
      FROM tarefa
      WHERE data_criacao >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)
      GROUP BY DATE_FORMAT(data_criacao, '%Y-%m')
      ORDER BY mes ASC
    `);

    return {
      ...totais[0],
      projetos_ativos: projetos[0].projetos_ativos,
      entregas_criticas: entregasCriticas,
      pipeline,
      capacidade_equipe: capacidade,
      atividades_recentes: atividades,
      produtividade,
    };
  },

  async getRelatorios() {
    const [indicadores] = await pool.execute(`
      SELECT
        COUNT(*) AS total_tarefas,
        SUM(CASE WHEN status = 'CONCLUIDA' THEN 1 ELSE 0 END) AS concluidas,
        SUM(CASE WHEN status = 'BLOQUEADA' THEN 1 ELSE 0 END) AS bloqueadas,
        SUM(CASE WHEN status = 'EM_ANDAMENTO' THEN 1 ELSE 0 END) AS em_andamento,
        SUM(CASE WHEN prazo < CURDATE() AND status != 'CONCLUIDA' THEN 1 ELSE 0 END) AS atrasadas,
        ROUND(SUM(CASE WHEN status = 'CONCLUIDA' THEN 1 ELSE 0 END) / COUNT(*) * 100, 1) AS taxa_conclusao
      FROM tarefa
    `);

    const [leadTime] = await pool.execute(`
      SELECT
        ROUND(AVG(DATEDIFF(data_conclusao, data_criacao)), 1) AS lead_time_medio
      FROM tarefa
      WHERE status = 'CONCLUIDA' AND data_conclusao IS NOT NULL
    `);

    const [sla] = await pool.execute(`
      SELECT
        ROUND(
          SUM(CASE WHEN status = 'CONCLUIDA' AND DATE(data_conclusao) <= prazo THEN 1 ELSE 0 END) /
          NULLIF(SUM(CASE WHEN status = 'CONCLUIDA' THEN 1 ELSE 0 END), 0) * 100, 1
        ) AS sla_percentual
      FROM tarefa
    `);

    const [eficiencia] = await pool.execute(`
      SELECT
        DATE_FORMAT(data_criacao, '%Y-%m') AS mes,
        COUNT(*) AS criadas,
        SUM(CASE WHEN status = 'CONCLUIDA' THEN 1 ELSE 0 END) AS concluidas
      FROM tarefa
      WHERE data_criacao >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)
      GROUP BY DATE_FORMAT(data_criacao, '%Y-%m')
      ORDER BY mes ASC
    `);

    const [porPrioridadeRaw] = await pool.execute(`
      SELECT prioridade, COUNT(*) AS quantidade,
        SUM(CASE WHEN status = 'CONCLUIDA' THEN 1 ELSE 0 END) AS concluidas
      FROM tarefa
      GROUP BY prioridade
    `);
    const porPrioridade = porPrioridadeRaw.map((r) => ({
      ...r,
      prioridade: PRIORIDADE_TAREFA_TO_APP[r.prioridade],
    }));

    const [porResponsavel] = await pool.execute(`
      SELECT u.nome AS responsavel,
        COUNT(*) AS total,
        SUM(CASE WHEN t.status = 'CONCLUIDA' THEN 1 ELSE 0 END) AS concluidas,
        ROUND(SUM(CASE WHEN t.status = 'CONCLUIDA' THEN 1 ELSE 0 END) / COUNT(*) * 100, 1) AS taxa
      FROM tarefa t
      JOIN usuario u ON t.id_responsavel = u.id_usuario
      GROUP BY u.id_usuario, u.nome
      ORDER BY total DESC
    `);

    const total = indicadores[0].total_tarefas || 1;
    const eficienciaOperacional = Math.round(
      ((indicadores[0].concluidas / total) * 0.4 +
        (sla[0].sla_percentual || 0) / 100 * 0.35 +
        (100 - (indicadores[0].atrasadas / total) * 100) / 100 * 0.25) * 100
    );

    return {
      indicadores: {
        ...indicadores[0],
        lead_time_medio: leadTime[0].lead_time_medio || 0,
        sla_percentual: sla[0].sla_percentual || 0,
        eficiencia_operacional: eficienciaOperacional,
      },
      eficiencia_mensal: eficiencia,
      por_prioridade: porPrioridade,
      por_responsavel: porResponsavel,
    };
  },

  async registrarAtividade({ tarefaId, acao, descricao, idUsuario, campoAlterado = null, valorAnterior = null, valorNovo = null }) {
    await pool.execute(
      `INSERT INTO historico_atividade (acao, campo_alterado, valor_anterior, valor_novo, descricao, id_usuario, id_tarefa)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [acao, campoAlterado, valorAnterior, valorNovo, descricao, idUsuario, tarefaId]
    );
  },

  async getProjetos() {
    const [rows] = await pool.execute(
      `SELECT id_projeto AS id, nome FROM projeto WHERE status = 'EM_ANDAMENTO' ORDER BY nome`
    );
    return rows;
  },
};

module.exports = TarefaModel;
