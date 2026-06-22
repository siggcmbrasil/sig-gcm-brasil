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
  veiculos_envolvidos?: string | any[];
  envolvidos?: string | any[];
  armas_objetos?: string | any[];
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
useEffect(() => {
  const style = document.createElement("style");

  style.innerHTML = `
    @media print {

      body * {
        visibility: hidden;
      }

      .area-relatorio,
      .area-relatorio * {
        visibility: visible;
      }

      .area-relatorio {
        position: absolute;
        left: 0;
        top: 0;
        width: 100%;
        padding: 20px;
      }

      button,
      select,
      input {
        display: none !important;
      }
    }
  `;

  document.head.appendChild(style);

  return () => {
    document.head.removeChild(style);
  };
}, []);

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
      .select("id, data, status, tipo, bairro, local, veiculos_envolvidos, envolvidos, armas_objetos");

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

const veiculosMaisCitados = ocorrenciasPeriodo.reduce(
  (acc: Record<string, number>, item) => {
    try {
      const veiculos =
        typeof item.veiculos_envolvidos === "string"
          ? JSON.parse(item.veiculos_envolvidos || "[]")
          : item.veiculos_envolvidos || [];

      veiculos.forEach((veiculo: any) => {
        const placa = veiculo.placa || "Sem placa";

        acc[placa] = (acc[placa] || 0) + 1;
      });
    } catch {
      // ignora registros antigos
    }

    return acc;
  },
  {}
);

const envolvidosRecorrentes = ocorrenciasPeriodo.reduce(
  (acc: Record<string, number>, item) => {
    try {
      const envolvidos =
        typeof item.envolvidos === "string"
          ? JSON.parse(item.envolvidos || "[]")
          : item.envolvidos || [];

      envolvidos.forEach((pessoa: any) => {
        const nome =
          pessoa.nome?.trim() || "Não identificado";

        acc[nome] = (acc[nome] || 0) + 1;
      });
    } catch {
      // ignora registros inválidos
    }

    return acc;
  },
  {}
);

const objetosRegistrados = ocorrenciasPeriodo.reduce(
  (acc: Record<string, number>, item) => {
    try {
      const objetos =
        typeof item.armas_objetos === "string"
          ? JSON.parse(item.armas_objetos || "[]")
          : item.armas_objetos || [];

      objetos.forEach((objeto: any) => {
        const categoria =
          objeto.categoria?.trim() || "Não informado";

        acc[categoria] = (acc[categoria] || 0) + 1;
      });
    } catch {
      // ignora registros inválidos
    }

    return acc;
  },
  {}
);

const ocorrenciasPorMes = ocorrencias
  .filter((o) => {
    if (!o.data) return false;

    const dataItem = new Date(`${o.data}T00:00:00`);
    return dataItem.getFullYear() === Number(ano);
  })
  .reduce((acc: Record<string, number>, item) => {
    const dataItem = new Date(`${item.data}T00:00:00`);
    const mesItem = String(dataItem.getMonth() + 1).padStart(2, "0");

    acc[mesItem] = (acc[mesItem] || 0) + 1;

    return acc;
  }, {});

  const bairroDestaque =
  Object.entries(bairrosMaisAtendidos)
    .sort((a, b) => Number(b[1]) - Number(a[1]))[0];

const tipoDestaque =
  Object.entries(tiposOcorrencia)
    .sort((a, b) => Number(b[1]) - Number(a[1]))[0];

const veiculoDestaque =
  Object.entries(veiculosMaisCitados)
    .sort((a, b) => Number(b[1]) - Number(a[1]))[0];

    

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

    const resumoInteligente = `
No período selecionado foram registradas ${ocorrenciasPeriodo.length} ocorrência(s).

O bairro com maior demanda operacional foi ${
  bairroDestaque?.[0] || "não identificado"
}, totalizando ${bairroDestaque?.[1] || 0} registro(s).

O tipo de ocorrência mais frequente foi ${
  tipoDestaque?.[0] || "não identificado"
}, com ${tipoDestaque?.[1] || 0} registro(s).

O veículo mais citado foi ${
  veiculoDestaque?.[0] || "não identificado"
}, aparecendo em ${veiculoDestaque?.[1] || 0} ocorrência(s).

A variação em relação ao período anterior foi de ${
  variacaoOcorrencias > 0 ? "+" : ""
}${variacaoOcorrencias}%.
`;

