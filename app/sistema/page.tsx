"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

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
    <div className="p-6">
      <header className="flex justify-between items-center border-b border-slate-800 pb-5 mb-6">
        <div>
          <h1 className="text-3xl font-bold">Dashboard Operacional</h1>
          <p className="text-slate-400">
            Visão geral da Guarda Civil Municipal de Biritinga.
          </p>
        </div>

        <Link
          href="/sistema/ocorrencias/nova"
          className="bg-blue-600 hover:bg-blue-700 px-5 py-3 rounded-xl font-semibold"
        >
          + Nova Ocorrência
        </Link>
      </header>

      {carregando ? (
        <p className="text-slate-400">Carregando painel...</p>
      ) : (
        <>
          <section className="grid grid-cols-5 gap-4 mb-6">
            <Card titulo="Ocorrências Hoje" valor={String(ocorrenciasHoje)} detalhe="Registradas hoje" />
            <Card titulo="Ocorrências Abertas" valor={String(abertas)} detalhe="Aguardando andamento" />
            <Card titulo="Em Andamento" valor={String(andamento)} detalhe="Atendimento ativo" />
            <Card titulo="Guardas em Serviço" valor={String(guardasServico)} detalhe={`Folga: ${guardasFolga}`} />
            <Card titulo="Viatura" valor={viatura ? "1" : "0"} detalhe={viatura?.status || "Não cadastrada"} />
          </section>

          <section className="grid grid-cols-3 gap-4">
            <div className="card col-span-2">
              <h2 className="text-xl font-bold mb-4">Resumo Operacional</h2>

              <div className="grid grid-cols-3 gap-4">
                <Resumo titulo="Total de ocorrências" valor={ocorrencias.length} />
                <Resumo titulo="Finalizadas" valor={finalizadas} />
                <Resumo titulo="Efetivo cadastrado" valor={guardas.length} />
              </div>

              <div className="mt-6 h-64 rounded-xl bg-slate-200 text-slate-900 flex items-center justify-center">
                <div className="text-center">
                  <p className="text-2xl font-bold">Biritinga - BA</p>
                  <p>Mapa resumido da operação</p>
                </div>
              </div>
            </div>

            <div className="card">
              <h2 className="text-xl font-bold mb-4">Última Ocorrência</h2>

              {ultimaOcorrencia ? (
                <div className="space-y-3">
                  <p className="text-blue-400 font-semibold">
                    {ultimaOcorrencia.protocolo}
                  </p>

                  <h3 className="text-lg font-bold">
                    {ultimaOcorrencia.tipo}
                  </h3>

                  <p className="text-slate-400">
                    {ultimaOcorrencia.local}
                  </p>

                  <p className="text-slate-500 text-sm">
                    {ultimaOcorrencia.data} às {ultimaOcorrencia.hora}
                  </p>

                  <Status status={ultimaOcorrencia.status} />

                  <Link
                    href={`/sistema/ocorrencias/${ultimaOcorrencia.id}`}
                    className="block text-center bg-blue-700 hover:bg-blue-800 px-4 py-2 rounded-lg mt-4"
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
              <h2 className="text-xl font-bold mb-4">Status da Viatura</h2>

              <div className="flex justify-center mb-4">
                <Image
                  src="/viatura-gcm.png"
                  alt="Viatura GCM Biritinga"
                  width={360}
                  height={220}
                  className="rounded-xl object-contain"
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
              <h2 className="text-xl font-bold mb-4">Avisos Operacionais</h2>

              {avisos.length === 0 ? (
                <p className="text-slate-400">Nenhum aviso cadastrado.</p>
              ) : (
                <div className="space-y-4">
                  {avisos.slice(0, 3).map((aviso) => (
                    <div key={aviso.id} className="border-b border-slate-800 pb-3">
                      <h3 className="font-bold">{aviso.titulo}</h3>
                      <p className="text-slate-400 text-sm">
                        {aviso.descricao}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="card">
              <h2 className="text-xl font-bold mb-4">Atalhos</h2>

              <div className="space-y-3">
                <Link className="menu-item bg-slate-800" href="/sistema/ocorrencias">
                  Ocorrências
                </Link>

                <Link className="menu-item bg-slate-800" href="/sistema/guardas">
                  Guardas
                </Link>

                <Link className="menu-item bg-slate-800" href="/sistema/viatura">
                  Viatura
                </Link>

                <Link className="menu-item bg-slate-800" href="/sistema/mapa">
                  Mapa Operacional
                </Link>
              </div>
            </div>
          </section>
        </>
      )}
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
    <div className="card">
      <p className="text-slate-300">{titulo}</p>
      <h2 className="text-4xl font-bold my-2">{valor}</h2>
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

function Linha({ nome, valor }: { nome: string; valor: string }) {
  return (
    <div className="flex justify-between border-b border-slate-800 pb-2">
      <span className="text-slate-400">{nome}</span>
      <span>{valor}</span>
    </div>
  );
}

function Status({ status }: { status: string }) {
  let cor = "bg-blue-700 text-blue-100";

  if (status === "Aberta") cor = "bg-yellow-600 text-yellow-100";
  if (status === "Em andamento") cor = "bg-blue-700 text-blue-100";
  if (status === "Finalizada") cor = "bg-green-700 text-green-100";

  return (
    <span className={`${cor} px-3 py-1 rounded text-xs`}>
      {status}
    </span>
  );
}