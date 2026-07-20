"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  BarChart3,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Download,
  FileText,
  Loader2,
  Medal,
  Printer,
  RefreshCw,
  Route,
  Search,
  ShieldCheck,
  TrendingUp,
  UserCheck,
  Users,
} from "lucide-react";

import ProtecaoModulo from "@/components/ProtecaoModulo";
import { registrarAuditoria } from "@/lib/auditoria";
import { supabase } from "@/lib/supabase";
import {
  baixarCsvProdutividade,
  formatarMinutosRelatorio,
  hojeIso,
  lerUsuarioRelatorio,
  LinhaProdutividade,
  normalizarRelatorio,
  podeVerRelatorioProdutividade,
  primeiroDiaMesIso,
} from "@/lib/relatorioProdutividade";

type Registro = Record<string, unknown>;

type Guarda = Registro & {
  id: number;
  nome: string;
  matricula?: string | null;
};

async function consultaOpcional(
  tabela: string,
  municipioId: number,
  campoData: string,
  dataInicial: string,
  dataFinal: string
): Promise<Registro[]> {
  const { data, error } = await supabase
    .from(tabela)
    .select("*")
    .eq("municipio_id", municipioId)
    .gte(campoData, dataInicial)
    .lte(campoData, dataFinal)
    .limit(10000);

  if (error) {
    console.warn(`Relatório: ${tabela} indisponível.`, error.message);
    return [];
  }

  return (data as Registro[] | null) || [];
}

function numero(valor: unknown) {
  const convertido = Number(valor || 0);
  return Number.isFinite(convertido) ? convertido : 0;
}

function texto(valor: unknown) {
  return String(valor ?? "").trim();
}

function primeiroValor(registro: Registro, campos: string[]) {
  for (const campo of campos) {
    const valor = registro[campo];
    if (valor !== null && valor !== undefined && texto(valor)) return valor;
  }
  return null;
}

function idGuardaRegistro(registro: Registro) {
  return numero(
    primeiroValor(registro, [
      "guarda_id",
      "guarda_responsavel_id",
      "usuario_guarda_id",
      "servidor_id",
    ])
  );
}

function nomeGuardaRegistro(registro: Registro) {
  return normalizarRelatorio(
    primeiroValor(registro, [
      "guarda_nome",
      "nome_guarda",
      "nome_usuario",
      "guarda",
      "criado_por",
      "responsavel_nome",
    ])
  );
}

function dentroDoPeriodo(
  valor: unknown,
  dataInicial: string,
  dataFinal: string
) {
  const data = texto(valor).slice(0, 10);
  return Boolean(data && data >= dataInicial && data <= dataFinal);
}

