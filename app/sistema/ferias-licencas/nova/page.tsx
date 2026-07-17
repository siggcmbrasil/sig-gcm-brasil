"use client";

import {
  CalendarDays,
  Save,
} from "lucide-react";
import {
  useEffect,
  useMemo,
  useState,
} from "react";
import { useRouter } from "next/navigation";

import { supabase } from "@/lib/supabase";
import SigCard from "@/components/sig/SigCard";
import SigPageHeader from "@/components/sig/SigPageHeader";
import { registrarAuditoria } from "@/lib/auditoria";
import ProtecaoModulo from "@/components/ProtecaoModulo";

type Guarda = {
  id: number;
  nome: string;
  matricula: string | null;
  situacao_funcional: string | null;
};

const tiposAfastamento = [
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
    valor: "AFASTAMENTO",
    nome: "Afastamento",
  },
  {
    valor: "CURSO",
    nome: "Curso",
  },
  {
    valor: "SUSPENSAO",
    nome: "Suspensão",
  },
  {
    valor: "MISSAO",
    nome: "Missão",
  },
  {
    valor: "OUTROS",
    nome: "Outros",
  },
];

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

export default function NovaFeriasPage() {
  const router = useRouter();

  const [guardas, setGuardas] =
    useState<Guarda[]>([]);

  const [guardaId, setGuardaId] =
    useState("");

  const [tipo, setTipo] =
    useState("FERIAS");

  const [dataInicio, setDataInicio] =
    useState(hojeISO());

  const [dataFim, setDataFim] =
    useState("");

  const [motivo, setMotivo] =
    useState("");

  const [observacao, setObservacao] =
    useState("");

  const [
    permiteExtraApoio,
    setPermiteExtraApoio,
  ] = useState(false);

  const [salvando, setSalvando] =
    useState(false);

  const [carregando, setCarregando] =
    useState(true);

  const guardaSelecionado =
    useMemo(
      () =>
        guardas.find(
          (guarda) =>
            String(guarda.id) ===
            String(guardaId)
        ) || null,
      [guardas, guardaId]
    );

  useEffect(() => {
    void carregarGuardas();
  }, []);

  async function carregarGuardas() {
    setCarregando(true);

    try {
      const usuario = JSON.parse(
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

        router.replace("/login");
        return;
      }

      const {
        data,
        error,
      } = await supabase
        .from(
          "vw_guardas_disponibilidade_operacional"
        )
        .select(`
          id,
          nome,
          matricula,
          situacao_funcional
        `)
        .eq(
          "municipio_id",
          Number(
            usuario.municipio_id
          )
        )
        .order("nome", {
          ascending: true,
        });

      if (error) {
        throw new Error(
          error.message
        );
      }

      setGuardas(
        (data || []) as Guarda[]
      );
    } catch (error) {
      console.error(
        "Erro ao carregar guardas:",
        error
      );

      alert(
        error instanceof Error
          ? error.message
          : "Não foi possível carregar os guardas."
      );
    } finally {
      setCarregando(false);
    }
  }

  async function salvar() {
    if (salvando) {
      return;
    }

    const usuario = JSON.parse(
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

    if (!guardaId) {
      alert("Selecione o guarda.");
      return;
    }

    if (!tipo) {
      alert(
        "Selecione o tipo de afastamento."
      );
      return;
    }

    if (!dataInicio || !dataFim) {
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
        "Informe o motivo do registro."
      );
      return;
    }

    setSalvando(true);

    try {
      const {
        data: sobrepostos,
        error: sobreposicaoError,
      } = await supabase
        .from("rh_afastamentos")
        .select(`
          id,
          tipo,
          status,
          data_inicio,
          data_fim
        `)
        .eq(
          "municipio_id",
          Number(
            usuario.municipio_id
          )
        )
        .eq(
          "guarda_id",
          Number(guardaId)
        )
        .in("status", [
          "PENDENTE",
          "APROVADO",
          "ATIVO",
        ])
        .lte(
          "data_inicio",
          dataFim
        )
        .gte(
          "data_fim",
          dataInicio
        );

      if (sobreposicaoError) {
        throw new Error(
          sobreposicaoError.message
        );
      }

      if (
        sobrepostos &&
        sobrepostos.length > 0
      ) {
        const existente =
          sobrepostos[0];

        alert(
          `Já existe um afastamento neste período.\n\n` +
            `Tipo: ${existente.tipo}\n` +
            `Período: ${formatarData(
              existente.data_inicio
            )} até ${formatarData(
              existente.data_fim
            )}\n` +
            `Status: ${existente.status}`
        );

        return;
      }

      const {
        data: registro,
        error,
      } = await supabase
        .from("rh_afastamentos")
        .insert({
          municipio_id:
            Number(
              usuario.municipio_id
            ),
          guarda_id:
            Number(guardaId),
          tipo,
          status: "APROVADO",
          data_inicio:
            dataInicio,
          data_fim:
            dataFim,
          motivo:
            motivo.trim(),
          observacao:
            observacao.trim() ||
            null,
          permite_extra_apoio:
            permiteExtraApoio,
          aprovado_por:
            Number(usuario.id),
          aprovado_em:
            new Date().toISOString(),
          criado_por:
            Number(usuario.id),
        })
        .select("id")
        .single();

      if (error) {
        throw new Error(
          error.message
        );
      }

      await registrarAuditoria({
        modulo:
          "Férias e Licenças",
        acao:
          "CRIAR_AFASTAMENTO",
        tabela:
          "rh_afastamentos",
        registro_id:
          String(registro.id),
        descricao:
          `Registrou ${tipo} para ` +
          `${
            guardaSelecionado?.nome ||
            "guarda"
          }, de ${formatarData(
            dataInicio
          )} até ${formatarData(
            dataFim
          )}.`,
        detalhes: {
          afastamento_id:
            registro.id,
          guarda_id:
            Number(guardaId),
          tipo,
          status:
            "APROVADO",
          data_inicio:
            dataInicio,
          data_fim:
            dataFim,
          permite_extra_apoio:
            permiteExtraApoio,
        },
      });

      alert(
        "Férias ou licença registradas com sucesso.\n\n" +
          "O Motor do RH já aplicará o bloqueio em escalas, guarnições, armamento e demais módulos."
      );

      router.push(
        "/sistema/ferias-licencas"
      );
    } catch (error) {
      console.error(
        "Erro ao salvar afastamento:",
        error
      );

      alert(
        error instanceof Error
          ? error.message
          : "Não foi possível salvar o registro."
      );
    } finally {
      setSalvando(false);
    }
  }

  return (
    <ProtecaoModulo modulo="ferias_licencas">
      <div className="space-y-6 p-4 pb-24 md:p-6">
        <SigPageHeader
          titulo="Nova Férias ou Licença"
          subtitulo="Registre férias, licenças, afastamentos, cursos e outras indisponibilidades funcionais."
          icone={CalendarDays}
        />

        <SigCard>
          <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="label">
                  Guarda
                </label>

                <select
                  className="input"
                  value={guardaId}
                  disabled={
                    carregando ||
                    salvando
                  }
                  onChange={(event) =>
                    setGuardaId(
                      event.target.value
                    )
                  }
                >
                  <option value="">
                    {carregando
                      ? "Carregando guardas..."
                      : "Selecione o guarda"}
                  </option>

                  {guardas.map(
                    (guarda) => (
                      <option
                        key={
                          guarda.id
                        }
                        value={
                          guarda.id
                        }
                      >
                        {guarda.nome} •{" "}
                        {guarda.matricula ||
                          "S/M"}{" "}
                        •{" "}
                        {guarda.situacao_funcional ||
                          "NÃO INFORMADO"}
                      </option>
                    )
                  )}
                </select>
              </div>

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
                  {tiposAfastamento.map(
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
            </div>

            {guardaSelecionado && (
              <div className="rounded-2xl border border-cyan-500/20 bg-cyan-500/5 p-4">
                <p className="font-black text-white">
                  {
                    guardaSelecionado.nome
                  }
                </p>

                <p className="mt-1 text-sm text-slate-400">
                  Matrícula:{" "}
                  {guardaSelecionado.matricula ||
                    "Não informada"}
                </p>

                <p className="mt-1 text-sm text-cyan-300">
                  Situação atual:{" "}
                  {guardaSelecionado.situacao_funcional ||
                    "Não informada"}
                </p>
              </div>
            )}

            <div>
              <label className="label">
                Motivo
              </label>

              <input
                className="input"
                value={motivo}
                disabled={salvando}
                placeholder="Ex.: férias regulamentares, licença médica, curso de formação..."
                onChange={(event) =>
                  setMotivo(
                    event.target.value
                  )
                }
              />
            </div>

            <div>
              <label className="label">
                Observações
              </label>

              <textarea
                className="input min-h-32 resize-none"
                placeholder="Informações complementares, número do processo, documento ou autorização..."
                value={observacao}
                disabled={salvando}
                onChange={(event) =>
                  setObservacao(
                    event.target.value
                  )
                }
              />
            </div>

            <label className="flex items-start gap-3 rounded-2xl border border-yellow-500/20 bg-yellow-500/5 p-4">
              <input
                type="checkbox"
                className="mt-1"
                checked={
                  permiteExtraApoio
                }
                disabled={salvando}
                onChange={(event) =>
                  setPermiteExtraApoio(
                    event.target.checked
                  )
                }
              />

              <span>
                <strong className="block text-yellow-300">
                  Permitir serviço EXTRA ou APOIO
                </strong>

                <span className="mt-1 block text-sm text-slate-400">
                  O serviço regular continuará bloqueado. Use somente quando houver autorização formal.
                </span>
              </span>
            </label>

            <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4 text-sm text-slate-300">
              Ao salvar, o registro será incluído automaticamente no dossiê funcional e utilizado pelo Motor do RH para validar escalas, guarnições, cautelas de armamento, motoristas e patrulhamentos.
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={() =>
                  void salvar()
                }
                disabled={
                  salvando ||
                  carregando
                }
                className="btn-primary inline-flex items-center justify-center gap-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Save size={18} />

                {salvando
                  ? "Salvando..."
                  : "Salvar registro"}
              </button>

              <button
                type="button"
                disabled={salvando}
                onClick={() =>
                  router.push(
                    "/sistema/ferias-licencas"
                  )
                }
                className="btn-secondary"
              >
                Cancelar
              </button>
            </div>
          </div>
        </SigCard>
      </div>
    </ProtecaoModulo>
  );
}