"use client";

import { useEffect, useState } from "react";
import {
  Megaphone,
  Send,
  Pin,
  AlertTriangle,
  ShieldCheck,
} from "lucide-react";

import { supabase } from "@/lib/supabase";
import SigPageHeader from "@/components/sig/SigPageHeader";
import SigCard from "@/components/sig/SigCard";

export default function ComunicacaoInternaPage() {
  const [titulo, setTitulo] = useState("");
  const [categoria, setCategoria] = useState("COMUNICADO");
  const [prioridade, setPrioridade] = useState("NORMAL");
  const [mensagem, setMensagem] = useState("");
  const [comunicados, setComunicados] = useState<any[]>([]);
  const [salvando, setSalvando] = useState(false);

  const usuario =
    typeof window !== "undefined"
      ? JSON.parse(localStorage.getItem("usuarioLogado") || "{}")
      : {};

  async function carregar() {
    const { data } = await supabase
      .from("comunicados_internos")
      .select("*")
      .eq("municipio_id", usuario.municipio_id)
      .eq("ativo", true)
      .order("fixado", { ascending: false })
      .order("criado_em", { ascending: false });

    setComunicados(data || []);
  }

  useEffect(() => {
    if (usuario?.municipio_id) carregar();
  }, []);

  async function salvar() {
    if (!titulo.trim() || !mensagem.trim()) {
      alert("Preencha título e mensagem.");
      return;
    }

    setSalvando(true);

    const { error } = await supabase.from("comunicados_internos").insert([
      {
        municipio_id: usuario.municipio_id,
        criado_por: usuario.id,
        titulo: titulo.trim(),
        categoria,
        prioridade,
        mensagem: mensagem.trim(),
        ativo: true,
      },
    ]);

    setSalvando(false);

    if (error) {
      alert(error.message);
      return;
    }

    setTitulo("");
    setMensagem("");
    carregar();
  }

  function estiloPrioridade(prioridade: string) {
    switch (prioridade) {
      case "URGENTE":
        return "border-red-500/30 bg-red-500/10 text-red-400";
      case "ALTA":
        return "border-yellow-500/30 bg-yellow-500/10 text-yellow-400";
      default:
        return "border-cyan-500/30 bg-cyan-500/10 text-cyan-400";
    }
  }

  return (
    <div className="p-4 md:p-6 pb-24 space-y-6">
      <SigPageHeader
        titulo="Comunicação Interna"
        subtitulo="Comunicados operacionais da Guarda Municipal."
        icone={Megaphone}
      />

      <div className="grid md:grid-cols-4 gap-4">
        <SigCard>
          <Megaphone className="w-8 h-8 text-cyan-400 mb-3" />
          <h3 className="text-lg font-black text-white">Comunicados</h3>
          <p className="text-2xl font-black text-white mt-2">
            {comunicados.length}
          </p>
        </SigCard>

        <SigCard>
          <AlertTriangle className="w-8 h-8 text-red-400 mb-3" />
          <h3 className="text-lg font-black text-white">Urgentes</h3>
          <p className="text-2xl font-black text-white mt-2">
            {comunicados.filter((c) => c.prioridade === "URGENTE").length}
          </p>
        </SigCard>

        <SigCard>
          <Pin className="w-8 h-8 text-yellow-400 mb-3" />
          <h3 className="text-lg font-black text-white">Fixados</h3>
          <p className="text-2xl font-black text-white mt-2">
            {comunicados.filter((c) => c.fixado).length}
          </p>
        </SigCard>

        <SigCard>
          <ShieldCheck className="w-8 h-8 text-cyan-400 mb-3" />
          <h3 className="text-lg font-black text-white">Município</h3>
          <p className="text-sm text-yellow-400 mt-2">
            ID {usuario?.municipio_id || "-"}
          </p>
        </SigCard>
      </div>

      <div className="grid xl:grid-cols-2 gap-6">
        <SigCard>
          <h2 className="text-xl font-black text-white mb-5">
            Novo Comunicado
          </h2>

          <div className="grid md:grid-cols-2 gap-4">
            <input
              className="input"
              placeholder="Título"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
            />

            <select
              className="input"
              value={categoria}
              onChange={(e) => setCategoria(e.target.value)}
            >
              <option>COMUNICADO</option>
              <option>OPERACIONAL</option>
              <option>URGENTE</option>
              <option>VIATURA</option>
              <option>EQUIPAMENTO</option>
              <option>OFICIO</option>
              <option>EVENTO</option>
              <option>ESCALA</option>
            </select>

            <select
              className="input md:col-span-2"
              value={prioridade}
              onChange={(e) => setPrioridade(e.target.value)}
            >
              <option>NORMAL</option>
              <option>ALTA</option>
              <option>URGENTE</option>
            </select>
          </div>

          <textarea
            className="input mt-4 min-h-44 resize-none"
            placeholder="Mensagem"
            value={mensagem}
            onChange={(e) => setMensagem(e.target.value)}
          />

          <button
            onClick={salvar}
            disabled={salvando}
            className="mt-4 inline-flex items-center justify-center gap-2 rounded-xl bg-cyan-500 px-6 py-3 text-sm font-black text-slate-950 hover:bg-cyan-400 transition disabled:opacity-50"
          >
            <Send className="w-5 h-5" />
            {salvando ? "Salvando..." : "Publicar Comunicado"}
          </button>
        </SigCard>

        <SigCard>
          <h2 className="text-xl font-black text-white mb-5">
            Últimos Comunicados
          </h2>

          <div className="space-y-4 max-h-[520px] overflow-y-auto pr-1">
            {comunicados.length === 0 ? (
              <p className="text-slate-400">
                Nenhum comunicado publicado.
              </p>
            ) : (
              comunicados.map((item) => (
                <div
                  key={item.id}
                  className="rounded-2xl border border-cyan-500/20 bg-slate-950/70 p-5"
                >
                  <div className="flex flex-wrap gap-2 mb-3">
                    <span className="rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-xs font-black text-cyan-400">
                      {item.categoria}
                    </span>

                    <span
                      className={`rounded-full border px-3 py-1 text-xs font-black ${estiloPrioridade(
                        item.prioridade
                      )}`}
                    >
                      {item.prioridade}
                    </span>

                    {item.fixado && (
                      <span className="rounded-full border border-yellow-500/30 bg-yellow-500/10 px-3 py-1 text-xs font-black text-yellow-400">
                        FIXADO
                      </span>
                    )}
                  </div>

                  <h3 className="text-xl font-black text-white">
                    {item.titulo}
                  </h3>

                  <p className="text-slate-300 mt-3 whitespace-pre-wrap">
                    {item.mensagem}
                  </p>

                  <p className="text-xs text-slate-500 mt-4">
                    {item.criado_em
                      ? new Date(item.criado_em).toLocaleString("pt-BR")
                      : ""}
                  </p>
                </div>
              ))
            )}
          </div>
        </SigCard>
      </div>
    </div>
  );
}