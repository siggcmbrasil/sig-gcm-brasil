"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { supabase } from "@/lib/supabase";
import CardIndicador from "@/components/CardIndicador";
import ProtecaoModulo from "@/components/ProtecaoModulo";
import { registrarAuditoria } from "@/lib/auditoria";

type Usuario = {
  id: number;
  nome: string;
  matricula: string | null;
  telefone: string | null;
  email: string | null;
  cpf: string | null;
  cargo: string | null;
  perfil: string | null;
  status: string | null;
  observacao: string | null;
  municipio_id: number | null;
  foto_url: string | null;
  ultimo_login: string | null;
  ultimo_ip: string | null;
  ultimo_dispositivo: string | null;
  ultimo_navegador: string | null;
  tentativas_login: number | null;
};

export default function Usuarios() {
  const router = useRouter();

  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [municipios, setMunicipios] = useState<any[]>([]);
  const [busca, setBusca] = useState("");
  const [carregando, setCarregando] = useState(true);

  const usuarioLogado =
    typeof window !== "undefined"
      ? JSON.parse(localStorage.getItem("usuarioLogado") || "{}")
      : {};

  async function carregarUsuarios() {
    setCarregando(true);

    let query = supabase.from("usuarios").select("*").order("id", {
      ascending: false,
    });

    if (usuarioLogado.perfil !== "DESENVOLVEDOR") {
      query = query.eq("municipio_id", usuarioLogado.municipio_id);
    }

    const { data, error } = await query;

    if (error) {
      console.error(error);
      alert("Erro ao carregar usuários.");
      setCarregando(false);
      return;
    }

    setUsuarios(data || []);

    const { data: municipiosData } = await supabase
      .from("municipios")
      .select("id, nome, estado")
      .order("nome");

    setMunicipios(municipiosData || []);
    setCarregando(false);
  }

  useEffect(() => {
    carregarUsuarios();
  }, []);

  async function alterarStatusUsuario(
    usuario: Usuario,
    novoStatus: "ATIVO" | "INATIVO" | "BLOQUEADO"
  ) {
    const confirmar = confirm(
      `Deseja alterar o status de ${usuario.nome} para ${novoStatus}?`
    );

    if (!confirmar) return;

    let query = supabase
      .from("usuarios")
      .update({
        status: novoStatus,
        aprovado_por: usuarioLogado.id,
        aprovado_em: new Date().toISOString(),
        tentativas_login: novoStatus === "ATIVO" ? 0 : usuario.tentativas_login,
      })
      .eq("id", usuario.id);

    if (usuarioLogado.perfil !== "DESENVOLVEDOR") {
      query = query.eq("municipio_id", usuarioLogado.municipio_id);
    }

    const { error } = await query;

    if (error) {
      console.error(error);
      alert("Erro ao alterar status do usuário.");
      return;
    }

    await registrarAuditoria({
      modulo: "Usuários",
      acao: "ALTERAR_STATUS",
      descricao: `Alterou o status do usuário ${usuario.nome} para ${novoStatus}.`,
    });

    carregarUsuarios();
  }

  async function excluirUsuario(id: number) {
    const confirmar = confirm("Deseja excluir este usuário?");

    if (!confirmar) return;

    const usuarioExcluido = usuarios.find((u) => u.id === id);

    let query = supabase.from("usuarios").delete().eq("id", id);

    if (usuarioLogado.perfil !== "DESENVOLVEDOR") {
      query = query.eq("municipio_id", usuarioLogado.municipio_id);
    }

    const { error } = await query;

    if (error) {
      console.error(error);
      alert("Erro ao excluir usuário.");
      return;
    }

    await registrarAuditoria({
      modulo: "Usuários",
      acao: "EXCLUIR",
      descricao: `Excluiu o usuário ${usuarioExcluido?.nome || `ID ${id}`}.`,
    });

    carregarUsuarios();
  }

  const usuariosFiltrados = usuarios.filter((usuario) => {
    const texto = `
      ${usuario.nome || ""}
      ${usuario.matricula || ""}
      ${usuario.telefone || ""}
      ${usuario.email || ""}
      ${usuario.cpf || ""}
      ${usuario.perfil || ""}
      ${usuario.status || ""}
      ${usuario.observacao || ""}
    `.toLowerCase();

    return texto.includes(busca.toLowerCase());
  });

  return (
    <ProtecaoModulo modulo="usuarios">
      <div className="p-3 md:p-6 pb-24">
        <header className="mb-6">
          <div className="border-b border-slate-800 pb-5">
            <h1 className="text-3xl md:text-5xl font-bold tracking-tight">
              Usuários
            </h1>

            <p className="text-slate-400 text-base md:text-lg mt-1">
              Gestão de acessos, perfis, segurança e permissões do sistema.
            </p>

            <div className="flex flex-wrap gap-3 mt-4">
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

        <section className="grid grid-cols-2 md:grid-cols-5 xl:grid-cols-10 gap-3 mb-6">
          <CardIndicador titulo="Total" valor={usuarios.length} icone="👮" cor="blue" />
          <CardIndicador titulo="Ativos" valor={usuarios.filter((u) => u.status === "ATIVO").length} icone="🟢" cor="green" />
          <CardIndicador titulo="Pendentes" valor={usuarios.filter((u) => u.status === "PENDENTE").length} icone="🟡" cor="yellow" />
          <CardIndicador titulo="Bloqueados" valor={usuarios.filter((u) => u.status === "BLOQUEADO").length} icone="🔴" cor="red" />
          <CardIndicador titulo="Inativos" valor={usuarios.filter((u) => u.status === "INATIVO").length} icone="⚫" cor="purple" />
          <CardIndicador titulo="Admins" valor={usuarios.filter((u) => u.perfil === "ADMIN").length} icone="🛡️" cor="purple" />
          <CardIndicador titulo="Comandantes" valor={usuarios.filter((u) => u.perfil === "COMANDANTE").length} icone="⭐" cor="blue" />
          <CardIndicador titulo="Guardas" valor={usuarios.filter((u) => u.perfil === "GUARDA").length} icone="👮" cor="green" />
          <CardIndicador titulo="Consulta" valor={usuarios.filter((u) => u.perfil === "CONSULTA").length} icone="📄" cor="blue" />
          <CardIndicador titulo="Bloq. Login" valor={usuarios.filter((u) => (u.tentativas_login || 0) >= 5).length} icone="🔒" cor="red" />
        </section>

        <section className="card">
          <h2 className="text-xl md:text-2xl font-bold mb-4">
            Usuários Cadastrados
          </h2>

          <div className="mb-5 bg-slate-950/30 border border-slate-800 rounded-2xl p-4">
            <label className="label">🔍 Buscar usuário</label>

            <input
              className="input"
              placeholder="Nome, CPF, email, matrícula, perfil ou status..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
            />
          </div>

          {carregando ? (
            <p className="text-slate-400">Carregando usuários...</p>
          ) : usuariosFiltrados.length === 0 ? (
            <p className="text-slate-400">Nenhum usuário encontrado.</p>
          ) : (
            <>
              <div className="md:hidden space-y-4">
                {usuariosFiltrados.map((usuario) => (
                  <div
                    key={usuario.id}
                    className="bg-slate-950/40 border border-slate-700 rounded-2xl p-5 space-y-3 shadow-lg"
                  >
                    <div className="flex justify-between gap-3 items-start">
                      <div>
                        <p className="text-blue-400 font-semibold">
                          {usuario.matricula || "Sem matrícula"}
                        </p>

                        <h3 className="text-xl font-bold">{usuario.nome}</h3>
                      </div>

                      <Status status={usuario.status || "-"} />
                    </div>

                    <Linha nome="Email" valor={usuario.email || "-"} />
                    <Linha nome="Telefone" valor={usuario.telefone || "-"} />
                    <Linha nome="Perfil" valor={usuario.perfil || "-"} />
                    <Linha
                      nome="Último login"
                      valor={
                        usuario.ultimo_login
                          ? new Date(usuario.ultimo_login).toLocaleString("pt-BR")
                          : "-"
                      }
                    />

                    <div className="grid grid-cols-2 gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => router.push(`/sistema/usuarios/${usuario.id}`)}
                        className="bg-cyan-700 hover:bg-cyan-800 text-white px-4 py-3 rounded-xl font-semibold"
                      >
                        Ver
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          router.push(`/sistema/usuarios/${usuario.id}/editar`)
                        }
                        className="bg-blue-700 hover:bg-blue-800 text-white px-4 py-3 rounded-xl font-semibold"
                      >
                        Editar
                      </button>

                      {usuario.status === "BLOQUEADO" ? (
                        <button
                          type="button"
                          onClick={() => alterarStatusUsuario(usuario, "ATIVO")}
                          className="bg-green-700 hover:bg-green-800 text-white px-4 py-3 rounded-xl font-semibold"
                        >
                          Desbloquear
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => alterarStatusUsuario(usuario, "BLOQUEADO")}
                          className="bg-yellow-700 hover:bg-yellow-800 text-white px-4 py-3 rounded-xl font-semibold"
                        >
                          Bloquear
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => excluirUsuario(usuario.id)}
                        className="bg-red-700 hover:bg-red-800 text-white px-4 py-3 rounded-xl font-semibold"
                      >
                        Excluir
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="text-slate-400 border-b border-slate-700">
                    <tr>
                      <th className="text-left py-3">Usuário</th>
                      <th className="text-left py-3">Matrícula</th>
                      <th className="text-left py-3">CPF</th>
                      <th className="text-left py-3">Município</th>
                      <th className="text-left py-3">Email</th>
                      <th className="text-left py-3">Perfil</th>
                      <th className="text-left py-3">Status</th>
                      <th className="text-left py-3">Último Login</th>
                      <th className="text-left py-3">Tentativas</th>
                      <th className="text-right py-3">Ações</th>
                    </tr>
                  </thead>

                  <tbody>
                    {usuariosFiltrados.map((usuario) => (
                      <tr key={usuario.id} className="border-b border-slate-800">
                        <td className="py-4">
                          <div className="flex items-center gap-3">
                            {usuario.foto_url ? (
                              <img
                                src={usuario.foto_url}
                                alt={usuario.nome}
                                className="w-10 h-10 rounded-full object-cover border border-slate-700"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-black text-slate-400">
                                {usuario.nome?.charAt(0) || "U"}
                              </div>
                            )}

                            <span className="text-blue-400 font-semibold">
                              {usuario.nome}
                            </span>
                          </div>
                        </td>

                        <td>{usuario.matricula || "-"}</td>
                        <td>{usuario.cpf || "-"}</td>

                        <td>
                          {municipios.find((m) => m.id === usuario.municipio_id)
                            ?.nome || "-"}
                        </td>

                        <td className="text-slate-400">{usuario.email || "-"}</td>
                        <td>{usuario.perfil || "-"}</td>

                        <td>
                          <Status status={usuario.status || "-"} />
                        </td>

                        <td className="text-xs text-slate-300">
                          {usuario.ultimo_login
                            ? new Date(usuario.ultimo_login).toLocaleString("pt-BR")
                            : "-"}
                        </td>

                        <td>
                          {(usuario.tentativas_login || 0) >= 5 ? (
                            <span className="bg-red-700 text-red-100 px-2 py-1 rounded">
                              🔒 {usuario.tentativas_login}
                            </span>
                          ) : (
                            <span>{usuario.tentativas_login || 0}</span>
                          )}
                        </td>

                        <td className="text-right">
                          <div className="flex flex-wrap justify-end gap-2">
                            {usuario.status === "PENDENTE" && (
                              <>
                                <button
                                  type="button"
                                  onClick={() =>
                                    alterarStatusUsuario(usuario, "ATIVO")
                                  }
                                  className="bg-green-700 hover:bg-green-800 text-white px-3 py-2 rounded-lg text-xs"
                                >
                                  Aprovar
                                </button>

                                <button
                                  type="button"
                                  onClick={() =>
                                    alterarStatusUsuario(usuario, "BLOQUEADO")
                                  }
                                  className="bg-yellow-700 hover:bg-yellow-800 text-white px-3 py-2 rounded-lg text-xs"
                                >
                                  Rejeitar
                                </button>
                              </>
                            )}

                            <Link
                              href={`/sistema/usuarios/${usuario.id}`}
                              className="bg-cyan-700 hover:bg-cyan-800 text-white px-3 py-2 rounded-lg text-xs"
                            >
                              Ver
                            </Link>

                            <button
                              type="button"
                              onClick={() =>
                                router.push(`/sistema/usuarios/${usuario.id}/editar`)
                              }
                              className="bg-blue-700 hover:bg-blue-800 text-white px-3 py-2 rounded-lg text-xs"
                            >
                              Editar
                            </button>

                            {usuario.status === "BLOQUEADO" ? (
                              <button
                                type="button"
                                onClick={() => alterarStatusUsuario(usuario, "ATIVO")}
                                className="bg-green-700 hover:bg-green-800 text-white px-3 py-2 rounded-lg text-xs"
                              >
                                Desbloquear
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() =>
                                  alterarStatusUsuario(usuario, "BLOQUEADO")
                                }
                                className="bg-yellow-700 hover:bg-yellow-800 text-white px-3 py-2 rounded-lg text-xs"
                              >
                                Bloquear
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={() => excluirUsuario(usuario.id)}
                              className="bg-red-700 hover:bg-red-800 text-white px-3 py-2 rounded-lg text-xs"
                            >
                              Excluir
                            </button>
                          </div>
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

function Linha({ nome, valor }: { nome: string; valor: string }) {
  return (
    <div className="flex justify-between gap-4 border-b border-slate-800 pb-2">
      <span className="text-slate-400">{nome}</span>
      <span className="text-right">{valor}</span>
    </div>
  );
}

function Status({ status }: { status: string }) {
  let cor = "bg-slate-700 text-slate-100";

  if (status === "ATIVO") cor = "bg-green-700 text-green-100";
  if (status === "PENDENTE") cor = "bg-yellow-600 text-yellow-100";
  if (status === "INATIVO") cor = "bg-slate-700 text-slate-100";
  if (status === "BLOQUEADO") cor = "bg-red-700 text-red-100";

  return (
    <span className={`${cor} px-3 py-2 rounded text-xs inline-block`}>
      {status}
    </span>
  );
}