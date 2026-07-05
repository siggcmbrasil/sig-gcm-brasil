import { supabase } from "@/lib/supabase";

type AuditoriaProps = {
  modulo: string;
  acao: string;
  descricao: string;
  registro_id?: string | number | null;
  tabela?: string | null;
  status?: "SUCESSO" | "ERRO" | "ALERTA";
  detalhes?: any;
};

export async function registrarAuditoria({
  modulo,
  acao,
  descricao,
  registro_id = null,
  tabela = null,
  status = "SUCESSO",
  detalhes = null,
}: AuditoriaProps) {
  try {
    const usuario = JSON.parse(
      localStorage.getItem("usuarioLogado") || "{}"
    );

    if (!usuario?.municipio_id) return;

    const { error } = await supabase.from("auditoria").insert({
      municipio_id: usuario.municipio_id,
      guarda_id: usuario.id || null,
      usuario_nome: usuario.nome || "Usuário não informado",
      usuario_email: usuario.email || null,
      perfil: usuario.perfil || null,
      modulo,
      acao,
      descricao,
      registro_id: registro_id ? String(registro_id) : null,
      tabela,
      status,
      dispositivo:
        typeof navigator !== "undefined" ? navigator.userAgent : null,
      detalhes,
      criado_em: new Date().toISOString(),
    });

    if (error) {
      console.error("Erro ao registrar auditoria:", error);
    }
  } catch (error) {
    console.error("Erro ao registrar auditoria:", error);
  }
}