"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import ProtecaoModulo from "@/components/ProtecaoModulo";
import {
  CalendarDays,
  Plus,
  MapPin,
  Users,
  ShieldCheck,
  Eye,
} from "lucide-react";

export default function EventosOperacionaisPage() {
  const [eventos, setEventos] = useState<any[]>([]);
  const [carregando, setCarregando] = useState(true);

  function pegarUsuario() {
    return JSON.parse(localStorage.getItem("usuarioLogado") || "{}");
  }

  useEffect(() => {
    carregarEventos();
  }, []);

  async function carregarEventos() {
    setCarregando(true);

    const usuario = pegarUsuario();

if (!usuario?.municipio_id) {
  alert("Município não identificado.");
  setCarregando(false);
  return;
}

const { data, error } = await supabase
      .from("eventos_operacionais")
      .select("*")
      .eq("municipio_id", usuario.municipio_id)
      .order("data_inicio", { ascending: false });

    if (error) {
      console.error(error);
      alert("Erro ao carregar eventos operacionais.");
    }

    setEventos(data || []);
    setCarregando(false);
  }

  const efetivoTotal = eventos.reduce(
    (total, evento) => total + Number(evento.efetivo_previsto || 0),
    0
  );

  const locaisUnicos = new Set(eventos.map((e) => e.local).filter(Boolean));

  return (
  <ProtecaoModulo modulo="eventos_operacionais">
    <div className="p-6 space-y-6">
      <div className="painel-premium p-6 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <ShieldCheck className="w-8 h-8 text-yellow-400" />

          <div>
            <h1 className="text-3xl font-black">
              Eventos Operacionais
            </h1>

            <p className="text-slate-400 mt-1">
              Planejamento de operações, grandes eventos e reforço operacional.
            </p>
          </div>
        </div>

        <Link
          href="/sistema/eventos-operacionais/novo"
          className="bg-yellow-500 hover:bg-yellow-400 text-black font-bold px-4 py-2 rounded-xl flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Novo Evento
        </Link>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <div className="painel-premium p-5">
          <CalendarDays className="w-7 h-7 text-yellow-400 mb-3" />
          <p className="text-slate-400 text-sm">Eventos Cadastrados</p>
          <h2 className="text-3xl font-black">{eventos.length}</h2>
        </div>

        <div className="painel-premium p-5">
          <Users className="w-7 h-7 text-blue-400 mb-3" />
          <p className="text-slate-400 text-sm">Efetivo Previsto</p>
          <h2 className="text-3xl font-black">{efetivoTotal}</h2>
        </div>

        <div className="painel-premium p-5">
          <MapPin className="w-7 h-7 text-green-400 mb-3" />
          <p className="text-slate-400 text-sm">Locais Monitorados</p>
          <h2 className="text-3xl font-black">{locaisUnicos.size}</h2>
        </div>
      </div>

      <div className="painel-premium p-6">
        <h2 className="text-xl font-bold mb-4">
          Lista de Eventos
        </h2>

        {carregando ? (
          <p className="text-slate-400">Carregando eventos...</p>
        ) : eventos.length === 0 ? (
          <div className="text-center py-12">
            <CalendarDays className="w-14 h-14 text-slate-500 mx-auto mb-4" />

            <h3 className="text-xl font-bold">
              Nenhum evento operacional cadastrado
            </h3>

            <p className="text-slate-400 mt-2">
              Cadastre operações especiais, festas municipais, eventos esportivos
              ou ações integradas.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {eventos.map((evento) => (
              <div
                key={evento.id}
                className="border border-white/10 rounded-xl p-4 flex items-center justify-between gap-4"
              >
                <div>
                  <h3 className="font-bold text-lg">
                    {evento.nome}
                  </h3>

                  <p className="text-sm text-slate-400">
                    {evento.tipo || "Sem tipo"} • {evento.local}
                  </p>

                  <p className="text-sm text-slate-500 mt-1">
                    Início:{" "}
                    {evento.data_inicio
                      ? new Date(evento.data_inicio).toLocaleString("pt-BR")
                      : "Não informado"}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-xs bg-yellow-500/20 text-yellow-300 px-3 py-1 rounded-full">
                    {evento.status}
                  </span>

                  <Link
                    href={`/sistema/eventos-operacionais/${evento.id}`}
                    className="p-2 rounded-lg bg-white/10 hover:bg-white/20"
                  >
                    <Eye className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
        </div>
  </ProtecaoModulo>
);
}