"use client";

import Link from "next/link";
import {
  BookOpen,
  FileCheck,
  FileText,
  Handshake,
  RefreshCw,
  Scale,
  ScrollText,
  ShieldCheck,
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

type TotaisJuridicos = {
  legislacao: number;
  oficios: number;
  recebidos: number;
  termos: number;
  convenios: number;
};

const cards = [
  {
    titulo: "Legislação",
    icone: Scale,
    href: "/sistema/legislacao",
    descricao:
      "Consulta de leis, normas, códigos e regulamentos aplicáveis.",
    detalhe: "Abrir legislação",
  },
  {
    titulo: "Ofícios",
    icone: FileText,
    href: "/sistema/oficios",
    descricao:
      "Emissão, tramitação e controle de ofícios institucionais.",
    detalhe: "Gerenciar ofícios",
  },
  {
    titulo: "Ofícios Recebidos",
    icone: ScrollText,
    href: "/sistema/oficios-recebidos",
    descricao:
      "Controle, leitura e encaminhamento de documentos recebidos.",
    detalhe: "Abrir recebidos",
  },
  {
    titulo: "Termos",
    icone: FileCheck,
    href: "/sistema/termos",
    descricao:
      "Modelos de termos e documentos administrativos padronizados.",
    detalhe: "Abrir termos",
  },
  {
    titulo: "Convênios",
    icone: Handshake,
    href: "/sistema/convenios",
    descricao:
      "Controle de convênios, acordos e parcerias institucionais.",
    detalhe: "Gerenciar convênios",
  },
  {
    titulo: "SIG Legislação",
    icone: BookOpen,
    href: "/sistema/sig-legislacao",
    descricao:
      "Módulo avançado de estudos, pesquisa e consultas jurídicas.",
    detalhe: "Abrir SIG Legislação",
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

export default function CentralJuridicaPage() {
  const [totais, setTotais] = useState<TotaisJuridicos>({
    legislacao: 0,
    oficios: 0,
    recebidos: 0,
    termos: 0,
    convenios: 0,
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
        legislacaoResposta,
        oficiosResposta,
        recebidosResposta,
        termosResposta,
        conveniosResposta,
      ] = await Promise.all([
        supabase
          .from("municipios")
          .select("nome")
          .eq("id", municipioId)
          .maybeSingle(),

        supabase
          .from("legislacao")
          .select("id", { count: "exact", head: true })
          .eq("municipio_id", municipioId),

        supabase
          .from("oficios")
          .select("id", { count: "exact", head: true })
          .eq("municipio_id", municipioId),

        supabase
          .from("oficios_recebidos")
          .select("id", { count: "exact", head: true })
          .eq("municipio_id", municipioId),

        supabase
          .from("termos")
          .select("id", { count: "exact", head: true })
          .eq("municipio_id", municipioId),

        supabase
          .from("convenios")
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
        { origem: "legislacao", erro: legislacaoResposta.error },
        { origem: "oficios", erro: oficiosResposta.error },
        { origem: "oficios_recebidos", erro: recebidosResposta.error },
        { origem: "termos", erro: termosResposta.error },
        { origem: "convenios", erro: conveniosResposta.error },
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
        legislacao: legislacaoResposta.count || 0,
        oficios: oficiosResposta.count || 0,
        recebidos: recebidosResposta.count || 0,
        termos: termosResposta.count || 0,
        convenios: conveniosResposta.count || 0,
      });
    } catch (error) {
      console.error(
        "Erro ao carregar Central Jurídica:",
        error
      );

      setErro(
        error instanceof Error
          ? error.message
          : "Não foi possível carregar a Central Jurídica."
      );
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    void carregar();
  }, []);

  const totalDocumentos = useMemo(
    () =>
      totais.legislacao +
      totais.oficios +
      totais.recebidos +
      totais.termos +
      totais.convenios,
    [totais]
  );

  return (
    <ProtecaoModulo modulo="legislacao">
      <main className="sig-page">
        <div className="sig-page-content">
          <SigPageHeader
            titulo="Central Jurídica"
            subtitulo={`${municipioNome} • Legislação, ofícios, termos, convênios e estudos jurídicos.`}
            detalhe="Gestão jurídica e documental"
            icone={Scale}
            acoes={
              <>
                <Link href="/sistema/legislacao">
                  <SigButton
                    type="primary"
                    icon={Scale}
                    size="sm"
                  >
                    Legislação
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

          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
            <SigStatCard
              titulo="Normas cadastradas"
              valor={totais.legislacao}
              subtitulo="Leis e regulamentos"
              icone={Scale}
              destaque="cyan"
            />

            <SigStatCard
              titulo="Ofícios emitidos"
              valor={totais.oficios}
              subtitulo="Documentos expedidos"
              icone={FileText}
              destaque="blue"
            />

            <SigStatCard
              titulo="Ofícios recebidos"
              valor={totais.recebidos}
              subtitulo="Documentos protocolados"
              icone={ScrollText}
              destaque="amber"
            />

            <SigStatCard
              titulo="Termos"
              valor={totais.termos}
              subtitulo="Modelos e registros"
              icone={FileCheck}
              destaque="green"
            />

            <SigStatCard
              titulo="Convênios"
              valor={totais.convenios}
              subtitulo="Parcerias institucionais"
              icone={Handshake}
              destaque="red"
            />

            <SigStatCard
              titulo="Base jurídica"
              valor={totalDocumentos}
              subtitulo="Registros integrados"
              icone={BookOpen}
              destaque="slate"
            />
          </section>

          {carregando ? (
            <div className="sig-loading">
              <div>
                <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-slate-700 border-t-cyan-400" />
                <p className="mt-4 text-slate-400">
                  Carregando dados jurídicos...
                </p>
              </div>
            </div>
          ) : (
            <>
              <section className="grid gap-4 xl:grid-cols-12">
                <SigCard className="xl:col-span-7">
                  <CabecalhoSecao
                    titulo="Cobertura jurídica"
                    subtitulo="Documentos e instrumentos integrados"
                    icone={BookOpen}
                  />

                  <div className="mt-5 grid gap-3 md:grid-cols-2">
                    <Painel
                      titulo="Legislação"
                      descricao="Leis, normas, códigos e regulamentos para consulta institucional."
                    />

                    <Painel
                      titulo="Documentos oficiais"
                      descricao="Ofícios emitidos, recebidos e acompanhados pelo município."
                    />

                    <Painel
                      titulo="Termos"
                      descricao="Modelos e documentos administrativos padronizados."
                    />

                    <Painel
                      titulo="Convênios"
                      descricao="Acordos e parcerias institucionais com histórico."
                    />
                  </div>
                </SigCard>

                <SigCard className="xl:col-span-5" destaque>
                  <CabecalhoSecao
                    titulo="Controle documental"
                    subtitulo="Regras essenciais da Central Jurídica"
                    icone={ShieldCheck}
                  />

                  <div className="mt-5 space-y-3">
                    <Regra texto="Documentos devem permanecer vinculados ao município ativo." />
                    <Regra texto="Ofícios devem manter protocolo, tramitação e histórico." />
                    <Regra texto="Alterações sensíveis devem registrar auditoria." />
                    <Regra texto="Consultas jurídicas devem respeitar permissões de acesso." />
                  </div>
                </SigCard>
              </section>

              <section>
                <div className="mb-4">
                  <h2 className="text-2xl font-black text-white">
                    Ferramentas Jurídicas
                  </h2>

                  <p className="mt-1 text-sm text-slate-400">
                    Acesse legislação, documentos e instrumentos institucionais.
                  </p>
                </div>

                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
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
  icone: typeof Scale;
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
      <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-cyan-300" />
      <span className="text-sm text-slate-300">{texto}</span>
    </div>
  );
}
