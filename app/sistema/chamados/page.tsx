"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import CardIndicador from "@/components/CardIndicador";

type Chamado = {
  id: number;
  protocolo: string;
  solicitante: string;
  telefone: string | null;
  tipo: string;
  local: string;
  prioridade: string;
  status: string;
  observacao: string | null;
};

export default function Chamados() {
  const [chamados, setChamados] = useState<Chamado[]>([]);
  const [busca, setBusca] = useState("");

  const [solicitante, setSolicitante] = useState("");
  const [telefone, setTelefone] = useState("");
  const [tipo, setTipo] = useState("");
  const [local, setLocal] = useState("");
  const [prioridade, setPrioridade] = useState("Normal");
  const [status, setStatus] = useState("Aberto");
  const [observacao, setObservacao] = useState("");

  const [carregando, setCarregando] = useState(true);

  async function carregarChamados() {
    setCarregando(true);

    const { data, error } = await supabase
      .from("chamados")
      .select("*")
      .order("id", { ascending: false });

    if (error) {
      console.error(error);
      alert("Erro ao carregar chamados.");
      setCarregando(false);
      return;
    }

    setChamados(data || []);
    setCarregando(false);
  }

  async function salvarChamado() {
    if (!solicitante || !tipo || !local) {
      alert("Preencha solicitante, tipo e local.");
      return;
    }

    const protocolo = "CH-" + Date.now();

    const { error } = await supabase.from("chamados").insert([
      {
        protocolo,
        solicitante,
        telefone,
        tipo,
        local,
        prioridade,
        status,
        observacao,
      },
    ]);

    if (error) {
      console.error(error);
      alert("Erro ao salvar chamado.");
      return;
    }

    alert("Chamado registrado com sucesso!");

    setSolicitante("");
    setTelefone("");
    setTipo("");
    setLocal("");
    setPrioridade("Normal");
    setStatus("Aberto");
    setObservacao("");

    carregarChamados();
  }

  async function excluirChamado(id: number) {
    const confirmar = confirm("Deseja excluir este chamado?");

    if (!confirmar) return;

    const { error } = await supabase
      .from("chamados")
      .delete()
      .eq("id", id);

    if (error) {
      console.error(error);
      alert("Erro ao excluir chamado.");
      return;
    }

    carregarChamados();
  }

  useEffect(() => {
    carregarChamados();
  }, []);

  const chamadosFiltrados = chamados.filter((chamado) => {
    const texto = `
      ${chamado.protocolo}
      ${chamado.solicitante}
      ${chamado.telefone || ""}
      ${chamado.tipo}
      ${chamado.local}
      ${chamado.prioridade}
      ${chamado.status}
    `.toLowerCase();

    return texto.includes(busca.toLowerCase());
  });

  return (
    <div className="p-3 md:p-6 pb-24">
      <header className="mb-6">
  <div className="flex flex-col gap-4 border-b border-slate-800 pb-5">

    <div>
      <h1 className="text-3xl md:text-5xl font-bold tracking-tight">
        Chamados
      </h1>

      <p className="text-slate-400 text-base md:text-lg mt-1">
        Atendimento e controle dos chamados recebidos pela GCM.
      </p>
    </div>

  </div>
</header>

      <section className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">

  <CardIndicador
    titulo="Total"
    valor={chamados.length}
    icone="📞"
    cor="blue"
  />

  <CardIndicador
    titulo="Abertos"
    valor={
      chamados.filter(
        (c) => c.status === "Aberto"
      ).length
    }
    icone="🚨"
    cor="yellow"
  />

  <CardIndicador
    titulo="Em Atendimento"
    valor={
      chamados.filter(
        (c) => c.status === "Em Atendimento"
      ).length
    }
    icone="🚔"
    cor="purple"
  />

  <CardIndicador
    titulo="Finalizados"
    valor={
      chamados.filter(
        (c) => c.status === "Finalizado"
      ).length
    }
    icone="✅"
    cor="green"
  />

</section>

      <section className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="card">
          <h2 className="text-xl md:text-2xl font-bold mb-4">
            Novo Chamado
          </h2>

          <div className="space-y-4">
            <div>
              <label className="label">Solicitante</label>
              <input
                className="input"
                placeholder="Nome do solicitante"
                value={solicitante}
                onChange={(e) => setSolicitante(e.target.value)}
              />
            </div>

            <div>
              <label className="label">Telefone</label>
              <input
                className="input"
                placeholder="(75) 99999-9999"
                value={telefone}
                onChange={(e) => setTelefone(e.target.value)}
              />
            </div>

            <div>
              <label className="label">Tipo do chamado</label>
              <select
                className="input"
                value={tipo}
                onChange={(e) => setTipo(e.target.value)}
              >
                <option value="">Selecione</option>
                <option value="Perturbação do sossego">Perturbação do sossego</option>
                <option value="Apoio ao cidadão">Apoio ao cidadão</option>
                <option value="Fiscalização">Fiscalização</option>
                <option value="Ronda preventiva">Ronda preventiva</option>
                <option value="Acidente">Acidente</option>
                <option value="Conselho Tutelar">Conselho Tutelar</option>
                <option value="CAPS">CAPS</option>
                <option value="Apoio em evento esportivo">Apoio em evento esportivo</option>
                <option value="Apoio em evento cultural">Apoio em evento cultural</option>
                <option value="Apoio em evento religioso">Apoio em evento religioso</option>
                <option value="Apoio à saúde">Apoio à saúde</option>
                <option value="Averiguação de denúncia">Averiguação de denúncia</option>
                <option value="Outro">Outro</option>
              </select>
            </div>

            <div>
              <label className="label">Local</label>
              <input
                className="input"
                placeholder="Local do chamado"
                value={local}
                onChange={(e) => setLocal(e.target.value)}
              />
            </div>

            <div>
              <label className="label">Prioridade</label>
              <select
                className="input"
                value={prioridade}
                onChange={(e) => setPrioridade(e.target.value)}
              >
                <option>Baixa</option>
                <option>Normal</option>
                <option>Urgente</option>
              </select>
            </div>

            <div>
              <label className="label">Status</label>
              <select
                className="input"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                <option>Aberto</option>
                <option>Em atendimento</option>
                <option>Finalizado</option>
              </select>
            </div>

            <div>
              <label className="label">Observação</label>
              <textarea
                className="input h-32 resize-none"
                placeholder="Detalhes do chamado"
                value={observacao}
                onChange={(e) => setObservacao(e.target.value)}
              />
            </div>

            <button
              type="button"
              onClick={salvarChamado}
              className="btn-primary w-full text-lg"
            >
              Registrar Chamado
            </button>
          </div>
        </div>

        <div className="card xl:col-span-2">
          <h2 className="text-xl md:text-2xl font-bold mb-4">
            Chamados Registrados
          </h2>

          <div className="mb-5">
            <label className="label">Buscar chamado</label>
            <input
              className="input"
              placeholder="Buscar por protocolo, solicitante, tipo, local..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
            />
          </div>

          {carregando ? (
            <p className="text-slate-400">Carregando chamados...</p>
          ) : chamadosFiltrados.length === 0 ? (
            <p className="text-slate-400">Nenhum chamado encontrado.</p>
          ) : (
            <>
              <div className="md:hidden space-y-4">
                {chamadosFiltrados.map((chamado) => (
                  <div
                    key={chamado.id}
                    className="bg-slate-950/40 border border-slate-700 rounded-xl p-4 space-y-3"
                  >
                    <div className="flex justify-between gap-3 items-start">
                      <div>
                        <p className="text-blue-400 font-semibold">
                          {chamado.protocolo}
                        </p>

                        <h3 className="text-xl font-bold">
                          {chamado.tipo}
                        </h3>
                      </div>

                      <Prioridade prioridade={chamado.prioridade} />
                    </div>

                    <div className="text-slate-300 space-y-1">
                      <p>
                        <span className="text-slate-500">Solicitante: </span>
                        {chamado.solicitante}
                      </p>

                      <p>
                        <span className="text-slate-500">Telefone: </span>
                        {chamado.telefone || "-"}
                      </p>

                      <p>
                        <span className="text-slate-500">Local: </span>
                        {chamado.local}
                      </p>

                      <p>
                        <span className="text-slate-500">Status: </span>
                        <Status status={chamado.status} />
                      </p>

                      {chamado.observacao && (
                        <p className="pt-2 text-slate-400">
                          {chamado.observacao}
                        </p>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => excluirChamado(chamado.id)}
                      className="w-full bg-red-700 hover:bg-red-800 text-white px-4 py-3 rounded-xl font-semibold"
                    >
                      Excluir
                    </button>
                  </div>
                ))}
              </div>

              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b border-slate-700 text-slate-400">
                    <tr>
                      <th className="text-left py-3">Protocolo</th>
                      <th className="text-left py-3">Solicitante</th>
                      <th className="text-left py-3">Tipo</th>
                      <th className="text-left py-3">Prioridade</th>
                      <th className="text-left py-3">Status</th>
                      <th className="text-right py-3">Ações</th>
                    </tr>
                  </thead>

                  <tbody>
                    {chamadosFiltrados.map((chamado) => (
                      <tr key={chamado.id} className="border-b border-slate-800">
                        <td className="py-4 text-blue-400 font-semibold">
                          {chamado.protocolo}
                        </td>

                        <td>{chamado.solicitante}</td>
                        <td className="text-slate-400">{chamado.tipo}</td>

                        <td>
                          <Prioridade prioridade={chamado.prioridade} />
                        </td>

                        <td>
                          <Status status={chamado.status} />
                        </td>

                        <td className="text-right">
                          <button
                            type="button"
                            onClick={() => excluirChamado(chamado.id)}
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

function Card({ titulo, valor }: { titulo: string; valor: number }) {
  return (
    <div className="card min-h-32 flex flex-col justify-center">
      <p className="text-slate-400 text-lg md:text-base">{titulo}</p>
      <h2 className="text-5xl md:text-4xl font-bold">{valor}</h2>
    </div>
  );
}

function Prioridade({ prioridade }: { prioridade: string }) {
  let cor = "bg-blue-700 text-blue-100";

  if (prioridade === "Baixa") cor = "bg-slate-700 text-slate-100";
  if (prioridade === "Normal") cor = "bg-blue-700 text-blue-100";
  if (prioridade === "Urgente") cor = "bg-red-700 text-red-100";

  return (
    <span className={`${cor} px-3 py-2 rounded text-xs inline-block`}>
      {prioridade}
    </span>
  );
}

function Status({ status }: { status: string }) {
  let cor = "bg-yellow-600 text-yellow-100";

  if (status === "Aberto") cor = "bg-yellow-600 text-yellow-100";
  if (status === "Em atendimento") cor = "bg-blue-700 text-blue-100";
  if (status === "Finalizado") cor = "bg-green-700 text-green-100";

  return (
    <span className={`${cor} px-3 py-2 rounded text-xs inline-block`}>
      {status}
    </span>
  );
}