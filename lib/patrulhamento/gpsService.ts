import { supabase } from "@/lib/supabase";

export type TipoPontoGPS = "INICIAL" | "AUTOMATICO" | "MANUAL" | "FINAL";

export type PontoGPS = {
  municipio_id: number;
  patrulhamento_id: number;
  latitude: number;
  longitude: number;
  velocidade?: number | null;
  precisao?: number | null;
  tipo: TipoPontoGPS;
  observacao?: string | null;
};

export async function salvarPontoGPS(ponto: PontoGPS) {
  const { error } = await supabase.from("gps_patrulhamento").insert({
    municipio_id: ponto.municipio_id,
    patrulhamento_id: ponto.patrulhamento_id,
    guarda_id: null,
    viatura_id: null,
    latitude: ponto.latitude,
    longitude: ponto.longitude,
    velocidade: ponto.velocidade ?? null,
    precisao: ponto.precisao ?? null,
    tipo: ponto.tipo,
    observacao: ponto.observacao ?? null,
    criado_em: new Date().toISOString(),
  });

  if (error) throw error;
}