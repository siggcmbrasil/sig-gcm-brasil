"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  ArrowRightLeft,
  CalendarDays,
  Check,
  ChevronDown,
  CircleX,
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

import ProtecaoModulo from "@/components/ProtecaoModulo";
import { registrarAuditoria } from "@/lib/auditoria";
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
  decidido_em: string | null;
  cancelado_em: string | null;
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

type RespostaCarregamento = {
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

type Aba =
  | "SOLICITAR"
  | "PENDENCIAS"
  | "HISTORICO"
  | "MANUAL";

const STATUS_FINAIS = new Set([
  "APROVADA",
  "NEGADA_PELO_COMANDO",
  "RECUSADA_PELO_SUBSTITUTO",
  "CANCELADA",
  "PERMUTA_MANUAL",
]);

function lerUsuarioLocal():
  | UsuarioLocal
  | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    return JSON.parse(
      localStorage.getItem(
        "usuarioLogado"
      ) || "{}"
    ) as UsuarioLocal;
  } catch {
    return null;
  }
}

function dataBr(valor: string) {
  if (!valor) {
    return "-";
  }

  const correspondencia =
    valor.match(
      /^(\d{4})-(\d{2})-(\d{2})/
    );

  if (correspondencia) {
    return (
      `${correspondencia[3]}/` +
      `${correspondencia[2]}/` +
      `${correspondencia[1]}`
    );
  }

  return new Date(valor).toLocaleDateString(
    "pt-BR"
  );
}

function dataHoraBr(
  valor: string | null
) {
  if (!valor) {
    return "-";
  }

  const data = new Date(valor);

  if (Number.isNaN(data.getTime())) {
    return valor;
  }

  return data.toLocaleString("pt-BR");
}

function rotuloStatus(status: string) {
  const rotulos: Record<string, string> = {
    AGUARDANDO_SUBSTITUTO:
      "Aguardando substituto",
    ACEITA_PELO_SUBSTITUTO:
      "Aguardando comando",
    RECUSADA_PELO_SUBSTITUTO:
      "Recusada pelo substituto",
    APROVADA: "Aprovada",
    NEGADA_PELO_COMANDO:
      "Negada pelo comando",
    CANCELADA: "Cancelada",
    PERMUTA_MANUAL:
      "Permuta manual",
  };

  return rotulos[status] || status;
}

function classeStatus(status: string) {
  if (
    status ===
    "AGUARDANDO_SUBSTITUTO"
  ) {
    return "border-amber-500/30 bg-amber-500/10 text-amber-300";
  }

  if (
    status ===
    "ACEITA_PELO_SUBSTITUTO"
  ) {
    return "border-blue-500/30 bg-blue-500/10 text-blue-300";
  }

  if (
    status === "APROVADA" ||
    status === "PERMUTA_MANUAL"
  ) {
    return "border-emerald-500/30 bg-emerald-500/10 text-emerald-300";
  }

  if (
    status ===
      "RECUSADA_PELO_SUBSTITUTO" ||
    status ===
      "NEGADA_PELO_COMANDO"
  ) {
    return "border-red-500/30 bg-red-500/10 text-red-300";
  }

  return "border-slate-600 bg-slate-800/70 text-slate-300";
}

