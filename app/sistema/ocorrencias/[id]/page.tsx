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
  descricao: string;
  foto_url: string | null;
  fotos_urls: string | null;
  latitude: string | null;
  longitude: string | null;
  viatura_empenhada: string | null;
  equipe_empenhada: string | null;
  criado_em: string;
};

export default function VisualizarOcorrencia() {
  const params = useParams();
  const id = params.id;

  const [ocorrencia, setOcorrencia] = useState<Ocorrencia | null>(null);
  const [carregando, setCarregando] = useState(true);

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

  function obterEnvolvidos(): Envolvido[] {
    if (!ocorrencia?.envolvidos) return [];

    try {
      const dados = JSON.parse(ocorrencia.envolvidos);
      return Array.isArray(dados) ? dados : [];
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

  async function gerarPDF() {
    if (!ocorrencia) return;

    const pdf = new jsPDF();
    const envolvidos = obterEnvolvidos();
    const fotos = obterFotos();

    let brasaoBase64 = "";
    let qrCodeBase64 = "";

    try {
      brasaoBase64 = await carregarImagemBase64("/brasao-gcm-v2.png");
    } catch {
      console.warn("Não foi possível carregar o brasão.");
    }

    try {
      const textoQr = `
SIG-GCM BIRITINGA
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

    pdf.setFontSize(12);
    pdf.text("RELATÓRIO DE OCORRÊNCIA", 105, 35, {
      align: "center",
    });

    if (qrCodeBase64) {
      pdf.addImage(qrCodeBase64, "PNG", 170, 10, 25, 25);
    }

    pdf.line(15, 42, 195, 42);

    let y = 55;

    pdf.setFontSize(12);
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

    if (ocorrencia.latitude && ocorrencia.longitude) {
      pdf.text(`Latitude: ${ocorrencia.latitude}`, 15, y);
      y += 8;
      pdf.text(`Longitude: ${ocorrencia.longitude}`, 15, y);
      y += 12;
    }

    pdf.setFontSize(14);
    pdf.text("VIATURA EMPENHADA", 15, y);
    y += 8;

    pdf.setFontSize(12);
    pdf.text(ocorrencia.viatura_empenhada || "Não informada", 15, y);
    y += 14;

    pdf.setFontSize(14);
    pdf.text("EQUIPE EMPENHADA", 15, y);
    y += 8;

    pdf.setFontSize(12);
    const equipe = pdf.splitTextToSize(
      ocorrencia.equipe_empenhada || "Equipe não informada.",
      170
    );

    pdf.text(equipe, 15, y);
    y += equipe.length * 7 + 10;

    pdf.setFontSize(14);
    pdf.text("DESCRIÇÃO DOS FATOS", 15, y);
    y += 8;

    pdf.setFontSize(12);
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

    pdf.line(15, 265, 90, 265);
    pdf.text("Guarda Responsável", 15, 273);

    pdf.line(110, 265, 190, 265);
    pdf.text("Supervisor", 110, 273);

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
  }, []);

  if (carregando) {
    return <div className="p-6 text-slate-400">Carregando ocorrência...</div>;
  }

  if (!ocorrencia) {
    return <div className="p-6 text-slate-400">Ocorrência não encontrada.</div>;
  }

  const envolvidos = obterEnvolvidos();
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

      <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="card space-y-4">
          <h2 className="text-xl font-bold">Dados principais</h2>
          <Linha nome="Protocolo" valor={ocorrencia.protocolo} />
          <Linha nome="Tipo" valor={ocorrencia.tipo} />
          <Linha nome="Status" valor={ocorrencia.status} />
          <Linha nome="Data" valor={ocorrencia.data} />
          <Linha nome="Hora" valor={ocorrencia.hora} />
        </div>

        <div className="card space-y-4">
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

        <div className="card space-y-4">
          <h2 className="text-xl font-bold">Equipe Empenhada</h2>
          <Linha nome="Viatura" valor={ocorrencia.viatura_empenhada || "-"} />

          <div>
            <p className="text-slate-400 mb-2">Guardas</p>
            <pre className="whitespace-pre-wrap text-white font-sans">
              {ocorrencia.equipe_empenhada || "Equipe não informada."}
            </pre>
          </div>
        </div>

        <div className="card space-y-4">
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
                  className="bg-slate-950/40 border border-slate-700 rounded-xl p-4 space-y-2"
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
            Fotos da Ocorrência
          </h2>

          {fotos.length === 0 ? (
            <p className="text-slate-400">Nenhuma foto anexada.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {fotos.map((foto, index) => (
                <div
                  key={foto}
                  className="bg-slate-950/40 border border-slate-700 rounded-xl p-3"
                >
                  <p className="text-slate-400 text-sm mb-2">
                    Foto {index + 1}
                  </p>

                  <Image
                    src={foto}
                    alt={`Foto ${index + 1} da ocorrência`}
                    width={900}
                    height={600}
                    className="rounded-xl object-contain w-full h-auto max-w-sm"
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
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