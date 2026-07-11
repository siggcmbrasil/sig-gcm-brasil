"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  CheckCircle,
  Eye,
  KeyRound,
  LoaderCircle,
  RefreshCw,
  ShieldCheck,
  Smartphone,
  XCircle,
} from "lucide-react";

import { supabase } from "@/lib/supabase";
import ProtecaoModulo from "@/components/ProtecaoModulo";

type StatusSolicitacao = "PENDENTE" | "APROVADA" | "NEGADA";

type Solicitacao = {
  id: number;
  municipio_id: number;
  nome: string;
  email: string;
  cpf_mascarado: string;
  telefone: string;
  navegador: string;
  dispositivo: string;
  observacao: string;
  motivo_negativa: string;
  status: StatusSolicitacao;
  criado_em: string;
  analisado_em: string | null;
  link_enviado_em: string | null;
  documento_disponivel: boolean;
  selfie_disponivel: boolean;
};

type RespostaLista = {
  ok?: boolean;
  erro?: string;
  solicitacoes?: Solicitacao[];
};

type RespostaAcao = {
  ok?: boolean;
  erro?: string;
  mensagem?: string;
  aviso?: string;
};

async function obterAccessToken() {
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();

  if (error || !session?.access_token) {
    throw new Error("Sua sessão expirou. Entre novamente no sistema.");
  }

  return session.access_token;
}

async function lerResposta<T>(resposta: Response): Promise<T> {
  const texto = await resposta.text();

  if (!texto) {
    return {} as T;
  }

  try {
    return JSON.parse(texto) as T;
  } catch {
    throw new Error("O servidor retornou uma resposta inválida.");
  }
}

