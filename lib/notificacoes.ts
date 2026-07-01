import { supabase } from "@/lib/supabase";

type NovaNotificacao = {
  municipio_id: number;
  usuario_id?: string | null;
  perfil_destino?: string | null;
  titulo: string;
  mensagem: string;
  tipo?: "INFO" | "ALERTA" | "SUCESSO";
  link?: string | null;
};

export async function criarNotificacao(dados: NovaNotificacao) {
  const { error } = await supabase.from("notificacoes").insert([
    {
      municipio_id: dados.municipio_id,
      usuario_id: dados.usuario_id || null,
      perfil_destino: dados.perfil_destino || null,
      titulo: dados.titulo,
      mensagem: dados.mensagem,
      tipo: dados.tipo || "INFO",
      link: dados.link || null,
      lida: false,
    },
  ]);

  if (error) {
    console.error("Erro ao criar notificação:", error);
  }
}