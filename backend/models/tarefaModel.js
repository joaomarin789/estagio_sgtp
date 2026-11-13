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

// Uma tarefa so e visivel quando ela e o projeto dela estao ativos.
// Toda consulta abaixo usa o alias t para tarefa e p para projeto.
const FILTRO_ATIVAS = 't.ativo = 1 AND p.ativo = 1';

const TAREFA_SELECT = `
  SELECT t.id_tarefa AS id, t.titulo, t.descricao, t.prioridade, t.status, t.motivo_bloqueio, t.prazo,
         t.id_projeto AS projeto_id, t.id_responsavel, t.data_criacao AS created_at,
         u.nome AS responsavel, p.nome AS projeto_nome
  FROM tarefa t
  JOIN projeto p ON t.id_projeto = p.id_projeto
  LEFT JOIN usuario u ON t.id_responsavel = u.id_usuario
`;

const TarefaModel = {
  async findAll(filtros = {}) {
    // inativos = tarefas excluidas individualmente (tela de restauracao).
    // As tarefas ocultas so porque o projeto foi excluido nao entram aqui:
    // elas voltam sozinhas quando o projeto e restaurado.
    let query = `${TAREFA_SELECT} WHERE ${filtros.inativos ? 't.ativo = 0' : FILTRO_ATIVAS}`;
    const params = [];

    // Sequencia 02, mensagem 1.1.1: listar as tarefas de um projeto (opcional).
    const idProjeto = Number(filtros.id_projeto);
    if (Number.isInteger(idProjeto) && idProjeto > 0) {
      query += ` AND t.id_projeto = ?`;
      params.push(idProjeto);
    }

    if (filtros.busca) {
      query += ` AND (t.titulo LIKE ? OR t.descricao LIKE ? OR u.nome LIKE ?)`;
      const termo = `%${filtros.busca}%`;
      params.push(termo, termo, termo);
    }
    if (filtros.status && STATUS_TAREFA_TO_DB[filtros.status]) {
      query += ` AND t.status = ?`;
      params.push(STATUS_TAREFA_TO_DB[filtros.status]);
    }
    if (filtros.prioridade && PRIORIDADE_TAREFA_TO_DB[filtros.prioridade]) {
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
    const [rows] = await pool.execute(`${TAREFA_SELECT} WHERE t.id_tarefa = ? AND ${FILTRO_ATIVAS}`, [id]);
    return rows[0] ? mapTarefaRow(rows[0]) : undefined;
  },

  // Diagrama de Estados: cadastrar() leva a tarefa sempre ao estado Pendente.
  async create(data) {
    const { titulo, descricao, prioridade, id_responsavel, prazo, projeto_id } = data;
    const [result] = await pool.execute(
      `INSERT INTO tarefa (titulo, descricao, prioridade, status, prazo, id_projeto, id_responsavel)
       VALUES (?, ?, ?, 'PENDENTE', ?, ?, ?)`,
      [
        titulo,
        descricao || null,
        PRIORIDADE_TAREFA_TO_DB[prioridade],
        prazo,
        projeto_id,
        id_responsavel,
      ]
    );
    return this.findById(result.insertId);
  },

  // A edicao nao altera o status: mudar o andamento e responsabilidade
  // exclusiva do UC03 (atualizarStatus), que valida as transicoes.
  async update(id, data) {
    const { titulo, descricao, prioridade, id_responsavel, prazo, projeto_id } = data;
    await pool.execute(
      `UPDATE tarefa
       SET titulo=?, descricao=?, prioridade=?, prazo=?, id_projeto=?, id_responsavel=?
       WHERE id_tarefa=? AND ativo = 1`,
      [
        titulo,
        descricao || null,
        PRIORIDADE_TAREFA_TO_DB[prioridade],
        prazo,
        projeto_id,
        id_responsavel,
        id,
      ]
    );
    return this.findById(id);
  },

  // UC03 - Atualizar Andamento da Tarefa.
  // data_conclusao e preenchida ao entrar em CONCLUIDA e limpa nos demais estados.
  // motivo_bloqueio recebe o motivo ao bloquear e NULL em qualquer outro status
  // (o controller so envia motivo quando o novo status e BLOQUEADA).
  async atualizarStatus(id, status, motivo = null) {
    const dbStatus = STATUS_TAREFA_TO_DB[status];
    await pool.execute(
      `UPDATE tarefa
       SET status = ?,
           motivo_bloqueio = ?,
           data_conclusao = CASE WHEN ? = 'CONCLUIDA' THEN COALESCE(data_conclusao, NOW()) ELSE NULL END
       WHERE id_tarefa = ? AND ativo = 1`,
      [dbStatus, motivo, dbStatus, id]
    );
    return this.findById(id);
  },

  // Exclusao logica: a linha e o historico dela continuam no banco.
  async delete(id) {
    const [result] = await pool.execute(
      'UPDATE tarefa SET ativo = 0 WHERE id_tarefa = ? AND ativo = 1',
      [id]
    );
    return result.affectedRows > 0;
  },

  async restaurar(id) {
    const [result] = await pool.execute(
      'UPDATE tarefa SET ativo = 1 WHERE id_tarefa = ? AND ativo = 0',
      [id]
    );
    return result.affectedRows > 0;
  },

  // Busca a tarefa SEM filtrar por ativo. Usada so pela restauracao, que
  // precisa saber se a tarefa existe, se esta excluida e se o projeto esta ativo.
  async buscarSituacao(id) {
    const [rows] = await pool.execute(
      `SELECT t.id_tarefa AS id, t.titulo, t.id_projeto, t.id_responsavel, t.ativo, p.ativo AS projeto_ativo
       FROM tarefa t
       JOIN projeto p ON t.id_projeto = p.id_projeto
       WHERE t.id_tarefa = ?`,
      [id]
    );
    return rows[0];
  },

  async projetoAtivoExiste(idProjeto) {
    const [rows] = await pool.execute(
      'SELECT id_projeto FROM projeto WHERE id_projeto = ? AND ativo = 1',
      [idProjeto]
    );
    return rows.length > 0;
  },

  // UC02 3.5: ja existe tarefa ativa com este titulo no projeto?
  // ignorarId exclui a propria tarefa da busca (usado na edicao e na restauracao).
  // A comparacao ignora maiusculas e acentos por causa da collation utf8mb4_unicode_ci.
  async existeComTitulo(idProjeto, titulo, ignorarId = 0) {
    const [rows] = await pool.execute(
      `SELECT id_tarefa FROM tarefa
       WHERE id_projeto = ? AND titulo = ? AND ativo = 1 AND id_tarefa <> ?`,
      [idProjeto, titulo, ignorarId]
    );
    return rows.length > 0;
  },

  // Sequencia 01, mensagem 4.1.1: quantidade de tarefas ativas de um projeto.
  // Usada na confirmacao da exclusao do projeto.
  async contarPorProjeto(idProjeto) {
    const [rows] = await pool.execute(
      'SELECT COUNT(*) AS total FROM tarefa WHERE id_projeto = ? AND ativo = 1',
      [idProjeto]
    );
    return rows[0].total;
  },

  // ---- UC04 - Visualizar Fluxo Operacional (Sequencia 04) ----
  // Cada metodo abaixo corresponde a uma mensagem enviada pelo DashboardController.

  // 1.1.2 - Quantidade de tarefas ativas em cada status.
  async contarTarefasPorStatus() {
    const [rows] = await pool.execute(`
      SELECT t.status, COUNT(*) AS quantidade
      FROM tarefa t
      JOIN projeto p ON t.id_projeto = p.id_projeto
      WHERE ${FILTRO_ATIVAS}
      GROUP BY t.status
    `);
    return rows.map((r) => ({ status: STATUS_TAREFA_TO_APP[r.status], quantidade: Number(r.quantidade) }));
  },

  // 1.1.3 - Entregas criticas: tarefas de prioridade alta ou critica, ainda nao
  // concluidas, com prazo ate 'dias' dias a partir de hoje (inclui as atrasadas).
  async buscarEntregasCriticas(dias) {
    const [rows] = await pool.execute(`
      SELECT t.id_tarefa AS id, t.titulo, u.nome AS responsavel, t.prazo, t.prioridade, p.nome AS projeto_nome
      FROM tarefa t
      JOIN projeto p ON t.id_projeto = p.id_projeto
      LEFT JOIN usuario u ON t.id_responsavel = u.id_usuario
      WHERE ${FILTRO_ATIVAS}
        AND t.prioridade IN ('CRITICA', 'ALTA')
        AND t.status <> 'CONCLUIDA'
        AND t.prazo <= DATE_ADD(CURDATE(), INTERVAL ? DAY)
      ORDER BY t.prazo ASC
      LIMIT 5
    `, [dias]);
    return rows.map((r) => ({ ...r, prioridade: PRIORIDADE_TAREFA_TO_APP[r.prioridade] }));
  },

  // 1.1.4 - Carga de trabalho: tarefas atribuidas a cada responsavel.
  // Tarefas sem responsavel nao entram, porque o agrupamento e por usuario.
  async calcularCargaPorResponsavel() {
    const [rows] = await pool.execute(`
      SELECT u.nome AS responsavel,
        COUNT(*) AS total,
        SUM(CASE WHEN t.status = 'EM_ANDAMENTO' THEN 1 ELSE 0 END) AS em_andamento,
        SUM(CASE WHEN t.status = 'CONCLUIDA' THEN 1 ELSE 0 END) AS concluidas
      FROM tarefa t
      JOIN projeto p ON t.id_projeto = p.id_projeto
      JOIN usuario u ON t.id_responsavel = u.id_usuario
      WHERE ${FILTRO_ATIVAS}
      GROUP BY u.id_usuario, u.nome
      ORDER BY total DESC
      LIMIT 6
    `);
    return rows;
  },

  // Feed de atividades recentes do painel. O historico e trilha de auditoria:
  // mostra tambem as acoes sobre tarefas excluidas.
  async listarAtividadesRecentes() {
    const [rows] = await pool.execute(`
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
      ALTERACAO: 'Alteração',
      EXCLUSAO: 'Exclusão',
      RESTAURACAO: 'Restauração',
      MUDANCA_STATUS: 'Mudança de status',
      ATRIBUICAO: 'Atribuição',
    };
    return rows.map((r) => ({ ...r, acao: ACAO_LABELS[r.acao] || r.acao }));
  },

  // Lead time medio: dias entre a criacao e a conclusao das tarefas concluidas.
  // Devolve null enquanto nao houver tarefa concluida com data de conclusao.
  async calcularLeadTimeMedio() {
    const [rows] = await pool.execute(`
      SELECT ROUND(AVG(DATEDIFF(t.data_conclusao, t.data_criacao)), 1) AS lead_time_medio
      FROM tarefa t
      JOIN projeto p ON t.id_projeto = p.id_projeto
      WHERE ${FILTRO_ATIVAS}
        AND t.status = 'CONCLUIDA' AND t.data_conclusao IS NOT NULL
    `);
    const valor = rows[0].lead_time_medio;
    return valor === null ? null : Number(valor);
  },

  // 2.1.1 - Detalhe de um indicador: tarefas ativas de um status.
  // Reaproveita a listagem (findAll), que ja aplica o filtro de ativas e a ordenacao.
  async buscarPorStatus(status) {
    return this.findAll({ status });
  },

  async getRelatorios() {
    const [indicadores] = await pool.execute(`
      SELECT
        COUNT(*) AS total_tarefas,
        SUM(CASE WHEN t.status = 'CONCLUIDA' THEN 1 ELSE 0 END) AS concluidas,
        SUM(CASE WHEN t.status = 'BLOQUEADA' THEN 1 ELSE 0 END) AS bloqueadas,
        SUM(CASE WHEN t.status = 'EM_ANDAMENTO' THEN 1 ELSE 0 END) AS em_andamento,
        SUM(CASE WHEN t.prazo < CURDATE() AND t.status != 'CONCLUIDA' THEN 1 ELSE 0 END) AS atrasadas,
        ROUND(SUM(CASE WHEN t.status = 'CONCLUIDA' THEN 1 ELSE 0 END) / COUNT(*) * 100, 1) AS taxa_conclusao
      FROM tarefa t
      JOIN projeto p ON t.id_projeto = p.id_projeto
      WHERE ${FILTRO_ATIVAS}
    `);

    const [leadTime] = await pool.execute(`
      SELECT
        ROUND(AVG(DATEDIFF(t.data_conclusao, t.data_criacao)), 1) AS lead_time_medio
      FROM tarefa t
      JOIN projeto p ON t.id_projeto = p.id_projeto
      WHERE ${FILTRO_ATIVAS}
        AND t.status = 'CONCLUIDA' AND t.data_conclusao IS NOT NULL
    `);

    const [sla] = await pool.execute(`
      SELECT
        ROUND(
          SUM(CASE WHEN t.status = 'CONCLUIDA' AND DATE(t.data_conclusao) <= t.prazo THEN 1 ELSE 0 END) /
          NULLIF(SUM(CASE WHEN t.status = 'CONCLUIDA' THEN 1 ELSE 0 END), 0) * 100, 1
        ) AS sla_percentual
      FROM tarefa t
      JOIN projeto p ON t.id_projeto = p.id_projeto
      WHERE ${FILTRO_ATIVAS}
    `);

    const [eficiencia] = await pool.execute(`
      SELECT
        DATE_FORMAT(t.data_criacao, '%Y-%m') AS mes,
        COUNT(*) AS criadas,
        SUM(CASE WHEN t.status = 'CONCLUIDA' THEN 1 ELSE 0 END) AS concluidas
      FROM tarefa t
      JOIN projeto p ON t.id_projeto = p.id_projeto
      WHERE ${FILTRO_ATIVAS}
        AND t.data_criacao >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)
      GROUP BY DATE_FORMAT(t.data_criacao, '%Y-%m')
      ORDER BY mes ASC
    `);

    const [porPrioridadeRaw] = await pool.execute(`
      SELECT t.prioridade, COUNT(*) AS quantidade,
        SUM(CASE WHEN t.status = 'CONCLUIDA' THEN 1 ELSE 0 END) AS concluidas
      FROM tarefa t
      JOIN projeto p ON t.id_projeto = p.id_projeto
      WHERE ${FILTRO_ATIVAS}
      GROUP BY t.prioridade
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
      JOIN projeto p ON t.id_projeto = p.id_projeto
      JOIN usuario u ON t.id_responsavel = u.id_usuario
      WHERE ${FILTRO_ATIVAS}
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
      `SELECT id_projeto AS id, nome FROM projeto WHERE status = 'EM_ANDAMENTO' AND ativo = 1 ORDER BY nome`
    );
    return rows;
  },
};

module.exports = TarefaModel;
