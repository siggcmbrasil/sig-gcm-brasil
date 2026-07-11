"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Clock,
  Edit3,
  Globe,
  KeyRound,
  Monitor,
  ShieldCheck,
  User,
} from "lucide-react";

import { supabase } from "@/lib/supabase";
import ProtecaoModulo from "@/components/ProtecaoModulo";

type CorBadge = "blue" | "green" | "yellow" | "red" | "slate";

type UsuarioDetalhes = {
  id: number;
  nome: string;
  email: string | null;
  matricula: string | null;
  telefone: string | null;
  cpf: string | null;
  cargo: string | null;
  perfil: string | null;
  status: string | null;
  observacao: string | null;
  municipio_id: number | null;
  municipio_nome: string | null;
  municipio_estado: string | null;
  foto_url: string | null;
  ultimo_login: string | null;
  ultimo_ip: string | null;
  ultimo_dispositivo: string | null;
  ultimo_navegador: string | null;
  tentativas_login: number;
};

type LogAcesso = {
  id: number;
  acao: string | null;
  status: string | null;
  ip: string | null;
  navegador: string | null;
  dispositivo: string | null;
  criado_em: string | null;
};

type RespostaDetalhes = {
  ok?: boolean;
  erro?: string;
  usuario?: UsuarioDetalhes;
  logs?: LogAcesso[];
  pode_editar?: boolean;
  pode_ver_seguranca?: boolean;
};

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

