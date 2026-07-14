"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  BarChart3,
  FileDown,
  Search,
} from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

import ProtecaoModulo from "@/components/ProtecaoModulo";
import {
  montarUrlComMunicipioContexto,
} from "@/lib/contextoMunicipio";
import { supabase } from "@/lib/supabase";

type Modulo =
  | "ocorrencias"
  | "patrulhamentos"
  | "chamados"
  | "viaturas"
  | "guardas";

type UsuarioLocal = {
  id?: number | string;
  nome?: string;
  perfil?: string;
  municipio_id?: number;
};

type Institucional = {
  municipio_id: number;
  municipio_nome: string;
  estado: string;
  nome_guarda: string;
  comandante: string;
  brasao_prefeitura: string;
  brasao_gcm: string;
};

type RespostaRelatorio = {
  ok?: boolean;
  erro?: string;
  registros?: Record<string, unknown>[];
  institucional?: Institucional;
  limite_atingido?: boolean;
};

type ColunaPdf = {
  titulo: string;
  largura?: number;
  valor: (
    item: Record<string, unknown>
  ) => string;
};

const LIMITE_REGISTROS = 1000;

const modulos: Record<
  Modulo,
  {
    nome: string;
    nomeArquivo: string;
  }
> = {
  ocorrencias: {
    nome: "Ocorrências",
    nomeArquivo: "ocorrencias",
  },
  patrulhamentos: {
    nome: "Patrulhamentos",
    nomeArquivo: "patrulhamentos",
  },
  chamados: {
    nome: "Chamados",
    nomeArquivo: "chamados",
  },
  viaturas: {
    nome: "Viaturas",
    nomeArquivo: "viaturas",
  },
  guardas: {
    nome: "Guardas",
    nomeArquivo: "guardas",
  },
};

function texto(
  valor: unknown,
  fallback = "-"
) {
  const convertido =
    String(valor ?? "").trim();

  return convertido || fallback;
}

function primeiroValor(
  item: Record<string, unknown>,
  campos: string[]
) {
  for (const campo of campos) {
    const valor = texto(
      item[campo],
      ""
    );

    if (valor) {
      return valor;
    }
  }

  return "-";
}

function formatarData(
  valor: unknown
) {
  const original =
    texto(valor, "");

  if (!original) {
    return "-";
  }

  const dataSomente =
    original.match(
      /^(\d{4})-(\d{2})-(\d{2})/
    );

  if (dataSomente) {
    return (
      `${dataSomente[3]}/` +
      `${dataSomente[2]}/` +
      `${dataSomente[1]}`
    );
  }

  const data =
    new Date(original);

  if (
    Number.isNaN(
      data.getTime()
    )
  ) {
    return original;
  }

  return data.toLocaleDateString(
    "pt-BR"
  );
}

function formatarDataHora(
  valor: unknown
) {
  const original =
    texto(valor, "");

  if (!original) {
    return "-";
  }

  const data =
    new Date(original);

  if (
    Number.isNaN(
      data.getTime()
    )
  ) {
    return formatarData(
      original
    );
  }

  return data.toLocaleString(
    "pt-BR",
    {
      dateStyle: "short",
      timeStyle: "short",
    }
  );
}

function combinarDataHora(
  item: Record<string, unknown>
) {
  const data =
    formatarData(
      item.data ||
      item.data_servico ||
      item.criado_em
    );

  const hora =
    primeiroValor(
      item,
      [
        "hora",
        "hora_inicio",
      ]
    );

  if (
    data === "-" &&
    hora === "-"
  ) {
    return "-";
  }

  if (hora === "-") {
    return data;
  }

  return `${data} ${hora}`;
}

function normalizarArquivo(
  valor: string
) {
  return valor
    .normalize("NFD")
    .replace(
      /[\u0300-\u036f]/g,
      ""
    )
    .replace(
      /[^a-zA-Z0-9]+/g,
      "-"
    )
    .replace(
      /^-+|-+$/g,
      ""
    )
    .toLowerCase();
}

function lerUsuarioLocal():
  | UsuarioLocal
  | null {
  if (
    typeof window === "undefined"
  ) {
    return null;
  }

  try {
    const salvo =
      localStorage.getItem(
        "usuarioLogado"
      );

    if (!salvo) {
      return null;
    }

    return JSON.parse(
      salvo
    ) as UsuarioLocal;
  } catch {
    return null;
  }
}

async function obterToken() {
  const {
    data: { session },
    error,
  } =
    await supabase.auth.getSession();

  if (
    error ||
    !session?.access_token
  ) {
    throw new Error(
      "Sessão inválida ou expirada."
    );
  }

  return session.access_token;
}

