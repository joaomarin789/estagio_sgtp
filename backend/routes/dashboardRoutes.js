const express = require('express');
const router = express.Router();
const DashboardController = require('../controllers/dashboardController');

router.get('/', DashboardController.indicadores);
router.get('/tarefas', DashboardController.tarefasPorStatus);

module.exports = router;
