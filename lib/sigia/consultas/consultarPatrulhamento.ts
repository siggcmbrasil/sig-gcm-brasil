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

export async function consultarPatrulhamento(
  mensagem: string,
  municipioId?: number
) {
  if (!municipioId) {
    return "Município não identificado para consultar os patrulhamentos.";
  }

  const texto = normalizar(mensagem);

  let consulta = supabase
    .from("patrulhamentos")
    .select(
      "id, status, iniciado_em, finalizado_em, distancia_km, duracao_minutos, guarnicao_id, viatura_id, observacao"
    )
    .eq("municipio_id", municipioId)
    .order("iniciado_em", {
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
        "iniciado_em",
        `${hoje}T00:00:00`
      )
      .lte(
        "iniciado_em",
        `${hoje}T23:59:59`
      );
  }

  if (
    texto.includes("ativo") ||
    texto.includes("em andamento") ||
    texto.includes("acontecendo agora")
  ) {
    consulta = consulta.in(
      "status",
      [
        "ATIVO",
        "EM_ANDAMENTO",
        "Em andamento",
        "Ativo",
      ]
    );
  }

  if (
    texto.includes("finalizado") ||
    texto.includes("encerrado")
  ) {
    consulta = consulta.in(
      "status",
      [
        "FINALIZADO",
        "ENCERRADO",
        "Finalizado",
        "Encerrado",
      ]
    );
  }

  const { data, error } =
    await consulta;

  if (error) {
    console.error(
      "Erro ao consultar patrulhamentos na SIGIA:",
      error
    );

    return "Não consegui consultar os patrulhamentos do município.";
  }

  if (!data || data.length === 0) {
    return "Nenhum patrulhamento foi encontrado com os critérios informados.";
  }

  if (data.length === 1) {
    const patrulhamento = data[0];

    return `Patrulhamento encontrado

Status: ${patrulhamento.status || "Não informado"}
Início: ${
      patrulhamento.iniciado_em
        ? new Date(
            patrulhamento.iniciado_em
          ).toLocaleString("pt-BR")
        : "Não informado"
    }
Finalização: ${
      patrulhamento.finalizado_em
        ? new Date(
            patrulhamento.finalizado_em
          ).toLocaleString("pt-BR")
        : "Em andamento"
    }
Distância: ${
      patrulhamento.distancia_km ??
      "Não informada"
    } km
Duração: ${
      patrulhamento.duracao_minutos ??
      "Não informada"
    } minutos
Observação: ${
      patrulhamento.observacao ||
      "Sem observações"
    }`;
  }

  return `Patrulhamentos encontrados: ${data.length}

${data
  .map((patrulhamento) => {
    const inicio =
      patrulhamento.iniciado_em
        ? new Date(
            patrulhamento.iniciado_em
          ).toLocaleString("pt-BR")
        : "Data não informada";

    return `• #${patrulhamento.id} — ${patrulhamento.status || "Status não informado"} — ${inicio} — ${patrulhamento.distancia_km ?? 0} km`;
  })
  .join("\n")}`;
}