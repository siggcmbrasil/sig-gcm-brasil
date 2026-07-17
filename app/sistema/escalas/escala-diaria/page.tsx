"use client";

import {
  ArrowLeft,
  CalendarDays,
  CarFront,
  CheckCircle2,
  Save,
  Shield,
  UserRound,
} from "lucide-react";
import Link from "next/link";
import {
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  useSearchParams,
} from "next/navigation";

import ProtecaoModulo from "@/components/ProtecaoModulo";
import { registrarAuditoria } from "@/lib/auditoria";
import { supabase } from "@/lib/supabase";

type Guarda = {
  id: number;
  nome: string;
  matricula: string | null;
  graduacao: string | null;
  situacao_funcional: string | null;
  pode_servico_regular: boolean | null;
  pode_dirigir: boolean | null;
  pode_receber_armamento: boolean | null;
  motivo_bloqueio: string | null;
};

type Guarnicao = {
  id: number;
  nome: string;
  viatura_id: number | null;
  jornada_tipo: string;
  horario_inicio: string;
  horario_fim: string | null;
  guardas_por_unidade: number;
  quantidade_comandantes: number;
  quantidade_motoristas: number;
  quantidade_patrulheiros: number;
  quantidade_apoio: number;
  exige_armamento: boolean;
  observacao: string | null;
  dias_semana: number[];
};

type Viatura = {
  id: number;
  prefixo: string | null;
  modelo: string | null;
  placa: string | null;
};

type FuncaoVaga =
  | "COMANDANTE"
  | "MOTORISTA"
  | "PATRULHEIRO"
  | "APOIO";

type Vaga = {
  chave: string;
  funcao: FuncaoVaga;
  indice: number;
  guardaId: string;
};

function hojeISO() {
  const agora = new Date();

  return [
    agora.getFullYear(),
    String(
      agora.getMonth() + 1
    ).padStart(2, "0"),
    String(
      agora.getDate()
    ).padStart(2, "0"),
  ].join("-");
}

function adicionarDias(
  data: Date,
  quantidade: number
) {
  const novaData = new Date(data);

  novaData.setDate(
    novaData.getDate() +
      quantidade
  );

  return novaData;
}

function dataParaISO(
  data: Date
) {
  return [
    data.getFullYear(),
    String(
      data.getMonth() + 1
    ).padStart(2, "0"),
    String(
      data.getDate()
    ).padStart(2, "0"),
  ].join("-");
}

function intervaloJornada(
  jornada: string
) {
  const intervalos: Record<
    string,
    number
  > = {
    "12X36": 2,
    "24X72": 4,
    "24X96": 5,
    "48X144": 8,
  };

  return intervalos[
    String(jornada).toUpperCase()
  ] || 1;
}

function gerarDatasAteFimMes(
  dataInicial: string,
  jornada: string,
  diasPermitidos: number[]
) {
  const inicio = new Date(
    `${dataInicial}T12:00:00`
  );

  const ultimoDia = new Date(
    inicio.getFullYear(),
    inicio.getMonth() + 1,
    0,
    12,
    0,
    0
  );

  const intervalo =
    intervaloJornada(jornada);

  const datas: string[] = [];

  let dataAtual =
    new Date(inicio);

  while (
    dataAtual <= ultimoDia
  ) {
    const diaSemana =
      dataAtual.getDay();

    const diaPermitido =
      !Array.isArray(
        diasPermitidos
      ) ||
      diasPermitidos.length === 0 ||
      diasPermitidos.includes(
        diaSemana
      );

    if (diaPermitido) {
      datas.push(
        dataParaISO(dataAtual)
      );
    }

    dataAtual = adicionarDias(
      dataAtual,
      intervalo
    );
  }

  return datas;
}

function formatarData(
  data: string
) {
  return new Date(
    `${data}T12:00:00`
  ).toLocaleDateString(
    "pt-BR",
    {
      weekday: "long",
      day: "2-digit",
      month: "long",
      year: "numeric",
    }
  );
}

