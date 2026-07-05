"use client";

import {
  Download,
  FileSpreadsheet,
  FileUp,
  Table,
} from "lucide-react";

import { supabase } from "@/lib/supabase";
import { registrarAuditoria } from "@/lib/auditoria";
import SigCard from "@/components/sig/SigCard";
import SigPageHeader from "@/components/sig/SigPageHeader";

export default function ExcelPage() {
  function pegarUsuario() {
    return JSON.parse(localStorage.getItem("usuarioLogado") || "{}");
  }

  function gerarExcelHtml(dados: any[]) {
    if (dados.length === 0) return "";

    const colunas = Object.keys(dados[0]);

    const linhas = dados
      .map(
        (item) => `
          <tr>
            ${colunas
              .map(
                (coluna) =>
                  `<td>${String(item[coluna] ?? "").replace(/</g, "&lt;")}</td>`
              )
              .join("")}
          </tr>
        `
      )
      .join("");

    return `
      <html>
        <head>
          <meta charset="UTF-8" />
        </head>
        <body>
          <table border="1">
            <thead>
              <tr>
                ${colunas.map((c) => `<th>${c}</th>`).join("")}
              </tr>
            </thead>
            <tbody>
              ${linhas}
            </tbody>
          </table>
        </body>
      </html>
    `;
  }

  function baixarArquivo(conteudo: string, nomeArquivo: string) {
    const blob = new Blob([conteudo], {
      type: "application/vnd.ms-excel;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");

    a.href = url;
    a.download = nomeArquivo;
    a.click();

    URL.revokeObjectURL(url);
  }

  async function exportarTabela(tabela: string, arquivo: string, acao: string) {
    const usuario = pegarUsuario();

    if (!usuario?.municipio_id) {
      alert("Município não identificado.");
      return;
    }

    const { data, error } = await supabase
      .from(tabela)
      .select("*")
      .eq("municipio_id", usuario.municipio_id);

    if (error) {
      console.error(error);
      alert(`Erro ao exportar ${tabela}.`);
      return;
    }

    if (!data || data.length === 0) {
      alert("Nenhum dado encontrado para exportar.");
      return;
    }

    const excel = gerarExcelHtml(data);

    baixarArquivo(excel, arquivo);

    await registrarAuditoria({
      modulo: "Excel",
      acao,
      tabela,
      descricao: `Exportou dados da tabela ${tabela} em Excel.`,
      detalhes: {
        tabela,
        arquivo,
        quantidade: data.length,
      },
    });

    alert("Excel exportado com sucesso.");
  }

  function baixarModeloGuardas() {
    const modelo = gerarExcelHtml([
      {
        matricula: "GCM-001",
        nome: "JOÃO DA SILVA",
        cargo: "GUARDA MUNICIPAL",
        telefone: "(75) 99999-9999",
        cpf: "00000000000",
        email: "email@exemplo.com",
        status: "Em serviço",
      },
    ]);

    baixarArquivo(modelo, "modelo-guardas.xls");
  }

  function baixarModeloOcorrencias() {
    const modelo = gerarExcelHtml([
      {
        tipo: "Perturbação do sossego",
        data: "2026-07-04",
        hora: "20:30",
        local: "Praça Municipal",
        relato: "Relato da ocorrência",
        status: "FINALIZADA",
      },
    ]);

    baixarArquivo(modelo, "modelo-ocorrencias.xls");
  }

  return (
    <div className="p-4 md:p-6 pb-24 space-y-6">
      <SigPageHeader
        titulo="Excel"
        subtitulo="Exportação de dados em planilhas compatíveis com Excel."
        icone={Table}
      />

      <SigCard>
        <div className="flex items-start gap-4">
          <div className="rounded-2xl bg-yellow-500/10 border border-yellow-500/30 p-4">
            <FileSpreadsheet className="w-10 h-10 text-yellow-400" />
          </div>

          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-yellow-400 font-bold">
              Área Administrativa
            </p>

            <h2 className="text-2xl md:text-3xl font-black text-white mt-1">
              Central Excel
            </h2>

            <p className="text-slate-400 mt-2 max-w-3xl leading-relaxed">
              Exporte dados do município em formato compatível com Excel e
              baixe modelos padronizados para organização dos dados.
            </p>
          </div>
        </div>
      </SigCard>

      <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-4">
        <CardAcao
          titulo="Exportar Guardas"
          descricao="Gerar planilha dos guardas."
          icone={Download}
          onClick={() =>
            exportarTabela("guardas", "guardas.xls", "EXPORTAR_GUARDAS_EXCEL")
          }
        />

        <CardAcao
          titulo="Exportar Ocorrências"
          descricao="Gerar planilha das ocorrências."
          icone={Download}
          onClick={() =>
            exportarTabela(
              "ocorrencias",
              "ocorrencias.xls",
              "EXPORTAR_OCORRENCIAS_EXCEL"
            )
          }
        />

        <CardAcao
          titulo="Modelo Guardas"
          descricao="Baixar modelo para guardas."
          icone={FileSpreadsheet}
          onClick={baixarModeloGuardas}
        />

        <CardAcao
          titulo="Modelo Ocorrências"
          descricao="Baixar modelo para ocorrências."
          icone={FileSpreadsheet}
          onClick={baixarModeloOcorrencias}
        />
      </div>

      <SigCard>
        <div className="text-center py-12">
          <FileUp className="w-16 h-16 mx-auto text-slate-600 mb-4" />

          <h3 className="text-xl font-black text-white">
            Importação de Excel
          </h3>

          <p className="text-slate-400 mt-2 max-w-2xl mx-auto">
            A importação real de XLS/XLSX precisa de validação, pré-visualização
            e confirmação antes de gravar no banco. Por segurança, será feita em
            uma tela separada.
          </p>
        </div>
      </SigCard>
    </div>
  );
}

function CardAcao({
  titulo,
  descricao,
  icone: Icone,
  onClick,
}: {
  titulo: string;
  descricao: string;
  icone: any;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-2xl border border-slate-800 bg-slate-950/70 p-5 text-left hover:border-yellow-500/60 transition"
    >
      <Icone className="w-8 h-8 text-yellow-400 mb-3" />

      <h3 className="text-lg font-black text-white">{titulo}</h3>

      <p className="text-sm text-slate-400 mt-2">{descricao}</p>
    </button>
  );
}