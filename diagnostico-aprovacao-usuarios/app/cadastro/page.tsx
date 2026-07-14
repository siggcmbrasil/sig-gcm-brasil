"use client";

import {
  FormEvent,
  Suspense,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { supabase } from "@/lib/supabase";

type ConvitePublico = {
  valido: boolean;
  municipio_nome: string | null;
  perfil: string | null;
  expira_em: string | null;
};

type EstadoConvite =
  | "SEM_CONVITE"
  | "CARREGANDO"
  | "VALIDO"
  | "INVALIDO";

function somenteNumeros(valor: string) {
  return valor.replace(/\D/g, "");
}

function formatarCpf(valor: string) {
  return somenteNumeros(valor)
    .slice(0, 11)
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
}

function formatarTelefone(valor: string) {
  return somenteNumeros(valor)
    .slice(0, 11)
    .replace(/^(\d{2})(\d)/, "($1) $2")
    .replace(/(\d{5})(\d{1,4})$/, "$1-$2");
}

function cpfValido(valor: string) {
  const cpf = somenteNumeros(valor);

  if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) {
    return false;
  }

  const calcularDigito = (quantidade: number) => {
    let soma = 0;

    for (let indice = 0; indice < quantidade; indice += 1) {
      soma += Number(cpf[indice]) * (quantidade + 1 - indice);
    }

    const resto = (soma * 10) % 11;
    return resto === 10 ? 0 : resto;
  };

  return (
    calcularDigito(9) === Number(cpf[9]) &&
    calcularDigito(10) === Number(cpf[10])
  );
}

function emailValido(valor: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(valor);
}

function senhaValida(valor: string) {
  return (
    valor.length >= 8 &&
    /[a-z]/.test(valor) &&
    /[A-Z]/.test(valor) &&
    /\d/.test(valor)
  );
}

