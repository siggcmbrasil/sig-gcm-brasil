"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

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
    if (usuario?.municipio_id) {
      carregar();
    }
  }, []);

  async function salvar() {
    if (!titulo || !mensagem) {
      alert("Preencha título e mensagem.");
      return;
    }

    setSalvando(true);

    const { error } = await supabase
      .from("comunicados_internos")
      .insert([
        {
          municipio_id: usuario.municipio_id,
          criado_por: usuario.id,
          titulo,
          categoria,
          prioridade,
          mensagem,
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

  function corPrioridade(prioridade: string) {
    switch (prioridade) {
      case "URGENTE":
        return "bg-red-600";

      case "ALTA":
        return "bg-yellow-500";

      default:
        return "bg-blue-600";
    }
  }

  return (
    <div className="p-6">
      <div className="painel-premium p-6 mb-6">
        <h1 className="text-3xl font-black">
          Comunicação Interna
        </h1>

        <p className="text-slate-400 mt-2">
          Comunicados operacionais da Guarda Municipal.
        </p>
      </div>

      <div className="painel-premium p-6 mb-6">
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
            className="input"
            value={prioridade}
            onChange={(e) => setPrioridade(e.target.value)}
          >
            <option>NORMAL</option>
            <option>ALTA</option>
            <option>URGENTE</option>
          </select>
        </div>

        <textarea
          className="input mt-4 min-h-40"
          placeholder="Mensagem"
          value={mensagem}
          onChange={(e) => setMensagem(e.target.value)}
        />

        <button
          onClick={salvar}
          className="sig-btn-gold mt-4"
        >
          {salvando ? "Salvando..." : "Publicar Comunicado"}
        </button>
      </div>

      <div className="space-y-4">
        {comunicados.map((item) => (
          <div
            key={item.id}
            className="painel-premium p-5"
          >
            <div className="flex flex-wrap gap-2 mb-3">
              <span className="bg-blue-700 px-3 py-1 rounded-full text-xs font-bold">
                {item.categoria}
              </span>

              <span
                className={`${corPrioridade(
                  item.prioridade
                )} px-3 py-1 rounded-full text-xs font-bold`}
              >
                {item.prioridade}
              </span>

              {item.fixado && (
                <span className="bg-yellow-600 px-3 py-1 rounded-full text-xs font-bold">
                  FIXADO
                </span>
              )}
            </div>

            <h2 className="text-xl font-black">
              {item.titulo}
            </h2>

            <p className="text-slate-300 mt-3 whitespace-pre-wrap">
              {item.mensagem}
            </p>

            <p className="text-xs text-slate-500 mt-4">
              {new Date(item.criado_em).toLocaleString("pt-BR")}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}