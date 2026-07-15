"use client";

import Link from "next/link";
import {
  AlertTriangle,
  CalendarDays,
  Car,
  Check,
  Edit,
  Eye,
  MapPin,
  Play,
  Shield,
  Trash2,
  User,
  Users,
} from "lucide-react";

type Ocorrencia = {
  id: number;
  protocolo: string;
  tipo: string;
  local: string;
  bairro: string | null;
  data: string;
  hora: string | null;
  status: string;
  prioridade: string | null;
  guarnicao_id: number | null;
  viatura_id: number | null;
  guarda_responsavel_id: number | null;
};

type Props = {
  ocorrencias: Ocorrencia[];
  podeEditar: boolean;
  podeExcluir: boolean;
  nomeGuarnicao: (id: number | null) => string;
  prefixoViatura: (id: number | null) => string;
  nomeGuarda: (id: number | null) => string;
  alterarStatus: (
    id: number,
    status: string
  ) => void | Promise<void>;
  excluirOcorrencia: (
    id: number
  ) => void | Promise<void>;
};

function classeBordaPrioridade(
  prioridade?: string | null
) {
  if (prioridade === "ALTA") {
    return "border-l-red-500";
  }

  if (prioridade === "BAIXA") {
    return "border-l-emerald-500";
  }

  return "border-l-amber-400";
}

function classePrioridade(
  prioridade?: string | null
) {
  if (prioridade === "ALTA") {
    return "border-red-500/30 bg-red-500/10 text-red-200";
  }

  if (prioridade === "BAIXA") {
    return "border-emerald-500/30 bg-emerald-500/10 text-emerald-200";
  }

  return "border-amber-500/30 bg-amber-500/10 text-amber-200";
}

function textoPrioridade(
  prioridade?: string | null
) {
  if (prioridade === "ALTA") {
    return "🔥 ALTA";
  }

  if (prioridade === "BAIXA") {
    return "✅ BAIXA";
  }

  return "⚠️ MÉDIA";
}

function classeStatus(status: string) {
  if (status === "Aberta") {
    return "border-red-500/30 bg-red-500/10 text-red-200";
  }

  if (status === "Em andamento") {
    return "border-violet-500/30 bg-violet-500/10 text-violet-200";
  }

  if (status === "Finalizada") {
    return "border-emerald-500/30 bg-emerald-500/10 text-emerald-200";
  }

  if (status === "Cancelada") {
    return "border-slate-500/30 bg-slate-500/10 text-slate-300";
  }

  return "border-blue-500/30 bg-blue-500/10 text-blue-200";
}

function formatarData(valor: string) {
  if (!valor) {
    return "Data não informada";
  }

  const data = new Date(
    `${valor}T12:00:00`
  );

  if (
    Number.isNaN(
      data.getTime()
    )
  ) {
    return valor;
  }

  return new Intl.DateTimeFormat(
    "pt-BR"
  ).format(data);
}

