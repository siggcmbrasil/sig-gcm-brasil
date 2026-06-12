"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import ProtecaoPerfil from "@/components/ProtecaoPerfil";

type Municipio = {
  id: number;
  nome: string;
  estado: string;
  brasao: string | null;
  cor_principal: string | null;
  ativo: boolean;
  nome_corporacao: string | null;
  sigla_corporacao: string | null;
  comandante: string | null;
  telefone: string | null;
  email: string | null;
  endereco: string | null;
};

export default function MunicipiosPage() {
  const [municipios, setMunicipios] = useState<Municipio[]>([]);

  const [nome, setNome] = useState("");
  const [estado, setEstado] = useState("BA");
  const [nomeCorporacao, setNomeCorporacao] = useState("");
  const [siglaCorporacao, setSiglaCorporacao] = useState("");
  const [comandante, setComandante] = useState("");
  const [telefone, setTelefone] = useState("");
  const [email, setEmail] = useState("");
  const [endereco, setEndereco] = useState("");
  const [brasao, setBrasao] = useState("");
  const [corPrincipal, setCorPrincipal] = useState("#1e40af");
  const [editandoId, setEditandoId] = useState<number | null>(null);

  useEffect(() => {
    carregarMunicipios();
  }, []);

  async function carregarMunicipios() {
    const { data, error } = await supabase
      .from("municipios")
      .select("*")
      .order("nome");

    if (error) {
      console.error(error);
      alert("Erro ao carregar municípios.");
      return;
    }

    setMunicipios(data || []);
  }

function editarMunicipio(municipio: Municipio) {
  setEditandoId(municipio.id);
  setNome(municipio.nome || "");
  setEstado(municipio.estado || "BA");
  setNomeCorporacao(municipio.nome_corporacao || "");
  setSiglaCorporacao(municipio.sigla_corporacao || "");
  setComandante(municipio.comandante || "");
  setTelefone(municipio.telefone || "");
  setEmail(municipio.email || "");
  setEndereco(municipio.endereco || "");
  setBrasao(municipio.brasao || "");
  setCorPrincipal(municipio.cor_principal || "#1e40af");
}

  async function salvarMunicipio() {
  if (!nome.trim()) {
    alert("Informe o nome do município.");
    return;
  }

  const dados = {
    nome,
    estado,
    nome_corporacao: nomeCorporacao,
    sigla_corporacao: siglaCorporacao,
    comandante,
    telefone,
    email,
    endereco,
    brasao,
    cor_principal: corPrincipal,
    ativo: true,
  };

  const { error } = editandoId
    ? await supabase
        .from("municipios")
        .update(dados)
        .eq("id", editandoId)
    : await supabase
        .from("municipios")
        .insert([dados]);

  if (error) {
    console.error(error);
    alert("Erro ao salvar município.");
    return;
  }

  alert(editandoId ? "Município atualizado com sucesso!" : "Município cadastrado com sucesso!");

  setEditandoId(null);
  setNome("");
  setEstado("BA");
  setNomeCorporacao("");
  setSiglaCorporacao("");
  setComandante("");
  setTelefone("");
  setEmail("");
  setEndereco("");
  setBrasao("");
  setCorPrincipal("#1e40af");

  carregarMunicipios();
}

  async function alternarStatus(municipio: Municipio) {
    const { error } = await supabase
      .from("municipios")
      .update({
        ativo: !municipio.ativo,
      })
      .eq("id", municipio.id);

    if (error) {
      console.error(error);
      alert("Erro ao atualizar município.");
      return;
    }

    carregarMunicipios();
  }

  async function excluirMunicipio(id: number) {
  const confirmar = confirm(
    "Deseja realmente excluir este município?"
  );

  if (!confirmar) return;

  const { error } = await supabase
    .from("municipios")
    .delete()
    .eq("id", id);

  if (error) {
    console.error(error);
    alert("Erro ao excluir município.");
    return;
  }

  alert("Município excluído com sucesso!");

  carregarMunicipios();
}

  return (
  <ProtecaoPerfil
  perfisPermitidos={["DESENVOLVEDOR"]}
>
    <div className="p-3 md:p-6 pb-24">
      <header className="border-b border-slate-800 pb-5 mb-6">
        <h1 className="text-3xl font-bold">🏛️ Municípios</h1>

        <p className="text-slate-400">
          Identidade institucional dos municípios atendidos pelo SIG-GCM Brasil.
        </p>
      </header>

      <section className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="card">
          <h2 className="text-xl font-bold mb-4">
  {editandoId ? "Editar Município" : "Novo Município"}
</h2>

          <div className="space-y-4">
            <input
              className="input"
              placeholder="Nome do município"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
            />

            <input
              className="input"
              placeholder="Estado"
              value={estado}
              onChange={(e) => setEstado(e.target.value)}
            />

            <input
              className="input"
              placeholder="Nome da corporação (ex: Guarda Civil Municipal)"
              value={nomeCorporacao}
              onChange={(e) => setNomeCorporacao(e.target.value)}
            />

            <input
              className="input"
              placeholder="Sigla da corporação (ex: GCM)"
              value={siglaCorporacao}
              onChange={(e) => setSiglaCorporacao(e.target.value)}
            />

            <input
              className="input"
              placeholder="Comandante"
              value={comandante}
              onChange={(e) => setComandante(e.target.value)}
            />

            <input
              className="input"
              placeholder="Telefone"
              value={telefone}
              onChange={(e) => setTelefone(e.target.value)}
            />

            <input
              className="input"
              placeholder="Email institucional"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            <textarea
              className="input h-24 resize-none"
              placeholder="Endereço"
              value={endereco}
              onChange={(e) => setEndereco(e.target.value)}
            />

            <input
              className="input"
              placeholder="Brasão (/brasoes/biritinga.png)"
              value={brasao}
              onChange={(e) => setBrasao(e.target.value)}
            />

            <div>
              <label className="label">Cor principal</label>
              <input
                type="color"
                value={corPrincipal}
                onChange={(e) => setCorPrincipal(e.target.value)}
                className="w-full h-12 rounded"
              />
            </div>

            <button
  type="button"
  onClick={salvarMunicipio}
  className="w-full bg-blue-700 hover:bg-blue-800 p-3 rounded-xl font-bold"
>
  {editandoId ? "Atualizar Município" : "Salvar Município"}
</button>
          </div>
        </div>

        <div className="card xl:col-span-2">
          <h2 className="text-xl font-bold mb-4">Municípios Cadastrados</h2>

          <div className="space-y-4">
            {municipios.length === 0 ? (
              <p className="text-slate-400">
                Nenhum município cadastrado.
              </p>
            ) : (
              municipios.map((municipio) => (
                <div
                  key={municipio.id}
                  className="bg-slate-900 border border-slate-700 rounded-xl p-4"
                >
                  <div className="flex flex-col md:flex-row justify-between gap-4">
                    <div className="flex gap-4">
                      {municipio.brasao && (
                        <img
                          src={municipio.brasao}
                          alt={municipio.nome}
                          className="w-16 h-16 object-contain"
                        />
                      )}

                      <div>
                        <p className="font-bold text-lg">
                          {municipio.nome} - {municipio.estado}
                        </p>

                        <p className="text-blue-400 font-semibold">
                          {municipio.nome_corporacao || "Corporação não informada"}
                          {municipio.sigla_corporacao
                            ? ` • ${municipio.sigla_corporacao}`
                            : ""}
                        </p>

                        <p className="text-slate-400 text-sm mt-1">
                          Comandante: {municipio.comandante || "-"}
                        </p>

                        <p className="text-slate-400 text-sm">
                          Telefone: {municipio.telefone || "-"}
                        </p>

                        <p className="text-slate-400 text-sm">
                          Email: {municipio.email || "-"}
                        </p>

                        <p className="text-slate-400 text-sm">
                          Endereço: {municipio.endereco || "-"}
                        </p>

                        <p className="text-slate-500 text-xs mt-2">
                          Cor principal: {municipio.cor_principal || "-"}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2">
  <button
    type="button"
    onClick={() => editarMunicipio(municipio)}
    className="px-4 py-2 rounded-lg font-semibold bg-blue-700 hover:bg-blue-800 h-fit"
  >
    Editar
  </button>

<button
  type="button"
  onClick={() => excluirMunicipio(municipio.id)}
  className="px-4 py-2 rounded-lg font-semibold bg-red-700 hover:bg-red-800 h-fit"
>
  Excluir
</button>

  <button
    type="button"
    onClick={() => alternarStatus(municipio)}
    className={`px-4 py-2 rounded-lg font-semibold h-fit ${
      municipio.ativo ? "bg-green-700" : "bg-red-700"
    }`}
  >
    {municipio.ativo ? "Ativo" : "Inativo"}
  </button>
</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>
        </div>
  </ProtecaoPerfil>
  );
}