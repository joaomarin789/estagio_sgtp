# SGTP — Sistema de Gerenciamento de Tarefas e Projetos

Plataforma corporativa de gestão operacional com visual inspirado em ERPs empresariais (SAP, Oracle). CRUD funcional com persistência real em MySQL.

## Stack

| Camada    | Tecnologias                          |
|-----------|--------------------------------------|
| Frontend  | React, TypeScript, Vite, Axios, Recharts |
| Backend   | Node.js, Express                     |
| Banco     | MySQL                                |

## Estrutura do Projeto

```
Crud_Estágio/
├── backend/
│   ├── config/          # Configuração do banco
│   ├── controllers/     # Lógica de requisições
│   ├── models/          # Acesso a dados
│   ├── routes/          # Rotas REST
│   ├── server.js        # Entry point
│   └── .env             # Variáveis de ambiente
├── frontend/
│   └── src/
│       ├── components/  # Layout e UI
│       ├── pages/       # Dashboard, Tarefas, Relatórios
│       ├── services/    # API (Axios)
│       └── types/       # Tipagens TypeScript
└── database/
    ├── schema.sql       # Script SQL completo (estrutura, baseado no DER)
    └── seed.sql         # Dados de exemplo (opcional, para demonstração)
```

## Pré-requisitos

- Node.js 18+
- MySQL 8.0+

## Instalação

### 1. Banco de Dados

Execute o script de estrutura e, se quiser dados de exemplo para demonstração, o seed:

```bash
mysql -u root -p --default-character-set=utf8mb4 < database/schema.sql
mysql -u root -p --default-character-set=utf8mb4 < database/seed.sql
```

> No Windows, o cliente `mysql` costuma usar a codepage do console em vez de
> UTF-8 por padrão, o que corrompe acentos (nomes, descrições) de forma
> silenciosa durante a importação. A flag `--default-character-set=utf8mb4`
> evita isso — não pule esse parâmetro.

Ou importe manualmente os arquivos via MySQL Workbench / phpMyAdmin, na mesma ordem.

> O banco criado chama-se `sgtp` (schema DER, normalizado com tabela `usuario`,
> chaves estrangeiras e trilha de auditoria em `historico_atividade`). Se você
> tinha um banco `sgtp_db` de uma versão anterior, pode apagá-lo depois de
> confirmar que a aplicação está funcionando com o `sgtp`.

### 2. Backend

```bash
cd backend
npm install
```

Configure o arquivo `.env` (copie de `.env.example` se necessário):

```env
PORT=3001
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=sua_senha
DB_NAME=sgtp
```

Inicie o servidor:

```bash
npm run dev
```

O backend estará disponível em `http://localhost:3001`.

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

O frontend estará disponível em `http://localhost:5173`.

## Endpoints REST

| Método | Rota                  | Descrição              |
|--------|-----------------------|------------------------|
| GET    | /api/tarefas          | Listar tarefas (com filtros) |
| GET    | /api/tarefas/:id      | Buscar tarefa por ID   |
| POST   | /api/tarefas          | Criar tarefa           |
| PUT    | /api/tarefas/:id      | Atualizar tarefa       |
| DELETE | /api/tarefas/:id      | Excluir tarefa         |
| GET    | /api/tarefas/dashboard | Dados do dashboard    |
| GET    | /api/tarefas/relatorios | Dados dos relatórios |
| GET    | /api/tarefas/projetos  | Listar projetos ativos (dropdown do modal de tarefa) |
| GET    | /api/projetos          | Listar projetos (filtros: busca, status, prioridade) |
| GET    | /api/projetos/:id      | Buscar projeto por ID  |
| POST   | /api/projetos          | Criar projeto          |
| PUT    | /api/projetos/:id      | Atualizar projeto      |
| DELETE | /api/projetos/:id      | Excluir projeto (retorna `tarefas_afetadas` — cascata) |
| GET    | /api/usuarios          | Listar usuários ativos (para atribuir responsável) |
| GET    | /api/health           | Health check           |

### Filtros (GET /api/tarefas)

- `busca` — pesquisa por título, descrição ou responsável
- `status` — pendente, em_andamento, concluida, bloqueada
- `prioridade` — baixa, media, alta, critica
- `responsavel` — filtro por responsável

## Módulos

### Dashboard Executivo
KPIs, pipeline operacional, entregas críticas, capacidade da equipe, atividades recentes e gráfico de produtividade.

### Central de Tarefas
CRUD completo com campos: título, descrição, prioridade, status, responsável, prazo e projeto. Inclui pesquisa e filtros.

### Relatórios Operacionais
Taxa de conclusão, Lead Time, SLA, eficiência operacional e gráficos analíticos.

## Licença

Projeto acadêmico — uso educacional.
