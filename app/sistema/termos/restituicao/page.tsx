"use client";

import { useState } from "react";
import {
  ClipboardCheck,
  Printer,
  Save,
  ShieldCheck,
} from "lucide-react";

export default function TermoRestituicaoPage() {
  const [form, setForm] = useState({
    numero: "",
    data: new Date().toISOString().substring(0, 10),
    hora: "",
    local: "",
    restituidoPara: "",
    cpf: "",
    rg: "",
    telefone: "",
    endereco: "",
    objeto: "",
    termoOrigem: "",
    motivoRestituicao: "",
    autoridade: "",
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
          <ClipboardCheck className="text-cyan-400" />
          Termo de Restituição
        </h1>

        <p className="text-slate-400 mt-2">
          Registro formal de restituição de objeto, documento, material ou bem
          ao proprietário, responsável legal ou pessoa autorizada.
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
            type="time"
            name="hora"
            className="input"
            value={form.hora}
            onChange={alterar}
          />
        </div>

        <input
          name="local"
          placeholder="Local da restituição"
          className="input"
          value={form.local}
          onChange={alterar}
        />

        <h2 className="text-xl font-black text-cyan-400">
          Dados de Quem Recebeu
        </h2>

        <input
          name="restituidoPara"
          placeholder="Nome completo"
          className="input"
          value={form.restituidoPara}
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
          Objeto Restituído
        </h2>

        <textarea
          name="objeto"
          placeholder="Descrição detalhada do objeto, documento, material ou bem restituído"
          className="input h-28"
          value={form.objeto}
          onChange={alterar}
        />

        <input
          name="termoOrigem"
          placeholder="Termo de origem. Ex: apreensão nº 001/2026"
          className="input"
          value={form.termoOrigem}
          onChange={alterar}
        />

        <textarea
          name="motivoRestituicao"
          placeholder="Motivo/fundamento da restituição"
          className="input h-28"
          value={form.motivoRestituicao}
          onChange={alterar}
        />

        <input
          name="autoridade"
          placeholder="Autoridade/servidor responsável pela restituição"
          className="input"
          value={form.autoridade}
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
            Declaro que o bem descrito neste termo foi restituído mediante
            conferência, identificação do recebedor e ciência das condições de
            entrega.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 pt-6">
          <div className="border-t border-slate-700 pt-3 text-center">
            Assinatura de Quem Recebeu
          </div>

          <div className="border-t border-slate-700 pt-3 text-center">
            Assinatura do Servidor
          </div>

          <div className="border-t border-slate-700 pt-3 text-center">
            Assinatura da Testemunha
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