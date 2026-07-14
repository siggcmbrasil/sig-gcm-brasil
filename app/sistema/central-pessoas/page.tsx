"use client";

import Link from "next/link";
import {
  AlertTriangle,
  FileText,
  RefreshCw,
  Search,
  ShieldAlert,
  UserPlus,
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

type Pessoa = {
  id: number;
  nome: string | null;
  cpf: string | null;
  documento: string | null;
  telefone: string | null;
  cidade: string | null;
  bairro: string | null;
  situacao: string | null;
  nivel_alerta: string | null;
  criado_em: string | null;
};

const cards = [
  {
    titulo: "Nova Pessoa",
    href: "/sistema/pessoas/nova",
    descricao:
      "Cadastrar uma nova pessoa abordada ou vinculada a um registro operacional.",
    icone: UserPlus,
    detalhe: "Cadastrar pessoa",
  },
  {
    titulo: "Pessoas Abordadas",
    href: "/sistema/pessoas",
    descricao:
      "Consultar, pesquisar e gerenciar pessoas registradas no sistema.",
    icone: Users,
    detalhe: "Abrir pessoas",
  },
  {
    titulo: "Relatório de Abordagens",
    href: "/sistema/pessoas/relatorio",
    descricao:
      "Emitir relatórios de pessoas abordadas por período, situação e local.",
    icone: FileText,
    detalhe: "Gerar relatório",
  },
];

function obterUsuarioLocal(): UsuarioLocal | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    return JSON.parse(
      localStorage.getItem("usuarioLogado") || "null"
    ) as UsuarioLocal | null;
  } catch {
    return null;
  }
}

