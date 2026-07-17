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
  HeartPulse,
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
  ferias: 0,
  licencas: 0,
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
      .eq("municipio_id", usuarioLogado.municipio_id)
.eq("guarda_id", Number(id));

    const { count: cursos } = await supabase
      .from("cursos_guardas")
      .select("*", { count: "exact", head: true })
      .eq("municipio_id", usuarioLogado.municipio_id)
      .eq("guarda_id", Number(id));

    const { count: elogios } = await supabase
      .from("elogios_guardas")
      .select("*", { count: "exact", head: true })
      .eq("municipio_id", usuarioLogado.municipio_id)
      .eq("guarda_id", Number(id));

    const { count: advertencias } = await supabase
      .from("advertencias_guardas")
      .select("*", { count: "exact", head: true })
      .eq("municipio_id", usuarioLogado.municipio_id)
      .eq("guarda_id", Number(id));

     const { count: ferias } = await supabase
  .from("ferias_licencas")
  .select("*", {
    count: "exact",
    head: true,
  })
  .eq(
    "municipio_id",
    usuarioLogado.municipio_id
  )
  .eq("guarda_id", Number(id))
  .eq("tipo", "FÉRIAS");

const { count: licencas } = await supabase
  .from("ferias_licencas")
  .select("*", {
    count: "exact",
    head: true,
  })
  .eq(
    "municipio_id",
    usuarioLogado.municipio_id
  )
  .eq("guarda_id", Number(id))
  .not("tipo", "eq", "FÉRIAS");

      const { count: ocorrencias } = await supabase
  .from("ocorrencias")
.select("*", { count: "exact", head: true })
.eq("municipio_id", usuarioLogado.municipio_id)
.eq("guarda_responsavel_id", Number(id));

  const { data: ultimasOcorrencias } = await supabase
  .from("ocorrencias")
  .select("id, protocolo, tipo, data, status")
  .eq("municipio_id", usuarioLogado.municipio_id)
  .eq("guarda_responsavel_id", Number(id))
  .order("data", { ascending: false })
  .limit(5);

setOcorrenciasGuarda(ultimasOcorrencias || []);

const { data: ultimosPatrulhamentos } = await supabase
 .from("patrulhamentos")
.select("*")
.eq("municipio_id", usuarioLogado.municipio_id)
.eq("guarda_id", Number(id))
  .order("data", { ascending: false })
  .limit(5);

