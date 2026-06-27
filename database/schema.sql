CREATE DATABASE IF NOT EXISTS sgtp_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE sgtp_db;

CREATE TABLE IF NOT EXISTS projetos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nome VARCHAR(150) NOT NULL,
  descricao TEXT,
  status ENUM('ativo', 'pausado', 'concluido', 'cancelado') DEFAULT 'ativo',
  responsavel VARCHAR(100) NOT NULL,
  data_inicio DATE NOT NULL,
  data_fim DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS tarefas (
  id INT AUTO_INCREMENT PRIMARY KEY,
  titulo VARCHAR(200) NOT NULL,
  descricao TEXT,
  prioridade ENUM('baixa', 'media', 'alta', 'critica') DEFAULT 'media',
  status ENUM('pendente', 'em_andamento', 'concluida', 'bloqueada') DEFAULT 'pendente',
  responsavel VARCHAR(100) NOT NULL,
  prazo DATE NOT NULL,
  projeto_id INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (projeto_id) REFERENCES projetos(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS atividades (
  id INT AUTO_INCREMENT PRIMARY KEY,
  tarefa_id INT,
  acao VARCHAR(100) NOT NULL,
  descricao TEXT NOT NULL,
  usuario VARCHAR(100) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tarefa_id) REFERENCES tarefas(id) ON DELETE SET NULL
);

INSERT INTO projetos (nome, descricao, status, responsavel, data_inicio, data_fim) VALUES
('Modernização ERP', 'Migração e atualização do módulo financeiro corporativo', 'ativo', 'Ana Costa', '2025-01-15', '2026-06-30'),
('Portal do Cliente', 'Desenvolvimento do portal self-service para clientes B2B', 'ativo', 'Carlos Mendes', '2025-03-01', '2026-04-15'),
('Integração SAP', 'Integração bidirecional com sistema SAP ECC', 'ativo', 'Mariana Silva', '2025-06-01', '2026-08-30'),
('Compliance LGPD', 'Adequação de processos e sistemas à LGPD', 'ativo', 'Roberto Alves', '2025-02-10', '2026-03-31'),
('Data Warehouse', 'Construção do data warehouse corporativo', 'pausado', 'Fernanda Lima', '2024-09-01', '2026-12-31'),
('Automação RH', 'Automação de processos de folha de pagamento', 'concluido', 'Paulo Santos', '2024-06-01', '2025-05-30');

INSERT INTO tarefas (titulo, descricao, prioridade, status, responsavel, prazo, projeto_id) VALUES
('Mapeamento de requisitos financeiros', 'Levantamento completo dos requisitos do módulo financeiro', 'alta', 'concluida', 'Ana Costa', '2025-02-28', 1),
('Configuração ambiente SAP DEV', 'Setup do ambiente de desenvolvimento SAP', 'critica', 'em_andamento', 'Mariana Silva', '2026-03-15', 3),
('Design UI Portal Cliente', 'Prototipação das telas principais do portal', 'alta', 'em_andamento', 'Carlos Mendes', '2026-04-01', 2),
('Auditoria de dados pessoais', 'Mapeamento de bases com dados pessoais', 'critica', 'em_andamento', 'Roberto Alves', '2026-03-20', 4),
('Testes integração API', 'Testes de integração entre sistemas', 'media', 'pendente', 'Mariana Silva', '2026-04-10', 3),
('Documentação técnica ERP', 'Documentação dos módulos migrados', 'baixa', 'pendente', 'Ana Costa', '2026-05-01', 1),
('Revisão contratos LGPD', 'Revisão jurídica dos contratos de tratamento', 'alta', 'bloqueada', 'Roberto Alves', '2026-03-25', 4),
('Deploy homologação portal', 'Deploy do portal em ambiente de homologação', 'media', 'pendente', 'Carlos Mendes', '2026-04-20', 2),
('Migração tabelas DW', 'Migração das tabelas dimensionais', 'media', 'bloqueada', 'Fernanda Lima', '2026-05-15', 5),
('Treinamento equipe ERP', 'Capacitação da equipe no novo módulo', 'baixa', 'concluida', 'Ana Costa', '2025-12-15', 1),
('Implementação SSO', 'Single Sign-On para portal corporativo', 'alta', 'concluida', 'Carlos Mendes', '2025-11-30', 2),
('Validação relatórios SAP', 'Validação dos relatórios exportados do SAP', 'critica', 'em_andamento', 'Mariana Silva', '2026-03-30', 3),
('Backup policy review', 'Revisão das políticas de backup', 'media', 'concluida', 'Paulo Santos', '2025-10-15', 6),
('Análise de performance API', 'Profiling e otimização de endpoints', 'alta', 'pendente', 'Carlos Mendes', '2026-04-05', 2),
('Certificação ISO 27001', 'Preparação para auditoria ISO', 'critica', 'em_andamento', 'Roberto Alves', '2026-06-01', 4);

INSERT INTO atividades (tarefa_id, acao, descricao, usuario) VALUES
(2, 'Atualização', 'Ambiente DEV configurado com 85% de conclusão', 'Mariana Silva'),
(4, 'Revisão', 'Auditoria iniciada - 120 bases mapeadas', 'Roberto Alves'),
(12, 'Validação', 'Relatório de vendas validado com sucesso', 'Mariana Silva'),
(3, 'Design', 'Wireframes aprovados pelo comitê executivo', 'Carlos Mendes'),
(7, 'Bloqueio', 'Aguardando parecer jurídico externo', 'Roberto Alves'),
(1, 'Conclusão', 'Requisitos financeiros aprovados pela diretoria', 'Ana Costa'),
(10, 'Conclusão', 'Treinamento realizado com 45 participantes', 'Ana Costa'),
(15, 'Início', 'Kick-off da preparação ISO 27001', 'Roberto Alves'),
(5, 'Criação', 'Plano de testes de integração elaborado', 'Mariana Silva'),
(8, 'Agendamento', 'Deploy agendado para 20/04/2026', 'Carlos Mendes');
