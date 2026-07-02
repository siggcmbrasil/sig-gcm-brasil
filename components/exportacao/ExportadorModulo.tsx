"use client";

import { Download } from "lucide-react";
import { supabase } from "@/lib/supabase";
import SigCard from "@/components/sig/SigCard";
import SigPageHeader from "@/components/sig/SigPageHeader";

type Props = {
  titulo: string;
  subtitulo: string;
  tabela: string;
  arquivo: string;
  acao: string;
};

export default function ExportadorModulo({
  titulo,
  subtitulo,
  tabela,
  arquivo,
  acao,
}: Props) {
  function pegarUsuario() {
    return JSON.parse(
      localStorage.getItem("usuarioLogado") || "{}"
    );
  }

  async function exportar() {
    const usuario = pegarUsuario();

    const { data, error } = await supabase
      .from(tabela)
      .select("*")
      .eq("municipio_id", usuario.municipio_id);

    if (error) {
      alert("Erro ao exportar.");
      return;
    }

    const blob = new Blob(
      [JSON.stringify(data, null, 2)],
      {
        type: "application/json",
      }
    );

    const url =
      window.URL.createObjectURL(blob);

    const a =
      document.createElement("a");

    a.href = url;
    a.download = arquivo;
    a.click();

    window.URL.revokeObjectURL(url);

    await supabase
      .from("auditoria_sistema")
      .insert({
        municipio_id: usuario.municipio_id,
        usuario_id: usuario.id,
        modulo: "EXPORTADOR_DADOS",
        acao,
        detalhes: `Exportou ${titulo}.`,
      });

    await supabase
      .from("exportacoes_sistema")
      .insert({
        municipio_id: usuario.municipio_id,
        usuario_id: usuario.id,
        modulo: titulo,
        arquivo,
      });

    alert("Exportação concluída.");
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      <SigPageHeader
        titulo={titulo}
        subtitulo={subtitulo}
        icone={Download}
      />

      <SigCard>
        <div className="text-center py-10">
          <Download className="w-20 h-20 text-cyan-400 mx-auto mb-5" />

          <h2 className="text-3xl font-black">
            {titulo}
          </h2>

          <p className="text-slate-400 mt-3">
            Exportar dados em JSON.
          </p>

          <button
            onClick={exportar}
            className="
              mt-8
              bg-cyan-600
              hover:bg-cyan-500
              px-8
              py-4
              rounded-2xl
              font-black
            "
          >
            Exportar
          </button>
        </div>
      </SigCard>
    </div>
  );
}