"use client";

import Image from "next/image";
import Link from "next/link";
import jsPDF from "jspdf";
import QRCode from "qrcode";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

import { supabase } from "@/lib/supabase";
import { registrarAuditoria } from "@/lib/auditoria";
import ProtecaoModulo from "@/components/ProtecaoModulo";

type UsuarioLogado = {
  id: string;
  nome?: string;
  perfil: string;
  municipio_id: number;
};

type Envolvido = {
  nome: string;
  documento: string;
  telefone: string;
  endereco: string;
  tipo: string;
  observacao: string;
};

type Ocorrencia = {
  id: number;
  protocolo: string | null;
  tipo: string | null;
  status: string | null;
  data: string | null;
  hora: string | null;
  bairro: string | null;
  local: string | null;
  numero: string | null;
  envolvidos: unknown;
  veiculos_envolvidos: unknown;
  armas_objetos: unknown;
  descricao: string | null;
  foto_url: string | null;
  fotos_urls: unknown;
  latitude: string | null;
  longitude: string | null;
  viatura_empenhada: string | null;
  equipe_empenhada: string | null;
  criado_em: string | null;
  municipio_id: number | null;
  guarnicao_id: number | null;
  viatura_id: number | null;
  guarda_responsavel_id: number | null;
};

type Municipio = {
  id: number;
  nome: string;
  estado: string | null;
  brasao: string | null;
  brasao_prefeitura: string | null;
  brasao_gcm: string | null;
  nome_guarda: string | null;
  nome_corporacao: string | null;
  sigla_corporacao: string | null;
};

type Guarnicao = {
  id: number;
  nome: string;
};

type Viatura = {
  id: number;
  prefixo: string;
};

type Guarda = {
  id: number;
  nome: string;
};

type ContextoDetalhe = {
  usuario_id: number;
  usuario_nome: string | null;
  perfil: string;
  municipio_id: number;
  pode_gerar_pdf: boolean;
};

type RespostaDetalheApi = {
  ok?: boolean;
  erro?: string;
  contexto?: ContextoDetalhe;
  ocorrencia?: Ocorrencia;
  municipios?: Municipio[];
  guarnicoes?: Guarnicao[];
  viaturas?: Viatura[];
  guardas?: Guarda[];
};

const ROTAS_RESERVADAS = [
  "nova",
  "expressa",
  "offline",
  "editar",
];

