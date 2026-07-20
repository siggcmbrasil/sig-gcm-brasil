"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  FileCheck2,
  RotateCcw,
  Save,
  ShieldCheck,
  Sparkles,
  Trash2,
} from "lucide-react";

export type CampoAssistido = {
  nome: string;
  preenchido: boolean;
  obrigatorio?: boolean;
};

type Props = {
  titulo: string;
  subtitulo: string;
  chaveRascunho: string;
  dadosRascunho: Record<string, unknown>;
  campos: CampoAssistido[];
  onRestaurar: (dados: Record<string, unknown>) => void;
  onSalvar?: () => void;
  salvando?: boolean;
  prioridade?: string;
};

function agoraFormatado(valor: string | null) {
  if (!valor) return "Ainda não salvo";

  const data = new Date(valor);
  if (Number.isNaN(data.getTime())) return "Rascunho disponível";

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(data);
}

export default function PainelPreenchimentoAssistido({
  titulo,
  subtitulo,
  chaveRascunho,
  dadosRascunho,
  campos,
  onRestaurar,
  onSalvar,
  salvando = false,
  prioridade,
}: Props) {
  const [ultimoSalvamento, setUltimoSalvamento] = useState<string | null>(null);
  const [possuiRascunho, setPossuiRascunho] = useState(false);
  const [mensagem, setMensagem] = useState("");

  const preenchidos = useMemo(
    () => campos.filter((campo) => campo.preenchido).length,
    [campos],
  );

  const obrigatoriosPendentes = useMemo(
    () =>
      campos.filter(
        (campo) => campo.obrigatorio && !campo.preenchido,
      ),
    [campos],
  );

  const progresso = campos.length
    ? Math.round((preenchidos / campos.length) * 100)
    : 0;

  const urgente =
    String(prioridade ?? "").toUpperCase().includes("URGENTE") ||
    String(prioridade ?? "").toUpperCase() === "ALTA";

  useEffect(() => {
    try {
      const salvo = localStorage.getItem(chaveRascunho);
      if (salvo) {
        const parsed = JSON.parse(salvo) as {
          salvoEm?: string;
          dados?: Record<string, unknown>;
        };
        setPossuiRascunho(Boolean(parsed.dados));
        setUltimoSalvamento(parsed.salvoEm ?? null);
      }
    } catch {
      setPossuiRascunho(false);
    }
  }, [chaveRascunho]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        const salvoEm = new Date().toISOString();
        localStorage.setItem(
          chaveRascunho,
          JSON.stringify({
            versao: 1,
            salvoEm,
            dados: dadosRascunho,
          }),
        );
        setPossuiRascunho(true);
        setUltimoSalvamento(salvoEm);
        setMensagem("Rascunho salvo automaticamente.");
        window.setTimeout(() => setMensagem(""), 1800);
      } catch {
        setMensagem("Não foi possível salvar o rascunho neste dispositivo.");
      }
    }, 900);

    return () => window.clearTimeout(timer);
  }, [chaveRascunho, dadosRascunho]);

  useEffect(() => {
    if (!onSalvar) return;

    const listener = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "s") {
        event.preventDefault();
        onSalvar();
      }
    };

    window.addEventListener("keydown", listener);
    return () => window.removeEventListener("keydown", listener);
  }, [onSalvar]);

  function restaurar() {
    try {
      const salvo = localStorage.getItem(chaveRascunho);
      if (!salvo) return;

      const parsed = JSON.parse(salvo) as {
        dados?: Record<string, unknown>;
      };

      if (parsed.dados) {
        onRestaurar(parsed.dados);
        setMensagem("Rascunho restaurado.");
      }
    } catch {
      setMensagem("O rascunho salvo está inválido.");
    }
  }

  function apagarRascunho() {
    localStorage.removeItem(chaveRascunho);
    setPossuiRascunho(false);
    setUltimoSalvamento(null);
    setMensagem("Rascunho removido deste dispositivo.");
  }

  return (
    <section className="overflow-hidden rounded-[28px] border border-cyan-400/20 bg-[radial-gradient(circle_at_top_right,rgba(34,211,238,.14),transparent_38%),linear-gradient(135deg,#07152e,#061126)] shadow-xl shadow-black/20">
      <div className="grid gap-5 p-5 lg:grid-cols-[1fr_320px] lg:p-6">
        <div>
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-cyan-400/20 bg-cyan-400/10 text-cyan-300">
              <Sparkles className="h-5 w-5" />
            </div>

            <div>
              <p className="text-xs font-black uppercase tracking-[.18em] text-cyan-300">
                Preenchimento assistido
              </p>
              <h2 className="mt-1 text-xl font-black text-white">{titulo}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-400">{subtitulo}</p>
            </div>
          </div>

          {urgente ? (
            <div className="mt-4 flex items-start gap-3 rounded-2xl border border-rose-400/25 bg-rose-400/10 p-4 text-sm text-rose-100">
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-rose-300" />
              <div>
                <p className="font-black">Atendimento prioritário</p>
                <p className="mt-1 text-rose-100/75">
                  Confirme localização, natureza do fato e equipe empenhada antes de concluir.
                </p>
              </div>
            </div>
          ) : null}

          <div className="mt-5">
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs font-black uppercase tracking-wider text-slate-500">
                Progresso do preenchimento
              </p>
              <p className="text-sm font-black text-cyan-200">{progresso}%</p>
            </div>

            <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-slate-900">
              <div
                className="h-full rounded-full bg-cyan-400 transition-all duration-500"
                style={{ width: `${progresso}%` }}
              />
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {campos.map((campo) => (
              <span
                key={campo.nome}
                className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11px] font-black ${
                  campo.preenchido
                    ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-300"
                    : campo.obrigatorio
                      ? "border-amber-400/20 bg-amber-400/10 text-amber-300"
                      : "border-white/10 bg-white/[.03] text-slate-500"
                }`}
              >
                {campo.preenchido ? (
                  <CheckCircle2 className="h-3.5 w-3.5" />
                ) : (
                  <Clock3 className="h-3.5 w-3.5" />
                )}
                {campo.nome}
              </span>
            ))}
          </div>

          {obrigatoriosPendentes.length ? (
            <p className="mt-4 text-xs font-bold text-amber-300">
              Pendentes obrigatórios:{" "}
              {obrigatoriosPendentes.map((campo) => campo.nome).join(", ")}.
            </p>
          ) : (
            <p className="mt-4 inline-flex items-center gap-2 text-xs font-bold text-emerald-300">
              <ShieldCheck className="h-4 w-4" />
              Campos essenciais preenchidos.
            </p>
          )}
        </div>

        <aside className="rounded-3xl border border-white/10 bg-[#020817]/80 p-4">
          <div className="flex items-center gap-2 text-slate-300">
            <FileCheck2 className="h-5 w-5 text-cyan-300" />
            <p className="font-black">Rascunho local</p>
          </div>

          <p className="mt-3 text-xs leading-5 text-slate-500">
            Salvo automaticamente neste dispositivo para reduzir perda de dados.
          </p>

          <div className="mt-4 rounded-2xl border border-white/10 bg-white/[.03] p-3">
            <p className="text-[10px] font-black uppercase tracking-wider text-slate-600">
              Último salvamento
            </p>
            <p className="mt-1 text-sm font-bold text-slate-300">
              {agoraFormatado(ultimoSalvamento)}
            </p>
          </div>

          {mensagem ? (
            <p className="mt-3 text-xs font-bold text-cyan-300">{mensagem}</p>
          ) : null}

          <div className="mt-4 grid gap-2">
            <button
              type="button"
              onClick={restaurar}
              disabled={!possuiRascunho}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-cyan-400/20 bg-cyan-400/10 text-xs font-black text-cyan-200 disabled:opacity-40"
            >
              <RotateCcw className="h-4 w-4" />
              Restaurar rascunho
            </button>

            {onSalvar ? (
              <button
                type="button"
                onClick={onSalvar}
                disabled={salvando}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-cyan-400 text-xs font-black text-slate-950 disabled:opacity-50"
              >
                <Save className="h-4 w-4" />
                {salvando ? "Salvando..." : "Salvar agora"}
              </button>
            ) : null}

            <button
              type="button"
              onClick={apagarRascunho}
              disabled={!possuiRascunho}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-rose-400/15 bg-rose-400/[.06] text-xs font-black text-rose-300 disabled:opacity-40"
            >
              <Trash2 className="h-4 w-4" />
              Apagar rascunho
            </button>
          </div>

          <p className="mt-3 text-center text-[10px] font-bold text-slate-600">
            Atalho para salvar: Ctrl + S
          </p>
        </aside>
      </div>
    </section>
  );
}
