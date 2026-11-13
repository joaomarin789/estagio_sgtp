const ProjetoModel = require('../models/projetoModel');
const TarefaModel = require('../models/tarefaModel');
const UsuarioModel = require('../models/usuarioModel');

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
        inativos: req.query.inativos === '1',
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
      const { descricao, status, prioridade, id_responsavel } = req.body;
      const nome = typeof req.body.nome === 'string' ? req.body.nome.trim() : '';
      const data_inicio = normalizarData(req.body.data_inicio);
      const data_termino_prevista = normalizarData(req.body.data_termino_prevista);

      if (!nome || !data_inicio || !id_responsavel) {
        return res.status(400).json({ erro: 'Nome, data de início e responsável são obrigatórios' });
      }
      if (data_termino_prevista && data_termino_prevista < data_inicio) {
        return res.status(400).json({ erro: 'A data de término prevista não pode ser anterior à data de início' });
      }
      // Sequencia 01, mensagem 2.1.1: o responsavel precisa existir e estar ativo.
      const responsavel = await UsuarioModel.buscarPorId(id_responsavel);
      if (!responsavel || !responsavel.ativo) {
        return res.status(400).json({ erro: 'Responsável inválido ou inativo' });
      }

      if (await ProjetoModel.existeComNome(nome)) {
        return res.status(400).json({ erro: 'Já existe um projeto ativo com este nome' });
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

      const { descricao, status, prioridade, id_responsavel } = req.body;
      const nome = typeof req.body.nome === 'string' ? req.body.nome.trim() : '';
      const data_inicio = normalizarData(req.body.data_inicio);
      const data_termino_prevista = normalizarData(req.body.data_termino_prevista);

      if (!nome || !data_inicio || !id_responsavel) {
        return res.status(400).json({ erro: 'Nome, data de início e responsável são obrigatórios' });
      }
      if (data_termino_prevista && data_termino_prevista < data_inicio) {
        return res.status(400).json({ erro: 'A data de término prevista não pode ser anterior à data de início' });
      }
      // Sequencia 01, mensagem 2.1.1: o responsavel precisa existir e estar ativo.
      const responsavel = await UsuarioModel.buscarPorId(id_responsavel);
      if (!responsavel || !responsavel.ativo) {
        return res.status(400).json({ erro: 'Responsável inválido ou inativo' });
      }

      // O segundo argumento ignora o proprio projeto na busca por duplicidade.
      if (await ProjetoModel.existeComNome(nome, id)) {
        return res.status(400).json({ erro: 'Já existe um projeto ativo com este nome' });
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

  // Sequencia 01, mensagem 4.1: chamada pela tela ao clicar em excluir, para
  // informar na confirmacao quantas tarefas deixarao de ser exibidas.
  async contarTarefasVinculadas(req, res) {
    try {
      const total = await TarefaModel.contarPorProjeto(req.params.id);
      res.json({ total });
    } catch (error) {
      console.error('Erro ao contar tarefas do projeto:', error);
      res.status(500).json({ erro: 'Erro interno ao contar tarefas do projeto' });
    }
  },

  // Sequencia 01, mensagem 5.1: exclusao logica, depois da confirmacao.
  async excluir(req, res) {
    try {
      // O UPDATE so atinge projeto ativo: se nenhuma linha mudou, ele nao
      // existe ou ja estava excluido.
      const inativado = await ProjetoModel.delete(req.params.id);
      if (!inativado) {
        return res.status(404).json({ erro: 'Projeto não encontrado' });
      }

      res.json({ mensagem: 'Projeto excluído com sucesso' });
    } catch (error) {
      console.error('Erro ao excluir projeto:', error);
      res.status(500).json({ erro: 'Erro interno ao excluir projeto' });
    }
  },

  async restaurar(req, res) {
    try {
      const { id } = req.params;
      const excluido = await ProjetoModel.buscarInativo(id);
      if (!excluido) {
        return res.status(404).json({ erro: 'Projeto não encontrado entre os excluídos' });
      }
      // Enquanto o projeto esteve excluido, outro pode ter sido criado com o mesmo nome.
      if (await ProjetoModel.existeComNome(excluido.nome, id)) {
        return res.status(400).json({ erro: 'Já existe um projeto ativo com este nome' });
      }

      await ProjetoModel.restaurar(id);

      const projeto = await ProjetoModel.findById(id);
      res.json(projeto);
    } catch (error) {
      console.error('Erro ao restaurar projeto:', error);
      res.status(500).json({ erro: 'Erro interno ao restaurar projeto' });
    }
  },
};

module.exports = ProjetoController;
