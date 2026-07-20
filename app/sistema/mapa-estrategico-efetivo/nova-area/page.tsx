"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowLeft, Loader2, Save } from "lucide-react";
import { useRouter } from "next/navigation";

import ProtecaoModulo from "@/components/ProtecaoModulo";
import { registrarAuditoria } from "@/lib/auditoria";
import {
  NIVEIS_RISCO,
  TURNOS_OPERACIONAIS,
  formatarMapa,
  lerUsuarioMapaEstrategico,
  podeGerenciarMapaEstrategico,
} from "@/lib/mapaEstrategicoEfetivo";
import { supabase } from "@/lib/supabase";

export default function NovaAreaEstrategicaPage() {
  const router = useRouter();
  const [usuario] = useState(() => lerUsuarioMapaEstrategico());
  const [regiao, setRegiao] = useState("");
  const [unidade, setUnidade] = useState("");
  const [setor, setSetor] = useState("");
  const [turno, setTurno] = useState("INTEGRAL");
  const [nivelRisco, setNivelRisco] = useState("MODERADO");
  const [efetivoNecessario, setEfetivoNecessario] = useState("1");
  const [efetivoDisponivel, setEfetivoDisponivel] = useState("0");
  const [observacoes, setObservacoes] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");

  async function salvar() {
    if (!usuario?.municipio_id || !podeGerenciarMapaEstrategico(usuario.perfil)) {
      setErro("Seu perfil não pode cadastrar áreas estratégicas.");
      return;
    }

    if (!regiao.trim() || !unidade.trim()) {
      setErro("Informe a região e a unidade.");
      return;
    }

    setSalvando(true);
    setErro("");

    const { data, error } = await supabase
      .from("necessidades_operacionais_efetivo")
      .insert({
        municipio_id: usuario.municipio_id,
        regiao: regiao.trim(),
        unidade: unidade.trim(),
        setor: setor.trim() || null,
        turno,
        nivel_risco: nivelRisco,
        efetivo_necessario: Math.max(0, Number(efetivoNecessario || 0)),
        efetivo_disponivel: Math.max(0, Number(efetivoDisponivel || 0)),
        afastados: 0,
        observacoes: observacoes.trim() || null,
        ativo: true,
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
      modulo: "CENTRAL_COMANDO",
      acao: "CRIAR",
      tabela: "necessidades_operacionais_efetivo",
      registro_id: data.id,
      descricao: `Área estratégica ${regiao.trim()} — ${unidade.trim()} cadastrada.`,
    });

    router.push("/sistema/mapa-estrategico-efetivo");
  }

  return (
    <ProtecaoModulo modulo="guardas">
      <main className="min-h-screen bg-[#020b1c] px-4 py-5 text-white lg:px-7">
        <div className="mx-auto max-w-4xl space-y-5">
          <header className="rounded-3xl border border-cyan-400/15 bg-[#061326] p-5 lg:p-7">
            <Link
              href="/sistema/mapa-estrategico-efetivo"
              className="inline-flex items-center gap-2 text-sm font-black text-cyan-300"
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar
            </Link>
            <h1 className="mt-4 text-2xl font-black">Nova área estratégica</h1>
          </header>

          {erro ? (
            <div className="rounded-2xl border border-rose-400/25 bg-rose-400/10 p-4 text-sm text-rose-200">
              {erro}
            </div>
          ) : null}

          <section className="grid gap-4 rounded-2xl border border-slate-800 bg-[#061326] p-5 md:grid-cols-2">
            <Campo titulo="Região">
              <input
                value={regiao}
                onChange={(event) => setRegiao(event.target.value)}
                placeholder="Centro, Zona Norte, Zona Rural..."
                className="h-12 w-full rounded-xl border border-slate-700 bg-slate-950/60 px-4"
              />
            </Campo>

            <Campo titulo="Unidade">
              <input
                value={unidade}
                onChange={(event) => setUnidade(event.target.value)}
                placeholder="Base, posto, grupamento..."
                className="h-12 w-full rounded-xl border border-slate-700 bg-slate-950/60 px-4"
              />
            </Campo>

            <Campo titulo="Setor">
              <input
                value={setor}
                onChange={(event) => setSetor(event.target.value)}
                className="h-12 w-full rounded-xl border border-slate-700 bg-slate-950/60 px-4"
              />
            </Campo>

            <Campo titulo="Turno">
              <select
                value={turno}
                onChange={(event) => setTurno(event.target.value)}
                className="h-12 w-full rounded-xl border border-slate-700 bg-slate-950/60 px-4"
              >
                {TURNOS_OPERACIONAIS.map((item) => (
                  <option key={item} value={item}>
                    {formatarMapa(item)}
                  </option>
                ))}
              </select>
            </Campo>

            <Campo titulo="Nível de risco">
              <select
                value={nivelRisco}
                onChange={(event) => setNivelRisco(event.target.value)}
                className="h-12 w-full rounded-xl border border-slate-700 bg-slate-950/60 px-4"
              >
                {NIVEIS_RISCO.map((item) => (
                  <option key={item} value={item}>
                    {formatarMapa(item)}
                  </option>
                ))}
              </select>
            </Campo>

            <Campo titulo="Efetivo necessário">
              <input
                type="number"
                min="0"
                value={efetivoNecessario}
                onChange={(event) => setEfetivoNecessario(event.target.value)}
                className="h-12 w-full rounded-xl border border-slate-700 bg-slate-950/60 px-4"
              />
            </Campo>

            <Campo titulo="Efetivo disponível inicial">
              <input
                type="number"
                min="0"
                value={efetivoDisponivel}
                onChange={(event) => setEfetivoDisponivel(event.target.value)}
                className="h-12 w-full rounded-xl border border-slate-700 bg-slate-950/60 px-4"
              />
            </Campo>

            <div className="md:col-span-2">
              <Campo titulo="Observações">
                <textarea
                  value={observacoes}
                  onChange={(event) => setObservacoes(event.target.value)}
                  rows={4}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950/60 p-4"
                />
              </Campo>
            </div>
          </section>

          <div className="flex justify-end">
            <button
              disabled={salvando}
              onClick={() => void salvar()}
              className="inline-flex items-center gap-2 rounded-xl bg-cyan-300 px-5 py-3 font-black text-slate-950 disabled:opacity-50"
            >
              {salvando ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              Salvar área
            </button>
          </div>
        </div>
      </main>
    </ProtecaoModulo>
  );
}

function Campo({
  titulo,
  children,
}: {
  titulo: string;
  children: React.ReactNode;
}) {
  return (
    <label className="space-y-2">
      <span className="text-xs font-black uppercase tracking-wider text-slate-400">
        {titulo}
      </span>
      {children}
    </label>
  );
}
