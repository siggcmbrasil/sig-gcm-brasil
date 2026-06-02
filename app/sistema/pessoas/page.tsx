"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type Pessoa = {
  id: number;
  nome: string;
  documento: string | null;
  nascimento: string | null;
  endereco: string | null;
  local: string;
  data: string;
  hora: string;
  guarda: string | null;
  observacao: string | null;
};

export default function PessoasAbordadas() {
  const [pessoas, setPessoas] = useState<Pessoa[]>([]);
  const [nome, setNome] = useState("");
  const [documento, setDocumento] = useState("");
  const [nascimento, setNascimento] = useState("");
  const [endereco, setEndereco] = useState("");
  const [local, setLocal] = useState("");
  const [data, setData] = useState("");
  const [hora, setHora] = useState("");
  const [guarda, setGuarda] = useState("");
  const [observacao, setObservacao] = useState("");
  const [carregando, setCarregando] = useState(true);

  async function carregarPessoas() {
    setCarregando(true);

    const { data, error } = await supabase
      .from("pessoas_abordadas")
      .select("*")
      .order("id", { ascending: false });

    if (error) {
      console.error(error);
      alert("Erro ao carregar pessoas.");
      setCarregando(false);
      return;
    }

    setPessoas(data || []);
    setCarregando(false);
  }

  async function salvarPessoa() {
    if (!nome || !local || !data || !hora) {
      alert("Preencha nome, local, data e hora.");
      return;
    }

    const { error } = await supabase.from("pessoas_abordadas").insert([
      {
        nome,
        documento,
        nascimento: nascimento || null,
        endereco,
        local,
        data,
        hora,
        guarda,
        observacao,
      },
    ]);

    if (error) {
      console.error(error);
      alert("Erro ao salvar abordagem.");
      return;
    }

    alert("Pessoa registrada com sucesso!");

    setNome("");
    setDocumento("");
    setNascimento("");
    setEndereco("");
    setLocal("");
    setData("");
    setHora("");
    setGuarda("");
    setObservacao("");

    carregarPessoas();
  }

  async function excluirPessoa(id: number) {
    const confirmar = confirm("Deseja excluir este registro?");

    if (!confirmar) return;

    const { error } = await supabase
      .from("pessoas_abordadas")
      .delete()
      .eq("id", id);

    if (error) {
      console.error(error);
      alert("Erro ao excluir registro.");
      return;
    }

    carregarPessoas();
  }

  useEffect(() => {
    carregarPessoas();
  }, []);

  return (
    <div className="p-6">
      <header className="border-b border-slate-800 pb-5 mb-6">
        <h1 className="text-3xl font-bold">Pessoas Abordadas</h1>
        <p className="text-slate-400">
          Registro de abordagens realizadas pela GCM Biritinga.
        </p>
      </header>

      <section className="grid grid-cols-4 gap-4 mb-6">
        <div className="card">
          <p className="text-slate-400">Total de abordagens</p>
          <h2 className="text-4xl font-bold">{pessoas.length}</h2>
        </div>

        <div className="card">
          <p className="text-slate-400">Hoje</p>
          <h2 className="text-4xl font-bold">
            {
              pessoas.filter(
                (p) => p.data === new Date().toISOString().split("T")[0]
              ).length
            }
          </h2>
        </div>
      </section>

      <section className="grid grid-cols-3 gap-4">
        <div className="card">
          <h2 className="text-xl font-bold mb-4">Nova Abordagem</h2>

          <div className="space-y-4">
            <input
              className="input"
              placeholder="Nome completo"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
            />

            <input
              className="input"
              placeholder="Documento"
              value={documento}
              onChange={(e) => setDocumento(e.target.value)}
            />

            <input
              type="date"
              className="input"
              value={nascimento}
              onChange={(e) => setNascimento(e.target.value)}
            />

            <input
              className="input"
              placeholder="Endereço"
              value={endereco}
              onChange={(e) => setEndereco(e.target.value)}
            />

            <input
              className="input"
              placeholder="Local da abordagem"
              value={local}
              onChange={(e) => setLocal(e.target.value)}
            />

            <input
              type="date"
              className="input"
              value={data}
              onChange={(e) => setData(e.target.value)}
            />

            <input
              type="time"
              className="input"
              value={hora}
              onChange={(e) => setHora(e.target.value)}
            />

            <input
              className="input"
              placeholder="Guarda responsável"
              value={guarda}
              onChange={(e) => setGuarda(e.target.value)}
            />

            <textarea
              className="input h-28 resize-none"
              placeholder="Observação"
              value={observacao}
              onChange={(e) => setObservacao(e.target.value)}
            />

            <button
              type="button"
              onClick={salvarPessoa}
              className="btn-primary w-full"
            >
              Registrar Pessoa
            </button>
          </div>
        </div>

        <div className="card col-span-2">
          <h2 className="text-xl font-bold mb-4">Pessoas Registradas</h2>

          {carregando ? (
            <p className="text-slate-400">Carregando...</p>
          ) : pessoas.length === 0 ? (
            <p className="text-slate-400">Nenhuma pessoa registrada.</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="border-b border-slate-700 text-slate-400">
                <tr>
                  <th className="text-left py-3">Nome</th>
                  <th className="text-left py-3">Documento</th>
                  <th className="text-left py-3">Local</th>
                  <th className="text-left py-3">Data</th>
                  <th className="text-right py-3">Ações</th>
                </tr>
              </thead>

              <tbody>
                {pessoas.map((pessoa) => (
                  <tr key={pessoa.id} className="border-b border-slate-800">
                    <td className="py-4 text-blue-400 font-semibold">
                      {pessoa.nome}
                    </td>
                    <td>{pessoa.documento || "-"}</td>
                    <td className="text-slate-400">{pessoa.local}</td>
                    <td>{pessoa.data}</td>
                    <td className="text-right">
                      <button
                        type="button"
                        onClick={() => excluirPessoa(pessoa.id)}
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