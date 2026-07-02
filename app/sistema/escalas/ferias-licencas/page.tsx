"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import BotaoAcao from "@/components/BotaoAcao";
import { Trash2 } from "lucide-react";
import { registrarAuditoria } from "@/lib/auditoria";

type Guarda = {
  id: number;
  nome: string;
  matricula: string;
};

type Afastamento = {
  id: number;
  guarda_id: number;
  guarda_nome: string;
  tipo: string;
  data_inicio: string;
  data_fim: string;
  status: string;
  observacao: string | null;
};

export default function FeriasLicencasPage() {
  const [guardas, setGuardas] = useState<Guarda[]>([]);
  const [afastamentos, setAfastamentos] = useState<Afastamento[]>([]);

  const [guardaId, setGuardaId] = useState("");
  const [tipo, setTipo] = useState("Férias");
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");
  const [observacao, setObservacao] = useState("");

  const usuarioLogado =
    typeof window !== "undefined"
      ? JSON.parse(localStorage.getItem("usuarioLogado") || "{}")
      : {};

  const municipioId = usuarioLogado?.municipio_id;

  async function carregarDados() {
    if (!municipioId) return;

    const { data: guardasData } = await supabase
      .from("guardas")
      .select("id, nome, matricula")
      .eq("municipio_id", municipioId)
      .order("nome");

    const { data: afastamentosData } = await supabase
      .from("ferias_licencas")
      .select("*")
      .eq("municipio_id", municipioId)
      .order("data_inicio", { ascending: false });

    setGuardas(guardasData || []);
    setAfastamentos(afastamentosData || []);
  }

  async function salvarAfastamento() {
    if (!municipioId) {
      alert("Município não identificado.");
      return;
    }

    if (!guardaId || !tipo || !dataInicio || !dataFim) {
      alert("Preencha guarda, tipo, início e fim.");
      return;
    }

    const guarda = guardas.find((g) => String(g.id) === guardaId);

    const { error } = await supabase.from("ferias_licencas").insert({
      municipio_id: municipioId,
      guarda_id: Number(guardaId),
      guarda_nome: guarda?.nome || "",
      tipo,
      data_inicio: dataInicio,
      data_fim: dataFim,
      status: "ATIVO",
      observacao,
    });

    if (error) {
      console.error(error);
      alert("Erro ao salvar férias/licença.");
      return;
    }

    await registrarAuditoria({
  modulo: "Férias e Licenças",
  acao: "CRIAR",
  descricao: `Registrou ${tipo} para ${guarda?.nome || "guarda"}.`,
});

    setGuardaId("");
    setTipo("Férias");
    setDataInicio("");
    setDataFim("");
    setObservacao("");

    await carregarDados();
  }

  async function excluirAfastamento(id: number) {
    const confirmar = confirm("Deseja excluir este registro?");
    if (!confirmar) return;

    const afastamento = afastamentos.find((a) => a.id === id);

    const { error } = await supabase
      .from("ferias_licencas")
      .delete()
      .eq("id", id)
      .eq("municipio_id", municipioId);

    if (error) {
      console.error(error);
      alert("Erro ao excluir.");
      return;
    }

    await registrarAuditoria({
  modulo: "Férias e Licenças",
  acao: "EXCLUIR",
  descricao: `Excluiu ${afastamento?.tipo || "registro"} de ${
    afastamento?.guarda_nome || `ID ${id}`
  }.`,
});

    await carregarDados();
  }

  useEffect(() => {
    void carregarDados();
  }, []);

  return (
    <div className="p-3 md:p-6 pb-24">
      <header className="border-b border-slate-800 pb-5 mb-6">
        <h1 className="text-3xl md:text-5xl font-black text-white">
          Férias e Licenças
        </h1>

        <p className="text-slate-400 mt-2">
          Controle de férias, licenças e afastamentos para conciliação das escalas.
        </p>
      </header>

      <section className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="card">
          <h2 className="text-xl font-bold mb-4">
            Novo Registro
          </h2>

          <div className="space-y-4">
            <div>
              <label className="label">Guarda</label>
              <select
                className="input"
                value={guardaId}
                onChange={(e) => setGuardaId(e.target.value)}
              >
                <option value="">Selecione</option>
                {guardas.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.nome} • {g.matricula}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="label">Tipo</label>
              <select
                className="input"
                value={tipo}
                onChange={(e) => setTipo(e.target.value)}
              >
                <option>Férias</option>
                <option>Licença médica</option>
                <option>Licença prêmio</option>
                <option>Afastamento</option>
                <option>Atestado</option>
                <option>Curso</option>
                <option>Outro</option>
              </select>
            </div>

            <div>
              <label className="label">Data início</label>
              <input
                type="date"
                className="input"
                value={dataInicio}
                onChange={(e) => setDataInicio(e.target.value)}
              />
            </div>

            <div>
              <label className="label">Data fim</label>
              <input
                type="date"
                className="input"
                value={dataFim}
                onChange={(e) => setDataFim(e.target.value)}
              />
            </div>

            <div>
              <label className="label">Observação</label>
              <textarea
                className="input h-28 resize-none"
                value={observacao}
                onChange={(e) => setObservacao(e.target.value)}
              />
            </div>

            <button
              type="button"
              onClick={salvarAfastamento}
              className="btn-primary w-full"
            >
              Salvar Registro
            </button>
          </div>
        </div>

        <div className="card xl:col-span-2">
          <h2 className="text-xl font-bold mb-4">
            Registros Cadastrados
          </h2>

          {afastamentos.length === 0 ? (
            <p className="text-slate-400">
              Nenhum registro encontrado.
            </p>
          ) : (
            <div className="space-y-3">
              {afastamentos.map((item) => (
                <div
                  key={item.id}
                  className="border border-slate-700 bg-slate-950/40 rounded-xl p-4 flex items-center justify-between gap-4"
                >
                  <div>
                    <p className="text-blue-400 font-bold">
                      {item.guarda_nome}
                    </p>

                    <p className="text-slate-300">
                      {item.tipo} • {item.data_inicio} até {item.data_fim}
                    </p>

                    <p className="text-xs text-slate-500">
                      Status: {item.status}
                    </p>

                    {item.observacao && (
                      <p className="text-sm text-slate-400 mt-1">
                        {item.observacao}
                      </p>
                    )}
                  </div>

                  <BotaoAcao
                    title="Excluir"
                    cor="red"
                    onClick={() => excluirAfastamento(item.id)}
                  >
                    <Trash2 size={18} />
                  </BotaoAcao>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}