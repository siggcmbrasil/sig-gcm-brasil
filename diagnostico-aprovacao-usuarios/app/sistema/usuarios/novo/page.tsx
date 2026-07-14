"use client";

import {
  ChangeEvent,
  FormEvent,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save, UserPlus } from "lucide-react";

import ProtecaoModulo from "@/components/ProtecaoModulo";
import { registrarAuditoria } from "@/lib/auditoria";
import { supabase } from "@/lib/supabase";

const PERFIS = [
  "DESENVOLVEDOR",
  "ADMIN",
  "COMANDANTE",
  "DIRETOR",
  "CMT_GUARNICAO",
  "PLANTONISTA",
  "GUARDA",
  "CONSULTA",
] as const;

type Perfil = (typeof PERFIS)[number];

type Municipio = {
  id: number;
  nome: string;
  estado: string;
};

type OpcoesResposta = {
  ok?: boolean;
  erro?: string;
  perfil_atual?: Perfil;
  perfis_permitidos?: Perfil[];
  municipios?: Municipio[];
};

type CriacaoResposta = {
  ok?: boolean;
  erro?: string;
  usuario?: {
    id: number;
    nome: string;
    email: string;
    perfil: Perfil;
    status: "PENDENTE";
    municipio_id: number;
  };
};

const TIPOS_FOTO = [
  "image/jpeg",
  "image/png",
  "image/webp",
];

const LIMITE_FOTO = 5 * 1024 * 1024;

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

function mensagemErro(error: unknown) {
  return error instanceof Error
    ? error.message
    : "Erro desconhecido.";
}

async function obterAccessToken() {
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();

  if (error || !session?.access_token) {
    throw new Error("Sessão inválida ou expirada.");
  }

  return session.access_token;
}

