import { supabase } from "@/lib/supabase";

export async function gerarBackupAutomatico(
  usuario: any,
  nome = "backup"
) {
  const municipioId = usuario.municipio_id;

  const { data: guardas } = await supabase
    .from("guardas")
    .select("*")
    .eq("municipio_id", municipioId);

  const { data: ocorrencias } = await supabase
    .from("ocorrencias")
    .select("*")
    .eq("municipio_id", municipioId);

  const { data: viaturas } = await supabase
    .from("viaturas")
    .select("*")
    .eq("municipio_id", municipioId);

  const backup = {
    municipio_id: municipioId,
    data: new Date().toISOString(),
    guardas: guardas || [],
    ocorrencias: ocorrencias || [],
    viaturas: viaturas || [],
  };

  const conteudo = JSON.stringify(backup, null, 2);

  const nomeArquivo = `${nome}_${Date.now()}.json`;

  const blob = new Blob([conteudo], {
    type: "application/json",
  });

  const caminho = `${municipioId}/${nomeArquivo}`;

  const { error: uploadError } = await supabase.storage
    .from("backups")
    .upload(caminho, blob);

  if (uploadError) {
    throw uploadError;
  }

  const { data } = supabase.storage
    .from("backups")
    .getPublicUrl(caminho);

  const { error } = await supabase
    .from("backups_sistema")
    .insert({
      municipio_id: municipioId,
      usuario_id: usuario.id,
      nome: nomeArquivo,
      tipo: nome.includes("pre_") ? "AUTOMATICO" : "MANUAL",
      modulo: "COMPLETO",
      formato: "JSON",
      status: "GERADO",
      tamanho: `${Math.ceil(conteudo.length / 1024)} KB`,
      arquivo_url: data.publicUrl,
      observacao: nome.includes("pre_")
        ? "Backup automático de segurança."
        : "Backup manual gerado pelo painel administrativo.",
    });

  if (error) {
    throw error;
  }
}