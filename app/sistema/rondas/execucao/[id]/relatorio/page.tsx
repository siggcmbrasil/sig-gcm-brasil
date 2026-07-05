"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
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

import { supabase } from "@/lib/supabase";
import { registrarAuditoria } from "@/lib/auditoria";
import SigCard from "@/components/sig/SigCard";

type UsuarioLogado = {
  id: string;
  perfil: string;
  municipio_id: number;
};

type PlanoRonda = {
  id: number;
  nome: string | null;
  descricao: string | null;
  data_inicio: string | null;
  data_fim: string | null;
  status: string | null;
};

type PontoRonda = {
  id: number;
  nome_local: string | null;
  ordem: number | null;
};

type CheckinRonda = {
  id: number;
  ponto_id: number | null;
  nome: string | null;
  latitude: number | null;
  longitude: number | null;
  distancia_metros: number | null;
  observacao: string | null;
  foto_url: string | null;
  criado_em: string | null;
};

function obterUsuarioLogado(): UsuarioLogado | null {
  try {
    const salvo = localStorage.getItem("usuarioLogado");
    if (!salvo) return null;

    const usuario = JSON.parse(salvo);

    if (!usuario?.id || !usuario?.perfil || !usuario?.municipio_id) {
      return null;
    }

    return {
      id: String(usuario.id),
      perfil: usuario.perfil,
      municipio_id: Number(usuario.municipio_id),
    };
  } catch {
    return null;
  }
}

