"use client";

import { useState } from "react";
import {
  Download,
  Printer,
  Save,
  ShieldCheck,
} from "lucide-react";

export default function TermoRecebimentoPage() {
  const [form, setForm] = useState({
    numero: "",
    data: new Date().toISOString().substring(0, 10),
    local: "",
    recebedor: "",
    cpf: "",
    rg: "",
    telefone: "",
    endereco: "",
    objeto: "",
    origem: "",
    observacoes: "",
  });

  function alterar(
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement
    >
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
          <Download className="text-cyan-400" />
          Termo de Recebimento
        </h1>

        <p className="text-slate-400 mt-2">
          Registro formal de recebimento de objeto,
          documento, material ou equipamento.
        </p>
      </div>

      <div className="painel-premium p-6 space-y-4">
        <div className="grid md:grid-cols-3 gap-4">
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

          <input
            name="local"
            placeholder="Local"
            className="input"
            value={form.local}
            onChange={alterar}
          />
        </div>

        <h2 className="text-xl font-black text-cyan-400">
          Dados do Recebedor
        </h2>

        <input
          name="recebedor"
          placeholder="Nome completo"
          className="input"
          value={form.recebedor}
          onChange={alterar}
        />

        <div className="grid md:grid-cols-3 gap-4">
          <input
            name="cpf"
            placeholder="CPF"
            className="input"
            value={form.cpf}
            onChange={alterar}
          />

          <input
            name="rg"
            placeholder="RG"
            className="input"
            value={form.rg}
            onChange={alterar}
          />

          <input
            name="telefone"
            placeholder="Telefone"
            className="input"
            value={form.telefone}
            onChange={alterar}
          />
        </div>

        <input
          name="endereco"
          placeholder="Endereço"
          className="input"
          value={form.endereco}
          onChange={alterar}
        />

        <h2 className="text-xl font-black text-cyan-400">
          Objeto Recebido
        </h2>

        <textarea
          name="objeto"
          placeholder="Descrição detalhada do objeto"
          className="input h-28"
          value={form.objeto}
          onChange={alterar}
        />

        <input
          name="origem"
          placeholder="Origem do objeto/documento"
          className="input"
          value={form.origem}
          onChange={alterar}
        />

        <textarea
          name="observacoes"
          placeholder="Observações"
          className="input h-32"
          value={form.observacoes}
          onChange={alterar}
        />

        <div className="bg-green-950/40 border border-green-700 rounded-xl p-4">
          <p className="text-green-300 font-bold flex items-center gap-2">
            <ShieldCheck size={18} />
            Declaro que recebi o objeto acima descrito,
            estando ciente de seu estado e das informações
            constantes neste termo.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 pt-6">
          <div className="border-t border-slate-700 pt-3 text-center">
            Assinatura do Recebedor
          </div>

          <div className="border-t border-slate-700 pt-3 text-center">
            Assinatura da Guarda Municipal
          </div>
        </div>

        <div className="flex flex-wrap gap-3 pt-4">
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