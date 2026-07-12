"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";
import jsPDF from "jspdf";

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
  comandante: string;
  brasao_prefeitura: string;
  brasao_gcm: string;
};

type Oficio = {
  id: number;
  municipio_id: number;
  numero: string;
  tipo?: string | null;
  destinatario: string;
  cargo_destinatario?: string | null;
  assunto: string;
  texto: string;
  responsavel?: string | null;
  status: string;
  criado_em?: string | null;
};

type RespostaApi = {
  ok?: boolean;
  erro?: string;
  oficios?: Oficio[];
  oficio?: Oficio;
  institucional?: Institucional;
  pode_gerenciar?: boolean;
};

type ImagemPdf = {
  base64: string;
  formato: "PNG" | "JPEG";
  largura: number;
  altura: number;
};

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

function texto(
  valor: unknown,
  fallback = ""
) {
  const convertido =
    String(valor ?? "").trim();

  return convertido || fallback;
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

function formatarDataHora(
  valor: unknown
) {
  const original =
    texto(valor);

  if (!original) {
    return new Date()
      .toLocaleString(
        "pt-BR"
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

  return data.toLocaleString(
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
      "Erro ao carregar imagem do ofício:",
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

export default function OficiosPage() {
  const [usuario] =
    useState<UsuarioLocal | null>(
      () =>
        lerUsuarioLocal()
    );

  const [
    editandoId,
    setEditandoId,
  ] =
    useState<number | null>(
      null
    );

  const [
    numeroEditavel,
    setNumeroEditavel,
  ] = useState("");

  const [
    destinatario,
    setDestinatario,
  ] = useState("");

  const [
    cargoDestinatario,
    setCargoDestinatario,
  ] = useState("");

  const [
    assunto,
    setAssunto,
  ] = useState("");

  const [
    conteudo,
    setConteudo,
  ] = useState("");

  const [
    oficios,
    setOficios,
  ] = useState<Oficio[]>(
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
    podeGerenciar,
    setPodeGerenciar,
  ] = useState(false);

  const [
    carregando,
    setCarregando,
  ] = useState(true);

  const [
    salvando,
    setSalvando,
  ] = useState(false);

  const [
    busca,
    setBusca,
  ] = useState("");

  const oficiosFiltrados =
    useMemo(() => {
      const termo =
        busca
          .trim()
          .toLowerCase();

      if (!termo) {
        return oficios;
      }

      return oficios.filter(
        (oficio) =>
          [
            oficio.numero,
            oficio.destinatario,
            oficio.assunto,
            oficio.status,
          ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase()
            .includes(termo)
      );
    }, [
      busca,
      oficios,
    ]);

  function urlContextual(
    caminho: string
  ) {
    return montarUrlComMunicipioContexto({
      url: caminho,
      perfil:
        usuario?.perfil,
      municipioIdUsuario:
        usuario?.municipio_id,
    });
  }

  async function chamarApi(
    caminho: string,
    opcoes?: RequestInit
  ) {
    const token =
      await obterToken();

    const resposta =
      await fetch(
        urlContextual(
          caminho
        ),
        {
          ...opcoes,
          headers: {
            Authorization:
              `Bearer ${token}`,
            "Content-Type":
              "application/json",
            ...opcoes?.headers,
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
        "Não foi possível concluir a operação."
      );
    }

    return retorno;
  }

  async function carregarOficios() {
    setCarregando(true);

    try {
      const retorno =
        await chamarApi(
          "/api/oficios"
        );

      setOficios(
        retorno.oficios ||
        []
      );

      setInstitucional(
        retorno.institucional ||
        null
      );

      setPodeGerenciar(
        Boolean(
          retorno.pode_gerenciar
        )
      );
    } catch (error) {
      console.error(
        "Erro ao carregar ofícios:",
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
          : "Erro ao carregar ofícios."
      );

      setOficios([]);
      setInstitucional(
        null
      );
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    void carregarOficios();
  }, []);

  function limparFormulario() {
    setEditandoId(null);
    setNumeroEditavel("");
    setDestinatario("");
    setCargoDestinatario("");
    setAssunto("");
    setConteudo("");
  }

  function editarOficio(
    oficio: Oficio
  ) {
    setEditandoId(
      oficio.id
    );

    setNumeroEditavel(
      oficio.numero || ""
    );

    setDestinatario(
      oficio.destinatario ||
        ""
    );

    setCargoDestinatario(
      oficio.cargo_destinatario ||
        ""
    );

    setAssunto(
      oficio.assunto || ""
    );

    setConteudo(
      oficio.texto || ""
    );

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  async function salvarOficio() {
    if (!podeGerenciar) {
      alert(
        "Seu perfil não possui permissão para gerenciar ofícios."
      );
      return;
    }

    if (
      !destinatario.trim() ||
      !assunto.trim() ||
      !conteudo.trim()
    ) {
      alert(
        "Preencha destinatário, assunto e texto."
      );
      return;
    }

    setSalvando(true);

    try {
      const retorno =
        await chamarApi(
          "/api/oficios",
          {
            method:
              editandoId
                ? "PATCH"
                : "POST",
            body: JSON.stringify({
              id:
                editandoId,
              numero:
                numeroEditavel.trim(),
              destinatario:
                destinatario.trim(),
              cargo_destinatario:
                cargoDestinatario.trim(),
              assunto:
                assunto.trim(),
              texto:
                conteudo.trim(),
            }),
          }
        );

      await registrarAuditoria({
        modulo: "OFICIOS",
        acao:
          editandoId
            ? "EDITAR"
            : "CRIAR",
        descricao:
          editandoId
            ? `Atualizou o ofício ${retorno.oficio?.numero || editandoId}.`
            : `Criou o ofício ${retorno.oficio?.numero || ""}.`,
        registro_id:
          String(
            retorno.oficio?.id ||
            editandoId ||
            ""
          ),
      });

      limparFormulario();
      await carregarOficios();

      alert(
        editandoId
          ? "Ofício atualizado com sucesso."
          : "Ofício criado com sucesso."
      );
    } catch (error) {
      console.error(
        "Erro ao salvar ofício:",
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
          : "Erro ao salvar ofício."
      );
    } finally {
      setSalvando(false);
    }
  }

  async function arquivarOficio(
    oficio: Oficio
  ) {
    if (!podeGerenciar) {
      return;
    }

    try {
      await chamarApi(
        "/api/oficios",
        {
          method: "PATCH",
          body: JSON.stringify({
            id: oficio.id,
            status:
              "ARQUIVADO",
          }),
        }
      );

      await registrarAuditoria({
        modulo: "OFICIOS",
        acao:
          "ALTERAR_STATUS",
        descricao:
          `Arquivou o ofício ${oficio.numero}.`,
        registro_id:
          String(oficio.id),
      });

      await carregarOficios();
    } catch (error) {
      alert(
        error instanceof Error
          ? error.message
          : "Erro ao arquivar ofício."
      );
    }
  }

  async function excluirOficio(
    oficio: Oficio
  ) {
    if (!podeGerenciar) {
      return;
    }

    if (
      !confirm(
        `Deseja excluir o ofício ${oficio.numero}?`
      )
    ) {
      return;
    }

    try {
      await chamarApi(
        `/api/oficios?id=${encodeURIComponent(
          String(oficio.id)
        )}`,
        {
          method: "DELETE",
        }
      );

      await registrarAuditoria({
        modulo: "OFICIOS",
        acao: "EXCLUIR",
        descricao:
          `Excluiu o ofício ${oficio.numero}.`,
        registro_id:
          String(oficio.id),
      });

      await carregarOficios();
    } catch (error) {
      alert(
        error instanceof Error
          ? error.message
          : "Erro ao excluir ofício."
      );
    }
  }

  async function gerarPDF(
    oficio: Oficio
  ) {
    if (!institucional) {
      alert(
        "As informações institucionais não foram carregadas."
      );
      return;
    }

    const institucionalSeguro: Institucional = {
      ...institucional,
    };

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
          "p",
          "mm",
          "a4"
        );

      const larguraPagina =
        doc.internal.pageSize
          .getWidth();

      const alturaPagina =
        doc.internal.pageSize
          .getHeight();

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

      function adicionarCabecalho(
        titulo = true
      ) {
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

        doc.setFontSize(13);

doc.text(
  institucionalSeguro.nome_guarda?.trim() ||
    "Guarda Civil Municipal",
  larguraPagina / 2,
          13,
          {
            align: "center",
            maxWidth: 130,
          }
        );

        doc.setFont(
          "helvetica",
          "normal"
        );

        doc.setFontSize(9.5);

        doc.text(
          `${institucionalSeguro.municipio_nome} - ${institucionalSeguro.estado}`,
          larguraPagina / 2,
          19,
          {
            align: "center",
          }
        );

        if (titulo) {
          doc.setFont(
            "helvetica",
            "bold"
          );

          doc.setFontSize(12);

          doc.text(
            `OFÍCIO Nº ${oficio.numero}`,
            larguraPagina / 2,
            28,
            {
              align: "center",
              maxWidth: 130,
            }
          );
        }

        doc.setDrawColor(
          50,
          50,
          50
        );

        doc.line(
          12,
          34,
          larguraPagina - 12,
          34
        );
      }

      adicionarCabecalho();

      doc.setFont(
        "helvetica",
        "normal"
      );

      doc.setFontSize(10);

      let y = 43;

      doc.text(
        `Data de emissão: ${formatarDataHora(oficio.criado_em)}`,
        14,
        y
      );

      y += 7;

      doc.setFont(
        "helvetica",
        "bold"
      );

      doc.text(
        "Destinatário:",
        14,
        y
      );

      doc.setFont(
        "helvetica",
        "normal"
      );

      doc.text(
        texto(
          oficio.destinatario,
          "-"
        ),
        43,
        y,
        {
          maxWidth: 150,
        }
      );

      y += 7;

      if (
        texto(
          oficio.cargo_destinatario
        )
      ) {
        doc.setFont(
          "helvetica",
          "bold"
        );

        doc.text(
          "Cargo:",
          14,
          y
        );

        doc.setFont(
          "helvetica",
          "normal"
        );

        doc.text(
          texto(
            oficio.cargo_destinatario
          ),
          29,
          y,
          {
            maxWidth: 164,
          }
        );

        y += 7;
      }

      doc.setFont(
        "helvetica",
        "bold"
      );

      doc.text(
        "Assunto:",
        14,
        y
      );

      doc.setFont(
        "helvetica",
        "normal"
      );

      const assuntoQuebrado =
        doc.splitTextToSize(
          texto(
            oficio.assunto,
            "-"
          ),
          158
        );

      doc.text(
        assuntoQuebrado,
        34,
        y
      );

      y +=
        assuntoQuebrado.length *
          5 +
        8;

      const linhas =
        doc.splitTextToSize(
          texto(
            oficio.texto,
            "-"
          ),
          181
        ) as string[];

      doc.setFontSize(11);

      for (
        const linha of linhas
      ) {
        if (y > 260) {
          doc.addPage();
          adicionarCabecalho(
            false
          );
          y = 43;
        }

        doc.text(
          linha,
          14,
          y
        );

        y += 6;
      }

      y += 10;

      if (y > 230) {
        doc.addPage();
        adicionarCabecalho(
          false
        );
        y = 55;
      }

      doc.setFontSize(10.5);

      doc.text(
        "Atenciosamente,",
        14,
        y
      );

      y += 28;

      doc.line(
        45,
        y,
        165,
        y
      );

      y += 6;

      doc.setFont(
        "helvetica",
        "bold"
      );

      doc.text(
        texto(
          oficio.responsavel,
          usuario?.nome ||
            "Responsável"
        ),
        larguraPagina / 2,
        y,
        {
          align: "center",
          maxWidth: 118,
        }
      );

      y += 5;

      doc.setFont(
        "helvetica",
        "normal"
      );

      doc.setFontSize(9);

      doc.text(
        institucionalSeguro
          .nome_guarda,
        larguraPagina / 2,
        y,
        {
          align: "center",
          maxWidth: 118,
        }
      );

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
          alturaPagina - 14,
          larguraPagina - 12,
          alturaPagina - 14
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
          `${oficio.numero} | Documento gerado pelo SIG-GCM Brasil`,
          12,
          alturaPagina - 8
        );

        doc.text(
          `Página ${pagina} de ${totalPaginas}`,
          larguraPagina - 12,
          alturaPagina - 8,
          {
            align: "right",
          }
        );
      }

      await registrarAuditoria({
        modulo: "OFICIOS",
        acao: "GERAR_PDF",
        descricao:
          `Gerou o PDF do ofício ${oficio.numero}.`,
        registro_id:
          String(oficio.id),
        detalhes: {
          municipio_id:
            institucionalSeguro
              .municipio_id,
          numero:
            oficio.numero,
        },
      });

      doc.save(
        `oficio-${normalizarArquivo(
          oficio.numero
        )}-${normalizarArquivo(
          institucionalSeguro
            .municipio_nome
        )}.pdf`
      );
    } catch (error) {
      console.error(
        "Erro ao gerar PDF do ofício:",
        {
          message:
            error instanceof Error
              ? error.message
              : "Erro desconhecido",
        }
      );

      alert(
        "Não foi possível gerar o PDF do ofício."
      );
    }
  }

  return (
    <ProtecaoModulo modulo="oficios">
      <main className="space-y-6 p-4 pb-24 md:p-6">
        <section className="painel-premium p-6">
          <h1 className="text-3xl font-black text-white">
            Ofícios
          </h1>

          <p className="mt-2 text-slate-400">
            Emissão e gestão de documentos oficiais com identidade institucional do município selecionado.
          </p>

          {institucional ? (
            <p className="mt-2 text-sm font-bold text-cyan-300">
              {institucional.nome_guarda} — {institucional.municipio_nome}/{institucional.estado}
            </p>
          ) : null}
        </section>

        {podeGerenciar ? (
          <section className="painel-premium max-w-4xl space-y-4 p-6">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-xl font-black text-white">
                {editandoId
                  ? "Editar Ofício"
                  : "Criar Ofício"}
              </h2>

              {editandoId ? (
                <button
                  type="button"
                  onClick={limparFormulario}
                  className="rounded-xl border border-slate-700 px-4 py-2 font-bold text-slate-300"
                >
                  Cancelar edição
                </button>
              ) : null}
            </div>

            <input
              className="input"
              placeholder="Número do ofício (opcional)"
              value={numeroEditavel}
              onChange={(evento) =>
                setNumeroEditavel(
                  evento.target.value
                )
              }
            />

            <input
              className="input"
              placeholder="Destinatário"
              value={destinatario}
              onChange={(evento) =>
                setDestinatario(
                  evento.target.value
                )
              }
            />

            <input
              className="input"
              placeholder="Cargo do destinatário"
              value={cargoDestinatario}
              onChange={(evento) =>
                setCargoDestinatario(
                  evento.target.value
                )
              }
            />

            <input
              className="input"
              placeholder="Assunto"
              value={assunto}
              onChange={(evento) =>
                setAssunto(
                  evento.target.value
                )
              }
            />

            <textarea
              className="input min-h-64"
              placeholder="Texto do ofício"
              value={conteudo}
              onChange={(evento) =>
                setConteudo(
                  evento.target.value
                )
              }
            />

            <button
              type="button"
              onClick={salvarOficio}
              disabled={salvando}
              className="btn-primary disabled:opacity-60"
            >
              {salvando
                ? "Salvando..."
                : editandoId
                  ? "Atualizar Ofício"
                  : "Salvar Ofício"}
            </button>
          </section>
        ) : null}

        <section className="painel-premium p-6">
          <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <h2 className="text-xl font-black text-white">
              Ofícios Emitidos
            </h2>

            <input
              className="input md:max-w-sm"
              placeholder="Buscar por número, destinatário ou assunto"
              value={busca}
              onChange={(evento) =>
                setBusca(
                  evento.target.value
                )
              }
            />
          </div>

          {carregando ? (
            <p className="text-slate-400">
              Carregando ofícios...
            </p>
          ) : oficiosFiltrados.length ===
            0 ? (
            <p className="text-slate-400">
              Nenhum ofício encontrado.
            </p>
          ) : (
            <div className="space-y-3">
              {oficiosFiltrados.map(
                (oficio) => (
                  <article
                    key={oficio.id}
                    className="rounded-2xl border border-slate-800 bg-slate-950/50 p-4"
                  >
                    <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                      <div className="min-w-0">
                        <p className="font-black text-white">
                          {oficio.numero}
                        </p>

                        <p className="mt-1 break-words text-slate-300">
                          {oficio.assunto}
                        </p>

                        <p className="mt-1 text-sm text-slate-500">
                          Para: {oficio.destinatario}
                        </p>

                        <span className="mt-2 inline-block rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-xs font-bold text-cyan-300">
                          {oficio.status}
                        </span>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            gerarPDF(
                              oficio
                            )
                          }
                          className="btn-primary"
                        >
                          Gerar PDF
                        </button>

                        {podeGerenciar ? (
                          <>
                            <button
                              type="button"
                              onClick={() =>
                                editarOficio(
                                  oficio
                                )
                              }
                              className="rounded-xl bg-blue-700 px-4 py-2 font-bold text-white"
                            >
                              Editar
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                arquivarOficio(
                                  oficio
                                )
                              }
                              className="rounded-xl bg-yellow-600 px-4 py-2 font-bold text-white"
                            >
                              Arquivar
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                excluirOficio(
                                  oficio
                                )
                              }
                              className="rounded-xl bg-red-700 px-4 py-2 font-bold text-white"
                            >
                              Excluir
                            </button>
                          </>
                        ) : null}
                      </div>
                    </div>
                  </article>
                )
              )}
            </div>
          )}
        </section>
      </main>
    </ProtecaoModulo>
  );
}