-- =====================================================================
-- SGTP - Migracao 002
-- 1) Motivo do bloqueio da tarefa (UC03)
-- 2) Novos tipos de acao no historico: ALTERACAO e RESTAURACAO (UC02)
--
-- Execute UMA vez, depois da migracao 001.
-- Nenhuma linha e apagada nem alterada: a coluna nova nasce NULL e os
-- valores novos do ENUM sao apenas acrescentados ao final da lista.
--
-- Faca um backup antes (DDL no MySQL nao tem ROLLBACK).
-- =====================================================================

USE sgtp;

SET NAMES utf8mb4;

-- ---------------------------------------------------------------------
-- Passo 1: motivo do impedimento
-- Preenchido quando a tarefa entra em BLOQUEADA e limpo (NULL) quando
-- ela sai desse estado. O motivo antigo continua no historico.
-- NULL e permitido porque a maioria das tarefas nunca e bloqueada.
-- ---------------------------------------------------------------------
ALTER TABLE tarefa
    ADD COLUMN motivo_bloqueio TEXT NULL AFTER status;

-- ---------------------------------------------------------------------
-- Passo 2: tipos de acao do historico
-- ALTERACAO   = edicao dos dados da tarefa (Sequencia 02, mensagem 3.1.4)
-- RESTAURACAO = restauracao de tarefa excluida (Sequencia 02, 5.1.2)
-- EDICAO continua na lista para nao invalidar os registros antigos.
-- Os valores novos entram no FIM da lista: assim o MySQL nao precisa
-- reescrever as linhas existentes.
-- ---------------------------------------------------------------------
ALTER TABLE historico_atividade
    MODIFY COLUMN acao ENUM('CRIACAO', 'EDICAO', 'EXCLUSAO', 'MUDANCA_STATUS',
                            'ATRIBUICAO', 'ALTERACAO', 'RESTAURACAO')
                       NOT NULL;

-- ---------------------------------------------------------------------
-- Conferencia (opcional)
-- ---------------------------------------------------------------------
-- SHOW COLUMNS FROM tarefa LIKE 'motivo_bloqueio';
-- SHOW COLUMNS FROM historico_atividade LIKE 'acao';
