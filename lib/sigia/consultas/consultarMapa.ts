import { supabase } from "@/lib/supabase";

export async function consultarMapa(
  mensagem: string,
  municipioId?: number
) {
  if (!municipioId) {
    return "Município não identificado.";
  }

  const { data, error } = await supabase
    .from("mapa_operacional")
    .select("*")
    .eq("municipio_id", municipioId);

  if (error) {
    console.error(error);
    return "Não consegui consultar o mapa operacional.";
  }

  if (!data?.length) {
    return "Não existem equipes posicionadas no mapa.";
  }

  return `Mapa Operacional

${data
  .map(
    (item) =>
      `• ${item.nome || item.guarnicao || "Equipe"}

Latitude: ${item.latitude}

Longitude: ${item.longitude}

Status: ${item.status}`
  )
  .join("\n\n")}`;
}