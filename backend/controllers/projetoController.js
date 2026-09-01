const ProjetoModel = require('../models/projetoModel');

const STATUS_VALIDOS = ['nao_iniciado', 'em_andamento', 'pausado', 'concluido', 'cancelado'];
const PRIORIDADES_VALIDAS = ['baixa', 'media', 'alta', 'urgente'];

function normalizarData(valor) {
  if (!valor) return null;
  return String(valor).split('T')[0];
}

const ProjetoController = {
  async listar(req, res) {
    try {
      const filtros = {
        busca: req.query.busca,
        status: req.query.status,
        prioridade: req.query.prioridade,
      };
      const projetos = await ProjetoModel.findAll(filtros);
      res.json(projetos);
    } catch (error) {
      console.error('Erro ao listar projetos:', error);
      res.status(500).json({ erro: 'Erro interno ao listar projetos' });
    }
  },

  async buscarPorId(req, res) {
    try {
      const projeto = await ProjetoModel.findById(req.params.id);
      if (!projeto) {
        return res.status(404).json({ erro: 'Projeto não encontrado' });
      }
      res.json(projeto);
    } catch (error) {
      console.error('Erro ao buscar projeto:', error);
      res.status(500).json({ erro: 'Erro interno ao buscar projeto' });
    }
  },

  async criar(req, res) {
    try {
      const { nome, descricao, status, prioridade, id_responsavel } = req.body;
      const data_inicio = normalizarData(req.body.data_inicio);
      const data_termino_prevista = normalizarData(req.body.data_termino_prevista);

      if (!nome || !data_inicio || !id_responsavel) {
        return res.status(400).json({ erro: 'Nome, data de início e responsável são obrigatórios' });
      }
      if (data_termino_prevista && data_termino_prevista < data_inicio) {
        return res.status(400).json({ erro: 'A data de término prevista não pode ser anterior à data de início' });
      }
      if (!(await ProjetoModel.usuarioAtivoExiste(id_responsavel))) {
        return res.status(400).json({ erro: 'Responsável inválido ou inativo' });
      }

      const projeto = await ProjetoModel.create({
        nome,
        descricao,
        status: STATUS_VALIDOS.includes(status) ? status : 'nao_iniciado',
        prioridade: PRIORIDADES_VALIDAS.includes(prioridade) ? prioridade : 'media',
        id_responsavel,
        data_inicio,
        data_termino_prevista,
      });

      res.status(201).json(projeto);
    } catch (error) {
      console.error('Erro ao criar projeto:', error);
      res.status(500).json({ erro: 'Erro interno ao criar projeto' });
    }
  },

  async atualizar(req, res) {
    try {
      const { id } = req.params;
      const existente = await ProjetoModel.findById(id);
      if (!existente) {
        return res.status(404).json({ erro: 'Projeto não encontrado' });
      }

      const { nome, descricao, status, prioridade, id_responsavel } = req.body;
      const data_inicio = normalizarData(req.body.data_inicio);
      const data_termino_prevista = normalizarData(req.body.data_termino_prevista);

      if (!nome || !data_inicio || !id_responsavel) {
        return res.status(400).json({ erro: 'Nome, data de início e responsável são obrigatórios' });
      }
      if (data_termino_prevista && data_termino_prevista < data_inicio) {
        return res.status(400).json({ erro: 'A data de término prevista não pode ser anterior à data de início' });
      }
      if (!(await ProjetoModel.usuarioAtivoExiste(id_responsavel))) {
        return res.status(400).json({ erro: 'Responsável inválido ou inativo' });
      }

      const projeto = await ProjetoModel.update(id, {
        nome,
        descricao,
        status: STATUS_VALIDOS.includes(status) ? status : existente.status,
        prioridade: PRIORIDADES_VALIDAS.includes(prioridade) ? prioridade : existente.prioridade,
        id_responsavel,
        data_inicio,
        data_termino_prevista,
      });

      res.json(projeto);
    } catch (error) {
      console.error('Erro ao atualizar projeto:', error);
      res.status(500).json({ erro: 'Erro interno ao atualizar projeto' });
    }
  },

  async excluir(req, res) {
    try {
      const { id } = req.params;
      const existente = await ProjetoModel.findById(id);
      if (!existente) {
        return res.status(404).json({ erro: 'Projeto não encontrado' });
      }

      const tarefasAfetadas = await ProjetoModel.contarTarefasVinculadas(id);
      await ProjetoModel.delete(id);

      res.json({
        mensagem: 'Projeto excluído com sucesso',
        tarefas_afetadas: tarefasAfetadas,
      });
    } catch (error) {
      console.error('Erro ao excluir projeto:', error);
      res.status(500).json({ erro: 'Erro interno ao excluir projeto' });
    }
  },
};

module.exports = ProjetoController;
