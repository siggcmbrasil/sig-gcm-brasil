"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowLeft, Loader2, Save } from "lucide-react";
import { useRouter } from "next/navigation";

import ProtecaoModulo from "@/components/ProtecaoModulo";
import { registrarAuditoria } from "@/lib/auditoria";
import { lerUsuarioEstagio, podeGerenciarEstagio } from "@/lib/estagioProbatorio";
import { supabase } from "@/lib/supabase";

type Guarda = { id: number; nome: string; matricula: string | null };

export default function NovoEstagioPage() {
  const router = useRouter();
  const [usuario] = useState(() => lerUsuarioEstagio());
  const [guardas, setGuardas] = useState<Guarda[]>([]);
  const [guardaId, setGuardaId] = useState("");
  const [dataExercicio, setDataExercicio] = useState("");
  const [meses, setMeses] = useState("36");
  const [totalEtapas, setTotalEtapas] = useState("3");
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");

  useEffect(() => {
    async function carregarGuardas() {
      if (!usuario?.municipio_id) return;
      const { data } = await supabase
        .from("guardas")
        .select("id,nome,matricula")
        .eq("municipio_id", usuario.municipio_id)
        .order("nome");
      setGuardas((data as Guarda[] | null) || []);
    }
    void carregarGuardas();
  }, [usuario]);

  async function salvar() {
    if (!usuario?.municipio_id || !podeGerenciarEstagio(usuario.perfil)) {
      setErro("Seu perfil não pode cadastrar estágio probatório.");
      return;
    }

    const guarda = guardas.find((item) => item.id === Number(guardaId));
    if (!guarda || !dataExercicio) {
      setErro("Selecione o servidor e informe a data de exercício.");
      return;
    }

    setSalvando(true);
    setErro("");

    const inicio = new Date(`${dataExercicio}T12:00:00`);
    const termino = new Date(inicio);
    termino.setMonth(termino.getMonth() + Number(meses || 36));

    const { data, error } = await supabase
      .from("estagios_probatorios")
      .insert({
        municipio_id: usuario.municipio_id,
        guarda_id: guarda.id,
        guarda_nome: guarda.nome,
        matricula: guarda.matricula,
        data_exercicio: dataExercicio,
        data_prevista_termino: termino.toISOString().slice(0, 10),
        meses_probatorio: Number(meses || 36),
        total_etapas: Number(totalEtapas || 3),
        etapa_atual: 1,
        status: "EM_ANDAMENTO",
        criado_por_id: String(usuario.id),
        criado_por_nome: usuario.nome,
      })
      .select("id")
      .single();

    if (error) {
      setErro(error.message);
      setSalvando(false);
      return;
    }

    await registrarAuditoria({
      modulo: "RH",
      acao: "CRIAR",
      tabela: "estagios_probatorios",
      registro_id: data.id,
      descricao: `Estágio probatório iniciado para ${guarda.nome}.`,
    });

    router.push(`/sistema/estagio-probatorio/${data.id}`);
  }

  return (
    <ProtecaoModulo modulo="guardas">
      <main className="min-h-screen bg-[#020b1c] px-4 py-5 text-white lg:px-7">
        <div className="mx-auto max-w-4xl space-y-5">
          <header className="rounded-3xl border border-cyan-400/15 bg-[#061326] p-5 lg:p-7">
            <Link href="/sistema/estagio-probatorio" className="inline-flex items-center gap-2 text-sm font-black text-cyan-300">
              <ArrowLeft className="h-4 w-4" /> Voltar
            </Link>
            <h1 className="mt-4 text-2xl font-black">Novo estágio probatório</h1>
          </header>

          {erro ? <div className="rounded-2xl border border-rose-400/25 bg-rose-400/10 p-4 text-rose-200">{erro}</div> : null}

          <section className="grid gap-4 rounded-2xl border border-slate-800 bg-[#061326] p-5 md:grid-cols-2">
            <div className="md:col-span-2">
              <Campo titulo="Servidor">
                <select value={guardaId} onChange={(e) => setGuardaId(e.target.value)} className="h-12 w-full rounded-xl border border-slate-700 bg-slate-950/60 px-4">
                  <option value="">Selecione</option>
                  {guardas.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.nome} {item.matricula ? `— ${item.matricula}` : ""}
                    </option>
                  ))}
                </select>
              </Campo>
            </div>

            <Campo titulo="Data de entrada em exercício">
              <input type="date" value={dataExercicio} onChange={(e) => setDataExercicio(e.target.value)} className="h-12 w-full rounded-xl border border-slate-700 bg-slate-950/60 px-4" />
            </Campo>

            <Campo titulo="Duração em meses">
              <input type="number" min="1" value={meses} onChange={(e) => setMeses(e.target.value)} className="h-12 w-full rounded-xl border border-slate-700 bg-slate-950/60 px-4" />
            </Campo>

            <Campo titulo="Quantidade de etapas">
              <input type="number" min="1" value={totalEtapas} onChange={(e) => setTotalEtapas(e.target.value)} className="h-12 w-full rounded-xl border border-slate-700 bg-slate-950/60 px-4" />
            </Campo>
          </section>

          <div className="flex justify-end">
            <button disabled={salvando} onClick={() => void salvar()} className="inline-flex items-center gap-2 rounded-xl bg-cyan-300 px-5 py-3 font-black text-slate-950 disabled:opacity-50">
              {salvando ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Salvar estágio
            </button>
          </div>
        </div>
      </main>
    </ProtecaoModulo>
  );
}

function Campo({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <label className="space-y-2">
      <span className="text-xs font-black uppercase tracking-wider text-slate-400">{titulo}</span>
      {children}
    </label>
  );
}
