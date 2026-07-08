"use client";

import { useState } from "react";
import {
  CircleAlert,
  Printer,
  Save,
  ShieldAlert,
} from "lucide-react";

export default function TermoRecusaPage() {
  const [form, setForm] = useState({
    numero: "",
    data: new Date().toISOString().substring(0, 10),
    hora: "",
    local: "",
    nome: "",
    cpf: "",
    rg: "",
    telefone: "",
    motivoRecusa: "",
    objeto: "",
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
          <CircleAlert className="text-red-400" />
          Termo de Recusa
        </h1>

        <p className="text-slate-400 mt-2">
          Registro formal da recusa de recebimento, assinatura ou retirada de
          objeto, documento ou bem.
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
          placeholder="Local"
          className="input"
          value={form.local}
          onChange={alterar}
        />

        <h2 className="text-xl font-black text-cyan-400">
          Dados da Pessoa
        </h2>

        <input
          name="nome"
          placeholder="Nome completo"
          className="input"
          value={form.nome}
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

        <textarea
          name="objeto"
          placeholder="Objeto, documento ou situação recusada"
          className="input h-28"
          value={form.objeto}
          onChange={alterar}
        />

        <textarea
          name="motivoRecusa"
          placeholder="Motivo alegado para a recusa"
          className="input h-28"
          value={form.motivoRecusa}
          onChange={alterar}
        />

        <textarea
          name="observacoes"
          placeholder="Observações"
          className="input h-32"
          value={form.observacoes}
          onChange={alterar}
        />

        <div className="bg-red-950/40 border border-red-700 rounded-xl p-4">
          <p className="text-red-300 font-bold flex items-center gap-2">
            <ShieldAlert size={18} />
            Fica registrado que a pessoa acima identificada recusou o
            recebimento, assinatura ou retirada do objeto/documento descrito,
            sendo este termo lavrado para fins de comprovação administrativa.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 pt-6">
          <div className="border-t border-slate-700 pt-3 text-center">
            Assinatura do Interessado
          </div>

          <div className="border-t border-slate-700 pt-3 text-center">
            Assinatura da Testemunha
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