export default function PermutasPage() {
  const [usuarioLocal] =
    useState<UsuarioLocal | null>(
      () => lerUsuarioLocal()
    );

  const [usuario, setUsuario] =
    useState<UsuarioApi | null>(null);
  const [guardaAtual, setGuardaAtual] =
    useState<Guarda | null>(null);
  const [guardas, setGuardas] =
    useState<Guarda[]>([]);
  const [escalas, setEscalas] =
    useState<Escala[]>([]);
  const [permutas, setPermutas] =
    useState<Permuta[]>([]);
  const [historico, setHistorico] =
    useState<HistoricoPermuta[]>([]);
  const [municipioId, setMunicipioId] =
    useState<number | null>(null);
  const [aba, setAba] =
    useState<Aba>("SOLICITAR");
  const [busca, setBusca] =
    useState("");
  const [carregando, setCarregando] =
    useState(true);
  const [processando, setProcessando] =
    useState(false);
  const [erro, setErro] =
    useState("");
  const [aviso, setAviso] =
    useState("");

  const [escalaOrigemId, setEscalaOrigemId] =
    useState("");
  const [escalaTrocaId, setEscalaTrocaId] =
    useState("");
  const [motivo, setMotivo] =
    useState("");

  const [manualOrigemId, setManualOrigemId] =
    useState("");
  const [manualTrocaId, setManualTrocaId] =
    useState("");
  const [manualMotivo, setManualMotivo] =
    useState("");
  const [manualObservacao, setManualObservacao] =
    useState("");

  function montarUrl() {
    return montarUrlComMunicipioContexto({
      url: "/api/escalas/permutas",
      perfil: usuarioLocal?.perfil,
      municipioIdUsuario:
        usuarioLocal?.municipio_id,
    });
  }

  async function tokenAtual() {
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession();

    if (
      error ||
      !session?.access_token
    ) {
      throw new Error(
        "Sessão inválida ou expirada."
      );
    }

    return session.access_token;
  }

  async function carregar() {
    setCarregando(true);
    setErro("");

    try {
      const token = await tokenAtual();
      const resposta = await fetch(
        montarUrl(),
        {
          headers: {
            Authorization:
              `Bearer ${token}`,
          },
          cache: "no-store",
        }
      );

      const retorno =
        (await resposta
          .json()
          .catch(() => ({}))) as
          RespostaCarregamento;

      if (
        !resposta.ok ||
        !retorno.ok
      ) {
        throw new Error(
          retorno.erro ||
            "Não foi possível carregar as permutas."
        );
      }

      setUsuario(retorno.usuario || null);
      setGuardaAtual(
        retorno.guarda_atual || null
      );
      setGuardas(retorno.guardas || []);
      setEscalas(retorno.escalas || []);
      setPermutas(retorno.permutas || []);
      setHistorico(retorno.historico || []);
      setMunicipioId(
        retorno.municipio_id || null
      );
      setAviso(retorno.aviso || "");
    } catch (error) {
      setErro(
        error instanceof Error
          ? error.message
          : "Erro ao carregar permutas."
      );
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    void carregar();
  }, []);

  async function executar(
    corpo: Record<string, unknown>,
    auditoria: {
      acao: string;
      descricao: string;
      registroId?: number | null;
    }
  ) {
    setProcessando(true);
    setErro("");

    try {
      const token = await tokenAtual();
      const resposta = await fetch(
        montarUrl(),
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
            Authorization:
              `Bearer ${token}`,
          },
          cache: "no-store",
          body: JSON.stringify(corpo),
        }
      );

      const retorno = await resposta
        .json()
        .catch(() => ({}));

      if (
        !resposta.ok ||
        !retorno.ok
      ) {
        throw new Error(
          retorno.erro ||
            "Não foi possível processar a permuta."
        );
      }

      await registrarAuditoria({
        modulo: "Permutas de Plantão",
        acao: auditoria.acao,
        descricao:
          auditoria.descricao,
        registro_id:
          auditoria.registroId ||
          retorno?.permuta?.id ||
          retorno?.resultado?.permuta_id ||
          null,
        tabela:
          "permutas_plantao",
        municipio_id:
          municipioId,
        detalhes: corpo,
      });

      alert(
        retorno.mensagem ||
          "Operação realizada com sucesso."
      );

      await carregar();
      return true;
    } catch (error) {
      setErro(
        error instanceof Error
          ? error.message
          : "Erro ao processar permuta."
      );
      return false;
    } finally {
      setProcessando(false);
    }
  }

  const guardasPorId = useMemo(
    () =>
      new Map(
        guardas.map((guarda) => [
          guarda.id,
          guarda,
        ])
      ),
    [guardas]
  );

  const escalasPorId = useMemo(
    () =>
      new Map(
        escalas.map((escala) => [
          escala.id,
          escala,
        ])
      ),
    [escalas]
  );

  const minhasEscalas = useMemo(
    () =>
      guardaAtual
        ? escalas.filter(
            (escala) =>
              escala.guarda_id ===
              guardaAtual.id
          )
        : [],
    [escalas, guardaAtual]
  );

  const escalasTroca = useMemo(
    () =>
      escalas.filter(
        (escala) =>
          escala.guarda_id &&
          escala.guarda_id !==
            guardaAtual?.id
      ),
    [escalas, guardaAtual]
  );

  const permutasPendentes = useMemo(
    () =>
      permutas.filter(
        (permuta) =>
          !STATUS_FINAIS.has(
            permuta.status
          )
      ),
    [permutas]
  );

  const permutasHistoricas = useMemo(
    () =>
      permutas.filter((permuta) =>
        STATUS_FINAIS.has(
          permuta.status
        )
      ),
    [permutas]
  );

  const listaAtual = useMemo(() => {
    const base =
      aba === "HISTORICO"
        ? permutasHistoricas
        : permutasPendentes;
    const termo = busca
      .trim()
      .toLowerCase();

    if (!termo) {
      return base;
    }

    return base.filter((permuta) => {
      const solicitante =
        guardasPorId.get(
          permuta.guarda_solicitante_id
        )?.nome || "";
      const substituto =
        guardasPorId.get(
          permuta.guarda_substituto_id
        )?.nome || "";

      return `${solicitante} ${substituto} ${permuta.status} ${permuta.motivo || ""}`
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

  const aguardandoMinhaResposta =
    guardaAtual
      ? permutas.filter(
          (permuta) =>
            permuta.status ===
              "AGUARDANDO_SUBSTITUTO" &&
            permuta.guarda_substituto_id ===
              guardaAtual.id
        ).length
      : 0;

  const aguardandoComando =
    permutas.filter(
      (permuta) =>
        permuta.status ===
        "ACEITA_PELO_SUBSTITUTO"
    ).length;

  function descricaoEscala(
    escala: Escala
  ) {
    const nome =
      escala.guarda_nome ||
      guardasPorId.get(
        escala.guarda_id || 0
      )?.nome ||
      "Guarda não identificado";

    return (
      `${dataBr(escala.data_servico)} • ` +
      `${escala.turno || "Sem turno"} • ` +
      `${nome}`
    );
  }

  async function solicitar() {
    const sucesso = await executar(
      {
        acao: "SOLICITAR",
        escala_origem_id:
          Number(escalaOrigemId),
        escala_troca_id:
          Number(escalaTrocaId),
        motivo,
      },
      {
        acao: "SOLICITAR",
        descricao:
          "Criou uma solicitação de permuta de plantão.",
      }
    );

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
    const motivo =
      resposta === "RECUSADA"
        ? window.prompt(
            "Informe o motivo da recusa:"
          )
        : "";

    if (
      resposta === "RECUSADA" &&
      !motivo?.trim()
    ) {
      return;
    }

    await executar(
      {
        acao: "RESPONDER",
        permuta_id: permuta.id,
        resposta,
        motivo: motivo || null,
      },
      {
        acao:
          resposta === "ACEITA"
            ? "ACEITAR"
            : "RECUSAR",
        descricao:
          resposta === "ACEITA"
            ? `Aceitou a permuta #${permuta.id}.`
            : `Recusou a permuta #${permuta.id}.`,
        registroId: permuta.id,
      }
    );
  }

  async function decidir(
    permuta: Permuta,
    decisao: "APROVAR" | "NEGAR"
  ) {
    const motivo = window.prompt(
      decisao === "APROVAR"
        ? "Observação da aprovação (opcional):"
        : "Informe o motivo da negativa:"
    );

    if (
      decisao === "NEGAR" &&
      !motivo?.trim()
    ) {
      return;
    }

    const confirmar = window.confirm(
      decisao === "APROVAR"
        ? "Aprovar a permuta e trocar os guardas nos dois plantões?"
        : "Negar esta permuta?"
    );

    if (!confirmar) {
      return;
    }

    await executar(
      {
        acao: "DECIDIR",
        permuta_id: permuta.id,
        decisao,
        motivo: motivo || null,
      },
      {
        acao: decisao,
        descricao:
          decisao === "APROVAR"
            ? `Aprovou a permuta #${permuta.id} e atualizou as escalas.`
            : `Negou a permuta #${permuta.id}.`,
        registroId: permuta.id,
      }
    );
  }

  async function cancelar(
    permuta: Permuta
  ) {
    const motivo = window.prompt(
      "Informe o motivo do cancelamento:"
    );

    if (motivo === null) {
      return;
    }

    await executar(
      {
        acao: "CANCELAR",
        permuta_id: permuta.id,
        motivo,
      },
      {
        acao: "CANCELAR",
        descricao:
          `Cancelou a permuta #${permuta.id}.`,
        registroId: permuta.id,
      }
    );
  }

  async function registrarManual() {
    const confirmar = window.confirm(
      "Registrar a permuta manual e trocar imediatamente os guardas nos plantões selecionados?"
    );

    if (!confirmar) {
      return;
    }

    const sucesso = await executar(
      {
        acao: "MANUAL",
        escala_origem_id:
          Number(manualOrigemId),
        escala_troca_id:
          Number(manualTrocaId),
        motivo: manualMotivo,
        observacao:
          manualObservacao || null,
      },
      {
        acao: "PERMUTA_MANUAL",
        descricao:
          "Registrou permuta manual e atualizou as escalas.",
      }
    );

    if (sucesso) {
      setManualOrigemId("");
      setManualTrocaId("");
      setManualMotivo("");
      setManualObservacao("");
      setAba("HISTORICO");
    }
  }

  return (
    <ProtecaoModulo modulo="escalas">
      <main className="space-y-6 p-4 pb-24 md:p-6">
        <section className="rounded-3xl border border-cyan-500/20 bg-slate-950/75 p-5 md:p-7">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-start gap-4">
              <div className="rounded-2xl border border-cyan-500/30 bg-cyan-500/10 p-3 text-cyan-300">
                <ArrowRightLeft className="h-8 w-8" />
              </div>

              <div>
                <p className="text-xs font-black uppercase tracking-[0.18em] text-cyan-300">
                  Escalas e plantões
                </p>
                <h1 className="mt-1 text-3xl font-black text-white">
                  Permutas de Plantão
                </h1>
                <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">
                  O solicitante escolhe os dois plantões. O substituto aceita ou recusa. Após o aceite, o comando aprova ou nega. A escala só é alterada depois da aprovação.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => void carregar()}
              disabled={carregando || processando}
              className="flex items-center justify-center gap-2 rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 font-bold text-slate-200 transition hover:border-cyan-500/50 hover:text-cyan-300 disabled:opacity-50"
            >
              <RefreshCw className="h-5 w-5" />
              Atualizar
            </button>
          </div>
        </section>

        {erro ? (
          <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-red-200">
            {erro}
          </div>
        ) : null}

        {aviso ? (
          <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-amber-200">
            {aviso}
          </div>
        ) : null}

        <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Indicador
            titulo="Minha resposta"
            valor={aguardandoMinhaResposta}
            icone={UserCheck}
          />
          <Indicador
            titulo="Aguardando comando"
            valor={aguardandoComando}
            icone={ShieldCheck}
          />
          <Indicador
            titulo="Em andamento"
            valor={permutasPendentes.length}
            icone={Clock3}
          />
          <Indicador
            titulo="Concluídas"
            valor={permutasHistoricas.length}
            icone={History}
          />
        </section>

        <nav className="flex flex-wrap gap-2 rounded-2xl border border-slate-800 bg-slate-950/60 p-2">
          <AbaBotao
            ativa={aba === "SOLICITAR"}
            onClick={() => setAba("SOLICITAR")}
            icone={ArrowRightLeft}
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
        </nav>

        {carregando ? (
          <section className="flex min-h-64 items-center justify-center gap-3 rounded-3xl border border-slate-800 bg-slate-950/60 text-slate-300">
            <Loader2 className="h-6 w-6 animate-spin text-cyan-300" />
            Carregando permutas...
          </section>
        ) : null}

        {!carregando && aba === "SOLICITAR" ? (
          <section className="grid gap-5 xl:grid-cols-[0.7fr_0.3fr]">
            <div className="rounded-3xl border border-slate-800 bg-slate-950/65 p-5 md:p-6">
              <h2 className="text-2xl font-black text-white">
                Nova solicitação
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-400">
                Selecione um plantão que pertence ao senhor e o plantão do guarda com quem deseja realizar a troca.
              </p>

              {!guardaAtual ? (
                <div className="mt-5 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-amber-200">
                  O usuário precisa estar vinculado a um guarda pela matrícula, CPF ou e-mail para solicitar permutas.
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
                      placeholder="Explique de forma objetiva o motivo da permuta."
                      className="input w-full resize-none"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => void solicitar()}
                    disabled={
                      processando ||
                      !escalaOrigemId ||
                      !escalaTrocaId ||
                      motivo.trim().length < 5
                    }
                    className="btn-primary flex w-full items-center justify-center gap-2 py-3 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {processando ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <ArrowRightLeft className="h-5 w-5" />
                    )}
                    Enviar ao substituto
                  </button>
                </div>
              )}
            </div>

            <FluxoExplicado />
          </section>
        ) : null}

        {!carregando && aba === "MANUAL" && usuario?.comando ? (
          <section className="grid gap-5 xl:grid-cols-[0.7fr_0.3fr]">
            <div className="rounded-3xl border border-blue-500/25 bg-slate-950/65 p-5 md:p-6">
              <div className="flex items-start gap-3">
                <div className="rounded-2xl border border-blue-500/30 bg-blue-500/10 p-3 text-blue-300">
                  <ShieldCheck className="h-7 w-7" />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-white">
                    Permuta manual pelo comando
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-slate-400">
                    Esta ação não depende do aceite prévio. Os guardas serão trocados imediatamente nos dois plantões e todo o procedimento ficará registrado no histórico.
                  </p>
                </div>
              </div>

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
                  opcoes={escalas.filter(
                    (escala) =>
                      String(escala.id) !== manualOrigemId
                  )}
                  descrever={descricaoEscala}
                  placeholder="Selecione o segundo plantão"
                />

                <div>
                  <label className="mb-2 block text-sm font-bold text-slate-300">
                    Motivo obrigatório
                  </label>
                  <textarea
                    value={manualMotivo}
                    onChange={(evento) => setManualMotivo(evento.target.value)}
                    rows={3}
                    className="input w-full resize-none"
                    placeholder="Justificativa administrativa para a permuta manual."
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-bold text-slate-300">
                    Observação complementar
                  </label>
                  <textarea
                    value={manualObservacao}
                    onChange={(evento) => setManualObservacao(evento.target.value)}
                    rows={3}
                    className="input w-full resize-none"
                    placeholder="Informações adicionais, se necessário."
                  />
                </div>

                <button
                  type="button"
                  onClick={() => void registrarManual()}
                  disabled={
                    processando ||
                    !manualOrigemId ||
                    !manualTrocaId ||
                    manualMotivo.trim().length < 5
                  }
                  className="flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-700 px-5 py-3 font-black text-white transition hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-50"
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
              <h3 className="font-black text-white">
                Atenção
              </h3>
              <p className="mt-2 text-sm leading-6 text-slate-400">
                A permuta manual altera as escalas no mesmo instante. Confira as datas, os turnos e os nomes dos dois guardas antes de confirmar.
              </p>
            </div>
          </section>
        ) : null}

        {!carregando && (aba === "PENDENCIAS" || aba === "HISTORICO") ? (
          <section className="rounded-3xl border border-slate-800 bg-slate-950/65 p-5 md:p-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-2xl font-black text-white">
                  {aba === "HISTORICO" ? "Histórico de permutas" : "Permutas pendentes"}
                </h2>
                <p className="mt-1 text-sm text-slate-400">
                  {aba === "HISTORICO"
                    ? "Solicitações concluídas, negadas, recusadas, canceladas e manuais."
                    : "Ações que ainda dependem do substituto ou do comando."}
                </p>
              </div>

              <div className="flex min-h-12 items-center gap-2 rounded-2xl border border-slate-700 bg-slate-900 px-4 md:w-80">
                <Search className="h-5 w-5 text-slate-500" />
                <input
                  value={busca}
                  onChange={(evento) => setBusca(evento.target.value)}
                  placeholder="Buscar guarda ou motivo..."
                  className="w-full bg-transparent text-sm text-white outline-none placeholder:text-slate-600"
                />
              </div>
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

function AbaBotao({
  ativa,
  onClick,
  icone: Icone,
  texto,
}: {
  ativa: boolean;
  onClick: () => void;
  icone: typeof History;
  texto: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-black transition ${
        ativa
          ? "bg-cyan-600 text-white"
          : "text-slate-400 hover:bg-slate-900 hover:text-white"
      }`}
    >
      <Icone className="h-4 w-4" />
      {texto}
    </button>
  );
}

function Indicador({
  titulo,
  valor,
  icone: Icone,
}: {
  titulo: string;
  valor: number;
  icone: typeof History;
}) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
      <div className="flex items-center justify-between gap-3">
        <Icone className="h-5 w-5 text-cyan-300" />
        <strong className="text-2xl text-white">
          {valor}
        </strong>
      </div>
      <p className="mt-3 text-xs font-black uppercase tracking-wider text-slate-500">
        {titulo}
      </p>
    </div>
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
      <select
        value={value}
        onChange={(evento) => onChange(evento.target.value)}
        className="input w-full"
      >
        <option value="">{placeholder}</option>
        {opcoes.map((escala) => (
          <option key={escala.id} value={escala.id}>
            {descrever(escala)}
          </option>
        ))}
      </select>
    </div>
  );
}

function FluxoExplicado() {
  return (
    <aside className="rounded-3xl border border-slate-800 bg-slate-950/60 p-5">
      <h3 className="text-lg font-black text-white">
        Como funciona
      </h3>
      <div className="mt-5 space-y-4">
        <Etapa numero="1" texto="O guarda solicita a troca entre dois plantões." />
        <Etapa numero="2" texto="O guarda substituto aceita ou recusa." />
        <Etapa numero="3" texto="Após o aceite, o comando aprova ou nega." />
        <Etapa numero="4" texto="Somente a aprovação altera a escala." />
      </div>
    </aside>
  );
}

function Etapa({
  numero,
  texto,
}: {
  numero: string;
  texto: string;
}) {
  return (
    <div className="flex gap-3">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-cyan-500/30 bg-cyan-500/10 text-sm font-black text-cyan-300">
        {numero}
      </span>
      <p className="pt-1 text-sm leading-6 text-slate-400">
        {texto}
      </p>
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
  cancelar: (
    permuta: Permuta
  ) => Promise<void>;
}) {
  const solicitante = guardasPorId.get(
    permuta.guarda_solicitante_id
  );
  const substituto = guardasPorId.get(
    permuta.guarda_substituto_id
  );
  const origem = permuta.escala_origem_id
    ? escalasPorId.get(
        permuta.escala_origem_id
      )
    : null;
  const troca = permuta.escala_troca_id
    ? escalasPorId.get(
        permuta.escala_troca_id
      )
    : null;

  const podeResponder =
    permuta.status ===
      "AGUARDANDO_SUBSTITUTO" &&
    guardaAtual?.id ===
      permuta.guarda_substituto_id;
  const podeDecidir =
    comando &&
    permuta.status ===
      "ACEITA_PELO_SUBSTITUTO";
  const podeCancelar =
    permuta.status ===
      "AGUARDANDO_SUBSTITUTO" &&
    (comando ||
      guardaAtual?.id ===
        permuta.guarda_solicitante_id);

  return (
    <article className="rounded-3xl border border-slate-800 bg-slate-950/55 p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className={`rounded-full border px-3 py-1 text-xs font-black ${classeStatus(permuta.status)}`}>
              {rotuloStatus(permuta.status)}
            </span>
            {permuta.origem === "MANUAL" ? (
              <span className="rounded-full border border-violet-500/30 bg-violet-500/10 px-3 py-1 text-xs font-black text-violet-300">
                MANUAL
              </span>
            ) : null}
            <span className="text-xs text-slate-600">
              #{permuta.id}
            </span>
          </div>

          <h3 className="mt-3 text-xl font-black text-white">
            {solicitante?.nome || `Guarda ${permuta.guarda_solicitante_id}`}
            <span className="mx-2 text-cyan-400">↔</span>
            {substituto?.nome || `Guarda ${permuta.guarda_substituto_id}`}
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
                onClick={() => void responder(permuta, "ACEITA")}
                disabled={processando}
                className="flex items-center gap-2 rounded-xl bg-emerald-700 px-4 py-2 text-sm font-black text-white hover:bg-emerald-600 disabled:opacity-50"
              >
                <Check className="h-4 w-4" />
                Aceitar
              </button>
              <button
                type="button"
                onClick={() => void responder(permuta, "RECUSADA")}
                disabled={processando}
                className="flex items-center gap-2 rounded-xl bg-red-700 px-4 py-2 text-sm font-black text-white hover:bg-red-600 disabled:opacity-50"
              >
                <X className="h-4 w-4" />
                Recusar
              </button>
            </>
          ) : null}

          {podeDecidir ? (
            <>
              <button
                type="button"
                onClick={() => void decidir(permuta, "APROVAR")}
                disabled={processando}
                className="flex items-center gap-2 rounded-xl bg-blue-700 px-4 py-2 text-sm font-black text-white hover:bg-blue-600 disabled:opacity-50"
              >
                <ShieldCheck className="h-4 w-4" />
                Aprovar
              </button>
              <button
                type="button"
                onClick={() => void decidir(permuta, "NEGAR")}
                disabled={processando}
                className="flex items-center gap-2 rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-2 text-sm font-black text-red-300 hover:bg-red-500/20 disabled:opacity-50"
              >
                <CircleX className="h-4 w-4" />
                Negar
              </button>
            </>
          ) : null}

          {podeCancelar ? (
            <button
              type="button"
              onClick={() => void cancelar(permuta)}
              disabled={processando}
              className="rounded-xl border border-slate-700 bg-slate-900 px-4 py-2 text-sm font-black text-slate-300 hover:border-red-500/40 hover:text-red-300 disabled:opacity-50"
            >
              Cancelar
            </button>
          ) : null}
        </div>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-2">
        <PlantaoResumo
          titulo="Plantão original"
          data={permuta.data_original}
          turno={origem?.turno || null}
          guarda={solicitante?.nome || "-"}
        />
        <PlantaoResumo
          titulo="Plantão de troca"
          data={permuta.data_troca}
          turno={troca?.turno || null}
          guarda={substituto?.nome || "-"}
        />
      </div>

      {permuta.motivo ? (
        <div className="mt-4 rounded-2xl border border-slate-800 bg-slate-900/45 p-4">
          <p className="text-xs font-black uppercase tracking-wider text-slate-500">
            Motivo
          </p>
          <p className="mt-2 text-sm leading-6 text-slate-300">
            {permuta.motivo}
          </p>
        </div>
      ) : null}

      {permuta.motivo_recusa_substituto || permuta.motivo_decisao_comando || permuta.motivo_cancelamento ? (
        <div className="mt-3 rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4 text-sm text-amber-100">
          {permuta.motivo_recusa_substituto || permuta.motivo_decisao_comando || permuta.motivo_cancelamento}
        </div>
      ) : null}

      {historico.length ? (
        <details className="group mt-4 border-t border-slate-800 pt-4">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-sm font-black text-slate-400 hover:text-white">
            <span className="flex items-center gap-2">
              <History className="h-4 w-4" />
              Ver histórico ({historico.length})
            </span>
            <ChevronDown className="h-5 w-5 transition group-open:rotate-180" />
          </summary>

          <div className="mt-4 space-y-3">
            {historico.map((item) => (
              <div key={item.id} className="flex gap-3 rounded-2xl border border-slate-800 bg-slate-900/40 p-3">
                <div className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-cyan-400" />
                <div>
                  <p className="text-sm font-bold text-slate-200">
                    {item.acao.replaceAll("_", " ")}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    {dataHoraBr(item.criado_em)}
                  </p>
                  {item.observacao ? (
                    <p className="mt-2 text-sm text-slate-400">
                      {item.observacao}
                    </p>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        </details>
      ) : null}
    </article>
  );
}

function PlantaoResumo({
  titulo,
  data,
  turno,
  guarda,
}: {
  titulo: string;
  data: string;
  turno: string | null;
  guarda: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-4">
      <p className="text-xs font-black uppercase tracking-wider text-cyan-300">
        {titulo}
      </p>
      <div className="mt-3 flex items-center gap-2 text-white">
        <CalendarDays className="h-4 w-4 text-slate-500" />
        <span className="font-black">
          {dataBr(data)}
        </span>
        <span className="text-slate-600">•</span>
        <span className="text-sm text-slate-400">
          {turno || "Sem turno"}
        </span>
      </div>
      <div className="mt-2 flex items-center gap-2 text-sm text-slate-400">
        <Users className="h-4 w-4" />
        {guarda}
      </div>
    </div>
  );
}
