"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export default function RelatorioPlantaoPage() {

  const [data, setData] = useState("");
  const [ocorrencias, setOcorrencias] = useState<any[]>([]);
  const [patrulhamentos, setPatrulhamentos] = useState<any[]>([]);
  const [chamados, setChamados] = useState<any[]>([]);
  const [carregando, setCarregando] = useState(false);

  async function carregarRelatorio() {
  if (!data) return;

  setCarregando(true);

  const dataInicio = data;
  const usuario = JSON.parse(
  localStorage.getItem("usuarioLogado") || "{}"
);

const municipioId = usuario.municipio_id;

  const proximoDia = new Date(`${data}T00:00:00`);
  proximoDia.setDate(proximoDia.getDate() + 1);
  const dataFim = proximoDia.toISOString().split("T")[0];

  const { data: ocorr } = await supabase
    .from("ocorrencias")
.select("*")
.eq("municipio_id", municipioId)
.or(
      `and(data.eq.${dataInicio},hora.gte.07:00),and(data.eq.${dataFim},hora.lte.07:00)`
    );

  const { data: patr } = await supabase
    .from("patrulhamentos")
.select("*")
.eq("municipio_id", municipioId)
.or(
      `and(data.eq.${dataInicio},hora.gte.07:00),and(data.eq.${dataFim},hora.lte.07:00)`
    );

  const inicio = `${dataInicio} 07:00:00`;
  const fim = `${dataFim} 07:00:00`;

  const { data: cham } = await supabase
    .from("chamados")
.select("*")
.eq("municipio_id", municipioId)
.gte("criado_em", inicio)
    .lte("criado_em", fim);

  setOcorrencias(ocorr || []);
  setPatrulhamentos(patr || []);
  setChamados(cham || []);
  setCarregando(false);
}

  useEffect(() => {
    carregarRelatorio();
  }, [data]);

  const municipioLogado = JSON.parse(
  localStorage.getItem("usuarioLogado") || "{}"
);
const usuario = JSON.parse(
  localStorage.getItem("usuarioLogado") || "{}"
);

 async function gerarPDF() {
  if (!data) {
    alert("Selecione a data do plantão.");
    return;
  }

  const { data: municipioInfo } = await supabase
  .from("municipios")
  .select("*")
  .eq("id", usuario.municipio_id)
  .single();

const brasaoMunicipio = municipioInfo?.brasao_prefeitura || "";
const brasaoGCM = municipioInfo?.brasao_gcm || "";

const doc = new jsPDF();

const imgPrefeitura = new Image();
imgPrefeitura.src = brasaoMunicipio;

const imgGCM = new Image();
imgGCM.src = brasaoGCM;

const municipio = municipioInfo?.nome || "";
const guarda = municipioInfo?.nome_guarda || "";
  const numeroRelatorio = `RGP-${data.replaceAll("-", "")}`;
  const dataEmissao = new Date().toLocaleString("pt-BR");

  // Marca d'água
  doc.setFontSize(30);
  doc.setTextColor(230, 230, 230);
  doc.text("SIG-GCM BRASIL", 105, 150, {
    align: "center",
    angle: 45,
  });

  try {
  doc.addImage(imgPrefeitura, "PNG", 10, 5, 22, 22);
  doc.addImage(imgGCM, "PNG", 178, 5, 22, 22);
} catch {}

  // Cabeçalho
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(16);
  doc.text(guarda, 105, 12, { align: "center" });
doc.setFontSize(12);

doc.text(
  `Município de ${municipio}`,
  105,
  18,
  { align: "center" }
);
doc.text("RELATÓRIO GERAL DO PLANTÃO", 105, 26, {
  align: "center",
});

  doc.setFontSize(10);
  doc.text(`Relatório nº: ${numeroRelatorio}`, 14, 32);
  doc.text(`Plantão: ${data} - 07h às 07h`, 14, 38);
  doc.text(`Emitido em: ${dataEmissao}`, 14, 44);

  doc.setFontSize(13);
  doc.text("Resumo Operacional", 14, 55);

  autoTable(doc, {
  startY: 62,

  theme: "grid",

  headStyles: {
    fillColor: [15, 23, 42],
    textColor: [255, 255, 255],
  },

  head: [["Item", "Quantidade"]],

  body: [
    ["Ocorrências", ocorrencias.length],
    ["Patrulhamentos", patrulhamentos.length],
    ["Chamados", chamados.length],
  ],
});

  const abertas = ocorrencias.filter(
  (o) => o.status === "Aberta"
).length;

const andamento = ocorrencias.filter(
  (o) => o.status === "Em andamento"
).length;

const finalizadas = ocorrencias.filter(
  (o) => o.status === "Finalizada"
).length;

autoTable(doc, {
  startY: (doc as any).lastAutoTable.finalY + 10,

  theme: "grid",

  headStyles: {
    fillColor: [15, 23, 42],
    textColor: [255, 255, 255],
  },

  head: [["Situação", "Quantidade"]],

  body: [
    ["Abertas", abertas],
    ["Em andamento", andamento],
    ["Finalizadas", finalizadas],
  ],
});

  autoTable(doc, {
    startY: (doc as any).lastAutoTable.finalY + 12,
    head: [["Tipo", "Local", "Bairro", "Hora", "Status"]],
    body: ocorrencias.map((o) => [
      o.tipo || "-",
      o.local || "-",
      o.bairro || "-",
      o.hora || "-",
      o.status || "-",
    ]),
  });

  doc.addPage();

  doc.setFontSize(14);
  doc.text("Patrulhamentos do Plantão", 14, 15);

  autoTable(doc, {
    startY: 22,
    head: [["Local", "Guarda", "Hora", "Observação"]],
    body: patrulhamentos.map((p) => [
      p.local || "-",
      p.guarda || "-",
      p.hora || "-",
      p.observacao || "-",
    ]),
  });

  doc.addPage();

  doc.setFontSize(14);
  doc.text("Chamados do Plantão", 14, 15);

  autoTable(doc, {
    startY: 22,
    head: [["Título", "Local", "Status", "Prioridade"]],
    body: chamados.map((c) => [
      c.titulo || c.descricao || "Chamado",
      c.local || "-",
      c.status || "-",
      c.prioridade || "-",
    ]),
  });

  doc.text("__________________________________", 14, 260);
  doc.text(
  `Comandante: ${municipioInfo?.comandante || ""}`,
  25,
  268
);

  doc.text("__________________________________", 120, 260);
  doc.text(
  `Plantonista: ${usuario.nome || ""}`,
  130,
  268
);

  const paginas = doc.getNumberOfPages();

for (let i = 1; i <= paginas; i++) {
  doc.setPage(i);

  doc.setFontSize(9);

  doc.text(
    `SIG-GCM Brasil | Página ${i} de ${paginas}`,
    105,
    290,
    { align: "center" }
  );
}

  doc.save(`relatorio-plantao-${data}.pdf`);
}

  return (
    <div className="p-3 md:p-6 pb-24 space-y-6">
      <header className="border-b border-slate-800 pb-5">
        <h1 className="text-2xl md:text-3xl font-bold">
          Relatório Geral do Plantão
        </h1>

        <p className="text-slate-400 text-sm md:text-base">
          Resumo completo das atividades operacionais do plantão.
        </p>

        <div className="mt-4">
          <label className="block text-sm text-slate-400 mb-1">
            Data do plantão
          </label>

          <input
            type="date"
            value={data}
            onChange={(e) => setData(e.target.value)}
            className="bg-slate-950 border border-slate-700 rounded-lg px-4 py-2 text-white"
          />

          <p className="text-xs text-slate-500 mt-2">
  Período considerado: 07h do dia selecionado até 07h do dia seguinte.
</p>
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
          <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card titulo="Ocorrências" valor={ocorrencias.length} cor="blue" />
            <Card titulo="Patrulhamentos" valor={patrulhamentos.length} cor="green" />
            <Card titulo="Chamados" valor={chamados.length} cor="orange" />
          </section>

          <section className="flex justify-end">
  <button
  onClick={gerarPDF}
  className="bg-red-600 hover:bg-red-700 text-white px-5 py-3 rounded-xl font-semibold transition"
>
  📄 Gerar PDF Oficial
</button>
</section>

          <TabelaOcorrencias dados={ocorrencias} />
          <TabelaPatrulhamentos dados={patrulhamentos} />
          <TabelaChamados dados={chamados} />
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