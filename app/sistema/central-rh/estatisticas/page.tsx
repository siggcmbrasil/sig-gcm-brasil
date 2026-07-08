"use client";

import { useEffect, useState } from "react";
import {
  AlertTriangle,
  BarChart3,
  CalendarDays,
  Clock,
  HeartPulse,
  ShieldCheck,
  Users,
  UserCheck,
} from "lucide-react";

import { supabase } from "@/lib/supabase";
import SigPageHeader from "@/components/sig/SigPageHeader";
import SigCard from "@/components/sig/SigCard";

type UsuarioLogado = {
  id: string;
  perfil: string;
  municipio_id: number;
};

type EstatisticasRH = {
  guardas: number;
  ativos: number;
  inativos: number;
  feriasLicencas: number;
  atestados: number;
  registrosPonto: number;
  bancoHoras: number;
  pendencias: number;
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

export default function EstatisticasRHPage() {
  const [dados, setDados] = useState<EstatisticasRH>({
    guardas: 0,
    ativos: 0,
    inativos: 0,
    feriasLicencas: 0,
    atestados: 0,
    registrosPonto: 0,
    bancoHoras: 0,
    pendencias: 0,
  });

  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    void carregar();
  }, []);

  async function carregar() {
    const usuario = obterUsuarioLogado();

    if (!usuario) {
      setCarregando(false);
      return;
    }

    setCarregando(true);

    const municipioId = usuario.municipio_id;

    const [
      guardas,
      guardasAtivos,
      guardasInativos,
      feriasLicencas,
      atestados,
      registrosPonto,
      bancoHoras,
    ] = await Promise.all([
      supabase
        .from("guardas")
        .select("id", { count: "exact", head: true })
        .eq("municipio_id", municipioId),

      supabase
        .from("guardas")
        .select("id", { count: "exact", head: true })
        .eq("municipio_id", municipioId)
        .eq("status", "ATIVO"),

      supabase
        .from("guardas")
        .select("id", { count: "exact", head: true })
        .eq("municipio_id", municipioId)
        .neq("status", "ATIVO"),

      supabase
        .from("ferias_licencas")
        .select("id", { count: "exact", head: true })
        .eq("municipio_id", municipioId),

      supabase
        .from("atestados")
        .select("id", { count: "exact", head: true })
        .eq("municipio_id", municipioId),

      supabase
        .from("registro_ponto")
        .select("id", { count: "exact", head: true })
        .eq("municipio_id", municipioId),

      supabase
        .from("banco_horas")
        .select("id", { count: "exact", head: true })
        .eq("municipio_id", municipioId),
    ]);

    setDados({
      guardas: guardas.count || 0,
      ativos: guardasAtivos.count || 0,
      inativos: guardasInativos.count || 0,
      feriasLicencas: feriasLicencas.count || 0,
      atestados: atestados.count || 0,
      registrosPonto: registrosPonto.count || 0,
      bancoHoras: bancoHoras.count || 0,
      pendencias:
        (guardasInativos.count || 0) +
        (atestados.count || 0) +
        (feriasLicencas.count || 0),
    });

    setCarregando(false);
  }

  const percentualAtivos =
    dados.guardas > 0 ? Math.round((dados.ativos / dados.guardas) * 100) : 0;

  const percentualInativos =
    dados.guardas > 0 ? Math.round((dados.inativos / dados.guardas) * 100) : 0;

  return (
    <div className="p-4 md:p-6 pb-24 space-y-6">
      <SigPageHeader
        titulo="Estatísticas de RH"
        subtitulo="Indicadores do efetivo, frequência, afastamentos e vida funcional."
        icone={BarChart3}
      />

      {carregando ? (
        <SigCard>
          <p className="text-slate-400">Carregando estatísticas de RH...</p>
        </SigCard>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <ResumoCard
              titulo="Guardas"
              valor={dados.guardas}
              icone={<Users className="w-8 h-8 text-cyan-400" />}
            />

            <ResumoCard
              titulo="Ativos"
              valor={dados.ativos}
              icone={<UserCheck className="w-8 h-8 text-emerald-400" />}
            />

            <ResumoCard
              titulo="Férias/Licenças"
              valor={dados.feriasLicencas}
              icone={<CalendarDays className="w-8 h-8 text-yellow-400" />}
            />

            <ResumoCard
              titulo="Atestados"
              valor={dados.atestados}
              icone={<HeartPulse className="w-8 h-8 text-red-400" />}
            />
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <SigCard>
              <h2 className="text-xl font-black text-white mb-4">
                Situação do Efetivo
              </h2>

              <Indicador
                titulo="Ativos"
                valor={percentualAtivos}
                texto={`${dados.ativos} de ${dados.guardas} servidores`}
              />

              <Indicador
                titulo="Inativos"
                valor={percentualInativos}
                texto={`${dados.inativos} de ${dados.guardas} servidores`}
              />
            </SigCard>

            <SigCard>
              <h2 className="text-xl font-black text-white mb-4">
                Frequência e Jornada
              </h2>

              <MiniInfo
                titulo="Registros de ponto"
                valor={dados.registrosPonto}
                icone={<Clock className="w-6 h-6 text-blue-400" />}
              />

              <MiniInfo
                titulo="Banco de horas"
                valor={dados.bancoHoras}
                icone={<Clock className="w-6 h-6 text-yellow-400" />}
              />
            </SigCard>
          </div>

          <SigCard>
            <h2 className="text-xl font-black text-white mb-4">
              Painel de Atenção
            </h2>

            <div className="grid md:grid-cols-3 gap-3">
              <Alerta
                titulo="Pendências de RH"
                valor={dados.pendencias}
                descricao="Itens que exigem conferência administrativa."
              />

              <Alerta
                titulo="Afastamentos"
                valor={dados.feriasLicencas + dados.atestados}
                descricao="Férias, licenças e atestados registrados."
              />

              <Alerta
                titulo="Efetivo Inativo"
                valor={dados.inativos}
                descricao="Servidores fora do status ativo."
              />
            </div>
          </SigCard>

          <SigCard>
            <h2 className="text-xl font-black text-white flex items-center gap-2 mb-4">
              <ShieldCheck className="w-6 h-6 text-emerald-400" />
              Regras de segurança
            </h2>

            <div className="grid md:grid-cols-2 gap-3">
              <Regra texto="Todos os dados devem respeitar o município do usuário logado." />
              <Regra texto="Indicadores de RH devem ser acessíveis apenas por perfis autorizados." />
              <Regra texto="Relatórios e exportações devem registrar auditoria." />
              <Regra texto="Dados pessoais e médicos devem seguir regras de proteção e LGPD." />
            </div>
          </SigCard>
        </>
      )}
    </div>
  );
}

