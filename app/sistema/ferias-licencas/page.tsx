"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  CalendarDays,
  PlusCircle,
  HeartPulse,
  Search,
  UserCheck,
  Clock,
  CheckCircle,
} from "lucide-react";

import { supabase } from "@/lib/supabase";
import SigPageHeader from "@/components/sig/SigPageHeader";
import SigCard from "@/components/sig/SigCard";

export default function FeriasLicencasPage() {
  const [registros, setRegistros] = useState<any[]>([]);
  const [busca, setBusca] = useState("");
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    carregar();
  }, []);

  async function carregar() {
    const usuario = JSON.parse(localStorage.getItem("usuarioLogado") || "{}");

    if (!usuario?.municipio_id) {
      setCarregando(false);
      return;
    }

    const { data, error } = await supabase
  .from("ferias_licencas")
  .select(`
    *,
    guardas:guarda_id (
      id,
      nome,
      matricula,
      foto_url
    )
  `)
      .eq("municipio_id", usuario.municipio_id)
      .order("data_inicio", { ascending: false });

    setCarregando(false);

    if (error) {
      console.error(error);
      alert("Erro ao carregar férias e licenças.");
      return;
    }

    setRegistros(data || []);
  }

  function formatarData(data: string | null) {
    if (!data) return "-";
    const [ano, mes, dia] = data.split("-");
    return `${dia}/${mes}/${ano}`;
  }

  function corTipo(tipo: string) {
    if (tipo?.includes("FÉRIAS")) {
      return "border-cyan-500/30 bg-cyan-500/10 text-cyan-400";
    }

    if (tipo?.includes("LICENÇA")) {
      return "border-yellow-500/30 bg-yellow-500/10 text-yellow-400";
    }

    if (tipo?.includes("AFASTAMENTO")) {
      return "border-red-500/30 bg-red-500/10 text-red-400";
    }

    return "border-slate-700 bg-slate-800 text-slate-300";
  }

  function corStatus(status: string) {
    if (status === "ATIVO") {
      return "border-emerald-500/30 bg-emerald-500/10 text-emerald-400";
    }

    if (status === "FINALIZADO") {
      return "border-slate-500/30 bg-slate-500/10 text-slate-400";
    }

    return "border-yellow-500/30 bg-yellow-500/10 text-yellow-400";
  }

  const hoje = new Date().toISOString().split("T")[0];

  const registrosFiltrados = registros.filter((item) => {
    const texto = `
      ${item.guardas?.nome || ""}
      ${item.guardas?.matricula || ""}
      ${item.tipo || ""}
      ${item.status || ""}
      ${item.observacao || ""}
      ${item.data_inicio || ""}
      ${item.data_fim || ""}
    `.toLowerCase();

    return texto.includes(busca.toLowerCase());
  });

  const ativos = registros.filter((r) => r.status === "ATIVO").length;
  const ferias = registros.filter((r) => r.tipo === "FÉRIAS").length;
  const licencas = registros.filter((r) =>
    String(r.tipo || "").includes("LICENÇA")
  ).length;
  const vencendo = registros.filter(
    (r) => r.status === "ATIVO" && r.data_fim && r.data_fim >= hoje
  ).length;

  return (
    <div className="p-4 md:p-6 pb-24 space-y-6">
      <SigPageHeader
        titulo="Férias e Licenças"
        subtitulo="Controle de férias, licenças e afastamentos dos servidores."
        icone={CalendarDays}
      />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <SigCard>
          <HeartPulse className="w-8 h-8 text-cyan-400 mb-3" />
          <p className="text-slate-400 text-sm">Registros</p>
          <h2 className="text-4xl font-black text-white mt-2">
            {registros.length}
          </h2>
        </SigCard>

        <SigCard>
          <UserCheck className="w-8 h-8 text-emerald-400 mb-3" />
          <p className="text-slate-400 text-sm">Ativos</p>
          <h2 className="text-4xl font-black text-emerald-400 mt-2">
            {ativos}
          </h2>
        </SigCard>

        <SigCard>
          <CalendarDays className="w-8 h-8 text-cyan-400 mb-3" />
          <p className="text-slate-400 text-sm">Férias</p>
          <h2 className="text-4xl font-black text-cyan-400 mt-2">
            {ferias}
          </h2>
        </SigCard>

        <SigCard>
          <Clock className="w-8 h-8 text-yellow-400 mb-3" />
          <p className="text-slate-400 text-sm">Licenças</p>
          <h2 className="text-4xl font-black text-yellow-400 mt-2">
            {licencas}
          </h2>
        </SigCard>
      </div>

      <SigCard>
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-5 h-5 text-slate-500 absolute left-4 top-1/2 -translate-y-1/2" />

            <input
              className="input pl-12"
              placeholder="Buscar por guarda, matrícula, tipo ou status..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
            />
          </div>

          <Link
            href="/sistema/ferias-licencas/nova"
            className="btn-primary inline-flex items-center justify-center gap-2"
          >
            <PlusCircle size={18} />
            Nova Solicitação
          </Link>
        </div>
      </SigCard>

      <SigCard>
        <h2 className="text-xl font-black mb-5 text-white">
          Registros de Férias e Licenças
        </h2>

        {carregando ? (
          <p className="text-slate-400">Carregando registros...</p>
        ) : registrosFiltrados.length === 0 ? (
          <div className="text-center py-14">
            <CalendarDays className="w-16 h-16 mx-auto text-cyan-400 mb-4" />

            <h3 className="text-2xl font-black text-white">
              Nenhum registro encontrado
            </h3>

            <p className="text-slate-400 mt-2">
              Cadastre férias, licenças ou afastamentos dos servidores.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            {registrosFiltrados.map((item) => (
              <div
                key={item.id}
                className="rounded-2xl border border-slate-800 bg-slate-950/70 p-5"
              >
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 rounded-full overflow-hidden border border-cyan-500/30 bg-slate-900 flex items-center justify-center">
                    {item.guardas?.foto_url ? (
                      <img
                        src={item.guardas.foto_url}
                        alt={item.guardas?.nome || "Guarda"}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-2xl">👮</span>
                    )}
                  </div>

                  <div className="flex-1">
                    <h3 className="font-black text-white text-lg">
                      {item.guardas?.nome || "Guarda não informado"}
                    </h3>

                    <p className="text-sm text-cyan-400 font-bold">
                      {item.guardas?.matricula || "Sem matrícula"}
                    </p>

                    <div className="flex flex-wrap gap-2 mt-3">
                      <span
                        className={`rounded-full border px-3 py-1 text-xs font-black ${corTipo(
                          item.tipo
                        )}`}
                      >
                        {item.tipo || "-"}
                      </span>

                      <span
                        className={`rounded-full border px-3 py-1 text-xs font-black ${corStatus(
                          item.status
                        )}`}
                      >
                        {item.status || "ATIVO"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 grid md:grid-cols-2 gap-3 text-sm text-slate-400">
                  <p>
                    <strong className="text-slate-300">Início:</strong>{" "}
                    {formatarData(item.data_inicio)}
                  </p>

                  <p>
                    <strong className="text-slate-300">Fim:</strong>{" "}
                    {formatarData(item.data_fim)}
                  </p>
                </div>

                {item.observacao && (
                  <p className="mt-4 border-t border-slate-800 pt-4 text-sm text-slate-400 whitespace-pre-wrap">
                    {item.observacao}
                  </p>
                )}

                <div className="mt-5 flex gap-2">
                  <Link
                    href={`/sistema/guardas/${item.guarda_id}`}
                    className="btn-secondary text-sm inline-flex items-center gap-2"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Ver Guarda
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </SigCard>
    </div>
  );
}