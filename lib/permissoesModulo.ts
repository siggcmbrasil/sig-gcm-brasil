import { supabase } from "@/lib/supabase";

export async function podeVerModulo(
  perfil: string,
  modulo: string
): Promise<boolean> {
  console.log("Perfil:", perfil);
  console.log("Módulo:", modulo);

  if (String(perfil).toUpperCase() === "DESENVOLVEDOR") {
    console.log("DESENVOLVEDOR LIBERADO");
    return true;
  }

  const { data, error } = await supabase
    .from("permissoes_perfis")
    .select("pode_ver")
    .eq("perfil", perfil)
    .eq("modulo", modulo)
    .single();

  console.log("Permissão banco:", data, error);

  if (error || !data) return false;

  return Boolean(data.pode_ver);
}