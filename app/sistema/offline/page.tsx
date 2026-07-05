"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { registrarAuditoria } from "@/lib/auditoria";

type OcorrenciaOffline = {
  id_local: string;
  titulo: string;
  descricao: string;
  local: string;
  data: string;
  status: "PENDENTE" | "SINCRONIZADA";
};

export default function OfflinePage() {
  const [online, setOnline] = useState(true);
  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [local, setLocal] = useState("");
  const [pendentes, setPendentes] = useState<OcorrenciaOffline[]>([]);
  const [usuario, setUsuario] = useState<any>(null);

  useEffect(() => {
    const usuarioSalvo = localStorage.getItem("usuarioLogado");

    if (!usuarioSalvo) {
      alert("Usuário não identificado. Faça login novamente.");
      return;
    }

    const dadosUsuario = JSON.parse(usuarioSalvo);

    if (!dadosUsuario?.id || !dadosUsuario?.municipio_id) {
      alert("Usuário sem município vinculado. Acesso bloqueado.");
      return;
    }

    setUsuario(dadosUsuario);
    setOnline(navigator.onLine);
    carregarPendentes(dadosUsuario.municipio_id);

    const ficarOnline = () => setOnline(true);
    const ficarOffline = () => setOnline(false);

    window.addEventListener("online", ficarOnline);
    window.addEventListener("offline", ficarOffline);

    return () => {
      window.removeEventListener("online", ficarOnline);
      window.removeEventListener("offline", ficarOffline);
    };
  }, []);

  function chaveOffline(municipioId: number) {
    return `ocorrencias_offline_${municipioId}`;
  }

  function carregarPendentes(municipioId?: number) {
    if (!municipioId) return;

    const dados = localStorage.getItem(chaveOffline(municipioId));
    setPendentes(dados ? JSON.parse(dados) : []);
  }

  function salvarLocal(lista: OcorrenciaOffline[]) {
    if (!usuario?.municipio_id) return;

    localStorage.setItem(
      chaveOffline(usuario.municipio_id),
      JSON.stringify(lista)
    );

    setPendentes(lista);
  }

  async function salvarOcorrencia() {
    if (!usuario?.id || !usuario?.municipio_id) {
      alert("Usuário inválido ou sem município. Faça login novamente.");
      return;
    }

    if (!titulo || !descricao) {
      alert("Preencha título e descrição.");
      return;
    }

    const nova: OcorrenciaOffline = {
      id_local: crypto.randomUUID(),
      titulo,
      descricao,
      local,
      data: new Date().toISOString(),
      status: "PENDENTE",
    };

    if (navigator.onLine) {
      const { error } = await supabase.from("ocorrencias").insert([
        {
          municipio_id: usuario.municipio_id,
          protocolo: `OFF-${Date.now()}`,
          tipo: nova.titulo,
          local: nova.local,
          descricao: nova.descricao,
          data: new Date(nova.data).toISOString().split("T")[0],
          hora: new Date(nova.data).toLocaleTimeString("pt-BR", {
            hour: "2-digit",
            minute: "2-digit",
          }),
          status: "Aberta",
        },
      ]);

      if (!error) {
        await registrarAuditoria({
          modulo: "OCORRENCIAS_OFFLINE",
          acao: "CRIAR_ONLINE",
          descricao: `Ocorrência criada online pela tela offline: ${nova.titulo}`,
          registro_id: nova.id_local,
        });

        alert("Ocorrência salva online.");
        limparCampos();
        return;
      }
    }

    salvarLocal([nova, ...pendentes]);
    alert("Sem internet ou erro no envio. Ocorrência salva offline.");
    limparCampos();
  }

  async function sincronizar() {
    if (!usuario?.id || !usuario?.municipio_id) {
      alert("Usuário inválido ou sem município. Faça login novamente.");
      return;
    }

    if (!navigator.onLine) {
      alert("Sem internet para sincronizar.");
      return;
    }

    const aindaPendentes: OcorrenciaOffline[] = [];

    for (const item of pendentes) {
      const { error } = await supabase.from("ocorrencias").insert([
        {
          municipio_id: usuario.municipio_id,
          protocolo: `OFF-${Date.now()}-${item.id_local.slice(0, 6)}`,
          tipo: item.titulo,
          local: item.local,
          descricao: item.descricao,
          data: new Date(item.data).toISOString().split("T")[0],
          hora: new Date(item.data).toLocaleTimeString("pt-BR", {
            hour: "2-digit",
            minute: "2-digit",
          }),
          status: "Aberta",
        },
      ]);

      if (error) {
        aindaPendentes.push(item);
      } else {
        await registrarAuditoria({
          modulo: "OCORRENCIAS_OFFLINE",
          acao: "SINCRONIZAR",
          descricao: `Ocorrência offline sincronizada: ${item.titulo}`,
          registro_id: item.id_local,
        });
      }
    }

    salvarLocal(aindaPendentes);

    if (aindaPendentes.length === 0) {
      alert("Todas as ocorrências foram sincronizadas.");
    } else {
      alert("Algumas ocorrências não foram sincronizadas.");
    }
  }

  async function excluirLocal(id: string) {
    const item = pendentes.find((ocorrencia) => ocorrencia.id_local === id);
    const novaLista = pendentes.filter((item) => item.id_local !== id);

    salvarLocal(novaLista);

    if (usuario?.id && usuario?.municipio_id && item) {
      await registrarAuditoria({
        modulo: "OCORRENCIAS_OFFLINE",
        acao: "EXCLUIR_LOCAL",
        descricao: `Ocorrência offline excluída localmente: ${item.titulo}`,
        registro_id: item.id_local,
      });
    }
  }

  function limparCampos() {
    setTitulo("");
    setDescricao("");
    setLocal("");
  }

  return (
    <div className="min-h-screen bg-slate-100 p-4 md:p-8 text-slate-900">
      <div className="mx-auto max-w-5xl">
        <div className="mb-6 rounded-2xl bg-slate-900 p-6 text-white shadow">
          <h1 className="text-2xl font-bold">📴 Ocorrências Offline</h1>
          <p className="mt-2 text-sm text-slate-300">
            Registre ocorrências mesmo sem internet e sincronize depois.
          </p>

          <div className="mt-4">
            {online ? (
              <span className="rounded-full bg-green-600 px-4 py-2 text-sm font-semibold">
                Online
              </span>
            ) : (
              <span className="rounded-full bg-red-600 px-4 py-2 text-sm font-semibold">
                Offline
              </span>
            )}
          </div>
        </div>

        <div className="rounded-2xl bg-white p-5 shadow">
          <h2 className="mb-4 text-lg font-bold">Nova ocorrência offline</h2>

          <input
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            placeholder="Título da ocorrência"
            className="mb-3 w-full rounded-xl border border-slate-300 p-3 outline-none focus:border-blue-600"
          />

          <input
            value={local}
            onChange={(e) => setLocal(e.target.value)}
            placeholder="Local da ocorrência"
            className="mb-3 w-full rounded-xl border border-slate-300 p-3 outline-none focus:border-blue-600"
          />

          <textarea
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
            placeholder="Descreva a ocorrência"
            rows={6}
            className="mb-3 w-full rounded-xl border border-slate-300 p-3 outline-none focus:border-blue-600"
          />

          <button
            type="button"
            onClick={salvarOcorrencia}
            className="rounded-xl bg-blue-700 px-6 py-3 font-semibold text-white hover:bg-blue-800"
          >
            Salvar ocorrência
          </button>
        </div>

        <div className="mt-6 rounded-2xl bg-white p-5 shadow">
          <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <h2 className="text-lg font-bold">
              Pendentes de sincronização: {pendentes.length}
            </h2>

            <button
              type="button"
              onClick={sincronizar}
              className="rounded-xl bg-emerald-700 px-6 py-3 font-semibold text-white hover:bg-emerald-800"
            >
              🔄 Sincronizar agora
            </button>
          </div>

          {pendentes.length === 0 ? (
            <p className="text-slate-500">Nenhuma ocorrência pendente.</p>
          ) : (
            <div className="space-y-3">
              {pendentes.map((item) => (
                <div
                  key={item.id_local}
                  className="rounded-xl border border-slate-200 bg-slate-50 p-4"
                >
                  <h3 className="font-bold">{item.titulo}</h3>
                  <p className="text-sm text-slate-600">
                    Local: {item.local || "Não informado"}
                  </p>
                  <p className="mt-2 whitespace-pre-wrap text-sm">
                    {item.descricao}
                  </p>
                  <p className="mt-2 text-xs text-slate-500">
                    Data: {new Date(item.data).toLocaleString("pt-BR")}
                  </p>

                  <button
                    type="button"
                    onClick={() => excluirLocal(item.id_local)}
                    className="mt-3 rounded-lg bg-red-700 px-4 py-2 text-sm font-semibold text-white hover:bg-red-800"
                  >
                    Excluir local
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}