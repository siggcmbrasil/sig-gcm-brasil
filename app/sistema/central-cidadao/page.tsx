"use client";

import Link from "next/link";
import {
  Bell,
  ClipboardList,
  FileText,
  Landmark,
  Megaphone,
  MessageSquareWarning,
  Phone,
  RefreshCw,
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

type TotaisCidadao = {
  denuncias: number;
  ouvidorias: number;
  solicitacoes: number;
  protocolos: number;
  eventos: number;
  noticias: number;
};

const modulos = [
  {
    titulo: "Denúncias",
    href: "/sistema/portal-cidadao/denuncias",
    descricao: "Registro, triagem e acompanhamento de denúncias.",
    icone: MessageSquareWarning,
    detalhe: "Abrir denúncias",
  },
  {
    titulo: "Ouvidoria",
    href: "/sistema/portal-cidadao/ouvidoria",
    descricao: "Sugestões, elogios, reclamações e manifestações.",
    icone: Megaphone,
    detalhe: "Abrir ouvidoria",
  },
  {
    titulo: "Solicitações",
    href: "/sistema/portal-cidadao/solicitacoes",
    descricao: "Pedidos de apoio, serviços e demandas do cidadão.",
    icone: ClipboardList,
    detalhe: "Abrir solicitações",
  },
  {
    titulo: "Protocolos",
    href: "/sistema/portal-cidadao/protocolos",
    descricao: "Consulta e acompanhamento dos protocolos registrados.",
    icone: FileText,
    detalhe: "Abrir protocolos",
  },
  {
    titulo: "Eventos",
    href: "/sistema/portal-cidadao/eventos",
    descricao: "Eventos, ações comunitárias e atividades institucionais.",
    icone: Bell,
    detalhe: "Abrir eventos",
  },
  {
    titulo: "Notícias",
    href: "/sistema/portal-cidadao/noticias",
    descricao: "Notícias, campanhas e comunicados oficiais.",
    icone: Bell,
    detalhe: "Abrir notícias",
  },
  {
    titulo: "Contatos Úteis",
    href: "/sistema/portal-cidadao/contatos",
    descricao: "Telefones, órgãos e canais de atendimento.",
    icone: Phone,
    detalhe: "Abrir contatos",
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

export default function CentralCidadaoPage() {
  const [totais, setTotais] = useState<TotaisCidadao>({
    denuncias: 0,
    ouvidorias: 0,
    solicitacoes: 0,
    protocolos: 0,
    eventos: 0,
    noticias: 0,
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
        eventosResposta,
        noticiasResposta,
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
          .from("eventos")
          .select("id", { count: "exact", head: true })
          .eq("municipio_id", municipioId),

        supabase
          .from("noticias")
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
        { origem: "eventos", erro: eventosResposta.error },
        { origem: "noticias", erro: noticiasResposta.error },
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
        eventos: eventosResposta.count || 0,
        noticias: noticiasResposta.count || 0,
      });
    } catch (error) {
      console.error(
        "Erro ao carregar Central do Cidadão:",
        error
      );

      setErro(
        error instanceof Error
          ? error.message
          : "Não foi possível carregar a Central do Cidadão."
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
            titulo="Central do Cidadão"
            subtitulo={`${municipioNome} • Serviços públicos, atendimento, informação e participação social.`}
            detalhe="Atendimento ao cidadão"
            icone={Landmark}
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
              icone={Megaphone}
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
              titulo="Eventos"
              valor={totais.eventos}
              subtitulo="Ações cadastradas"
              icone={Bell}
              destaque="slate"
            />

            <SigStatCard
              titulo="Notícias"
              valor={totais.noticias}
              subtitulo="Publicações oficiais"
              icone={Bell}
              destaque="cyan"
            />
          </section>

          {carregando ? (
            <div className="sig-loading">
              <div>
                <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-slate-700 border-t-cyan-400" />

                <p className="mt-4 text-slate-400">
                  Carregando serviços do cidadão...
                </p>
              </div>
            </div>
          ) : (
            <>
              <section className="grid gap-4 xl:grid-cols-12">
                <SigCard className="xl:col-span-7">
                  <CabecalhoSecao
                    titulo="Fluxo de atendimento"
                    subtitulo="Da solicitação ao retorno ao cidadão"
                    icone={Users}
                  />

                  <div className="mt-5 grid gap-3 md:grid-cols-2">
                    <Painel
                      titulo="Recebimento"
                      descricao="Denúncias, solicitações e manifestações entram pela Central do Cidadão."
                    />

                    <Painel
                      titulo="Protocolo"
                      descricao="Cada atendimento recebe identificação para consulta e acompanhamento."
                    />

                    <Painel
                      titulo="Encaminhamento"
                      descricao="A demanda segue para o setor ou equipe responsável."
                    />

                    <Painel
                      titulo="Retorno"
                      descricao="O cidadão acompanha o andamento pelos canais autorizados."
                    />
                  </div>
                </SigCard>

                <SigCard className="xl:col-span-5" destaque>
                  <CabecalhoSecao
                    titulo="Transparência e segurança"
                    subtitulo="Regras essenciais do atendimento"
                    icone={Landmark}
                  />

                  <div className="mt-5 space-y-3">
                    <Regra texto="Todo atendimento deve gerar protocolo quando aplicável." />
                    <Regra texto="Dados sensíveis permanecem separados por município." />
                    <Regra texto="Denúncias anônimas não expõem identificação do cidadão." />
                    <Regra texto="Consultas públicas exibem somente dados autorizados." />
                  </div>
                </SigCard>
              </section>

              <section>
                <div className="mb-4">
                  <h2 className="text-2xl font-black text-white">
                    Serviços Disponíveis
                  </h2>

                  <p className="mt-1 text-sm text-slate-400">
                    Acesse os canais de atendimento e informação.
                  </p>
                </div>

                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                  {modulos.map((modulo) => (
                    <SigActionCard
                      key={modulo.href}
                      titulo={modulo.titulo}
                      descricao={modulo.descricao}
                      href={modulo.href}
                      icone={modulo.icone}
                      detalhe={modulo.detalhe}
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
  icone: typeof Landmark;
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

function Painel({
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
      <Landmark className="mt-0.5 h-4 w-4 shrink-0 text-cyan-300" />
      <span className="text-sm text-slate-300">{texto}</span>
    </div>
  );
}
