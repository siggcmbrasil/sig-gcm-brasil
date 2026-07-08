"use client";

import { useState } from "react";
import {
  Printer,
  Save,
  UserCheck,
  ShieldCheck,
} from "lucide-react";

export default function TermoEntregaMenorPage() {
  const [form, setForm] = useState({
    numero: "",
    data: new Date().toISOString().substring(0, 10),
    hora: "",
    local: "",
    nomeMenor: "",
    idade: "",
    cpfMenor: "",
    nomeResponsavel: "",
    parentesco: "",
    cpfResponsavel: "",
    telefone: "",
    motivo: "",
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
          <UserCheck className="text-cyan-400" />
          Termo de Entrega de Menor
        </h1>

        <p className="text-slate-400 mt-2">
          Registro de entrega de menor ao seu responsável legal.
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
          placeholder="Local da entrega"
          className="input"
          value={form.local}
          onChange={alterar}
        />

        <h2 className="text-xl font-black text-cyan-400 mt-4">
          Dados do Menor
        </h2>

        <input
          name="nomeMenor"
          placeholder="Nome do menor"
          className="input"
          value={form.nomeMenor}
          onChange={alterar}
        />

        <div className="grid md:grid-cols-2 gap-4">
          <input
            name="idade"
            placeholder="Idade"
            className="input"
            value={form.idade}
            onChange={alterar}
          />

          <input
            name="cpfMenor"
            placeholder="CPF (se houver)"
            className="input"
            value={form.cpfMenor}
            onChange={alterar}
          />
        </div>

        <h2 className="text-xl font-black text-cyan-400 mt-4">
          Responsável Legal
        </h2>

        <input
          name="nomeResponsavel"
          placeholder="Nome do responsável"
          className="input"
          value={form.nomeResponsavel}
          onChange={alterar}
        />

        <div className="grid md:grid-cols-2 gap-4">
          <input
            name="parentesco"
            placeholder="Parentesco"
            className="input"
            value={form.parentesco}
            onChange={alterar}
          />

          <input
            name="cpfResponsavel"
            placeholder="CPF do responsável"
            className="input"
            value={form.cpfResponsavel}
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
          name="motivo"
          placeholder="Motivo da entrega"
          className="input h-28"
          value={form.motivo}
          onChange={alterar}
        />

        <textarea
          name="observacoes"
          placeholder="Observações"
          className="input h-32"
          value={form.observacoes}
          onChange={alterar}
        />

        <div className="bg-blue-950/40 border border-blue-700 rounded-xl p-4">
          <p className="text-blue-300 font-bold flex items-center gap-2">
            <ShieldCheck size={18} />
            Declaro que recebi o menor acima identificado,
            assumindo integral responsabilidade por sua guarda.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 pt-6">
          <div className="border-t border-slate-700 pt-3 text-center">
            Assinatura do Responsável
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