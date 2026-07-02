"use client";

import { useEffect, useState } from "react";
import {
  Shield,
  FileText,
  Download,
  CalendarDays,
  CheckCircle,
  Siren,
} from "lucide-react";

import { supabase } from "@/lib/supabase";
import SigPageHeader from "@/components/sig/SigPageHeader";
import SigCard from "@/components/sig/SigCard";

export default function RelatorioBlitzesPage() {
  const [operacoes, setOperacoes] = useState<any[]>([]);
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");

  useEffect(() => {
    carregar();
  }, []);

  async function carregar() {
    const usuario = JSON.parse(
      localStorage.getItem("usuarioLogado") || "{}"
    );

    const { data } = await supabase
      .from("blitzes_barreiras")
      .select("*")
      .eq("municipio_id", usuario.municipio_id)
      .order("data", { ascending: false });

    setOperacoes(data || []);
  }

  async function registrarAuditoria(
    acao: string,
    detalhes: string
  ) {
    const usuario = JSON.parse(
      localStorage.getItem("usuarioLogado") || "{}"
    );

    await supabase.from("auditoria_sistema").insert({
      municipio_id: usuario.municipio_id,
      usuario_id: usuario.id,
      modulo: "BLITZES_BARREIRAS",
      acao,
      detalhes,
    });
  }

  const lista = operacoes.filter((o) => {
    if (!dataInicio && !dataFim) return true;

    const data = o.data;

    if (dataInicio && data < dataInicio) return false;
    if (dataFim && data > dataFim) return false;

    return true;
  });

  const total = lista.length;
  const blitzes = lista.filter(
    (o) => o.tipo === "BLITZ"
  ).length;

  const barreiras = lista.filter(
    (o) => o.tipo === "BARREIRA"
  ).length;

  const finalizadas = lista.filter(
    (o) => o.status === "FINALIZADA"
  ).length;

  async function gerarRelatorio() {
    await registrarAuditoria(
      "GERAR_RELATORIO_OPERACOES",
      "Gerou relatório de blitzes e barreiras"
    );

    window.print();
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      <SigPageHeader
        titulo="Relatório de Operações"
        subtitulo="Estatísticas e relatórios de blitzes e barreiras."
        icone={FileText}
      />

      <div className="grid md:grid-cols-4 gap-4">
        <SigCard>
          <p className="text-slate-400">
            Total de Operações
          </p>

          <h2 className="text-4xl font-black mt-2">
            {total}
          </h2>
        </SigCard>

        <SigCard>
          <p className="text-slate-400">
            Blitzes
          </p>

          <h2 className="text-4xl font-black text-yellow-400 mt-2">
            {blitzes}
          </h2>
        </SigCard>

        <SigCard>
          <p className="text-slate-400">
            Barreiras
          </p>

          <h2 className="text-4xl font-black text-cyan-400 mt-2">
            {barreiras}
          </h2>
        </SigCard>

        <SigCard>
          <p className="text-slate-400">
            Finalizadas
          </p>

          <h2 className="text-4xl font-black text-emerald-400 mt-2">
            {finalizadas}
          </h2>
        </SigCard>
      </div>

      <SigCard>
        <div className="grid md:grid-cols-3 gap-4">
          <div>
            <label className="label">
              Data Inicial
            </label>

            <input
              type="date"
              className="input"
              value={dataInicio}
              onChange={(e) =>
                setDataInicio(e.target.value)
              }
            />
          </div>

          <div>
            <label className="label">
              Data Final
            </label>

            <input
              type="date"
              className="input"
              value={dataFim}
              onChange={(e) =>
                setDataFim(e.target.value)
              }
            />
          </div>

          <div className="flex items-end">
            <button
              onClick={gerarRelatorio}
              className="btn-primary w-full inline-flex items-center justify-center gap-2"
            >
              <Download size={18} />
              Gerar Relatório
            </button>
          </div>
        </div>
      </SigCard>

      <SigCard>
        <div className="flex items-center gap-4 mb-6">
          <Shield
            size={40}
            className="text-yellow-400"
          />

          <div>
            <h2 className="font-black text-xl">
              Operações Encontradas
            </h2>

            <p className="text-slate-400">
              {lista.length} operação(ões)
              encontrada(s).
            </p>
          </div>
        </div>

        {lista.length === 0 ? (
          <p className="text-slate-400 text-center py-10">
            Nenhuma operação encontrada.
          </p>
        ) : (
          <div className="space-y-4">
            {lista.map((item) => (
              <div
                key={item.id}
                className="border border-slate-800 rounded-xl p-4"
              >
                <div className="flex items-start gap-3">
                  <Siren className="text-yellow-400" />

                  <div className="flex-1">
                    <h3 className="font-black text-lg">
                      {item.tipo}
                    </h3>

                    <p className="text-slate-300">
                      {item.local}
                    </p>

                    <div className="flex flex-wrap gap-4 mt-2 text-sm text-slate-400">
                      <span className="flex items-center gap-2">
                        <CalendarDays size={16} />
                        {item.data}
                      </span>

                      <span className="flex items-center gap-2">
                        <CheckCircle size={16} />
                        {item.status || "PLANEJADA"}
                      </span>
                    </div>

                    {item.responsavel && (
                      <p className="mt-2 text-slate-400">
                        Responsável:{" "}
                        {item.responsavel}
                      </p>
                    )}

                    {item.observacoes && (
                      <p className="mt-2 text-slate-500">
                        {item.observacoes}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </SigCard>
    </div>
  );
}