"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { podeVerModulo } from "@/lib/permissoesModulo";
import {
  FileText,
  GraduationCap,
  Shield,
  CalendarDays,
  Siren,
  MapPinned,
  Award,
  TriangleAlert,
  BarChart3,
} from "lucide-react";

type Guarda = {
  id: number;
  nome: string;
  matricula?: string;
  cargo?: string;
  status?: string;
  data_nascimento?: string;
  foto_url?: string;
  telefone?: string;
  email?: string;
  cpf?: string;
  rg?: string;
  cnh?: string;
  categoria_cnh?: string;
  validade_cnh?: string;
  data_admissao?: string;
};

export default function DossieGuardaPage() {
  const params = useParams();
  const id = params.id as string;

  const [guarda, setGuarda] = useState<Guarda | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [liberado, setLiberado] = useState(false);
  const [ocorrenciasGuarda, setOcorrenciasGuarda] = useState<any[]>([]);
  const [patrulhamentosGuarda, setPatrulhamentosGuarda] = useState<any[]>([]);

  const [stats, setStats] = useState({
  documentos: 0,
  cursos: 0,
  ocorrencias: 0,
  patrulhamentos: 0,
  elogios: 0,
  advertencias: 0,
});

  useEffect(() => {
  async function iniciar() {
    const dados = localStorage.getItem("usuarioLogado");

    if (!dados) {
      window.location.href = "/login";
      return;
    }

    const usuario = JSON.parse(dados);

    const permitido = await podeVerModulo(
      usuario.perfil,
      "dossie_guarda"
    );

    if (!permitido) {
      alert("Você não tem permissão para acessar o dossiê do guarda.");
      window.location.href = "/sistema";
      return;
    }

    setLiberado(true);
    carregarGuarda();
    carregarStats();
  }

  iniciar();
}, []);

const usuarioLogado =
  typeof window !== "undefined"
    ? JSON.parse(localStorage.getItem("usuarioLogado") || "{}")
    : {};

  async function carregarGuarda() {
    const { data } = await supabase
      .from("guardas")
      .select("*")
      .eq("id", Number(id))
      .eq("municipio_id", usuarioLogado.municipio_id)
      .single();

    setGuarda(data);
    setCarregando(false);
  }

  async function carregarStats() {
    const { count: documentos } = await supabase
      .from("documentos_guardas")
      .select("*", { count: "exact", head: true })
      .eq("guarda_id", Number(id));

    const { count: cursos } = await supabase
      .from("cursos_guardas")
      .select("*", { count: "exact", head: true })
      .eq("guarda_id", Number(id));

    const { count: elogios } = await supabase
      .from("elogios_guardas")
      .select("*", { count: "exact", head: true })
      .eq("guarda_id", Number(id));

    const { count: advertencias } = await supabase
      .from("advertencias_guardas")
      .select("*", { count: "exact", head: true })
      .eq("guarda_id", Number(id));

      const { count: ocorrencias } = await supabase
  .from("ocorrencias")
  .select("*", { count: "exact", head: true })
  .eq("guarda_responsavel_id", Number(id));

  const { data: ultimasOcorrencias } = await supabase
  .from("ocorrencias")
  .select("id, protocolo, tipo, data, status")
  .eq("guarda_responsavel_id", Number(id))
  .order("data", { ascending: false })
  .limit(5);

setOcorrenciasGuarda(ultimasOcorrencias || []);

const { data: ultimosPatrulhamentos } = await supabase
  .from("patrulhamentos")
  .select("*")
  .eq("guarda_id", Number(id))
  .order("data", { ascending: false })
  .limit(5);

setPatrulhamentosGuarda(
  ultimosPatrulhamentos || []
);

  const { count: patrulhamentos } = await supabase
  .from("patrulhamentos")
  .select("*", { count: "exact", head: true })
  .eq("guarda_id", Number(id));

    setStats({
  documentos: documentos || 0,
  cursos: cursos || 0,
  patrulhamentos: patrulhamentos || 0,
  ocorrencias: ocorrencias || 0,
  elogios: elogios || 0,
  advertencias: advertencias || 0,
});
  }

  if (!liberado) {
  return <div className="p-6 text-white">Verificando permissão...</div>;
}

  if (carregando) {
    return <div className="p-6 text-white">Carregando dossiê...</div>;
  }

  if (!guarda) {
    return <div className="p-6 text-white">Guarda não encontrado.</div>;
  }

function calcularTempoServico(data?: string) {
  if (!data) return "-";

  const admissao = new Date(data);
  const hoje = new Date();

  let anos =
    hoje.getFullYear() - admissao.getFullYear();

  let meses =
    hoje.getMonth() - admissao.getMonth();

  if (meses < 0) {
    anos--;
    meses += 12;
  }

  return `${anos} ano(s) e ${meses} mês(es)`;
}

  return (
    <div className="p-6 text-white space-y-6">
      <Link href="/sistema/guardas" className="text-blue-400 font-bold">
        ← Voltar para Guardas
      </Link>

      <div className="painel-premium p-6 flex flex-col md:flex-row gap-6 items-center md:items-start">
        <div className="w-32 h-32 rounded-full overflow-hidden border-2 border-yellow-500 bg-slate-800 flex items-center justify-center text-6xl">
          {guarda.foto_url ? (
            <img src={guarda.foto_url} className="w-full h-full object-cover" />
          ) : (
            "👮"
          )}
        </div>

        <div className="flex-1">
          <h1 className="text-4xl font-black">👮 {guarda.nome}</h1>

          <p className="text-slate-400 mt-2">
            Matrícula: {guarda.matricula || "-"}
          </p>

          <p className="text-slate-400">
            Status: {guarda.status || "Não informado"}
          </p>

          <p className="text-slate-400">
            E-mail: {guarda.email || "-"}
          </p>

          <p className="text-slate-400">
            Telefone: {guarda.telefone || "-"}
          </p>
        </div>
      </div>

      <div className="painel-premium p-6">
  <h2 className="text-2xl font-black mb-4">
    📋 Dados Funcionais
  </h2>

  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">

    <Info titulo="Cargo" valor={guarda.cargo} />

    <Info titulo="CPF" valor={guarda.cpf} />

    <Info titulo="RG" valor={guarda.rg} />

    <Info titulo="CNH" valor={guarda.cnh} />

    <Info
      titulo="Categoria CNH"
      valor={guarda.categoria_cnh}
    />

    <Info
      titulo="Validade CNH"
      valor={guarda.validade_cnh}
    />

    <Info
      titulo="Data de Admissão"
      valor={guarda.data_admissao}
    />

    <Info
  titulo="Tempo de Serviço"
  valor={calcularTempoServico(
    guarda.data_admissao
  )}
/>

    <Info
      titulo="Nascimento"
      valor={guarda.data_nascimento}
    />

  </div>
</div>

      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        <MiniStat icone="📄" titulo="Documentos" valor={stats.documentos} />
        <MiniStat icone="🎓" titulo="Cursos" valor={stats.cursos} />
        <MiniStat  icone="🚔" titulo="Ocorrências"  valor={stats.ocorrencias}  />
        <MiniStat icone="📍" titulo="Patrulhamentos" valor={stats.patrulhamentos} />
        <MiniStat icone="🏆" titulo="Elogios" valor={stats.elogios} />
        <MiniStat icone="⚠️" titulo="Advertências" valor={stats.advertencias} />
      </div>

      <div className="painel-premium p-6">
  <h2 className="text-2xl font-black mb-4">
    🚔 Últimas Ocorrências
  </h2>

  <div className="painel-premium p-6">
  <h2 className="text-2xl font-black mb-4">
    🛣️ Últimos Patrulhamentos
  </h2>

  {patrulhamentosGuarda.length === 0 ? (
    <p className="text-slate-400">
      Nenhum patrulhamento encontrado.
    </p>
  ) : (
    <div className="space-y-3">
      {patrulhamentosGuarda.map((item) => (
        <div
          key={item.id}
          className="border border-slate-700 rounded-xl p-4"
        >
          <p className="font-bold">
            {item.data}
          </p>

          <p className="text-slate-400">
            {item.status || "Concluído"}
          </p>
        </div>
      ))}
    </div>
  )}
</div>

  {ocorrenciasGuarda.length === 0 ? (
    <p className="text-slate-400">
      Nenhuma ocorrência vinculada a este guarda.
    </p>
  ) : (
    <div className="space-y-3">
      {ocorrenciasGuarda.map((oc) => (
        <Link
          key={oc.id}
          href={`/sistema/ocorrencias/${oc.id}`}
          className="block border border-slate-700 rounded-xl p-4 hover:bg-slate-900"
        >
          <p className="font-bold text-blue-400">{oc.protocolo}</p>
          <p>{oc.tipo}</p>
          <p className="text-sm text-slate-400">
            {oc.data} • {oc.status}
          </p>
        </Link>
      ))}
    </div>
  )}
</div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <CardDossie
  titulo="Cursos"
  icone={<GraduationCap size={48} />}
  href={`/sistema/guardas/${id}/cursos`}
/>

<CardDossie
  titulo="Histórico Profissional"
  icone={<Shield size={48} />}
  href={`/sistema/guardas/${id}/historico`}
/>

<CardDossie
  titulo="Escalas"
  icone={<CalendarDays size={48} />}
  href={`/sistema/guardas/${id}/escalas`}
/>

<CardDossie
  titulo="Ocorrências"
  icone={<Siren size={48} />}
  href={`/sistema/guardas/${id}/ocorrencias`}
/>

<CardDossie
  titulo="Patrulhamentos"
  icone={<MapPinned size={48} />}
  href={`/sistema/guardas/${id}/patrulhamentos`}
/>

<CardDossie
  titulo="Elogios"
  icone={<Award size={48} />}
  href={`/sistema/guardas/${id}/elogios`}
/>

<CardDossie
  titulo="Advertências"
  icone={<TriangleAlert size={48} />}
  href={`/sistema/guardas/${id}/advertencias`}
/>

<CardDossie
  titulo="Estatísticas"
  icone={<BarChart3 size={48} />}
  href={`/sistema/guardas/${id}/estatisticas`}
/>
      </div>
    </div>
  );
}

function Info({
  titulo,
  valor,
}: {
  titulo: string;
  valor?: string | null;
}) {
  return (
    <div className="border border-slate-700 rounded-xl p-3">
      <p className="text-slate-500 text-sm">
        {titulo}
      </p>

      <p className="font-semibold">
        {valor || "-"}
      </p>
    </div>
  );
}

function MiniStat({ icone, titulo, valor }: any) {
  return (
    <div className="painel-premium p-4 text-center">
      <div className="text-3xl">{icone}</div>
      <h2 className="text-3xl font-black mt-2">{valor}</h2>
      <p className="text-slate-400 text-sm">{titulo}</p>
    </div>
  );
}

function CardDossie({
  titulo,
  icone,
  href,
}: {
  titulo: string;
  icone: React.ReactNode;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="painel-premium p-6 hover:scale-105 transition block"
    >
      <div className="mb-4 text-blue-400">
  {icone}
</div>
      <h2 className="text-xl font-black">{titulo}</h2>
    </Link>
  );
}