"use client";

import {
  ArrowLeftRight,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  Clock3,
  History,
  Loader2,
  RefreshCw,
  Search,
  ShieldCheck,
  UserCheck,
  Users,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import ProtecaoModulo from "@/components/ProtecaoModulo";
import {
  montarUrlComMunicipioContexto,
} from "@/lib/contextoMunicipio";
import { supabase } from "@/lib/supabase";

type UsuarioLocal = {
  perfil?: string;
  municipio_id?: number;
};

type UsuarioApi = {
  id: number;
  nome: string | null;
  perfil: string;
  comando: boolean;
};

type Guarda = {
  id: number;
  nome: string;
  matricula: string | null;
  cargo?: string | null;
};

type Escala = {
  id: number;
  data_servico: string;
  turno: string | null;
  guarda_id: number | null;
  guarda_nome: string | null;
  matricula: string | null;
  equipe: string | null;
  funcao: string | null;
};

type Permuta = {
  id: number;
  municipio_id: number;
  origem: "SOLICITADA" | "MANUAL";
  data_original: string;
  data_troca: string;
  escala_origem_id: number | null;
  escala_troca_id: number | null;
  guarda_solicitante_id: number;
  guarda_substituto_id: number;
  motivo: string | null;
  observacao: string | null;
  status: string;
  resposta_substituto: string | null;
  motivo_recusa_substituto: string | null;
  motivo_decisao_comando: string | null;
  motivo_cancelamento: string | null;
  aprovado_por: string | null;
  criado_em: string;
  respondido_em: string | null;
};

type HistoricoPermuta = {
  id: number;
  permuta_id: number;
  acao: string;
  status_anterior: string | null;
  status_novo: string;
  observacao: string | null;
  criado_em: string;
};

type RetornoApi = {
  ok?: boolean;
  erro?: string;
  aviso?: string;
  municipio_id?: number;
  usuario?: UsuarioApi;
  guarda_atual?: Guarda | null;
  guardas?: Guarda[];
  escalas?: Escala[];
  permutas?: Permuta[];
  historico?: HistoricoPermuta[];
};

type Aba = "SOLICITAR" | "PENDENCIAS" | "HISTORICO" | "MANUAL";

function lerUsuarioLocal(): UsuarioLocal | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const valor =
      localStorage.getItem("usuario") ||
      localStorage.getItem("usuarioLogado");

    if (!valor) {
      return null;
    }

    const usuario = JSON.parse(valor) as UsuarioLocal;

    return {
      perfil: usuario?.perfil,
      municipio_id: usuario?.municipio_id,
    };
  } catch {
    return null;
  }
}

const STATUS_FINAIS = new Set([
  "RECUSADA_PELO_SUBSTITUTO",
  "APROVADA",
  "NEGADA_PELO_COMANDO",
  "CANCELADA",
  "PERMUTA_MANUAL",
]);

function dataBr(valor?: string | null) {
  if (!valor) return "-";
  const [ano, mes, dia] = valor.split("-");
  return ano && mes && dia ? `${dia}/${mes}/${ano}` : valor;
}

function dataHoraBr(valor?: string | null) {
  if (!valor) return "-";
  const data = new Date(valor);
  return Number.isNaN(data.getTime())
    ? valor
    : data.toLocaleString("pt-BR");
}

function rotuloStatus(status: string) {
  const mapa: Record<string, string> = {
    AGUARDANDO_SUBSTITUTO: "Aguardando substituto",
    ACEITA_PELO_SUBSTITUTO: "Aguardando comando",
    RECUSADA_PELO_SUBSTITUTO: "Recusada pelo substituto",
    APROVADA: "Aprovada",
    NEGADA_PELO_COMANDO: "Negada pelo comando",
    CANCELADA: "Cancelada",
    PERMUTA_MANUAL: "Permuta manual",
  };
  return mapa[status] || status;
}

function classeStatus(status: string) {
  if (status === "AGUARDANDO_SUBSTITUTO") {
    return "border-amber-400/30 bg-amber-400/10 text-amber-300";
  }
  if (status === "ACEITA_PELO_SUBSTITUTO") {
    return "border-cyan-400/30 bg-cyan-400/10 text-cyan-300";
  }
  if (status === "APROVADA" || status === "PERMUTA_MANUAL") {
    return "border-emerald-400/30 bg-emerald-400/10 text-emerald-300";
  }
  if (
    status === "RECUSADA_PELO_SUBSTITUTO" ||
    status === "NEGADA_PELO_COMANDO" ||
    status === "CANCELADA"
  ) {
    return "border-red-400/30 bg-red-400/10 text-red-300";
  }
  return "border-slate-600 bg-slate-800/70 text-slate-300";
}

