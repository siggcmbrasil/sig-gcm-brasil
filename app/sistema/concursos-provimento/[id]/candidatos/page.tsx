"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowLeft, Loader2, Plus, Search, UserCheck } from "lucide-react";

import ProtecaoModulo from "@/components/ProtecaoModulo";
import {
  formatarConcursos,
  lerUsuarioConcursos,
  podeGerenciarConcursos,
} from "@/lib/concursosProvimento";
import { supabase } from "@/lib/supabase";

type Candidato = {
  id: number;
  nome: string;
  cpf: string | null;
  inscricao: string | null;
  classificacao: number | null;
  nota_final: number | null;
  modalidade_vaga: string;
  status: string;
};

export default function CandidatosConcursoPage() {
  const params = useParams<{ id: string }>();
  const concursoId = Number(params.id);
  const [usuario] = useState(() => lerUsuarioConcursos());
  const [candidatos, setCandidatos] = useState<Candidato[]>([]);
  const [busca, setBusca] = useState("");
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  const podeGerenciar = usuario
    ? podeGerenciarConcursos(usuario.perfil)
    : false;

  const carregar = useCallback(async () => {
    if (!usuario?.municipio_id || !concursoId) return;

    const { data, error } = await supabase
      .from("concursos_candidatos")
      .select("id,nome,cpf,inscricao,classificacao,nota_final,modalidade_vaga,status")
      .eq("municipio_id", usuario.municipio_id)
      .eq("concurso_id", concursoId)
      .order("classificacao", { ascending: true, nullsFirst: false });

    if (error) setErro(error.message);
    setCandidatos((data as Candidato[] | null) || []);
    setCarregando(false);
  }, [concursoId, usuario]);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  const filtrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    return candidatos.filter((item) =>
      `${item.nome} ${item.cpf || ""} ${item.inscricao || ""} ${item.status}`
        .toLowerCase()
        .includes(termo)
    );
  }, [busca, candidatos]);

  return (
    <ProtecaoModulo modulo="guardas">
      <main className="min-h-screen bg-[#020b1c] px-4 py-5 text-white lg:px-7">
        <div className="mx-auto max-w-[1500px] space-y-5">
          <header className="rounded-3xl border border-cyan-400/15 bg-[#061326] p-5 lg:p-7">
            <Link href={`/sistema/concursos-provimento/${concursoId}`} className="inline-flex items-center gap-2 text-sm font-black text-cyan-300">
              <ArrowLeft className="h-4 w-4" />
              Voltar
            </Link>
            <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h1 className="text-2xl font-black">Candidatos</h1>
                <p className="mt-1 text-sm text-slate-400">Classificação, situação e etapas de provimento.</p>
              </div>
              {podeGerenciar ? (
                <Link href={`/sistema/concursos-provimento/${concursoId}/candidatos/novo`} className="inline-flex items-center gap-2 rounded-xl bg-cyan-300 px-4 py-3 text-sm font-black text-slate-950">
                  <Plus className="h-4 w-4" />
                  Novo candidato
                </Link>
              ) : null}
            </div>
          </header>

          {erro ? <div className="rounded-2xl border border-rose-400/25 bg-rose-400/10 p-4 text-rose-200">{erro}</div> : null}

          <label className="flex items-center gap-3 rounded-xl border border-slate-700 bg-[#061326] px-4">
            <Search className="h-4 w-4 text-slate-500" />
            <input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar nome, CPF, inscrição ou status..." className="h-12 w-full bg-transparent outline-none" />
          </label>

          {carregando ? (
            <div className="flex min-h-[300px] items-center justify-center">
              <Loader2 className="h-9 w-9 animate-spin text-cyan-300" />
            </div>
          ) : (
            <section className="overflow-hidden rounded-2xl border border-slate-800 bg-[#061326]">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[900px] text-left text-sm">
                  <thead className="bg-slate-950/50 text-xs uppercase text-slate-500">
                    <tr>
                      <th className="p-4">Classificação</th>
                      <th className="p-4">Candidato</th>
                      <th className="p-4">Inscrição</th>
                      <th className="p-4">Modalidade</th>
                      <th className="p-4">Nota</th>
                      <th className="p-4">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtrados.map((item) => (
                      <tr key={item.id} className="border-t border-slate-800">
                        <td className="p-4 font-black">{item.classificacao || "—"}</td>
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <UserCheck className="h-5 w-5 text-cyan-300" />
                            <div>
                              <p className="font-black">{item.nome}</p>
                              <p className="text-xs text-slate-500">{item.cpf || "CPF não informado"}</p>
                            </div>
                          </div>
                        </td>
                        <td className="p-4">{item.inscricao || "—"}</td>
                        <td className="p-4">{formatarConcursos(item.modalidade_vaga)}</td>
                        <td className="p-4">{item.nota_final ?? "—"}</td>
                        <td className="p-4">
                          <span className="rounded-lg border border-cyan-400/20 bg-cyan-400/10 px-3 py-2 text-[10px] font-black uppercase text-cyan-300">
                            {formatarConcursos(item.status)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {!filtrados.length ? <p className="p-12 text-center text-slate-500">Nenhum candidato cadastrado.</p> : null}
            </section>
          )}
        </div>
      </main>
    </ProtecaoModulo>
  );
}
