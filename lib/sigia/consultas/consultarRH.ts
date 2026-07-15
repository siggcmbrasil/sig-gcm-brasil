import { supabase } from "@/lib/supabase";

function normalizar(valor: string) {
  return valor
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

export async function consultarRH(
  mensagem: string,
  municipioId?: number
) {
  if (!municipioId) {
    return "Município não identificado para consultar o RH.";
  }

  const texto = normalizar(mensagem);

  let consulta = supabase
    .from("guardas")
    .select(
      "id,nome,matricula,cargo,status,telefone,email"
    )
    .eq("municipio_id", municipioId)
    .order("nome")
    .limit(100);

  if (texto.includes("ativo")) {
    consulta = consulta.eq("status", "ATIVO");
  }

  if (texto.includes("inativo")) {
    consulta = consulta.eq("status", "INATIVO");
  }

  const { data, error } = await consulta;

  if (error) {
    console.error(error);
    return "Não consegui consultar o RH.";
  }

  if (!data?.length) {
    return "Nenhum guarda encontrado.";
  }

  return `Efetivo encontrado: ${data.length}

${data
  .map(
    (g) =>
      `• ${g.nome} — ${g.cargo} — ${g.status}`
  )
  .join("\n")}`;
}