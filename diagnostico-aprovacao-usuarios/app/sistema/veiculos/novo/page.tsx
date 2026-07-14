"use client";

import {
  useEffect,
  useState,
} from "react";
import {
  CarFront,
  Network,
  Save,
  XCircle,
} from "lucide-react";
import {
  useRouter,
} from "next/navigation";

import AlertaIntermunicipalVeiculo, {
  type AlertaIntermunicipalVeiculoDados,
} from "@/components/veiculos/AlertaIntermunicipalVeiculo";
import ProtecaoModulo from "@/components/ProtecaoModulo";
import SigCard from "@/components/sig/SigCard";
import SigPageHeader from "@/components/sig/SigPageHeader";
import {
  CORES_VEICULO,
} from "@/lib/bases/cores";
import {
  VEICULOS_POR_TIPO,
} from "@/lib/bases/veiculosPorTipo";
import {
  montarUrlComMunicipioContexto,
  obterMunicipioIdEfetivo,
} from "@/lib/contextoMunicipio";
import {
  supabase,
} from "@/lib/supabase";

type UsuarioLocal = {
  id?: number | string;
  nome?: string;
  perfil?: string;
  municipio_id?: number;
};

type RespostaAbordagem = {
  ok?: boolean;
  erro?: string;
  exige_confirmacao?: boolean;
  alerta?: boolean;
  placa?: string;
  total_registros?: number;
  total_municipios?: number;
  ultimo_registro?: AlertaIntermunicipalVeiculoDados["ultimo_registro"];
  registros?: AlertaIntermunicipalVeiculoDados["registros"];
};

const MOTIVOS_ABORDAGEM = [
  "AVERIGUAÇÃO DE ROTINA",
  "ATITUDE SUSPEITA",
  "FISCALIZAÇÃO DE TRÂNSITO",
  "APOIO EM OCORRÊNCIA",
  "FUGA DE ABORDAGEM",
  "POSSÍVEL ADULTERAÇÃO",
  "ENVOLVIMENTO EM CRIME",
  "VEÍCULO ABANDONADO",
  "OUTRO",
];

const DESFECHOS = [
  "LIBERADO APÓS AVERIGUAÇÃO",
  "CONDUTOR ORIENTADO",
  "ENCAMINHADO À DELEGACIA",
  "VEÍCULO APREENDIDO",
  "VEÍCULO RECUPERADO",
  "AGUARDANDO PROVIDÊNCIAS",
  "OUTRO",
];

function mascaraPlaca(
  valor: string
) {
  return valor
    .toUpperCase()
    .replace(
      /[^A-Z0-9]/g,
      ""
    )
    .slice(0, 7);
}

function placaBrasileiraValida(
  valor: string
) {
  const placa =
    mascaraPlaca(valor);

  return /^[A-Z]{3}[0-9][A-Z0-9][0-9]{2}$/.test(
    placa
  );
}

function somenteNumeros(
  valor: string,
  limite = 20
) {
  return valor
    .replace(/\D/g, "")
    .slice(0, limite);
}

function mascaraCPF(
  valor: string
) {
  return valor
    .replace(/\D/g, "")
    .slice(0, 11)
    .replace(
      /^(\d{3})(\d)/,
      "$1.$2"
    )
    .replace(
      /^(\d{3})\.(\d{3})(\d)/,
      "$1.$2.$3"
    )
    .replace(
      /\.(\d{3})(\d)/,
      ".$1-$2"
    );
}

function lerUsuarioLocal():
  | UsuarioLocal
  | null {
  if (
    typeof window ===
    "undefined"
  ) {
    return null;
  }

  try {
    const salvo =
      localStorage.getItem(
        "usuarioLogado"
      );

    if (!salvo) {
      return null;
    }

    const usuario =
      JSON.parse(
        salvo
      ) as UsuarioLocal;

    const municipioId =
      obterMunicipioIdEfetivo({
        perfil:
          usuario.perfil,
        municipioIdUsuario:
          usuario.municipio_id,
      });

    return {
      ...usuario,
      municipio_id:
        municipioId ||
        undefined,
    };
  } catch {
    return null;
  }
}