function normalizar(valor: unknown) {
  return String(valor || "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "_");
}

function mascararDocumento(valor: string | null) {
  if (!valor) {
    return "Documento não informado";
  }

  const limpo = valor.replace(/\D/g, "");

  if (limpo.length === 11) {
    return `${limpo.slice(0, 3)}.***.***-${limpo.slice(-2)}`;
  }

  return valor;
}

export default function CentralPessoasPage() {
  const [pessoas, setPessoas] = useState<Pessoa[]>([]);
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

      const [municipioResposta, pessoasResposta] =
        await Promise.all([
          supabase
            .from("municipios")
            .select("nome")
            .eq("id", municipioId)
            .maybeSingle(),

          supabase
            .from("pessoas")
            .select(
              "id,nome,cpf,documento,telefone,cidade,bairro,situacao,nivel_alerta,criado_em"
            )
            .eq("municipio_id", municipioId)
            .order("id", { ascending: false })
            .limit(100),
        ]);

      if (municipioResposta.error) {
        console.warn(
          "Falha parcial em municipios:",
          municipioResposta.error.message
        );
      }

      if (pessoasResposta.error) {
        throw pessoasResposta.error;
      }

      setMunicipioNome(
        String(
          municipioResposta.data?.nome ||
            contexto?.nome ||
            "Município"
        )
      );

      setPessoas(
        (pessoasResposta.data as Pessoa[] | null) || []
      );
    } catch (error) {
      console.error(
        "Erro ao carregar Central de Pessoas:",
        error
      );

      setErro(
        error instanceof Error
          ? error.message
          : "Não foi possível carregar a Central de Pessoas."
      );
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    void carregar();
  }, []);

  const metricas = useMemo(() => {
    const comAlerta = pessoas.filter((item) => {
      const alerta = normalizar(item.nivel_alerta);
      const situacao = normalizar(item.situacao);

      return (
        ["MEDIO", "ALTO", "ALTO_RISCO", "CRITICO"].includes(
          alerta
        ) ||
        [
          "PROCURADO",
          "MANDADO_EM_ABERTO",
          "FORAGIDO",
          "DESAPARECIDO",
        ].includes(situacao)
      );
    }).length;

    const procuradas = pessoas.filter((item) =>
      [
        "PROCURADO",
        "MANDADO_EM_ABERTO",
        "FORAGIDO",
      ].includes(normalizar(item.situacao))
    ).length;

    const cidades = new Set(
      pessoas
        .map((item) => item.cidade?.trim())
        .filter((item): item is string => Boolean(item))
    );

    const bairros = new Set(
      pessoas
        .map((item) => item.bairro?.trim())
        .filter((item): item is string => Boolean(item))
    );

    return {
      total: pessoas.length,
      comAlerta,
      procuradas,
      cidades: cidades.size,
      bairros: bairros.size,
    };
  }, [pessoas]);

  return (
    <ProtecaoModulo modulo="pessoas_abordadas">
      <main className="sig-page">
        <div className="sig-page-content">
          <SigPageHeader
            titulo="Central de Pessoas"
            subtitulo={`${municipioNome} • Cadastro, pesquisa, alertas e histórico de pessoas abordadas.`}
            detalhe="Consulta operacional"
            icone={Users}
            acoes={
              <>
                <Link href="/sistema/pessoas/nova">
                  <SigButton
                    type="primary"
                    icon={UserPlus}
                    size="sm"
                  >
                    Nova pessoa
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

          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
            <SigStatCard
              titulo="Pessoas"
              valor={metricas.total}
              subtitulo="Registros carregados"
              icone={Users}
              destaque="cyan"
            />

            <SigStatCard
              titulo="Com alerta"
              valor={metricas.comAlerta}
              subtitulo="Exigem atenção"
              icone={ShieldAlert}
              destaque="red"
            />

            <SigStatCard
              titulo="Procuradas"
              valor={metricas.procuradas}
              subtitulo="Situação crítica"
              icone={AlertTriangle}
              destaque="amber"
            />

            <SigStatCard
              titulo="Cidades"
              valor={metricas.cidades}
              subtitulo="Municípios identificados"
              icone={Search}
              destaque="blue"
            />

            <SigStatCard
              titulo="Bairros"
              valor={metricas.bairros}
              subtitulo="Áreas registradas"
              icone={FileText}
              destaque="slate"
            />
          </section>

          {carregando ? (
            <div className="sig-loading">
              <div>
                <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-slate-700 border-t-cyan-400" />

                <p className="mt-4 text-slate-400">
                  Carregando pessoas...
                </p>
              </div>
            </div>
          ) : (
            <>
              <section className="grid gap-4 xl:grid-cols-12">
                <SigCard className="xl:col-span-7">
                  <CabecalhoSecao
                    titulo="Registros recentes"
                    subtitulo="Últimas pessoas cadastradas"
                    icone={Users}
                  />

                  <div className="mt-5 space-y-3">
                    {pessoas.length === 0 ? (
                      <div className="rounded-2xl border border-dashed border-slate-700 p-10 text-center text-slate-500">
                        Nenhuma pessoa cadastrada.
                      </div>
                    ) : (
                      pessoas.slice(0, 8).map((pessoa) => (
                        <Link
                          key={pessoa.id}
                          href="/sistema/pessoas"
                          className="block rounded-2xl border border-slate-800 bg-slate-950/45 p-4 transition hover:border-cyan-400/25"
                        >
                          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                            <div className="min-w-0">
                              <p className="truncate font-black text-white">
                                {pessoa.nome ||
                                  `Pessoa ${pessoa.id}`}
                              </p>

                              <p className="mt-1 truncate text-sm text-slate-400">
                                {mascararDocumento(
                                  pessoa.cpf || pessoa.documento
                                )}
                                {pessoa.bairro
                                  ? ` • ${pessoa.bairro}`
                                  : ""}
                              </p>
                            </div>

                            <div className="flex flex-wrap items-center gap-2">
                              {pessoa.nivel_alerta ? (
                                <span className="rounded-full border border-red-400/20 bg-red-400/[0.06] px-2.5 py-1 text-[10px] font-black uppercase text-red-300">
                                  {pessoa.nivel_alerta}
                                </span>
                              ) : null}

                              <span className="rounded-full border border-slate-700 px-2.5 py-1 text-[10px] font-black uppercase text-slate-400">
                                {pessoa.situacao || "SEM ALERTA"}
                              </span>
                            </div>
                          </div>
                        </Link>
                      ))
                    )}
                  </div>
                </SigCard>

                <SigCard className="xl:col-span-5" destaque>
                  <CabecalhoSecao
                    titulo="Segurança da consulta"
                    subtitulo="Regras para dados pessoais"
                    icone={ShieldAlert}
                  />

                  <div className="mt-5 space-y-3">
                    <Regra texto="Consultas devem possuir finalidade operacional legítima." />
                    <Regra texto="Dados sensíveis permanecem separados por município." />
                    <Regra texto="Alertas intermunicipais não expõem a ocorrência completa." />
                    <Regra texto="Ações de consulta e alteração devem manter auditoria." />
                  </div>
                </SigCard>
              </section>

              <section>
                <div className="mb-4">
                  <h2 className="text-2xl font-black text-white">
                    Ferramentas de Pessoas
                  </h2>

                  <p className="mt-1 text-sm text-slate-400">
                    Cadastre, consulte e emita relatórios operacionais.
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
  icone: typeof Users;
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

function Regra({ texto }: { texto: string }) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-cyan-400/15 bg-cyan-400/[0.04] p-3">
      <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-cyan-300" />

      <span className="text-sm text-slate-300">
        {texto}
      </span>
    </div>
  );
}