export default function UsuarioDetalhesPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();

  const id = useMemo(() => Number(params.id), [params.id]);

  const [usuario, setUsuario] = useState<UsuarioDetalhes | null>(null);
  const [logs, setLogs] = useState<LogAcesso[]>([]);
  const [podeEditar, setPodeEditar] = useState(false);
  const [podeVerSeguranca, setPodeVerSeguranca] = useState(false);
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

      const resposta = await fetch(
        `/api/usuarios/${id}/detalhes`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
          cache: "no-store",
        }
      );

      const dados = (await resposta.json()) as RespostaDetalhes;

      if (!resposta.ok || !dados.usuario) {
        throw new Error(
          dados.erro || "Não foi possível carregar o usuário."
        );
      }

      setUsuario(dados.usuario);
      setLogs(dados.logs || []);
      setPodeEditar(Boolean(dados.pode_editar));
      setPodeVerSeguranca(Boolean(dados.pode_ver_seguranca));
    } catch (error) {
      console.error("Erro ao carregar detalhes do usuário:", {
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

  if (carregando) {
    return (
      <div className="p-6 text-white">
        Carregando usuário...
      </div>
    );
  }

  if (!usuario) return null;

  const municipioTexto =
    usuario.municipio_nome && usuario.municipio_estado
      ? `${usuario.municipio_nome} - ${usuario.municipio_estado}`
      : "Sem município";

return (
  <ProtecaoModulo modulo="usuarios">
    <div className="space-y-6 p-4 pb-24 md:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => router.push("/sistema/usuarios")}
          className="flex items-center gap-2 font-bold text-cyan-400 hover:text-cyan-300"
        >
          <ArrowLeft size={18} />
          Voltar para Usuários
        </button>

        {podeEditar && (
          <button
            type="button"
            onClick={() =>
              router.push(`/sistema/usuarios/${usuario.id}/editar`)
            }
            className="flex items-center gap-2 rounded-xl bg-blue-700 px-4 py-3 font-bold text-white hover:bg-blue-600"
          >
            <Edit3 size={18} />
            Editar usuário
          </button>
        )}
      </div>

      <section className="painel-premium p-6">
        <div className="flex flex-col gap-6 md:flex-row md:items-center">
          {usuario.foto_url ? (
            <img
              src={usuario.foto_url}
              alt={usuario.nome}
              className="h-32 w-32 rounded-full border-4 border-cyan-500 object-cover"
            />
          ) : (
            <div className="flex h-32 w-32 items-center justify-center rounded-full border-4 border-slate-700 bg-slate-800 text-5xl font-black text-slate-400">
              {usuario.nome.charAt(0) || "U"}
            </div>
          )}

          <div className="flex-1">
            <h1 className="flex items-center gap-3 text-3xl font-black text-white md:text-4xl">
              <User className="text-cyan-400" />
              {usuario.nome}
            </h1>

            <p className="mt-2 text-slate-400">
              {usuario.email || "-"} • Matrícula:{" "}
              {usuario.matricula || "-"}
            </p>

            <div className="mt-4 flex flex-wrap gap-2">
              <Badge
                texto={usuario.perfil || "-"}
                cor="blue"
              />

              <Badge
                texto={usuario.status || "-"}
                cor={corStatus(usuario.status)}
              />

              <Badge texto={municipioTexto} cor="slate" />
            </div>
          </div>
        </div>
      </section>

      {podeVerSeguranca ? (
        <section className="grid gap-4 md:grid-cols-4">
          <Card
            titulo="Último login"
            valor={formatarData(usuario.ultimo_login)}
            icone={<Clock />}
          />

          <Card
            titulo="Último IP"
            valor={usuario.ultimo_ip || "-"}
            icone={<Globe />}
          />

          <Card
            titulo="Navegador"
            valor={usuario.ultimo_navegador || "-"}
            icone={<Monitor />}
          />

          <Card
            titulo="Tentativas"
            valor={String(usuario.tentativas_login || 0)}
            icone={<ShieldCheck />}
          />
        </section>
      ) : (
        <section className="rounded-2xl border border-yellow-500/30 bg-yellow-500/10 p-4 text-sm font-semibold text-yellow-200">
          Os dados de segurança deste usuário são restritos a um gestor
          de nível superior ou ao próprio usuário.
        </section>
      )}

      <section className="grid gap-6 xl:grid-cols-2">
        <div className="painel-premium p-6">
          <h2 className="mb-4 text-xl font-black text-white">
            Dados do usuário
          </h2>

          <Info nome="Nome" valor={usuario.nome} />
          <Info nome="CPF" valor={usuario.cpf || "-"} />
          <Info nome="Telefone" valor={usuario.telefone || "-"} />
          <Info nome="Cargo" valor={usuario.cargo || "-"} />
          <Info nome="Município" valor={municipioTexto} />
          <Info
            nome="Observação"
            valor={usuario.observacao || "-"}
          />
        </div>

        <div className="painel-premium p-6">
          <h2 className="mb-4 text-xl font-black text-white">
            Acesso institucional
          </h2>

          <Info nome="E-mail" valor={usuario.email || "-"} />
          <Info nome="Matrícula" valor={usuario.matricula || "-"} />
          <Info nome="Perfil" valor={usuario.perfil || "-"} />
          <Info nome="Status" valor={usuario.status || "-"} />

          {podeVerSeguranca && (
            <>
              <Info
                nome="Último IP"
                valor={usuario.ultimo_ip || "-"}
              />
              <Info
                nome="Navegador"
                valor={usuario.ultimo_navegador || "-"}
              />
              <Info
                nome="Dispositivo"
                valor={usuario.ultimo_dispositivo || "-"}
              />
            </>
          )}
        </div>
      </section>

      {podeVerSeguranca && (
        <section className="painel-premium p-6">
          <h2 className="mb-4 flex items-center gap-2 text-xl font-black text-white">
            <KeyRound className="text-cyan-400" />
            Histórico de acessos
          </h2>

          {logs.length === 0 ? (
            <p className="text-slate-400">
              Nenhum acesso registrado.
            </p>
          ) : (
            <div className="space-y-3">
              {logs.map((log) => (
                <article
                  key={log.id}
                  className="rounded-xl border border-slate-800 bg-slate-950/60 p-4"
                >
                  <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="font-bold text-white">
                        {log.acao || "-"} • {log.status || "-"}
                      </p>

                      <p className="text-sm text-slate-400">
                        IP: {log.ip || "-"} • Navegador:{" "}
                        {log.navegador || "-"}
                      </p>
                    </div>

                    <p className="text-xs text-slate-500">
                      {formatarData(log.criado_em)}
                    </p>
                  </div>

                  {log.dispositivo && (
                    <p className="mt-2 break-all text-xs text-slate-500">
                      {log.dispositivo}
                    </p>
                  )}
                </article>
              ))}
            </div>
          )}
        </section>
      )}
        </div>
  </ProtecaoModulo>
  );
}

function formatarData(data: string | null) {
  if (!data) return "-";

  const dataConvertida = new Date(data);

  if (Number.isNaN(dataConvertida.getTime())) {
    return "-";
  }

  return dataConvertida.toLocaleString("pt-BR");
}

function corStatus(status: string | null): CorBadge {
  if (status === "ATIVO") return "green";
  if (status === "PENDENTE") return "yellow";
  if (status === "BLOQUEADO") return "red";

  return "slate";
}

function Card({
  titulo,
  valor,
  icone,
}: {
  titulo: string;
  valor: string;
  icone: ReactNode;
}) {
  return (
    <div className="painel-premium p-5">
      <div className="flex items-center gap-2 text-sm text-slate-400">
        <span className="text-cyan-400 [&>svg]:h-5 [&>svg]:w-5">
          {icone}
        </span>
        {titulo}
      </div>

      <h3 className="mt-2 break-all text-lg font-black text-white">
        {valor}
      </h3>
    </div>
  );
}

function Info({
  nome,
  valor,
}: {
  nome: string;
  valor: string;
}) {
  return (
    <div className="flex justify-between gap-4 border-b border-slate-800 py-3">
      <span className="text-slate-400">{nome}</span>

      <span className="break-all text-right font-semibold text-white">
        {valor}
      </span>
    </div>
  );
}

function Badge({
  texto,
  cor,
}: {
  texto: string;
  cor: CorBadge;
}) {
  const cores: Record<CorBadge, string> = {
    blue: "bg-blue-700 text-blue-100",
    green: "bg-green-700 text-green-100",
    yellow: "bg-yellow-700 text-yellow-100",
    red: "bg-red-700 text-red-100",
    slate: "bg-slate-700 text-slate-100",
  };

  return (
    <span
      className={`${cores[cor]} rounded-full px-3 py-2 text-xs font-bold`}
    >
      {texto}
    </span>
  );
}
