"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type Guarnicao = {
  id: number;
  nome: string;
  comandante_id: number | null;
  viatura_id: number | null;
  ativa: boolean;
};

type Guarda = {
  id: number;
  nome: string;
  matricula: string;
  cargo: string;
  status: string;
};

type Viatura = {
  id: number;
  prefixo: string;
  modelo: string;
  status: string;
};

type Membro = {
  id: number;
  guarnicao_id: number;
  guarda_id: number;
  funcao: string | null;
  guardas: Guarda | null;
};

export default function Guarnicoes() {
  const [guarnicoes, setGuarnicoes] = useState<Guarnicao[]>([]);
  const [guardas, setGuardas] = useState<Guarda[]>([]);
  const [viaturas, setViaturas] = useState<Viatura[]>([]);
  const [membros, setMembros] = useState<any[]>([]);
  const [carregando, setCarregando] = useState(true);

const usuarioLogado =
  typeof window !== "undefined"
    ? JSON.parse(localStorage.getItem("usuarioLogado") || "{}")
    : {};

  async function carregarDados() {
    setCarregando(true);

    const { data: guarnicoesData } = await supabase
  .from("guarnicoes")
  .select("*")
  .eq("municipio_id", usuarioLogado.municipio_id)
  .order("id");

    const { data: guardasData } = await supabase
      .from("guardas")
      .select("id, nome, matricula, cargo, status")
      .eq("municipio_id", usuarioLogado.municipio_id)
      .order("nome");

    const { data: viaturasData } = await supabase
  .from("viaturas")
  .select("id, prefixo, modelo, status")
  .eq("municipio_id", usuarioLogado.municipio_id)
  .order("prefixo");

    const { data: membrosData, error: membrosError } = await supabase
  .from("guarnicao_membros")
  .select(`
    id,
    guarnicao_id,
    guarda_id,
    funcao,
    guardas!inner (
      id,
      nome,
      matricula,
      cargo,
      status,
      municipio_id
    )
  `)
  .eq("guardas.municipio_id", usuarioLogado.municipio_id);

    if (membrosError) {
      console.error(membrosError);
      alert("Erro ao carregar membros das guarnições.");
    }

    setGuarnicoes(guarnicoesData || []);
    setGuardas(guardasData || []);
    setViaturas(viaturasData || []);
    setMembros((membrosData as any) || []);

    setCarregando(false);
  }

  async function atualizarGuarnicao(
    id: number,
    campo: "comandante_id" | "viatura_id",
    valor: string
  ) {
    const valorFinal = valor ? Number(valor) : null;

    const { error } = await supabase
      .from("guarnicoes")
      .update({ [campo]: valorFinal })
      .eq("id", id)
.eq("municipio_id", usuarioLogado.municipio_id);

    if (error) {
      console.error(error);
      alert("Erro ao atualizar guarnição.");
      return;
    }

    carregarDados();
  }

  async function adicionarMembro(guarnicaoId: number, guardaId: string) {
    if (!guardaId) return;

    const jaExiste = membros.some(
      (m) =>
        m.guarnicao_id === guarnicaoId &&
        m.guarda_id === Number(guardaId)
    );

    if (jaExiste) {
      alert("Este guarda já está nesta guarnição.");
      return;
    }

    const { error } = await supabase.from("guarnicao_membros").insert([
      {
        guarnicao_id: guarnicaoId,
        guarda_id: Number(guardaId),
        funcao: "Patrulheiro",
      },
    ]);

    if (error) {
      console.error(error);
      alert("Erro ao adicionar guarda.");
      return;
    }

    carregarDados();
  }

  async function removerMembro(id: number) {
    const confirmar = confirm("Remover este guarda da guarnição?");
    if (!confirmar) return;

    const { error } = await supabase
      .from("guarnicao_membros")
      .delete()
      .eq("id", id);

    if (error) {
      console.error(error);
      alert("Erro ao remover guarda.");
      return;
    }

    carregarDados();
  }

  useEffect(() => {
    carregarDados();
  }, []);

  if (carregando) {
    return (
      <div className="p-3 md:p-6 pb-24">
        <div className="card">Carregando guarnições...</div>
      </div>
    );
  }

  return (
    <div className="p-3 md:p-6 pb-24">
      <header className="border-b border-slate-800 pb-5 mb-6">
        <h1 className="text-3xl font-bold">Guarnições</h1>
        <p className="text-slate-400">
          Cadastro das equipes operacionais de plantão da GCM.
        </p>
      </header>

      <section className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {guarnicoes.map((guarnicao) => {
          const membrosDaGuarnicao = membros.filter(
            (m) => m.guarnicao_id === guarnicao.id
          );

          return (
            <div key={guarnicao.id} className="card space-y-5">
              <div>
                <h2 className="text-2xl font-bold">{guarnicao.nome}</h2>
                <p className="text-slate-400">
                  {membrosDaGuarnicao.length} guarda(s) vinculado(s)
                </p>
              </div>

              <div>
                <label className="label">Comandante da Guarnição</label>
                <select
                  className="input"
                  value={guarnicao.comandante_id || ""}
                  onChange={(e) =>
                    atualizarGuarnicao(
                      guarnicao.id,
                      "comandante_id",
                      e.target.value
                    )
                  }
                >
                  <option value="">Selecione o comandante</option>

                  {guardas.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.nome} • {g.matricula}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="label">Viatura da Guarnição</label>
                <select
                  className="input"
                  value={guarnicao.viatura_id || ""}
                  onChange={(e) =>
                    atualizarGuarnicao(
                      guarnicao.id,
                      "viatura_id",
                      e.target.value
                    )
                  }
                >
                  <option value="">Sem viatura</option>

                  {viaturas.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.prefixo} • {v.modelo} • {v.status}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="label">Adicionar guarda</label>
                <select
                  className="input"
                  defaultValue=""
                  onChange={(e) => {
                    adicionarMembro(guarnicao.id, e.target.value);
                    e.target.value = "";
                  }}
                >
                  <option value="">Selecione um guarda</option>

                  {guardas.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.nome} • {g.matricula} • {g.status}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <h3 className="text-xl font-bold mb-3">Membros</h3>

                {membrosDaGuarnicao.length === 0 ? (
                  <p className="text-slate-400">
                    Nenhum guarda vinculado.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {membrosDaGuarnicao.map((membro) => (
                      <div
                        key={membro.id}
                        className="bg-slate-950/40 border border-slate-700 rounded-xl p-4 flex justify-between gap-4"
                      >
                        <div>
                          <p className="font-bold">
                            {membro.guardas?.nome || "Guarda não encontrado"}
                          </p>

                          <p className="text-sm text-slate-400">
                            {membro.guardas?.matricula || "-"} •{" "}
                            {membro.guardas?.cargo || "-"}
                          </p>

                          <p className="text-xs text-blue-400">
                            {membro.funcao || "Patrulheiro"}
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() => removerMembro(membro.id)}
                          className="text-red-400 text-xl"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </section>
    </div>
  );
}