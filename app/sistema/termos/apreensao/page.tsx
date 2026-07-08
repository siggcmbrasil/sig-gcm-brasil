"use client";

import { useState } from "react";
import {
  Package,
  Printer,
  Save,
} from "lucide-react";

export default function TermoApreensaoPage() {
  const [form, setForm] = useState({
    numero: "",
    data: new Date().toISOString().substring(0, 10),
    local: "",
    responsavel: "",
    cpf: "",
    objeto: "",
    quantidade: "",
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

  function imprimir() {
    window.print();
  }

  function salvar() {
    alert(
      "Depois iremos salvar no banco de dados."
    );
  }

  return (
    <div className="p-6 text-white space-y-6">
      <div className="painel-premium p-6">
        <h1 className="text-3xl font-black flex items-center gap-3">
          <Package className="text-cyan-400" />
          Termo de Apreensão
        </h1>

        <p className="text-slate-400 mt-2">
          Registro de objetos e materiais
          apreendidos pela Guarda Municipal.
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
          placeholder="Local da apreensão"
          className="input"
          value={form.local}
          onChange={alterar}
        />

        <input
          name="responsavel"
          placeholder="Responsável"
          className="input"
          value={form.responsavel}
          onChange={alterar}
        />

        <input
          name="cpf"
          placeholder="CPF"
          className="input"
          value={form.cpf}
          onChange={alterar}
        />

        <textarea
          name="objeto"
          placeholder="Objeto apreendido"
          className="input h-28"
          value={form.objeto}
          onChange={alterar}
        />

        <input
          name="quantidade"
          placeholder="Quantidade"
          className="input"
          value={form.quantidade}
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

      <div className="painel-premium p-6">
        <h2 className="font-black text-xl mb-4">
          Dados que iremos adicionar depois
        </h2>

        <ul className="space-y-2 text-slate-400">
          <li>• Assinatura digital</li>
          <li>• QR Code de validação</li>
          <li>• Fotos dos objetos</li>
          <li>• Cadeia de custódia</li>
          <li>• PDF institucional</li>
          <li>• Integração com Ocorrências</li>
          <li>• Integração com Objetos Apreendidos</li>
          <li>• Auditoria completa</li>
        </ul>
      </div>
    </div>
  );
}