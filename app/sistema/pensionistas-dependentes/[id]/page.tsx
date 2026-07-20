"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, CalendarDays, FileText, Loader2, Pencil, Printer, Save, Trash2, UserRound } from "lucide-react";

import ProtecaoModulo from "@/components/ProtecaoModulo";
import { registrarAuditoria } from "@/lib/auditoria";
import { formatarData, formatarDocumento, formatarTexto, lerUsuarioPensionistas, podeGerenciarPensionistas } from "@/lib/pensionistasDependentes";
import { supabase } from "@/lib/supabase";

type Registro = {
  id: number;
  servidor_nome: string;
  matricula: string | null;
  beneficiario_nome: string;
  cpf_beneficiario: string | null;
  rg_beneficiario: string | null;
  data_nascimento: string | null;
  sexo: string | null;
  tipo_registro: string;
  tipo_vinculo: string;
  status: string;
  data_inicio: string | null;
  data_fim: string | null;
  beneficio_vinculado: string | null;
  numero_processo: string | null;
  telefone: string | null;
  email: string | null;
  endereco: string | null;
  observacoes: string | null;
};

export default function PensionistaDependenteDetalhePage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = Number(params.id);
  const [usuario] = useState(() => lerUsuarioPensionistas());
  const [registro, setRegistro] = useState<Registro | null>(null);
  const [editando, setEditando] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const podeGerenciar = usuario ? podeGerenciarPensionistas(usuario.perfil) : false;

  const carregar = useCallback(async () => {
    if (!usuario?.municipio_id || !id) return;
    const { data, error } = await supabase.from("pensionistas_dependentes").select("*").eq("id", id).eq("municipio_id", usuario.municipio_id).single();
    if (error) setErro(error.message);
    setRegistro((data as Registro | null) || null);
    setCarregando(false);
  }, [id, usuario]);

  useEffect(() => { void carregar(); }, [carregar]);

  function alterar(campo: keyof Registro, valor: string) {
    setRegistro((atual) => atual ? ({ ...atual, [campo]: valor }) : atual);
  }

  async function salvar() {
    if (!registro || !usuario?.municipio_id) return;
    setSalvando(true);
    const { error } = await supabase.from("pensionistas_dependentes").update({
      servidor_nome: registro.servidor_nome,
      matricula: registro.matricula || null,
      beneficiario_nome: registro.beneficiario_nome,
      cpf_beneficiario: registro.cpf_beneficiario?.replace(/\D/g, "") || null,
      rg_beneficiario: registro.rg_beneficiario || null,
      data_nascimento: registro.data_nascimento || null,
      sexo: registro.sexo || null,
      tipo_registro: registro.tipo_registro,
      tipo_vinculo: registro.tipo_vinculo,
      status: registro.status,
      data_inicio: registro.data_inicio || null,
      data_fim: registro.data_fim || null,
      beneficio_vinculado: registro.beneficio_vinculado || null,
      numero_processo: registro.numero_processo || null,
      telefone: registro.telefone || null,
      email: registro.email || null,
      endereco: registro.endereco || null,
      observacoes: registro.observacoes || null,
      atualizado_em: new Date().toISOString(),
    }).eq("id", id).eq("municipio_id", usuario.municipio_id);
    if (error) setErro(error.message); else {
      await registrarAuditoria({ modulo: "RH", acao: "EDITAR", tabela: "pensionistas_dependentes", registro_id: id, descricao: `Atualização de ${registro.beneficiario_nome}.` });
      setEditando(false);
    }
    setSalvando(false);
  }

  async function excluir() {
    if (!registro || !usuario?.municipio_id || !window.confirm("Excluir este cadastro?")) return;
    const { error } = await supabase.from("pensionistas_dependentes").delete().eq("id", id).eq("municipio_id", usuario.municipio_id);
    if (error) { setErro(error.message); return; }
    await registrarAuditoria({ modulo: "RH", acao: "EXCLUIR", tabela: "pensionistas_dependentes", registro_id: id, descricao: `Exclusão de ${registro.beneficiario_nome}.` });
    router.push("/sistema/pensionistas-dependentes");
  }

  async function imprimir() {
    await registrarAuditoria({ modulo: "RH", acao: "IMPRIMIR", tabela: "pensionistas_dependentes", registro_id: id, descricao: "Impressão de cadastro de pensionista/dependente." });
    window.print();
  }

  if (carregando) return <div className="flex min-h-screen items-center justify-center bg-[#020b1c]"><Loader2 className="h-9 w-9 animate-spin text-cyan-300" /></div>;

  return (
    <ProtecaoModulo modulo="guardas">
      <main className="min-h-screen bg-[#020b1c] px-4 py-5 text-white print:bg-white print:text-black lg:px-7">
        <div className="mx-auto max-w-[1400px] space-y-5">
          <header className="rounded-3xl border border-cyan-400/15 bg-[#061326] p-5 print:border-black print:bg-white lg:p-7">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <Link href="/sistema/pensionistas-dependentes" className="inline-flex items-center gap-2 text-sm font-black text-cyan-300 print:hidden"><ArrowLeft className="h-4 w-4" />Voltar</Link>
              <div className="flex gap-2 print:hidden">
                <button onClick={() => void imprimir()} className="inline-flex items-center gap-2 rounded-xl border border-cyan-400/25 px-4 py-3 text-sm font-black text-cyan-300"><Printer className="h-4 w-4" />Imprimir/PDF</button>
                {podeGerenciar && !editando ? <button onClick={() => setEditando(true)} className="inline-flex items-center gap-2 rounded-xl bg-cyan-300 px-4 py-3 text-sm font-black text-slate-950"><Pencil className="h-4 w-4" />Editar</button> : null}
                {podeGerenciar && editando ? <button disabled={salvando} onClick={() => void salvar()} className="inline-flex items-center gap-2 rounded-xl bg-cyan-300 px-4 py-3 text-sm font-black text-slate-950"><Save className="h-4 w-4" />Salvar</button> : null}
                {podeGerenciar ? <button onClick={() => void excluir()} className="inline-flex items-center gap-2 rounded-xl border border-rose-400/30 px-4 py-3 text-sm font-black text-rose-300"><Trash2 className="h-4 w-4" />Excluir</button> : null}
              </div>
            </div>
            {registro ? <div className="mt-5"><p className="text-xs font-black uppercase text-cyan-300 print:text-black">{formatarTexto(registro.tipo_registro)} • {formatarTexto(registro.tipo_vinculo)}</p><h1 className="mt-1 text-2xl font-black">{registro.beneficiario_nome}</h1><p className="mt-2 text-sm text-slate-400 print:text-black">Vinculado a {registro.servidor_nome} • {formatarTexto(registro.status)}</p></div> : null}
          </header>

          {erro ? <div className="rounded-2xl border border-rose-400/25 bg-rose-400/10 p-4 text-rose-200">{erro}</div> : null}

          {registro ? editando ? (
            <section className="rounded-2xl border border-slate-800 bg-[#061326] p-5"><div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              <Campo titulo="Servidor" valor={registro.servidor_nome} onChange={(v) => alterar("servidor_nome", v)} />
              <Campo titulo="Matrícula" valor={registro.matricula || ""} onChange={(v) => alterar("matricula", v)} />
              <Campo titulo="Beneficiário" valor={registro.beneficiario_nome} onChange={(v) => alterar("beneficiario_nome", v)} />
              <Campo titulo="CPF" valor={registro.cpf_beneficiario || ""} onChange={(v) => alterar("cpf_beneficiario", v)} />
              <Campo titulo="RG" valor={registro.rg_beneficiario || ""} onChange={(v) => alterar("rg_beneficiario", v)} />
              <Campo titulo="Nascimento" tipo="date" valor={registro.data_nascimento || ""} onChange={(v) => alterar("data_nascimento", v)} />
              <Campo titulo="Tipo" valor={registro.tipo_registro} onChange={(v) => alterar("tipo_registro", v)} />
              <Campo titulo="Vínculo" valor={registro.tipo_vinculo} onChange={(v) => alterar("tipo_vinculo", v)} />
              <Campo titulo="Status" valor={registro.status} onChange={(v) => alterar("status", v)} />
              <Campo titulo="Início" tipo="date" valor={registro.data_inicio || ""} onChange={(v) => alterar("data_inicio", v)} />
              <Campo titulo="Fim" tipo="date" valor={registro.data_fim || ""} onChange={(v) => alterar("data_fim", v)} />
              <Campo titulo="Benefício" valor={registro.beneficio_vinculado || ""} onChange={(v) => alterar("beneficio_vinculado", v)} />
              <Campo titulo="Processo" valor={registro.numero_processo || ""} onChange={(v) => alterar("numero_processo", v)} />
              <Campo titulo="Telefone" valor={registro.telefone || ""} onChange={(v) => alterar("telefone", v)} />
              <Campo titulo="E-mail" valor={registro.email || ""} onChange={(v) => alterar("email", v)} />
              <Campo titulo="Endereço" valor={registro.endereco || ""} onChange={(v) => alterar("endereco", v)} />
              <label className="md:col-span-2 xl:col-span-3"><span className="mb-2 block text-xs font-black uppercase text-slate-400">Observações</span><textarea rows={5} value={registro.observacoes || ""} onChange={(e) => alterar("observacoes", e.target.value)} className="w-full rounded-xl border border-slate-700 bg-slate-950/40 px-4 py-3 outline-none" /></label>
            </div></section>
          ) : (
            <>
              <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <Card titulo="CPF" valor={formatarDocumento(registro.cpf_beneficiario)} icone={UserRound} />
                <Card titulo="Nascimento" valor={formatarData(registro.data_nascimento)} icone={CalendarDays} />
                <Card titulo="Vigência" valor={`${formatarData(registro.data_inicio)} a ${formatarData(registro.data_fim)}`} icone={CalendarDays} />
                <Card titulo="Processo" valor={registro.numero_processo || "—"} icone={FileText} />
              </section>
              <section className="grid gap-5 lg:grid-cols-2">
                <Bloco titulo="Dados pessoais" texto={`RG: ${registro.rg_beneficiario || "—"}\nSexo: ${formatarTexto(registro.sexo)}\nTelefone: ${registro.telefone || "—"}\nE-mail: ${registro.email || "—"}\nEndereço: ${registro.endereco || "—"}`} />
                <Bloco titulo="Benefício e observações" texto={`Benefício vinculado: ${registro.beneficio_vinculado || "—"}\n\n${registro.observacoes || "Nenhuma observação."}`} />
              </section>
            </>
          ) : null}
        </div>
      </main>
    </ProtecaoModulo>
  );
}

