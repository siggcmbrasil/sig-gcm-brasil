"use client";

import Link from "next/link";
import {
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  CalendarDays,
  PlusCircle,
  HeartPulse,
  Search,
  UserCheck,
  Clock,
  CheckCircle,
  ShieldAlert,
} from "lucide-react";

import { supabase } from "@/lib/supabase";
import SigPageHeader from "@/components/sig/SigPageHeader";
import SigCard from "@/components/sig/SigCard";
import ProtecaoModulo from "@/components/ProtecaoModulo";
import {
  AvatarGuarda,
} from "@/components/guardas";
import { registrarAuditoria } from "@/lib/auditoria";

type Guarda = {
  id: number;
  nome: string;
  matricula: string | null;
  foto_url: string | null;
};

type RegistroAfastamento = {
  id: number;
  municipio_id: number;
  guarda_id: number;
  tipo: string;
  status: string;
  data_inicio: string;
  data_fim: string;
  motivo: string | null;
  observacao: string | null;
  documento_url: string | null;
  permite_extra_apoio: boolean;
  aprovado_em: string | null;
  criado_em: string;
  guardas: Guarda | null;
};

function hojeISO() {
  const hoje = new Date();

  return [
    hoje.getFullYear(),
    String(
      hoje.getMonth() + 1
    ).padStart(2, "0"),
    String(
      hoje.getDate()
    ).padStart(2, "0"),
  ].join("-");
}

function formatarData(
  data?: string | null
) {
  if (!data) {
    return "-";
  }

  return new Date(
    `${data}T12:00:00`
  ).toLocaleDateString("pt-BR");
}

function nomeTipo(tipo?: string | null) {
  const nomes: Record<string, string> = {
    FERIAS: "Férias",
    LICENCA_MEDICA:
      "Licença médica",
    LICENCA_PREMIO:
      "Licença-prêmio",
    AFASTAMENTO:
      "Afastamento",
    CURSO:
      "Curso",
    SUSPENSAO:
      "Suspensão",
    MISSAO:
      "Missão",
    OUTROS:
      "Outros",
  };

  return nomes[
    String(tipo || "")
      .trim()
      .toUpperCase()
  ] || tipo || "-";
}

function nomeStatus(
  status?: string | null,
  dataInicio?: string | null,
  dataFim?: string | null
) {
  const hoje = hojeISO();
  const statusNormalizado =
    String(status || "")
      .trim()
      .toUpperCase();

  if (
    statusNormalizado ===
      "CANCELADO" ||
    statusNormalizado ===
      "NEGADO"
  ) {
    return statusNormalizado;
  }

  if (
    dataInicio &&
    dataInicio > hoje
  ) {
    return "AGENDADO";
  }

  if (
    dataInicio &&
    dataFim &&
    dataInicio <= hoje &&
    dataFim >= hoje
  ) {
    return "ATIVO";
  }

  if (
    dataFim &&
    dataFim < hoje
  ) {
    return "FINALIZADO";
  }

  return statusNormalizado ||
    "PENDENTE";
}

