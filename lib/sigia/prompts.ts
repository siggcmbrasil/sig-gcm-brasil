import { supabase } from "@/lib/supabase";

export async function buscarPromptPrincipal() {
  const { data, error } = await supabase
    .from("sigia_prompts")
    .select("conteudo")
    .eq("ativo", true)
    .eq("tipo", "sistema")
    .limit(1)
    .single();

  if (error) {
    console.error(error);
    return "";
  }

  return data?.conteudo || "";
}