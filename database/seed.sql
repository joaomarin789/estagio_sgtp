-- =====================================================================
-- SGTP - Dados de exemplo (seed) para o schema DER (schema.sql)
-- Execute APOS o schema.sql, no mesmo banco.
-- Datas calculadas em relacao a 2026-08-27; ajuste se necessario.
-- =====================================================================

USE sgtp;

-- Garante que os acentos dos INSERTs sejam lidos como UTF-8 na importacao
SET NAMES utf8mb4;

-- ---------------------------------------------------------------------
-- Usuarios
-- senha_hash e um valor ficticio: nao ha tela de login/autenticacao
-- implementada nesta versao, o campo existe apenas para satisfazer
-- a coluna NOT NULL do schema.
-- ---------------------------------------------------------------------
INSERT INTO usuario (nome, email, senha_hash, perfil) VALUES
('João Pedro De Souza Marin', 'joao.pedro@sgtp.com', '$2a$10$seedPlaceholderHashNaoUtilizado', 'ADMINISTRADOR'),
('Ana Costa',                 'ana.costa@sgtp.com',   '$2a$10$seedPlaceholderHashNaoUtilizado', 'GERENCIADOR'),
('Carlos Mendes',             'carlos.mendes@sgtp.com','$2a$10$seedPlaceholderHashNaoUtilizado', 'COLABORADOR'),
('Mariana Silva',             'mariana.silva@sgtp.com','$2a$10$seedPlaceholderHashNaoUtilizado', 'COLABORADOR'),
('Roberto Alves',             'roberto.alves@sgtp.com','$2a$10$seedPlaceholderHashNaoUtilizado', 'COLABORADOR'),
('Fernanda Lima',             'fernanda.lima@sgtp.com','$2a$10$seedPlaceholderHashNaoUtilizado', 'COLABORADOR'),
('Paulo Santos',              'paulo.santos@sgtp.com', '$2a$10$seedPlaceholderHashNaoUtilizado', 'COLABORADOR');

-- ids gerados: 1 Joao Pedro, 2 Ana Costa, 3 Carlos Mendes,
-- 4 Mariana Silva, 5 Roberto Alves, 6 Fernanda Lima, 7 Paulo Santos

-- ---------------------------------------------------------------------
-- Projetos
-- ---------------------------------------------------------------------
INSERT INTO projeto (nome, descricao, data_inicio, data_termino_prevista, status, prioridade, id_responsavel) VALUES
('Modernização ERP',      'Migração e atualização do módulo financeiro corporativo', '2026-02-15', '2026-12-30', 'EM_ANDAMENTO', 'ALTA',    2),
('Portal do Cliente',     'Desenvolvimento do portal self-service para clientes B2B', '2026-04-01', '2026-11-15', 'EM_ANDAMENTO', 'MEDIA',   3),
('Integração SAP',        'Integração bidirecional com sistema SAP ECC',              '2026-05-01', '2027-01-30', 'EM_ANDAMENTO', 'URGENTE', 4),
('Compliance LGPD',       'Adequação de processos e sistemas à LGPD',                 '2026-03-10', '2026-10-31', 'EM_ANDAMENTO', 'ALTA',    5),
('Data Warehouse',        'Construção do data warehouse corporativo',                 '2026-01-01', '2027-03-31', 'PAUSADO',      'MEDIA',   6),
('Automação RH',          'Automação de processos de folha de pagamento',             '2025-10-01', '2026-06-30', 'CONCLUIDO',    'BAIXA',   7);

-- ids gerados: 1 ERP, 2 Portal Cliente, 3 SAP, 4 LGPD, 5 DW, 6 RH