export default function FeriasLicencasPage() {
  const [
    registros,
    setRegistros,
  ] =
    useState<
      RegistroAfastamento[]
    >([]);

  const [busca, setBusca] =
    useState("");

  const [
    carregando,
    setCarregando,
  ] =
    useState(true);

  useEffect(() => {
    void carregar();
  }, []);

  async function carregar() {
    setCarregando(true);

    try {
      const usuario =
        JSON.parse(
          localStorage.getItem(
            "usuarioLogado"
          ) || "{}"
        );

      if (
        !usuario?.id ||
        !usuario?.municipio_id
      ) {
        alert(
          "Sessão inválida. Entre novamente."
        );

        return;
      }

      const {
        data,
        error,
      } = await supabase
        .from("rh_afastamentos")
        .select(`
          id,
          municipio_id,
          guarda_id,
          tipo,
          status,
          data_inicio,
          data_fim,
          motivo,
          observacao,
          documento_url,
          permite_extra_apoio,
          aprovado_em,
          criado_em,
          guardas:guarda_id (
            id,
            nome,
            matricula,
            foto_url
          )
        `)
        .eq(
          "municipio_id",
          Number(
            usuario.municipio_id
          )
        )
        .order("data_inicio", {
          ascending: false,
        })
        .order("criado_em", {
          ascending: false,
        });

      if (error) {
        throw new Error(
          error.message
        );
      }

      setRegistros(
        (data || []) as unknown as
          RegistroAfastamento[]
      );
    } catch (error) {
      console.error(
        "Erro ao carregar férias e licenças:",
        error
      );

      alert(
        error instanceof Error
          ? error.message
          : "Erro ao carregar férias e licenças."
      );
    } finally {
      setCarregando(false);
    }
  }

  function corTipo(
    tipo?: string | null
  ) {
    const valor =
      String(tipo || "")
        .toUpperCase();

    if (valor === "FERIAS") {
      return "border-cyan-500/30 bg-cyan-500/10 text-cyan-300";
    }

    if (
      valor.includes("LICENCA")
    ) {
      return "border-yellow-500/30 bg-yellow-500/10 text-yellow-300";
    }

    if (
      valor === "SUSPENSAO" ||
      valor === "AFASTAMENTO"
    ) {
      return "border-red-500/30 bg-red-500/10 text-red-300";
    }

    if (
      valor === "CURSO" ||
      valor === "MISSAO"
    ) {
      return "border-violet-500/30 bg-violet-500/10 text-violet-300";
    }

    return "border-slate-700 bg-slate-800 text-slate-300";
  }

  function corStatus(
    status: string
  ) {
    if (status === "ATIVO") {
      return "border-emerald-500/30 bg-emerald-500/10 text-emerald-300";
    }

    if (
      status === "AGENDADO"
    ) {
      return "border-blue-500/30 bg-blue-500/10 text-blue-300";
    }

    if (
      status === "FINALIZADO"
    ) {
      return "border-slate-500/30 bg-slate-500/10 text-slate-400";
    }

    if (
      status === "CANCELADO" ||
      status === "NEGADO"
    ) {
      return "border-red-500/30 bg-red-500/10 text-red-300";
    }

    return "border-yellow-500/30 bg-yellow-500/10 text-yellow-300";
  }

  const registrosComStatus =
    useMemo(
      () =>
        registros.map(
          (registro) => ({
            ...registro,
            status_exibicao:
              nomeStatus(
                registro.status,
                registro.data_inicio,
                registro.data_fim
              ),
          })
        ),
      [registros]
    );

  const registrosFiltrados =
    useMemo(() => {
      const termo =
        busca
          .trim()
          .toLowerCase();

      if (!termo) {
        return registrosComStatus;
      }

      return registrosComStatus.filter(
        (item) => {
          const texto = `
            ${item.guardas?.nome || ""}
            ${item.guardas?.matricula || ""}
            ${nomeTipo(item.tipo)}
            ${item.tipo || ""}
            ${item.status || ""}
            ${item.status_exibicao || ""}
            ${item.motivo || ""}
            ${item.observacao || ""}
            ${item.data_inicio || ""}
            ${item.data_fim || ""}
          `.toLowerCase();

          return texto.includes(
            termo
          );
        }
      );
    }, [
      registrosComStatus,
      busca,
    ]);

  const ativos =
    registrosComStatus.filter(
      (registro) =>
        registro.status_exibicao ===
        "ATIVO"
    ).length;

  const ferias =
    registrosComStatus.filter(
      (registro) =>
        registro.tipo === "FERIAS"
    ).length;

  const licencas =
    registrosComStatus.filter(
      (registro) =>
        String(
          registro.tipo || ""
        ).startsWith(
          "LICENCA"
        )
    ).length;

  const agendados =
    registrosComStatus.filter(
      (registro) =>
        registro.status_exibicao ===
        "AGENDADO"
    ).length;

    async function decidirSolicitacao(
  item: any,
  decisao: "APROVADO" | "NEGADO"
) {
  const observacao = prompt(
    decisao === "APROVADO"
      ? "Observação da aprovação (opcional):"
      : "Motivo da negativa:"
  );

  if (
    decisao === "NEGADO" &&
    !observacao?.trim()
  ) {
    alert("Informe o motivo da negativa.");
    return;
  }

  const permitirExtra =
    decisao === "APROVADO"
      ? confirm(
          "Permitir que este afastamento realize EXTRA/APOIO?"
        )
      : false;

  const { error } = await supabase.rpc(
    "rh_decidir_solicitacao_afastamento",
    {
      p_afastamento_id: item.id,
      p_decisao: decisao,
      p_observacao_decisao:
        observacao || null,
      p_permite_extra_apoio:
        permitirExtra,
    }
  );

  if (error) {
    alert(error.message);
    return;
  }

  await registrarAuditoria({
    modulo: "RH",
    acao:
      decisao === "APROVADO"
        ? "APROVAR_AFASTAMENTO"
        : "NEGAR_AFASTAMENTO",
    tabela: "rh_afastamentos",
    registro_id: String(item.id),
    descricao: `${decisao} solicitação de ${item.guardas?.nome}.`,
  });

  await carregar();

  alert(
    decisao === "APROVADO"
      ? "Solicitação aprovada."
      : "Solicitação negada."
  );
}

  return (
    <ProtecaoModulo modulo="ferias_licencas">
      <div className="space-y-6 p-4 pb-24 md:p-6">
  
      <div className="mb-4 flex justify-end">
        <Link href="/sistema/saude-ocupacional" className="rounded-xl border border-cyan-400/25 bg-cyan-400/10 px-4 py-3 text-sm font-black text-cyan-300">
          Saúde ocupacional
        </Link>
      </div>

      <SigPageHeader
          titulo="Férias e Licenças"
          subtitulo="Controle integrado de férias, licenças, afastamentos, cursos e indisponibilidades funcionais."
          icone={CalendarDays}
        />

        <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
          <SigCard>
            <HeartPulse className="mb-3 h-8 w-8 text-cyan-400" />

            <p className="text-sm text-slate-400">
              Registros
            </p>

            <h2 className="mt-2 text-4xl font-black text-white">
              {registros.length}
            </h2>
          </SigCard>

          <SigCard>
            <UserCheck className="mb-3 h-8 w-8 text-emerald-400" />

            <p className="text-sm text-slate-400">
              Ativos
            </p>

            <h2 className="mt-2 text-4xl font-black text-emerald-400">
              {ativos}
            </h2>
          </SigCard>

          <SigCard>
            <CalendarDays className="mb-3 h-8 w-8 text-cyan-400" />

            <p className="text-sm text-slate-400">
              Férias
            </p>

            <h2 className="mt-2 text-4xl font-black text-cyan-400">
              {ferias}
            </h2>
          </SigCard>

          <SigCard>
            <Clock className="mb-3 h-8 w-8 text-yellow-400" />

            <p className="text-sm text-slate-400">
              Licenças
            </p>

            <h2 className="mt-2 text-4xl font-black text-yellow-400">
              {licencas}
            </h2>
          </SigCard>

          <SigCard>
            <ShieldAlert className="mb-3 h-8 w-8 text-blue-400" />

            <p className="text-sm text-slate-400">
              Agendados
            </p>

            <h2 className="mt-2 text-4xl font-black text-blue-400">
              {agendados}
            </h2>
          </SigCard>
        </div>

        <SigCard>
          <div className="flex flex-col gap-3 md:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" />

              <input
                className="input pl-12"
                placeholder="Buscar por guarda, matrícula, tipo, status ou motivo..."
                value={busca}
                onChange={(event) =>
                  setBusca(
                    event.target.value
                  )
                }
              />
            </div>

            <Link
              href="/sistema/ferias-licencas/nova"
              className="btn-primary inline-flex items-center justify-center gap-2"
            >
              <PlusCircle size={18} />
              Novo Registro
            </Link>
          </div>
        </SigCard>

        <SigCard>
          <div className="mb-5 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-black text-white">
                Registros de Férias e Licenças
              </h2>

              <p className="mt-1 text-sm text-slate-400">
                {registrosFiltrados.length} registro(s) encontrado(s).
              </p>
            </div>

            <button
              type="button"
              onClick={() =>
                void carregar()
              }
              disabled={carregando}
              className="btn-secondary text-sm"
            >
              Atualizar
            </button>
          </div>

          {carregando ? (
            <p className="text-slate-400">
              Carregando registros...
            </p>
          ) : registrosFiltrados.length ===
            0 ? (
            <div className="py-14 text-center">
              <CalendarDays className="mx-auto mb-4 h-16 w-16 text-cyan-400" />

              <h3 className="text-2xl font-black text-white">
                Nenhum registro encontrado
              </h3>

              <p className="mt-2 text-slate-400">
                Cadastre férias, licenças ou afastamentos dos servidores.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
              {registrosFiltrados.map(
                (item) => (
                  <div
                    key={item.id}
                    className="rounded-2xl border border-slate-800 bg-slate-950/70 p-5"
                  >
                    <div className="flex items-start gap-4">
                      <AvatarGuarda
                        nome={
                          item.guardas
                            ?.nome ||
                          "Guarda"
                        }
                        fotoUrl={
                          item.guardas
                            ?.foto_url
                        }
                        tamanho="md"
                      />

                      <div className="min-w-0 flex-1">
                        <h3 className="truncate text-lg font-black text-white">
                          {item.guardas
                            ?.nome ||
                            "Guarda não informado"}
                        </h3>

                        <p className="text-sm font-bold text-cyan-400">
                          {item.guardas
                            ?.matricula ||
                            "Sem matrícula"}
                        </p>

                        <div className="mt-3 flex flex-wrap gap-2">
                          <span
                            className={`rounded-full border px-3 py-1 text-xs font-black ${corTipo(
                              item.tipo
                            )}`}
                          >
                            {nomeTipo(
                              item.tipo
                            )}
                          </span>

                          <span
                            className={`rounded-full border px-3 py-1 text-xs font-black ${corStatus(
                              item.status_exibicao
                            )}`}
                          >
                            {
                              item.status_exibicao
                            }
                          </span>

                          {item.permite_extra_apoio && (
                            <span className="rounded-full border border-yellow-500/30 bg-yellow-500/10 px-3 py-1 text-xs font-black text-yellow-300">
                              EXTRA/APOIO AUTORIZADO
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="mt-5 grid gap-3 rounded-2xl border border-slate-800 bg-slate-900/40 p-4 text-sm md:grid-cols-2">
                      <p className="text-slate-400">
                        <strong className="text-slate-200">
                          Início:
                        </strong>{" "}
                        {formatarData(
                          item.data_inicio
                        )}
                      </p>

                      <p className="text-slate-400">
                        <strong className="text-slate-200">
                          Fim:
                        </strong>{" "}
                        {formatarData(
                          item.data_fim
                        )}
                      </p>
                    </div>

                    {item.motivo && (
                      <div className="mt-4">
                        <p className="text-xs font-black uppercase tracking-wide text-slate-500">
                          Motivo
                        </p>

                        <p className="mt-1 text-sm text-slate-300">
                          {item.motivo}
                        </p>
                      </div>
                    )}

                    {item.observacao && (
                      <div className="mt-4 border-t border-slate-800 pt-4">
                        <p className="text-xs font-black uppercase tracking-wide text-slate-500">
                          Observações
                        </p>

                        <p className="mt-1 whitespace-pre-wrap text-sm text-slate-400">
                          {item.observacao}
                        </p>
                      </div>
                    )}

                    <div className="mt-5 flex flex-wrap gap-2">
                      <Link
                        href={`/sistema/guardas/${item.guarda_id}`}
                        className="btn-secondary inline-flex items-center gap-2 text-sm"
                      >
                        <CheckCircle className="h-4 w-4" />
                        Ver dossiê
                      </Link>

{item.status === "PENDENTE" && (
  <>
    <button
      type="button"
      onClick={() =>
        decidirSolicitacao(
          item,
          "APROVADO"
        )
      }
      className="rounded-xl bg-emerald-600 px-4 py-2 font-bold hover:bg-emerald-700"
    >
      ✅ Aprovar
    </button>

    <button
      type="button"
      onClick={() =>
        decidirSolicitacao(
          item,
          "NEGADO"
        )
      }
      className="rounded-xl bg-red-600 px-4 py-2 font-bold hover:bg-red-700"
    >
      ❌ Negar
    </button>
  </>
)}

                    </div>
                  </div>
                )
              )}
            </div>
          )}
        </SigCard>
      </div>
    </ProtecaoModulo>
  );
}