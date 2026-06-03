"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import ProtecaoPerfil from "@/components/ProtecaoPerfil";

type EscalaMensal = {
  id: number;
  mes: string;
  ano: string;
  data_servico: string;
  guarda_nome: string;
  matricula: string | null;
  tipo: string | null;
  turno: string | null;
  equipe: string | null;
  observacao: string | null;
};

type Guarda = {
  id: number;
  nome: string;
  matricula: string;
  status: string;
};

export default function EscalaMensalPage() {
  const [registros, setRegistros] = useState<EscalaMensal[]>([]);
  const [guardas, setGuardas] = useState<Guarda[]>([]);
  const [busca, setBusca] = useState("");

  const hoje = new Date();
  const mesAtual = String(hoje.getMonth() + 1).padStart(2, "0");
  const anoAtual = String(hoje.getFullYear());

  const [mes, setMes] = useState(mesAtual);
  const [ano, setAno] = useState(anoAtual);
  const [dataServico, setDataServico] = useState("");
  const [guardaNome, setGuardaNome] = useState("");
  const [matricula, setMatricula] = useState("");
  const [tipo, setTipo] = useState("Plantão");
  const [turno, setTurno] = useState("24 horas");
  const [equipe, setEquipe] = useState("Equipe Alfa");
  const [observacao, setObservacao] = useState("");

  const [carregando, setCarregando] = useState(true);

  async function carregarDados() {
    setCarregando(true);

    const { data: escalaData, error: escalaError } = await supabase
      .from("escala_mensal")
      .select("*")
      .order("data_servico", { ascending: true });

    if (escalaError) {
      console.error(escalaError);
      alert("Erro ao carregar escala mensal.");
    }

    const { data: guardasData, error: guardasError } = await supabase
      .from("guardas")
      .select("id, nome, matricula, status")
      .order("nome", { ascending: true });

    if (guardasError) {
      console.error(guardasError);
      alert("Erro ao carregar guardas.");
    }

    setRegistros(escalaData || []);
    setGuardas(guardasData || []);
    setCarregando(false);
  }

  function selecionarGuarda(nome: string) {
    const guarda = guardas.find((g) => g.nome === nome);

    setGuardaNome(nome);
    setMatricula(guarda?.matricula || "");
  }

  async function salvarRegistro() {
    if (!mes || !ano || !dataServico || !guardaNome || !tipo) {
      alert("Preencha mês, ano, data, guarda e tipo.");
      return;
    }

    const { error } = await supabase.from("escala_mensal").insert([
      {
        mes,
        ano,
        data_servico: dataServico,
        guarda_nome: guardaNome,
        matricula,
        tipo,
        turno,
        equipe,
        observacao,
      },
    ]);

    if (error) {
      console.error(error);
      alert("Erro ao salvar registro da escala mensal.");
      return;
    }

    alert("Registro salvo na escala mensal!");

    setDataServico("");
    setGuardaNome("");
    setMatricula("");
    setTipo("Plantão");
    setTurno("24 horas");
    setEquipe("Equipe Alfa");
    setObservacao("");

    carregarDados();
  }

  async function excluirRegistro(id: number) {
    const confirmar = confirm("Deseja excluir este registro da escala mensal?");

    if (!confirmar) return;

    const { error } = await supabase
      .from("escala_mensal")
      .delete()
      .eq("id", id);

    if (error) {
      console.error(error);
      alert("Erro ao excluir registro.");
      return;
    }

    carregarDados();
  }

  useEffect(() => {
    carregarDados();
  }, []);

  const registrosMes = registros.filter(
    (item) => item.mes === mes && item.ano === ano
  );

  const filtrados = registrosMes.filter((item) => {
    const texto = `
      ${item.data_servico}
      ${item.guarda_nome}
      ${item.matricula || ""}
      ${item.tipo || ""}
      ${item.turno || ""}
      ${item.equipe || ""}
      ${item.observacao || ""}
    `.toLowerCase();

    return texto.includes(busca.toLowerCase());
  });

  const totalPlantao = registrosMes.filter((r) => r.tipo === "Plantão").length;
  const totalFolga = registrosMes.filter((r) => r.tipo === "Folga").length;
  const totalFerias = registrosMes.filter((r) => r.tipo === "Férias").length;
  const totalExtra = registrosMes.filter((r) => r.tipo === "Serviço Extra").length;

  return (
    <ProtecaoPerfil perfisPermitidos={["ADMIN", "COMANDANTE", "SUPERVISOR"]}>
      <div className="p-3 md:p-6 pb-24">
        <header className="border-b border-slate-800 pb-5 mb-6">
          <h1 className="text-2xl md:text-3xl font-bold">
            Escala Mensal
          </h1>

          <p className="text-slate-400 text-sm md:text-base">
            Planejamento mensal de plantões, folgas, férias e serviços extras.
          </p>
        </header>

        <section className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card titulo="Registros do mês" valor={registrosMes.length} />
          <Card titulo="Plantões" valor={totalPlantao} />
          <Card titulo="Folgas" valor={totalFolga} />
          <Card titulo="Férias" valor={totalFerias} />
        </section>

        <section className="card mb-6">
          <h2 className="text-xl md:text-2xl font-bold mb-4">
            Filtro do Mês
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="label">Mês</label>
              <select
                className="input"
                value={mes}
                onChange={(e) => setMes(e.target.value)}
              >
                <option value="01">Janeiro</option>
                <option value="02">Fevereiro</option>
                <option value="03">Março</option>
                <option value="04">Abril</option>
                <option value="05">Maio</option>
                <option value="06">Junho</option>
                <option value="07">Julho</option>
                <option value="08">Agosto</option>
                <option value="09">Setembro</option>
                <option value="10">Outubro</option>
                <option value="11">Novembro</option>
                <option value="12">Dezembro</option>
              </select>
            </div>

            <Campo
              label="Ano"
              valor={ano}
              setValor={setAno}
              placeholder="Ex: 2026"
            />

            <div className="md:col-span-2 flex items-end">
              <div className="bg-slate-950/40 border border-slate-700 rounded-xl p-4 w-full">
                <p className="text-slate-400 text-sm">Resumo</p>
                <p className="font-bold">
                  {registrosMes.length} registro(s) encontrados para {mes}/{ano}
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 xl:grid-cols-3 gap-4">
          <div className="card">
            <h2 className="text-xl md:text-2xl font-bold mb-4">
              Novo Registro
            </h2>

            <div className="space-y-4">
              <div>
                <label className="label">Data</label>
                <input
                  type="date"
                  className="input"
                  value={dataServico}
                  onChange={(e) => setDataServico(e.target.value)}
                />
              </div>

              <div>
                <label className="label">Guarda</label>
                <select
                  className="input"
                  value={guardaNome}
                  onChange={(e) => selecionarGuarda(e.target.value)}
                >
                  <option value="">Selecione</option>

                  {guardas.map((g) => (
                    <option key={g.id} value={g.nome}>
                      {g.nome} • {g.matricula} • {g.status}
                    </option>
                  ))}
                </select>
              </div>

              <Campo
                label="Matrícula"
                valor={matricula}
                setValor={setMatricula}
                placeholder="Preenchida automaticamente"
              />

              <div>
                <label className="label">Tipo</label>
                <select
                  className="input"
                  value={tipo}
                  onChange={(e) => setTipo(e.target.value)}
                >
                  <option>Plantão</option>
                  <option>Folga</option>
                  <option>Férias</option>
                  <option>Afastamento</option>
                  <option>Licença</option>
                  <option>Serviço Extra</option>
                  <option>Evento</option>
                  <option>Administrativo</option>
                </select>
              </div>

              <div>
                <label className="label">Turno</label>
                <select
                  className="input"
                  value={turno}
                  onChange={(e) => setTurno(e.target.value)}
                >
                  <option>06h às 18h</option>
                  <option>18h às 06h</option>
                  <option>24 horas</option>
                  <option>Administrativo</option>
                  <option>Extra</option>
                  <option>Evento</option>
                  <option>Não se aplica</option>
                </select>
              </div>

              <div>
                <label className="label">Equipe</label>
                <select
                  className="input"
                  value={equipe}
                  onChange={(e) => setEquipe(e.target.value)}
                >
                  <option>Equipe Alfa</option>
                  <option>Equipe Bravo</option>
                  <option>Equipe Charlie</option>
                  <option>Equipe Delta</option>
                  <option>Equipe Extra</option>
                  <option>Não se aplica</option>
                </select>
              </div>

              <div>
                <label className="label">Observação</label>
                <textarea
                  className="input h-28 resize-none"
                  value={observacao}
                  onChange={(e) => setObservacao(e.target.value)}
                  placeholder="Ex: plantão extra, férias autorizadas, afastamento..."
                />
              </div>

              <button
                type="button"
                onClick={salvarRegistro}
                className="btn-primary w-full text-lg"
              >
                Salvar na Escala Mensal
              </button>
            </div>
          </div>

          <div className="card xl:col-span-2">
            <h2 className="text-xl md:text-2xl font-bold mb-4">
              Escala do Mês
            </h2>

            <div className="mb-5">
              <label className="label">Buscar</label>
              <input
                className="input"
                placeholder="Buscar por guarda, data, equipe, tipo..."
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
              />
            </div>

            {carregando ? (
              <p className="text-slate-400">Carregando escala mensal...</p>
            ) : filtrados.length === 0 ? (
              <p className="text-slate-400">Nenhum registro encontrado.</p>
            ) : (
              <>
                <div className="md:hidden space-y-4">
                  {filtrados.map((item) => (
                    <div
                      key={item.id}
                      className="bg-slate-950/40 border border-slate-700 rounded-xl p-4 space-y-3"
                    >
                      <div>
                        <p className="text-blue-400 font-semibold">
                          {item.data_servico}
                        </p>

                        <h3 className="text-xl font-bold">
                          {item.guarda_nome}
                        </h3>
                      </div>

                      <Linha nome="Matrícula" valor={item.matricula || "-"} />
                      <Linha nome="Tipo" valor={item.tipo || "-"} />
                      <Linha nome="Turno" valor={item.turno || "-"} />
                      <Linha nome="Equipe" valor={item.equipe || "-"} />

                      {item.observacao && (
                        <p className="text-slate-400">
                          {item.observacao}
                        </p>
                      )}

                      <button
                        type="button"
                        onClick={() => excluirRegistro(item.id)}
                        className="w-full bg-red-700 hover:bg-red-800 px-4 py-3 rounded-xl font-semibold"
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
                        <th className="text-left py-3">Data</th>
                        <th className="text-left py-3">Guarda</th>
                        <th className="text-left py-3">Matrícula</th>
                        <th className="text-left py-3">Tipo</th>
                        <th className="text-left py-3">Turno</th>
                        <th className="text-left py-3">Equipe</th>
                        <th className="text-right py-3">Ações</th>
                      </tr>
                    </thead>

                    <tbody>
                      {filtrados.map((item) => (
                        <tr key={item.id} className="border-b border-slate-800">
                          <td className="py-4 text-blue-400 font-semibold">
                            {item.data_servico}
                          </td>

                          <td>{item.guarda_nome}</td>
                          <td className="text-slate-400">
                            {item.matricula || "-"}
                          </td>
                          <td>{item.tipo || "-"}</td>
                          <td className="text-slate-400">
                            {item.turno || "-"}
                          </td>
                          <td>{item.equipe || "-"}</td>

                          <td className="text-right">
                            <button
                              type="button"
                              onClick={() => excluirRegistro(item.id)}
                              className="bg-red-700 hover:bg-red-800 px-3 py-2 rounded-lg text-xs"
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

            <div className="mt-6 p-4 rounded-xl border border-slate-700 bg-slate-950/40">
              <h3 className="font-bold mb-2">Legenda</h3>
              <p className="text-sm text-slate-400">
                Use esta tela para registrar plantões, folgas, férias, afastamentos,
                licenças, eventos e serviços extras do mês.
              </p>
            </div>
          </div>
        </section>
      </div>
    </ProtecaoPerfil>
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