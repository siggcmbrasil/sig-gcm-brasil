"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type Equipamento = {
  id: number;
  patrimonio: string | null;
  tipo: string | null;
  marca: string | null;
  modelo: string | null;
  numero_serie: string | null;
  validade: string | null;
  status: string | null;
  responsavel: string | null;
  observacao: string | null;
};

type Guarda = {
  id: number;
  nome: string;
  matricula: string;
  status: string;
};

export default function Equipamentos() {
  const [equipamentos, setEquipamentos] = useState<Equipamento[]>([]);
  const [guardas, setGuardas] = useState<Guarda[]>([]);
  const [busca, setBusca] = useState("");

  const [patrimonio, setPatrimonio] = useState("");
  const [tipo, setTipo] = useState("");
  const [marca, setMarca] = useState("");
  const [modelo, setModelo] = useState("");
  const [numeroSerie, setNumeroSerie] = useState("");
  const [validade, setValidade] = useState("");
  const [status, setStatus] = useState("Disponível");
  const [responsavel, setResponsavel] = useState("");
  const [observacao, setObservacao] = useState("");

  const [carregando, setCarregando] = useState(true);

  async function carregarEquipamentos() {

if (!usuarioLogado.municipio_id) {
  alert("Município não identificado.");
  return;
}

    setCarregando(true);

    const { data, error } = await supabase
  .from("equipamentos")
  .select("*")
  .eq("municipio_id", usuarioLogado.municipio_id)
  .order("id", { ascending: false });

    if (error) {
      console.error(error);
      alert("Erro ao carregar equipamentos.");
      setCarregando(false);
      return;
    }

    setEquipamentos(data || []);
    setCarregando(false);
  }

  const usuarioLogado =
  typeof window !== "undefined"
    ? JSON.parse(localStorage.getItem("usuarioLogado") || "{}")
    : {};

  async function carregarGuardas() {

    if (!usuarioLogado.municipio_id) {
  alert("Município não identificado.");
  return;
}

    const { data, error } = await supabase
      .from("guardas")
      .select("id, nome, matricula, status")
      .eq("municipio_id", usuarioLogado.municipio_id)
      .order("nome", { ascending: true });

    if (error) {
      console.error(error);
      return;
    }

    setGuardas(data || []);
  }

  async function salvarEquipamento() {

if (!usuarioLogado.municipio_id) {
  alert("Município não identificado.");
  return;
}

    if (!tipo || !patrimonio) {
      alert("Preencha tipo e patrimônio.");
      return;
    }

    const { error } = await supabase.from("equipamentos").insert([
  {
    municipio_id: usuarioLogado.municipio_id,
    patrimonio,
    tipo,
    marca,
    modelo,
    numero_serie: numeroSerie,
    validade,
    status,
    responsavel,
    observacao,
  },
]);

    if (error) {
      console.error(error);
      alert("Erro ao salvar equipamento.");
      return;
    }

    alert("Equipamento cadastrado com sucesso!");

    setPatrimonio("");
    setTipo("");
    setMarca("");
    setModelo("");
    setNumeroSerie("");
    setValidade("");
    setStatus("Disponível");
    setResponsavel("");
    setObservacao("");

    carregarEquipamentos();
  }

  async function excluirEquipamento(id: number) {

if (!usuarioLogado.municipio_id) {
  alert("Município não identificado.");
  return;
}

    const confirmar = confirm("Deseja excluir este equipamento?");

    if (!confirmar) return;

    const { error } = await supabase
      .from("equipamentos")
      .delete()
.eq("id", id)
.eq("municipio_id", usuarioLogado.municipio_id);

    if (error) {
      console.error(error);
      alert("Erro ao excluir equipamento.");
      return;
    }

    carregarEquipamentos();
  }

  useEffect(() => {
    carregarEquipamentos();
    carregarGuardas();
  }, []);

  const equipamentosFiltrados = equipamentos.filter((item) => {
    const texto = `
      ${item.patrimonio || ""}
      ${item.tipo || ""}
      ${item.marca || ""}
      ${item.modelo || ""}
      ${item.numero_serie || ""}
      ${item.validade || ""}
      ${item.status || ""}
      ${item.responsavel || ""}
      ${item.observacao || ""}
    `.toLowerCase();

    return texto.includes(busca.toLowerCase());
  });

  return (
    <div className="p-3 md:p-6 pb-24">
      <header className="border-b border-slate-800 pb-5 mb-6">
        <h1 className="text-2xl md:text-3xl font-bold">Equipamentos</h1>

        <p className="text-slate-400 text-sm md:text-base">
          Controle de equipamentos operacionais da GCM Biritinga.
        </p>
      </header>

      <section className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card titulo="Total" valor={equipamentos.length} />
        <Card
          titulo="Disponíveis"
          valor={equipamentos.filter((e) => e.status === "Disponível").length}
        />
        <Card
          titulo="Em uso"
          valor={equipamentos.filter((e) => e.status === "Em uso").length}
        />
        <Card
          titulo="Manutenção"
          valor={equipamentos.filter((e) => e.status === "Manutenção").length}
        />
      </section>

      <section className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="card">
          <h2 className="text-xl md:text-2xl font-bold mb-4">
            Novo Equipamento
          </h2>

          <div className="space-y-4">
            <Campo
              label="Patrimônio"
              valor={patrimonio}
              setValor={setPatrimonio}
              placeholder="Ex: CB-015"
            />

            <div>
              <label className="label">Tipo</label>
              <select
                className="input"
                value={tipo}
                onChange={(e) => setTipo(e.target.value)}
              >
                <option value="">Selecione</option>
                <option>Colete Balístico</option>
                <option>HT Rádio</option>
                <option>Tonfa</option>
                <option>Algema</option>
                <option>Lanterna</option>
                <option>BodyCam</option>
                <option>Tablet</option>
                <option>Celular Funcional</option>
                <option>Outro</option>
              </select>
            </div>

            <Campo label="Marca" valor={marca} setValor={setMarca} />
            <Campo label="Modelo" valor={modelo} setValor={setModelo} />

            <Campo
              label="Número de série"
              valor={numeroSerie}
              setValor={setNumeroSerie}
            />

            <div>
              <label className="label">Validade</label>
              <input
                type="date"
                className="input"
                value={validade}
                onChange={(e) => setValidade(e.target.value)}
              />
            </div>

            <div>
              <label className="label">Status</label>
              <select
                className="input"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                <option>Disponível</option>
                <option>Em uso</option>
                <option>Manutenção</option>
                <option>Baixado</option>
                <option>Extraviado</option>
              </select>
            </div>

            <div>
              <label className="label">Responsável</label>
              <select
                className="input"
                value={responsavel}
                onChange={(e) => setResponsavel(e.target.value)}
              >
                <option value="">Sem responsável</option>

                {guardas.map((g) => (
                  <option key={g.id} value={g.nome}>
                    {g.nome} • {g.matricula} • {g.status}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="label">Observação</label>
              <textarea
                className="input h-28 resize-none"
                value={observacao}
                onChange={(e) => setObservacao(e.target.value)}
                placeholder="Observações sobre o equipamento..."
              />
            </div>

            <button
              type="button"
              onClick={salvarEquipamento}
              className="btn-primary w-full text-lg"
            >
              Salvar Equipamento
            </button>
          </div>
        </div>

        <div className="card xl:col-span-2">
          <h2 className="text-xl md:text-2xl font-bold mb-4">
            Equipamentos Cadastrados
          </h2>

          <div className="mb-5">
            <label className="label">Buscar equipamento</label>
            <input
              className="input"
              placeholder="Buscar por patrimônio, tipo, responsável..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
            />
          </div>

          {carregando ? (
            <p className="text-slate-400">Carregando equipamentos...</p>
          ) : equipamentosFiltrados.length === 0 ? (
            <p className="text-slate-400">Nenhum equipamento encontrado.</p>
          ) : (
            <>
              <div className="md:hidden space-y-4">
                {equipamentosFiltrados.map((item) => (
                  <div
                    key={item.id}
                    className="bg-slate-950/40 border border-slate-700 rounded-xl p-4 space-y-3"
                  >
                    <div className="flex justify-between gap-3 items-start">
                      <div>
                        <p className="text-blue-400 font-semibold">
                          {item.patrimonio || "Sem patrimônio"}
                        </p>

                        <h3 className="text-xl font-bold">
                          {item.tipo || "Equipamento"}
                        </h3>
                      </div>

                      <Status status={item.status || "-"} />
                    </div>

                    <Linha nome="Marca" valor={item.marca || "-"} />
                    <Linha nome="Modelo" valor={item.modelo || "-"} />
                    <Linha nome="Série" valor={item.numero_serie || "-"} />
                    <Linha nome="Validade" valor={item.validade || "-"} />
                    <Linha nome="Responsável" valor={item.responsavel || "-"} />

                    {item.observacao && (
                      <p className="text-slate-400">{item.observacao}</p>
                    )}

                    <button
                      type="button"
                      onClick={() => excluirEquipamento(item.id)}
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
                      <th className="text-left py-3">Patrimônio</th>
                      <th className="text-left py-3">Tipo</th>
                      <th className="text-left py-3">Status</th>
                      <th className="text-left py-3">Responsável</th>
                      <th className="text-left py-3">Validade</th>
                      <th className="text-right py-3">Ações</th>
                    </tr>
                  </thead>

                  <tbody>
                    {equipamentosFiltrados.map((item) => (
                      <tr key={item.id} className="border-b border-slate-800">
                        <td className="py-4 text-blue-400 font-semibold">
                          {item.patrimonio || "-"}
                        </td>
                        <td>{item.tipo || "-"}</td>
                        <td>
                          <Status status={item.status || "-"} />
                        </td>
                        <td className="text-slate-400">
                          {item.responsavel || "-"}
                        </td>
                        <td>{item.validade || "-"}</td>
                        <td className="text-right">
                          <button
                            type="button"
                            onClick={() => excluirEquipamento(item.id)}
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

function Card({ titulo, valor }: { titulo: string; valor: number }) {
  return (
    <div className="card min-h-32 flex flex-col justify-center">
      <p className="text-slate-400 text-lg md:text-base">{titulo}</p>
      <h2 className="text-5xl md:text-4xl font-bold">{valor}</h2>
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

  if (status === "Disponível") cor = "bg-green-700 text-green-100";
  if (status === "Em uso") cor = "bg-blue-700 text-blue-100";
  if (status === "Manutenção") cor = "bg-yellow-600 text-yellow-100";
  if (status === "Baixado") cor = "bg-red-700 text-red-100";
  if (status === "Extraviado") cor = "bg-red-900 text-red-100";

  return (
    <span className={`${cor} px-3 py-2 rounded text-xs inline-block`}>
      {status}
    </span>
  );
}