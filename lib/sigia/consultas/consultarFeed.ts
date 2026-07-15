import { supabase } from "@/lib/supabase";

export async function consultarFeed(
  mensagem: string,
  municipioId?: number
) {
  if (!municipioId) {
    return "Município não identificado.";
  }

  const { data, error } = await supabase
    .from("feed_sig")
    .select(
      "id,titulo,conteudo,autor,created_at"
    )
    .eq("municipio_id", municipioId)
    .order("created_at", {
      ascending: false,
    })
    .limit(10);

  if (error) {
    console.error(error);
    return "Não consegui consultar o Feed SIG.";
  }

  if (!data?.length) {
    return "Não existem comunicados publicados.";
  }

  return `Últimos comunicados

${data
  .map(
    (item) =>
      `• ${item.titulo}

${item.conteudo}

Autor: ${item.autor}
`
  )
  .join("\n---------------------\n")}`;
}