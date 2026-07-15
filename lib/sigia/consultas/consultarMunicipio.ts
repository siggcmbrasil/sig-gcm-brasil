import { supabase } from "@/lib/supabase";

export async function consultarMunicipio(
  mensagem: string,
  municipioId?: number
) {
  if (!municipioId) {
    return "Município não identificado.";
  }

  const { data, error } = await supabase
    .from("municipios")
    .select("*")
    .eq("id", municipioId)
    .single();

  if (error) {
    console.error(error);
    return "Não consegui consultar os dados do município.";
  }

  return `Município

Nome: ${data.nome}

UF: ${data.uf}

Guarda: ${data.nome_guarda}

Comandante: ${data.comandante || "Não informado"}

População: ${data.populacao || "Não informada"}`;
}