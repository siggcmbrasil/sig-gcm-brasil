"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  Baby,
  FilePlus2,
  HeartHandshake,
  Loader2,
  Printer,
  RefreshCw,
  Search,
  UsersRound,
} from "lucide-react";

import ProtecaoModulo from "@/components/ProtecaoModulo";
import { registrarAuditoria } from "@/lib/auditoria";
import {
  formatarData,
  formatarDocumento,
  formatarTexto,
  lerUsuarioPensionistas,
  podeGerenciarPensionistas,
} from "@/lib/pensionistasDependentes";
import { supabase } from "@/lib/supabase";

type Registro = {
  id: number;
  guarda_id: number | null;
  servidor_nome: string;
  matricula: string | null;
  beneficiario_nome: string;
  cpf_beneficiario: string | null;
  tipo_vinculo: string;
  tipo_registro: string;
  status: string;
  data_nascimento: string | null;
  data_inicio: string | null;
  data_fim: string | null;
};

export default function PensionistasDependentesPage() {
  const [usuario] = useState(() => lerUsuarioPensionistas());
  const [registros, setRegistros] = useState<Registro[]>([]);
  const [busca, setBusca] = useState("");
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  const podeGerenciar = usuario ? podeGerenciarPensionistas(usuario.perfil) : false;

  const carregar = useCallback(async () => {
    if (!usuario?.municipio_id) {
      setErro("Sessão ou município não identificado.");
      setCarregando(false);
      return;
    }

    setCarregando(true);
    setErro("");
    const { data, error } = await supabase
      .from("pensionistas_dependentes")
      .select("id,guarda_id,servidor_nome,matricula,beneficiario_nome,cpf_beneficiario,tipo_vinculo,tipo_registro,status,data_nascimento,data_inicio,data_fim")
      .eq("municipio_id", usuario.municipio_id)
      .order("beneficiario_nome", { ascending: true });

    if (error) setErro(error.message);
    setRegistros((data as Registro[] | null) || []);
    setCarregando(false);
  }, [usuario]);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  const filtrados = useMemo(() => {
    const termo = busca.toLowerCase().trim();
    return registros.filter((item) =>
      `${item.servidor_nome} ${item.matricula || ""} ${item.beneficiario_nome} ${item.cpf_beneficiario || ""} ${item.tipo_vinculo} ${item.tipo_registro} ${item.status}`
        .toLowerCase()
        .includes(termo)
    );
  }, [busca, registros]);

  const ativos = registros.filter((item) => item.status === "ATIVO").length;
  const dependentes = registros.filter((item) => item.tipo_registro === "DEPENDENTE").length;
  const pensionistas = registros.filter((item) => item.tipo_registro === "PENSIONISTA").length;

  async function imprimir() {
    await registrarAuditoria({
      modulo: "RH",
      acao: "IMPRIMIR",
      tabela: "pensionistas_dependentes",
      descricao: "Impressão do painel de pensionistas e dependentes.",
    });
    window.print();
  }

  return (
    <ProtecaoModulo modulo="guardas">
      <main className="min-h-screen bg-[#020b1c] px-4 py-5 text-white print:bg-white print:text-black lg:px-7">
        <div className="mx-auto max-w-[1650px] space-y-5">
          <header className="rounded-3xl border border-cyan-400/15 bg-gradient-to-br from-[#07182f] to-[#020b1c] p-5 print:border-black print:bg-white lg:p-7">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.22em] text-cyan-300 print:text-black">Gestão familiar e previdenciária</p>
                <h1 className="mt-1 text-2xl font-black lg:text-3xl">Pensionistas e Dependentes</h1>
                <p className="mt-2 text-sm text-slate-400 print:text-black">Cadastros, vínculos, documentos, vigências, benefícios e acompanhamento familiar.</p>
              </div>
              <div className="flex flex-wrap gap-3 print:hidden">
                <button onClick={() => void carregar()} className="inline-flex items-center gap-2 rounded-xl border border-slate-700 px-4 py-3 text-sm font-black"><RefreshCw className="h-4 w-4" />Atualizar</button>
                <button onClick={() => void imprimir()} className="inline-flex items-center gap-2 rounded-xl border border-cyan-400/25 bg-cyan-400/10 px-4 py-3 text-sm font-black text-cyan-300"><Printer className="h-4 w-4" />Imprimir/PDF</button>
                {podeGerenciar ? <Link href="/sistema/pensionistas-dependentes/novo" className="inline-flex items-center gap-2 rounded-xl bg-cyan-300 px-4 py-3 text-sm font-black text-slate-950"><FilePlus2 className="h-4 w-4" />Novo cadastro</Link> : null}
              </div>
            </div>
          </header>

          {erro ? <div className="rounded-2xl border border-rose-400/25 bg-rose-400/10 p-4 text-rose-200">{erro}</div> : null}

          <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <Metrica titulo="Cadastros" valor={String(registros.length)} icone={UsersRound} />
            <Metrica titulo="Ativos" valor={String(ativos)} icone={HeartHandshake} />
            <Metrica titulo="Dependentes" valor={String(dependentes)} icone={Baby} />
            <Metrica titulo="Pensionistas" valor={String(pensionistas)} icone={UsersRound} />
          </section>

          <label className="flex items-center gap-3 rounded-xl border border-slate-700 bg-[#061326] px-4 print:hidden">
            <Search className="h-4 w-4 text-slate-500" />
            <input value={busca} onChange={(event) => setBusca(event.target.value)} placeholder="Buscar servidor, matrícula, beneficiário, CPF, vínculo ou status..." className="h-12 w-full bg-transparent outline-none" />
          </label>

          {carregando ? <div className="flex min-h-[300px] items-center justify-center"><Loader2 className="h-9 w-9 animate-spin text-cyan-300" /></div> : (
            <section className="grid gap-4 xl:grid-cols-2">
              {filtrados.map((item) => (
                <article key={item.id} className="rounded-2xl border border-slate-800 bg-[#061326] p-5 print:border-black print:bg-white">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs font-black uppercase tracking-wider text-cyan-300 print:text-black">{formatarTexto(item.tipo_registro)} • {formatarTexto(item.tipo_vinculo)}</p>
                      <h2 className="mt-1 text-lg font-black">{item.beneficiario_nome}</h2>
                      <p className="mt-1 text-sm text-slate-500 print:text-black">Vinculado a {item.servidor_nome} • Matrícula {item.matricula || "não informada"}</p>
                    </div>
                    <span className="rounded-lg border border-cyan-400/20 bg-cyan-400/10 px-3 py-2 text-[10px] font-black uppercase text-cyan-300 print:text-black">{formatarTexto(item.status)}</span>
                  </div>
                  <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4">
                    <Info titulo="CPF" valor={formatarDocumento(item.cpf_beneficiario)} />
                    <Info titulo="Nascimento" valor={formatarData(item.data_nascimento)} />
                    <Info titulo="Início" valor={formatarData(item.data_inicio)} />
                    <Info titulo="Fim" valor={formatarData(item.data_fim)} />
                  </div>
                  <Link href={`/sistema/pensionistas-dependentes/${item.id}`} className="mt-4 inline-flex items-center gap-2 rounded-xl bg-cyan-300 px-4 py-3 text-sm font-black text-slate-950 print:hidden">Abrir cadastro<ArrowRight className="h-4 w-4" /></Link>
                </article>
              ))}
              {!filtrados.length ? <div className="rounded-2xl border border-slate-800 bg-[#061326] p-14 text-center text-slate-500 xl:col-span-2">Nenhum pensionista ou dependente cadastrado.</div> : null}
            </section>
          )}
        </div>
      </main>
    </ProtecaoModulo>
  );
}

function Metrica({ titulo, valor, icone: Icone }: { titulo: string; valor: string; icone: typeof UsersRound }) {
  return <div className="rounded-2xl border border-slate-800 bg-[#061326] p-5 print:border-black print:bg-white"><Icone className="h-6 w-6 text-cyan-300 print:text-black" /><p className="mt-4 text-[10px] font-black uppercase text-slate-500 print:text-black">{titulo}</p><p className="mt-1 text-xl font-black">{valor}</p></div>;
}

function Info({ titulo, valor }: { titulo: string; valor: string }) {
  return <div className="rounded-xl border border-slate-800 bg-slate-950/30 p-3 text-center print:border-black print:bg-white"><p className="text-[10px] font-black uppercase text-slate-500 print:text-black">{titulo}</p><p className="mt-1 text-sm font-black">{valor}</p></div>;
}
