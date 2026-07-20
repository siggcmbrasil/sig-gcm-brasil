"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2, Save } from "lucide-react";

import ProtecaoModulo from "@/components/ProtecaoModulo";
import { registrarAuditoria } from "@/lib/auditoria";
import { lerUsuarioPensionistas } from "@/lib/pensionistasDependentes";
import { supabase } from "@/lib/supabase";

type Guarda = { id: number; nome: string; matricula: string | null };

const inicial = {
  guarda_id: "",
  servidor_nome: "",
  matricula: "",
  beneficiario_nome: "",
  cpf_beneficiario: "",
  rg_beneficiario: "",
  data_nascimento: "",
  sexo: "",
  tipo_registro: "DEPENDENTE",
  tipo_vinculo: "FILHO_A",
  status: "ATIVO",
  data_inicio: "",
  data_fim: "",
  beneficio_vinculado: "",
  numero_processo: "",
  telefone: "",
  email: "",
  endereco: "",
  observacoes: "",
};

export default function NovoPensionistaDependentePage() {
  const router = useRouter();
  const [usuario] = useState(() => lerUsuarioPensionistas());
  const [guardas, setGuardas] = useState<Guarda[]>([]);
  const [form, setForm] = useState(inicial);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");

  useEffect(() => {
    async function carregarGuardas() {
      if (!usuario?.municipio_id) return;
      const { data } = await supabase.from("guardas").select("id,nome,matricula").eq("municipio_id", usuario.municipio_id).order("nome");
      setGuardas((data as Guarda[] | null) || []);
    }
    void carregarGuardas();
  }, [usuario]);

  function alterar(campo: keyof typeof inicial, valor: string) {
    setForm((atual) => ({ ...atual, [campo]: valor }));
  }

  function selecionarGuarda(valor: string) {
    const guarda = guardas.find((item) => String(item.id) === valor);
    setForm((atual) => ({ ...atual, guarda_id: valor, servidor_nome: guarda?.nome || "", matricula: guarda?.matricula || "" }));
  }

  async function salvar(event: React.FormEvent) {
    event.preventDefault();
    if (!usuario?.municipio_id) return;
    if (!form.servidor_nome.trim() || !form.beneficiario_nome.trim()) {
      setErro("Informe o servidor e o beneficiário.");
      return;
    }

    setSalvando(true);
    setErro("");
    const payload = {
      municipio_id: usuario.municipio_id,
      guarda_id: form.guarda_id ? Number(form.guarda_id) : null,
      servidor_nome: form.servidor_nome.trim(),
      matricula: form.matricula.trim() || null,
      beneficiario_nome: form.beneficiario_nome.trim(),
      cpf_beneficiario: form.cpf_beneficiario.replace(/\D/g, "") || null,
      rg_beneficiario: form.rg_beneficiario.trim() || null,
      data_nascimento: form.data_nascimento || null,
      sexo: form.sexo || null,
      tipo_registro: form.tipo_registro,
      tipo_vinculo: form.tipo_vinculo,
      status: form.status,
      data_inicio: form.data_inicio || null,
      data_fim: form.data_fim || null,
      beneficio_vinculado: form.beneficio_vinculado.trim() || null,
      numero_processo: form.numero_processo.trim() || null,
      telefone: form.telefone.trim() || null,
      email: form.email.trim() || null,
      endereco: form.endereco.trim() || null,
      observacoes: form.observacoes.trim() || null,
      criado_por: String(usuario.id),
    };

    const { data, error } = await supabase.from("pensionistas_dependentes").insert(payload).select("id").single();
    if (error) {
      setErro(error.message);
      setSalvando(false);
      return;
    }

    await registrarAuditoria({ modulo: "RH", acao: "CRIAR", tabela: "pensionistas_dependentes", registro_id: data.id, descricao: `Cadastro de ${form.beneficiario_nome}.` });
    router.push(`/sistema/pensionistas-dependentes/${data.id}`);
  }

  return (
    <ProtecaoModulo modulo="guardas">
      <main className="min-h-screen bg-[#020b1c] px-4 py-5 text-white lg:px-7">
        <form onSubmit={salvar} className="mx-auto max-w-[1250px] space-y-5">
          <header className="rounded-3xl border border-cyan-400/15 bg-[#061326] p-5 lg:p-7">
            <Link href="/sistema/pensionistas-dependentes" className="inline-flex items-center gap-2 text-sm font-black text-cyan-300"><ArrowLeft className="h-4 w-4" />Voltar</Link>
            <h1 className="mt-5 text-2xl font-black">Novo pensionista ou dependente</h1>
            <p className="mt-2 text-sm text-slate-400">Cadastre o vínculo familiar, previdenciário e documental.</p>
          </header>

          {erro ? <div className="rounded-2xl border border-rose-400/25 bg-rose-400/10 p-4 text-rose-200">{erro}</div> : null}

          <Secao titulo="Servidor vinculado">
            <CampoSelect titulo="Selecionar servidor" valor={form.guarda_id} onChange={selecionarGuarda} opcoes={[['','Selecione...'], ...guardas.map((g) => [String(g.id), `${g.nome}${g.matricula ? ` • ${g.matricula}` : ''}`])]} />
            <Campo titulo="Nome do servidor" valor={form.servidor_nome} onChange={(v) => alterar("servidor_nome", v)} obrigatorio />
            <Campo titulo="Matrícula" valor={form.matricula} onChange={(v) => alterar("matricula", v)} />
          </Secao>

          <Secao titulo="Beneficiário">
            <Campo titulo="Nome completo" valor={form.beneficiario_nome} onChange={(v) => alterar("beneficiario_nome", v)} obrigatorio />
            <Campo titulo="CPF" valor={form.cpf_beneficiario} onChange={(v) => alterar("cpf_beneficiario", v)} />
            <Campo titulo="RG" valor={form.rg_beneficiario} onChange={(v) => alterar("rg_beneficiario", v)} />
            <Campo titulo="Data de nascimento" tipo="date" valor={form.data_nascimento} onChange={(v) => alterar("data_nascimento", v)} />
            <CampoSelect titulo="Sexo" valor={form.sexo} onChange={(v) => alterar("sexo", v)} opcoes={[["","Não informado"],["FEMININO","Feminino"],["MASCULINO","Masculino"],["OUTRO","Outro"]]} />
            <CampoSelect titulo="Tipo de registro" valor={form.tipo_registro} onChange={(v) => alterar("tipo_registro", v)} opcoes={[["DEPENDENTE","Dependente"],["PENSIONISTA","Pensionista"]]} />
            <CampoSelect titulo="Vínculo" valor={form.tipo_vinculo} onChange={(v) => alterar("tipo_vinculo", v)} opcoes={[["CONJUGE","Cônjuge"],["COMPANHEIRO_A","Companheiro(a)"],["FILHO_A","Filho(a)"],["ENTEADO_A","Enteado(a)"],["PAI_MAE","Pai/Mãe"],["TUTELADO_A","Tutelado(a)"],["OUTRO","Outro"]]} />
            <CampoSelect titulo="Status" valor={form.status} onChange={(v) => alterar("status", v)} opcoes={[["ATIVO","Ativo"],["SUSPENSO","Suspenso"],["ENCERRADO","Encerrado"],["EM_ANALISE","Em análise"]]} />
          </Secao>

          <Secao titulo="Vigência e benefício">
            <Campo titulo="Data de início" tipo="date" valor={form.data_inicio} onChange={(v) => alterar("data_inicio", v)} />
            <Campo titulo="Data de término" tipo="date" valor={form.data_fim} onChange={(v) => alterar("data_fim", v)} />
            <Campo titulo="Benefício vinculado" valor={form.beneficio_vinculado} onChange={(v) => alterar("beneficio_vinculado", v)} />
            <Campo titulo="Número do processo" valor={form.numero_processo} onChange={(v) => alterar("numero_processo", v)} />
          </Secao>

          <Secao titulo="Contato e observações">
            <Campo titulo="Telefone" valor={form.telefone} onChange={(v) => alterar("telefone", v)} />
            <Campo titulo="E-mail" tipo="email" valor={form.email} onChange={(v) => alterar("email", v)} />
            <Campo titulo="Endereço" valor={form.endereco} onChange={(v) => alterar("endereco", v)} />
            <label className="md:col-span-2 xl:col-span-3"><span className="mb-2 block text-xs font-black uppercase text-slate-400">Observações</span><textarea value={form.observacoes} onChange={(e) => alterar("observacoes", e.target.value)} rows={5} className="w-full rounded-xl border border-slate-700 bg-slate-950/40 px-4 py-3 outline-none focus:border-cyan-400" /></label>
          </Secao>

          <button disabled={salvando} className="inline-flex items-center gap-2 rounded-xl bg-cyan-300 px-5 py-3 font-black text-slate-950 disabled:opacity-50">{salvando ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}Salvar cadastro</button>
        </form>
      </main>
    </ProtecaoModulo>
  );
}

