"use client";

import { useEffect, useState } from "react";
import {
  CalendarClock,
  CarFront,
  CheckCircle,
  Clock,
  FileText,
  Route,
} from "lucide-react";

import { supabase } from "@/lib/supabase";
import SigPageHeader from "@/components/sig/SigPageHeader";
import SigCard from "@/components/sig/SigCard";

type Escolta = {
  id: number;
  tipo: string | null;
  local_origem: string | null;
  local_destino: string | null;
  solicitante: string | null;
  data: string | null;
  status: string | null;
  observacoes: string | null;
};

export default function RelatorioEscoltasPage() {
  const [escoltas, setEscoltas] = useState<Escolta[]>([]);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    carregar();
  }, []);

  async function carregar() {
    const usuario = JSON.parse(localStorage.getItem("usuarioLogado") || "{}");

    if (!usuario?.municipio_id) {
      alert("Município não identificado.");
      setCarregando(false);
      return;
    }

    const { data, error } = await supabase
      .from("escoltas")
      .select("*")
      .eq("municipio_id", usuario.municipio_id)
      .order("id", { ascending: false });

    setCarregando(false);

    if (error) {
      console.error("Erro ao carregar relatório de escoltas:", error);
      alert(error.message || "Erro ao carregar relatório.");
      return;
    }

    setEscoltas(data || []);
  }

  const hoje = new Date().toISOString().split("T")[0];

  const total = escoltas.length;
  const hojeTotal = escoltas.filter((e) => e.data === hoje).length;
  const abertas = escoltas.filter((e) => e.status === "ABERTA").length;
  const finalizadas = escoltas.filter((e) => e.status === "FINALIZADA").length;

  return (
    <div className="p-4 md:p-6 pb-24 space-y-6">
      <SigPageHeader
        titulo="Relatório de Escoltas"
        subtitulo="Resumo das escoltas, deslocamentos oficiais e apoios com viaturas."
        icone={FileText}
      />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <SigCard>
          <Route className="w-8 h-8 text-cyan-400 mb-3" />
          <p className="text-slate-400 text-sm">Total</p>
          <h2 className="text-4xl font-black text-white mt-2">{total}</h2>
        </SigCard>

        <SigCard>
          <CalendarClock className="w-8 h-8 text-blue-400 mb-3" />
          <p className="text-slate-400 text-sm">Hoje</p>
          <h2 className="text-4xl font-black text-blue-400 mt-2">{hojeTotal}</h2>
        </SigCard>

        <SigCard>
          <Clock className="w-8 h-8 text-orange-400 mb-3" />
          <p className="text-slate-400 text-sm">Abertas</p>
          <h2 className="text-4xl font-black text-orange-400 mt-2">{abertas}</h2>
        </SigCard>

        <SigCard>
          <CheckCircle className="w-8 h-8 text-emerald-400 mb-3" />
          <p className="text-slate-400 text-sm">Finalizadas</p>
          <h2 className="text-4xl font-black text-emerald-400 mt-2">
            {finalizadas}
          </h2>
        </SigCard>
      </div>

      <SigCard>
        <h2 className="text-xl font-black text-white mb-4">
          Últimos registros
        </h2>

        {carregando ? (
          <p className="text-slate-400">Carregando relatório...</p>
        ) : escoltas.length === 0 ? (
          <p className="text-slate-400">Nenhuma escolta registrada.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="text-left py-3">Tipo</th>
                  <th className="text-left py-3">Origem</th>
                  <th className="text-left py-3">Destino</th>
                  <th className="text-left py-3">Solicitante</th>
                  <th className="text-left py-3">Data</th>
                  <th className="text-left py-3">Status</th>
                </tr>
              </thead>

              <tbody>
                {escoltas.slice(0, 30).map((item) => (
                  <tr key={item.id} className="border-b border-slate-900">
                    <td className="py-3 font-black text-white">
                      {item.tipo || "Escolta"}
                    </td>

                    <td className="text-slate-400">
                      {item.local_origem || "-"}
                    </td>

                    <td className="text-slate-400">
                      {item.local_destino || "-"}
                    </td>

                    <td className="text-slate-400">
                      {item.solicitante || "-"}
                    </td>

                    <td className="text-slate-300">
                      {item.data || "-"}
                    </td>

                    <td>
                      <span className="rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-xs font-bold text-cyan-400">
                        {item.status || "ABERTA"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SigCard>

      <SigCard>
        <div className="flex items-center gap-4">
          <CarFront className="w-10 h-10 text-cyan-400" />

          <div>
            <h2 className="text-xl font-black text-white">
              Relatório operacional
            </h2>

            <p className="text-slate-400 mt-1">
              Esta página resume as escoltas cadastradas no município logado.
            </p>
          </div>
        </div>
      </SigCard>
    </div>
  );
}