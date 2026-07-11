"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function Login() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [carregando, setCarregando] = useState(false);
  
type MunicipioLogin = {
  nome: string;
  estado: string | null;
  bandeira_municipio: string | null;
  bandeira_estado: string | null;
};

const [municipioLogin, setMunicipioLogin] =
  useState<MunicipioLogin | null>(null);


useEffect(() => {
  let paginaAtiva = true;

  async function iniciarLogin() {
    try {


      const { data, error } = await supabase
        .rpc("obter_identidade_login")
        .maybeSingle<MunicipioLogin>();

      if (error) {
        console.error("Erro ao carregar identidade do login:", {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
        });

        return;
      }

      if (paginaAtiva) {
        setMunicipioLogin(data);
      }
    } catch (error) {
      console.error("Erro inesperado ao iniciar login:", error);
    }
  }

  void iniciarLogin();

  return () => {
    paginaAtiva = false;
  };
}, []);

async function encerrarLoginInvalido(mensagem: string) {
  await supabase.auth.signOut();
  localStorage.removeItem("usuarioLogado");
  setSenha("");
  alert(mensagem);
}

  async function entrar() {
  const emailNormalizado = email.trim().toLowerCase();

  if (!emailNormalizado || !senha) {
    alert("Digite e-mail e senha.");
    return;
  }

  if (carregando) {
    return;
  }

  setCarregando(true);

  try {
    localStorage.removeItem("usuarioLogado");

    const {
      data: autenticacao,
      error: autenticacaoError,
    } = await supabase.auth.signInWithPassword({
      email: emailNormalizado,
      password: senha,
    });

    if (
      autenticacaoError ||
      !autenticacao.user ||
      !autenticacao.session
    ) {
      console.warn("Tentativa de login recusada:", {
        message: autenticacaoError?.message,
      });

      /*
       * Não consultar a tabela usuarios pelo e-mail aqui.
       * Não atualizar tentativas_login pelo navegador.
       *
       * Esse controle será feito na API segura, evitando que
       * terceiros bloqueiem contas conhecendo apenas o e-mail.
       */
      alert("E-mail ou senha inválidos.");
      return;
    }

    const authUser = autenticacao.user;
    const accessToken = autenticacao.session.access_token;

    const {
      data: usuario,
      error: usuarioError,
    } = await supabase
      .from("usuarios")
      .select(`
        id,
        auth_id,
        nome,
        matricula,
        email,
        perfil,
        status,
        municipio_id,
        foto_url
      `)
      .eq("auth_id", authUser.id)
      .maybeSingle();

    if (usuarioError) {
      throw new Error(
        usuarioError.message ||
          "Erro ao consultar o cadastro institucional."
      );
    }

    if (!usuario) {
      await encerrarLoginInvalido(
        "Usuário não encontrado no sistema. Aguarde o cadastro e a aprovação."
      );

      return;
    }

    const status = String(usuario.status || "").toUpperCase();
    const perfil = String(usuario.perfil || "").toUpperCase();

    if (status !== "ATIVO") {
      const mensagens: Record<string, string> = {
        PENDENTE:
          "Seu cadastro ainda está aguardando aprovação.",
        BLOQUEADO:
          "Seu usuário está bloqueado. Procure o administrador.",
        INATIVO:
          "Seu usuário está inativo. Procure o administrador.",
      };

      await encerrarLoginInvalido(
        mensagens[status] ||
          "Seu usuário não possui situação válida para acessar o sistema."
      );

      return;
    }

    if (
      perfil !== "DESENVOLVEDOR" &&
      !usuario.municipio_id
    ) {
      await encerrarLoginInvalido(
        "Seu usuário ainda não possui município vinculado."
      );

      return;
    }

    let municipioNome = "";

    if (usuario.municipio_id) {
      const {
        data: municipio,
        error: municipioError,
      } = await supabase
        .from("municipios")
        .select("nome")
        .eq("id", usuario.municipio_id)
        .maybeSingle();

      if (municipioError) {
        console.error("Erro ao carregar município do usuário:", {
          message: municipioError.message,
          details: municipioError.details,
          hint: municipioError.hint,
          code: municipioError.code,
        });
      }

      municipioNome = municipio?.nome || "";
    }

    /*
     * Este objeto é somente cache visual.
     * As páginas protegidas devem conferir a sessão real e o banco.
     */
    const dadosUsuario = {
      id: usuario.id,
      auth_id: authUser.id,
      nome:
        usuario.nome ||
        authUser.email ||
        "Usuário",
      matricula: usuario.matricula || "",
      email:
        authUser.email ||
        usuario.email ||
        "",
      perfil,
      status,
      municipio_id:
        usuario.municipio_id ?? null,
      municipio_nome: municipioNome,
      foto_url: usuario.foto_url || "",
    };

    localStorage.setItem(
      "usuarioLogado",
      JSON.stringify(dadosUsuario)
    );

    const respostaAuditoria = await fetch(
      "/api/auth/registrar-login",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          /*
           * Mantido temporariamente por compatibilidade.
           * A API será corrigida para ignorar estes valores
           * e obter tudo pelo token autenticado.
           */
          usuario_id: usuario.id,
          municipio_id: usuario.municipio_id,
          email:
            authUser.email ||
            usuario.email ||
            "",
        }),
      }
    );

    if (!respostaAuditoria.ok) {
      const texto = await respostaAuditoria.text();

      console.error("Erro ao registrar login na auditoria:", {
        status: respostaAuditoria.status,
        resposta: texto,
      });
    }

    router.replace("/sistema");
    router.refresh();
  } catch (error) {
    console.error("Erro ao realizar login:", {
      message:
        error instanceof Error
          ? error.message
          : "Erro desconhecido",
      error,
    });

    await supabase.auth.signOut();
    localStorage.removeItem("usuarioLogado");

    alert(
      "Não foi possível concluir o acesso. Tente novamente."
    );
  } finally {
    setCarregando(false);
  }
}

  return (
    <div className="min-h-screen bg-[#020b1c] text-white overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(37,99,235,0.30),transparent_30%),radial-gradient(circle_at_80%_20%,rgba(212,175,55,0.18),transparent_28%),linear-gradient(135deg,#020814,#081d3a_45%,#020814)]" />

      <div className="relative min-h-screen grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="hidden lg:flex flex-col justify-center px-20 py-12">
          

          <div>
            <div className="flex items-center gap-8 mb-8">
              <img
  src="/brasoes/sig-gcm-logo.png"
  alt="SIG-GCM Brasil"
  className="w-130 h-130 object-contain drop-shadow-[0_0_60px_rgba(212,175,55,0.35)] animate-[pulseGlow_4s_ease-in-out_infinite]"/>
<div>
                <h1 className="text-8xl font-black tracking-tight sig-title">
                  SIG-GCM
                </h1>

                <p className="text-yellow-400 font-black text-5xl tracking-[0.35em]">
                  BRASIL
                </p>
              </div>
            </div>
           
            <div className="mt-10 max-w-xl">
              <h2 className="text-3xl font-black leading-tight max-w-xl">
                Sistema Integrado de Gestão das Guardas Civis Municipais
              </h2>

              <p className="text-slate-300 mt-5 text-lg">
                Central operacional para ocorrências, escalas, viaturas,
                guarnições, patrulhamento, chamados e relatórios institucionais.
              </p>

                        </div>
          </div>

          <div className="grid grid-cols-4 gap-5 mt-12">
            <MiniSelo icone="🛡️" titulo="Gestão" texto="Integrada" />
            <MiniSelo icone="🚔" titulo="Operação" texto="24h" />
            <MiniSelo icone="📊" titulo="Dados" texto="Estratégicos" />
            <MiniSelo icone="🔐" titulo="Segurança" texto="Controle" />
          </div>
        </section>

        <section className="flex items-start justify-center p-6 pt-20">
          <div className="w-full max-w-md">
            <div className="painel-premium p-8 border border-yellow-400/70 shadow-[0_0_100px_rgba(212,175,55,0.28)]">
              <div className="flex flex-col items-center text-center mb-8">
                <img
  src="/brasoes/sig-gcm-logo.png"
  alt="SIG-GCM Brasil"
  className="w-44 h-44 object-contain mb-6 animar-brasao"
/>

                <h1 className="text-6xl font-black sig-title">
  SIG-GCM
</h1>

<p className="text-yellow-400 text-3xl font-black tracking-[0.4em]">
  BRASIL
</p>

<p className="text-yellow-400 font-bold mt-4">
  Sistema Integrado das Guardas Municipais
</p>

<p className="text-slate-400 text-sm mt-2">
  Acesso restrito a usuários autorizados
</p>
              </div>

              <form
  className="space-y-5"
  onSubmit={(event) => {
    event.preventDefault();
    void entrar();
  }}
>
                <div>
                  <label className="label">Email</label>

                  <input
                    className="input"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Digite seu e-mail"
                    autoComplete="email"
                    inputMode="email"
                    required
                    disabled={carregando}
                  />
                </div>

                <div>
                  <label className="label">Senha</label>

                  <input
                    className="input"
                    type="password"
                    value={senha}
                    onChange={(e) => setSenha(e.target.value)}
                    placeholder="Digite sua senha"
                    autoComplete="current-password"
                    required
                    disabled={carregando}
                  />
                </div>

                <button
                  type="submit"
                  disabled={carregando}
                  className="sig-btn-gold w-full disabled:opacity-50"
                >
                  {carregando ? "Entrando..." : "Entrar no Sistema"}
                </button>
                <div className="text-center pt-2">
  <p className="text-sm text-slate-400">
    Ainda não possui acesso?
  </p>

  <button
    type="button"
    onClick={() => router.push("/cadastro")}
    className="text-yellow-400 hover:text-yellow-300 font-bold text-sm mt-1"
  >
    Solicitar cadastro
  </button>
  <button
  type="button"
  onClick={() => router.push("/esqueci-senha")}
  className="text-slate-400 hover:text-yellow-300 font-bold text-sm mt-3"
>
  Esqueci minha senha
</button>
</div>
              </form>

              <div className="mt-10 rounded-3xl border border-yellow-500/30 bg-slate-950/60 p-8 backdrop-blur-md animar-card">
  <div className="text-center">
    <p className="text-sm text-slate-400 mb-3 font-semibold">
      {new Date().toLocaleDateString("pt-BR")}
    </p>

    <p className="text-lg font-bold text-yellow-400">
      ✝️ ORAÇÃO DE SÃO BENTO
    </p>

    <p className="mt-4 text-slate-200 italic text-sm leading-relaxed">
      A Cruz Sagrada seja a minha luz.
      <br />
      Não seja o dragão meu guia.
      <br />
      Retira-te Satanás.
      <br />
      Nunca me aconselhes coisas vãs.
      <br />
      É mau o que tu me ofereces.
      <br />
      Bebe tu mesmo os teus venenos.
    </p>

    <p className="mt-4 text-yellow-400 font-bold">
      Amém.
    </p>

    <p className="mt-3 text-xs text-slate-500 italic">
      🇧🇷 Servindo e protegendo a sociedade com honra e compromisso.
    </p>
  </div>
</div>

             <div className="mt-8 grid grid-cols-3 gap-3">
  <BandeiraImagem src="/bandeira-brasil.png" titulo="Brasil" />

  <BandeiraImagem
    src={municipioLogin?.bandeira_estado || "/bandeira-bahia.png"}
    titulo={municipioLogin?.estado || "Estado"}
  />

  <BandeiraImagem
    src={municipioLogin?.bandeira_municipio || "/bandeira-biritinga.png"}
    titulo={municipioLogin?.nome || "Município"}
  />
</div>

              <div className="text-center mt-8 border-t border-slate-800 pt-5">
                <p className="text-xs text-slate-500">
                  SIG-GCM Brasil © {new Date().getFullYear()}
                </p>

                <p className="text-xs text-blue-400 font-semibold">
                  Desenvolvido por Maick Lustosa Costa
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

function MiniSelo({
  icone,
  titulo,
  texto,
}: {
  icone: string;
  titulo: string;
  texto: string;
}) {
  return (
    <div className="painel-premium p-4 text-center border border-yellow-500/30">
      <p className="text-3xl">{icone}</p>
      <p className="text-yellow-400 font-black text-sm mt-2">{titulo}</p>
      <p className="text-slate-300 text-xs">{texto}</p>
    </div>
  );
}

function BandeiraImagem({
  src,
  titulo,
}: {
  src: string;
  titulo: string;
}) {
  return (
    <div className="bg-slate-950/70 border border-yellow-500/30 rounded-xl p-2 text-center">
      <img
        src={src}
        alt={titulo}
        className="w-full h-20 object-cover rounded-lg border border-yellow-500/30"
      />

      <p className="text-yellow-400 font-black text-xs mt-2">
        {titulo}
      </p>
    </div>
  );
}