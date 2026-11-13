const TarefaModel = require('../models/tarefaModel');
const UsuarioModel = require('../models/usuarioModel');

// Diagrama de Estados da Tarefa: para cada estado atual, os estados
// para os quais a tarefa pode ir. CONCLUIDA e o estado final.
const TRANSICOES_STATUS = {
  pendente: ['em_andamento', 'bloqueada'],
  em_andamento: ['concluida', 'bloqueada'],
  bloqueada: ['em_andamento'], // desbloquear()
  concluida: [],
};

// historico_atividade.descricao e VARCHAR(255)
const LIMITE_DESCRICAO = 255;

// O sistema nao tem login: o "usuario atual" vem do seletor do topo da tela
// (cabecalho X-Usuario-Id, lido em UsuarioController.identificar).
// Toda operacao que grava historico precisa dele, porque ele e o autor da acao.
function exigirUsuario(req, res) {
  if (!req.usuario) {
    res.status(401).json({ erro: 'Selecione o usuário atual para realizar esta operação' });
    return null;
  }
  return req.usuario;
}

function limparTexto(valor) {
  return typeof valor === 'string' ? valor.trim() : '';
}

const TarefaController = {
  async listar(req, res) {
    try {
      const filtros = {
        busca: req.query.busca,
        status: req.query.status,
        prioridade: req.query.prioridade,
        responsavel: req.query.responsavel,
        id_projeto: req.query.id_projeto,
        inativos: req.query.inativos === '1',
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
      const usuario = exigirUsuario(req, res);
      if (!usuario) return;

      const { descricao, prioridade, prazo, projeto_id } = req.body;
      const titulo = limparTexto(req.body.titulo);
      // UC02: o responsavel e opcional. Vazio vira NULL (tarefa sem responsavel).
      const id_responsavel = req.body.id_responsavel || null;

      if (!titulo || !prazo || !projeto_id) {
        return res.status(400).json({ erro: 'Título, prazo e projeto são obrigatórios' });
      }
      // Quando informado, o responsavel precisa ser um usuario ativo.
      const responsavel = id_responsavel ? await UsuarioModel.buscarPorId(id_responsavel) : null;
      if (id_responsavel && (!responsavel || !responsavel.ativo)) {
        return res.status(400).json({ erro: 'Responsável inválido ou inativo' });
      }
      if (!(await TarefaModel.projetoAtivoExiste(projeto_id))) {
        return res.status(400).json({ erro: 'Projeto inválido ou excluído' });
      }
      // UC02 3.5 - Tarefa ja cadastrada anteriormente no mesmo projeto.
      if (await TarefaModel.existeComTitulo(projeto_id, titulo)) {
        return res.status(400).json({ erro: 'Já existe uma tarefa ativa com este título neste projeto' });
      }

      // O status nao vem do formulario: toda tarefa nasce PENDENTE (ver model).
      const tarefa = await TarefaModel.create({
        titulo,
        descricao,
        prioridade: prioridade || 'media',
        id_responsavel,
        prazo,
        projeto_id,
      });

      await TarefaModel.registrarAtividade({
        tarefaId: tarefa.id,
        acao: 'CRIACAO',
        descricao: `Tarefa "${titulo}" criada`,
        idUsuario: usuario.id_usuario,
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

      const usuario = exigirUsuario(req, res);
      if (!usuario) return;

      const { descricao, prioridade, prazo, projeto_id } = req.body;
      const titulo = limparTexto(req.body.titulo);
      // UC02: o responsavel e opcional. Vazio vira NULL (tarefa sem responsavel).
      const id_responsavel = req.body.id_responsavel || null;

      if (!titulo || !prazo || !projeto_id) {
        return res.status(400).json({ erro: 'Título, prazo e projeto são obrigatórios' });
      }
      // Quando informado, o responsavel precisa ser um usuario ativo.
      const responsavel = id_responsavel ? await UsuarioModel.buscarPorId(id_responsavel) : null;
      if (id_responsavel && (!responsavel || !responsavel.ativo)) {
        return res.status(400).json({ erro: 'Responsável inválido ou inativo' });
      }
      if (!(await TarefaModel.projetoAtivoExiste(projeto_id))) {
        return res.status(400).json({ erro: 'Projeto inválido ou excluído' });
      }
      // O terceiro argumento ignora a propria tarefa na busca por duplicidade.
      if (await TarefaModel.existeComTitulo(projeto_id, titulo, id)) {
        return res.status(400).json({ erro: 'Já existe uma tarefa ativa com este título neste projeto' });
      }

      const tarefa = await TarefaModel.update(id, {
        titulo,
        descricao,
        prioridade,
        id_responsavel,
        prazo,
        projeto_id,
      });

      await TarefaModel.registrarAtividade({
        tarefaId: id,
        acao: 'ALTERACAO',
        descricao: `Tarefa "${titulo}" atualizada`,
        idUsuario: usuario.id_usuario,
      });

      res.json(tarefa);
    } catch (error) {
      console.error('Erro ao atualizar tarefa:', error);
      res.status(500).json({ erro: 'Erro interno ao atualizar tarefa' });
    }
  },

  // UC03 - Atualizar Andamento da Tarefa (PATCH /tarefas/:id/status)
  // As verificacoes seguem a ordem do bloco alt da Sequencia 03.
  async atualizarStatus(req, res) {
    try {
      const { id } = req.params;

      // 1. A tarefa precisa existir e estar ativa (findById ja filtra ativo = 1).
      const existente = await TarefaModel.findById(id);
      if (!existente) {
        return res.status(404).json({ erro: 'Tarefa não encontrada' });
      }

      // 2. Apenas o responsavel pela tarefa pode atualizar o andamento (UC03 3.6).
      const usuario = exigirUsuario(req, res);
      if (!usuario) return;
      if (Number(existente.id_responsavel) !== Number(usuario.id_usuario)) {
        return res.status(403).json({ erro: 'Apenas o responsável pela tarefa pode atualizar o seu andamento' });
      }

      // 3. O status precisa ser um dos quatro estados do diagrama.
      // Aceita 'EM_ANDAMENTO' ou 'em_andamento'; internamente a API usa minusculas.
      const novoStatus = limparTexto(req.body.status).toLowerCase();
      if (!TRANSICOES_STATUS[novoStatus]) {
        return res.status(400).json({
          erro: 'Status inválido. Valores aceitos: PENDENTE, EM_ANDAMENTO, BLOQUEADA, CONCLUIDA',
        });
      }

      // 4. A mudanca precisa ser uma transicao permitida pelo diagrama de estados.
      const statusAtual = existente.status;
      if (!TRANSICOES_STATUS[statusAtual].includes(novoStatus)) {
        return res.status(400).json({
          erro: `Transição de ${statusAtual.toUpperCase()} para ${novoStatus.toUpperCase()} não é permitida`,
        });
      }

      // 5. Bloquear exige o motivo do impedimento (UC03 3.5).
      // Fora de BLOQUEADA o motivo e descartado: a coluna volta a NULL.
      const motivo = novoStatus === 'bloqueada' ? limparTexto(req.body.motivo) : null;
      if (novoStatus === 'bloqueada' && !motivo) {
        return res.status(400).json({ erro: 'Motivo do impedimento obrigatório' });
      }

      const tarefa = await TarefaModel.atualizarStatus(id, novoStatus, motivo);

      // O motivo fica tambem no historico, que nao e apagado ao desbloquear (UC03 3.2).
      let descricao = `Tarefa "${existente.titulo}" — status alterado para ${novoStatus.toUpperCase()}`;
      if (motivo) descricao += `. Motivo: ${motivo}`;

      await TarefaModel.registrarAtividade({
        tarefaId: id,
        acao: 'MUDANCA_STATUS',
        descricao: descricao.slice(0, LIMITE_DESCRICAO),
        idUsuario: usuario.id_usuario,
        campoAlterado: 'status',
        valorAnterior: statusAtual.toUpperCase(),
        valorNovo: novoStatus.toUpperCase(),
      });

      res.json(tarefa);
    } catch (error) {
      console.error('Erro ao atualizar status da tarefa:', error);
      res.status(500).json({ erro: 'Erro interno ao atualizar status da tarefa' });
    }
  },

  async excluir(req, res) {
    try {
      const { id } = req.params;
      const existente = await TarefaModel.findById(id);
      if (!existente) {
        return res.status(404).json({ erro: 'Tarefa não encontrada' });
      }

      const usuario = exigirUsuario(req, res);
      if (!usuario) return;

      await TarefaModel.delete(id);

      await TarefaModel.registrarAtividade({
        tarefaId: id,
        acao: 'EXCLUSAO',
        descricao: `Tarefa "${existente.titulo}" excluída`,
        idUsuario: usuario.id_usuario,
        campoAlterado: 'ativo',
        valorAnterior: '1',
        valorNovo: '0',
      });

      res.json({ mensagem: 'Tarefa excluída com sucesso' });
    } catch (error) {
      console.error('Erro ao excluir tarefa:', error);
      res.status(500).json({ erro: 'Erro interno ao excluir tarefa' });
    }
  },

  async restaurar(req, res) {
    try {
      const { id } = req.params;
      const situacao = await TarefaModel.buscarSituacao(id);
      if (!situacao || situacao.ativo) {
        return res.status(404).json({ erro: 'Tarefa não encontrada entre as excluídas' });
      }

      const usuario = exigirUsuario(req, res);
      if (!usuario) return;

      if (!situacao.projeto_ativo) {
        return res.status(400).json({ erro: 'O projeto desta tarefa está excluído. Restaure o projeto primeiro' });
      }
      // Enquanto a tarefa esteve excluida, outra pode ter sido criada com o mesmo titulo.
      if (await TarefaModel.existeComTitulo(situacao.id_projeto, situacao.titulo, id)) {
        return res.status(400).json({ erro: 'Já existe uma tarefa ativa com este título neste projeto' });
      }

      await TarefaModel.restaurar(id);

      await TarefaModel.registrarAtividade({
        tarefaId: id,
        acao: 'RESTAURACAO',
        descricao: `Tarefa "${situacao.titulo}" restaurada`,
        idUsuario: usuario.id_usuario,
        campoAlterado: 'ativo',
        valorAnterior: '0',
        valorNovo: '1',
      });

      const tarefa = await TarefaModel.findById(id);
      res.json(tarefa);
    } catch (error) {
      console.error('Erro ao restaurar tarefa:', error);
      res.status(500).json({ erro: 'Erro interno ao restaurar tarefa' });
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
