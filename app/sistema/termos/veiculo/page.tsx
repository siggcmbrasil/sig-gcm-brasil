"use client";

import { useState } from "react";
import {
  Car,
  Printer,
  Save,
  ShieldCheck,
} from "lucide-react";

export default function TermoVeiculoPage() {
  const [form, setForm] = useState({
    numero: "",
    data: new Date().toISOString().substring(0, 10),
    hora: "",
    local: "",
    placa: "",
    marcaModelo: "",
    cor: "",
    ano: "",
    renavam: "",
    chassi: "",
    proprietario: "",
    cpf: "",
    condutor: "",
    motivo: "",
    destino: "",
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
          <Car className="text-cyan-400" />
          Termo de Recolhimento de Veículo
        </h1>

        <p className="text-slate-400 mt-2">
          Registro de remoção, apreensão ou recolhimento
          de veículo pela Guarda Municipal.
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
          placeholder="Local do recolhimento"
          className="input"
          value={form.local}
          onChange={alterar}
        />

        <h2 className="text-xl font-black text-cyan-400">
          Dados do Veículo
        </h2>

        <div className="grid md:grid-cols-2 gap-4">
          <input
            name="placa"
            placeholder="Placa"
            className="input"
            value={form.placa}
            onChange={alterar}
          />

          <input
            name="marcaModelo"
            placeholder="Marca / Modelo"
            className="input"
            value={form.marcaModelo}
            onChange={alterar}
          />
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          <input
            name="cor"
            placeholder="Cor"
            className="input"
            value={form.cor}
            onChange={alterar}
          />

          <input
            name="ano"
            placeholder="Ano"
            className="input"
            value={form.ano}
            onChange={alterar}
          />

          <input
            name="renavam"
            placeholder="RENAVAM"
            className="input"
            value={form.renavam}
            onChange={alterar}
          />
        </div>

        <input
          name="chassi"
          placeholder="Chassi"
          className="input"
          value={form.chassi}
          onChange={alterar}
        />

        <h2 className="text-xl font-black text-cyan-400">
          Proprietário / Condutor
        </h2>

        <input
          name="proprietario"
          placeholder="Nome do proprietário"
          className="input"
          value={form.proprietario}
          onChange={alterar}
        />

        <input
          name="cpf"
          placeholder="CPF do proprietário"
          className="input"
          value={form.cpf}
          onChange={alterar}
        />

        <input
          name="condutor"
          placeholder="Nome do condutor"
          className="input"
          value={form.condutor}
          onChange={alterar}
        />

        <textarea
          name="motivo"
          placeholder="Motivo do recolhimento"
          className="input h-28"
          value={form.motivo}
          onChange={alterar}
        />

        <input
          name="destino"
          placeholder="Pátio ou local de destino"
          className="input"
          value={form.destino}
          onChange={alterar}
        />

        <textarea
          name="observacoes"
          placeholder="Observações"
          className="input h-32"
          value={form.observacoes}
          onChange={alterar}
        />

        <div className="bg-yellow-950/40 border border-yellow-700 rounded-xl p-4">
          <p className="text-yellow-300 font-bold flex items-center gap-2">
            <ShieldCheck size={18} />
            O veículo acima descrito foi recolhido e ficará sob
            responsabilidade da autoridade competente até sua
            liberação ou destinação legal.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 pt-6">
          <div className="border-t border-slate-700 pt-3 text-center">
            Proprietário / Condutor
          </div>

          <div className="border-t border-slate-700 pt-3 text-center">
            Guarda Municipal
          </div>

          <div className="border-t border-slate-700 pt-3 text-center">
            Testemunha
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