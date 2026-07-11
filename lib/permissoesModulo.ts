import { supabase } from "@/lib/supabase";

/**
 * Mantém compatibilidade com chamadas antigas:
 * podeVerModulo(perfil, modulo)
 *
 * O perfil recebido pelo navegador é ignorado.
 * A identidade real é validada pela API usando o token.
 */
export async function podeVerModulo(
  perfilOuModulo: string,
  moduloInformado?: string
): Promise<boolean> {
  try {
    const modulo = String(
      moduloInformado ?? perfilOuModulo
    )
      .trim()
      .toLowerCase();

    if (
      modulo.length < 2 ||
      modulo.length > 100 ||
      !/^[a-z0-9_]+$/.test(modulo)
    ) {
      return false;
    }

    const {
      data: { session },
    } = await supabase.auth.getSession();

    const token = session?.access_token;

    if (!token) {
      return false;
    }

    const parametros = new URLSearchParams({
      modulo,
    });

    const resposta = await fetch(
      `/api/permissoes/modulo?${parametros.toString()}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        cache: "no-store",
      }
    );

    const retorno = await resposta
      .json()
      .catch(() => null);

    if (!resposta.ok) {
      console.error(
        "Erro ao verificar permissão do módulo:",
        retorno?.erro || `HTTP ${resposta.status}`
      );

      return false;
    }

    return Boolean(retorno?.permitido);
  } catch (error) {
    console.error(
      "Erro ao verificar permissão do módulo:",
      error
    );

    return false;
  }
}
