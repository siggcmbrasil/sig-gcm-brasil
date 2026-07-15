import { supabase } from "@/lib/supabase";

function normalizar(valor: string) {
  return valor
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

export async function consultarGuardas(
  mensagem: string,
  municipioId?: number
) {
  if (!municipioId) {
    return "Município não identificado para consultar os guardas.";
  }

  const texto = normalizar(mensagem);

  let consulta = supabase
    .from("guardas")
    .select(
      "id, nome, matricula, cargo, status, telefone, email, guarnicao_id"
    )
    .eq("municipio_id", municipioId)
    .order("nome", {
      ascending: true,
    })
    .limit(100);

  const matriculaMatch = mensagem.match(
    /\b\d{2,10}\b/
  );

  const nomeMatch =
    mensagem.match(
      /(?:guarda|gcm|servidor|nome)\s+([A-Za-zÀ-ÿ' ]{3,})/i
    );

  if (matriculaMatch) {
    consulta = consulta.eq(
      "matricula",
      matriculaMatch[0]
    );
  } else if (nomeMatch?.[1]) {
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

  if (texto.includes("inativo")) {
    consulta = consulta.eq(
      "status",
      "INATIVO"
    );
  }

  const { data, error } =
    await consulta;

  if (error) {
    console.error(
      "Erro ao consultar guardas na SIGIA:",
      error
    );

    return "Não consegui consultar os guardas do município.";
  }

  if (!data || data.length === 0) {
    return "Nenhum guarda foi encontrado com os critérios informados.";
  }

  if (
    matriculaMatch ||
    nomeMatch ||
    data.length === 1
  ) {
    const guarda = data[0];

    return `Guarda encontrado

Nome: ${guarda.nome || "Não informado"}
Matrícula: ${guarda.matricula || "Não informada"}
Cargo: ${guarda.cargo || "Não informado"}
Status: ${guarda.status || "Não informado"}
Telefone: ${guarda.telefone || "Não informado"}
E-mail: ${guarda.email || "Não informado"}`;
  }

  return `Guardas encontrados: ${data.length}

${data
  .map(
    (guarda) =>
      `• ${guarda.nome || "Nome não informado"} — Matrícula ${guarda.matricula || "não informada"} — ${guarda.cargo || "Cargo não informado"} — ${guarda.status || "Status não informado"}`
  )
  .join("\n")}`;
}