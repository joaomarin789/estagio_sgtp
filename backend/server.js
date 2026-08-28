require('dotenv').config({ path: require('path').join(__dirname, '.env') });

const express = require('express');
const cors = require('cors');

const tarefaRoutes = require('./routes/tarefaRoutes');
const usuarioRoutes = require('./routes/usuarioRoutes');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', sistema: 'SGTP - Sistema de Gerenciamento de Tarefas e Projetos' });
});

app.use('/api/tarefas', tarefaRoutes);
app.use('/api/usuarios', usuarioRoutes);

app.use((_req, res) => {
  res.status(404).json({ erro: 'Rota não encontrada' });
});

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ erro: 'Erro interno do servidor' });
});

const server = app.listen(PORT, () => {
  console.log(`SGTP Backend rodando em http://localhost:${PORT}`);
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`\nErro: a porta ${PORT} já está em uso.`);
    console.error('Feche a outra instância do backend ou altere PORT no arquivo .env\n');
    process.exit(1);
  }
  throw err;
});