export default function EscalaDiariaPage() {
  const searchParams =
    useSearchParams();

  const guarnicaoId =
    Number(
      searchParams.get(
        "guarnicao_id"
      )
    );

  const [
    guarnicao,
    setGuarnicao,
  ] = useState<Guarnicao | null>(
    null
  );

  const [
    viatura,
    setViatura,
  ] = useState<Viatura | null>(
    null
  );

  const [guardas, setGuardas] =
    useState<Guarda[]>([]);

  const [vagas, setVagas] =
    useState<Vaga[]>([]);

  const [dataEscala, setDataEscala] =
    useState(hojeISO());

  const [
    carregando,
    setCarregando,
  ] = useState(true);

  const [
    salvando,
    setSalvando,
  ] = useState(false);

  const usuario = useMemo(() => {
    if (
      typeof window ===
      "undefined"
    ) {
      return {};
    }

    try {
      return JSON.parse(
        localStorage.getItem(
          "usuarioLogado"
        ) || "{}"
      );
    } catch {
      return {};
    }
  }, []);

  useEffect(() => {
    void carregar();
  }, [
    guarnicaoId,
    dataEscala,
  ]);

  function montarVagas(
    estrutura: Guarnicao
  ) {
    const novasVagas: Vaga[] =
      [];

    function adicionar(
      funcao: FuncaoVaga,
      quantidade: number
    ) {
      for (
        let indice = 1;
        indice <= quantidade;
        indice += 1
      ) {
        novasVagas.push({
          chave:
            `${funcao}-${indice}`,
          funcao,
          indice,
          guardaId: "",
        });
      }
    }

    adicionar(
      "COMANDANTE",
      estrutura
        .quantidade_comandantes ||
        0
    );

    adicionar(
      "MOTORISTA",
      estrutura
        .quantidade_motoristas ||
        0
    );

    adicionar(
      "PATRULHEIRO",
      estrutura
        .quantidade_patrulheiros ||
        0
    );

    adicionar(
      "APOIO",
      estrutura.quantidade_apoio ||
        0
    );

    setVagas(novasVagas);
  }

  async function carregar() {
    if (
      !usuario?.municipio_id ||
      !Number.isSafeInteger(
        guarnicaoId
      ) ||
      guarnicaoId <= 0
    ) {
      setCarregando(false);
      return;
    }

    setCarregando(true);

    try {
      const {
        data: estrutura,
        error: estruturaError,
      } = await supabase
        .from("escala_estruturas")
        .select(`
          id,
          nome,
          viatura_id,
          jornada_tipo,
          horario_inicio,
          horario_fim,
          guardas_por_unidade,
          quantidade_comandantes,
          quantidade_motoristas,
          quantidade_patrulheiros,
          quantidade_apoio,
          exige_armamento,
          observacao,
          dias_semana
        `)
        .eq(
          "id",
          guarnicaoId
        )
        .eq(
          "municipio_id",
          Number(
            usuario.municipio_id
          )
        )
        .eq(
          "categoria",
          "EQUIPE_OPERACIONAL"
        )
        .maybeSingle();

      if (estruturaError) {
        throw new Error(
          estruturaError.message
        );
      }

      if (!estrutura) {
        throw new Error(
          "Guarnição não localizada."
        );
      }

      const estruturaTipada =
        estrutura as Guarnicao;

      setGuarnicao(
        estruturaTipada
      );

      montarVagas(
        estruturaTipada
      );

      if (
        estruturaTipada.viatura_id
      ) {
        const {
          data: viaturaData,
        } = await supabase
          .from("viaturas")
          .select(
            "id,prefixo,modelo,placa"
          )
          .eq(
            "id",
            estruturaTipada.viatura_id
          )
          .maybeSingle();

        setViatura(
          (viaturaData ||
            null) as Viatura | null
        );
      } else {
        setViatura(null);
      }

      const {
        data: listaGuardas,
        error: guardasError,
      } = await supabase
        .from(
          "vw_guardas_disponibilidade_operacional"
        )
        .select(`
          id,
          nome,
          matricula,
          graduacao,
          situacao_funcional,
          pode_servico_regular,
          pode_dirigir,
          pode_receber_armamento,
          motivo_bloqueio
        `)
        .eq(
          "municipio_id",
          Number(
            usuario.municipio_id
          )
        )
        .order("nome");

      if (guardasError) {
        throw new Error(
          guardasError.message
        );
      }

      setGuardas(
        (listaGuardas ||
          []) as Guarda[]
      );
    } catch (error) {
      alert(
        error instanceof Error
          ? error.message
          : "Erro ao carregar escala."
      );
    } finally {
      setCarregando(false);
    }
  }

  function alterarGuarda(
    chave: string,
    guardaId: string
  ) {
    setVagas((atuais) =>
      atuais.map((vaga) =>
        vaga.chave === chave
          ? {
              ...vaga,
              guardaId,
            }
          : vaga
      )
    );
  }

  function guardaSelecionado(
    vaga: Vaga
  ) {
    return (
      guardas.find(
        (guarda) =>
          String(guarda.id) ===
          String(vaga.guardaId)
      ) || null
    );
  }

  function validarVaga(
    vaga: Vaga
  ) {
    const guarda =
      guardaSelecionado(vaga);

    if (!guarda) {
      return {
        valido: false,
        mensagem:
          "Selecione um guarda.",
      };
    }

    if (
      !guarda.pode_servico_regular
    ) {
      return {
        valido: false,
        mensagem:
          guarda.motivo_bloqueio ||
          "Guarda indisponível pelo RH.",
      };
    }

    if (
      vaga.funcao ===
        "MOTORISTA" &&
      !guarda.pode_dirigir
    ) {
      return {
        valido: false,
        mensagem:
          "Guarda não está liberado para dirigir.",
      };
    }

    if (
      guarnicao?.exige_armamento &&
      !guarda.pode_receber_armamento
    ) {
      return {
        valido: false,
        mensagem:
          "Guarda não está liberado para receber armamento.",
      };
    }

    const duplicado =
      vagas.some(
        (outra) =>
          outra.chave !==
            vaga.chave &&
          outra.guardaId &&
          String(
            outra.guardaId
          ) ===
            String(
              vaga.guardaId
            )
      );

    if (duplicado) {
      return {
        valido: false,
        mensagem:
          "Este guarda já foi selecionado em outra vaga.",
      };
    }

    return {
      valido: true,
      mensagem:
        "Guarda liberado.",
    };
  }

  async function salvar() {
  if (
    !guarnicao ||
    salvando
  ) {
    return;
  }

  if (
    !usuario?.id ||
    !usuario?.municipio_id
  ) {
    alert(
      "Sessão inválida."
    );
    return;
  }

  const vagasIncompletas =
    vagas.filter(
      (vaga) =>
        !vaga.guardaId
    );

  if (
    vagasIncompletas.length > 0
  ) {
    alert(
      "Preencha todas as vagas da guarnição."
    );
    return;
  }

for (const vaga of vagas) {
  const resultadoLocal =
    validarVaga(vaga);

  if (!resultadoLocal.valido) {
    alert(
      `${vaga.funcao}: ${resultadoLocal.mensagem}`
    );
    return;
  }

  const { data: validacaoBanco, error: validacaoError } =
    await supabase.rpc(
      "escala_validar_guarda_na_data",
      {
        p_guarda_id: Number(vaga.guardaId),
        p_municipio_id: Number(usuario.municipio_id),
        p_data_servico: dataEscala,
        p_equipe: guarnicao.nome,
      }
    );

  if (validacaoError) {
    alert(
      `Erro ao validar ${vaga.funcao}: ${validacaoError.message}`
    );
    return;
  }

  const validacao =
    Array.isArray(validacaoBanco)
      ? validacaoBanco[0]
      : validacaoBanco;

  if (!validacao?.permitido) {
    alert(
      `${vaga.funcao}: ${
        validacao?.mensagem ||
        "Guarda indisponível para esta data."
      }`
    );
    return;
  }
}

  const datasPlantao =
    gerarDatasAteFimMes(
      dataEscala,
      guarnicao.jornada_tipo,
      guarnicao.dias_semana ||
        []
    );

  if (
    datasPlantao.length === 0
  ) {
    alert(
      "Nenhuma data de plantão foi encontrada até o fim do mês."
    );
    return;
  }

  const confirmou = confirm(
    `A guarnição ${guarnicao.nome} será salva em ${datasPlantao.length} plantão(ões), de ${formatarData(
      datasPlantao[0]
    )} até ${formatarData(
      datasPlantao[
        datasPlantao.length - 1
      ]
    )}.\n\nDeseja continuar?`
  );

  if (!confirmou) {
    return;
  }

  setSalvando(true);

  try {
    const registros =
      datasPlantao.flatMap(
        (dataPlantao) =>
          vagas.map((vaga) => {
            const guarda =
              guardaSelecionado(
                vaga
              );

            return {
              municipio_id:
                Number(
                  usuario.municipio_id
                ),
              data_servico:
                dataPlantao,
              guarda_nome:
                guarda?.nome ||
                "",
              matricula:
                guarda?.matricula ||
                null,
              turno:
                guarnicao.jornada_tipo,
              equipe:
                guarnicao.nome,
              observacao:
                JSON.stringify({
                  origem:
                    "ESCALA_MENSAL_GUARNICAO",
                  estrutura_id:
                    guarnicao.id,
                  funcao:
                    vaga.funcao,
                  guarda_id:
                    Number(
                      vaga.guardaId
                    ),
                  viatura_id:
                    guarnicao.viatura_id,
                  data_inicial:
                    dataEscala,
                }),
            };
          })
      );

    const primeiroDia =
      datasPlantao[0];

    const ultimoDia =
      datasPlantao[
        datasPlantao.length - 1
      ];

    const {
      error: excluirError,
    } = await supabase
      .from("escalas_servico")
      .delete()
      .eq(
        "municipio_id",
        Number(
          usuario.municipio_id
        )
      )
      .eq(
        "equipe",
        guarnicao.nome
      )
      .gte(
        "data_servico",
        primeiroDia
      )
      .lte(
        "data_servico",
        ultimoDia
      );

    if (excluirError) {
      throw new Error(
        excluirError.message
      );
    }

    const { error } =
      await supabase
        .from(
          "escalas_servico"
        )
        .insert(registros);

    if (error) {
      throw new Error(
        error.message
      );
    }

    await registrarAuditoria({
      modulo: "Escalas",
      acao:
        "SALVAR_ESCALA_GUARNICAO_MENSAL",
      tabela:
        "escalas_servico",
      descricao:
        `Salvou a guarnição ${guarnicao.nome} do dia ${primeiroDia} até ${ultimoDia}.`,
      detalhes: {
        guarnicao_id:
          guarnicao.id,
        jornada:
          guarnicao.jornada_tipo,
        primeira_data:
          primeiroDia,
        ultima_data:
          ultimoDia,
        total_plantoes:
          datasPlantao.length,
        total_registros:
          registros.length,
      },
    });

    alert(
      `Escala da guarnição salva até o fim do mês.\n\n` +
        `Plantões criados: ${datasPlantao.length}\n` +
        `Registros individuais: ${registros.length}`
    );
  } catch (error) {
    alert(
      error instanceof Error
        ? error.message
        : "Erro ao salvar a escala da guarnição."
    );
  } finally {
    setSalvando(false);
  }
}

  if (carregando) {
    return (
      <ProtecaoModulo modulo="escalas">
        <div className="p-6 text-slate-400">
          Carregando escala...
        </div>
      </ProtecaoModulo>
    );
  }

  if (!guarnicao) {
    return (
      <ProtecaoModulo modulo="escalas">
        <div className="p-6 text-white">
          Guarnição não localizada.
        </div>
      </ProtecaoModulo>
    );
  }

  return (
    <ProtecaoModulo modulo="escalas">
      <main className="space-y-6 p-4 pb-24 text-white md:p-6">
        <header className="flex flex-col justify-between gap-4 border-b border-slate-800 pb-5 md:flex-row md:items-center">
          <div>
            <Link
              href="/sistema/escalas/guarnicoes"
              className="mb-3 inline-flex items-center gap-2 text-sm font-bold text-slate-400 hover:text-white"
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar para guarnições
            </Link>

            <p className="text-xs font-black uppercase tracking-[0.22em] text-emerald-300">
              Escala diária
            </p>

            <h1 className="mt-2 text-3xl font-black">
              {guarnicao.nome}
            </h1>

            <p className="mt-2 text-sm text-slate-400">
              Escolha o primeiro plantão e preencha a equipe. O sistema repetirá a guarnição até o fim do mês conforme a jornada.
            </p>
          </div>

          <div className="w-full md:w-auto">
            <label className="label">
              Data do plantão
            </label>

            <input
              type="date"
              className="input"
              value={dataEscala}
              onChange={(event) =>
                setDataEscala(
                  event.target.value
                )
              }
            />
          </div>
        </header>

        <section className="grid gap-4 md:grid-cols-3">
          <Resumo
            icone={CalendarDays}
            titulo="Data"
            valor={formatarData(
              dataEscala
            )}
            classe="text-cyan-300"
          />

          <Resumo
            icone={CarFront}
            titulo="Viatura"
            valor={
              viatura
                ? `${
                    viatura.prefixo ||
                    `VTR-${viatura.id}`
                  } • ${
                    viatura.modelo ||
                    "Modelo não informado"
                  }`
                : "Sem viatura fixa"
            }
            classe="text-blue-300"
          />

          <Resumo
            icone={Shield}
            titulo="Jornada"
            valor={`${guarnicao.jornada_tipo} • ${String(
              guarnicao.horario_inicio
            ).slice(0, 5)} às ${
              guarnicao.horario_fim
                ? String(
                    guarnicao.horario_fim
                  ).slice(0, 5)
                : "-"
            }`}
            classe="text-emerald-300"
          />
        </section>

        <section className="space-y-4">
          {vagas.map((vaga) => {
            const guarda =
              guardaSelecionado(vaga);

            const validacao =
              vaga.guardaId
                ? validarVaga(vaga)
                : null;

            return (
              <article
                key={vaga.chave}
                className="rounded-2xl border border-slate-800 bg-slate-950/70 p-5"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
                  <div className="flex min-w-48 items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-cyan-500/20 bg-cyan-500/10">
                      <UserRound className="h-6 w-6 text-cyan-300" />
                    </div>

                    <div>
                      <p className="text-xs font-black uppercase tracking-wide text-slate-500">
                        Vaga
                      </p>

                      <h2 className="font-black text-white">
                        {vaga.funcao}
                        {vaga.indice > 1
                          ? ` ${vaga.indice}`
                          : ""}
                      </h2>
                    </div>
                  </div>

                  <select
                    className="input flex-1"
                    value={vaga.guardaId}
                    onChange={(event) =>
                      alterarGuarda(
                        vaga.chave,
                        event.target.value
                      )
                    }
                  >
                    <option value="">
                      Selecione um guarda
                    </option>

                    {guardas.map(
                      (item) => (
                        <option
                          key={item.id}
                          value={item.id}
                        >
                          {item.pode_servico_regular
                            ? "🟢"
                            : "🔴"}{" "}
                          {item.nome}
                          {" • "}
                          {item.matricula ||
                            "S/M"}
                          {" • "}
                          {item.situacao_funcional ||
                            "NÃO INFORMADO"}
                        </option>
                      )
                    )}
                  </select>
                </div>

                {guarda &&
                  validacao && (
                    <div
                      className={`mt-4 rounded-xl border p-3 text-sm font-bold ${
                        validacao.valido
                          ? "border-emerald-500/25 bg-emerald-500/10 text-emerald-300"
                          : "border-red-500/25 bg-red-500/10 text-red-300"
                      }`}
                    >
                      {validacao.valido
                        ? "Guarda liberado para esta vaga."
                        : validacao.mensagem}
                    </div>
                  )}
              </article>
            );
          })}
        </section>

        <button
          type="button"
          onClick={() =>
            void salvar()
          }
          disabled={salvando}
          className="btn-primary flex w-full items-center justify-center gap-2 py-4 text-lg disabled:opacity-50"
        >
          {salvando ? (
            "Salvando..."
          ) : (
            <>
              <Save className="h-5 w-5" />
              Salvar guarnição até o fim do mês
            </>
          )}
        </button>

        <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="mt-0.5 h-5 w-5 text-emerald-300" />

            <p className="text-sm leading-6 text-slate-300">
              Os guardas selecionados ficam vinculados apenas a esta data. A estrutura da guarnição permanece sem membros fixos.
            </p>
          </div>
        </div>
      </main>
    </ProtecaoModulo>
  );
}

function Resumo({
  icone: Icone,
  titulo,
  valor,
  classe,
}: {
  icone: any;
  titulo: string;
  valor: string;
  classe: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
      <div className="flex items-center gap-2">
        <Icone className={`h-5 w-5 ${classe}`} />

        <p className="text-xs font-black uppercase tracking-wide text-slate-500">
          {titulo}
        </p>
      </div>

      <p className={`mt-2 font-black ${classe}`}>
        {valor}
      </p>
    </div>
  );
}