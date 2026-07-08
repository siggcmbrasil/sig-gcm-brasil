"use client";

import { useEffect, useState } from "react";
import {
  CheckCircle,
  Eye,
  KeyRound,
  RefreshCw,
  ShieldCheck,
  Smartphone,
  XCircle,
} from "lucide-react";

import { supabase } from "@/lib/supabase";
import { registrarAuditoria } from "@/lib/auditoria";

export default function RecuperacaoSenhaAdminPage() {
  const [solicitacoes, setSolicitacoes] = useState<any[]>([]);
  const [carregando, setCarregando] = useState(true);

  const usuarioLogado =
    typeof window !== "undefined"
      ? JSON.parse(localStorage.getItem("usuarioLogado") || "{}")
      : {};

  useEffect(() => {
    carregar();
  }, []);

  async function carregar() {
    setCarregando(true);

    let query = supabase
      .from("solicitacoes_recuperacao_senha")
      .select("*")
      .order("criado_em", { ascending: false });

    if (usuarioLogado.perfil !== "DESENVOLVEDOR") {
      query = query.eq("municipio_id", usuarioLogado.municipio_id);
    }

    const { data, error } = await query;

    if (error) {
      console.error(error);
      alert("Erro ao carregar solicitações.");
      setCarregando(false);
      return;
    }

    setSolicitacoes(data || []);
    setCarregando(false);
  }

  async function abrirArquivo(caminho: string) {
    const { data, error } = await supabase.storage
      .from("recuperacao-senha")
      .createSignedUrl(caminho, 120);

    if (error || !data?.signedUrl) {
      alert("Erro ao abrir arquivo.");
      return;
    }

    window.open(data.signedUrl, "_blank");
  }

  function queryBaseUpdate(item: any) {
    let query = supabase
      .from("solicitacoes_recuperacao_senha")
      .update(item.update)
      .eq("id", item.id);

    if (usuarioLogado.perfil !== "DESENVOLVEDOR") {
      query = query.eq("municipio_id", usuarioLogado.municipio_id);
    }

    return query;
  }

  async function aprovarSolicitacao(item: any) {
    if (!confirm(`Liberar redefinição para ${item.email}?`)) return;

    const { error } = await supabase.auth.resetPasswordForEmail(item.email, {
      redirectTo: `${window.location.origin}/redefinir-senha`,
    });

    if (error) {
      alert(error.message);
      return;
    }

    const update = {
      status: "APROVADA",
      analisado_por: usuarioLogado.id,
      analisado_em: new Date().toISOString(),
      link_enviado_por: usuarioLogado.id,
      link_enviado_em: new Date().toISOString(),
      observacao: "Documento e selfie conferidos. Link enviado por e-mail.",
    };

    const { error: erroUpdate } = await queryBaseUpdate({
      id: item.id,
      update,
    });

    if (erroUpdate) {
      alert("Link enviado, mas erro ao atualizar solicitação.");
      return;
    }

    await registrarAuditoria({
      modulo: "Recuperação de Senha",
      acao: "APROVAR",
      descricao: `Aprovou recuperação de senha para ${item.email}.`,
    });

    alert("Link de redefinição enviado.");
    carregar();
  }

  async function negarSolicitacao(item: any) {
    const motivo = prompt("Informe o motivo da negativa:");

    if (!motivo) return;

    const update = {
      status: "NEGADA",
      analisado_por: usuarioLogado.id,
      analisado_em: new Date().toISOString(),
      motivo_negativa: motivo,
      observacao: motivo,
    };

    const { error } = await queryBaseUpdate({
      id: item.id,
      update,
    });

    if (error) {
      alert("Erro ao negar solicitação.");
      return;
    }

    await registrarAuditoria({
      modulo: "Recuperação de Senha",
      acao: "NEGAR",
      descricao: `Negou recuperação de senha para ${item.email}. Motivo: ${motivo}`,
    });

    carregar();
  }

  const pendentes = solicitacoes.filter((s) => s.status === "PENDENTE").length;
  const aprovadas = solicitacoes.filter((s) => s.status === "APROVADA").length;
  const negadas = solicitacoes.filter((s) => s.status === "NEGADA").length;

  return (
    <div className="p-4 md:p-6 pb-24 space-y-6">
      <div className="painel-premium p-6">
        <h1 className="text-3xl md:text-4xl font-black text-white flex items-center gap-3">
          <KeyRound className="text-cyan-400" />
          Central de Recuperação de Senha
        </h1>

        <p className="text-slate-400 mt-2">
          Analise documento, selfie, dispositivo e libere manualmente a
          redefinição de senha.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Resumo titulo="Solicitações" valor={solicitacoes.length} />
        <Resumo titulo="Pendentes" valor={pendentes} />
        <Resumo titulo="Aprovadas" valor={aprovadas} />
        <Resumo titulo="Negadas" valor={negadas} />
      </div>

      <div className="painel-premium p-6">
        <div className="flex justify-between items-center gap-3 mb-5">
          <h2 className="text-xl font-black text-white">
            Solicitações recebidas
          </h2>

          <button
            onClick={carregar}
            className="bg-blue-700 hover:bg-blue-800 px-4 py-2 rounded-xl font-bold flex items-center gap-2"
          >
            <RefreshCw size={16} />
            Atualizar
          </button>
        </div>

        {carregando ? (
          <p className="text-slate-400">Carregando solicitações...</p>
        ) : solicitacoes.length === 0 ? (
          <p className="text-slate-400">Nenhuma solicitação encontrada.</p>
        ) : (
          <div className="space-y-4">
            {solicitacoes.map((item) => (
              <div
                key={item.id}
                className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4"
              >
                <div className="flex flex-col xl:flex-row xl:items-start xl:justify-between gap-4">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-white font-black text-lg">
                        {item.nome || "Sem nome"}
                      </p>

                      <Status status={item.status} />
                    </div>

                    <p className="text-slate-400 text-sm">
                      {item.email} • CPF: {item.cpf || "-"} • Tel:{" "}
                      {item.telefone || "-"}
                    </p>

                    <p className="text-slate-500 text-xs">
                      Enviado em{" "}
                      {new Date(item.criado_em).toLocaleString("pt-BR")}
                    </p>

                    <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-3 text-sm text-slate-300">
                      <p className="flex items-center gap-2 font-bold text-cyan-300">
                        <Smartphone size={16} />
                        Dispositivo / Navegador
                      </p>

                      <p className="text-slate-400 mt-1">
                        Navegador: {item.navegador || "-"}
                      </p>

                      <p className="text-slate-500 text-xs break-all mt-1">
                        {item.dispositivo || "Dispositivo não informado"}
                      </p>
                    </div>

                    {item.observacao && (
                      <p className="text-yellow-300 text-sm">
                        Observação: {item.observacao}
                      </p>
                    )}

                    {item.motivo_negativa && (
                      <p className="text-red-300 text-sm">
                        Motivo da negativa: {item.motivo_negativa}
                      </p>
                    )}

                    {item.link_enviado_em && (
                      <p className="text-green-300 text-sm">
                        Link enviado em{" "}
                        {new Date(item.link_enviado_em).toLocaleString("pt-BR")}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {item.documento_url && (
                      <button
                        onClick={() => abrirArquivo(item.documento_url)}
                        className="bg-blue-700 hover:bg-blue-800 px-3 py-2 rounded-lg text-xs font-bold flex items-center gap-1"
                      >
                        <Eye size={14} />
                        Documento
                      </button>
                    )}

                    {item.selfie_url && (
                      <button
                        onClick={() => abrirArquivo(item.selfie_url)}
                        className="bg-cyan-700 hover:bg-cyan-800 px-3 py-2 rounded-lg text-xs font-bold flex items-center gap-1"
                      >
                        <ShieldCheck size={14} />
                        Selfie
                      </button>
                    )}

                    {item.status === "PENDENTE" && (
                      <>
                        <button
                          onClick={() => aprovarSolicitacao(item)}
                          className="bg-green-700 hover:bg-green-800 px-3 py-2 rounded-lg text-xs font-bold flex items-center gap-1"
                        >
                          <CheckCircle size={14} />
                          Aprovar
                        </button>

                        <button
                          onClick={() => negarSolicitacao(item)}
                          className="bg-red-700 hover:bg-red-800 px-3 py-2 rounded-lg text-xs font-bold flex items-center gap-1"
                        >
                          <XCircle size={14} />
                          Negar
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
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
      <p className="text-slate-400 text-sm">{titulo}</p>
      <h2 className="text-4xl font-black text-white mt-2">{valor}</h2>
    </div>
  );
}

function Status({ status }: { status: string }) {
  let cor = "bg-slate-700 text-slate-100";

  if (status === "PENDENTE") cor = "bg-yellow-700 text-yellow-100";
  if (status === "APROVADA") cor = "bg-green-700 text-green-100";
  if (status === "NEGADA") cor = "bg-red-700 text-red-100";

  return (
    <span className={`${cor} rounded-full px-3 py-1 text-xs font-bold`}>
      {status}
    </span>
  );
}