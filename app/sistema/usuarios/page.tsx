"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import CardIndicador from "@/components/CardIndicador";
import ProtecaoModulo from "@/components/ProtecaoModulo";
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
type StatusUsuario = "ATIVO" | "PENDENTE" | "BLOQUEADO" | "INATIVO";

type UsuarioAtual = {
  id: number;
  auth_id: string;
  nome: string;
  email: string;
  perfil: Perfil;
  status: "ATIVO";
  municipio_id: number | null;
};

type Usuario = {
  id: number;
  auth_id: string | null;
  nome: string;
  matricula: string | null;
  telefone: string | null;
  email: string | null;
  cpf: string | null;
  cargo: string | null;
  perfil: Perfil | null;
  status: StatusUsuario | null;
  observacao: string | null;
  municipio_id: number | null;
  foto_url: string | null;
  ultimo_login: string | null;
  tentativas_login: number | null;
  guarda_id: number | null;
};

type Municipio = {
  id: number;
  nome: string;
  estado: string;
};

type RespostaApi = {
  ok?: boolean;
  erro?: string;
  usuario?: {
    id: number;
    status: StatusUsuario;
    guarda_id?: number | null;
  };
};

const PERFIS_GESTORES: Perfil[] = [
  "DESENVOLVEDOR",
  "ADMIN",
  "COMANDANTE",
  "DIRETOR",
];

const NIVEL_PERFIL: Record<Perfil, number> = {
  DESENVOLVEDOR: 100,
  ADMIN: 90,
  COMANDANTE: 80,
  DIRETOR: 70,
  CMT_GUARNICAO: 60,
  PLANTONISTA: 50,
  GUARDA: 40,
  CONSULTA: 10,
};

function normalizarPerfil(valor: string | null | undefined): Perfil | null {
  const perfil = String(valor || "").toUpperCase();

  return PERFIS.includes(perfil as Perfil)
    ? (perfil as Perfil)
    : null;
}

function normalizarStatus(
  valor: string | null | undefined
): StatusUsuario | null {
  const status = String(valor || "").toUpperCase();

  return ["ATIVO", "PENDENTE", "BLOQUEADO", "INATIVO"].includes(
    status
  )
    ? (status as StatusUsuario)
    : null;
}

function mascararCpf(cpf: string | null) {
  const numeros = String(cpf || "").replace(/\D/g, "");

  if (numeros.length !== 11) return "-";

  return `***.***.***-${numeros.slice(-2)}`;
}

function mensagemErro(error: unknown) {
  return error instanceof Error ? error.message : "Erro desconhecido.";
}

