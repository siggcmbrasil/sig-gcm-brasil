"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  CalendarDays,
  Clock,
  CheckCircle,
  AlertCircle,
  Plus,
  Search,
} from "lucide-react";

import { supabase } from "@/lib/supabase";
import SigPageHeader from "@/components/sig/SigPageHeader";
import SigCard from "@/components/sig/SigCard";
import SigButton from "@/components/sig/SigButton";

export default function EventosPage() {
  const [eventos, setEventos] = useState<any[]>([]);
  const [busca, setBusca] = useState("");
  const [status, setStatus] = useState("TODOS");
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    carregar();
  }, []);

  async function carregar() {
    setCarregando(true);

    const usuario = JSON.parse(localStorage.getItem("usuarioLogado") || "{}");

    let query = supabase
      .from("eventos_cidadao")
      .select("*")
      .eq("municipio_id", usuario.municipio_id)
      .order("data_evento", { ascending: true });

    if (status !== "TODOS") query = query.eq("status", status);

    if (busca.trim()) {
      query = query.or(
        `titulo.ilike.%${busca.trim()}%,tipo.ilike.%${busca.trim()}%,local.ilike.%${busca.trim()}%`
      );
    }

    const { data } = await query;
    setEventos(data || []);
    setCarregando(false);
  }

  const agendados = eventos.filter((e) => e.status === "AGENDADO").length;
  const andamento = eventos.filter((e) => e.status === "EM_ANDAMENTO").length;
  const finalizados = eventos.filter((e) => e.status === "FINALIZADO").length;

  return (
    <div className="p-4 md:p-6 pb-24 space-y-6">
      <SigPageHeader
        titulo="Eventos"
        subtitulo="Agenda de eventos, ações comunitárias e atividades públicas."
        icone={CalendarDays}
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card titulo="Eventos" valor={eventos.length} icone={<CalendarDays className="w-7 h-7 text-blue-400" />} />
        <Card titulo="Agendados" valor={agendados} icone={<Clock className="w-7 h-7 text-yellow-400" />} />
        <Card titulo="Em andamento" valor={andamento} icone={<AlertCircle className="w-7 h-7 text-red-400" />} />
        <Card titulo="Finalizados" valor={finalizados} icone={<CheckCircle className="w-7 h-7 text-green-400" />} />
      </div>

      <SigCard>
        <div className="flex flex-col md:flex-row gap-3">
          <input
            className="input flex-1"
            placeholder="Pesquisar evento..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
          />

          <select
            className="input md:w-60"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="TODOS">Todos</option>
            <option value="AGENDADO">Agendado</option>
            <option value="EM_ANDAMENTO">Em andamento</option>
            <option value="FINALIZADO">Finalizado</option>
            <option value="CANCELADO">Cancelado</option>
          </select>

          <SigButton type="gold" onClick={carregar}>
            <Search className="w-4 h-4" />
            Consultar
          </SigButton>

          <Link href="/sistema/portal-cidadao/eventos/nova">
            <SigButton type="blue">
              <Plus className="w-4 h-4" />
              Novo Evento
            </SigButton>
          </Link>
        </div>
      </SigCard>

      <SigCard>
        {carregando ? (
          <p className="text-slate-400">Carregando eventos...</p>
        ) : eventos.length === 0 ? (
          <div className="text-center py-16">
            <CalendarDays className="w-16 h-16 mx-auto text-slate-600 mb-4" />
            <h2 className="text-xl font-black text-white">
              Nenhum evento cadastrado
            </h2>
            <p className="text-slate-400 mt-2">
              Os eventos cadastrados para o cidadão aparecerão aqui.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {eventos.map((e) => (
              <div
                key={e.id}
                className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4"
              >
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                  <div>
                    <p className="text-white font-black">{e.titulo}</p>
                    <p className="text-slate-400 text-sm">
                      {e.tipo} • {e.local || "Local não informado"}
                    </p>
                    <p className="text-slate-500 text-sm">
                      {e.data_evento || "Sem data"} {e.hora_evento || ""}
                    </p>
                  </div>

                  <span className="rounded-full border border-slate-700 px-3 py-1 text-xs font-bold text-slate-300">
                    {e.status}
                  </span>
                </div>

                {e.descricao && (
                  <p className="text-slate-300 mt-3 line-clamp-2">
                    {e.descricao}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </SigCard>
    </div>
  );
}

function Card({
  titulo,
  valor,
  icone,
}: {
  titulo: string;
  valor: number;
  icone: React.ReactNode;
}) {
  return (
    <div className="painel-premium p-5">
      <div className="flex justify-between items-center">
        <div>
          <p className="text-slate-400 text-sm">{titulo}</p>
          <h2 className="text-3xl font-black text-white">{valor}</h2>
        </div>
        {icone}
      </div>
    </div>
  );
}