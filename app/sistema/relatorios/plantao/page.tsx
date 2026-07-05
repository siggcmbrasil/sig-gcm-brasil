"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { useSearchParams } from "next/navigation";

async function carregarImagemBase64(url: string) {
  if (!url) return null;

  try {
    const resposta = await fetch(url);
    const blob = await resposta.blob();

    return await new Promise<{
      base64: string;
      formato: "PNG" | "JPEG";
    }>((resolve) => {
      const reader = new FileReader();

      reader.onloadend = () => {
        resolve({
          base64: String(reader.result),
          formato: blob.type.includes("jpeg") || blob.type.includes("jpg")
            ? "JPEG"
            : "PNG",
        });
      };

      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

export default function RelatorioPlantaoPage() {

  const searchParams = useSearchParams();

const tipoRelatorio =
  searchParams.get("tipo") ||
  "plantao";

  const [data, setData] =useState ( new Date() .toISOString() .split("T")[0]);
  const [ocorrencias, setOcorrencias] = useState<any[]>([]);
  const [patrulhamentos, setPatrulhamentos] = useState<any[]>([]);
  const [chamados, setChamados] = useState<any[]>([]);
  const [visitas, setVisitas] = useState<any[]>([]);
  const [apoios, setApoios] = useState<any[]>([]);
const [eventos, setEventos] = useState<any[]>([]);
const [operacoes, setOperacoes] = useState<any[]>([]);
const [pessoas, setPessoas] = useState<any[]>([]);
const [veiculos, setVeiculos] = useState<any[]>([]);
const [abastecimentos, setAbastecimentos] = useState<any[]>([]);
  const [carregando, setCarregando] = useState(false);

  const [inicio, setInicio] = useState("");
const [fim, setFim] = useState("");
const [mesReferencia, setMesReferencia] = useState(
  new Date().toISOString().slice(0, 7)
);
const [anoReferencia, setAnoReferencia] = useState(
  String(new Date().getFullYear())
);

const [incluirOcorrencias, setIncluirOcorrencias] = useState(true);
const [incluirChamados, setIncluirChamados] = useState(true);
const [incluirPatrulhamentos, setIncluirPatrulhamentos] = useState(true);
const [incluirVisitas, setIncluirVisitas] = useState(true);
const [incluirApoios, setIncluirApoios] = useState(false);
const [incluirEventos, setIncluirEventos] = useState(false);
const [incluirOperacoes, setIncluirOperacoes] = useState(false);
const [incluirPessoas, setIncluirPessoas] = useState(false);
const [incluirVeiculos, setIncluirVeiculos] = useState(false);
const [incluirAbastecimentos, setIncluirAbastecimentos] = useState(false);

  async function carregarRelatorio() {
  setCarregando(true);

  const usuario = JSON.parse(
    localStorage.getItem("usuarioLogado") || "{}"
  );

  const municipioId = usuario.municipio_id;

  if (!municipioId) {
    alert("Município não identificado.");
    setCarregando(false);
    return;
  }

  let inicioPeriodo = "";
  let fimPeriodo = "";

  if (tipoRelatorio === "plantao") {
    if (!inicio || !fim) {
      setCarregando(false);
      return;
    }

    inicioPeriodo = inicio;
    fimPeriodo = fim;
  }

  if (tipoRelatorio === "diario") {
    inicioPeriodo = `${data}T00:00:00`;
    fimPeriodo = `${data}T23:59:59`;
  }

  if (tipoRelatorio === "semanal") {
    const i = new Date(`${data}T00:00:00`);
    const f = new Date(i);
    f.setDate(f.getDate() + 7);

    inicioPeriodo = i.toISOString();
    fimPeriodo = f.toISOString();
  }

  if (tipoRelatorio === "quinzenal") {
    const i = new Date(`${data}T00:00:00`);
    const f = new Date(i);
    f.setDate(f.getDate() + 15);

    inicioPeriodo = i.toISOString();
    fimPeriodo = f.toISOString();
  }

  if (tipoRelatorio === "mensal") {
    const [ano, mes] = mesReferencia.split("-");
    const i = new Date(Number(ano), Number(mes) - 1, 1);
    const f = new Date(Number(ano), Number(mes), 0, 23, 59, 59);

    inicioPeriodo = i.toISOString();
    fimPeriodo = f.toISOString();
  }

  if (tipoRelatorio === "bimestral") {
    const [ano, mes] = mesReferencia.split("-");
    const i = new Date(Number(ano), Number(mes) - 1, 1);
    const f = new Date(Number(ano), Number(mes) + 1, 0, 23, 59, 59);

    inicioPeriodo = i.toISOString();
    fimPeriodo = f.toISOString();
  }

  if (tipoRelatorio === "trimestral") {
    const [ano, mes] = mesReferencia.split("-");
    const i = new Date(Number(ano), Number(mes) - 1, 1);
    const f = new Date(Number(ano), Number(mes) + 2, 0, 23, 59, 59);

    inicioPeriodo = i.toISOString();
    fimPeriodo = f.toISOString();
  }

  if (tipoRelatorio === "semestral") {
    const [ano, mes] = mesReferencia.split("-");
    const i = new Date(Number(ano), Number(mes) - 1, 1);
    const f = new Date(Number(ano), Number(mes) + 5, 0, 23, 59, 59);

    inicioPeriodo = i.toISOString();
    fimPeriodo = f.toISOString();
  }

  if (tipoRelatorio === "anual") {
    const ano = Number(anoReferencia);
    inicioPeriodo = new Date(ano, 0, 1).toISOString();
    fimPeriodo = new Date(ano, 11, 31, 23, 59, 59).toISOString();
  }

  const dataInicio = inicioPeriodo.split("T")[0];
  const dataFim = fimPeriodo.split("T")[0];

  const { data: ocorr } = await supabase
    .from("ocorrencias")
    .select("*")
    .eq("municipio_id", municipioId)
    .gte("data", dataInicio)
    .lte("data", dataFim);

  const { data: patr } = await supabase
    .from("patrulhamentos")
    .select("*")
    .eq("municipio_id", municipioId)
    .gte("data", dataInicio)
    .lte("data", dataFim);

  const { data: cham } = await supabase
    .from("chamados")
    .select("*")
    .eq("municipio_id", municipioId)
    .gte("criado_em", inicioPeriodo)
    .lte("criado_em", fimPeriodo);

  const { data: vis } = await supabase
    .from("visitas")
    .select(`
      *,
      guarnicoes(nome)
    `)
    .eq("municipio_id", municipioId)
    .gte("data_visita", inicioPeriodo)
    .lte("data_visita", fimPeriodo);

    const { data: apoiosData } = incluirApoios
  ? await supabase
      .from("apoios")
      .select("*")
      .eq("municipio_id", municipioId)
      .gte("criado_em", inicioPeriodo)
      .lte("criado_em", fimPeriodo)
  : { data: [] };

const { data: eventosData } = incluirEventos
  ? await supabase
      .from("eventos")
      .select("*")
      .eq("municipio_id", municipioId)
      .gte("data_evento", inicioPeriodo)
      .lte("data_evento", fimPeriodo)
  : { data: [] };

const { data: operacoesData } = incluirOperacoes
  ? await supabase
      .from("operacoes")
      .select("*")
      .eq("municipio_id", municipioId)
      .gte("criado_em", inicioPeriodo)
      .lte("criado_em", fimPeriodo)
  : { data: [] };

const { data: pessoasData } = incluirPessoas
  ? await supabase
      .from("pessoas_abordadas")
      .select("*")
      .eq("municipio_id", municipioId)
      .gte("data", dataInicio)
      .lte("data", dataFim)
  : { data: [] };

const { data: veiculosData } = incluirVeiculos
  ? await supabase
      .from("veiculos_abordados")
      .select("*")
      .eq("municipio_id", municipioId)
      .gte("data", dataInicio)
      .lte("data", dataFim)
  : { data: [] };

const { data: abastecimentosData } = incluirAbastecimentos
  ? await supabase
      .from("abastecimentos")
      .select("*, viaturas(prefixo, placa)")
      .eq("municipio_id", municipioId)
      .gte("data_abastecimento", inicioPeriodo)
      .lte("data_abastecimento", fimPeriodo)
  : { data: [] };

  setOcorrencias(ocorr || []);
  setPatrulhamentos(patr || []);
  setChamados(cham || []);
  setVisitas(vis || []);
  setApoios(apoiosData || []);
  setEventos(eventosData || []);
  setOperacoes(operacoesData || []);
  setPessoas(pessoasData || []);
  setVeiculos(veiculosData || []);
  setAbastecimentos(abastecimentosData || []);
  setCarregando(false);
}

useEffect(() => {
  const hoje = new Date();
  let dataBase = new Date();

  switch (tipoRelatorio) {
    case "diario":
      break;

    case "semanal":
      dataBase.setDate(
        hoje.getDate() - 7
      );
      break;

    case "quinzenal":
      dataBase.setDate(
        hoje.getDate() - 15
      );
      break;

    case "mensal":
      dataBase = new Date(
        hoje.getFullYear(),
        hoje.getMonth(),
        1
      );
      break;

    case "bimestral":
      dataBase.setMonth(
        hoje.getMonth() - 2
      );
      break;

    case "trimestral":
      dataBase.setMonth(
        hoje.getMonth() - 3
      );
      break;

    case "semestral":
      dataBase.setMonth(
        hoje.getMonth() - 6
      );
      break;

    case "anual":
      dataBase = new Date(
        hoje.getFullYear(),
        0,
        1
      );
      break;
  }

  if (tipoRelatorio !== "plantao") {
    setData(
      dataBase
        .toISOString()
        .split("T")[0]
    );
  }
}, [tipoRelatorio]);

 useEffect(() => {
  void carregarRelatorio();
}, [
  data,
  inicio,
  fim,
  mesReferencia,
  anoReferencia,
  tipoRelatorio,
  incluirOcorrencias,
  incluirChamados,
  incluirPatrulhamentos,
  incluirVisitas,
  incluirApoios,
  incluirEventos,
  incluirOperacoes,
  incluirPessoas,
  incluirVeiculos,
  incluirAbastecimentos,
]);
  async function gerarPDF() {
  const usuario = JSON.parse(localStorage.getItem("usuarioLogado") || "{}");

  if (!usuario.municipio_id) {
    alert("Município não identificado.");
    return;
  }

  const { data: municipioInfo, error } = await supabase
    .from("municipios")
    .select("*")
    .eq("id", usuario.municipio_id)
    .single();

  if (error || !municipioInfo) {
    alert("Erro ao carregar informações do município.");
    return;
  }

  const brasaoPrefeitura =
    municipioInfo?.brasao_prefeitura ||
    municipioInfo?.brasao_municipio ||
    municipioInfo?.logo_prefeitura ||
    "";

  const brasaoGuarda =
    municipioInfo?.brasao_gcm ||
    municipioInfo?.brasao_guarda ||
    municipioInfo?.logo_gcm ||
    "";

  const imgPrefeitura = await carregarImagemBase64(brasaoPrefeitura);
  const imgGuarda = await carregarImagemBase64(brasaoGuarda);

  const doc = new jsPDF("p", "mm", "a4");

  const larguraPagina = doc.internal.pageSize.getWidth();
  const alturaPagina = doc.internal.pageSize.getHeight();

  const nomeMunicipio = municipioInfo?.nome || "";
  const nomeGuarda = municipioInfo?.nome_guarda || "Guarda Civil Municipal";
  const comandante = municipioInfo?.comandante || "";
  const emitidoPor = usuario.nome || "";

  const tituloRelatorio =
    tipoRelatorio === "plantao"
      ? "RELATÓRIO GERAL DO PLANTÃO"
      : `RELATÓRIO ${tipoRelatorio.toUpperCase()}`;

  const numeroRelatorio = `RGP-${new Date()
    .toISOString()
    .slice(0, 10)
    .replaceAll("-", "")}`;

  const dataEmissao = new Date().toLocaleString("pt-BR");

  function adicionarCabecalho() {
    if (imgPrefeitura) {
      doc.addImage(imgPrefeitura.base64, imgPrefeitura.formato, 12, 8, 22, 22);
    }

    if (imgGuarda) {
      doc.addImage(imgGuarda.base64, imgGuarda.formato, 176, 8, 22, 22);
    }

    doc.setTextColor(0, 0, 0);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text(nomeGuarda, larguraPagina / 2, 13, { align: "center" });

    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.text(`Município de ${nomeMunicipio}`, larguraPagina / 2, 19, {
      align: "center",
    });

    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text(tituloRelatorio, larguraPagina / 2, 27, { align: "center" });

    doc.setLineWidth(0.3);
    doc.line(12, 34, 198, 34);
  }

  function adicionarRodape(numeroPagina: number, totalPaginas: number) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(80, 80, 80);

    doc.line(12, alturaPagina - 13, 198, alturaPagina - 13);

    doc.text(
      `SIG-GCM Brasil | Página ${numeroPagina} de ${totalPaginas}`,
      larguraPagina / 2,
      alturaPagina - 7,
      { align: "center" }
    );
  }

  function adicionarMarcaDagua() {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(32);
    doc.setTextColor(235, 235, 235);

    doc.text("SIG-GCM BRASIL", larguraPagina / 2, 150, {
      align: "center",
      angle: 45,
    });

    doc.setTextColor(0, 0, 0);
  }

  function novaPaginaComCabecalho() {
    doc.addPage();
    adicionarMarcaDagua();
    adicionarCabecalho();
  }

  adicionarMarcaDagua();
  adicionarCabecalho();

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");

  doc.text(`Relatório nº: ${numeroRelatorio}`, 14, 42);
  doc.text(`Emitido em: ${dataEmissao}`, 14, 48);
  doc.text(`Emitido por: ${emitidoPor}`, 14, 54);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text("Resumo Operacional", 14, 66);

  autoTable(doc, {
    startY: 72,
    theme: "grid",
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: [255, 255, 255],
    },
    head: [["Item", "Quantidade"]],
    body: [
      ...(incluirOcorrencias ? [["Ocorrências", ocorrencias.length]] : []),
      ...(incluirPatrulhamentos
        ? [["Patrulhamentos", patrulhamentos.length]]
        : []),
      ...(incluirChamados ? [["Chamados", chamados.length]] : []),
      ...(incluirVisitas ? [["Visitas", visitas.length]] : []),
      ...(incluirApoios ? [["Apoios", apoios.length]] : []),
      ...(incluirEventos ? [["Eventos", eventos.length]] : []),
      ...(incluirOperacoes ? [["Operações", operacoes.length]] : []),
      ...(incluirPessoas ? [["Pessoas", pessoas.length]] : []),
      ...(incluirVeiculos ? [["Veículos", veiculos.length]] : []),
      ...(incluirAbastecimentos
        ? [["Abastecimentos", abastecimentos.length]]
        : []),
    ],
  });

  function tabelaModulo(titulo: string, head: string[][], body: any[][]) {
    if (body.length === 0) return;

    novaPaginaComCabecalho();

    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.text(titulo, 14, 44);

    autoTable(doc, {
      startY: 50,
      theme: "grid",
      headStyles: {
        fillColor: [15, 23, 42],
        textColor: [255, 255, 255],
      },
      head,
      body,
      margin: { top: 42, bottom: 22 },
    });
  }

  if (incluirOcorrencias) {
    tabelaModulo(
      "Ocorrências",
      [["Tipo", "Local", "Bairro", "Hora", "Status"]],
      ocorrencias.map((o) => [
        o.tipo || "-",
        o.local || "-",
        o.bairro || "-",
        o.hora || "-",
        o.status || "-",
      ])
    );
  }

  if (incluirPatrulhamentos) {
    tabelaModulo(
      "Patrulhamentos",
      [["Local", "Guarda", "Hora", "Observação"]],
      patrulhamentos.map((p) => [
        p.local || "-",
        p.guarda || "-",
        p.hora || "-",
        p.observacao || "-",
      ])
    );
  }

  if (incluirChamados) {
    tabelaModulo(
      "Chamados",
      [["Título", "Local", "Status", "Prioridade"]],
      chamados.map((c) => [
        c.titulo || c.descricao || "Chamado",
        c.local || "-",
        c.status || "-",
        c.prioridade || "-",
      ])
    );
  }

  if (incluirVisitas) {
    tabelaModulo(
      "Visitas e Ações Preventivas",
      [["Tipo", "Local", "Guarnição", "Data"]],
      visitas.map((v) => [
        v.tipo || "-",
        v.local || "-",
        v.guarnicoes?.nome || "-",
        v.data_visita ? new Date(v.data_visita).toLocaleString("pt-BR") : "-",
      ])
    );
  }

  if (incluirApoios) {
    tabelaModulo(
      "Apoios Operacionais",
      [["Tipo", "Local", "Descrição"]],
      apoios.map((a) => [a.tipo || "-", a.local || "-", a.descricao || "-"])
    );
  }

  if (incluirEventos) {
    tabelaModulo(
      "Eventos",
      [["Nome", "Local", "Data"]],
      eventos.map((e) => [
        e.nome || "-",
        e.local || "-",
        e.data_evento
          ? new Date(e.data_evento).toLocaleString("pt-BR")
          : "-",
      ])
    );
  }

  if (incluirOperacoes) {
    tabelaModulo(
      "Operações",
      [["Nome", "Local", "Descrição"]],
      operacoes.map((o) => [o.nome || "-", o.local || "-", o.descricao || "-"])
    );
  }

  if (incluirPessoas) {
    tabelaModulo(
      "Pessoas Abordadas",
      [["Nome", "CPF", "Local", "Data"]],
      pessoas.map((p) => [p.nome || "-", p.cpf || "-", p.local || "-", p.data || "-"])
    );
  }

  if (incluirVeiculos) {
    tabelaModulo(
      "Veículos Abordados",
      [["Placa", "Modelo", "Local", "Data"]],
      veiculos.map((v) => [
        v.placa || "-",
        v.modelo || "-",
        v.local || "-",
        v.data || "-",
      ])
    );
  }

  if (incluirAbastecimentos) {
    tabelaModulo(
      "Abastecimentos",
      [["Viatura", "Litros", "Valor", "Data"]],
      abastecimentos.map((a) => [
        a.viaturas?.prefixo || "-",
        `${a.litros || 0} L`,
        `R$ ${Number(a.valor || 0).toFixed(2)}`,
        a.data_abastecimento
          ? new Date(a.data_abastecimento).toLocaleDateString("pt-BR")
          : "-",
      ])
    );
  }

  const ultimaY = (doc as any).lastAutoTable?.finalY || 0;

  if (ultimaY > 220) {
    novaPaginaComCabecalho();
  }

  const yAssinatura = alturaPagina - 42;

  doc.setFont("helvetica", "normal");
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(10);

  doc.text("__________________________________", 18, yAssinatura);
  doc.text(`Comandante: ${comandante}`, 24, yAssinatura + 8);

  doc.text("__________________________________", 118, yAssinatura);
  doc.text(`Plantonista: ${emitidoPor}`, 124, yAssinatura + 8);

  const totalPaginas = doc.getNumberOfPages();

  for (let i = 1; i <= totalPaginas; i++) {
    doc.setPage(i);
    adicionarRodape(i, totalPaginas);
  }

  doc.save(`relatorio-${tipoRelatorio}-${numeroRelatorio}.pdf`);
}

  return (
    <div className="p-3 md:p-6 pb-24 space-y-6">
      <header className="border-b border-slate-800 pb-5">
        <h1 className="text-2xl md:text-3xl font-bold">
  {tipoRelatorio === "plantao"
    ? "Relatório Geral do Plantão"
    : `Relatório ${
        tipoRelatorio.charAt(0).toUpperCase() +
        tipoRelatorio.slice(1)
      }`}
</h1>

        <p className="text-slate-400 text-sm md:text-base">
          Resumo operacional integrado do SIG-GCM Brasil.
        </p>

        <div className="mt-4">
  {tipoRelatorio === "plantao" && (
  <div className="grid md:grid-cols-2 gap-3">
    <div>
      <label className="block text-sm text-slate-400 mb-1">
        Início
      </label>

      <input
        type="datetime-local"
        value={inicio}
        onChange={(e) => setInicio(e.target.value)}
        className="bg-slate-950 border border-slate-700 rounded-lg px-4 py-2 text-white w-full"
      />
    </div>

    <div>
      <label className="block text-sm text-slate-400 mb-1">
        Fim
      </label>

      <input
        type="datetime-local"
        value={fim}
        onChange={(e) => setFim(e.target.value)}
        className="bg-slate-950 border border-slate-700 rounded-lg px-4 py-2 text-white w-full"
      />
    </div>
  </div>
)}

{tipoRelatorio === "diario" && (
  <input
    type="date"
    value={data}
    onChange={(e) => setData(e.target.value)}
    className="bg-slate-950 border border-slate-700 rounded-lg px-4 py-2 text-white"
  />
)}

{["semanal", "quinzenal"].includes(tipoRelatorio) && (
  <input
    type="date"
    value={data}
    onChange={(e) => setData(e.target.value)}
    className="bg-slate-950 border border-slate-700 rounded-lg px-4 py-2 text-white"
  />
)}

{[
  "mensal",
  "bimestral",
  "trimestral",
  "semestral",
].includes(tipoRelatorio) && (
  <input
    type="month"
    value={mesReferencia}
    onChange={(e) =>
      setMesReferencia(e.target.value)
    }
    className="bg-slate-950 border border-slate-700 rounded-lg px-4 py-2 text-white"
  />
)}

{tipoRelatorio === "anual" && (
  <input
    type="number"
    value={anoReferencia}
    onChange={(e) =>
      setAnoReferencia(e.target.value)
    }
    className="bg-slate-950 border border-slate-700 rounded-lg px-4 py-2 text-white"
  />
)}
</div>

<div className="mt-5 painel-premium p-4">
  <h2 className="text-lg font-black text-white mb-3">
    O que incluir no relatório
  </h2>

  <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-sm text-slate-300">
    <Check label="Ocorrências" checked={incluirOcorrencias} onChange={setIncluirOcorrencias} />
    <Check label="Chamados" checked={incluirChamados} onChange={setIncluirChamados} />
    <Check label="Patrulhamentos" checked={incluirPatrulhamentos} onChange={setIncluirPatrulhamentos} />
    <Check label="Visitas" checked={incluirVisitas} onChange={setIncluirVisitas} />
    <Check label="Apoios" checked={incluirApoios} onChange={setIncluirApoios} />
    <Check label="Eventos" checked={incluirEventos} onChange={setIncluirEventos} />
    <Check label="Operações" checked={incluirOperacoes} onChange={setIncluirOperacoes} />
    <Check label="Pessoas" checked={incluirPessoas} onChange={setIncluirPessoas} />
    <Check label="Veículos" checked={incluirVeiculos} onChange={setIncluirVeiculos} />
    <Check label="Abastecimentos" checked={incluirAbastecimentos} onChange={setIncluirAbastecimentos} />
  </div>
</div>
      </header>

      {!data ? (
        <p className="text-slate-400">
          Selecione a data do plantão para gerar o relatório.
        </p>
      ) : carregando ? (
        <p className="text-slate-400">Carregando relatório...</p>
      ) : (
        <>
          <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4">
  {incluirOcorrencias && (
    <Card
      titulo="Ocorrências"
      valor={ocorrencias.length}
      cor="blue"
    />
  )}

  {incluirPatrulhamentos && (
    <Card
      titulo="Patrulhamentos"
      valor={patrulhamentos.length}
      cor="green"
    />
  )}

  {incluirChamados && (
    <Card
      titulo="Chamados"
      valor={chamados.length}
      cor="orange"
    />
  )}

  {incluirVisitas && (
    <Card
      titulo="Visitas"
      valor={visitas.length}
      cor="green"
    />
  )}

  {incluirApoios && (
    <Card
      titulo="Apoios"
      valor={apoios.length}
      cor="blue"
    />
  )}

  {incluirEventos && (
    <Card
      titulo="Eventos"
      valor={eventos.length}
      cor="orange"
    />
  )}

  {incluirOperacoes && (
    <Card
      titulo="Operações"
      valor={operacoes.length}
      cor="blue"
    />
  )}

  {incluirPessoas && (
    <Card
      titulo="Pessoas"
      valor={pessoas.length}
      cor="green"
    />
  )}

  {incluirVeiculos && (
    <Card
      titulo="Veículos"
      valor={veiculos.length}
      cor="orange"
    />
  )}

  {incluirAbastecimentos && (
    <Card
      titulo="Abastecimentos"
      valor={abastecimentos.length}
      cor="green"
    />
  )}
</section>

          <section className="flex justify-end">
  <button
  onClick={gerarPDF}
  className="bg-red-600 hover:bg-red-700 text-white px-5 py-3 rounded-xl font-semibold transition"
>
  📄 Gerar PDF Oficial
</button>
</section>

          {incluirOcorrencias && (
  <TabelaOcorrencias dados={ocorrencias} />
)}

{incluirPatrulhamentos && (
  <TabelaPatrulhamentos dados={patrulhamentos} />
)}

{incluirChamados && (
  <TabelaChamados dados={chamados} />
)}

{incluirVisitas && (
  <TabelaVisitas dados={visitas} />
)}

{incluirApoios && (
  <TabelaApoios dados={apoios} />
)}

{incluirEventos && (
  <TabelaEventos dados={eventos} />
)}

{incluirOperacoes && (
  <TabelaOperacoes dados={operacoes} />
)}

{incluirPessoas && (
  <TabelaPessoas dados={pessoas} />
)}

{incluirVeiculos && (
  <TabelaVeiculos dados={veiculos} />
)}

{incluirAbastecimentos && (
  <TabelaAbastecimentos
    dados={abastecimentos}
  />
)}
        </>
      )}
    </div>
  );
}

function Card({
  titulo,
  valor,
  cor,
}: {
  titulo: string;
  valor: number;
  cor: "blue" | "green" | "orange";
}) {
  const cores = {
    blue: "border-blue-700/60 bg-blue-950/30 text-blue-300",
    green: "border-green-700/60 bg-green-950/30 text-green-300",
    orange: "border-orange-700/60 bg-orange-950/30 text-orange-300",
  };

  return (
    <div className={`border ${cores[cor]} rounded-2xl p-5`}>
      <p className="text-sm opacity-90">{titulo}</p>
      <h2 className="text-4xl font-bold text-white mt-2">{valor}</h2>
    </div>
  );
}

function TabelaOcorrencias({ dados }: { dados: any[] }) {
  return (
    <section className="card overflow-x-auto">
      <h2 className="text-xl font-bold mb-4">Ocorrências do Plantão</h2>

      {dados.length === 0 ? (
        <p className="text-slate-400">Nenhuma ocorrência no período.</p>
      ) : (
        <table className="w-full text-sm">
          <thead className="text-slate-400 border-b border-slate-700">
            <tr>
              <th className="text-left py-3">Tipo</th>
              <th className="text-left py-3">Local</th>
              <th className="text-left py-3">Bairro</th>
              <th className="text-left py-3">Hora</th>
              <th className="text-left py-3">Status</th>
            </tr>
          </thead>

          <tbody>
            {dados.map((o) => (
              <tr key={o.id} className="border-b border-slate-800">
                <td className="py-3 font-semibold">{o.tipo || "-"}</td>
                <td>{o.local || "-"}</td>
                <td>{o.bairro || "-"}</td>
                <td>{o.hora || "-"}</td>
                <td>{o.status || "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}

function TabelaPatrulhamentos({ dados }: { dados: any[] }) {
  return (
    <section className="card overflow-x-auto">
      <h2 className="text-xl font-bold mb-4">Patrulhamentos do Plantão</h2>

      {dados.length === 0 ? (
        <p className="text-slate-400">Nenhum patrulhamento no período.</p>
      ) : (
        <table className="w-full text-sm">
          <thead className="text-slate-400 border-b border-slate-700">
            <tr>
              <th className="text-left py-3">Local</th>
              <th className="text-left py-3">Guarda</th>
              <th className="text-left py-3">Hora</th>
              <th className="text-left py-3">Observação</th>
            </tr>
          </thead>

          <tbody>
            {dados.map((p) => (
              <tr key={p.id} className="border-b border-slate-800">
                <td className="py-3 font-semibold">{p.local || "-"}</td>
                <td>{p.guarda || "-"}</td>
                <td>{p.hora || "-"}</td>
                <td>{p.observacao || "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}

function TabelaChamados({ dados }: { dados: any[] }) {
  return (
    <section className="card overflow-x-auto">
      <h2 className="text-xl font-bold mb-4">Chamados do Plantão</h2>

      {dados.length === 0 ? (
        <p className="text-slate-400">Nenhum chamado no período.</p>
      ) : (
        <table className="w-full text-sm">
          <thead className="text-slate-400 border-b border-slate-700">
            <tr>
              <th className="text-left py-3">Título</th>
              <th className="text-left py-3">Local</th>
              <th className="text-left py-3">Status</th>
              <th className="text-left py-3">Prioridade</th>
            </tr>
          </thead>

          <tbody>
            {dados.map((c) => (
              <tr key={c.id} className="border-b border-slate-800">
                <td className="py-3 font-semibold">
                  {c.titulo || c.descricao || "Chamado"}
                </td>
                <td>{c.local || "-"}</td>
                <td>{c.status || "-"}</td>
                <td>{c.prioridade || "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}

function TabelaVisitas({
  dados,
}: {
  dados: any[];
}) {
  return (
    <section className="card overflow-x-auto">
      <h2 className="text-xl font-bold mb-4">
        Visitas e Ações Preventivas
      </h2>

      {dados.length === 0 ? (
        <p className="text-slate-400">
          Nenhuma visita registrada.
        </p>
      ) : (
        <table className="w-full text-sm">
          <thead className="text-slate-400 border-b border-slate-700">
            <tr>
              <th className="text-left py-3">
                Tipo
              </th>

              <th className="text-left py-3">
                Local
              </th>

              <th className="text-left py-3">
                Guarnição
              </th>

              <th className="text-left py-3">
                Data
              </th>
            </tr>
          </thead>

          <tbody>
            {dados.map((v) => (
              <tr
                key={v.id}
                className="border-b border-slate-800"
              >
                <td className="py-3 font-semibold">
                  {v.tipo}
                </td>

                <td>{v.local}</td>

                <td>
                  {v.guarnicoes?.nome || "-"}
                </td>

                <td>
                  {new Date(
                    v.data_visita
                  ).toLocaleString("pt-BR")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}

function Check({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (valor: boolean) => void;
}) {
  return (
    <label className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-950/40 p-3 cursor-pointer">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span>{label}</span>
    </label>
  );
}

function TabelaApoios({
  dados,
}: {
  dados: any[];
}) {
  return (
    <section className="card overflow-x-auto">
      <h2 className="text-xl font-bold mb-4">
        Apoios Operacionais
      </h2>

      {dados.length === 0 ? (
        <p>Nenhum apoio registrado.</p>
      ) : (
        <table className="w-full text-sm">
          <tbody>
            {dados.map((a) => (
              <tr key={a.id}>
                <td>{a.tipo}</td>
                <td>{a.local}</td>
                <td>{a.descricao}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}

function TabelaEventos({
  dados,
}: {
  dados: any[];
}) {
  return (
    <section className="card overflow-x-auto">
      <h2 className="text-xl font-bold mb-4">
        Eventos
      </h2>

      {dados.length === 0 ? (
        <p>Nenhum evento.</p>
      ) : (
        <table className="w-full text-sm">
          <tbody>
            {dados.map((e) => (
              <tr key={e.id}>
                <td>{e.nome}</td>
                <td>{e.local}</td>
                <td>{e.data_evento}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}

function TabelaOperacoes({
  dados,
}: {
  dados: any[];
}) {
  return (
    <section className="card overflow-x-auto">
      <h2 className="text-xl font-bold mb-4">
        Operações
      </h2>

      {dados.length === 0 ? (
        <p>Nenhuma operação.</p>
      ) : (
        <table className="w-full text-sm">
          <tbody>
            {dados.map((o) => (
              <tr key={o.id}>
                <td>{o.nome}</td>
                <td>{o.local}</td>
                <td>{o.descricao}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}

function TabelaPessoas({
  dados,
}: {
  dados: any[];
}) {
  return (
    <section className="card overflow-x-auto">
      <h2 className="text-xl font-bold mb-4">
        Pessoas Abordadas
      </h2>

      {dados.length === 0 ? (
        <p>Nenhuma pessoa abordada.</p>
      ) : (
        <table className="w-full text-sm">
          <tbody>
            {dados.map((p) => (
              <tr key={p.id}>
                <td>{p.nome}</td>
                <td>{p.cpf}</td>
                <td>{p.local}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}

function TabelaVeiculos({
  dados,
}: {
  dados: any[];
}) {
  return (
    <section className="card overflow-x-auto">
      <h2 className="text-xl font-bold mb-4">
        Veículos Abordados
      </h2>

      {dados.length === 0 ? (
        <p>Nenhum veículo abordado.</p>
      ) : (
        <table className="w-full text-sm">
          <tbody>
            {dados.map((v) => (
              <tr key={v.id}>
                <td>{v.placa}</td>
                <td>{v.modelo}</td>
                <td>{v.local}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}

function TabelaAbastecimentos({
  dados,
}: {
  dados: any[];
}) {
  return (
    <section className="card overflow-x-auto">
      <h2 className="text-xl font-bold mb-4">
        Abastecimentos
      </h2>

      {dados.length === 0 ? (
        <p>Nenhum abastecimento.</p>
      ) : (
        <table className="w-full text-sm">
          <tbody>
            {dados.map((a) => (
              <tr key={a.id}>
                <td>
                  {a.viaturas?.prefixo}
                </td>

                <td>{a.litros} L</td>

                <td>
                  R$ {a.valor}
                </td>

                <td>
                  {new Date(
                    a.data_abastecimento
                  ).toLocaleDateString(
                    "pt-BR"
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}
