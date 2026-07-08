import { obterLocalizacao } from "@/lib/gps";
import { salvarPontoGPS, TipoPontoGPS } from "./gpsService";

export async function capturarESalvarPonto({
  municipio_id,
  patrulhamento_id,
  tipo,
  observacao,
}: {
  municipio_id: number;
  patrulhamento_id: number;
  tipo: TipoPontoGPS;
  observacao?: string | null;
}) {
  const localizacao = await obterLocalizacao();

  const latitude = Number(localizacao.latitude);
  const longitude = Number(localizacao.longitude);

  if (!latitude || !longitude) {
    throw new Error("GPS inválido.");
  }

  await salvarPontoGPS({
    municipio_id,
    patrulhamento_id,
    latitude,
    longitude,
    precisao: Number(localizacao.precisao || 0) || null,
    velocidade: null,
    tipo,
    observacao: observacao ?? null,
  });

  return { latitude, longitude };
}