setPatrulhamentosGuarda(
  ultimosPatrulhamentos || []
);

  const { count: patrulhamentos } = await supabase
  .from("patrulhamentos")
  .select("*", { count: "exact", head: true })
  .eq("municipio_id", usuarioLogado.municipio_id)
  .eq("guarda_id", Number(id));

   setStats({
  documentos: documentos || 0,
  cursos: cursos || 0,
  patrulhamentos: patrulhamentos || 0,
  ocorrencias: ocorrencias || 0,
  elogios: elogios || 0,
  advertencias: advertencias || 0,
  ferias: ferias || 0,
  licencas: licencas || 0,
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
  <main className="min-h-screen bg-[#020b1c] p-4 pb-24 text-white md:p-6">
    <div className="mx-auto max-w-7xl space-y-5">
      <header className="flex flex-col gap-4 border-b border-slate-800 pb-5 md:flex-row md:items-center md:justify-between">
        <div>
          <Link
            href="/sistema/guardas"
            className="text-sm font-semibold text-slate-400 transition hover:text-white"
          >
            ← Voltar para o efetivo
          </Link>

          <p className="mt-4 text-xs font-bold uppercase tracking-[0.18em] text-cyan-400">
            Recursos Humanos
          </p>

          <h1 className="mt-1 text-3xl font-black md:text-4xl">
            Dossiê Funcional
          </h1>

          <p className="mt-2 text-sm text-slate-400">
            Informações funcionais, administrativas e operacionais do servidor.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Link
            href={`/sistema/guardas/${id}/documentos`}
            className="rounded-lg border border-slate-700 bg-slate-900 px-4 py-2 text-sm font-bold text-slate-200 hover:border-cyan-500/40"
          >
            Documentos
          </Link>

          <Link
            href={`/sistema/guardas/${id}/historico`}
            className="rounded-lg border border-slate-700 bg-slate-900 px-4 py-2 text-sm font-bold text-slate-200 hover:border-cyan-500/40"
          >
            Histórico
          </Link>
        </div>
      </header>

      <section className="rounded-2xl border border-slate-800 bg-slate-950/70 p-5 md:p-6">
        <div className="flex flex-col gap-5 md:flex-row md:items-center">
          <div className="flex h-28 w-28 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-slate-700 bg-slate-900 text-5xl">
            {guarda.foto_url ? (
              <img
                src={guarda.foto_url}
                alt={guarda.nome}
                className="h-full w-full object-cover"
              />
            ) : (
              "👮"
            )}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="text-2xl font-black md:text-3xl">
                {guarda.nome}
              </h2>

              <span className="rounded-full border border-emerald-500/25 bg-emerald-500/10 px-3 py-1 text-xs font-black text-emerald-300">
                {guarda.status || "NÃO INFORMADO"}
              </span>
            </div>

            <p className="mt-2 font-bold text-cyan-300">
              Matrícula {guarda.matricula || "-"}
            </p>

            <div className="mt-4 grid gap-3 text-sm text-slate-400 sm:grid-cols-2 lg:grid-cols-4">
              <p>
                <span className="block text-xs uppercase text-slate-600">
                  Cargo
                </span>
                <strong className="text-slate-300">
                  {guarda.cargo || "-"}
                </strong>
              </p>

              <p>
                <span className="block text-xs uppercase text-slate-600">
                  Tempo de serviço
                </span>
                <strong className="text-slate-300">
                  {calcularTempoServico(guarda.data_admissao)}
                </strong>
              </p>

              <p>
                <span className="block text-xs uppercase text-slate-600">
                  Telefone
                </span>
                <strong className="text-slate-300">
                  {guarda.telefone || "-"}
                </strong>
              </p>

              <p>
                <span className="block text-xs uppercase text-slate-600">
                  E-mail
                </span>
                <strong className="break-all text-slate-300">
                  {guarda.email || "-"}
                </strong>
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-8">
        <Indicador titulo="Documentos" valor={stats.documentos} />
        <Indicador titulo="Cursos" valor={stats.cursos} />
        <Indicador titulo="Ocorrências" valor={stats.ocorrencias} />
        <Indicador titulo="Patrulhamentos" valor={stats.patrulhamentos} />
        <Indicador titulo="Elogios" valor={stats.elogios} />
        <Indicador titulo="Advertências" valor={stats.advertencias} />
        <Indicador titulo="Férias" valor={stats.ferias} />
        <Indicador titulo="Licenças" valor={stats.licencas} />
      </section>

      <section className="grid gap-5 xl:grid-cols-12">
        <div className="space-y-5 xl:col-span-5">
          <Painel titulo="Dados pessoais e funcionais">
            <div className="grid gap-3 sm:grid-cols-2">
              <Info titulo="CPF" valor={guarda.cpf} />
              <Info titulo="RG" valor={guarda.rg} />
              <Info titulo="Data de nascimento" valor={guarda.data_nascimento} />
              <Info titulo="Data de admissão" valor={guarda.data_admissao} />
              <Info titulo="CNH" valor={guarda.cnh} />
              <Info titulo="Categoria CNH" valor={guarda.categoria_cnh} />
              <Info titulo="Validade CNH" valor={guarda.validade_cnh} />
              <Info
                titulo="Tempo de serviço"
                valor={calcularTempoServico(guarda.data_admissao)}
              />
            </div>
          </Painel>

          <Painel titulo="Disponibilidade funcional">
            <div className="divide-y divide-slate-800">
              <LinkLinha
                titulo="Férias e licenças"
                descricao={`${stats.ferias + stats.licencas} registro(s) funcional(is)`}
                href={`/sistema/guardas/${id}/ferias-licencas`}
              />

              <LinkLinha
                titulo="Atestados médicos"
                descricao="Consultar documentos e períodos de afastamento"
                href={`/sistema/atestados?guarda_id=${id}`}
              />

              <LinkLinha
                titulo="Banco de horas"
                descricao="Créditos, débitos e compensações"
                href={`/sistema/guardas/${id}/banco-horas`}
              />
            </div>
          </Painel>
        </div>

        <div className="space-y-5 xl:col-span-7">
          <Painel
            titulo="Últimas ocorrências"
            acao={
              <Link
                href={`/sistema/guardas/${id}/ocorrencias`}
                className="text-sm font-bold text-cyan-300"
              >
                Ver todas
              </Link>
            }
          >
            <div className="space-y-3">
              {ocorrenciasGuarda.length === 0 ? (
                <EstadoVazio texto="Nenhuma ocorrência vinculada." />
              ) : (
                ocorrenciasGuarda.map((oc) => (
                  <Link
                    key={oc.id}
                    href={`/sistema/ocorrencias/${oc.id}`}
                    className="block rounded-xl border border-slate-800 bg-slate-900/40 p-4 transition hover:border-slate-600"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-bold text-white">
                        {oc.protocolo || `Ocorrência #${oc.id}`}
                      </p>

                      <span className="text-xs text-slate-500">
                        {oc.status || "-"}
                      </span>
                    </div>

                    <p className="mt-2 text-sm text-slate-300">
                      {oc.tipo || "Tipo não informado"}
                    </p>

                    <p className="mt-1 text-xs text-slate-500">
                      {oc.data || "Data não informada"}
                    </p>
                  </Link>
                ))
              )}
            </div>
          </Painel>

          <Painel
            titulo="Últimos patrulhamentos"
            acao={
              <Link
                href={`/sistema/guardas/${id}/patrulhamentos`}
                className="text-sm font-bold text-cyan-300"
              >
                Ver todos
              </Link>
            }
          >
            <div className="space-y-3">
              {patrulhamentosGuarda.length === 0 ? (
                <EstadoVazio texto="Nenhum patrulhamento encontrado." />
              ) : (
                patrulhamentosGuarda.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-xl border border-slate-800 bg-slate-900/40 p-4"
                  >
                    <p className="font-bold text-white">
                      {item.data || "Data não informada"}
                    </p>

                    <p className="mt-1 text-sm text-slate-400">
                      {item.status || "Concluído"}
                    </p>
                  </div>
                ))
              )}
            </div>
          </Painel>
        </div>
      </section>

      <section>
        <div className="mb-3">
          <h2 className="text-xl font-black">
            Áreas do dossiê
          </h2>

          <p className="mt-1 text-sm text-slate-400">
            Acesso aos registros completos do servidor.
          </p>
        </div>

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <ModuloDossie
            titulo="Documentos"
            descricao="Documentação funcional"
            href={`/sistema/guardas/${id}/documentos`}
            icone={FileText}
          />

          <ModuloDossie
            titulo="Histórico"
            descricao="Vida funcional"
            href={`/sistema/guardas/${id}/historico`}
            icone={BarChart3}
          />

          <ModuloDossie
            titulo="Cursos"
            descricao="Capacitações"
            href={`/sistema/guardas/${id}/cursos`}
            icone={GraduationCap}
          />

          <ModuloDossie
            titulo="Escalas"
            descricao="Plantões e serviços"
            href={`/sistema/guardas/${id}/escalas`}
            icone={CalendarDays}
          />

          <ModuloDossie
            titulo="Elogios"
            descricao="Reconhecimentos"
            href={`/sistema/guardas/${id}/elogios`}
            icone={Award}
          />

          <ModuloDossie
            titulo="Advertências"
            descricao="Registros disciplinares"
            href={`/sistema/guardas/${id}/advertencias`}
            icone={TriangleAlert}
          />

          <ModuloDossie
            titulo="Cautelas"
            descricao="Materiais e equipamentos"
            href={`/sistema/guardas/${id}/cautelas`}
            icone={Shield}
          />

          <ModuloDossie
            titulo="Atestados"
            descricao="Afastamentos médicos"
            href={`/sistema/atestados?guarda_id=${id}`}
            icone={HeartPulse}
          />
        </div>
      </section>
    </div>
  </main>
);
}

