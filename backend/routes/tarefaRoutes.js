const express = require('express');
const router = express.Router();
const TarefaController = require('../controllers/tarefaController');

router.get('/dashboard', TarefaController.dashboard);
router.get('/relatorios', TarefaController.relatorios);
router.get('/projetos', TarefaController.projetos);
router.get('/portfolio/projetos', TarefaController.portfolioProjetos);

router.get('/', TarefaController.listar);
router.get('/:id', TarefaController.buscarPorId);
router.post('/', TarefaController.criar);
router.put('/:id', TarefaController.atualizar);
router.delete('/:id', TarefaController.excluir);

module.exports = router;