export default function NovoUsuarioPage() {
  const router = useRouter();

  const [nome, setNome] = useState("");
  const [matricula, setMatricula] = useState("");
  const [telefone, setTelefone] = useState("");
  const [cpf, setCpf] = useState("");
  const [cargo, setCargo] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [perfil, setPerfil] = useState<Perfil>("GUARDA");
  const [observacao, setObservacao] = useState("");
  const [foto, setFoto] = useState<File | null>(null);
  const [previewFoto, setPreviewFoto] = useState<string | null>(null);
  const [municipioId, setMunicipioId] = useState("");
  const [municipios, setMunicipios] = useState<Municipio[]>([]);
  const [perfisPermitidos, setPerfisPermitidos] = useState<Perfil[]>(
    []
  );
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    let paginaAtiva = true;

    async function carregarOpcoes() {
      try {
        const accessToken = await obterAccessToken();

        const resposta = await fetch("/api/criar-usuario", {
          method: "GET",
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
          cache: "no-store",
        });

        const dados = (await resposta.json()) as OpcoesResposta;

        if (!resposta.ok) {
          throw new Error(
            dados.erro || "Não foi possível carregar o cadastro."
          );
        }

        if (!paginaAtiva) return;

        const listaPerfis = dados.perfis_permitidos || [];
        const listaMunicipios = dados.municipios || [];

        setPerfisPermitidos(listaPerfis);
        setMunicipios(listaMunicipios);

        const perfilInicial = listaPerfis.includes("GUARDA")
          ? "GUARDA"
          : listaPerfis[0];

        if (!perfilInicial) {
          throw new Error(
            "Seu perfil não pode cadastrar novos usuários."
          );
        }

        setPerfil(perfilInicial);

        if (listaMunicipios.length === 1) {
          setMunicipioId(String(listaMunicipios[0].id));
        }
      } catch (error) {
        console.error("Erro ao carregar opções do cadastro:", {
          message: mensagemErro(error),
          error,
        });

        alert(mensagemErro(error));
        router.replace("/sistema/usuarios");
      } finally {
        if (paginaAtiva) {
          setCarregando(false);
        }
      }
    }

    void carregarOpcoes();

    return () => {
      paginaAtiva = false;
    };
  }, [router]);

  useEffect(() => {
    if (!foto) {
      setPreviewFoto(null);
      return;
    }

    const url = URL.createObjectURL(foto);
    setPreviewFoto(url);

    return () => {
      URL.revokeObjectURL(url);
    };
  }, [foto]);

  const municipioSelecionado = useMemo(
    () =>
      municipios.find(
        (municipio) => municipio.id === Number(municipioId)
      ) || null,
    [municipioId, municipios]
  );

  function selecionarFoto(event: ChangeEvent<HTMLInputElement>) {
    const arquivo = event.target.files?.[0] || null;

    if (!arquivo) {
      setFoto(null);
      return;
    }

    if (!TIPOS_FOTO.includes(arquivo.type)) {
      alert("Use uma imagem JPG, PNG ou WEBP.");
      event.target.value = "";
      setFoto(null);
      return;
    }

    if (arquivo.size > LIMITE_FOTO) {
      alert("A foto deve ter no máximo 5 MB.");
      event.target.value = "";
      setFoto(null);
      return;
    }

    setFoto(arquivo);
  }

  async function salvarUsuario(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (salvando || carregando) return;

    const nomeLimpo = nome.trim().replace(/\s+/g, " ");
    const emailLimpo = email.trim().toLowerCase();
    const matriculaLimpa = matricula.trim().toUpperCase();
    const telefoneLimpo = somenteNumeros(telefone);
    const cpfLimpo = somenteNumeros(cpf);
    const cargoLimpo = cargo.trim().replace(/\s+/g, " ");
    const observacaoLimpa = observacao.trim();

    if (nomeLimpo.length < 3 || nomeLimpo.length > 120) {
      alert("Informe o nome completo.");
      return;
    }

    if (!emailValido(emailLimpo) || emailLimpo.length > 160) {
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

    if (!senhaValida(senha)) {
      alert(
        "A senha deve ter pelo menos 8 caracteres, com letra maiúscula, letra minúscula e número."
      );
      return;
    }

    if (!perfisPermitidos.includes(perfil)) {
      alert("O perfil escolhido não é permitido para sua conta.");
      return;
    }

    if (!municipioId || !municipioSelecionado) {
      alert("Selecione o município.");
      return;
    }

    if (
      matriculaLimpa.length > 40 ||
      cargoLimpo.length > 80 ||
      observacaoLimpa.length > 1000
    ) {
      alert("Um dos campos ultrapassou o limite permitido.");
      return;
    }

    setSalvando(true);

    try {
      const accessToken = await obterAccessToken();
      const formulario = new FormData();

      formulario.set("nome", nomeLimpo);
      formulario.set("matricula", matriculaLimpa);
      formulario.set("telefone", telefoneLimpo);
      formulario.set("cpf", cpfLimpo);
      formulario.set("cargo", cargoLimpo);
      formulario.set("email", emailLimpo);
      formulario.set("senha", senha);
      formulario.set("perfil", perfil);
      formulario.set("municipio_id", municipioId);
      formulario.set("observacao", observacaoLimpa);

      if (foto) {
        formulario.set("foto", foto);
      }

      const resposta = await fetch("/api/criar-usuario", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        body: formulario,
      });

      const textoResposta = await resposta.text();
      let dados: CriacaoResposta = {};

      if (textoResposta) {
        try {
          dados = JSON.parse(textoResposta) as CriacaoResposta;
        } catch {
          console.error(
            `Resposta inválida da API de criação. HTTP ${resposta.status}.`
          );

          alert("A API retornou uma resposta inválida.");
          return;
        }
      }

      if (!resposta.ok) {
        const mensagem =
          dados.erro ||
          `Não foi possível criar o usuário. Código ${resposta.status}.`;

        if (resposta.status >= 500) {
          console.error(
            `Falha no servidor ao criar usuário: ${mensagem}`
          );
        } else {
          console.warn(
            `Cadastro recusado pela API: ${mensagem}`
          );
        }

        alert(mensagem);
        return;
      }

      if (!dados.usuario) {
        console.error(
          "A API confirmou a criação, mas não retornou os dados do usuário."
        );

        alert("A API retornou uma resposta incompleta.");
        return;
      }

      try {
        await registrarAuditoria({
          modulo: "Usuários",
          acao: "CRIAR",
          descricao: `Cadastrou o usuário ${dados.usuario.nome}.`,
          tabela: "usuarios",
          registro_id: dados.usuario.id,
          detalhes: {
            usuario_criado_id: dados.usuario.id,
            perfil: dados.usuario.perfil,
            municipio_id: dados.usuario.municipio_id,
            status: dados.usuario.status,
          },
        });
      } catch (auditoriaError) {
        console.error("Auditoria complementar não registrada:", {
          message: mensagemErro(auditoriaError),
          auditoriaError,
        });
      }

      alert(
        "Usuário cadastrado com sucesso. O acesso permanecerá PENDENTE até aprovação."
      );

      router.push("/sistema/usuarios");
    } catch (error) {
      const mensagem = mensagemErro(error);

      console.error(
        `Erro inesperado ao criar usuário: ${mensagem}`
      );

      alert(mensagem);
    } finally {
      setSalvando(false);
    }
  }

  return (
    <ProtecaoModulo modulo="usuarios">
      <div className="space-y-6 p-4 pb-24 md:p-6">
        <button
          type="button"
          onClick={() => router.push("/sistema/usuarios")}
          className="flex items-center gap-2 font-bold text-cyan-400 hover:text-cyan-300"
        >
          <ArrowLeft size={18} />
          Voltar para Usuários
        </button>

        <div className="painel-premium p-6">
          <h1 className="flex items-center gap-3 text-3xl font-black text-white md:text-4xl">
            <UserPlus className="text-cyan-400" />
            Novo Usuário
          </h1>

          <p className="mt-2 text-slate-400">
            Cadastre um usuário institucional. O acesso será criado
            como PENDENTE.
          </p>
        </div>

        {carregando ? (
          <div className="painel-premium max-w-4xl p-6 text-slate-300">
            Carregando permissões do cadastro...
          </div>
        ) : (
          <form
            onSubmit={salvarUsuario}
            className="painel-premium max-w-4xl space-y-5 p-6"
          >
            <div className="flex flex-col gap-5 md:flex-row md:items-center">
              {previewFoto ? (
                <img
                  src={previewFoto}
                  alt="Prévia da foto"
                  className="h-28 w-28 rounded-full border-4 border-cyan-500 object-cover"
                />
              ) : (
                <div className="flex h-28 w-28 items-center justify-center rounded-full border-4 border-slate-700 bg-slate-800 text-4xl font-black text-slate-400">
                  {nome.trim().charAt(0).toUpperCase() || "U"}
                </div>
              )}

              <div className="flex-1">
                <label className="label">Foto do usuário</label>

                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="input"
                  onChange={selecionarFoto}
                />

                <p className="mt-2 text-xs text-slate-500">
                  JPG, PNG ou WEBP, com no máximo 5 MB.
                </p>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Campo
                label="Nome completo *"
                valor={nome}
                setValor={setNome}
                placeholder="Nome do usuário"
                maxLength={120}
                autoComplete="name"
                required
              />

              <Campo
                label="Matrícula"
                valor={matricula}
                setValor={(valor) =>
                  setMatricula(valor.toUpperCase())
                }
                placeholder="Ex.: GCM-001"
                maxLength={40}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Campo
                label="CPF *"
                valor={cpf}
                setValor={(valor) =>
                  setCpf(formatarCpf(valor))
                }
                placeholder="000.000.000-00"
                maxLength={14}
                inputMode="numeric"
                required
              />

              <Campo
                label="Telefone"
                valor={telefone}
                setValor={(valor) =>
                  setTelefone(formatarTelefone(valor))
                }
                placeholder="(75) 99999-9999"
                maxLength={15}
                inputMode="tel"
                autoComplete="tel"
              />
            </div>

            <Campo
              label="Cargo/Função"
              valor={cargo}
              setValor={setCargo}
              placeholder="Ex.: Guarda Municipal"
              maxLength={80}
              autoComplete="organization-title"
            />

            <div className="grid gap-4 md:grid-cols-2">
              <Campo
                label="E-mail de acesso *"
                valor={email}
                setValor={(valor) =>
                  setEmail(valor.toLowerCase())
                }
                placeholder="usuario@email.com"
                type="email"
                maxLength={160}
                inputMode="email"
                autoComplete="email"
                required
              />

              <Campo
                label="Senha inicial *"
                valor={senha}
                setValor={setSenha}
                placeholder="Mínimo de 8 caracteres"
                type="password"
                maxLength={128}
                autoComplete="new-password"
                required
              />
            </div>

            <p className="-mt-2 text-xs text-slate-500">
              Use letra maiúscula, letra minúscula e número.
            </p>

            <div>
              <label className="label">Município *</label>

              <select
                className="input"
                value={municipioId}
                onChange={(event) =>
                  setMunicipioId(event.target.value)
                }
                required
              >
                <option value="">Selecione</option>

                {municipios.map((municipio) => (
                  <option
                    key={municipio.id}
                    value={municipio.id}
                  >
                    {municipio.nome} - {municipio.estado}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="label">Perfil *</label>

                <select
                  className="input"
                  value={perfil}
                  onChange={(event) =>
                    setPerfil(event.target.value as Perfil)
                  }
                >
                  {perfisPermitidos.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="label">Status</label>

                <input
                  className="input cursor-not-allowed opacity-70"
                  value="PENDENTE"
                  readOnly
                />
              </div>
            </div>

            <div>
              <label className="label">Observação</label>

              <textarea
                className="input h-28 resize-none"
                value={observacao}
                maxLength={1000}
                onChange={(event) =>
                  setObservacao(event.target.value)
                }
                placeholder="Observações sobre o usuário..."
              />
            </div>

            <button
              type="submit"
              disabled={salvando}
              className="btn-primary flex w-full items-center justify-center gap-2 text-lg disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Save size={20} />
              {salvando ? "Salvando..." : "Salvar Usuário"}
            </button>
          </form>
        )}
      </div>
    </ProtecaoModulo>
  );
}

function Campo({
  label,
  valor,
  setValor,
  placeholder,
  type = "text",
  maxLength,
  inputMode,
  autoComplete,
  required = false,
}: {
  label: string;
  valor: string;
  setValor: (valor: string) => void;
  placeholder?: string;
  type?: string;
  maxLength?: number;
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
  required?: boolean;
}) {
  return (
    <div>
      <label className="label">{label}</label>

      <input
        type={type}
        className="input"
        placeholder={placeholder}
        value={valor}
        onChange={(event) => setValor(event.target.value)}
        maxLength={maxLength}
        inputMode={inputMode}
        autoComplete={autoComplete}
        required={required}
      />
    </div>
  );
}
