"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import InstalarApp from "@/components/InstalarApp";

type Municipio = {
  id: number;
  nome: string;
  estado: string;
};

type Ocorrencia = {
  id: number;
  protocolo: string;
  tipo: string;
  local: string;
  bairro: string | null;
  data: string;
  hora: string;
  status: string;
};

type Guarda = {
  id: number;
  nome: string;
  status: string;
};

type Viatura = {
  id: number;
  prefixo: string;
  modelo: string;
  placa: string;
  status: string;
  combustivel: string | null;
  quilometragem: string | null;
};

type Aviso = {
  id: number;
  titulo: string;
  descricao: string;
};

type Permuta = {
  id: number;
  status: string;
};

type Guarnicao = {
  id: number;
  nome: string;
  comandante_id: number | null;
  viatura_id: number | null;
  ativa: boolean;
};

type MembroGuarnicao = {
  id: number;
  guarnicao_id: number;
  guarda_id: number;
};

type EscalaHoje = {
  id: number;
  data_servico: string;
  guarda_nome: string;
  matricula: string;
  tipo: string;
  turno: string;
  equipe: string;
};



export default function Dashboard() {
  const [ocorrencias, setOcorrencias] = useState<Ocorrencia[]>([]);
  const [guardas, setGuardas] = useState<Guarda[]>([]);
  const [viatura, setViatura] = useState<Viatura | null>(null);
  const [avisos, setAvisos] = useState<Aviso[]>([]);
  const [permutas, setPermutas] = useState<Permuta[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [guarnicoes, setGuarnicoes] = useState<Guarnicao[]>([]);
  const [membrosGuarnicao, setMembrosGuarnicao] = useState<MembroGuarnicao[]>([]);
  const [viaturas, setViaturas] = useState<Viatura[]>([]);
  const [escalaHoje, setEscalaHoje] = useState<EscalaHoje[]>([]);
  const [municipioPadraoId, setMunicipioPadraoId] = useState<number | null>(null);
  const [municipioAtivo, setMunicipioAtivo] = useState<Municipio | null>(null);
  const [modeloEscalaAtivo, setModeloEscalaAtivo] = useState<string>("");
  const usuarioLogado =
    typeof window !== "undefined"
      ? JSON.parse(localStorage.getItem("usuarioLogado") || "{}")
      : {};

  const perfilUsuario = usuarioLogado?.perfil || "CONSULTA";
  const podeOperar = perfilUsuario !== "CONSULTA";

  async function carregarDashboard() {
    setCarregando(true);

    const { data: configData } = await supabase
      .from("configuracoes_sistema")
      .select("municipio_padrao_id")
      .order("id", { ascending: true })
      .limit(1)
      .single();
      

    const municipioId = configData?.municipio_padrao_id || 1;

    setMunicipioPadraoId(municipioId);
    
const { data: municipioData } = await supabase
  .from("municipios")
  .select("id, nome, estado")
  .eq("id", municipioId)
  .single();

setMunicipioAtivo(municipioData || null);

const { data: modeloData } = await supabase
  .from("escala_modelos")
  .select("nome")
  .eq("municipio_id", municipioId)
  .eq("ativo", true)
  .limit(1)
  .single();

setModeloEscalaAtivo(modeloData?.nome || "Não configurado");

    const { data: ocorrenciasData } = await supabase
    .from("ocorrencias")
  .select("id, protocolo, tipo, local, bairro, data, hora, status")
  .eq("municipio_id", municipioId)
  .order("id", { ascending: false });

    const { data: guardasData } = await supabase
  .from("guardas")
  .select("id, nome, status")
  .eq("municipio_id", municipioId);

    const { data: viaturaData } = await supabase
  .from("viaturas")
  .select("*")
  .eq("municipio_id", municipioId)
  .order("id", { ascending: true })
  .limit(1)
  .single();

    const { data: avisosData } = await supabase
      .from("avisos")
      .select("*")
      .order("id", { ascending: false });

    const { data: permutasData } = await supabase
      .from("permutas_plantao")
      .select("id, status");

    const { data: guarnicoesData } = await supabase
  .from("guarnicoes")
  .select("*")
  .eq("municipio_id", municipioId)
  .eq("ativa", true)
  .order("id");

    const { data: membrosGuarnicaoData } = await supabase
      .from("guarnicao_membros")
      .select("id, guarnicao_id, guarda_id");

    const { data: viaturasData } = await supabase
  .from("viaturas")
  .select("*")
  .eq("municipio_id", municipioId);

    const hoje = new Date().toISOString().split("T")[0];

    const hojeData = new Date().toISOString().split("T")[0];

    const { data: escalaHojeData } = await supabase
  .from("escalas_servico")
  .select("*")
  .eq("data_servico", hojeData);

    setOcorrencias(ocorrenciasData || []);
    setGuardas(guardasData || []);
    setViatura(viaturaData || null);
    setAvisos(avisosData || []);
    setEscalaHoje(escalaHojeData || []);
    setViaturas(viaturasData || []);
    setPermutas(permutasData || []);
    setCarregando(false);
    setGuarnicoes(guarnicoesData || []);
    setMembrosGuarnicao(membrosGuarnicaoData || []);
  }

  useEffect(() => {
    carregarDashboard();
  }, []);

  const hoje = new Date().toISOString().split("T")[0];

  const ocorrenciasHoje = ocorrencias.filter((o) => o.data === hoje).length;
  const abertas = ocorrencias.filter((o) => o.status === "Aberta").length;
  const finalizadas = ocorrencias.filter((o) => o.status === "Finalizada").length;

  const guardasServico = guardas.filter((g) => g.status === "Em serviço").length;
  const guardasFolga = guardas.filter((g) => g.status === "Folga").length;

  const ultimaOcorrencia = ocorrencias[0];
  const permutasPendentes = permutas.filter(
  (p) => p.status === "PENDENTE" || p.status === "ACEITA").length;
  const guarnicoesAtivas = guarnicoes.length;
  const totalMembrosGuarnicoes = membrosGuarnicao.length;
  const guarnicoesComViatura = guarnicoes.filter((g) => g.viatura_id).length;

function calcularGuarnicaoPlantao() {
  const guarnicoesOrdem = [
    "Guarnição Alpha",
    "Guarnição Bravo",
    "Guarnição Charlie",
    "Guarnição Delta",
    "Guarnição Echo",
  ];

  
  const dataBase = new Date("2026-06-05T07:00:00");
  const agora = new Date();

  const diferencaMs = agora.getTime() - dataBase.getTime();
  const diasPassados = Math.floor(diferencaMs / (1000 * 60 * 60 * 24));

  const indice = ((diasPassados % guarnicoesOrdem.length) + guarnicoesOrdem.length) % guarnicoesOrdem.length;

  return guarnicoesOrdem[indice];
}

const guarnicaoPlantaoHoje = calcularGuarnicaoPlantao();

const guarnicaoAtual = guarnicoes.find(
  (g) => g.nome === guarnicaoPlantaoHoje
);

const membrosGuarnicaoAtual = guarnicaoAtual
  ? membrosGuarnicao.filter((m) => m.guarnicao_id === guarnicaoAtual.id)
  : [];

  return (
    <div className="p-3 md:p-6 pb-24">
      <header className="mb-6">
  <div className="bg-linear-to-r from-blue-950 via-slate-900 to-blue-950 rounded-2xl p-6 border border-blue-800 shadow-xl">

    <div className="flex flex-col lg:flex-row justify-between gap-4">

      <div>
        <h1 className="text-4xl md:text-5xl font-bold">
          🚔 SIG-GCM Biritinga
        </h1>

        <p className="text-slate-300 mt-2 text-lg">
          Central Operacional Integrada
        </p>
        
<div className="mt-4 space-y-1">
  <p className="text-blue-400 font-semibold">
    🏛️ Município:{" "}
    {municipioAtivo
      ? `${municipioAtivo.nome} - ${municipioAtivo.estado}`
      : "Carregando..."}
  </p>

  <p className="text-green-400">
    📅 Escala: {modeloEscalaAtivo}
  </p>

  <p className="text-yellow-400">
    👮 Plantão: {guarnicaoPlantaoHoje}
  </p>
</div>

        <p className="text-green-400 text-sm mt-3">
          ● Sistema Online • Operacional 24h
        </p>
      </div>

      <div className="bg-slate-950/40 rounded-xl p-4 min-w-55">
        <p className="text-slate-400 text-sm">
          Perfil Logado
        </p>

        <p className="text-2xl font-bold text-blue-400">
          {perfilUsuario}
        </p>

        <p className="text-slate-500 text-xs mt-2">
          Guarda Civil Municipal de Biritinga
        </p>
      </div>

    </div>

    <div className="mt-5 flex flex-col md:flex-row gap-3">
      {podeOperar && (
        <Link
          href="/sistema/ocorrencias/nova"
          className="bg-blue-600 hover:bg-blue-700 px-5 py-4 rounded-xl font-semibold text-center"
        >
          + Nova Ocorrência
        </Link>
      )}

      <InstalarApp />
    </div>

  </div>
</header>

      {carregando ? (
        <p className="text-slate-400 text-lg">Carregando painel...</p>
      ) : (
        <>
          <section className="mb-6">
            <div className="card border-l-4 border-yellow-500">
              <h2 className="text-2xl font-bold mb-4 text-yellow-400">
                🚨 Avisos Operacionais
              </h2>

              {avisos.length === 0 ? (
                <p className="text-slate-400">
                  Nenhum aviso operacional cadastrado.
                </p>
              ) : (
                <div className="space-y-3">
                  {avisos.slice(0, 5).map((aviso) => (
                    <div
                      key={aviso.id}
                      className="rounded-2xl border border-yellow-700 bg-yellow-950/20 p-4"
                    >
                      <h3 className="font-bold text-yellow-400 text-lg">
                        {aviso.titulo}
                      </h3>

                      <p className="text-slate-300 mt-1">
                        {aviso.descricao}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>

          <section className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-7 gap-3 mb-6">
            <Card titulo="Hoje" valor={String(ocorrenciasHoje)} detalhe="Ocorrências" />
            <Card titulo="Abertas" valor={String(abertas)} detalhe="Pendentes" />
            <Card titulo="Serviço" valor={String(guardasServico)} detalhe="Guardas" />
            <Card titulo="Avisos" valor={String(avisos.length)} detalhe="Ativos" />
            <Card titulo="Guarnições" valor={String(guarnicoesAtivas)} detalhe="Ativas" />
            <Card titulo="Efetivo" valor={String(totalMembrosGuarnicoes)} detalhe="Nas guarnições" />
            <Card titulo="Permutas" valor={String(permutasPendentes)} detalhe="Pendentes" />
          </section>

          {podeOperar && (
            <section className="md:hidden card mb-6">
              <h2 className="text-xl font-bold mb-4">Acesso Rápido Mobile</h2>

              <div className="grid grid-cols-2 gap-3">
                <Link href="/sistema/ocorrencias/expressa" className="bg-red-700 rounded-xl p-4 text-center font-bold">
                  🚨 Expressa
                </Link>

                <Link href="/sistema/ocorrencias/nova" className="bg-blue-700 rounded-xl p-4 text-center font-bold">
                  📷 Nova
                </Link>

                <Link href="/sistema/chamados" className="bg-yellow-700 rounded-xl p-4 text-center font-bold">
                  📞 Chamados
                </Link>

                <Link href="/sistema/patrulhamento" className="bg-green-700 rounded-xl p-4 text-center font-bold">
                  🚔 Ronda
                </Link>

                <Link href="/sistema/mapa" className="bg-purple-700 rounded-xl p-4 text-center font-bold col-span-2">
                  📍 Mapa Operacional
                </Link>
              </div>
            </section>
          )}

          <section className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
<div className="card">
  <h2 className="text-xl md:text-2xl font-bold mb-4">
    👮 Guarnições Operacionais
  </h2>

  <div className="space-y-3">
    {guarnicoes.length === 0 ? (
      <p className="text-slate-400">
        Nenhuma guarnição ativa.
      </p>
    ) : (
      guarnicoes.map((g) => {
        const total = membrosGuarnicao.filter(
          (m) => m.guarnicao_id === g.id
        ).length;

        const comandante = guardas.find(
          (guarda) => guarda.id === g.comandante_id
        );

        const viaturaGuarnicao = viaturas.find(
          (v) => v.id === g.viatura_id
);

        return (
          <div
            key={g.id}
            className="bg-slate-900 border border-slate-700 rounded-xl p-4"
          >
            <p className="font-bold text-lg text-blue-400">
              👮 {g.nome}
            </p>

            <p className="text-sm text-slate-300 mt-2">
              👥 {total} membro(s)
            </p>

            <p className="text-sm text-slate-300">
              👤 {comandante?.nome || "Sem comandante"}
            </p>

            <p className="text-sm text-slate-300">
              🚓 {viaturaGuarnicao?.prefixo || "Sem viatura"}
            </p>
          </div>
        );
      })
    )}
  </div>
</div>

<div className="card">
  <h2 className="text-xl md:text-2xl font-bold mb-4">
    📅 Escala de Hoje
  </h2>

  {escalaHoje.length === 0 ? (
    <p className="text-slate-400">
      Nenhum plantão cadastrado para hoje.
    </p>
  ) : (
    <div className="space-y-3">
      {escalaHoje.map((escala) => (
        <div
          key={escala.id}
          className="bg-slate-900 border border-slate-700 rounded-xl p-4"
        >
          <p className="font-bold text-blue-400">
            {escala.equipe}
          </p>

          <p className="text-sm text-slate-300">
            👮 {escala.guarda_nome} • Matrícula {escala.matricula}
          </p>

          <p className="text-sm text-slate-300">
            🕖 07:00 às 07:00
          </p>

          <p className="text-sm text-green-400 font-semibold">
            ⏱️ {escala.tipo} • {escala.turno}
          </p>
        </div>
      ))}
    </div>
  )}
</div>
<div className="card">
  <h2 className="text-xl md:text-2xl font-bold mb-4">
    🚨 Guarnição de Plantão Hoje
  </h2>

  <div className="bg-slate-900 border border-green-600 rounded-xl p-4">
    <p className="text-2xl font-bold text-green-400">
      {guarnicaoPlantaoHoje}
    </p>

    <p className="mt-3 text-slate-300">
      🕖 Plantão 24 horas
    </p>

    <p className="text-slate-300">
      ⏰ 07:00 às 07:00
    </p>

    <p className="text-blue-400 font-semibold mt-3">
      👥 {membrosGuarnicaoAtual.length} membro(s)
    </p>

    <p className="text-slate-400 text-sm mt-2">
      Escala automática 24/96
    </p>
  </div>
</div>

            {podeOperar && (
              <div className="card xl:col-span-2">
                <h2 className="text-xl md:text-2xl font-bold mb-4">
                  Ações Rápidas
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <Atalho href="/sistema/ocorrencias/nova" titulo="Nova Ocorrência" descricao="Registrar ocorrência com foto" />
                  <Atalho href="/sistema/chamados" titulo="Novo Chamado" descricao="Abrir chamado operacional" />
                  <Atalho href="/sistema/patrulhamento" titulo="Patrulhamento" descricao="Registrar ronda da VTR" />
                  <Atalho href="/sistema/guarnicoes" titulo="Guarnições" descricao="Gerenciar equipes operacionais"/>
                </div>
              </div>
            )}

            <div className="card xl:col-span-2">
              <h2 className="text-xl md:text-2xl font-bold mb-4">
                Resumo Operacional
              </h2>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <Resumo titulo="Finalizadas" valor={finalizadas} />
                <Resumo titulo="Abertas" valor={abertas} />
                <Resumo titulo="Em Serviço" valor={guardasServico} />
                <Resumo titulo="Folga" valor={guardasFolga} />
              </div>

              <div className="mt-6 rounded-xl bg-slate-900 border border-slate-700 p-6">
  <h3 className="text-xl font-bold mb-4">
    📍 Situação Operacional
  </h3>

  <div className="grid grid-cols-2 gap-4">
    <Resumo titulo="Ocorrências Hoje" valor={ocorrenciasHoje} />
    <Resumo titulo="Abertas" valor={abertas} />
    <Resumo titulo="Em Serviço" valor={guardasServico} />
    <Resumo titulo="Avisos" valor={avisos.length} />
  </div>
</div>
            </div>

            <div className="card">
              <h2 className="text-xl md:text-2xl font-bold mb-4">
                Última Ocorrência
              </h2>

              {ultimaOcorrencia ? (
                <div className="space-y-3">
                  <p className="text-blue-400 font-semibold text-lg">
                    {ultimaOcorrencia.protocolo}
                  </p>

                  <h3 className="text-xl font-bold">
                    {ultimaOcorrencia.tipo}
                  </h3>

                  <p className="text-slate-400">
                    {ultimaOcorrencia.local}
                  </p>

                  {ultimaOcorrencia.bairro && (
                    <p className="text-slate-500">
                      Bairro: {ultimaOcorrencia.bairro}
                    </p>
                  )}

                  <p className="text-slate-500 text-sm">
                    {ultimaOcorrencia.data} às {ultimaOcorrencia.hora}
                  </p>

                  <Status status={ultimaOcorrencia.status} />

                  <Link
                    href={`/sistema/ocorrencias/${ultimaOcorrencia.id}`}
                    className="block text-center bg-blue-700 hover:bg-blue-800 px-4 py-3 rounded-lg mt-4"
                  >
                    Ver ocorrência
                  </Link>
                </div>
              ) : (
                <p className="text-slate-400">
                  Nenhuma ocorrência registrada.
                </p>
              )}
            </div>

            <div className="card">
              <h2 className="text-xl md:text-2xl font-bold mb-4">
                Status da Viatura
              </h2>

              <div className="flex justify-center mb-4">
                <Image
                  src="/viatura-gcm.png"
                  alt="Viatura GCM Biritinga"
                  width={360}
                  height={220}
                  className="rounded-xl object-contain w-full h-auto max-w-sm"
                  priority
                />
              </div>

              {viatura ? (
                <div className="space-y-3">
                  <Linha nome="Prefixo" valor={viatura.prefixo} />
                  <Linha nome="Modelo" valor={viatura.modelo} />
                  <Linha nome="Placa" valor={viatura.placa} />
                  <Linha nome="Status" valor={viatura.status} />
                  <Linha nome="Combustível" valor={viatura.combustivel || "-"} />
                  <Linha nome="Km" valor={viatura.quilometragem || "-"} />
                </div>
              ) : (
                <p className="text-slate-400">
                  Nenhuma viatura cadastrada.
                </p>
              )}
            </div>

            {podeOperar && (
              <div className="card">
                <h2 className="text-xl md:text-2xl font-bold mb-4">
                  Atalhos
                </h2>

                <div className="space-y-3">
                  <Link className="menu-item bg-slate-800" href="/sistema/ocorrencias">
  Ocorrências
</Link>

<Link className="menu-item bg-slate-800" href="/sistema/chamados">
  Chamados
</Link>

<Link className="menu-item bg-slate-800" href="/sistema/patrulhamento">
  Patrulhamento
</Link>


<Link className="menu-item bg-blue-700" href="/sistema/guarnicoes">
  👮 Guarnições
</Link>
                </div>
              </div>
            )}
          </section>
        </>
      )}

      {podeOperar && (
        <Link
          href="/sistema/ocorrencias/expressa"
          className="fixed bottom-6 right-6 md:hidden bg-blue-600 w-16 h-16 rounded-full flex items-center justify-center text-4xl shadow-xl z-50"
        >
          +
        </Link>
      )}
      <footer className="mt-10 border-t border-slate-800 pt-4 text-center">
  <p className="text-xs text-slate-500">
    SIG-GCM Biritinga © {new Date().getFullYear()}
  </p>

  <p className="text-xs text-blue-400 font-semibold">
    Desenvolvido por Maick Lustosa Costa
  </p>
</footer>
    </div>
  );
}

function Card({
  titulo,
  valor,
  detalhe,
}: {
  titulo: string;
  valor: string;
  detalhe: string;
}) {
  return (
    <div className="card min-h-28 flex flex-col justify-center">
      <p className="text-slate-300 text-base">{titulo}</p>
      <h2 className="text-4xl font-bold my-1">{valor}</h2>
      <p className="text-blue-400 text-sm">{detalhe}</p>
    </div>
  );
}

function Resumo({ titulo, valor }: { titulo: string; valor: number }) {
  return (
    <div className="bg-slate-900 rounded-xl p-4 border border-slate-700">
      <p className="text-slate-400 text-sm">{titulo}</p>
      <h3 className="text-3xl font-bold">{valor}</h3>
    </div>
  );
}

function Atalho({
  href,
  titulo,
  descricao,
}: {
  href: string;
  titulo: string;
  descricao: string;
}) {
  return (
    <Link href={href} className="bg-blue-700 hover:bg-blue-800 rounded-xl p-5 block">
      <h3 className="text-xl font-bold">{titulo}</h3>
      <p className="text-blue-100 text-sm mt-1">{descricao}</p>
    </Link>
  );
}

function Linha({ nome, valor }: { nome: string; valor: string }) {
  return (
    <div className="flex justify-between gap-4 border-b border-slate-800 pb-2 text-base">
      <span className="text-slate-400">{nome}</span>
      <span className="text-right">{valor}</span>
    </div>
  );
}

function Status({ status }: { status: string }) {
  let cor = "bg-blue-700 text-blue-100";

  if (status === "Aberta") cor = "bg-yellow-600 text-yellow-100";
  if (status === "Em andamento") cor = "bg-blue-700 text-blue-100";
  if (status === "Finalizada") cor = "bg-green-700 text-green-100";

  return (
    <span className={`${cor} px-3 py-2 rounded text-sm inline-block`}>
      {status}
    </span>
  );
}