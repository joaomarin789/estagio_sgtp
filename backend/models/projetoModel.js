const pool = require('../config/db');

const STATUS_TO_DB = {
  nao_iniciado: 'NAO_INICIADO',
  em_andamento: 'EM_ANDAMENTO',
  pausado: 'PAUSADO',
  concluido: 'CONCLUIDO',
  cancelado: 'CANCELADO',
};
const STATUS_TO_APP = {
  NAO_INICIADO: 'nao_iniciado',
  EM_ANDAMENTO: 'em_andamento',
  PAUSADO: 'pausado',
  CONCLUIDO: 'concluido',
  CANCELADO: 'cancelado',
};
const PRIORIDADE_TO_DB = { baixa: 'BAIXA', media: 'MEDIA', alta: 'ALTA', urgente: 'URGENTE' };
const PRIORIDADE_TO_APP = { BAIXA: 'baixa', MEDIA: 'media', ALTA: 'alta', URGENTE: 'urgente' };

function mapProjetoRow(row) {
  return {
    ...row,
    status: STATUS_TO_APP[row.status],
    prioridade: PRIORIDADE_TO_APP[row.prioridade],
  };
}

const PROJETO_SELECT = `
  SELECT p.id_projeto AS id, p.nome, p.descricao, p.status, p.prioridade,
         p.id_responsavel, p.data_inicio, p.data_termino_prevista,
         p.data_cadastro AS created_at,
         u.nome AS responsavel_nome,
         (SELECT COUNT(*) FROM tarefa t WHERE t.id_projeto = p.id_projeto) AS total_tarefas
  FROM projeto p
  LEFT JOIN usuario u ON u.id_usuario = p.id_responsavel
`;

const ProjetoModel = {
  async findAll(filtros = {}) {
    let query = `${PROJETO_SELECT} WHERE 1=1`;
    const params = [];

    if (filtros.busca) {
      query += ` AND (p.nome LIKE ? OR p.descricao LIKE ? OR u.nome LIKE ?)`;
      const termo = `%${filtros.busca}%`;
      params.push(termo, termo, termo);
    }
    if (filtros.status && STATUS_TO_DB[filtros.status]) {
      query += ` AND p.status = ?`;
      params.push(STATUS_TO_DB[filtros.status]);
    }
    if (filtros.prioridade && PRIORIDADE_TO_DB[filtros.prioridade]) {
      query += ` AND p.prioridade = ?`;
      params.push(PRIORIDADE_TO_DB[filtros.prioridade]);
    }

    query += ` ORDER BY
      FIELD(p.prioridade, 'URGENTE', 'ALTA', 'MEDIA', 'BAIXA'),
      p.data_inicio ASC`;

    const [rows] = await pool.execute(query, params);
    return rows.map(mapProjetoRow);
  },

  async findById(id) {
    const [rows] = await pool.execute(`${PROJETO_SELECT} WHERE p.id_projeto = ?`, [id]);
    return rows[0] ? mapProjetoRow(rows[0]) : undefined;
  },

  async create(data) {
    const { nome, descricao, status, prioridade, id_responsavel, data_inicio, data_termino_prevista } = data;
    const [result] = await pool.execute(
      `INSERT INTO projeto (nome, descricao, data_inicio, data_termino_prevista, status, prioridade, id_responsavel)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        nome,
        descricao || null,
        data_inicio,
        data_termino_prevista || null,
        STATUS_TO_DB[status] || 'NAO_INICIADO',
        PRIORIDADE_TO_DB[prioridade] || 'MEDIA',
        id_responsavel,
      ]
    );
    return this.findById(result.insertId);
  },

  async update(id, data) {
    const { nome, descricao, status, prioridade, id_responsavel, data_inicio, data_termino_prevista } = data;
    await pool.execute(
      `UPDATE projeto
       SET nome=?, descricao=?, data_inicio=?, data_termino_prevista=?, status=?, prioridade=?, id_responsavel=?
       WHERE id_projeto=?`,
      [
        nome,
        descricao || null,
        data_inicio,
        data_termino_prevista || null,
        STATUS_TO_DB[status] || 'NAO_INICIADO',
        PRIORIDADE_TO_DB[prioridade] || 'MEDIA',
        id_responsavel,
        id,
      ]
    );
    return this.findById(id);
  },

  async delete(id) {
    const [result] = await pool.execute('DELETE FROM projeto WHERE id_projeto = ?', [id]);
    return result.affectedRows > 0;
  },

  async contarTarefasVinculadas(id) {
    const [rows] = await pool.execute(
      'SELECT COUNT(*) AS total FROM tarefa WHERE id_projeto = ?',
      [id]
    );
    return rows[0].total;
  },

  async usuarioAtivoExiste(idUsuario) {
    const [rows] = await pool.execute(
      'SELECT id_usuario FROM usuario WHERE id_usuario = ? AND ativo = TRUE',
      [idUsuario]
    );
    return rows.length > 0;
  },
};

module.exports = ProjetoModel;
