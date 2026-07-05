"use client";

import Image from "next/image";
import Link from "next/link";
import jsPDF from "jspdf";
import QRCode from "qrcode";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

import { supabase } from "@/lib/supabase";
import { registrarAuditoria } from "@/lib/auditoria";

type UsuarioLogado = {
  id: string;
  nome?: string;
  email?: string;
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
  protocolo: string;
  tipo: string;
  status: string;
  data: string;
  hora: string;
  bairro: string | null;
  local: string;
  numero: string | null;
  envolvidos: string | null;
  veiculos_envolvidos?: string | any[];
  armas_objetos?: string | any[];
  descricao: string;
  foto_url: string | null;
  fotos_urls: string | null;
  latitude: string | null;
  longitude: string | null;
  viatura_empenhada: string | null;
  equipe_empenhada: string | null;
  criado_em: string;
  municipio_id: number | null;
  guarnicao_id: number | null;
  viatura_id: number | null;
  guarda_responsavel_id: number | null;
};

type Municipio = {
  id: number;
  nome: string;
  estado: string;
  brasao: string | null;
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

const perfisVisualizacao = [
  "DESENVOLVEDOR",
  "ADMIN",
  "COMANDANTE",
  "DIRETOR",
  "CMT_GUARNICAO",
  "PLANTONISTA",
  "GUARDA",
  "CONSULTA",
];

const perfisPDF = [
  "DESENVOLVEDOR",
  "ADMIN",
  "COMANDANTE",
  "DIRETOR",
  "CMT_GUARNICAO",
  "PLANTONISTA",
  "GUARDA",
];

function obterUsuarioLogado(): UsuarioLogado | null {
  try {
    const salvo = localStorage.getItem("usuarioLogado");

    if (!salvo) return null;

    const usuario = JSON.parse(salvo);

    if (!usuario?.id || !usuario?.perfil || !usuario?.municipio_id) {
      return null;
    }

    return {
      id: String(usuario.id),
      nome: usuario.nome,
      email: usuario.email,
      perfil: usuario.perfil,
      municipio_id: Number(usuario.municipio_id),
    };
  } catch {
    return null;
  }
}

export default function VisualizarOcorrencia() {
  const params = useParams();
  const router = useRouter();

const idParam =
  typeof params.id === "string"
    ? params.id
    : params.id?.[0];

const rotasReservadas = [
  "nova",
  "expressa",
  "offline",
  "editar",
];

const id = Number(idParam);

  const [usuario, setUsuario] = useState<UsuarioLogado | null>(null);
  const [ocorrencia, setOcorrencia] = useState<Ocorrencia | null>(null);
  const [carregando, setCarregando] = useState(true);

  const [municipios, setMunicipios] = useState<Municipio[]>([]);
  const [guarnicoes, setGuarnicoes] = useState<Guarnicao[]>([]);
  const [viaturas, setViaturas] = useState<Viatura[]>([]);
  const [guardas, setGuardas] = useState<Guarda[]>([]);

  useEffect(() => {
    const usuarioAtual = obterUsuarioLogado();

    if (!usuarioAtual) {
      alert("Sessão inválida. Faça login novamente.");
      router.push("/login");
      return;
    }

    if (!perfisVisualizacao.includes(usuarioAtual.perfil)) {
      alert("Seu perfil não tem permissão para visualizar ocorrências.");
      router.push("/sistema");
      return;
    }

    setUsuario(usuarioAtual);

    void carregarOcorrencia(usuarioAtual);
    void carregarDadosApoio(usuarioAtual.municipio_id);
  }, []);

  async function carregarOcorrencia(usuarioAtual: UsuarioLogado) {
if (!idParam || rotasReservadas.includes(idParam)) {
  setCarregando(false);
  router.push("/sistema/ocorrencias");
  return;
}

if (!id || Number.isNaN(id)) {
  console.error("ID inválido recebido na URL:", idParam);
  alert(`ID da ocorrência inválido: ${idParam}`);
  setCarregando(false);
  router.push("/sistema/ocorrencias");
  return;
}

    const { data, error } = await supabase
      .from("ocorrencias")
      .select("*")
      .eq("id", id)
      .eq("municipio_id", usuarioAtual.municipio_id)
      .maybeSingle();

    if (error) {
      console.error(
  "Erro ao carregar ocorrência:",
  JSON.stringify(error, null, 2)
);
      alert("Erro ao carregar ocorrência.");
      setCarregando(false);
      return;
    }

    if (!data) {
      alert("Ocorrência não encontrada ou sem permissão para acessar.");
      setCarregando(false);
      router.push("/sistema/ocorrencias");
      return;
    }

    setOcorrencia(data);

    await registrarAuditoria({
      modulo: "OCORRENCIAS",
      acao: "VISUALIZAR",
      descricao: `Visualizou a ocorrência ${data.protocolo || id}.`,
      registro_id: String(data.id),
    });

    setCarregando(false);
  }

  async function carregarDadosApoio(municipioId: number) {
    const [
      municipiosResp,
      guarnicoesResp,
      viaturasResp,
      guardasResp,
    ] = await Promise.all([
      supabase
        .from("municipios")
        .select("id, nome, estado, brasao, nome_corporacao, sigla_corporacao")
        .eq("id", municipioId),

      supabase
        .from("guarnicoes")
        .select("id, nome")
        .eq("municipio_id", municipioId),

      supabase
        .from("viaturas")
        .select("id, prefixo")
        .eq("municipio_id", municipioId),

      supabase
        .from("guardas")
        .select("id, nome")
        .eq("municipio_id", municipioId),
    ]);

    setMunicipios(municipiosResp.data || []);
    setGuarnicoes(guarnicoesResp.data || []);
    setViaturas(viaturasResp.data || []);
    setGuardas(guardasResp.data || []);
  }

  function obterEnvolvidos(): Envolvido[] {
    if (!ocorrencia?.envolvidos) return [];

    try {
      const dados = JSON.parse(ocorrencia.envolvidos);
      return Array.isArray(dados) ? dados : [];
    } catch {
      return [];
    }
  }

  function obterVeiculosEnvolvidos(): any[] {
    if (!ocorrencia?.veiculos_envolvidos) return [];

    try {
      if (typeof ocorrencia.veiculos_envolvidos === "string") {
        const dados = JSON.parse(ocorrencia.veiculos_envolvidos);
        return Array.isArray(dados) ? dados : [];
      }

      return Array.isArray(ocorrencia.veiculos_envolvidos)
        ? ocorrencia.veiculos_envolvidos
        : [];
    } catch {
      return [];
    }
  }

  function obterObjetosEnvolvidos(): any[] {
    if (!ocorrencia?.armas_objetos) return [];

    try {
      if (typeof ocorrencia.armas_objetos === "string") {
        const dados = JSON.parse(ocorrencia.armas_objetos);
        return Array.isArray(dados) ? dados : [];
      }

      return Array.isArray(ocorrencia.armas_objetos)
        ? ocorrencia.armas_objetos
        : [];
    } catch {
      return [];
    }
  }

  function obterFotos(): string[] {
    if (!ocorrencia) return [];

    const fotos: string[] = [];

    if (ocorrencia.fotos_urls) {
      try {
        const dados = JSON.parse(ocorrencia.fotos_urls);

        if (Array.isArray(dados)) {
          dados.forEach((url) => {
            if (url && typeof url === "string") fotos.push(url);
          });
        }
      } catch {}
    }

    if (ocorrencia.foto_url && !fotos.includes(ocorrencia.foto_url)) {
      fotos.unshift(ocorrencia.foto_url);
    }

    return fotos;
  }

  function municipioDaOcorrencia() {
    if (!ocorrencia?.municipio_id) return null;

    return (
      municipios.find((m) => m.id === ocorrencia.municipio_id) || null
    );
  }

  function nomeMunicipio(id: number | null) {
    if (!id) return "-";

    const municipio = municipios.find((m) => m.id === id);
    return municipio ? `${municipio.nome} - ${municipio.estado}` : "-";
  }

  function nomeGuarnicao(id: number | null) {
    if (!id) return "-";

    const guarnicao = guarnicoes.find((g) => g.id === id);
    return guarnicao?.nome || "-";
  }

  function prefixoViatura(id: number | null) {
    if (!id) return "-";

    const viatura = viaturas.find((v) => v.id === id);
    return viatura?.prefixo || "-";
  }

  function nomeGuarda(id: number | null) {
    if (!id) return "-";

    const guarda = guardas.find((g) => g.id === id);
    return guarda?.nome || "-";
  }

  async function auditarFoto(index: number) {
    if (!ocorrencia) return;

    await registrarAuditoria({
      modulo: "OCORRENCIAS",
      acao: "VISUALIZAR_FOTO",
      descricao: `Visualizou a foto ${index + 1} da ocorrência ${ocorrencia.protocolo}.`,
      registro_id: String(ocorrencia.id),
    });
  }

  function adicionarMarcaDagua(pdf: jsPDF) {
    const totalPaginas = pdf.getNumberOfPages();

    for (let i = 1; i <= totalPaginas; i++) {
      pdf.setPage(i);
      pdf.setTextColor(220, 220, 220);
      pdf.setFontSize(38);
      pdf.text("SIG-GCM BRASIL", 105, 150, {
        align: "center",
        angle: 35,
      });
      pdf.setTextColor(0, 0, 0);
    }
  }

  async function gerarPDF() {
    if (!ocorrencia || !usuario) return;

    if (!perfisPDF.includes(usuario.perfil)) {
      alert("Seu perfil não tem permissão para gerar PDF.");
      return;
    }

    const pdf = new jsPDF();

    const envolvidos = obterEnvolvidos();
    const veiculosEnvolvidos = obterVeiculosEnvolvidos();
    const objetosEnvolvidos = obterObjetosEnvolvidos();
    const fotos = obterFotos();

    let brasaoBase64 = "";
    let qrCodeBase64 = "";

    const municipioAtual = municipioDaOcorrencia();

    try {
      if (municipioAtual?.brasao) {
        brasaoBase64 = await carregarImagemBase64(municipioAtual.brasao);
      } else {
        brasaoBase64 = await carregarImagemBase64("/brasoes/sig-gcm-logo.png");
      }
    } catch {
      console.warn("Não foi possível carregar o brasão.");
    }

    try {
      const textoQr = `
SIG-GCM Brasil
Protocolo: ${ocorrencia.protocolo}
Tipo: ${ocorrencia.tipo}
Status: ${ocorrencia.status}
Data: ${ocorrencia.data}
Hora: ${ocorrencia.hora}
Local: ${ocorrencia.local}
`;

      qrCodeBase64 = await QRCode.toDataURL(textoQr);
    } catch {
      console.warn("Não foi possível gerar QR Code.");
    }

    if (brasaoBase64) {
      pdf.addImage(brasaoBase64, "PNG", 15, 10, 25, 25);
    }

    pdf.setFontSize(14);
    pdf.text(municipioAtual?.nome || "PREFEITURA MUNICIPAL", 105, 18, {
      align: "center",
    });

    pdf.setFontSize(12);
    pdf.text(
      municipioAtual?.nome_corporacao || "GUARDA CIVIL MUNICIPAL",
      105,
      27,
      { align: "center" }
    );

    pdf.setFontSize(11);
    pdf.text("RELATÓRIO DE OCORRÊNCIA", 105, 35, {
      align: "center",
    });

    if (qrCodeBase64) {
      pdf.addImage(qrCodeBase64, "PNG", 170, 10, 25, 25);
    }

    pdf.line(15, 42, 195, 42);

    let y = 55;

    function novaPaginaSePrecisar(limite = 250) {
      if (y > limite) {
        pdf.addPage();
        y = 20;
      }
    }

    function linha(label: string, valor: any) {
      if (!valor) return;

      novaPaginaSePrecisar();
      pdf.setFontSize(11);
      const texto = pdf.splitTextToSize(`${label}: ${valor}`, 175);
      pdf.text(texto, 15, y);
      y += texto.length * 7;
    }

    linha("Protocolo", ocorrencia.protocolo);
    linha("Tipo", ocorrencia.tipo);
    linha("Status", ocorrencia.status);
    linha("Data/Hora", `${ocorrencia.data} às ${ocorrencia.hora}`);
    linha("Bairro", ocorrencia.bairro || "-");
    linha("Local", ocorrencia.local);
    linha("Número", ocorrencia.numero || "S/N");
    linha("Município", nomeMunicipio(ocorrencia.municipio_id));
    linha("Guarnição", nomeGuarnicao(ocorrencia.guarnicao_id));
    linha("Viatura", prefixoViatura(ocorrencia.viatura_id));
    linha("Responsável", nomeGuarda(ocorrencia.guarda_responsavel_id));

    if (ocorrencia.latitude && ocorrencia.longitude) {
      linha("Latitude", ocorrencia.latitude);
      linha("Longitude", ocorrencia.longitude);
    }

    y += 8;

    pdf.setFontSize(14);
    pdf.text("EQUIPE EMPENHADA", 15, y);
    y += 8;

    const equipe = pdf.splitTextToSize(
      ocorrencia.equipe_empenhada || "Equipe não informada.",
      170
    );
    pdf.setFontSize(11);
    pdf.text(equipe, 15, y);
    y += equipe.length * 7 + 10;

    novaPaginaSePrecisar(220);
    pdf.setFontSize(14);
    pdf.text("DESCRIÇÃO DOS FATOS", 15, y);
    y += 8;

    const descricao = pdf.splitTextToSize(ocorrencia.descricao || "-", 170);
    pdf.setFontSize(11);
    pdf.text(descricao, 15, y);
    y += descricao.length * 7 + 10;

    if (envolvidos.length > 0) {
      novaPaginaSePrecisar(220);
      pdf.setFontSize(14);
      pdf.text("ENVOLVIDOS", 15, y);
      y += 10;

      envolvidos.forEach((pessoa, index) => {
        novaPaginaSePrecisar(230);
        linha(`${index + 1}. Nome`, pessoa.nome || "Sem nome");
        linha("Tipo", pessoa.tipo);
        linha("Documento", pessoa.documento);
        linha("Telefone", pessoa.telefone);
        linha("Endereço", pessoa.endereco);
        linha("Observação", pessoa.observacao);
        y += 5;
      });
    }

    if (veiculosEnvolvidos.length > 0) {
      novaPaginaSePrecisar(220);
      pdf.setFontSize(14);
      pdf.text("VEÍCULOS ENVOLVIDOS", 15, y);
      y += 10;

      veiculosEnvolvidos.forEach((veiculo: any, index: number) => {
        novaPaginaSePrecisar(230);
        linha(`${index + 1}. Veículo`, " ");
        linha("Placa", veiculo.placa);
        linha("Tipo/Espécie", veiculo.tipo_especie);
        linha("Marca", veiculo.marca);
        linha("Modelo", veiculo.modelo);
        linha("Ano", veiculo.ano);
        linha("Cor", veiculo.cor);
        linha("Renavam", veiculo.renavam);
        linha("Chassi", veiculo.chassi);
        linha("Condutor", veiculo.condutor);
        linha("Documento Condutor", veiculo.documento_condutor);
        linha("Proprietário", veiculo.proprietario);
        linha("CPF Proprietário", veiculo.cpf_proprietario);
        linha("Telefone Proprietário", veiculo.telefone_proprietario);
        linha("Situação", veiculo.situacao);
        linha("Consulta", veiculo.situacao_consulta);
        linha("Observação", veiculo.observacao);
        y += 5;
      });
    }

    if (objetosEnvolvidos.length > 0) {
      novaPaginaSePrecisar(220);
      pdf.setFontSize(14);
      pdf.text("OBJETOS ENVOLVIDOS", 15, y);
      y += 10;

      objetosEnvolvidos.forEach((item: any, index: number) => {
        novaPaginaSePrecisar(230);
        linha(`${index + 1}. Item`, " ");
        linha("Categoria", item.categoria);
        linha("Descrição", item.descricao);
        linha("Marca", item.marca);
        linha("Modelo", item.modelo);
        linha("Calibre", item.calibre);
        linha("Numeração", item.numeracao);
        linha("Quantidade", item.quantidade);
        linha("Peso", item.peso ? `${item.peso} ${item.unidade_peso || ""}` : "");
        linha("Valor Estimado", item.valor_estimado);
        linha("Procedência", item.procedencia);
        linha("Situação", item.situacao);
        linha("Observação", item.observacao);
        y += 5;
      });
    }

    novaPaginaSePrecisar(230);
    pdf.line(15, 265, 90, 265);
    pdf.text("Guarda Responsável", 15, 273);

    pdf.line(110, 265, 190, 265);
    pdf.text("Comandante", 110, 273);

    if (fotos.length > 0) {
      for (let i = 0; i < fotos.length; i++) {
        try {
          const imagemBase64 = await carregarImagemBase64(fotos[i]);

          pdf.addPage();

          if (brasaoBase64) {
            pdf.addImage(brasaoBase64, "PNG", 15, 10, 22, 22);
          }

          pdf.setFontSize(16);
          pdf.text(`ANEXO FOTOGRÁFICO ${i + 1}`, 105, 22, {
            align: "center",
          });

          pdf.line(15, 35, 195, 35);
          pdf.addImage(imagemBase64, "JPEG", 15, 45, 180, 120);
        } catch {
          console.warn("Erro ao adicionar foto no PDF.");
        }
      }
    }

    adicionarMarcaDagua(pdf);

    await registrarAuditoria({
      modulo: "OCORRENCIAS",
      acao: "GERAR_PDF",
      descricao: `Gerou PDF da ocorrência ${ocorrencia.protocolo}.`,
      registro_id: String(ocorrencia.id),
    });

    pdf.save(`RELATORIO-${ocorrencia.protocolo}.pdf`);
  }

  async function carregarImagemBase64(url: string): Promise<string> {
    const resposta = await fetch(url);
    const blob = await resposta.blob();

    return new Promise((resolve, reject) => {
      const leitor = new FileReader();
      leitor.onloadend = () => resolve(leitor.result as string);
      leitor.onerror = reject;
      leitor.readAsDataURL(blob);
    });
  }

  if (carregando) {
    return <div className="p-6 text-slate-400">Carregando ocorrência...</div>;
  }

  if (!ocorrencia) {
    return <div className="p-6 text-slate-400">Ocorrência não encontrada.</div>;
  }

  const envolvidos = obterEnvolvidos();
  const veiculosEnvolvidos = obterVeiculosEnvolvidos();
  const objetosEnvolvidos = obterObjetosEnvolvidos();
  const fotos = obterFotos();

  return (
    <div className="p-3 md:p-6 pb-24">
      <header className="flex flex-col md:flex-row gap-4 justify-between md:items-center border-b border-slate-800 pb-5 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">
            Ocorrência {ocorrencia.protocolo}
          </h1>

          <p className="text-slate-400">
            Detalhes completos da ocorrência registrada.
          </p>
        </div>

        <div className="flex flex-col md:flex-row gap-3">
          {usuario && perfisPDF.includes(usuario.perfil) && (
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
        <ResumoCard titulo="Protocolo" valor={ocorrencia.protocolo} />
        <ResumoCard titulo="Status" valor={ocorrencia.status} />
        <ResumoCard titulo="Data" valor={ocorrencia.data} />
        <ResumoCard titulo="Local" valor={ocorrencia.local} />
      </div>

      <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="card rounded-2xl shadow-lg space-y-4">
          <h2 className="text-xl font-bold">Dados principais</h2>
          <Linha nome="Protocolo" valor={ocorrencia.protocolo} />
          <Linha nome="Tipo" valor={ocorrencia.tipo} />
          <Linha nome="Status" valor={ocorrencia.status} />
          <Linha nome="Data" valor={ocorrencia.data} />
          <Linha nome="Hora" valor={ocorrencia.hora} />
        </div>

        <div className="card rounded-2xl shadow-lg space-y-4">
          <h2 className="text-xl font-bold">Localização</h2>
          <Linha nome="Bairro" valor={ocorrencia.bairro || "-"} />
          <Linha nome="Local" valor={ocorrencia.local} />
          <Linha nome="Número" valor={ocorrencia.numero || "S/N"} />

          {ocorrencia.latitude && ocorrencia.longitude && (
            <a
              href={`https://www.google.com/maps?q=${ocorrencia.latitude},${ocorrencia.longitude}`}
              target="_blank"
              className="block bg-blue-700 hover:bg-blue-800 text-center px-4 py-3 rounded-xl font-semibold"
            >
              Abrir localização no mapa
            </a>
          )}
        </div>

        <div className="card rounded-2xl shadow-lg space-y-4">
          <h2 className="text-xl font-bold">Equipe Empenhada</h2>
          <Linha nome="Município" valor={nomeMunicipio(ocorrencia.municipio_id)} />
          <Linha nome="Guarnição" valor={nomeGuarnicao(ocorrencia.guarnicao_id)} />
          <Linha nome="Viatura" valor={prefixoViatura(ocorrencia.viatura_id)} />
          <Linha nome="Responsável" valor={nomeGuarda(ocorrencia.guarda_responsavel_id)} />

          <div>
            <p className="text-slate-400 mb-2">Guardas</p>
            <pre className="whitespace-pre-wrap text-white font-sans">
              {ocorrencia.equipe_empenhada || "Equipe não informada."}
            </pre>
          </div>
        </div>

        <div className="card rounded-2xl shadow-lg space-y-4">
          <h2 className="text-xl font-bold">Descrição</h2>
          <p className="text-slate-300 leading-relaxed">
            {ocorrencia.descricao}
          </p>
        </div>

        <BlocoEnvolvidos envolvidos={envolvidos} />

        <div className="card space-y-4 md:col-span-2">
          <h2 className="text-xl font-bold">🚗 Veículos Envolvidos</h2>

          {veiculosEnvolvidos.length === 0 ? (
            <p className="text-slate-400">Nenhum veículo cadastrado.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {veiculosEnvolvidos.map((veiculo: any, index: number) => (
                <div
                  key={index}
                  className="bg-slate-950/40 border border-slate-700 rounded-2xl p-5"
                >
                  <h3 className="font-bold text-lg">Veículo {index + 1}</h3>

                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-3">
                    <Linha nome="Placa" valor={veiculo.placa || "-"} />
                    <Linha nome="Marca" valor={veiculo.marca || "-"} />
                    <Linha nome="Modelo" valor={veiculo.modelo || "-"} />
                    <Linha nome="Ano" valor={veiculo.ano || "-"} />
                    <Linha nome="Cor" valor={veiculo.cor || "-"} />
                    <Linha nome="Situação" valor={veiculo.situacao || "-"} />
                  </div>

                  {veiculo.observacao && (
                    <p className="text-slate-300 pt-3">{veiculo.observacao}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card space-y-4 md:col-span-2">
          <h2 className="text-xl font-bold">📦 Objetos Envolvidos</h2>

          {objetosEnvolvidos.length === 0 ? (
            <p className="text-slate-400">Nenhum objeto cadastrado.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {objetosEnvolvidos.map((item: any, index: number) => (
                <div
                  key={index}
                  className="bg-slate-950/40 border border-slate-700 rounded-xl p-4 space-y-2"
                >
                  <h3 className="font-bold text-lg">Item {index + 1}</h3>

                  <div className="grid grid-cols-2 gap-3">
                    <Linha nome="Categoria" valor={item.categoria || "-"} />
                    <Linha nome="Descrição" valor={item.descricao || "-"} />
                    <Linha nome="Quantidade" valor={item.quantidade || "-"} />
                    <Linha nome="Situação" valor={item.situacao || "-"} />
                  </div>

                  {item.observacao && (
                    <p className="text-slate-300 pt-2">{item.observacao}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card space-y-4 md:col-span-2">
          <h2 className="text-xl font-bold">Fotos da Ocorrência</h2>

          {fotos.length === 0 ? (
            <p className="text-slate-400">Nenhuma foto anexada.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {fotos.map((foto, index) => (
                <a
                  key={foto}
                  href={foto}
                  target="_blank"
                  onClick={() => void auditarFoto(index)}
                  className="bg-slate-950/40 border border-slate-700 rounded-2xl p-4 shadow-lg block"
                >
                  <p className="text-slate-400 text-xs uppercase tracking-wider mb-3">
                    Foto {index + 1}
                  </p>

                  <div className="w-full h-80 overflow-hidden rounded-xl border border-slate-700">
                    <Image
                      src={foto}
                      alt={`Foto ${index + 1} da ocorrência`}
                      width={900}
                      height={600}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </a>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

function BlocoEnvolvidos({ envolvidos }: { envolvidos: Envolvido[] }) {
  return (
    <div className="card space-y-4 md:col-span-2">
      <h2 className="text-xl font-bold">Envolvidos</h2>

      {envolvidos.length === 0 ? (
        <p className="text-slate-400">Nenhum envolvido cadastrado.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {envolvidos.map((pessoa, index) => (
            <div
              key={index}
              className="bg-slate-950/40 border border-slate-700 rounded-2xl p-5"
            >
              <h3 className="font-bold text-lg">
                {pessoa.nome || `Envolvido ${index + 1}`}
              </h3>

              <div className="grid grid-cols-2 gap-3 mt-3">
                <Linha nome="Tipo" valor={pessoa.tipo || "-"} />
                <Linha nome="Documento" valor={pessoa.documento || "-"} />
                <Linha nome="Telefone" valor={pessoa.telefone || "-"} />
                <Linha nome="Endereço" valor={pessoa.endereco || "-"} />
              </div>

              {pessoa.observacao && (
                <p className="text-slate-300 pt-3">{pessoa.observacao}</p>
              )}
            </div>
          ))}
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
  valor: string | number | null | undefined;
}) {
  return (
    <div className="card rounded-2xl shadow-lg p-4">
      <p className="text-xs text-slate-400 uppercase">{titulo}</p>
      <p className="text-xl font-bold mt-2 truncate">{valor ?? "-"}</p>
    </div>
  );
}

function Linha({
  nome,
  valor,
}: {
  nome: string;
  valor: string | number | null | undefined;
}) {
  return (
    <div className="bg-slate-900/40 border border-slate-700 rounded-xl p-3">
      <p className="text-xs uppercase tracking-wide text-slate-400">{nome}</p>
      <p className="text-white font-semibold mt-1 break-words">{valor ?? "-"}</p>
    </div>
  );
}