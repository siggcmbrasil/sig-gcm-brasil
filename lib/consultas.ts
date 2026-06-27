import { supabase } from "@/lib/supabase";

export async function buscarPessoaPorDocumento(
  municipioId: number,
  documento: string
) {
  const { data } = await supabase
    .from("pessoas_abordadas")
    .select("*")
    .eq("municipio_id", municipioId)
    .eq("documento", documento)
    .maybeSingle();

  return data;
}

export async function buscarVeiculoPorPlaca(
  municipioId: number,
  placa: string
) {
  const { data } = await supabase
    .from("veiculos_abordados")
    .select("*")
    .eq("municipio_id", municipioId)
    .eq("placa", placa)
    .maybeSingle();

  return data;
}

export async function buscarVeiculoPorRenavam(
  municipioId: number,
  renavam: string
) {
  const { data } = await supabase
    .from("veiculos_abordados")
    .select("*")
    .eq("municipio_id", municipioId)
    .eq("renavam", renavam)
    .maybeSingle();

  return data;
}

export async function contarOcorrenciasPessoa(
  municipioId: number,
  documento: string
) {
  const { count } = await supabase
    .from("ocorrencias")
    .select("*", { count: "exact", head: true })
    .eq("municipio_id", municipioId)
    .contains("envolvidos", [
      {
        documento,
      },
    ]);

  return count || 0;
}

export async function contarOcorrenciasVeiculo(
  municipioId: number,
  placa: string
) {
  const { count } = await supabase
    .from("ocorrencias")
    .select("*", { count: "exact", head: true })
    .eq("municipio_id", municipioId)
    .contains("veiculos_envolvidos", [
      {
        placa,
      },
    ]);

  return count || 0;
}