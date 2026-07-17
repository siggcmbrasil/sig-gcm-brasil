"use client";

import {
  CalendarDays,
  Send,
  XCircle,
} from "lucide-react";
import {
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  useParams,
} from "next/navigation";

import { supabase } from "@/lib/supabase";
import { registrarAuditoria } from "@/lib/auditoria";
import ProtecaoModulo from "@/components/ProtecaoModulo";

type Registro = {
  id: number;
  tipo: string;
  status: string;
  data_inicio: string;
  data_fim: string;
  motivo: string | null;
  observacao: string | null;
  permite_extra_apoio: boolean;
  aprovado_em: string | null;
  criado_em: string;
  pode_cancelar: boolean;
};

const tiposPermitidos = [
  {
    valor: "FERIAS",
    nome: "Férias",
  },
  {
    valor: "LICENCA_MEDICA",
    nome: "Licença médica",
  },
  {
    valor: "LICENCA_PREMIO",
    nome: "Licença-prêmio",
  },
  {
    valor: "CURSO",
    nome: "Curso",
  },
  {
    valor: "OUTROS",
    nome: "Outros",
  },
];

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

function nomeTipo(tipo: string) {
  return (
    tiposPermitidos.find(
      (item) =>
        item.valor === tipo
    )?.nome ||
    tipo.replaceAll("_", " ")
  );
}

function corStatus(status: string) {
  switch (
    String(status || "")
      .toUpperCase()
  ) {
    case "APROVADO":
    case "ATIVO":
      return "border-emerald-500/30 bg-emerald-500/10 text-emerald-300";

    case "NEGADO":
    case "CANCELADO":
      return "border-red-500/30 bg-red-500/10 text-red-300";

    case "FINALIZADO":
      return "border-slate-500/30 bg-slate-500/10 text-slate-400";

    default:
      return "border-yellow-500/30 bg-yellow-500/10 text-yellow-300";
  }
}

