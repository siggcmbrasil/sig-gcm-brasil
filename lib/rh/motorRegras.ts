import { supabase } from "@/lib/supabase";

export type ResultadoRegraRH = {
  permitido: boolean;
  codigo: string;
  mensagem: string;
  situacao: string;
  detalhes: Record<string, unknown> | null;
};

function primeiroResultado(
  data: ResultadoRegraRH[] | ResultadoRegraRH | null
) {
  if (Array.isArray(data)) {
    return data[0] || null;
  }

  return data;
}

export async function podeAssumirServico({
  guardaId,
  dataServico,
  tipoServico = "REGULAR",
}: {
  guardaId: number;
  dataServico: string;
  tipoServico?: "REGULAR" | "EXTRA" | "APOIO";
}) {
  const { data, error } = await supabase.rpc(
    "rh_pode_assumir_servico",
    {
      p_guarda_id: guardaId,
      p_data_servico: dataServico,
      p_tipo_servico: tipoServico,
    }
  );

  if (error) {
    throw new Error(
      `Erro ao verificar disponibilidade: ${error.message}`
    );
  }

  const resultado = primeiroResultado(
    data as ResultadoRegraRH[] | ResultadoRegraRH | null
  );

  if (!resultado) {
    throw new Error(
      "O motor do RH não retornou uma resposta."
    );
  }

  return resultado;
}

export async function podeIntegrarGuarnicao({
  guardaId,
  data,
  tipoGuarnicao = "REGULAR",
}: {
  guardaId: number;
  data: string;
  tipoGuarnicao?: "REGULAR" | "EXTRA" | "APOIO";
}) {
  const { data: resposta, error } = await supabase.rpc(
    "rh_pode_integrar_guarnicao",
    {
      p_guarda_id: guardaId,
      p_data: data,
      p_tipo_guarnicao: tipoGuarnicao,
    }
  );

  if (error) {
    throw new Error(
      `Erro ao verificar guarnição: ${error.message}`
    );
  }

  const resultado = primeiroResultado(
    resposta as ResultadoRegraRH[] | ResultadoRegraRH | null
  );

  if (!resultado) {
    throw new Error(
      "O motor do RH não retornou uma resposta."
    );
  }

  return resultado;
}

export async function podeDirigirViatura({
  guardaId,
  data,
  categoriaExigida,
}: {
  guardaId: number;
  data: string;
  categoriaExigida?: string | null;
}) {
  const { data: resposta, error } = await supabase.rpc(
    "rh_pode_dirigir_viatura",
    {
      p_guarda_id: guardaId,
      p_data: data,
      p_categoria_exigida:
        categoriaExigida || null,
    }
  );

  if (error) {
    throw new Error(
      `Erro ao verificar CNH: ${error.message}`
    );
  }

  const resultado = primeiroResultado(
    resposta as ResultadoRegraRH[] | ResultadoRegraRH | null
  );

  if (!resultado) {
    throw new Error(
      "O motor do RH não retornou uma resposta."
    );
  }

  return resultado;
}

export async function podeReceberArmamento({
  guardaId,
  data,
}: {
  guardaId: number;
  data: string;
}) {
  const { data: resposta, error } = await supabase.rpc(
    "rh_pode_receber_armamento",
    {
      p_guarda_id: guardaId,
      p_data: data,
    }
  );

  if (error) {
    throw new Error(
      `Erro ao verificar armamento: ${error.message}`
    );
  }

  const resultado = primeiroResultado(
    resposta as ResultadoRegraRH[] | ResultadoRegraRH | null
  );

  if (!resultado) {
    throw new Error(
      "O motor do RH não retornou uma resposta."
    );
  }

  return resultado;
}