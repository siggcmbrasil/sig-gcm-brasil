import { supabase } from "@/lib/supabase";

export async function registrarAuditoria({
  modulo,
  acao,
  descricao,
}: {
  modulo: string;
  acao: string;
  descricao: string;
}) {
  const usuario = JSON.parse(
    localStorage.getItem("usuarioLogado") || "{}"
  );

  if (!usuario?.municipio_id) return;

  const { error } = await supabase.from("auditoria").insert({
    municipio_id: usuario.municipio_id,
    guarda_id: usuario.id,
    usuario_nome: usuario.nome || "Usuário não informado",
    modulo,
    acao,
    descricao,
    criado_em: new Date().toISOString(),
  });

  if (error) {
    console.error("Erro ao registrar auditoria:", error);
  }
}