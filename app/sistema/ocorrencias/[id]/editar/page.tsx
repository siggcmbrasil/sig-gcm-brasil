"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

import { supabase } from "@/lib/supabase";
import ProtecaoModulo from "@/components/ProtecaoModulo";

type OcorrenciaEdicao = {
  id: number;
  protocolo: string | null;
  tipo: string | null;
  status: string | null;
  bairro: string | null;
  local: string | null;
  numero: string | null;
  envolvidos: unknown;
  descricao: string | null;
};

type RespostaOcorrenciaApi = {
  ok?: boolean;
  erro?: string;
  mensagem?: string;
  ocorrencia?: OcorrenciaEdicao;
};

const STATUS_VALIDOS = [
  "Aberta",
  "Em andamento",
  "Finalizada",
  "Cancelada",
];

const ROTAS_RESERVADAS = [
  "nova",
  "expressa",
  "offline",
  "editar",
];

function normalizarEnvolvidos(valor: unknown) {
  if (valor === null || valor === undefined) {
    return "";
  }

  if (typeof valor === "string") {
    return valor;
  }

  try {
    return JSON.stringify(valor);
  } catch {
    return "";
  }
}

export default function EditarOcorrencia() {
  const router = useRouter();
  const params = useParams();

  const idParam =
    typeof params.id === "string"
      ? params.id
      : params.id?.[0];

  const id = Number(idParam);

  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [erroTela, setErroTela] = useState("");

  const [protocolo, setProtocolo] = useState("");
  const [tipo, setTipo] = useState("");
  const [status, setStatus] = useState("Aberta");
  const [bairro, setBairro] = useState("");
  const [local, setLocal] = useState("");
  const [numero, setNumero] = useState("");
  const [envolvidos, setEnvolvidos] = useState("");
  const [descricao, setDescricao] = useState("");

  useEffect(() => {
    void carregarOcorrencia();
  }, [idParam]);

  async function obterAccessToken() {
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession();

    if (error || !session?.access_token) {
      throw new Error(
        "Sua sessão expirou. Entre novamente no sistema."
      );
    }

    return session.access_token;
  }

  async function carregarOcorrencia() {
    setCarregando(true);
    setErroTela("");

    if (
      !idParam ||
      ROTAS_RESERVADAS.includes(idParam) ||
      !Number.isSafeInteger(id) ||
      id <= 0
    ) {
      router.replace("/sistema/ocorrencias");
      return;
    }

    try {
      const accessToken = await obterAccessToken();

      const resposta = await fetch(
        `/api/ocorrencias/${id}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
          cache: "no-store",
        }
      );

      const dados = (await resposta
        .json()
        .catch(() => null)) as RespostaOcorrenciaApi | null;

      if (!resposta.ok || !dados?.ok || !dados.ocorrencia) {
        if (resposta.status === 401) {
          localStorage.removeItem("usuarioLogado");
          router.replace("/login");
          return;
        }

        throw new Error(
          dados?.erro ||
            "Não foi possível carregar a ocorrência."
        );
      }

      const ocorrencia = dados.ocorrencia;

      setProtocolo(
        ocorrencia.protocolo || `ID ${ocorrencia.id}`
      );
      setTipo(ocorrencia.tipo || "");
      setStatus(ocorrencia.status || "Aberta");
      setBairro(ocorrencia.bairro || "");
      setLocal(ocorrencia.local || "");
      setNumero(ocorrencia.numero || "");
      setEnvolvidos(
        normalizarEnvolvidos(ocorrencia.envolvidos)
      );
      setDescricao(ocorrencia.descricao || "");
    } catch (error) {
      const mensagem =
        error instanceof Error
          ? error.message
          : "Erro ao carregar ocorrência.";

      console.error("Erro ao carregar ocorrência:", {
        mensagem,
        error,
      });

      setErroTela(mensagem);
    } finally {
      setCarregando(false);
    }
  }

  async function atualizarOcorrencia() {
    if (salvando) {
      return;
    }

    if (!tipo.trim() || !local.trim() || !descricao.trim()) {
      alert("Preencha tipo, local e descrição.");
      return;
    }

    setSalvando(true);
    setErroTela("");

    try {
      const accessToken = await obterAccessToken();

      const resposta = await fetch(
        `/api/ocorrencias/${id}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          cache: "no-store",
          body: JSON.stringify({
            tipo: tipo.trim(),
            status,
            bairro: bairro.trim(),
            local: local.trim(),
            numero: numero.trim(),
            envolvidos: envolvidos.trim(),
            descricao: descricao.trim(),
          }),
        }
      );

      const dados = (await resposta
        .json()
        .catch(() => null)) as RespostaOcorrenciaApi | null;

      if (!resposta.ok || !dados?.ok) {
        if (resposta.status === 401) {
          localStorage.removeItem("usuarioLogado");
          router.replace("/login");
          return;
        }

        throw new Error(
          dados?.erro ||
            "Não foi possível atualizar a ocorrência."
        );
      }

      alert(
        dados.mensagem ||
          "Ocorrência atualizada com sucesso."
      );

      router.push(`/sistema/ocorrencias/${id}`);
      router.refresh();
    } catch (error) {
      const mensagem =
        error instanceof Error
          ? error.message
          : "Erro ao atualizar ocorrência.";

      console.error("Erro ao atualizar ocorrência:", {
        mensagem,
        error,
      });

      setErroTela(mensagem);
      alert(mensagem);
    } finally {
      setSalvando(false);
    }
  }

  if (carregando) {
    return (
      <ProtecaoModulo modulo="ocorrencias">
        <div className="p-6 text-slate-400">
          Carregando ocorrência...
        </div>
      </ProtecaoModulo>
    );
  }

  return (
    <ProtecaoModulo modulo="ocorrencias">
      <div className="p-4 md:p-6 pb-24">
        <header className="mb-6 border-b border-slate-800 pb-5">
          <h1 className="text-2xl font-black md:text-3xl">
            Editar Ocorrência
          </h1>

          <p className="mt-2 text-slate-400">
            Atualize os dados da ocorrência {protocolo || `ID ${id}`}.
          </p>
        </header>

        {erroTela ? (
          <div className="mb-5 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-red-200">
            {erroTela}
          </div>
        ) : null}

        <form
          className="card space-y-6"
          onSubmit={(event) => {
            event.preventDefault();
            void atualizarOcorrencia();
          }}
        >
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="label">
                Tipo de ocorrência
              </label>

              <select
                className="input"
                value={tipo}
                onChange={(event) =>
                  setTipo(event.target.value)
                }
                disabled={salvando}
              >
                <option value="">Selecione</option>
                <option value="Perturbação do sossego">
                  Perturbação do sossego
                </option>
                <option value="Apoio ao cidadão">
                  Apoio ao cidadão
                </option>
                <option value="Patrulhamento preventivo">
                  Patrulhamento preventivo
                </option>
                <option value="Apoio a outro órgão">
                  Apoio a outro órgão
                </option>
                <option value="Fiscalização">
                  Fiscalização
                </option>
                <option value="Acidente">
                  Acidente
                </option>
                <option value="Outro">
                  Outro
                </option>
              </select>
            </div>

            <div>
              <label className="label">
                Status
              </label>

              <select
                className="input"
                value={status}
                onChange={(event) =>
                  setStatus(event.target.value)
                }
                disabled={salvando}
              >
                {STATUS_VALIDOS.map((item) => (
                  <option
                    key={item}
                    value={item}
                  >
                    {item}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div>
              <label className="label">
                Bairro
              </label>

              <input
                className="input"
                value={bairro}
                maxLength={150}
                onChange={(event) =>
                  setBairro(event.target.value)
                }
                disabled={salvando}
              />
            </div>

            <div>
              <label className="label">
                Rua / Local
              </label>

              <input
                className="input"
                value={local}
                maxLength={300}
                onChange={(event) =>
                  setLocal(event.target.value)
                }
                disabled={salvando}
              />
            </div>

            <div>
              <label className="label">
                Número
              </label>

              <input
                className="input"
                value={numero}
                maxLength={50}
                onChange={(event) =>
                  setNumero(event.target.value)
                }
                disabled={salvando}
              />
            </div>
          </div>

          <div>
            <label className="label">
              Envolvidos
            </label>

            <textarea
              className="input min-h-28 resize-y"
              value={envolvidos}
              maxLength={50000}
              onChange={(event) =>
                setEnvolvidos(event.target.value)
              }
              disabled={salvando}
            />

            <p className="mt-2 text-xs text-slate-500">
              O conteúdo existente será preservado exatamente como foi salvo.
            </p>
          </div>

          <div>
            <label className="label">
              Descrição da ocorrência
            </label>

            <textarea
              className="input min-h-40 resize-y"
              value={descricao}
              maxLength={20000}
              onChange={(event) =>
                setDescricao(event.target.value)
              }
              disabled={salvando}
            />
          </div>

          <div className="flex flex-col-reverse gap-3 border-t border-slate-800 pt-6 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={() =>
                router.push(
                  `/sistema/ocorrencias/${id}`
                )
              }
              disabled={salvando}
              className="rounded-xl bg-slate-700 px-5 py-3 font-semibold hover:bg-slate-600 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={salvando}
              className="rounded-xl bg-blue-600 px-5 py-3 font-semibold hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {salvando
                ? "Salvando..."
                : "Salvar Alterações"}
            </button>
          </div>
        </form>
      </div>
    </ProtecaoModulo>
  );
}