export default function RelatorioFrequenciaProdutividadePage() {
  const [usuario] = useState(() => lerUsuarioRelatorio());
  const [dataInicial, setDataInicial] = useState(primeiroDiaMesIso());
  const [dataFinal, setDataFinal] = useState(hojeIso());
  const [busca, setBusca] = useState("");
  const [guarnicao, setGuarnicao] = useState("TODAS");
  const [linhas, setLinhas] = useState<LinhaProdutividade[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [avisos, setAvisos] = useState<string[]>([]);

  const permitido = usuario
    ? podeVerRelatorioProdutividade(usuario.perfil)
    : false;

  const carregar = useCallback(async () => {
    if (!usuario?.municipio_id) {
      setErro("Sessão ou município não identificado.");
      setCarregando(false);
      return;
    }

    if (!permitido) {
      setErro("Seu perfil não possui acesso ao relatório gerencial.");
      setCarregando(false);
      return;
    }

    if (!dataInicial || !dataFinal || dataInicial > dataFinal) {
      setErro("Informe um período válido.");
      setCarregando(false);
      return;
    }

    setCarregando(true);
    setErro("");
    setAvisos([]);

    try {
      const { data: guardasDados, error: guardasErro } = await supabase
        .from("guardas")
        .select("*")
        .eq("municipio_id", usuario.municipio_id)
        .order("nome");

      if (guardasErro) throw guardasErro;

      const resultados = await Promise.all([
        consultaOpcional(
          "ponto_eletronico",
          usuario.municipio_id,
          "data",
          dataInicial,
          dataFinal
        ),
        consultaOpcional(
          "folhas_ponto",
          usuario.municipio_id,
          "criado_em",
          `${dataInicial}T00:00:00`,
          `${dataFinal}T23:59:59`
        ),
        consultaOpcional(
          "ocorrencias",
          usuario.municipio_id,
          "data",
          dataInicial,
          dataFinal
        ),
        consultaOpcional(
          "patrulhamentos",
          usuario.municipio_id,
          "data",
          dataInicial,
          dataFinal
        ),
        consultaOpcional(
          "visita_checkins",
          usuario.municipio_id,
          "criado_em",
          `${dataInicial}T00:00:00`,
          `${dataFinal}T23:59:59`
        ),
        consultaOpcional(
          "ferias_licencas",
          usuario.municipio_id,
          "data_inicio",
          dataInicial,
          dataFinal
        ),
        consultaOpcional(
          "escalas_extras_convocados",
          usuario.municipio_id,
          "criado_em",
          `${dataInicial}T00:00:00`,
          `${dataFinal}T23:59:59`
        ),
      ]);

      const [
        pontos,
        folhas,
        ocorrencias,
        patrulhamentos,
        visitas,
        afastamentos,
        extras,
      ] = resultados;

      const guardas = ((guardasDados as Guarda[] | null) || []).map(
        (guarda) => {
          const id = numero(guarda.id);
          const nomeNormalizado = normalizarRelatorio(guarda.nome);
          const pertence = (registro: Registro) => {
            const registroId = idGuardaRegistro(registro);
            if (registroId > 0) return registroId === id;
            const nomeRegistro = nomeGuardaRegistro(registro);
            return Boolean(
              nomeRegistro &&
                (nomeRegistro === nomeNormalizado ||
                  nomeRegistro.includes(nomeNormalizado) ||
                  nomeNormalizado.includes(nomeRegistro))
            );
          };

          const pontosGuarda = pontos.filter(pertence);
          const folhasGuarda = folhas.filter(pertence);
          const ocorrenciasGuarda = ocorrencias.filter(pertence);
          const patrulhamentosGuarda = patrulhamentos.filter(pertence);
          const visitasGuarda = visitas.filter(pertence);
          const afastamentosGuarda = afastamentos.filter(pertence);
          const extrasGuarda = extras.filter(pertence);

          const jornadasPonto = pontosGuarda.filter(
            (item) =>
              numero(item.minutos_trabalhados) > 0 ||
              texto(item.entrada_em) ||
              texto(item.hora_entrada)
          ).length;

          const jornadasFolha = folhasGuarda.reduce(
            (soma, item) => soma + numero(item.dias_trabalhados),
            0
          );

          const atrasosPonto = pontosGuarda.filter(
            (item) => numero(item.minutos_atraso) > 0
          ).length;

          const atrasosFolha = folhasGuarda.reduce(
            (soma, item) => soma + numero(item.atrasos),
            0
          );

          const faltasPonto = pontosGuarda.filter(
            (item) => normalizarRelatorio(item.situacao) === "FALTA"
          ).length;

          const faltasFolha = folhasGuarda.reduce(
            (soma, item) => soma + numero(item.faltas),
            0
          );

          const justificativas = pontosGuarda.filter((item) =>
            ["APROVADO", "PENDENTE", "NEGADO"].includes(
              normalizarRelatorio(item.justificativa_status)
            )
          ).length;

          const minutosExtrasPonto = pontosGuarda.reduce(
            (soma, item) => soma + numero(item.minutos_extras),
            0
          );
          const minutosExtrasFolha = folhasGuarda.reduce(
            (soma, item) => soma + numero(item.minutos_extras),
            0
          );
          const minutosDebitoPonto = pontosGuarda.reduce(
            (soma, item) => soma + numero(item.minutos_debito),
            0
          );
          const minutosDebitoFolha = folhasGuarda.reduce(
            (soma, item) => soma + numero(item.minutos_debito),
            0
          );

          const jornadas = jornadasPonto || jornadasFolha;
          const atrasos = atrasosPonto || atrasosFolha;
          const faltas = faltasPonto || faltasFolha;
          const minutos_extras = minutosExtrasPonto || minutosExtrasFolha;
          const minutos_debito = minutosDebitoPonto || minutosDebitoFolha;

          const ocorrenciasTotal = ocorrenciasGuarda.length;
          const patrulhamentosTotal = patrulhamentosGuarda.length;
          const visitasTotal = visitasGuarda.length;
          const extrasTotal = extrasGuarda.filter((item) => {
            const status = normalizarRelatorio(
              primeiroValor(item, ["presenca_status", "status"])
            );
            return !status || !["RECUSADO", "AUSENTE", "CANCELADO"].includes(status);
          }).length;

          const pontosProdutividade = Math.max(
            0,
            jornadas * 2 +
              ocorrenciasTotal * 5 +
              patrulhamentosTotal * 3 +
              visitasTotal * 2 +
              extrasTotal * 4 +
              Math.floor(minutos_extras / 60) -
              atrasos * 2 -
              faltas * 8 -
              Math.floor(minutos_debito / 60)
          );

          const guarnicaoNome = texto(
            primeiroValor(guarda, [
              "guarnicao_nome",
              "equipe",
              "guarnicao",
              "lotacao",
            ])
          );

          return {
            guarda_id: id,
            nome: texto(guarda.nome) || "Servidor sem nome",
            matricula: texto(guarda.matricula) || "Sem matrícula",
            guarnicao: guarnicaoNome || "Não informada",
            jornadas,
            atrasos,
            faltas,
            justificativas,
            minutos_extras,
            minutos_debito,
            afastamentos: afastamentosGuarda.length,
            ocorrencias: ocorrenciasTotal,
            patrulhamentos: patrulhamentosTotal,
            visitas: visitasTotal,
            escalas_extras: extrasTotal,
            pontos: pontosProdutividade,
          } satisfies LinhaProdutividade;
        }
      );

      guardas.sort(
        (a, b) => b.pontos - a.pontos || a.nome.localeCompare(b.nome)
      );
      setLinhas(guardas);

      const tabelasVazias = [
        ["Ponto Eletrônico", pontos],
        ["Ocorrências", ocorrencias],
        ["Patrulhamentos", patrulhamentos],
        ["Visitas", visitas],
      ]
        .filter(([, registros]) => (registros as Registro[]).length === 0)
        .map(([nome]) => String(nome));

      setAvisos(
        tabelasVazias.length
          ? [
              `Sem registros no período ou integração indisponível: ${tabelasVazias.join(
                ", "
              )}.`,
            ]
          : []
      );

      await registrarAuditoria({
        modulo: "Relatórios",
        acao: "CONSULTAR",
        tabela: "relatorio_frequencia_produtividade",
        descricao: `Relatório gerencial de ${dataInicial} a ${dataFinal}.`,
      });
    } catch (error) {
      setErro(
        error instanceof Error
          ? error.message
          : "Não foi possível gerar o relatório."
      );
    } finally {
      setCarregando(false);
    }
  }, [dataFinal, dataInicial, permitido, usuario]);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  const guarnicoes = useMemo(
    () =>
      Array.from(new Set(linhas.map((item) => item.guarnicao))).sort((a, b) =>
        a.localeCompare(b)
      ),
    [linhas]
  );

  const filtradas = useMemo(() => {
    const termo = normalizarRelatorio(busca);
    return linhas.filter((item) => {
      const correspondeBusca =
        !termo ||
        normalizarRelatorio(
          `${item.nome} ${item.matricula} ${item.guarnicao}`
        ).includes(termo);
      const correspondeGuarnicao =
        guarnicao === "TODAS" || item.guarnicao === guarnicao;
      return correspondeBusca && correspondeGuarnicao;
    });
  }, [busca, guarnicao, linhas]);

  const totais = useMemo(
    () => ({
      servidores: filtradas.length,
      jornadas: filtradas.reduce((soma, item) => soma + item.jornadas, 0),
      ocorrencias: filtradas.reduce((soma, item) => soma + item.ocorrencias, 0),
      patrulhamentos: filtradas.reduce(
        (soma, item) => soma + item.patrulhamentos,
        0
      ),
      visitas: filtradas.reduce((soma, item) => soma + item.visitas, 0),
      extras: filtradas.reduce(
        (soma, item) => soma + item.minutos_extras,
        0
      ),
      faltas: filtradas.reduce((soma, item) => soma + item.faltas, 0),
      atrasos: filtradas.reduce((soma, item) => soma + item.atrasos, 0),
    }),
    [filtradas]
  );

  const maiorPontuacao = Math.max(1, ...filtradas.map((item) => item.pontos));

  async function exportarCsv() {
    baixarCsvProdutividade(filtradas, dataInicial, dataFinal);
    await registrarAuditoria({
      modulo: "Relatórios",
      acao: "EXPORTAR_CSV",
      tabela: "relatorio_frequencia_produtividade",
      descricao: `Exportação CSV de ${dataInicial} a ${dataFinal}.`,
    });
  }

  return (
    <ProtecaoModulo modulo="relatorios">
      <main className="min-h-screen bg-[#020b1c] px-4 py-5 text-white print:bg-white print:text-black lg:px-7">
        <div className="mx-auto max-w-[1800px] space-y-5">
          <header className="rounded-3xl border border-cyan-400/15 bg-gradient-to-br from-[#07182f] to-[#020b1c] p-5 print:border-black print:bg-white lg:p-7">
            <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.22em] text-cyan-300 print:text-black">
                  Inteligência gerencial
                </p>
                <h1 className="mt-1 text-2xl font-black lg:text-3xl">
                  Frequência e Produtividade do Efetivo
                </h1>
                <p className="mt-2 text-sm text-slate-400 print:text-black">
                  Indicadores integrados de jornada, operação e desempenho.
                </p>
              </div>

              <div className="flex flex-wrap gap-3 print:hidden">
                <button
                  onClick={() => void carregar()}
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-700 px-4 py-3 text-sm font-black"
                >
                  <RefreshCw className="h-4 w-4" />
                  Atualizar
                </button>
                <button
                  onClick={() => void exportarCsv()}
                  className="inline-flex items-center gap-2 rounded-xl border border-cyan-400/25 bg-cyan-400/10 px-4 py-3 text-sm font-black text-cyan-300"
                >
                  <Download className="h-4 w-4" />
                  CSV
                </button>
                <button
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-2 rounded-xl bg-cyan-300 px-4 py-3 text-sm font-black text-slate-950"
                >
                  <Printer className="h-4 w-4" />
                  Imprimir/PDF
                </button>
              </div>
            </div>
          </header>

          {erro ? (
            <div className="rounded-2xl border border-rose-400/25 bg-rose-400/10 p-4 text-sm text-rose-200 print:hidden">
              {erro}
            </div>
          ) : null}

          {avisos.map((aviso) => (
            <div
              key={aviso}
              className="rounded-2xl border border-amber-400/25 bg-amber-400/10 p-4 text-sm text-amber-100 print:hidden"
            >
              <AlertTriangle className="mr-2 inline h-4 w-4" />
              {aviso}
            </div>
          ))}

          <section className="rounded-2xl border border-slate-800 bg-[#061326] p-4 print:hidden">
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-[170px_170px_1fr_240px]">
              <input
                type="date"
                value={dataInicial}
                onChange={(event) => setDataInicial(event.target.value)}
                className="h-12 rounded-xl border border-slate-700 bg-slate-950/60 px-4"
              />
              <input
                type="date"
                value={dataFinal}
                onChange={(event) => setDataFinal(event.target.value)}
                className="h-12 rounded-xl border border-slate-700 bg-slate-950/60 px-4"
              />
              <label className="flex items-center gap-3 rounded-xl border border-slate-700 bg-slate-950/60 px-4">
                <Search className="h-4 w-4 text-slate-500" />
                <input
                  value={busca}
                  onChange={(event) => setBusca(event.target.value)}
                  placeholder="Buscar nome ou matrícula..."
                  className="h-12 w-full bg-transparent outline-none"
                />
              </label>
              <select
                value={guarnicao}
                onChange={(event) => setGuarnicao(event.target.value)}
                className="h-12 rounded-xl border border-slate-700 bg-slate-950/60 px-4"
              >
                <option value="TODAS">Todas as guarnições</option>
                {guarnicoes.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>
          </section>

          <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <Metrica titulo="Efetivo analisado" valor={totais.servidores} icone={Users} />
            <Metrica titulo="Jornadas" valor={totais.jornadas} icone={UserCheck} />
            <Metrica titulo="Ocorrências" valor={totais.ocorrencias} icone={ShieldCheck} />
            <Metrica titulo="Patrulhamentos" valor={totais.patrulhamentos} icone={Route} />
            <Metrica titulo="Visitas" valor={totais.visitas} icone={CheckCircle2} />
            <Metrica titulo="Horas extras" valor={formatarMinutosRelatorio(totais.extras)} icone={Clock3} />
            <Metrica titulo="Atrasos" valor={totais.atrasos} icone={CalendarDays} />
            <Metrica titulo="Faltas" valor={totais.faltas} icone={AlertTriangle} />
          </section>

          {carregando ? (
            <div className="flex min-h-[350px] items-center justify-center">
              <Loader2 className="h-10 w-10 animate-spin text-cyan-300" />
            </div>
          ) : (
            <>
              <section className="grid gap-5 xl:grid-cols-[1fr_420px]">
                <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-[#061326] print:border-black print:bg-white">
                  <div className="border-b border-slate-800 p-5">
                    <h2 className="flex items-center gap-2 text-lg font-black">
                      <Medal className="h-5 w-5 text-amber-300" />
                      Ranking do efetivo
                    </h2>
                  </div>
                  <table className="w-full min-w-[1200px] text-left text-sm">
                    <thead className="border-b border-slate-700 text-[10px] uppercase text-slate-400 print:text-black">
                      <tr>
                        {[
                          "#",
                          "Servidor",
                          "Guarnição",
                          "Jornadas",
                          "Atrasos",
                          "Faltas",
                          "Extras",
                          "Ocorrências",
                          "Patrulhas",
                          "Visitas",
                          "Esc. extras",
                          "Pontos",
                        ].map((item) => (
                          <th key={item} className="px-4 py-3">
                            {item}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filtradas.map((item, indice) => (
                        <tr
                          key={item.guarda_id}
                          className="border-b border-slate-800/70"
                        >
                          <td className="px-4 py-3 font-black">
                            {indice + 1}º
                          </td>
                          <td className="px-4 py-3">
                            <p className="font-black">{item.nome}</p>
                            <p className="text-xs text-slate-500">
                              {item.matricula}
                            </p>
                          </td>
                          <td className="px-4 py-3">{item.guarnicao}</td>
                          <td className="px-4 py-3">{item.jornadas}</td>
                          <td className="px-4 py-3">{item.atrasos}</td>
                          <td className="px-4 py-3">{item.faltas}</td>
                          <td className="px-4 py-3">
                            {formatarMinutosRelatorio(item.minutos_extras)}
                          </td>
                          <td className="px-4 py-3">{item.ocorrencias}</td>
                          <td className="px-4 py-3">{item.patrulhamentos}</td>
                          <td className="px-4 py-3">{item.visitas}</td>
                          <td className="px-4 py-3">{item.escalas_extras}</td>
                          <td className="px-4 py-3 font-black text-cyan-300 print:text-black">
                            {item.pontos}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="space-y-4">
                  <div className="rounded-2xl border border-slate-800 bg-[#061326] p-5 print:border-black print:bg-white">
                    <h2 className="flex items-center gap-2 font-black">
                      <TrendingUp className="h-5 w-5 text-cyan-300" />
                      Destaques de produtividade
                    </h2>
                    <div className="mt-5 space-y-4">
                      {filtradas.slice(0, 10).map((item, indice) => (
                        <div key={item.guarda_id}>
                          <div className="mb-2 flex justify-between gap-3 text-xs">
                            <span className="font-black">
                              {indice + 1}. {item.nome}
                            </span>
                            <span>{item.pontos} pts</span>
                          </div>
                          <div className="h-3 overflow-hidden rounded-full bg-slate-900 print:border print:border-black">
                            <div
                              className="h-full rounded-full bg-cyan-300 print:bg-black"
                              style={{
                                width: `${Math.max(
                                  2,
                                  (item.pontos / maiorPontuacao) * 100
                                )}%`,
                              }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-slate-800 bg-[#061326] p-5 print:border-black print:bg-white">
                    <h2 className="flex items-center gap-2 font-black">
                      <BarChart3 className="h-5 w-5 text-cyan-300" />
                      Critério de pontuação
                    </h2>
                    <p className="mt-3 text-sm leading-6 text-slate-400 print:text-black">
                      Jornada +2, ocorrência +5, patrulhamento +3, visita +2,
                      escala extra +4 e hora extra +1. Atraso −2, falta −8,
                      hora em débito −1. A pontuação apoia a gestão e não
                      substitui avaliação funcional formal.
                    </p>
                  </div>
                </div>
              </section>

              <footer className="hidden border-t border-black pt-4 text-xs print:block">
                Período: {dataInicial.split("-").reverse().join("/")} a{" "}
                {dataFinal.split("-").reverse().join("/")} • Emitido em{" "}
                {new Date().toLocaleString("pt-BR")}
              </footer>
            </>
          )}
        </div>
      </main>
    </ProtecaoModulo>
  );
}

function Metrica({
  titulo,
  valor,
  icone: Icone,
}: {
  titulo: string;
  valor: number | string;
  icone: typeof Activity;
}) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-[#061326] p-5 print:border-black print:bg-white">
      <Icone className="h-6 w-6 text-cyan-300 print:text-black" />
      <p className="mt-4 text-[10px] font-black uppercase tracking-wider text-slate-500 print:text-black">
        {titulo}
      </p>
      <p className="mt-1 text-xl font-black">{valor}</p>
    </div>
  );
}
