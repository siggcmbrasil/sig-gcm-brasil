import { supabase } from "@/lib/supabase";

function limparPalavras(texto: string) {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((p) => p.length >= 4)
    .slice(0, 8);
}

export async function buscarConhecimentoDocumentosSIGIA(
  pergunta: string,
  municipioId?: number | null
) {
  const palavras = limparPalavras(pergunta);

  if (palavras.length === 0) return null;

  let query = supabase
    .from("sigia_conhecimento")
    .select("titulo, conteudo, categoria, pagina, numero_trecho, municipio_id")
    .eq("status", "ATIVO")
    .limit(6);

  if (municipioId) {
    query = query.or(`municipio_id.eq.${municipioId},municipio_id.is.null`);
  }

  const { data, error } = await query;

  if (error || !data || data.length === 0) {
    return null;
  }

  const resultados = data
    .map((item) => {
      const texto = `${item.titulo} ${item.categoria} ${item.conteudo}`.toLowerCase();

      const pontos = palavras.reduce((total, palavra) => {
        return total + (texto.includes(palavra) ? 1 : 0);
      }, 0);

      return {
        ...item,
        pontos,
      };
    })
    .filter((item) => item.pontos > 0)
    .sort((a, b) => b.pontos - a.pontos)
    .slice(0, 3);

  if (resultados.length === 0) return null;

  const resposta = resultados
    .map((item, index) => {
      return `Fonte ${index + 1}: ${item.titulo}
Categoria: ${item.categoria}
Página: ${item.pagina || "-"}
Trecho:
${item.conteudo.slice(0, 1200)}`;
    })
    .join("\n\n---\n\n");

  return `Encontrei informações na Biblioteca Inteligente da SIGIA:

${resposta}

Observação: resposta baseada nos documentos processados na SIGIA.`;
}