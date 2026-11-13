const TarefaModel = require('../models/tarefaModel');
const ProjetoModel = require('../models/projetoModel');

const STATUS_VALIDOS = ['pendente', 'em_andamento', 'bloqueada', 'concluida'];

// Entregas criticas: tarefas que vencem nos proximos N dias.
const DIAS_ENTREGAS_CRITICAS = 14;

// UC04 - Visualizar Fluxo Operacional (Sequencia 04).
// O controller apenas consulta: nenhuma rota daqui altera dados.
const DashboardController = {
  // GET /api/dashboard - mensagem 1.1 carregarIndicadores().
  // As chamadas seguem a ordem das mensagens 1.1.1 a 1.1.4 do diagrama.
  async indicadores(req, res) {
    try {
      const projetosAtivos = await ProjetoModel.contarProjetosAtivos();
      const porStatus = await TarefaModel.contarTarefasPorStatus();
      const entregasCriticas = await TarefaModel.buscarEntregasCriticas(DIAS_ENTREGAS_CRITICAS);
      const cargaPorResponsavel = await TarefaModel.calcularCargaPorResponsavel();
      const atividadesRecentes = await TarefaModel.listarAtividadesRecentes();
      const leadTimeMedio = await TarefaModel.calcularLeadTimeMedio();

      // Os totais do painel saem da contagem por status (um status sem tarefas vale 0).
      const quantidade = (status) => {
        const item = porStatus.find((p) => p.status === status);
        return item ? item.quantidade : 0;
      };

      res.json({
        total_tarefas: porStatus.reduce((soma, p) => soma + p.quantidade, 0),
        tarefas_pendentes: quantidade('pendente'),
        tarefas_em_andamento: quantidade('em_andamento'),
        tarefas_bloqueadas: quantidade('bloqueada'),
        tarefas_concluidas: quantidade('concluida'),
        projetos_ativos: projetosAtivos,
        lead_time_medio: leadTimeMedio,
        entregas_criticas: entregasCriticas,
        pipeline: porStatus,
        capacidade_equipe: cargaPorResponsavel,
        atividades_recentes: atividadesRecentes,
      });
    } catch (error) {
      console.error('Erro ao buscar dashboard:', error);
      res.status(500).json({ erro: 'Erro interno ao buscar dashboard' });
    }
  },

  // GET /api/dashboard/tarefas?status=bloqueada - mensagem 2.1 listarTarefasPorStatus(status).
  async tarefasPorStatus(req, res) {
    try {
      const status = typeof req.query.status === 'string' ? req.query.status.toLowerCase() : '';
      if (!STATUS_VALIDOS.includes(status)) {
        return res.status(400).json({
          erro: 'Status inválido. Valores aceitos: PENDENTE, EM_ANDAMENTO, BLOQUEADA, CONCLUIDA',
        });
      }
      const tarefas = await TarefaModel.buscarPorStatus(status);
      res.json(tarefas);
    } catch (error) {
      console.error('Erro ao detalhar indicador:', error);
      res.status(500).json({ erro: 'Erro interno ao detalhar indicador' });
    }
  },
};

module.exports = DashboardController;