-- ---------------------------------------------------------------------
-- Tarefas
-- ---------------------------------------------------------------------
INSERT INTO tarefa (titulo, descricao, prioridade, status, prazo, id_projeto, id_responsavel, data_criacao, data_conclusao) VALUES
('Mapeamento de requisitos financeiros', 'Levantamento completo dos requisitos do módulo financeiro', 'ALTA',    'CONCLUIDA',    '2026-03-10', 1, 2, '2026-02-20', '2026-03-08'),
('Configuração ambiente SAP DEV',        'Setup do ambiente de desenvolvimento SAP',                  'CRITICA', 'EM_ANDAMENTO', '2026-09-05', 3, 4, '2026-07-01', NULL),
('Design UI Portal Cliente',             'Prototipação das telas principais do portal',               'ALTA',    'EM_ANDAMENTO', '2026-09-20', 2, 3, '2026-07-10', NULL),
('Auditoria de dados pessoais',          'Mapeamento de bases com dados pessoais',                    'CRITICA', 'EM_ANDAMENTO', '2026-09-02', 4, 5, '2026-07-15', NULL),
('Testes integração API',                'Testes de integração entre sistemas',                       'MEDIA',   'PENDENTE',     '2026-09-25', 3, 4, '2026-08-01', NULL),
('Documentação técnica ERP',             'Documentação dos módulos migrados',                         'BAIXA',   'PENDENTE',     '2026-10-05', 1, 2, '2026-08-05', NULL),
('Revisão contratos LGPD',               'Revisão jurídica dos contratos de tratamento',              'ALTA',    'BLOQUEADA',    '2026-09-01', 4, 5, '2026-06-20', NULL),
('Deploy homologação portal',            'Deploy do portal em ambiente de homologação',               'MEDIA',   'PENDENTE',     '2026-09-15', 2, 3, '2026-08-10', NULL),
('Migração tabelas DW',                  'Migração das tabelas dimensionais',                         'MEDIA',   'BLOQUEADA',    '2026-10-01', 5, 6, '2026-05-20', NULL),
('Treinamento equipe ERP',               'Capacitação da equipe no novo módulo',                      'BAIXA',   'CONCLUIDA',    '2026-06-20', 1, 2, '2026-06-01', '2026-06-18'),
('Implementação SSO',                    'Single Sign-On para portal corporativo',                    'ALTA',    'CONCLUIDA',    '2026-05-15', 2, 3, '2026-04-05', '2026-05-14'),
('Validação relatórios SAP',             'Validação dos relatórios exportados do SAP',                'CRITICA', 'EM_ANDAMENTO', '2026-09-08', 3, 4, '2026-07-25', NULL),
('Backup policy review',                 'Revisão das políticas de backup',                           'MEDIA',   'CONCLUIDA',    '2026-01-25', 6, 7, '2026-01-05', '2026-01-20'),
('Análise de performance API',           'Profiling e otimização de endpoints',                       'ALTA',    'PENDENTE',     '2026-09-10', 2, 3, '2026-08-15', NULL),
('Certificação ISO 27001',               'Preparação para auditoria ISO',                             'CRITICA', 'EM_ANDAMENTO', '2026-10-15', 4, 5, '2026-08-20', NULL);

-- ids gerados: 1..15 na mesma ordem acima

-- ---------------------------------------------------------------------
-- Historico de atividades
-- ---------------------------------------------------------------------
INSERT INTO historico_atividade (acao, campo_alterado, valor_anterior, valor_novo, descricao, id_usuario, id_tarefa) VALUES
('EDICAO',         NULL,     NULL,            NULL,            'Ambiente DEV configurado com 85% de conclusão', 4, 2),
('EDICAO',         NULL,     NULL,            NULL,            'Auditoria iniciada - 120 bases mapeadas', 5, 4),
('MUDANCA_STATUS', 'status', 'PENDENTE',      'EM_ANDAMENTO',  'Relatório de vendas validado com sucesso', 4, 12),
('EDICAO',         NULL,     NULL,            NULL,            'Wireframes aprovados pelo comitê executivo', 3, 3),
('MUDANCA_STATUS', 'status', 'EM_ANDAMENTO',  'BLOQUEADA',     'Tarefa "Revisão contratos LGPD" — status alterado para BLOQUEADA — aguardando parecer jurídico externo', 5, 7),
('MUDANCA_STATUS', 'status', 'EM_ANDAMENTO',  'CONCLUIDA',     'Tarefa "Mapeamento de requisitos financeiros" — status alterado para CONCLUIDA — requisitos aprovados pela diretoria', 2, 1),
('MUDANCA_STATUS', 'status', 'EM_ANDAMENTO',  'CONCLUIDA',     'Treinamento realizado com 45 participantes', 2, 10),
('CRIACAO',        NULL,     NULL,            NULL,            'Kick-off da preparação ISO 27001', 5, 15),
('CRIACAO',        NULL,     NULL,            NULL,            'Plano de testes de integração elaborado', 4, 5),
('EDICAO',         NULL,     NULL,            NULL,            'Deploy agendado', 3, 8);
