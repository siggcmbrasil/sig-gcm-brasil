"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Plus, Search, Trash2, Users } from "lucide-react";

import { supabase } from "@/lib/supabase";
import SigPageHeader from "@/components/sig/SigPageHeader";
import SigCard from "@/components/sig/SigCard";
import { registrarAuditoria } from "@/lib/auditoria";

type Pessoa = {
  id: number;
  nome: string;
  documento: string | null;
  nascimento: string | null;
  endereco: string | null;
  local: string | null;
  data: string | null;
  hora: string | null;
  guarda: string | null;
  observacao: string | null;
  tipo_documento: string | null;
  telefone: string | null;
  foto_url: string | null;
  profissao: string | null;
};

export default function PessoasAbordadasPage() {
  const [pessoas, setPessoas] = useState<Pessoa[]>([]);
  const [busca, setBusca] = useState("");
  const [filtroHoje, setFiltroHoje] =
  useState(false);
  const [carregando, setCarregando] = useState(true);

  const usuarioLogado =
    typeof window !== "undefined"
      ? JSON.parse(localStorage.getItem("usuarioLogado") || "{}")
      : {};

  const perfilUsuario = usuarioLogado?.perfil || "CONSULTA";
  const podeEditar = perfilUsuario !== "CONSULTA";

  async function carregarPessoas() {
    if (!usuarioLogado?.municipio_id) {
      setCarregando(false);
      return;
    }

    setCarregando(true);

    const { data, error } = await supabase
      .from("pessoas_abordadas")
      .select(`
  id,
  nome,
  documento,
  nascimento,
  endereco,
  local,
  data,
  hora,
  guarda,
  observacao,
  tipo_documento,
  telefone,
  foto_url,
  profissao
`)
.limit(200)
      .eq("municipio_id", usuarioLogado.municipio_id)
      .order("id", { ascending: false });

    setCarregando(false);

    if (error) {
      console.error(error);
      alert("Erro ao carregar pessoas.");
      return;
    }

    setPessoas(data || []);
  }

 async function excluirPessoa(id: number) {
  if (!podeEditar) {
    alert("Você não possui permissão para excluir registros.");
    return;
  }

  const motivo = prompt(
    "Informe o motivo da exclusão:"
  );

  if (!motivo?.trim()) {
    alert("Informe o motivo da exclusão.");
    return;
  }

  const pessoa = pessoas.find(
    (p) => p.id === id
  );

  const { error } = await supabase
    .from("pessoas_abordadas")
    .delete()
    .eq("id", id)
    .eq(
      "municipio_id",
      usuarioLogado.municipio_id
    );

  if (error) {
    console.error(error);
    alert("Erro ao excluir registro.");
    return;
  }

  await registrarAuditoria({
    modulo: "Pessoas Abordadas",
    acao: "EXCLUIR",
    descricao: `Excluiu o registro de ${
      pessoa?.nome || id
    }.`,
    tabela: "pessoas_abordadas",
    registro_id: id,
    detalhes: {
      motivo_exclusao: motivo,
      nome: pessoa?.nome,
      documento: pessoa?.documento,
      municipio_id:
        usuarioLogado?.municipio_id,
    },
  });

  await carregarPessoas();

  alert("Registro excluído com sucesso.");
}

useEffect(() => {
  void registrarAuditoria({
    modulo: "Pessoas Abordadas",
    acao: "ACESSO",
    descricao:
      "Acessou o módulo de pessoas abordadas.",
    tabela: "pessoas_abordadas",
    detalhes: {
      municipio_id:
        usuarioLogado?.municipio_id,
      usuario_id: usuarioLogado?.id,
      perfil: usuarioLogado?.perfil,
    },
  });

  carregarPessoas();
}, []);
  const hoje = new Date().toISOString().split("T")[0];

  const pessoasFiltradas = pessoas.filter((pessoa) => {
    const texto = `
      ${pessoa.nome || ""}
      ${pessoa.documento || ""}
      ${pessoa.telefone || ""}
      ${pessoa.endereco || ""}
      ${pessoa.local || ""}
      ${pessoa.data || ""}
      ${pessoa.hora || ""}
      ${pessoa.guarda || ""}
      ${pessoa.observacao || ""}
      ${pessoa.profissao || ""}
    `.toLowerCase();

    const passouBusca =
  texto.includes(busca.toLowerCase());

const passouHoje = filtroHoje
  ? pessoa.data === hoje
  : true;

return passouBusca && passouHoje;
  });

  return (
    <div className="p-4 md:p-6 pb-24 space-y-6">
      <SigPageHeader
        titulo="Pessoas Abordadas"
        subtitulo="Lista, consulta e acompanhamento das pessoas registradas em abordagens."
        icone={Users}
      />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <SigCard>
          <p className="text-slate-400 text-sm">Total</p>
          <h2 className="text-4xl font-black text-white mt-2">
            {pessoas.length}
          </h2>
        </SigCard>

        <SigCard>
          <p className="text-slate-400 text-sm">Hoje</p>
          <h2 className="text-4xl font-black text-cyan-400 mt-2">
            {pessoas.filter((p) => p.data === hoje).length}
          </h2>
        </SigCard>

        <SigCard>
          <p className="text-slate-400 text-sm">Com documento</p>
          <h2 className="text-4xl font-black text-emerald-400 mt-2">
            {pessoas.filter((p) => p.documento).length}
          </h2>
        </SigCard>

        <SigCard>
          <p className="text-slate-400 text-sm">Sem documento</p>
          <h2 className="text-4xl font-black text-yellow-400 mt-2">
            {pessoas.filter((p) => !p.documento).length}
          </h2>
        </SigCard>
      </div>

      <SigCard>
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-5 h-5 text-slate-500 absolute left-4 top-1/2 -translate-y-1/2" />

            <input
              className="input pl-12"
              placeholder="Buscar por nome, documento, telefone, local ou guarda..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
            />
          </div>

          <button
  type="button"
  onClick={() =>
    setFiltroHoje(!filtroHoje)
  }
  className={`px-4 py-3 rounded-xl font-bold transition ${
    filtroHoje
      ? "bg-cyan-700 text-white"
      : "bg-slate-800 text-slate-300"
  }`}
>
  Hoje
</button>

          {podeEditar && (
            <Link
              href="/sistema/pessoas/nova"
              className="btn-primary inline-flex items-center justify-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Nova Pessoa
            </Link>
          )}
        </div>
      </SigCard>

      <SigCard>
        <h2 className="text-xl font-black text-white mb-5">
          Lista de Pessoas
        </h2>
        <p className="text-slate-400 text-sm mb-5">
  Exibindo {pessoasFiltradas.length} registro(s)
</p>

        {carregando ? (
          <p className="text-slate-400">Carregando pessoas...</p>
        ) : pessoasFiltradas.length === 0 ? (
          <div className="py-20 text-center">
  <p className="text-7xl mb-5">
    👤
  </p>

  <h3 className="text-2xl font-black">
    Nenhuma pessoa encontrada
  </h3>

  <p className="text-slate-400 mt-3">
    Não existem registros para os
    filtros informados.
  </p>
</div>
        ) : (
          <>
            <div className="md:hidden space-y-4">
              {pessoasFiltradas.map((pessoa) => (
                <div
                  key={pessoa.id}
                  className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4 space-y-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-14 h-14 rounded-full overflow-hidden border border-cyan-500/30 bg-slate-900 flex items-center justify-center">
                      {pessoa.foto_url ? (
                        <img
                          src={pessoa.foto_url}
                          alt={pessoa.nome}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        "👤"
                      )}
                    </div>

                    <div>
                      <h3 className="text-lg font-black text-white">
                        {pessoa.nome}
                      </h3>

                      <p className="text-sm text-cyan-400">
                        {pessoa.documento || "Sem documento"}
                      </p>

                      <p className="text-sm text-slate-400">
                        {pessoa.telefone || "Sem telefone"}
                      </p>
                    </div>
                  </div>

                  <div className="text-sm text-slate-300 space-y-1">
                    <p>
                      <span className="text-slate-500">Local: </span>
                      {pessoa.local || "-"}
                    </p>

                    <p>
                      <span className="text-slate-500">Data/Hora: </span>
                      {pessoa.data || "-"} às {pessoa.hora || "-"}
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
                      className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-red-700 px-4 py-3 text-white font-bold hover:bg-red-800 transition"
                    >
                      <Trash2 className="w-5 h-5" />
                      Excluir
                    </button>
                  )}
                </div>
              ))}
            </div>

            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-slate-800 text-slate-400">
                  <tr>
                    <th className="text-left py-3">Pessoa</th>
                    <th className="text-left py-3">Documento</th>
                    <th className="text-left py-3">Telefone</th>
                    <th className="text-left py-3">Local</th>
                    <th className="text-left py-3">Data</th>
                    <th className="text-left py-3">Guarda</th>
                    <th className="text-right py-3">Ações</th>
                  </tr>
                </thead>

                <tbody>
                  {pessoasFiltradas.map((pessoa) => (
                    <tr
                      key={pessoa.id}
                      className="border-b border-slate-900"
                    >
                      <td className="py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full overflow-hidden border border-cyan-500/30 bg-slate-900 flex items-center justify-center">
                            {pessoa.foto_url ? (
                              <img
                                src={pessoa.foto_url}
                                alt={pessoa.nome}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              "👤"
                            )}
                          </div>

                          <div>
                            <p className="font-black text-white">
                              {pessoa.nome}
                            </p>

                            <p className="text-xs text-slate-500">
                              {pessoa.profissao || "-"}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="text-slate-300">
                        {pessoa.documento || "-"}
                      </td>

                      <td className="text-slate-300">
                        {pessoa.telefone || "-"}
                      </td>

                      <td className="text-slate-400">
                        {pessoa.local || "-"}
                      </td>

                      <td className="text-slate-300">
                        {pessoa.data || "-"}
                      </td>

                      <td className="text-slate-400">
                        {pessoa.guarda || "-"}
                      </td>

                      <td className="text-right">
                        {podeEditar && (
                          <button
                            type="button"
                            onClick={() => excluirPessoa(pessoa.id)}
                            className="inline-flex items-center justify-center gap-2 rounded-lg bg-red-700 px-3 py-2 text-xs font-bold text-white hover:bg-red-800 transition"
                          >
                            <Trash2 className="w-4 h-4" />
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
      </SigCard>
    </div>
  );
}