type ImagemPdf = {
  base64: string;
  formato:
    | "PNG"
    | "JPEG"
    | "WEBP";
  largura: number;
  altura: number;
};

async function carregarImagemPdf(
  url: string
): Promise<ImagemPdf | null> {
  const endereco =
    texto(url, "");

  if (!endereco) {
    return null;
  }

  try {
    const resposta =
      await fetch(
        endereco,
        {
          cache: "no-store",
        }
      );

    if (!resposta.ok) {
      return null;
    }

    const blob =
      await resposta.blob();

    let formato:
      | "PNG"
      | "JPEG"
      | "WEBP";

    if (
      blob.type.includes(
        "png"
      )
    ) {
      formato = "PNG";
    } else if (
      blob.type.includes(
        "webp"
      )
    ) {
      formato = "WEBP";
    } else if (
      blob.type.includes(
        "jpeg"
      ) ||
      blob.type.includes(
        "jpg"
      )
    ) {
      formato = "JPEG";
    } else {
      return null;
    }

    const base64 =
      await new Promise<string>(
        (
          resolve,
          reject
        ) => {
          const leitor =
            new FileReader();

          leitor.onload =
            () =>
              resolve(
                String(
                  leitor.result ||
                  ""
                )
              );

          leitor.onerror =
            () =>
              reject(
                new Error(
                  "Falha ao ler a imagem."
                )
              );

          leitor.readAsDataURL(
            blob
          );
        }
      );

    const dimensoes =
      await new Promise<{
        largura: number;
        altura: number;
      }>(
        (
          resolve,
          reject
        ) => {
          const imagem =
            new Image();

          imagem.onload =
            () =>
              resolve({
                largura:
                  imagem.naturalWidth ||
                  imagem.width,
                altura:
                  imagem.naturalHeight ||
                  imagem.height,
              });

          imagem.onerror =
            () =>
              reject(
                new Error(
                  "Falha ao carregar a imagem."
                )
              );

          imagem.src =
            base64;
        }
      );

    if (
      dimensoes.largura <= 0 ||
      dimensoes.altura <= 0
    ) {
      return null;
    }

    return {
      base64,
      formato,
      largura:
        dimensoes.largura,
      altura:
        dimensoes.altura,
    };
  } catch (error) {
    console.error(
      "Erro ao carregar imagem institucional:",
      {
        url: endereco,
        message:
          error instanceof Error
            ? error.message
            : "Erro desconhecido",
      }
    );

    return null;
  }
}

