import { supabase } from "@/lib/supabase";
import { capturarESalvarPonto } from "./salvarPonto";
import { iniciarGPSPatrulhamento } from "./iniciarGPS";

export async function criarPatrulhamentoV2({
  usuarioLogado,
  data,
  hora,
  local,
  guarda,
  equipe,
  viatura,
  observacao,
}: {
  usuarioLogado: any;
  data: string;
  hora: string;
  local: string;
  guarda: string;
  equipe: string;
  viatura: string;
  observacao: string;
}) {
  const localizacao = await capturarLocalizacaoObrigatoria();

  const { data: novo, error } = await supabase
    .from("patrulhamentos")
    .insert({
      municipio_id: Number(usuarioLogado.municipio_id),
      criado_por: usuarioLogado.auth_id || null,
      criado_em: new Date().toISOString(),
      data,
      hora,
      local,
      guarda,
      equipe,
      viatura,
      latitude: String(localizacao.latitude),
      longitude: String(localizacao.longitude),
      observacao,
      status: "EM_ANDAMENTO",
    })
    .select()
    .single();

  if (error) throw error;

  await capturarESalvarPonto({
    municipio_id: Number(usuarioLogado.municipio_id),
    patrulhamento_id: Number(novo.id),
    tipo: "INICIAL",
    observacao: "Ponto inicial do patrulhamento",
  });

  iniciarGPSPatrulhamento({
    municipio_id: Number(usuarioLogado.municipio_id),
    patrulhamento_id: Number(novo.id),
  });

  localStorage.setItem("patrulhamentoAtivoId", String(novo.id));

  return novo;
}

async function capturarLocalizacaoObrigatoria() {
  const { obterLocalizacao } = await import("@/lib/gps");
  const localizacao = await obterLocalizacao();

  const latitude = Number(localizacao.latitude);
  const longitude = Number(localizacao.longitude);

  if (!latitude || !longitude) {
    throw new Error("Não foi possível capturar o GPS inicial.");
  }

  return { latitude, longitude };
}