"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Bell,
  CheckCircle2,
  AlertTriangle,
  Info,
  Trash2,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

type Notificacao = {
  id: number;
  titulo: string;
  mensagem: string;
  tipo: string | null;
  link: string | null;
  lida: boolean;
  criado_em: string;
};

export default function NotificacoesPage() {
  const [notificacoes, setNotificacoes] = useState<Notificacao[]>([]);
  const [carregando, setCarregando] = useState(true);

  const usuario =
    typeof window !== "undefined"
      ? JSON.parse(localStorage.getItem("usuarioLogado") || "{}")
      : {};

  useEffect(() => {
    carregar();
  }, []);

  async function carregar() {
    if (!usuario?.municipio_id) return;

    setCarregando(true);

    const { data, error } = await supabase
      .from("notificacoes")
      .select("*")
      .eq("municipio_id", usuario.municipio_id)
      .or(`usuario_id.eq.${usuario.id},usuario_id.is.null,perfil_destino.eq.${usuario.perfil}`)
      .order("id", { ascending: false });

    if (error) {
      alert("Erro ao carregar notificações.");
      setCarregando(false);
      return;
    }

    setNotificacoes(data || []);
    setCarregando(false);
  }

  async function marcarComoLida(id: number) {
    await supabase
      .from("notificacoes")
      .update({ lida: true })
      .eq("id", id)
      .eq("municipio_id", usuario.municipio_id);

    carregar();
  }

  async function excluir(id: number) {
    if (!confirm("Deseja excluir esta notificação?")) return;

    await supabase
      .from("notificacoes")
      .delete()
      .eq("id", id)
      .eq("municipio_id", usuario.municipio_id);

    carregar();
  }

  const resumo = useMemo(() => {
    return {
      total: notificacoes.length,
      naoLidas: notificacoes.filter((n) => !n.lida).length,
      lidas: notificacoes.filter((n) => n.lida).length,
    };
  }, [notificacoes]);

  return (
    <div className="p-4 md:p-6 pb-24 space-y-6">
      <div className="painel-premium p-6">
        <p className="text-sm text-blue-400 font-bold uppercase">
          Central de Comunicação
        </p>

        <h1 className="text-2xl md:text-3xl font-black text-white mt-1">
          Central de Notificações
        </h1>

        <p className="text-slate-400 mt-2">
          Avisos, alertas operacionais, mensagens do comando e notificações do sistema.
        </p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card titulo="Total" valor={resumo.total} cor="azul" />
        <Card titulo="Não lidas" valor={resumo.naoLidas} cor="amarelo" />
        <Card titulo="Lidas" valor={resumo.lidas} cor="verde" />
      </div>

      {carregando ? (
        <div className="painel-premium p-6 text-slate-400">
          Carregando notificações...
        </div>
      ) : notificacoes.length === 0 ? (
        <div className="painel-premium p-10 text-center">
          <Bell className="w-14 h-14 text-blue-400 mx-auto mb-4" />

          <h2 className="text-xl font-black text-white">
            Nenhuma notificação
          </h2>

          <p className="text-slate-400 mt-2">
            Quando houver avisos ou alertas, eles aparecerão aqui.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {notificacoes.map((item) => (
            <div
              key={item.id}
              className={`painel-premium p-5 border ${
                item.lida ? "border-slate-800" : "border-yellow-500/50"
              }`}
            >
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                <div className="flex gap-4">
                  <IconeTipo tipo={item.tipo || "INFO"} />

                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-lg font-black text-white">
                        {item.titulo}
                      </h2>

                      {!item.lida && (
                        <span className="rounded-full bg-yellow-500/20 text-yellow-300 border border-yellow-500/40 px-2 py-1 text-xs font-bold">
                          Nova
                        </span>
                      )}
                    </div>

                    <p className="text-slate-400 mt-1">
                      {item.mensagem}
                    </p>

                    <p className="text-xs text-slate-500 mt-3">
                      {new Date(item.criado_em).toLocaleString("pt-BR")}
                    </p>
                  </div>
                </div>

                <div className="flex gap-2">
                  {!item.lida && (
                    <button
                      onClick={() => marcarComoLida(item.id)}
                      className="bg-green-700 hover:bg-green-800 text-white px-3 py-2 rounded-xl text-sm font-bold"
                    >
                      Marcar lida
                    </button>
                  )}

                  <button
                    onClick={() => excluir(item.id)}
                    className="bg-red-950/70 border border-red-800 text-red-300 px-3 py-2 rounded-xl"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Card({
  titulo,
  valor,
  cor,
}: {
  titulo: string;
  valor: number;
  cor: "azul" | "verde" | "amarelo";
}) {
  const cores = {
    azul: "text-blue-400",
    verde: "text-green-400",
    amarelo: "text-yellow-400",
  };

  return (
    <div className="painel-premium p-5">
      <p className="text-slate-400 text-sm">{titulo}</p>
      <h2 className={`text-3xl font-black ${cores[cor]}`}>{valor}</h2>
    </div>
  );
}

function IconeTipo({ tipo }: { tipo: string }) {
  if (tipo === "ALERTA") {
    return (
      <div className="w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-center">
        <AlertTriangle className="text-red-400" />
      </div>
    );
  }

  if (tipo === "SUCESSO") {
    return (
      <div className="w-12 h-12 rounded-2xl bg-green-500/10 border border-green-500/30 flex items-center justify-center">
        <CheckCircle2 className="text-green-400" />
      </div>
    );
  }

  return (
    <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center">
      <Info className="text-blue-400" />
    </div>
  );
}