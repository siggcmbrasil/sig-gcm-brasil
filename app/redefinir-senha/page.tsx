"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  LoaderCircle,
  LockKeyhole,
  ShieldCheck,
} from "lucide-react";

import { supabase } from "@/lib/supabase";

const CHAVE_RECUPERACAO = "sig_recuperacao_senha_autorizada";

type EstadoTela = "VALIDANDO" | "PRONTO" | "INVALIDO" | "SALVANDO" | "SUCESSO";

function mensagemAmigavel(mensagemOriginal: string) {
  const mensagem = mensagemOriginal.toLowerCase();

  if (
    mensagem.includes("new password should be different") ||
    mensagem.includes("same password")
  ) {
    return "A nova senha precisa ser diferente da senha atual.";
  }

  if (
    mensagem.includes("password should be at least") ||
    mensagem.includes("weak password")
  ) {
    return "A senha não atende aos requisitos de segurança.";
  }

  if (
    mensagem.includes("session") ||
    mensagem.includes("jwt") ||
    mensagem.includes("token")
  ) {
    return "O link expirou ou já foi utilizado. Solicite uma nova recuperação.";
  }

  return "Não foi possível redefinir a senha. Solicite um novo link e tente novamente.";
}

export default function RedefinirSenhaPage() {
  const router = useRouter();

  const [senha, setSenha] = useState("");
  const [confirmar, setConfirmar] = useState("");
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [email, setEmail] = useState("");
  const [estado, setEstado] = useState<EstadoTela>("VALIDANDO");
  const [erro, setErro] = useState("");

  const autorizadoRef = useRef(false);

  const requisitos = useMemo(
    () => ({
      tamanho: senha.length >= 8,
      maiuscula: /[A-Z]/.test(senha),
      minuscula: /[a-z]/.test(senha),
      numero: /\d/.test(senha),
      simbolo: /[^A-Za-z0-9]/.test(senha),
    }),
    [senha]
  );

  const senhaForte = Object.values(requisitos).every(Boolean);
  const senhasIguais = senha.length > 0 && senha === confirmar;

  useEffect(() => {
    let montado = true;
    let temporizador: ReturnType<typeof setTimeout> | null = null;

    const liberarTela = (emailUsuario?: string | null) => {
      if (!montado) return;

      autorizadoRef.current = true;
      window.sessionStorage.setItem(CHAVE_RECUPERACAO, "1");
      setEmail(emailUsuario || "");
      setErro("");
      setEstado("PRONTO");
    };

    const marcarInvalido = () => {
      if (!montado || autorizadoRef.current) return;

      setErro(
        "Este link de recuperação é inválido, expirou ou já foi utilizado."
      );
      setEstado("INVALIDO");
    };

    const possuiIndicadorNaUrl = () => {
      const busca = window.location.search.toLowerCase();
      const hash = window.location.hash.toLowerCase();

      return (
        busca.includes("code=") ||
        busca.includes("token_hash=") ||
        busca.includes("type=recovery") ||
        hash.includes("access_token=") ||
        hash.includes("type=recovery")
      );
    };

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((evento, sessao) => {
      if (!montado) return;

      if (evento === "PASSWORD_RECOVERY" && sessao?.user) {
        liberarTela(sessao.user.email);
        return;
      }

      if (
        evento === "INITIAL_SESSION" &&
        sessao?.user &&
        window.sessionStorage.getItem(CHAVE_RECUPERACAO) === "1"
      ) {
        liberarTela(sessao.user.email);
      }
    });

    void (async () => {
      const marcadorSalvo =
        window.sessionStorage.getItem(CHAVE_RECUPERACAO) === "1";
      const indicadorNaUrl = possuiIndicadorNaUrl();

      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (!montado) return;

      if (sessionError) {
        console.warn(
          `Falha ao validar sessão de recuperação: ${sessionError.message}`
        );
      }

      if (session?.user && (marcadorSalvo || indicadorNaUrl)) {
        liberarTela(session.user.email);
        return;
      }

      if (!indicadorNaUrl && !marcadorSalvo) {
        marcarInvalido();
        return;
      }

      temporizador = setTimeout(marcarInvalido, 8000);
    })();

    return () => {
      montado = false;

      if (temporizador) {
        clearTimeout(temporizador);
      }

      subscription.unsubscribe();
    };
  }, []);

  async function salvarNovaSenha() {
    if (estado !== "PRONTO") return;

    setErro("");

    if (!senha || !confirmar) {
      setErro("Preencha os dois campos.");
      return;
    }

    if (!senhaForte) {
      setErro(
        "A senha deve ter no mínimo 8 caracteres, com letra maiúscula, minúscula, número e símbolo."
      );
      return;
    }

    if (!senhasIguais) {
      setErro("As senhas não conferem.");
      return;
    }

    setEstado("SALVANDO");

    try {
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError || !session?.user) {
        throw new Error(
          "A sessão de recuperação expirou. Solicite um novo link."
        );
      }

      if (
        window.sessionStorage.getItem(CHAVE_RECUPERACAO) !== "1" &&
        !autorizadoRef.current
      ) {
        throw new Error(
          "A recuperação não foi autorizada por um link válido."
        );
      }

      const { error: updateError } = await supabase.auth.updateUser({
        password: senha,
      });

      if (updateError) {
        throw updateError;
      }

      autorizadoRef.current = false;
      window.sessionStorage.removeItem(CHAVE_RECUPERACAO);
      window.localStorage.removeItem("usuarioLogado");

      setSenha("");
      setConfirmar("");
      setEstado("SUCESSO");

      const { error: signOutError } = await supabase.auth.signOut();

      if (signOutError) {
        console.warn(
          `Senha alterada, mas o encerramento das sessões falhou: ${signOutError.message}`
        );
      }

      window.setTimeout(() => {
        router.replace("/login?senha=alterada");
      }, 1400);
    } catch (error) {
      const mensagem =
        error instanceof Error
          ? error.message
          : "Erro desconhecido ao redefinir senha.";

      console.warn(`Redefinição de senha recusada: ${mensagem}`);
      setErro(mensagemAmigavel(mensagem));
      setEstado("PRONTO");
    }
  }

  if (estado === "VALIDANDO") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#020b1c] p-4 text-white">
        <div className="painel-premium w-full max-w-md p-8 text-center">
          <LoaderCircle className="mx-auto animate-spin text-cyan-400" size={36} />
          <h1 className="mt-4 text-2xl font-black">Validando link seguro</h1>
          <p className="mt-2 text-sm text-slate-400">
            Aguarde enquanto confirmamos sua sessão de recuperação.
          </p>
        </div>
      </main>
    );
  }

  if (estado === "INVALIDO") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#020b1c] p-4 text-white">
        <div className="painel-premium w-full max-w-md space-y-5 p-7 text-center">
          <AlertTriangle className="mx-auto text-red-400" size={42} />

          <div>
            <h1 className="text-2xl font-black">Link não autorizado</h1>
            <p className="mt-2 text-sm text-slate-400">{erro}</p>
          </div>

          <button
            type="button"
            onClick={() => router.replace("/login")}
            className="w-full rounded-xl bg-blue-700 px-4 py-3 font-black text-white transition hover:bg-blue-800"
          >
            Voltar para o login
          </button>
        </div>
      </main>
    );
  }

  if (estado === "SUCESSO") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#020b1c] p-4 text-white">
        <div className="painel-premium w-full max-w-md space-y-4 p-8 text-center">
          <CheckCircle2 className="mx-auto text-green-400" size={48} />
          <h1 className="text-3xl font-black">Senha redefinida</h1>
          <p className="text-sm text-slate-400">
            As sessões foram encerradas. Redirecionando para o login...
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#020b1c] p-4 text-white">
      <div className="painel-premium w-full max-w-md space-y-5 p-6">
        <div className="text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-cyan-500/30 bg-cyan-500/10">
            <KeyRound className="text-cyan-400" size={28} />
          </div>

          <h1 className="mt-4 text-3xl font-black">Definir nova senha</h1>

          <p className="mt-2 text-sm text-slate-400">
            Crie uma nova senha para sua conta.
          </p>

          {email && (
            <p className="mt-2 break-all text-xs font-bold text-cyan-300">
              {email}
            </p>
          )}
        </div>

        <div className="rounded-xl border border-blue-500/20 bg-blue-950/30 p-3 text-xs text-blue-200">
          <p className="flex items-center gap-2 font-bold">
            <ShieldCheck size={15} />
            Sessão de recuperação validada
          </p>
        </div>

        {erro && (
          <div className="flex items-start gap-2 rounded-xl border border-red-500/30 bg-red-950/40 p-3 text-sm text-red-200">
            <AlertTriangle className="mt-0.5 shrink-0" size={17} />
            <p>{erro}</p>
          </div>
        )}

        <div>
          <label htmlFor="nova-senha" className="label">
            Nova senha
          </label>

          <div className="relative">
            <LockKeyhole
              size={18}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
            />

            <input
              id="nova-senha"
              className="input w-full pl-10 pr-11"
              type={mostrarSenha ? "text" : "password"}
              value={senha}
              onChange={(event) => setSenha(event.target.value)}
              placeholder="Mínimo de 8 caracteres"
              autoComplete="new-password"
              maxLength={128}
              disabled={estado === "SALVANDO"}
            />

            <button
              type="button"
              onClick={() => setMostrarSenha((valor) => !valor)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              aria-label={mostrarSenha ? "Ocultar senha" : "Mostrar senha"}
              tabIndex={-1}
            >
              {mostrarSenha ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        <div>
          <label htmlFor="confirmar-senha" className="label">
            Confirmar senha
          </label>

          <input
            id="confirmar-senha"
            className="input w-full"
            type={mostrarSenha ? "text" : "password"}
            value={confirmar}
            onChange={(event) => setConfirmar(event.target.value)}
            placeholder="Digite novamente"
            autoComplete="new-password"
            maxLength={128}
            disabled={estado === "SALVANDO"}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                void salvarNovaSenha();
              }
            }}
          />
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs">
          <Requisito ok={requisitos.tamanho}>8 caracteres</Requisito>
          <Requisito ok={requisitos.maiuscula}>Maiúscula</Requisito>
          <Requisito ok={requisitos.minuscula}>Minúscula</Requisito>
          <Requisito ok={requisitos.numero}>Número</Requisito>
          <Requisito ok={requisitos.simbolo}>Símbolo</Requisito>
          <Requisito ok={senhasIguais}>Senhas iguais</Requisito>
        </div>

        <button
          type="button"
          onClick={() => void salvarNovaSenha()}
          disabled={estado === "SALVANDO" || !senhaForte || !senhasIguais}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-700 px-4 py-3 font-black text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {estado === "SALVANDO" ? (
            <>
              <LoaderCircle size={18} className="animate-spin" />
              Salvando...
            </>
          ) : (
            <>
              <ShieldCheck size={18} />
              Salvar nova senha
            </>
          )}
        </button>
      </div>
    </main>
  );
}

function Requisito({
  ok,
  children,
}: {
  ok: boolean;
  children: React.ReactNode;
}) {
  return (
    <div
      className={`flex items-center gap-2 rounded-lg border px-3 py-2 ${
        ok
          ? "border-green-500/30 bg-green-950/30 text-green-300"
          : "border-slate-800 bg-slate-950/50 text-slate-500"
      }`}
    >
      <CheckCircle2 size={14} />
      <span>{children}</span>
    </div>
  );
}
