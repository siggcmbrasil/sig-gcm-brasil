"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

export default function RelatorioGeralPlantao() {
  const [inicio, setInicio] = useState("");
  const [fim, setFim] = useState("");
  const [incluirUltrapassadas, setIncluirUltrapassadas] = useState(false);
  const [dados, setDados] = useState<any>(null);
  const [carregando, setCarregando] = useState(false);

 const usuarioLogado =
  typeof window !== "undefined"
    ? JSON.parse(localStorage.getItem("usuarioLogado") || "{}")
    : null;

const municipioId = usuarioLogado?.municipio_id;
const perfil = usuarioLogado?.perfil;

  async function gerarRelatorio() {

if (!municipioId) {
  alert("Município não identificado.");
  return;
}

    setCarregando(true);

    const [
      ocorrencias,
      patrulhamentos,
      chamados,
      pessoas,
      veiculos,
    ] = await Promise.all([
      supabase
  .from("ocorrencias")
  .select("*")
  .eq("municipio_id", municipioId).order("criado_em", { ascending: true }),
      supabase
  .from("patrulhamentos")
  .select("*")
  .eq("municipio_id", municipioId).order("criado_em", { ascending: true }),
      supabase
  .from("chamados")
  .select("*")
  .eq("municipio_id", municipioId).order("criado_em", { ascending: true }),
      supabase
  .from("pessoas_abordadas")
  .select("*")
  .eq("municipio_id", municipioId).order("criado_em", { ascending: true }),
      supabase
  .from("veiculos_abordados")
  .select("*")
  .eq("municipio_id", municipioId).order("criado_em", { ascending: true }),
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
         <h1 className="text-3xl font-black text-slate-900">
  Relatório Operacional Integrado
</h1>

<p className="text-slate-600 mt-2">
  Consolidado institucional do plantão.
</p>

<p className="font-semibold">
  Município: {usuarioLogado?.municipio_nome || "Não informado"}
</p>

<p className="text-sm">
  Emitido em: {new Date().toLocaleString("pt-BR")}
</p>

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
              <h2 className="text-2xl font-bold">SIG-GCM Brasil</h2>
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
  function formatarData(valor: any) {
    if (!valor) return "Não informado";

    const data = new Date(valor);

    if (isNaN(data.getTime())) {
      return String(valor);
    }

    return data.toLocaleString("pt-BR");
  }

  function statusClasse(status: string) {
    const s = String(status || "").toLowerCase();

    if (s.includes("finalizada")) {
      return "bg-green-100 text-green-700 border-green-200";
    }

    if (s.includes("andamento")) {
      return "bg-blue-100 text-blue-700 border-blue-200";
    }

    if (s.includes("aberta")) {
      return "bg-yellow-100 text-yellow-700 border-yellow-200";
    }

    return "bg-slate-100 text-slate-700 border-slate-200";
  }

  return (
    <div className="mb-10">
      <div className="flex items-center justify-between border-b border-slate-300 pb-3 mb-5">
        <h3 className="text-xl font-bold text-slate-900">{titulo}</h3>

        <span className="text-sm font-bold text-slate-500">
          {itens.length} registro(s)
        </span>
      </div>

      {itens.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-5 text-sm text-slate-500">
          Nenhum registro encontrado neste período.
        </div>
      ) : (
        <div className="space-y-4">
          {itens.map((item, index) => {
            const protocolo = item.protocolo || item.numero || `Registro ${index + 1}`;
            const status = item.status || "Sem status";

            return (
              <div
                key={item.id || index}
                className="overflow-hidden rounded-2xl border border-slate-300 bg-white shadow-md mb-5"
              >
                <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900 px-5 py-4 text-white">
                  <div>
                    <p className="text-xs text-slate-300">Protocolo</p>
                    <p className="text-lg font-black text-blue-300">
                      {protocolo}
                    </p>
                  </div>

                  <span
                    className={`rounded-full border px-3 py-1 text-xs font-black ${statusClasse(
                      status
                    )}`}
                  >
                    {status}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 x1:grid-cols-4 gap-4 p-5">
                  <Campo label="Tipo" valor={item.tipo} />
                  <Campo label="Data" valor={formatarData(item.criado_em || item.data)} />
                  <Campo label="Local" valor={item.local} />
                  <Campo label="Bairro" valor={item.bairro} />
                  <Campo label="Equipe" valor={item.equipe_empenhada} />
                  <Campo label="Viatura" valor={item.viatura_empenhada} />
                  <Campo label="Finalizado em" valor={formatarData(item.finalizado_em)} />
                  <Campo label="Plantão" valor={item.plantao} />
                </div>

                <div className="border-t bg-slate-50 p-4">
                  <p className="text-xs font-black uppercase tracking-wide text-slate-500">
                    Descrição / Observação
                  </p>

                  <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-800">
                    {item.descricao ||
                      item.relato ||
                      item.observacao ||
                      item.observacoes ||
                      "Sem descrição registrada."}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function Campo({ label, valor }: { label: string; valor: any }) {
  return (
    <div className="rounded-xl border border-slate-300 bg-slate-50 p-4 min-h-20">
      <p className="text-[11px] font-black uppercase tracking-wide text-slate-500">
        {label}
      </p>

      <p className="mt-1 wrap-break-words text-sm font-bold text-slate-900">
        {valor !== null && valor !== undefined && valor !== ""
          ? String(valor)
          : "Não informado"}
      </p>
    </div>
  );
}