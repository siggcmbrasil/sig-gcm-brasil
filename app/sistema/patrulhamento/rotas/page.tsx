"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Eye, History, Map, Route } from "lucide-react";

import { supabase } from "@/lib/supabase";
import { registrarAuditoria } from "@/lib/auditoria";

import SigPageHeader from "@/components/sig/SigPageHeader";
import SigCard from "@/components/sig/SigCard";

type UsuarioLogado = {
  id: string;
  perfil: string;
  municipio_id: number;
};

type PatrulhamentoComRota = {
  id: number;
  data: string;
  hora: string;
  local: string;
  guarda: string;
  equipe: string | null;
  viatura: string | null;
  status: string | null;
  total_pontos?: number;
};

function obterUsuarioLogado(): UsuarioLogado | null {
  try {
    const salvo = localStorage.getItem("usuarioLogado");

    if (!salvo) return null;

    const usuario = JSON.parse(salvo);

    if (!usuario?.id || !usuario?.perfil || !usuario?.municipio_id) {
      return null;
    }

    return {
      id: String(usuario.id),
      perfil: usuario.perfil,
      municipio_id: Number(usuario.municipio_id),
    };
  } catch {
    return null;
  }
}

export default function HistoricoRotasPage() {
  const [rotas, setRotas] = useState<PatrulhamentoComRota[]>([]);
  const [busca, setBusca] = useState("");
  const [carregando, setCarregando] = useState(true);

  async function carregarRotas() {
    const usuario = obterUsuarioLogado();

    if (!usuario) {
      setRotas([]);
      setCarregando(false);
      return;
    }

    setCarregando(true);

    const { data, error } = await supabase
      .from("patrulhamentos")
      .select("id, data, hora, local, guarda, equipe, viatura, status")
      .eq("municipio_id", usuario.municipio_id)
      .order("id", { ascending: false })
      .limit(100);

    if (error) {
      console.error(error);

      await registrarAuditoria({
        modulo: "Histórico de Rotas",
        acao: "ERRO",
        descricao: "Erro ao carregar histórico de rotas.",
        tabela: "patrulhamentos",
        detalhes: {
          erro: error.message,
          municipio_id: usuario.municipio_id,
        },
      });

      alert("Erro ao carregar histórico de rotas.");
      setCarregando(false);
      return;
    }

    setRotas(data || []);
    setCarregando(false);
  }

  useEffect(() => {
    const usuario = obterUsuarioLogado();

    if (!usuario) {
      setCarregando(false);
      return;
    }

    void registrarAuditoria({
      modulo: "Histórico de Rotas",
      acao: "ACESSO",
      descricao: "Acessou o histórico de rotas.",
      tabela: "patrulhamentos",
      detalhes: {
        municipio_id: usuario.municipio_id,
        usuario_id: usuario.id,
        perfil: usuario.perfil,
      },
    });

    void carregarRotas();
  }, []);

  const rotasFiltradas = useMemo(() => {
    const termo = busca.trim().toLowerCase();

    if (!termo) return rotas;

    return rotas.filter((rota) => {
      const texto = `
        ${rota.data}
        ${rota.hora}
        ${rota.local}
        ${rota.guarda}
        ${rota.equipe || ""}
        ${rota.viatura || ""}
        ${rota.status || ""}
      `.toLowerCase();

      return texto.includes(termo);
    });
  }, [busca, rotas]);

  const totalFinalizadas = rotas.filter(
    (r) => r.status === "FINALIZADO"
  ).length;

  const totalAndamento = rotas.filter(
    (r) => r.status !== "FINALIZADO"
  ).length;

  return (
    <div className="p-4 md:p-6 pb-24 space-y-6">
      <SigPageHeader
        titulo="Histórico de Rotas"
        subtitulo="Consulta das rotas registradas durante os patrulhamentos."
        icone={History}
      />

      <div className="grid md:grid-cols-3 gap-4">
        <SigCard>
          <Route className="w-8 h-8 text-cyan-400 mb-3" />
          <h3 className="text-lg font-black text-white">{rotas.length}</h3>
          <p className="text-slate-400 text-sm mt-2">
            Patrulhamentos registrados
          </p>
        </SigCard>

        <SigCard>
          <Map className="w-8 h-8 text-cyan-400 mb-3" />
          <h3 className="text-lg font-black text-white">
            {totalFinalizadas}
          </h3>
          <p className="text-slate-400 text-sm mt-2">Rotas finalizadas</p>
        </SigCard>

        <SigCard>
          <History className="w-8 h-8 text-cyan-400 mb-3" />
          <h3 className="text-lg font-black text-white">{totalAndamento}</h3>
          <p className="text-slate-400 text-sm mt-2">Em andamento</p>
        </SigCard>
      </div>

      <SigCard>
        <input
          className="input"
          placeholder="Buscar por data, local, guarda, equipe ou viatura..."
          value={busca}
          maxLength={80}
          onChange={(e) => setBusca(e.target.value)}
        />
      </SigCard>

      <SigCard>
        {carregando ? (
          <div className="text-center py-16 text-slate-400">
            Carregando histórico de rotas...
          </div>
        ) : rotasFiltradas.length === 0 ? (
          <div className="text-center py-16">
            <History className="w-16 h-16 mx-auto text-cyan-400 mb-4" />

            <h2 className="text-2xl font-black text-white">
              Nenhuma rota encontrada
            </h2>

            <p className="text-slate-400 mt-2">
              As rotas capturadas pelo GPS dos patrulhamentos aparecerão aqui.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto border border-slate-800 rounded-2xl">
            <table className="w-full text-sm">
              <thead className="bg-slate-950/60 text-slate-400">
                <tr>
                  <th className="text-left p-4">Data</th>
                  <th className="text-left p-4">Hora</th>
                  <th className="text-left p-4">Local</th>
                  <th className="text-left p-4">Viatura</th>
                  <th className="text-left p-4">Guarda</th>
                  <th className="text-left p-4">Status</th>
                  <th className="text-right p-4">Ações</th>
                </tr>
              </thead>

              <tbody>
                {rotasFiltradas.map((rota) => (
                  <tr
                    key={rota.id}
                    className="border-t border-slate-800 hover:bg-slate-900/50"
                  >
                    <td className="p-4 text-cyan-400 font-bold">
                      {rota.data}
                    </td>

                    <td className="p-4 text-slate-300">{rota.hora}</td>

                    <td className="p-4 text-slate-300">{rota.local}</td>

                    <td className="p-4 text-slate-300">
                      {rota.viatura || "-"}
                    </td>

                    <td className="p-4 text-slate-300">{rota.guarda}</td>

                    <td className="p-4 text-slate-300">
                      {rota.status || "EM_ANDAMENTO"}
                    </td>

                    <td className="p-4">
                      <div className="flex justify-end">
                        <Link
                          href={`/sistema/patrulhamento/${rota.id}`}
                          className="w-9 h-9 rounded-xl bg-slate-800 hover:bg-cyan-700 flex items-center justify-center"
                          title="Ver rota"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SigCard>
    </div>
  );
}