"use client";

import {
  AlertTriangle,
  CheckCircle2,
  MapPin,
  ShieldAlert,
  UserRoundSearch,
} from "lucide-react";

export type RegistroAlertaIntermunicipalPessoa = {
  id: number;
  municipio_id: number;
  municipio: string;
  estado: string;
  data: string | null;
  hora: string | null;
  motivo: string;
  desfecho: string;
  nivel_alerta:
    | "INFORMATIVO"
    | "ATENCAO"
    | "ALTO_RISCO"
    | "RESTRITO"
    | string;
};

export type AlertaIntermunicipalPessoaDados = {
  alerta: boolean;
  tipo_documento?: string;
  total_registros: number;
  total_municipios: number;
  ultimo_registro:
    | RegistroAlertaIntermunicipalPessoa
    | null;
  registros:
    RegistroAlertaIntermunicipalPessoa[];
};

function formatarData(
  valor: string | null
) {
  if (!valor) {
    return "Data não informada";
  }

  const partes =
    valor.match(
      /^(\d{4})-(\d{2})-(\d{2})/
    );

  if (partes) {
    return `${partes[3]}/${partes[2]}/${partes[1]}`;
  }

  return valor;
}

function nomeNivel(
  nivel: string
) {
  if (
    nivel === "ALTO_RISCO"
  ) {
    return "ALTO RISCO";
  }

  if (
    nivel === "ATENCAO"
  ) {
    return "ATENÇÃO";
  }

  if (
    nivel === "RESTRITO"
  ) {
    return "RESTRITO";
  }

  return "INFORMATIVO";
}

function classeNivel(
  nivel: string
) {
  if (
    nivel === "ALTO_RISCO" ||
    nivel === "RESTRITO"
  ) {
    return "border-red-500/40 bg-red-500/10 text-red-200";
  }

  if (
    nivel === "ATENCAO"
  ) {
    return "border-yellow-500/40 bg-yellow-500/10 text-yellow-200";
  }

  return "border-cyan-500/40 bg-cyan-500/10 text-cyan-200";
}

export default function AlertaIntermunicipalPessoa({
  alerta,
  carregando = false,
  exigirConfirmacao = false,
  confirmado = false,
  onConfirmar,
  compacto = false,
}: {
  alerta:
    | AlertaIntermunicipalPessoaDados
    | null;
  carregando?: boolean;
  exigirConfirmacao?: boolean;
  confirmado?: boolean;
  onConfirmar?: (
    valor: boolean
  ) => void;
  compacto?: boolean;
}) {
  if (carregando) {
    return (
      <div className="rounded-2xl border border-cyan-500/30 bg-cyan-500/10 p-4 text-cyan-100">
        Consultando a rede SIG-GCM Brasil...
      </div>
    );
  }

  if (!alerta) {
    return null;
  }

  if (!alerta.alerta) {
    return (
      <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4">
        <div className="flex items-center gap-3">
          <CheckCircle2 className="h-6 w-6 text-emerald-400" />

          <div>
            <p className="font-black text-emerald-300">
              Nenhum alerta intermunicipal
            </p>

            <p className="text-sm text-slate-300">
              Não foram encontrados registros deste documento em outros municípios da rede.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const nivelPrincipal =
    alerta.registros.some(
      (registro) =>
        registro.nivel_alerta ===
          "ALTO_RISCO" ||
        registro.nivel_alerta ===
          "RESTRITO"
    )
      ? "ALTO_RISCO"
      : alerta.registros.some(
            (registro) =>
              registro.nivel_alerta ===
              "ATENCAO"
          )
        ? "ATENCAO"
        : "INFORMATIVO";

  return (
    <div
      className={`rounded-2xl border p-4 ${classeNivel(
        nivelPrincipal
      )}`}
    >
      <div className="flex items-start gap-3">
        {nivelPrincipal ===
        "ALTO_RISCO" ? (
          <ShieldAlert className="mt-1 h-7 w-7 shrink-0 text-red-400" />
        ) : (
          <AlertTriangle className="mt-1 h-7 w-7 shrink-0 text-yellow-400" />
        )}

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <UserRoundSearch className="h-5 w-5" />

            <p className="text-lg font-black">
              Alerta Intermunicipal de Pessoa
            </p>
          </div>

          <p className="mt-1 text-sm text-slate-200">
            Este documento possui{" "}
            <strong>
              {alerta.total_registros}
            </strong>{" "}
            registro(s) em{" "}
            <strong>
              {alerta.total_municipios}
            </strong>{" "}
            outro(s) município(s).
          </p>

          <div
            className={`mt-4 grid gap-3 ${
              compacto
                ? "grid-cols-1"
                : "md:grid-cols-2"
            }`}
          >
            {alerta.registros
              .slice(
                0,
                compacto ? 3 : 6
              )
              .map((registro) => (
                <div
                  key={`${registro.municipio_id}-${registro.id}`}
                  className="rounded-xl border border-white/10 bg-slate-950/50 p-3"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="flex items-center gap-2 font-black text-white">
                      <MapPin className="h-4 w-4 text-cyan-400" />

                      {registro.municipio}
                      {registro.estado
                        ? ` - ${registro.estado}`
                        : ""}
                    </p>

                    <span
                      className={`rounded-full border px-2 py-1 text-[10px] font-black ${classeNivel(
                        registro.nivel_alerta
                      )}`}
                    >
                      {nomeNivel(
                        registro.nivel_alerta
                      )}
                    </span>
                  </div>

                  <p className="mt-2 text-xs text-slate-400">
                    {formatarData(
                      registro.data
                    )}
                    {registro.hora
                      ? ` às ${registro.hora}`
                      : ""}
                  </p>

                  <p className="mt-2 text-sm text-slate-200">
                    <strong>
                      Motivo:
                    </strong>{" "}
                    {registro.motivo}
                  </p>

                  <p className="mt-1 text-sm text-slate-300">
                    <strong>
                      Desfecho:
                    </strong>{" "}
                    {registro.desfecho}
                  </p>
                </div>
              ))}
          </div>

          <p className="mt-4 text-xs text-slate-400">
            A correspondência é feita por documento exato. Nome, documento, endereço, telefone, fotos e narrativa completa permanecem protegidos no município de origem.
          </p>

          {exigirConfirmacao ? (
            <label className="mt-4 flex cursor-pointer items-start gap-3 rounded-xl border border-white/10 bg-slate-950/40 p-3">
              <input
                type="checkbox"
                checked={confirmado}
                onChange={(evento) =>
                  onConfirmar?.(
                    evento.target
                      .checked
                  )
                }
                className="mt-1 h-5 w-5"
              />

              <span className="text-sm font-bold text-white">
                Confirmo que tomei ciência do alerta intermunicipal antes de registrar esta abordagem.
              </span>
            </label>
          ) : null}
        </div>
      </div>
    </div>
  );
}