function gerarPDFExecutivo() {
  document.body.classList.add("modo-relatorio");

  setTimeout(() => {
    window.print();

    setTimeout(() => {
      document.body.classList.remove("modo-relatorio");
    }, 1000);
  }, 300);
}

  return (
  <ProtecaoPerfil
  perfisPermitidos={[
    "DESENVOLVEDOR",
    "ADMIN",
    "COMANDANTE",
    "DIRETOR",
  ]}
>
    <div className="p-3 md:p-6 pb-24 area-relatorio">
      <header className="mb-6 border-b border-slate-800 pb-5">
        <div className="mb-8 text-center border-b border-slate-700 pb-6">
 <h1 className="text-4xl font-black">
  SIG-GCM BRASIL
</h1>

<h2 className="text-2xl font-bold mt-2">
  RELATÓRIO EXECUTIVO OPERACIONAL
</h2>

<p className="text-slate-400 mt-2">
  Período: {mes}/{ano}
</p>
</div>
        
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

  <button
  type="button"
  onClick={gerarPDFExecutivo}
  className="bg-green-600 hover:bg-green-700 px-5 py-3 rounded-xl font-bold"
>
  📊 Relatório Executivo
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

          <section className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
  <div className="card rounded-2xl shadow-lg p-4 border-yellow-700/60">
    <p className="text-sm text-yellow-400 font-bold">
      🥇 Bairro mais atendido
    </p>

    <h2 className="text-2xl font-black mt-2">
      {bairroDestaque?.[0] || "-"}
    </h2>

    <p className="text-slate-400 mt-1">
      {bairroDestaque?.[1] || 0} ocorrência(s)
    </p>
  </div>

  <div className="card rounded-2xl shadow-lg p-4 border-slate-500/60">
    <p className="text-sm text-slate-300 font-bold">
      🥈 Tipo mais frequente
    </p>

    <h2 className="text-2xl font-black mt-2">
      {tipoDestaque?.[0] || "-"}
    </h2>

    <p className="text-slate-400 mt-1">
      {tipoDestaque?.[1] || 0} registro(s)
    </p>
  </div>

  <div className="card rounded-2xl shadow-lg p-4 border-orange-700/60">
    <p className="text-sm text-orange-400 font-bold">
      🥉 Veículo mais citado
    </p>

    <h2 className="text-2xl font-black mt-2">
      {veiculoDestaque?.[0] || "-"}
    </h2>

    <p className="text-slate-400 mt-1">
      {veiculoDestaque?.[1] || 0} citação(ões)
    </p>
  </div>
</section>

<section className="card mt-4">
  <h2 className="text-xl font-bold mb-4">
    🤖 Resumo Inteligente
  </h2>

  <div className="rounded-2xl border border-cyan-700/40 bg-cyan-950/20 p-5">
    <p className="leading-7 text-slate-200 whitespace-pre-line">
      {resumoInteligente}
    </p>
  </div>
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
    🚗 Veículos Mais Citados
  </h2>

  <div className="space-y-3">
    {Object.entries(veiculosMaisCitados)
      .sort((a, b) => Number(b[1]) - Number(a[1]))
      .slice(0, 10)
      .map(([placa, quantidade]) => (
        <div
          key={placa}
          className="flex justify-between border-b border-slate-800 pb-2"
        >
          <span>{placa}</span>

          <span className="font-bold text-blue-400">
            {String(quantidade)}
          </span>
        </div>
      ))}
  </div>
</section>

<section className="card mt-4">
  <h2 className="text-xl font-bold mb-4">
    👤 Envolvidos Recorrentes
  </h2>

  <div className="space-y-3">
    {Object.entries(envolvidosRecorrentes)
      .sort((a, b) => Number(b[1]) - Number(a[1]))
      .slice(0, 10)
      .map(([nome, quantidade]) => (
        <div
          key={nome}
          className="flex justify-between border-b border-slate-800 pb-2"
        >
          <span>{nome}</span>

          <span className="font-bold text-purple-400">
            {String(quantidade)}
          </span>
        </div>
      ))}
  </div>
</section>

<section className="card mt-4">
  <h2 className="text-xl font-bold mb-4">
    📦 Objetos Registrados
  </h2>

  <div className="space-y-3">
    {Object.entries(objetosRegistrados)
      .sort((a, b) => Number(b[1]) - Number(a[1]))
      .slice(0, 10)
      .map(([categoria, quantidade]) => (
        <div
          key={categoria}
          className="flex justify-between border-b border-slate-800 pb-2"
        >
          <span>{categoria}</span>

          <span className="font-bold text-yellow-400">
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

<section className="card mt-4">
  <h2 className="text-xl font-bold mb-4">
    📈 Ocorrências por Mês
  </h2>

  <div className="space-y-3">
    {[
      ["01", "Janeiro"],
      ["02", "Fevereiro"],
      ["03", "Março"],
      ["04", "Abril"],
      ["05", "Maio"],
      ["06", "Junho"],
      ["07", "Julho"],
      ["08", "Agosto"],
      ["09", "Setembro"],
      ["10", "Outubro"],
      ["11", "Novembro"],
      ["12", "Dezembro"],
    ].map(([numeroMes, nomeMes]) => (
      <div
        key={numeroMes}
        className="flex justify-between border-b border-slate-800 pb-2"
      >
        <span>{nomeMes}</span>

        <span className="font-bold text-cyan-400">
          {ocorrenciasPorMes[numeroMes] || 0}
        </span>
      </div>
    ))}
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