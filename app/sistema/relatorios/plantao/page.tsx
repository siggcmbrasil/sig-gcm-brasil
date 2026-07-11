"use client";

import {
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  CalendarDays,
  CheckCircle2,
  Clock3,
  FileSpreadsheet,
  FileText,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

import { supabase } from "@/lib/supabase";
import { registrarAuditoria } from "@/lib/auditoria";

type TipoRelatorio =
  | "plantao"
  | "diario"
  | "semanal"
  | "quinzenal"
  | "mensal"
  | "bimestral"
  | "trimestral"
  | "semestral"
  | "anual";

type TipoPlantao =
  | "24H_07_07"
  | "24H_08_08"
  | "12H_07_19"
  | "12H_19_07"
  | "12H_06_18"
  | "12H_18_06"
  | "08H_06_14"
  | "08H_14_22"
  | "08H_22_06"
  | "06H_06_12"
  | "06H_12_18"
  | "06H_18_00"
  | "06H_00_06"
  | "ADM_08_17"
  | "EVENTO"
  | "PERSONALIZADO";

type ModuloId =
  | "ocorrencias"
  | "patrulhamentos"
  | "chamados"
  | "visitas"
  | "apoios"
  | "eventos"
  | "operacoes"
  | "pessoas"
  | "veiculos"
  | "abastecimentos";

type PeriodoCalculado = {
  inicio: Date;
  fim: Date;
  inicioIso: string;
  fimIso: string;
  dataInicio: string;
  dataFim: string;
  descricao: string;
  tipoLabel: string;
};

type ColunaTabela = {
  titulo: string;
  render: (item: any) => ReactNode;
  exportar?: (item: any) => string;
};

type ModuloTabela = {
  id: ModuloId;
  label: string;
  dados: any[];
  colunas: ColunaTabela[];
};

type ConfiguracaoPlantao = {
  label: string;
  horaInicio?: string;
  duracaoMinutos?: number;
  personalizado?: boolean;
};

const TIPOS_PLANTAO: Record<TipoPlantao, ConfiguracaoPlantao> = {
  "24H_07_07": {
    label: "24 Horas (07:00 às 07:00)",
    horaInicio: "07:00",
    duracaoMinutos: 24 * 60,
  },
  "24H_08_08": {
    label: "24 Horas (08:00 às 08:00)",
    horaInicio: "08:00",
    duracaoMinutos: 24 * 60,
  },
  "12H_07_19": {
    label: "12 Horas Diurno (07:00 às 19:00)",
    horaInicio: "07:00",
    duracaoMinutos: 12 * 60,
  },
  "12H_19_07": {
    label: "12 Horas Noturno (19:00 às 07:00)",
    horaInicio: "19:00",
    duracaoMinutos: 12 * 60,
  },
  "12H_06_18": {
    label: "12 Horas Diurno (06:00 às 18:00)",
    horaInicio: "06:00",
    duracaoMinutos: 12 * 60,
  },
  "12H_18_06": {
    label: "12 Horas Noturno (18:00 às 06:00)",
    horaInicio: "18:00",
    duracaoMinutos: 12 * 60,
  },
  "08H_06_14": {
    label: "8 Horas Manhã (06:00 às 14:00)",
    horaInicio: "06:00",
    duracaoMinutos: 8 * 60,
  },
  "08H_14_22": {
    label: "8 Horas Tarde (14:00 às 22:00)",
    horaInicio: "14:00",
    duracaoMinutos: 8 * 60,
  },
  "08H_22_06": {
    label: "8 Horas Noite (22:00 às 06:00)",
    horaInicio: "22:00",
    duracaoMinutos: 8 * 60,
  },
  "06H_06_12": {
    label: "6 Horas Manhã (06:00 às 12:00)",
    horaInicio: "06:00",
    duracaoMinutos: 6 * 60,
  },
  "06H_12_18": {
    label: "6 Horas Tarde (12:00 às 18:00)",
    horaInicio: "12:00",
    duracaoMinutos: 6 * 60,
  },
  "06H_18_00": {
    label: "6 Horas Noite (18:00 às 00:00)",
    horaInicio: "18:00",
    duracaoMinutos: 6 * 60,
  },
  "06H_00_06": {
    label: "6 Horas Madrugada (00:00 às 06:00)",
    horaInicio: "00:00",
    duracaoMinutos: 6 * 60,
  },
  ADM_08_17: {
    label: "Administrativo (08:00 às 17:00)",
    horaInicio: "08:00",
    duracaoMinutos: 9 * 60,
  },
  EVENTO: {
    label: "Operação / Evento Especial",
    personalizado: true,
  },
  PERSONALIZADO: {
    label: "Período Personalizado",
    personalizado: true,
  },
};

const TIPOS_RELATORIO_VALIDOS: TipoRelatorio[] = [
  "plantao",
  "diario",
  "semanal",
  "quinzenal",
  "mensal",
  "bimestral",
  "trimestral",
  "semestral",
  "anual",
];

const TITULOS_RELATORIO: Record<TipoRelatorio, string> = {
  plantao: "Relatório Geral do Plantão",
  diario: "Relatório Diário",
  semanal: "Relatório Semanal",
  quinzenal: "Relatório Quinzenal",
  mensal: "Relatório Mensal",
  bimestral: "Relatório Bimestral",
  trimestral: "Relatório Trimestral",
  semestral: "Relatório Semestral",
  anual: "Relatório Anual",
};

function preencherDoisDigitos(valor: number) {
  return String(valor).padStart(2, "0");
}

function formatarDataInput(data: Date) {
  return [
    data.getFullYear(),
    preencherDoisDigitos(data.getMonth() + 1),
    preencherDoisDigitos(data.getDate()),
  ].join("-");
}

function formatarDataHoraInput(data: Date) {
  return `${formatarDataInput(data)}T${preencherDoisDigitos(
    data.getHours()
  )}:${preencherDoisDigitos(data.getMinutes())}`;
}

function formatarData(valor: unknown) {
  if (!valor) return "-";

  const texto = String(valor);
  const data = texto.length === 10 ? new Date(`${texto}T12:00:00`) : new Date(texto);

  if (Number.isNaN(data.getTime())) return texto;
  return data.toLocaleDateString("pt-BR");
}

function formatarDataHora(valor: unknown) {
  if (!valor) return "-";

  const data = valor instanceof Date ? valor : new Date(String(valor));

  if (Number.isNaN(data.getTime())) return String(valor);

  return data.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatarMoeda(valor: unknown) {
  return Number(valor || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function combinarDataHora(dataValor: unknown, horaValor: unknown) {
  if (!dataValor || !horaValor) return null;

  const dataTexto = String(dataValor).slice(0, 10);
  const horaTexto = String(horaValor).slice(0, 8);
  const data = new Date(`${dataTexto}T${horaTexto}`);

  return Number.isNaN(data.getTime()) ? null : data;
}

function filtrarPorDataHoraQuandoDisponivel(
  itens: any[],
  campoData: string,
  campoHora: string,
  inicio: Date,
  fim: Date
) {
  return itens.filter((item) => {
    const dataHora = combinarDataHora(item[campoData], item[campoHora]);

    // Registros antigos sem hora continuam visíveis, evitando perda silenciosa.
    if (!dataHora) return true;

    return dataHora >= inicio && dataHora < fim;
  });
}

function escaparCsv(valor: unknown) {
  const texto = String(valor ?? "").replaceAll('"', '""');
  return `"${texto}"`;
}

function escaparHtml(valor: unknown) {
  return String(valor ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function baixarArquivo(conteudo: BlobPart, nome: string, tipo: string) {
  const blob = new Blob([conteudo], { type: tipo });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = nome;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

async function carregarImagemBase64(url: string) {
  if (!url) return null;

  try {
    const resposta = await fetch(url);

    if (!resposta.ok) return null;

    const blob = await resposta.blob();

    return await new Promise<{
      base64: string;
      formato: "PNG" | "JPEG";
    }>((resolve) => {
      const reader = new FileReader();

      reader.onloadend = () => {
        resolve({
          base64: String(reader.result),
          formato:
            blob.type.includes("jpeg") || blob.type.includes("jpg")
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

function calcularPeriodoPlantao(
  dataPlantao: string,
  tipoPlantao: TipoPlantao,
  inicioPersonalizado: string,
  fimPersonalizado: string
): PeriodoCalculado {
  const configuracao = TIPOS_PLANTAO[tipoPlantao];

  let inicio: Date;
  let fim: Date;

  if (configuracao.personalizado) {
    if (!inicioPersonalizado || !fimPersonalizado) {
      throw new Error("Informe o início e o fim do período personalizado.");
    }

    inicio = new Date(inicioPersonalizado);
    fim = new Date(fimPersonalizado);
  } else {
    if (!dataPlantao) {
      throw new Error("Selecione a data do plantão.");
    }

    inicio = new Date(`${dataPlantao}T${configuracao.horaInicio}:00`);
    fim = new Date(
      inicio.getTime() + Number(configuracao.duracaoMinutos) * 60_000
    );
  }

  if (Number.isNaN(inicio.getTime()) || Number.isNaN(fim.getTime())) {
    throw new Error("O período informado é inválido.");
  }

  if (fim <= inicio) {
    throw new Error("O fim do plantão precisa ser posterior ao início.");
  }

  return {
    inicio,
    fim,
    inicioIso: inicio.toISOString(),
    fimIso: fim.toISOString(),
    dataInicio: formatarDataInput(inicio),
    dataFim: formatarDataInput(fim),
    descricao: `${formatarDataHora(inicio)} até ${formatarDataHora(fim)}`,
    tipoLabel: configuracao.label,
  };
}

function calcularPeriodoGeral(
  tipoRelatorio: TipoRelatorio,
  data: string,
  mesReferencia: string,
  anoReferencia: string,
  dataPlantao: string,
  tipoPlantao: TipoPlantao,
  inicioPersonalizado: string,
  fimPersonalizado: string
): PeriodoCalculado {
  if (tipoRelatorio === "plantao") {
    return calcularPeriodoPlantao(
      dataPlantao,
      tipoPlantao,
      inicioPersonalizado,
      fimPersonalizado
    );
  }

  let inicio: Date;
  let fim: Date;

  if (tipoRelatorio === "diario") {
    inicio = new Date(`${data}T00:00:00`);
    fim = new Date(inicio);
    fim.setDate(fim.getDate() + 1);
  } else if (tipoRelatorio === "semanal") {
    inicio = new Date(`${data}T00:00:00`);
    fim = new Date(inicio);
    fim.setDate(fim.getDate() + 7);
  } else if (tipoRelatorio === "quinzenal") {
    inicio = new Date(`${data}T00:00:00`);
    fim = new Date(inicio);
    fim.setDate(fim.getDate() + 15);
  } else if (
    tipoRelatorio === "mensal" ||
    tipoRelatorio === "bimestral" ||
    tipoRelatorio === "trimestral" ||
    tipoRelatorio === "semestral"
  ) {
    const [ano, mes] = mesReferencia.split("-").map(Number);
    const quantidadeMeses = {
      mensal: 1,
      bimestral: 2,
      trimestral: 3,
      semestral: 6,
    }[tipoRelatorio];

    inicio = new Date(ano, mes - 1, 1, 0, 0, 0);
    fim = new Date(ano, mes - 1 + quantidadeMeses, 1, 0, 0, 0);
  } else {
    const ano = Number(anoReferencia);
    inicio = new Date(ano, 0, 1, 0, 0, 0);
    fim = new Date(ano + 1, 0, 1, 0, 0, 0);
  }

  if (Number.isNaN(inicio.getTime()) || Number.isNaN(fim.getTime())) {
    throw new Error("O período informado é inválido.");
  }

  return {
    inicio,
    fim,
    inicioIso: inicio.toISOString(),
    fimIso: fim.toISOString(),
    dataInicio: formatarDataInput(inicio),
    dataFim: formatarDataInput(fim),
    descricao: `${formatarDataHora(inicio)} até ${formatarDataHora(fim)}`,
    tipoLabel: TITULOS_RELATORIO[tipoRelatorio],
  };
}

function obterUsuarioLogado() {
  try {
    return JSON.parse(localStorage.getItem("usuarioLogado") || "{}");
  } catch {
    return {};
  }
}


async function carregarVisitasRelatorio(
  municipioId: number,
  inicioIso: string,
  fimIso: string
) {
  const respostaComGuarnicao = await supabase
    .from("visitas")
    .select(`
      id,
      tipo,
      local,
      data_visita,
      guarnicao_id,
      guarnicoes:guarnicao_id (
        nome
      )
    `)
    .eq("municipio_id", municipioId)
    .gte("data_visita", inicioIso)
    .lt("data_visita", fimIso)
    .order("data_visita", { ascending: true });

  if (!respostaComGuarnicao.error) {
    return respostaComGuarnicao;
  }

  console.warn(
    "A relação visitas → guarnicoes ainda não está configurada. " +
      "O relatório será carregado sem o nome da guarnição.",
    respostaComGuarnicao.error
  );

  const respostaSemGuarnicao = await supabase
    .from("visitas")
    .select("id,tipo,local,data_visita")
    .eq("municipio_id", municipioId)
    .gte("data_visita", inicioIso)
    .lt("data_visita", fimIso)
    .order("data_visita", { ascending: true });

  return {
    data: (respostaSemGuarnicao.data || []).map((visita) => ({
      ...visita,
      guarnicoes: null,
    })),
    error: respostaSemGuarnicao.error,
  };
}

export default function RelatorioPlantaoPage() {
  const searchParams = useSearchParams();
  const parametroTipo = searchParams.get("tipo") as TipoRelatorio | null;
  const tipoRelatorio = TIPOS_RELATORIO_VALIDOS.includes(
    parametroTipo as TipoRelatorio
  )
    ? (parametroTipo as TipoRelatorio)
    : "plantao";

  const [data, setData] = useState("");
  const [dataPlantao, setDataPlantao] = useState("");
  const [tipoPlantao, setTipoPlantao] =
    useState<TipoPlantao>("24H_07_07");
  const [inicioPersonalizado, setInicioPersonalizado] = useState("");
  const [fimPersonalizado, setFimPersonalizado] = useState("");
  const [mesReferencia, setMesReferencia] = useState("");
  const [anoReferencia, setAnoReferencia] = useState("");

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

  const [carregando, setCarregando] = useState(false);
  const [relatorioCarregado, setRelatorioCarregado] = useState(false);
  const [periodoConsultado, setPeriodoConsultado] =
    useState<PeriodoCalculado | null>(null);
  const [abaAtiva, setAbaAtiva] = useState<ModuloId>("ocorrencias");

  useEffect(() => {
    const agora = new Date();
    const inicioPadrao = new Date(
      agora.getFullYear(),
      agora.getMonth(),
      agora.getDate(),
      7,
      0,
      0
    );
    const fimPadrao = new Date(inicioPadrao.getTime() + 12 * 60 * 60 * 1000);

    setData(formatarDataInput(agora));
    setDataPlantao(formatarDataInput(agora));
    setMesReferencia(formatarDataInput(agora).slice(0, 7));
    setAnoReferencia(String(agora.getFullYear()));
    setInicioPersonalizado(formatarDataHoraInput(inicioPadrao));
    setFimPersonalizado(formatarDataHoraInput(fimPadrao));
  }, []);

  useEffect(() => {
    const configuracao = TIPOS_PLANTAO[tipoPlantao];

    if (!configuracao.personalizado || !dataPlantao) return;

    const inicio = new Date(`${dataPlantao}T07:00:00`);
    const fim = new Date(inicio.getTime() + 12 * 60 * 60 * 1000);

    setInicioPersonalizado(formatarDataHoraInput(inicio));
    setFimPersonalizado(formatarDataHoraInput(fim));
  }, [tipoPlantao, dataPlantao]);

  useEffect(() => {
    setRelatorioCarregado(false);
  }, [
    tipoRelatorio,
    data,
    dataPlantao,
    tipoPlantao,
    inicioPersonalizado,
    fimPersonalizado,
    mesReferencia,
    anoReferencia,
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

  const periodoPrevisto = useMemo(() => {
    try {
      return calcularPeriodoGeral(
        tipoRelatorio,
        data,
        mesReferencia,
        anoReferencia,
        dataPlantao,
        tipoPlantao,
        inicioPersonalizado,
        fimPersonalizado
      );
    } catch {
      return null;
    }
  }, [
    tipoRelatorio,
    data,
    mesReferencia,
    anoReferencia,
    dataPlantao,
    tipoPlantao,
    inicioPersonalizado,
    fimPersonalizado,
  ]);

  const modulos = useMemo<ModuloTabela[]>(
    () => [
      ...(incluirOcorrencias
        ? [
            {
              id: "ocorrencias" as const,
              label: "Ocorrências",
              dados: ocorrencias,
              colunas: [
                {
                  titulo: "Tipo",
                  render: (item: any) => (
                    <span className="font-semibold text-white">
                      {item.tipo || "-"}
                    </span>
                  ),
                  exportar: (item: any) => item.tipo || "-",
                },
                {
                  titulo: "Data/Hora",
                  render: (item: any) =>
                    `${formatarData(item.data)} ${item.hora || ""}`.trim(),
                  exportar: (item: any) =>
                    `${formatarData(item.data)} ${item.hora || ""}`.trim(),
                },
                {
                  titulo: "Local",
                  render: (item: any) => item.local || "-",
                  exportar: (item: any) => item.local || "-",
                },
                {
                  titulo: "Bairro",
                  render: (item: any) => item.bairro || "-",
                  exportar: (item: any) => item.bairro || "-",
                },
                {
                  titulo: "Status",
                  render: (item: any) => <StatusBadge status={item.status} />,
                  exportar: (item: any) => item.status || "-",
                },
                {
                  titulo: "Ação",
                  render: (item: any) => (
                    <Link
                      href={`/sistema/ocorrencias/${item.id}`}
                      className="inline-flex rounded-lg border border-cyan-500/30 bg-cyan-500/10 px-3 py-1.5 text-xs font-bold text-cyan-300 hover:bg-cyan-500/20"
                    >
                      Visualizar
                    </Link>
                  ),
                },
              ],
            },
          ]
        : []),
      ...(incluirPatrulhamentos
        ? [
            {
              id: "patrulhamentos" as const,
              label: "Patrulhamentos",
              dados: patrulhamentos,
              colunas: [
                {
                  titulo: "Local",
                  render: (item: any) => item.local || "-",
                  exportar: (item: any) => item.local || "-",
                },
                {
                  titulo: "Guarda/Equipe",
                  render: (item: any) => item.guarda || "-",
                  exportar: (item: any) => item.guarda || "-",
                },
                {
                  titulo: "Data/Hora",
                  render: (item: any) =>
                    `${formatarData(item.data)} ${item.hora || ""}`.trim(),
                  exportar: (item: any) =>
                    `${formatarData(item.data)} ${item.hora || ""}`.trim(),
                },
                {
                  titulo: "Observação",
                  render: (item: any) => item.observacao || "-",
                  exportar: (item: any) => item.observacao || "-",
                },
              ],
            },
          ]
        : []),
      ...(incluirChamados
        ? [
            {
              id: "chamados" as const,
              label: "Chamados",
              dados: chamados,
              colunas: [
                {
                  titulo: "Chamado",
                  render: (item: any) => (
                    <span className="font-semibold text-white">
                      {item.protocolo ||
                        item.tipo ||
                        item.observacao ||
                        "Chamado"}
                    </span>
                  ),
                  exportar: (item: any) =>
                    item.protocolo ||
                    item.tipo ||
                    item.observacao ||
                    "Chamado",
                },
                {
                  titulo: "Local",
                  render: (item: any) => item.local || "-",
                  exportar: (item: any) => item.local || "-",
                },
                {
                  titulo: "Criado em",
                  render: (item: any) => formatarDataHora(item.criado_em),
                  exportar: (item: any) => formatarDataHora(item.criado_em),
                },
                {
                  titulo: "Prioridade",
                  render: (item: any) => item.prioridade || "-",
                  exportar: (item: any) => item.prioridade || "-",
                },
                {
                  titulo: "Status",
                  render: (item: any) => <StatusBadge status={item.status} />,
                  exportar: (item: any) => item.status || "-",
                },
              ],
            },
          ]
        : []),
      ...(incluirVisitas
        ? [
            {
              id: "visitas" as const,
              label: "Visitas",
              dados: visitas,
              colunas: [
                {
                  titulo: "Tipo",
                  render: (item: any) => item.tipo || "-",
                  exportar: (item: any) => item.tipo || "-",
                },
                {
                  titulo: "Local",
                  render: (item: any) => item.local || "-",
                  exportar: (item: any) => item.local || "-",
                },
                {
                  titulo: "Guarnição",
                  render: (item: any) => item.guarnicoes?.nome || "-",
                  exportar: (item: any) => item.guarnicoes?.nome || "-",
                },
                {
                  titulo: "Data",
                  render: (item: any) => formatarDataHora(item.data_visita),
                  exportar: (item: any) => formatarDataHora(item.data_visita),
                },
              ],
            },
          ]
        : []),
      ...(incluirApoios
        ? [
            {
              id: "apoios" as const,
              label: "Apoios",
              dados: apoios,
              colunas: [
                {
                  titulo: "Tipo",
                  render: (item: any) => item.tipo || "-",
                  exportar: (item: any) => item.tipo || "-",
                },
                {
                  titulo: "Local",
                  render: (item: any) => item.local || "-",
                  exportar: (item: any) => item.local || "-",
                },
                {
                  titulo: "Descrição",
                  render: (item: any) => item.descricao || "-",
                  exportar: (item: any) => item.descricao || "-",
                },
                {
                  titulo: "Data",
                  render: (item: any) => formatarDataHora(item.criado_em),
                  exportar: (item: any) => formatarDataHora(item.criado_em),
                },
              ],
            },
          ]
        : []),
      ...(incluirEventos
        ? [
            {
              id: "eventos" as const,
              label: "Eventos",
              dados: eventos,
              colunas: [
                {
                  titulo: "Evento",
                  render: (item: any) => item.nome || "-",
                  exportar: (item: any) => item.nome || "-",
                },
                {
                  titulo: "Local",
                  render: (item: any) => item.local || "-",
                  exportar: (item: any) => item.local || "-",
                },
                {
                  titulo: "Data",
                  render: (item: any) => formatarDataHora(item.data_evento),
                  exportar: (item: any) => formatarDataHora(item.data_evento),
                },
              ],
            },
          ]
        : []),
      ...(incluirOperacoes
        ? [
            {
              id: "operacoes" as const,
              label: "Operações",
              dados: operacoes,
              colunas: [
                {
                  titulo: "Operação",
                  render: (item: any) => item.nome || "-",
                  exportar: (item: any) => item.nome || "-",
                },
                {
                  titulo: "Local",
                  render: (item: any) => item.local || "-",
                  exportar: (item: any) => item.local || "-",
                },
                {
                  titulo: "Descrição",
                  render: (item: any) => item.descricao || "-",
                  exportar: (item: any) => item.descricao || "-",
                },
                {
                  titulo: "Data",
                  render: (item: any) => formatarDataHora(item.criado_em),
                  exportar: (item: any) => formatarDataHora(item.criado_em),
                },
              ],
            },
          ]
        : []),
      ...(incluirPessoas
        ? [
            {
              id: "pessoas" as const,
              label: "Pessoas",
              dados: pessoas,
              colunas: [
                {
                  titulo: "Nome",
                  render: (item: any) => item.nome || "-",
                  exportar: (item: any) => item.nome || "-",
                },
                {
                  titulo: "Documento",
                  render: (item: any) =>
                    [item.tipo_documento, item.documento]
                      .filter(Boolean)
                      .join(": ") || "-",
                  exportar: (item: any) =>
                    [item.tipo_documento, item.documento]
                      .filter(Boolean)
                      .join(": ") || "-",
                },
                {
                  titulo: "Local",
                  render: (item: any) => item.local || "-",
                  exportar: (item: any) => item.local || "-",
                },
                {
                  titulo: "Data",
                  render: (item: any) => formatarData(item.data),
                  exportar: (item: any) => formatarData(item.data),
                },
              ],
            },
          ]
        : []),
      ...(incluirVeiculos
        ? [
            {
              id: "veiculos" as const,
              label: "Veículos",
              dados: veiculos,
              colunas: [
                {
                  titulo: "Placa",
                  render: (item: any) => item.placa || "-",
                  exportar: (item: any) => item.placa || "-",
                },
                {
                  titulo: "Modelo",
                  render: (item: any) => item.modelo || "-",
                  exportar: (item: any) => item.modelo || "-",
                },
                {
                  titulo: "Local",
                  render: (item: any) => item.local || "-",
                  exportar: (item: any) => item.local || "-",
                },
                {
                  titulo: "Data",
                  render: (item: any) => formatarData(item.data),
                  exportar: (item: any) => formatarData(item.data),
                },
              ],
            },
          ]
        : []),
      ...(incluirAbastecimentos
        ? [
            {
              id: "abastecimentos" as const,
              label: "Abastecimentos",
              dados: abastecimentos,
              colunas: [
                {
                  titulo: "Viatura",
                  render: (item: any) =>
                    [item.viaturas?.prefixo, item.viaturas?.placa]
                      .filter(Boolean)
                      .join(" • ") || "-",
                  exportar: (item: any) =>
                    [item.viaturas?.prefixo, item.viaturas?.placa]
                      .filter(Boolean)
                      .join(" - ") || "-",
                },
                {
                  titulo: "Litros",
                  render: (item: any) => `${Number(item.litros || 0)} L`,
                  exportar: (item: any) => String(Number(item.litros || 0)),
                },
                {
                  titulo: "Valor",
                  render: (item: any) => formatarMoeda(item.valor),
                  exportar: (item: any) => formatarMoeda(item.valor),
                },
                {
                  titulo: "Data",
                  render: (item: any) =>
                    formatarDataHora(item.data_abastecimento),
                  exportar: (item: any) =>
                    formatarDataHora(item.data_abastecimento),
                },
              ],
            },
          ]
        : []),
    ],
    [
      incluirOcorrencias,
      incluirPatrulhamentos,
      incluirChamados,
      incluirVisitas,
      incluirApoios,
      incluirEventos,
      incluirOperacoes,
      incluirPessoas,
      incluirVeiculos,
      incluirAbastecimentos,
      ocorrencias,
      patrulhamentos,
      chamados,
      visitas,
      apoios,
      eventos,
      operacoes,
      pessoas,
      veiculos,
      abastecimentos,
    ]
  );

  const moduloAtivo =
    modulos.find((modulo) => modulo.id === abaAtiva) || modulos[0] || null;

  useEffect(() => {
    if (modulos.length > 0 && !modulos.some((modulo) => modulo.id === abaAtiva)) {
      setAbaAtiva(modulos[0].id);
    }
  }, [modulos, abaAtiva]);

  async function carregarRelatorio() {
    setCarregando(true);
    setRelatorioCarregado(false);

    try {
      const usuario = obterUsuarioLogado();
      const municipioId = usuario.municipio_id;

      if (!municipioId) {
        throw new Error("Município não identificado.");
      }

      if (modulos.length === 0) {
        throw new Error("Selecione pelo menos um item para incluir no relatório.");
      }

      const periodo = calcularPeriodoGeral(
        tipoRelatorio,
        data,
        mesReferencia,
        anoReferencia,
        dataPlantao,
        tipoPlantao,
        inicioPersonalizado,
        fimPersonalizado
      );

      const respostaVazia = () =>
        Promise.resolve({ data: [] as any[], error: null as any });

      const [
        respostaOcorrencias,
        respostaPatrulhamentos,
        respostaChamados,
        respostaVisitas,
        respostaApoios,
        respostaEventos,
        respostaOperacoes,
        respostaPessoas,
        respostaVeiculos,
        respostaAbastecimentos,
      ] = await Promise.all([
        incluirOcorrencias
          ? supabase
              .from("ocorrencias")
              .select("id,tipo,local,bairro,hora,status,data")
              .eq("municipio_id", municipioId)
              .gte("data", periodo.dataInicio)
              .lte("data", periodo.dataFim)
              .order("data", { ascending: true })
              .order("hora", { ascending: true })
          : respostaVazia(),
        incluirPatrulhamentos
          ? supabase
              .from("patrulhamentos")
              .select("id,local,guarda,hora,observacao,data")
              .eq("municipio_id", municipioId)
              .gte("data", periodo.dataInicio)
              .lte("data", periodo.dataFim)
              .order("data", { ascending: true })
              .order("hora", { ascending: true })
          : respostaVazia(),
        incluirChamados
          ? supabase
              .from("chamados")
              .select(
                "id,protocolo,solicitante,tipo,local,status,prioridade,observacao,criado_em"
              )
              .eq("municipio_id", municipioId)
              .gte("criado_em", periodo.inicioIso)
              .lt("criado_em", periodo.fimIso)
              .order("criado_em", { ascending: true })
          : respostaVazia(),
        incluirVisitas
          ? carregarVisitasRelatorio(
              municipioId,
              periodo.inicioIso,
              periodo.fimIso
            )
          : respostaVazia(),
        incluirApoios
          ? supabase
              .from("apoios")
              .select("id,tipo,local,descricao,criado_em")
              .eq("municipio_id", municipioId)
              .gte("criado_em", periodo.inicioIso)
              .lt("criado_em", periodo.fimIso)
              .order("criado_em", { ascending: true })
          : respostaVazia(),
        incluirEventos
          ? supabase
              .from("eventos")
              .select("id,nome,local,data_evento")
              .eq("municipio_id", municipioId)
              .gte("data_evento", periodo.inicioIso)
              .lt("data_evento", periodo.fimIso)
              .order("data_evento", { ascending: true })
          : respostaVazia(),
        incluirOperacoes
          ? supabase
              .from("operacoes")
              .select("id,nome,local,descricao,criado_em")
              .eq("municipio_id", municipioId)
              .gte("criado_em", periodo.inicioIso)
              .lt("criado_em", periodo.fimIso)
              .order("criado_em", { ascending: true })
          : respostaVazia(),
        incluirPessoas
          ? supabase
              .from("pessoas_abordadas")
              .select("id,nome,tipo_documento,documento,local,data")
              .eq("municipio_id", municipioId)
              .gte("data", periodo.dataInicio)
              .lte("data", periodo.dataFim)
              .order("data", { ascending: true })
          : respostaVazia(),
        incluirVeiculos
          ? supabase
              .from("veiculos_abordados")
              .select("id,placa,modelo,local,data")
              .eq("municipio_id", municipioId)
              .gte("data", periodo.dataInicio)
              .lte("data", periodo.dataFim)
              .order("data", { ascending: true })
          : respostaVazia(),
        incluirAbastecimentos
          ? supabase
              .from("abastecimentos")
              .select(
                "id,litros,valor,data_abastecimento,viatura_id,viaturas!abastecimentos_viatura_id_fkey(prefixo,placa)"
              )
              .eq("municipio_id", municipioId)
              .gte("data_abastecimento", periodo.inicioIso)
              .lt("data_abastecimento", periodo.fimIso)
              .order("data_abastecimento", { ascending: true })
          : respostaVazia(),
      ]);

      const respostas = [
        respostaOcorrencias,
        respostaPatrulhamentos,
        respostaChamados,
        respostaVisitas,
        respostaApoios,
        respostaEventos,
        respostaOperacoes,
        respostaPessoas,
        respostaVeiculos,
        respostaAbastecimentos,
      ];

      const erros = respostas
        .map((resposta) => resposta.error)
        .filter(Boolean)
        .map((erro) => erro.message || String(erro));

      if (erros.length > 0) {
        throw new Error(erros.join(" | "));
      }

      const ocorrenciasFiltradas = filtrarPorDataHoraQuandoDisponivel(
        respostaOcorrencias.data || [],
        "data",
        "hora",
        periodo.inicio,
        periodo.fim
      );

      const patrulhamentosFiltrados = filtrarPorDataHoraQuandoDisponivel(
        respostaPatrulhamentos.data || [],
        "data",
        "hora",
        periodo.inicio,
        periodo.fim
      );

      setOcorrencias(ocorrenciasFiltradas);
      setPatrulhamentos(patrulhamentosFiltrados);
      setChamados(respostaChamados.data || []);
      setVisitas(respostaVisitas.data || []);
      setApoios(respostaApoios.data || []);
      setEventos(respostaEventos.data || []);
      setOperacoes(respostaOperacoes.data || []);
      setPessoas(respostaPessoas.data || []);
      setVeiculos(respostaVeiculos.data || []);
      setAbastecimentos(respostaAbastecimentos.data || []);
      setPeriodoConsultado(periodo);
      setRelatorioCarregado(true);

      const primeiroModuloSelecionado = modulos[0]?.id;
      if (primeiroModuloSelecionado) setAbaAtiva(primeiroModuloSelecionado);

      try {
        await registrarAuditoria({
          modulo: "Relatórios",
          acao: "CONSULTAR",
          descricao: `Consultou o ${TITULOS_RELATORIO[tipoRelatorio]}.`,
          tabela: "relatorios",
          detalhes: {
            tipo_relatorio: tipoRelatorio,
            tipo_plantao:
              tipoRelatorio === "plantao" ? tipoPlantao : undefined,
            inicio_periodo: periodo.inicioIso,
            fim_periodo: periodo.fimIso,
            municipio_id: municipioId,
            usuario_id: usuario.id,
          },
        });
      } catch (erroAuditoria) {
        console.error("Erro ao registrar auditoria da consulta:", erroAuditoria);
      }
    } catch (erro) {
      console.error("Erro ao carregar relatório do plantão:", erro);
      alert(
        erro instanceof Error
          ? erro.message
          : "Não foi possível carregar o relatório."
      );
    } finally {
      setCarregando(false);
    }
  }

  async function registrarExportacao(
    formato: "PDF" | "EXCEL" | "CSV",
    numeroRelatorio: string
  ) {
    const usuario = obterUsuarioLogado();

    try {
      await registrarAuditoria({
        modulo: "Relatórios",
        acao: "EXPORTAR",
        descricao: `Exportou o ${TITULOS_RELATORIO[tipoRelatorio]} em ${formato}.`,
        tabela: "relatorios",
        detalhes: {
          formato,
          numero_relatorio: numeroRelatorio,
          tipo_relatorio: tipoRelatorio,
          tipo_plantao:
            tipoRelatorio === "plantao" ? tipoPlantao : undefined,
          inicio_periodo: periodoConsultado?.inicioIso,
          fim_periodo: periodoConsultado?.fimIso,
          municipio_id: usuario.municipio_id,
          usuario_id: usuario.id,
        },
      });
    } catch (erro) {
      console.error("Erro ao registrar auditoria da exportação:", erro);
    }
  }

  function validarExportacao() {
    if (!relatorioCarregado || !periodoConsultado) {
      alert("Atualize e visualize o relatório antes de exportar.");
      return false;
    }

    return true;
  }

  function gerarCsv() {
    if (!validarExportacao()) return;

    const linhas: string[] = [
      ["Relatório", TITULOS_RELATORIO[tipoRelatorio]]
        .map(escaparCsv)
        .join(";"),
      ["Tipo do plantão", periodoConsultado?.tipoLabel || "-"]
        .map(escaparCsv)
        .join(";"),
      ["Período", periodoConsultado?.descricao || "-"]
        .map(escaparCsv)
        .join(";"),
      "",
    ];

    for (const modulo of modulos) {
      const colunasExportaveis = modulo.colunas.filter(
        (coluna) => coluna.exportar
      );

      linhas.push([modulo.label].map(escaparCsv).join(";"));
      linhas.push(
        colunasExportaveis.map((coluna) => escaparCsv(coluna.titulo)).join(";")
      );

      for (const item of modulo.dados) {
        linhas.push(
          colunasExportaveis
            .map((coluna) => escaparCsv(coluna.exportar?.(item) || "-"))
            .join(";")
        );
      }

      linhas.push("");
    }

    const numero = `RGP-${Date.now()}`;
    baixarArquivo(
      `\uFEFF${linhas.join("\r\n")}`,
      `relatorio-plantao-${formatarDataInput(new Date())}.csv`,
      "text/csv;charset=utf-8"
    );
    void registrarExportacao("CSV", numero);
  }

  function gerarExcel() {
    if (!validarExportacao()) return;

    const tabelas = modulos
      .map((modulo) => {
        const colunasExportaveis = modulo.colunas.filter(
          (coluna) => coluna.exportar
        );

        const cabecalho = colunasExportaveis
          .map((coluna) => `<th>${escaparHtml(coluna.titulo)}</th>`)
          .join("");

        const corpo = modulo.dados
          .map(
            (item) =>
              `<tr>${colunasExportaveis
                .map(
                  (coluna) =>
                    `<td>${escaparHtml(coluna.exportar?.(item) || "-")}</td>`
                )
                .join("")}</tr>`
          )
          .join("");

        return `
          <h2>${escaparHtml(modulo.label)}</h2>
          <table border="1">
            <thead><tr>${cabecalho}</tr></thead>
            <tbody>${corpo}</tbody>
          </table>
          <br />
        `;
      })
      .join("");

    const html = `
      <html>
        <head><meta charset="UTF-8" /></head>
        <body>
          <h1>${escaparHtml(TITULOS_RELATORIO[tipoRelatorio])}</h1>
          <p><strong>Tipo:</strong> ${escaparHtml(
            periodoConsultado?.tipoLabel || "-"
          )}</p>
          <p><strong>Período:</strong> ${escaparHtml(
            periodoConsultado?.descricao || "-"
          )}</p>
          ${tabelas}
        </body>
      </html>
    `;

    const numero = `RGP-${Date.now()}`;
    baixarArquivo(
      `\uFEFF${html}`,
      `relatorio-plantao-${formatarDataInput(new Date())}.xls`,
      "application/vnd.ms-excel;charset=utf-8"
    );
    void registrarExportacao("EXCEL", numero);
  }

  async function gerarPDF() {
    if (!validarExportacao() || !periodoConsultado) return;

    const usuario = obterUsuarioLogado();

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
      console.error("Erro ao carregar município para o PDF:", error);
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

    const [imgPrefeitura, imgGuarda] = await Promise.all([
      carregarImagemBase64(brasaoPrefeitura),
      carregarImagemBase64(brasaoGuarda),
    ]);

    const doc = new jsPDF("p", "mm", "a4");
    const larguraPagina = doc.internal.pageSize.getWidth();
    const alturaPagina = doc.internal.pageSize.getHeight();
    const nomeMunicipio = municipioInfo?.nome || "";
    const nomeGuarda = municipioInfo?.nome_guarda || "Guarda Civil Municipal";
    const comandante = municipioInfo?.comandante || "";
    const emitidoPor = usuario.nome || "";
    const agora = new Date();
    const numeroRelatorio = `RGP-${formatarDataInput(agora).replaceAll(
      "-",
      ""
    )}-${preencherDoisDigitos(agora.getHours())}${preencherDoisDigitos(
      agora.getMinutes()
    )}`;

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
      doc.text(
        TITULOS_RELATORIO[tipoRelatorio].toUpperCase(),
        larguraPagina / 2,
        27,
        { align: "center" }
      );

      doc.setLineWidth(0.3);
      doc.line(12, 34, 198, 34);
    }

    function adicionarMarcaDagua() {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(30);
      doc.setTextColor(238, 238, 238);
      doc.text("SIG-GCM BRASIL", larguraPagina / 2, 150, {
        align: "center",
        angle: 45,
      });
      doc.setTextColor(0, 0, 0);
    }

    function novaPagina() {
      doc.addPage();
      adicionarMarcaDagua();
      adicionarCabecalho();
    }

    function adicionarRodape(numeroPagina: number, totalPaginas: number) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(80, 80, 80);
      doc.line(12, alturaPagina - 13, 198, alturaPagina - 13);
      doc.text(
        `${numeroRelatorio} | SIG-GCM Brasil | Página ${numeroPagina} de ${totalPaginas}`,
        larguraPagina / 2,
        alturaPagina - 7,
        { align: "center" }
      );
    }

    adicionarMarcaDagua();
    adicionarCabecalho();

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9.5);
    doc.text(`Relatório nº: ${numeroRelatorio}`, 14, 42);
    doc.text(`Emitido em: ${formatarDataHora(agora)}`, 14, 48);
    doc.text(`Emitido por: ${emitidoPor || "-"}`, 14, 54);
    doc.text(`Tipo do plantão: ${periodoConsultado.tipoLabel}`, 14, 60);
    doc.text(`Período: ${periodoConsultado.descricao}`, 14, 66);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("Resumo Operacional", 14, 77);

    autoTable(doc, {
      startY: 82,
      theme: "grid",
      headStyles: {
        fillColor: [15, 23, 42],
        textColor: [255, 255, 255],
      },
      head: [["Item", "Quantidade"]],
      body: modulos.map((modulo) => [modulo.label, modulo.dados.length]),
      margin: { left: 14, right: 14, bottom: 22 },
    });

    for (const modulo of modulos) {
      if (modulo.dados.length === 0) continue;

      novaPagina();
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.text(modulo.label, 14, 44);

      const colunasExportaveis = modulo.colunas.filter(
        (coluna) => coluna.exportar
      );

      autoTable(doc, {
        startY: 50,
        theme: "grid",
        headStyles: {
          fillColor: [15, 23, 42],
          textColor: [255, 255, 255],
        },
        head: [colunasExportaveis.map((coluna) => coluna.titulo)],
        body: modulo.dados.map((item) =>
          colunasExportaveis.map((coluna) => coluna.exportar?.(item) || "-")
        ),
        margin: { top: 42, left: 10, right: 10, bottom: 22 },
        styles: { fontSize: 8, cellPadding: 2 },
      });
    }

    const yAssinatura = alturaPagina - 42;
    const ultimaPagina = doc.getNumberOfPages();
    doc.setPage(ultimaPagina);
    doc.setTextColor(0, 0, 0);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.text("__________________________________", 18, yAssinatura);
    doc.text(`Comandante: ${comandante || "-"}`, 24, yAssinatura + 8);
    doc.text("__________________________________", 118, yAssinatura);
    doc.text(`Responsável: ${emitidoPor || "-"}`, 124, yAssinatura + 8);

    const totalPaginas = doc.getNumberOfPages();

    for (let pagina = 1; pagina <= totalPaginas; pagina++) {
      doc.setPage(pagina);
      adicionarRodape(pagina, totalPaginas);
    }

    await registrarExportacao("PDF", numeroRelatorio);
    doc.save(`relatorio-plantao-${numeroRelatorio}.pdf`);
  }

  const totalRegistros = modulos.reduce(
    (total, modulo) => total + modulo.dados.length,
    0
  );

  return (
    <div className="space-y-5 p-3 pb-24 md:p-6 md:pb-24">
      <section className="overflow-hidden rounded-3xl border border-slate-800 bg-slate-950/55 shadow-2xl shadow-black/20">
        <div className="border-b border-slate-800 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 p-5 md:p-7">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="mb-2 flex items-center gap-2 text-cyan-300">
                <ShieldCheck size={18} />
                <span className="text-xs font-black uppercase tracking-[0.22em]">
                  Controle operacional
                </span>
              </div>

              <h1 className="text-2xl font-black text-white md:text-3xl">
                {TITULOS_RELATORIO[tipoRelatorio]}
              </h1>

              <p className="mt-2 max-w-3xl text-sm text-slate-400 md:text-base">
                Consulte as atividades do período, visualize os resultados e
                gere o documento oficial somente após a conferência.
              </p>
            </div>

            <div
              className={`inline-flex w-fit items-center gap-2 rounded-full border px-4 py-2 text-sm font-bold ${
                relatorioCarregado
                  ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                  : "border-amber-500/30 bg-amber-500/10 text-amber-300"
              }`}
            >
              {relatorioCarregado ? (
                <CheckCircle2 size={17} />
              ) : (
                <Clock3 size={17} />
              )}
              {relatorioCarregado
                ? "Relatório atualizado"
                : "Aguardando atualização"}
            </div>
          </div>
        </div>

        <div className="space-y-5 p-4 md:p-6">
          <section className="rounded-2xl border border-cyan-500/15 bg-slate-950/70 p-4 md:p-5">
            <div className="mb-4 flex items-center gap-3">
              <div className="rounded-xl border border-cyan-500/20 bg-cyan-500/10 p-2.5 text-cyan-300">
                <CalendarDays size={20} />
              </div>
              <div>
                <h2 className="font-black text-white">Período do relatório</h2>
                <p className="text-sm text-slate-400">
                  Selecione a escala utilizada pelo município.
                </p>
              </div>
            </div>

            {tipoRelatorio === "plantao" ? (
              <div className="grid gap-4 md:grid-cols-2">
                <CampoFormulario label="Data do plantão">
                  <input
                    type="date"
                    value={dataPlantao}
                    onChange={(evento) => setDataPlantao(evento.target.value)}
                    className="campo-relatorio"
                  />
                </CampoFormulario>

                <CampoFormulario label="Tipo do plantão">
                  <select
                    value={tipoPlantao}
                    onChange={(evento) =>
                      setTipoPlantao(evento.target.value as TipoPlantao)
                    }
                    className="campo-relatorio"
                  >
                    {Object.entries(TIPOS_PLANTAO).map(([valor, configuracao]) => (
                      <option key={valor} value={valor}>
                        {configuracao.label}
                      </option>
                    ))}
                  </select>
                </CampoFormulario>

                {TIPOS_PLANTAO[tipoPlantao].personalizado && (
                  <>
                    <CampoFormulario label="Início do período">
                      <input
                        type="datetime-local"
                        value={inicioPersonalizado}
                        onChange={(evento) =>
                          setInicioPersonalizado(evento.target.value)
                        }
                        className="campo-relatorio"
                      />
                    </CampoFormulario>

                    <CampoFormulario label="Fim do período">
                      <input
                        type="datetime-local"
                        value={fimPersonalizado}
                        onChange={(evento) =>
                          setFimPersonalizado(evento.target.value)
                        }
                        className="campo-relatorio"
                      />
                    </CampoFormulario>
                  </>
                )}
              </div>
            ) : (
              <FiltrosOutrosRelatorios
                tipoRelatorio={tipoRelatorio}
                data={data}
                setData={setData}
                mesReferencia={mesReferencia}
                setMesReferencia={setMesReferencia}
                anoReferencia={anoReferencia}
                setAnoReferencia={setAnoReferencia}
              />
            )}

            <div className="mt-4 grid gap-3 rounded-2xl border border-slate-800 bg-slate-900/60 p-4 md:grid-cols-3">
              <ResumoPeriodo
                titulo="Escala selecionada"
                valor={
                  tipoRelatorio === "plantao"
                    ? TIPOS_PLANTAO[tipoPlantao].label
                    : TITULOS_RELATORIO[tipoRelatorio]
                }
              />
              <ResumoPeriodo
                titulo="Início"
                valor={periodoPrevisto ? formatarDataHora(periodoPrevisto.inicio) : "-"}
              />
              <ResumoPeriodo
                titulo="Fim"
                valor={periodoPrevisto ? formatarDataHora(periodoPrevisto.fim) : "-"}
              />
            </div>
          </section>

          <section className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4 md:p-5">
            <div className="mb-4">
              <h2 className="font-black text-white">O que incluir no relatório</h2>
              <p className="text-sm text-slate-400">
                Marque somente os módulos necessários para esta conferência.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
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
          </section>

          <section className="flex flex-col gap-3 rounded-2xl border border-slate-800 bg-slate-900/40 p-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="font-bold text-white">Ações do relatório</p>
              <p className="text-sm text-slate-400">
                PDF, Excel e CSV são liberados após a visualização.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
              <button
                type="button"
                onClick={carregarRelatorio}
                disabled={carregando}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-amber-400 px-4 py-3 text-sm font-black text-slate-950 transition hover:bg-amber-300 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <RefreshCw size={17} className={carregando ? "animate-spin" : ""} />
                {carregando ? "Atualizando..." : "Atualizar relatório"}
              </button>

              <button
                type="button"
                onClick={gerarPDF}
                disabled={!relatorioCarregado}
                className="botao-exportacao border-red-500/30 bg-red-500/10 text-red-300 hover:bg-red-500/20"
              >
                <FileText size={17} />
                PDF
              </button>

              <button
                type="button"
                onClick={gerarExcel}
                disabled={!relatorioCarregado}
                className="botao-exportacao border-emerald-500/30 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20"
              >
                <FileSpreadsheet size={17} />
                Excel
              </button>

              <button
                type="button"
                onClick={gerarCsv}
                disabled={!relatorioCarregado}
                className="botao-exportacao border-cyan-500/30 bg-cyan-500/10 text-cyan-300 hover:bg-cyan-500/20"
              >
                <FileSpreadsheet size={17} />
                CSV
              </button>
            </div>
          </section>
        </div>
      </section>

      {relatorioCarregado ? (
        <>
          <section className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
            <CardIndicador titulo="Total de registros" valor={totalRegistros} destaque />
            {modulos.slice(0, 5).map((modulo) => (
              <CardIndicador
                key={modulo.id}
                titulo={modulo.label}
                valor={modulo.dados.length}
              />
            ))}
          </section>

          <section className="overflow-hidden rounded-3xl border border-slate-800 bg-slate-950/60">
            <div className="border-b border-slate-800 p-4 md:p-5">
              <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <div>
                  <h2 className="text-lg font-black text-white">Resultado do plantão</h2>
                  <p className="text-sm text-slate-400">
                    {periodoConsultado?.tipoLabel} • {periodoConsultado?.descricao}
                  </p>
                </div>
                <span className="text-sm font-bold text-cyan-300">
                  {totalRegistros} registro(s)
                </span>
              </div>
            </div>

            <div className="overflow-x-auto border-b border-slate-800 p-3">
              <div className="flex min-w-max gap-2">
                {modulos.map((modulo) => (
                  <button
                    key={modulo.id}
                    type="button"
                    onClick={() => setAbaAtiva(modulo.id)}
                    className={`rounded-xl border px-4 py-2.5 text-sm font-bold transition ${
                      moduloAtivo?.id === modulo.id
                        ? "border-cyan-400/40 bg-cyan-500/15 text-cyan-200"
                        : "border-slate-800 bg-slate-900/70 text-slate-400 hover:border-slate-700 hover:text-white"
                    }`}
                  >
                    {modulo.label}
                    <span className="ml-2 rounded-full bg-black/25 px-2 py-0.5 text-xs">
                      {modulo.dados.length}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {moduloAtivo ? (
              <TabelaModulo modulo={moduloAtivo} />
            ) : (
              <div className="p-8 text-center text-slate-400">
                Nenhum módulo foi selecionado.
              </div>
            )}
          </section>
        </>
      ) : (
        <section className="rounded-3xl border border-dashed border-slate-700 bg-slate-950/40 p-10 text-center">
          <Clock3 className="mx-auto text-slate-500" size={34} />
          <h2 className="mt-4 text-lg font-black text-white">
            Atualize o relatório para visualizar os dados
          </h2>
          <p className="mt-2 text-sm text-slate-400">
            Revise o período e os módulos selecionados e clique em “Atualizar relatório”.
          </p>
        </section>
      )}

      <style jsx>{`
        :global(.campo-relatorio) {
          width: 100%;
          border-radius: 0.75rem;
          border: 1px solid rgb(51 65 85);
          background: rgb(2 6 23);
          padding: 0.75rem 1rem;
          color: white;
          outline: none;
          transition: border-color 0.2s ease, box-shadow 0.2s ease;
        }

        :global(.campo-relatorio:focus) {
          border-color: rgb(34 211 238);
          box-shadow: 0 0 0 3px rgb(34 211 238 / 0.1);
        }

        :global(.botao-exportacao) {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          border-width: 1px;
          border-radius: 0.75rem;
          padding: 0.75rem 1rem;
          font-size: 0.875rem;
          font-weight: 800;
          transition: background-color 0.2s ease, opacity 0.2s ease;
        }

        :global(.botao-exportacao:disabled) {
          cursor: not-allowed;
          opacity: 0.35;
        }
      `}</style>
    </div>
  );
}

function CampoFormulario({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-bold text-slate-300">
        {label}
      </span>
      {children}
    </label>
  );
}

function ResumoPeriodo({ titulo, valor }: { titulo: string; valor: string }) {
  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
        {titulo}
      </p>
      <p className="mt-1 text-sm font-semibold text-slate-200">{valor}</p>
    </div>
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
    <label
      className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3 transition ${
        checked
          ? "border-cyan-500/30 bg-cyan-500/10 text-white"
          : "border-slate-800 bg-slate-900/50 text-slate-400 hover:border-slate-700"
      }`}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={(evento) => onChange(evento.target.checked)}
        className="h-4 w-4 accent-cyan-400"
      />
      <span className="text-sm font-semibold">{label}</span>
    </label>
  );
}

function CardIndicador({
  titulo,
  valor,
  destaque = false,
}: {
  titulo: string;
  valor: number;
  destaque?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border p-4 md:p-5 ${
        destaque
          ? "border-cyan-500/30 bg-cyan-500/10"
          : "border-slate-800 bg-slate-950/60"
      }`}
    >
      <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
        {titulo}
      </p>
      <p className="mt-2 text-3xl font-black text-white">{valor}</p>
    </div>
  );
}

function StatusBadge({ status }: { status: unknown }) {
  const texto = String(status || "-").toUpperCase();
  const finalizado = ["FINALIZADO", "CONCLUIDO", "CONCLUÍDO", "FECHADO"].includes(
    texto
  );
  const cancelado = ["CANCELADO", "NEGADO", "RECUSADO"].includes(texto);

  return (
    <span
      className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-black ${
        finalizado
          ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
          : cancelado
          ? "border-red-500/30 bg-red-500/10 text-red-300"
          : "border-amber-500/30 bg-amber-500/10 text-amber-300"
      }`}
    >
      {texto}
    </span>
  );
}

function TabelaModulo({ modulo }: { modulo: ModuloTabela }) {
  return (
    <div className="p-4 md:p-5">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="font-black text-white">{modulo.label}</h3>
          <p className="text-sm text-slate-400">
            {modulo.dados.length} registro(s) encontrado(s).
          </p>
        </div>
      </div>

      {modulo.dados.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-900/30 p-8 text-center text-slate-400">
          Nenhum registro encontrado neste módulo para o período selecionado.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-slate-800">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-900/90 text-left text-xs uppercase tracking-wider text-slate-400">
              <tr>
                {modulo.colunas.map((coluna) => (
                  <th key={coluna.titulo} className="whitespace-nowrap px-4 py-3">
                    {coluna.titulo}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-800 bg-slate-950/50 text-slate-300">
              {modulo.dados.map((item) => (
                <tr key={String(item.id)} className="hover:bg-slate-900/60">
                  {modulo.colunas.map((coluna) => (
                    <td key={coluna.titulo} className="px-4 py-3 align-top">
                      {coluna.render(item)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function FiltrosOutrosRelatorios({
  tipoRelatorio,
  data,
  setData,
  mesReferencia,
  setMesReferencia,
  anoReferencia,
  setAnoReferencia,
}: {
  tipoRelatorio: TipoRelatorio;
  data: string;
  setData: (valor: string) => void;
  mesReferencia: string;
  setMesReferencia: (valor: string) => void;
  anoReferencia: string;
  setAnoReferencia: (valor: string) => void;
}) {
  if (["diario", "semanal", "quinzenal"].includes(tipoRelatorio)) {
    return (
      <CampoFormulario label="Data de referência">
        <input
          type="date"
          value={data}
          onChange={(evento) => setData(evento.target.value)}
          className="campo-relatorio"
        />
      </CampoFormulario>
    );
  }

  if (["mensal", "bimestral", "trimestral", "semestral"].includes(tipoRelatorio)) {
    return (
      <CampoFormulario label="Mês de referência">
        <input
          type="month"
          value={mesReferencia}
          onChange={(evento) => setMesReferencia(evento.target.value)}
          className="campo-relatorio"
        />
      </CampoFormulario>
    );
  }

  return (
    <CampoFormulario label="Ano de referência">
      <input
        type="number"
        min="2000"
        max="2100"
        value={anoReferencia}
        onChange={(evento) => setAnoReferencia(evento.target.value)}
        className="campo-relatorio"
      />
    </CampoFormulario>
  );
}
