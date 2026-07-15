import { supabase } from "@/lib/supabase";

function dataHojeISO() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Bahia",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

export async function consultarPlantaoHoje(
  municipioId?: number
) {
  if (!municipioId) {
    return "Município não identificado para consultar o plantão.";
  }

  const dataHoje = dataHojeISO();

  const { data, error } = await supabase
    .from("escalas_servico")
.select(
  "id, data_servico, guarda_nome, matricula, turno, equipe, observacao"
)
    .eq("municipio_id", municipioId)
    .eq("data_servico", dataHoje)
    .order("equipe", {
      ascending: true,
    })
    .order("guarda_nome", {
      ascending: true,
    });

  if (error) {
    console.error(error);

    return JSON.stringify(error);
  }

  if (!data || data.length === 0) {
    return "Não existe escala de serviço cadastrada para hoje.";
  }

  const equipes = data.reduce<
    Record<
      string,
      Array<{
        nome: string;
        matricula: string;
        turno: string;
        observacao: string;
      }>
    >
  >((acumulador, registro) => {
    const equipe =
      registro.equipe ||
      "Equipe não informada";

    if (!acumulador[equipe]) {
      acumulador[equipe] = [];
    }

    acumulador[equipe].push({
      nome:
        registro.guarda_nome ||
        "Guarda não informado",
      matricula:
        registro.matricula || "",
      turno:
        registro.turno || "",
      observacao:
        registro.observacao || "",
    });

    return acumulador;
  }, {});

  const blocos = Object.entries(equipes).map(
    ([equipe, integrantes]) => {
      const lista = integrantes
        .map((integrante) => {
          const detalhes = [
            integrante.matricula
              ? `Matrícula ${integrante.matricula}`
              : "",
            integrante.turno,
          ]
            .filter(Boolean)
            .join(" • ");

          return detalhes
            ? `• ${integrante.nome} — ${detalhes}`
            : `• ${integrante.nome}`;
        })
        .join("\n");

      return `${equipe}\n${lista}`;
    }
  );

  return `Plantão de hoje — ${new Date().toLocaleDateString(
    "pt-BR"
  )}

${blocos.join("\n\n")}`;
}