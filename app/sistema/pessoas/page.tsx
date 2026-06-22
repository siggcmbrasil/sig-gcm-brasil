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
  const [busca, setBusca] = useState("");

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
  const usuarioLogado =
  typeof window !== "undefined"
    ? JSON.parse(localStorage.getItem("usuarioLogado") || "{}")
    : {};

const perfilUsuario = usuarioLogado?.perfil || "CONSULTA";

const podeEditar = perfilUsuario !== "CONSULTA";

  async function carregarPessoas() {
    setCarregando(true);

    const { data, error } = await supabase
  .from("pessoas_abordadas")
  .select("*")
  .eq("municipio_id", usuarioLogado.municipio_id)
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
    if (!podeEditar) {
      alert("Você não possui permissão para alterar dados da pessoa.");
      return;
    }

    const { error } = await supabase.from("pessoas_abordadas").insert([
  {
    municipio_id: usuarioLogado.municipio_id,
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
  if (!podeEditar) {
    alert("Você não possui permissão para excluir registros.");
    return;
  }
    const confirmar = confirm("Deseja excluir este registro?");

    if (!confirmar) return;

    const { error } = await supabase
  .from("pessoas_abordadas")
  .delete()
  .eq("id", id)
  .eq("municipio_id", usuarioLogado.municipio_id);

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

  const hoje = new Date().toISOString().split("T")[0];

  const pessoasFiltradas = pessoas.filter((pessoa) => {
    const texto = `
      ${pessoa.nome}
      ${pessoa.documento || ""}
      ${pessoa.endereco || ""}
      ${pessoa.local}
      ${pessoa.data}
      ${pessoa.hora}
      ${pessoa.guarda || ""}
      ${pessoa.observacao || ""}
    `.toLowerCase();

    return texto.includes(busca.toLowerCase());
  });

  return (
    <div className="p-3 md:p-6 pb-24">
      <header className="border-b border-slate-800 pb-5 mb-6">
        <h1 className="text-2xl md:text-3xl font-bold">
          Pessoas Abordadas
        </h1>

        <p className="text-slate-400 text-sm md:text-base">
          Registro de abordagens realizadas pela Guarda Municipal.
        </p>
      </header>

      <section className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card titulo="Total" valor={pessoas.length} />

        <Card
          titulo="Hoje"
          valor={pessoas.filter((p) => p.data === hoje).length}
        />

        <Card
          titulo="Com documento"
          valor={pessoas.filter((p) => p.documento).length}
        />

        <Card
          titulo="Sem documento"
          valor={pessoas.filter((p) => !p.documento).length}
        />
      </section>

      <section className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {podeEditar && (
  <div className="card">
    <h2 className="text-xl md:text-2xl font-bold mb-4">
      Nova Abordagem
    </h2>

          <div className="space-y-4">
            <Campo
              label="Nome completo"
              valor={nome}
              setValor={setNome}
              placeholder="Nome da pessoa"
            />

            <Campo
              label="Documento"
              valor={documento}
              setValor={setDocumento}
              placeholder="CPF, RG ou outro"
            />

            <div>
              <label className="label">Data de nascimento</label>
              <input
                type="date"
                className="input"
                value={nascimento}
                onChange={(e) => setNascimento(e.target.value)}
              />
            </div>

            <Campo
              label="Endereço"
              valor={endereco}
              setValor={setEndereco}
              placeholder="Endereço informado"
            />

            <Campo
              label="Local da abordagem"
              valor={local}
              setValor={setLocal}
              placeholder="Ex: Praça Principal"
            />

            <div>
              <label className="label">Data</label>
              <input
                type="date"
                className="input"
                value={data}
                onChange={(e) => setData(e.target.value)}
              />
            </div>

            <div>
              <label className="label">Hora</label>
              <input
                type="time"
                className="input"
                value={hora}
                onChange={(e) => setHora(e.target.value)}
              />
            </div>

            <Campo
              label="Guarda responsável"
              valor={guarda}
              setValor={setGuarda}
              placeholder="Nome do guarda"
            />

            <div>
              <label className="label">Observação</label>
              <textarea
                className="input h-32 resize-none"
                placeholder="Observações da abordagem"
                value={observacao}
                onChange={(e) => setObservacao(e.target.value)}
              />
            </div>

            <button
              type="button"
              onClick={salvarPessoa}
              className="btn-primary w-full text-lg"
            >
              Registrar Pessoa
            </button>
          </div>
          </div>
)}

        <div className="card xl:col-span-2">
          <h2 className="text-xl md:text-2xl font-bold mb-4">
            Pessoas Registradas
          </h2>

          <div className="mb-5">
            <label className="label">Buscar pessoa</label>
            <input
              className="input"
              placeholder="Buscar por nome, documento, local, guarda..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
            />
          </div>

          {carregando ? (
            <p className="text-slate-400">Carregando pessoas...</p>
          ) : pessoasFiltradas.length === 0 ? (
            <p className="text-slate-400">Nenhuma pessoa encontrada.</p>
          ) : (
            <>
              <div className="md:hidden space-y-4">
                {pessoasFiltradas.map((pessoa) => (
                  <div
                    key={pessoa.id}
                    className="bg-slate-950/40 border border-slate-700 rounded-xl p-4 space-y-3"
                  >
                    <div>
                      <p className="text-blue-400 font-semibold">
                        {pessoa.documento || "Sem documento"}
                      </p>

                      <h3 className="text-xl font-bold">
                        {pessoa.nome}
                      </h3>
                    </div>

                    <div className="text-slate-300 space-y-1">
                      <p>
                        <span className="text-slate-500">Nascimento: </span>
                        {pessoa.nascimento || "-"}
                      </p>

                      <p>
                        <span className="text-slate-500">Endereço: </span>
                        {pessoa.endereco || "-"}
                      </p>

                      <p>
                        <span className="text-slate-500">Local: </span>
                        {pessoa.local}
                      </p>

                      <p>
                        <span className="text-slate-500">Data/Hora: </span>
                        {pessoa.data} às {pessoa.hora}
                      </p>

                      <p>
                        <span className="text-slate-500">Guarda: </span>
                        {pessoa.guarda || "-"}
                      </p>

                      {pessoa.observacao && (
                        <p className="pt-2 text-slate-400">
                          {pessoa.observacao}
                        </p>
                      )}
                    </div>

                    {podeEditar && (
  <button
    type="button"
    onClick={() => excluirPessoa(pessoa.id)}
    className="..."
  >
    Excluir
  </button>
)}
                  </div>
                ))}
              </div>

              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b border-slate-700 text-slate-400">
                    <tr>
                      <th className="text-left py-3">Nome</th>
                      <th className="text-left py-3">Documento</th>
                      <th className="text-left py-3">Local</th>
                      <th className="text-left py-3">Data</th>
                      <th className="text-left py-3">Guarda</th>
                      <th className="text-right py-3">Ações</th>
                    </tr>
                  </thead>

                  <tbody>
                    {pessoasFiltradas.map((pessoa) => (
                      <tr key={pessoa.id} className="border-b border-slate-800">
                        <td className="py-4 text-blue-400 font-semibold">
                          {pessoa.nome}
                        </td>

                        <td>{pessoa.documento || "-"}</td>

                        <td className="text-slate-400">
                          {pessoa.local}
                        </td>

                        <td>{pessoa.data}</td>

                        <td className="text-slate-400">
                          {pessoa.guarda || "-"}
                        </td>

                        <td className="text-right">
                          {podeEditar && (
  <button
    type="button"
    onClick={() => excluirPessoa(pessoa.id)}
    className="..."
  >
    Excluir
  </button>
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

function Card({
  titulo,
  valor,
}: {
  titulo: string;
  valor: number;
}) {
  return (
    <div className="card min-h-32 flex flex-col justify-center">
      <p className="text-slate-400 text-lg md:text-base">
        {titulo}
      </p>

      <h2 className="text-5xl md:text-4xl font-bold">
        {valor}
      </h2>
    </div>
  );
}