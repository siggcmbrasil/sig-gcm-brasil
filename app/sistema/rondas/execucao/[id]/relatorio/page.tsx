"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import {
  ArrowLeft,
  CheckCircle,
  Clock,
  FileText,
  MapPin,
  Printer,
  ShieldCheck,
  User,
  XCircle,
} from "lucide-react";

export default function RelatorioExecucaoRondaPage() {
  const { id } = useParams();

  const [plano, setPlano] = useState<any>(null);
  const [pontos, setPontos] = useState<any[]>([]);
  const [checkins, setCheckins] = useState<any[]>([]);
  const [carregando, setCarregando] = useState(true);

  function pegarUsuario() {
    return JSON.parse(localStorage.getItem("usuarioLogado") || "{}");
  }

  useEffect(() => {
    carregar();
  }, []);

  async function carregar() {
    const usuario = pegarUsuario();
    const municipioId = usuario?.municipio_id;

    if (!municipioId) {
      alert("Município do usuário não identificado.");
      setCarregando(false);
      return;
    }

    const { data: planoData, error: planoError } = await supabase
      .from("planos_ronda")
      .select("*")
      .eq("id", Number(id))
      .eq("municipio_id", municipioId)
      .single();

    if (planoError) {
      console.error(planoError);
      alert("Erro ao carregar plano de ronda.");
      setCarregando(false);
      return;
    }

    const { data: pontosData, error: pontosError } = await supabase
      .from("pontos_ronda")
      .select("*")
      .eq("plano_id", Number(id))
      .eq("municipio_id", municipioId)
      .order("ordem", { ascending: true });

    if (pontosError) {
      console.error(pontosError);
      alert("Erro ao carregar pontos.");
      setCarregando(false);
      return;
    }

    const { data: checkinsData, error: checkinsError } = await supabase
      .from("checkins_ronda")
      .select("*")
      .eq("plano_id", Number(id))
      .eq("municipio_id", municipioId)
      .order("id", { ascending: false });

    if (checkinsError) {
      console.error(checkinsError);
      alert("Erro ao carregar check-ins.");
      setCarregando(false);
      return;
    }

    setPlano(planoData);
    setPontos(pontosData || []);
    setCheckins(checkinsData || []);
    setCarregando(false);
  }

  const visitados = pontos.filter((ponto) =>
    checkins.some((c) => Number(c.ponto_id) === Number(ponto.id))
  );

  const pendentes = pontos.filter(
    (ponto) => !checkins.some((c) => Number(c.ponto_id) === Number(ponto.id))
  );

  const percentual =
    pontos.length > 0 ? Math.round((visitados.length / pontos.length) * 100) : 0;

  if (carregando) {
    return <div className="p-6 text-white">Carregando relatório...</div>;
  }

  return (
    <div className="p-6 text-white space-y-6">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-3">
        <Link
          href={`/sistema/rondas/execucao/${id}`}
          className="text-blue-400 font-bold flex items-center gap-2"
        >
          <ArrowLeft size={18} />
          Voltar à Execução
        </Link>

        <button
          onClick={() => window.print()}
          className="bg-blue-700 hover:bg-blue-800 px-4 py-3 rounded-xl font-bold flex items-center gap-2"
        >
          <Printer size={18} />
          Imprimir
        </button>
      </div>

      <div className="painel-premium p-6">
        <h1 className="text-3xl font-black flex items-center gap-3">
          <FileText className="text-blue-400" size={34} />
          Relatório da Ronda
        </h1>

        <h2 className="text-2xl font-black mt-3 flex items-center gap-2">
          <ShieldCheck className="text-blue-400" size={26} />
          {plano?.nome || "Plano de Ronda"}
        </h2>

        <p className="text-slate-400 mt-2">{plano?.descricao || "-"}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card titulo="Pontos" valor={pontos.length} />
        <Card titulo="Visitados" valor={visitados.length} />
        <Card titulo="Pendentes" valor={pendentes.length} />
        <Card titulo="Conclusão" valor={`${percentual}%`} />
      </div>

      <div className="painel-premium p-6">
        <h2 className="text-xl font-black mb-4 flex items-center gap-2">
          <CheckCircle className="text-green-400" size={24} />
          Pontos Visitados
        </h2>

        {visitados.length === 0 ? (
          <p className="text-slate-400">Nenhum ponto visitado.</p>
        ) : (
          <div className="space-y-3">
            {visitados.map((ponto) => {
              const checkin = checkins.find(
                (c) => Number(c.ponto_id) === Number(ponto.id)
              );

              return (
                <div
                  key={ponto.id}
                  className="border border-green-700 rounded-xl p-4 bg-green-950/20"
                >
                  <h3 className="font-black flex items-center gap-2">
                    <CheckCircle className="text-green-400" size={18} />
                    {ponto.ordem}. {ponto.nome_local}
                  </h3>

                  <p className="text-green-400 text-sm flex items-center gap-2 mt-2">
                    <User size={15} />
                    {checkin?.nome || "Usuário não identificado"}
                  </p>

                  <p className="text-yellow-400 text-sm flex items-center gap-2">
                    <Clock size={15} />
                    {checkin?.criado_em
                      ? new Date(checkin.criado_em).toLocaleString("pt-BR")
                      : "Data não informada"}
                  </p>

                  <p className="text-slate-400 text-sm flex items-center gap-2">
                    <MapPin size={15} />
                    {checkin?.latitude}, {checkin?.longitude}
                  </p>

                  {checkin?.observacao && (
                    <p className="text-slate-300 text-sm mt-2">
                      {checkin.observacao}
                    </p>
                  )}

                  {checkin?.foto_url && (
                    <div className="mt-3">
                      <img
                        src={checkin.foto_url}
                        alt="Foto da ronda"
                        className="w-full max-w-sm rounded-xl border border-slate-700"
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="painel-premium p-6">
        <h2 className="text-xl font-black mb-4 flex items-center gap-2">
          <XCircle className="text-red-400" size={24} />
          Pontos Pendentes
        </h2>

        {pendentes.length === 0 ? (
          <p className="text-green-400 font-bold">
            Todos os pontos foram visitados.
          </p>
        ) : (
          <div className="space-y-3">
            {pendentes.map((ponto) => (
              <div
                key={ponto.id}
                className="border border-slate-700 rounded-xl p-4 bg-slate-950/60"
              >
                <h3 className="font-black flex items-center gap-2">
                  <XCircle className="text-red-400" size={18} />
                  {ponto.ordem}. {ponto.nome_local}
                </h3>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function Card({ titulo, valor }: { titulo: string; valor: number | string }) {
  return (
    <div className="painel-premium p-5 text-center">
      <p className="text-slate-400">{titulo}</p>
      <h2 className="text-4xl font-black mt-1">{valor}</h2>
    </div>
  );
}