"use client";

import { useState } from "react";
import { Upload, ShieldAlert, FileJson } from "lucide-react";

import { supabase } from "@/lib/supabase";
import SigCard from "@/components/sig/SigCard";
import SigPageHeader from "@/components/sig/SigPageHeader";
import { gerarBackupAutomatico } from "@/lib/backup";

export default function RestaurarBackupPage() {
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [carregando, setCarregando] = useState(false);

  function usuarioLogado() {
    return JSON.parse(localStorage.getItem("usuarioLogado") || "{}");
  }

  async function registrarAuditoria(
    acao: string,
    detalhes: string,
    registroId?: string
  ) {
    const usuario = usuarioLogado();

    await supabase.from("auditoria_sistema").insert({
      municipio_id: usuario.municipio_id,
      usuario_id: usuario.id,
      modulo: "BACKUP",
      acao,
      registro_id: registroId || null,
      detalhes,
    });
  }

  async function restaurarBackup() {
    if (!arquivo) {
      alert("Selecione um arquivo de backup.");
      return;
    }

    if (!arquivo.name.endsWith(".json")) {
      alert("Somente arquivos JSON são permitidos.");
      return;
    }

    const confirmar = confirm(
      "Atenção: restauração de backup é uma ação sensível. Deseja continuar?"
    );

    if (!confirmar) return;

    setCarregando(true);

    try {
      const texto = await arquivo.text();
      const dados = JSON.parse(texto);
      const usuario = usuarioLogado();

      if (Number(dados.municipio_id) !== Number(usuario.municipio_id)) {
        await registrarAuditoria(
          "ERRO_RESTAURAR_BACKUP",
          "Tentativa de restaurar backup de outro município."
        );

        alert("Este backup pertence a outro município.");
        setCarregando(false);
        return;
      }

      await gerarBackupAutomatico(
  usuario,
  "pre_restauracao"
);

if (dados.guardas?.length) {
  await supabase
    .from("guardas")
    .upsert(dados.guardas);
}

if (dados.ocorrencias?.length) {
  await supabase
    .from("ocorrencias")
    .upsert(dados.ocorrencias);
}

if (dados.viaturas?.length) {
  await supabase
    .from("viaturas")
    .upsert(dados.viaturas);
}

if (dados.chamados?.length) {
  await supabase
    .from("chamados")
    .upsert(dados.chamados);
}

if (dados.patrulhamentos?.length) {
  await supabase
    .from("patrulhamentos")
    .upsert(dados.patrulhamentos);
}

await registrarAuditoria(
  "RESTAURAR_BACKUP",
  `Backup restaurado: ${arquivo.name}`
);

alert("Backup restaurado com sucesso.");
await registrarAuditoria(
  "RESTAURAR_BACKUP",
  `Backup restaurado: ${arquivo.name}`
);
    } catch (error: any) {
      await registrarAuditoria(
        "ERRO_RESTAURAR_BACKUP",
        `Erro ao ler backup: ${error.message}`
      );

      alert("Erro ao ler o arquivo de backup.");
    }

    setCarregando(false);
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      <SigPageHeader
        titulo="Restaurar Backup"
        subtitulo="Importação controlada de arquivos de backup do SIG-GCM Brasil."
        icone={Upload}
      />

      <SigCard>
        <div className="flex items-start gap-4">
          <div className="rounded-2xl bg-red-500/10 border border-red-500/30 p-4">
            <ShieldAlert className="w-10 h-10 text-red-400" />
          </div>

          <div>
            <h2 className="text-2xl font-black text-white">
              Ação Sensível
            </h2>

            <p className="text-slate-400 mt-2">
              Toda tentativa de restauração será registrada na auditoria do
              sistema com usuário, município, data e detalhes da ação.
            </p>
          </div>
        </div>
      </SigCard>

      <SigCard>
        <div className="space-y-4">
          <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-950/50 p-8 text-center">
            <FileJson className="w-14 h-14 mx-auto text-blue-400 mb-4" />

            <h3 className="text-xl font-black text-white">
              Selecionar arquivo JSON
            </h3>

            <p className="text-slate-400 mt-2">
              Escolha um arquivo de backup gerado pelo SIG-GCM Brasil.
            </p>

            <input
              type="file"
              accept=".json"
              onChange={(e) => setArquivo(e.target.files?.[0] || null)}
              className="mt-6 text-sm text-slate-300"
            />

            {arquivo && (
              <p className="text-green-400 text-sm mt-4">
                Arquivo selecionado: {arquivo.name}
              </p>
            )}
          </div>

          <button
            onClick={restaurarBackup}
            disabled={carregando}
            className="w-full rounded-2xl bg-red-600 px-5 py-4 font-black text-white hover:bg-red-500 disabled:opacity-50"
          >
            {carregando ? "Validando backup..." : "Validar Restauração"}
          </button>
        </div>
      </SigCard>
    </div>
  );
}