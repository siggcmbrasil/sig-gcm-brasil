"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import ProtecaoPerfil from "@/components/ProtecaoPerfil";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { registrarAuditoria } from "@/lib/auditoria";
import { obterMunicipioIdEfetivo } from "@/lib/contextoMunicipio";

type Municipio = {
  id: number;
  nome: string;
  estado: string;
  nome_guarda: string | null;
  comandante: string | null;
  brasao: string | null;
  brasao_gcm: string | null;
  brasao_prefeitura: string | null;
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

  const [municipioSelecionado, setMunicipioSelecionado] = useState<Municipio | null>(null);
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

  function identificarMunicipioAtual() {
    try {
      const usuario = JSON.parse(
        localStorage.getItem("usuarioLogado") || "{}"
      );

      const idEfetivo = obterMunicipioIdEfetivo({
        perfil: usuario?.perfil,
        municipioIdUsuario: usuario?.municipio_id,
      });

      if (!idEfetivo) {
        alert("Município não identificado.");
        return;
      }

      setMunicipioId(String(idEfetivo));
    } catch (error) {
      console.error("Erro ao identificar município:", error);
      alert("Não foi possível identificar o município atual.");
    }
  }

  async function carregarDados() {
    if (!municipioId) return;

    setCarregando(true);

    const { data: municipioData, error: erroMunicipio } = await supabase
      .from("municipios")
      .select(
        "id, nome, estado, nome_guarda, comandante, brasao, brasao_gcm, brasao_prefeitura"
      )
      .eq("id", Number(municipioId))
      .eq("ativo", true)
      .maybeSingle();

    if (erroMunicipio || !municipioData) {
      console.error("Erro ao carregar município:", erroMunicipio);
      alert("Não foi possível carregar a identidade institucional do município.");
      setMunicipioSelecionado(null);
      setCarregando(false);
      return;
    }

    setMunicipioSelecionado(municipioData as Municipio);

const { data: guarnicoesData, error: erroGuarnicoes } = await supabase
  .from("escala_estruturas")
  .select(`
    id,
    nome,
    ativa,
    municipio_id
  `)
  .eq("municipio_id", Number(municipioId))
  .eq("categoria", "EQUIPE_OPERACIONAL")
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
    

const primeiroDiaMes =
  `${ano}-${mes}-01`;

const ultimoDiaMes =
  `${ano}-${mes}-${String(
    new Date(
      Number(ano),
      Number(mes),
      0
    ).getDate()
  ).padStart(2, "0")}`;

const {
  data: escalaServicoData,
  error: erroEscala,
} = await supabase
  .from("escalas_servico")
  .select(`
    id,
    municipio_id,
    data_servico,
    guarda_nome,
    matricula,
    turno,
    equipe,
    observacao
  `)
  .eq(
    "municipio_id",
    Number(municipioId)
  )
  .gte(
    "data_servico",
    primeiroDiaMes
  )
  .lte(
    "data_servico",
    ultimoDiaMes
  )
  .order("data_servico", {
    ascending: true,
  })
  .order("equipe", {
    ascending: true,
  });

if (erroEscala) {
  console.error(erroEscala);
  alert(
    "Erro ao carregar os plantões mensais."
  );
}

const mapaRegistros =
  new Map<string, RegistroEscala>();

for (
  const item of escalaServicoData || []
) {
  const chave =
    `${item.data_servico}-${item.equipe || "SEM_EQUIPE"}`;

  if (!mapaRegistros.has(chave)) {
    mapaRegistros.set(chave, {
      id: Number(item.id),
      municipio_id:
        Number(item.municipio_id),
      mes,
      ano,
      data_servico:
        item.data_servico,
      guarda_nome:
        item.guarda_nome ||
        item.equipe ||
        "Sem escala",
      matricula:
        item.matricula || null,
      tipo: "Plantão",
      turno:
        item.turno || null,
      equipe:
        item.equipe || null,
      observacao:
        item.observacao || null,
    });
  }
}

const escalaData =
  Array.from(
    mapaRegistros.values()
  ).sort((a, b) =>
    a.data_servico.localeCompare(
      b.data_servico
    )
  );

const mapaMembros =
  new Map<string, any>();

for (
  const item of escalaServicoData || []
) {
  let detalhes: any = {};

  try {
    detalhes =
      typeof item.observacao ===
        "string"
        ? JSON.parse(
            item.observacao
          )
        : item.observacao || {};
  } catch {
    detalhes = {};
  }

  const estruturaId =
    Number(
      detalhes?.estrutura_id
    );

  const guardaId =
    Number(
      detalhes?.guarda_id
    );

  const funcao =
    String(
      detalhes?.funcao || ""
    ).toUpperCase();

  if (
    !estruturaId ||
    !guardaId
  ) {
    continue;
  }

  const chave =
    `${estruturaId}-${guardaId}-${funcao}`;

  if (!mapaMembros.has(chave)) {
    mapaMembros.set(chave, {
      guarnicao_id:
        estruturaId,
      guarda_id:
        guardaId,
      funcao:
        funcao ||
        "PATRULHEIRO",
    });
  }
}

setMembrosGuarnicao(
  Array.from(
    mapaMembros.values()
  )
);

    setGuarnicoes(guarnicoesData || []);
    setRegistros(escalaData || []);
    setGuardas(guardasData || []);
    setCarregando(false);
  }

  useEffect(() => {
    identificarMunicipioAtual();
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
  await carregarDados();

  alert(
    "A escala mensal foi atualizada com os plantões já criados nas guarnições."
  );
}

  async function excluirRegistro(id: number) {
    if (!confirm("Excluir este registro?")) return;

const registro = registros.find(
  (item) => item.id === id
);

if (!registro) {
  alert("Registro não localizado.");
  return;
}

const { error } = await supabase
  .from("escalas_servico")
  .delete()
  .eq(
    "municipio_id",
    Number(municipioId)
  )
  .eq(
    "data_servico",
    registro.data_servico
  )
  .eq(
    "equipe",
    registro.equipe
  );

    if (error) {
      console.error(error);
      alert("Erro ao excluir registro.");
      return;
    }

    await registrarAuditoria({
  modulo: "Escalas",
  acao: "EXCLUIR",
  descricao: `Excluiu a escala do dia ${registro?.data_servico || id}.`,
});

    carregarDados();
  }

  async function gerarPDF() {
    if (!municipioSelecionado || !municipioId) {
      alert("Município não identificado.");
      return;
    }

    if (guarnicoes.length === 0) {
      alert("Nenhuma guarnição cadastrada.");
      return;
    }

    if (registros.length === 0) {
      alert("Gere ou cadastre a escala antes de emitir o PDF.");
      return;
    }

    const municipio = municipioSelecionado;
    const nomeGuarda =
      municipio.nome_guarda?.trim() ||
      `Guarda Civil Municipal de ${municipio.nome}`;

    const usuarioLogado = (() => {
      try {
        return JSON.parse(
          localStorage.getItem("usuarioLogado") || "{}"
        );
      } catch {
        return {};
      }
    })();

    const usuarioEmissor =
      String(usuarioLogado?.nome || "Usuário não identificado").trim();

    const dataEmissao = new Date().toLocaleString("pt-BR", {
      timeZone: "America/Bahia",
    });

    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    const navy: [number, number, number] = [8, 29, 58];
    const cyan: [number, number, number] = [6, 182, 212];
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

    type ImagemPdf = {
      dados: string;
      formato: "PNG" | "JPEG" | "WEBP";
      largura: number;
      altura: number;
    };

    async function carregarImagemPdf(
      url: string | null | undefined
    ): Promise<ImagemPdf | null> {
      const caminho = String(url || "").trim();

      if (!caminho) {
        return null;
      }

      try {
        const resposta = await fetch(caminho, {
          cache: "no-store",
        });

        if (!resposta.ok) {
          console.error("Imagem institucional não encontrada:", {
            url: caminho,
            status: resposta.status,
          });
          return null;
        }

        const blob = await resposta.blob();
        const dados = await new Promise<string | null>((resolve) => {
          const leitor = new FileReader();
          leitor.onloadend = () =>
            resolve(typeof leitor.result === "string" ? leitor.result : null);
          leitor.onerror = () => resolve(null);
          leitor.readAsDataURL(blob);
        });

        if (!dados) {
          return null;
        }

        const dimensoes = await new Promise<{
          largura: number;
          altura: number;
        } | null>((resolve) => {
          const imagem = new Image();
          imagem.onload = () =>
            resolve({
              largura: imagem.naturalWidth || imagem.width,
              altura: imagem.naturalHeight || imagem.height,
            });
          imagem.onerror = () => resolve(null);
          imagem.src = dados;
        });

        if (!dimensoes?.largura || !dimensoes?.altura) {
          return null;
        }

        const mime = blob.type.toLowerCase();
        const formato: ImagemPdf["formato"] = mime.includes("jpeg")
          ? "JPEG"
          : mime.includes("webp")
            ? "WEBP"
            : "PNG";

        return {
          dados,
          formato,
          largura: dimensoes.largura,
          altura: dimensoes.altura,
        };
      } catch (error) {
        console.error("Erro ao carregar imagem institucional:", {
          url: caminho,
          error,
        });
        return null;
      }
    }

    const imagemPrefeitura = await carregarImagemPdf(
      municipio.brasao_prefeitura
    );

    const imagemGcm = await carregarImagemPdf(
      municipio.brasao_gcm || municipio.brasao
    );

    function inserirImagemContida(
      imagem: ImagemPdf | null,
      x: number,
      y: number,
      larguraMaxima: number,
      alturaMaxima: number
    ) {
      if (!imagem) {
        return false;
      }

      const escala = Math.min(
        larguraMaxima / imagem.largura,
        alturaMaxima / imagem.altura
      );

      const largura = imagem.largura * escala;
      const altura = imagem.altura * escala;
      const posicaoX = x + (larguraMaxima - largura) / 2;
      const posicaoY = y + (alturaMaxima - altura) / 2;

      try {
        pdf.addImage(
          imagem.dados,
          imagem.formato,
          posicaoX,
          posicaoY,
          largura,
          altura
        );
        return true;
      } catch (error) {
        console.error("Erro ao inserir imagem no PDF:", error);
        return false;
      }
    }

    function desenharEspacoSemBrasao(
      x: number,
      y: number,
      texto: string
    ) {
      pdf.setDrawColor(...border);
      pdf.setFillColor(248, 250, 252);
      pdf.roundedRect(x, y, 25, 25, 2, 2, "FD");
      pdf.setTextColor(100, 116, 139);
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(5.5);
      pdf.text(texto, x + 12.5, y + 13, {
        align: "center",
        maxWidth: 21,
      });
    }

    function corPDF(nome: string): [number, number, number] {
      const n = nome.toLowerCase();

      if (n.includes("alfa")) return [37, 99, 235];
      if (n.includes("bravo")) return [22, 163, 74];
      if (n.includes("charlie")) return [126, 58, 242];
      if (n.includes("delta")) return [202, 138, 4];
      if (n.includes("echo")) return [8, 145, 178];

      return [15, 23, 42];
    }

    function cabecalho(titulo: string, subtitulo: string) {
      const adicionouPrefeitura = inserirImagemContida(
        imagemPrefeitura,
        14,
        8,
        25,
        25
      );

      if (!adicionouPrefeitura) {
        desenharEspacoSemBrasao(14, 8, "PREFEITURA");
      }

      const adicionouGcm = inserirImagemContida(
        imagemGcm,
        171,
        8,
        25,
        25
      );

      if (!adicionouGcm) {
        desenharEspacoSemBrasao(171, 8, "GCM");
      }

      pdf.setTextColor(...navy);
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(10);

      const linhasNome = pdf
        .splitTextToSize(nomeGuarda.toUpperCase(), 118)
        .slice(0, 2);

      pdf.text(linhasNome, 105, 11, {
        align: "center",
      });

      const yMunicipio = 11 + linhasNome.length * 4;

      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(8);
      pdf.text(
        `${municipio.nome.toUpperCase()} - ${municipio.estado.toUpperCase()}`,
        105,
        yMunicipio,
        { align: "center" }
      );

      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(17);
      pdf.text(titulo, 105, 29, {
        align: "center",
      });

      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(8);
      pdf.text(subtitulo, 105, 36, {
        align: "center",
        maxWidth: 120,
      });

      pdf.setDrawColor(...cyan);
      pdf.setLineWidth(0.7);
      pdf.line(14, 43, 196, 43);
    }

    function marcaDagua() {
      if (!imagemGcm) {
        return;
      }

      try {
        pdf.setGState(
          new (pdf as any).GState({
            opacity: 0.05,
          })
        );

        inserirImagemContida(imagemGcm, 48, 80, 114, 114);

        pdf.setGState(
          new (pdf as any).GState({
            opacity: 1,
          })
        );
      } catch {
        // O PDF continua válido mesmo se o navegador não suportar transparência.
      }
    }

    cabecalho(
      "ESCALA OPERACIONAL",
      `PLANEJAMENTO MENSAL DE SERVIÇO - ESCALA ${tipoEscala}`
    );
    marcaDagua();

    const infos = [
      ["PERÍODO", `${meses[mes]} / ${ano}`],
      ["REGISTROS", String(registros.length)],
      ["GUARNIÇÕES", String(guarnicoes.length)],
      ["HORÁRIO", horarioPadrao],
    ];

    infos.forEach((item, i) => {
      const x = 14 + i * 45.5;

      pdf.setDrawColor(...border);
      pdf.setFillColor(255, 255, 255);
      pdf.roundedRect(x, 49, 43, 16, 2, 2, "FD");

      pdf.setTextColor(...navy);
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(7);
      pdf.text(item[0], x + 4, 55);

      pdf.setFontSize(item[0] === "HORÁRIO" ? 8 : 10);
      pdf.text(item[1], x + 4, 62, {
        maxWidth: 35,
      });
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

    const primeiroDia = new Date(
      Number(ano),
      Number(mes) - 1,
      1
    ).getDay();

    const calX = 14;
    const calY = 72;
    const cellW = 182 / 7;
    const cellH = 25;

    diasSemana.forEach((diaSemana, i) => {
      pdf.setFillColor(...navy);
      pdf.setDrawColor(180, 190, 205);
      pdf.rect(calX + i * cellW, calY, cellW, 8, "FD");

      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(7);
      pdf.setFont("helvetica", "bold");
      pdf.text(
        diaSemana,
        calX + i * cellW + cellW / 2,
        calY + 5.5,
        { align: "center" }
      );
    });

    for (let i = 0; i < 42; i++) {
      const coluna = i % 7;
      const linha = Math.floor(i / 7);
      const diaNumero = i - primeiroDia + 1;
      const x = calX + coluna * cellW;
      const y = calY + 8 + linha * cellH;

      pdf.setDrawColor(205, 210, 218);
      pdf.setFillColor(255, 255, 255);
      pdf.rect(x, y, cellW, cellH, "FD");

      if (diaNumero >= 1 && diaNumero <= diasNoMes) {
        const data = `${ano}-${mes}-${String(diaNumero).padStart(2, "0")}`;
const registrosDoDia = registros.filter(
  (item) => item.data_servico === data
);

        pdf.setTextColor(coluna === 0 ? 200 : 5, 25, 45);
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(9);
        pdf.text(
          String(diaNumero).padStart(2, "0"),
          x + 3,
          y + 6
        );

if (registrosDoDia.length === 0) {
  pdf.setTextColor(100, 116, 139);
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(5.8);
  pdf.text(
    "Sem escala",
    x + 3,
    y + 12,
    {
      maxWidth: cellW - 6,
    }
  );

  pdf.setTextColor(...navy);
  pdf.setFontSize(5.2);
  pdf.text(
    horarioPadrao,
    x + 3,
    y + 21,
    {
      maxWidth: cellW - 6,
    }
  );
} else {
  const maximoExibido = 4;

  const registrosVisiveis =
    registrosDoDia.slice(
      0,
      maximoExibido
    );

  const espacoDisponivel = 15;

  const alturaLinha = Math.min(
    4,
    espacoDisponivel /
      registrosVisiveis.length
  );

  let posicaoY = y + 11;

  registrosVisiveis.forEach(
    (registroDia) => {
      const nomeEquipe =
        registroDia.equipe ||
        registroDia.guarda_nome ||
        "Sem identificação";

      const cor =
        corPDF(nomeEquipe);

      pdf.setTextColor(...cor);
      pdf.setFont(
        "helvetica",
        "bold"
      );

      pdf.setFontSize(
        registrosVisiveis.length >= 4
          ? 4.8
          : registrosVisiveis.length === 3
            ? 5.2
            : 5.8
      );

      const nomeCurto =
        nomeEquipe
          .replace(
            /guarnição/gi,
            ""
          )
          .trim()
          .toUpperCase();

      pdf.text(
        nomeCurto,
        x + 3,
        posicaoY,
        {
          maxWidth:
            cellW - 6,
        }
      );

      pdf.setTextColor(
        ...navy
      );
      pdf.setFont(
        "helvetica",
        "normal"
      );
      pdf.setFontSize(4.3);

      pdf.text(
        registroDia.turno ||
          horarioPadrao,
        x + cellW - 3,
        posicaoY,
        {
          align: "right",
          maxWidth: 10,
        }
      );

      posicaoY +=
        alturaLinha;
    }
  );

  if (
    registrosDoDia.length >
    maximoExibido
  ) {
    pdf.setTextColor(
      100,
      116,
      139
    );
    pdf.setFont(
      "helvetica",
      "bold"
    );
    pdf.setFontSize(4.5);

    pdf.text(
      `+${registrosDoDia.length - maximoExibido} serviço(s)`,
      x + 3,
      y + 23
    );
  }
}
      }
    }

    pdf.addPage("a4", "portrait");

    const resumoBody = guarnicoes.map((guarnicao) => {
      const membrosDaGuarnicao = membrosGuarnicao.filter(
        (membro: any) =>
          Number(membro.guarnicao_id) === Number(guarnicao.id)
      );

      function nomeDoGuarda(membro: any) {
        const guardaEncontrado = guardas.find(
          (guarda) => Number(guarda.id) === Number(membro.guarda_id)
        );

        return guardaEncontrado
          ? `${guardaEncontrado.nome} (${guardaEncontrado.matricula})`
          : "";
      }

      const membrosComNome = membrosDaGuarnicao
        .map((membro: any) => ({
          ...membro,
          nomeFormatado: nomeDoGuarda(membro),
          funcaoNormalizada: String(membro.funcao || "")
            .toUpperCase()
            .trim(),
        }))
        .filter((membro: any) => membro.nomeFormatado);

      const comandanteItem =
        membrosComNome.find((membro: any) =>
          ["CMT_GUARNICAO", "COMANDANTE", "CMT", "CHEFE"].includes(
            membro.funcaoNormalizada
          )
        ) || membrosComNome[0];

      const motoristaItem =
        membrosComNome.find(
          (membro: any) =>
            membro.funcaoNormalizada === "MOTORISTA" &&
            Number(membro.guarda_id) !==
              Number(comandanteItem?.guarda_id)
        ) ||
        membrosComNome.find(
          (membro: any) =>
            Number(membro.guarda_id) !==
            Number(comandanteItem?.guarda_id)
        );

      const demaisLista = membrosComNome
        .filter(
          (membro: any) =>
            Number(membro.guarda_id) !==
              Number(comandanteItem?.guarda_id) &&
            Number(membro.guarda_id) !==
              Number(motoristaItem?.guarda_id)
        )
        .map((membro: any) => membro.nomeFormatado);

      const comandante =
        comandanteItem?.nomeFormatado || "Não definido";
      const motorista =
        motoristaItem?.nomeFormatado || "Não definido";

      const dias = registros
        .filter(
          (registro) =>
            (registro.equipe || registro.guarda_nome) === guarnicao.nome
        )
        .map((registro) => registro.data_servico.split("-")[2])
        .join(", ");

      const total = registros.filter(
        (registro) =>
          (registro.equipe || registro.guarda_nome) === guarnicao.nome
      ).length;

      const integrantes = [
        `CMT: ${comandante}`,
        `Motorista: ${motorista}`,
        ...demaisLista,
        `Total de integrantes: ${membrosComNome.length}`,
      ].join("\n");

      return [
        guarnicao.nome,
        integrantes,
        dias || "-",
        `${total} plantões`,
      ];
    });

    autoTable(pdf, {
      startY: 50,
      margin: {
        top: 50,
        right: 14,
        bottom: 24,
        left: 14,
      },
      head: [["GUARNIÇÃO", "INTEGRANTES / MATRÍCULA", "DIAS", "TOTAL"]],
      body: resumoBody,
      theme: "grid",
      styles: {
        fontSize: 8,
        cellPadding: 4,
        minCellHeight: 12,
        valign: "middle",
        lineColor: border,
        lineWidth: 0.2,
        textColor: navy,
        overflow: "linebreak",
      },
      headStyles: {
        fillColor: navy,
        textColor: [255, 255, 255],
        fontStyle: "bold",
        halign: "center",
      },
      columnStyles: {
        0: {
          cellWidth: 34,
          fontStyle: "bold",
          halign: "center",
          valign: "middle",
        },
        1: {
          cellWidth: 82,
          valign: "top",
        },
        2: {
          cellWidth: 40,
          halign: "center",
          valign: "middle",
        },
        3: {
          cellWidth: 26,
          halign: "center",
          fontStyle: "bold",
          valign: "middle",
        },
      },
      willDrawPage: () => {
        marcaDagua();
        cabecalho(
          "RESUMO POR GUARNIÇÃO",
          `DISTRIBUIÇÃO DE PLANTÕES - ${meses[mes]} / ${ano}`
        );
      },
      didParseCell: (data) => {
        if (data.section === "body" && data.column.index === 0) {
          data.cell.styles.textColor = corPDF(String(data.cell.raw));
        }
      },
    });

    let yObservacoes =
      Number((pdf as any).lastAutoTable?.finalY || 55) + 8;

    if (yObservacoes > 247) {
      pdf.addPage("a4", "portrait");
      cabecalho(
        "VALIDAÇÃO DA ESCALA",
        `${meses[mes]} / ${ano}`
      );
      marcaDagua();
      yObservacoes = 55;
    }

    pdf.setDrawColor(...border);
    pdf.setFillColor(255, 255, 255);
    pdf.roundedRect(14, yObservacoes, 182, 31, 2, 2, "FD");

    pdf.setTextColor(...navy);
    pdf.setFontSize(8);
    pdf.setFont("helvetica", "bold");
    pdf.text("OBSERVAÇÕES E VALIDAÇÃO", 18, yObservacoes + 7);

    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(7);
    pdf.text(
      "Documento gerado automaticamente pelo SIG-GCM Brasil.",
      18,
      yObservacoes + 13
    );
    pdf.text(
      "Substituições, férias, licenças e permutas devem constar no sistema.",
      18,
      yObservacoes + 18
    );

    pdf.setFontSize(6.5);
    pdf.text(
      `Emitido por: ${usuarioEmissor}`,
      18,
      yObservacoes + 24
    );
    pdf.text(
      `Emissão: ${dataEmissao}`,
      18,
      yObservacoes + 28
    );

    pdf.line(132, yObservacoes + 20, 188, yObservacoes + 20);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(7);
    pdf.text(
      municipio.comandante?.trim() || "COMANDANTE",
      160,
      yObservacoes + 25,
      {
        align: "center",
        maxWidth: 55,
      }
    );
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(6);
    pdf.text("Comandante da Guarda", 160, yObservacoes + 29, {
      align: "center",
    });

    const totalPaginas = pdf.getNumberOfPages();

    for (let pagina = 1; pagina <= totalPaginas; pagina++) {
      pdf.setPage(pagina);

      pdf.setDrawColor(...cyan);
      pdf.setLineWidth(0.6);
      pdf.line(14, 278, 196, 278);

      pdf.setTextColor(...navy);
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(6.5);
      pdf.text(
        `${nomeGuarda} - ${municipio.nome}/${municipio.estado}`,
        14,
        284,
        { maxWidth: 118 }
      );

      pdf.text(
        `SIG-GCM Brasil | Página ${pagina} de ${totalPaginas}`,
        196,
        284,
        { align: "right" }
      );
    }

    const nomeSeguro = municipio.nome
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-zA-Z0-9_-]+/g, "_")
      .replace(/^_+|_+$/g, "");

    pdf.save(
      `Escala_Operacional_${nomeSeguro}_${ano}_${mes}.pdf`
    );

    await registrarAuditoria({
      modulo: "Escalas",
      acao: "EXPORTAR_PDF",
      descricao: `Gerou o PDF da escala mensal de ${mes}/${ano}.`,
    });
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
              Atualizar Escala Mensal
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
    <label className="label">Município do contexto atual</label>
    <input
      className="input cursor-not-allowed opacity-80"
      value={
        municipioSelecionado
          ? `${municipioSelecionado.nome} - ${municipioSelecionado.estado}`
          : "Carregando município..."
      }
      readOnly
      disabled
    />
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