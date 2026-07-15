import { supabase } from "@/lib/supabase";

export async function consultarViaturas(
  mensagem: string,
  municipioId?: number
) {
  if (!municipioId) {
    return "Município não identificado para consultar as viaturas.";
  }

  const texto = mensagem
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

  let consulta = supabase
    .from("viaturas")
    .select(
      "id, prefixo, modelo, placa, status"
    )
    .eq("municipio_id", municipioId)
    .order("prefixo", {
      ascending: true,
    });

  const placaMatch = mensagem.match(
    /\b[A-Z]{3}[0-9][A-Z0-9][0-9]{2}\b/i
  );

  if (placaMatch) {
    consulta = consulta.eq(
      "placa",
      placaMatch[0].toUpperCase()
    );
  }

  const { data, error } =
    await consulta;

  if (error) {
    console.error(
      "Erro ao consultar viaturas na SIGIA:",
      error
    );

    return "Não consegui consultar as viaturas do município.";
  }

  if (!data || data.length === 0) {
    return placaMatch
      ? `Nenhuma viatura foi encontrada com a placa ${placaMatch[0].toUpperCase()}.`
      : "Nenhuma viatura foi encontrada no município.";
  }

  if (placaMatch || data.length === 1) {
    const viatura = data[0];

    return `Viatura encontrada

Prefixo: ${viatura.prefixo || "Não informado"}
Modelo: ${viatura.modelo || "Não informado"}
Placa: ${viatura.placa || "Não informada"}
Status: ${viatura.status || "Não informado"}`;
  }

  const somenteDisponiveis =
    texto.includes("disponivel") ||
    texto.includes("livre");

  const lista = somenteDisponiveis
    ? data.filter((viatura) =>
        String(
          viatura.status || ""
        )
          .toUpperCase()
          .includes("DISPON")
      )
    : data;

  if (lista.length === 0) {
    return "Não há viaturas disponíveis no momento.";
  }

  return `Viaturas encontradas: ${lista.length}

${lista
  .map(
    (viatura) =>
      `• ${viatura.prefixo || "Sem prefixo"} — ${viatura.modelo || "Modelo não informado"} — ${viatura.placa || "Sem placa"} — ${viatura.status || "Status não informado"}`
  )
  .join("\n")}`;
}