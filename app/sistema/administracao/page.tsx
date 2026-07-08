"use client";

import Link from "next/link";
import { useEffect } from "react";
import { ehAdministradorGlobal } from "@/lib/perfis";
import {
  Bell,
  ClipboardCheck,
  Landmark,
  MapPin,
  Settings,
  ShieldCheck,
  UserCog,
  UsersRound,
} from "lucide-react";

import ProtecaoModulo from "@/components/ProtecaoModulo";
import { registrarAuditoria } from "@/lib/auditoria";

const grupos = [
  {
    titulo: "Gestão da Guarda",
    descricao: "Administração local da corporação e dos usuários do município.",
    cards: [
      {
        titulo: "Usuários do Município",
        icone: UserCog,
        href: "/sistema/usuarios",
        descricao: "Aprovação, perfis e controle dos usuários locais.",
      },
      {
        titulo: "Guardas",
        icone: UsersRound,
        href: "/sistema/guardas",
        descricao: "Cadastro e gestão dos guardas municipais.",
      },
      {
        titulo: "Locais",
        icone: MapPin,
        href: "/sistema/locais",
        descricao:
          "Ruas, bairros, escolas, órgãos públicos e pontos estratégicos.",
      },
    ],
  },
  {
    titulo: "Institucional",
    descricao: "Dados oficiais e comunicação interna da Guarda.",
    cards: [
      {
        titulo: "Dados Institucionais",
        icone: Landmark,
        href: "/sistema/administracao/institucional",
        descricao: "Brasões, comandante e informações oficiais do município.",
      },
      {
        titulo: "Avisos",
        icone: Bell,
        href: "/sistema/avisos",
        descricao: "Comunicados internos da corporação.",
      },
      {
        titulo: "Notificações",
        icone: Bell,
        href: "/sistema/notificacoes",
        descricao: "Alertas e notificações do município.",
      },
    ],
  },
  {
    titulo: "Controle e Segurança Local",
    descricao: "Permissões e rastreamento das ações dentro do município.",
    cards: [
      {
        titulo: "Permissões",
        icone: ShieldCheck,
        href: "/sistema/permissoes",
        descricao: "Controle de acesso por perfil aos módulos.",
        perfis: ["ADMIN"],
      },
      {
        titulo: "Auditoria / Logs",
        icone: ClipboardCheck,
        href: "/sistema/administracao/auditoria",
        descricao: "Histórico de ações realizadas pelos usuários.",
        perfis: ["ADMIN", "COMANDANTE"],
      },
      {
        titulo: "Configurações do Município",
        icone: Settings,
        href: "/sistema/configuracoes",
        descricao: "Parâmetros locais da Guarda Municipal.",
        perfis: ["ADMIN", "COMANDANTE"],
      },
    ],
  },
];

export default function AdministracaoPage() {
  const usuario =
    typeof window !== "undefined"
      ? JSON.parse(localStorage.getItem("usuarioLogado") || "{}")
      : {};


  useEffect(() => {
    registrarAuditoria({
      modulo: "Administração",
      acao: "ACESSO",
      descricao: "Acessou a Administração da Guarda.",
    });
  }, []);

  if (
    typeof window !== "undefined" &&
    !ehAdministradorGlobal(usuario.perfil)
  ) {
    return (
      <div className="p-6">
        <div className="painel-premium p-6">
          <h1 className="text-2xl font-black text-white">
            Acesso negado
          </h1>

          <p className="text-slate-400 mt-2">
            Você não possui permissão para acessar a Administração da Guarda.
          </p>
        </div>
      </div>
    );
  }

  return (
    <ProtecaoModulo modulo="administracao">
      <section className="p-4 md:p-6 pb-24 space-y-8">
        <div className="painel-premium p-6">
          <p className="text-xs uppercase tracking-[0.25em] text-cyan-400 font-black">
            Gestão Local
          </p>

          <h1 className="text-3xl md:text-4xl font-black text-white mt-2">
            🛡️ Administração da Guarda
          </h1>

          <p className="text-slate-400 mt-2 max-w-4xl">
            Área destinada ao comando e administração do município para gerenciar
            usuários locais, guardas, avisos, dados institucionais, permissões,
            auditoria e configurações da própria Guarda.
          </p>
        </div>

        {grupos.map((grupo) => (
          <div key={grupo.titulo} className="space-y-4">
            <div>
              <h2 className="text-2xl font-black text-white">
                {grupo.titulo}
              </h2>

              <p className="text-slate-400 text-sm mt-1">
                {grupo.descricao}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
              {grupo.cards
                .filter(
                  (card: any) =>
                    !card.perfis ||
                    usuario.perfil === "DESENVOLVEDOR" ||
card.perfis.includes(usuario.perfil)
                )
                .map((card) => {
                  const Icone = card.icone;

                  return (
                    <Link
                      key={card.href}
                      href={card.href}
                      aria-label={`Abrir ${card.titulo}`}
                      title={card.titulo}
                      className="painel-premium p-6 hover:scale-[1.02] hover:border-cyan-500/40 transition-all duration-300"
                    >
                      <div className="flex items-center justify-between mb-5">
                        <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
                          <Icone className="w-9 h-9 text-cyan-400" />
                        </div>

                        <span className="text-green-400 text-xs font-black">
                          MUNICÍPIO
                        </span>
                      </div>

                      <h3 className="text-2xl font-black text-white">
                        {card.titulo}
                      </h3>

                      <p className="text-slate-400 text-sm mt-2">
                        {card.descricao}
                      </p>
                    </Link>
                  );
                })}
            </div>
          </div>
        ))}
      </section>
    </ProtecaoModulo>
  );
}