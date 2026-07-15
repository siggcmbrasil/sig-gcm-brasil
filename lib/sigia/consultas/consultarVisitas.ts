import { supabase } from "@/lib/supabase";

function normalizar(valor: string) {
  return valor
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function hojeISO() {
  return new Date()
    .toISOString()
    .slice(0, 10);
}

export async function consultarVisitas(
  mensagem: string,
  municipioId?: number
) {
  if (!municipioId) {
    return "Município não identificado para consultar as visitas.";
  }

  const texto = normalizar(mensagem);

  let consulta = supabase
    .from("visitas")
    .select(
      "id, local_id, local_nome, tipo, status, checkin_em, checkout_em, observacao, guarda_nome, guarnicao_nome"
    )
    .eq("municipio_id", municipioId)
    .order("checkin_em", {
      ascending: false,
    })
    .limit(30);

  if (
    texto.includes("hoje") ||
    texto.includes("do dia")
  ) {
    const hoje = hojeISO();

    consulta = consulta
      .gte(
        "checkin_em",
        `${hoje}T00:00:00`
      )
      .lte(
        "checkin_em",
        `${hoje}T23:59:59`
      );
  }

  if (
    texto.includes("aberta") ||
    texto.includes("em andamento") ||
    texto.includes("ativa")
  ) {
    consulta = consulta.in(
      "status",
      [
        "ATIVA",
        "ABERTA",
        "EM_ANDAMENTO",
        "Ativa",
        "Aberta",
        "Em andamento",
      ]
    );
  }

  const localMatch =
    mensagem.match(
      /(?:local|escola|praca|praça|orgao|órgão)\s+([A-Za-zÀ-ÿ0-9' -]{3,})/i
    );

  if (localMatch?.[1]) {
    consulta = consulta.ilike(
      "local_nome",
      `%${localMatch[1].trim()}%`
    );
  }

  const { data, error } =
    await consulta;

  if (error) {
    console.error(
      "Erro ao consultar visitas na SIGIA:",
      error
    );

    return "Não consegui consultar as visitas do município.";
  }

  if (!data || data.length === 0) {
    return "Nenhuma visita foi encontrada com os critérios informados.";
  }

  if (
    localMatch ||
    data.length === 1
  ) {
    const visita = data[0];

    return `Visita encontrada

Local: ${visita.local_nome || "Não informado"}
Tipo: ${visita.tipo || "Não informado"}
Status: ${visita.status || "Não informado"}
Guarda: ${visita.guarda_nome || "Não informado"}
Guarnição: ${visita.guarnicao_nome || "Não informada"}
Check-in: ${
      visita.checkin_em
        ? new Date(
            visita.checkin_em
          ).toLocaleString("pt-BR")
        : "Não informado"
    }
Check-out: ${
      visita.checkout_em
        ? new Date(
            visita.checkout_em
          ).toLocaleString("pt-BR")
        : "Ainda não realizado"
    }
Observação: ${
      visita.observacao ||
      "Sem observações"
    }`;
  }

  return `Visitas encontradas: ${data.length}

${data
  .map((visita) => {
    const dataVisita =
      visita.checkin_em
        ? new Date(
            visita.checkin_em
          ).toLocaleString("pt-BR")
        : "Data não informada";

    return `• ${visita.local_nome || "Local não informado"} — ${visita.status || "Status não informado"} — ${dataVisita}`;
  })
  .join("\n")}`;
}