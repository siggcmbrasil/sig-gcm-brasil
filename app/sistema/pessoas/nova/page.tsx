"use client";

import {
  useEffect,
  useState,
} from "react";
import {
  useRouter,
} from "next/navigation";
import {
  Save,
  UserPlus,
  XCircle,
} from "lucide-react";

import AlertaIntermunicipalPessoa, {
  type AlertaIntermunicipalPessoaDados,
} from "@/components/pessoas/AlertaIntermunicipalPessoa";
import SigCard from "@/components/sig/SigCard";
import SigPageHeader from "@/components/sig/SigPageHeader";
import {
  montarUrlComMunicipioContexto,
  obterMunicipioIdEfetivo,
} from "@/lib/contextoMunicipio";
import { supabase } from "@/lib/supabase";

type UsuarioLogado = {
  id: string;
  nome?: string;
  perfil: string;
  municipio_id?: number;
};

type RespostaAlerta = {
  ok?: boolean;
  erro?: string;
  exige_confirmacao?: boolean;
  alerta?: boolean;
  tipo_documento?: string;
  total_registros?: number;
  total_municipios?: number;
  ultimo_registro?:
    AlertaIntermunicipalPessoaDados["ultimo_registro"];
  registros?:
    AlertaIntermunicipalPessoaDados["registros"];
};

