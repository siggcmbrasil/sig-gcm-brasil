"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import InstalarApp from "@/components/InstalarApp";

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

export default function Dashboard() {
  const [ocorrencias, setOcorrencias] = useState<Ocorrencia[]>([]);
  const [guardas, setGuardas] = useState<Guarda[]>([]);
  const [viatura, setViatura] = useState<Viatura | null>(null);
  const [avisos, setAvisos] = useState<Aviso[]>([]);
  const [carregando, setCarregando] = useState(true);

  async function carregarDashboard() {
    setCarregando(true);

    const { data: ocorrenciasData } = await supabase
      .from("ocorrencias")
      .select("id, protocolo, tipo, local, bairro, data, hora, status")
      .order("id", { ascending: false });

    const { data: guardasData } = await supabase
      .from("guardas")
      .select("id, status");

    const { data: viaturaData } = await supabase
      .from("viaturas")
      .select("*")
      .order("id", { ascending: true })
      .limit(1)
      .single();

    const { data: avisosData } = await supabase
      .from("avisos")
      .select("*")
      .order("id", { ascending: false });

    setOcorrencias(ocorrenciasData || []);
    setGuardas(guardasData || []);
    setViatura(viaturaData || null);
    setAvisos(avisosData || []);

    setCarregando(false);
  }

  useEffect(() => {
    carregarDashboard();
  }, []);

  const hoje = new Date().toISOString().split("T")[0];

  const ocorrenciasHoje = ocorrencias.filter((o) => o.data === hoje).length;
  const abertas = ocorrencias.filter((o) => o.status === "Aberta").length;
  const andamento = ocorrencias.filter((o) => o.status === "Em andamento").length;
  const finalizadas = ocorrencias.filter((o) => o.status === "Finalizada").length;

  const guardasServico = guardas.filter((g) => g.status === "Em serviço").length;
  const guardasFolga = guardas.filter((g) => g.status === "Folga").length;

  const ultimaOcorrencia = ocorrencias[0];

  return (
    <div className="p-3 md:p-6 pb-24">
      <header className="flex flex-col md:flex-row gap-4 md:gap-0 justify-between md:items-center border-b border-slate-800 pb-5 mb-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold">
  🚔 Central Operacional GCM Biritinga
</h1>

          <p className="text-slate-400 text-sm md:text-base">
            Visão geral da Guarda Civil Municipal de Biritinga.
          </p>
        </div>

        <p className="text-green-400 text-sm mt-2">
  Sistema Online • Operacional 24h
</p>

        <Link
          href="/sistema/ocorrencias/nova"
          className="bg-blue-600 hover:bg-blue-700 px-5 py-4 rounded-xl font-semibold text-center w-full md:w-auto"
        >
          + Nova Ocorrência
        </Link>

        <InstalarApp />

      </header>

      {carregando ? (
        <p className="text-slate-400 text-lg">Carregando painel...</p>
      ) : (
        <>
         <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-6"> 
            <Card
             titulo="Finalizadas"
             valor={String(finalizadas)}
             detalhe="Ocorrências concluídas"
             />

            <Card
            titulo="Total de Guardas"
            valor={String(guardas.length)}
            detalhe="Efetivo cadastrado"
            />

            <Card
                titulo="Avisos"
            valor={String(avisos.length)}
            detalhe="Comunicados ativos"
             />
            
            <Card
              titulo="Ocorrências Hoje"
              valor={String(ocorrenciasHoje)}
              detalhe="Registradas hoje"
            />

            <Card
              titulo="Ocorrências Abertas"
              valor={String(abertas)}
              detalhe="Aguardando andamento"
            />

            <Card
              titulo="Em Andamento"
              valor={String(andamento)}
              detalhe="Atendimento ativo"
            />

            <Card
              titulo="Guardas em Serviço"
              valor={String(guardasServico)}
              detalhe={`Folga: ${guardasFolga}`}
            />

            <Card
              titulo="Viatura"
              valor={viatura ? "1" : "0"}
              detalhe={viatura?.status || "Não cadastrada"}
            />

            <Card
  titulo="Finalizadas"
  valor={String(finalizadas)}
  detalhe="Ocorrências concluídas"
/>

<Card
  titulo="Total Guardas"
  valor={String(guardas.length)}
  detalhe="Efetivo cadastrado"
/>

<Card
  titulo="Avisos"
  valor={String(avisos.length)}
  detalhe="Comunicados ativos"
/>
          </section>

<section className="md:hidden card mb-6">
  <h2 className="text-xl font-bold mb-4">
    Acesso Rápido Mobile
  </h2>

  <div className="grid grid-cols-2 gap-3">
    <Link
      href="/sistema/ocorrencias/expressa"
      className="bg-red-700 rounded-xl p-4 text-center font-bold"
    >
      🚨 Expressa
    </Link>

    <Link
      href="/sistema/ocorrencias/nova"
      className="bg-blue-700 rounded-xl p-4 text-center font-bold"
    >
      📷 Nova
    </Link>

    <Link
      href="/sistema/chamados"
      className="bg-yellow-700 rounded-xl p-4 text-center font-bold"
    >
      📞 Chamados
    </Link>

    <Link
      href="/sistema/patrulhamento"
      className="bg-green-700 rounded-xl p-4 text-center font-bold"
    >
      🚔 Ronda
    </Link>

    <Link
      href="/sistema/mapa"
      className="bg-purple-700 rounded-xl p-4 text-center font-bold col-span-2"
    >
      📍 Mapa Operacional
    </Link>
  </div>
</section>

          <section className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
            <div className="card xl:col-span-2">
              <h2 className="text-xl md:text-2xl font-bold mb-4">
                Ações Rápidas
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
                <Atalho
                  href="/sistema/ocorrencias/nova"
                  titulo="Nova Ocorrência"
                  descricao="Registrar ocorrência com foto"
                />

                <Atalho
                  href="/sistema/chamados"
                  titulo="Novo Chamado"
                  descricao="Abrir chamado operacional"
                />

                <Atalho
                  href="/sistema/patrulhamento"
                  titulo="Patrulhamento"
                  descricao="Registrar ronda da VTR"
                />

                <Atalho
                  href="/sistema/mapa"
                  titulo="Mapa Operacional"
                  descricao="Visualizar área da cidade"
                />
              </div>

              <h2 className="text-xl md:text-2xl font-bold mb-4">
                Resumo Operacional
              </h2>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
  <div className="bg-green-900/30 border border-green-700 rounded-xl p-4">
    <p className="text-green-400 text-sm">Finalizadas</p>
    <h3 className="text-3xl font-bold">{finalizadas}</h3>
  </div>

  <div className="bg-yellow-900/30 border border-yellow-700 rounded-xl p-4">
    <p className="text-yellow-400 text-sm">Abertas</p>
    <h3 className="text-3xl font-bold">{abertas}</h3>
  </div>

  <div className="bg-blue-900/30 border border-blue-700 rounded-xl p-4">
    <p className="text-blue-400 text-sm">Em Serviço</p>
    <h3 className="text-3xl font-bold">{guardasServico}</h3>
  </div>

  <div className="bg-red-900/30 border border-red-700 rounded-xl p-4">
    <p className="text-red-400 text-sm">Folga</p>
    <h3 className="text-3xl font-bold">{guardasFolga}</h3>
  </div>
</div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Resumo
                  titulo="Total de ocorrências"
                  valor={ocorrencias.length}
                />

                <Resumo
                  titulo="Finalizadas"
                  valor={finalizadas}
                />

                <Resumo
                  titulo="Efetivo cadastrado"
                  valor={guardas.length}
                />
              </div>

              <div className="mt-6 h-52 md:h-64 rounded-xl bg-slate-200 text-slate-900 flex items-center justify-center">
                <div className="text-center px-4">
                  <p className="text-2xl font-bold">
                    Biritinga - BA
                  </p>

                  <p>
                    Mapa resumido da operação
                  </p>

                  <Link
                    href="/sistema/mapa"
                    className="inline-block mt-4 bg-blue-700 text-white px-4 py-3 rounded-xl"
                  >
                    Abrir mapa
                  </Link>
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

            <div className="card">
              <h2 className="text-xl md:text-2xl font-bold mb-4">
                Avisos Operacionais
              </h2>

              {avisos.length === 0 ? (
                <p className="text-slate-400">
                  Nenhum aviso cadastrado.
                </p>
              ) : (
                <div className="space-y-4">
                  {avisos.slice(0, 3).map((aviso) => (
                    <div
                      key={aviso.id}
                      className="border-b border-slate-800 pb-3"
                    >
                      <h3 className="font-bold text-lg">
                        {aviso.titulo}
                      </h3>

                      <p className="text-slate-400 text-sm">
                        {aviso.descricao}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="card">
              <h2 className="text-xl md:text-2xl font-bold mb-4">
                Atalhos
              </h2>

              <div className="space-y-3">
                <Link
                  className="menu-item bg-slate-800"
                  href="/sistema/ocorrencias"
                >
                  Ocorrências
                </Link>

                <Link
                  className="menu-item bg-slate-800"
                  href="/sistema/chamados"
                >
                  Chamados
                </Link>

                <Link
                  className="menu-item bg-slate-800"
                  href="/sistema/patrulhamento"
                >
                  Patrulhamento
                </Link>

                <Link
                  className="menu-item bg-slate-800"
                  href="/sistema/mapa"
                >
                  Mapa Operacional
                </Link>
              </div>
            </div>
          </section>
        </>
      )}

      <Link
        href="/sistema/ocorrencias/expressa"
        className="fixed bottom-6 right-6 md:hidden bg-blue-600 w-16 h-16 rounded-full flex items-center justify-center text-4xl shadow-xl z-50"
      >
        +
      </Link>
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
    <div className="card min-h-40 flex flex-col justify-center">
      <p className="text-slate-300 text-lg md:text-base">
        {titulo}
      </p>

      <h2 className="text-6xl md:text-4xl font-bold my-2">
        {valor}
      </h2>

      <p className="text-blue-400 text-base md:text-sm">
        {detalhe}
      </p>
    </div>
  );
}

function Resumo({
  titulo,
  valor,
}: {
  titulo: string;
  valor: number;
}) {
  return (
    <div className="bg-slate-900 rounded-xl p-4 border border-slate-700">
      <p className="text-slate-400 text-base md:text-sm">
        {titulo}
      </p>

      <h3 className="text-4xl md:text-3xl font-bold">
        {valor}
      </h3>
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
    <Link
      href={href}
      className="bg-blue-700 hover:bg-blue-800 rounded-xl p-5 block"
    >
      <h3 className="text-xl font-bold">
        {titulo}
      </h3>

      <p className="text-blue-100 text-sm mt-1">
        {descricao}
      </p>
    </Link>
  );
}

function Linha({
  nome,
  valor,
}: {
  nome: string;
  valor: string;
}) {
  return (
    <div className="flex justify-between gap-4 border-b border-slate-800 pb-2 text-base">
      <span className="text-slate-400">
        {nome}
      </span>

      <span className="text-right">
        {valor}
      </span>
    </div>
  );
}

function Status({
  status,
}: {
  status: string;
}) {
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