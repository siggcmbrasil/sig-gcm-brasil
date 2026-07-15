import { supabase } from "@/lib/supabase";

function normalizar(valor: string) {
  return valor
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function hojeISO() {
  const agora = new Date();

  const ano = agora.getFullYear();
  const mes = String(
    agora.getMonth() + 1
  ).padStart(2, "0");
  const dia = String(
    agora.getDate()
  ).padStart(2, "0");

  return `${ano}-${mes}-${dia}`;
}

function formatarInicio(
  data?: string | null,
  hora?: string | null
) {
  if (!data) {
    return "Data não informada";
  }

  const dataFormatada =
    new Date(
      `${data}T12:00:00`
    ).toLocaleDateString("pt-BR");

  return hora
    ? `${dataFormatada} às ${hora}`
    : dataFormatada;
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
      "id, status, data, hora, finalizado_em, distancia_km, duracao_minutos, guarnicao_id, viatura_id, observacao"
    )
    .eq("municipio_id", municipioId)
    .order("data", {
      ascending: false,
    })
    .order("hora", {
      ascending: false,
    })
    .limit(30);

  if (
    texto.includes("hoje") ||
    texto.includes("do dia")
  ) {
    consulta = consulta.eq(
      "data",
      hojeISO()
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

Início: ${formatarInicio(
      patrulhamento.data,
      patrulhamento.hora
    )}

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
      formatarInicio(
        patrulhamento.data,
        patrulhamento.hora
      );

    return `• #${patrulhamento.id} — ${patrulhamento.status || "Status não informado"} — ${inicio} — ${patrulhamento.distancia_km ?? 0} km`;
  })
  .join("\n")}`;
}