function colunasPdf(
  modulo: Modulo
): ColunaPdf[] {
  if (
    modulo === "ocorrencias"
  ) {
    return [
      {
        titulo: "Protocolo",
        valor: (item) =>
          primeiroValor(
            item,
            [
              "protocolo",
              "id",
            ]
          ),
      },
      {
        titulo: "Data/Hora",
        valor:
          combinarDataHora,
      },
      {
        titulo: "Tipo",
        valor: (item) =>
          primeiroValor(
            item,
            [
              "tipo",
              "natureza",
            ]
          ),
      },
      {
        titulo: "Status",
        valor: (item) =>
          primeiroValor(
            item,
            ["status"]
          ),
      },
      {
        titulo: "Local",
        valor: (item) =>
          primeiroValor(
            item,
            [
              "local",
              "bairro",
            ]
          ),
      },
      {
        titulo: "Responsável",
        valor: (item) =>
          primeiroValor(
            item,
            [
              "guarda_responsavel",
              "guarda",
              "responsavel",
            ]
          ),
      },
    ];
  }

  if (
    modulo ===
    "patrulhamentos"
  ) {
    return [
      {
        titulo: "ID",
        valor: (item) =>
          primeiroValor(
            item,
            ["id"]
          ),
      },
      {
        titulo: "Data/Hora",
        valor:
          combinarDataHora,
      },
      {
        titulo: "Guarda",
        valor: (item) =>
          primeiroValor(
            item,
            ["guarda"]
          ),
      },
      {
        titulo: "Guarnição",
        valor: (item) =>
          primeiroValor(
            item,
            [
              "equipe",
              "guarnicao",
            ]
          ),
      },
      {
        titulo: "Viatura",
        valor: (item) =>
          primeiroValor(
            item,
            ["viatura"]
          ),
      },
      {
        titulo: "Status",
        valor: (item) =>
          primeiroValor(
            item,
            ["status"]
          ),
      },
      {
        titulo: "Local/Observação",
        valor: (item) =>
          primeiroValor(
            item,
            [
              "local",
              "observacao",
            ]
          ),
      },
    ];
  }

  if (
    modulo === "chamados"
  ) {
    return [
      {
        titulo: "ID",
        valor: (item) =>
          primeiroValor(
            item,
            [
              "protocolo",
              "id",
            ]
          ),
      },
      {
        titulo: "Data/Hora",
        valor: (item) =>
          formatarDataHora(
            item.criado_em ||
            item.data
          ),
      },
      {
        titulo: "Tipo",
        valor: (item) =>
          primeiroValor(
            item,
            [
              "tipo",
              "natureza",
            ]
          ),
      },
      {
        titulo: "Status",
        valor: (item) =>
          primeiroValor(
            item,
            ["status"]
          ),
      },
      {
        titulo: "Local",
        valor: (item) =>
          primeiroValor(
            item,
            [
              "local",
              "endereco",
              "bairro",
            ]
          ),
      },
      {
        titulo: "Descrição",
        valor: (item) =>
          primeiroValor(
            item,
            [
              "descricao",
              "observacao",
              "detalhes",
            ]
          ),
      },
    ];
  }

  if (
    modulo === "viaturas"
  ) {
    return [
      {
        titulo: "Prefixo",
        valor: (item) =>
          primeiroValor(
            item,
            [
              "prefixo",
              "id",
            ]
          ),
      },
      {
        titulo: "Modelo",
        valor: (item) =>
          primeiroValor(
            item,
            ["modelo"]
          ),
      },
      {
        titulo: "Placa",
        valor: (item) =>
          primeiroValor(
            item,
            ["placa"]
          ),
      },
      {
        titulo: "Status",
        valor: (item) =>
          primeiroValor(
            item,
            ["status"]
          ),
      },
      {
        titulo: "Combustível",
        valor: (item) =>
          primeiroValor(
            item,
            ["combustivel"]
          ),
      },
      {
        titulo: "Quilometragem",
        valor: (item) =>
          primeiroValor(
            item,
            [
              "quilometragem",
              "km_atual",
            ]
          ),
      },
    ];
  }

  return [
    {
      titulo: "Matrícula",
      valor: (item) =>
        primeiroValor(
          item,
          [
            "matricula",
            "id",
          ]
        ),
    },
    {
      titulo: "Nome",
      valor: (item) =>
        primeiroValor(
          item,
          ["nome"]
        ),
    },
    {
      titulo: "Cargo/Função",
      valor: (item) =>
        primeiroValor(
          item,
          [
            "cargo",
            "funcao",
            "graduacao",
          ]
        ),
    },
    {
      titulo: "Status",
      valor: (item) =>
        primeiroValor(
          item,
          ["status"]
        ),
    },
    {
      titulo: "Contato",
      valor: (item) =>
        primeiroValor(
          item,
          [
            "telefone",
            "celular",
            "email",
          ]
        ),
    },
  ];
}

