"use client";

import { useEffect, useState } from "react";
import { Users, ShieldCheck, Building2, Star, Umbrella } from "lucide-react";

import { supabase } from "@/lib/supabase";
import SigPageHeader from "@/components/sig/SigPageHeader";
import SigCard from "@/components/sig/SigCard";

export default function MapaEfetivoPage() {
  const [guardas, setGuardas] = useState<any[]>([]);
  const [administrativas, setAdministrativas] = useState<any[]>([]);
  const [extras, setExtras] = useState<any[]>([]);
  const [afastamentos, setAfastamentos] = useState<any[]>([]);

  const usuario =
    typeof window !== "undefined"
      ? JSON.parse(localStorage.getItem("usuarioLogado") || "{}")
      : {};

  const municipioId = usuario?.municipio_id;
  const hoje = new Date().toISOString().split("T")[0];

  async function carregar() {
    if (!municipioId) return;

    const { data: guardasData } = await supabase
      .from("guardas")
      .select("id,nome,matricula,status,lotacao")
      .eq("municipio_id", municipioId)
.eq("status", "ATIVO")
.order("nome");

    const { data: administrativasData } = await supabase
      .from("escalas_administrativas")
.select("*")
.eq("municipio_id", municipioId)
.eq("status", "ATIVA")
.eq("data", hoje);

    const { data: extrasData } = await supabase
      .from("escalas_extras")
.select("*")
.eq("municipio_id", municipioId)
.eq("status", "AGENDADO")
.eq("data", hoje);

    const { data: afastamentosData } = await supabase
      .from("ferias_licencas")
.select("*")
.eq("municipio_id", municipioId)
.eq("status", "ATIVO")
.lte("data_inicio", hoje)
.gte("data_fim", hoje);

    setGuardas(guardasData || []);
    setAdministrativas(administrativasData || []);
    setExtras(extrasData || []);
    setAfastamentos(afastamentosData || []);
  }

  useEffect(() => {
    carregar();
  }, []);

  const emAdministrativo = new Set(
    administrativas.map((a) => Number(a.guarda_id))
  );

  const emExtra = new Set(extras.map((e) => Number(e.guarda_id)));

  const afastados = new Set(
    afastamentos.map((a) => Number(a.guarda_id))
  );

  const disponiveis = guardas.filter(
    (g) =>
      !emAdministrativo.has(g.id) &&
      !emExtra.has(g.id) &&
      !afastados.has(g.id)
  );

  return (
    <div className="p-4 md:p-6 pb-24 space-y-6">
      <SigPageHeader
        titulo="Mapa de Efetivo"
        subtitulo="Visão geral do efetivo disponível, escalado, administrativo, extra e afastado."
        icone={Users}
      />

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Resumo titulo="Efetivo" valor={guardas.length} icone={Users} />
        <Resumo titulo="Disponíveis" valor={disponiveis.length} icone={ShieldCheck} />
        <Resumo titulo="Administrativo" valor={administrativas.length} icone={Building2} />
        <Resumo titulo="Extra" valor={extras.length} icone={Star} />
        <Resumo titulo="Afastados" valor={afastamentos.length} icone={Umbrella} />
      </div>

      <div className="grid xl:grid-cols-2 gap-4">
        <Lista titulo="Disponíveis" itens={disponiveis} tipo="disponivel" />
        <Lista titulo="Administrativo hoje" itens={administrativas} tipo="administrativo" />
        <Lista titulo="Serviço extra hoje" itens={extras} tipo="extra" />
        <Lista titulo="Férias / Licenças / Afastamentos" itens={afastamentos} tipo="afastado" />
      </div>
    </div>
  );
}

function Resumo({
  titulo,
  valor,
  icone: Icone,
}: {
  titulo: string;
  valor: number;
  icone: any;
}) {
  return (
    <SigCard>
      <Icone className="w-7 h-7 text-cyan-400 mb-3" />
      <p className="text-slate-400 text-sm">{titulo}</p>
      <h2 className="text-3xl font-black text-white">{valor}</h2>
    </SigCard>
  );
}

function Lista({
  titulo,
  itens,
  tipo,
}: {
  titulo: string;
  itens: any[];
  tipo: string;
}) {
  return (
    <SigCard>
      <h2 className="text-xl font-black text-white mb-4">{titulo}</h2>

      {itens.length === 0 ? (
        <p className="text-slate-400">Nenhum registro encontrado.</p>
      ) : (
        <div className="space-y-3">
          {itens.map((item) => (
            <div
              key={`${tipo}-${item.id}`}
              className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4"
            >
              <p className="font-black text-white">
                {item.nome || item.guarda_nome}
              </p>

              <p className="text-sm text-slate-400">
                {item.matricula ||
                  item.setor ||
                  item.tipo ||
                  item.status ||
                  "-"}
              </p>
            </div>
          ))}
        </div>
      )}
    </SigCard>
  );
}