function Campo({ titulo, valor, onChange, tipo = "text" }: { titulo: string; valor: string; onChange: (valor: string) => void; tipo?: string }) {
  return <label><span className="mb-2 block text-xs font-black uppercase text-slate-400">{titulo}</span><input type={tipo} value={valor} onChange={(e) => onChange(e.target.value)} className="h-12 w-full rounded-xl border border-slate-700 bg-slate-950/40 px-4 outline-none focus:border-cyan-400" /></label>;
}
function Card({ titulo, valor, icone: Icone }: { titulo: string; valor: string; icone: typeof UserRound }) {
  return <div className="rounded-2xl border border-slate-800 bg-[#061326] p-5 print:border-black print:bg-white"><Icone className="h-5 w-5 text-cyan-300 print:text-black" /><p className="mt-3 text-[10px] font-black uppercase text-slate-500 print:text-black">{titulo}</p><p className="mt-1 font-black">{valor}</p></div>;
}
function Bloco({ titulo, texto }: { titulo: string; texto: string }) {
  return <section className="rounded-2xl border border-slate-800 bg-[#061326] p-5 print:border-black print:bg-white"><h2 className="font-black">{titulo}</h2><p className="mt-3 whitespace-pre-wrap text-sm text-slate-400 print:text-black">{texto}</p></section>;
}
