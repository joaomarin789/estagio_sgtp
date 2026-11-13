const express = require('express');
const router = express.Router();
const ProjetoController = require('../controllers/projetoController');

router.get('/', ProjetoController.listar);
router.get('/:id', ProjetoController.buscarPorId);
router.get('/:id/tarefas-vinculadas', ProjetoController.contarTarefasVinculadas);
router.post('/', ProjetoController.criar);
router.put('/:id', ProjetoController.atualizar);
router.delete('/:id', ProjetoController.excluir);
router.patch('/:id/restaurar', ProjetoController.restaurar);

module.exports = router;