function montarAlerta(
  retorno:
    RespostaAbordagem
): AlertaIntermunicipalVeiculoDados {
  return {
    alerta:
      Boolean(
        retorno.alerta
      ),
    placa:
      retorno.placa,
    total_registros:
      Number(
        retorno.total_registros ||
        0
      ),
    total_municipios:
      Number(
        retorno.total_municipios ||
        0
      ),
    ultimo_registro:
      retorno.ultimo_registro ||
      null,
    registros:
      Array.isArray(
        retorno.registros
      )
        ? retorno.registros
        : [],
  };
}

export default function NovoVeiculoPage() {
  const router =
    useRouter();

  const [usuario] =
    useState<UsuarioLocal | null>(
      () =>
        lerUsuarioLocal()
    );

  const [
    tipoEspecie,
    setTipoEspecie,
  ] = useState("");

  const [
    placa,
    setPlaca,
  ] = useState("");

  const [
    marca,
    setMarca,
  ] = useState("");

  const [
    modelo,
    setModelo,
  ] = useState("");

  const [
    modeloManual,
    setModeloManual,
  ] = useState("");

  const [
    cor,
    setCor,
  ] = useState("");

  const [
    ano,
    setAno,
  ] = useState("");

  const [
    renavam,
    setRenavam,
  ] = useState("");

  const [
    chassi,
    setChassi,
  ] = useState("");

  const [
    proprietario,
    setProprietario,
  ] = useState("");

  const [
    cpfProprietario,
    setCpfProprietario,
  ] = useState("");

  const [
    condutor,
    setCondutor,
  ] = useState("");

  const [
    documentoCondutor,
    setDocumentoCondutor,
  ] = useState("");

  const [
    situacao,
    setSituacao,
  ] =
    useState("ABORDADO");

  const [
    localAbordagem,
    setLocalAbordagem,
  ] = useState("");

  const [
    motivoAbordagem,
    setMotivoAbordagem,
  ] = useState("");

  const [
    motivoOutro,
    setMotivoOutro,
  ] = useState("");

  const [
    desfecho,
    setDesfecho,
  ] =
    useState(
      "LIBERADO APÓS AVERIGUAÇÃO"
    );

  const [
    desfechoOutro,
    setDesfechoOutro,
  ] = useState("");

  const [
    nivelAlerta,
    setNivelAlerta,
  ] =
    useState(
      "INFORMATIVO"
    );

  const [
    compartilharRede,
    setCompartilharRede,
  ] = useState(true);

  const [
    observacoes,
    setObservacoes,
  ] = useState("");

  const [
    salvando,
    setSalvando,
  ] = useState(false);

  const [
    consultandoAlerta,
    setConsultandoAlerta,
  ] = useState(false);

  const [
    alertaIntermunicipal,
    setAlertaIntermunicipal,
  ] =
    useState<AlertaIntermunicipalVeiculoDados | null>(
      null
    );

  const [
    alertaConfirmado,
    setAlertaConfirmado,
  ] = useState(false);

  function urlContextual(
    caminho: string
  ) {
    return montarUrlComMunicipioContexto({
      url: caminho,
      perfil:
        usuario?.perfil,
      municipioIdUsuario:
        usuario?.municipio_id,
    });
  }

  async function obterToken() {
    const {
      data: { session },
      error,
    } =
      await supabase.auth.getSession();

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

  async function consultarAlerta(
    placaInformada = placa
  ) {
    const placaNormalizada =
      mascaraPlaca(
        placaInformada
      );

    if (
      !placaBrasileiraValida(
        placaNormalizada
      )
    ) {
      setAlertaIntermunicipal(
        null
      );
      setAlertaConfirmado(
        false
      );
      return;
    }

    setConsultandoAlerta(
      true
    );
    setAlertaConfirmado(
      false
    );

    try {
      const token =
        await obterToken();

      const parametros =
        new URLSearchParams({
          placa:
            placaNormalizada,
        });

      const resposta =
        await fetch(
          urlContextual(
            `/api/veiculos/abordagens?${parametros.toString()}`
          ),
          {
            method: "GET",
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
          .catch(
            () => ({})
          )) as
          RespostaAbordagem;

      if (
        resposta.status === 422 &&
        retorno.erro ===
          "Informe uma placa válida."
      ) {
        setAlertaIntermunicipal(
          null
        );
        return;
      }

      if (
        !resposta.ok ||
        !retorno.ok
      ) {
        throw new Error(
          retorno.erro ||
          "Não foi possível consultar a rede de veículos."
        );
      }

      setAlertaIntermunicipal(
        montarAlerta(
          retorno
        )
      );
    } catch (error) {
      console.error(
        "Erro ao consultar alerta intermunicipal:",
        {
          message:
            error instanceof Error
              ? error.message
              : "Erro desconhecido",
        }
      );

      setAlertaIntermunicipal(
        null
      );

      alert(
        error instanceof Error
          ? error.message
          : "Erro ao consultar a rede de veículos."
      );
    } finally {
      setConsultandoAlerta(
        false
      );
    }
  }

  useEffect(() => {
    if (
      !placaBrasileiraValida(
        placa
      )
    ) {
      setAlertaIntermunicipal(
        null
      );
      setAlertaConfirmado(
        false
      );
      return;
    }

    const timer =
      window.setTimeout(
        () => {
          void consultarAlerta(
            placa
          );
        },
        500
      );

    return () =>
      window.clearTimeout(
        timer
      );
  }, [placa]);

  async function salvar() {
    const motivoFinal =
      motivoAbordagem ===
      "OUTRO"
        ? motivoOutro.trim()
        : motivoAbordagem;

    const desfechoFinal =
      desfecho === "OUTRO"
        ? desfechoOutro.trim()
        : desfecho;

    if (
      placa.length !== 7
    ) {
      alert(
        "Informe uma placa válida."
      );
      return;
    }

    if (
      !localAbordagem.trim()
    ) {
      alert(
        "Informe o local da abordagem."
      );
      return;
    }

    if (!motivoFinal) {
      alert(
        "Informe o motivo da abordagem."
      );
      return;
    }

    if (
      alertaIntermunicipal
        ?.alerta &&
      !alertaConfirmado
    ) {
      alert(
        "Confirme que tomou ciência do alerta intermunicipal."
      );
      return;
    }

    setSalvando(true);

    try {
      const token =
        await obterToken();

      const resposta =
        await fetch(
          urlContextual(
            "/api/veiculos/abordagens"
          ),
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json",
              Authorization:
                `Bearer ${token}`,
            },
            cache: "no-store",
            body:
              JSON.stringify({
                placa,
                tipo_especie:
                  tipoEspecie,
                marca,
                modelo:
                  modelo ===
                  "OUTRO"
                    ? modeloManual
                    : modelo,
                cor,
                ano,
                renavam,
                chassi,
                proprietario,
                cpf_proprietario:
                  cpfProprietario,
                condutor,
                documento_condutor:
                  documentoCondutor,
                situacao,
                local:
                  localAbordagem,
                motivo_abordagem:
                  motivoFinal,
                desfecho:
                  desfechoFinal,
                nivel_alerta:
                  nivelAlerta,
                compartilhar_rede:
                  compartilharRede,
                observacao:
                  observacoes,
                alerta_confirmado:
                  alertaConfirmado,
              }),
          }
        );

      const retorno =
        (await resposta
          .json()
          .catch(
            () => ({})
          )) as
          RespostaAbordagem;

      if (
        resposta.status ===
          409 &&
        retorno.exige_confirmacao
      ) {
        setAlertaIntermunicipal(
          montarAlerta(
            retorno
          )
        );

        setAlertaConfirmado(
          false
        );

        alert(
          retorno.erro ||
          "Existe alerta intermunicipal para esta placa."
        );

        return;
      }

      if (
        !resposta.ok ||
        !retorno.ok
      ) {
        throw new Error(
          retorno.erro ||
          "Não foi possível registrar a abordagem."
        );
      }

      alert(
        "Abordagem do veículo registrada com sucesso."
      );

      router.push(
        "/sistema/veiculos"
      );

      router.refresh();
    } catch (error) {
      console.error(
        "Erro ao registrar abordagem:",
        {
          message:
            error instanceof Error
              ? error.message
              : "Erro desconhecido",
        }
      );

      alert(
        error instanceof Error
          ? error.message
          : "Erro ao registrar abordagem."
      );
    } finally {
      setSalvando(false);
    }
  }

  return (
    <ProtecaoModulo modulo="veiculos_abordados">
      <main className="space-y-6 p-4 pb-24 md:p-6">
        <SigPageHeader
          titulo="Nova Abordagem de Veículo"
          subtitulo="Registre o veículo e consulte automaticamente alertas de outros municípios da rede SIG-GCM Brasil."
          icone={CarFront}
        />

        <SigCard>
          <div className="mb-5 flex items-start gap-4 rounded-2xl border border-cyan-500/30 bg-cyan-500/10 p-4">
            <Network className="mt-1 h-8 w-8 shrink-0 text-cyan-400" />

            <div>
              <h2 className="text-lg font-black text-white">
                Consulta Intermunicipal Automática
              </h2>

              <p className="mt-1 text-sm text-slate-300">
                Ao informar uma placa válida, o sistema consulta registros resumidos de outros municípios. Dados pessoais, fotos e narrativas completas não são compartilhados.
              </p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="label">
                Placa *
              </label>

              <div className="flex gap-2">
                <input
                  className="input uppercase"
                  value={placa}
                  onChange={(evento) =>
                    setPlaca(
                      mascaraPlaca(
                        evento.target
                          .value
                      )
                    )
                  }
                  placeholder="ABC1D23"
                />

                <button
                  type="button"
                  onClick={() =>
                    void consultarAlerta()
                  }
                  disabled={
                    !placaBrasileiraValida(
                      placa
                    ) ||
                    consultandoAlerta
                  }
                  className="rounded-xl border border-cyan-500/40 bg-cyan-500/10 px-4 font-black text-cyan-300 disabled:opacity-50"
                >
                  Consultar
                </button>
              </div>
            </div>

            <div>
              <label className="label">
                Situação
              </label>

              <select
                className="input"
                value={situacao}
                onChange={(evento) =>
                  setSituacao(
                    evento.target
                      .value
                  )
                }
              >
                <option value="ABORDADO">
                  Abordado
                </option>

                <option value="ACIDENTE">
                  Acidente
                </option>

                <option value="APREENDIDO">
                  Apreendido
                </option>

                <option value="RECUPERADO">
                  Recuperado
                </option>

                <option value="ABANDONADO">
                  Abandonado
                </option>

                <option value="FURTO_ROUBO">
                  Furto/Roubo
                </option>
              </select>
            </div>

            <div className="md:col-span-2">
              <AlertaIntermunicipalVeiculo
                alerta={
                  alertaIntermunicipal
                }
                carregando={
                  consultandoAlerta
                }
                exigirConfirmacao
                confirmado={
                  alertaConfirmado
                }
                onConfirmar={
                  setAlertaConfirmado
                }
              />
            </div>

            <div>
              <label className="label">
                Motivo da abordagem *
              </label>

              <select
                className="input"
                value={
                  motivoAbordagem
                }
                onChange={(evento) =>
                  setMotivoAbordagem(
                    evento.target
                      .value
                  )
                }
              >
                <option value="">
                  Selecione
                </option>

                {MOTIVOS_ABORDAGEM.map(
                  (motivo) => (
                    <option
                      key={motivo}
                      value={motivo}
                    >
                      {motivo}
                    </option>
                  )
                )}
              </select>
            </div>

            <div>
              <label className="label">
                Desfecho
              </label>

              <select
                className="input"
                value={desfecho}
                onChange={(evento) =>
                  setDesfecho(
                    evento.target
                      .value
                  )
                }
              >
                {DESFECHOS.map(
                  (item) => (
                    <option
                      key={item}
                      value={item}
                    >
                      {item}
                    </option>
                  )
                )}
              </select>
            </div>

            {motivoAbordagem ===
            "OUTRO" ? (
              <div>
                <label className="label">
                  Informe o motivo *
                </label>

                <input
                  className="input"
                  value={
                    motivoOutro
                  }
                  onChange={(evento) =>
                    setMotivoOutro(
                      evento.target
                        .value
                    )
                  }
                  placeholder="Descreva resumidamente"
                />
              </div>
            ) : null}

            {desfecho ===
            "OUTRO" ? (
              <div>
                <label className="label">
                  Informe o desfecho
                </label>

                <input
                  className="input"
                  value={
                    desfechoOutro
                  }
                  onChange={(evento) =>
                    setDesfechoOutro(
                      evento.target
                        .value
                    )
                  }
                  placeholder="Descreva resumidamente"
                />
              </div>
            ) : null}

            <div>
              <label className="label">
                Nível do alerta
              </label>

              <select
                className="input"
                value={
                  nivelAlerta
                }
                onChange={(evento) =>
                  setNivelAlerta(
                    evento.target
                      .value
                  )
                }
              >
                <option value="INFORMATIVO">
                  Informativo
                </option>

                <option value="ATENCAO">
                  Atenção
                </option>

                <option value="ALTO_RISCO">
                  Alto risco
                </option>
              </select>
            </div>

            <div>
              <label className="label">
                Local da abordagem *
              </label>

              <input
                className="input"
                value={
                  localAbordagem
                }
                onChange={(evento) =>
                  setLocalAbordagem(
                    evento.target
                      .value
                  )
                }
                placeholder="Ex.: Avenida Principal, Centro"
              />
            </div>

            <div>
              <label className="label">
                Tipo / Espécie
              </label>

              <select
                className="input"
                value={
                  tipoEspecie
                }
                onChange={(evento) => {
                  setTipoEspecie(
                    evento.target
                      .value
                  );

                  setMarca("");
                  setModelo("");
                  setModeloManual("");
                }}
              >
                <option value="">
                  Selecione
                </option>

                {Object.keys(
                  VEICULOS_POR_TIPO
                ).map((tipo) => (
                  <option
                    key={tipo}
                    value={tipo}
                  >
                    {tipo}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="label">
                Marca
              </label>

              <select
                className="input"
                value={marca}
                disabled={
                  !tipoEspecie
                }
                onChange={(evento) => {
                  setMarca(
                    evento.target
                      .value
                  );

                  setModelo("");
                  setModeloManual("");
                }}
              >
                <option value="">
                  Selecione
                </option>

                {Object.keys(
                  VEICULOS_POR_TIPO[
                    tipoEspecie
                  ] || {}
                ).map((item) => (
                  <option
                    key={item}
                    value={item}
                  >
                    {item}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="label">
                Modelo
              </label>

              <select
                className="input"
                value={modelo}
                disabled={
                  !tipoEspecie ||
                  !marca
                }
                onChange={(evento) => {
                  setModelo(
                    evento.target
                      .value
                  );

                  if (
                    evento.target
                      .value !==
                    "OUTRO"
                  ) {
                    setModeloManual("");
                  }
                }}
              >
                <option value="">
                  Selecione
                </option>

                {(
                  VEICULOS_POR_TIPO[
                    tipoEspecie
                  ]?.[marca] || []
                ).map((item) => (
                  <option
                    key={item}
                    value={item}
                  >
                    {item}
                  </option>
                ))}

                <option value="OUTRO">
                  Outro
                </option>
              </select>
            </div>

            {modelo ===
            "OUTRO" ? (
              <div>
                <label className="label">
                  Modelo manual
                </label>

                <input
                  className="input"
                  value={
                    modeloManual
                  }
                  onChange={(evento) =>
                    setModeloManual(
                      evento.target
                        .value
                    )
                  }
                  placeholder="Digite o modelo"
                />
              </div>
            ) : null}

            <div>
              <label className="label">
                Cor
              </label>

              <select
                className="input"
                value={cor}
                onChange={(evento) =>
                  setCor(
                    evento.target
                      .value
                  )
                }
              >
                <option value="">
                  Selecione
                </option>

                {CORES_VEICULO.map(
                  (item) => (
                    <option
                      key={item}
                      value={item}
                    >
                      {item}
                    </option>
                  )
                )}
              </select>
            </div>

            <div>
              <label className="label">
                Ano
              </label>

              <input
                className="input"
                value={ano}
                onChange={(evento) =>
                  setAno(
                    somenteNumeros(
                      evento.target
                        .value,
                      4
                    )
                  )
                }
                placeholder="2020"
              />
            </div>

            <div>
              <label className="label">
                RENAVAM
              </label>

              <input
                className="input"
                value={renavam}
                onChange={(evento) =>
                  setRenavam(
                    somenteNumeros(
                      evento.target
                        .value,
                      11
                    )
                  )
                }
                placeholder="Somente números"
              />
            </div>

            <div>
              <label className="label">
                Chassi
              </label>

              <input
                className="input uppercase"
                value={chassi}
                onChange={(evento) =>
                  setChassi(
                    evento.target
                      .value
                      .toUpperCase()
                      .replace(
                        /[^A-Z0-9]/g,
                        ""
                      )
                      .slice(0, 17)
                  )
                }
                placeholder="Número do chassi"
              />
            </div>

            <div>
              <label className="label">
                Proprietário
              </label>

              <input
                className="input"
                value={proprietario}
                onChange={(evento) =>
                  setProprietario(
                    evento.target
                      .value
                  )
                }
                placeholder="Nome do proprietário"
              />
            </div>

            <div>
              <label className="label">
                CPF do proprietário
              </label>

              <input
                className="input"
                value={
                  cpfProprietario
                }
                onChange={(evento) =>
                  setCpfProprietario(
                    mascaraCPF(
                      evento.target
                        .value
                    )
                  )
                }
                placeholder="000.000.000-00"
              />
            </div>

            <div>
              <label className="label">
                Condutor
              </label>

              <input
                className="input"
                value={condutor}
                onChange={(evento) =>
                  setCondutor(
                    evento.target
                      .value
                  )
                }
                placeholder="Nome do condutor"
              />
            </div>

            <div>
              <label className="label">
                Documento do condutor
              </label>

              <input
                className="input"
                value={
                  documentoCondutor
                }
                onChange={(evento) =>
                  setDocumentoCondutor(
                    evento.target
                      .value
                  )
                }
                placeholder="CPF, RG ou CNH"
              />
            </div>

            <div className="md:col-span-2">
              <label className="label">
                Observações internas
              </label>

              <textarea
                className="input min-h-32 resize-none"
                value={
                  observacoes
                }
                onChange={(evento) =>
                  setObservacoes(
                    evento.target
                      .value
                  )
                }
                placeholder="Estas observações não serão exibidas no alerta resumido."
              />
            </div>

            <label className="md:col-span-2 flex cursor-pointer items-start gap-3 rounded-2xl border border-slate-700 bg-slate-950/50 p-4">
              <input
                type="checkbox"
                checked={
                  compartilharRede
                }
                onChange={(evento) =>
                  setCompartilharRede(
                    evento.target
                      .checked
                  )
                }
                className="mt-1 h-5 w-5"
              />

              <span>
                <strong className="block text-white">
                  Compartilhar alerta resumido com a rede SIG-GCM Brasil
                </strong>

                <span className="mt-1 block text-sm text-slate-400">
                  Compartilha somente município, data, motivo, desfecho e nível do alerta. Dados pessoais e observações internas permanecem restritos.
                </span>
              </span>
            </label>
          </div>

          <div className="mt-6 flex flex-col gap-3 md:flex-row">
            <button
              type="button"
              onClick={salvar}
              disabled={
                salvando
              }
              className="btn-primary inline-flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Save className="h-5 w-5" />

              {salvando
                ? "Salvando..."
                : "Registrar Abordagem"}
            </button>

            <button
              type="button"
              onClick={() =>
                router.push(
                  "/sistema/central-veiculos"
                )
              }
              className="btn-secondary inline-flex items-center justify-center gap-2"
            >
              <XCircle className="h-5 w-5" />

              Cancelar
            </button>
          </div>
        </SigCard>
      </main>
    </ProtecaoModulo>
  );
}
