"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import ProtecaoModulo from "@/components/ProtecaoModulo";
import {
  CalendarClock,
  CarFront,
  CheckCircle,
  Clock,
  MapPin,
  Plus,
  Route,
  Search,
} from "lucide-react";

import { supabase } from "@/lib/supabase";
import SigCard from "@/components/sig/SigCard";
import SigPageHeader from "@/components/sig/SigPageHeader";

type Escolta = {
  id: number;
  tipo: string | null;
  local_origem: string | null;
  local_destino: string | null;
  solicitante: string | null;
  observacoes: string | null;
  data: string | null;
  status: string | null;
};

export default function EscoltasPage() {
  const [escoltas, setEscoltas] = useState<Escolta[]>([]);
  const [busca, setBusca] = useState("");
  const [carregando, setCarregando] = useState(true);

  async function carregar() {
    const usuario = JSON.parse(localStorage.getItem("usuarioLogado") || "{}");

    if (!usuario?.municipio_id) {
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
      console.error(error);
      alert("Erro ao carregar escoltas.");
      return;
    }

    setEscoltas(data || []);
  }

  useEffect(() => {
    carregar();
  }, []);

  const hoje = new Date().toISOString().split("T")[0];

  const lista = escoltas.filter((item) => {
    const texto = `
      ${item.tipo || ""}
      ${item.local_origem || ""}
      ${item.local_destino || ""}
      ${item.solicitante || ""}
      ${item.status || ""}
      ${item.observacoes || ""}
    `.toLowerCase();

    return texto.includes(busca.toLowerCase());
  });

  return (
  <ProtecaoModulo modulo="escoltas">
    <div className="p-4 md:p-6 pb-24 space-y-6">
      <SigPageHeader
        titulo="Escoltas"
        subtitulo="Lista, consulta e acompanhamento de escoltas operacionais."
        icone={Route}
      />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <SigCard>
          <Route className="w-8 h-8 text-cyan-400 mb-3" />
          <p className="text-slate-400 text-sm">Total</p>
          <h2 className="text-4xl font-black text-white mt-2">
            {escoltas.length}
          </h2>
        </SigCard>

        <SigCard>
          <CalendarClock className="w-8 h-8 text-blue-400 mb-3" />
          <p className="text-slate-400 text-sm">Hoje</p>
          <h2 className="text-4xl font-black text-blue-400 mt-2">
            {escoltas.filter((e) => e.data === hoje).length}
          </h2>
        </SigCard>

        <SigCard>
          <Clock className="w-8 h-8 text-orange-400 mb-3" />
          <p className="text-slate-400 text-sm">Abertas</p>
          <h2 className="text-4xl font-black text-orange-400 mt-2">
            {escoltas.filter((e) => e.status === "ABERTA").length}
          </h2>
        </SigCard>

        <SigCard>
          <CheckCircle className="w-8 h-8 text-emerald-400 mb-3" />
          <p className="text-slate-400 text-sm">Finalizadas</p>
          <h2 className="text-4xl font-black text-emerald-400 mt-2">
            {escoltas.filter((e) => e.status === "FINALIZADA").length}
          </h2>
        </SigCard>
      </div>

      <SigCard>
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-5 h-5 text-slate-500 absolute left-4 top-1/2 -translate-y-1/2" />

            <input
              className="input pl-12"
              placeholder="Buscar por tipo, origem, destino, solicitante ou status..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
            />
          </div>

          <Link
            href="/sistema/escoltas/nova"
            className="btn-primary inline-flex items-center justify-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Nova Escolta
          </Link>
        </div>
      </SigCard>

      <SigCard>
        <h3 className="text-xl font-black text-white mb-5">
          Escoltas Registradas
        </h3>

        {carregando ? (
          <p className="text-slate-400">Carregando escoltas...</p>
        ) : lista.length === 0 ? (
          <p className="text-slate-400">Nenhuma escolta encontrada.</p>
        ) : (
          <div className="space-y-4">
            {lista.map((item) => (
              <div
                key={item.id}
                className="rounded-2xl border border-slate-800 bg-slate-950/70 p-5"
              >
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                  <div>
                    <p className="text-lg font-black text-white">
                      {item.tipo || "Escolta"}
                    </p>

                    <p className="text-sm text-slate-400 mt-1">
                      Solicitante: {item.solicitante || "-"}
                    </p>
                  </div>

                  <span className="rounded-full bg-cyan-500/10 px-3 py-1 text-xs font-bold text-cyan-400 border border-cyan-500/30">
                    {item.status || "ABERTA"}
                  </span>
                </div>

                <div className="mt-4 grid md:grid-cols-2 gap-3 text-sm text-slate-400">
                  <p className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-cyan-400" />
                    Origem: {item.local_origem || "-"}
                  </p>

                  <p className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-cyan-400" />
                    Destino: {item.local_destino || "-"}
                  </p>

                  <p className="flex items-center gap-2">
                    <CalendarClock className="w-4 h-4 text-cyan-400" />
                    Data: {item.data || "-"}
                  </p>

                  <p className="flex items-center gap-2">
                    <CarFront className="w-4 h-4 text-cyan-400" />
                    Viatura vinculada no cadastro
                  </p>
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