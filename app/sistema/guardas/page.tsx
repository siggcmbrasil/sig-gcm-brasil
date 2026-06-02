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
};

export default function Guardas() {
  const [guardas, setGuardas] = useState<Guarda[]>([]);
  const [matricula, setMatricula] = useState("");
  const [nome, setNome] = useState("");
  const [cargo, setCargo] = useState("");
  const [telefone, setTelefone] = useState("");
  const [status, setStatus] = useState("Em serviço");
  const [carregando, setCarregando] = useState(true);

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
      },
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

    carregarGuardas();
  }

  async function excluirGuarda(id: number) {
    const confirmar = confirm("Tem certeza que deseja excluir este guarda?");

    if (!confirmar) return;

    const { error } = await supabase
      .from("guardas")
      .delete()
      .eq("id", id);

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

  return (
    <div className="p-6">
      <header className="border-b border-slate-800 pb-5 mb-6">
        <h1 className="text-3xl font-bold">Guardas</h1>
        <p className="text-slate-400">
          Cadastro e controle do efetivo da GCM Biritinga.
        </p>
      </header>

      <section className="grid grid-cols-4 gap-4 mb-6">
        <div className="card">
          <p className="text-slate-400">Efetivo total</p>
          <h2 className="text-4xl font-bold">{guardas.length}</h2>
        </div>

        <div className="card">
          <p className="text-slate-400">Em serviço</p>
          <h2 className="text-4xl font-bold">
            {guardas.filter((g) => g.status === "Em serviço").length}
          </h2>
        </div>

        <div className="card">
          <p className="text-slate-400">Folga</p>
          <h2 className="text-4xl font-bold">
            {guardas.filter((g) => g.status === "Folga").length}
          </h2>
        </div>

        <div className="card">
          <p className="text-slate-400">Férias</p>
          <h2 className="text-4xl font-bold">
            {guardas.filter((g) => g.status === "Férias").length}
          </h2>
        </div>
      </section>

      <section className="grid grid-cols-3 gap-4">
        <div className="card">
          <h2 className="text-xl font-bold mb-4">
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
              <label className="label">Cargo</label>
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
              <label className="label">Status</label>
              <select
                className="input"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                <option>Em serviço</option>
                <option>Folga</option>
                <option>Férias</option>
              </select>
            </div>

            <button
              type="button"
              onClick={salvarGuarda}
              className="btn-primary w-full"
            >
              Salvar Guarda
            </button>
          </div>
        </div>

        <div className="card col-span-2">
          <h2 className="text-xl font-bold mb-4">
            Lista de Guardas
          </h2>

          {carregando ? (
            <p className="text-slate-400">Carregando guardas...</p>
          ) : guardas.length === 0 ? (
            <p className="text-slate-400">
              Nenhum guarda cadastrado ainda.
            </p>
          ) : (
            <table className="w-full text-sm">
              <thead className="text-slate-400 border-b border-slate-700">
                <tr>
                  <th className="text-left py-3">Matrícula</th>
                  <th className="text-left py-3">Nome</th>
                  <th className="text-left py-3">Cargo</th>
                  <th className="text-left py-3">Status</th>
                  <th className="text-right py-3">Ações</th>
                </tr>
              </thead>

              <tbody>
                {guardas.map((guarda) => (
                  <tr key={guarda.id} className="border-b border-slate-800">
                    <td className="py-4 text-blue-400 font-semibold">
                      {guarda.matricula}
                    </td>

                    <td>{guarda.nome}</td>

                    <td className="text-slate-400">
                      {guarda.cargo}
                    </td>

                    <td>
                      <Status status={guarda.status} />
                    </td>

                    <td className="text-right">
                      <button
                        type="button"
                        onClick={() => excluirGuarda(guarda.id)}
                        className="bg-red-700 hover:bg-red-800 text-white px-3 py-2 rounded-lg text-xs"
                      >
                        Excluir
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>
    </div>
  );
}

function Status({ status }: { status: string }) {
  let cor = "bg-green-700 text-green-100";

  if (status === "Folga") {
    cor = "bg-yellow-600 text-yellow-100";
  }

  if (status === "Férias") {
    cor = "bg-blue-700 text-blue-100";
  }

  return (
    <span className={`${cor} px-3 py-1 rounded text-xs`}>
      {status}
    </span>
  );
}