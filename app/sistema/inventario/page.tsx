"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";

const observacoesRapidas = [
  "Quantidade física confere com o sistema.",
  "Quantidade física menor que o sistema.",
  "Quantidade física maior que o sistema.",
  "Item não localizado fisicamente.",
  "Material danificado encontrado.",
  "Material vencido encontrado.",
  "Necessário reposição urgente.",
  "Conferência mensal realizada.",
];

export default function InventarioAlmoxarifadoPage() {
  const [entradas, setEntradas] = useState<any[]>([]);
  const [saidas, setSaidas] = useState<any[]>([]);
  const [contagens, setContagens] = useState<any[]>([]);
  const [salvando, setSalvando] = useState(false);

  const [itemSelecionado, setItemSelecionado] = useState("");
  const [quantidadeFisica, setQuantidadeFisica] = useState("");
  const [observacao, setObservacao] = useState("");

  const usuario =
    typeof window !== "undefined"
      ? JSON.parse(localStorage.getItem("usuarioLogado") || "{}")
      : {};

  async function carregar() {
    if (!usuario?.municipio_id) return;

    const { data: listaEntradas } = await supabase
      .from("almoxarifado_entradas")
      .select("*")
      .eq("municipio_id", usuario.municipio_id);

    const { data: listaSaidas } = await supabase
      .from("almoxarifado_saidas")
      .select("*")
      .eq("municipio_id", usuario.municipio_id);

    const { data: listaContagens } = await supabase
      .from("almoxarifado_inventario")
      .select("*")
      .eq("municipio_id", usuario.municipio_id)
      .order("criado_em", { ascending: false });

    setEntradas(listaEntradas || []);
    setSaidas(listaSaidas || []);
    setContagens(listaContagens || []);
  }

  useEffect(() => {
    carregar();
  }, []);

  const estoque = useMemo(() => {
    const mapa = new Map<string, any>();

    entradas.forEach((entrada) => {
      const chave = `${entrada.item}-${entrada.categoria}-${entrada.unidade}`;

      if (!mapa.has(chave)) {
        mapa.set(chave, {
          item: entrada.item,
          categoria: entrada.categoria,
          unidade: entrada.unidade,
          quantidadeSistema: 0,
          local: entrada.local,
        });
      }

      mapa.get(chave).quantidadeSistema += Number(entrada.quantidade || 0);
    });

    saidas.forEach((saida) => {
      const chave = `${saida.item}-${saida.categoria}-${saida.unidade}`;

      if (mapa.has(chave)) {
        mapa.get(chave).quantidadeSistema -= Number(saida.quantidade || 0);
      }
    });

    return Array.from(mapa.values());
  }, [entradas, saidas]);

  const itemAtual = estoque.find((item) => {
    const chave = `${item.item}-${item.categoria}-${item.unidade}`;
    return chave === itemSelecionado;
  });

  function adicionarObservacao(texto: string) {
    setObservacao((atual) => (atual ? `${atual}\n${texto}` : texto));
  }

  function usarQuantidadeSistema() {
    if (!itemAtual) return;
    setQuantidadeFisica(String(itemAtual.quantidadeSistema || 0));
    adicionarObservacao("Quantidade física confere com o sistema.");
  }

  async function registrarContagem() {
    if (!itemAtual) return alert("Selecione o material.");
    if (quantidadeFisica === "") return alert("Informe a quantidade física contada.");

    const qtdSistema = Number(itemAtual.quantidadeSistema || 0);
    const qtdFisica = Number(quantidadeFisica || 0);
    const diferenca = qtdFisica - qtdSistema;

    setSalvando(true);

    const { error } = await supabase.from("almoxarifado_inventario").insert([
      {
        municipio_id: usuario.municipio_id,
        criado_por: usuario.id,
        item: itemAtual.item,
        categoria: itemAtual.categoria,
        unidade: itemAtual.unidade,
        quantidade_sistema: qtdSistema,
        quantidade_fisica: qtdFisica,
        diferenca,
        local: itemAtual.local || null,
        observacao: observacao.trim() || null,
      },
    ]);

    setSalvando(false);

    if (error) return alert(error.message);

    setItemSelecionado("");
    setQuantidadeFisica("");
    setObservacao("");

    carregar();
    alert("Inventário registrado com sucesso.");
  }

  return (
    <div className="p-4 md:p-6 pb-24 space-y-6">
      <div className="painel-premium p-6">
        <h1 className="text-2xl md:text-3xl font-black text-white">
          📋 Inventário do Almoxarifado
        </h1>

        <p className="text-slate-400 mt-2">
          Confira a quantidade física dos materiais e compare com o saldo do sistema.
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="painel-premium p-6 lg:col-span-1">
          <h2 className="text-xl font-black text-white">Nova Conferência</h2>

          <div className="space-y-4 mt-5">
            <div>
              <label className="label">Material</label>
              <select
                className="input"
                value={itemSelecionado}
                onChange={(e) => setItemSelecionado(e.target.value)}
              >
                <option value="">Selecione o material</option>

                {estoque.map((item) => {
                  const chave = `${item.item}-${item.categoria}-${item.unidade}`;

                  return (
                    <option key={chave} value={chave}>
                      {item.item} • Sistema: {item.quantidadeSistema} {item.unidade}
                    </option>
                  );
                })}
              </select>
            </div>

            {itemAtual && (
              <div className="rounded-2xl bg-slate-900/70 border border-slate-800 p-4">
                <p className="text-slate-400 text-sm">Quantidade no sistema</p>
                <p className="text-2xl font-black text-white">
                  {itemAtual.quantidadeSistema} {itemAtual.unidade}
                </p>
              </div>
            )}

            <Campo
              label="Quantidade física contada"
              valor={quantidadeFisica}
              setValor={setQuantidadeFisica}
              placeholder="Ex: 25"
              type="number"
            />

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={usarQuantidadeSistema}
                disabled={!itemAtual}
                className="rounded-xl bg-green-950 border border-green-800 px-3 py-2 text-xs text-green-300 font-bold disabled:opacity-40"
              >
                Igual ao sistema
              </button>

              <button
                type="button"
                onClick={() => setQuantidadeFisica("0")}
                className="rounded-xl bg-red-950 border border-red-800 px-3 py-2 text-xs text-red-300 font-bold"
              >
                Zerado
              </button>
            </div>

            <div>
              <label className="label">Observação</label>
              <textarea
                className="input min-h-[120px]"
                value={observacao}
                onChange={(e) => setObservacao(e.target.value)}
                placeholder="Detalhes da conferência..."
              />
            </div>

            <div>
              <label className="label">Observações rápidas</label>

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
              onClick={registrarContagem}
              disabled={salvando}
              className="sig-btn-gold w-full disabled:opacity-50"
            >
              {salvando ? "Salvando..." : "Registrar Inventário"}
            </button>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-4">
          <div className="painel-premium p-6">
            <h2 className="text-xl font-black text-white">
              Histórico de Conferências
            </h2>

            <p className="text-slate-400 text-sm">
              Últimas contagens físicas realizadas no almoxarifado.
            </p>
          </div>

          {contagens.length === 0 ? (
            <div className="painel-premium p-10 text-center">
              <p className="text-6xl mb-3">📋</p>
              <h2 className="text-white text-xl font-black">
                Nenhum inventário registrado
              </h2>
              <p className="text-slate-400 text-sm mt-2">
                As conferências aparecerão aqui após o primeiro registro.
              </p>
            </div>
          ) : (
            <div className="grid xl:grid-cols-2 gap-4">
              {contagens.map((c) => (
                <div
                  key={c.id}
                  className="rounded-3xl border border-slate-800 bg-slate-950/70 p-5 shadow-xl"
                >
                  <div className="flex justify-between gap-3">
                    <div>
                      <p className="text-slate-400 text-sm">{c.categoria}</p>
                      <h3 className="text-xl font-black text-white">
                        📋 {c.item}
                      </h3>
                    </div>

                    <span
                      className={`h-fit rounded-full border px-3 py-1 text-xs font-bold ${
                        Number(c.diferenca || 0) === 0
                          ? "bg-green-950 text-green-300 border-green-800"
                          : "bg-yellow-950 text-yellow-300 border-yellow-800"
                      }`}
                    >
                      {Number(c.diferenca || 0) === 0 ? "OK" : "DIVERGÊNCIA"}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mt-4">
                    <Info titulo="Sistema" valor={`${c.quantidade_sistema} ${c.unidade}`} />
                    <Info titulo="Físico" valor={`${c.quantidade_fisica} ${c.unidade}`} />
                    <Info titulo="Diferença" valor={String(c.diferenca)} />
                    <Info
                      titulo="Data"
                      valor={
                        c.criado_em
                          ? new Date(c.criado_em).toLocaleDateString("pt-BR")
                          : "N/I"
                      }
                    />
                  </div>

                  {c.observacao && (
                    <p className="text-slate-300 text-sm mt-4 whitespace-pre-wrap">
                      {c.observacao}
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

function Info({ titulo, valor }: { titulo: string; valor: string }) {
  return (
    <div className="rounded-xl bg-slate-900/70 p-3">
      <p className="text-slate-500 text-xs">{titulo}</p>
      <p className="text-slate-200 font-bold text-sm">{valor}</p>
    </div>
  );
}