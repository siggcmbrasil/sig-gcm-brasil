"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Package, PlusCircle, MinusCircle, AlertTriangle, Search } from "lucide-react";
import { CALIBRES_ARMA_FOGO } from "@/lib/bases/armas";

const observacoesRapidas = [
  "Entrada registrada para controle administrativo.",
  "Saída registrada vinculada à cautela/serviço.",
  "Munições conferidas no ato do registro.",
  "Lote armazenado na armaria.",
  "Necessário acompanhar validade/lote.",
  "Registro realizado pelo responsável do setor.",
];

const quantidadesRapidas = ["1", "5", "10", "15", "20", "25", "50", "100"];

export default function MunicoesArmamentoPage() {
  const [movimentos, setMovimentos] = useState<any[]>([]);
  const [busca, setBusca] = useState("");
  const [salvando, setSalvando] = useState(false);

  const [calibre, setCalibre] = useState("");
  const [quantidade, setQuantidade] = useState("");
  const [tipoMovimento, setTipoMovimento] = useState("ENTRADA");
  const [lote, setLote] = useState("");
  const [validade, setValidade] = useState("");
  const [observacao, setObservacao] = useState("");

  const usuario =
    typeof window !== "undefined"
      ? JSON.parse(localStorage.getItem("usuarioLogado") || "{}")
      : {};

  async function carregar() {
    if (!usuario?.municipio_id) return;

    const { data } = await supabase
      .from("municoes_armamento")
      .select("*")
      .eq("municipio_id", usuario.municipio_id)
      .order("criado_em", { ascending: false });

    setMovimentos(data || []);
  }

  useEffect(() => {
    carregar();
  }, []);

  const estoque = useMemo(() => {
    const mapa = new Map<string, any>();

    movimentos.forEach((m) => {
      const chave = `${m.calibre}-${m.lote || "SEM_LOTE"}`;

      if (!mapa.has(chave)) {
        mapa.set(chave, {
          calibre: m.calibre,
          lote: m.lote || "Sem lote",
          validade: m.validade,
          quantidade: 0,
        });
      }

      const atual = mapa.get(chave);
      const qtd = Number(m.quantidade || 0);

      if (m.tipo_movimento === "ENTRADA") atual.quantidade += qtd;
      if (m.tipo_movimento === "SAIDA") atual.quantidade -= qtd;

      mapa.set(chave, atual);
    });

    return Array.from(mapa.values());
  }, [movimentos]);

  const resumo = useMemo(() => {
    return {
      lotes: estoque.length,
      total: estoque.reduce((acc, item) => acc + Number(item.quantidade || 0), 0),
      entradas: movimentos.filter((m) => m.tipo_movimento === "ENTRADA").length,
      saidas: movimentos.filter((m) => m.tipo_movimento === "SAIDA").length,
    };
  }, [estoque, movimentos]);

  const movimentosFiltrados = movimentos.filter((item) => {
    const texto = `
      ${item.calibre || ""}
      ${item.tipo_movimento || ""}
      ${item.lote || ""}
      ${item.validade || ""}
      ${item.observacao || ""}
    `.toLowerCase();

    return texto.includes(busca.toLowerCase());
  });

  function adicionarObservacao(texto: string) {
    setObservacao((atual) => (atual ? `${atual}\n${texto}` : texto));
  }

  function limpar() {
    setCalibre("");
    setQuantidade("");
    setTipoMovimento("ENTRADA");
    setLote("");
    setValidade("");
    setObservacao("");
  }

  async function salvar() {
    if (!calibre) return alert("Selecione o calibre.");
    if (!quantidade || Number(quantidade) <= 0) return alert("Informe a quantidade.");

    setSalvando(true);

    const { error } = await supabase.from("municoes_armamento").insert([
      {
        municipio_id: usuario.municipio_id,
        criado_por: usuario.id,
        calibre,
        quantidade: Number(quantidade),
        tipo_movimento: tipoMovimento,
        lote: lote.trim() || null,
        validade: validade || null,
        observacao: observacao.trim() || null,
      },
    ]);

    setSalvando(false);

    if (error) return alert(error.message);

    limpar();
    carregar();
    alert("Movimentação de munição registrada com sucesso.");
  }

  return (
    <div className="p-4 md:p-6 pb-24 space-y-6">
      <div className="painel-premium p-6">
        <p className="text-sm text-slate-400 font-semibold">
          Controle Administrativo
        </p>

        <h1 className="text-2xl md:text-3xl font-black text-white">
          📦 Munições
        </h1>

        <p className="text-slate-400 mt-2">
          Controle administrativo de entradas, saídas, lotes, validade e saldo.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card titulo="Lotes" valor={String(resumo.lotes)} icone={Package} />
        <Card titulo="Saldo Total" valor={String(resumo.total)} icone={AlertTriangle} />
        <Card titulo="Entradas" valor={String(resumo.entradas)} icone={PlusCircle} />
        <Card titulo="Saídas" valor={String(resumo.saidas)} icone={MinusCircle} />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="painel-premium p-6 lg:col-span-1">
          <h2 className="text-xl font-black text-white">Nova Movimentação</h2>

          <div className="space-y-4 mt-5">
            <div>
              <label className="label">Tipo</label>
              <select
                className="input"
                value={tipoMovimento}
                onChange={(e) => setTipoMovimento(e.target.value)}
              >
                <option value="ENTRADA">Entrada</option>
                <option value="SAIDA">Saída</option>
              </select>
            </div>

            <div>
              <label className="label">Calibre</label>
              <select
                className="input"
                value={calibre}
                onChange={(e) => setCalibre(e.target.value)}
              >
                <option value="">Selecione</option>

                {CALIBRES_ARMA_FOGO.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>

            <Campo
              label="Quantidade"
              valor={quantidade}
              setValor={(valor) => setQuantidade(valor.replace(/\D/g, ""))}
              placeholder="Ex: 50"
              type="number"
            />

            <div>
              <label className="label">Quantidades rápidas</label>
              <div className="flex flex-wrap gap-2 mt-2">
                {quantidadesRapidas.map((qtd) => (
                  <button
                    key={qtd}
                    type="button"
                    onClick={() => setQuantidade(qtd)}
                    className="rounded-xl bg-slate-900 border border-slate-700 px-3 py-2 text-xs text-slate-200 hover:border-yellow-500"
                  >
                    {qtd}
                  </button>
                ))}
              </div>
            </div>

            <Campo label="Lote" valor={lote} setValor={setLote} placeholder="Ex: LOTE-2026-001" />

            <div>
              <label className="label">Validade</label>
              <input
                type="date"
                className="input"
                value={validade}
                onChange={(e) => setValidade(e.target.value)}
              />
            </div>

            <div>
              <label className="label">Observações</label>
              <textarea
                className="input min-h-[120px]"
                value={observacao}
                onChange={(e) => setObservacao(e.target.value)}
                placeholder="Observações administrativas..."
              />
            </div>

            <div>
              <label className="label">Preenchimento rápido</label>
              <div className="flex flex-wrap gap-2 mt-2">
                {observacoesRapidas.map((texto) => (
                  <button
                    key={texto}
                    type="button"
                    onClick={() => adicionarObservacao(texto)}
                    className="rounded-xl bg-slate-900 border border-slate-700 px-3 py-2 text-xs text-slate-200 hover:border-yellow-500"
                  >
                    {texto}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={salvar}
              disabled={salvando}
              className="sig-btn-gold w-full disabled:opacity-50"
            >
              {salvando ? "Salvando..." : "Registrar Movimento"}
            </button>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-4">
          <div className="painel-premium p-6">
            <h2 className="text-xl font-black text-white mb-4">
              Estoque por Lote
            </h2>

            <div className="grid md:grid-cols-2 gap-3">
              {estoque.length === 0 ? (
                <p className="text-slate-400">Nenhum lote registrado.</p>
              ) : (
                estoque.map((item, index) => (
                  <div
                    key={index}
                    className="rounded-2xl bg-slate-900/70 border border-slate-800 p-4"
                  >
                    <p className="text-slate-400 text-sm">{item.calibre}</p>
                    <h3 className="text-white font-black text-xl">
                      {item.quantidade} unidades
                    </h3>
                    <p className="text-slate-500 text-sm">
                      Lote: {item.lote}
                    </p>
                    <p className="text-slate-500 text-sm">
                      Validade:{" "}
                      {item.validade
                        ? new Date(item.validade).toLocaleDateString("pt-BR")
                        : "N/I"}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="painel-premium p-6">
            <div className="flex items-center gap-3 mb-4">
              <Search className="w-5 h-5 text-slate-400" />
              <h2 className="text-xl font-black text-white">
                Histórico de Movimentações
              </h2>
            </div>

            <input
              className="input"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar por calibre, lote, tipo ou observação..."
            />
          </div>

          {movimentosFiltrados.length === 0 ? (
            <div className="painel-premium p-10 text-center">
              <p className="text-6xl mb-3">📦</p>
              <h2 className="text-white text-xl font-black">
                Nenhuma movimentação encontrada
              </h2>
            </div>
          ) : (
            <div className="grid xl:grid-cols-2 gap-4">
              {movimentosFiltrados.map((item) => (
                <div
                  key={item.id}
                  className="rounded-3xl border border-slate-800 bg-slate-950/70 p-5 shadow-xl"
                >
                  <div className="flex justify-between gap-3">
                    <div>
                      <p className="text-slate-400 text-sm">{item.calibre}</p>
                      <h3 className="text-xl font-black text-white">
                        {item.quantidade} unidades
                      </h3>
                      <p className="text-slate-500 text-sm">
                        Lote: {item.lote || "N/I"}
                      </p>
                    </div>

                    <span
                      className={`h-fit rounded-full border px-3 py-1 text-xs font-bold ${
                        item.tipo_movimento === "ENTRADA"
                          ? "bg-green-950 text-green-300 border-green-800"
                          : "bg-red-950 text-red-300 border-red-800"
                      }`}
                    >
                      {item.tipo_movimento}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mt-4">
                    <Info
                      titulo="Validade"
                      valor={
                        item.validade
                          ? new Date(item.validade).toLocaleDateString("pt-BR")
                          : "N/I"
                      }
                    />
                    <Info
                      titulo="Data"
                      valor={
                        item.criado_em
                          ? new Date(item.criado_em).toLocaleDateString("pt-BR")
                          : "N/I"
                      }
                    />
                  </div>

                  {item.observacao && (
                    <p className="text-slate-300 text-sm mt-4 whitespace-pre-wrap">
                      {item.observacao}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Campo({
  label,
  valor,
  setValor,
  placeholder,
  type = "text",
}: {
  label: string;
  valor: string;
  setValor: (valor: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <div>
      <label className="label">{label}</label>
      <input
        type={type}
        className="input"
        value={valor}
        onChange={(e) => setValor(e.target.value)}
        placeholder={placeholder}
      />
    </div>
  );
}

function Card({
  titulo,
  valor,
  icone: Icone,
}: {
  titulo: string;
  valor: string;
  icone: any;
}) {
  return (
    <div className="painel-premium p-5">
      <div className="flex justify-between items-center">
        <div>
          <p className="text-slate-400 text-sm">{titulo}</p>
          <h2 className="text-2xl md:text-3xl font-black text-white">{valor}</h2>
        </div>

        <Icone className="w-7 h-7 text-yellow-400" />
      </div>
    </div>
  );
}

function Info({ titulo, valor }: { titulo: string; valor: string }) {
  return (
    <div className="rounded-xl bg-slate-900/70 p-3">
      <p className="text-slate-500 text-xs">{titulo}</p>
      <p className="text-slate-200 font-bold text-sm">{valor}</p>
    </div>
  );
}