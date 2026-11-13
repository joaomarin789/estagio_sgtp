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

  // Middleware registrado no server.js, antes das rotas.
  // O sistema nao tem login: o frontend envia no cabecalho X-Usuario-Id o
  // usuario escolhido no seletor "Usuário atual". Aqui ele e conferido no
  // banco e colocado em req.usuario (ou null, se ausente ou inativo).
  // Cada controller decide se a operacao exige ou nao um usuario.
  async identificar(req, res, next) {
    try {
      const id = Number(req.get('X-Usuario-Id'));
      const usuario = Number.isInteger(id) && id > 0 ? await UsuarioModel.buscarPorId(id) : null;
      req.usuario = usuario && usuario.ativo ? usuario : null;
      next();
    } catch (error) {
      next(error);
    }
  },
};

module.exports = UsuarioController;