function Secao({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return <section className="rounded-2xl border border-slate-800 bg-[#061326] p-5"><h2 className="font-black">{titulo}</h2><div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">{children}</div></section>;
}
function Campo({ titulo, valor, onChange, tipo = "text", obrigatorio = false }: { titulo: string; valor: string; onChange: (valor: string) => void; tipo?: string; obrigatorio?: boolean }) {
  return <label><span className="mb-2 block text-xs font-black uppercase text-slate-400">{titulo}</span><input required={obrigatorio} type={tipo} value={valor} onChange={(e) => onChange(e.target.value)} className="h-12 w-full rounded-xl border border-slate-700 bg-slate-950/40 px-4 outline-none focus:border-cyan-400" /></label>;
}
function CampoSelect({ titulo, valor, onChange, opcoes }: { titulo: string; valor: string; onChange: (valor: string) => void; opcoes: string[][] }) {
  return <label><span className="mb-2 block text-xs font-black uppercase text-slate-400">{titulo}</span><select value={valor} onChange={(e) => onChange(e.target.value)} className="h-12 w-full rounded-xl border border-slate-700 bg-slate-950/40 px-4 outline-none focus:border-cyan-400">{opcoes.map(([v, t]) => <option key={v} value={v}>{t}</option>)}</select></label>;
}
