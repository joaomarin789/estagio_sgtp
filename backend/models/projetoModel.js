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
         (SELECT COUNT(*) FROM tarefa t WHERE t.id_projeto = p.id_projeto AND t.ativo = 1) AS total_tarefas
  FROM projeto p
  LEFT JOIN usuario u ON u.id_usuario = p.id_responsavel
`;

const ProjetoModel = {
  async findAll(filtros = {}) {
    // inativos = projetos excluidos logicamente (tela de restauracao).
    let query = `${PROJETO_SELECT} WHERE p.ativo = ?`;
    const params = [filtros.inativos ? 0 : 1];

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
    const [rows] = await pool.execute(`${PROJETO_SELECT} WHERE p.id_projeto = ? AND p.ativo = 1`, [id]);
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
       WHERE id_projeto=? AND ativo = 1`,
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

  // Exclusao logica: o registro continua no banco, apenas deixa de ser listado.
  // As tarefas do projeto NAO sao alteradas: elas ficam ocultas porque toda
  // consulta de tarefa exige p.ativo = 1 (ver tarefaModel). Assim, ao restaurar
  // o projeto, voltam exatamente as tarefas que estavam ativas antes.
  async delete(id) {
    const [result] = await pool.execute(
      'UPDATE projeto SET ativo = 0 WHERE id_projeto = ? AND ativo = 1',
      [id]
    );
    return result.affectedRows > 0;
  },

  async restaurar(id) {
    const [result] = await pool.execute(
      'UPDATE projeto SET ativo = 1 WHERE id_projeto = ? AND ativo = 0',
      [id]
    );
    return result.affectedRows > 0;
  },

  // Sequencia 01, mensagem 2.1.2: ja existe projeto ativo com este nome?
  // ignorarId exclui o proprio projeto da busca (usado na edicao e na restauracao).
  // A comparacao ignora maiusculas e acentos por causa da collation utf8mb4_unicode_ci.
  async existeComNome(nome, ignorarId = 0) {
    const [rows] = await pool.execute(
      'SELECT id_projeto FROM projeto WHERE nome = ? AND ativo = 1 AND id_projeto <> ?',
      [nome, ignorarId]
    );
    return rows.length > 0;
  },

  // Busca um projeto excluido. Usada so pela restauracao, que precisa do nome
  // para conferir a duplicidade antes de reativar.
  async buscarInativo(id) {
    const [rows] = await pool.execute(
      'SELECT id_projeto AS id, nome FROM projeto WHERE id_projeto = ? AND ativo = 0',
      [id]
    );
    return rows[0];
  },

  // Sequencia 04, mensagem 1.1.1: indicador "projetos ativos" do painel.
  async contarProjetosAtivos() {
    const [rows] = await pool.execute('SELECT COUNT(*) AS total FROM projeto WHERE ativo = 1');
    return rows[0].total;
  },
};

module.exports = ProjetoModel;
