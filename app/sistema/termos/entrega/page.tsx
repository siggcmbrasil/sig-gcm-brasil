"use client";

import { useState } from "react";
import { Handshake, Printer, Save } from "lucide-react";

export default function TermoEntregaPage() {
  const [form, setForm] = useState({
    numero: "",
    data: new Date().toISOString().substring(0, 10),
    local: "",
    recebedor: "",
    cpf: "",
    telefone: "",
    objeto: "",
    motivoEntrega: "",
    observacoes: "",
  });

  function alterar(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  }

  function salvar() {
    alert("Depois iremos salvar no banco de dados.");
  }

  function imprimir() {
    window.print();
  }

  return (
    <div className="p-6 text-white space-y-6">
      <div className="painel-premium p-6">
        <h1 className="text-3xl font-black flex items-center gap-3">
          <Handshake className="text-cyan-400" />
          Termo de Entrega
        </h1>

        <p className="text-slate-400 mt-2">
          Registro formal de entrega de objeto, documento ou material.
        </p>
      </div>

      <div className="painel-premium p-6 space-y-4">
        <div className="grid md:grid-cols-2 gap-4">
          <input
            name="numero"
            placeholder="Número do termo"
            className="input"
            value={form.numero}
            onChange={alterar}
          />

          <input
            type="date"
            name="data"
            className="input"
            value={form.data}
            onChange={alterar}
          />
        </div>

        <input
          name="local"
          placeholder="Local da entrega"
          className="input"
          value={form.local}
          onChange={alterar}
        />

        <div className="grid md:grid-cols-2 gap-4">
          <input
            name="recebedor"
            placeholder="Nome de quem recebeu"
            className="input"
            value={form.recebedor}
            onChange={alterar}
          />

          <input
            name="cpf"
            placeholder="CPF"
            className="input"
            value={form.cpf}
            onChange={alterar}
          />
        </div>

        <input
          name="telefone"
          placeholder="Telefone"
          className="input"
          value={form.telefone}
          onChange={alterar}
        />

        <textarea
          name="objeto"
          placeholder="Objeto/material entregue"
          className="input h-28"
          value={form.objeto}
          onChange={alterar}
        />

        <textarea
          name="motivoEntrega"
          placeholder="Motivo da entrega"
          className="input h-28"
          value={form.motivoEntrega}
          onChange={alterar}
        />

        <textarea
          name="observacoes"
          placeholder="Observações"
          className="input h-32"
          value={form.observacoes}
          onChange={alterar}
        />

        <div className="flex flex-wrap gap-3">
          <button
            onClick={salvar}
            className="bg-green-700 hover:bg-green-800 px-5 py-3 rounded-xl font-bold flex items-center gap-2"
          >
            <Save size={18} />
            Salvar
          </button>

          <button
            onClick={imprimir}
            className="bg-blue-700 hover:bg-blue-800 px-5 py-3 rounded-xl font-bold flex items-center gap-2"
          >
            <Printer size={18} />
            Imprimir
          </button>
        </div>
      </div>
    </div>
  );
}