"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  FileDown,
  PackageSearch,
} from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

import ProtecaoModulo from "@/components/ProtecaoModulo";
import { registrarAuditoria } from "@/lib/auditoria";
import {
  montarUrlComMunicipioContexto,
} from "@/lib/contextoMunicipio";
import { supabase } from "@/lib/supabase";

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
  brasao_prefeitura: string;
  brasao_gcm: string;
};

type ItemEstoque = {
  chave: string;
  item: string;
  categoria: string;
  unidade: string;
  quantidade: number;
  local: string;
  observacao: string;
  ultima_entrada: string | null;
  ultima_saida: string | null;
};

type RespostaApi = {
  ok?: boolean;
  erro?: string;
  estoque?: ItemEstoque[];
  institucional?: Institucional;
};

type ImagemPdf = {
  base64: string;
  formato: "PNG" | "JPEG";
  largura: number;
  altura: number;
};

function texto(
  valor: unknown,
  fallback = ""
) {
  const convertido =
    String(valor ?? "").trim();

  return convertido || fallback;
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

function formatarData(
  valor: unknown
) {
  const original =
    texto(valor);

  if (!original) {
    return "N/I";
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

async function carregarImagemPdf(
  url: string
): Promise<ImagemPdf | null> {
  const endereco =
    texto(url);

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

    const formato:
      | "PNG"
      | "JPEG" =
      blob.type.includes("png")
        ? "PNG"
        : "JPEG";

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
                  "Falha ao ler imagem."
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
                  "Falha ao carregar imagem."
                )
              );

          imagem.src =
            base64;
        }
      );

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

function statusEstoque(
  quantidade: number
) {
  if (quantidade <= 0) {
    return "ZERADO";
  }

  if (quantidade <= 5) {
    return "BAIXO";
  }

  return "OK";
}

function nomeStatus(
  status: string
) {
  if (status === "OK") {
    return "Normal";
  }

  if (status === "BAIXO") {
    return "Estoque baixo";
  }

  return "Zerado";
}

function nomeCategoria(
  valor: string
) {
  const nomes:
    Record<string, string> = {
    MATERIAL_CONSUMO:
      "Material de consumo",
    EPI: "EPI",
    UNIFORME: "Uniforme",
    EXPEDIENTE:
      "Expediente",
    LIMPEZA: "Limpeza",
    OPERACIONAL:
      "Operacional",
    INFORMATICA:
      "Informática",
    ALIMENTACAO:
      "Alimentação",
    MANUTENCAO:
      "Manutenção",
    OUTRO: "Outro",
  };

  return nomes[valor] ||
    valor ||
    "Não informado";
}

