import { supabase } from "@/lib/supabase";

export async function buscarModulosPermitidos(perfil: string) {
  if (perfil === "DESENVOLVEDOR") {
    return ["*"];
  }

  const { data, error } = await supabase
    .from("permissoes_perfis")
    .select("modulo")
    .eq("perfil", perfil)
    .eq("pode_ver", true);

  if (error || !data) {
    return [];
  }

  return data.map((item) => item.modulo);
}

export function moduloLiberado(
  modulosPermitidos: string[],
  modulo: string
) {
  return (
    modulosPermitidos.includes("*") ||
    modulosPermitidos.includes(modulo)
  );
}