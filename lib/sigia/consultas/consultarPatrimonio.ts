import { supabase } from "@/lib/supabase";

function normalizar(valor: string) {
  return valor
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

export async function consultarPatrimonio(
  mensagem: string,
  municipioId?: number
) {
  if (!municipioId) {
    return "Município não identificado para consultar o patrimônio.";
  }

  const texto = normalizar(mensagem);

  let consulta = supabase
    .from("patrimonio")
    .select(
      "id, numero_tombamento, nome, descricao, categoria, localizacao, responsavel, status, estado_conservacao, observacao"
    )
    .eq("municipio_id", municipioId)
    .order("nome", {
      ascending: true,
    })
    .limit(50);

  const tombamentoMatch =
    mensagem.match(
      /(?:tombamento|patrimonio|patrimônio|numero|número)\s*[:#-]?\s*([A-Za-z0-9_-]+)/i
    );

  if (tombamentoMatch?.[1]) {
    consulta = consulta.ilike(
      "numero_tombamento",
      `%${tombamentoMatch[1].trim()}%`
    );
  }

  const nomeMatch =
    mensagem.match(
      /(?:bem|item|equipamento)\s+([A-Za-zÀ-ÿ0-9' -]{3,})/i
    );

  if (
    nomeMatch?.[1] &&
    !tombamentoMatch
  ) {
    consulta = consulta.ilike(
      "nome",
      `%${nomeMatch[1].trim()}%`
    );
  }

  if (
    texto.includes("ativo") &&
    !texto.includes("inativo")
  ) {
    consulta = consulta.eq(
      "status",
      "ATIVO"
    );
  }

  if (
    texto.includes("baixado") ||
    texto.includes("baixa")
  ) {
    consulta = consulta.in(
      "status",
      [
        "BAIXADO",
        "INATIVO",
        "Baixado",
      ]
    );
  }

  if (
    texto.includes("danificado") ||
    texto.includes("avariado")
  ) {
    consulta = consulta.in(
      "estado_conservacao",
      [
        "DANIFICADO",
        "AVARIADO",
        "Danificado",
        "Avariado",
      ]
    );
  }

  const { data, error } =
    await consulta;

  if (error) {
    console.error(
      "Erro ao consultar patrimônio na SIGIA:",
      error
    );

    return "Não consegui consultar os bens patrimoniais do município.";
  }

  if (!data || data.length === 0) {
    return "Nenhum bem patrimonial foi encontrado com os critérios informados.";
  }

  if (
    tombamentoMatch ||
    nomeMatch ||
    data.length === 1
  ) {
    const bem = data[0];

    return `Bem patrimonial encontrado

Tombamento: ${bem.numero_tombamento || "Não informado"}
Nome: ${bem.nome || "Não informado"}
Descrição: ${bem.descricao || "Não informada"}
Categoria: ${bem.categoria || "Não informada"}
Localização: ${bem.localizacao || "Não informada"}
Responsável: ${bem.responsavel || "Não informado"}
Status: ${bem.status || "Não informado"}
Estado de conservação: ${bem.estado_conservacao || "Não informado"}
Observação: ${bem.observacao || "Sem observações"}`;
  }

  return `Bens patrimoniais encontrados: ${data.length}

${data
  .map(
    (bem) =>
      `• ${bem.numero_tombamento || "Sem tombamento"} — ${bem.nome || "Nome não informado"} — ${bem.localizacao || "Localização não informada"} — ${bem.status || "Status não informado"}`
  )
  .join("\n")}`;
}