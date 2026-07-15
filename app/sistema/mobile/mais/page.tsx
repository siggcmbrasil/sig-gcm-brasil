"use client";

import Link from "next/link";
import {
  Bell,
  BookOpen,
  CalendarDays,
  CarFront,
  ChevronRight,
  ClipboardList,
  FileText,
  Map,
  Search,
  Smartphone,
  Star,
  MessageCircle,
  QrCode,
  Settings,
  ShieldAlert,
  Users,
} from "lucide-react";

import MobileBottomNav from "@/components/MobileBottomNav";

const grupos = [
  {
    titulo: "Operacional",
    itens: [
      {
        href: "/sistema/mobile/favoritos",
        titulo: "Meus atalhos",
        descricao: "Personalizar acessos rápidos",
        icone: Star,
      },
      {
        href: "/sistema/mobile/plantao",
        titulo: "Meu plantão",
        descricao: "Equipe, viatura e situação operacional",
        icone: CalendarDays,
      },
      {
        href: "/sistema/mobile/busca",
        titulo: "Pesquisa operacional",
        descricao: "Pessoas, veículos, ocorrências e locais",
        icone: Search,
      },
      {
        href: "/sistema/mobile/offline",
        titulo: "Central offline",
        descricao: "Pendências e sincronização local",
        icone: Smartphone,
      },
      {
        href: "/sistema/chamados",
        titulo: "Chamados",
        descricao: "Demandas operacionais abertas",
        icone: Bell,
      },
      {
        href: "/sistema/visitas/ler-qrcode",
        titulo: "Visitas e QR Code",
        descricao: "Confirmar presença em pontos",
        icone: QrCode,
      },
      {
        href: "/sistema/mapa-operacional",
        titulo: "Mapa operacional",
        descricao: "Equipes, alertas e ocorrências",
        icone: Map,
      },
      {
        href: "/sistema/central-sos",
        titulo: "Central SOS",
        descricao: "Alertas de emergência",
        icone: ShieldAlert,
      },
    ],
  },
  {
    titulo: "Equipe e serviço",
    itens: [
      {
        href: "/sistema/mobile/guarnicao",
        titulo: "Minha guarnição",
        descricao: "Comandante, viatura e equipe",
        icone: Users,
      },
      {
        href: "/sistema/escalas",
        titulo: "Escalas",
        descricao: "Plantões e serviços",
        icone: CalendarDays,
      },
      {
        href: "/sistema/viaturas",
        titulo: "Viaturas",
        descricao: "Frota disponível",
        icone: CarFront,
      },
      {
        href: "/sistema/relatorio-plantao",
        titulo: "Relatório de plantão",
        descricao: "Registrar o serviço do dia",
        icone: ClipboardList,
      },
    ],
  },
  {
    titulo: "Comunicação",
    itens: [
      {
        href: "/sistema/feed-sig",
        titulo: "Rede Interna SIG",
        descricao: "Publicações da Guarda",
        icone: MessageCircle,
      },
      {
        href: "/sistema/notificacoes",
        titulo: "Notificações",
        descricao: "Avisos e atualizações",
        icone: Bell,
      },
      {
        href: "/sistema/central-legislacao",
        titulo: "Legislação",
        descricao: "Consulta jurídica rápida",
        icone: BookOpen,
      },
      {
        href: "/sistema/central-relatorios",
        titulo: "Relatórios",
        descricao: "Consultas e documentos",
        icone: FileText,
      },
    ],
  },
];

export default function MobileMaisPage() {
  return (
    <main className="relative min-h-screen overflow-x-hidden bg-[#02060f] pb-28 text-white">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_top,#0d3b66_0%,transparent_36%),linear-gradient(180deg,#06111f_0%,#02060f_55%)] opacity-90" />

      <div className="relative z-10 mx-auto max-w-md px-3 pb-4 pt-3">
        <header className="rounded-[28px] border border-white/10 bg-gradient-to-br from-slate-900 via-slate-950 to-blue-950/80 p-5 shadow-2xl">
          <p className="text-[11px] font-black uppercase tracking-[0.18em] text-cyan-300">
            Aplicativo SIG
          </p>

          <h1 className="mt-2 text-2xl font-black text-white">
            Mais recursos
          </h1>

          <p className="mt-2 text-sm leading-6 text-slate-400">
            Acesse rapidamente os módulos usados durante o serviço.
          </p>
        </header>

        <div className="mt-4 space-y-5">
          {grupos.map((grupo) => (
            <section key={grupo.titulo}>
              <h2 className="mb-2 px-1 text-xs font-black uppercase tracking-[0.16em] text-slate-500">
                {grupo.titulo}
              </h2>

              <div className="space-y-2">
                {grupo.itens.map((item) => {
                  const Icone = item.icone;

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="flex min-h-20 items-center gap-4 rounded-3xl border border-slate-800 bg-slate-900/85 p-4 shadow-lg transition active:scale-[0.99]"
                    >
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-cyan-400/10 text-cyan-200">
                        <Icone className="h-6 w-6" />
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="font-black text-white">
                          {item.titulo}
                        </p>
                        <p className="mt-1 truncate text-sm text-slate-400">
                          {item.descricao}
                        </p>
                      </div>

                      <ChevronRight className="h-5 w-5 text-slate-500" />
                    </Link>
                  );
                })}
              </div>
            </section>
          ))}

          <Link
            href="/sistema/configuracoes"
            className="flex min-h-14 items-center justify-center gap-2 rounded-2xl border border-slate-700 bg-slate-900/85 text-sm font-black text-slate-200"
          >
            <Settings className="h-5 w-5" />
            Configurações do sistema
          </Link>
        </div>

        <MobileBottomNav />
      </div>
    </main>
  );
}
