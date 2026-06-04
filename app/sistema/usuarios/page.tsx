"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import ProtecaoPerfil from "@/components/ProtecaoPerfil";
import CardIndicador from "@/components/CardIndicador";

type Usuario = {
  id: number;
  nome: string;
  matricula: string | null;
  telefone: string | null;
  email: string | null;
  perfil: string | null;
  status: string | null;
  observacao: string | null;
};

export default function Usuarios() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [busca, setBusca] = useState("");

  const [nome, setNome] = useState("");
  const [matricula, setMatricula] = useState("");
  const [telefone, setTelefone] = useState("");
  const [email, setEmail] = useState("");
  const [perfil, setPerfil] = useState("GUARDA");
  const [status, setStatus] = useState("Ativo");
  const [observacao, setObservacao] = useState("");

  const [carregando, setCarregando] = useState(true);

  async function carregarUsuarios() {
    setCarregando(true);

    const { data, error } = await supabase
      .from("usuarios")
      .select("*")
      .order("id", { ascending: false });

    if (error) {
      console.error(error);
      alert("Erro ao carregar usuários.");
      setCarregando(false);
      return;
    }

    setUsuarios(data || []);
    setCarregando(false);
  }

  async function salvarUsuario() {
    if (!nome || !email || !perfil) {
      alert("Preencha nome, email e perfil.");
      return;
    }

    const { error } = await supabase.from("usuarios").insert([
      {
        nome,
        matricula,
        telefone,
        email,
        perfil,
        status,
        observacao,
      },
    ]);

    if (error) {
      console.error(error);
      alert("Erro ao salvar usuário.");
      return;
    }

    alert("Usuário cadastrado com sucesso!");

    setNome("");
    setMatricula("");
    setTelefone("");
    setEmail("");
    setPerfil("GUARDA");
    setStatus("Ativo");
    setObservacao("");

    carregarUsuarios();
  }

  async function excluirUsuario(id: number) {
    const confirmar = confirm("Deseja excluir este usuário?");

    if (!confirmar) return;

    const { error } = await supabase
      .from("usuarios")
      .delete()
      .eq("id", id);

    if (error) {
      console.error(error);
      alert("Erro ao excluir usuário.");
      return;
    }

    carregarUsuarios();
  }

  useEffect(() => {
    carregarUsuarios();
  }, []);

  const usuariosFiltrados = usuarios.filter((usuario) => {
    const texto = `
      ${usuario.nome}
      ${usuario.matricula || ""}
      ${usuario.telefone || ""}
      ${usuario.email || ""}
      ${usuario.perfil || ""}
      ${usuario.status || ""}
      ${usuario.observacao || ""}
    `.toLowerCase();

    return texto.includes(busca.toLowerCase());
  });

  return (
  <ProtecaoPerfil perfisPermitidos={["ADMIN"]}>
    <div className="p-3 md:p-6 pb-24">
      <header className="mb-6">
  <div className="border-b border-slate-800 pb-5">
    <h1 className="text-3xl md:text-5xl font-bold tracking-tight">
      Usuários
    </h1>

    <p className="text-slate-400 text-base md:text-lg mt-1">
      Gestão de acessos, perfis e permissões do sistema.
    </p>
  </div>
</header>

      <section className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">

  <CardIndicador
    titulo="Usuários"
    valor={usuarios.length}
    icone="👮"
    cor="blue"
  />

  <CardIndicador
    titulo="Ativos"
    valor={usuarios.filter((u) => u.status === "Ativo").length}
    icone="✅"
    cor="green"
  />

  <CardIndicador
    titulo="Admins"
    valor={usuarios.filter((u) => u.perfil === "ADMIN").length}
    icone="🛡️"
    cor="purple"
  />

  <CardIndicador
    titulo="Inativos"
    valor={usuarios.filter((u) => u.status !== "Ativo").length}
    icone="⛔"
    cor="red"
  />

</section>

      <section className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="card">
          <h2 className="text-xl md:text-2xl font-bold mb-4">
            Novo Usuário
          </h2>

          <div className="space-y-4">
            <Campo
              label="Nome completo"
              valor={nome}
              setValor={setNome}
              placeholder="Nome do usuário"
            />

            <Campo
              label="Matrícula"
              valor={matricula}
              setValor={setMatricula}
              placeholder="Ex: GCM-001"
            />

            <Campo
              label="Telefone"
              valor={telefone}
              setValor={setTelefone}
              placeholder="(75) 99999-9999"
            />

            <Campo
              label="Email de acesso"
              valor={email}
              setValor={setEmail}
              placeholder="usuario@email.com"
            />

            <div>
              <label className="label">Perfil</label>
              <select
                className="input"
                value={perfil}
                onChange={(e) => setPerfil(e.target.value)}
              >
                <option>ADMIN</option>
                <option>COMANDANTE</option>
                <option>OPERADOR</option>
                <option>GUARDA</option>
              </select>
            </div>

            <div>
              <label className="label">Status</label>
              <select
                className="input"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                <option>Ativo</option>
                <option>Inativo</option>
                <option>Bloqueado</option>
              </select>
            </div>

            <div>
              <label className="label">Observação</label>
              <textarea
                className="input h-28 resize-none"
                value={observacao}
                onChange={(e) => setObservacao(e.target.value)}
                placeholder="Observações sobre o usuário..."
              />
            </div>

            <button
              type="button"
              onClick={salvarUsuario}
              className="btn-primary w-full text-lg"
            >
              Salvar Usuário
            </button>
          </div>
        </div>

        <div className="card xl:col-span-2">
          <h2 className="text-xl md:text-2xl font-bold mb-4">
            Usuários Cadastrados
          </h2>

          <div className="mb-5 bg-slate-950/30 border border-slate-800 rounded-2xl p-4">
  <label className="label">🔍 Buscar usuário</label>

  <input
    className="input"
    placeholder="Nome, email, matrícula ou perfil..."
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

                        <h3 className="text-xl font-bold">
                          {usuario.nome}
                        </h3>
                      </div>

                      <Status status={usuario.status || "-"} />
                    </div>

                    <Linha nome="Email" valor={usuario.email || "-"} />
                    <Linha nome="Telefone" valor={usuario.telefone || "-"} />
                    <Linha nome="Perfil" valor={usuario.perfil || "-"} />

                    {usuario.observacao && (
                      <p className="text-slate-400">
                        {usuario.observacao}
                      </p>
                    )}

                    <button
                      type="button"
                      onClick={() => excluirUsuario(usuario.id)}
                      className="w-full bg-red-700 hover:bg-red-800 text-white px-4 py-3 rounded-xl font-semibold"
                    >
                      Excluir
                    </button>
                  </div>
                ))}
              </div>

              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="text-slate-400 border-b border-slate-700">
                    <tr>
                      <th className="text-left py-3">Nome</th>
                      <th className="text-left py-3">Matrícula</th>
                      <th className="text-left py-3">Email</th>
                      <th className="text-left py-3">Perfil</th>
                      <th className="text-left py-3">Status</th>
                      <th className="text-right py-3">Ações</th>
                    </tr>
                  </thead>

                  <tbody>
                    {usuariosFiltrados.map((usuario) => (
                      <tr key={usuario.id} className="border-b border-slate-800">
                        <td className="py-4 text-blue-400 font-semibold">
                          {usuario.nome}
                        </td>
                        <td>{usuario.matricula || "-"}</td>
                        <td className="text-slate-400">
                          {usuario.email || "-"}
                        </td>
                        <td>{usuario.perfil || "-"}</td>
                        <td>
                          <Status status={usuario.status || "-"} />
                        </td>
                        <td className="text-right">
                          <button
                            type="button"
                            onClick={() => excluirUsuario(usuario.id)}
                            className="bg-red-700 hover:bg-red-800 text-white px-3 py-2 rounded-lg text-xs"
                          >
                            Excluir
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </section>
        </div>
    </ProtecaoPerfil>
);
}

function Campo({
  label,
  valor,
  setValor,
  placeholder,
}: {
  label: string;
  valor: string;
  setValor: (valor: string) => void;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="label">{label}</label>

      <input
        className="input"
        placeholder={placeholder}
        value={valor}
        onChange={(e) => setValor(e.target.value)}
      />
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

function Status({ status }: { status: string }) {
  let cor = "bg-slate-700 text-slate-100";

  if (status === "Ativo") cor = "bg-green-700 text-green-100";
  if (status === "Inativo") cor = "bg-yellow-600 text-yellow-100";
  if (status === "Bloqueado") cor = "bg-red-700 text-red-100";

  return (
    <span className={`${cor} px-3 py-2 rounded text-xs inline-block`}>
      {status}
    </span>
  );
}