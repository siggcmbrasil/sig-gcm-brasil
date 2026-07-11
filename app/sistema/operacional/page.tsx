"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  CarFront,
  Handshake,
  Shield,
  Users,
} from "lucide-react";

import SigCentralHeader from "@/components/sig/SigCentralHeader";
import SigCentralCard from "@/components/sig/SigCentralCard";
import ProtecaoModulo from "@/components/ProtecaoModulo";

import { supabase } from "@/lib/supabase";

type CardOperacional = {
  titulo: string;
  icone: typeof Shield;
  href: string;
  descricao: string;
  modulos: string[];
};

const cards: CardOperacional[] = [
  {
    titulo: "Central de Patrulhamento",
    icone: CarFront,
    href: "/sistema/central-patrulhamento",
    descricao:
      "Patrulhamentos, GPS, rotas, histórico e rastreamento.",
    modulos: ["patrulhamento"],
  },
  {
    titulo: "Visitas Preventivas",
    icone: Handshake,
    href: "/sistema/patrulhamento/visitas",
    descricao:
      "Pontos visitados, QR Code, check-in e visitas comunitárias.",
    modulos: ["visitas"],
  },
  {
    titulo: "Consultas Operacionais",
    icone: Users,
    href: "/sistema/consultas",
    descricao:
      "Consulta de pessoas, veículos e informações operacionais.",
    modulos: [
      "consulta_global",
      "consulta_cpf",
      "consulta_placa",
    ],
  },
  {
    titulo: "Central de Abordagens",
    icone: Users,
    href: "/sistema/abordagens",
    descricao:
      "Pessoas, veículos, consultas e histórico de abordagens.",
    modulos: [
      "pessoas_abordadas",
      "veiculos_abordados",
    ],
  },
  {
    titulo: "Operações Integradas",
    icone: Shield,
    href: "/sistema/operacoes",
    descricao:
      "Blitze, barreiras, operações especiais, escoltas e apoios em uma única central.",
    modulos: ["operacoes"],
  },
];

export default function OperacionalPage() {
  const [carregando, setCarregando] =
    useState(true);

  const [erro, setErro] = useState("");

  const [perfil, setPerfil] = useState("");

  const [modulosPermitidos, setModulosPermitidos] =
    useState<Set<string>>(new Set());

  useEffect(() => {
    let ativo = true;
    const controller = new AbortController();

    async function carregarPermissoes() {
      setCarregando(true);
      setErro("");

      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        const token = session?.access_token;

        if (!token) {
          localStorage.removeItem("usuarioLogado");
          window.location.replace("/login");
          return;
        }

        const resposta = await fetch(
          "/api/permissoes/menu",
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
            },
            cache: "no-store",
            signal: controller.signal,
          }
        );

        const retorno = await resposta
          .json()
          .catch(() => null);

        if (!ativo) {
          return;
        }

        if (!resposta.ok) {
          if (resposta.status === 401) {
            localStorage.removeItem(
              "usuarioLogado"
            );

            window.location.replace("/login");
            return;
          }

          throw new Error(
            retorno?.erro ||
              "Não foi possível carregar as permissões."
          );
        }

        setPerfil(
          String(retorno?.perfil || "").toUpperCase()
        );

        setModulosPermitidos(
          new Set(
            Array.isArray(retorno?.modulos)
              ? retorno.modulos.map(
                  (modulo: unknown) =>
                    String(modulo)
                      .trim()
                      .toLowerCase()
                )
              : []
          )
        );
      } catch (error) {
        if (
          error instanceof DOMException &&
          error.name === "AbortError"
        ) {
          return;
        }

        console.error(
          "Erro ao carregar Central Operacional:",
          error
        );

        if (ativo) {
          setErro(
            error instanceof Error
              ? error.message
              : "Erro ao carregar permissões."
          );
        }
      } finally {
        if (ativo) {
          setCarregando(false);
        }
      }
    }

    void carregarPermissoes();

    return () => {
      ativo = false;
      controller.abort();
    };
  }, []);

  const cardsFiltrados = useMemo(() => {
    if (perfil === "DESENVOLVEDOR") {
      return cards;
    }

    return cards.filter((card) =>
      card.modulos.some((modulo) =>
        modulosPermitidos.has(modulo)
      )
    );
  }, [perfil, modulosPermitidos]);

  return (
    <ProtecaoModulo modulo="operacional">
      <section className="space-y-6 p-4 pb-24 md:p-6">
        <SigCentralHeader
          titulo="Centro Operacional"
          descricao="Execução operacional, patrulhamento, visitas preventivas, consultas, apoios e operações."
          icone={Shield}
        />

        {carregando ? (
          <div className="flex min-h-60 items-center justify-center">
            <div className="text-center">
              <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-slate-700 border-t-cyan-400" />

              <p className="font-bold text-slate-300">
                Carregando módulos operacionais...
              </p>
            </div>
          </div>
        ) : erro ? (
          <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-5 text-red-200">
            {erro}
          </div>
        ) : cardsFiltrados.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-8 text-center">
            <Shield className="mx-auto h-12 w-12 text-slate-500" />

            <h2 className="mt-4 text-xl font-black text-white">
              Nenhum módulo operacional disponível
            </h2>

            <p className="mt-2 text-sm text-slate-400">
              O perfil possui acesso à central, mas
              ainda não recebeu permissões para os
              módulos internos.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            {cardsFiltrados.map((card) => (
              <SigCentralCard
                key={card.href}
                titulo={card.titulo}
                descricao={card.descricao}
                href={card.href}
                icone={card.icone}
              />
            ))}
          </div>
        )}
      </section>
    </ProtecaoModulo>
  );
}