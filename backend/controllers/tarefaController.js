const TarefaModel = require('../models/tarefaModel');

const TarefaController = {
  async listar(req, res) {
    try {
      const filtros = {
        busca: req.query.busca,
        status: req.query.status,
        prioridade: req.query.prioridade,
        responsavel: req.query.responsavel,
      };
      const tarefas = await TarefaModel.findAll(filtros);
      res.json(tarefas);
    } catch (error) {
      console.error('Erro ao listar tarefas:', error);
      res.status(500).json({ erro: 'Erro interno ao listar tarefas' });
    }
  },

  async buscarPorId(req, res) {
    try {
      const tarefa = await TarefaModel.findById(req.params.id);
      if (!tarefa) {
        return res.status(404).json({ erro: 'Tarefa não encontrada' });
      }
      res.json(tarefa);
    } catch (error) {
      console.error('Erro ao buscar tarefa:', error);
      res.status(500).json({ erro: 'Erro interno ao buscar tarefa' });
    }
  },

  async criar(req, res) {
    try {
      const { titulo, descricao, prioridade, status, id_responsavel, prazo, projeto_id } = req.body;

      if (!titulo || !id_responsavel || !prazo) {
        return res.status(400).json({ erro: 'Título, responsável e prazo são obrigatórios' });
      }

      const tarefa = await TarefaModel.create({
        titulo,
        descricao,
        prioridade: prioridade || 'media',
        status: status || 'pendente',
        id_responsavel,
        prazo,
        projeto_id,
      });

      await TarefaModel.registrarAtividade({
        tarefaId: tarefa.id,
        acao: 'CRIACAO',
        descricao: `Tarefa "${titulo}" criada`,
        idUsuario: id_responsavel,
      });

      res.status(201).json(tarefa);
    } catch (error) {
      console.error('Erro ao criar tarefa:', error);
      res.status(500).json({ erro: 'Erro interno ao criar tarefa' });
    }
  },

  async atualizar(req, res) {
    try {
      const { id } = req.params;
      const existente = await TarefaModel.findById(id);
      if (!existente) {
        return res.status(404).json({ erro: 'Tarefa não encontrada' });
      }

      const { titulo, descricao, prioridade, status, id_responsavel, prazo, projeto_id } = req.body;

      if (!titulo || !id_responsavel || !prazo) {
        return res.status(400).json({ erro: 'Título, responsável e prazo são obrigatórios' });
      }

      const tarefa = await TarefaModel.update(id, {
        titulo,
        descricao,
        prioridade,
        status,
        id_responsavel,
        prazo,
        projeto_id,
      });

      const mudouStatus = existente.status !== status;
      await TarefaModel.registrarAtividade({
        tarefaId: id,
        acao: mudouStatus ? 'MUDANCA_STATUS' : 'EDICAO',
        descricao: mudouStatus
          ? `Tarefa "${titulo}" — status alterado para ${status.toUpperCase()}`
          : `Tarefa "${titulo}" atualizada`,
        idUsuario: id_responsavel,
        campoAlterado: mudouStatus ? 'status' : null,
        valorAnterior: mudouStatus ? existente.status.toUpperCase() : null,
        valorNovo: mudouStatus ? status.toUpperCase() : null,
      });

      res.json(tarefa);
    } catch (error) {
      console.error('Erro ao atualizar tarefa:', error);
      res.status(500).json({ erro: 'Erro interno ao atualizar tarefa' });
    }
  },

  async excluir(req, res) {
    try {
      const { id } = req.params;
      const existente = await TarefaModel.findById(id);
      if (!existente) {
        return res.status(404).json({ erro: 'Tarefa não encontrada' });
      }

      await TarefaModel.delete(id);
      res.json({ mensagem: 'Tarefa excluída com sucesso' });
    } catch (error) {
      console.error('Erro ao excluir tarefa:', error);
      res.status(500).json({ erro: 'Erro interno ao excluir tarefa' });
    }
  },

  async dashboard(req, res) {
    try {
      const stats = await TarefaModel.getDashboardStats();
      res.json(stats);
    } catch (error) {
      console.error('Erro ao buscar dashboard:', error);
      res.status(500).json({ erro: 'Erro interno ao buscar dashboard' });
    }
  },

  async relatorios(req, res) {
    try {
      const dados = await TarefaModel.getRelatorios();
      res.json(dados);
    } catch (error) {
      console.error('Erro ao buscar relatórios:', error);
      res.status(500).json({ erro: 'Erro interno ao buscar relatórios' });
    }
  },

  async projetos(req, res) {
    try {
      const projetos = await TarefaModel.getProjetos();
      res.json(projetos);
    } catch (error) {
      console.error('Erro ao buscar projetos:', error);
      res.status(500).json({ erro: 'Erro interno ao buscar projetos' });
    }
  },
};

module.exports = TarefaController;
