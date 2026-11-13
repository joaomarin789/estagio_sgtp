import { useEffect, useState } from 'react';
import { getUsuarioAtualId, setUsuarioAtualId, usuarioService } from '../../services/api';
import type { Usuario } from '../../types';

/**
 * Seletor "Usuário atual", exibido no topo de todas as telas.
 * O sistema nao tem login: o usuario escolhido aqui e enviado em cada
 * requisicao (ver interceptor em services/api.ts). O backend usa esse
 * usuario como autor no historico e para a regra do UC03 de que so o
 * responsavel pela tarefa atualiza o andamento.
 */
export default function UsuarioAtual() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [atual, setAtual] = useState<number | null>(getUsuarioAtualId());

  useEffect(() => {
    usuarioService.listar()
      .then((lista) => {
        setUsuarios(lista);
        // Sem escolha anterior (ou usuario que nao esta mais ativo): assume o primeiro.
        if (lista.length > 0 && !lista.some((u) => u.id_usuario === getUsuarioAtualId())) {
          setUsuarioAtualId(lista[0].id_usuario);
          setAtual(lista[0].id_usuario);
        }
      })
      .catch(() => setUsuarios([]));
  }, []);

  const trocar = (id: number) => {
    setUsuarioAtualId(id);
    setAtual(id);
  };

  return (
    <div className="user-bar">
      <label htmlFor="usuario-atual">Usuário atual</label>
      <select
        id="usuario-atual"
        className="status-select"
        value={atual ?? ''}
        onChange={(e) => trocar(Number(e.target.value))}
      >
        {usuarios.map((u) => (
          <option key={u.id_usuario} value={u.id_usuario}>
            {u.nome}{u.perfil ? ` (${u.perfil.toLowerCase()})` : ''}
          </option>
        ))}
      </select>
    </div>
  );
}
