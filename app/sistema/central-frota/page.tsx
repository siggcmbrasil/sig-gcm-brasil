"use client";

import Link from "next/link";
import {
  AlertTriangle,
  CarFront,
  CircleGauge,
  ClipboardCheck,
  Fuel,
  RefreshCw,
  Truck,
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

type Viatura = {
  id: number;
  prefixo: string | null;
  modelo: string | null;
  placa: string | null;
  status: string | null;
  combustivel: string | null;
  quilometragem: string | number | null;
};

const cards = [
  {
    titulo: "Viaturas",
    icone: CarFront,
    href: "/sistema/central-frota/viaturas",
    descricao:
      "Cadastro, consulta, situação operacional e histórico das viaturas.",
    detalhe: "Gerenciar frota",
  },
  {
    titulo: "Abastecimentos",
    icone: Fuel,
    href: "/sistema/central-frota/abastecimentos",
    descricao:
      "Controle de combustível, consumo, custo e abastecimentos realizados.",
    detalhe: "Abrir abastecimentos",
  },
  {
    titulo: "Manutenções",
    icone: Wrench,
    href: "/sistema/central-frota/manutencoes",
    descricao:
      "Manutenções preventivas, corretivas, serviços e despesas da frota.",
    detalhe: "Abrir manutenções",
  },
  {
    titulo: "Checklist de Viaturas",
    icone: ClipboardCheck,
    href: "/sistema/central-frota/checklist-viaturas",
    descricao:
      "Inspeção antes e depois do serviço, itens críticos e histórico.",
    detalhe: "Realizar checklist",
  },
  {
    titulo: "Danos em Viaturas",
    icone: AlertTriangle,
    href: "/sistema/central-frota/danos-viaturas",
    descricao:
      "Registro de avarias, danos, ocorrências e acompanhamento de reparos.",
    detalhe: "Gerenciar danos",
  },
  {
    titulo: "Pneus",
    icone: CircleGauge,
    href: "/sistema/central-frota/pneus",
    descricao:
      "Controle de pneus, trocas, rodízios, quilometragem e vida útil.",
    detalhe: "Gerenciar pneus",
  },
];

function normalizarStatus(valor: unknown) {
  return String(valor || "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "_");
}

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

function numeroQuilometragem(valor: string | number | null) {
  if (typeof valor === "number") return valor;

  const numero = Number(
    String(valor || "")
      .replace(/\./g, "")
      .replace(",", ".")
      .replace(/[^\d.-]/g, "")
  );

  return Number.isFinite(numero) ? numero : 0;
}

export default function CentralFrotaPage() {
  const [viaturas, setViaturas] = useState<Viatura[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [municipioNome, setMunicipioNome] = useState("");

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

      const [municipioResposta, viaturasResposta] =
        await Promise.all([
          supabase
            .from("municipios")
            .select("nome")
            .eq("id", municipioId)
            .maybeSingle(),

          supabase
            .from("viaturas")
            .select(
              "id,prefixo,modelo,placa,status,combustivel,quilometragem"
            )
            .eq("municipio_id", municipioId)
            .order("prefixo"),
        ]);

      if (viaturasResposta.error) {
        throw viaturasResposta.error;
      }

      if (municipioResposta.error) {
        console.warn(
          "Não foi possível carregar o nome do município:",
          municipioResposta.error.message
        );
      }

      setMunicipioNome(
        String(
          municipioResposta.data?.nome ||
            contexto?.nome ||
            "Município"
        )
      );

      setViaturas(
        (viaturasResposta.data as Viatura[] | null) || []
      );
    } catch (error) {
      console.error("Erro ao carregar Central de Frota:", error);

      setErro(
        error instanceof Error
          ? error.message
          : "Não foi possível carregar a Central de Frota."
      );
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    void carregar();
  }, []);

  const metricas = useMemo(() => {
    const operacionais = viaturas.filter((item) =>
      [
        "ATIVA",
        "OPERACIONAL",
        "EM_SERVICO",
        "DISPONIVEL",
        "RESERVA",
      ].includes(normalizarStatus(item.status))
    ).length;

    const manutencao = viaturas.filter((item) =>
      [
        "MANUTENCAO",
        "EM_MANUTENCAO",
        "OFICINA",
        "INDISPONIVEL",
      ].includes(normalizarStatus(item.status))
    ).length;

    const inativas = viaturas.filter((item) =>
      [
        "INATIVA",
        "BAIXADA",
        "DESATIVADA",
        "FORA_DE_SERVICO",
      ].includes(normalizarStatus(item.status))
    ).length;

    const comCombustivelInformado = viaturas.filter(
      (item) => Boolean(String(item.combustivel || "").trim())
    ).length;

    const quilometragemTotal = viaturas.reduce(
      (total, item) =>
        total + numeroQuilometragem(item.quilometragem),
      0
    );

    return {
      total: viaturas.length,
      operacionais,
      manutencao,
      inativas,
      comCombustivelInformado,
      quilometragemTotal,
    };
  }, [viaturas]);

  const viaturasPrioritarias = useMemo(() => {
    return viaturas
      .filter((item) =>
        [
          "MANUTENCAO",
          "EM_MANUTENCAO",
          "OFICINA",
          "INDISPONIVEL",
          "INATIVA",
          "BAIXADA",
          "FORA_DE_SERVICO",
        ].includes(normalizarStatus(item.status))
      )
      .slice(0, 8);
  }, [viaturas]);

  return (
    <ProtecaoModulo modulo="frota">
      <main className="sig-page">
        <div className="sig-page-content">
          <SigPageHeader
            titulo="Central de Frota"
            subtitulo={`${municipioNome} • Gestão integrada das viaturas, abastecimentos, manutenções, checklists, danos e pneus.`}
            detalhe="Gestão logística"
            icone={Truck}
            acoes={
              <>
                <Link href="/sistema/central-frota/viaturas">
                  <SigButton
                    type="primary"
                    icon={CarFront}
                    size="sm"
                  >
                    Gerenciar viaturas
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
              titulo="Frota total"
              valor={metricas.total}
              subtitulo="Viaturas cadastradas"
              icone={Truck}
              destaque="cyan"
            />

            <SigStatCard
              titulo="Operacionais"
              valor={metricas.operacionais}
              subtitulo="Disponíveis ou em serviço"
              icone={CarFront}
              destaque="green"
            />

            <SigStatCard
              titulo="Em manutenção"
              valor={metricas.manutencao}
              subtitulo="Oficina ou indisponíveis"
              icone={Wrench}
              destaque="amber"
            />

            <SigStatCard
              titulo="Inativas"
              valor={metricas.inativas}
              subtitulo="Baixadas ou fora de serviço"
              icone={AlertTriangle}
              destaque="red"
            />

            <SigStatCard
              titulo="Combustível informado"
              valor={metricas.comCombustivelInformado}
              subtitulo="Registros com controle ativo"
              icone={Fuel}
              destaque="blue"
            />

            <SigStatCard
              titulo="Quilometragem acumulada"
              valor={metricas.quilometragemTotal.toLocaleString("pt-BR")}
              subtitulo="Soma da frota cadastrada"
              icone={CircleGauge}
              destaque="slate"
            />
          </section>

          {carregando ? (
            <div className="sig-loading">
              <div>
                <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-slate-700 border-t-cyan-400" />
                <p className="mt-4 text-slate-400">
                  Carregando situação da frota...
                </p>
              </div>
            </div>
          ) : (
            <>
              <section className="grid gap-4 xl:grid-cols-12">
                <SigCard className="xl:col-span-7">
                  <CabecalhoSecao
                    titulo="Situação da frota"
                    subtitulo="Visão resumida das viaturas cadastradas"
                    icone={CarFront}
                  />

                  <div className="mt-5 grid gap-3 md:grid-cols-2">
                    {viaturas.length === 0 ? (
                      <div className="col-span-full rounded-2xl border border-dashed border-slate-700 p-8 text-center text-slate-500">
                        Nenhuma viatura cadastrada.
                      </div>
                    ) : (
                      viaturas.slice(0, 12).map((viatura) => {
                        const status = normalizarStatus(
                          viatura.status
                        );

                        const operacional = [
                          "ATIVA",
                          "OPERACIONAL",
                          "EM_SERVICO",
                          "DISPONIVEL",
                          "RESERVA",
                        ].includes(status);

                        return (
                          <article
                            key={viatura.id}
                            className="rounded-2xl border border-slate-800 bg-slate-950/45 p-4"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <h3 className="truncate font-black text-white">
                                  {viatura.prefixo ||
                                    `Viatura ${viatura.id}`}
                                </h3>

                                <p className="mt-1 truncate text-sm text-slate-400">
                                  {viatura.modelo ||
                                    "Modelo não informado"}
                                  {viatura.placa
                                    ? ` • ${viatura.placa}`
                                    : ""}
                                </p>
                              </div>

                              <span
                                className={`shrink-0 rounded-full border px-2.5 py-1 text-[10px] font-black uppercase ${
                                  operacional
                                    ? "border-emerald-400/25 bg-emerald-400/10 text-emerald-300"
                                    : "border-amber-400/25 bg-amber-400/10 text-amber-300"
                                }`}
                              >
                                {viatura.status ||
                                  "SEM STATUS"}
                              </span>
                            </div>

                            <div className="mt-4 flex items-center justify-between text-xs text-slate-500">
                              <span>
                                Combustível:{" "}
                                {viatura.combustivel || "-"}
                              </span>

                              <span>
                                {numeroQuilometragem(
                                  viatura.quilometragem
                                ).toLocaleString("pt-BR")}{" "}
                                km
                              </span>
                            </div>
                          </article>
                        );
                      })
                    )}
                  </div>

                  {viaturas.length > 12 ? (
                    <Link
                      href="/sistema/central-frota/viaturas"
                      className="mt-5 block rounded-xl border border-cyan-400/20 bg-cyan-400/[0.06] py-3 text-center text-sm font-black text-cyan-200 transition hover:bg-cyan-400/10"
                    >
                      Ver toda a frota
                    </Link>
                  ) : null}
                </SigCard>

                <SigCard className="xl:col-span-5">
                  <CabecalhoSecao
                    titulo="Atenção da frota"
                    subtitulo="Viaturas que exigem acompanhamento"
                    icone={AlertTriangle}
                  />

                  <div className="mt-5 space-y-3">
                    {viaturasPrioritarias.length === 0 ? (
                      <div className="rounded-2xl border border-emerald-400/15 bg-emerald-400/[0.05] p-5">
                        <p className="font-black text-emerald-200">
                          Nenhuma indisponibilidade crítica
                        </p>
                        <p className="mt-1 text-sm text-slate-400">
                          A frota cadastrada não possui viaturas
                          marcadas como inativas ou em manutenção.
                        </p>
                      </div>
                    ) : (
                      viaturasPrioritarias.map((viatura) => (
                        <Link
                          key={viatura.id}
                          href="/sistema/central-frota/viaturas"
                          className="block rounded-2xl border border-amber-400/15 bg-amber-400/[0.05] p-4 transition hover:border-amber-400/30"
                        >
                          <div className="flex items-start gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-amber-400/20 bg-amber-400/10 text-amber-300">
                              <Wrench className="h-5 w-5" />
                            </div>

                            <div className="min-w-0">
                              <p className="truncate font-black text-white">
                                {viatura.prefixo ||
                                  `Viatura ${viatura.id}`}
                              </p>
                              <p className="mt-1 text-sm text-slate-400">
                                {viatura.status ||
                                  "Situação não informada"}
                              </p>
                            </div>
                          </div>
                        </Link>
                      ))
                    )}
                  </div>
                </SigCard>
              </section>

              <section>
                <div className="mb-4">
                  <h2 className="text-2xl font-black text-white">
                    Módulos da Frota
                  </h2>

                  <p className="mt-1 text-sm text-slate-400">
                    Acesse as ferramentas de gestão logística e
                    operacional.
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
  icone: typeof Truck;
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