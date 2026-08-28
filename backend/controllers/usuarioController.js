const UsuarioModel = require('../models/usuarioModel');

const UsuarioController = {
  async listar(req, res) {
    try {
      const usuarios = await UsuarioModel.findAllAtivos();
      res.json(usuarios);
    } catch (error) {
      console.error('Erro ao listar usuários:', error);
      res.status(500).json({ erro: 'Erro interno ao listar usuários' });
    }
  },
};

module.exports = UsuarioController;
