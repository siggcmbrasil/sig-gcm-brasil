import { supabase } from "@/lib/supabase";

function normalizar(texto: string) {
  return texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

export async function consultarOcorrencias(
  mensagem: string,
  municipioId?: number
) {
  if (!municipioId) {
    return "Município não identificado.";
  }

  const texto = normalizar(mensagem);

  let consulta = supabase
    .from("ocorrencias")
    .select(
      "id,tipo,status,local,bairro,data,descricao"
    )
    .eq("municipio_id", municipioId)
    .order("data", {
      ascending: false,
    })
    .limit(30);

  if (texto.includes("hoje")) {
    const hoje = new Date()
      .toISOString()
      .slice(0, 10);

    consulta = consulta
      .gte("data", `${hoje}T00:00:00`)
      .lte("data", `${hoje}T23:59:59`);
  }

  const { data, error } =
    await consulta;

  if (error) {
    console.error(error);
    return "Não consegui consultar as ocorrências.";
  }

  if (!data?.length) {
    return "Nenhuma ocorrência encontrada.";
  }

  if (data.length === 1) {
    const o = data[0];

    return `Ocorrência

Tipo: ${o.tipo}

Status: ${o.status}

Local: ${o.local}

Bairro: ${o.bairro}

Data: ${
      o.data
        ? new Date(o.data).toLocaleString(
            "pt-BR"
          )
        : "Não informada"
    }

Descrição:

${o.descricao}`;
  }

  return `Ocorrências encontradas: ${data.length}

${data
  .map(
    (o) =>
      `• ${o.tipo} — ${o.status} — ${o.local}`
  )
  .join("\n")}`;
}