function Painel({
  titulo,
  children,
  acao,
}: {
  titulo: string;
  children: React.ReactNode;
  acao?: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-slate-800 bg-slate-950/70 p-5">
      <div className="mb-4 flex items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <h2 className="text-lg font-black text-white">
          {titulo}
        </h2>

        {acao}
      </div>

      {children}
    </section>
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
    <div className="rounded-lg border border-slate-800 bg-slate-900/30 p-3">
      <p className="text-xs uppercase tracking-wide text-slate-500">
        {titulo}
      </p>

      <p className="mt-1 font-semibold text-slate-200">
        {valor || "-"}
      </p>
    </div>
  );
}

function Indicador({
  titulo,
  valor,
}: {
  titulo: string;
  valor: number;
}) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-4">
      <p className="text-2xl font-black text-white">
        {valor}
      </p>

      <p className="mt-1 text-xs font-semibold text-slate-500">
        {titulo}
      </p>
    </div>
  );
}

function LinkLinha({
  titulo,
  descricao,
  href,
}: {
  titulo: string;
  descricao: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center justify-between gap-4 py-4 first:pt-0 last:pb-0"
    >
      <div>
        <p className="font-bold text-slate-200">
          {titulo}
        </p>

        <p className="mt-1 text-sm text-slate-500">
          {descricao}
        </p>
      </div>

      <span className="text-slate-600">
        →
      </span>
    </Link>
  );
}

function ModuloDossie({
  titulo,
  descricao,
  href,
  icone: Icone,
}: {
  titulo: string;
  descricao: string;
  href: string;
  icone: typeof FileText;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-950/70 p-4 transition hover:border-slate-600 hover:bg-slate-900/70"
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-900 text-cyan-300">
        <Icone className="h-5 w-5" />
      </div>

      <div className="min-w-0">
        <p className="font-bold text-white">
          {titulo}
        </p>

        <p className="mt-1 text-xs text-slate-500">
          {descricao}
        </p>
      </div>
    </Link>
  );
}

function EstadoVazio({
  texto,
}: {
  texto: string;
}) {
  return (
    <div className="rounded-xl border border-dashed border-slate-700 p-6 text-center text-sm text-slate-500">
      {texto}
    </div>
  );
}