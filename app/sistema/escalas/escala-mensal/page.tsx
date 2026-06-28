"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import ProtecaoPerfil from "@/components/ProtecaoPerfil";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

type Municipio = {
  id: number;
  nome: string;
  estado: string;
  emblema_url: string | null;
};

type Guarnicao = {
  id: number;
  nome: string;
  ativa: boolean;
  municipio_id: number;
};

type Guarda = {
  id: number;
  nome: string;
  matricula: string;
};

type RegistroEscala = {
  id: number;
  municipio_id: number;
  mes: string;
  ano: string;
  data_servico: string;
  guarda_nome: string;
  matricula: string | null;
  tipo: string | null;
  turno: string | null;
  equipe: string | null;
  observacao: string | null;
};

export default function EscalaMensalPage() {
  const hoje = new Date();
  const mesAtual = String(hoje.getMonth() + 1).padStart(2, "0");
  const anoAtual = String(hoje.getFullYear());

  const [municipios, setMunicipios] = useState<Municipio[]>([]);
  const [municipioId, setMunicipioId] = useState("");
  const [guarnicoes, setGuarnicoes] = useState<Guarnicao[]>([]);
  const [registros, setRegistros] = useState<RegistroEscala[]>([]);
  const [membrosGuarnicao, setMembrosGuarnicao] = useState<any[]>([]);
  
  const [mes, setMes] = useState(mesAtual);
  const [ano, setAno] = useState(anoAtual);
  const [guarnicaoInicialId, setGuarnicaoInicialId] = useState("");
  const [horarioPadrao, setHorarioPadrao] = useState("07:00 às 07:00");
  const [tipoEscala, setTipoEscala] = useState("24x96");
  const [guardas, setGuardas] = useState<Guarda[]>([]);
  const [usarConfiguracao, setUsarConfiguracao] = useState(true);
  const [configEscala, setConfigEscala] = useState<any>(null);
  

  const [carregando, setCarregando] = useState(false);

  async function carregarMunicipios() {
    const { data, error } = await supabase
      .from("municipios")
      .select("id, nome, estado, emblema_url")
      .eq("ativo", true)
      .order("nome");

    if (error) {
      console.error(error);
      alert("Erro ao carregar municípios.");
      return;
    }

    setMunicipios(data || []);

    const usuario = JSON.parse(localStorage.getItem("usuarioLogado") || "{}");
    if (usuario?.municipio_id) {
      setMunicipioId(String(usuario.municipio_id));
    }
  }

  async function carregarDados() {
    if (!municipioId) return;

    setCarregando(true);

    const { data: guarnicoesData, error: erroGuarnicoes } = await supabase
      .from("guarnicoes")
      .select("id, nome, ativa, municipio_id")
      .eq("municipio_id", Number(municipioId))
      .eq("ativa", true)
      .order("nome");

const { data: configData } = await supabase
  .from("escala_operacional_config")
  .select("*")
  .eq("municipio_id", Number(municipioId))
  .eq("ativo", true)
  .maybeSingle();

setConfigEscala(configData);

      const { data: guardasData, error: erroGuardas } = await supabase
  .from("guardas")
  .select("id, nome, matricula")
  .eq("municipio_id", Number(municipioId))
  .order("nome");

if (erroGuardas) {
  console.error(erroGuardas);
}

    if (erroGuarnicoes) {
      console.error(erroGuarnicoes);
      alert("Erro ao carregar guarnições.");
    }
    

    const { data: escalaData, error: erroEscala } = await supabase
      .from("escala_mensal")
      .select("*")
      .eq("municipio_id", Number(municipioId))
      .eq("mes", mes)
      .eq("ano", ano)
      .order("data_servico", { ascending: true });

    if (erroEscala) {
      console.error(erroEscala);
      alert("Erro ao carregar escala mensal.");
    }

    const { data: membrosData, error: erroMembros } = await supabase
  .from("guarnicao_membros")
  .select("*")
  .eq("municipio_id", Number(municipioId));

if (erroMembros) {
  console.error(erroMembros);
}

setMembrosGuarnicao(membrosData || []);

    setGuarnicoes(guarnicoesData || []);
    setRegistros(escalaData || []);
    setGuardas(guardasData || []);
    setCarregando(false);
  }

  useEffect(() => {
    carregarMunicipios();
  }, []);

  useEffect(() => {
    carregarDados();
  }, [municipioId, mes, ano]);

  const diasNoMes = new Date(Number(ano), Number(mes), 0).getDate();

  const primeiroDiaSemana = new Date(Number(ano), Number(mes) - 1, 1).getDay();

const diasCalendario = useMemo(() => {
  const dias: any[] = [];
  const diasMesAnterior = new Date(Number(ano), Number(mes) - 1, 0).getDate();

  for (let i = primeiroDiaSemana - 1; i >= 0; i--) {
    dias.push({
      dia: diasMesAnterior - i,
      data: "",
      foraDoMes: true,
      registro: null,
    });
  }

  for (let dia = 1; dia <= diasNoMes; dia++) {
    const data = `${ano}-${mes}-${String(dia).padStart(2, "0")}`;
    const registro = registros.find((r) => r.data_servico === data);

    dias.push({
      dia,
      data,
      foraDoMes: false,
      registro,
    });
  }

  while (dias.length % 7 !== 0) {
    dias.push({
      dia: "",
      data: "",
      foraDoMes: true,
      registro: null,
    });
  }

  return dias;
}, [primeiroDiaSemana, diasNoMes, ano, mes, registros]);

  function corGuarnicao(nome?: string | null) {
  if (!nome) return "bg-slate-700";

  const n = nome.toLowerCase();

  if (n.includes("alfa")) return "bg-blue-600/80";
  if (n.includes("bravo")) return "bg-emerald-600/80";
  if (n.includes("charlie")) return "bg-violet-600/80";
  if (n.includes("delta")) return "bg-amber-600/80";
  if (n.includes("echo")) return "bg-cyan-600/80";

  return "bg-slate-700";
}

  async function gerarEscalaAutomatica() {
  if (!municipioId) return alert("Selecione o município.");
  if (guarnicoes.length === 0) return alert("Nenhuma guarnição ativa cadastrada.");

  if (!confirm(`Gerar escala ${tipoEscala} para ${mes}/${ano}?`)) return;

  const indiceInicial = guarnicaoInicialId
    ? guarnicoes.findIndex((g) => g.id === Number(guarnicaoInicialId))
    : 0;

  let inicio = indiceInicial >= 0 ? indiceInicial : 0;

if (
  usarConfiguracao &&
  configEscala?.guarnicao_base_id
) {
  const indiceConfig = guarnicoes.findIndex(
    (g) => g.id === configEscala.guarnicao_base_id
  );

  if (indiceConfig >= 0) {
    inicio = indiceConfig;
  }
}
  let diasPorGuarnicao = 1;

switch (tipoEscala) {
  case "24x96":
    diasPorGuarnicao = 1;
    break;

  case "12x36":
    diasPorGuarnicao = 1;
    break;

  case "24x72":
    diasPorGuarnicao = 1;
    break;

  case "48x144":
    diasPorGuarnicao = 2;
    break;

  default:
    diasPorGuarnicao = 1;
}

  const novosRegistros = [];

  for (let dia = 1; dia <= diasNoMes; dia++) {
    const data = `${ano}-${mes}-${String(dia).padStart(2, "0")}`;
    const bloco = Math.floor((dia - 1) / diasPorGuarnicao);
    const guarnicao = guarnicoes[(inicio + bloco) % guarnicoes.length];

    novosRegistros.push({
      municipio_id: Number(municipioId),
      mes,
      ano,
      data_servico: data,
      guarda_nome: guarnicao.nome,
      matricula: "",
      tipo: "Plantão",
      turno: horarioPadrao,
      equipe: guarnicao.nome,
      observacao: `Gerado automaticamente - Escala ${tipoEscala}`,
    });
  }

  await supabase
    .from("escala_mensal")
    .delete()
    .eq("municipio_id", Number(municipioId))
    .eq("mes", mes)
    .eq("ano", ano)
    .like("observacao", "Gerado automaticamente%");

  const { error } = await supabase.from("escala_mensal").insert(novosRegistros);

  if (error) {
    console.error(error);
    alert(error.message || "Erro ao gerar escala.");
    return;
  }

  alert("Escala gerada com sucesso.");
  carregarDados();
}

  async function excluirRegistro(id: number) {
    if (!confirm("Excluir este registro?")) return;

    const { error } = await supabase
      .from("escala_mensal")
      .delete()
      .eq("id", id)
      .eq("municipio_id", Number(municipioId));

    if (error) {
      console.error(error);
      alert("Erro ao excluir registro.");
      return;
    }

    carregarDados();
  }

  function gerarPDF() {
  const municipio = municipios.find((m) => m.id === Number(municipioId));

  if (!municipio) {
    alert("Selecione o município.");
    return;
  }

  if (registros.length === 0) {
    alert("Gere ou cadastre a escala antes de emitir o PDF.");
    return;
  }

  const pdf = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const navy: [number, number, number] = [8, 29, 58];
  const gold: [number, number, number] = [212, 175, 55];
  const border: [number, number, number] = [190, 198, 210];

  const meses: Record<string, string> = {
    "01": "JANEIRO",
    "02": "FEVEREIRO",
    "03": "MARÇO",
    "04": "ABRIL",
    "05": "MAIO",
    "06": "JUNHO",
    "07": "JULHO",
    "08": "AGOSTO",
    "09": "SETEMBRO",
    "10": "OUTUBRO",
    "11": "NOVEMBRO",
    "12": "DEZEMBRO",
  };

  function corPDF(nome: string): [number, number, number] {
    const n = nome.toLowerCase();

    if (n.includes("alfa")) return [37, 99, 235];
    if (n.includes("bravo")) return [22, 163, 74];
    if (n.includes("charlie")) return [126, 58, 242];
    if (n.includes("delta")) return [202, 138, 4];
    if (n.includes("echo")) return [8, 145, 178];

    return [15, 23, 42];
  }

  function header(titulo: string, subtitulo: string) {
    pdf.setTextColor(...navy);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(11);
    pdf.text(
      `GUARDA CIVIL MUNICIPAL DE ${(municipio?.nome || "").toUpperCase()}`,
      14,
      14
    );

    pdf.setFontSize(22);
    pdf.text(titulo, 14, 26);

    pdf.setFontSize(9);
    pdf.text(subtitulo, 14, 34);
    pdf.text("SISTEMA INTEGRADO DE GESTÃO - SIG-GCM", 14, 39);

    pdf.setFillColor(...navy);
    pdf.roundedRect(155, 10, 42, 22, 2, 2, "F");

    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(8);
    pdf.text("MÊS / ANO", 176, 18, { align: "center" });

    pdf.setTextColor(...gold);
    pdf.setFontSize(12);
    pdf.text(`${meses[mes]} / ${ano}`, 176, 26, { align: "center" });

    pdf.setDrawColor(...gold);
    pdf.setLineWidth(0.6);
    pdf.line(14, 44, 196, 44);
  }

  function footer() {
    pdf.setFillColor(...gold);
    pdf.rect(0, 281, 210, 2, "F");

    pdf.setFillColor(...navy);
    pdf.rect(0, 283, 210, 14, "F");

    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(9);
    pdf.setFont("helvetica", "bold");
    pdf.text("“PROTEGER E SERVIR”", 105, 291, { align: "center" });
  }

  // PÁGINA 1 — CALENDÁRIO
  header(
    "ESCALA OPERACIONAL",
    `PLANEJAMENTO MENSAL DE SERVIÇO - ESCALA ${tipoEscala}`
  );

  const infos = [
    ["DIAS NO MÊS", String(diasNoMes)],
    ["REGISTROS", String(registros.length)],
    ["GUARNIÇÕES", String(guarnicoes.length)],
    ["HORÁRIO", horarioPadrao],
  ];

  infos.forEach((item, i) => {
    const x = 14 + i * 45.5;

    pdf.setDrawColor(...border);
    pdf.setFillColor(255, 255, 255);
    pdf.roundedRect(x, 50, 43, 16, 2, 2, "FD");

    pdf.setTextColor(...navy);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(7);
    pdf.text(item[0], x + 4, 56);

    pdf.setFontSize(11);
    pdf.text(item[1], x + 4, 63);
  });

  const diasSemana = ["DOMINGO", "SEGUNDA", "TERÇA", "QUARTA", "QUINTA", "SEXTA", "SÁBADO"];
  const primeiroDia = new Date(Number(ano), Number(mes) - 1, 1).getDay();
  const calX = 14;
  const calY = 74;
  const cellW = 182 / 7;
  const cellH = 25;

  diasSemana.forEach((d, i) => {
    pdf.setFillColor(...navy);
    pdf.setDrawColor(180, 190, 205);
    pdf.rect(calX + i * cellW, calY, cellW, 8, "FD");

    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(7);
    pdf.setFont("helvetica", "bold");
    pdf.text(d, calX + i * cellW + cellW / 2, calY + 5.5, {
      align: "center",
    });
  });

  for (let i = 0; i < 42; i++) {
    const col = i % 7;
    const row = Math.floor(i / 7);
    const diaNumero = i - primeiroDia + 1;
    const x = calX + col * cellW;
    const y = calY + 8 + row * cellH;

    pdf.setDrawColor(205, 210, 218);
    pdf.setFillColor(255, 255, 255);
    pdf.rect(x, y, cellW, cellH, "FD");

    if (diaNumero >= 1 && diaNumero <= diasNoMes) {
      const data = `${ano}-${mes}-${String(diaNumero).padStart(2, "0")}`;
      const registro = registros.find((r) => r.data_servico === data);
      const nome = registro?.equipe || registro?.guarda_nome || "Sem escala";
      const c = corPDF(nome);

      pdf.setTextColor(col === 0 ? 200 : 5, 25, 45);
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(9);
      pdf.text(String(diaNumero).padStart(2, "0"), x + 3, y + 6);

      pdf.setTextColor(...c);
      pdf.setFontSize(6.5);
      pdf.text(nome, x + 3, y + 12);

      pdf.setTextColor(...navy);
      pdf.setFontSize(6);
      pdf.text(horarioPadrao, x + 3, y + 17);
    }
  }

  const legendaY = 238;

  pdf.setDrawColor(...border);
  pdf.roundedRect(14, legendaY, 65, 32, 2, 2, "S");

  pdf.setFillColor(...navy);
  pdf.rect(14, legendaY, 65, 8, "F");

  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(8);
  pdf.setFont("helvetica", "bold");
  pdf.text("LEGENDA", 18, legendaY + 5.5);

  guarnicoes.forEach((g, i) => {
    const y = legendaY + 13 + i * 4;
    pdf.setFillColor(...corPDF(g.nome));
    pdf.roundedRect(18, y - 2.5, 6, 2, 1, 1, "F");

    pdf.setTextColor(...navy);
    pdf.setFontSize(7);
    pdf.text(g.nome, 28, y);
  });

  pdf.roundedRect(84, legendaY, 112, 32, 2, 2, "S");

  pdf.setFillColor(...navy);
  pdf.rect(84, legendaY, 112, 8, "F");

  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(8);
  pdf.text("INFORMAÇÕES", 90, legendaY + 5.5);

  pdf.setTextColor(...navy);
  pdf.setFontSize(7);
  pdf.text(`• Escala gerada no modelo ${tipoEscala}.`, 90, legendaY + 14);
  pdf.text(`• Horário padrão: ${horarioPadrao}.`, 90, legendaY + 20);
  pdf.text("• Alterações devem ser atualizadas no SIG-GCM.", 90, legendaY + 26);

  footer();

  // PÁGINA 2 — RESUMO POR GUARNIÇÃO
  pdf.addPage("a4", "portrait");

  header(
    "RESUMO POR GUARNIÇÃO",
    `DISTRIBUIÇÃO DE PLANTÕES - ${meses[mes]} / ${ano}`
  );

  const resumoBody = guarnicoes.map((g) => {
    const dias = registros
      .filter((r) => (r.equipe || r.guarda_nome) === g.nome)
      .map((r) => r.data_servico.split("-")[2])
      .join(", ");

    const integrantes = membrosGuarnicao
      .filter((m: any) => m.guarnicao_id === g.id)
      .map((m: any) => {
        const guardaEncontrado = guardas.find(
  (g) => g.id === m.guarda_id
);

return guardaEncontrado
  ? `• ${guardaEncontrado.nome} (${guardaEncontrado.matricula})`
  : null;
      })
      .filter(Boolean)
      .join("\n");

    const total = registros.filter(
      (r) => (r.equipe || r.guarda_nome) === g.nome
    ).length;

    return [
      g.nome,
      integrantes || "Integrantes não cadastrados",
      dias || "-",
      `${total} plantões`,
    ];
  });

  autoTable(pdf, {
    startY: 52,
    head: [["GUARNIÇÃO", "INTEGRANTES / MATRÍCULA", "DIAS", "TOTAL"]],
    body: resumoBody,
    theme: "grid",
    styles: {
      fontSize: 8,
      cellPadding: 3,
      valign: "middle",
      lineColor: border,
      lineWidth: 0.2,
      textColor: navy,
    },
    headStyles: {
      fillColor: navy,
      textColor: [255, 255, 255],
      fontStyle: "bold",
      halign: "center",
    },
    columnStyles: {
      0: { cellWidth: 40, fontStyle: "bold", halign: "center" },
      1: { cellWidth: 70 },
      2: { cellWidth: 45, halign: "center" },
      3: { cellWidth: 27, halign: "center", fontStyle: "bold" },
    },
    didParseCell: (data) => {
      if (data.section === "body" && data.column.index === 0) {
        const nome = String(data.cell.raw);
        data.cell.styles.textColor = corPDF(nome);
      }
    },
  });

  pdf.setDrawColor(...border);
  pdf.roundedRect(14, 244, 182, 24, 2, 2, "S");

  pdf.setTextColor(...navy);
  pdf.setFontSize(8);
  pdf.setFont("helvetica", "bold");
  pdf.text("OBSERVAÇÕES", 18, 251);

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(7);
  pdf.text("• Este documento foi gerado automaticamente pelo SIG-GCM.", 18, 257);
  pdf.text("• Substituições, férias e permutas devem constar no sistema.", 18, 262);

  pdf.line(135, 258, 185, 258);
  pdf.setFont("helvetica", "bold");
  pdf.text("COMANDANTE", 160, 264, { align: "center" });

  footer();

  pdf.save(`Escala_Operacional_${mes}_${ano}.pdf`);
}

  const totalPlantao = registros.filter((r) => r.tipo === "Plantão").length;
  const hojeLocal = new Date();
const hojeISO = `${hojeLocal.getFullYear()}-${String(
  hojeLocal.getMonth() + 1
).padStart(2, "0")}-${String(hojeLocal.getDate()).padStart(2, "0")}`;

  return (
    <ProtecaoPerfil perfilMinimo="DIRETOR">
      <div className="p-3 md:p-6 pb-24">
        <header className="border-b border-slate-800 pb-5 mb-6">
          <h1 className="text-2xl md:text-4xl font-black text-white">
            Escala Mensal
          </h1>

          <p className="text-slate-400 mt-2">
            Geração simples da escala mensal 24/96 por guarnição.
          </p>

          <div className="flex flex-col md:flex-row gap-3 mt-5">
            <button onClick={gerarEscalaAutomatica} className="btn-primary">
              Gerar Escala Automática
            </button>

            <button onClick={gerarPDF} className="btn-secondary">
              Gerar PDF
            </button>
          </div>
        </header>

        <section className="card mb-6">
          <h2 className="text-xl font-bold mb-4">Filtros</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">

  <div>
    <label className="label">Município</label>
    <select
      className="input"
      value={municipioId}
      onChange={(e) => setMunicipioId(e.target.value)}
    >
      <option value="">Selecione</option>

      {municipios.map((m) => (
        <option key={m.id} value={m.id}>
          {m.nome} - {m.estado}
        </option>
      ))}
    </select>
  </div>

  <div>
    <label className="label">Mês</label>
    <select
      className="input"
      value={mes}
      onChange={(e) => setMes(e.target.value)}
    >
      <option value="01">Janeiro</option>
      <option value="02">Fevereiro</option>
      <option value="03">Março</option>
      <option value="04">Abril</option>
      <option value="05">Maio</option>
      <option value="06">Junho</option>
      <option value="07">Julho</option>
      <option value="08">Agosto</option>
      <option value="09">Setembro</option>
      <option value="10">Outubro</option>
      <option value="11">Novembro</option>
      <option value="12">Dezembro</option>
    </select>
  </div>

  <div>
    <label className="label">Ano</label>
    <input
      className="input"
      value={ano}
      onChange={(e) => setAno(e.target.value)}
    />
  </div>

  <div>
    <label className="label">Tipo de Escala</label>
    <select
      className="input"
      value={tipoEscala}
      onChange={(e) => setTipoEscala(e.target.value)}
    >
      <option value="24x96">24x96</option>
      <option value="12x36">12x36</option>
      <option value="24x72">24x72</option>
      <option value="48x144">48x144</option>
    </select>
  </div>

  <div>
    <label className="label">Guarnição Inicial</label>
    <select
      className="input"
      value={guarnicaoInicialId}
      onChange={(e) => setGuarnicaoInicialId(e.target.value)}
    >
      <option value="">Primeira da lista</option>

      {guarnicoes.map((g) => (
        <option key={g.id} value={g.id}>
          {g.nome}
        </option>
      ))}
    </select>
  </div>

  <div>
    <label className="label">Horário Padrão</label>
    <input
      className="input"
      value={horarioPadrao}
      onChange={(e) => setHorarioPadrao(e.target.value)}
    />
  </div>
</div>

<div className="mt-4">
  <label className="flex items-center gap-2">
    <input
      type="checkbox"
      checked={usarConfiguracao}
      onChange={(e) =>
        setUsarConfiguracao(e.target.checked)
      }
    />

    <span>Usar configuração salva</span>
  </label>
</div>
</section>

<section className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
  <Card titulo="Registros" valor={registros.length} />
  <Card titulo="Plantões" valor={totalPlantao} />
  <Card titulo="Guarnições Ativas" valor={guarnicoes.length} />
</section>

<section className="card mb-6">
  <div className="flex items-center justify-between mb-4">
    <div>
      <h2 className="text-2xl font-black text-white">
        Calendário Operacional
      </h2>
      <p className="text-sm text-slate-400">
        Escala mensal organizada por semana.
      </p>
    </div>
  </div>

  <div className="grid grid-cols-7 gap-px bg-slate-700/60 rounded-2xl overflow-hidden border border-slate-700">
    {["DOM", "SEG", "TER", "QUA", "QUI", "SEX", "SÁB"].map((dia) => (
      <div
        key={dia}
        className="bg-slate-950 px-2 py-3 text-center text-xs font-black text-slate-300"
      >
        {dia}
      </div>
    ))}

    {diasCalendario.map((dia, index) => {
      const nome = dia.registro?.equipe || "Sem escala";
      const ehHoje = dia.data === hojeISO;

      return (
        <div
          key={index}
          className={`relative min-h-32 md:min-h-36 p-3 ${
            dia.foraDoMes
              ? "bg-slate-950/60 text-slate-700"
              : "bg-slate-900/80"
          } ${ehHoje ? "ring-2 ring-yellow-400 z-10" : ""}`}
        >
          <div className="flex items-start justify-between">
            <span
              className={`text-xl font-black ${
                ehHoje ? "text-yellow-300" : "text-white"
              }`}
            >
              {dia.dia}
            </span>

            {ehHoje && (
              <span className="rounded-full bg-yellow-400 px-2 py-1 text-[10px] font-black text-black">
                HOJE
              </span>
            )}
          </div>

          {!dia.foraDoMes && dia.registro && (
            <div className="mt-6 flex flex-col items-center gap-2">
              <span
                className={`rounded-xl px-4 py-1 text-xs font-black text-white shadow ${
                  corGuarnicao(nome).replace("bg-", "bg-")
                }`}
              >
                {nome.replace("Guarnição ", "")}
              </span>

              <span className="text-[11px] text-slate-400">
                {dia.registro.turno || horarioPadrao}
              </span>
            </div>
          )}

          {!dia.foraDoMes && !dia.registro && (
            <p className="mt-8 text-center text-xs text-slate-500">
              Sem escala
            </p>
          )}
        </div>
      );
    })}
  </div>
</section>

        <section className="card">
          <h2 className="text-2xl font-bold mb-4">Lista da Escala</h2>

          {registros.length === 0 ? (
            <p className="text-slate-400">Nenhum registro encontrado.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-slate-400 border-b border-slate-700">
                  <tr>
                    <th className="text-left py-3">Data</th>
                    <th className="text-left py-3">Guarnição</th>
                    <th className="text-left py-3">Turno</th>
                    <th className="text-left py-3">Tipo</th>
                    <th className="text-right py-3">Ações</th>
                  </tr>
                </thead>

                <tbody>
                  {registros.map((item) => (
                    <tr key={item.id} className="border-b border-slate-800">
                      <td className="py-4 text-blue-400 font-semibold">
                        {item.data_servico}
                      </td>
                      <td>{item.equipe || item.guarda_nome}</td>
                      <td className="text-slate-400">{item.turno || "-"}</td>
                      <td>{item.tipo || "-"}</td>
                      <td className="text-right">
                        <button
                          onClick={() => excluirRegistro(item.id)}
                          className="bg-red-700 hover:bg-red-800 px-3 py-2 rounded-lg text-xs"
                        >
                          Excluir
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </ProtecaoPerfil>
  );
}

function Card({ titulo, valor }: { titulo: string; valor: number }) {
  return (
    <div className="card min-h-28 flex flex-col justify-center">
      <p className="text-slate-400">{titulo}</p>
      <h2 className="text-4xl font-black">{valor}</h2>
    </div>
  );
}