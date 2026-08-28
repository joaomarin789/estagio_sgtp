const pool = require('../config/db');

const UsuarioModel = {
  async findAllAtivos() {
    const [rows] = await pool.execute(
      `SELECT id_usuario, nome, email, perfil FROM usuario WHERE ativo = TRUE ORDER BY nome`
    );
    return rows;
  },
};

module.exports = UsuarioModel;