function ResumoCard({
  titulo,
  valor,
  icone,
}: {
  titulo: string;
  valor: number;
  icone: React.ReactNode;
}) {
  return (
    <SigCard>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-slate-400 text-sm">{titulo}</p>
          <h2 className="text-4xl font-black text-white mt-2">{valor}</h2>
        </div>

        {icone}
      </div>
    </SigCard>
  );
}

function Indicador({
  titulo,
  valor,
  texto,
}: {
  titulo: string;
  valor: number;
  texto: string;
}) {
  return (
    <div className="mb-5">
      <div className="flex justify-between text-sm mb-2">
        <span className="text-slate-300 font-bold">{titulo}</span>
        <span className="text-cyan-400 font-black">{valor}%</span>
      </div>

      <div className="h-3 rounded-full bg-slate-900 overflow-hidden">
        <div
          className="h-full bg-cyan-500 rounded-full"
          style={{ width: `${valor}%` }}
        />
      </div>

      <p className="text-slate-500 text-xs mt-2">{texto}</p>
    </div>
  );
}

function MiniInfo({
  titulo,
  valor,
  icone,
}: {
  titulo: string;
  valor: number;
  icone: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4 flex items-center justify-between mb-3">
      <div>
        <p className="text-slate-400 text-sm">{titulo}</p>
        <h3 className="text-2xl font-black text-white mt-1">{valor}</h3>
      </div>

      {icone}
    </div>
  );
}

function Alerta({
  titulo,
  valor,
  descricao,
}: {
  titulo: string;
  valor: number;
  descricao: string;
}) {
  return (
    <div className="rounded-2xl border border-yellow-500/20 bg-yellow-500/10 p-4">
      <AlertTriangle className="w-7 h-7 text-yellow-400 mb-3" />

      <h3 className="text-lg font-black text-white">{titulo}</h3>

      <p className="text-3xl font-black text-yellow-400 mt-2">{valor}</p>

      <p className="text-slate-400 text-sm mt-2">{descricao}</p>
    </div>
  );
}

function Regra({ texto }: { texto: string }) {
  return (
    <div className="rounded-2xl bg-slate-950/70 border border-emerald-500/20 p-4 text-slate-300">
      🛡️ {texto}
    </div>
  );
}