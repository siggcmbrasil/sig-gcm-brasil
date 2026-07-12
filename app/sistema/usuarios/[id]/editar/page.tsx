"use client";

import {
  ChangeEvent,
  FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Save, UserCog } from "lucide-react";

import { registrarAuditoria } from "@/lib/auditoria";
import { supabase } from "@/lib/supabase";
import ProtecaoModulo from "@/components/ProtecaoModulo";

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
type StatusUsuario = "ATIVO" | "PENDENTE" | "BLOQUEADO" | "INATIVO";

type Municipio = {
  id: number;
  nome: string;
  estado: string;
};

type UsuarioEdicao = {
  id: number;
  nome: string;
  matricula: string;
  telefone: string;
  cpf: string;
  cargo: string;
  email: string;
  perfil: Perfil;
  status: StatusUsuario;
  observacao: string;
  municipio_id: number | null;
  foto_url: string | null;
};

type RespostaApi = {
  ok?: boolean;
  erro?: string;
  usuario?: UsuarioEdicao;
  perfis_permitidos?: Perfil[];
  municipios?: Municipio[];
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

export default function EditarUsuarioPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();

  const id = useMemo(() => Number(params.id), [params.id]);

  const [usuario, setUsuario] = useState<UsuarioEdicao | null>(null);
  const [perfisPermitidos, setPerfisPermitidos] = useState<Perfil[]>([]);
  const [municipios, setMunicipios] = useState<Municipio[]>([]);
  const [foto, setFoto] = useState<File | null>(null);
  const [previewFoto, setPreviewFoto] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [carregando, setCarregando] = useState(true);

  const carregar = useCallback(async () => {
    if (!Number.isSafeInteger(id) || id <= 0) {
      alert("Identificador do usuário inválido.");
      router.replace("/sistema/usuarios");
      return;
    }

    setCarregando(true);

    try {
      const accessToken = await obterAccessToken();

      const resposta = await fetch(`/api/usuarios/${id}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        cache: "no-store",
      });

      const dados = (await resposta.json()) as RespostaApi;

      if (!resposta.ok || !dados.usuario) {
        throw new Error(
          dados.erro || "Não foi possível carregar o usuário."
        );
      }

      setUsuario(dados.usuario);
      setPerfisPermitidos(dados.perfis_permitidos || []);
      setMunicipios(dados.municipios || []);
    } catch (error) {
      console.error("Erro ao carregar usuário para edição:", {
        message: mensagemErro(error),
        error,
      });

      alert(mensagemErro(error));
      router.replace("/sistema/usuarios");
    } finally {
      setCarregando(false);
    }
  }, [id, router]);

  useEffect(() => {
    void carregar();
  }, [carregar]);

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

  function alterar<K extends keyof UsuarioEdicao>(
    campo: K,
    valor: UsuarioEdicao[K]
  ) {
    setUsuario((atual) =>
      atual
        ? {
            ...atual,
            [campo]: valor,
          }
        : atual
    );
  }

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

  async function salvar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!usuario || salvando) return;

    const nome = usuario.nome.trim().replace(/\s+/g, " ");
    const email = usuario.email.trim().toLowerCase();
    const cpf = somenteNumeros(usuario.cpf);
    const telefone = somenteNumeros(usuario.telefone);

    if (nome.length < 3) {
      alert("Informe o nome completo.");
      return;
    }

    if (!email) {
      alert("Informe o e-mail.");
      return;
    }

    if (
      usuario.perfil !== "DESENVOLVEDOR" &&
      cpf.length !== 11
    ) {
      alert(
        "Informe um CPF válido para o usuário operacional."
      );
      return;
    }

    if (
      usuario.perfil === "DESENVOLVEDOR" &&
      cpf.length !== 0 &&
      cpf.length !== 11
    ) {
      alert(
        "O CPF do DESENVOLVEDOR deve ter 11 números ou ficar vazio."
      );
      return;
    }

    if (
      telefone &&
      telefone.length !== 10 &&
      telefone.length !== 11
    ) {
      alert("Informe um telefone válido com DDD.");
      return;
    }

    if (!perfisPermitidos.includes(usuario.perfil)) {
      alert("O perfil escolhido não é permitido para sua conta.");
      return;
    }

    if (
      usuario.perfil !== "DESENVOLVEDOR" &&
      !usuario.municipio_id
    ) {
      alert("Selecione o município do usuário.");
      return;
    }

    setSalvando(true);

    try {
      const accessToken = await obterAccessToken();
      const formulario = new FormData();

      formulario.set("nome", nome);
      formulario.set("matricula", usuario.matricula.trim());
      formulario.set("telefone", telefone);
      formulario.set("cpf", cpf);
      formulario.set("cargo", usuario.cargo.trim());
      formulario.set("email", email);
      formulario.set("perfil", usuario.perfil);
      formulario.set(
        "municipio_id",
        usuario.municipio_id
          ? String(usuario.municipio_id)
          : ""
      );
      formulario.set(
        "observacao",
        usuario.observacao.trim()
      );

      if (foto) {
        formulario.set("foto", foto);
      }

      const resposta = await fetch(`/api/usuarios/${usuario.id}`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        body: formulario,
      });

      const dados = (await resposta.json()) as RespostaApi;

      if (!resposta.ok || !dados.usuario) {
        throw new Error(
          dados.erro || "Não foi possível atualizar o usuário."
        );
      }

      try {
        await registrarAuditoria({
          modulo: "Usuários",
          acao: "EDITAR",
          descricao: `Atualizou os dados do usuário ${dados.usuario.nome}.`,
        });
      } catch (auditoriaError) {
        console.error("Auditoria complementar não registrada:", {
          message: mensagemErro(auditoriaError),
          auditoriaError,
        });
      }

      setUsuario(dados.usuario);
      setFoto(null);

      alert("Usuário atualizado com sucesso.");
      router.push(`/sistema/usuarios/${usuario.id}`);
    } catch (error) {
      console.error("Erro ao atualizar usuário:", {
        message: mensagemErro(error),
        error,
      });

      alert(mensagemErro(error));
    } finally {
      setSalvando(false);
    }
  }

  if (carregando) {
    return (
      <div className="p-6 text-white">
        Carregando usuário...
      </div>
    );
  }

  if (!usuario) return null;

  const imagemAtual = previewFoto || usuario.foto_url;

return (
  <ProtecaoModulo modulo="usuarios">
    <div className="space-y-6 p-4 pb-24 md:p-6">
      <button
        type="button"
        onClick={() =>
          router.push(`/sistema/usuarios/${usuario.id}`)
        }
        className="flex items-center gap-2 font-bold text-cyan-400 hover:text-cyan-300"
      >
        <ArrowLeft size={18} />
        Voltar ao Dossiê
      </button>

      <div className="painel-premium p-6">
        <h1 className="flex items-center gap-3 text-3xl font-black text-white md:text-4xl">
          <UserCog className="text-cyan-400" />
          Editar Usuário
        </h1>

        <p className="mt-2 text-slate-400">
          Atualize os dados institucionais, o perfil e a foto.
        </p>
      </div>

      <form
        onSubmit={salvar}
        className="painel-premium max-w-5xl space-y-5 p-6"
      >
        <div className="flex flex-col gap-6 md:flex-row md:items-center">
          {imagemAtual ? (
            <img
              src={imagemAtual}
              alt={usuario.nome}
              className="h-28 w-28 rounded-full border-4 border-cyan-500 object-cover"
            />
          ) : (
            <div className="flex h-28 w-28 items-center justify-center rounded-full border-4 border-slate-700 bg-slate-800 text-4xl font-black text-slate-400">
              {usuario.nome.charAt(0) || "U"}
            </div>
          )}

          <div className="flex-1">
            <label className="label">Alterar foto</label>
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
            label="Nome completo"
            valor={usuario.nome}
            onChange={(valor) => alterar("nome", valor)}
            maxLength={120}
            autoComplete="name"
            required
          />

          <Campo
            label="Matrícula"
            valor={usuario.matricula}
            onChange={(valor) =>
              alterar("matricula", valor.toUpperCase())
            }
            maxLength={40}
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Campo
            label={
              usuario.perfil === "DESENVOLVEDOR"
                ? "CPF (opcional)"
                : "CPF"
            }
            valor={formatarCpf(usuario.cpf)}
            onChange={(valor) =>
              alterar("cpf", somenteNumeros(valor))
            }
            maxLength={14}
            inputMode="numeric"
            required={
              usuario.perfil !== "DESENVOLVEDOR"
            }
            descricao={
              usuario.perfil === "DESENVOLVEDOR"
                ? "A conta administrativa pode permanecer sem CPF e sem vínculo funcional."
                : "O CPF será usado para localizar e vincular o cadastro funcional do guarda."
            }
          />

          <Campo
            label="Telefone"
            valor={formatarTelefone(usuario.telefone)}
            onChange={(valor) =>
              alterar("telefone", somenteNumeros(valor))
            }
            maxLength={15}
            inputMode="tel"
            autoComplete="tel"
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Campo
            label="Cargo/Função"
            valor={usuario.cargo}
            onChange={(valor) => alterar("cargo", valor)}
            maxLength={80}
            autoComplete="organization-title"
          />

          <Campo
            label="E-mail"
            type="email"
            valor={usuario.email}
            onChange={(valor) =>
              alterar("email", valor.toLowerCase())
            }
            maxLength={160}
            autoComplete="email"
            required
          />
        </div>

        <div>
          <label className="label">Município</label>

          <select
            className="input"
            value={usuario.municipio_id || ""}
            onChange={(event) =>
              alterar(
                "municipio_id",
                event.target.value
                  ? Number(event.target.value)
                  : null
              )
            }
          >
            {usuario.perfil === "DESENVOLVEDOR" && (
              <option value="">Sem município fixo</option>
            )}

            {municipios.map((municipio) => (
              <option key={municipio.id} value={municipio.id}>
                {municipio.nome} - {municipio.estado}
              </option>
            ))}
          </select>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="label">Perfil</label>

            <select
              className="input"
              value={usuario.perfil}
              onChange={(event) =>
                alterar("perfil", event.target.value as Perfil)
              }
            >
              {perfisPermitidos.map((perfil) => (
                <option key={perfil} value={perfil}>
                  {perfil}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="label">Status</label>

            <input
              className="input cursor-not-allowed opacity-70"
              value={usuario.status}
              readOnly
            />

            <p className="mt-2 text-xs text-slate-500">
              Altere o status na página de gerenciamento de usuários.
            </p>
          </div>
        </div>

        <div>
          <label className="label">Observação</label>

          <textarea
            className="input h-28 resize-none"
            value={usuario.observacao}
            maxLength={1000}
            onChange={(event) =>
              alterar("observacao", event.target.value)
            }
          />
        </div>

        <button
          type="submit"
          disabled={salvando}
          className="btn-primary flex w-full items-center justify-center gap-2 text-lg disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Save size={20} />
          {salvando ? "Salvando..." : "Salvar Alterações"}
        </button>
      </form>
        </div>
  </ProtecaoModulo>
  );
}

function Campo({
  label,
  valor,
  onChange,
  type = "text",
  maxLength,
  inputMode,
  autoComplete,
  required = false,
  descricao,
}: {
  label: string;
  valor: string;
  onChange: (valor: string) => void;
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
  descricao?: string;
}) {
  return (
    <div>
      <label className="label">{label}</label>

      <input
        className="input"
        type={type}
        value={valor}
        onChange={(event) => onChange(event.target.value)}
        maxLength={maxLength}
        inputMode={inputMode}
        autoComplete={autoComplete}
        required={required}
      />

      {descricao ? (
        <p className="mt-2 text-xs text-slate-500">
          {descricao}
        </p>
      ) : null}
    </div>
  );
}
