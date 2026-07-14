"use client";

import Link from "next/link";
import {
  Archive,
  ClipboardList,
  Crosshair,
  FileText,
  PackageCheck,
  RefreshCw,
  ScrollText,
  ShieldCheck,
  Wrench,
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

type TotaisArmamentos = {
  armamentos: number;
  cautelas: number;
  municoes: number;
  manutencoes: number;
  documentos: number;
  inventario: number;
};

const modulos = [
  {
    titulo: "Armaria",
    descricao:
      "Controle geral da armaria, guarda, situação e movimentação.",
    href: "/sistema/armamentos/armaria",
    icone: ShieldCheck,
    detalhe: "Abrir armaria",
  },
  {
    titulo: "Cadastro",
    descricao:
      "Cadastro de armamentos, acessórios e itens controlados.",
    href: "/sistema/armamentos/cadastro",
    icone: ClipboardList,
    detalhe: "Cadastrar item",
  },
  {
    titulo: "Cautelas",
    descricao:
      "Entrega, devolução e responsabilidade por armamentos.",
    href: "/sistema/armamentos/cautelas",
    icone: PackageCheck,
    detalhe: "Gerenciar cautelas",
  },
  {
    titulo: "Documentos",
    descricao:
      "Registros, certificados, autorizações e arquivos vinculados.",
    href: "/sistema/armamentos/documentos",
    icone: FileText,
    detalhe: "Abrir documentos",
  },
  {
    titulo: "Inventário",
    descricao:
      "Conferência de estoque, patrimônio, quantidade e situação.",
    href: "/sistema/armamentos/inventario",
    icone: Archive,
    detalhe: "Abrir inventário",
  },
  {
    titulo: "Manutenção",
    descricao:
      "Revisões, inspeções, manutenção, baixa e retorno ao serviço.",
    href: "/sistema/armamentos/manutencao",
    icone: Wrench,
    detalhe: "Abrir manutenção",
  },
  {
    titulo: "Munições",
    descricao:
      "Controle por calibre, lote, quantidade, validade e movimentação.",
    href: "/sistema/armamentos/municoes",
    icone: Crosshair,
    detalhe: "Gerenciar munições",
  },
  {
    titulo: "Relatórios",
    descricao:
      "Relatórios de cautelas, inventário, manutenção e auditoria.",
    href: "/sistema/armamentos/relatorios",
    icone: ScrollText,
    detalhe: "Abrir relatórios",
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

export default function CentralArmamentosPage() {
  const [totais, setTotais] = useState<TotaisArmamentos>({
    armamentos: 0,
    cautelas: 0,
    municoes: 0,
    manutencoes: 0,
    documentos: 0,
    inventario: 0,
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
        armamentosResposta,
        cautelasResposta,
        municoesResposta,
        manutencoesResposta,
        documentosResposta,
        inventarioResposta,
      ] = await Promise.all([
        supabase
          .from("municipios")
          .select("nome")
          .eq("id", municipioId)
          .maybeSingle(),

        supabase
          .from("armamentos")
          .select("id", { count: "exact", head: true })
          .eq("municipio_id", municipioId),

        supabase
          .from("armamento_cautelas")
          .select("id", { count: "exact", head: true })
          .eq("municipio_id", municipioId),

        supabase
          .from("armamento_municoes")
          .select("id", { count: "exact", head: true })
          .eq("municipio_id", municipioId),

        supabase
          .from("armamento_manutencoes")
          .select("id", { count: "exact", head: true })
          .eq("municipio_id", municipioId),

        supabase
          .from("armamento_documentos")
          .select("id", { count: "exact", head: true })
          .eq("municipio_id", municipioId),

        supabase
          .from("armamento_inventario")
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
        { origem: "armamentos", erro: armamentosResposta.error },
        { origem: "armamento_cautelas", erro: cautelasResposta.error },
        { origem: "armamento_municoes", erro: municoesResposta.error },
        { origem: "armamento_manutencoes", erro: manutencoesResposta.error },
        { origem: "armamento_documentos", erro: documentosResposta.error },
        { origem: "armamento_inventario", erro: inventarioResposta.error },
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
        armamentos: armamentosResposta.count || 0,
        cautelas: cautelasResposta.count || 0,
        municoes: municoesResposta.count || 0,
        manutencoes: manutencoesResposta.count || 0,
        documentos: documentosResposta.count || 0,
        inventario: inventarioResposta.count || 0,
      });
    } catch (error) {
      console.error(
        "Erro ao carregar Central de Armamentos:",
        error
      );

      setErro(
        error instanceof Error
          ? error.message
          : "Não foi possível carregar a Central de Armamentos."
      );
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    void carregar();
  }, []);

  const totalControle = useMemo(
    () =>
      totais.armamentos +
      totais.cautelas +
      totais.municoes +
      totais.manutencoes +
      totais.documentos +
      totais.inventario,
    [totais]
  );

  return (
    <ProtecaoModulo modulo="armamentos">
      <main className="sig-page">
        <div className="sig-page-content">
          <SigPageHeader
            titulo="Central de Armamentos"
            subtitulo={`${municipioNome} • Armaria, cautelas, munições, inventário, manutenção, documentos e relatórios.`}
            detalhe="Controle restrito"
            icone={ShieldCheck}
            acoes={
              <>
                <Link href="/sistema/armamentos/cadastro">
                  <SigButton
                    type="primary"
                    icon={ClipboardList}
                    size="sm"
                  >
                    Novo cadastro
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
              titulo="Armamentos"
              valor={totais.armamentos}
              subtitulo="Itens cadastrados"
              icone={ShieldCheck}
              destaque="cyan"
            />

            <SigStatCard
              titulo="Cautelas"
              valor={totais.cautelas}
              subtitulo="Registros de responsabilidade"
              icone={PackageCheck}
              destaque="green"
            />

            <SigStatCard
              titulo="Munições"
              valor={totais.municoes}
              subtitulo="Registros de controle"
              icone={Crosshair}
              destaque="amber"
            />

            <SigStatCard
              titulo="Manutenções"
              valor={totais.manutencoes}
              subtitulo="Revisões e inspeções"
              icone={Wrench}
              destaque="red"
            />

            <SigStatCard
              titulo="Documentos"
              valor={totais.documentos}
              subtitulo="Arquivos vinculados"
              icone={FileText}
              destaque="blue"
            />

            <SigStatCard
              titulo="Inventário"
              valor={totais.inventario}
              subtitulo="Conferências registradas"
              icone={Archive}
              destaque="slate"
            />

            <SigStatCard
              titulo="Base controlada"
              valor={totalControle}
              subtitulo="Registros integrados"
              icone={ScrollText}
              destaque="cyan"
            />
          </section>

          {carregando ? (
            <div className="sig-loading">
              <div>
                <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-slate-700 border-t-cyan-400" />
                <p className="mt-4 text-slate-400">
                  Carregando dados da armaria...
                </p>
              </div>
            </div>
          ) : (
            <>
              <section className="grid gap-4 xl:grid-cols-12">
                <SigCard className="xl:col-span-7">
                  <CabecalhoSecao
                    titulo="Situação da armaria"
                    subtitulo="Resumo dos principais controles"
                    icone={ShieldCheck}
                  />

                  <div className="mt-5 grid gap-3 md:grid-cols-2">
                    <Painel
                      titulo="Itens cadastrados"
                      valor={totais.armamentos}
                    />
                    <Painel
                      titulo="Cautelas registradas"
                      valor={totais.cautelas}
                    />
                    <Painel
                      titulo="Manutenções registradas"
                      valor={totais.manutencoes}
                    />
                    <Painel
                      titulo="Documentos vinculados"
                      valor={totais.documentos}
                    />
                  </div>
                </SigCard>

                <SigCard className="xl:col-span-5" destaque>
                  <CabecalhoSecao
                    titulo="Regras de controle"
                    subtitulo="Segurança e responsabilidade"
                    icone={PackageCheck}
                  />

                  <div className="mt-5 space-y-3">
                    <Regra texto="Toda cautela deve identificar responsável, item, data e situação." />
                    <Regra texto="Manutenções, baixas e movimentações devem ser auditadas." />
                    <Regra texto="Documentos e registros permanecem isolados por município." />
                    <Regra texto="Inventários devem manter histórico de conferência." />
                  </div>
                </SigCard>
              </section>

              <section>
                <div className="mb-4">
                  <h2 className="text-2xl font-black text-white">
                    Módulos de Armamentos
                  </h2>
                  <p className="mt-1 text-sm text-slate-400">
                    Acesse as ferramentas de controle da armaria.
                  </p>
                </div>

                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
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
  icone: typeof ShieldCheck;
}) {
  return (
    <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-cyan-400/20 bg-cyan-400/[0.07] text-cyan-300">
        <Icone className="h-5 w-5" />
      </div>

      <div>
        <h2 className="font-black text-white">{titulo}</h2>
        <p className="mt-0.5 text-xs text-slate-500">{subtitulo}</p>
      </div>
    </div>
  );
}

function Painel({
  titulo,
  valor,
}: {
  titulo: string;
  valor: number;
}) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-950/45 p-4">
      <p className="text-sm text-slate-400">{titulo}</p>
      <p className="mt-2 text-3xl font-black text-white">{valor}</p>
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
