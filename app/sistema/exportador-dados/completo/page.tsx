"use client";

import { Download, Database } from "lucide-react";
import { supabase } from "@/lib/supabase";
import SigCard from "@/components/sig/SigCard";
import SigPageHeader from "@/components/sig/SigPageHeader";

export default function ExportacaoCompletaPage() {
  function pegarUsuario() {
    return JSON.parse(
      localStorage.getItem("usuarioLogado") || "{}"
    );
  }

  async function registrarAuditoria() {
    const usuario = pegarUsuario();

    await supabase.from("auditoria_sistema").insert({
      municipio_id: usuario.municipio_id,
      usuario_id: usuario.id,
      modulo: "EXPORTADOR_DADOS",
      acao: "EXPORTACAO_COMPLETA",
      detalhes: "Exportou todos os dados do município.",
    });
  }

  async function exportar() {
    const usuario = pegarUsuario();

    if (!usuario?.municipio_id) {
      alert("Município não identificado.");
      return;
    }

    const municipioId = usuario.municipio_id;

    const [
      guardas,
      usuarios,
      ocorrencias,
      viaturas,
      chamados,
      patrulhamentos,
      guarnicoes,
      locais,
      equipamentos,
      pessoas,
      veiculos,
    ] = await Promise.all([
      supabase
        .from("guardas")
        .select("*")
        .eq("municipio_id", municipioId),

      supabase
        .from("usuarios")
        .select("*")
        .eq("municipio_id", municipioId),

      supabase
        .from("ocorrencias")
        .select("*")
        .eq("municipio_id", municipioId),

      supabase
        .from("viaturas")
        .select("*")
        .eq("municipio_id", municipioId),

      supabase
        .from("chamados")
        .select("*")
        .eq("municipio_id", municipioId),

      supabase
        .from("patrulhamentos")
        .select("*")
        .eq("municipio_id", municipioId),

      supabase
        .from("guarnicoes")
        .select("*")
        .eq("municipio_id", municipioId),

      supabase
        .from("locais")
        .select("*")
        .eq("municipio_id", municipioId),

      supabase
        .from("equipamentos")
        .select("*")
        .eq("municipio_id", municipioId),

      supabase
        .from("pessoas_abordadas")
        .select("*")
        .eq("municipio_id", municipioId),

      supabase
        .from("veiculos_abordados")
        .select("*")
        .eq("municipio_id", municipioId),
    ]);

    const backup = {
      municipio_id: municipioId,
      data_exportacao: new Date().toISOString(),

      guardas: guardas.data || [],
      usuarios: usuarios.data || [],
      ocorrencias: ocorrencias.data || [],
      viaturas: viaturas.data || [],
      chamados: chamados.data || [],
      patrulhamentos: patrulhamentos.data || [],
      guarnicoes: guarnicoes.data || [],
      locais: locais.data || [],
      equipamentos: equipamentos.data || [],
      pessoas_abordadas: pessoas.data || [],
      veiculos_abordados: veiculos.data || [],
    };

    const blob = new Blob(
      [JSON.stringify(backup, null, 2)],
      {
        type: "application/json",
      }
    );

    const url =
      window.URL.createObjectURL(blob);

    const a =
      document.createElement("a");

    a.href = url;
    a.download =
      `backup-${municipioId}-${Date.now()}.json`;

    a.click();

    window.URL.revokeObjectURL(url);

    await registrarAuditoria();

    alert("Backup exportado com sucesso.");
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      <SigPageHeader
        titulo="Exportação Completa"
        subtitulo="Exportar todos os dados do município."
        icone={Database}
      />

      <SigCard>
        <div className="text-center py-10">
          <Database className="w-20 h-20 text-cyan-400 mx-auto mb-5" />

          <h2 className="text-3xl font-black">
            Backup Completo
          </h2>

          <p className="text-slate-400 mt-3 max-w-2xl mx-auto">
            Gere um arquivo JSON contendo todos os
            dados do município para backup,
            migração ou restauração.
          </p>

          <button
            onClick={exportar}
            className="
              mt-8
              inline-flex
              items-center
              gap-3
              bg-cyan-600
              hover:bg-cyan-500
              px-8
              py-4
              rounded-2xl
              font-black
            "
          >
            <Download className="w-6 h-6" />
            Exportar Dados
          </button>
        </div>
      </SigCard>
    </div>
  );
}