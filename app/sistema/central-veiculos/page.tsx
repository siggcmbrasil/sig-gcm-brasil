"use client";

import Link from "next/link";
import {
  AlertTriangle,
  CarFront,
  FileText,
  PlusCircle,
  RefreshCw,
  Search,
  ShieldAlert,
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

type Veiculo = {
  id: number;
  placa: string | null;
  marca: string | null;
  modelo: string | null;
  cor: string | null;
  ano: string | number | null;
  proprietario: string | null;
  situacao: string | null;
  nivel_alerta: string | null;
  criado_em: string | null;
};

const cards = [
  {
    titulo: "Novo Veículo",
    href: "/sistema/veiculos/novo",
    descricao:
      "Cadastrar um novo veículo abordado ou vinculado a um registro operacional.",
    icone: PlusCircle,
    detalhe: "Cadastrar veículo",
  },
  {
    titulo: "Veículos Abordados",
    href: "/sistema/veiculos",
    descricao:
      "Consultar, pesquisar e gerenciar os veículos registrados no sistema.",
    icone: CarFront,
    detalhe: "Abrir veículos",
  },
  {
    titulo: "Relatório de Abordagens",
    href: "/sistema/veiculos/relatorio",
    descricao:
      "Emitir relatórios por período, situação, placa, marca e município.",
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

function formatarPlaca(valor: string | null) {
  const placa = String(valor || "").trim().toUpperCase();
  return placa || "SEM PLACA";
}

export default function CentralVeiculosPage() {
  const [veiculos, setVeiculos] = useState<Veiculo[]>([]);
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

      const [municipioResposta, veiculosResposta] =
        await Promise.all([
          supabase
            .from("municipios")
            .select("nome")
            .eq("id", municipioId)
            .maybeSingle(),

          supabase
            .from("veiculos")
            .select("*")
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

      if (veiculosResposta.error) {
        throw veiculosResposta.error;
      }

      setMunicipioNome(
        String(
          municipioResposta.data?.nome ||
            contexto?.nome ||
            "Município"
        )
      );

      setVeiculos(
        (veiculosResposta.data as Veiculo[] | null) || []
      );
    } catch (error) {
      console.error(
        "Erro ao carregar Central de Veículos:",
        error
      );

      setErro(
        error instanceof Error
          ? error.message
          : "Não foi possível carregar a Central de Veículos."
      );
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    void carregar();
  }, []);

  const metricas = useMemo(() => {
    const comAlerta = veiculos.filter((item) => {
      const alerta = normalizar(item.nivel_alerta);
      const situacao = normalizar(item.situacao);

      return (
        ["MEDIO", "ALTO", "ALTO_RISCO", "CRITICO"].includes(
          alerta
        ) ||
        [
          "ROUBADO",
          "FURTADO",
          "PROCURADO",
          "APREENDIDO",
          "RESTRICAO",
        ].includes(situacao)
      );
    }).length;

    const apreendidos = veiculos.filter((item) =>
      ["APREENDIDO", "APREENDIDA"].includes(
        normalizar(item.situacao)
      )
    ).length;

    const marcas = new Set(
      veiculos
        .map((item) => item.marca?.trim())
        .filter((item): item is string => Boolean(item))
    );

    const proprietarios = new Set(
      veiculos
        .map((item) => item.proprietario?.trim())
        .filter((item): item is string => Boolean(item))
    );

    return {
      total: veiculos.length,
      comAlerta,
      apreendidos,
      marcas: marcas.size,
      proprietarios: proprietarios.size,
    };
  }, [veiculos]);

  return (
    <ProtecaoModulo modulo="veiculos_abordados">
      <main className="sig-page">
        <div className="sig-page-content">
          <SigPageHeader
            titulo="Central de Veículos"
            subtitulo={`${municipioNome} • Cadastro, pesquisa, alertas e histórico de veículos abordados.`}
            detalhe="Consulta operacional"
            icone={CarFront}
            acoes={
              <>
                <Link href="/sistema/veiculos/novo">
                  <SigButton
                    type="primary"
                    icon={PlusCircle}
                    size="sm"
                  >
                    Novo veículo
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
              titulo="Veículos"
              valor={metricas.total}
              subtitulo="Registros carregados"
              icone={CarFront}
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
              titulo="Apreendidos"
              valor={metricas.apreendidos}
              subtitulo="Situação operacional"
              icone={AlertTriangle}
              destaque="amber"
            />

            <SigStatCard
              titulo="Marcas"
              valor={metricas.marcas}
              subtitulo="Fabricantes identificados"
              icone={Search}
              destaque="blue"
            />

            <SigStatCard
              titulo="Proprietários"
              valor={metricas.proprietarios}
              subtitulo="Pessoas vinculadas"
              icone={FileText}
              destaque="slate"
            />
          </section>

          {carregando ? (
            <div className="sig-loading">
              <div>
                <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-slate-700 border-t-cyan-400" />

                <p className="mt-4 text-slate-400">
                  Carregando veículos...
                </p>
              </div>
            </div>
          ) : (
            <>
              <section className="grid gap-4 xl:grid-cols-12">
                <SigCard className="xl:col-span-7">
                  <CabecalhoSecao
                    titulo="Registros recentes"
                    subtitulo="Últimos veículos cadastrados"
                    icone={CarFront}
                  />

                  <div className="mt-5 space-y-3">
                    {veiculos.length === 0 ? (
                      <div className="rounded-2xl border border-dashed border-slate-700 p-10 text-center text-slate-500">
                        Nenhum veículo cadastrado.
                      </div>
                    ) : (
                      veiculos.slice(0, 8).map((veiculo) => (
                        <Link
                          key={veiculo.id}
                          href="/sistema/veiculos"
                          className="block rounded-2xl border border-slate-800 bg-slate-950/45 p-4 transition hover:border-cyan-400/25"
                        >
                          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                            <div className="min-w-0">
                              <p className="truncate font-black text-white">
                                {formatarPlaca(veiculo.placa)}
                              </p>

                              <p className="mt-1 truncate text-sm text-slate-400">
                                {[veiculo.marca, veiculo.modelo, veiculo.cor]
                                  .filter(Boolean)
                                  .join(" • ") || "Dados não informados"}
                              </p>

                              {veiculo.proprietario ? (
                                <p className="mt-1 truncate text-xs text-slate-500">
                                  Proprietário: {veiculo.proprietario}
                                </p>
                              ) : null}
                            </div>

                            <div className="flex flex-wrap items-center gap-2">
                              {veiculo.nivel_alerta ? (
                                <span className="rounded-full border border-red-400/20 bg-red-400/[0.06] px-2.5 py-1 text-[10px] font-black uppercase text-red-300">
                                  {veiculo.nivel_alerta}
                                </span>
                              ) : null}

                              <span className="rounded-full border border-slate-700 px-2.5 py-1 text-[10px] font-black uppercase text-slate-400">
                                {veiculo.situacao || "SEM ALERTA"}
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
                    subtitulo="Regras para dados veiculares"
                    icone={ShieldAlert}
                  />

                  <div className="mt-5 space-y-3">
                    <Regra texto="Consultas devem possuir finalidade operacional legítima." />
                    <Regra texto="Dados permanecem separados pelo município ativo." />
                    <Regra texto="Alertas intermunicipais exibem apenas o resumo autorizado." />
                    <Regra texto="Consultas e alterações sensíveis devem manter auditoria." />
                  </div>
                </SigCard>
              </section>

              <section>
                <div className="mb-4">
                  <h2 className="text-2xl font-black text-white">
                    Ferramentas de Veículos
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
  icone: typeof CarFront;
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
