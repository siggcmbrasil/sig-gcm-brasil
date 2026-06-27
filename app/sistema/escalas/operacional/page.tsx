"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import ProtecaoPerfil from "@/components/ProtecaoPerfil";

type Escala = {
  id: number;
  data_servico: string;
  turno: string;
  guarda_nome: string;
  matricula: string | null;
  equipe: string | null;
  viatura: string | null;
  funcao: string | null;
  observacao: string | null;
};

type Guarda = {
  id: number;
  nome: string;
  matricula: string;
  status: string;
};

type Viatura = {
  id: number;
  prefixo: string;
  modelo: string;
  status: string;
};

export default function Escalas() {
  const [escalas, setEscalas] = useState<Escala[]>([]);
  const [guardas, setGuardas] = useState<Guarda[]>([]);
  const [viaturas, setViaturas] = useState<Viatura[]>([]);
  const [busca, setBusca] = useState("");

  const [dataServico, setDataServico] = useState("");
  const [turno, setTurno] = useState("24 horas");
  const [guardaNome, setGuardaNome] = useState("");
  const [matricula, setMatricula] = useState("");
  const [equipe, setEquipe] = useState("Equipe Alfa");
  const [viatura, setViatura] = useState("");
  const [funcao, setFuncao] = useState("Patrulheiro");
  const [observacao, setObservacao] = useState("");

  const [guardaId, setGuardaId] = useState("");

  const [carregando, setCarregando] = useState(true);

 const usuarioLogado =
  typeof window !== "undefined"
    ? JSON.parse(localStorage.getItem("usuarioLogado") || "{}")
    : null;

const municipioId = usuarioLogado?.municipio_id;

  async function carregarDados() {

if (!municipioId) {
  alert("Município não identificado.");
  return;
}

    setCarregando(true);

    const { data: escalasData } = await supabase
      .from("escalas_servico")
.select("*")
.eq("municipio_id", municipioId)
.order("data_servico", { ascending: false });
    const { data: guardasData } = await supabase
      .from("guardas")
.select("id, nome, matricula, status")
.eq("municipio_id", municipioId)
.order("nome", { ascending: true });

    const { data: viaturasData } = await supabase
      .from("viaturas")
.select("id, prefixo, modelo, status")
.eq("municipio_id", municipioId)
.order("prefixo", { ascending: true });

    setEscalas(escalasData || []);
    setGuardas(guardasData || []);
    setViaturas(viaturasData || []);
    setCarregando(false);
  }

  function selecionarGuarda(id: string) {
  const guarda = guardas.find((g) => String(g.id) === id);

  setGuardaId(id);
  setGuardaNome(guarda?.nome || "");
  setMatricula(guarda?.matricula || "");
}

  async function salvarEscala() {

if (!municipioId) {
  alert("Município não identificado.");
  return;
}

    if (!dataServico || !turno || !guardaNome) {
      alert("Preencha data, turno e guarda.");
      return;
    }

    const { data: indisponivel } = await supabase
  .from("ferias_licencas")
  .select("*")
  .eq("municipio_id", municipioId)
  .eq("guarda_id", Number(guardaId))
  .eq("status", "ATIVO")
  .lte("data_inicio", dataServico)
  .gte("data_fim", dataServico)
  .maybeSingle();

if (indisponivel) {
  alert(
    `O guarda está em ${indisponivel.tipo.toLowerCase()} neste período.`
  );
  return;
}

const { data: jaEscalado } = await supabase
  .from("escalas_servico")
  .select("id")
  .eq("municipio_id", municipioId)
  .eq("guarda_id", Number(guardaId))
  .eq("data_servico", dataServico)
  .maybeSingle();

if (jaEscalado) {
  alert("Este guarda já está escalado nesta data.");
  return;
}

    const { error } = await supabase
  .from("escalas_servico")
  .insert([
    {
      guarda_id: Number(guardaId),
      municipio_id: municipioId,

      data_servico: dataServico,
      turno,
      guarda_nome: guardaNome,
      matricula,
      equipe,
      viatura,
      funcao,
      observacao,
    },
  ]);

    if (error) {
      console.error(error);
      alert("Erro ao salvar escala.");
      return;
    }

    alert("Escala cadastrada com sucesso!");

    setDataServico("");
    setTurno("06h às 18h");
    setGuardaNome("");
    setMatricula("");
    setEquipe("Equipe Alfa");
    setViatura("");
    setFuncao("Patrulheiro");
    setObservacao("");
    setGuardaId("");

    await carregarDados();
  }

  async function excluirEscala(id: number) {

if (!municipioId) {
  alert("Município não identificado.");
  return;
}

    const confirmar = confirm("Deseja excluir esta escala?");

    if (!confirmar) return;

    const { error } = await supabase
      .from("escalas_servico")
      .delete()
.eq("id", id)
.eq("municipio_id", municipioId);

    if (error) {
      console.error(error);
      alert("Erro ao excluir escala.");
      return;
    }

    await carregarDados();
  }

  useEffect(() => {
  void carregarDados();
}, []);

  const hoje = new Date().toISOString().split("T")[0];

  const escalasHoje = escalas.filter((e) => e.data_servico === hoje);

  const filtradas = escalas.filter((e) => {
    const texto = `
      ${e.data_servico}
      ${e.turno}
      ${e.guarda_nome}
      ${e.matricula || ""}
      ${e.equipe || ""}
      ${e.viatura || ""}
      ${e.funcao || ""}
      ${e.observacao || ""}
    `.toLowerCase();

    return texto.includes(busca.toLowerCase());
  });

  return (
    <ProtecaoPerfil
  perfisPermitidos={[
    "DESENVOLVEDOR",
    "ADMIN",
    "COMANDANTE",
    "CMT_GUARNICAO",
  ]}
>
      <div className="p-3 md:p-6 pb-24">
        <header className="border-b border-slate-800 pb-5 mb-6">
          <h1 className="text-2xl md:text-3xl font-bold">
            Escala de Serviço
          </h1>

          <p className="text-slate-400 text-sm md:text-base">
            Controle profissional das equipes, turnos, funções e viaturas da GCM.
          </p>
        </header>

        <section className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card titulo="Total" valor={escalas.length} />
          <Card titulo="Hoje" valor={escalasHoje.length} />
          <Card titulo="Guardas" valor={guardas.length} />
          <Card titulo="Viaturas" valor={viaturas.length} />
        </section>

        <section className="card mb-6">
          <h2 className="text-xl md:text-2xl font-bold mb-4">
            Escala de Hoje
          </h2>

          {escalasHoje.length === 0 ? (
            <p className="text-slate-400">
              Nenhum guarda escalado para hoje.
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {escalasHoje.map((item) => (
                <div
                  key={item.id}
                  className="bg-slate-950/40 border border-slate-700 rounded-xl p-4 space-y-2"
                >
                  <p className="text-blue-400 font-semibold">
                    {item.turno}
                  </p>

                  <h3 className="text-xl font-bold">
                    {item.guarda_nome}
                  </h3>

                  <Linha nome="Matrícula" valor={item.matricula || "-"} />
                  <Linha nome="Equipe" valor={item.equipe || "-"} />
                  <Linha nome="Viatura" valor={item.viatura || "-"} />
                  <Linha nome="Função" valor={item.funcao || "-"} />
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="grid grid-cols-1 xl:grid-cols-3 gap-4">
          <div className="card">
            <h2 className="text-xl md:text-2xl font-bold mb-4">
              Nova Escala
            </h2>

            <div className="space-y-4">
              <div>
                <label className="label">Data do serviço</label>
                <input
                  type="date"
                  className="input"
                  value={dataServico}
                  onChange={(e) => setDataServico(e.target.value)}
                />
              </div>

              <div>
                <label className="label">Turno</label>
                <select
                  className="input"
                  value={turno}
                  onChange={(e) => setTurno(e.target.value)}
                >
                  <option>24 horas</option>
                  <option>07h às 07h</option>
                  <option>Administrativo</option>
                  <option>Extra</option>
                  <option>Evento</option>
                </select>
              </div>

              <div>
                <label className="label">Guarda</label>
                <select
                  className="input"
                  value={guardaId}
                  onChange={(e) => selecionarGuarda(e.target.value)}
                >
                  <option value="">Selecione</option>

                  {guardas.map((g) => (
                    <option key={g.id} value={g.id}>
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
                </select>
              </div>

              <div>
                <label className="label">Viatura</label>
                <select
                  className="input"
                  value={viatura}
                  onChange={(e) => setViatura(e.target.value)}
                >
                  <option value="">Sem viatura</option>

                  {viaturas.map((v) => (
                    <option key={v.id} value={v.prefixo}>
                      {v.prefixo} • {v.modelo} • {v.status}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="label">Função</label>
                <select
                  className="input"
                  value={funcao}
                  onChange={(e) => setFuncao(e.target.value)}
                >
                  <option>Patrulheiro</option>
                  <option>Motorista</option>
                  <option>Comandante da Guarnição</option>
                  <option>Comandante</option>
                  <option>Coordenador</option>
                  <option>Base</option>
                  <option>Ronda Escolar</option>
                  <option>Apoio a Evento</option>
                </select>
              </div>

              <div>
                <label className="label">Observação</label>
                <textarea
                  className="input h-28 resize-none"
                  value={observacao}
                  onChange={(e) => setObservacao(e.target.value)}
                  placeholder="Observações da escala..."
                />
              </div>

              <button
                type="button"
                onClick={salvarEscala}
                className="btn-primary w-full text-lg"
              >
                Cadastrar Escala
              </button>
            </div>
          </div>

          <div className="card xl:col-span-2">
            <h2 className="text-xl md:text-2xl font-bold mb-4">
              Escalas Cadastradas
            </h2>

            <div className="mb-5">
              <label className="label">Buscar escala</label>
              <input
                className="input"
                placeholder="Buscar por data, guarda, equipe, função ou viatura..."
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
              />
            </div>

            {carregando ? (
              <p className="text-slate-400">Carregando escalas...</p>
            ) : filtradas.length === 0 ? (
              <p className="text-slate-400">Nenhuma escala encontrada.</p>
            ) : (
              <>
                <div className="md:hidden space-y-4">
                  {filtradas.map((item) => (
                    <div
                      key={item.id}
                      className="bg-slate-950/40 border border-slate-700 rounded-xl p-4 space-y-3"
                    >
                      <div>
                        <p className="text-blue-400 font-semibold">
                          {item.data_servico} • {item.turno}
                        </p>

                        <h3 className="text-xl font-bold">
                          {item.guarda_nome}
                        </h3>
                      </div>

                      <Linha nome="Matrícula" valor={item.matricula || "-"} />
                      <Linha nome="Equipe" valor={item.equipe || "-"} />
                      <Linha nome="Viatura" valor={item.viatura || "-"} />
                      <Linha nome="Função" valor={item.funcao || "-"} />

                      {item.observacao && (
                        <p className="text-slate-400">
                          {item.observacao}
                        </p>
                      )}

                      <button
                        type="button"
                        onClick={() => excluirEscala(item.id)}
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
                        <th className="text-left py-3">Turno</th>
                        <th className="text-left py-3">Guarda</th>
                        <th className="text-left py-3">Equipe</th>
                        <th className="text-left py-3">Viatura</th>
                        <th className="text-left py-3">Função</th>
                        <th className="text-right py-3">Ações</th>
                      </tr>
                    </thead>

                    <tbody>
                      {filtradas.map((item) => (
                        <tr key={item.id} className="border-b border-slate-800">
                          <td className="py-4 text-blue-400 font-semibold">
                            {item.data_servico}
                          </td>
                          <td>{item.turno}</td>
                          <td>{item.guarda_nome}</td>
                          <td className="text-slate-400">
                            {item.equipe || "-"}
                          </td>
                          <td>{item.viatura || "-"}</td>
                          <td className="text-slate-400">
                            {item.funcao || "-"}
                          </td>
                          <td className="text-right">
                            <button
                              type="button"
                              onClick={() => excluirEscala(item.id)}
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