"use client";

import { useState } from "react";
import {
  Archive,
  Printer,
  Save,
  Shield,
} from "lucide-react";

export default function TermoDepositoPage() {
  const [form, setForm] = useState({
    numero: "",
    data: new Date().toISOString().substring(0, 10),
    localDeposito: "",
    responsavel: "",
    cpf: "",
    objeto: "",
    quantidade: "",
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
    alert(
      "Depois iremos salvar no banco de dados."
    );
  }

  function imprimir() {
    window.print();
  }

  return (
    <div className="p-6 text-white space-y-6">
      <div className="painel-premium p-6">
        <h1 className="text-3xl font-black flex items-center gap-3">
          <Archive className="text-cyan-400" />
          Termo de Guarda e Depósito
        </h1>

        <p className="text-slate-400 mt-2">
          Registro de materiais, objetos ou bens
          que permanecerão sob guarda da Guarda Municipal.
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
          name="localDeposito"
          placeholder="Local do depósito"
          className="input"
          value={form.localDeposito}
          onChange={alterar}
        />

        <div className="grid md:grid-cols-2 gap-4">
          <input
            name="responsavel"
            placeholder="Responsável pelo depósito"
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
        </div>

        <textarea
          name="objeto"
          placeholder="Descrição dos objetos depositados"
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

        <input
          name="origem"
          placeholder="Origem da apreensão ou recolhimento"
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

        <div className="bg-blue-950/40 border border-blue-700 rounded-xl p-4">
          <p className="flex items-center gap-2 text-blue-300 font-bold">
            <Shield size={18} />
            Declaro que os objetos acima permanecerão
            sob guarda institucional até sua destinação
            legal ou devolução.
          </p>
        </div>

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
        <h2 className="text-xl font-black mb-4">
          Futuras Implementações
        </h2>

        <ul className="space-y-2 text-slate-400">
          <li>• Integração com Objetos Apreendidos</li>
          <li>• QR Code de rastreio</li>
          <li>• Fotos dos objetos</li>
          <li>• Cadeia de custódia</li>
          <li>• Assinaturas digitais</li>
          <li>• Histórico de movimentação</li>
          <li>• PDF institucional</li>
          <li>• Auditoria completa</li>
        </ul>
      </div>
    </div>
  );
}