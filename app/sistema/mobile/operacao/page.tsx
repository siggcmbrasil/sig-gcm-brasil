"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import MobileBottomNav from "@/components/MobileBottomNav";
import {
  ArrowLeft,
  Bot,
  CalendarDays,
  ChevronRight,
  Handshake,
  Map,
  MapPinned,
  PhoneCall,
  QrCode,
  Shield,
  Siren,
  Zap,
} from "lucide-react";

const acoes = [
  {
    titulo: "Ocorrência Expressa",
    descricao: "Registrar ocorrência rápida em campo.",
    href: "/sistema/ocorrencias/expressa",
    icone: Zap,
    destaque: true,
  },
  {
    titulo: "Nova Ocorrência",
    descricao: "Registro completo pelo celular.",
    href: "/sistema/mobile/ocorrencias/nova",
    icone: Siren,
  },
  {
    titulo: "Novo Chamado",
    descricao: "Abrir ou acompanhar solicitação operacional.",
    href: "/sistema/chamados",
    icone: PhoneCall,
  },
  {
    titulo: "Rondas / QR Code",
    descricao: "Check-ins, pontos de ronda e validações.",
    href: "/sistema/rondas",
    icone: QrCode,
  },
  {
    titulo: "Patrulhamento GPS",
    descricao: "Iniciar patrulhamento e registrar percurso.",
    href: "/sistema/mobile/gps",
    icone: MapPinned,
  },
  {
    titulo: "Visita Preventiva",
    descricao: "Registrar ação preventiva sem ocorrência.",
    href: "/sistema/visitas",
    icone: Handshake,
  },
  {
    titulo: "Mapa Operacional",
    descricao: "Visualizar viaturas, ocorrências, GPS e SOS.",
    href: "/sistema/mapa-operacional",
    icone: Map,
  },
  {
    titulo: "IA Operacional",
    descricao: "Apoio inteligente para decisões e registros.",
    href: "/sistema/ia",
    icone: Bot,
  },
  {
    titulo: "Guarnições Ativas",
    descricao: "Consultar equipes em serviço.",
    href: "/sistema/mobile/guarnicao",
    icone: Shield,
  },
  {
    titulo: "Eventos Operacionais",
    descricao: "Operações, festas, jogos e reforços.",
    href: "/sistema/eventos-operacionais",
    icone: CalendarDays,
  },
];

export default function OperacaoMobilePage() {
  const [usuario, setUsuario] = useState<any>(null);

  useEffect(() => {
    const salvo = localStorage.getItem("usuarioLogado");

    if (!salvo) {
      window.location.href = "/login";
      return;
    }

    const dados = JSON.parse(salvo);

    if (!dados?.id || !dados?.municipio_id) {
      window.location.href = "/login";
      return;
    }

    setUsuario(dados);
  }, []);

  return (
    <main className="min-h-screen bg-[#02060f] text-white p-4 pb-28">
      <header className="mb-6">
        <Link
          href="/sistema/mobile"
          className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 border border-slate-800 px-4 py-2 text-sm mb-5 active:scale-95"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar
        </Link>

        <section className="rounded-3xl bg-slate-900 border border-slate-800 p-5">
          <p className="text-blue-400 text-sm font-bold">
            {usuario?.municipio_nome || "Central Operacional"}
          </p>

          <h1 className="text-3xl font-black mt-1">
            Operação em Campo
          </h1>

          <p className="text-slate-400 text-sm mt-2">
            Acesso rápido às ações mais usadas durante o serviço.
          </p>
        </section>
      </header>

      <Link
        href="/sistema/central-sos"
        className="mb-4 rounded-3xl bg-red-600 border border-red-500 p-5 flex items-center gap-4 active:scale-95 transition"
      >
        <Siren className="w-10 h-10 text-white" />

        <div>
          <h2 className="text-xl font-black">Central SOS</h2>

          <p className="text-red-100 text-sm">
            Monitorar alertas de emergência acionados no mobile.
          </p>
        </div>

        <ChevronRight className="w-5 h-5 ml-auto text-red-100" />
      </Link>

      <div className="rounded-3xl bg-slate-900 border border-slate-800 p-5 mb-4">
        <p className="text-slate-400 text-sm">Status Operacional</p>

        <h2 className="text-2xl font-black mt-1">Em Serviço</h2>

        <p className="text-green-400 text-sm mt-2">
          ● Guarnição online e pronta para atendimento
        </p>
      </div>

      <section className="space-y-3">
        {acoes.map((acao) => {
          const Icone = acao.icone;

          return (
            <Link
              key={acao.titulo}
              href={acao.href}
              className={`rounded-3xl border p-4 flex items-center gap-4 active:scale-95 transition ${
                acao.destaque
                  ? "bg-blue-600 border-blue-500"
                  : "bg-slate-900 border-slate-800"
              }`}
            >
              <div
                className={`w-14 h-14 rounded-2xl flex items-center justify-center ${
                  acao.destaque ? "bg-white/20" : "bg-blue-600/20"
                }`}
              >
                <Icone
                  className={`w-7 h-7 ${
                    acao.destaque ? "text-white" : "text-blue-400"
                  }`}
                />
              </div>

              <div className="flex-1">
                <h2 className="font-black text-lg">{acao.titulo}</h2>

                <p
                  className={`text-sm ${
                    acao.destaque ? "text-blue-100" : "text-slate-400"
                  }`}
                >
                  {acao.descricao}
                </p>
              </div>

              <ChevronRight className="w-5 h-5 text-slate-400" />
            </Link>
          );
        })}
      </section>

      <MobileBottomNav />
    </main>
  );
}