function CadastroConteudo() {
  const router = useRouter();
  const params = useSearchParams();

  const tokenConvite = useMemo(
    () => params.get("convite")?.trim() || "",
    [params]
  );

  const [convite, setConvite] = useState<ConvitePublico | null>(
    null
  );
  const [estadoConvite, setEstadoConvite] =
    useState<EstadoConvite>("CARREGANDO");

  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [telefone, setTelefone] = useState("");
  const [cargo, setCargo] = useState("");
  const [cpf, setCpf] = useState("");
  const [carregando, setCarregando] = useState(false);

  useEffect(() => {
    let paginaAtiva = true;

    async function carregarConvite() {
      if (!tokenConvite) {
        if (paginaAtiva) {
          setConvite(null);
          setEstadoConvite("SEM_CONVITE");
        }
        return;
      }

      if (tokenConvite.length > 200) {
        if (paginaAtiva) {
          setConvite(null);
          setEstadoConvite("INVALIDO");
        }
        return;
      }

      if (paginaAtiva) {
        setEstadoConvite("CARREGANDO");
      }

      const { data, error } = await supabase
        .rpc("validar_convite_publico", {
          p_token: tokenConvite,
        })
        .single<ConvitePublico>();

      if (!paginaAtiva) return;

      if (error) {
        console.error("Erro ao validar convite:", {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
        });

        setConvite(null);
        setEstadoConvite("INVALIDO");
        return;
      }

      if (!data?.valido) {
        setConvite(null);
        setEstadoConvite("INVALIDO");
        return;
      }

      setConvite(data);
      setEstadoConvite("VALIDO");
    }

    void carregarConvite();

    return () => {
      paginaAtiva = false;
    };
  }, [tokenConvite]);

  async function cadastrar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (carregando) return;

    const nomeLimpo = nome.trim().replace(/\s+/g, " ");
    const emailLimpo = email.trim().toLowerCase();
    const cargoLimpo = cargo.trim().replace(/\s+/g, " ");
    const cpfLimpo = somenteNumeros(cpf);
    const telefoneLimpo = somenteNumeros(telefone);

    if (estadoConvite === "CARREGANDO") {
      alert("Aguarde a validação do convite.");
      return;
    }

    if (estadoConvite === "INVALIDO") {
      alert("Este convite é inválido, expirou ou atingiu o limite de uso.");
      return;
    }

    if (nomeLimpo.length < 3 || nomeLimpo.length > 120) {
      alert("Informe o nome completo.");
      return;
    }

    if (!emailValido(emailLimpo)) {
      alert("Informe um e-mail válido.");
      return;
    }

    if (!cpfValido(cpfLimpo)) {
      alert("Informe um CPF válido.");
      return;
    }

    if (
      telefoneLimpo &&
      ![10, 11].includes(telefoneLimpo.length)
    ) {
      alert("Informe um telefone válido com DDD.");
      return;
    }

    if (cargoLimpo.length > 80) {
      alert("O cargo ou função deve ter no máximo 80 caracteres.");
      return;
    }

    if (!senhaValida(senha)) {
      alert(
        "A senha deve ter pelo menos 8 caracteres, com letra maiúscula, letra minúscula e número."
      );
      return;
    }

    setCarregando(true);

    try {
      const { data, error } = await supabase.auth.signUp({
        email: emailLimpo,
        password: senha,
        options: {
          emailRedirectTo: `${window.location.origin}/login?cadastro=confirmado`,
          data: {
            nome: nomeLimpo,
            cpf: cpfLimpo,
            telefone: telefoneLimpo || null,
            cargo: cargoLimpo || null,
            convite: tokenConvite || null,
          },
        },
      });

if (error || !data.user) {
  const mensagemOriginal =
    error?.message?.trim() ||
    "O Supabase não retornou o usuário criado.";

  const mensagemNormalizada =
    mensagemOriginal.toLowerCase();

  let mensagemUsuario =
    "Não foi possível concluir a solicitação.";

  if (
    mensagemNormalizada.includes("already registered") ||
    mensagemNormalizada.includes("already been registered") ||
    mensagemNormalizada.includes("user already")
  ) {
    mensagemUsuario =
      "Este e-mail já possui uma conta. Use outro e-mail ou recupere a senha.";
  } else if (
    mensagemNormalizada.includes("database error saving new user")
  ) {
    mensagemUsuario =
      "O cadastro não pôde ser salvo. O e-mail ou CPF pode já estar cadastrado.";
  } else if (
    mensagemNormalizada.includes("signup is disabled")
  ) {
    mensagemUsuario =
      "Novos cadastros estão temporariamente desativados.";
  } else if (
    mensagemNormalizada.includes("rate limit") ||
    mensagemNormalizada.includes("too many requests")
  ) {
    mensagemUsuario =
      "Foram feitas muitas tentativas. Aguarde alguns minutos e tente novamente.";
  } else if (
    mensagemNormalizada.includes("password")
  ) {
    mensagemUsuario =
      "A senha informada não atende aos requisitos de segurança.";
  }

  console.warn(
    `Cadastro recusado pelo Supabase: ${mensagemOriginal} | status=${error?.status ?? "-"} | code=${error?.code ?? "-"}`
  );

  alert(mensagemUsuario);
  return;
}

      const { data: cadastroConfirmado, error: confirmacaoError } =
        await supabase.rpc("confirmar_cadastro_publico_criado", {
          p_auth_id: data.user.id,
        });

      if (confirmacaoError) {
        console.error("Erro ao confirmar criação do cadastro:", {
          message: confirmacaoError.message,
          details: confirmacaoError.details,
          hint: confirmacaoError.hint,
          code: confirmacaoError.code,
        });

        alert(
          "Não foi possível confirmar a solicitação. Tente novamente com outro e-mail ou use a recuperação de senha."
        );
        return;
      }

      if (!cadastroConfirmado) {
        alert(
          "Nenhuma nova solicitação foi criada. Este e-mail ou CPF pode já estar cadastrado. Use outro e-mail ou recupere o acesso."
        );
        return;
      }

      /*
       * Mesmo quando a confirmação de e-mail estiver desativada,
       * o usuário novo continua PENDENTE e não deve permanecer logado.
       */
      if (data.session) {
        await supabase.auth.signOut();
      }

      setNome("");
      setEmail("");
      setSenha("");
      setTelefone("");
      setCargo("");
      setCpf("");

      alert(
        data.session
          ? "Solicitação enviada com sucesso. Aguarde a aprovação do administrador."
          : "Solicitação criada. Confirme seu e-mail e aguarde a aprovação do administrador."
      );

      router.replace("/login");
    } catch (error) {
      console.error("Erro inesperado no cadastro:", {
        message:
          error instanceof Error
            ? error.message
            : "Erro desconhecido",
      });

      alert("Erro inesperado ao solicitar acesso.");
    } finally {
      setCarregando(false);
    }
  }

  const formularioBloqueado =
    carregando ||
    estadoConvite === "CARREGANDO" ||
    estadoConvite === "INVALIDO";

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#020b1c] p-4 text-white">
      <div className="painel-premium w-full max-w-xl p-6 sm:p-8">
        <div className="mb-6 text-center">
          <h1 className="text-3xl font-black">
            Solicitação de Acesso
          </h1>

          <p className="mt-2 text-sm text-slate-400">
            Preencha seus dados para solicitar acesso ao SIG-GCM Brasil.
          </p>
        </div>

        {estadoConvite === "CARREGANDO" && (
          <Aviso
            tipo="neutro"
            texto="Validando o convite de acesso..."
          />
        )}

        {estadoConvite === "VALIDO" && convite && (
          <Aviso
            tipo="sucesso"
            texto={`Convite válido para ${
              convite.municipio_nome || "o município informado"
            }. Perfil inicial: ${convite.perfil || "CONSULTA"}.`}
          />
        )}

        {estadoConvite === "INVALIDO" && (
          <Aviso
            tipo="erro"
            texto="Convite inválido, expirado, desativado ou sem usos disponíveis."
          />
        )}

        {estadoConvite === "SEM_CONVITE" && (
          <Aviso
            tipo="neutro"
            texto="A solicitação será vinculada ao município padrão e ficará PENDENTE até aprovação."
          />
        )}

        <form className="mt-5 space-y-4" onSubmit={cadastrar}>
          <Campo
            label="Nome completo"
            value={nome}
            onChange={setNome}
            autoComplete="name"
            maxLength={120}
            required
          />

          <Campo
            label="CPF"
            value={cpf}
            onChange={(valor) => setCpf(formatarCpf(valor))}
            placeholder="000.000.000-00"
            inputMode="numeric"
            autoComplete="off"
            maxLength={14}
            required
          />

          <Campo
            label="E-mail"
            type="email"
            value={email}
            onChange={setEmail}
            placeholder="seuemail@exemplo.com"
            inputMode="email"
            autoComplete="email"
            maxLength={160}
            required
          />

          <Campo
            label="Senha"
            type="password"
            value={senha}
            onChange={setSenha}
            placeholder="Mínimo de 8 caracteres"
            autoComplete="new-password"
            maxLength={128}
            required
          />

          <p className="-mt-2 text-xs text-slate-500">
            Use letra maiúscula, letra minúscula e número.
          </p>

          <Campo
            label="Telefone"
            value={telefone}
            onChange={(valor) =>
              setTelefone(formatarTelefone(valor))
            }
            placeholder="(00) 00000-0000"
            inputMode="tel"
            autoComplete="tel"
            maxLength={15}
          />

          <Campo
            label="Cargo / Função"
            value={cargo}
            onChange={setCargo}
            maxLength={80}
            autoComplete="organization-title"
          />

          <button
            type="submit"
            disabled={formularioBloqueado}
            className="sig-btn-gold w-full disabled:cursor-not-allowed disabled:opacity-60"
          >
            {carregando
              ? "Enviando..."
              : estadoConvite === "CARREGANDO"
                ? "Validando convite..."
                : "Solicitar Acesso"}
          </button>

          <button
            type="button"
            onClick={() => router.push("/login")}
            disabled={carregando}
            className="w-full text-sm text-slate-400 hover:text-white disabled:opacity-50"
          >
            Voltar para o login
          </button>
        </form>
      </div>
    </div>
  );
}

