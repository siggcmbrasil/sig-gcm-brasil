"use client";

import { Download, FileSpreadsheet, Upload, Database } from "lucide-react";

import { supabase } from "@/lib/supabase";
import { registrarAuditoria } from "@/lib/auditoria";
import SigCard from "@/components/sig/SigCard";
import SigPageHeader from "@/components/sig/SigPageHeader";

export default function CSVPage() {
  function pegarUsuario() {
    return JSON.parse(localStorage.getItem("usuarioLogado") || "{}");
  }

  function gerarCSV(dados: any[]) {
    if (dados.length === 0) return "";

    const colunas = Object.keys(dados[0]);

    const cabecalho = colunas.join(";");

    const linhas = dados.map((item) =>
      colunas
        .map((coluna) => {
          const valor = item[coluna] ?? "";
          return `"${String(valor).replace(/"/g, '""')}"`;
        })
        .join(";")
    );

    return [cabecalho, ...linhas].join("\n");
  }

  function baixarArquivo(conteudo: string, nomeArquivo: string) {
    const blob = new Blob([conteudo], {
      type: "text/csv;charset=utf-8;",
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

    const csv = gerarCSV(data);

    baixarArquivo(csv, arquivo);

    await registrarAuditoria({
      modulo: "Importador CSV",
      acao,
      tabela,
      descricao: `Exportou dados da tabela ${tabela} em CSV.`,
      detalhes: {
        tabela,
        arquivo,
        quantidade: data.length,
      },
    });

    alert("CSV exportado com sucesso.");
  }

  function baixarModeloGuardas() {
    const modelo = [
      "matricula;nome;cargo;telefone;cpf;email;status",
      '"GCM-001";"JOÃO DA SILVA";"GUARDA MUNICIPAL";"(75) 99999-9999";"00000000000";"email@exemplo.com";"Em serviço"',
    ].join("\n");

    baixarArquivo(modelo, "modelo-guardas.csv");
  }

  function baixarModeloOcorrencias() {
    const modelo = [
      "tipo;data;hora;local;relato;status",
      '"Perturbação do sossego";"2026-07-04";"20:30";"Praça Municipal";"Relato da ocorrência";"FINALIZADA"',
    ].join("\n");

    baixarArquivo(modelo, "modelo-ocorrencias.csv");
  }

  return (
    <div className="p-4 md:p-6 pb-24 space-y-6">
      <SigPageHeader
        titulo="CSV"
        subtitulo="Importação e exportação de dados em formato CSV."
        icone={FileSpreadsheet}
      />

      <SigCard>
        <div className="flex items-start gap-4">
          <div className="rounded-2xl bg-yellow-500/10 border border-yellow-500/30 p-4">
            <Database className="w-10 h-10 text-yellow-400" />
          </div>

          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-yellow-400 font-bold">
              Ferramenta Administrativa
            </p>

            <h2 className="text-2xl md:text-3xl font-black text-white mt-1">
              Central CSV
            </h2>

            <p className="text-slate-400 mt-2 max-w-3xl leading-relaxed">
              Exporte dados do município em CSV e baixe modelos padronizados
              para futuras importações.
            </p>
          </div>
        </div>
      </SigCard>

      <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-4">
        <CardAcao
          titulo="Exportar Guardas"
          descricao="Gerar CSV dos guardas cadastrados."
          icone={Download}
          onClick={() =>
            exportarTabela("guardas", "guardas.csv", "EXPORTAR_GUARDAS_CSV")
          }
        />

        <CardAcao
          titulo="Exportar Ocorrências"
          descricao="Gerar CSV das ocorrências."
          icone={Download}
          onClick={() =>
            exportarTabela(
              "ocorrencias",
              "ocorrencias.csv",
              "EXPORTAR_OCORRENCIAS_CSV"
            )
          }
        />

        <CardAcao
          titulo="Modelo Guardas"
          descricao="Baixar modelo CSV de guardas."
          icone={FileSpreadsheet}
          onClick={baixarModeloGuardas}
        />

        <CardAcao
          titulo="Modelo Ocorrências"
          descricao="Baixar modelo CSV de ocorrências."
          icone={FileSpreadsheet}
          onClick={baixarModeloOcorrencias}
        />
      </div>

      <SigCard>
        <div className="text-center py-12">
          <Upload className="w-16 h-16 mx-auto text-slate-600 mb-4" />

          <h3 className="text-xl font-black text-white">
            Importação em lote
          </h3>

          <p className="text-slate-400 mt-2">
            A importação real com validação, pré-visualização e gravação segura
            será feita em uma tela separada para evitar erro em massa.
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