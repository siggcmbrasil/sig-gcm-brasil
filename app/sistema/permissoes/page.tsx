"use client";

import { useEffect, useState } from "react";
import {
  CheckCircle,
  Eye,
  LockKeyhole,
  Pencil,
  PlusCircle,
  ShieldCheck,
  Trash2,
  UserCog,
} from "lucide-react";

import { supabase } from "@/lib/supabase";
import ProtecaoModulo from "@/components/ProtecaoModulo";
import SigCard from "@/components/sig/SigCard";
import SigPageHeader from "@/components/sig/SigPageHeader";

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
  "api_publica",
  "integracoes",
  "backup",
  "importador_dados",
  "exportador_dados",
  "migracao_dados",
  "projetos",
];

type CampoPermissao =
  | "pode_ver"
  | "pode_criar"
  | "pode_editar"
  | "pode_excluir";

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

  function valorPermissao(modulo: string, campo: CampoPermissao) {
    const item = permissoes.find((p) => p.modulo === modulo);
    return Boolean(item?.[campo]);
  }

  async function alterarPermissao(
    modulo: string,
    campo: CampoPermissao,
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
      <div className="p-4 md:p-6 pb-24 space-y-6">
        <SigPageHeader
          titulo="Permissões de Acesso"
          subtitulo="Defina o que cada perfil pode ver, criar, editar ou excluir."
          icone={LockKeyhole}
        />

        <SigCard>
          <div className="flex items-start gap-4">
            <div className="rounded-2xl bg-yellow-500/10 border border-yellow-500/30 p-4">
              <UserCog className="w-10 h-10 text-yellow-400" />
            </div>

            <div>
              <p className="text-xs uppercase tracking-[0.25em] text-yellow-400 font-bold">
                Controle por Perfil
              </p>

              <h2 className="text-2xl md:text-3xl font-black text-white mt-1">
                Matriz de Permissões
              </h2>

              <p className="text-slate-400 mt-2 max-w-3xl leading-relaxed">
                Configure o acesso de cada perfil aos módulos do SIG-GCM Brasil,
                mantendo segurança, auditoria e separação de responsabilidades.
              </p>
            </div>
          </div>
        </SigCard>

        <div className="grid md:grid-cols-4 gap-4">
          <SigCard>
            <Eye className="w-8 h-8 text-yellow-400 mb-3" />
            <h3 className="text-lg font-black text-white">Ver</h3>
            <p className="text-sm text-slate-400 mt-2">
              Permite visualizar o módulo.
            </p>
          </SigCard>

          <SigCard>
            <PlusCircle className="w-8 h-8 text-emerald-400 mb-3" />
            <h3 className="text-lg font-black text-white">Criar</h3>
            <p className="text-sm text-slate-400 mt-2">
              Permite cadastrar registros.
            </p>
          </SigCard>

          <SigCard>
            <Pencil className="w-8 h-8 text-blue-400 mb-3" />
            <h3 className="text-lg font-black text-white">Editar</h3>
            <p className="text-sm text-slate-400 mt-2">
              Permite alterar registros.
            </p>
          </SigCard>

          <SigCard>
            <Trash2 className="w-8 h-8 text-red-400 mb-3" />
            <h3 className="text-lg font-black text-white">Excluir</h3>
            <p className="text-sm text-slate-400 mt-2">
              Permite remover registros.
            </p>
          </SigCard>
        </div>

        <SigCard>
          <label className="block text-sm font-bold text-slate-300 mb-2">
            Perfil
          </label>

          <select
            className="w-full max-w-md rounded-xl border border-slate-700 bg-slate-900 p-3 text-sm text-white"
            value={perfilSelecionado}
            onChange={(e) => setPerfilSelecionado(e.target.value)}
          >
            {perfis.map((perfil) => (
              <option key={perfil} value={perfil}>
                {perfil}
              </option>
            ))}
          </select>
        </SigCard>

        <SigCard>
          <div className="flex items-center gap-2 mb-5">
            <ShieldCheck className="w-6 h-6 text-yellow-400" />
            <h3 className="text-xl font-black text-white">
              Permissões do Perfil {perfilSelecionado}
            </h3>
          </div>

          {carregando ? (
            <p className="text-slate-400">Carregando permissões...</p>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-slate-800">
              <table className="w-full text-sm">
                <thead className="bg-slate-900 text-slate-300">
                  <tr>
                    <th className="p-3 text-left">Módulo</th>
                    <th className="p-3 text-center">Ver</th>
                    <th className="p-3 text-center">Criar</th>
                    <th className="p-3 text-center">Editar</th>
                    <th className="p-3 text-center">Excluir</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-800">
                  {modulos.map((modulo) => (
                    <tr key={modulo} className="text-slate-300">
                      <td className="p-3 font-bold text-yellow-400">
                        {modulo}
                      </td>

                      {(
                        [
                          "pode_ver",
                          "pode_criar",
                          "pode_editar",
                          "pode_excluir",
                        ] as CampoPermissao[]
                      ).map((campo) => (
                        <td key={campo} className="p-3 text-center">
                          <input
                            type="checkbox"
                            checked={valorPermissao(modulo, campo)}
                            onChange={(e) =>
                              alterarPermissao(
                                modulo,
                                campo,
                                e.target.checked
                              )
                            }
                            className="h-5 w-5 accent-yellow-500"
                          />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </SigCard>

        <SigCard>
          <div className="flex items-start gap-4">
            <CheckCircle className="w-8 h-8 text-emerald-400" />

            <div>
              <h3 className="text-lg font-black text-white">
                Alteração Automática
              </h3>

              <p className="text-slate-400 mt-1">
                Cada marcação é salva imediatamente na tabela
                permissoes_perfis.
              </p>
            </div>
          </div>
        </SigCard>
      </div>
    </ProtecaoModulo>
  );
}