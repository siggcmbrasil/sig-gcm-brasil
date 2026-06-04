"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

export default function RelatorioGeralPlantao() {
  const [inicio, setInicio] = useState("");
  const [fim, setFim] = useState("");
  const [incluirUltrapassadas, setIncluirUltrapassadas] = useState(false);
  const [dados, setDados] = useState<any>(null);
  const [carregando, setCarregando] = useState(false);

  async function gerarRelatorio() {
    setCarregando(true);

    const [
      ocorrencias,
      patrulhamentos,
      chamados,
      pessoas,
      veiculos,
    ] = await Promise.all([
      supabase.from("ocorrencias").select("*").order("criado_em", { ascending: true }),
      supabase.from("patrulhamentos").select("*").order("criado_em", { ascending: true }),
      supabase.from("chamados").select("*").order("criado_em", { ascending: true }),
      supabase.from("pessoas_abordadas").select("*").order("criado_em", { ascending: true }),
      supabase.from("veiculos_abordados").select("*").order("criado_em", { ascending: true }),
    ]);

    if (ocorrencias.error) alert("Erro ocorrências: " + ocorrencias.error.message);
    if (patrulhamentos.error) alert("Erro patrulhamentos: " + patrulhamentos.error.message);
    if (chamados.error) alert("Erro chamados: " + chamados.error.message);
    if (pessoas.error) alert("Erro pessoas: " + pessoas.error.message);
    if (veiculos.error) alert("Erro veículos: " + veiculos.error.message);

    function filtrar(lista: any[]) {
      if (!inicio || !fim) return lista;

      const dataInicio = new Date(inicio);
      const dataFim = new Date(fim);

      return lista.filter((item) => {
        const criadoEm = item.criado_em ? new Date(item.criado_em) : null;
        const finalizadoEm = item.finalizado_em ? new Date(item.finalizado_em) : null;

        if (!criadoEm) return false;

        if (incluirUltrapassadas) {
          return criadoEm <= dataFim && (!finalizadoEm || finalizadoEm >= dataInicio);
        }

        return criadoEm >= dataInicio && criadoEm <= dataFim;
      });
    }

    setDados({
      ocorrencias: filtrar(ocorrencias.data || []),
      patrulhamentos: filtrar(patrulhamentos.data || []),
      chamados: filtrar(chamados.data || []),
      pessoas: filtrar(pessoas.data || []),
      veiculos: filtrar(veiculos.data || []),
    });

    setCarregando(false);
  }

  function imprimirRelatorio() {
    window.print();
  }

  return (
    <div className="min-h-screen bg-slate-100 p-4">
      <div className="mx-auto max-w-6xl bg-white rounded-2xl shadow p-6">
        <div className="no-print mb-6">
          <h1 className="text-3xl font-bold text-slate-900">
            Relatório Geral do Plantão
          </h1>

          <p className="text-slate-600 mt-1">
            Ocorrências, patrulhamentos, chamados, pessoas e veículos abordados.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            <div>
              <label className="text-sm font-semibold">Início do plantão</label>
              <input
                type="datetime-local"
                value={inicio}
                onChange={(e) => setInicio(e.target.value)}
                className="w-full mt-1 border rounded-xl p-3"
              />
            </div>

            <div>
              <label className="text-sm font-semibold">Fim do plantão</label>
              <input
                type="datetime-local"
                value={fim}
                onChange={(e) => setFim(e.target.value)}
                className="w-full mt-1 border rounded-xl p-3"
              />
            </div>

            <div className="flex items-end gap-2">
              <button
                onClick={gerarRelatorio}
                className="w-full bg-blue-700 text-white rounded-xl p-3 font-bold"
              >
                {carregando ? "Gerando..." : "Gerar"}
              </button>

              <button
                onClick={imprimirRelatorio}
                className="w-full bg-green-700 text-white rounded-xl p-3 font-bold"
              >
                PDF
              </button>
            </div>

            <div className="md:col-span-3">
              <label className="flex items-center gap-2 text-sm font-semibold">
                <input
                  type="checkbox"
                  checked={incluirUltrapassadas}
                  onChange={(e) => setIncluirUltrapassadas(e.target.checked)}
                />
                Incluir registros iniciados antes ou finalizados após o plantão
              </label>
            </div>
          </div>
        </div>

        {dados && (
          <div className="relatorio">
            <div className="text-center border-b pb-4 mb-6">
              <h2 className="text-2xl font-bold">SIG-GCM BIRITINGA</h2>
              <p className="font-semibold">Relatório Geral do Plantão</p>
              <p className="text-sm">
                Período: {inicio ? new Date(inicio).toLocaleString("pt-BR") : "Todos"} até{" "}
                {fim ? new Date(fim).toLocaleString("pt-BR") : "Todos"}
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-8">
              <Resumo titulo="Ocorrências" valor={dados.ocorrencias.length} />
              <Resumo titulo="Patrulhamentos" valor={dados.patrulhamentos.length} />
              <Resumo titulo="Chamados" valor={dados.chamados.length} />
              <Resumo titulo="Pessoas" valor={dados.pessoas.length} />
              <Resumo titulo="Veículos" valor={dados.veiculos.length} />
            </div>

            <Secao titulo="Ocorrências" itens={dados.ocorrencias} />
            <Secao titulo="Patrulhamentos" itens={dados.patrulhamentos} />
            <Secao titulo="Chamados" itens={dados.chamados} />
            <Secao titulo="Pessoas Abordadas" itens={dados.pessoas} />
            <Secao titulo="Veículos Abordados" itens={dados.veiculos} />

            <div className="mt-10 border-t pt-6 text-sm">
              <p>Responsável pelo plantão: _______________________________</p>
              <p className="mt-4">Assinatura: _______________________________</p>
            </div>
          </div>
        )}
      </div>

      <style jsx global>{`
        @media print {
          .no-print {
            display: none !important;
          }

          body {
            background: white !important;
          }

          .relatorio {
            font-size: 12px;
          }
        }
      `}</style>
    </div>
  );
}

