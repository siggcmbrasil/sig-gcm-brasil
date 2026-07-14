"use client";

import { useEffect, useState } from "react";
import {
  History,
  Download,
  Search,
} from "lucide-react";

import { supabase } from "@/lib/supabase";
import SigCard from "@/components/sig/SigCard";
import SigPageHeader from "@/components/sig/SigPageHeader";
import ProtecaoModulo from "@/components/ProtecaoModulo";

export default function HistoricoExportacoesPage() {
  const [dados, setDados] = useState<any[]>([]);
  const [busca, setBusca] = useState("");
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    carregar();
  }, []);

  async function carregar() {
    setCarregando(true);

    const usuario = JSON.parse(
  localStorage.getItem("usuarioLogado") || "{}"
);

if (!usuario?.municipio_id) {
  alert("Município não identificado.");
  setCarregando(false);
  return;
}

const { data } = await supabase
      .from("exportacoes_sistema")
      .select(`
        *,
        usuarios(nome)
      `)
      .eq("municipio_id", usuario.municipio_id)
      .order("created_at", {
        ascending: false,
      });

    setDados(data || []);
    setCarregando(false);
  }

  const lista = dados.filter((item) =>
    `
      ${item.modulo || ""}
      ${item.arquivo || ""}
      ${item.usuarios?.nome || ""}
    `
      .toLowerCase()
      .includes(busca.toLowerCase())
  );

  return (
  <ProtecaoModulo modulo="exportador_dados">
    <div className="p-4 md:p-6 space-y-6">
      <SigPageHeader
        titulo="Histórico de Exportações"
        subtitulo="Todas as exportações realizadas no município."
        icone={History}
      />

      <div className="grid md:grid-cols-3 gap-4">
        <SigCard>
          <p className="text-slate-400">
            Total de Exportações
          </p>

          <h2 className="text-4xl font-black mt-2">
            {dados.length}
          </h2>
        </SigCard>

        <SigCard>
          <p className="text-slate-400">
            Módulos Exportados
          </p>

          <h2 className="text-4xl font-black text-cyan-400 mt-2">
            {
              new Set(
                dados.map((i) => i.modulo)
              ).size
            }
          </h2>
        </SigCard>

        <SigCard>
          <p className="text-slate-400">
            Arquivos Gerados
          </p>

          <h2 className="text-4xl font-black text-emerald-400 mt-2">
            {
              dados.filter(
                (i) => i.arquivo
              ).length
            }
          </h2>
        </SigCard>
      </div>

      <SigCard>
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />

          <input
            className="input pl-12"
            placeholder="Pesquisar..."
            value={busca}
            onChange={(e) =>
              setBusca(e.target.value)
            }
          />
        </div>
      </SigCard>

      <SigCard>
        {carregando ? (
          <p className="text-slate-400">
            Carregando...
          </p>
        ) : lista.length === 0 ? (
          <p className="text-slate-400">
            Nenhuma exportação encontrada.
          </p>
        ) : (
          <div className="space-y-4">
            {lista.map((item) => (
              <div
                key={item.id}
                className="
                  border border-slate-800
                  rounded-2xl
                  p-4
                  bg-slate-950/50
                "
              >
                <div className="flex justify-between gap-4 flex-wrap">
                  <div>
                    <h3 className="font-black text-lg">
                      {item.modulo}
                    </h3>

                    <p className="text-slate-400">
                      {item.arquivo}
                    </p>

                    <p className="text-sm text-slate-500 mt-1">
                      Usuário:{" "}
                      {item.usuarios?.nome ||
                        "Não informado"}
                    </p>

                    <p className="text-sm text-slate-500">
                      {new Date(
                        item.created_at
                      ).toLocaleString("pt-BR")}
                    </p>
                  </div>

                  <div
                    className="
                      w-14 h-14
                      rounded-2xl
                      bg-cyan-500/10
                      border border-cyan-500/20
                      flex items-center
                      justify-center
                    "
                  >
                    <Download className="w-7 h-7 text-cyan-400" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </SigCard>
        </div>
  </ProtecaoModulo>
);
}