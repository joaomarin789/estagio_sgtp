const pool = require('../config/db');

const TarefaModel = {
  async findAll(filtros = {}) {
    let query = `
      SELECT t.*, p.nome AS projeto_nome
      FROM tarefas t
      LEFT JOIN projetos p ON t.projeto_id = p.id
      WHERE 1=1
    `;
    const params = [];

    if (filtros.busca) {
      query += ` AND (t.titulo LIKE ? OR t.descricao LIKE ? OR t.responsavel LIKE ?)`;
      const termo = `%${filtros.busca}%`;
      params.push(termo, termo, termo);
    }
    if (filtros.status) {
      query += ` AND t.status = ?`;
      params.push(filtros.status);
    }
    if (filtros.prioridade) {
      query += ` AND t.prioridade = ?`;
      params.push(filtros.prioridade);
    }
    if (filtros.responsavel) {
      query += ` AND t.responsavel LIKE ?`;
      params.push(`%${filtros.responsavel}%`);
    }

    query += ` ORDER BY 
      FIELD(t.prioridade, 'critica', 'alta', 'media', 'baixa'),
      t.prazo ASC`;

    const [rows] = await pool.execute(query, params);
    return rows;
  },

  async findById(id) {
    const [rows] = await pool.execute(
      `SELECT t.*, p.nome AS projeto_nome
       FROM tarefas t
       LEFT JOIN projetos p ON t.projeto_id = p.id
       WHERE t.id = ?`,
      [id]
    );
    return rows[0];
  },

  async create(data) {
    const { titulo, descricao, prioridade, status, responsavel, prazo, projeto_id } = data;
    const [result] = await pool.execute(
      `INSERT INTO tarefas (titulo, descricao, prioridade, status, responsavel, prazo, projeto_id)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [titulo, descricao || null, prioridade, status, responsavel, prazo, projeto_id || null]
    );
    return this.findById(result.insertId);
  },

  async update(id, data) {
    const { titulo, descricao, prioridade, status, responsavel, prazo, projeto_id } = data;
    await pool.execute(
      `UPDATE tarefas SET titulo=?, descricao=?, prioridade=?, status=?, responsavel=?, prazo=?, projeto_id=?
       WHERE id=?`,
      [titulo, descricao || null, prioridade, status, responsavel, prazo, projeto_id || null, id]
    );
    return this.findById(id);
  },

  async delete(id) {
    const [result] = await pool.execute('DELETE FROM tarefas WHERE id = ?', [id]);
    return result.affectedRows > 0;
  },

  async getDashboardStats() {
    const [totais] = await pool.execute(`
      SELECT
        COUNT(*) AS total_tarefas,
        SUM(CASE WHEN status = 'concluida' THEN 1 ELSE 0 END) AS tarefas_concluidas,
        SUM(CASE WHEN status = 'bloqueada' THEN 1 ELSE 0 END) AS tarefas_bloqueadas,
        SUM(CASE WHEN status = 'em_andamento' THEN 1 ELSE 0 END) AS tarefas_em_andamento,
        SUM(CASE WHEN status = 'pendente' THEN 1 ELSE 0 END) AS tarefas_pendentes
      FROM tarefas
    `);

    const [projetos] = await pool.execute(`
      SELECT COUNT(*) AS projetos_ativos FROM projetos WHERE status = 'ativo'
    `);

    const [entregasCriticas] = await pool.execute(`
      SELECT t.id, t.titulo, t.responsavel, t.prazo, t.prioridade, p.nome AS projeto_nome
      FROM tarefas t
      LEFT JOIN projetos p ON t.projeto_id = p.id
      WHERE t.prioridade IN ('critica', 'alta')
        AND t.status NOT IN ('concluida')
        AND t.prazo <= DATE_ADD(CURDATE(), INTERVAL 14 DAY)
      ORDER BY t.prazo ASC
      LIMIT 5
    `);

    const [pipeline] = await pool.execute(`
      SELECT status, COUNT(*) AS quantidade
      FROM tarefas
      GROUP BY status
    `);

    const [capacidade] = await pool.execute(`
      SELECT responsavel,
        COUNT(*) AS total,
        SUM(CASE WHEN status = 'em_andamento' THEN 1 ELSE 0 END) AS em_andamento,
        SUM(CASE WHEN status = 'concluida' THEN 1 ELSE 0 END) AS concluidas
      FROM tarefas
      GROUP BY responsavel
      ORDER BY total DESC
      LIMIT 6
    `);

    const [atividades] = await pool.execute(`
      SELECT a.*, t.titulo AS tarefa_titulo
      FROM atividades a
      LEFT JOIN tarefas t ON a.tarefa_id = t.id
      ORDER BY a.created_at DESC
      LIMIT 8
    `);

    const [produtividade] = await pool.execute(`
      SELECT
        DATE_FORMAT(updated_at, '%Y-%m') AS mes,
        SUM(CASE WHEN status = 'concluida' THEN 1 ELSE 0 END) AS concluidas,
        COUNT(*) AS total
      FROM tarefas
      WHERE updated_at >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)
      GROUP BY DATE_FORMAT(updated_at, '%Y-%m')
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
        SUM(CASE WHEN status = 'concluida' THEN 1 ELSE 0 END) AS concluidas,
        SUM(CASE WHEN status = 'bloqueada' THEN 1 ELSE 0 END) AS bloqueadas,
        SUM(CASE WHEN status = 'em_andamento' THEN 1 ELSE 0 END) AS em_andamento,
        SUM(CASE WHEN prazo < CURDATE() AND status != 'concluida' THEN 1 ELSE 0 END) AS atrasadas,
        ROUND(SUM(CASE WHEN status = 'concluida' THEN 1 ELSE 0 END) / COUNT(*) * 100, 1) AS taxa_conclusao
      FROM tarefas
    `);

    const [leadTime] = await pool.execute(`
      SELECT
        ROUND(AVG(DATEDIFF(updated_at, created_at)), 1) AS lead_time_medio
      FROM tarefas
      WHERE status = 'concluida'
    `);

    const [sla] = await pool.execute(`
      SELECT
        ROUND(
          SUM(CASE WHEN status = 'concluida' AND updated_at <= prazo THEN 1 ELSE 0 END) /
          NULLIF(SUM(CASE WHEN status = 'concluida' THEN 1 ELSE 0 END), 0) * 100, 1
        ) AS sla_percentual
      FROM tarefas
    `);

    const [eficiencia] = await pool.execute(`
      SELECT
        DATE_FORMAT(created_at, '%Y-%m') AS mes,
        COUNT(*) AS criadas,
        SUM(CASE WHEN status = 'concluida' THEN 1 ELSE 0 END) AS concluidas
      FROM tarefas
      WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)
      GROUP BY DATE_FORMAT(created_at, '%Y-%m')
      ORDER BY mes ASC
    `);

    const [porPrioridade] = await pool.execute(`
      SELECT prioridade, COUNT(*) AS quantidade,
        SUM(CASE WHEN status = 'concluida' THEN 1 ELSE 0 END) AS concluidas
      FROM tarefas
      GROUP BY prioridade
    `);

    const [porResponsavel] = await pool.execute(`
      SELECT responsavel,
        COUNT(*) AS total,
        SUM(CASE WHEN status = 'concluida' THEN 1 ELSE 0 END) AS concluidas,
        ROUND(SUM(CASE WHEN status = 'concluida' THEN 1 ELSE 0 END) / COUNT(*) * 100, 1) AS taxa
      FROM tarefas
      GROUP BY responsavel
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

  async registrarAtividade(tarefaId, acao, descricao, usuario) {
    await pool.execute(
      `INSERT INTO atividades (tarefa_id, acao, descricao, usuario) VALUES (?, ?, ?, ?)`,
      [tarefaId, acao, descricao, usuario]
    );
  },

  async getProjetos() {
    const [rows] = await pool.execute(
      `SELECT id, nome FROM projetos WHERE status = 'ativo' ORDER BY nome`
    );
    return rows;
  },

  async getPortfolioProjetos() {
    const [rows] = await pool.execute(`
      SELECT p.*,
        COUNT(t.id) AS total_tarefas,
        SUM(CASE WHEN t.status = 'concluida' THEN 1 ELSE 0 END) AS tarefas_concluidas,
        SUM(CASE WHEN t.status = 'bloqueada' THEN 1 ELSE 0 END) AS tarefas_bloqueadas,
        SUM(CASE WHEN t.prioridade IN ('alta','critica') AND t.status NOT IN ('concluida') THEN 1 ELSE 0 END) AS tarefas_risco
      FROM projetos p
      LEFT JOIN tarefas t ON t.projeto_id = p.id
      GROUP BY p.id
      ORDER BY p.status = 'ativo' DESC, p.nome ASC
    `);
    return rows;
  },
};

module.exports = TarefaModel;