function obterUsuarioLogado():
  | UsuarioLogado
  | null {
  try {
    const salvo =
      localStorage.getItem(
        "usuarioLogado"
      );

    if (!salvo) {
      return null;
    }

    const usuario =
      JSON.parse(salvo);

    if (
      !usuario?.id ||
      !usuario?.perfil
    ) {
      return null;
    }

    const municipioId =
      obterMunicipioIdEfetivo({
        perfil:
          usuario.perfil,
        municipioIdUsuario:
          usuario.municipio_id,
      });

    return {
      id:
        String(
          usuario.id
        ),
      nome:
        String(
          usuario.nome || ""
        ),
      perfil:
        String(
          usuario.perfil
        ).toUpperCase(),
      municipio_id:
        municipioId ||
        undefined,
    };
  } catch {
    return null;
  }
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

function mascaraTelefone(
  valor: string
) {
  const numeros =
    valor
      .replace(/\D/g, "")
      .slice(0, 11);

  if (
    numeros.length <= 10
  ) {
    return numeros
      .replace(
        /^(\d{2})(\d)/,
        "($1) $2"
      )
      .replace(
        /(\d{4})(\d)/,
        "$1-$2"
      );
  }

  return numeros
    .replace(
      /^(\d{2})(\d)/,
      "($1) $2"
    )
    .replace(
      /(\d{5})(\d)/,
      "$1-$2"
    );
}

function normalizarDocumento(
  valor: string
) {
  return valor
    .trim()
    .toUpperCase()
    .replace(
      /[^A-Z0-9]/g,
      ""
    );
}

function documentoValido(
  tipo: string,
  documento: string
) {
  const normalizado =
    normalizarDocumento(
      documento
    );

  if (
    tipo === "CPF" ||
    tipo === "CNH"
  ) {
    return normalizado.length ===
      11;
  }

  if (
    tipo === "RG"
  ) {
    return normalizado.length >=
      5;
  }

  return normalizado.length >=
    5;
}

function converterAlerta(
  retorno: RespostaAlerta
): AlertaIntermunicipalPessoaDados {
  return {
    alerta:
      Boolean(
        retorno.alerta
      ),
    tipo_documento:
      retorno.tipo_documento,
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

export default function NovaPessoaPage() {
  const router =
    useRouter();

  const [usuario] =
    useState<UsuarioLogado | null>(
      () =>
        obterUsuarioLogado()
    );

  const [
    nome,
    setNome,
  ] = useState("");

  const [
    tipoDocumento,
    setTipoDocumento,
  ] = useState("CPF");

  const [
    documento,
    setDocumento,
  ] = useState("");

  const [
    dataNascimento,
    setDataNascimento,
  ] = useState("");

  const [
    telefone,
    setTelefone,
  ] = useState("");

  const [
    endereco,
    setEndereco,
  ] = useState("");

  const [
    local,
    setLocal,
  ] = useState("");

  const [
    profissao,
    setProfissao,
  ] = useState("");

  const [
    motivoAbordagem,
    setMotivoAbordagem,
  ] = useState("");

  const [
    desfecho,
    setDesfecho,
  ] = useState("");

  const [
    nivelAlerta,
    setNivelAlerta,
  ] =
    useState("INFORMATIVO");

  const [
    compartilharRede,
    setCompartilharRede,
  ] = useState(true);

  const [
    observacao,
    setObservacao,
  ] = useState("");

  const [
    alerta,
    setAlerta,
  ] =
    useState<AlertaIntermunicipalPessoaDados | null>(
      null
    );

  const [
    consultandoAlerta,
    setConsultandoAlerta,
  ] = useState(false);

  const [
    alertaConfirmado,
    setAlertaConfirmado,
  ] = useState(false);

  const [
    salvando,
    setSalvando,
  ] = useState(false);

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

  async function consultarAlerta() {
    if (
      !usuario?.perfil ||
      !documentoValido(
        tipoDocumento,
        documento
      )
    ) {
      setAlerta(null);
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
          tipo_documento:
            tipoDocumento,
          documento:
            normalizarDocumento(
              documento
            ),
        });

      const resposta =
        await fetch(
          urlContextual(
            `/api/pessoas/abordagens?${parametros.toString()}`
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
          .catch(() => ({}))) as
          RespostaAlerta;

      if (
        !resposta.ok ||
        !retorno.ok
      ) {
        throw new Error(
          retorno.erro ||
          "Não foi possível consultar o alerta intermunicipal."
        );
      }

      setAlerta(
        converterAlerta(
          retorno
        )
      );
    } catch (error) {
      console.error(
        "Erro ao consultar alerta intermunicipal da pessoa:",
        error
      );

      setAlerta(null);

      alert(
        error instanceof Error
          ? error.message
          : "Erro ao consultar a rede."
      );
    } finally {
      setConsultandoAlerta(
        false
      );
    }
  }

  useEffect(() => {
    if (
      !documentoValido(
        tipoDocumento,
        documento
      )
    ) {
      setAlerta(null);
      setAlertaConfirmado(
        false
      );
      return;
    }

    const timer =
      window.setTimeout(
        () => {
          void consultarAlerta();
        },
        650
      );

    return () =>
      window.clearTimeout(
        timer
      );
  }, [
    documento,
    tipoDocumento,
  ]);

  async function salvar() {
    if (!usuario) {
      alert(
        "Sessão inválida."
      );
      return;
    }

    if (
      !nome.trim() ||
      nome.trim().length < 3
    ) {
      alert(
        "Informe o nome completo."
      );
      return;
    }

    if (
      !local.trim()
    ) {
      alert(
        "Informe o local da abordagem."
      );
      return;
    }

    if (
      !motivoAbordagem.trim()
    ) {
      alert(
        "Informe o motivo da abordagem."
      );
      return;
    }

    if (
      documento.trim() &&
      !documentoValido(
        tipoDocumento,
        documento
      )
    ) {
      alert(
        "Informe um documento válido."
      );
      return;
    }

    if (
      alerta?.alerta &&
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
            "/api/pessoas/abordagens"
          ),
          {
            method: "POST",
            headers: {
              Authorization:
                `Bearer ${token}`,
              "Content-Type":
                "application/json",
            },
            cache: "no-store",
            body: JSON.stringify({
              nome:
                nome.trim(),
              tipo_documento:
                documento.trim()
                  ? tipoDocumento
                  : null,
              documento:
                documento.trim() ||
                null,
              data_nascimento:
                dataNascimento ||
                null,
              telefone:
                telefone.trim() ||
                null,
              endereco:
                endereco.trim() ||
                null,
              local:
                local.trim(),
              profissao:
                profissao.trim() ||
                null,
              motivo_abordagem:
                motivoAbordagem.trim(),
              desfecho:
                desfecho.trim() ||
                "NÃO INFORMADO",
              nivel_alerta:
                nivelAlerta,
              compartilhar_rede:
                compartilharRede,
              observacao:
                observacao.trim() ||
                null,
              alerta_confirmado:
                alerta?.alerta
                  ? alertaConfirmado
                  : true,
            }),
          }
        );

      const retorno =
        (await resposta
          .json()
          .catch(() => ({}))) as
          RespostaAlerta & {
            registro?: {
              id: number;
            };
          };

      if (
        resposta.status ===
          409 &&
        retorno
          .exige_confirmacao
      ) {
        setAlerta(
          converterAlerta(
            retorno
          )
        );

        setAlertaConfirmado(
          false
        );

        throw new Error(
          retorno.erro ||
          "Confirme o alerta antes de salvar."
        );
      }

      if (
        !resposta.ok ||
        !retorno.ok
      ) {
        throw new Error(
          retorno.erro ||
          "Não foi possível cadastrar a pessoa."
        );
      }

      alert(
        "Pessoa cadastrada com sucesso."
      );

      router.push(
        "/sistema/pessoas"
      );
    } catch (error) {
      console.error(
        "Erro ao cadastrar pessoa:",
        error
      );

      alert(
        error instanceof Error
          ? error.message
          : "Erro ao cadastrar pessoa."
      );
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className="space-y-6 p-4 pb-24 md:p-6">
      <SigPageHeader
        titulo="Nova Pessoa Abordada"
        subtitulo="Cadastro operacional com consulta segura à rede intermunicipal."
        icone={UserPlus}
      />

      <SigCard>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="md:col-span-2">
            <label className="label">
              Nome completo
            </label>

            <input
              className="input"
              value={nome}
              onChange={(evento) =>
                setNome(
                  evento.target.value
                )
              }
              placeholder="Digite o nome completo"
              maxLength={200}
            />
          </div>

          <div>
            <label className="label">
              Tipo de documento
            </label>

            <select
              className="input"
              value={tipoDocumento}
              onChange={(evento) => {
                setTipoDocumento(
                  evento.target.value
                );

                setDocumento("");
                setAlerta(null);
                setAlertaConfirmado(
                  false
                );
              }}
            >
              <option value="CPF">
                CPF
              </option>
              <option value="RG">
                RG
              </option>
              <option value="CNH">
                CNH
              </option>
              <option value="PASSAPORTE">
                Passaporte
              </option>
              <option value="OUTRO">
                Outro
              </option>
            </select>
          </div>

          <div>
            <label className="label">
              Documento
            </label>

            <input
              className="input uppercase"
              value={documento}
              onChange={(evento) =>
                setDocumento(
                  tipoDocumento ===
                  "CPF"
                    ? mascaraCPF(
                        evento.target
                          .value
                      )
                    : evento.target
                        .value
                        .toUpperCase()
                )
              }
              onBlur={() =>
                void consultarAlerta()
              }
              placeholder="Número do documento"
              maxLength={40}
            />
          </div>

          <div className="md:col-span-2">
            <AlertaIntermunicipalPessoa
              alerta={alerta}
              carregando={
                consultandoAlerta
              }
              exigirConfirmacao={
                Boolean(
                  alerta?.alerta
                )
              }
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
              Data de nascimento
            </label>

            <input
              className="input"
              type="date"
              value={
                dataNascimento
              }
              onChange={(evento) =>
                setDataNascimento(
                  evento.target.value
                )
              }
            />
          </div>

          <div>
            <label className="label">
              Telefone
            </label>

            <input
              className="input"
              value={telefone}
              onChange={(evento) =>
                setTelefone(
                  mascaraTelefone(
                    evento.target
                      .value
                  )
                )
              }
              placeholder="(00) 00000-0000"
              maxLength={20}
            />
          </div>

          <div>
            <label className="label">
              Local da abordagem
            </label>

            <input
              className="input"
              value={local}
              onChange={(evento) =>
                setLocal(
                  evento.target.value
                )
              }
              placeholder="Rua, bairro ou referência"
              maxLength={500}
            />
          </div>

          <div>
            <label className="label">
              Profissão
            </label>

            <input
              className="input"
              value={profissao}
              onChange={(evento) =>
                setProfissao(
                  evento.target.value
                )
              }
              placeholder="Profissão"
              maxLength={120}
            />
          </div>

          <div className="md:col-span-2">
            <label className="label">
              Endereço
            </label>

            <input
              className="input"
              value={endereco}
              onChange={(evento) =>
                setEndereco(
                  evento.target.value
                )
              }
              placeholder="Endereço informado"
              maxLength={500}
            />
          </div>

          <div>
            <label className="label">
              Motivo da abordagem
            </label>

            <input
              className="input"
              value={
                motivoAbordagem
              }
              onChange={(evento) =>
                setMotivoAbordagem(
                  evento.target.value
                )
              }
              placeholder="Ex.: atitude suspeita"
              maxLength={300}
            />
          </div>

          <div>
            <label className="label">
              Desfecho
            </label>

            <input
              className="input"
              value={desfecho}
              onChange={(evento) =>
                setDesfecho(
                  evento.target.value
                )
              }
              placeholder="Ex.: liberado após averiguação"
              maxLength={300}
            />
          </div>

          <div>
            <label className="label">
              Nível do alerta
            </label>

            <select
              className="input"
              value={nivelAlerta}
              onChange={(evento) =>
                setNivelAlerta(
                  evento.target.value
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
              <option value="RESTRITO">
                Restrito
              </option>
            </select>
          </div>

          <label className="flex items-start gap-3 rounded-2xl border border-slate-700 bg-slate-950/40 p-4">
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

            <span className="text-sm text-slate-300">
              Compartilhar com outros municípios somente o resumo operacional: município, data, motivo, desfecho e nível. Dados pessoais permanecem protegidos.
            </span>
          </label>

          <div className="md:col-span-2">
            <label className="label">
              Observação interna
            </label>

            <textarea
              className="input min-h-32 resize-none"
              value={observacao}
              onChange={(evento) =>
                setObservacao(
                  evento.target.value
                )
              }
              placeholder="Informações internas não compartilhadas na rede..."
              maxLength={5000}
            />
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-3 md:flex-row">
          <button
            type="button"
            onClick={salvar}
            disabled={
              salvando ||
              consultandoAlerta
            }
            className="btn-primary inline-flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <Save className="h-5 w-5" />

            {salvando
              ? "Salvando..."
              : "Salvar Pessoa"}
          </button>

          <button
            type="button"
            onClick={() =>
              router.push(
                "/sistema/pessoas"
              )
            }
            className="btn-secondary inline-flex items-center justify-center gap-2"
          >
            <XCircle className="h-5 w-5" />

            Cancelar
          </button>
        </div>
      </SigCard>
    </div>
  );
}
