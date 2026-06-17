"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import ProtecaoPerfil from "@/components/ProtecaoPerfil";

type Ocorrencia = {
  id: number;
  data: string;
  status: string;
  tipo: string;
  bairro?: string;
  local?: string;
};

type Patrulhamento = {
  id: number;
  data: string;
};

type Guarda = {
  id: number;
  status: string;
};

export default function Estatisticas() {
  const [ocorrencias, setOcorrencias] = useState<Ocorrencia[]>([]);
  const [patrulhamentos, setPatrulhamentos] = useState<Patrulhamento[]>([]);
  const [guardas, setGuardas] = useState<Guarda[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [tipoRelatorio, setTipoRelatorio] = useState<"mensal" | "trimestral" | "anual">("mensal");
const [mes, setMes] = useState(String(new Date().getMonth() + 1).padStart(2, "0"));
const [ano, setAno] = useState(String(new Date().getFullYear()));

  async function carregar() {
    setCarregando(true);

    const { data: ocorrenciasData } = await supabase
      .from("ocorrencias")
      .select("id, data, status, tipo, bairro, local");

    const { data: patrulhamentosData } = await supabase
      .from("patrulhamentos")
      .select("id, data");

    const { data: guardasData } = await supabase
      .from("guardas")
      .select("id, status");

    setOcorrencias(ocorrenciasData || []);
    setPatrulhamentos(patrulhamentosData || []);
    setGuardas(guardasData || []);

    setCarregando(false);
  }

  useEffect(() => {
    carregar();
  }, []);

  const hoje = new Date().toISOString().split("T")[0];

  const abertas = ocorrencias.filter((o) => o.status === "Aberta").length;
  const finalizadas = ocorrencias.filter((o) => o.status === "Finalizada").length;
  const guardasServico = guardas.filter((g) => g.status === "Em serviço").length;

function dentroDoPeriodo(data: string) {
  if (!data) return false;

  const dataItem = new Date(`${data}T00:00:00`);
  const anoItem = dataItem.getFullYear();
  const mesItem = dataItem.getMonth() + 1;

  const anoSelecionado = Number(ano);
  const mesSelecionado = Number(mes);

  if (tipoRelatorio === "mensal") {
    return anoItem === anoSelecionado && mesItem === mesSelecionado;
  }

  if (tipoRelatorio === "trimestral") {
    const inicioTrimestre = Math.floor((mesSelecionado - 1) / 3) * 3 + 1;
    const fimTrimestre = inicioTrimestre + 2;

    return (
      anoItem === anoSelecionado &&
      mesItem >= inicioTrimestre &&
      mesItem <= fimTrimestre
    );
  }

  if (tipoRelatorio === "anual") {
    return anoItem === anoSelecionado;
  }

  return false;
}

const ocorrenciasPeriodo = ocorrencias.filter((o) => dentroDoPeriodo(o.data));
const patrulhamentosPeriodo = patrulhamentos.filter((p) => dentroDoPeriodo(p.data));

const abertasPeriodo = ocorrenciasPeriodo.filter((o) => o.status === "Aberta").length;
const finalizadasPeriodo = ocorrenciasPeriodo.filter((o) => o.status === "Finalizada").length;

const tiposOcorrencia = ocorrenciasPeriodo.reduce(
  (acc: Record<string, number>, item) => {
    acc[item.tipo] = (acc[item.tipo] || 0) + 1;
    return acc;
  },
  {}
);

const bairrosMaisAtendidos = ocorrenciasPeriodo.reduce(
  (acc: Record<string, number>, item) => {
    const bairro = item.bairro || item.local || "Não informado";

    acc[bairro] = (acc[bairro] || 0) + 1;

    return acc;
  },
  {}
);


const mesAnterior = Number(mes) === 1 ? 12 : Number(mes) - 1;
const anoMesAnterior =
  Number(mes) === 1 ? Number(ano) - 1 : Number(ano);

const ocorrenciasPeriodoAnterior = ocorrencias.filter((o) => {
  if (!o.data) return false;

  const dataItem = new Date(`${o.data}T00:00:00`);

  return (
    dataItem.getMonth() + 1 === mesAnterior &&
    dataItem.getFullYear() === anoMesAnterior
  );
});

const variacaoOcorrencias =
  ocorrenciasPeriodoAnterior.length > 0
    ? Math.round(
        ((ocorrenciasPeriodo.length -
          ocorrenciasPeriodoAnterior.length) /
          ocorrenciasPeriodoAnterior.length) *
          100
      )
    : 0;

  return (
  <ProtecaoPerfil
  perfisPermitidos={[
    "DESENVOLVEDOR",
    "ADMIN",
    "COMANDANTE",
    "DIRETOR",
  ]}
>
    <div className="p-3 md:p-6 pb-24">
      <header className="mb-6 border-b border-slate-800 pb-5">
        <h1 className="text-3xl md:text-5xl font-bold">
          📊 Estatísticas
        </h1>

        <p className="text-slate-400 mt-2">
          Indicadores operacionais da Guarda Civil Municipal.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-5">
  <select
    className="input"
    value={tipoRelatorio}
    onChange={(e) => setTipoRelatorio(e.target.value as any)}
  >
    <option value="mensal">Relatório Mensal</option>
    <option value="trimestral">Relatório Trimestral</option>
    <option value="anual">Relatório Anual</option>
  </select>

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

  <input
    className="input"
    value={ano}
    onChange={(e) => setAno(e.target.value)}
    placeholder="Ano"
  />
</div>

<div className="mt-4 flex gap-3">
  <button
    type="button"
    onClick={() => window.print()}
    className="bg-blue-600 hover:bg-blue-700 px-5 py-3 rounded-xl font-bold"
  >
    📄 Gerar PDF do Relatório
  </button>
</div>

      </header>

      {carregando ? (
        <p className="text-slate-400">Carregando estatísticas...</p>
      ) : (
        <>
          <section className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            <Card titulo="Ocorrências no Período" valor={ocorrenciasPeriodo.length} icone="🚨" />
<Card titulo="Rondas no Período" valor={patrulhamentosPeriodo.length} icone="🚔" />
<Card titulo="Abertas no Período" valor={abertasPeriodo} icone="⚠️" />
<Card titulo="Finalizadas no Período" valor={finalizadasPeriodo} icone="✅" />
          </section>

          <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="card">
              <h2 className="text-xl font-bold mb-4">
                Resumo Geral
              </h2>

              <Linha nome="Total de ocorrências" valor={ocorrencias.length} />
              <Linha nome="Total de patrulhamentos" valor={patrulhamentos.length} />
              <Linha nome="Guardas cadastrados" valor={guardas.length} />
              <Linha nome="Guardas em serviço" valor={guardasServico} />
            </div>

            <div className="card">
              <h2 className="text-xl font-bold mb-4">
                Situação Operacional
              </h2>

              <div className="space-y-3">
                <Barra titulo="Ocorrências abertas" valor={abertas} total={ocorrencias.length} />
                <Barra titulo="Ocorrências finalizadas" valor={finalizadas} total={ocorrencias.length} />
                <Barra titulo="Guardas em serviço" valor={guardasServico} total={guardas.length} />
              </div>
            </div>
          </section>
          <section className="card mt-4">
  <h2 className="text-xl font-bold mb-4">
    🚨 Ocorrências por Tipo
  </h2>

  <div className="space-y-3">
    {Object.entries(tiposOcorrencia)
      .sort((a, b) => Number(b[1]) - Number(a[1]))
      .map(([tipo, quantidade]) => (
        <div
          key={tipo}
          className="flex justify-between border-b border-slate-800 pb-2"
        >
          <span>{tipo}</span>

          <span className="font-bold text-blue-400">
            {String(quantidade)}
          </span>
        </div>
      ))}
  </div>
</section>
<section className="card mt-4">
  <h2 className="text-xl font-bold mb-4">
    📍 Bairros Mais Atendidos
  </h2>

  <div className="space-y-3">
    {Object.entries(bairrosMaisAtendidos)
      .sort((a, b) => Number(b[1]) - Number(a[1]))
      .slice(0, 10)
      .map(([bairro, quantidade]) => (
        <div
          key={bairro}
          className="flex justify-between border-b border-slate-800 pb-2"
        >
          <span>{bairro}</span>

          <span className="font-bold text-green-400">
            {String(quantidade)}
          </span>
        </div>
      ))}
  </div>
</section>

<section className="card mt-4">
  <h2 className="text-xl font-bold mb-4">
    📈 Comparativo com Período Anterior
  </h2>

  <div className="space-y-3">

    <Linha
      nome="Ocorrências no período"
      valor={ocorrenciasPeriodo.length}
    />

    <Linha
      nome="Período anterior"
      valor={ocorrenciasPeriodoAnterior.length}
    />

    <div className="flex justify-between border-b border-slate-800 py-3">
      <span className="text-slate-400">Variação</span>

      <span
        className={`font-bold ${
          variacaoOcorrencias >= 0
            ? "text-red-400"
            : "text-green-400"
        }`}
      >
        {variacaoOcorrencias > 0 ? "+" : ""}
        {variacaoOcorrencias}%
      </span>
    </div>

  </div>
</section>

        </>
      )}
        </div>
  </ProtecaoPerfil>
  );
}

function Card({
  titulo,
  valor,
  icone,
}: {
  titulo: string;
  valor: number;
  icone: string;
}) {
  return (
    <div className="rounded-3xl border border-slate-700 bg-slate-950/40 p-4 min-h-28 flex flex-col justify-between">
      <div className="text-2xl">{icone}</div>
      <div>
        <p className="text-slate-400 text-sm">{titulo}</p>
        <h2 className="text-4xl font-bold">{valor}</h2>
      </div>
    </div>
  );
}

function Linha({ nome, valor }: { nome: string; valor: number }) {
  return (
    <div className="flex justify-between border-b border-slate-800 py-3">
      <span className="text-slate-400">{nome}</span>
      <span className="font-bold">{valor}</span>
    </div>
  );
}

function Barra({
  titulo,
  valor,
  total,
}: {
  titulo: string;
  valor: number;
  total: number;
}) {
  const porcentagem = total > 0 ? Math.round((valor / total) * 100) : 0;

  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span className="text-slate-400">{titulo}</span>
        <span>{porcentagem}%</span>
      </div>

      <div className="h-3 bg-slate-800 rounded-full overflow-hidden">
        <div
          className="h-full bg-blue-600 rounded-full"
          style={{ width: `${porcentagem}%` }}
        />
      </div>
    </div>
  );
}