export default function PermutasPage() {
  const [usuarioLocal] = useState<UsuarioLocal | null>(() =>
    lerUsuarioLocal()
  );

  const [usuario, setUsuario] = useState<UsuarioApi | null>(null);
  const [guardaAtual, setGuardaAtual] = useState<Guarda | null>(null);
  const [guardas, setGuardas] = useState<Guarda[]>([]);
  const [escalas, setEscalas] = useState<Escala[]>([]);
  const [permutas, setPermutas] = useState<Permuta[]>([]);
  const [historico, setHistorico] = useState<HistoricoPermuta[]>([]);
  const [aba, setAba] = useState<Aba>("SOLICITAR");

  const [busca, setBusca] = useState("");
  const [escalaOrigemId, setEscalaOrigemId] = useState("");
  const [escalaTrocaId, setEscalaTrocaId] = useState("");
  const [motivo, setMotivo] = useState("");

  const [manualOrigemId, setManualOrigemId] = useState("");
  const [manualTrocaId, setManualTrocaId] = useState("");
  const [manualMotivo, setManualMotivo] = useState("");
  const [manualObservacao, setManualObservacao] = useState("");

  const [carregando, setCarregando] = useState(true);
  const [processando, setProcessando] = useState(false);
  const [erro, setErro] = useState("");
  const [aviso, setAviso] = useState("");

  function montarUrl() {
    return montarUrlComMunicipioContexto({
      url: "/api/escalas/permutas",
      perfil: usuarioLocal?.perfil,
      municipioIdUsuario: usuarioLocal?.municipio_id,
    });
  }

  async function tokenAtual() {
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession();

    if (error || !session?.access_token) {
      throw new Error("Sessão expirada. Entre novamente no sistema.");
    }

    return session.access_token;
  }

  async function carregar() {
    setCarregando(true);
    setErro("");

    try {
      const token = await tokenAtual();
      const resposta = await fetch(montarUrl(), {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      });

      const retorno = (await resposta.json().catch(() => null)) as
        | RetornoApi
        | null;

      if (!resposta.ok || !retorno?.ok) {
        throw new Error(
          retorno?.erro || "Não foi possível carregar as permutas."
        );
      }

      setUsuario(retorno.usuario || null);
      setGuardaAtual(retorno.guarda_atual || null);
      setGuardas(retorno.guardas || []);
      setEscalas(retorno.escalas || []);
      setPermutas(retorno.permutas || []);
      setHistorico(retorno.historico || []);
      setAviso(retorno.aviso || "");
    } catch (error) {
      setErro(
        error instanceof Error ? error.message : "Erro ao carregar permutas."
      );
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    void carregar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function executar(corpo: Record<string, unknown>) {
    setProcessando(true);
    setErro("");

    try {
      const token = await tokenAtual();
      const resposta = await fetch(montarUrl(), {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(corpo),
      });

      const retorno = await resposta.json().catch(() => null);

      if (!resposta.ok || !retorno?.ok) {
        throw new Error(
          retorno?.erro || "Não foi possível concluir a operação."
        );
      }

      await carregar();
      return true;
    } catch (error) {
      setErro(
        error instanceof Error ? error.message : "Erro ao concluir a operação."
      );
      return false;
    } finally {
      setProcessando(false);
    }
  }

  const guardasPorId = useMemo(
    () => new Map(guardas.map((guarda) => [guarda.id, guarda])),
    [guardas]
  );

  const escalasPorId = useMemo(
    () => new Map(escalas.map((escala) => [escala.id, escala])),
    [escalas]
  );

  const minhasEscalas = useMemo(
    () =>
      guardaAtual
        ? escalas.filter((escala) => escala.guarda_id === guardaAtual.id)
        : [],
    [escalas, guardaAtual]
  );

  const escalasTroca = useMemo(
    () =>
      escalas.filter(
        (escala) =>
          escala.guarda_id && escala.guarda_id !== guardaAtual?.id
      ),
    [escalas, guardaAtual]
  );

  const permutasPendentes = useMemo(
    () => permutas.filter((permuta) => !STATUS_FINAIS.has(permuta.status)),
    [permutas]
  );

  const permutasHistoricas = useMemo(
    () => permutas.filter((permuta) => STATUS_FINAIS.has(permuta.status)),
    [permutas]
  );

  const listaAtual = useMemo(() => {
    const base =
      aba === "HISTORICO" ? permutasHistoricas : permutasPendentes;
    const termo = busca.trim().toLowerCase();

    if (!termo) return base;

    return base.filter((permuta) => {
      const solicitante =
        guardasPorId.get(permuta.guarda_solicitante_id)?.nome || "";
      const substituto =
        guardasPorId.get(permuta.guarda_substituto_id)?.nome || "";

      return `${solicitante} ${substituto} ${permuta.status} ${
        permuta.motivo || ""
      }`
        .toLowerCase()
        .includes(termo);
    });
  }, [
    aba,
    busca,
    guardasPorId,
    permutasHistoricas,
    permutasPendentes,
  ]);

  const aguardandoMinhaResposta = guardaAtual
    ? permutas.filter(
        (permuta) =>
          permuta.status === "AGUARDANDO_SUBSTITUTO" &&
          permuta.guarda_substituto_id === guardaAtual.id
      ).length
    : 0;

  const aguardandoComando = permutas.filter(
    (permuta) => permuta.status === "ACEITA_PELO_SUBSTITUTO"
  ).length;

  function descricaoEscala(escala: Escala) {
    const nome =
      escala.guarda_nome ||
      guardasPorId.get(escala.guarda_id || 0)?.nome ||
      "Guarda não identificado";

    return `${dataBr(escala.data_servico)} • ${
      escala.turno || "Sem turno"
    } • ${nome}`;
  }

  async function solicitar() {
    const sucesso = await executar({
      acao: "SOLICITAR",
      escala_origem_id: Number(escalaOrigemId),
      escala_troca_id: Number(escalaTrocaId),
      motivo,
    });

    if (sucesso) {
      setEscalaOrigemId("");
      setEscalaTrocaId("");
      setMotivo("");
      setAba("PENDENCIAS");
    }
  }

  async function responder(
    permuta: Permuta,
    resposta: "ACEITA" | "RECUSADA"
  ) {
    let motivoResposta = "";

    if (resposta === "RECUSADA") {
      motivoResposta =
        window.prompt("Informe o motivo da recusa:")?.trim() || "";
      if (!motivoResposta) return;
    }

    await executar({
      acao: "RESPONDER",
      permuta_id: permuta.id,
      resposta,
      motivo: motivoResposta || null,
    });
  }

  async function decidir(
    permuta: Permuta,
    decisao: "APROVAR" | "NEGAR"
  ) {
    let motivoDecisao = "";

    if (decisao === "NEGAR") {
      motivoDecisao =
        window.prompt("Informe o motivo da negativa:")?.trim() || "";
      if (!motivoDecisao) return;
    }

    const confirmar = window.confirm(
      decisao === "APROVAR"
        ? "Aprovar a permuta e trocar os guardas nos dois plantões?"
        : "Negar esta permuta?"
    );

    if (!confirmar) return;

    await executar({
      acao: "DECIDIR",
      permuta_id: permuta.id,
      decisao,
      motivo: motivoDecisao || null,
    });
  }

  async function cancelar(permuta: Permuta) {
    const confirmar = window.confirm("Cancelar esta solicitação de permuta?");
    if (!confirmar) return;

    await executar({
      acao: "CANCELAR",
      permuta_id: permuta.id,
      motivo: "Cancelada pelo usuário.",
    });
  }

  async function registrarManual() {
    const confirmar = window.confirm(
      "Registrar a permuta manual e trocar imediatamente os guardas?"
    );
    if (!confirmar) return;

    const sucesso = await executar({
      acao: "MANUAL",
      escala_origem_id: Number(manualOrigemId),
      escala_troca_id: Number(manualTrocaId),
      motivo: manualMotivo,
      observacao: manualObservacao || null,
    });

    if (sucesso) {
      setManualOrigemId("");
      setManualTrocaId("");
      setManualMotivo("");
      setManualObservacao("");
      setAba("HISTORICO");
    }
  }

  return (
    <ProtecaoModulo modulo="permutas">
      <main className="min-h-screen space-y-5 bg-[#061326] p-3 pb-24 text-white md:p-6">
        <section className="rounded-[28px] border border-cyan-400/20 bg-[#020d20]/90 p-5 shadow-2xl shadow-black/20 md:p-7">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex items-start gap-4">
              <div className="rounded-2xl border border-cyan-400/30 bg-cyan-400/10 p-3 text-cyan-300">
                <ArrowLeftRight className="h-8 w-8" />
              </div>
              <div>
                <p className="text-xs font-black uppercase tracking-[0.2em] text-cyan-300">
                  Escalas e plantões
                </p>
                <h1 className="mt-1 text-3xl font-black md:text-4xl">
                  Permutas de Plantão
                </h1>
                <p className="mt-3 max-w-4xl text-sm leading-6 text-slate-400">
                  O solicitante escolhe os dois plantões. O substituto aceita ou
                  recusa. Após o aceite, o comando aprova ou nega. A escala só é
                  alterada depois da aprovação.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => void carregar()}
              disabled={carregando}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-blue-500/50 bg-blue-500/10 px-4 font-bold text-blue-200 transition hover:bg-blue-500/20 disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${carregando ? "animate-spin" : ""}`} />
              Atualizar
            </button>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <Indicador
              titulo="Minhas respostas"
              subtitulo="Aguardando resposta"
              valor={aguardandoMinhaResposta}
              icone={UserCheck}
            />
            <Indicador
              titulo="Aguardando comando"
              subtitulo="Aguardando aprovação"
              valor={aguardandoComando}
              icone={ShieldCheck}
            />
            <Indicador
              titulo="Em andamento"
              subtitulo="Em análise"
              valor={permutasPendentes.length}
              icone={Clock3}
            />
            <Indicador
              titulo="Concluídas"
              subtitulo="Aprovadas ou encerradas"
              valor={permutasHistoricas.length}
              icone={CheckCircle2}
            />
          </div>
        </section>

        {erro ? (
          <div className="flex items-start gap-3 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-red-200">
            <X className="mt-0.5 h-5 w-5 shrink-0" />
            <p>{erro}</p>
          </div>
        ) : null}

        {aviso ? (
          <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-amber-200">
            {aviso}
          </div>
        ) : null}

        <nav className="flex flex-col gap-3 rounded-2xl border border-slate-800 bg-[#020d20]/70 p-2 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap gap-2">
            <AbaBotao
              ativa={aba === "SOLICITAR"}
              onClick={() => setAba("SOLICITAR")}
              icone={ArrowLeftRight}
              texto="Solicitar permuta"
            />
            <AbaBotao
              ativa={aba === "PENDENCIAS"}
              onClick={() => setAba("PENDENCIAS")}
              icone={Clock3}
              texto="Pendências"
            />
            <AbaBotao
              ativa={aba === "HISTORICO"}
              onClick={() => setAba("HISTORICO")}
              icone={History}
              texto="Histórico"
            />
            {usuario?.comando ? (
              <AbaBotao
                ativa={aba === "MANUAL"}
                onClick={() => setAba("MANUAL")}
                icone={ShieldCheck}
                texto="Permuta manual"
              />
            ) : null}
          </div>

          {(aba === "PENDENCIAS" || aba === "HISTORICO") && (
            <div className="flex min-h-11 items-center gap-2 rounded-xl border border-slate-700 bg-slate-950/60 px-4 lg:w-80">
              <Search className="h-5 w-5 text-slate-500" />
              <input
                value={busca}
                onChange={(evento) => setBusca(evento.target.value)}
                placeholder="Buscar guarda ou motivo..."
                className="w-full bg-transparent text-sm outline-none placeholder:text-slate-600"
              />
            </div>
          )}
        </nav>

        {carregando ? (
          <section className="flex min-h-64 items-center justify-center gap-3 rounded-3xl border border-slate-800 bg-[#020d20]/70 text-slate-300">
            <Loader2 className="h-6 w-6 animate-spin text-cyan-300" />
            Carregando permutas...
          </section>
        ) : null}

        {!carregando && aba === "SOLICITAR" ? (
          <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
            <div className="rounded-3xl border border-slate-800 bg-[#020d20]/70 p-5 md:p-6">
              <h2 className="text-2xl font-black">Nova solicitação</h2>
              <p className="mt-2 text-sm leading-6 text-slate-400">
                Selecione um plantão que pertence ao senhor e o plantão do
                guarda com quem deseja realizar a troca.
              </p>

              {!guardaAtual ? (
                <div className="mt-5 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-amber-200">
                  O usuário precisa possuir vínculo funcional direto com um
                  guarda para solicitar permutas.
                </div>
              ) : (
                <div className="mt-6 space-y-4">
                  <CampoSelecao
                    label="Meu plantão"
                    value={escalaOrigemId}
                    onChange={setEscalaOrigemId}
                    opcoes={minhasEscalas}
                    descrever={descricaoEscala}
                    placeholder="Selecione o plantão que será trocado"
                  />

                  <CampoSelecao
                    label="Plantão do guarda substituto"
                    value={escalaTrocaId}
                    onChange={setEscalaTrocaId}
                    opcoes={escalasTroca}
                    descrever={descricaoEscala}
                    placeholder="Selecione o plantão do outro guarda"
                  />

                  <div>
                    <label className="mb-2 block text-sm font-bold text-slate-300">
                      Motivo da solicitação
                    </label>
                    <textarea
                      value={motivo}
                      onChange={(evento) => setMotivo(evento.target.value)}
                      rows={4}
                      maxLength={500}
                      placeholder="Explique de forma objetiva o motivo da permuta."
                      className="w-full resize-none rounded-2xl border border-slate-700 bg-slate-950/70 p-4 text-white outline-none transition focus:border-cyan-400"
                    />
                    <p className="mt-1 text-right text-xs text-slate-600">
                      {motivo.length}/500
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => void solicitar()}
                    disabled={
                      processando ||
                      !escalaOrigemId ||
                      !escalaTrocaId ||
                      motivo.trim().length < 3
                    }
                    className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 px-5 font-black text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {processando ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <ArrowLeftRight className="h-5 w-5" />
                    )}
                    Enviar ao substituto
                  </button>
                </div>
              )}
            </div>

            <ComoFunciona />
          </section>
        ) : null}

        {!carregando && aba === "MANUAL" && usuario?.comando ? (
          <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
            <div className="rounded-3xl border border-slate-800 bg-[#020d20]/70 p-5 md:p-6">
              <h2 className="text-2xl font-black">
                Permuta manual pelo comando
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-400">
                A troca é aplicada imediatamente e fica registrada no histórico
                e na auditoria.
              </p>

              <div className="mt-6 space-y-4">
                <CampoSelecao
                  label="Primeiro plantão"
                  value={manualOrigemId}
                  onChange={setManualOrigemId}
                  opcoes={escalas}
                  descrever={descricaoEscala}
                  placeholder="Selecione o primeiro plantão"
                />
                <CampoSelecao
                  label="Segundo plantão"
                  value={manualTrocaId}
                  onChange={setManualTrocaId}
                  opcoes={escalas}
                  descrever={descricaoEscala}
                  placeholder="Selecione o segundo plantão"
                />

                <input
                  value={manualMotivo}
                  onChange={(evento) => setManualMotivo(evento.target.value)}
                  placeholder="Justificativa obrigatória"
                  className="min-h-12 w-full rounded-2xl border border-slate-700 bg-slate-950/70 px-4 outline-none focus:border-cyan-400"
                />

                <textarea
                  value={manualObservacao}
                  onChange={(evento) =>
                    setManualObservacao(evento.target.value)
                  }
                  rows={3}
                  placeholder="Observação adicional"
                  className="w-full resize-none rounded-2xl border border-slate-700 bg-slate-950/70 p-4 outline-none focus:border-cyan-400"
                />

                <button
                  type="button"
                  onClick={() => void registrarManual()}
                  disabled={
                    processando ||
                    !manualOrigemId ||
                    !manualTrocaId ||
                    manualMotivo.trim().length < 3
                  }
                  className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-cyan-600 px-5 font-black transition hover:bg-cyan-500 disabled:opacity-40"
                >
                  {processando ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <ShieldCheck className="h-5 w-5" />
                  )}
                  Registrar permuta manual
                </button>
              </div>
            </div>

            <div className="rounded-3xl border border-red-500/20 bg-red-500/5 p-5">
              <h3 className="font-black">Atenção</h3>
              <p className="mt-2 text-sm leading-6 text-slate-400">
                A permuta manual altera as escalas no mesmo instante. Confira
                datas, turnos e nomes antes de confirmar.
              </p>
            </div>
          </section>
        ) : null}

        {!carregando &&
        (aba === "PENDENCIAS" || aba === "HISTORICO") ? (
          <section className="rounded-3xl border border-slate-800 bg-[#020d20]/70 p-4 md:p-6">
            <div>
              <h2 className="text-2xl font-black">
                {aba === "HISTORICO"
                  ? "Histórico de permutas"
                  : "Permutas pendentes"}
              </h2>
              <p className="mt-1 text-sm text-slate-400">
                {aba === "HISTORICO"
                  ? "Solicitações concluídas, negadas, recusadas, canceladas e manuais."
                  : "Ações que ainda dependem do substituto ou do comando."}
              </p>
            </div>

            <div className="mt-6 space-y-4">
              {listaAtual.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-700 p-10 text-center text-slate-500">
                  Nenhuma permuta encontrada.
                </div>
              ) : (
                listaAtual.map((permuta) => (
                  <PermutaCard
                    key={permuta.id}
                    permuta={permuta}
                    guardaAtual={guardaAtual}
                    comando={Boolean(usuario?.comando)}
                    guardasPorId={guardasPorId}
                    escalasPorId={escalasPorId}
                    historico={historico.filter(
                      (item) => item.permuta_id === permuta.id
                    )}
                    processando={processando}
                    responder={responder}
                    decidir={decidir}
                    cancelar={cancelar}
                  />
                ))
              )}
            </div>
          </section>
        ) : null}
      </main>
    </ProtecaoModulo>
  );
}

function Indicador({
  titulo,
  subtitulo,
  valor,
  icone: Icone,
}: {
  titulo: string;
  subtitulo: string;
  valor: number;
  icone: typeof UserCheck;
}) {
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-slate-800 bg-[#07162b] p-4">
      <div className="rounded-2xl border border-cyan-400/20 bg-cyan-400/10 p-3 text-cyan-300">
        <Icone className="h-6 w-6" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-3">
          <p className="text-xs font-black uppercase tracking-wider text-slate-400">
            {titulo}
          </p>
          <strong className="text-2xl">{valor}</strong>
        </div>
        <p className="mt-1 text-xs font-semibold text-slate-500">{subtitulo}</p>
      </div>
    </div>
  );
}

function AbaBotao({
  ativa,
  onClick,
  icone: Icone,
  texto,
}: {
  ativa: boolean;
  onClick: () => void;
  icone: typeof Clock3;
  texto: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex min-h-11 items-center gap-2 rounded-xl px-4 text-sm font-black transition ${
        ativa
          ? "bg-blue-600 text-white shadow-lg shadow-blue-950/50"
          : "text-slate-400 hover:bg-slate-800/80 hover:text-white"
      }`}
    >
      <Icone className="h-4 w-4" />
      {texto}
    </button>
  );
}

