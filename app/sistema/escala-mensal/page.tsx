"use client";

import { useEffect, useState } from "react";
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

type EscalaMensal = {
  id: number;
  mes: string;
  ano: string;
  data_servico: string;
  guarda_nome: string;
  matricula: string | null;
  tipo: string | null;
  turno: string | null;
  equipe: string | null;
  observacao: string | null;
  municipio_id: number | null;
};

type Guarda = {
  id: number;
  nome: string;
  matricula: string;
  status: string;
};
type Guarnicao = {
  id: number;
  nome: string;
  ativa: boolean;
};




export default function EscalaMensalPage() {
  const [registros, setRegistros] = useState<EscalaMensal[]>([]);
  const [guardas, setGuardas] = useState<Guarda[]>([]);
  const [guarnicoes, setGuarnicoes] = useState<Guarnicao[]>([]);
  const [membrosGuarnicao, setMembrosGuarnicao] = useState<any[]>([]);
  
  const [municipios, setMunicipios] = useState<Municipio[]>([]);
  const [municipioId, setMunicipioId] = useState("");
  const [busca, setBusca] = useState("");

  const hoje = new Date();
  const mesAtual = String(hoje.getMonth() + 1).padStart(2, "0");
  const anoAtual = String(hoje.getFullYear());

  const [mes, setMes] = useState(mesAtual);
  const [ano, setAno] = useState(anoAtual);
  const [dataServico, setDataServico] = useState("");
  const [guardaNome, setGuardaNome] = useState("");
  const [matricula, setMatricula] = useState("");
  const [tipo, setTipo] = useState("Plantão");
  const [turno, setTurno] = useState("24 horas");
  const [equipe, setEquipe] = useState("Equipe Alfa");
  const [observacao, setObservacao] = useState("");

  const [carregando, setCarregando] = useState(true);

  async function carregarDados() {
    setCarregando(true);

    const { data: municipiosData } = await supabase
  .from("municipios")
  .select("id, nome, estado, emblema_url")
  .eq("ativo", true)
  .order("nome");

    const { data: escalaData, error: escalaError } = await supabase
      .from("escala_mensal")
.select("*")
.eq("municipio_id", Number(municipioId))
.order("data_servico", { ascending: true });

    if (escalaError) {
      console.error(escalaError);
      alert("Erro ao carregar escala mensal.");
    }

    const { data: guardasData, error: guardasError } = await supabase
      .from("guardas")
.select("id, nome, matricula, status")
.eq("municipio_id", Number(municipioId))
.order("nome", { ascending: true });
    if (guardasError) {
      console.error(guardasError);
      alert("Erro ao carregar guardas.");
    }

    const { data: guarnicoesData, error: guarnicoesError } = await supabase
  .from("guarnicoes")
.select("id, nome, ativa")
.eq("municipio_id", Number(municipioId))
.order("nome", { ascending: true });

    const { data: membrosData } = await supabase
  .from("guarnicao_membros")
.select("*")
.eq("municipio_id", Number(municipioId));

    
    if (guarnicoesError) {
      console.error(guarnicoesError);
      alert("Erro ao carregar guarnições.");
    }

    
    setRegistros(escalaData || []);
    setGuardas(guardasData || []);
    setGuarnicoes(guarnicoesData || []);
    setMembrosGuarnicao(membrosData || []);
    setMunicipios(municipiosData || []);
    
    
    setCarregando(false); 
  }

  function selecionarGuarda(nome: string) {
    const guarda = guardas.find((g) => g.nome === nome);

    setGuardaNome(nome);
    setMatricula(guarda?.matricula || "");
  }

  async function salvarRegistro() {
    if (!mes || !ano || !dataServico || !guardaNome || !tipo) {
      alert("Preencha mês, ano, data, guarda e tipo.");
      return;
    }

    const { error } = await supabase.from("escala_mensal").insert([
      {
  municipio_id: Number(municipioId),
  mes,
  ano,
  data_servico: dataServico,
  guarda_nome: guardaNome,
  matricula,
  tipo,
  turno,
  equipe,
  observacao,
},
    ]);

    if (error) {
      console.error(error);
      alert("Erro ao salvar registro da escala mensal.");
      return;
    }

    alert("Registro salvo na escala mensal!");

    setDataServico("");
    setGuardaNome("");
    setMatricula("");
    setTipo("Plantão");
    setTurno("24 horas");
    setEquipe("Equipe Alfa");
    setObservacao("");

    carregarDados();
  }

  async function excluirRegistro(id: number) {
    const confirmar = confirm("Deseja excluir este registro da escala mensal?");

    if (!confirmar) return;

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

  useEffect(() => {
    carregarDados();
  }, []);

  const registrosMes = registros.filter(
  (item) =>
    item.mes === mes &&
    item.ano === ano &&
    item.municipio_id === Number(municipioId)
);

  const filtrados = registrosMes.filter((item) => {
    const texto = `
      ${item.data_servico}
      ${item.guarda_nome}
      ${item.matricula || ""}
      ${item.tipo || ""}
      ${item.turno || ""}
      ${item.equipe || ""}
      ${item.observacao || ""}
    `.toLowerCase();

    return texto.includes(busca.toLowerCase());
  });

  const totalPlantao = registrosMes.filter((r) => r.tipo === "Plantão").length;
  const totalFolga = registrosMes.filter((r) => r.tipo === "Folga").length;
  const totalFerias = registrosMes.filter((r) => r.tipo === "Férias").length;
  const totalExtra = registrosMes.filter((r) => r.tipo === "Serviço Extra").length;

const diasNoMes = new Date(Number(ano), Number(mes), 0).getDate();

const diasCalendario = Array.from({ length: diasNoMes }, (_, index) => {
  const dia = index + 1;
  const data = `${ano}-${mes}-${String(dia).padStart(2, "0")}`;

  const registro = registrosMes.find((r) => r.data_servico === data);

  return {
    dia,
    data,
    registro,
  };
});

const hojeISO = new Date().toISOString().split("T")[0];

function corGuarnicao(nome?: string | null) {
  if (!nome) return "border-slate-700 bg-slate-950/40";

  if (nome.includes("Alfa")) return "border-green-500 bg-green-950/30";
  if (nome.includes("Bravo")) return "border-blue-500 bg-blue-950/30";
  if (nome.includes("Charlie")) return "border-purple-500 bg-purple-950/30";
  if (nome.includes("Delta")) return "border-yellow-500 bg-yellow-950/30";
  if (nome.includes("Echo")) return "border-cyan-500 bg-cyan-950/30";

  return "border-slate-700 bg-slate-950/40";
}

async function gerarEscalaAutomaticaMes() {
  if (!municipioId) {
    alert("Selecione o município antes de gerar a escala.");
    return;
  }

  const confirmar = confirm(`Gerar escala automática para ${mes}/${ano}?`);
  if (!confirmar) return;

  const { data: config, error: configError } = await supabase
    .from("escala_operacional_config")
    .select("*, escala_modelos(nome)")
    .eq("municipio_id", Number(municipioId))
    .eq("ativo", true)
    .single();

  if (configError || !config) {
    console.error(configError);
    alert("Nenhuma configuração de escala ativa encontrada para este município.");
    return;
  }

  const ordemGuarnicoes = config.ordem_guarnicoes
    .map((id: number) => guarnicoes.find((g) => g.id === id)?.nome)
    .filter(Boolean);

  if (ordemGuarnicoes.length === 0) {
    alert("A configuração não possui ordem de guarnições.");
    return;
  }

  const diasNoMes = new Date(Number(ano), Number(mes), 0).getDate();
  const dataBase = new Date(`${config.data_base}T07:00:00`);
  const indiceBase = config.ordem_guarnicoes.indexOf(config.guarnicao_base_id);

  const registrosGerados = [];

  for (let dia = 1; dia <= diasNoMes; dia++) {
    const data = `${ano}-${mes}-${String(dia).padStart(2, "0")}`;
    const dataAtual = new Date(`${data}T07:00:00`);

    const diasDiferenca = Math.floor(
      (dataAtual.getTime() - dataBase.getTime()) / (1000 * 60 * 60 * 24)
    );

    const indiceGuarnicao =
      ((indiceBase + diasDiferenca) % ordemGuarnicoes.length +
        ordemGuarnicoes.length) %
      ordemGuarnicoes.length;

    const nomeGuarnicao = ordemGuarnicoes[indiceGuarnicao];

    registrosGerados.push({
      municipio_id: Number(municipioId),
      mes,
      ano,
      data_servico: data,
      guarda_nome: nomeGuarnicao,
      matricula: "",
      tipo: config.escala_modelos?.nome || "Plantão",
      turno: config.escala_modelos?.nome || "",
      equipe: nomeGuarnicao,
      observacao: `Gerado automaticamente - ${config.escala_modelos?.nome || "Escala"}`,
    });
  }

  await supabase
    .from("escala_mensal")
    .delete()
    .eq("municipio_id", Number(municipioId))
    .eq("mes", mes)
    .eq("ano", ano)
    .like("observacao", "Gerado automaticamente%");

  const { error } = await supabase
    .from("escala_mensal")
    .insert(registrosGerados);

  if (error) {
    console.error(error);
    alert("Erro ao gerar escala.");
    return;
  }

  alert("Escala automática gerada com sucesso!");
  carregarDados();
  
}
  async function gerarPDFEscalaMensal() {
const municipioSelecionado = municipios.find(
  (m) => m.id === Number(municipioId)
);


if (!municipioSelecionado) {
  alert("Selecione um município.");
  return;

  const { data: configEscala } = await supabase
  .from("escala_operacional_config")
  .select(`
    *,
    escala_modelos(nome)
  `)
  .eq("municipio_id", Number(municipioId))
  .eq("ativo", true)
  .single();

const nomeEscalaPDF =
  configEscala?.escala_modelos?.nome ||
 ["ESCALA", registrosMes[0]?.tipo || "-"]
  "Não definida";
}

    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    const navy: [number, number, number] = [8, 29, 58];
    const gold: [number, number, number] = [212, 175, 55];
    const border: [number, number, number] = [190, 198, 210];

    const pageW = 210;
    const pageH = 297;
    const nomeMunicipio = municipioSelecionado.nome;
    const nomeMunicipioMaiusculo = nomeMunicipio.toUpperCase();

    const nomesMeses: Record<string, string> = {
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

    const cores: Record<string, [number, number, number]> = {
      "Guarnição Alfa": [46, 163, 38],
      "Guarnição Bravo": [37, 99, 235],
      "Guarnição Charlie": [126, 58, 242],
      "Guarnição Delta": [230, 162, 0],
      "Guarnição Echo": [0, 163, 184],
    };

   const ordemGuarnicoes = guarnicoes
  .map((g) => g.nome);

    function cor(nome: string): [number, number, number] {
      return cores[nome] || [15, 23, 42];
    }

    async function imagemParaBase64(url: string): Promise<string | null> {
      try {
        const resposta = await fetch(url);
        const blob = await resposta.blob();

        return await new Promise((resolve) => {
          const leitor = new FileReader();

          leitor.onloadend = () => resolve(String(leitor.result));
          leitor.onerror = () => resolve(null);

          leitor.readAsDataURL(blob);
        });
      } catch (error) {
        console.error("Erro ao carregar emblema:", error);
        return null;
      }
    }

    const emblemaUrl =
  municipioSelecionado.emblema_url ||
  "/brasao-gcm-v2.png";
    const logoBase64 = await imagemParaBase64(emblemaUrl);

    function desenharLogo(x: number, y: number, w: number, h: number) {
      if (!logoBase64) return;

      try {
    pdf.addImage(logoBase64, "PNG", x, y, w, h); 
     } catch (error) {
        console.error("Erro ao inserir emblema no PDF:", error);
      }
    }

    function header(titulo: string, subtitulo: string, tamanhoTitulo = 25) {
      desenharLogo(12, 8, 28, 28);

      pdf.setTextColor(...navy);
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(13);
      pdf.text(`GUARDA CIVIL MUNICIPAL DE ${nomeMunicipioMaiusculo}`, 46, 15);

      pdf.setFontSize(tamanhoTitulo);
      pdf.text(titulo, 46, 27);

      pdf.setFontSize(9);
      pdf.text(subtitulo, 46, 35);
      pdf.text("SISTEMA INTEGRADO DE GESTÃO - SIG-GCM", 46, 40);

      pdf.setFillColor(...navy);
      pdf.roundedRect(158, 10, 38, 20, 2, 2, "F");

      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(8);
      pdf.text("MÊS / ANO", 177, 17, { align: "center" });

      pdf.setTextColor(...gold);
      pdf.setFontSize(12);
      pdf.text(`${nomesMeses[mes]} / ${ano}`, 177, 25, { align: "center" });

      pdf.setDrawColor(...gold);
      pdf.setLineWidth(0.6);
      pdf.line(12, 44, 198, 44);
    }

    function footer() {
      pdf.setFillColor(...gold);
      pdf.rect(0, pageH - 16, pageW, 2, "F");

      pdf.setFillColor(...navy);
      pdf.rect(0, pageH - 14, pageW, 14, "F");

      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(9);
      pdf.setFont("helvetica", "bold");
      pdf.text("“PROTEGER E SERVIR”", pageW / 2, pageH - 6, {
        align: "center",
      });
    }

    // =====================
    // PÁGINA 1 - CALENDÁRIO
    // =====================
    header(
      "ESCALA OPERACIONAL",
      "PLANEJAMENTO MENSAL DE PLANTÕES E SERVIÇOS",
      25
    );

    const infoY = 50;
    const infoH = 16;
    const infoW = 46;

const guarnicoesResumo = registrosMes
  .map((r) => r.equipe || r.guarda_nome)
  .filter((nome, index, array) => nome && array.indexOf(nome) === index);

const { data: configEscala } = await supabase
  .from("escala_operacional_config")
  .select(`
    *,
    escala_modelos(nome)
  `)
  .eq("municipio_id", Number(municipioId))
  .eq("ativo", true)
  .single();

    const infos = [
      ["DIAS NO MÊS", String(diasNoMes)],
      ["TOTAL DE REGISTROS", String(registrosMes.length)],
      ["GUARNIÇÕES", String(guarnicoesResumo.length)],
      ["ESCALA", configEscala?.escala_modelos?.nome || "-"],
    ];

    infos.forEach((item, i) => {
      const x = 12 + i * infoW;

      pdf.setDrawColor(...border);
      pdf.setFillColor(255, 255, 255);
      pdf.roundedRect(x, infoY, infoW - 2, infoH, 2, 2, "FD");

      pdf.setTextColor(...navy);
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(7);
      pdf.text(item[0], x + 5, infoY + 6);

      pdf.setFontSize(14);
      pdf.text(item[1], x + 5, infoY + 13);
    });

    const diasSemana = [
      "DOMINGO",
      "SEGUNDA",
      "TERÇA",
      "QUARTA",
      "QUINTA",
      "SEXTA",
      "SÁBADO",
    ];

    const primeiroDiaSemana = new Date(
      Number(ano),
      Number(mes) - 1,
      1
    ).getDay();

    const calX = 12;
    const calY = 74;
    const cellW = 186 / 7;
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
      const diaNumero = i - primeiroDiaSemana + 1;
      const x = calX + col * cellW;
      const y = calY + 8 + row * cellH;

      pdf.setDrawColor(205, 210, 218);
      pdf.setFillColor(255, 255, 255);
      pdf.rect(x, y, cellW, cellH, "FD");

      if (diaNumero >= 1 && diaNumero <= diasNoMes) {
        const data = `${ano}-${mes}-${String(diaNumero).padStart(2, "0")}`;
        const registro = registrosMes.find((r) => r.data_servico === data);
        const nome = registro?.equipe || registro?.guarda_nome || "Sem escala";
        const c = cor(nome);

        pdf.setTextColor(col === 0 ? 220 : 5, 25, 45);
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(9);
        pdf.text(String(diaNumero).padStart(2, "0"), x + 3, y + 6);

        pdf.setTextColor(...c);
        pdf.setFontSize(6.5);
        pdf.text(nome, x + 3, y + 12);

        pdf.setTextColor(...navy);
        pdf.setFontSize(6);
        pdf.text(
  configEscala?.escala_modelos?.nome || "",
  x + 3,
  y + 17
);
      }
    }

    const legendaY = 238;

    pdf.setDrawColor(...border);
    pdf.roundedRect(12, legendaY, 65, 32, 2, 2, "S");
    pdf.setFillColor(...navy);
    pdf.rect(12, legendaY, 65, 8, "F");
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(8);
    pdf.setFont("helvetica", "bold");
    pdf.text("LEGENDA DE GUARNIÇÕES", 16, legendaY + 5.5);

    guarnicoesResumo.forEach((g, i) => {
      const y = legendaY + 13 + i * 4;
      pdf.setFillColor(...cor(g));
      pdf.roundedRect(17, y - 2.5, 6, 2, 1, 1, "F");
      pdf.setTextColor(...navy);
      pdf.setFontSize(7);
      pdf.text(g, 27, y);
    });

    pdf.roundedRect(82, legendaY, 116, 32, 2, 2, "S");
    pdf.setFillColor(...navy);
    pdf.rect(82, legendaY, 116, 8, "F");
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(8);
    pdf.text("INFORMAÇÕES", 88, legendaY + 5.5);

    pdf.setTextColor(...navy);
    pdf.setFontSize(7);
    pdf.text(
      "• Escala baseada no regime 24 horas de serviço por 96 horas de descanso.",
      88,
      legendaY + 14
    );
    pdf.text(
      "• Horário padrão do plantão: 07h00 às 07h00 do dia seguinte.",
      88,
      legendaY + 20
    );
    pdf.text(
      "• Alterações na escala devem ser comunicadas à chefia imediata.",
      88,
      legendaY + 26
    );

    footer();

    // =====================
    // PÁGINA 2 - RESUMO
    // =====================
    pdf.addPage("a4", "portrait");

    header(
      "RESUMO POR GUARNIÇÃO",
      `DISTRIBUIÇÃO DE DIAS DE SERVIÇO - ${nomesMeses[mes]} / ${ano}`,
      19
    );

    const resumoBody = guarnicoesResumo.map((nome) => {
      const dias = registrosMes
        .filter((r) => r.equipe === nome || r.guarda_nome === nome)
        .map((r) => r.data_servico.split("-")[2])
        .join(", ");

      const integrantes = membrosGuarnicao
        .filter((m) => {
          const guarnicao = guarnicoes.find((g) => g.id === m.guarnicao_id);
          return guarnicao?.nome === nome;
        })
        .map((m) => {
          const guarda = guardas.find((g) => g.id === m.guarda_id);

          return guarda
            ? `• ${guarda.nome} (${guarda.matricula})`
            : null;
        })
        .filter(Boolean)
        .join("\n");

      const total = registrosMes.filter(
        (r) => r.equipe === nome || r.guarda_nome === nome
      ).length;

      return [
        nome,
        integrantes || "Integrantes não informados",
        dias || "-",
        `${total} plantões`,
      ];
    });

    autoTable(pdf, {
      startY: 52,
      head: [["GUARNIÇÃO", "INTEGRANTES", "DIAS DE SERVIÇO", "TOTAL"]],
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
        0: { cellWidth: 42, fontStyle: "bold", halign: "center" },
        1: { cellWidth: 62 },
        2: { cellWidth: 55, halign: "center" },
        3: {
          cellWidth: 25,
          halign: "center",
          fontSize: 10,
          fontStyle: "bold",
        },
      },
      didParseCell: (data) => {
        if (data.section === "body" && data.column.index === 0) {
          const nome = String(data.cell.raw);
          data.cell.styles.textColor = cor(nome);
        }
      },
      didDrawCell: (data) => {
        if (data.section === "body" && data.column.index === 0) {
          desenharLogo(data.cell.x + 2, data.cell.y + 3, 8, 8);
        }
      },
    });

    pdf.setDrawColor(...border);
    pdf.roundedRect(12, 244, 186, 24, 2, 2, "S");

    pdf.setTextColor(...navy);
    pdf.setFontSize(8);
    pdf.setFont("helvetica", "bold");
    pdf.text("OBSERVAÇÕES", 16, 251);

    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(7);
    pdf.text(
      "• Este resumo contém a distribuição automática dos dias de serviço conforme escala 24/96.",
      16,
      257
    );
    pdf.text(
      "• Em caso de substituições ou alterações, atualizar a escala no sistema.",
      16,
      262
    );

    pdf.line(135, 258, 185, 258);
    pdf.setFont("helvetica", "bold");
    pdf.text("COMANDANTE", 160, 264, { align: "center" });
    pdf.setFont("helvetica", "normal");
    pdf.text(`Guarda Civil Municipal de ${nomeMunicipio}`, 160, 268, {
      align: "center",
    });

    footer();

    pdf.save(`Escala_Operacional_${mes}_${ano}.pdf`);
  }



return (
<ProtecaoPerfil perfilMinimo="DIRETOR">
        <div className="p-3 md:p-6 pb-24">
        <header className="border-b border-slate-800 pb-5 mb-6">
          <h1 className="text-2xl md:text-3xl font-bold">
            Escala Mensal
          </h1>

          <p className="text-slate-400 text-sm md:text-base">
            Planejamento mensal de plantões, folgas, férias e serviços extras.
          </p>
          <button
  type="button"
  onClick={gerarEscalaAutomaticaMes}
  className="btn-primary mt-4"
>
  Gerar Escala Automática 24/96
</button>
        </header>

        <section className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card titulo="Registros do mês" valor={registrosMes.length} />
          <Card titulo="Plantões" valor={totalPlantao} />
          <Card titulo="Folgas" valor={totalFolga} />
          <Card titulo="Férias" valor={totalFerias} />
        </section>

        <section className="card mb-6 calendario-pdf">
          <h2 className="text-xl md:text-2xl font-bold mb-4">
            Filtro do Mês
          </h2>

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
<label className="label">Modelo de Escala</label>
<select className="input">
  <option>24/96</option>
  <option>12x36</option>
  <option>Administrativo</option>
  <option>Escala Extra</option>
</select>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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

            <Campo
              label="Ano"
              valor={ano}
              setValor={setAno}
              placeholder="Ex: 2026"
            />

            <div className="md:col-span-2 flex items-end">
              <div className="bg-slate-950/40 border border-slate-700 rounded-xl p-4 w-full">
                <p className="text-slate-400 text-sm">Resumo</p>
                <p className="font-bold">
                  {registrosMes.length} registro(s) encontrados para {mes}/{ano}
                </p>
              </div>
            </div>
          </div>
        </section>

<section className="card mb-6">
  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-5">
    <div>
      <h2 className="text-2xl md:text-3xl font-bold">
        📅 Calendário Operacional
      </h2>

      <p className="text-slate-400">
        Visualização automática da escala 24/96 por guarnição.
      </p>
    </div>

    <button
  type="button"
  onClick={gerarPDFEscalaMensal}
  className="btn-primary print:hidden"
>
  🖨️ Gerar PDF da Escala
</button>
  </div>

  <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-7 gap-3">
    {diasCalendario.map((dia) => {
      const nomeGuarnicao =
        dia.registro?.equipe || dia.registro?.guarda_nome || "Sem escala";

      const ehHoje = dia.data === hojeISO;



      return (
        <div
          key={dia.data}
          className={`dia-pdf rounded-2xl border p-4 min-h-32 ${corGuarnicao(nomeGuarnicao)} ${
            ehHoje ? "ring-2 ring-white" : ""
          }`}
        >
          <div className="flex justify-between items-start mb-3">
            <p className="text-3xl font-black">
              {String(dia.dia).padStart(2, "0")}
            </p>

            {ehHoje && (
              <span className="bg-green-600 text-white text-xs px-2 py-1 rounded-full font-bold">
                HOJE
              </span>
            )}
          </div>

          <p className="font-bold text-white">
            {nomeGuarnicao}
          </p>

          <p className="text-xs text-slate-400 mt-1">
            07:00 às 07:00
          </p>

          <p className="text-xs text-blue-300 mt-2">
  {dia.registro?.tipo || "Sem escala"}
</p>
        </div>
      );
    })}
  </div>
</section>

        <section className="grid grid-cols-1 xl:grid-cols-3 gap-4">
          <div className="card">
            <h2 className="text-xl md:text-2xl font-bold mb-4">
              Novo Registro
            </h2>

            <div className="space-y-4">
              <div>
                <label className="label">Data</label>
                <input
                  type="date"
                  className="input"
                  value={dataServico}
                  onChange={(e) => setDataServico(e.target.value)}
                />
              </div>

              <div>
                <label className="label">Guarda</label>
                <select
                  className="input"
                  value={guardaNome}
                  onChange={(e) => selecionarGuarda(e.target.value)}
                >
                  <option value="">Selecione</option>

                  {guardas.map((g) => (
                    <option key={g.id} value={g.nome}>
                      {g.nome} • {g.matricula} • {g.status}
                    </option>
                  ))}
                </select>
              </div>

              <Campo
                label="Matrícula"
                valor={matricula}
                setValor={setMatricula}
                placeholder="Preenchida automaticamente"
              />

              <div>
                <label className="label">Tipo</label>
                <select
                  className="input"
                  value={tipo}
                  onChange={(e) => setTipo(e.target.value)}
                >
                  <option>Plantão</option>
                  <option>Folga</option>
                  <option>Férias</option>
                  <option>Afastamento</option>
                  <option>Licença</option>
                  <option>Serviço Extra</option>
                  <option>Evento</option>
                  <option>Administrativo</option>
                </select>
              </div>

              <div>
                <label className="label">Turno</label>
                <select
                  className="input"
                  value={turno}
                  onChange={(e) => setTurno(e.target.value)}
                >
                  <option>06h às 18h</option>
                  <option>18h às 06h</option>
                  <option>24 horas</option>
                  <option>Administrativo</option>
                  <option>Extra</option>
                  <option>Evento</option>
                  <option>Não se aplica</option>
                </select>
              </div>

              <div>
                <label className="label">Equipe</label>
                <select
                  className="input"
                  value={equipe}
                  onChange={(e) => setEquipe(e.target.value)}
                >
                  <option>Equipe Alfa</option>
                  <option>Equipe Bravo</option>
                  <option>Equipe Charlie</option>
                  <option>Equipe Delta</option>
                  <option>Equipe Extra</option>
                  <option>Não se aplica</option>
                </select>
              </div>

              <div>
                <label className="label">Observação</label>
                <textarea
                  className="input h-28 resize-none"
                  value={observacao}
                  onChange={(e) => setObservacao(e.target.value)}
                  placeholder="Ex: plantão extra, férias autorizadas, afastamento..."
                />
              </div>

              <button
                type="button"
                onClick={salvarRegistro}
                className="btn-primary w-full text-lg"
              >
                Salvar na Escala Mensal
              </button>
            </div>
          </div>

          <div className="card xl:col-span-2">
            <h2 className="text-xl md:text-2xl font-bold mb-4">
              Escala do Mês
            </h2>

            <div className="mb-5">
              <label className="label">Buscar</label>
              <input
                className="input"
                placeholder="Buscar por guarda, data, equipe, tipo..."
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
              />
            </div>

            {carregando ? (
              <p className="text-slate-400">Carregando escala mensal...</p>
            ) : filtrados.length === 0 ? (
              <p className="text-slate-400">Nenhum registro encontrado.</p>
            ) : (
              <>
                <div className="md:hidden space-y-4">
                  {filtrados.map((item) => (
                    <div
                      key={item.id}
                      className="bg-slate-950/40 border border-slate-700 rounded-xl p-4 space-y-3"
                    >
                      <div>
                        <p className="text-blue-400 font-semibold">
                          {item.data_servico}
                        </p>

                        <h3 className="text-xl font-bold">
                          {item.guarda_nome}
                        </h3>
                      </div>

                      <Linha nome="Matrícula" valor={item.matricula || "-"} />
                      <Linha nome="Tipo" valor={item.tipo || "-"} />
                      <Linha nome="Turno" valor={item.turno || "-"} />
                      <Linha nome="Equipe" valor={item.equipe || "-"} />

                      {item.observacao && (
                        <p className="text-slate-400">
                          {item.observacao}
                        </p>
                      )}

                      <button
                        type="button"
                        onClick={() => excluirRegistro(item.id)}
                        className="w-full bg-red-700 hover:bg-red-800 px-4 py-3 rounded-xl font-semibold"
                      >
                        Excluir
                      </button>
                    </div>
                  ))}
                </div>

                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="text-slate-400 border-b border-slate-700">
                      <tr>
                        <th className="text-left py-3">Data</th>
                        <th className="text-left py-3">Guarda</th>
                        <th className="text-left py-3">Matrícula</th>
                        <th className="text-left py-3">Tipo</th>
                        <th className="text-left py-3">Turno</th>
                        <th className="text-left py-3">Equipe</th>
                        <th className="text-right py-3">Ações</th>
                      </tr>
                    </thead>

                    <tbody>
                      {filtrados.map((item) => (
                        <tr key={item.id} className="border-b border-slate-800">
                          <td className="py-4 text-blue-400 font-semibold">
                            {item.data_servico}
                          </td>

                          <td>{item.guarda_nome}</td>
                          <td className="text-slate-400">
                            {item.matricula || "-"}
                          </td>
                          <td>{item.tipo || "-"}</td>
                          <td className="text-slate-400">
                            {item.turno || "-"}
                          </td>
                          <td>{item.equipe || "-"}</td>

                          <td className="text-right">
                            <button
                              type="button"
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
              </>
            )}

            <div className="mt-6 p-4 rounded-xl border border-slate-700 bg-slate-950/40">
              <h3 className="font-bold mb-2">Legenda</h3>
              <p className="text-sm text-slate-400">
                Use esta tela para registrar plantões, folgas, férias, afastamentos,
                licenças, eventos e serviços extras do mês.
              </p>
            </div>
          </div>
        </section>
      </div>
    </ProtecaoPerfil>
  );
}

function Campo({
  label,
  valor,
  setValor,
  placeholder,
}: {
  label: string;
  valor: string;
  setValor: (valor: string) => void;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="label">{label}</label>

      <input
        className="input"
        placeholder={placeholder}
        value={valor}
        onChange={(e) => setValor(e.target.value)}
      />
    </div>
  );
}

function Card({ titulo, valor }: { titulo: string; valor: number }) {
  return (
    <div className="card min-h-32 flex flex-col justify-center">
      <p className="text-slate-400 text-lg md:text-base">{titulo}</p>
      <h2 className="text-5xl md:text-4xl font-bold">{valor}</h2>
    </div>
  );
}

function Linha({ nome, valor }: { nome: string; valor: string }) {
  return (
    <div className="flex justify-between gap-4 border-b border-slate-800 pb-2">
      <span className="text-slate-400">{nome}</span>
      <span className="text-right">{valor}</span>
    </div>
  );
}