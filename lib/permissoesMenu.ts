import { supabase } from "@/lib/supabase";

export async function buscarModulosPermitidos(perfil: string) {
  if (perfil?.toUpperCase() === "DESENVOLVEDOR") {
    return ["*"];
  }

  const { data, error } = await supabase
    .from("permissoes_perfis")
    .select("modulo")
    .eq("perfil", perfil)
    .eq("pode_ver", true);

 if (error) {
  console.error("Erro ao buscar permissões:", error);
  return [];
}

if (!data) {
  return [];
}

  return data
  .map((item) => item.modulo)
  .filter(Boolean);
}

export function moduloLiberado(
  modulosPermitidos: string[],
  modulo: string
): boolean {
  return (
    modulosPermitidos.includes("*") ||
    modulosPermitidos.includes(modulo)
  );
}