export default function VisualizarOcorrencia() {
  const params = useParams();
  const router = useRouter();

  const idParam =
    typeof params.id === "string"
      ? params.id
      : params.id?.[0];

  const id = Number(idParam);

  const [usuario, setUsuario] =
    useState<UsuarioLogado | null>(null);
  const [ocorrencia, setOcorrencia] =
    useState<Ocorrencia | null>(null);
  const [carregando, setCarregando] =
    useState(true);
  const [erroTela, setErroTela] =
    useState("");
  const [podeGerarPDF, setPodeGerarPDF] =
    useState(false);

  const [municipios, setMunicipios] =
    useState<Municipio[]>([]);
  const [guarnicoes, setGuarnicoes] =
    useState<Guarnicao[]>([]);
  const [viaturas, setViaturas] =
    useState<Viatura[]>([]);
  const [guardas, setGuardas] =
    useState<Guarda[]>([]);

  useEffect(() => {
    void carregarOcorrencia();
  }, [idParam]);

  async function obterAccessToken() {
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession();

    if (error || !session?.access_token) {
      throw new Error(
        "Sua sessão expirou. Entre novamente no sistema."
      );
    }

    return session.access_token;
  }

  async function carregarOcorrencia() {
    setCarregando(true);
    setErroTela("");

    if (
      !idParam ||
      ROTAS_RESERVADAS.includes(idParam) ||
      !Number.isSafeInteger(id) ||
      id <= 0
    ) {
      setCarregando(false);
      router.replace("/sistema/ocorrencias");
      return;
    }

    try {
      const accessToken =
        await obterAccessToken();

      const resposta = await fetch(
        `/api/ocorrencias/${id}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
          cache: "no-store",
        }
      );

      const dados = (await resposta
        .json()
        .catch(
          () => null
        )) as RespostaDetalheApi | null;

      if (!resposta.ok || !dados?.ok) {
        if (resposta.status === 401) {
          localStorage.removeItem(
            "usuarioLogado"
          );
          router.replace("/login");
          return;
        }

        throw new Error(
          dados?.erro ||
            "Não foi possível carregar a ocorrência."
        );
      }

      if (
        !dados.contexto ||
        !dados.ocorrencia
      ) {
        throw new Error(
          "Resposta inválida ao carregar a ocorrência."
        );
      }

      setUsuario({
        id: String(
          dados.contexto.usuario_id
        ),
        nome:
          dados.contexto.usuario_nome ||
          undefined,
        perfil: dados.contexto.perfil,
        municipio_id:
          dados.contexto.municipio_id,
      });

      setPodeGerarPDF(
        Boolean(
          dados.contexto.pode_gerar_pdf
        )
      );
      setOcorrencia(dados.ocorrencia);
      setMunicipios(dados.municipios || []);
      setGuarnicoes(dados.guarnicoes || []);
      setViaturas(dados.viaturas || []);
      setGuardas(dados.guardas || []);
    } catch (error) {
      const mensagem =
        error instanceof Error
          ? error.message
          : "Erro ao carregar ocorrência.";

      console.error(
        "Erro ao carregar ocorrência:",
        {
          mensagem,
          error,
        }
      );

      setErroTela(mensagem);
      setOcorrencia(null);
    } finally {
      setCarregando(false);
    }
  }

  function converterLista<T>(
    valor: unknown
  ): T[] {
    if (Array.isArray(valor)) {
      return valor as T[];
    }

    if (typeof valor !== "string") {
      return [];
    }

    try {
      const dados = JSON.parse(valor);

      return Array.isArray(dados)
        ? (dados as T[])
        : [];
    } catch {
      return [];
    }
  }

  function obterEnvolvidos(): Envolvido[] {
    return converterLista<Envolvido>(
      ocorrencia?.envolvidos
    );
  }

  function obterVeiculosEnvolvidos(): Record<
    string,
    unknown
  >[] {
    return converterLista<
      Record<string, unknown>
    >(ocorrencia?.veiculos_envolvidos);
  }

  function obterObjetosEnvolvidos(): Record<
    string,
    unknown
  >[] {
    return converterLista<
      Record<string, unknown>
    >(ocorrencia?.armas_objetos);
  }

  function obterFotos(): string[] {
    if (!ocorrencia) {
      return [];
    }

    const fotos =
      converterLista<unknown>(
        ocorrencia.fotos_urls
      ).filter(
        (item): item is string =>
          typeof item === "string" &&
          Boolean(item)
      );

    if (
      ocorrencia.foto_url &&
      !fotos.includes(
        ocorrencia.foto_url
      )
    ) {
      fotos.unshift(ocorrencia.foto_url);
    }

    return fotos;
  }

  function municipioDaOcorrencia() {
    if (!ocorrencia?.municipio_id) {
      return null;
    }

    return (
      municipios.find(
        (municipio) =>
          municipio.id ===
          ocorrencia.municipio_id
      ) || null
    );
  }

  function nomeMunicipio(
    municipioId: number | null
  ) {
    if (!municipioId) {
      return "-";
    }

    const municipio = municipios.find(
      (item) => item.id === municipioId
    );

    if (!municipio) {
      return "-";
    }

    return municipio.estado
      ? `${municipio.nome} - ${municipio.estado}`
      : municipio.nome;
  }

  function nomeGuarnicao(
    guarnicaoId: number | null
  ) {
    if (!guarnicaoId) {
      return "-";
    }

    return (
      guarnicoes.find(
        (item) =>
          item.id === guarnicaoId
      )?.nome || "-"
    );
  }

  function prefixoViatura(
    viaturaId: number | null
  ) {
    if (!viaturaId) {
      return "-";
    }

    return (
      viaturas.find(
        (item) => item.id === viaturaId
      )?.prefixo || "-"
    );
  }

  function nomeGuarda(
    guardaId: number | null
  ) {
    if (!guardaId) {
      return "-";
    }

    return (
      guardas.find(
        (item) => item.id === guardaId
      )?.nome || "-"
    );
  }

  async function auditarFoto(
    index: number
  ) {
    if (!ocorrencia) {
      return;
    }

    await registrarAuditoria({
      modulo: "OCORRENCIAS",
      acao: "VISUALIZAR_FOTO",
      descricao: `Visualizou a foto ${
        index + 1
      } da ocorrência ${
        ocorrencia.protocolo ||
        ocorrencia.id
      }.`,
      registro_id: String(
        ocorrencia.id
      ),
    });
  }

  function adicionarRodapeInstitucional(
    pdf: jsPDF
  ) {
    const totalPaginas =
      pdf.getNumberOfPages();

    for (
      let pagina = 1;
      pagina <= totalPaginas;
      pagina++
    ) {
      pdf.setPage(pagina);

      pdf.setDrawColor(210, 215, 225);
      pdf.line(15, 284, 195, 284);

      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(7.5);
      pdf.setTextColor(125, 135, 150);

      pdf.text(
        "Documento gerado eletronicamente pelo SIG-GCM Brasil",
        15,
        290
      );

      pdf.text(
        `Página ${pagina} de ${totalPaginas}`,
        195,
        290,
        {
          align: "right",
        }
      );

      pdf.setTextColor(0, 0, 0);
    }
  }

  function formatoImagem(
    imagemBase64: string
  ): "PNG" | "JPEG" {
    return imagemBase64.startsWith(
      "data:image/jpeg"
    ) ||
      imagemBase64.startsWith(
        "data:image/jpg"
      )
      ? "JPEG"
      : "PNG";
  }

  async function obterUrlValidacaoPDF() {
    if (!ocorrencia) {
      throw new Error("Ocorrência não carregada.");
    }

    const accessToken = await obterAccessToken();
    const resposta = await fetch(
      `/api/ocorrencias/${ocorrencia.id}/validacao`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        cache: "no-store",
      }
    );

    const dados = (await resposta.json()) as {
      ok?: boolean;
      url?: string;
      erro?: string;
    };

    if (!resposta.ok || !dados.ok || !dados.url) {
      throw new Error(
        dados.erro || "Não foi possível gerar a validação do documento."
      );
    }

    return dados.url;
  }

  async function gerarPDF() {
    if (
      !ocorrencia ||
      !usuario ||
      !podeGerarPDF
    ) {
      alert(
        "Você não possui permissão para gerar o PDF."
      );
      return;
    }

    const pdf = new jsPDF();

    const envolvidos = obterEnvolvidos();
    const veiculosEnvolvidos =
      obterVeiculosEnvolvidos();
    const objetosEnvolvidos =
      obterObjetosEnvolvidos();
    const fotos = obterFotos();

    let brasaoPrefeituraBase64 = "";
    let brasaoGcmBase64 = "";
    let qrCodeBase64 = "";

    const municipioAtual =
      municipioDaOcorrencia();

    const urlBrasaoPrefeitura =
      municipioAtual?.brasao_prefeitura ||
      municipioAtual?.brasao ||
      "";

    const urlBrasaoGcm =
      municipioAtual?.brasao_gcm ||
      "";

    if (urlBrasaoPrefeitura) {
      try {
        brasaoPrefeituraBase64 =
          await carregarImagemBase64(
            urlBrasaoPrefeitura
          );
      } catch (error) {
        console.warn(
          "Não foi possível carregar o brasão da Prefeitura.",
          error
        );
      }
    }

    if (urlBrasaoGcm) {
      try {
        brasaoGcmBase64 =
          await carregarImagemBase64(
            urlBrasaoGcm
          );
      } catch (error) {
        console.warn(
          "Não foi possível carregar o emblema da Guarda Municipal.",
          error
        );
      }
    }

    try {
      const urlValidacao =
        await obterUrlValidacaoPDF();

      qrCodeBase64 =
        await QRCode.toDataURL(
          urlValidacao,
          {
            errorCorrectionLevel: "H",
            margin: 1,
            width: 320,
          }
        );
    } catch (error) {
      console.warn(
        "Não foi possível gerar QR Code verificável.",
        error
      );
    }

    if (brasaoPrefeituraBase64) {
      pdf.addImage(
        brasaoPrefeituraBase64,
        formatoImagem(
          brasaoPrefeituraBase64
        ),
        12,
        8,
        25,
        25
      );
    }

    if (brasaoGcmBase64) {
      pdf.addImage(
        brasaoGcmBase64,
        formatoImagem(
          brasaoGcmBase64
        ),
        173,
        8,
        25,
        25
      );
    }

    pdf.setFontSize(14);
    pdf.text(
      municipioAtual?.nome ||
        "PREFEITURA MUNICIPAL",
      105,
      18,
      {
        align: "center",
      }
    );

    pdf.setFontSize(12);
    pdf.text(
      municipioAtual?.nome_guarda ||
        municipioAtual?.nome_corporacao ||
        "GUARDA CIVIL MUNICIPAL",
      105,
      27,
      {
        align: "center",
      }
    );

    pdf.setFontSize(11);
    pdf.text(
      "RELATÓRIO DE OCORRÊNCIA",
      105,
      35,
      {
        align: "center",
      }
    );

    pdf.line(15, 42, 195, 42);

    if (qrCodeBase64) {
      pdf.addImage(
        qrCodeBase64,
        "PNG",
        171,
        45,
        23,
        23
      );
      pdf.setFontSize(6.5);
      pdf.setTextColor(70, 80, 95);
      pdf.text(
        "Escaneie para validar",
        182.5,
        71,
        { align: "center" }
      );
      pdf.setTextColor(0, 0, 0);
    }

    let y = qrCodeBase64 ? 72 : 55;

    function novaPaginaSePrecisar(
      limite = 250
    ) {
      if (y > limite) {
        pdf.addPage();
        y = 20;
      }
    }

    function linha(
      label: string,
      valor: unknown
    ) {
      if (
        valor === null ||
        valor === undefined ||
        valor === ""
      ) {
        return;
      }

      novaPaginaSePrecisar();
      pdf.setFontSize(11);

      const texto =
        pdf.splitTextToSize(
          `${label}: ${String(valor)}`,
          175
        );

      pdf.text(texto, 15, y);
      y += texto.length * 7;
    }

    linha(
      "Protocolo",
      ocorrencia.protocolo
    );
    linha("Tipo", ocorrencia.tipo);
    linha("Status", ocorrencia.status);
    linha(
      "Data/Hora",
      `${ocorrencia.data || "-"} às ${
        ocorrencia.hora || "-"
      }`
    );
    linha(
      "Bairro",
      ocorrencia.bairro || "-"
    );
    linha(
      "Local",
      ocorrencia.local || "-"
    );
    linha(
      "Número",
      ocorrencia.numero || "S/N"
    );
    linha(
      "Município",
      nomeMunicipio(
        ocorrencia.municipio_id
      )
    );
    linha(
      "Guarnição",
      nomeGuarnicao(
        ocorrencia.guarnicao_id
      )
    );
    linha(
      "Viatura",
      prefixoViatura(
        ocorrencia.viatura_id
      )
    );
    linha(
      "Responsável",
      nomeGuarda(
        ocorrencia.guarda_responsavel_id
      )
    );

    if (
      ocorrencia.latitude &&
      ocorrencia.longitude
    ) {
      linha(
        "Latitude",
        ocorrencia.latitude
      );
      linha(
        "Longitude",
        ocorrencia.longitude
      );
    }

    y += 8;

    pdf.setFontSize(14);
    pdf.text(
      "EQUIPE EMPENHADA",
      15,
      y
    );
    y += 8;

    const equipe =
      pdf.splitTextToSize(
        ocorrencia.equipe_empenhada ||
          "Equipe não informada.",
        170
      );

    pdf.setFontSize(11);
    pdf.text(equipe, 15, y);
    y += equipe.length * 7 + 10;

    novaPaginaSePrecisar(220);
    pdf.setFontSize(14);
    pdf.text(
      "DESCRIÇÃO DOS FATOS",
      15,
      y
    );
    y += 8;

    const descricao =
      pdf.splitTextToSize(
        ocorrencia.descricao || "-",
        170
      );

    pdf.setFontSize(11);
    pdf.text(descricao, 15, y);
    y += descricao.length * 7 + 10;

    if (envolvidos.length > 0) {
      novaPaginaSePrecisar(220);
      pdf.setFontSize(14);
      pdf.text("ENVOLVIDOS", 15, y);
      y += 10;

      envolvidos.forEach(
        (pessoa, index) => {
          novaPaginaSePrecisar(230);
          linha(
            `${index + 1}. Nome`,
            pessoa.nome || "Sem nome"
          );
          linha("Tipo", pessoa.tipo);
          linha(
            "Documento",
            pessoa.documento
          );
          linha(
            "Telefone",
            pessoa.telefone
          );
          linha(
            "Endereço",
            pessoa.endereco
          );
          linha(
            "Observação",
            pessoa.observacao
          );
          y += 5;
        }
      );
    }

    if (
      veiculosEnvolvidos.length > 0
    ) {
      novaPaginaSePrecisar(220);
      pdf.setFontSize(14);
      pdf.text(
        "VEÍCULOS ENVOLVIDOS",
        15,
        y
      );
      y += 10;

      veiculosEnvolvidos.forEach(
        (veiculo, index) => {
          novaPaginaSePrecisar(230);
          linha(
            `${index + 1}. Veículo`,
            " "
          );
          linha("Placa", veiculo.placa);
          linha(
            "Tipo/Espécie",
            veiculo.tipo_especie
          );
          linha("Marca", veiculo.marca);
          linha("Modelo", veiculo.modelo);
          linha("Ano", veiculo.ano);
          linha("Cor", veiculo.cor);
          linha(
            "Renavam",
            veiculo.renavam
          );
          linha("Chassi", veiculo.chassi);
          linha(
            "Condutor",
            veiculo.condutor
          );
          linha(
            "Documento Condutor",
            veiculo.documento_condutor
          );
          linha(
            "Proprietário",
            veiculo.proprietario
          );
          linha(
            "CPF Proprietário",
            veiculo.cpf_proprietario
          );
          linha(
            "Telefone Proprietário",
            veiculo.telefone_proprietario
          );
          linha(
            "Situação",
            veiculo.situacao
          );
          linha(
            "Consulta",
            veiculo.situacao_consulta
          );
          linha(
            "Observação",
            veiculo.observacao
          );
          y += 5;
        }
      );
    }

    if (
      objetosEnvolvidos.length > 0
    ) {
      novaPaginaSePrecisar(220);
      pdf.setFontSize(14);
      pdf.text(
        "OBJETOS ENVOLVIDOS",
        15,
        y
      );
      y += 10;

      objetosEnvolvidos.forEach(
        (item, index) => {
          novaPaginaSePrecisar(230);
          linha(
            `${index + 1}. Item`,
            " "
          );
          linha(
            "Categoria",
            item.categoria
          );
          linha(
            "Descrição",
            item.descricao
          );
          linha("Marca", item.marca);
          linha("Modelo", item.modelo);
          linha(
            "Calibre",
            item.calibre
          );
          linha(
            "Numeração",
            item.numeracao
          );
          linha(
            "Quantidade",
            item.quantidade
          );
          linha(
            "Peso",
            item.peso
              ? `${String(
                  item.peso
                )} ${String(
                  item.unidade_peso || ""
                )}`
              : ""
          );
          linha(
            "Valor Estimado",
            item.valor_estimado
          );
          linha(
            "Procedência",
            item.procedencia
          );
          linha(
            "Situação",
            item.situacao
          );
          linha(
            "Observação",
            item.observacao
          );
          y += 5;
        }
      );
    }

    novaPaginaSePrecisar(230);
    pdf.line(15, 265, 90, 265);
    pdf.text(
      "Guarda Responsável",
      15,
      273
    );

    pdf.line(110, 265, 190, 265);
    pdf.text("Comandante", 110, 273);

    if (fotos.length > 0) {
      for (
        let index = 0;
        index < fotos.length;
        index++
      ) {
        try {
          const imagemBase64 =
            await carregarImagemBase64(
              fotos[index]
            );

          pdf.addPage();

          if (brasaoPrefeituraBase64) {
            pdf.addImage(
              brasaoPrefeituraBase64,
              formatoImagem(
                brasaoPrefeituraBase64
              ),
              12,
              8,
              22,
              22
            );
          }

          if (brasaoGcmBase64) {
            pdf.addImage(
              brasaoGcmBase64,
              formatoImagem(
                brasaoGcmBase64
              ),
              176,
              8,
              22,
              22
            );
          }

          pdf.setFontSize(16);
          pdf.text(
            `ANEXO FOTOGRÁFICO ${
              index + 1
            }`,
            105,
            22,
            {
              align: "center",
            }
          );

          pdf.line(15, 35, 195, 35);
          pdf.addImage(
            imagemBase64,
            "JPEG",
            15,
            45,
            180,
            120
          );
        } catch {
          console.warn(
            "Erro ao adicionar foto no PDF."
          );
        }
      }
    }

    adicionarRodapeInstitucional(pdf);

    await registrarAuditoria({
      modulo: "OCORRENCIAS",
      acao: "GERAR_PDF",
      descricao: `Gerou PDF da ocorrência ${
        ocorrencia.protocolo ||
        ocorrencia.id
      }.`,
      registro_id: String(
        ocorrencia.id
      ),
    });

    pdf.save(
      `RELATORIO-${
        ocorrencia.protocolo ||
        ocorrencia.id
      }.pdf`
    );
  }

  async function carregarImagemBase64(
    url: string
  ): Promise<string> {
    const resposta = await fetch(url);

    if (!resposta.ok) {
      throw new Error(
        "Não foi possível carregar a imagem."
      );
    }

    const blob = await resposta.blob();

    return new Promise(
      (resolve, reject) => {
        const leitor = new FileReader();

        leitor.onloadend = () =>
          resolve(
            leitor.result as string
          );
        leitor.onerror = reject;
        leitor.readAsDataURL(blob);
      }
    );
  }

  if (carregando) {
    return (
      <ProtecaoModulo modulo="ocorrencias">
        <div className="p-6 text-slate-400">
          Carregando ocorrência...
        </div>
      </ProtecaoModulo>
    );
  }

  if (!ocorrencia) {
    return (
      <ProtecaoModulo modulo="ocorrencias">
        <div className="p-6">
          <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-5 text-red-200">
            {erroTela ||
              "Ocorrência não encontrada."}
          </div>

          <Link
            href="/sistema/ocorrencias"
            className="mt-4 inline-flex rounded-xl bg-slate-700 px-5 py-3 font-semibold hover:bg-slate-600"
          >
            Voltar para ocorrências
          </Link>
        </div>
      </ProtecaoModulo>
    );
  }

  const envolvidos =
    obterEnvolvidos();
  const veiculosEnvolvidos =
    obterVeiculosEnvolvidos();
  const objetosEnvolvidos =
    obterObjetosEnvolvidos();
  const fotos = obterFotos();

  return (
    <ProtecaoModulo modulo="ocorrencias">
      <div className="p-3 md:p-6 pb-24">
        <header className="flex flex-col md:flex-row gap-4 justify-between md:items-center border-b border-slate-800 pb-5 mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">
              Ocorrência{" "}
              {ocorrencia.protocolo ||
                ocorrencia.id}
            </h1>

            <p className="text-slate-400">
              Detalhes completos da
              ocorrência registrada.
            </p>
          </div>

          <div className="flex flex-col md:flex-row gap-3">
            {podeGerarPDF && (
              <button
                type="button"
                onClick={gerarPDF}
                className="bg-green-700 hover:bg-green-800 px-5 py-3 rounded-xl font-semibold"
              >
                Gerar PDF
              </button>
            )}

            <Link
              href="/sistema/ocorrencias"
              className="bg-slate-700 hover:bg-slate-600 px-5 py-3 rounded-xl font-semibold text-center"
            >
              Voltar
            </Link>
          </div>
        </header>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <ResumoCard
            titulo="Protocolo"
            valor={
              ocorrencia.protocolo
            }
          />
          <ResumoCard
            titulo="Status"
            valor={ocorrencia.status}
          />
          <ResumoCard
            titulo="Data"
            valor={ocorrencia.data}
          />
          <ResumoCard
            titulo="Local"
            valor={ocorrencia.local}
          />
        </div>

        <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="card rounded-2xl shadow-lg space-y-4">
            <h2 className="text-xl font-bold">
              Dados principais
            </h2>
            <Linha
              nome="Protocolo"
              valor={
                ocorrencia.protocolo
              }
            />
            <Linha
              nome="Tipo"
              valor={ocorrencia.tipo}
            />
            <Linha
              nome="Status"
              valor={ocorrencia.status}
            />
            <Linha
              nome="Data"
              valor={ocorrencia.data}
            />
            <Linha
              nome="Hora"
              valor={ocorrencia.hora}
            />
          </div>

          <div className="card rounded-2xl shadow-lg space-y-4">
            <h2 className="text-xl font-bold">
              Localização
            </h2>
            <Linha
              nome="Bairro"
              valor={
                ocorrencia.bairro ||
                "-"
              }
            />
            <Linha
              nome="Local"
              valor={ocorrencia.local}
            />
            <Linha
              nome="Número"
              valor={
                ocorrencia.numero ||
                "S/N"
              }
            />

            {ocorrencia.latitude &&
              ocorrencia.longitude && (
                <a
                  href={`https://www.google.com/maps?q=${ocorrencia.latitude},${ocorrencia.longitude}`}
                  target="_blank"
                  rel="noreferrer"
                  className="block bg-blue-700 hover:bg-blue-800 text-center px-4 py-3 rounded-xl font-semibold"
                >
                  Abrir localização no
                  mapa
                </a>
              )}
          </div>

          <div className="card rounded-2xl shadow-lg space-y-4">
            <h2 className="text-xl font-bold">
              Equipe Empenhada
            </h2>
            <Linha
              nome="Município"
              valor={nomeMunicipio(
                ocorrencia.municipio_id
              )}
            />
            <Linha
              nome="Guarnição"
              valor={nomeGuarnicao(
                ocorrencia.guarnicao_id
              )}
            />
            <Linha
              nome="Viatura"
              valor={prefixoViatura(
                ocorrencia.viatura_id
              )}
            />
            <Linha
              nome="Responsável"
              valor={nomeGuarda(
                ocorrencia.guarda_responsavel_id
              )}
            />

            <div>
              <p className="text-slate-400 mb-2">
                Guardas
              </p>
              <pre className="whitespace-pre-wrap text-white font-sans">
                {ocorrencia.equipe_empenhada ||
                  "Equipe não informada."}
              </pre>
            </div>
          </div>

          <div className="card rounded-2xl shadow-lg space-y-4">
            <h2 className="text-xl font-bold">
              Descrição
            </h2>
            <p className="text-slate-300 leading-relaxed">
              {ocorrencia.descricao ||
                "Descrição não informada."}
            </p>
          </div>

          <BlocoEnvolvidos
            envolvidos={envolvidos}
          />

          <div className="card space-y-4 md:col-span-2">
            <h2 className="text-xl font-bold">
              🚗 Veículos Envolvidos
            </h2>

            {veiculosEnvolvidos.length ===
            0 ? (
              <p className="text-slate-400">
                Nenhum veículo
                cadastrado.
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {veiculosEnvolvidos.map(
                  (veiculo, index) => (
                    <div
                      key={index}
                      className="bg-slate-950/40 border border-slate-700 rounded-2xl p-5"
                    >
                      <h3 className="font-bold text-lg">
                        Veículo{" "}
                        {index + 1}
                      </h3>

                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-3">
                        <Linha
                          nome="Placa"
                          valor={
                            veiculo.placa
                          }
                        />
                        <Linha
                          nome="Marca"
                          valor={
                            veiculo.marca
                          }
                        />
                        <Linha
                          nome="Modelo"
                          valor={
                            veiculo.modelo
                          }
                        />
                        <Linha
                          nome="Ano"
                          valor={
                            veiculo.ano
                          }
                        />
                        <Linha
                          nome="Cor"
                          valor={
                            veiculo.cor
                          }
                        />
                        <Linha
                          nome="Situação"
                          valor={
                            veiculo.situacao
                          }
                        />
                      </div>

                      {typeof veiculo.observacao ===
                        "string" &&
                        veiculo.observacao && (
                          <p className="text-slate-300 pt-3">
                            {
                              veiculo.observacao
                            }
                          </p>
                        )}
                    </div>
                  )
                )}
              </div>
            )}
          </div>

          <div className="card space-y-4 md:col-span-2">
            <h2 className="text-xl font-bold">
              📦 Objetos Envolvidos
            </h2>

            {objetosEnvolvidos.length ===
            0 ? (
              <p className="text-slate-400">
                Nenhum objeto cadastrado.
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {objetosEnvolvidos.map(
                  (item, index) => (
                    <div
                      key={index}
                      className="bg-slate-950/40 border border-slate-700 rounded-xl p-4 space-y-2"
                    >
                      <h3 className="font-bold text-lg">
                        Item {index + 1}
                      </h3>

                      <div className="grid grid-cols-2 gap-3">
                        <Linha
                          nome="Categoria"
                          valor={
                            item.categoria
                          }
                        />
                        <Linha
                          nome="Descrição"
                          valor={
                            item.descricao
                          }
                        />
                        <Linha
                          nome="Quantidade"
                          valor={
                            item.quantidade
                          }
                        />
                        <Linha
                          nome="Situação"
                          valor={
                            item.situacao
                          }
                        />
                      </div>

                      {typeof item.observacao ===
                        "string" &&
                        item.observacao && (
                          <p className="text-slate-300 pt-2">
                            {
                              item.observacao
                            }
                          </p>
                        )}
                    </div>
                  )
                )}
              </div>
            )}
          </div>

          <div className="card space-y-4 md:col-span-2">
            <h2 className="text-xl font-bold">
              Fotos da Ocorrência
            </h2>

            {fotos.length === 0 ? (
              <p className="text-slate-400">
                Nenhuma foto anexada.
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {fotos.map(
                  (foto, index) => (
                    <a
                      key={`${foto}-${index}`}
                      href={foto}
                      target="_blank"
                      rel="noreferrer"
                      onClick={() =>
                        void auditarFoto(
                          index
                        )
                      }
                      className="bg-slate-950/40 border border-slate-700 rounded-2xl p-4 shadow-lg block"
                    >
                      <p className="text-slate-400 text-xs uppercase tracking-wider mb-3">
                        Foto {index + 1}
                      </p>

                      <div className="w-full h-80 overflow-hidden rounded-xl border border-slate-700">
                        <Image
                          src={foto}
                          alt={`Foto ${
                            index + 1
                          } da ocorrência`}
                          width={900}
                          height={600}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </a>
                  )
                )}
              </div>
            )}
          </div>
        </section>
      </div>
    </ProtecaoModulo>
  );
}

