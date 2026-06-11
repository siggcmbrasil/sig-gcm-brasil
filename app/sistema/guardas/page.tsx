"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type Guarda = {
  id: number;
  matricula: string;
  nome: string;
  cargo: string;
  telefone: string | null;
  status: string;
  municipio_id: 1,
  data_nascimento: string | null;
};

export default function Guardas() {
  const [guardas, setGuardas] = useState<Guarda[]>([]);
  const [busca, setBusca] = useState("");

  const [matricula, setMatricula] = useState("");
  const [nome, setNome] = useState("");
  const [cargo, setCargo] = useState("");
  const [telefone, setTelefone] = useState("");
  const [status, setStatus] = useState("Em serviço");
  const [dataNascimento, setDataNascimento] = useState("");
  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [carregando, setCarregando] = useState(true);
  const usuarioLogado =
  typeof window !== "undefined"
    ? JSON.parse(localStorage.getItem("usuarioLogado") || "{}")
    : {};

const perfilUsuario = usuarioLogado?.perfil || "CONSULTA";

const podeEditar = perfilUsuario !== "CONSULTA";

  async function carregarGuardas() {
    setCarregando(true);

    const { data, error } = await supabase
      .from("guardas")
      .select("*")
      .order("id", { ascending: false });

    if (error) {
      console.error(error);
      alert("Erro ao carregar guardas.");
      setCarregando(false);
      return;
    }

    setGuardas(data || []);
    setCarregando(false);
  }

  async function salvarGuarda() {
if (editandoId) {
  const { error } = await supabase
    .from("guardas")
    .update({
      matricula,
      nome,
      cargo,
      telefone,
      status,
      data_nascimento: dataNascimento || null,
    })
    .eq("id", editandoId);

  if (error) {
    console.error(error);
    alert("Erro ao atualizar guarda.");
    return;
  }

  alert("Guarda atualizado com sucesso!");

  limparFormulario();
  carregarGuardas();
  return;
}

  if (!podeEditar) {
    alert("Você não possui permissão para cadastrar guardas.");
    return;
  }
    if (!matricula || !nome || !cargo) {
      alert("Preencha matrícula, nome e cargo.");
      return;
    }

    const { error } = await supabase.from("guardas").insert([
      {
  matricula,
  nome,
  cargo,
  telefone,
  status,
  data_nascimento: dataNascimento || null,
}
    ]);

    if (error) {
      console.error(error);
      alert("Erro ao cadastrar guarda.");
      return;
    }

    alert("Guarda cadastrado com sucesso!");

    setMatricula("");
    setNome("");
    setCargo("");
    setTelefone("");
    setStatus("Em serviço");
    setDataNascimento("");

    carregarGuardas();
  }
function editarGuarda(guarda: Guarda) {
  setEditandoId(guarda.id);
  setMatricula(guarda.matricula);
  setNome(guarda.nome);
  setCargo(guarda.cargo);
  setTelefone(guarda.telefone || "");
  setStatus(guarda.status);
  setDataNascimento(guarda.data_nascimento || "");
}

  async function excluirGuarda(id: number) {
    if (!podeEditar) {
      alert("Você não possui permissão para excluir guardas.");
      return;
    }

    const confirmar = confirm("Tem certeza que deseja excluir este guarda?");

    if (!confirmar) return;

    const { error } = await supabase.from("guardas").delete().eq("id", id);

    if (error) {
      console.error(error);
      alert("Erro ao excluir guarda.");
      return;
    }

    alert("Guarda excluído com sucesso.");
    carregarGuardas();
  }

  useEffect(() => {
    carregarGuardas();
  }, []);

  const guardasFiltrados = guardas.filter((guarda) => {
    const texto = `
      ${guarda.matricula}
      ${guarda.nome}
      ${guarda.cargo}
      ${guarda.telefone || ""}
      ${guarda.status}
    `.toLowerCase();

    return texto.includes(busca.toLowerCase());
  });

function limparFormulario() {
  setEditandoId(null);
  setMatricula("");
  setNome("");
  setCargo("");
  setTelefone("");
  setStatus("Em serviço");
  setDataNascimento("");
}

function formatarData(data: string | null) {
  if (!data) return "-";

  const [ano, mes, dia] = data.split("-");
  return `${dia}/${mes}/${ano}`;
}

  return (
    <div className="p-3 md:p-6 pb-24">
      <header className="border-b border-slate-800 pb-5 mb-6">
        <h1 className="text-2xl md:text-3xl font-bold">Guardas</h1>

        <p className="text-slate-400 text-sm md:text-base">
          Cadastro e controle do efetivo da GCM Biritinga.
        </p>
      </header>

      <section className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card titulo="Efetivo total" valor={guardas.length} />

        <Card
          titulo="Em serviço"
          valor={guardas.filter((g) => g.status === "Em serviço").length}
        />

        <Card
          titulo="Folga"
          valor={guardas.filter((g) => g.status === "Folga").length}
        />

        <Card
          titulo="Férias"
          valor={guardas.filter((g) => g.status === "Férias").length}
        />
      </section>

      <section className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {podeEditar && (
  <div className="card">
    <h2 className="text-xl md:text-2xl font-bold mb-4">
      Cadastrar Guarda
    </h2>

          <div className="space-y-4">
            <div>
              <label className="label">Matrícula</label>
              <input
                className="input"
                value={matricula}
                onChange={(e) => setMatricula(e.target.value)}
                placeholder="Ex: GCM-001"
              />
            </div>

            <div>
              <label className="label">Nome completo</label>
              <input
                className="input"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Nome do guarda"
              />
            </div>

            <div>
              <label className="label">Cargo / Função</label>
              <input
                className="input"
                value={cargo}
                onChange={(e) => setCargo(e.target.value)}
                placeholder="Ex: Guarda Municipal"
              />
            </div>

            <div>
              <label className="label">Telefone</label>
              <input
                className="input"
                value={telefone}
                onChange={(e) => setTelefone(e.target.value)}
                placeholder="(75) 99999-9999"
              />
            </div>

<div>
  <label className="label">Data de Nascimento</label>
  <input
    type="date"
    className="input"
    value={dataNascimento}
    onChange={(e) => setDataNascimento(e.target.value)}
  />
</div>

            <div>
              <label className="label">Status</label>
              <select
                className="input"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                <option>Em serviço</option>
                <option>Folga</option>
                <option>Férias</option>
                <option>Afastado</option>
              </select>
            </div>

            <button
              type="button"
              onClick={salvarGuarda}
              className="btn-primary w-full text-lg"
            >
              {editandoId ? "Atualizar Guarda" : "Salvar Guarda"}
            </button>
          </div>
          </div>
)}

        <div className="card xl:col-span-2">
          <h2 className="text-xl md:text-2xl font-bold mb-4">
            Lista de Guardas
          </h2>

          <div className="mb-5">
            <label className="label">Buscar guarda</label>
            <input
              className="input"
              placeholder="Buscar por nome, matrícula, cargo ou status..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
            />
          </div>

          {carregando ? (
            <p className="text-slate-400">Carregando guardas...</p>
          ) : guardasFiltrados.length === 0 ? (
            <p className="text-slate-400">Nenhum guarda encontrado.</p>
          ) : (
            <>
              <div className="md:hidden space-y-4">
                {guardasFiltrados.map((guarda) => (
                  <div
                    key={guarda.id}
                    className="bg-slate-950/40 border border-slate-700 rounded-xl p-4 space-y-3"
                  >
                    <div className="flex justify-between gap-3 items-start">
                      <div>
                        <p className="text-blue-400 font-semibold">
                          {guarda.matricula}
                        </p>

                        <h3 className="text-xl font-bold">{guarda.nome}</h3>
                      </div>

                      <Status status={guarda.status} />
                    </div>

                    <div className="text-slate-300 space-y-1">
                      <p>
                        <span className="text-slate-500">Cargo: </span>
                        {guarda.cargo}
                      </p>

                      <p>
                        <span className="text-slate-500">Telefone: </span>
                        {guarda.telefone || "-"}
                      </p>
                    </div>

<button
  type="button"
  onClick={() => editarGuarda(guarda)}
  className="bg-blue-700 hover:bg-blue-800 text-white px-3 py-2 rounded-lg text-xs mr-2"
>
  Editar
</button>

                    <button
  type="button"
  onClick={() => excluirGuarda(guarda.id)}
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
                      <th className="text-left py-3">Matrícula</th>
                      <th className="text-left py-3">Nome</th>
                      <th className="text-left py-3">Cargo</th>
                      <th className="text-left py-3">Telefone</th>
                      <th className="text-left py-3">Nascimento</th>
                      <th className="text-left py-3">Status</th>
                      <th className="text-right py-3">Ações</th>
                    </tr>
                  </thead>

                  <tbody>
                    {guardasFiltrados.map((guarda) => (
                      <tr key={guarda.id} className="border-b border-slate-800">
                        <td className="py-4 text-blue-400 font-semibold">
                          {guarda.matricula}
                        </td>

                        <td>{guarda.nome}</td>

                        <td className="text-slate-400">{guarda.cargo}</td>

                        <td className="text-slate-400">
                          {guarda.telefone || "-"}
                        </td>

<td className="text-slate-400">
  {formatarData(guarda.data_nascimento)}
</td>

                        <td>
                          <Status status={guarda.status} />
                        </td>

                        <td className="text-right">
                          {podeEditar && (
  <>
    <button
      type="button"
      onClick={() => editarGuarda(guarda)}
      className="bg-blue-700 hover:bg-blue-800 text-white px-3 py-2 rounded-lg text-xs mr-2"
    >
      Editar
    </button>

    <button
      type="button"
      onClick={() => excluirGuarda(guarda.id)}
      className="bg-red-700 hover:bg-red-800 text-white px-3 py-2 rounded-lg text-xs"
    >
      Excluir
    </button>
  </>
)}
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
  );
}

function Card({ titulo, valor }: { titulo: string; valor: number }) {
  return (
    <div className="card min-h-32 flex flex-col justify-center">
      <p className="text-slate-400 text-lg md:text-base">{titulo}</p>
      <h2 className="text-5xl md:text-4xl font-bold">{valor}</h2>
    </div>
  );
}

function Status({ status }: { status: string }) {
  let cor = "bg-green-700 text-green-100";

  if (status === "Folga") cor = "bg-yellow-600 text-yellow-100";
  if (status === "Férias") cor = "bg-blue-700 text-blue-100";
  if (status === "Afastado") cor = "bg-red-700 text-red-100";

  return (
    <span className={`${cor} px-3 py-2 rounded text-xs inline-block`}>
      {status}
    </span>
  );
}