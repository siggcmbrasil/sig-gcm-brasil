"use client";

import Link from "next/link";
import {
  Bell,
  CalendarDays,
  ClipboardList,
  FileText,
  MapPin,
  MessageSquare,
  MessageSquareWarning,
  Newspaper,
  PackageSearch,
  Phone,
  RefreshCw,
  Search,
  Shield,
  Users,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import ProtecaoModulo from "@/components/ProtecaoModulo";
import SigActionCard from "@/components/sig/SigActionCard";
import SigButton from "@/components/sig/SigButton";
import SigCard from "@/components/sig/SigCard";
import SigPageHeader from "@/components/sig/SigPageHeader";
import SigStatCard from "@/components/sig/SigStatCard";

import {
  lerMunicipioContextoLocal,
  obterMunicipioIdEfetivo,
} from "@/lib/contextoMunicipio";
import { supabase } from "@/lib/supabase";

type UsuarioLocal = {
  perfil?: string;
  municipio_id?: number;
};

type TotaisPortal = {
  denuncias: number;
  ouvidorias: number;
  solicitacoes: number;
  protocolos: number;
  noticias: number;
  comunicados: number;
};

const cards = [
  {
    href: "/sistema/portal-cidadao/achados-perdidos",
    titulo: "Achados e Perdidos",
    descricao:
      "Controle de objetos encontrados, perdidos, entregues e devolvidos.",
    icone: PackageSearch,
    detalhe: "Abrir módulo",
  },
  {
    href: "/sistema/portal-cidadao/comunicados",
    titulo: "Comunicados",
    descricao:
      "Avisos oficiais, campanhas e orientações destinadas à população.",
    icone: Bell,
    detalhe: "Gerenciar comunicados",
  },
  {
    href: "/sistema/portal-cidadao/contatos",
    titulo: "Contatos",
    descricao:
      "Telefones úteis, órgãos públicos, parceiros e canais de emergência.",
    icone: Phone,
    detalhe: "Abrir contatos",
  },
  {
    href: "/sistema/portal-cidadao/denuncias",
    titulo: "Denúncias",
    descricao:
      "Registro, triagem e acompanhamento de denúncias recebidas.",
    icone: MessageSquareWarning,
    detalhe: "Gerenciar denúncias",
  },
  {
    href: "/sistema/portal-cidadao/eventos",
    titulo: "Eventos",
    descricao:
      "Agenda de eventos, ações comunitárias e atividades públicas.",
    icone: CalendarDays,
    detalhe: "Abrir eventos",
  },
  {
    href: "/sistema/portal-cidadao/noticias",
    titulo: "Notícias",
    descricao:
      "Publicações e informações institucionais para a comunidade.",
    icone: Newspaper,
    detalhe: "Gerenciar notícias",
  },
  {
    href: "/sistema/portal-cidadao/ouvidoria",
    titulo: "Ouvidoria",
    descricao:
      "Manifestações, reclamações, elogios, sugestões e respostas.",
    icone: MessageSquare,
    detalhe: "Abrir ouvidoria",
  },
  {
    href: "/sistema/portal-cidadao/programas",
    titulo: "Projetos Sociais",
    descricao:
      "Programas comunitários e ações sociais da Guarda Municipal.",
    icone: Users,
    detalhe: "Abrir programas",
  },
  {
    href: "/sistema/portal-cidadao/protocolos",
    titulo: "Protocolos",
    descricao:
      "Consulta e acompanhamento dos atendimentos protocolados.",
    icone: FileText,
    detalhe: "Abrir protocolos",
  },
  {
    href: "/sistema/portal-cidadao/consultas",
    titulo: "Consultas",
    descricao:
      "Consulta segura de protocolos e serviços disponibilizados.",
    icone: Search,
    detalhe: "Realizar consulta",
  },
  {
    href: "/sistema/portal-cidadao/solicitacoes",
    titulo: "Solicitações",
    descricao:
      "Pedidos de apoio, serviços e demandas encaminhadas pelo cidadão.",
    icone: ClipboardList,
    detalhe: "Gerenciar solicitações",
  },
  {
    href: "/sistema/portal-cidadao/unidades",
    titulo: "Unidades e Telefones",
    descricao:
      "Bases, canais oficiais, horários de atendimento e localização.",
    icone: MapPin,
    detalhe: "Abrir unidades",
  },
];

function obterUsuarioLocal(): UsuarioLocal | null {
  if (typeof window === "undefined") return null;

  try {
    return JSON.parse(
      localStorage.getItem("usuarioLogado") || "null"
    ) as UsuarioLocal | null;
  } catch {
    return null;
  }
}

export default function PortalCidadaoPage() {
  const [totais, setTotais] = useState<TotaisPortal>({
    denuncias: 0,
    ouvidorias: 0,
    solicitacoes: 0,
    protocolos: 0,
    noticias: 0,
    comunicados: 0,
  });

  const [municipioNome, setMunicipioNome] =
    useState("Município");
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  async function carregar() {
    setCarregando(true);
    setErro("");

    try {
      const usuario = obterUsuarioLocal();

      if (!usuario?.perfil) {
        throw new Error("Usuário não identificado.");
      }

      const contexto = lerMunicipioContextoLocal();

      const municipioId = obterMunicipioIdEfetivo({
        perfil: usuario.perfil,
        municipioIdUsuario: usuario.municipio_id,
      });

      if (!municipioId) {
        throw new Error("Município não identificado.");
      }

      const [
        municipioResposta,
        denunciasResposta,
        ouvidoriasResposta,
        solicitacoesResposta,
        protocolosResposta,
        noticiasResposta,
        comunicadosResposta,
      ] = await Promise.all([
        supabase
          .from("municipios")
          .select("nome")
          .eq("id", municipioId)
          .maybeSingle(),

        supabase
          .from("denuncias")
          .select("id", { count: "exact", head: true })
          .eq("municipio_id", municipioId),

        supabase
          .from("ouvidorias")
          .select("id", { count: "exact", head: true })
          .eq("municipio_id", municipioId),

        supabase
          .from("solicitacoes")
          .select("id", { count: "exact", head: true })
          .eq("municipio_id", municipioId),

        supabase
          .from("protocolos_cidadao")
          .select("id", { count: "exact", head: true })
          .eq("municipio_id", municipioId),

        supabase
          .from("noticias")
          .select("id", { count: "exact", head: true })
          .eq("municipio_id", municipioId),

        supabase
          .from("comunicados")
          .select("id", { count: "exact", head: true })
          .eq("municipio_id", municipioId),
      ]);

      if (municipioResposta.error) {
        console.warn(
          "Falha parcial em municipios:",
          municipioResposta.error.message
        );
      }

      const falhas = [
        { origem: "denuncias", erro: denunciasResposta.error },
        { origem: "ouvidorias", erro: ouvidoriasResposta.error },
        { origem: "solicitacoes", erro: solicitacoesResposta.error },
        { origem: "protocolos_cidadao", erro: protocolosResposta.error },
        { origem: "noticias", erro: noticiasResposta.error },
        { origem: "comunicados", erro: comunicadosResposta.error },
      ].filter((item) => Boolean(item.erro));

      for (const falha of falhas) {
        console.warn(
          `Falha parcial em ${falha.origem}:`,
          falha.erro?.message
        );
      }

      setMunicipioNome(
        String(
          municipioResposta.data?.nome ||
            contexto?.nome ||
            "Município"
        )
      );

      setTotais({
        denuncias: denunciasResposta.count || 0,
        ouvidorias: ouvidoriasResposta.count || 0,
        solicitacoes: solicitacoesResposta.count || 0,
        protocolos: protocolosResposta.count || 0,
        noticias: noticiasResposta.count || 0,
        comunicados: comunicadosResposta.count || 0,
      });
    } catch (error) {
      console.error(
        "Erro ao carregar Portal do Cidadão:",
        error
      );

      setErro(
        error instanceof Error
          ? error.message
          : "Não foi possível carregar o Portal do Cidadão."
      );
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    void carregar();
  }, []);

  const totalAtendimentos = useMemo(
    () =>
      totais.denuncias +
      totais.ouvidorias +
      totais.solicitacoes +
      totais.protocolos,
    [totais]
  );

  return (
    <ProtecaoModulo modulo="portal_cidadao">
      <main className="sig-page">
        <div className="sig-page-content">
          <SigPageHeader
            titulo="Portal do Cidadão"
            subtitulo={`${municipioNome} • Atendimento, comunicação, participação social e serviços digitais.`}
            detalhe="Relacionamento com a comunidade"
            icone={Shield}
            acoes={
              <>
                <Link href="/sistema/portal-cidadao/protocolos">
                  <SigButton
                    type="primary"
                    icon={FileText}
                    size="sm"
                  >
                    Protocolos
                  </SigButton>
                </Link>

                <SigButton
                  type="cyan"
                  icon={RefreshCw}
                  size="sm"
                  loading={carregando}
                  onClick={() => void carregar()}
                >
                  Atualizar
                </SigButton>
              </>
            }
          />

          {erro ? <div className="sig-error">{erro}</div> : null}

          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-7">
            <SigStatCard
              titulo="Atendimentos"
              valor={totalAtendimentos}
              subtitulo="Base consolidada"
              icone={Users}
              destaque="cyan"
            />

            <SigStatCard
              titulo="Denúncias"
              valor={totais.denuncias}
              subtitulo="Registros recebidos"
              icone={MessageSquareWarning}
              destaque="red"
            />

            <SigStatCard
              titulo="Ouvidorias"
              valor={totais.ouvidorias}
              subtitulo="Manifestações registradas"
              icone={MessageSquare}
              destaque="amber"
            />

            <SigStatCard
              titulo="Solicitações"
              valor={totais.solicitacoes}
              subtitulo="Pedidos de serviço"
              icone={ClipboardList}
              destaque="blue"
            />

            <SigStatCard
              titulo="Protocolos"
              valor={totais.protocolos}
              subtitulo="Acompanhamentos"
              icone={FileText}
              destaque="green"
            />

            <SigStatCard
              titulo="Notícias"
              valor={totais.noticias}
              subtitulo="Publicações cadastradas"
              icone={Newspaper}
              destaque="slate"
            />

            <SigStatCard
              titulo="Comunicados"
              valor={totais.comunicados}
              subtitulo="Avisos institucionais"
              icone={Bell}
              destaque="cyan"
            />
          </section>

          {carregando ? (
            <div className="sig-loading">
              <div>
                <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-slate-700 border-t-cyan-400" />

                <p className="mt-4 text-slate-400">
                  Carregando informações do cidadão...
                </p>
              </div>
            </div>
          ) : (
            <>
              <section className="grid gap-4 xl:grid-cols-12">
                <SigCard className="xl:col-span-7">
                  <CabecalhoSecao
                    titulo="Fluxo de atendimento"
                    subtitulo="Integração entre os serviços do cidadão"
                    icone={Users}
                  />

                  <div className="mt-5 grid gap-3 md:grid-cols-2">
                    <Fluxo
                      titulo="Recebimento"
                      descricao="Denúncias, solicitações, ouvidorias e contatos entram pela central."
                    />

                    <Fluxo
                      titulo="Protocolo"
                      descricao="Cada atendimento recebe identificação para consulta e acompanhamento."
                    />

                    <Fluxo
                      titulo="Encaminhamento"
                      descricao="A demanda segue para o setor ou equipe responsável pelo atendimento."
                    />

                    <Fluxo
                      titulo="Retorno"
                      descricao="O cidadão acompanha a situação pelos canais públicos autorizados."
                    />
                  </div>
                </SigCard>

                <SigCard className="xl:col-span-5" destaque>
                  <CabecalhoSecao
                    titulo="Segurança e transparência"
                    subtitulo="Regras essenciais do atendimento"
                    icone={Shield}
                  />

                  <div className="mt-5 space-y-3">
                    <Regra texto="Dados sensíveis permanecem separados por município." />
                    <Regra texto="Denúncias anônimas não expõem identificação do cidadão." />
                    <Regra texto="Ações administrativas devem ser auditadas." />
                    <Regra texto="Consultas públicas exibem somente dados autorizados." />
                  </div>
                </SigCard>
              </section>

              <section>
                <div className="mb-4">
                  <h2 className="text-2xl font-black text-white">
                    Serviços do Cidadão
                  </h2>

                  <p className="mt-1 text-sm text-slate-400">
                    Acesse os módulos de atendimento, informação e participação social.
                  </p>
                </div>

                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                  {cards.map((card) => (
                    <SigActionCard
                      key={card.href}
                      titulo={card.titulo}
                      descricao={card.descricao}
                      href={card.href}
                      icone={card.icone}
                      detalhe={card.detalhe}
                    />
                  ))}
                </div>
              </section>
            </>
          )}
        </div>
      </main>
    </ProtecaoModulo>
  );
}

function CabecalhoSecao({
  titulo,
  subtitulo,
  icone: Icone,
}: {
  titulo: string;
  subtitulo: string;
  icone: typeof Shield;
}) {
  return (
    <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-cyan-400/20 bg-cyan-400/[0.07] text-cyan-300">
        <Icone className="h-5 w-5" />
      </div>

      <div>
        <h2 className="font-black text-white">{titulo}</h2>
        <p className="mt-0.5 text-xs text-slate-500">
          {subtitulo}
        </p>
      </div>
    </div>
  );
}

function Fluxo({
  titulo,
  descricao,
}: {
  titulo: string;
  descricao: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-950/45 p-4">
      <h3 className="font-black text-white">{titulo}</h3>

      <p className="mt-2 text-sm leading-6 text-slate-400">
        {descricao}
      </p>
    </div>
  );
}

function Regra({ texto }: { texto: string }) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-cyan-400/15 bg-cyan-400/[0.04] p-3">
      <Shield className="mt-0.5 h-4 w-4 shrink-0 text-cyan-300" />
      <span className="text-sm text-slate-300">{texto}</span>
    </div>
  );
}
