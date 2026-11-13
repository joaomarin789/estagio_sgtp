-- =====================================================================
-- SGTP - Migracao 001
-- 1) Remove os ON DELETE CASCADE
-- 2) Adiciona exclusao logica (soft delete) em projeto e tarefa
--
-- Execute UMA vez, sobre um banco criado pelo schema.sql original.
-- Nenhuma linha e apagada: as colunas novas recebem o DEFAULT 1
-- (registro ativo) em todas as linhas ja existentes.
--
-- ATENCAO: no MySQL, comandos DDL (ALTER TABLE) fazem COMMIT automatico
-- e nao podem ser desfeitos com ROLLBACK. Faca um backup antes:
--   mysqldump -u root -p sgtp > backup_sgtp.sql
-- =====================================================================

USE sgtp;

SET NAMES utf8mb4;

-- ---------------------------------------------------------------------
-- Passo 1: coluna 'ativo' (soft delete)
-- 1 = registro ativo, 0 = registro excluido logicamente.
-- NOT NULL DEFAULT 1 faz todas as linhas existentes ficarem ativas.
-- ---------------------------------------------------------------------
ALTER TABLE projeto
    ADD COLUMN ativo TINYINT(1) NOT NULL DEFAULT 1 AFTER data_cadastro;

ALTER TABLE tarefa
    ADD COLUMN ativo TINYINT(1) NOT NULL DEFAULT 1 AFTER data_conclusao;

-- ---------------------------------------------------------------------
-- Passo 2: tarefa -> projeto sem CASCADE
-- Antes: excluir um projeto apagava fisicamente todas as tarefas dele.
-- Agora: RESTRICT impede apagar fisicamente um projeto que tenha
-- tarefas; a exclusao passa a ser feita pela aplicacao com ativo = 0.
-- O indice idx_tarefa_projeto continua existindo e e reaproveitado
-- pela nova FK.
-- ---------------------------------------------------------------------
ALTER TABLE tarefa
    DROP FOREIGN KEY fk_tarefa_projeto;

ALTER TABLE tarefa
    ADD CONSTRAINT fk_tarefa_projeto
        FOREIGN KEY (id_projeto) REFERENCES projeto (id_projeto)
        ON DELETE RESTRICT
        ON UPDATE CASCADE;

-- ---------------------------------------------------------------------
-- Passo 3: historico_atividade -> tarefa sem CASCADE
-- Antes: apagar uma tarefa apagava a trilha de auditoria dela, o que
-- contraria o Requisito Especial do UC02. Agora o historico nunca e
-- perdido.
-- ---------------------------------------------------------------------
ALTER TABLE historico_atividade
    DROP FOREIGN KEY fk_historico_tarefa;

ALTER TABLE historico_atividade
    ADD CONSTRAINT fk_historico_tarefa
        FOREIGN KEY (id_tarefa) REFERENCES tarefa (id_tarefa)
        ON DELETE RESTRICT
        ON UPDATE CASCADE;

-- ---------------------------------------------------------------------
-- Conferencia (opcional): todas as linhas devem aparecer com ativo = 1
-- e as FKs devem mostrar DELETE_RULE = RESTRICT.
-- ---------------------------------------------------------------------
-- SELECT ativo, COUNT(*) FROM projeto GROUP BY ativo;
-- SELECT ativo, COUNT(*) FROM tarefa  GROUP BY ativo;
-- SELECT CONSTRAINT_NAME, TABLE_NAME, DELETE_RULE
--   FROM information_schema.REFERENTIAL_CONSTRAINTS
--  WHERE CONSTRAINT_SCHEMA = 'sgtp';
