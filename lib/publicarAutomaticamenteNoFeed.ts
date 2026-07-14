import { supabase } from "@/lib/supabase";

export type PublicacaoAutomaticaFeed = {
  municipioId: number;
  usuarioId: number | string;
  titulo: string;
  texto: string;
  modulo: string;
  registroId?: string | number;
  compartilharBrasil?: boolean;
  imagemUrl?: string;
};

export async function publicarAutomaticamenteNoFeed({
  municipioId,
  usuarioId,
  titulo,
  texto,
  modulo,
  registroId,
  compartilharBrasil = false,
  imagemUrl,
}: PublicacaoAutomaticaFeed) {
  const resposta = await supabase.from("feed_sig").insert({
    municipio_id: municipioId,
    usuario_id: usuarioId,
    titulo,
    texto,
    imagem_url: imagemUrl || null,
    tipo_publicacao: imagemUrl ? "IMAGEM" : "TEXTO",
    compartilhar_brasil: compartilharBrasil,
    visibilidade: compartilharBrasil ? "BRASIL" : "MUNICIPIO",
    status: "PUBLICADO",
    publicado_por_modulo: modulo,
    registro_origem_id:
      registroId === undefined ? null : String(registroId),
  });

  if (resposta.error) {
    throw resposta.error;
  }
}
