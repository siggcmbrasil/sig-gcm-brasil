"use client";

import { useEffect, useState } from "react";
import {
  AlertTriangle,
  BarChart3,
  Clock,
  MapPin,
  Search,
  ShieldAlert,
} from "lucide-react";

import { supabase } from "@/lib/supabase";
import SigPageHeader from "@/components/sig/SigPageHeader";
import SigCard from "@/components/sig/SigCard";
import { registrarAuditoria } from "@/lib/auditoria";

type Ocorrencia = {
  id: number;
  tipo: string | null;
  bairro: string | null;
  local: string | null;
  data: string | null;
  hora: string | null;
  status: string | null;
};

export default function AnaliseOcorrenciasPage() {
  const [ocorrencias, setOcorrencias] = useState<Ocorrencia[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [gerando, setGerando] = useState(false);

  useEffect(() => {
    carregar();
  }, []);

  async function carregar() {
    const usuario = JSON.parse(localStorage.getItem("usuarioLogado") || "{}");

    if (!usuario?.municipio_id) {
      alert("Município não identificado.");
      setCarregando(false);
      return;
    }

    const { data, error } = await supabase
      .from("ocorrencias")
      .select("id, tipo, bairro, local, data, hora, status")
      .eq("municipio_id", usuario.municipio_id)
      .order("id", { ascending: false })
      .limit(500);

    setCarregando(false);

    if (error) {
      console.error(error);
      alert("Erro ao carregar ocorrências.");
      return;
    }

    setOcorrencias(data || []);
  }

  function contarPorCampo(campo: keyof Ocorrencia) {
    const mapa: Record<string, number> = {};

    ocorrencias.forEach((item) => {
      const valor = String(item[campo] || "Não informado").trim();

      mapa[valor] = (mapa[valor] || 0) + 1;
    });

    return Object.entries(mapa).sort((a, b) => b[1] - a[1]);
  }

  function contarPorHorario() {
    const mapa: Record<string, number> = {
      "00h às 06h": 0,
      "06h às 12h": 0,
      "12h às 18h": 0,
      "18h às 00h": 0,
    };

    ocorrencias.forEach((item) => {
      const hora = Number(String(item.hora || "00:00").split(":")[0]);

      if (hora >= 0 && hora < 6) mapa["00h às 06h"] += 1;
      else if (hora >= 6 && hora < 12) mapa["06h às 12h"] += 1;
      else if (hora >= 12 && hora < 18) mapa["12h às 18h"] += 1;
      else mapa["18h às 00h"] += 1;
    });

    return Object.entries(mapa).sort((a, b) => b[1] - a[1]);
  }

  async function gerarAlertas() {
    const usuario = JSON.parse(localStorage.getItem("usuarioLogado") || "{}");

    if (!usuario?.municipio_id) {
      alert("Município não identificado.");
      return;
    }

    setGerando(true);

    const tipos = contarPorCampo("tipo");
    const bairros = contarPorCampo("bairro");
    const locais = contarPorCampo("local");
    const horarios = contarPorHorario();

    const novosAlertas: any[] = [];

    if (tipos[0] && tipos[0][1] >= 5) {
      novosAlertas.push({
        municipio_id: usuario.municipio_id,
        tipo: "TIPO_RECORRENTE",
        titulo: "Tipo de ocorrência recorrente",
        mensagem: `${tipos[0][0]} aparece em ${tipos[0][1]} registros recentes.`,
        nivel: tipos[0][1] >= 10 ? "ALTO" : "MEDIO",
        origem: "ANALISE_OCORRENCIAS",
      });
    }

    if (bairros[0] && bairros[0][0] !== "Não informado" && bairros[0][1] >= 1) {
      novosAlertas.push({
        municipio_id: usuario.municipio_id,
        tipo: "BAIRRO_CRITICO",
        titulo: "Bairro com alta incidência",
        mensagem: `${bairros[0][0]} possui ${bairros[0][1]} ocorrências recentes.`,
        nivel: bairros[0][1] >= 10 ? "ALTO" : "MEDIO",
        origem: "ANALISE_OCORRENCIAS",
      });
    }

    if (locais[0] && locais[0][0] !== "Não informado" && locais[0][1] >= 1) {
      novosAlertas.push({
        municipio_id: usuario.municipio_id,
        tipo: "LOCAL_REINCIDENTE",
        titulo: "Local com reincidência",
        mensagem: `${locais[0][0]} aparece em ${locais[0][1]} registros.`,
        nivel: locais[0][1] >= 6 ? "ALTO" : "MEDIO",
        origem: "ANALISE_OCORRENCIAS",
      });
    }

    if (horarios[0] && horarios[0][1] >= 1) {
      novosAlertas.push({
        municipio_id: usuario.municipio_id,
        tipo: "HORARIO_CRITICO",
        titulo: "Faixa de horário crítica",
        mensagem: `${horarios[0][0]} concentra ${horarios[0][1]} ocorrências recentes.`,
        nivel: horarios[0][1] >= 10 ? "ALTO" : "MEDIO",
        origem: "ANALISE_OCORRENCIAS",
      });
    }

    if (novosAlertas.length === 0) {
      setGerando(false);
      alert("Nenhum alerta operacional gerado.");
      return;
    }

    const { error } = await supabase
      .from("alertas_operacionais")
      .insert(novosAlertas);

    setGerando(false);

    if (error) {
      console.error(error);
      alert(error.message);
      return;
    }

    await registrarAuditoria({
  modulo: "Análise de Ocorrências",
  acao: "GERAR_ALERTAS",
  descricao: `Gerou ${novosAlertas.length} alerta(s) operacionais a partir da análise de ocorrências.`,
});

    alert(`${novosAlertas.length} alerta(s) gerado(s).`);
  }

  const tipos = contarPorCampo("tipo");
  const bairros = contarPorCampo("bairro");
  const locais = contarPorCampo("local");
  const horarios = contarPorHorario();

  return (
    <div className="p-4 md:p-6 pb-24 space-y-6">
      <SigPageHeader
        titulo="Análise de Ocorrências"
        subtitulo="Cruzamento operacional de tipos, bairros, locais e horários."
        icone={Search}
      />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <SigCard>
          <AlertTriangle className="w-8 h-8 text-cyan-400 mb-3" />
          <p className="text-slate-400 text-sm">Ocorrências analisadas</p>
          <h2 className="text-4xl font-black text-white mt-2">
            {ocorrencias.length}
          </h2>
        </SigCard>

        <SigCard>
          <BarChart3 className="w-8 h-8 text-cyan-400 mb-3" />
          <p className="text-slate-400 text-sm">Tipo principal</p>
          <h2 className="text-xl font-black text-white mt-2">
            {tipos[0]?.[0] || "-"}
          </h2>
          <p className="text-cyan-400 text-sm mt-1">{tipos[0]?.[1] || 0} registros</p>
        </SigCard>

        <SigCard>
          <MapPin className="w-8 h-8 text-yellow-400 mb-3" />
          <p className="text-slate-400 text-sm">Bairro crítico</p>
          <h2 className="text-xl font-black text-white mt-2">
            {bairros[0]?.[0] || "-"}
          </h2>
          <p className="text-yellow-400 text-sm mt-1">{bairros[0]?.[1] || 0} registros</p>
        </SigCard>

        <SigCard>
          <Clock className="w-8 h-8 text-orange-400 mb-3" />
          <p className="text-slate-400 text-sm">Horário crítico</p>
          <h2 className="text-xl font-black text-white mt-2">
            {horarios[0]?.[0] || "-"}
          </h2>
          <p className="text-orange-400 text-sm mt-1">{horarios[0]?.[1] || 0} registros</p>
        </SigCard>
      </div>

      <SigCard>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h2 className="text-xl font-black text-white">
              Gerar alertas automáticos
            </h2>
            <p className="text-slate-400 mt-1">
              O sistema analisará reincidência por tipo, bairro, local e horário.
            </p>
          </div>

          <button
            type="button"
            onClick={gerarAlertas}
            disabled={gerando || carregando}
            className="btn-primary inline-flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <ShieldAlert className="w-5 h-5" />
            {gerando ? "Gerando..." : "Gerar Alertas"}
          </button>
        </div>
      </SigCard>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <Lista titulo="Tipos mais recorrentes" dados={tipos} />
        <Lista titulo="Bairros mais recorrentes" dados={bairros} />
        <Lista titulo="Locais reincidentes" dados={locais} />
        <Lista titulo="Faixas de horário" dados={horarios} />
      </div>
    </div>
  );
}

function Lista({
  titulo,
  dados,
}: {
  titulo: string;
  dados: [string, number][];
}) {
  return (
    <SigCard>
      <h2 className="text-xl font-black text-white mb-4">{titulo}</h2>

      {dados.length === 0 ? (
        <p className="text-slate-400">Nenhum dado encontrado.</p>
      ) : (
        <div className="space-y-3">
          {dados.slice(0, 10).map(([nome, total]) => (
            <div
              key={nome}
              className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950/70 p-3"
            >
              <span className="text-slate-300">{nome}</span>
              <span className="font-black text-cyan-400">{total}</span>
            </div>
          ))}
        </div>
      )}
    </SigCard>
  );
}