export default function RelatoriosPage() {
  const [
    modulo,
    setModulo,
  ] =
    useState<Modulo>(
      "ocorrencias"
    );

  const [
    periodo,
    setPeriodo,
  ] = useState("mensal");

  const [
    dataInicio,
    setDataInicio,
  ] = useState("");

  const [
    dataFim,
    setDataFim,
  ] = useState("");

  const [
    status,
    setStatus,
  ] = useState("");

  const [
    tipo,
    setTipo,
  ] = useState("");

  const [
    local,
    setLocal,
  ] = useState("");

  const [
    guarda,
    setGuarda,
  ] = useState("");

  const [
    guarnicao,
    setGuarnicao,
  ] = useState("");

  const [
    viatura,
    setViatura,
  ] = useState("");

  const [
    busca,
    setBusca,
  ] = useState("");

  const [
    registros,
    setRegistros,
  ] = useState<
    Record<string, unknown>[]
  >([]);

  const [
    institucional,
    setInstitucional,
  ] =
    useState<Institucional | null>(
      null
    );

  const [
    carregando,
    setCarregando,
  ] = useState(false);

  const [
    gerandoPdf,
    setGerandoPdf,
  ] = useState(false);

  const [
    limiteAtingido,
    setLimiteAtingido,
  ] = useState(false);

  useEffect(() => {
    definirPeriodo(
      "mensal"
    );
  }, []);

  function definirPeriodo(
    valor: string
  ) {
    setPeriodo(valor);

    const hoje =
      new Date();

    const inicio =
      new Date();

    if (
      valor === "diario"
    ) {
      inicio.setDate(
        hoje.getDate()
      );
    }

    if (
      valor === "semanal"
    ) {
      inicio.setDate(
        hoje.getDate() - 7
      );
    }

    if (
      valor === "quinzenal"
    ) {
      inicio.setDate(
        hoje.getDate() - 15
      );
    }

    if (
      valor === "mensal"
    ) {
      inicio.setMonth(
        hoje.getMonth() - 1
      );
    }

    if (
      valor ===
      "trimestral"
    ) {
      inicio.setMonth(
        hoje.getMonth() - 3
      );
    }

    if (
      valor === "semestral"
    ) {
      inicio.setMonth(
        hoje.getMonth() - 6
      );
    }

    if (
      valor === "anual"
    ) {
      inicio.setFullYear(
        hoje.getFullYear() - 1
      );
    }

    if (
      valor !==
      "personalizado"
    ) {
      setDataInicio(
        inicio
          .toISOString()
          .split("T")[0]
      );

      setDataFim(
        hoje
          .toISOString()
          .split("T")[0]
      );
    }

    setRegistros([]);
    setLimiteAtingido(
      false
    );
  }

  async function buscarRelatorio() {
    const usuario =
      lerUsuarioLocal();

    if (
      !usuario?.perfil
    ) {
      alert(
        "Usuário não identificado."
      );
      return;
    }

    if (
      dataInicio &&
      dataFim &&
      dataInicio > dataFim
    ) {
      alert(
        "A data inicial não pode ser maior que a data final."
      );
      return;
    }

    setCarregando(true);
    setLimiteAtingido(
      false
    );

    try {
      const token =
        await obterToken();

      const parametros =
        new URLSearchParams({
          modulo,
        });

      if (dataInicio) {
        parametros.set(
          "data_inicio",
          dataInicio
        );
      }

      if (dataFim) {
        parametros.set(
          "data_fim",
          dataFim
        );
      }

      const url =
        montarUrlComMunicipioContexto({
          url:
            `/api/relatorios?${parametros.toString()}`,
          perfil:
            usuario.perfil,
          municipioIdUsuario:
            usuario.municipio_id,
        });

      const resposta =
        await fetch(
          url,
          {
            method: "GET",
            headers: {
              Authorization:
                `Bearer ${token}`,
            },
            cache: "no-store",
          }
        );

      const dados =
        (await resposta
          .json()
          .catch(() => ({}))) as
          RespostaRelatorio;

      if (
        !resposta.ok ||
        !dados.ok
      ) {
        throw new Error(
          dados.erro ||
          "Não foi possível gerar o relatório."
        );
      }

      setRegistros(
        Array.isArray(
          dados.registros
        )
          ? dados.registros
          : []
      );

      setInstitucional(
        dados.institucional ||
        null
      );

      setLimiteAtingido(
        Boolean(
          dados.limite_atingido
        )
      );
    } catch (error) {
      console.error(
        "Erro ao buscar relatório:",
        {
          message:
            error instanceof Error
              ? error.message
              : "Erro desconhecido",
        }
      );

      alert(
        error instanceof Error
          ? error.message
          : "Erro ao gerar relatório."
      );

      setRegistros([]);
      setInstitucional(
        null
      );
    } finally {
      setCarregando(false);
    }
  }

  const filtrados =
    useMemo(() => {
      return registros.filter(
        (item) => {
          const conteudo =
            JSON.stringify(
              item
            ).toLowerCase();

          if (
            status &&
            texto(
              item.status,
              ""
            ).toLowerCase() !==
              status.toLowerCase()
          ) {
            return false;
          }

          if (
            tipo &&
            !conteudo.includes(
              tipo.toLowerCase()
            )
          ) {
            return false;
          }

          if (
            local &&
            !conteudo.includes(
              local.toLowerCase()
            )
          ) {
            return false;
          }

          if (
            guarda &&
            !conteudo.includes(
              guarda.toLowerCase()
            )
          ) {
            return false;
          }

          if (
            guarnicao &&
            !conteudo.includes(
              guarnicao.toLowerCase()
            )
          ) {
            return false;
          }

          if (
            viatura &&
            !conteudo.includes(
              viatura.toLowerCase()
            )
          ) {
            return false;
          }

          if (
            busca &&
            !conteudo.includes(
              busca.toLowerCase()
            )
          ) {
            return false;
          }

          return true;
        }
      );
    }, [
      registros,
      status,
      tipo,
      local,
      guarda,
      guarnicao,
      viatura,
      busca,
    ]);

  const resumo =
    useMemo(() => {
      return {
        total:
          filtrados.length,
        abertos:
          filtrados.filter(
            (registro) => {
              const valor =
                texto(
                  registro.status,
                  ""
                ).toUpperCase();

              return [
                "ABERTA",
                "ABERTO",
                "PENDENTE",
                "EM_ANDAMENTO",
              ].includes(
                valor
              );
            }
          ).length,
        finalizados:
          filtrados.filter(
            (registro) => {
              const valor =
                texto(
                  registro.status,
                  ""
                ).toUpperCase();

              return [
                "FINALIZADA",
                "FINALIZADO",
                "CONCLUIDA",
                "CONCLUIDO",
              ].includes(
                valor
              );
            }
          ).length,
        cancelados:
          filtrados.filter(
            (registro) =>
              texto(
                registro.status,
                ""
              ).toUpperCase() ===
              "CANCELADO"
          ).length,
      };
    }, [filtrados]);

  function filtrosAplicados() {
    const filtros = [
      status
        ? `Status: ${status}`
        : "",
      tipo
        ? `Tipo: ${tipo}`
        : "",
      local
        ? `Local: ${local}`
        : "",
      guarda
        ? `Guarda: ${guarda}`
        : "",
      guarnicao
        ? `Guarnição: ${guarnicao}`
        : "",
      viatura
        ? `Viatura: ${viatura}`
        : "",
      busca
        ? `Busca: ${busca}`
        : "",
    ].filter(Boolean);

    return filtros.length
      ? filtros.join(" | ")
      : "Nenhum filtro adicional";
  }

  async function gerarPDF() {
    if (
      filtrados.length === 0
    ) {
      alert(
        "Nenhum registro para gerar PDF."
      );
      return;
    }

    if (!institucional) {
      alert(
        "As informações institucionais não foram carregadas. Clique em Buscar novamente."
      );
      return;
    }

    const institucionalSeguro: Institucional = {
      ...institucional,
    };

    const usuario =
      lerUsuarioLocal();

    setGerandoPdf(true);

    try {
      const [
        imagemPrefeitura,
        imagemGcm,
      ] =
        await Promise.all([
          carregarImagemPdf(
            institucionalSeguro
              .brasao_prefeitura
          ),
          carregarImagemPdf(
            institucionalSeguro
              .brasao_gcm
          ),
        ]);

      const doc =
        new jsPDF(
          "l",
          "mm",
          "a4"
        );

      const larguraPagina =
        doc.internal.pageSize
          .getWidth();

      const alturaPagina =
        doc.internal.pageSize
          .getHeight();

      const agora =
        new Date();

      const numero =
        `REL-${modulo
          .slice(0, 3)
          .toUpperCase()}-` +
        `${agora
          .toISOString()
          .slice(0, 10)
          .replaceAll("-", "")}-` +
        `${String(
          agora.getHours()
        ).padStart(2, "0")}` +
        `${String(
          agora.getMinutes()
        ).padStart(2, "0")}` +
        `${String(
          agora.getSeconds()
        ).padStart(2, "0")}`;

      function desenharImagem(
        imagem: ImagemPdf | null,
        x: number,
        y: number,
        larguraMaxima: number,
        alturaMaxima: number,
        rotulo: string
      ) {
        if (!imagem) {
          doc.setDrawColor(
            180,
            180,
            180
          );

          doc.roundedRect(
            x,
            y,
            larguraMaxima,
            alturaMaxima,
            2,
            2
          );

          doc.setFont(
            "helvetica",
            "bold"
          );

          doc.setFontSize(7);

          doc.setTextColor(
            110,
            110,
            110
          );

          doc.text(
            rotulo,
            x +
              larguraMaxima / 2,
            y +
              alturaMaxima / 2 +
              1,
            {
              align: "center",
            }
          );

          return;
        }

        const escala =
          Math.min(
            larguraMaxima /
              imagem.largura,
            alturaMaxima /
              imagem.altura
          );

        const largura =
          imagem.largura *
          escala;

        const altura =
          imagem.altura *
          escala;

        doc.addImage(
          imagem.base64,
          imagem.formato,
          x +
            (
              larguraMaxima -
              largura
            ) /
              2,
          y +
            (
              alturaMaxima -
              altura
            ) /
              2,
          largura,
          altura
        );
      }

      function desenharCabecalho() {
        desenharImagem(
          imagemPrefeitura,
          12,
          7,
          22,
          22,
          "PREFEITURA"
        );

        desenharImagem(
          imagemGcm,
          larguraPagina - 34,
          7,
          22,
          22,
          "GCM"
        );

        doc.setTextColor(
          0,
          0,
          0
        );

        doc.setFont(
          "helvetica",
          "bold"
        );

        doc.setFontSize(14);

        doc.text(
          institucionalSeguro
            .nome_guarda ||
            "Guarda Civil Municipal",
          larguraPagina / 2,
          12,
          {
            align: "center",
            maxWidth: 190,
          }
        );

        doc.setFont(
          "helvetica",
          "normal"
        );

        doc.setFontSize(10);

        doc.text(
          `${institucionalSeguro.municipio_nome} - ${institucionalSeguro.estado}`,
          larguraPagina / 2,
          18,
          {
            align: "center",
          }
        );

        doc.setFont(
          "helvetica",
          "bold"
        );

        doc.setFontSize(12);

        doc.text(
          `RELATÓRIO DE ${modulos[modulo].nome.toUpperCase()}`,
          larguraPagina / 2,
          25,
          {
            align: "center",
          }
        );

        doc.setDrawColor(
          15,
          23,
          42
        );

        doc.setLineWidth(
          0.4
        );

        doc.line(
          12,
          33,
          larguraPagina - 12,
          33
        );
      }

      desenharCabecalho();

      doc.setFont(
        "helvetica",
        "normal"
      );

      doc.setFontSize(8.5);

      doc.text(
        `Relatório nº: ${numero}`,
        12,
        40
      );

      doc.text(
        `Período: ${formatarData(dataInicio)} a ${formatarData(dataFim)}`,
        12,
        46
      );

      doc.text(
        `Emitido em: ${agora.toLocaleString("pt-BR")}`,
        12,
        52
      );

      doc.text(
        `Emitido por: ${texto(usuario?.nome)}`,
        150,
        40
      );

      doc.text(
        `Registros: ${filtrados.length}`,
        150,
        46
      );

      const filtros =
        doc.splitTextToSize(
          `Filtros: ${filtrosAplicados()}`,
          larguraPagina - 24
        );

      doc.text(
        filtros,
        12,
        59
      );

      const inicioTabela =
        59 +
        filtros.length * 4 +
        3;

      const colunas =
        colunasPdf(modulo);

      autoTable(doc, {
        startY:
          inicioTabela,
        head: [
          colunas.map(
            (coluna) =>
              coluna.titulo
          ),
        ],
        body:
          filtrados.map(
            (item) =>
              colunas.map(
                (coluna) =>
                  coluna.valor(
                    item
                  )
              )
          ),
        theme: "grid",
        margin: {
          top: 38,
          right: 12,
          bottom: 18,
          left: 12,
        },
        styles: {
          fontSize: 7.5,
          cellPadding: 2,
          overflow:
            "linebreak",
          valign: "middle",
        },
        headStyles: {
          fillColor: [
            15,
            23,
            42,
          ],
          textColor: [
            255,
            255,
            255,
          ],
          fontStyle: "bold",
        },
        alternateRowStyles: {
          fillColor: [
            245,
            247,
            250,
          ],
        },
        didDrawPage:
          (dados) => {
            if (
              dados.pageNumber > 1
            ) {
              desenharCabecalho();
            }
          },
      });

      const totalPaginas =
        doc.getNumberOfPages();

      for (
        let pagina = 1;
        pagina <=
        totalPaginas;
        pagina++
      ) {
        doc.setPage(
          pagina
        );

        doc.setDrawColor(
          160,
          160,
          160
        );

        doc.line(
          12,
          alturaPagina - 12,
          larguraPagina - 12,
          alturaPagina - 12
        );

        doc.setFont(
          "helvetica",
          "normal"
        );

        doc.setFontSize(7.5);

        doc.setTextColor(
          80,
          80,
          80
        );

        doc.text(
          `${numero} | SIG-GCM Brasil`,
          12,
          alturaPagina - 7
        );

        doc.text(
          `Página ${pagina} de ${totalPaginas}`,
          larguraPagina - 12,
          alturaPagina - 7,
          {
            align: "right",
          }
        );
      }

      const municipioArquivo =
        normalizarArquivo(
          institucionalSeguro
            .municipio_nome
        ) ||
        "municipio";

      doc.save(
        `${modulos[modulo].nomeArquivo}-${municipioArquivo}-${numero}.pdf`
      );
    } catch (error) {
      console.error(
        "Erro ao gerar PDF institucional:",
        {
          message:
            error instanceof Error
              ? error.message
              : "Erro desconhecido",
        }
      );

      alert(
        "Não foi possível gerar o PDF."
      );
    } finally {
      setGerandoPdf(
        false
      );
    }
  }

  return (
    <ProtecaoModulo modulo="relatorios">
      <main className="space-y-6 p-4 pb-24 md:p-6">
        <section className="painel-premium p-6">
          <div className="flex items-center gap-3">
            <BarChart3 className="h-10 w-10 text-cyan-400" />

            <div>
              <h1 className="text-3xl font-black text-white md:text-4xl">
                Central de Relatórios
              </h1>

              <p className="mt-1 text-slate-400">
                Relatórios institucionais isolados por município, com identificação oficial e PDF paginado.
              </p>

              {institucional ? (
                <p className="mt-2 text-sm font-bold text-cyan-300">
                  {institucional.nome_guarda} - {institucional.municipio_nome}/{institucional.estado}
                </p>
              ) : null}
            </div>
          </div>
        </section>

        <section className="painel-premium space-y-4 p-6">
          <h2 className="text-2xl font-black text-white">
            Filtros
          </h2>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            <Campo label="Módulo">
              <select
                className="input"
                value={modulo}
                onChange={(evento) => {
                  setModulo(
                    evento.target
                      .value as Modulo
                  );

                  setRegistros([]);
                  setInstitucional(
                    null
                  );
                }}
              >
                <option value="ocorrencias">
                  Ocorrências
                </option>
                <option value="patrulhamentos">
                  Patrulhamentos
                </option>
                <option value="chamados">
                  Chamados
                </option>
                <option value="viaturas">
                  Viaturas
                </option>
                <option value="guardas">
                  Guardas
                </option>
              </select>
            </Campo>

            <Campo label="Período">
              <select
                className="input"
                value={periodo}
                onChange={(evento) =>
                  definirPeriodo(
                    evento.target
                      .value
                  )
                }
              >
                <option value="diario">
                  Diário
                </option>
                <option value="semanal">
                  Semanal
                </option>
                <option value="quinzenal">
                  Quinzenal
                </option>
                <option value="mensal">
                  Mensal
                </option>
                <option value="trimestral">
                  Trimestral
                </option>
                <option value="semestral">
                  Semestral
                </option>
                <option value="anual">
                  Anual
                </option>
                <option value="personalizado">
                  Personalizado
                </option>
              </select>
            </Campo>

            <Campo label="Data inicial">
              <input
                className="input"
                type="date"
                value={dataInicio}
                onChange={(evento) =>
                  setDataInicio(
                    evento.target
                      .value
                  )
                }
              />
            </Campo>

            <Campo label="Data final">
              <input
                className="input"
                type="date"
                value={dataFim}
                onChange={(evento) =>
                  setDataFim(
                    evento.target
                      .value
                  )
                }
              />
            </Campo>

            <Campo label="Status">
              <select
                className="input"
                value={status}
                onChange={(evento) =>
                  setStatus(
                    evento.target
                      .value
                  )
                }
              >
                <option value="">
                  Todos
                </option>
                <option value="ABERTA">
                  Aberta
                </option>
                <option value="EM_ANDAMENTO">
                  Em andamento
                </option>
                <option value="FINALIZADO">
                  Finalizado
                </option>
                <option value="CANCELADO">
                  Cancelado
                </option>
              </select>
            </Campo>

            <Campo label="Tipo">
              <input
                className="input"
                value={tipo}
                onChange={(evento) =>
                  setTipo(
                    evento.target
                      .value
                  )
                }
                placeholder="Perturbação, apoio..."
              />
            </Campo>

            <Campo label="Guarda">
              <input
                className="input"
                value={guarda}
                onChange={(evento) =>
                  setGuarda(
                    evento.target
                      .value
                  )
                }
                placeholder="Nome do guarda"
              />
            </Campo>

            <Campo label="Guarnição">
              <input
                className="input"
                value={guarnicao}
                onChange={(evento) =>
                  setGuarnicao(
                    evento.target
                      .value
                  )
                }
                placeholder="Delta, Alfa..."
              />
            </Campo>

            <Campo label="Viatura">
              <input
                className="input"
                value={viatura}
                onChange={(evento) =>
                  setViatura(
                    evento.target
                      .value
                  )
                }
                placeholder="VTR-01"
              />
            </Campo>

            <Campo label="Local / Bairro">
              <input
                className="input"
                value={local}
                onChange={(evento) =>
                  setLocal(
                    evento.target
                      .value
                  )
                }
                placeholder="Centro, bairro..."
              />
            </Campo>

            <Campo label="Busca geral">
              <input
                className="input"
                value={busca}
                onChange={(evento) =>
                  setBusca(
                    evento.target
                      .value
                  )
                }
                placeholder="Busca livre"
              />
            </Campo>
          </div>

          <div className="flex flex-col gap-3 md:flex-row">
            <button
              type="button"
              onClick={
                buscarRelatorio
              }
              disabled={carregando}
              className="btn-primary flex items-center justify-center gap-2 disabled:opacity-60"
            >
              <Search className="h-5 w-5" />

              {carregando
                ? "Buscando..."
                : "Buscar"}
            </button>

            <button
              type="button"
              onClick={gerarPDF}
              disabled={
                gerandoPdf ||
                filtrados.length ===
                  0
              }
              className="btn-secondary flex items-center justify-center gap-2 disabled:opacity-60"
            >
              <FileDown className="h-5 w-5" />

              {gerandoPdf
                ? "Gerando PDF..."
                : "Gerar PDF"}
            </button>
          </div>

          {limiteAtingido ? (
            <div className="rounded-xl border border-yellow-500/30 bg-yellow-500/10 p-3 text-sm text-yellow-200">
              O relatório atingiu o limite de {LIMITE_REGISTROS} registros. Reduza o período para garantir um documento completo.
            </div>
          ) : null}
        </section>

        <section className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <Resumo
            titulo="Registros"
            valor={String(
              resumo.total
            )}
          />

          <Resumo
            titulo="Abertos"
            valor={String(
              resumo.abertos
            )}
          />

          <Resumo
            titulo="Finalizados"
            valor={String(
              resumo.finalizados
            )}
          />

          <Resumo
            titulo="Cancelados"
            valor={String(
              resumo.cancelados
            )}
          />
        </section>

        <section className="painel-premium p-6">
          <h2 className="mb-4 text-2xl font-black text-white">
            Resultado
          </h2>

          {filtrados.length ===
          0 ? (
            <p className="text-slate-400">
              Nenhum registro encontrado. Ajuste os filtros e clique em Buscar.
            </p>
          ) : (
            <div className="space-y-3">
              {filtrados.map(
                (
                  item,
                  index
                ) => (
                  <RegistroCard
                    key={
                      texto(
                        item.id,
                        String(index)
                      )
                    }
                    item={item}
                    modulo={modulo}
                  />
                )
              )}
            </div>
          )}
        </section>
      </main>
    </ProtecaoModulo>
  );
}