function BlocoEnvolvidos({
  envolvidos,
}: {
  envolvidos: Envolvido[];
}) {
  return (
    <div className="card space-y-4 md:col-span-2">
      <h2 className="text-xl font-bold">
        Envolvidos
      </h2>

      {envolvidos.length === 0 ? (
        <p className="text-slate-400">
          Nenhum envolvido cadastrado.
        </p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {envolvidos.map(
            (pessoa, index) => (
              <div
                key={index}
                className="bg-slate-950/40 border border-slate-700 rounded-2xl p-5"
              >
                <h3 className="font-bold text-lg">
                  {pessoa.nome ||
                    `Envolvido ${
                      index + 1
                    }`}
                </h3>

                <div className="grid grid-cols-2 gap-3 mt-3">
                  <Linha
                    nome="Tipo"
                    valor={pessoa.tipo}
                  />
                  <Linha
                    nome="Documento"
                    valor={
                      pessoa.documento
                    }
                  />
                  <Linha
                    nome="Telefone"
                    valor={
                      pessoa.telefone
                    }
                  />
                  <Linha
                    nome="Endereço"
                    valor={
                      pessoa.endereco
                    }
                  />
                </div>

                {pessoa.observacao && (
                  <p className="text-slate-300 pt-3">
                    {pessoa.observacao}
                  </p>
                )}
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
}

function ResumoCard({
  titulo,
  valor,
}: {
  titulo: string;
  valor:
    | string
    | number
    | null
    | undefined;
}) {
  return (
    <div className="card rounded-2xl shadow-lg p-4">
      <p className="text-xs text-slate-400 uppercase">
        {titulo}
      </p>
      <p className="text-xl font-bold mt-2 truncate">
        {valor ?? "-"}
      </p>
    </div>
  );
}

function Linha({
  nome,
  valor,
}: {
  nome: string;
  valor: unknown;
}) {
  const texto =
    valor === null ||
    valor === undefined ||
    valor === ""
      ? "-"
      : String(valor);

  return (
    <div className="bg-slate-900/40 border border-slate-700 rounded-xl p-3">
      <p className="text-xs uppercase tracking-wide text-slate-400">
        {nome}
      </p>
      <p className="text-white font-semibold mt-1 break-words">
        {texto}
      </p>
    </div>
  );
}