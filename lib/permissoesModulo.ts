import { supabase } from "@/lib/supabase";

export async function podeVerModulo(
  perfil: string,
  modulo: string
): Promise<boolean> {
  if (perfil?.toUpperCase() === "DESENVOLVEDOR") {
  return true;
}

  const { data, error } = await supabase
    .from("permissoes_perfis")
    .select("pode_ver")
    .eq("perfil", perfil)
    .eq("modulo", modulo)
    .single();

  if (error || !data) return false;

  return Boolean(data.pode_ver);
}