export default function EstoqueAlmoxarifadoPage() {
  const [usuario] =
    useState<UsuarioLocal | null>(
      () =>
        lerUsuarioLocal()
    );

  const [
    estoque,
    setEstoque,
  ] = useState<ItemEstoque[]>(
    []
  );

  const [
    institucional,
    setInstitucional,
  ] =
    useState<Institucional | null>(
      null
    );

  const [
    busca,
    setBusca,
  ] = useState("");

  const [
    filtroCategoria,
    setFiltroCategoria,
  ] = useState("TODAS");

  const [
    filtroStatus,
    setFiltroStatus,
  ] = useState("TODOS");

  const [
    ordenacao,
    setOrdenacao,
  ] = useState("ITEM");

  const [
    carregando,
    setCarregando,
  ] = useState(true);

  const [
    gerandoPdf,
    setGerandoPdf,
  ] = useState(false);

  async function carregar() {
    if (
      !usuario?.perfil
    ) {
      alert(
        "Usuário não identificado."
      );

      setCarregando(false);
      return;
    }

    setCarregando(true);

    try {
      const token =
        await obterToken();

      const url =
        montarUrlComMunicipioContexto({
          url:
            "/api/almoxarifado/estoque",
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

      const retorno =
        (await resposta
          .json()
          .catch(() => ({}))) as
          RespostaApi;

      if (
        !resposta.ok ||
        !retorno.ok
      ) {
        throw new Error(
          retorno.erro ||
          "Não foi possível carregar o estoque."
        );
      }

      setEstoque(
        retorno.estoque ||
        []
      );

      setInstitucional(
        retorno.institucional ||
        null
      );

      await registrarAuditoria({
        modulo:
          "Almoxarifado",
        acao: "ACESSO",
        descricao:
          "Acessou a consulta de estoque.",
        tabela:
          "almoxarifado_entradas",
        detalhes: {
          municipio_id:
            retorno.institucional
              ?.municipio_id,
          quantidade_itens:
            retorno.estoque
              ?.length || 0,
        },
      });
    } catch (error) {
      console.error(
        "Erro ao carregar estoque:",
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
          : "Erro ao carregar estoque."
      );

      setEstoque([]);
      setInstitucional(
        null
      );
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    void carregar();
  }, []);

  const categoriasRapidas = [
    ["TODAS", "Todos"],
    [
      "MATERIAL_CONSUMO",
      "Consumo",
    ],
    ["EPI", "EPI"],
    [
      "UNIFORME",
      "Uniformes",
    ],
    [
      "EXPEDIENTE",
      "Expediente",
    ],
    ["LIMPEZA", "Limpeza"],
    [
      "OPERACIONAL",
      "Operacional",
    ],
    [
      "INFORMATICA",
      "Informática",
    ],
    [
      "ALIMENTACAO",
      "Alimentação",
    ],
    [
      "MANUTENCAO",
      "Manutenção",
    ],
  ];

  const estoqueFiltrado =
    useMemo(() => {
      const termo =
        busca
          .trim()
          .toLowerCase();

      const lista =
        estoque.filter(
          (item) => {
            const status =
              statusEstoque(
                Number(
                  item.quantidade ||
                  0
                )
              );

            const conteudo = [
              item.item,
              item.categoria,
              item.unidade,
              item.local,
              item.observacao,
            ]
              .join(" ")
              .toLowerCase();

            return (
              (
                !termo ||
                conteudo.includes(
                  termo
                )
              ) &&
              (
                filtroCategoria ===
                  "TODAS" ||
                item.categoria ===
                  filtroCategoria
              ) &&
              (
                filtroStatus ===
                  "TODOS" ||
                status ===
                  filtroStatus
              )
            );
          }
        );

      if (
        ordenacao === "ITEM"
      ) {
        lista.sort(
          (a, b) =>
            a.item.localeCompare(
              b.item,
              "pt-BR"
            )
        );
      }

      if (
        ordenacao ===
        "MENOR_QTD"
      ) {
        lista.sort(
          (a, b) =>
            a.quantidade -
            b.quantidade
        );
      }

      if (
        ordenacao ===
        "MAIOR_QTD"
      ) {
        lista.sort(
          (a, b) =>
            b.quantidade -
            a.quantidade
        );
      }

      if (
        ordenacao ===
        "ULTIMA_ENTRADA"
      ) {
        lista.sort(
          (a, b) =>
            new Date(
              b.ultima_entrada ||
              0
            ).getTime() -
            new Date(
              a.ultima_entrada ||
              0
            ).getTime()
        );
      }

      return lista;
    }, [
      estoque,
      busca,
      filtroCategoria,
      filtroStatus,
      ordenacao,
    ]);

  const resumo =
    useMemo(() => {
      return {
        itens:
          estoque.length,
        totalUnidades:
          estoque.reduce(
            (
              acumulado,
              item
            ) =>
              acumulado +
              Number(
                item.quantidade ||
                0
              ),
            0
          ),
        baixo:
          estoque.filter(
            (item) =>
              item.quantidade >
                0 &&
              item.quantidade <=
                5
          ).length,
        zerado:
          estoque.filter(
            (item) =>
              item.quantidade <=
              0
          ).length,
      };
    }, [estoque]);

  function filtrosPdf() {
    const filtros = [
      busca
        ? `Busca: ${busca}`
        : "",
      filtroCategoria !==
      "TODAS"
        ? `Categoria: ${nomeCategoria(
            filtroCategoria
          )}`
        : "",
      filtroStatus !==
      "TODOS"
        ? `Status: ${nomeStatus(
            filtroStatus
          )}`
        : "",
      `Ordenação: ${ordenacao}`,
    ].filter(Boolean);

    return filtros.join(
      " | "
    );
  }

  async function exportarPDF() {
    
    if (
      !institucional
    ) {
      alert(
        "As informações institucionais não foram carregadas."
      );
      return;
    }

    const institucionalSeguro = institucional;

    if (
      estoqueFiltrado.length ===
      0
    ) {
      alert(
        "Nenhum item para exportar."
      );
      return;
    }

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
        `EST-${agora
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
            170,
            170,
            170
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

          doc.setFontSize(6.5);

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
              align:
                "center",
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
          institucionalSeguro.nome_guarda?.trim() ||
            "GUARDA CIVIL MUNICIPAL",
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
          "RELATÓRIO DE ESTOQUE DO ALMOXARIFADO",
          larguraPagina / 2,
          26,
          {
            align: "center",
          }
        );

        doc.setDrawColor(
          15,
          23,
          42
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
        `Emitido em: ${agora.toLocaleString("pt-BR")}`,
        12,
        46
      );

      doc.text(
        `Emitido por: ${texto(usuario?.nome, "Usuário")}`,
        150,
        40
      );

      doc.text(
        `Itens exportados: ${estoqueFiltrado.length}`,
        150,
        46
      );

      const filtros =
        doc.splitTextToSize(
          `Filtros: ${filtrosPdf()}`,
          larguraPagina - 24
        );

      doc.text(
        filtros,
        12,
        53
      );

      const inicioTabela =
        53 +
        filtros.length * 4 +
        3;

      autoTable(doc, {
        startY:
          inicioTabela,
        head: [[
          "Item",
          "Categoria",
          "Quantidade",
          "Unidade",
          "Status",
          "Local",
          "Última entrada",
          "Última saída",
        ]],
        body:
          estoqueFiltrado.map(
            (item) => [
              item.item,
              nomeCategoria(
                item.categoria
              ),
              String(
                item.quantidade
              ),
              item.unidade ||
                "-",
              nomeStatus(
                statusEstoque(
                  item.quantidade
                )
              ),
              item.local ||
                "-",
              formatarData(
                item.ultima_entrada
              ),
              formatarData(
                item.ultima_saida
              ),
            ]
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
              dados.pageNumber >
              1
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

      await registrarAuditoria({
        modulo:
          "Almoxarifado",
        acao: "EXPORTAR",
        descricao:
          "Exportou o relatório institucional de estoque em PDF.",
        tabela:
          "almoxarifado_entradas",
        detalhes: {
          municipio_id:
            institucionalSeguro
              .municipio_id,
          quantidade_itens:
            estoqueFiltrado.length,
          filtros:
            filtrosPdf(),
          numero_relatorio:
            numero,
        },
      });

      doc.save(
        `estoque-almoxarifado-${normalizarArquivo(
          institucionalSeguro
            .municipio_nome
        )}-${numero}.pdf`
      );
    } catch (error) {
      console.error(
        "Erro ao gerar PDF do estoque:",
        {
          message:
            error instanceof Error
              ? error.message
              : "Erro desconhecido",
        }
      );

      alert(
        "Não foi possível gerar o PDF do estoque."
      );
    } finally {
      setGerandoPdf(false);
    }
  }

  return (
    <ProtecaoModulo modulo="patrimonio">
      <main className="space-y-6 p-4 pb-24 md:p-6">
        <section className="painel-premium p-6">
          <div className="flex items-center gap-3">
            <PackageSearch className="h-10 w-10 text-cyan-400" />

            <div>
              <h1 className="text-2xl font-black text-white md:text-3xl">
                Estoque do Almoxarifado
              </h1>

              <p className="mt-2 text-slate-400">
                Consulta dos materiais disponíveis, entradas, saídas e alertas de reposição.
              </p>

              {institucional ? (
                <p className="mt-2 text-sm font-bold text-cyan-300">
                  {institucional.nome_guarda} — {institucional.municipio_nome}/{institucional.estado}
                </p>
              ) : null}
            </div>
          </div>
        </section>

        <section className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <Card
            titulo="Itens"
            valor={String(
              resumo.itens
            )}
          />

          <Card
            titulo="Qtd. Total"
            valor={String(
              resumo.totalUnidades
            )}
          />

          <Card
            titulo="Estoque Baixo"
            valor={String(
              resumo.baixo
            )}
          />

          <Card
            titulo="Zerados"
            valor={String(
              resumo.zerado
            )}
          />
        </section>

        <section className="painel-premium space-y-4 p-6">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <h2 className="text-xl font-black text-white">
              Filtros rápidos
            </h2>

            <button
              type="button"
              onClick={exportarPDF}
              disabled={
                gerandoPdf ||
                carregando ||
                estoqueFiltrado.length ===
                  0
              }
              className="btn-primary flex items-center justify-center gap-2 disabled:opacity-60"
            >
              <FileDown className="h-5 w-5" />

              {gerandoPdf
                ? "Gerando PDF..."
                : "Exportar PDF"}
            </button>
          </div>

          <input
            className="input"
            placeholder="Buscar por item, categoria, unidade, local ou observação..."
            value={busca}
            onChange={(evento) =>
              setBusca(
                evento.target.value
              )
            }
          />

          <div className="flex flex-wrap gap-2">
            {categoriasRapidas.map(
              ([id, nome]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() =>
                    setFiltroCategoria(
                      id
                    )
                  }
                  className={`rounded-xl border px-3 py-2 text-sm font-bold ${
                    filtroCategoria ===
                    id
                      ? "border-cyan-400 bg-cyan-500/20 text-cyan-200"
                      : "border-slate-700 bg-slate-900 text-slate-300"
                  }`}
                >
                  {nome}
                </button>
              )
            )}
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-2">
              <span className="label">
                Status
              </span>

              <select
                className="input"
                value={filtroStatus}
                onChange={(evento) =>
                  setFiltroStatus(
                    evento.target.value
                  )
                }
              >
                <option value="TODOS">
                  Todos
                </option>
                <option value="OK">
                  Normal
                </option>
                <option value="BAIXO">
                  Estoque baixo
                </option>
                <option value="ZERADO">
                  Zerado
                </option>
              </select>
            </label>

            <label className="space-y-2">
              <span className="label">
                Ordenar
              </span>

              <select
                className="input"
                value={ordenacao}
                onChange={(evento) =>
                  setOrdenacao(
                    evento.target.value
                  )
                }
              >
                <option value="ITEM">
                  Nome do item
                </option>
                <option value="MENOR_QTD">
                  Menor quantidade
                </option>
                <option value="MAIOR_QTD">
                  Maior quantidade
                </option>
                <option value="ULTIMA_ENTRADA">
                  Última entrada
                </option>
              </select>
            </label>
          </div>
        </section>

        {carregando ? (
          <section className="painel-premium p-6 text-slate-400">
            Carregando estoque...
          </section>
        ) : estoqueFiltrado.length ===
          0 ? (
          <section className="painel-premium p-10 text-center">
            <p className="mb-3 text-6xl">
              📦
            </p>

            <h2 className="text-xl font-black text-white">
              Nenhum item encontrado
            </h2>

            <p className="mt-2 text-sm text-slate-400">
              Registre uma entrada ou altere os filtros.
            </p>
          </section>
        ) : (
          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {estoqueFiltrado.map(
              (item) => {
                const status =
                  statusEstoque(
                    item.quantidade
                  );

                return (
                  <article
                    key={
                      item.chave
                    }
                    className="rounded-3xl border border-slate-800 bg-slate-950/70 p-5 shadow-xl"
                  >
                    <div className="flex justify-between gap-3">
                      <div>
                        <p className="text-sm text-slate-400">
                          {nomeCategoria(
                            item.categoria
                          )}
                        </p>

                        <h3 className="text-xl font-black text-white">
                          📦 {item.item}
                        </h3>

                        <p className="text-sm text-slate-500">
                          Local: {item.local || "N/I"}
                        </p>
                      </div>

                      <Status
                        status={status}
                      />
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-3">
                      <Info
                        titulo="Quantidade"
                        valor={`${item.quantidade} ${item.unidade}`}
                      />

                      <Info
                        titulo="Status"
                        valor={nomeStatus(
                          status
                        )}
                      />

                      <Info
                        titulo="Última entrada"
                        valor={formatarData(
                          item.ultima_entrada
                        )}
                      />

                      <Info
                        titulo="Última saída"
                        valor={formatarData(
                          item.ultima_saida
                        )}
                      />
                    </div>

                    {item.quantidade <=
                    5 ? (
                      <div className="mt-4 rounded-2xl border border-yellow-800 bg-yellow-950/40 p-3">
                        <p className="text-sm font-bold text-yellow-300">
                          ⚠️ Atenção: estoque baixo ou zerado.
                        </p>
                      </div>
                    ) : null}

                    {item.observacao ? (
                      <p className="mt-4 whitespace-pre-wrap text-sm text-slate-300">
                        {item.observacao}
                      </p>
                    ) : null}
                  </article>
                );
              }
            )}
          </section>
        )}
      </main>
    </ProtecaoModulo>
  );
}

function Card({
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

      <h2 className="text-2xl font-black text-white md:text-3xl">
        {valor}
      </h2>
    </div>
  );
}

function Info({
  titulo,
  valor,
}: {
  titulo: string;
  valor: string;
}) {
  return (
    <div className="rounded-xl bg-slate-900/70 p-3">
      <p className="text-xs text-slate-500">
        {titulo}
      </p>

      <p className="text-sm font-bold text-slate-200">
        {valor}
      </p>
    </div>
  );
}

function Status({
  status,
}: {
  status: string;
}) {
  const classe =
    status === "OK"
      ? "border-green-500/30 bg-green-500/10 text-green-300"
      : status === "BAIXO"
        ? "border-yellow-500/30 bg-yellow-500/10 text-yellow-300"
        : "border-red-500/30 bg-red-500/10 text-red-300";

  return (
    <span
      className={`h-fit rounded-full border px-3 py-1 text-xs font-black ${classe}`}
    >
      {nomeStatus(status)}
    </span>
  );
}