export default function RecuperacaoSenhaAdminPage() {
  const [solicitacoes, setSolicitacoes] = useState<Solicitacao[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [processandoId, setProcessandoId] = useState<number | null>(null);
  const [erroTela, setErroTela] = useState("");

  const carregar = useCallback(async () => {
    setCarregando(true);
    setErroTela("");

    try {
      const accessToken = await obterAccessToken();

      const resposta = await fetch("/api/usuarios/recuperacao-senha", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        cache: "no-store",
      });

      const corpo = await lerResposta<RespostaLista>(resposta);

      if (!resposta.ok || !corpo.ok) {
        throw new Error(
          corpo.erro || "Não foi possível carregar as solicitações."
        );
      }

      setSolicitacoes(corpo.solicitacoes || []);
    } catch (error) {
      const mensagem =
        error instanceof Error
          ? error.message
          : "Erro desconhecido ao carregar solicitações.";

      console.error(`Erro ao carregar recuperações de senha: ${mensagem}`);
      setErroTela(mensagem);
      setSolicitacoes([]);
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  async function abrirArquivo(
  solicitacaoId: number,
  tipo: "documento" | "selfie"
) {
  /*
   * A aba precisa ser aberta imediatamente durante o clique.
   * Se abrirmos somente depois do fetch, o navegador bloqueia.
   */
  const novaAba = window.open("about:blank", "_blank");

  if (!novaAba) {
    alert(
      "O navegador bloqueou a abertura do arquivo. Libere pop-ups para este site."
    );
    return;
  }

  novaAba.document.title = "Abrindo arquivo seguro...";
  novaAba.document.body.style.background = "#020b1c";
  novaAba.document.body.style.color = "#ffffff";
  novaAba.document.body.style.fontFamily = "Arial, sans-serif";
  novaAba.document.body.style.padding = "32px";
  novaAba.document.body.textContent =
    "Carregando arquivo seguro...";

  setProcessandoId(solicitacaoId);

  try {
    const accessToken = await obterAccessToken();

    const resposta = await fetch(
      `/api/usuarios/recuperacao-senha/${solicitacaoId}/arquivo?tipo=${tipo}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        cache: "no-store",
      }
    );

    const corpo = await lerResposta<{
      ok?: boolean;
      erro?: string;
      signed_url?: string;
    }>(resposta);

    if (!resposta.ok || !corpo.ok || !corpo.signed_url) {
      throw new Error(
        corpo.erro || "Não foi possível abrir o arquivo."
      );
    }

    novaAba.location.replace(corpo.signed_url);
  } catch (error) {
    novaAba.close();

    const mensagem =
      error instanceof Error
        ? error.message
        : "Erro desconhecido ao abrir arquivo.";

    console.warn(
      `Arquivo de recuperação não aberto: ${mensagem}`
    );

    alert(mensagem);
  } finally {
    setProcessandoId(null);
  }
}

  async function analisar(
    item: Solicitacao,
    acao: "APROVAR" | "NEGAR"
  ) {
    let motivo = "";

    if (acao === "APROVAR") {
      const confirmou = window.confirm(
        `Liberar a redefinição de senha para ${item.email}?`
      );

      if (!confirmou) return;
    } else {
      motivo = window.prompt("Informe o motivo da negativa:")?.trim() || "";

      if (motivo.length < 5) {
        alert("Informe um motivo com pelo menos 5 caracteres.");
        return;
      }
    }

    setProcessandoId(item.id);

    try {
      const accessToken = await obterAccessToken();

      const resposta = await fetch(
        `/api/usuarios/recuperacao-senha/${item.id}/analisar`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            acao,
            motivo: motivo || undefined,
          }),
        }
      );

      const corpo = await lerResposta<RespostaAcao>(resposta);

      if (!resposta.ok || !corpo.ok) {
        throw new Error(
          corpo.erro || "Não foi possível analisar a solicitação."
        );
      }

      alert(
        [corpo.mensagem, corpo.aviso].filter(Boolean).join("\n\n") ||
          "Solicitação atualizada."
      );

      await carregar();
    } catch (error) {
      const mensagem =
        error instanceof Error
          ? error.message
          : "Erro desconhecido ao analisar solicitação.";

      console.warn(`Recuperação de senha não processada: ${mensagem}`);
      alert(mensagem);
    } finally {
      setProcessandoId(null);
    }
  }

  const resumo = useMemo(() => {
    return {
      total: solicitacoes.length,
      pendentes: solicitacoes.filter(
        (item) => item.status === "PENDENTE"
      ).length,
      aprovadas: solicitacoes.filter(
        (item) => item.status === "APROVADA"
      ).length,
      negadas: solicitacoes.filter(
        (item) => item.status === "NEGADA"
      ).length,
    };
  }, [solicitacoes]);

return (
  <ProtecaoModulo modulo="usuarios">
    <div className="space-y-6 p-4 pb-24 md:p-6">
      <div className="painel-premium p-6">
        <h1 className="flex items-center gap-3 text-3xl font-black text-white md:text-4xl">
          <KeyRound className="text-cyan-400" />
          Central de Recuperação de Senha
        </h1>

        <p className="mt-2 text-slate-400">
          Analise os documentos e libere a redefinição somente após confirmar
          a identidade do usuário.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Resumo titulo="Solicitações" valor={resumo.total} />
        <Resumo titulo="Pendentes" valor={resumo.pendentes} />
        <Resumo titulo="Aprovadas" valor={resumo.aprovadas} />
        <Resumo titulo="Negadas" valor={resumo.negadas} />
      </div>

      <div className="painel-premium p-6">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xl font-black text-white">
            Solicitações recebidas
          </h2>

          <button
            type="button"
            onClick={() => void carregar()}
            disabled={carregando || processandoId !== null}
            className="flex items-center gap-2 rounded-xl bg-blue-700 px-4 py-2 font-bold text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <RefreshCw
              size={16}
              className={carregando ? "animate-spin" : ""}
            />
            Atualizar
          </button>
        </div>

        {erroTela && (
          <div className="mb-5 flex items-start gap-3 rounded-xl border border-red-500/30 bg-red-950/40 p-4 text-red-200">
            <AlertTriangle className="mt-0.5 shrink-0" size={18} />
            <div>
              <p className="font-bold">Não foi possível carregar</p>
              <p className="mt-1 text-sm text-red-300">{erroTela}</p>
            </div>
          </div>
        )}

        {carregando ? (
          <div className="flex items-center gap-3 py-8 text-slate-400">
            <LoaderCircle className="animate-spin" size={20} />
            Carregando solicitações...
          </div>
        ) : solicitacoes.length === 0 ? (
          <p className="py-8 text-slate-400">
            Nenhuma solicitação encontrada.
          </p>
        ) : (
          <div className="space-y-4">
            {solicitacoes.map((item) => {
              const processando = processandoId === item.id;

              return (
                <article
                  key={item.id}
                  className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4"
                >
                  <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                    <div className="min-w-0 space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-lg font-black text-white">
                          {item.nome || "Sem nome"}
                        </p>

                        <Status status={item.status} />
                      </div>

                      <p className="break-words text-sm text-slate-400">
                        {item.email || "E-mail não informado"} • CPF:{" "}
                        {item.cpf_mascarado || "-"} • Tel:{" "}
                        {item.telefone || "-"}
                      </p>

                      <p className="text-xs text-slate-500">
                        Enviado em{" "}
                        {new Date(item.criado_em).toLocaleString("pt-BR")}
                      </p>

                      <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-3 text-sm text-slate-300">
                        <p className="flex items-center gap-2 font-bold text-cyan-300">
                          <Smartphone size={16} />
                          Dispositivo / Navegador
                        </p>

                        <p className="mt-1 text-slate-400">
                          Navegador: {item.navegador || "-"}
                        </p>

                        <p className="mt-1 break-all text-xs text-slate-500">
                          {item.dispositivo ||
                            "Dispositivo não informado"}
                        </p>
                      </div>

                      {item.observacao && (
                        <p className="text-sm text-yellow-300">
                          Observação: {item.observacao}
                        </p>
                      )}

                      {item.motivo_negativa && (
                        <p className="text-sm text-red-300">
                          Motivo da negativa: {item.motivo_negativa}
                        </p>
                      )}

                      {item.link_enviado_em && (
                        <p className="text-sm text-green-300">
                          Link enviado em{" "}
                          {new Date(item.link_enviado_em).toLocaleString(
                            "pt-BR"
                          )}
                        </p>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {item.documento_disponivel && (
                        <button
                          type="button"
                          onClick={() =>
                            void abrirArquivo(item.id, "documento")
                          }
                          disabled={processandoId !== null}
                          className="flex items-center gap-1 rounded-lg bg-blue-700 px-3 py-2 text-xs font-bold text-white hover:bg-blue-800 disabled:opacity-50"
                        >
                          <Eye size={14} />
                          Documento
                        </button>
                      )}

                      {item.selfie_disponivel && (
                        <button
                          type="button"
                          onClick={() =>
                            void abrirArquivo(item.id, "selfie")
                          }
                          disabled={processandoId !== null}
                          className="flex items-center gap-1 rounded-lg bg-cyan-700 px-3 py-2 text-xs font-bold text-white hover:bg-cyan-800 disabled:opacity-50"
                        >
                          <ShieldCheck size={14} />
                          Selfie
                        </button>
                      )}

                      {item.status === "PENDENTE" && (
                        <>
                          <button
                            type="button"
                            onClick={() =>
                              void analisar(item, "APROVAR")
                            }
                            disabled={processandoId !== null}
                            className="flex items-center gap-1 rounded-lg bg-green-700 px-3 py-2 text-xs font-bold text-white hover:bg-green-800 disabled:opacity-50"
                          >
                            {processando ? (
                              <LoaderCircle
                                size={14}
                                className="animate-spin"
                              />
                            ) : (
                              <CheckCircle size={14} />
                            )}
                            Aprovar
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              void analisar(item, "NEGAR")
                            }
                            disabled={processandoId !== null}
                            className="flex items-center gap-1 rounded-lg bg-red-700 px-3 py-2 text-xs font-bold text-white hover:bg-red-800 disabled:opacity-50"
                          >
                            <XCircle size={14} />
                            Negar
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
        </div>
  </ProtecaoModulo>
  );
}

function Resumo({
  titulo,
  valor,
}: {
  titulo: string;
  valor: number;
}) {
  return (
    <div className="painel-premium p-5">
      <p className="text-sm text-slate-400">{titulo}</p>
      <h2 className="mt-2 text-4xl font-black text-white">{valor}</h2>
    </div>
  );
}

function Status({ status }: { status: StatusSolicitacao }) {
  let cor = "bg-slate-700 text-slate-100";

  if (status === "PENDENTE") {
    cor = "bg-yellow-700 text-yellow-100";
  }

  if (status === "APROVADA") {
    cor = "bg-green-700 text-green-100";
  }

  if (status === "NEGADA") {
    cor = "bg-red-700 text-red-100";
  }

  return (
    <span className={`${cor} rounded-full px-3 py-1 text-xs font-bold`}>
      {status}
    </span>
  );
}