export default function RelatorioExecucaoRondaPage() {
  const params = useParams();
  const id = Number(params.id);

  const [plano, setPlano] = useState<PlanoRonda | null>(null);
  const [pontos, setPontos] = useState<PontoRonda[]>([]);
  const [checkins, setCheckins] = useState<CheckinRonda[]>([]);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    if (id) {
      void carregar();
    }
  }, [id]);

  async function carregar() {
    const usuario = obterUsuarioLogado();

    if (!usuario) {
      alert("Sessão inválida.");
      setCarregando(false);
      return;
    }

    setCarregando(true);

    const [planoResp, pontosResp, checkinsResp] = await Promise.all([
      supabase
        .from("planos_ronda")
        .select("id, nome, descricao, data_inicio, data_fim, status")
        .eq("id", id)
        .eq("municipio_id", usuario.municipio_id)
        .single(),

      supabase
        .from("pontos_ronda")
        .select("id, nome_local, ordem")
        .eq("plano_id", id)
        .eq("municipio_id", usuario.municipio_id)
        .order("ordem", { ascending: true }),

      supabase
        .from("checkins_ronda")
        .select(
          "id, ponto_id, nome, latitude, longitude, distancia_metros, observacao, foto_url, criado_em"
        )
        .eq("plano_id", id)
        .eq("municipio_id", usuario.municipio_id)
        .order("id", { ascending: false }),
    ]);

    setCarregando(false);

    if (planoResp.error || pontosResp.error || checkinsResp.error) {
      const erro = planoResp.error || pontosResp.error || checkinsResp.error;

      console.error(erro);

      await registrarAuditoria({
        modulo: "Rondas",
        acao: "ERRO",
        descricao: "Erro ao carregar relatório individual da ronda.",
        tabela: "checkins_ronda",
        detalhes: {
          erro: erro?.message,
          plano_id: id,
          municipio_id: usuario.municipio_id,
          usuario_id: usuario.id,
        },
      });

      alert("Erro ao carregar relatório da ronda.");
      return;
    }

    setPlano(planoResp.data as PlanoRonda);
    setPontos((pontosResp.data || []) as PontoRonda[]);
    setCheckins((checkinsResp.data || []) as CheckinRonda[]);
  }

  async function imprimirRelatorio() {
    const usuario = obterUsuarioLogado();

    if (usuario) {
      await registrarAuditoria({
        modulo: "Rondas",
        acao: "IMPRIMIR",
        descricao: "Imprimiu relatório individual da ronda.",
        tabela: "checkins_ronda",
        detalhes: {
          plano_id: id,
          municipio_id: usuario.municipio_id,
          usuario_id: usuario.id,
        },
      });
    }

    window.print();
  }

  const visitados = pontos.filter((ponto) =>
    checkins.some((checkin) => Number(checkin.ponto_id) === Number(ponto.id))
  );

  const pendentes = pontos.filter(
    (ponto) =>
      !checkins.some((checkin) => Number(checkin.ponto_id) === Number(ponto.id))
  );

  const percentual =
    pontos.length > 0
      ? Math.round((visitados.length / pontos.length) * 100)
      : 0;

  if (carregando) {
    return (
      <div className="p-6 text-white">
        Carregando relatório...
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 pb-24 text-white space-y-6 print:bg-white print:text-black">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-3 print:hidden">
        <Link
          href={`/sistema/rondas/execucao/${id}`}
          className="text-blue-400 font-bold flex items-center gap-2"
        >
          <ArrowLeft size={18} />
          Voltar à Execução
        </Link>

        <button
          type="button"
          onClick={imprimirRelatorio}
          className="bg-blue-700 hover:bg-blue-800 px-4 py-3 rounded-xl font-bold flex items-center gap-2"
        >
          <Printer size={18} />
          Imprimir
        </button>
      </div>

      <SigCard className="print:border print:border-black print:bg-white">
        <h1 className="text-3xl font-black flex items-center gap-3 print:text-black">
          <FileText className="text-blue-400 print:text-black" size={34} />
          Relatório da Ronda
        </h1>

        <h2 className="text-2xl font-black mt-3 flex items-center gap-2 print:text-black">
          <ShieldCheck className="text-blue-400 print:text-black" size={26} />
          {plano?.nome || "Plano de Ronda"}
        </h2>

        <p className="text-slate-400 mt-2 print:text-black">
          {plano?.descricao || "-"}
        </p>

        <div className="grid md:grid-cols-3 gap-3 mt-5 text-sm">
          <Info
            titulo="Status"
            valor={plano?.status || "N/I"}
          />

          <Info
            titulo="Início"
            valor={
              plano?.data_inicio
                ? new Date(plano.data_inicio).toLocaleString("pt-BR")
                : "N/I"
            }
          />

          <Info
            titulo="Fim"
            valor={
              plano?.data_fim
                ? new Date(plano.data_fim).toLocaleString("pt-BR")
                : "N/I"
            }
          />
        </div>
      </SigCard>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card titulo="Pontos" valor={pontos.length} />
        <Card titulo="Visitados" valor={visitados.length} />
        <Card titulo="Pendentes" valor={pendentes.length} />
        <Card titulo="Conclusão" valor={`${percentual}%`} />
      </div>

      <SigCard className="print:border print:border-black print:bg-white">
        <h2 className="text-xl font-black mb-4 flex items-center gap-2 print:text-black">
          <CheckCircle className="text-green-400 print:text-black" size={24} />
          Pontos Visitados
        </h2>

        {visitados.length === 0 ? (
          <p className="text-slate-400 print:text-black">
            Nenhum ponto visitado.
          </p>
        ) : (
          <div className="space-y-3">
            {visitados.map((ponto) => {
              const checkin = checkins.find(
                (item) => Number(item.ponto_id) === Number(ponto.id)
              );

              return (
                <div
                  key={ponto.id}
                  className="border border-green-700 rounded-xl p-4 bg-green-950/20 print:bg-white print:border-black"
                >
                  <h3 className="font-black flex items-center gap-2 print:text-black">
                    <CheckCircle
                      className="text-green-400 print:text-black"
                      size={18}
                    />
                    {ponto.ordem || "-"}º {ponto.nome_local}
                  </h3>

                  <p className="text-green-400 text-sm flex items-center gap-2 mt-2 print:text-black">
                    <User size={15} />
                    {checkin?.nome || "Usuário não identificado"}
                  </p>

                  <p className="text-yellow-400 text-sm flex items-center gap-2 print:text-black">
                    <Clock size={15} />
                    {checkin?.criado_em
                      ? new Date(checkin.criado_em).toLocaleString("pt-BR")
                      : "Data não informada"}
                  </p>

                  <p className="text-slate-400 text-sm flex items-center gap-2 print:text-black">
                    <MapPin size={15} />
                    {checkin?.latitude ?? "-"}, {checkin?.longitude ?? "-"}
                  </p>

                  {checkin?.distancia_metros !== null &&
                    checkin?.distancia_metros !== undefined && (
                      <p className="text-cyan-400 text-sm mt-1 print:text-black">
                        Distância: {checkin.distancia_metros} m
                      </p>
                    )}

                  {checkin?.observacao && (
                    <p className="text-slate-300 text-sm mt-2 print:text-black">
                      {checkin.observacao}
                    </p>
                  )}

                  {checkin?.foto_url && (
                    <div className="mt-3">
                      <img
                        src={checkin.foto_url}
                        alt="Foto da ronda"
                        className="w-full max-w-sm rounded-xl border border-slate-700 print:max-w-xs print:border-black"
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </SigCard>

      <SigCard className="print:border print:border-black print:bg-white">
        <h2 className="text-xl font-black mb-4 flex items-center gap-2 print:text-black">
          <XCircle className="text-red-400 print:text-black" size={24} />
          Pontos Pendentes
        </h2>

        {pendentes.length === 0 ? (
          <p className="text-green-400 font-bold print:text-black">
            Todos os pontos foram visitados.
          </p>
        ) : (
          <div className="space-y-3">
            {pendentes.map((ponto) => (
              <div
                key={ponto.id}
                className="border border-slate-700 rounded-xl p-4 bg-slate-950/60 print:bg-white print:border-black"
              >
                <h3 className="font-black flex items-center gap-2 print:text-black">
                  <XCircle
                    className="text-red-400 print:text-black"
                    size={18}
                  />
                  {ponto.ordem || "-"}º {ponto.nome_local}
                </h3>
              </div>
            ))}
          </div>
        )}
      </SigCard>
    </div>
  );
}

function Card({ titulo, valor }: { titulo: string; valor: number | string }) {
  return (
    <SigCard className="text-center print:border print:border-black print:bg-white">
      <p className="text-slate-400 print:text-black">{titulo}</p>
      <h2 className="text-4xl font-black mt-1 print:text-black">
        {valor}
      </h2>
    </SigCard>
  );
}

function Info({
  titulo,
  valor,
}: {
  titulo: string;
  valor: string;
}) {
  return (
    <div className="rounded-xl bg-slate-950/70 border border-slate-800 p-3 print:bg-white print:border-black">
      <p className="text-slate-500 text-xs print:text-black">
        {titulo}
      </p>

      <p className="text-slate-200 font-bold print:text-black">
        {valor}
      </p>
    </div>
  );
}