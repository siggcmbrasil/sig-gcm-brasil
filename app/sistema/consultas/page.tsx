"use client";

import { useState } from "react";
import { Search, ShieldAlert, Car, User, FileSearch } from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function ConsultasPage() {
  const [tipo, setTipo] = useState("CPF");
  const [valor, setValor] = useState("");
  const [motivo, setMotivo] = useState("");
  const [resultado, setResultado] = useState(false);

  async function consultar() {
  if (!valor.trim() || !motivo.trim()) {
    alert("Informe o dado da consulta e o motivo.");
    return;
  }

  const usuarioLogado = JSON.parse(
    localStorage.getItem("usuarioLogado") || "{}"
  );

  const payload = {
    municipio_id: usuarioLogado?.municipio_id,
    usuario_id: String(usuarioLogado?.id || ""),
    tipo,
    consulta: valor,
    motivo,
    resultado: "EM_DESENVOLVIMENTO",
  };

  console.log("PAYLOAD CONSULTA:", payload);

  const { data, error } = await supabase
    .from("consultas_operacionais")
    .insert(payload)
    .select();

  if (error) {
    console.log("ERRO SUPABASE:", error);
    alert(
      `Erro ao registrar consulta: ${
        error.message || error.details || error.hint || "erro desconhecido"
      }`
    );
    return;
  }

  console.log("CONSULTA SALVA:", data);

  setResultado(true);
}

  return (
    <main className="min-h-screen bg-[#020b1c] text-white p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-black flex items-center gap-2">
          <FileSearch className="text-yellow-400" />
          Consultas Integradas
        </h1>

        <p className="text-slate-400 mt-1">
          Consulta operacional de CPF, placa, RENAVAM e registros globais do SIG-GCM Brasil.
        </p>
      </div>

      <div className="rounded-2xl border border-yellow-500/30 bg-yellow-500/10 p-4 text-yellow-100">
        <div className="flex items-center gap-2 font-black">
          <ShieldAlert size={20} />
          Módulo preparado para integração oficial
        </div>

        <p className="text-sm mt-2 text-yellow-100/80">
          Este recurso será integrado futuramente por convênio autorizado com órgãos oficiais
          e pela rede global SIG-GCM Brasil.
        </p>
      </div>

      <section className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {["CPF", "PLACA", "RENAVAM", "TELEFONE"].map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => {
              setTipo(item);
              setResultado(false);
            }}
            className={`rounded-2xl p-4 border transition ${
              tipo === item
                ? "bg-yellow-500 text-slate-950 border-yellow-400"
                : "bg-slate-900 text-white border-slate-700 hover:bg-slate-800"
            }`}
          >
            <div className="flex items-center justify-center gap-2 font-black">
              {item === "PLACA" ? <Car size={18} /> : <User size={18} />}
              {item}
            </div>
          </button>
        ))}
      </section>

      <section className="rounded-2xl bg-slate-900 border border-slate-700 p-5 space-y-4">
        <div>
          <label className="text-sm text-slate-400">
            Dado para consulta
          </label>

          <input
            value={valor}
            onChange={(e) => setValor(e.target.value)}
            placeholder={
              tipo === "PLACA"
                ? "Digite a placa"
                : tipo === "CPF"
                ? "Digite o CPF"
                : `Digite ${tipo}`
            }
            className="w-full mt-1 rounded-xl bg-slate-950 border border-slate-700 p-3 text-white outline-none focus:border-yellow-400"
          />
        </div>

        <div>
          <label className="text-sm text-slate-400">
            Motivo da consulta
          </label>

          <input
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            placeholder="Ex: abordagem, ocorrência, averiguação operacional..."
            className="w-full mt-1 rounded-xl bg-slate-950 border border-slate-700 p-3 text-white outline-none focus:border-yellow-400"
          />
        </div>

        <button
          type="button"
          onClick={consultar}
          className="w-full rounded-xl bg-yellow-500 text-slate-950 font-black p-3 hover:bg-yellow-400 transition flex items-center justify-center gap-2"
        >
          <Search size={18} />
          Consultar
        </button>
      </section>

      {resultado && (
        <section className="rounded-2xl border border-blue-500/30 bg-blue-500/10 p-5 text-blue-100">
          <h2 className="text-xl font-black mb-2">
            Consulta registrada
          </h2>

          <p>
            <strong>Tipo:</strong> {tipo}
          </p>

          <p>
            <strong>Consulta:</strong> {valor}
          </p>

          <div className="mt-4 rounded-xl bg-slate-950 border border-slate-700 p-4">
            <p className="font-black text-yellow-300">
              ⚠️ Consulta oficial em desenvolvimento
            </p>

            <p className="text-sm text-slate-300 mt-2">
              Este módulo está preparado para consulta de placa, CPF e registros globais
              entre municípios participantes, sem expor dados completos de ocorrências.
            </p>
          </div>
        </section>
      )}
    </main>
  );
}