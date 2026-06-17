"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import ProtecaoModulo from "@/components/ProtecaoModulo";

const perfis = [
  "ADMIN",
  "COMANDANTE",
  "DIRETOR",
  "CMT_GUARNICAO",
  "PLANTONISTA",
  "GUARDA",
  "CONSULTA",
];

const modulos = [
  "dashboard",
  "guardas",
  "dossie_guarda",
  "documentos",
  "ocorrencias",
  "escalas",
  "relatorios",
  "administracao",
  "configuracoes",
  "usuarios",
  "municipios",
  "desenvolvedor",
  "avisos",
  "viaturas",
  "patrulhamento",
  "chamados",
  "permutas",
  "legislacao",
  "ia",
  "locais",
  "estatisticas",
];

export default function PermissoesPage() {
  const [perfilSelecionado, setPerfilSelecionado] = useState("GUARDA");
  const [permissoes, setPermissoes] = useState<any[]>([]);
  const [carregando, setCarregando] = useState(false);

  useEffect(() => {
    carregarPermissoes();
  }, [perfilSelecionado]);

  async function carregarPermissoes() {
    setCarregando(true);

    const { data } = await supabase
      .from("permissoes_perfis")
      .select("*")
      .eq("perfil", perfilSelecionado)
      .order("modulo");

    setPermissoes(data || []);
    setCarregando(false);
  }

  function valorPermissao(modulo: string, campo: string) {
    const item = permissoes.find((p) => p.modulo === modulo);
    return Boolean(item?.[campo]);
  }

  async function alterarPermissao(
    modulo: string,
    campo: "pode_ver" | "pode_criar" | "pode_editar" | "pode_excluir",
    valor: boolean
  ) {
    const existente = permissoes.find((p) => p.modulo === modulo);

    if (existente) {
      await supabase
        .from("permissoes_perfis")
        .update({ [campo]: valor })
        .eq("perfil", perfilSelecionado)
        .eq("modulo", modulo);
    } else {
      await supabase.from("permissoes_perfis").insert({
        perfil: perfilSelecionado,
        modulo,
        pode_ver: campo === "pode_ver" ? valor : false,
        pode_criar: campo === "pode_criar" ? valor : false,
        pode_editar: campo === "pode_editar" ? valor : false,
        pode_excluir: campo === "pode_excluir" ? valor : false,
      });
    }

    carregarPermissoes();
  }

  return (
    <ProtecaoModulo modulo="permissoes">
      <div className="p-6 text-white">
        <h1 className="text-3xl font-black mb-2">
          🔐 Permissões de Acesso
        </h1>

        <p className="text-slate-400 mb-6">
          Defina o que cada perfil pode ver, criar, editar ou excluir.
        </p>

        <div className="painel-premium p-5 mb-6">
          <label className="label">Perfil</label>

          <select
            className="input max-w-md"
            value={perfilSelecionado}
            onChange={(e) => setPerfilSelecionado(e.target.value)}
          >
            {perfis.map((perfil) => (
              <option key={perfil} value={perfil}>
                {perfil}
              </option>
            ))}
          </select>
        </div>

        <div className="painel-premium p-5 overflow-x-auto">
          {carregando ? (
            <p className="text-slate-400">Carregando permissões...</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="border-b border-slate-700 text-slate-400">
                <tr>
                  <th className="text-left py-3">Módulo</th>
                  <th className="text-center py-3">Ver</th>
                  <th className="text-center py-3">Criar</th>
                  <th className="text-center py-3">Editar</th>
                  <th className="text-center py-3">Excluir</th>
                </tr>
              </thead>

              <tbody>
                {modulos.map((modulo) => (
                  <tr key={modulo} className="border-b border-slate-800">
                    <td className="py-4 font-bold text-blue-400">
                      {modulo}
                    </td>

                    {["pode_ver", "pode_criar", "pode_editar", "pode_excluir"].map(
                      (campo) => (
                        <td key={campo} className="text-center">
                          <input
                            type="checkbox"
                            checked={valorPermissao(modulo, campo)}
                            onChange={(e) =>
                              alterarPermissao(
                                modulo,
                                campo as any,
                                e.target.checked
                              )
                            }
                            className="w-5 h-5"
                          />
                        </td>
                      )
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </ProtecaoModulo>
  );
}