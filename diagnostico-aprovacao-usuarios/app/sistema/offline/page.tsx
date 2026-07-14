"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { registrarAuditoria } from "@/lib/auditoria";

type OcorrenciaOffline = {
  id_local: string;
  titulo: string;
  descricao: string;
  local: string;
  latitude: number | null;
  longitude: number | null;
  data: string;
  status: "PENDENTE";
};

export default function OfflinePage() {
  const [online, setOnline] = useState(true);
  const [usuario, setUsuario] = useState<any>(null);
  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [local, setLocal] = useState("");
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [pendentes, setPendentes] = useState<OcorrenciaOffline[]>([]);
  const [sincronizando, setSincronizando] = useState(false);

  useEffect(() => {
    const salvo = localStorage.getItem("usuarioLogado");

    if (!salvo) {
      alert("Usuário não identificado. Faça login novamente.");
      window.location.href = "/login";
      return;
    }

    const dados = JSON.parse(salvo);

    if (!dados?.id || !dados?.municipio_id) {
      alert("Usuário sem município vinculado.");
      window.location.href = "/login";
      return;
    }

    setUsuario(dados);
    setOnline(navigator.onLine);
    carregarPendentes(dados.municipio_id);

    const ficarOnline = () => {
      setOnline(true);
      carregarPendentes(dados.municipio_id);
    };

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

  function carregarPendentes(municipioId: number) {
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

  function capturarGPS() {
    if (!navigator.geolocation) {
      alert("GPS não suportado neste dispositivo.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLatitude(pos.coords.latitude);
        setLongitude(pos.coords.longitude);
        alert("GPS capturado com sucesso.");
      },
      () => {
        alert("Não foi possível capturar o GPS.");
      },
      {
        enableHighAccuracy: true,
        timeout: 20000,
        maximumAge: 0,
      }
    );
  }

  async function salvarOcorrencia() {
    if (!usuario?.id || !usuario?.municipio_id) {
      alert("Usuário inválido ou sem município.");
      return;
    }

    if (!titulo.trim() || !descricao.trim()) {
      alert("Preencha título e descrição.");
      return;
    }

    const nova: OcorrenciaOffline = {
      id_local: crypto.randomUUID(),
      titulo: titulo.trim(),
      descricao: descricao.trim(),
      local: local.trim(),
      latitude,
      longitude,
      data: new Date().toISOString(),
      status: "PENDENTE",
    };

    salvarLocal([nova, ...pendentes]);

    await registrarAuditoria({
      modulo: "OCORRENCIAS_OFFLINE",
      acao: "SALVAR_LOCAL",
      descricao: `Ocorrência salva offline: ${nova.titulo}`,
      registro_id: nova.id_local,
    });

    limparCampos();
    alert("Ocorrência salva offline com sucesso.");
  }

  async function sincronizar() {
    if (!usuario?.id || !usuario?.municipio_id) {
      alert("Usuário inválido ou sem município.");
      return;
    }

    if (!navigator.onLine) {
      alert("Sem internet para sincronizar.");
      return;
    }

    if (pendentes.length === 0) {
      alert("Nenhuma ocorrência pendente.");
      return;
    }

    setSincronizando(true);

    const aindaPendentes: OcorrenciaOffline[] = [];

    for (const item of pendentes) {
      const protocolo = `OFF-${Date.now()}-${item.id_local.slice(0, 6)}`;

      const { error } = await supabase.from("ocorrencias").insert([
        {
          municipio_id: usuario.municipio_id,
          usuario_id: usuario.id,
          criado_por: String(usuario.id),
          protocolo,
          tipo: item.titulo,
          local: item.local,
          descricao: item.descricao,
          latitude: item.latitude,
          longitude: item.longitude,
          data: new Date(item.data).toISOString().split("T")[0],
          hora: new Date(item.data).toLocaleTimeString("pt-BR", {
            hour: "2-digit",
            minute: "2-digit",
          }),
          status: "Aberta",
          origem: "OFFLINE",
          id_local_offline: item.id_local,
        },
      ]);

      if (error) {
        console.error(error);
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
    setSincronizando(false);

    if (aindaPendentes.length === 0) {
      alert("Todas as ocorrências foram sincronizadas.");
    } else {
      alert("Algumas ocorrências não foram sincronizadas.");
    }
  }

  async function excluirLocal(id: string) {
    const item = pendentes.find((o) => o.id_local === id);

    if (!confirm("Deseja excluir esta ocorrência offline?")) return;

    const novaLista = pendentes.filter((o) => o.id_local !== id);
    salvarLocal(novaLista);

    if (item) {
      await registrarAuditoria({
        modulo: "OCORRENCIAS_OFFLINE",
        acao: "EXCLUIR_LOCAL",
        descricao: `Ocorrência offline excluída: ${item.titulo}`,
        registro_id: item.id_local,
      });
    }
  }

  function limparCampos() {
    setTitulo("");
    setDescricao("");
    setLocal("");
    setLatitude(null);
    setLongitude(null);
  }

  return (
    <main className="min-h-screen bg-[#02060f] text-white p-4 md:p-8 pb-28">
      <div className="mx-auto max-w-5xl space-y-6">
        <header className="rounded-3xl bg-slate-900 border border-slate-800 p-6">
          <h1 className="text-3xl font-black">📴 Ocorrências Offline</h1>

          <p className="mt-2 text-sm text-slate-400">
            Registre ocorrências sem internet e sincronize depois.
          </p>

          <div className="mt-4">
            {online ? (
              <span className="rounded-full bg-green-600 px-4 py-2 text-sm font-bold">
                Online
              </span>
            ) : (
              <span className="rounded-full bg-red-600 px-4 py-2 text-sm font-bold">
                Offline
              </span>
            )}
          </div>
        </header>

        <section className="rounded-3xl bg-slate-900 border border-slate-800 p-5 space-y-3">
          <h2 className="text-xl font-black">Nova ocorrência offline</h2>

          <input
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            placeholder="Título / tipo da ocorrência"
            className="w-full rounded-2xl bg-slate-950 border border-slate-700 p-3 outline-none"
          />

          <input
            value={local}
            onChange={(e) => setLocal(e.target.value)}
            placeholder="Local da ocorrência"
            className="w-full rounded-2xl bg-slate-950 border border-slate-700 p-3 outline-none"
          />

          <button
            type="button"
            onClick={capturarGPS}
            className="w-full rounded-2xl bg-emerald-700 p-3 font-bold"
          >
            📍 Capturar GPS
          </button>

          {latitude && longitude && (
            <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-300">
              GPS capturado:
              <br />
              Latitude: {latitude}
              <br />
              Longitude: {longitude}
            </div>
          )}

          <textarea
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
            placeholder="Descreva a ocorrência"
            rows={6}
            className="w-full rounded-2xl bg-slate-950 border border-slate-700 p-3 outline-none resize-none"
          />

          <button
            type="button"
            onClick={salvarOcorrencia}
            className="w-full rounded-2xl bg-blue-700 p-4 font-black"
          >
            Salvar Offline
          </button>
        </section>

        <section className="rounded-3xl bg-slate-900 border border-slate-800 p-5">
          <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <h2 className="text-xl font-black">
              Pendentes: {pendentes.length}
            </h2>

            <button
              type="button"
              onClick={sincronizar}
              disabled={sincronizando}
              className="rounded-2xl bg-emerald-700 px-6 py-3 font-bold disabled:opacity-50"
            >
              {sincronizando ? "Sincronizando..." : "🔄 Sincronizar agora"}
            </button>
          </div>

          {pendentes.length === 0 ? (
            <p className="text-slate-400">Nenhuma ocorrência pendente.</p>
          ) : (
            <div className="space-y-3">
              {pendentes.map((item) => (
                <div
                  key={item.id_local}
                  className="rounded-2xl border border-slate-800 bg-slate-950 p-4"
                >
                  <h3 className="font-black">{item.titulo}</h3>

                  <p className="text-sm text-slate-400 mt-1">
                    Local: {item.local || "Não informado"}
                  </p>

                  <p className="mt-2 whitespace-pre-wrap text-sm text-slate-300">
                    {item.descricao}
                  </p>

                  {item.latitude && item.longitude && (
                    <p className="mt-2 text-xs text-emerald-400">
                      GPS: {item.latitude}, {item.longitude}
                    </p>
                  )}

                  <p className="mt-2 text-xs text-slate-500">
                    Data: {new Date(item.data).toLocaleString("pt-BR")}
                  </p>

                  <button
                    type="button"
                    onClick={() => excluirLocal(item.id_local)}
                    className="mt-3 rounded-xl bg-red-700 px-4 py-2 text-sm font-bold"
                  >
                    Excluir local
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}