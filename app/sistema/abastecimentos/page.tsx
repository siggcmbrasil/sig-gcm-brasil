"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type Abastecimento = {
  id: number;
  viatura: string;
  data: string;
  km: string | null;
  litros: string | null;
  valor: string | null;
  posto: string | null;
  observacao: string | null;
};

type Viatura = {
  id: number;
  prefixo: string;
  modelo: string;
  status: string;
};

export default function Abastecimentos() {
  const [abastecimentos, setAbastecimentos] = useState<Abastecimento[]>([]);
  const [viaturas, setViaturas] = useState<Viatura[]>([]);
  const [busca, setBusca] = useState("");

  const [viatura, setViatura] = useState("");
  const [data, setData] = useState("");
  const [km, setKm] = useState("");
  const [litros, setLitros] = useState("");
  const [valor, setValor] = useState("");
  const [posto, setPosto] = useState("");
  const [observacao, setObservacao] = useState("");

  const [carregando, setCarregando] = useState(true);

  const usuarioLogado =
  typeof window !== "undefined"
    ? JSON.parse(localStorage.getItem("usuarioLogado") || "{}")
    : {};

  async function carregarAbastecimentos() {

if (!usuarioLogado.municipio_id) {
  alert("Município não identificado.");
  return;
}

    setCarregando(true);

    const { data, error } = await supabase
  .from("abastecimentos")
  .select("*")
  .eq("municipio_id", usuarioLogado.municipio_id)
  .order("id", { ascending: false });

    if (error) {
      console.error(error);
      alert("Erro ao carregar abastecimentos.");
      setCarregando(false);
      return;
    }

    setAbastecimentos(data || []);
    setCarregando(false);
  }

  async function carregarViaturas() {
    const { data, error } = await supabase
  .from("viaturas")
  .select("id, prefixo, modelo, status")
  .eq("municipio_id", usuarioLogado.municipio_id)
  .order("prefixo", { ascending: true });

    if (error) {
      console.error(error);
      alert("Erro ao carregar viaturas.");
      return;
    }

    setViaturas(data || []);
  }

  async function salvarAbastecimento() {
    if (!viatura || !data) {
      alert("Preencha viatura e data.");
      return;
    }

    const { error } = await supabase.from("abastecimentos").insert([
  {
    municipio_id: usuarioLogado.municipio_id,
    viatura,
    data,
    km,
    litros,
    valor,
    posto,
    observacao,
  },
]);

    if (error) {
      console.error(error);
      alert("Erro ao salvar abastecimento.");
      return;
    }

    alert("Abastecimento registrado com sucesso!");

    setViatura("");
    setData("");
    setKm("");
    setLitros("");
    setValor("");
    setPosto("");
    setObservacao("");

    carregarAbastecimentos();
  }

  async function excluirAbastecimento(id: number) {
    const confirmar = confirm("Deseja excluir este abastecimento?");

    if (!confirmar) return;

    const { error } = await supabase
  .from("abastecimentos")
  .delete()
  .eq("id", id)
  .eq("municipio_id", usuarioLogado.municipio_id);

    if (error) {
      console.error(error);
      alert("Erro ao excluir abastecimento.");
      return;
    }

    carregarAbastecimentos();
  }

  useEffect(() => {
    carregarAbastecimentos();
    carregarViaturas();
  }, []);

  const mesAtual = new Date().toISOString().slice(0, 7);

  const abastecimentosMes = abastecimentos.filter((a) =>
    a.data?.startsWith(mesAtual)
  );

  const totalLitros = abastecimentosMes.reduce(
    (total, item) => total + Number((item.litros || "0").replace(",", ".")),
    0
  );

  const totalValor = abastecimentosMes.reduce(
    (total, item) => total + Number((item.valor || "0").replace(",", ".")),
    0
  );

  const abastecimentosFiltrados = abastecimentos.filter((item) => {
    const texto = `
      ${item.viatura}
      ${item.data}
      ${item.km || ""}
      ${item.litros || ""}
      ${item.valor || ""}
      ${item.posto || ""}
      ${item.observacao || ""}
    `.toLowerCase();

    return texto.includes(busca.toLowerCase());
  });

  return (
    <div className="p-3 md:p-6 pb-24">
      <header className="border-b border-slate-800 pb-5 mb-6">
        <h1 className="text-2xl md:text-3xl font-bold">
          Abastecimentos
        </h1>

        <p className="text-slate-400 text-sm md:text-base">
          Controle de combustível das viaturas da GCM Biritinga.
        </p>
      </header>

      <section className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card titulo="Total" valor={abastecimentos.length} />
        <Card titulo="Este mês" valor={abastecimentosMes.length} />
        <Card titulo="Litros no mês" valorTexto={totalLitros.toFixed(2)} />
        <Card
          titulo="Valor no mês"
          valorTexto={`R$ ${totalValor.toFixed(2)}`}
        />
      </section>

      <section className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="card">
          <h2 className="text-xl md:text-2xl font-bold mb-4">
            Novo Abastecimento
          </h2>

          <div className="space-y-4">
            <div>
              <label className="label">Viatura</label>

              <select
                className="input"
                value={viatura}
                onChange={(e) => setViatura(e.target.value)}
              >
                <option value="">Selecione uma viatura</option>

                {viaturas.map((v) => (
                  <option key={v.id} value={v.prefixo}>
                    {v.prefixo} • {v.modelo} • {v.status}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="label">Data</label>
              <input
                type="date"
                className="input"
                value={data}
                onChange={(e) => setData(e.target.value)}
              />
            </div>

            <Campo
              label="Quilometragem"
              valor={km}
              setValor={setKm}
              placeholder="Ex: 25430"
            />

            <Campo
              label="Litros"
              valor={litros}
              setValor={setLitros}
              placeholder="Ex: 42.5"
            />

            <Campo
              label="Valor"
              valor={valor}
              setValor={setValor}
              placeholder="Ex: 268.90"
            />

            <Campo
              label="Posto"
              valor={posto}
              setValor={setPosto}
              placeholder="Nome do posto"
            />

            <div>
              <label className="label">Observação</label>
              <textarea
                className="input h-28 resize-none"
                value={observacao}
                onChange={(e) => setObservacao(e.target.value)}
                placeholder="Observações do abastecimento..."
              />
            </div>

            <button
              type="button"
              onClick={salvarAbastecimento}
              className="btn-primary w-full text-lg"
            >
              Registrar Abastecimento
            </button>
          </div>
        </div>

        <div className="card xl:col-span-2">
          <h2 className="text-xl md:text-2xl font-bold mb-4">
            Histórico de Abastecimentos
          </h2>

          <div className="mb-5">
            <label className="label">Buscar abastecimento</label>
            <input
              className="input"
              placeholder="Buscar por viatura, data, posto..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
            />
          </div>

          {carregando ? (
            <p className="text-slate-400">
              Carregando abastecimentos...
            </p>
          ) : abastecimentosFiltrados.length === 0 ? (
            <p className="text-slate-400">
              Nenhum abastecimento encontrado.
            </p>
          ) : (
            <>
              <div className="md:hidden space-y-4">
                {abastecimentosFiltrados.map((item) => (
                  <div
                    key={item.id}
                    className="bg-slate-950/40 border border-slate-700 rounded-xl p-4 space-y-3"
                  >
                    <div>
                      <p className="text-blue-400 font-semibold">
                        {item.viatura}
                      </p>

                      <h3 className="text-xl font-bold">
                        {item.data}
                      </h3>
                    </div>

                    <Linha nome="KM" valor={item.km || "-"} />
                    <Linha nome="Litros" valor={item.litros || "-"} />
                    <Linha
                      nome="Valor"
                      valor={item.valor ? `R$ ${item.valor}` : "-"}
                    />
                    <Linha nome="Posto" valor={item.posto || "-"} />

                    {item.observacao && (
                      <p className="text-slate-400">
                        {item.observacao}
                      </p>
                    )}

                    <button
                      type="button"
                      onClick={() => excluirAbastecimento(item.id)}
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
                      <th className="text-left py-3">Viatura</th>
                      <th className="text-left py-3">Data</th>
                      <th className="text-left py-3">KM</th>
                      <th className="text-left py-3">Litros</th>
                      <th className="text-left py-3">Valor</th>
                      <th className="text-left py-3">Posto</th>
                      <th className="text-right py-3">Ações</th>
                    </tr>
                  </thead>

                  <tbody>
                    {abastecimentosFiltrados.map((item) => (
                      <tr key={item.id} className="border-b border-slate-800">
                        <td className="py-4 text-blue-400 font-semibold">
                          {item.viatura}
                        </td>
                        <td>{item.data}</td>
                        <td className="text-slate-400">
                          {item.km || "-"}
                        </td>
                        <td>{item.litros || "-"}</td>
                        <td className="text-slate-400">
                          {item.valor ? `R$ ${item.valor}` : "-"}
                        </td>
                        <td>{item.posto || "-"}</td>
                        <td className="text-right">
                          <button
                            type="button"
                            onClick={() => excluirAbastecimento(item.id)}
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
  valorTexto,
}: {
  titulo: string;
  valor?: number;
  valorTexto?: string;
}) {
  return (
    <div className="card min-h-32 flex flex-col justify-center">
      <p className="text-slate-400 text-lg md:text-base">{titulo}</p>
      <h2 className="text-4xl md:text-4xl font-bold">
        {valorTexto || valor}
      </h2>
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