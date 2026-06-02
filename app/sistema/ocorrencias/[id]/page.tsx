"use client";

import Image from "next/image";
import Link from "next/link";
import jsPDF from "jspdf";
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

  async function gerarPDF() {
    if (!ocorrencia) return;

    const pdf = new jsPDF();

    pdf.setFontSize(16);
    pdf.text("PREFEITURA MUNICIPAL DE BIRITINGA", 20, 20);
    pdf.text("GUARDA CIVIL MUNICIPAL", 20, 30);

    pdf.setFontSize(12);
    pdf.text(`Protocolo: ${ocorrencia.protocolo}`, 20, 50);
    pdf.text(`Tipo: ${ocorrencia.tipo}`, 20, 60);
    pdf.text(`Status: ${ocorrencia.status}`, 20, 70);
    pdf.text(`Data: ${ocorrencia.data}`, 20, 80);
    pdf.text(`Hora: ${ocorrencia.hora}`, 20, 90);
    pdf.text(`Bairro: ${ocorrencia.bairro || "-"}`, 20, 100);
    pdf.text(`Local: ${ocorrencia.local}`, 20, 110);
    pdf.text(`Número: ${ocorrencia.numero || "S/N"}`, 20, 120);
    pdf.text(`Viatura: ${ocorrencia.viatura_empenhada || "-"}`, 20, 130);

    pdf.text("Equipe empenhada:", 20, 145);
    pdf.text(
      pdf.splitTextToSize(ocorrencia.equipe_empenhada || "Não informada.", 170),
      20,
      155
    );

    pdf.text("Descrição:", 20, 180);
    pdf.text(pdf.splitTextToSize(ocorrencia.descricao, 170), 20, 190);

    pdf.text("__________________________________", 20, 270);
    pdf.text("Assinatura do Guarda Responsável", 20, 278);

    if (ocorrencia.foto_url) {
      try {
        const imagemBase64 = await carregarImagemBase64(ocorrencia.foto_url);
        pdf.addPage();
        pdf.setFontSize(16);
        pdf.text("Foto da Ocorrência", 20, 20);
        pdf.addImage(imagemBase64, "JPEG", 20, 35, 170, 120);
      } catch {
        alert("PDF gerado, mas não foi possível incluir a foto.");
      }
    }

    pdf.save(`${ocorrencia.protocolo}.pdf`);
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
          <h2 className="text-xl font-bold">Foto da Ocorrência</h2>

          {ocorrencia.foto_url ? (
            <div className="flex justify-center">
              <Image
                src={ocorrencia.foto_url}
                alt="Foto da ocorrência"
                width={900}
                height={600}
                className="rounded-xl object-contain w-full"
              />
            </div>
          ) : (
            <p className="text-slate-400">Nenhuma foto anexada.</p>
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