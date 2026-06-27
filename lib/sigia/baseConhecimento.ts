import { supabase } from "@/lib/supabase";

export async function buscarConhecimentoSIGIA(
  pergunta: string,
  municipioId?: number
) {
  const texto = pergunta.trim();

  if (!texto) return null;

  let query = supabase
    .from("sigia_conhecimento")
    .select("titulo, categoria, conteudo, modulo")
    .eq("ativo", true)
    .or(
      `titulo.ilike.%${texto}%,conteudo.ilike.%${texto}%,palavras_chave.ilike.%${texto}%`
    )
    .limit(3);

  if (municipioId) {
    query = query.or(`municipio_id.is.null,municipio_id.eq.${municipioId}`);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Erro ao buscar conhecimento da SIGIA:", error);
    return null;
  }

  if (!data || data.length === 0) return null;

  return data
    .map(
      (item) =>
        `📚 ${item.titulo}\nCategoria: ${item.categoria}\n\n${item.conteudo}`
    )
    .join("\n\n---\n\n");
}