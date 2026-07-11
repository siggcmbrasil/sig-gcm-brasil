import { supabase } from "@/lib/supabase";

type AuditoriaProps = {
  modulo: string;
  acao: string;
  descricao: string;
  registro_id?: string | number | null;
  tabela?: string | null;
  status?: "SUCESSO" | "ERRO" | "ALERTA";
  detalhes?: unknown;
  municipio_id?: number | null;
};

function municipioContexto(
  municipioInformado?: number | null
) {
  if (
    Number.isSafeInteger(Number(municipioInformado)) &&
    Number(municipioInformado) > 0
  ) {
    return Number(municipioInformado);
  }

  if (typeof window === "undefined") {
    return null;
  }

  try {
    const cache = JSON.parse(
      localStorage.getItem("usuarioLogado") || "{}"
    );

    const municipioId = Number(cache?.municipio_id);

    return Number.isSafeInteger(municipioId) &&
      municipioId > 0
      ? municipioId
      : null;
  } catch {
    return null;
  }
}

export async function registrarAuditoria({
  modulo,
  acao,
  descricao,
  registro_id = null,
  tabela = null,
  status = "SUCESSO",
  detalhes = null,
  municipio_id = null,
}: AuditoriaProps) {
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    const token = session?.access_token;

    if (!token) {
      return;
    }

    const resposta = await fetch("/api/auditoria", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
      body: JSON.stringify({
        modulo,
        acao,
        descricao,
        registro_id:
          registro_id !== null &&
          registro_id !== undefined
            ? String(registro_id)
            : null,
        tabela,
        status,
        detalhes,
        municipio_id:
          municipioContexto(municipio_id),
      }),
    });

    if (!resposta.ok) {
      const retorno = await resposta
        .json()
        .catch(() => null);

      console.error(
        "Erro ao registrar auditoria:",
        retorno?.erro ||
          `HTTP ${resposta.status}`
      );
    }
  } catch (error) {
    console.error(
      "Erro ao registrar auditoria:",
      error
    );
  }
}
