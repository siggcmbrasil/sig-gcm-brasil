import { supabase } from "@/lib/supabase";

export async function salvarLogSIGIA(
  usuarioId: string | undefined,
  pergunta: string,
  resposta: string,
  agente: string
) {
  await supabase.from("sigia_logs").insert({
    usuario_id: usuarioId,
    pergunta,
    resposta,
    agente,
  });
}