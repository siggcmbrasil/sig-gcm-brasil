"use client";

import Image from "next/image";
import Link from "next/link";
import jsPDF from "jspdf";
import QRCode from "qrcode";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";

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

export default function VisualizarOcorrencia() {
  const params = useParams();
  const id = params.id;

  const [ocorrencia, setOcorrencia] = useState<Ocorrencia | null>(null);
  const [carregando, setCarregando] = useState(true);

  const [municipios, setMunicipios] = useState<Municipio[]>([]);
  const [guarnicoes, setGuarnicoes] = useState<Guarnicao[]>([]);
  const [viaturas, setViaturas] = useState<Viatura[]>([]);
  const [guardas, setGuardas] = useState<Guarda[]>([]);

  async function carregarOcorrencia() {
    const { data, error } = await supabase
      .from("ocorrencias")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      console.error(error);
      alert("Erro ao carregar ocorrência.");
      setCarregando(false);
      return;
    }

    setOcorrencia(data);
    setCarregando(false);
  }

  async function carregarDadosApoio() {
  const { data: municipiosData } = await supabase
    .from("municipios")
.select("id, nome, estado, brasao, nome_corporacao, sigla_corporacao");

  const { data: guarnicoesData } = await supabase
    .from("guarnicoes")
    .select("id, nome");

  const { data: viaturasData } = await supabase
    .from("viaturas")
    .select("id, prefixo");

  const { data: guardasData } = await supabase
    .from("guardas")
    .select("id, nome");

  setMunicipios(municipiosData || []);
  setGuarnicoes(guarnicoesData || []);
  setViaturas(viaturasData || []);
  setGuardas(guardasData || []);
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
      } catch {
        // ignora erro de JSON antigo
      }
    }

    if (ocorrencia.foto_url && !fotos.includes(ocorrencia.foto_url)) {
      fotos.unshift(ocorrencia.foto_url);
    }

    return fotos;
  }

  function municipioDaOcorrencia() {
  if (!ocorrencia?.municipio_id) return null;

  return (
    municipios.find(
      (m) => m.id === ocorrencia.municipio_id
    ) || null
  );
}

  async function gerarPDF() {
    if (!ocorrencia) return;

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
  brasaoBase64 = await carregarImagemBase64("/brasao-gcm-v2.png");
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

    pdf.setFontSize(16);
    pdf.text("PREFEITURA MUNICIPAL DE BIRITINGA", 105, 18, {
  align: "center",
});

pdf.setFontSize(14);
pdf.text("GUARDA CIVIL MUNICIPAL", 105, 27, {
  align: "center",
});

    pdf.setFontSize(11);
    pdf.text("RELATÓRIO DE OCORRÊNCIA", 105, 35, {
      align: "center",
    });

    if (qrCodeBase64) {
      pdf.addImage(qrCodeBase64, "PNG", 170, 10, 25, 25);
    }

    pdf.line(15, 42, 195, 42);

    let y = 55;

    pdf.setFontSize(11);
    pdf.text(`Protocolo: ${ocorrencia.protocolo}`, 15, y);
    y += 8;
    pdf.text(`Tipo: ${ocorrencia.tipo}`, 15, y);
    y += 8;
    pdf.text(`Status: ${ocorrencia.status}`, 15, y);
    y += 8;
    pdf.text(`Data/Hora: ${ocorrencia.data} às ${ocorrencia.hora}`, 15, y);
    y += 8;
    pdf.text(`Bairro: ${ocorrencia.bairro || "-"}`, 15, y);
    y += 8;
    pdf.text(`Local: ${ocorrencia.local}`, 15, y);
    y += 8;
    pdf.text(`Número: ${ocorrencia.numero || "S/N"}`, 15, y);
    y += 12;
    pdf.text(
  `Município: ${nomeMunicipio(ocorrencia.municipio_id)}`, 15, y
);
y += 8;

pdf.text(
  `Guarnição: ${nomeGuarnicao(ocorrencia.guarnicao_id)}`,
  15,
  y
);
y += 8;

pdf.text(
  `Viatura: ${prefixoViatura(ocorrencia.viatura_id)}`,
  15,
  y
);
y += 8;

pdf.text(
  `Responsável: ${nomeGuarda(ocorrencia.guarda_responsavel_id)}`,
  15,
  y
);
y += 12;

    if (ocorrencia.latitude && ocorrencia.longitude) {
      pdf.text(`Latitude: ${ocorrencia.latitude}`, 15, y);
      y += 8;
      pdf.text(`Longitude: ${ocorrencia.longitude}`, 15, y);
      y += 12;
    }

    
        pdf.setFontSize(11);
    const equipe = pdf.splitTextToSize(
      ocorrencia.equipe_empenhada || "Equipe não informada.",
      170
    );

    pdf.text(equipe, 15, y);
    y += equipe.length * 7 + 10;

    pdf.setFontSize(14);
    pdf.text("DESCRIÇÃO DOS FATOS", 15, y);
    y += 8;

    pdf.setFontSize(11);
    const descricao = pdf.splitTextToSize(ocorrencia.descricao, 170);
    pdf.text(descricao, 15, y);
    y += descricao.length * 7 + 10;

    if (envolvidos.length > 0) {
      if (y > 220) {
        pdf.addPage();
        y = 20;
      }

      pdf.setFontSize(14);
      pdf.text("ENVOLVIDOS", 15, y);
      y += 10;

      pdf.setFontSize(11);

      envolvidos.forEach((pessoa, index) => {
        if (y > 250) {
          pdf.addPage();
          y = 20;
        }

        pdf.text(`${index + 1}. ${pessoa.nome || "Sem nome"}`, 15, y);
        y += 7;
        pdf.text(`Tipo: ${pessoa.tipo || "-"}`, 20, y);
        y += 7;
        pdf.text(`Documento: ${pessoa.documento || "-"}`, 20, y);
        y += 7;
        pdf.text(`Telefone: ${pessoa.telefone || "-"}`, 20, y);
        y += 7;
        pdf.text(`Endereço: ${pessoa.endereco || "-"}`, 20, y);
        y += 10;
      });
    }

    if (veiculosEnvolvidos.length > 0) {
  if (y > 220) {
    pdf.addPage();
    y = 20;
  }

  pdf.setFontSize(14);
  pdf.text("VEÍCULOS ENVOLVIDOS", 15, y);
  y += 10;

  pdf.setFontSize(11);

  veiculosEnvolvidos.forEach((veiculo: any, index: number) => {
    if (y > 230) {
      pdf.addPage();
      y = 20;
    }

    pdf.text(`${index + 1}. Veículo`, 15, y);
    y += 7;
    pdf.text(`Placa: ${veiculo.placa || "-"}`, 20, y);
    y += 7;
    pdf.text(`Marca: ${veiculo.marca || "-"}`, 20, y);
    y += 7;
    pdf.text(`Modelo: ${veiculo.modelo || "-"}`, 20, y);
    y += 7;
    pdf.text(`Ano: ${veiculo.ano || "-"}`, 20, y);
    y += 7;
    pdf.text(`Cor: ${veiculo.cor || "-"}`, 20, y);
    y += 7;
    pdf.text(`Renavam: ${veiculo.renavam || "-"}`, 20, y);
    y += 7;
    pdf.text(`Condutor: ${veiculo.condutor || "-"}`, 20, y);
    y += 7;
    pdf.text(`Documento Condutor: ${veiculo.documento_condutor || "-"}`, 20, y);
    y += 7;
    pdf.text(`Proprietário: ${veiculo.proprietario || "-"}`, 20, y);
    y += 7;
    pdf.text(`CPF Proprietário: ${veiculo.cpf_proprietario || "-"}`, 20, y);
    y += 7;
    pdf.text(`Situação: ${veiculo.situacao || "-"}`, 20, y);
    y += 7;
    pdf.text(`Consulta: ${veiculo.situacao_consulta || "-"}`, 20, y);
    y += 7;

    if (veiculo.observacao) {
      const obs = pdf.splitTextToSize(
        `Observação: ${veiculo.observacao}`,
        165
      );
      pdf.text(obs, 20, y);
      y += obs.length * 7;
    }

    y += 8;
  });
}

if (objetosEnvolvidos.length > 0) {
  if (y > 220) {
    pdf.addPage();
    y = 20;
  }

  pdf.setFontSize(14);
  pdf.text("OBJETOS ENVOLVIDOS", 15, y);
  y += 10;

  pdf.setFontSize(11);

  objetosEnvolvidos.forEach((item: any, index: number) => {
    if (y > 230) {
      pdf.addPage();
      y = 20;
    }

    pdf.text(`${index + 1}. Item`, 15, y);
    y += 7;

    pdf.text(`Categoria: ${item.categoria || "-"}`, 20, y);
    y += 7;

    pdf.text(`Descrição: ${item.descricao || "-"}`, 20, y);
    y += 7;

    pdf.text(`Marca: ${item.marca || "-"}`, 20, y);
    y += 7;

    pdf.text(`Modelo: ${item.modelo || "-"}`, 20, y);
    y += 7;

    pdf.text(`Calibre: ${item.calibre || "-"}`, 20, y);
    y += 7;

    pdf.text(`Numeração: ${item.numeracao || "-"}`, 20, y);
    y += 7;

    pdf.text(`Quantidade: ${item.quantidade || "-"}`, 20, y);
    y += 7;

    pdf.text(
      `Peso: ${item.peso || "-"} ${item.unidade_peso || ""}`,
      20,
      y
    );
    y += 7;

    pdf.text(
      `Valor Estimado: ${item.valor_estimado || "-"}`,
      20,
      y
    );
    y += 7;

    pdf.text(
      `Procedência: ${item.procedencia || "-"}`,
      20,
      y
    );
    y += 7;

    pdf.text(`Situação: ${item.situacao || "-"}`, 20, y);
    y += 7;

    if (item.observacao) {
      const obs = pdf.splitTextToSize(
        `Observação: ${item.observacao}`,
        165
      );

      pdf.text(obs, 20, y);
      y += obs.length * 7;
    }

    y += 10;
  });
}

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

  useEffect(() => {
  carregarOcorrencia();
  carregarDadosApoio();
}, []);

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
          <button
            type="button"
            onClick={gerarPDF}
            className="bg-green-700 hover:bg-green-800 px-5 py-3 rounded-xl font-semibold"
          >
            Gerar PDF
          </button>

          <Link
            href="/sistema/ocorrencias"
            className="bg-slate-700 hover:bg-slate-600 px-5 py-3 rounded-xl font-semibold text-center"
          >
            Voltar
          </Link>
        </div>
      </header>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">

  <div className="card rounded-2xl shadow-lg p-4">
    <p className="text-xs text-slate-400 uppercase">
      Protocolo
    </p>

    <p className="text-xl font-bold mt-2">
      {ocorrencia.protocolo}
    </p>
  </div>

  <div className="card rounded-2xl shadow-lg p-4">
    <p className="text-xs text-slate-400 uppercase">
      Status
    </p>

    <p className="text-xl font-bold mt-2">
      {ocorrencia.status}
    </p>
  </div>

  <div className="card rounded-2xl shadow-lg p-4">
    <p className="text-xs text-slate-400 uppercase">
      Data
    </p>

    <p className="text-xl font-bold mt-2">
      {ocorrencia.data}
    </p>
  </div>

  <div className="card rounded-2xl shadow-lg p-4">
    <p className="text-xs text-slate-400 uppercase">
      Local
    </p>

    <p className="text-lg font-bold mt-2 truncate">
      {ocorrencia.local}
    </p>
  </div>

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
          <Linha nome="Viatura" valor={ocorrencia.viatura_empenhada || "-"} />
          <Linha nome="Município" valor={nomeMunicipio(ocorrencia.municipio_id)}/>
          <Linha nome="Guarnição" valor={nomeGuarnicao(ocorrencia.guarnicao_id)}/>
          <Linha nome="Viatura" valor={prefixoViatura(ocorrencia.viatura_id)}/>
          <Linha nome="Responsável" valor={nomeGuarda(ocorrencia.guarda_responsavel_id)}/>
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

                  <Linha nome="Tipo" valor={pessoa.tipo || "-"} />
                  <Linha nome="Documento" valor={pessoa.documento || "-"} />
                  <Linha nome="Telefone" valor={pessoa.telefone || "-"} />
                  <Linha nome="Endereço" valor={pessoa.endereco || "-"} />

                  {pessoa.observacao && (
                    <p className="text-slate-300 pt-2">
                      {pessoa.observacao}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card space-y-4 md:col-span-2">
  <h2 className="text-xl font-bold">
    🚗 Veículos Envolvidos
  </h2>

  {veiculosEnvolvidos.length === 0 ? (
    <p className="text-slate-400">Nenhum veículo cadastrado.</p>
  ) : (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {veiculosEnvolvidos.map((veiculo: any, index: number) => (
        <div
          key={index}
          className="bg-slate-950/40 border border-slate-700 rounded-2xl p-5"
        >
          <h3 className="font-bold text-lg">
            Veículo {index + 1}
          </h3>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">

          <Linha nome="Placa" valor={veiculo.placa || "-"} />
          {veiculo.marca && (
          <Linha nome="Marca" valor={veiculo.marca || "-"} />
          )}
          {veiculo.modelo && (
          <Linha nome="Modelo" valor={veiculo.modelo} />
          )}
          {veiculo.ano && (
          <Linha nome="Ano" valor={veiculo.ano || "-"} />
          )}
          {veiculo.cor && (
          <Linha nome="Cor" valor={veiculo.cor || "-"} />
          )}
          {veiculo.renavam && (
          <Linha nome="Renavam" valor={veiculo.renavam} />
          )}
          {veiculo.condutor && (
          <Linha nome="Condutor" valor={veiculo.condutor || "-"} />
          )}
          {veiculo.documento_condutor && (
          <Linha nome="Documento do Condutor" valor={veiculo.documento_condutor || "-"} />
          )}
          {veiculo.proprietario && (
          <Linha nome="Proprietário" valor={veiculo.proprietario || "-"} />
          )}
          {veiculo.cpf_proprietario && (
          <Linha nome="CPF Proprietário" valor={veiculo.cpf_proprietario || "-"}/>
          )}
          {veiculo.situacao && (
          <Linha nome="Situação" valor={veiculo.situacao || "-"} />
          )}
          {veiculo.situacao_consulta && (
          <Linha nome="Situação da Consulta" valor={veiculo.situacao_consulta || "-"} />
          )}

          </div>

          {veiculo.observacao && (
            <p className="text-slate-300 pt-2">
              {veiculo.observacao}
            </p>
          )}
        </div>
      ))}
    </div>
  )}
</div>

<div className="card space-y-4 md:col-span-2">
  <h2 className="text-xl font-bold">
    📦 Objetos Envolvidos
  </h2>

  {objetosEnvolvidos.length === 0 ? (
    <p className="text-slate-400">
      Nenhum objeto cadastrado.
    </p>
  ) : (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
      {objetosEnvolvidos.map((item: any, index: number) => (
        <div
          key={index}
          className="bg-slate-950/40 border border-slate-700 rounded-xl p-4 space-y-2"
        >
          <h3 className="font-bold text-lg">
            Item {index + 1}
          </h3>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">

          <Linha nome="Categoria" valor={item.categoria || "-"} />

          <Linha nome="Descrição" valor={item.descricao || "-"} />
          {item.marca && (
          <Linha nome="Marca" valor={item.marca || "-"} />
          )}
          {item.modelo && (
          <Linha nome="Modelo" valor={item.modelo || "-"} />
          )}
          {item.calibre && (
          <Linha nome="Calibre" valor={item.calibre || "-"} />
          )}
          {item.numeracao && (
          <Linha nome="Numeração" valor={item.numeracao || "-"} />
          )}
          <Linha nome="Quantidade" valor={item.quantidade || "-"} />
          {item.peso && (
          <Linha nome="Peso" valor={`${item.peso || "-"} ${item.unidade_peso || ""}`} />
          )}
          {item.valor_estimado && (
          <Linha nome="Valor Estimado" valor={item.valor_estimado || "-"} />
          )}
          {item.procedencia && (
          <Linha nome="Procedência" valor={item.procedencia || "-"} />
          )}
          <Linha nome="Situação" valor={item.situacao || "-"} />

          </div>

          {item.observacao && (
            <p className="text-slate-300 pt-2">
              {item.observacao}
            </p>
          )}
        </div>
      ))}
    </div>
  )}
</div>

        <div className="card space-y-4 md:col-span-2">
          <h2 className="text-xl font-bold">
            Fotos da Ocorrência
          </h2>

          {fotos.length === 0 ? (
            <p className="text-slate-400">Nenhuma foto anexada.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {fotos.map((foto, index) => (
                <div
                  key={foto}
                  className="bg-slate-950/40 border border-slate-700 rounded-2xl p-4 shadow-lg"
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
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

function Linha({
  nome,
  valor,
}: {
  nome: string;
  valor: string;
}) {
  return (
    <div className="bg-slate-900/40 border border-slate-700 rounded-xl p-3">
      <p className="text-xs uppercase tracking-wide text-slate-400">
        {nome}
      </p>

      <p className="text-white font-semibold mt-1 break-words">
        {valor}
      </p>
    </div>
  );
}