function RegistroCard({
  item,
  modulo,
}: {
  item: Record<
    string,
    unknown
  >;
  modulo: Modulo;
}) {
  const titulo =
    primeiroValor(
      item,
      [
        "tipo",
        "local",
        "nome",
        "titulo",
        "prefixo",
        "status",
      ]
    );

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-950/50 p-4">
      <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-sm font-bold text-cyan-400">
            {modulo.toUpperCase()} #{texto(item.id)}
          </p>

          <h3 className="mt-1 text-lg font-black text-white">
            {titulo}
          </h3>
        </div>

        <span className="rounded-xl border border-slate-700 px-3 py-1 text-xs font-bold text-slate-300">
          {texto(
            item.status,
            "Sem status"
          )}
        </span>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 text-sm md:grid-cols-3">
        <Info
          label="Data"
          valor={combinarDataHora(
            item
          )}
        />

        <Info
          label="Local"
          valor={primeiroValor(
            item,
            [
              "local",
              "endereco",
              "bairro",
            ]
          )}
        />

        <Info
          label="Guarda"
          valor={primeiroValor(
            item,
            [
              "guarda",
              "guarda_responsavel",
              "nome",
            ]
          )}
        />

        <Info
          label="Guarnição"
          valor={primeiroValor(
            item,
            [
              "guarnicao",
              "equipe",
            ]
          )}
        />

        <Info
          label="Viatura"
          valor={primeiroValor(
            item,
            [
              "viatura",
              "prefixo",
            ]
          )}
        />

        <Info
          label="Descrição"
          valor={primeiroValor(
            item,
            [
              "descricao",
              "observacao",
              "detalhes",
            ]
          )}
        />
      </div>
    </div>
  );
}

function Campo({
  label,
  children,
}: {
  label: string;
  children:
    React.ReactNode;
}) {
  return (
    <label className="space-y-2">
      <span className="text-sm font-bold text-slate-300">
        {label}
      </span>

      {children}
    </label>
  );
}

function Info({
  label,
  valor,
}: {
  label: string;
  valor: unknown;
}) {
  return (
    <div>
      <p className="text-xs text-slate-500">
        {label}
      </p>

      <p className="break-words font-semibold text-slate-200">
        {texto(valor)}
      </p>
    </div>
  );
}

function Resumo({
  titulo,
  valor,
}: {
  titulo: string;
  valor: string;
}) {
  return (
    <div className="painel-premium p-5">
      <p className="text-sm text-slate-400">
        {titulo}
      </p>

      <h2 className="mt-2 break-words text-2xl font-black text-white">
        {valor}
      </h2>
    </div>
  );
}