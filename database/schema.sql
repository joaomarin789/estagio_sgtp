-- =====================================================================
-- SGTP - Sistema de Gerenciamento de Tarefas e Projetos
-- Script de criacao do banco de dados (MySQL 8.x)
-- Autor: Joao Pedro De Souza Marin
-- =====================================================================

CREATE DATABASE IF NOT EXISTS sgtp
    DEFAULT CHARACTER SET utf8mb4
    DEFAULT COLLATE utf8mb4_unicode_ci;

USE sgtp;

-- ---------------------------------------------------------------------
-- Tabela: usuario
-- Armazena todos os usuarios do sistema. O campo 'perfil' define o
-- nivel de acesso, correspondendo aos tres atores do diagrama de
-- caso de uso.
-- ---------------------------------------------------------------------
CREATE TABLE usuario (
    id_usuario      INT             NOT NULL AUTO_INCREMENT,
    nome            VARCHAR(120)    NOT NULL,
    email           VARCHAR(150)    NOT NULL,
    senha_hash      VARCHAR(255)    NOT NULL,
    perfil          ENUM('ADMINISTRADOR', 'GERENCIADOR', 'COLABORADOR')
                                    NOT NULL DEFAULT 'COLABORADOR',
    ativo           BOOLEAN         NOT NULL DEFAULT TRUE,
    data_cadastro   DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT pk_usuario PRIMARY KEY (id_usuario),
    CONSTRAINT uk_usuario_email UNIQUE (email)
) ENGINE = InnoDB;

-- ---------------------------------------------------------------------
-- Tabela: projeto
-- Corresponde ao UC01 - Gerenciar Projetos.
-- ---------------------------------------------------------------------
CREATE TABLE projeto (
    id_projeto              INT             NOT NULL AUTO_INCREMENT,
    nome                    VARCHAR(150)    NOT NULL,
    descricao               TEXT            NULL,
    data_inicio             DATE            NOT NULL,
    data_termino_prevista   DATE            NULL,
    status                  ENUM('NAO_INICIADO', 'EM_ANDAMENTO', 'PAUSADO',
                                 'CONCLUIDO', 'CANCELADO')
                                            NOT NULL DEFAULT 'NAO_INICIADO',
    prioridade              ENUM('BAIXA', 'MEDIA', 'ALTA', 'URGENTE')
                                            NOT NULL DEFAULT 'MEDIA',
    id_responsavel          INT             NOT NULL,
    data_cadastro           DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT pk_projeto PRIMARY KEY (id_projeto),
    CONSTRAINT fk_projeto_responsavel
        FOREIGN KEY (id_responsavel) REFERENCES usuario (id_usuario)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,
    CONSTRAINT ck_projeto_datas
        CHECK (data_termino_prevista IS NULL
               OR data_termino_prevista >= data_inicio)
) ENGINE = InnoDB;

CREATE INDEX idx_projeto_status ON projeto (status);
CREATE INDEX idx_projeto_responsavel ON projeto (id_responsavel);

-- ---------------------------------------------------------------------
-- Tabela: tarefa
-- Corresponde ao UC02 - Gerenciar Backlog Operacional (CRUD principal)
-- e ao UC03 - Atualizar Andamento da Tarefa.
-- ---------------------------------------------------------------------
CREATE TABLE tarefa (
    id_tarefa       INT             NOT NULL AUTO_INCREMENT,
    titulo          VARCHAR(150)    NOT NULL,
    descricao       TEXT            NULL,
    prioridade      ENUM('BAIXA', 'MEDIA', 'ALTA', 'CRITICA')
                                    NOT NULL DEFAULT 'MEDIA',
    status          ENUM('PENDENTE', 'EM_ANDAMENTO', 'CONCLUIDA', 'BLOQUEADA')
                                    NOT NULL DEFAULT 'PENDENTE',
    prazo           DATE            NULL,
    id_projeto      INT             NOT NULL,
    id_responsavel  INT             NULL,
    data_criacao    DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    data_conclusao  DATETIME        NULL,

    CONSTRAINT pk_tarefa PRIMARY KEY (id_tarefa),
    CONSTRAINT fk_tarefa_projeto
        FOREIGN KEY (id_projeto) REFERENCES projeto (id_projeto)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    CONSTRAINT fk_tarefa_responsavel
        FOREIGN KEY (id_responsavel) REFERENCES usuario (id_usuario)
        ON DELETE SET NULL
        ON UPDATE CASCADE
) ENGINE = InnoDB;

CREATE INDEX idx_tarefa_status ON tarefa (status);
CREATE INDEX idx_tarefa_prazo ON tarefa (prazo);
CREATE INDEX idx_tarefa_projeto ON tarefa (id_projeto);
CREATE INDEX idx_tarefa_responsavel ON tarefa (id_responsavel);

-- ---------------------------------------------------------------------
-- Tabela: historico_atividade
-- Trilha de auditoria exigida no Requisito Especial do UC02.
-- Registra QUEM executou a acao (id_usuario), QUANDO (data_hora),
-- QUE TIPO de acao foi (acao) e O QUE MUDOU (campo_alterado +
-- valor_anterior + valor_novo), permitindo reconstruir toda a linha
-- do tempo de uma tarefa.
-- ---------------------------------------------------------------------
CREATE TABLE historico_atividade (
    id_historico    INT             NOT NULL AUTO_INCREMENT,
    acao            ENUM('CRIACAO', 'EDICAO', 'EXCLUSAO', 'MUDANCA_STATUS',
                         'ATRIBUICAO')
                                    NOT NULL,
    campo_alterado  VARCHAR(50)     NULL,
    valor_anterior  VARCHAR(100)    NULL,
    valor_novo      VARCHAR(100)    NULL,
    descricao       VARCHAR(255)    NULL,
    data_hora       DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    id_usuario      INT             NOT NULL,
    id_tarefa       INT             NULL,

    CONSTRAINT pk_historico PRIMARY KEY (id_historico),
    CONSTRAINT fk_historico_usuario
        FOREIGN KEY (id_usuario) REFERENCES usuario (id_usuario)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,
    CONSTRAINT fk_historico_tarefa
        FOREIGN KEY (id_tarefa) REFERENCES tarefa (id_tarefa)
        ON DELETE CASCADE
        ON UPDATE CASCADE
) ENGINE = InnoDB;

CREATE INDEX idx_historico_data ON historico_atividade (data_hora);
CREATE INDEX idx_historico_tarefa ON historico_atividade (id_tarefa);
