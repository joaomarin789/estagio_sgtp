const pool = require('../config/db');

const UsuarioModel = {
  async findAllAtivos() {
    const [rows] = await pool.execute(
      `SELECT id_usuario, nome, email, perfil FROM usuario WHERE ativo = TRUE ORDER BY nome`
    );
    return rows;
  },

  // Sequencia 01, mensagem 2.1.1. Devolve o usuario mesmo que inativo:
  // quem chama confere o campo 'ativo' para decidir se ele pode ser usado.
  // A senha (senha_hash) nunca e devolvida.
  async buscarPorId(id) {
    const [rows] = await pool.execute(
      `SELECT id_usuario, nome, email, perfil, ativo FROM usuario WHERE id_usuario = ?`,
      [id]
    );
    return rows[0];
  },
};

module.exports = UsuarioModel;