function Campo({
  label,
  type = "text",
  value,
  onChange,
  placeholder,
  inputMode,
  autoComplete,
  maxLength,
  required = false,
}: {
  label: string;
  type?: string;
  value: string;
  onChange: (valor: string) => void;
  placeholder?: string;
  inputMode?:
    | "none"
    | "text"
    | "tel"
    | "url"
    | "email"
    | "numeric"
    | "decimal"
    | "search";
  autoComplete?: string;
  maxLength?: number;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-bold text-slate-300">
        {label}
      </span>

      <input
        className="input"
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        inputMode={inputMode}
        autoComplete={autoComplete}
        maxLength={maxLength}
        required={required}
      />
    </label>
  );
}

function Aviso({
  tipo,
  texto,
}: {
  tipo: "sucesso" | "erro" | "neutro";
  texto: string;
}) {
  const estilo =
    tipo === "sucesso"
      ? "border-green-500/30 bg-green-500/10 text-green-300"
      : tipo === "erro"
        ? "border-red-500/30 bg-red-500/10 text-red-300"
        : "border-blue-500/30 bg-blue-500/10 text-blue-200";

  return (
    <div className={`rounded-2xl border p-3 text-sm font-bold ${estilo}`}>
      {texto}
    </div>
  );
}

export default function Cadastro() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#020b1c] text-white">
          Carregando cadastro...
        </div>
      }
    >
      <CadastroConteudo />
    </Suspense>
  );
}
