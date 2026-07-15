import { supabase } from "@/lib/supabase";

function normalizar(valor: string) {
  return valor
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

export async function consultarUsuarios(
  mensagem: string,
  municipioId?: number
) {
  if (!municipioId) {
    return "Município não identificado para consultar os usuários.";
  }

  const texto = normalizar(mensagem);

  let consulta = supabase
    .from("usuarios")
    .select(
      "id, nome, email, perfil, status, ultimo_login, dispositivo, navegador"
    )
    .eq("municipio_id", municipioId)
    .order("nome", {
      ascending: true,
    })
    .limit(50);

  const emailMatch = mensagem.match(
    /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i
  );

  const nomeMatch = mensagem.match(
    /(?:usuario|usuário|nome)\s+([A-Za-zÀ-ÿ' ]{3,})/i
  );

  if (emailMatch) {
    consulta = consulta.eq(
      "email",
      emailMatch[0].toLowerCase()
    );
  } else if (nomeMatch?.[1]) {
    consulta = consulta.ilike(
      "nome",
      `%${nomeMatch[1].trim()}%`
    );
  }

  if (
    texto.includes("ativo") &&
    !texto.includes("inativo")
  ) {
    consulta = consulta.eq(
      "status",
      "ATIVO"
    );
  }

  if (texto.includes("pendente")) {
    consulta = consulta.eq(
      "status",
      "PENDENTE"
    );
  }

  if (texto.includes("bloqueado")) {
    consulta = consulta.eq(
      "status",
      "BLOQUEADO"
    );
  }

  if (texto.includes("inativo")) {
    consulta = consulta.eq(
      "status",
      "INATIVO"
    );
  }

  const { data, error } =
    await consulta;

  if (error) {
    console.error(
      "Erro ao consultar usuários na SIGIA:",
      error
    );

    return "Não consegui consultar os usuários do município.";
  }

  if (!data || data.length === 0) {
    return "Nenhum usuário foi encontrado com os critérios informados.";
  }

  if (
    emailMatch ||
    nomeMatch ||
    data.length === 1
  ) {
    const usuario = data[0];

    return `Usuário encontrado

Nome: ${usuario.nome || "Não informado"}
E-mail: ${usuario.email || "Não informado"}
Perfil: ${usuario.perfil || "Não informado"}
Status: ${usuario.status || "Não informado"}
Último login: ${
      usuario.ultimo_login
        ? new Date(
            usuario.ultimo_login
          ).toLocaleString("pt-BR")
        : "Não registrado"
    }
Dispositivo: ${usuario.dispositivo || "Não informado"}
Navegador: ${usuario.navegador || "Não informado"}`;
  }

  return `Usuários encontrados: ${data.length}

${data
  .map(
    (usuario) =>
      `• ${usuario.nome || "Nome não informado"} — ${usuario.email || "E-mail não informado"} — ${usuario.perfil || "Perfil não informado"} — ${usuario.status || "Status não informado"}`
  )
  .join("\n")}`;
}