export default function ListaOcorrenciasMobile({
  ocorrencias,
  podeEditar,
  podeExcluir,
  nomeGuarnicao,
  prefixoViatura,
  nomeGuarda,
  alterarStatus,
  excluirOcorrencia,
}: Props) {
  if (ocorrencias.length === 0) {
    return (
      <section className="rounded-3xl border border-dashed border-white/10 bg-slate-900/50 p-8 text-center md:hidden">
        <div className="text-6xl">
          🚨
        </div>

        <h2 className="mt-5 text-xl font-black text-white">
          Nenhuma ocorrência encontrada
        </h2>

        <p className="mt-2 text-sm leading-6 text-slate-400">
          Ajuste os filtros ou registre uma nova ocorrência.
        </p>
      </section>
    );
  }

  return (
    <section className="space-y-4 md:hidden">
      {ocorrencias.map(
        (ocorrencia) => {
          const finalizada =
            ocorrencia.status ===
            "Finalizada";

          const cancelada =
            ocorrencia.status ===
            "Cancelada";

          return (
            <article
              key={ocorrencia.id}
              className={`overflow-hidden rounded-3xl border border-white/10 border-l-4 bg-slate-900/90 shadow-xl shadow-black/20 ${classeBordaPrioridade(
                ocorrencia.prioridade
              )}`}
            >
              <div className="border-b border-white/10 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-black tracking-wide text-blue-300">
                      🚨 {ocorrencia.protocolo}
                    </p>

                    <h2 className="mt-1 break-words text-xl font-black uppercase leading-tight text-white">
                      {ocorrencia.tipo}
                    </h2>
                  </div>

                  <span
                    className={`shrink-0 rounded-full border px-3 py-1 text-[10px] font-black ${classePrioridade(
                      ocorrencia.prioridade
                    )}`}
                  >
                    {textoPrioridade(
                      ocorrencia.prioridade
                    )}
                  </span>
                </div>

                <div
                  className={`mt-4 flex w-full items-center justify-center rounded-2xl border px-4 py-3 text-sm font-black uppercase tracking-wide ${classeStatus(
                    ocorrencia.status
                  )}`}
                >
                  {ocorrencia.status}
                </div>
              </div>

              <div className="grid gap-2 p-4">
                <InfoLinha
                  icone={
                    <CalendarDays className="h-4 w-4" />
                  }
                  titulo="Data e hora"
                  valor={`${formatarData(
                    ocorrencia.data
                  )} às ${
                    ocorrencia.hora ||
                    "--:--"
                  }`}
                />

                <InfoLinha
                  icone={
                    <MapPin className="h-4 w-4" />
                  }
                  titulo="Local"
                  valor={[
                    ocorrencia.local,
                    ocorrencia.bairro,
                  ]
                    .filter(Boolean)
                    .join(" • ")}
                />

                <InfoLinha
                  icone={
                    <Users className="h-4 w-4" />
                  }
                  titulo="Guarnição"
                  valor={nomeGuarnicao(
                    ocorrencia.guarnicao_id
                  )}
                />

                <InfoLinha
                  icone={
                    <Car className="h-4 w-4" />
                  }
                  titulo="Viatura"
                  valor={prefixoViatura(
                    ocorrencia.viatura_id
                  )}
                />

                <InfoLinha
                  icone={
                    <User className="h-4 w-4" />
                  }
                  titulo="Responsável"
                  valor={nomeGuarda(
                    ocorrencia.guarda_responsavel_id
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-2 border-t border-white/10 p-4">
                <Link
                  href={`/sistema/ocorrencias/${ocorrencia.id}`}
                  className="col-span-2 inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-4 py-3.5 font-black text-white transition active:scale-[0.98]"
                >
                  <Eye className="h-5 w-5" />
                  Visualizar ocorrência
                </Link>

                {podeEditar &&
                  !finalizada &&
                  !cancelada && (
                    <Link
                      href={`/sistema/ocorrencias/${ocorrencia.id}/editar`}
                      className="inline-flex items-center justify-center gap-2 rounded-2xl border border-amber-500/25 bg-amber-500/10 px-3 py-3 font-bold text-amber-200 transition active:scale-[0.98]"
                    >
                      <Edit className="h-4 w-4" />
                      Editar
                    </Link>
                  )}

                {podeEditar &&
                  ocorrencia.status ===
                    "Aberta" && (
                    <button
                      type="button"
                      onClick={() =>
                        void alterarStatus(
                          ocorrencia.id,
                          "Em andamento"
                        )
                      }
                      className="inline-flex items-center justify-center gap-2 rounded-2xl border border-violet-500/25 bg-violet-500/10 px-3 py-3 font-bold text-violet-200 transition active:scale-[0.98]"
                    >
                      <Play className="h-4 w-4" />
                      Aceitar
                    </button>
                  )}

                {podeEditar &&
                  ocorrencia.status ===
                    "Em andamento" && (
                    <button
                      type="button"
                      onClick={() =>
                        void alterarStatus(
                          ocorrencia.id,
                          "Finalizada"
                        )
                      }
                      className="inline-flex items-center justify-center gap-2 rounded-2xl border border-emerald-500/25 bg-emerald-500/10 px-3 py-3 font-bold text-emerald-200 transition active:scale-[0.98]"
                    >
                      <Check className="h-4 w-4" />
                      Finalizar
                    </button>
                  )}

                {podeExcluir &&
                  !finalizada && (
                    <button
                      type="button"
                      onClick={() =>
                        void excluirOcorrencia(
                          ocorrencia.id
                        )
                      }
                      className="inline-flex items-center justify-center gap-2 rounded-2xl border border-red-500/25 bg-red-500/10 px-3 py-3 font-bold text-red-200 transition active:scale-[0.98]"
                    >
                      <Trash2 className="h-4 w-4" />
                      Excluir
                    </button>
                  )}

                {(finalizada ||
                  cancelada) && (
                  <div className="col-span-2 inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm font-semibold text-slate-400">
                    {finalizada ? (
                      <>
                        <Check className="h-4 w-4 text-emerald-400" />
                        Ocorrência concluída
                      </>
                    ) : (
                      <>
                        <AlertTriangle className="h-4 w-4 text-slate-400" />
                        Ocorrência cancelada
                      </>
                    )}
                  </div>
                )}
              </div>
            </article>
          );
        }
      )}
    </section>
  );
}

function InfoLinha({
  icone,
  titulo,
  valor,
}: {
  icone: React.ReactNode;
  titulo: string;
  valor: string;
}) {
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-3">
      <div className="mt-0.5 text-cyan-300">
        {icone}
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-500">
          {titulo}
        </p>

        <p className="mt-1 break-words text-sm font-semibold leading-5 text-slate-200">
          {valor || "Não informado"}
        </p>
      </div>
    </div>
  );
}