export default function UsuariosPage() {
  const router = useRouter();

  const [usuarioAtual, setUsuarioAtual] =
    useState<UsuarioAtual | null>(null);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [municipios, setMunicipios] = useState<Municipio[]>([]);
  const [busca, setBusca] = useState("");
  const [carregando, setCarregando] = useState(true);
  const [acaoEmAndamento, setAcaoEmAndamento] = useState<number | null>(
    null
  );

  const carregarDados = useCallback(async () => {
    setCarregando(true);

    try {
      const {
        data: { user: authUser },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !authUser) {
        throw new Error("Sessão inválida ou expirada.");
      }

      const { data: cadastro, error: cadastroError } = await supabase
        .from("usuarios")
        .select(
          "id,auth_id,nome,email,perfil,status,municipio_id"
        )
        .eq("auth_id", authUser.id)
        .maybeSingle();

      if (cadastroError || !cadastro) {
        throw new Error(
          cadastroError?.message ||
            "Usuário institucional não encontrado."
        );
      }

      const perfilAtual = normalizarPerfil(cadastro.perfil);
      const statusAtual = normalizarStatus(cadastro.status);

      if (
        !perfilAtual ||
        !PERFIS_GESTORES.includes(perfilAtual) ||
        statusAtual !== "ATIVO"
      ) {
        router.replace("/sistema");
        return;
      }

      const contexto: UsuarioAtual = {
        id: Number(cadastro.id),
        auth_id: authUser.id,
        nome: cadastro.nome || authUser.email || "Usuário",
        email: authUser.email || cadastro.email || "",
        perfil: perfilAtual,
        status: "ATIVO",
        municipio_id: cadastro.municipio_id
          ? Number(cadastro.municipio_id)
          : null,
      };

      setUsuarioAtual(contexto);

      const [usuariosResposta, municipiosResposta] = await Promise.all([
        supabase
          .from("usuarios")
          .select(
            "id,auth_id,nome,matricula,telefone,email,cpf,cargo,perfil,status,observacao,municipio_id,foto_url,ultimo_login,tentativas_login,guarda_id"
          )
          .order("id", { ascending: false })
          .limit(500),

        supabase
          .from("municipios")
          .select("id,nome,estado")
          .order("nome", { ascending: true }),
      ]);

      if (usuariosResposta.error) {
        throw usuariosResposta.error;
      }

      if (municipiosResposta.error) {
        throw municipiosResposta.error;
      }

      const listaUsuarios: Usuario[] = (usuariosResposta.data || []).map(
        (item) => ({
          id: Number(item.id),
          auth_id: item.auth_id || null,
          nome: item.nome,
          matricula: item.matricula || null,
          telefone: item.telefone || null,
          email: item.email || null,
          cpf: item.cpf || null,
          cargo: item.cargo || null,
          perfil: normalizarPerfil(item.perfil),
          status: normalizarStatus(item.status),
          observacao: item.observacao || null,
          municipio_id: item.municipio_id
            ? Number(item.municipio_id)
            : null,
          foto_url: item.foto_url || null,
          ultimo_login: item.ultimo_login || null,
          tentativas_login: item.tentativas_login || 0,
          guarda_id:
            item.guarda_id
              ? Number(item.guarda_id)
              : null,
        })
      );

      const listaMunicipios: Municipio[] = (
        municipiosResposta.data || []
      ).map((item) => ({
        id: Number(item.id),
        nome: item.nome,
        estado: item.estado,
      }));

      setUsuarios(listaUsuarios);
      setMunicipios(listaMunicipios);
    } catch (error) {
      console.error("Erro ao carregar usuários:", {
        message: mensagemErro(error),
        error,
      });

      alert("Erro ao carregar usuários.");
    } finally {
      setCarregando(false);
    }
  }, [router]);

  useEffect(() => {
    void carregarDados();
  }, [carregarDados]);

  function podeGerenciar(usuarioAlvo: Usuario) {
    if (!usuarioAtual || usuarioAtual.id === usuarioAlvo.id) {
      return false;
    }

    if (usuarioAtual.perfil === "DESENVOLVEDOR") {
      return true;
    }

    if (
      !usuarioAtual.municipio_id ||
      usuarioAtual.municipio_id !== usuarioAlvo.municipio_id
    ) {
      return false;
    }

    const perfilAlvo = usuarioAlvo.perfil || "CONSULTA";

    return (
      NIVEL_PERFIL[usuarioAtual.perfil] > NIVEL_PERFIL[perfilAlvo]
    );
  }

  async function alterarStatusUsuario(
    usuario: Usuario,
    novoStatus: Exclude<StatusUsuario, "PENDENTE">
  ) {
    if (!podeGerenciar(usuario)) {
      alert("Você não possui permissão para alterar este usuário.");
      return;
    }

    const confirmar = window.confirm(
      `Deseja alterar o status de ${usuario.nome} para ${novoStatus}?`
    );

    if (!confirmar) return;

    setAcaoEmAndamento(usuario.id);

    try {
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError || !session?.access_token) {
        throw new Error("Sessão inválida ou expirada.");
      }

      const resposta = await fetch(
        `/api/usuarios/${usuario.id}/status`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            status: novoStatus,
          }),
        }
      );

      const texto = await resposta.text();
      let dados: RespostaApi = {};

      if (texto) {
        try {
          dados = JSON.parse(texto) as RespostaApi;
        } catch {
          throw new Error("A API retornou uma resposta inválida.");
        }
      }

      if (!resposta.ok) {
        throw new Error(
          dados.erro || "Erro ao alterar o status do usuário."
        );
      }

      setUsuarios((lista) =>
        lista.map((item) =>
          item.id === usuario.id
            ? {
                ...item,
                status: novoStatus,
                tentativas_login:
                  novoStatus === "ATIVO"
                    ? 0
                    : item.tentativas_login,
                guarda_id:
                  dados.usuario?.guarda_id ??
                  item.guarda_id,
              }
            : item
        )
      );
    } catch (error) {
      console.error("Erro ao alterar status do usuário:", {
        message: mensagemErro(error),
        error,
      });

      alert(mensagemErro(error));
    } finally {
      setAcaoEmAndamento(null);
    }
  }

  const mapaMunicipios = useMemo(
    () =>
      new Map(
        municipios.map((municipio) => [
          municipio.id,
          municipio.nome,
        ])
      ),
    [municipios]
  );

  const usuariosFiltrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();

    if (!termo) return usuarios;

    return usuarios.filter((usuario) => {
      const texto = [
        usuario.nome,
        usuario.matricula,
        usuario.telefone,
        usuario.email,
        usuario.cpf,
        usuario.cargo,
        usuario.perfil,
        usuario.status,
        usuario.observacao,
        usuario.municipio_id
          ? mapaMunicipios.get(usuario.municipio_id)
          : "",
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return texto.includes(termo);
    });
  }, [busca, mapaMunicipios, usuarios]);

  const indicadores = useMemo(
    () => ({
      total: usuarios.length,
      ativos: usuarios.filter((item) => item.status === "ATIVO").length,
      pendentes: usuarios.filter(
        (item) => item.status === "PENDENTE"
      ).length,
      bloqueados: usuarios.filter(
        (item) => item.status === "BLOQUEADO"
      ).length,
      inativos: usuarios.filter(
        (item) => item.status === "INATIVO"
      ).length,
      admins: usuarios.filter((item) => item.perfil === "ADMIN").length,
      comandantes: usuarios.filter(
        (item) => item.perfil === "COMANDANTE"
      ).length,
      guardas: usuarios.filter((item) => item.perfil === "GUARDA")
        .length,
      consulta: usuarios.filter((item) => item.perfil === "CONSULTA")
        .length,
      bloqueioLogin: usuarios.filter(
        (item) => (item.tentativas_login || 0) >= 5
      ).length,
    }),
    [usuarios]
  );

  return (
    <ProtecaoModulo modulo="usuarios">
      <div className="p-3 pb-24 md:p-6">
        <header className="mb-6">
          <div className="border-b border-slate-800 pb-5">
            <h1 className="text-3xl font-bold tracking-tight md:text-5xl">
              Usuários
            </h1>

            <p className="mt-1 text-base text-slate-400 md:text-lg">
              Gestão segura de acessos, perfis e situação dos usuários.
            </p>

            <div className="mt-4 flex flex-wrap gap-3">
              <Link
                href="/sistema/usuarios/novo"
                className="inline-flex items-center justify-center rounded-xl bg-green-700 px-4 py-3 text-sm font-bold text-white hover:bg-green-600"
              >
                ➕ Novo Usuário
              </Link>

              <Link
                href="/sistema/usuarios/convites"
                className="inline-flex items-center justify-center rounded-xl bg-cyan-700 px-4 py-3 text-sm font-bold text-white hover:bg-cyan-600"
              >
                🔗 Convites por Link
              </Link>

              <Link
                href="/sistema/usuarios/recuperacao-senha"
                className="inline-flex items-center justify-center rounded-xl bg-yellow-700 px-4 py-3 text-sm font-bold text-white hover:bg-yellow-600"
              >
                🔐 Recuperação de Senha
              </Link>
            </div>
          </div>
        </header>

        <section className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-5 xl:grid-cols-10">
          <CardIndicador titulo="Total" valor={indicadores.total} icone="👮" cor="blue" />
          <CardIndicador titulo="Ativos" valor={indicadores.ativos} icone="🟢" cor="green" />
          <CardIndicador titulo="Pendentes" valor={indicadores.pendentes} icone="🟡" cor="yellow" />
          <CardIndicador titulo="Bloqueados" valor={indicadores.bloqueados} icone="🔴" cor="red" />
          <CardIndicador titulo="Inativos" valor={indicadores.inativos} icone="⚫" cor="purple" />
          <CardIndicador titulo="Admins" valor={indicadores.admins} icone="🛡️" cor="purple" />
          <CardIndicador titulo="Comandantes" valor={indicadores.comandantes} icone="⭐" cor="blue" />
          <CardIndicador titulo="Guardas" valor={indicadores.guardas} icone="👮" cor="green" />
          <CardIndicador titulo="Consulta" valor={indicadores.consulta} icone="📄" cor="blue" />
          <CardIndicador titulo="Bloq. Login" valor={indicadores.bloqueioLogin} icone="🔒" cor="red" />
        </section>

        <section className="card">
          <h2 className="mb-4 text-xl font-bold md:text-2xl">
            Usuários cadastrados
          </h2>

          <div className="mb-5 rounded-2xl border border-slate-800 bg-slate-950/30 p-4">
            <label className="label">🔍 Buscar usuário</label>

            <input
              className="input"
              placeholder="Nome, CPF, e-mail, matrícula, perfil, status ou município..."
              value={busca}
              onChange={(event) => setBusca(event.target.value)}
            />
          </div>

          {carregando ? (
            <p className="text-slate-400">Carregando usuários...</p>
          ) : usuariosFiltrados.length === 0 ? (
            <p className="text-slate-400">
              Nenhum usuário encontrado.
            </p>
          ) : (
            <>
              <div className="space-y-4 md:hidden">
                {usuariosFiltrados.map((usuario) => (
                  <article
                    key={usuario.id}
                    className="space-y-3 rounded-2xl border border-slate-700 bg-slate-950/40 p-5 shadow-lg"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-blue-400">
                          {usuario.matricula || "Sem matrícula"}
                        </p>
                        <h3 className="text-xl font-bold">
                          {usuario.nome}
                        </h3>
                      </div>

                      <Status status={usuario.status || "INATIVO"} />
                    </div>

                    <Linha nome="E-mail" valor={usuario.email || "-"} />
                    <Linha nome="Telefone" valor={usuario.telefone || "-"} />
                    <Linha nome="CPF" valor={mascararCpf(usuario.cpf)} />
                    <Linha nome="Perfil" valor={usuario.perfil || "-"} />
                    <Linha
                      nome="Município"
                      valor={
                        usuario.municipio_id
                          ? mapaMunicipios.get(usuario.municipio_id) || "-"
                          : "-"
                      }
                    />
                    <Linha
                      nome="Último login"
                      valor={
                        usuario.ultimo_login
                          ? new Date(
                              usuario.ultimo_login
                            ).toLocaleString("pt-BR")
                          : "-"
                      }
                    />

                    <AcoesUsuario
                      usuario={usuario}
                      podeGerenciar={podeGerenciar(usuario)}
                      processando={acaoEmAndamento === usuario.id}
                      onVer={() =>
                        router.push(`/sistema/usuarios/${usuario.id}`)
                      }
                      onEditar={() =>
                        router.push(
                          `/sistema/usuarios/${usuario.id}/editar`
                        )
                      }
                      onAlterarStatus={alterarStatusUsuario}
                    />
                  </article>
                ))}
              </div>

              <div className="hidden overflow-x-auto md:block">
                <table className="w-full text-sm">
                  <thead className="border-b border-slate-700 text-slate-400">
                    <tr>
                      <th className="py-3 text-left">Usuário</th>
                      <th className="py-3 text-left">Matrícula</th>
                      <th className="py-3 text-left">CPF</th>
                      <th className="py-3 text-left">Município</th>
                      <th className="py-3 text-left">E-mail</th>
                      <th className="py-3 text-left">Perfil</th>
                      <th className="py-3 text-left">Status</th>
                      <th className="py-3 text-left">Último login</th>
                      <th className="py-3 text-left">Tentativas</th>
                      <th className="py-3 text-right">Ações</th>
                    </tr>
                  </thead>

                  <tbody>
                    {usuariosFiltrados.map((usuario) => (
                      <tr
                        key={usuario.id}
                        className="border-b border-slate-800"
                      >
                        <td className="py-4">
                          <div className="flex items-center gap-3">
                            {usuario.foto_url ? (
                              <img
                                src={usuario.foto_url}
                                alt={usuario.nome}
                                className="h-10 w-10 rounded-full border border-slate-700 object-cover"
                              />
                            ) : (
                              <div className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-700 bg-slate-800 text-xs font-black text-slate-400">
                                {usuario.nome.charAt(0) || "U"}
                              </div>
                            )}

                            <span className="font-semibold text-blue-400">
                              {usuario.nome}
                            </span>
                          </div>
                        </td>

                        <td>{usuario.matricula || "-"}</td>
                        <td>{mascararCpf(usuario.cpf)}</td>
                        <td>
                          {usuario.municipio_id
                            ? mapaMunicipios.get(usuario.municipio_id) || "-"
                            : "-"}
                        </td>
                        <td className="text-slate-400">
                          {usuario.email || "-"}
                        </td>
                        <td>{usuario.perfil || "-"}</td>
                        <td>
                          <Status
                            status={usuario.status || "INATIVO"}
                          />
                        </td>
                        <td className="text-xs text-slate-300">
                          {usuario.ultimo_login
                            ? new Date(
                                usuario.ultimo_login
                              ).toLocaleString("pt-BR")
                            : "-"}
                        </td>
                        <td>
                          {(usuario.tentativas_login || 0) >= 5 ? (
                            <span className="rounded bg-red-700 px-2 py-1 text-red-100">
                              🔒 {usuario.tentativas_login}
                            </span>
                          ) : (
                            <span>
                              {usuario.tentativas_login || 0}
                            </span>
                          )}
                        </td>
                        <td className="text-right">
                          <AcoesUsuario
                            compacto
                            usuario={usuario}
                            podeGerenciar={podeGerenciar(usuario)}
                            processando={acaoEmAndamento === usuario.id}
                            onVer={() =>
                              router.push(
                                `/sistema/usuarios/${usuario.id}`
                              )
                            }
                            onEditar={() =>
                              router.push(
                                `/sistema/usuarios/${usuario.id}/editar`
                              )
                            }
                            onAlterarStatus={alterarStatusUsuario}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </section>
      </div>
    </ProtecaoModulo>
  );
}

function AcoesUsuario({
  usuario,
  podeGerenciar,
  processando,
  compacto = false,
  onVer,
  onEditar,
  onAlterarStatus,
}: {
  usuario: Usuario;
  podeGerenciar: boolean;
  processando: boolean;
  compacto?: boolean;
  onVer: () => void;
  onEditar: () => void;
  onAlterarStatus: (
    usuario: Usuario,
    status: Exclude<StatusUsuario, "PENDENTE">
  ) => Promise<void>;
}) {
  const classeBase = compacto
    ? "rounded-lg px-3 py-2 text-xs"
    : "rounded-xl px-4 py-3 font-semibold";

  return (
    <div
      className={
        compacto
          ? "flex flex-wrap justify-end gap-2"
          : "grid grid-cols-2 gap-2 pt-2"
      }
    >
      <button
        type="button"
        onClick={onVer}
        className={`bg-cyan-700 text-white hover:bg-cyan-800 ${classeBase}`}
      >
        Ver
      </button>

      {podeGerenciar && (
        <button
          type="button"
          onClick={onEditar}
          disabled={processando}
          className={`bg-blue-700 text-white hover:bg-blue-800 disabled:opacity-50 ${classeBase}`}
        >
          Editar
        </button>
      )}

      {podeGerenciar && usuario.status === "PENDENTE" && (
        <button
          type="button"
          onClick={() => void onAlterarStatus(usuario, "ATIVO")}
          disabled={processando}
          className={`bg-green-700 text-white hover:bg-green-800 disabled:opacity-50 ${classeBase}`}
        >
          Aprovar
        </button>
      )}

      {podeGerenciar && usuario.status === "BLOQUEADO" && (
        <button
          type="button"
          onClick={() => void onAlterarStatus(usuario, "ATIVO")}
          disabled={processando}
          className={`bg-green-700 text-white hover:bg-green-800 disabled:opacity-50 ${classeBase}`}
        >
          Desbloquear
        </button>
      )}

      {podeGerenciar &&
        usuario.status !== "BLOQUEADO" &&
        usuario.status !== "INATIVO" && (
          <button
            type="button"
            onClick={() =>
              void onAlterarStatus(usuario, "BLOQUEADO")
            }
            disabled={processando}
            className={`bg-yellow-700 text-white hover:bg-yellow-800 disabled:opacity-50 ${classeBase}`}
          >
            Bloquear
          </button>
        )}

      {podeGerenciar && usuario.status !== "INATIVO" && (
        <button
          type="button"
          onClick={() =>
            void onAlterarStatus(usuario, "INATIVO")
          }
          disabled={processando}
          className={`bg-red-700 text-white hover:bg-red-800 disabled:opacity-50 ${classeBase}`}
        >
          Inativar
        </button>
      )}

      {podeGerenciar && usuario.status === "INATIVO" && (
        <button
          type="button"
          onClick={() => void onAlterarStatus(usuario, "ATIVO")}
          disabled={processando}
          className={`bg-green-700 text-white hover:bg-green-800 disabled:opacity-50 ${classeBase}`}
        >
          Reativar
        </button>
      )}
    </div>
  );
}

function Linha({ nome, valor }: { nome: string; valor: string }) {
  return (
    <div className="flex justify-between gap-4 border-b border-slate-800 pb-2">
      <span className="text-slate-400">{nome}</span>
      <span className="text-right">{valor}</span>
    </div>
  );
}

function Status({ status }: { status: StatusUsuario }) {
  let cor = "bg-slate-700 text-slate-100";

  if (status === "ATIVO") {
    cor = "bg-green-700 text-green-100";
  }

  if (status === "PENDENTE") {
    cor = "bg-yellow-600 text-yellow-100";
  }

  if (status === "BLOQUEADO") {
    cor = "bg-red-700 text-red-100";
  }

  return (
    <span
      className={`${cor} inline-block rounded px-3 py-2 text-xs`}
    >
      {status}
    </span>
  );
}