export default function FeriasLicencasGuardaPage() {
  const parametros = useParams();

  const guardaId = Number(
    parametros.id
  );

  const [
    registros,
    setRegistros,
  ] = useState<Registro[]>([]);

  const [tipo, setTipo] =
    useState("FERIAS");

  const [
    dataInicio,
    setDataInicio,
  ] = useState("");

  const [dataFim, setDataFim] =
    useState("");

  const [motivo, setMotivo] =
    useState("");

  const [
    observacao,
    setObservacao,
  ] = useState("");

  const [
    carregando,
    setCarregando,
  ] = useState(true);

  const [
    salvando,
    setSalvando,
  ] = useState(false);

  const [
    podeSolicitar,
    setPodeSolicitar,
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
  }, [guardaId]);

  async function carregar() {
    if (
      !Number.isSafeInteger(
        guardaId
      ) ||
      guardaId <= 0
    ) {
      setCarregando(false);
      return;
    }

    setCarregando(true);

    try {
      const {
        data,
        error,
      } = await supabase.rpc(
        "rh_listar_afastamentos_dossie",
        {
          p_guarda_id:
            guardaId,
        }
      );

      if (error) {
        throw new Error(
          error.message
        );
      }

      const lista =
        (data || []) as Registro[];

      setRegistros(lista);

      const temRegistroCancelavel =
        lista.some(
          (item) =>
            item.pode_cancelar
        );

      const perfil =
        String(
          usuario?.perfil || ""
        ).toUpperCase();

      const perfilAdministrativo =
        [
          "DESENVOLVEDOR",
          "ADMIN",
          "COMANDANTE",
          "DIRETOR",
          "CMT_GUARNICAO",
        ].includes(perfil);

      /*
       * Quando o retorno possui uma solicitação
       * cancelável, já sabemos que este é o próprio
       * guarda. Para quem ainda não possui registros,
       * confirmamos o vínculo abaixo.
       */
      if (temRegistroCancelavel) {
        setPodeSolicitar(true);
        return;
      }

      const {
        data: guarda,
        error: guardaError,
      } = await supabase
        .from("guardas")
        .select("id,usuario_id")
        .eq("id", guardaId)
        .maybeSingle();

      if (guardaError) {
        throw new Error(
          guardaError.message
        );
      }

      setPodeSolicitar(
        Number(
          guarda?.usuario_id
        ) ===
          Number(
            usuario?.id
          ) &&
          !perfilAdministrativo
      );
    } catch (error) {
      console.error(
        "Erro ao carregar férias e licenças:",
        error
      );

      alert(
        error instanceof Error
          ? error.message
          : "Não foi possível carregar os registros."
      );
    } finally {
      setCarregando(false);
    }
  }

  async function solicitar() {
    if (salvando) {
      return;
    }

    if (!podeSolicitar) {
      alert(
        "Esta área permite solicitações apenas pelo próprio guarda."
      );
      return;
    }

    if (
      !dataInicio ||
      !dataFim
    ) {
      alert(
        "Informe a data inicial e a data final."
      );
      return;
    }

    if (dataFim < dataInicio) {
      alert(
        "A data final não pode ser anterior à data inicial."
      );
      return;
    }

    if (!motivo.trim()) {
      alert(
        "Informe o motivo da solicitação."
      );
      return;
    }

    setSalvando(true);

    try {
      const {
        data,
        error,
      } = await supabase.rpc(
        "rh_solicitar_meu_afastamento",
        {
          p_tipo: tipo,
          p_data_inicio:
            dataInicio,
          p_data_fim:
            dataFim,
          p_motivo:
            motivo.trim(),
          p_observacao:
            observacao.trim() ||
            null,
        }
      );

      if (error) {
        throw new Error(
          error.message
        );
      }

      await registrarAuditoria({
        modulo:
          "Dossiê do Guarda",
        acao:
          "SOLICITAR_AFASTAMENTO",
        tabela:
          "rh_afastamentos",
        registro_id:
          String(data?.id || ""),
        descricao:
          `Solicitou ${nomeTipo(
            tipo
          )}, de ${formatarData(
            dataInicio
          )} até ${formatarData(
            dataFim
          )}.`,
        detalhes: {
          guarda_id:
            guardaId,
          tipo,
          data_inicio:
            dataInicio,
          data_fim:
            dataFim,
          status:
            "PENDENTE",
        },
      });

      setTipo("FERIAS");
      setDataInicio("");
      setDataFim("");
      setMotivo("");
      setObservacao("");

      alert(
        "Solicitação enviada para análise do Comando/RH."
      );

      await carregar();
    } catch (error) {
      console.error(
        "Erro ao solicitar férias ou licença:",
        error
      );

      alert(
        error instanceof Error
          ? error.message
          : "Não foi possível enviar a solicitação."
      );
    } finally {
      setSalvando(false);
    }
  }

  async function cancelar(
    registro: Registro
  ) {
    if (
      !registro.pode_cancelar
    ) {
      return;
    }

    if (
      !confirm(
        "Cancelar esta solicitação pendente?"
      )
    ) {
      return;
    }

    try {
      const {
        error,
      } = await supabase.rpc(
        "rh_cancelar_minha_solicitacao",
        {
          p_afastamento_id:
            registro.id,
        }
      );

      if (error) {
        throw new Error(
          error.message
        );
      }

      await registrarAuditoria({
        modulo:
          "Dossiê do Guarda",
        acao:
          "CANCELAR_SOLICITACAO_AFASTAMENTO",
        tabela:
          "rh_afastamentos",
        registro_id:
          String(registro.id),
        descricao:
          `Cancelou solicitação de ${nomeTipo(
            registro.tipo
          )}.`,
        detalhes: {
          guarda_id:
            guardaId,
          afastamento_id:
            registro.id,
        },
      });

      alert(
        "Solicitação cancelada."
      );

      await carregar();
    } catch (error) {
      alert(
        error instanceof Error
          ? error.message
          : "Não foi possível cancelar a solicitação."
      );
    }
  }

  return (
    <ProtecaoModulo modulo="guardas">
      <div className="space-y-6 p-4 pb-24 text-white md:p-6">
        <div className="painel-premium p-6">
          <h1 className="text-3xl font-black">
            Férias e Licenças
          </h1>

          <p className="mt-2 text-slate-400">
            Consulte o histórico e acompanhe solicitações de férias, licenças e cursos.
          </p>
        </div>

        {podeSolicitar && (
          <div className="painel-premium p-6">
            <div className="mb-5">
              <h2 className="text-xl font-black text-white">
                Nova solicitação
              </h2>

              <p className="mt-1 text-sm text-slate-400">
                A solicitação será enviada com status PENDENTE e dependerá da aprovação do Comando/RH.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="label">
                  Tipo
                </label>

                <select
                  className="input"
                  value={tipo}
                  disabled={salvando}
                  onChange={(event) =>
                    setTipo(
                      event.target.value
                    )
                  }
                >
                  {tiposPermitidos.map(
                    (item) => (
                      <option
                        key={
                          item.valor
                        }
                        value={
                          item.valor
                        }
                      >
                        {item.nome}
                      </option>
                    )
                  )}
                </select>
              </div>

              <div>
                <label className="label">
                  Data inicial
                </label>

                <input
                  type="date"
                  className="input"
                  value={dataInicio}
                  disabled={salvando}
                  onChange={(event) =>
                    setDataInicio(
                      event.target.value
                    )
                  }
                />
              </div>

              <div>
                <label className="label">
                  Data final
                </label>

                <input
                  type="date"
                  className="input"
                  min={
                    dataInicio ||
                    undefined
                  }
                  value={dataFim}
                  disabled={salvando}
                  onChange={(event) =>
                    setDataFim(
                      event.target.value
                    )
                  }
                />
              </div>

              <div>
                <label className="label">
                  Motivo
                </label>

                <input
                  className="input"
                  value={motivo}
                  disabled={salvando}
                  placeholder="Informe o motivo da solicitação"
                  onChange={(event) =>
                    setMotivo(
                      event.target.value
                    )
                  }
                />
              </div>

              <div className="md:col-span-2">
                <label className="label">
                  Observações
                </label>

                <textarea
                  className="input min-h-28 resize-none"
                  value={observacao}
                  disabled={salvando}
                  placeholder="Informações complementares..."
                  onChange={(event) =>
                    setObservacao(
                      event.target.value
                    )
                  }
                />
              </div>
            </div>

            <button
              type="button"
              onClick={() =>
                void solicitar()
              }
              disabled={salvando}
              className="btn-primary mt-5 inline-flex items-center gap-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Send className="h-5 w-5" />

              {salvando
                ? "Enviando..."
                : "Enviar solicitação"}
            </button>
          </div>
        )}

        {!podeSolicitar && (
          <div className="rounded-2xl border border-cyan-500/20 bg-cyan-500/5 p-4 text-sm text-slate-300">
            Esta área está em modo de consulta. Solicitações somente podem ser realizadas pelo próprio guarda vinculado ao usuário.
          </div>
        )}

        <div className="space-y-4">
          {carregando ? (
            <div className="painel-premium p-6">
              <p className="text-slate-400">
                Carregando registros...
              </p>
            </div>
          ) : registros.length === 0 ? (
            <div className="painel-premium p-8 text-center">
              <CalendarDays className="mx-auto mb-3 h-10 w-10 text-slate-500" />

              <p className="text-slate-400">
                Nenhum registro encontrado.
              </p>
            </div>
          ) : (
            registros.map(
              (item) => (
                <div
                  key={item.id}
                  className="painel-premium p-5"
                >
                  <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                    <div>
                      <h2 className="text-xl font-black text-white">
                        {nomeTipo(
                          item.tipo
                        )}
                      </h2>

                      <p className="mt-1 text-slate-400">
                        {formatarData(
                          item.data_inicio
                        )}{" "}
                        até{" "}
                        {formatarData(
                          item.data_fim
                        )}
                      </p>
                    </div>

                    <span
                      className={`w-fit rounded-full border px-3 py-1 text-xs font-black ${corStatus(
                        item.status
                      )}`}
                    >
                      {item.status}
                    </span>
                  </div>

                  {item.motivo && (
                    <div className="mt-4">
                      <p className="text-xs font-black uppercase tracking-wide text-slate-500">
                        Motivo
                      </p>

                      <p className="mt-1 text-slate-300">
                        {item.motivo}
                      </p>
                    </div>
                  )}

                  {item.observacao && (
                    <div className="mt-4 border-t border-slate-800 pt-4">
                      <p className="whitespace-pre-wrap text-slate-400">
                        {item.observacao}
                      </p>
                    </div>
                  )}

                  {item.permite_extra_apoio && (
                    <p className="mt-4 text-sm font-bold text-yellow-300">
                      Serviço EXTRA/APOIO autorizado pelo Comando.
                    </p>
                  )}

                  {item.pode_cancelar && (
                    <button
                      type="button"
                      onClick={() =>
                        void cancelar(
                          item
                        )
                      }
                      className="mt-5 inline-flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2 font-bold text-red-300 hover:bg-red-500/20"
                    >
                      <XCircle className="h-4 w-4" />
                      Cancelar solicitação
                    </button>
                  )}
                </div>
              )
            )
          )}
        </div>
      </div>
    </ProtecaoModulo>
  );
}