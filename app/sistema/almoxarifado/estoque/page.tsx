"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import jsPDF from "jspdf";
import { registrarAuditoria } from "@/lib/auditoria";

export default function EstoqueAlmoxarifadoPage() {
  const [entradas, setEntradas] = useState<any[]>([]);
  const [saidas, setSaidas] = useState<any[]>([]);
  const [busca, setBusca] = useState("");
  const [filtroCategoria, setFiltroCategoria] = useState("TODAS");
  const [filtroStatus, setFiltroStatus] = useState("TODOS");
  const [ordenacao, setOrdenacao] = useState("ITEM");
  const [carregando, setCarregando] = useState(true);

  const usuario =
    typeof window !== "undefined"
      ? JSON.parse(localStorage.getItem("usuarioLogado") || "{}")
      : {};

  async function carregar() {
    if (!usuario?.municipio_id) return;

    setCarregando(true);

    const { data: listaEntradas } = await supabase
      .from("almoxarifado_entradas")
      .select("*")
      .eq("municipio_id", usuario.municipio_id);

    const { data: listaSaidas } = await supabase
      .from("almoxarifado_saidas")
      .select("*")
      .eq("municipio_id", usuario.municipio_id);

    setEntradas(listaEntradas || []);
    setSaidas(listaSaidas || []);
    setCarregando(false);
  }

  async function exportarPDF() {
  const doc = new jsPDF();

  doc.setFontSize(18);
  doc.text("Relatório de Estoque - Almoxarifado", 14, 20);

  let linha = 35;

  estoqueFiltrado.forEach((item) => {
    doc.text(
      `${item.item} - ${item.quantidade} ${item.unidade}`,
      14,
      linha
    );

    linha += 8;

    if (linha > 280) {
      doc.addPage();
      linha = 20;
    }
  });

  doc.save("estoque-almoxarifado.pdf");

  await registrarAuditoria({
    modulo: "Almoxarifado",
    acao: "EXPORTAR_PDF",
    descricao:
      "Exportou o relatório de estoque do almoxarifado em PDF.",
  });
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
          quantidade: 0,
          local: entrada.local,
          ultimaEntrada: entrada.criado_em,
          observacao: entrada.observacao,
        });
      }

      const atual = mapa.get(chave);
      atual.quantidade += Number(entrada.quantidade || 0);

      if (
        entrada.criado_em &&
        (!atual.ultimaEntrada ||
          new Date(entrada.criado_em) > new Date(atual.ultimaEntrada))
      ) {
        atual.ultimaEntrada = entrada.criado_em;
        atual.local = entrada.local;
        atual.observacao = entrada.observacao;
      }

      mapa.set(chave, atual);
    });

    saidas.forEach((saida) => {
      const chave = `${saida.item}-${saida.categoria}-${saida.unidade}`;

      if (mapa.has(chave)) {
        const atual = mapa.get(chave);
        atual.quantidade -= Number(saida.quantidade || 0);
        mapa.set(chave, atual);
      }
    });

    return Array.from(mapa.values());
  }, [entradas, saidas]);

  const estoqueFiltrado = useMemo(() => {
    let lista = estoque.filter((item) => {
      const status = statusEstoque(Number(item.quantidade || 0));

      const texto = `
        ${item.item || ""}
        ${item.categoria || ""}
        ${item.unidade || ""}
        ${item.local || ""}
        ${item.observacao || ""}
      `.toLowerCase();

      return (
        texto.includes(busca.toLowerCase()) &&
        (filtroCategoria === "TODAS" || item.categoria === filtroCategoria) &&
        (filtroStatus === "TODOS" || status === filtroStatus)
      );
    });

    if (ordenacao === "ITEM") {
      lista.sort((a, b) => String(a.item).localeCompare(String(b.item)));
    }

    if (ordenacao === "MENOR_QTD") {
      lista.sort((a, b) => Number(a.quantidade) - Number(b.quantidade));
    }

    if (ordenacao === "MAIOR_QTD") {
      lista.sort((a, b) => Number(b.quantidade) - Number(a.quantidade));
    }

    if (ordenacao === "ULTIMA_ENTRADA") {
      lista.sort(
        (a, b) =>
          new Date(b.ultimaEntrada || 0).getTime() -
          new Date(a.ultimaEntrada || 0).getTime()
      );
    }

    return lista;
  }, [estoque, busca, filtroCategoria, filtroStatus, ordenacao]);

  const resumo = useMemo(() => {
    return {
      itens: estoque.length,
      totalUnidades: estoque.reduce(
        (acc, item) => acc + Number(item.quantidade || 0),
        0
      ),
      baixo: estoque.filter(
        (item) => Number(item.quantidade || 0) > 0 && Number(item.quantidade || 0) <= 5
      ).length,
      zerado: estoque.filter((item) => Number(item.quantidade || 0) <= 0).length,
    };
  }, [estoque]);

  function statusEstoque(qtd: number) {
    if (qtd <= 0) return "ZERADO";
    if (qtd <= 5) return "BAIXO";
    return "OK";
  }

  function nomeCategoria(valor: string) {
    const nomes: Record<string, string> = {
      MATERIAL_CONSUMO: "Material de consumo",
      EPI: "EPI",
      UNIFORME: "Uniforme",
      EXPEDIENTE: "Expediente",
      LIMPEZA: "Limpeza",
      OPERACIONAL: "Operacional",
      INFORMATICA: "Informática",
      ALIMENTACAO: "Alimentação",
      MANUTENCAO: "Manutenção",
      OUTRO: "Outro",
    };

    return nomes[valor] || valor;
  }

  const categoriasRapidas = [
    ["TODAS", "Todos"],
    ["MATERIAL_CONSUMO", "Consumo"],
    ["EPI", "EPI"],
    ["UNIFORME", "Uniformes"],
    ["EXPEDIENTE", "Expediente"],
    ["LIMPEZA", "Limpeza"],
    ["OPERACIONAL", "Operacional"],
    ["INFORMATICA", "Informática"],
    ["ALIMENTACAO", "Alimentação"],
    ["MANUTENCAO", "Manutenção"],
  ];

  return (
    <div className="p-4 md:p-6 pb-24 space-y-6">
      <div className="painel-premium p-6">
        <h1 className="text-2xl md:text-3xl font-black text-white">
          📦 Estoque do Almoxarifado
        </h1>

        <p className="text-slate-400 mt-2">
          Consulta geral dos materiais disponíveis, com entradas, saídas e alertas automáticos.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card titulo="Itens" valor={String(resumo.itens)} />
        <Card titulo="Qtd. Total" valor={String(resumo.totalUnidades)} />
        <Card titulo="Estoque Baixo" valor={String(resumo.baixo)} />
        <Card titulo="Zerados" valor={String(resumo.zerado)} />
      </div>

      <div className="painel-premium p-6 space-y-4">
  <div className="flex items-center justify-between">
    <h2 className="text-xl font-black text-white">
      Filtros rápidos
    </h2>

    <button
      onClick={exportarPDF}
      className="btn-primary"
    >
      Exportar PDF
    </button>
  </div>

        <input
          className="input"
          placeholder="Buscar por item, categoria, unidade, local ou observação..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
        />

        <div className="flex flex-wrap gap-2">
          {categoriasRapidas.map(([id, nome]) => (
            <button
              key={id}
              type="button"
              onClick={() => setFiltroCategoria(id)}
              className={`rounded-xl px-3 py-2 text-sm font-bold border ${
                filtroCategoria === id
                  ? "bg-yellow-500 text-black border-yellow-400"
                  : "bg-slate-900 text-slate-300 border-slate-700"
              }`}
            >
              {nome}
            </button>
          ))}
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="label">Status</label>
            <select
              className="input"
              value={filtroStatus}
              onChange={(e) => setFiltroStatus(e.target.value)}
            >
              <option value="TODOS">Todos</option>
              <option value="OK">Normal</option>
              <option value="BAIXO">Estoque baixo</option>
              <option value="ZERADO">Zerado</option>
            </select>
          </div>

          <div>
            <label className="label">Ordenar</label>
            <select
              className="input"
              value={ordenacao}
              onChange={(e) => setOrdenacao(e.target.value)}
            >
              <option value="ITEM">Nome do item</option>
              <option value="MENOR_QTD">Menor quantidade</option>
              <option value="MAIOR_QTD">Maior quantidade</option>
              <option value="ULTIMA_ENTRADA">Última entrada</option>
            </select>
          </div>
        </div>
      </div>

      {carregando ? (
        <div className="painel-premium p-6 text-slate-400">
          Carregando estoque...
        </div>
      ) : estoqueFiltrado.length === 0 ? (
        <div className="painel-premium p-10 text-center">
          <p className="text-6xl mb-3">📦</p>
          <h2 className="text-white text-xl font-black">
            Nenhum item encontrado
          </h2>
          <p className="text-slate-400 text-sm mt-2">
            Registre uma entrada ou altere os filtros.
          </p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
          {estoqueFiltrado.map((item, index) => {
            const status = statusEstoque(Number(item.quantidade || 0));

            return (
              <div
                key={index}
                className="rounded-3xl border border-slate-800 bg-slate-950/70 p-5 shadow-xl"
              >
                <div className="flex justify-between gap-3">
                  <div>
                    <p className="text-slate-400 text-sm">
                      {nomeCategoria(item.categoria)}
                    </p>

                    <h3 className="text-xl font-black text-white">
                      📦 {item.item}
                    </h3>

                    <p className="text-slate-500 text-sm">
                      Local: {item.local || "N/I"}
                    </p>
                  </div>

                  <Status status={status} />
                </div>

                <div className="grid grid-cols-2 gap-3 mt-4">
                  <Info
                    titulo="Quantidade"
                    valor={`${item.quantidade || 0} ${item.unidade || ""}`}
                  />

                  <Info
                    titulo="Status"
                    valor={
                      status === "OK"
                        ? "Normal"
                        : status === "BAIXO"
                        ? "Estoque baixo"
                        : "Zerado"
                    }
                  />

                  <Info
                    titulo="Última entrada"
                    valor={
                      item.ultimaEntrada
                        ? new Date(item.ultimaEntrada).toLocaleDateString("pt-BR")
                        : "N/I"
                    }
                  />

                  <Info titulo="Unidade" valor={item.unidade || "N/I"} />
                </div>

                {Number(item.quantidade || 0) <= 5 && (
                  <div className="mt-4 rounded-2xl bg-yellow-950/40 border border-yellow-800 p-3">
                    <p className="text-yellow-300 text-sm font-bold">
                      ⚠️ Atenção: estoque baixo ou zerado.
                    </p>
                  </div>
                )}

                {item.observacao && (
                  <p className="text-slate-300 text-sm mt-4 whitespace-pre-wrap">
                    {item.observacao}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function Card({ titulo, valor }: { titulo: string; valor: string }) {
  return (
    <div className="painel-premium p-5">
      <p className="text-slate-400 text-sm">{titulo}</p>
      <h2 className="text-2xl md:text-3xl font-black text-white">{valor}</h2>
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

function Status({ status }: { status: string }) {
  let cor = "bg-green-950 text-green-300 border-green-800";
  let texto = "OK";

  if (status === "BAIXO") {
    cor = "bg-yellow-950 text-yellow-300 border-yellow-800";
    texto = "BAIXO";
  }

  if (status === "ZERADO") {
    cor = "bg-red-950 text-red-300 border-red-800";
    texto = "ZERADO";
  }

  return (
    <span className={`h-fit rounded-full border px-3 py-1 text-xs font-bold ${cor}`}>
      {texto}
    </span>
  );
}