function CampoSelecao({
  label,
  value,
  onChange,
  opcoes,
  descrever,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (valor: string) => void;
  opcoes: Escala[];
  descrever: (escala: Escala) => string;
  placeholder: string;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-bold text-slate-300">
        {label}
      </label>
      <div className="relative">
        <select
          value={value}
          onChange={(evento) => onChange(evento.target.value)}
          className="min-h-12 w-full appearance-none rounded-2xl border border-slate-700 bg-slate-950/80 px-4 pr-12 text-white outline-none transition focus:border-cyan-400"
        >
          <option value="">{placeholder}</option>
          {opcoes.map((escala) => (
            <option key={escala.id} value={escala.id}>
              {descrever(escala)}
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" />
      </div>
      {opcoes.length === 0 ? (
        <p className="mt-2 text-xs text-amber-300">
          Nenhum plantão disponível.
        </p>
      ) : null}
    </div>
  );
}

function PermutaCard({
  permuta,
  guardaAtual,
  comando,
  guardasPorId,
  escalasPorId,
  historico,
  processando,
  responder,
  decidir,
  cancelar,
}: {
  permuta: Permuta;
  guardaAtual: Guarda | null;
  comando: boolean;
  guardasPorId: Map<number, Guarda>;
  escalasPorId: Map<number, Escala>;
  historico: HistoricoPermuta[];
  processando: boolean;
  responder: (
    permuta: Permuta,
    resposta: "ACEITA" | "RECUSADA"
  ) => Promise<void>;
  decidir: (
    permuta: Permuta,
    decisao: "APROVAR" | "NEGAR"
  ) => Promise<void>;
  cancelar: (permuta: Permuta) => Promise<void>;
}) {
  const solicitante = guardasPorId.get(permuta.guarda_solicitante_id);
  const substituto = guardasPorId.get(permuta.guarda_substituto_id);
  const origem = permuta.escala_origem_id
    ? escalasPorId.get(permuta.escala_origem_id)
    : null;
  const troca = permuta.escala_troca_id
    ? escalasPorId.get(permuta.escala_troca_id)
    : null;

  const podeResponder =
    permuta.status === "AGUARDANDO_SUBSTITUTO" &&
    guardaAtual?.id === permuta.guarda_substituto_id;

  const podeDecidir =
    comando && permuta.status === "ACEITA_PELO_SUBSTITUTO";

  const podeCancelar =
    permuta.status === "AGUARDANDO_SUBSTITUTO" &&
    (comando || guardaAtual?.id === permuta.guarda_solicitante_id);

  return (
    <article className="rounded-3xl border border-slate-800 bg-[#041126] p-4 md:p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`rounded-full border px-3 py-1 text-xs font-black ${classeStatus(
                permuta.status
              )}`}
            >
              {rotuloStatus(permuta.status)}
            </span>
            <span className="text-xs font-bold text-slate-500">
              #{permuta.id}
            </span>
          </div>

          <h3 className="mt-4 flex flex-wrap items-center gap-3 text-xl font-black md:text-2xl">
            <span>{solicitante?.nome || `Guarda ${permuta.guarda_solicitante_id}`}</span>
            <ArrowLeftRight className="h-5 w-5 text-cyan-300" />
            <span>{substituto?.nome || `Guarda ${permuta.guarda_substituto_id}`}</span>
          </h3>

          <p className="mt-2 text-sm text-slate-500">
            Solicitada em {dataHoraBr(permuta.criado_em)}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {podeResponder ? (
            <>
              <button
                type="button"
                disabled={processando}
                onClick={() => void responder(permuta, "ACEITA")}
                className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-black hover:bg-emerald-500 disabled:opacity-50"
              >
                Aceitar
              </button>
              <button
                type="button"
                disabled={processando}
                onClick={() => void responder(permuta, "RECUSADA")}
                className="rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-2 text-sm font-black text-red-200 hover:bg-red-500/20 disabled:opacity-50"
              >
                Recusar
              </button>
            </>
          ) : null}

          {podeDecidir ? (
            <>
              <button
                type="button"
                disabled={processando}
                onClick={() => void decidir(permuta, "APROVAR")}
                className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-black hover:bg-blue-500 disabled:opacity-50"
              >
                Aprovar
              </button>
              <button
                type="button"
                disabled={processando}
                onClick={() => void decidir(permuta, "NEGAR")}
                className="rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-2 text-sm font-black text-red-200 hover:bg-red-500/20 disabled:opacity-50"
              >
                Negar
              </button>
            </>
          ) : null}

          {podeCancelar ? (
            <button
              type="button"
              disabled={processando}
              onClick={() => void cancelar(permuta)}
              className="rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-2 text-sm font-black text-red-200 hover:bg-red-500/20 disabled:opacity-50"
            >
              Cancelar solicitação
            </button>
          ) : null}
        </div>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_auto_1fr] lg:items-stretch">
        <PlantaoResumo
          titulo="Plantão original (meu plantão)"
          data={permuta.data_original}
          turno={origem?.turno || null}
          guarda={solicitante?.nome || "-"}
          equipe={origem?.equipe || null}
          funcao={origem?.funcao || null}
        />

        <div className="hidden items-center justify-center lg:flex">
          <div className="rounded-full border border-slate-700 bg-slate-900 p-3 text-cyan-300">
            <ArrowLeftRight className="h-5 w-5" />
          </div>
        </div>

        <PlantaoResumo
          titulo="Plantão de troca (do substituto)"
          data={permuta.data_troca}
          turno={troca?.turno || null}
          guarda={substituto?.nome || "-"}
          equipe={troca?.equipe || null}
          funcao={troca?.funcao || null}
        />
      </div>

      {permuta.motivo ? (
        <div className="mt-4 rounded-2xl border border-slate-800 bg-slate-950/40 p-4">
          <p className="text-xs font-black uppercase tracking-wider text-slate-500">
            Motivo
          </p>
          <p className="mt-2 text-sm leading-6 text-slate-300">
            {permuta.motivo}
          </p>
        </div>
      ) : null}

      <details className="mt-4 rounded-2xl border border-slate-800 bg-slate-950/30">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 font-black">
          <span className="inline-flex items-center gap-2">
            <History className="h-4 w-4 text-slate-400" />
            Ver histórico ({historico.length})
          </span>
          <ChevronDown className="h-4 w-4 text-slate-500" />
        </summary>

        <div className="border-t border-slate-800 px-4 py-4">
          {historico.length === 0 ? (
            <p className="text-sm text-slate-500">
              Nenhum histórico registrado.
            </p>
          ) : (
            <div className="space-y-3">
              {historico.map((item) => (
                <div
                  key={item.id}
                  className="rounded-xl border border-slate-800 bg-slate-900/40 p-3"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <strong className="text-sm text-cyan-200">
                      {item.acao}
                    </strong>
                    <span className="text-xs text-slate-500">
                      {dataHoraBr(item.criado_em)}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-slate-400">
                    {item.status_anterior
                      ? `${rotuloStatus(item.status_anterior)} → `
                      : ""}
                    {rotuloStatus(item.status_novo)}
                  </p>
                  {item.observacao ? (
                    <p className="mt-2 text-sm text-slate-300">
                      {item.observacao}
                    </p>
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </div>
      </details>
    </article>
  );
}

function PlantaoResumo({
  titulo,
  data,
  turno,
  guarda,
  equipe,
  funcao,
}: {
  titulo: string;
  data: string;
  turno: string | null;
  guarda: string;
  equipe: string | null;
  funcao: string | null;
}) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-[#07162b] p-4">
      <p className="text-xs font-black uppercase tracking-wider text-cyan-300">
        {titulo}
      </p>

      <div className="mt-4 space-y-3">
        <div className="flex items-center gap-2">
          <CalendarDays className="h-4 w-4 text-cyan-300" />
          <span className="font-black">{dataBr(data)}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-300">
          <Clock3 className="h-4 w-4 text-slate-500" />
          {turno || "Sem turno"}
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-300">
          <Users className="h-4 w-4 text-slate-500" />
          {guarda}
        </div>
        {equipe ? (
          <div className="text-sm text-slate-400">Equipe: {equipe}</div>
        ) : null}
        {funcao ? (
          <div className="text-sm text-slate-400">Função: {funcao}</div>
        ) : null}
      </div>
    </div>
  );
}

function ComoFunciona() {
  return (
    <aside className="rounded-3xl border border-cyan-400/20 bg-cyan-400/5 p-5">
      <h3 className="text-lg font-black text-cyan-200">Como funciona</h3>
      <div className="mt-5 space-y-5">
        <Etapa
          numero="1"
          titulo="Solicitação"
          texto="Escolha seus plantões e o substituto desejado."
        />
        <Etapa
          numero="2"
          titulo="Substituto"
          texto="O guarda pode aceitar ou recusar."
        />
        <Etapa
          numero="3"
          titulo="Comando"
          texto="Após o aceite, o comando aprova ou nega."
        />
        <Etapa
          numero="4"
          titulo="Efetivação"
          texto="A escala só é alterada após a aprovação."
        />
      </div>
    </aside>
  );
}

function Etapa({
  numero,
  titulo,
  texto,
}: {
  numero: string;
  titulo: string;
  texto: string;
}) {
  return (
    <div className="flex gap-3">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-cyan-400/40 bg-cyan-400/10 text-sm font-black text-cyan-300">
        {numero}
      </div>
      <div>
        <p className="font-black">{titulo}</p>
        <p className="mt-1 text-sm leading-5 text-slate-400">{texto}</p>
      </div>
    </div>
  );
}