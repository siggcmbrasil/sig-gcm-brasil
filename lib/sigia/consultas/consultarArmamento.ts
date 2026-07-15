import { supabase } from "@/lib/supabase";

function normalizar(valor: string) {
  return valor
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

export async function consultarArmamento(
  mensagem: string,
  municipioId?: number
) {
  if (!municipioId) {
    return "Município não identificado para consultar o armamento.";
  }

  const texto = normalizar(mensagem);

  let consulta = supabase
    .from("armamentos")
    .select(
      "id, tipo, marca, modelo, calibre, numero_serie, status, situacao, observacao"
    )
    .eq("municipio_id", municipioId)
    .order("tipo", {
      ascending: true,
    })
    .limit(50);

  const serieMatch =
    mensagem.match(
      /(?:serie|série|numero|número)\s*[:#-]?\s*([A-Za-z0-9_-]+)/i
    );

  if (serieMatch?.[1]) {
    consulta = consulta.ilike(
      "numero_serie",
      `%${serieMatch[1].trim()}%`
    );
  }

  const calibreMatch =
    mensagem.match(
      /(?:calibre)\s*[:#-]?\s*([A-Za-z0-9.]+)/i
    );

  if (calibreMatch?.[1]) {
    consulta = consulta.ilike(
      "calibre",
      `%${calibreMatch[1].trim()}%`
    );
  }

  if (
    texto.includes("disponivel") ||
    texto.includes("livre")
  ) {
    consulta = consulta.in(
      "status",
      [
        "DISPONIVEL",
        "DISPONÍVEL",
        "Disponível",
      ]
    );
  }

  if (
    texto.includes("cautelado") ||
    texto.includes("em cautela")
  ) {
    consulta = consulta.in(
      "status",
      [
        "CAUTELADO",
        "EM_CAUTELA",
        "Cautelado",
      ]
    );
  }

  const { data, error } =
    await consulta;

  if (error) {
    console.error(
      "Erro ao consultar armamentos na SIGIA:",
      error
    );

    return "Não consegui consultar os armamentos do município.";
  }

  if (!data || data.length === 0) {
    return "Nenhum armamento foi encontrado com os critérios informados.";
  }

  if (
    serieMatch ||
    calibreMatch ||
    data.length === 1
  ) {
    const armamento = data[0];

    return `Armamento encontrado

Tipo: ${armamento.tipo || "Não informado"}
Marca: ${armamento.marca || "Não informada"}
Modelo: ${armamento.modelo || "Não informado"}
Calibre: ${armamento.calibre || "Não informado"}
Número de série: ${armamento.numero_serie || "Não informado"}
Status: ${armamento.status || "Não informado"}
Situação: ${armamento.situacao || "Não informada"}
Observação: ${armamento.observacao || "Sem observações"}`;
  }

  return `Armamentos encontrados: ${data.length}

${data
  .map(
    (armamento) =>
      `• ${armamento.tipo || "Tipo não informado"} — ${armamento.marca || "Marca não informada"} ${armamento.modelo || ""} — Calibre ${armamento.calibre || "não informado"} — ${armamento.status || "Status não informado"}`
  )
  .join("\n")}`;
}