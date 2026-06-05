"use client";

import { useState } from "react";
import jsPDF from "jspdf";
import { supabase } from "@/lib/supabase";
import ProtecaoPerfil from "@/components/ProtecaoPerfil";

type Ocorrencia = {
  id: number;
  protocolo: string;
  tipo: string;
  local: string;
  data: string;
  hora: string;
  status: string;
};

type Chamado = {
  id: number;
  solicitante: string | null;
  tipo: string | null;
  local: string | null;
  status: string | null;
  data: string | null;
  hora: string | null;
};

type Patrulhamento = {
  id: number;
  data: string | null;
  hora_inicio: string | null;
  hora_fim: string | null;
  viatura: string | null;
  equipe: string | null;
  roteiro: string | null;
  observacao: string | null;
};

type Escala = {
  id: number;
  data_servico: string;
  turno: string;
  guarda_nome: string;
  matricula: string | null;
  equipe: string | null;
  viatura: string | null;
  funcao: string | null;
};

export default function RelatorioPlantao() {
  const [dataPlantao, setDataPlantao] = useState("");
  const [turno, setTurno] = useState("24 horas");
  const [comandante, setComandante] = useState("");
  const [observacoes, setObservacoes] = useState("");
  const [gerando, setGerando] = useState(false);

  async function gerarPDF() {
    if (!dataPlantao) {
      alert("Selecione a data do plantão.");
      return;
    }

    setGerando(true);

    const { data: ocorrencias } = await supabase
      .from("ocorrencias")
      .select("id, protocolo, tipo, local, data, hora, status")
      .eq("data", dataPlantao)
      .order("hora", { ascending: true });

    const { data: chamados } = await supabase
      .from("chamados")
      .select("*")
      .eq("data", dataPlantao)
      .order("id", { ascending: true });

    const { data: patrulhamentos } = await supabase
      .from("patrulhamento")
      .select("*")
      .eq("data", dataPlantao)
      .order("id", { ascending: true });

    const { data: escalas } = await supabase
      .from("escalas_servico")
      .select("*")
      .eq("data_servico", dataPlantao)
      .order("turno", { ascending: true });

    setGerando(false);

    const pdf = new jsPDF();
    let y = 15;

    try {
      const brasao = await carregarImagemBase64("/brasao-gcm-v2.png");
      pdf.addImage(brasao, "PNG", 15, 8, 22, 22);
    } catch {
      console.warn("Brasão não carregado.");
    }

    pdf.setFontSize(15);
    pdf.text("GUARDA CIVIL MUNICIPAL DE BIRITINGA", 105, 16, {
      align: "center",
    });

    pdf.setFontSize(12);
    pdf.text("RELATÓRIO DE PLANTÃO", 105, 24, {
      align: "center",
    });

    pdf.line(15, 35, 195, 35);

    y = 45;

    pdf.setFontSize(11);
    pdf.text(`Data do plantão: ${dataPlantao}`, 15, y);
    y += 8;
    pdf.text(`Turno: ${turno}`, 15, y);
    y += 8;
    pdf.text(`Comandante: ${comandante || "-"}`, 15, y);
    y += 12;

    y = tituloSecao(pdf, "1. EQUIPE ESCALADA", y);

    if (!escalas || escalas.length === 0) {
      pdf.text("Nenhuma escala cadastrada para esta data.", 15, y);
      y += 8;
    } else {
      escalas.forEach((item: Escala) => {
        y = verificarPagina(pdf, y);

        pdf.text(
          `• ${item.guarda_nome} | Matrícula: ${item.matricula || "-"} | Função: ${item.funcao || "-"} | Viatura: ${item.viatura || "-"}`,
          15,
          y
        );
        y += 7;
      });
    }

    y += 6;
    y = tituloSecao(pdf, "2. OCORRÊNCIAS REGISTRADAS", y);

    if (!ocorrencias || ocorrencias.length === 0) {
      pdf.text("Nenhuma ocorrência registrada no plantão.", 15, y);
      y += 8;
    } else {
      ocorrencias.forEach((item: Ocorrencia) => {
        y = verificarPagina(pdf, y);

        const texto = `${item.hora || "-"} | ${item.protocolo} | ${item.tipo} | ${item.local} | ${item.status}`;
        const linhas = pdf.splitTextToSize(texto, 175);

        pdf.text(linhas, 15, y);
        y += linhas.length * 6 + 4;
      });
    }

    y += 6;
    y = tituloSecao(pdf, "3. CHAMADOS ATENDIDOS", y);

    if (!chamados || chamados.length === 0) {
      pdf.text("Nenhum chamado registrado no plantão.", 15, y);
      y += 8;
    } else {
      chamados.forEach((item: Chamado) => {
        y = verificarPagina(pdf, y);

        const texto = `${item.hora || "-"} | ${item.tipo || "Chamado"} | ${item.local || "-"} | Solicitante: ${item.solicitante || "-"} | ${item.status || "-"}`;
        const linhas = pdf.splitTextToSize(texto, 175);

        pdf.text(linhas, 15, y);
        y += linhas.length * 6 + 4;
      });
    }

    y += 6;
    y = tituloSecao(pdf, "4. PATRULHAMENTOS / RONDAS", y);

    if (!patrulhamentos || patrulhamentos.length === 0) {
      pdf.text("Nenhum patrulhamento registrado no plantão.", 15, y);
      y += 8;
    } else {
      patrulhamentos.forEach((item: Patrulhamento) => {
        y = verificarPagina(pdf, y);

        const texto = `Viatura: ${item.viatura || "-"} | Início: ${item.hora_inicio || "-"} | Fim: ${item.hora_fim || "-"} | Equipe: ${item.equipe || "-"} | Roteiro: ${item.roteiro || "-"} | Obs: ${item.observacao || "-"}`;
        const linhas = pdf.splitTextToSize(texto, 175);

        pdf.text(linhas, 15, y);
        y += linhas.length * 6 + 4;
      });
    }

    y += 6;
    y = tituloSecao(pdf, "5. OBSERVAÇÕES DO PLANTÃO", y);

    const obs = pdf.splitTextToSize(
      observacoes || "Sem observações adicionais.",
      175
    );

    pdf.text(obs, 15, y);
    y += obs.length * 6 + 20;

    y = verificarPagina(pdf, y + 20);

    pdf.line(20, y, 90, y);
    pdf.line(115, y, 185, y);

    y += 7;

    pdf.text("Plantonista", 38, y);
    pdf.text("Comandante", 137, y);

    pdf.save(`RELATORIO-PLANTAO-${dataPlantao}.pdf`);
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

  function tituloSecao(pdf: jsPDF, titulo: string, y: number) {
    y = verificarPagina(pdf, y);

    pdf.setFontSize(12);
    pdf.text(titulo, 15, y);
    pdf.line(15, y + 2, 195, y + 2);

    pdf.setFontSize(10);
    return y + 8;
  }

  function verificarPagina(pdf: jsPDF, y: number) {
    if (y > 270) {
      pdf.addPage();
      return 20;
    }

    return y;
  }

  return (
    <ProtecaoPerfil perfisPermitidos={["ADMIN", "COMANDANTE", "CMT_GUARNICAO"]}>
      <div className="p-3 md:p-6 pb-24">
        <header className="border-b border-slate-800 pb-5 mb-6">
          <h1 className="text-2xl md:text-3xl font-bold">
            Relatório de Plantão
          </h1>

          <p className="text-slate-400 text-sm md:text-base">
            Gere um PDF com equipe, ocorrências, chamados e patrulhamentos do plantão.
          </p>
        </header>

        <section className="card max-w-3xl">
          <h2 className="text-xl md:text-2xl font-bold mb-4">
            Dados do Relatório
          </h2>

          <div className="space-y-4">
            <div>
              <label className="label">Data do plantão</label>
              <input
                type="date"
                className="input"
                value={dataPlantao}
                onChange={(e) => setDataPlantao(e.target.value)}
              />
            </div>

            <div>
              <label className="label">Turno</label>
              <select
                className="input"
                value={turno}
                onChange={(e) => setTurno(e.target.value)}
              >
                <option>06h às 18h</option>
                <option>18h às 06h</option>
                <option>24 horas</option>
                <option>Administrativo</option>
                <option>Evento</option>
                <option>Extra</option>
              </select>
            </div>

            <div>
              <label className="label">Comandante</label>
              <input
                className="input"
                value={comandante}
                onChange={(e) => setComandante(e.target.value)}
                placeholder="Nome do comandante do plantão"
              />
            </div>

            <div>
              <label className="label">Observações finais</label>
              <textarea
                className="input h-36 resize-none"
                value={observacoes}
                onChange={(e) => setObservacoes(e.target.value)}
                placeholder="Informações gerais do plantão, alterações, novidades ou pendências..."
              />
            </div>

            <button
              type="button"
              onClick={gerarPDF}
              disabled={gerando}
              className="btn-primary w-full text-lg disabled:opacity-50"
            >
              {gerando ? "Gerando PDF..." : "Gerar PDF do Plantão"}
            </button>
          </div>
        </section>
      </div>
    </ProtecaoPerfil>
  );
}