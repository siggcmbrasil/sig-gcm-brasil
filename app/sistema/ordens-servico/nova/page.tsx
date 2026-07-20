"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  CalendarDays,
  ClipboardList,
  Loader2,
  MapPin,
  Save,
  Shield,
  Users,
} from "lucide-react";

import { supabase } from "@/lib/supabase";
import { registrarAuditoria } from "@/lib/auditoria";
import { lerUsuarioOS, podeGerenciarOS } from "@/lib/ordemServico";

type Guarda = { id: number; nome: string; matricula: string | null };
type Viatura = { id: number; prefixo: string; modelo: string | null; placa: string | null };

function hoje() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Bahia",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

export default function NovaOrdemServicoPage() {
  const router = useRouter();
  const [usuario] = useState(() => lerUsuarioOS());
  const [guardas, setGuardas] = useState<Guarda[]>([]);
  const [viaturas, setViaturas] = useState<Viatura[]>([]);
  const [selecionados, setSelecionados] = useState<number[]>([]);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");
  const [form, setForm] = useState({
    titulo: "",
    missao: "",
    objetivo: "",
    prioridade: "NORMAL",
    status: "RASCUNHO",
    data_inicio: hoje(),
    hora_inicio: "07:00",
    data_fim: "",
    hora_fim: "",
    local: "",
    endereco: "",
    ponto_referencia: "",
    comandante_nome: "",
    equipe: "",
    viatura_id: "",
    instrucoes: "",
    observacoes: "",
  });

  useEffect(() => {
    if (!usuario?.municipio_id || !podeGerenciarOS(usuario.perfil)) {
      router.replace("/sistema/ordens-servico");
      return;
    }

    void Promise.all([
      supabase
        .from("guardas")
        .select("id,nome,matricula")
        .eq("municipio_id", usuario.municipio_id)
        .order("nome"),
      supabase
        .from("viaturas")
        .select("id,prefixo,modelo,placa")
        .eq("municipio_id", usuario.municipio_id)
        .order("prefixo"),
    ]).then(([guardasResposta, viaturasResposta]) => {
      setGuardas((guardasResposta.data as Guarda[] | null) || []);
      setViaturas((viaturasResposta.data as Viatura[] | null) || []);
    });
  }, [router, usuario]);

  const viaturaSelecionada = useMemo(
    () => viaturas.find((item) => String(item.id) === form.viatura_id),
    [form.viatura_id, viaturas]
  );

  function alterar(campo: keyof typeof form, valor: string) {
    setForm((atual) => ({ ...atual, [campo]: valor }));
  }

  function alternarGuarda(id: number) {
    setSelecionados((atuais) =>
      atuais.includes(id) ? atuais.filter((item) => item !== id) : [...atuais, id]
    );
  }

  async function salvar() {
    if (!usuario?.municipio_id) return;

    if (!form.titulo.trim() || !form.missao.trim() || !form.data_inicio) {
      setErro("Preencha título, missão e data de início.");
      return;
    }

    setSalvando(true);
    setErro("");

    try {
      const ano = new Date(`${form.data_inicio}T12:00:00`).getFullYear();
      const ultima = await supabase
        .from("ordens_servico")
        .select("id")
        .eq("municipio_id", usuario.municipio_id)
        .order("id", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (ultima.error && ultima.error.code === "42P01") {
        throw new Error("Execute primeiro o arquivo supabase/ORDEM_SERVICO.sql.");
      }

      const sequencia = Number(ultima.data?.id || 0) + 1;
      const numero = `OS-${ano}-${String(sequencia).padStart(5, "0")}`;

      const { data: ordem, error } = await supabase
        .from("ordens_servico")
        .insert({
          municipio_id: usuario.municipio_id,
          numero,
          titulo: form.titulo.trim(),
          missao: form.missao.trim(),
          objetivo: form.objetivo.trim() || null,
          prioridade: form.prioridade,
          status: form.status,
          data_inicio: form.data_inicio,
          hora_inicio: form.hora_inicio || null,
          data_fim: form.data_fim || null,
          hora_fim: form.hora_fim || null,
          local: form.local.trim() || null,
          endereco: form.endereco.trim() || null,
          ponto_referencia: form.ponto_referencia.trim() || null,
          comandante_nome: form.comandante_nome.trim() || usuario.nome,
          equipe: form.equipe.trim() || null,
          viatura_id: form.viatura_id ? Number(form.viatura_id) : null,
          viatura_descricao: viaturaSelecionada
            ? `${viaturaSelecionada.prefixo} • ${viaturaSelecionada.modelo || ""} • ${viaturaSelecionada.placa || ""}`
            : null,
          instrucoes: form.instrucoes.trim() || null,
          observacoes: form.observacoes.trim() || null,
          criado_por: Number(usuario.id),
          criado_por_nome: usuario.nome,
          publicado_em: form.status === "PUBLICADA" ? new Date().toISOString() : null,
        })
        .select("id")
        .single();

      if (error) throw error;

      const designados = guardas
        .filter((guarda) => selecionados.includes(guarda.id))
        .map((guarda) => ({
          municipio_id: usuario.municipio_id,
          ordem_servico_id: ordem.id,
          guarda_id: guarda.id,
          guarda_nome: guarda.nome,
          matricula: guarda.matricula,
        }));

      if (designados.length > 0) {
        const respostaDesignados = await supabase
          .from("ordens_servico_designados")
          .insert(designados);
        if (respostaDesignados.error) throw respostaDesignados.error;
      }

      await supabase.from("ordens_servico_historico").insert({
        municipio_id: usuario.municipio_id,
        ordem_servico_id: ordem.id,
        usuario_id: Number(usuario.id),
        usuario_nome: usuario.nome,
        acao: "CRIACAO",
        status_novo: form.status,
        descricao: `Ordem ${numero} criada.`,
      });

      await registrarAuditoria({
        modulo: "Ordem de Serviço",
        acao: "CRIAR",
        descricao: `Criou a ordem de serviço ${numero}.`,
        tabela: "ordens_servico",
        registro_id: ordem.id,
        detalhes: { numero, status: form.status, designados: selecionados.length },
      });

      router.push(`/sistema/ordens-servico/${ordem.id}`);
    } catch (error) {
      setErro(error instanceof Error ? error.message : "Não foi possível salvar.");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#020b1c] px-4 py-5 text-white lg:px-7">
      <div className="mx-auto max-w-[1500px] space-y-5">
        <header className="rounded-3xl border border-cyan-400/15 bg-gradient-to-br from-[#07182f] to-[#020b1c] p-5 lg:p-7">
          <button onClick={() => router.back()} className="mb-4 inline-flex items-center gap-2 text-sm font-black text-slate-400 hover:text-cyan-300">
            <ArrowLeft className="h-4 w-4" /> Voltar
          </button>
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-cyan-400/25 bg-cyan-400/10 text-cyan-300">
              <ClipboardList className="h-7 w-7" />
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-[0.2em] text-cyan-300">Comando operacional</p>
              <h1 className="mt-1 text-2xl font-black">Nova Ordem de Serviço</h1>
            </div>
          </div>
        </header>

        {erro ? <div className="rounded-2xl border border-rose-400/25 bg-rose-400/10 p-4 text-sm text-rose-200">{erro}</div> : null}

        <Bloco titulo="Identificação da missão" icone={ClipboardList}>
          <div className="grid gap-4 lg:grid-cols-2">
            <Campo label="Título *" value={form.titulo} onChange={(v) => alterar("titulo", v)} />
            <Select label="Prioridade" value={form.prioridade} onChange={(v) => alterar("prioridade", v)} options={["BAIXA","NORMAL","ALTA","URGENTE"]} />
            <Area label="Missão *" value={form.missao} onChange={(v) => alterar("missao", v)} className="lg:col-span-2" />
            <Area label="Objetivo" value={form.objetivo} onChange={(v) => alterar("objetivo", v)} className="lg:col-span-2" />
          </div>
        </Bloco>

        <Bloco titulo="Data, horário e local" icone={CalendarDays}>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Campo label="Data de início *" type="date" value={form.data_inicio} onChange={(v) => alterar("data_inicio", v)} />
            <Campo label="Hora de início" type="time" value={form.hora_inicio} onChange={(v) => alterar("hora_inicio", v)} />
            <Campo label="Data final" type="date" value={form.data_fim} onChange={(v) => alterar("data_fim", v)} />
            <Campo label="Hora final" type="time" value={form.hora_fim} onChange={(v) => alterar("hora_fim", v)} />
            <Campo label="Local" value={form.local} onChange={(v) => alterar("local", v)} />
            <Campo label="Endereço" value={form.endereco} onChange={(v) => alterar("endereco", v)} />
            <Campo label="Ponto de referência" value={form.ponto_referencia} onChange={(v) => alterar("ponto_referencia", v)} className="sm:col-span-2" />
          </div>
        </Bloco>

        <Bloco titulo="Responsáveis e recursos" icone={Shield}>
          <div className="grid gap-4 lg:grid-cols-2">
            <Campo label="Comandante da operação" value={form.comandante_nome} onChange={(v) => alterar("comandante_nome", v)} />
            <Campo label="Equipe / guarnição" value={form.equipe} onChange={(v) => alterar("equipe", v)} />
            <label className="block">
              <span className="mb-2 block text-xs font-black uppercase tracking-wider text-slate-500">Viatura</span>
              <select value={form.viatura_id} onChange={(e) => alterar("viatura_id", e.target.value)} className="h-12 w-full rounded-xl border border-slate-700 bg-slate-950/60 px-4 outline-none">
                <option value="">Sem viatura vinculada</option>
                {viaturas.map((item) => (
                  <option key={item.id} value={item.id}>{item.prefixo} • {item.modelo || ""} • {item.placa || ""}</option>
                ))}
              </select>
            </label>
            <Select label="Status inicial" value={form.status} onChange={(v) => alterar("status", v)} options={["RASCUNHO","PUBLICADA"]} />
          </div>
        </Bloco>

        <Bloco titulo="Guardas designados" icone={Users}>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {guardas.map((guarda) => (
              <button
                type="button"
                key={guarda.id}
                onClick={() => alternarGuarda(guarda.id)}
                className={`rounded-2xl border p-4 text-left ${
                  selecionados.includes(guarda.id)
                    ? "border-cyan-400/35 bg-cyan-400/10"
                    : "border-slate-800 bg-slate-950/40"
                }`}
              >
                <p className="font-black">{guarda.nome}</p>
                <p className="mt-1 text-xs text-slate-500">Matrícula: {guarda.matricula || "Não informada"}</p>
              </button>
            ))}
          </div>
        </Bloco>

        <Bloco titulo="Instruções e observações" icone={MapPin}>
          <div className="grid gap-4 lg:grid-cols-2">
            <Area label="Instruções operacionais" value={form.instrucoes} onChange={(v) => alterar("instrucoes", v)} />
            <Area label="Observações internas" value={form.observacoes} onChange={(v) => alterar("observacoes", v)} />
          </div>
        </Bloco>

        <div className="sticky bottom-4 flex justify-end">
          <button
            onClick={() => void salvar()}
            disabled={salvando}
            className="inline-flex items-center gap-2 rounded-xl bg-cyan-400 px-6 py-4 font-black text-slate-950 shadow-xl disabled:opacity-50"
          >
            {salvando ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
            Salvar ordem
          </button>
        </div>
      </div>
    </main>
  );
}

function Bloco({ titulo, icone: Icone, children }: { titulo: string; icone: typeof Shield; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-slate-800 bg-[#061326] p-5">
      <div className="mb-5 flex items-center gap-3 border-b border-slate-800 pb-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-cyan-400/20 bg-cyan-400/[0.07] text-cyan-300"><Icone className="h-5 w-5" /></div>
        <h2 className="font-black">{titulo}</h2>
      </div>
      {children}
    </section>
  );
}

function Campo({ label, value, onChange, type = "text", className = "" }: { label: string; value: string; onChange: (value: string) => void; type?: string; className?: string }) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-2 block text-xs font-black uppercase tracking-wider text-slate-500">{label}</span>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} className="h-12 w-full rounded-xl border border-slate-700 bg-slate-950/60 px-4 outline-none focus:border-cyan-400/40" />
    </label>
  );
}

function Area({ label, value, onChange, className = "" }: { label: string; value: string; onChange: (value: string) => void; className?: string }) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-2 block text-xs font-black uppercase tracking-wider text-slate-500">{label}</span>
      <textarea value={value} onChange={(e) => onChange(e.target.value)} rows={5} className="w-full rounded-xl border border-slate-700 bg-slate-950/60 p-4 outline-none focus:border-cyan-400/40" />
    </label>
  );
}

function Select({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: string[] }) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-black uppercase tracking-wider text-slate-500">{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)} className="h-12 w-full rounded-xl border border-slate-700 bg-slate-950/60 px-4 outline-none">
        {options.map((item) => <option key={item} value={item}>{item.replaceAll("_", " ")}</option>)}
      </select>
    </label>
  );
}
