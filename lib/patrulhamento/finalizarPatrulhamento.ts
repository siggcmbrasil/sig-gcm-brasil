import { supabase } from "@/lib/supabase";
import { capturarESalvarPonto } from "./salvarPonto";

const CHAVE_WATCH = "patrulhamento_v2_watch_id";
const CHAVE_ATIVO = "patrulhamentoAtivoId";
const CHAVE_ULTIMO = "patrulhamento_v2_ultimo_ponto";

export async function pararGPSPatrulhamento() {
  if (typeof navigator !== "undefined" && navigator.geolocation) {
    const watchId = localStorage.getItem(CHAVE_WATCH);
    if (watchId) navigator.geolocation.clearWatch(Number(watchId));
  }

  localStorage.removeItem(CHAVE_WATCH);
  localStorage.removeItem(CHAVE_ATIVO);
  localStorage.removeItem(CHAVE_ULTIMO);
}

export async function finalizarPatrulhamentoV2({
  municipio_id,
  patrulhamento_id,
}: {
  municipio_id: number;
  patrulhamento_id: number;
}) {
  try {
    await capturarESalvarPonto({
      municipio_id,
      patrulhamento_id,
      tipo: "FINAL",
      observacao: "Ponto final do patrulhamento",
    });
  } catch (error) {
    console.warn("Não foi possível salvar ponto final:", error);
  }

  const { error } = await supabase
    .from("patrulhamentos")
    .update({
      status: "FINALIZADO",
      finalizado_em: new Date().toISOString(),
    })
    .eq("id", patrulhamento_id)
    .eq("municipio_id", municipio_id);

  if (error) throw error;

  await pararGPSPatrulhamento();
}