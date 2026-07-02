"use client";

import { useEffect, useState } from "react";
import { Lock, Search, ShieldCheck } from "lucide-react";

import { supabase } from "@/lib/supabase";
import SigCard from "@/components/sig/SigCard";
import SigPageHeader from "@/components/sig/SigPageHeader";

export default function AuditoriaBackupPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [busca, setBusca] = useState("");
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    carregarAuditoria();
  }, []);

  function usuarioLogado() {
    return JSON.parse(localStorage.getItem("usuarioLogado") || "{}");
  }

  async function carregarAuditoria() {
    setCarregando(true);

    const usuario = usuarioLogado();

    const { data, error } = await supabase
      .from("auditoria_sistema")
      .select("*")
      .eq("municipio_id", usuario.municipio_id)
      .eq("modulo", "BACKUP")
      .order("criado_em", { ascending: false });

    if (!error) {
      setLogs(data || []);
    }

    setCarregando(false);
  }

  const filtrados = logs.filter((item) => {
    const texto = `${item.acao} ${item.detalhes} ${item.registro_id}`.toLowerCase();
    return texto.includes(busca.toLowerCase());
  });

  return (
    <div className="p-4 md:p-6 space-y-6">
      <SigPageHeader
        titulo="Auditoria de Backups"
        subtitulo="Registro das ações realizadas no módulo de backup."
        icone={Lock}
      />

      <SigCard>
        <div className="flex items-center gap-3 rounded-2xl border border-blue-500/30 bg-blue-500/10 p-4">
          <ShieldCheck className="w-8 h-8 text-blue-400" />

          <div>
            <h2 className="text-lg font-black text-white">
              Segurança e rastreabilidade
            </h2>

            <p className="text-sm text-slate-400">
              Aqui ficam registradas ações como criação, download, tentativa de
              restauração e erros no módulo de backup.
            </p>
          </div>
        </div>
      </SigCard>

      <SigCard>
        <div className="relative">
          <Search className="absolute left-4 top-3.5 w-5 h-5 text-slate-500" />

          <input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar por ação, detalhe ou registro..."
            className="w-full rounded-2xl border border-slate-700 bg-slate-950 py-3 pl-12 pr-4 text-white outline-none focus:border-blue-500"
          />
        </div>
      </SigCard>

      <SigCard>
        {carregando ? (
          <p className="text-slate-400">Carregando auditoria...</p>
        ) : filtrados.length === 0 ? (
          <div className="text-center py-12">
            <Lock className="w-16 h-16 mx-auto text-slate-600 mb-4" />

            <h3 className="text-xl font-black text-white">
              Nenhum registro encontrado
            </h3>

            <p className="text-slate-400 mt-2">
              As ações de backup aparecerão aqui.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtrados.map((item) => (
              <div
                key={item.id}
                className="rounded-2xl border border-slate-700 bg-slate-950/50 p-4"
              >
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                  <div>
                    <p className="font-black text-white">{item.acao}</p>

                    <p className="text-sm text-slate-400 mt-1">
                      {item.detalhes || "Sem detalhes informados."}
                    </p>
                  </div>

                  <span className="rounded-full border border-slate-700 px-3 py-1 text-xs font-bold text-slate-300">
                    {new Date(item.criado_em).toLocaleString("pt-BR")}
                  </span>
                </div>

                <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-2 text-xs text-slate-500">
                  <p>Município: {item.municipio_id || "—"}</p>
                  <p>Usuário: {item.usuario_id || "—"}</p>
                  <p>Registro: {item.registro_id || "—"}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </SigCard>
    </div>
  );
}