function Resumo({ titulo, valor }: { titulo: string; valor: number }) {
  return (
    <div className="border rounded-xl p-4 text-center bg-slate-100">
      <p className="text-sm text-slate-700">{titulo}</p>
      <p className="text-3xl font-bold text-slate-900">{valor}</p>
    </div>
  );
}

function Secao({ titulo, itens }: { titulo: string; itens: any[] }) {
  return (
    <div className="mb-10">
      <h3 className="text-xl font-bold text-slate-900 border-b pb-2 mb-4">
        {titulo}
      </h3>

      {itens.length === 0 ? (
        <p className="text-sm text-slate-500">
          Nenhum registro encontrado neste período.
        </p>
      ) : (
        <div className="space-y-4">
          {itens.map((item, index) => (
            <div
              key={item.id || index}
              className="rounded-2xl border border-slate-200 bg-slate-50 p-4 shadow-sm"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-3 mb-3">
                <div>
                  <p className="text-xs text-slate-500">Protocolo</p>
                  <p className="font-bold text-blue-700">
                    {item.protocolo || item.numero || "Sem protocolo"}
                  </p>
                </div>

                <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-bold text-blue-700">
                  {item.status || "Sem status"}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                <Campo label="Tipo" valor={item.tipo} />
                <Campo label="Local" valor={item.local} />
                <Campo label="Bairro" valor={item.bairro} />
                <Campo label="Data" valor={item.data || item.criado_em} />
                <Campo label="Equipe" valor={item.equipe_empenhada} />
                <Campo label="Viatura" valor={item.viatura_empenhada} />
              </div>

              <div className="mt-4">
                <p className="text-xs font-bold text-slate-500 uppercase">
                  Descrição
                </p>
                <p className="mt-1 text-sm text-slate-800 whitespace-pre-wrap">
                  {item.descricao || item.relato || "Sem descrição registrada."}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Campo({ label, valor }: { label: string; valor: any }) {
  return (
    <div>
      <p className="text-xs font-bold text-slate-500 uppercase">{label}</p>
      <p className="text-sm font-semibold text-slate-800">
        {valor ? String(valor) : "Não informado"}
      </p>
    </div>
  );
}