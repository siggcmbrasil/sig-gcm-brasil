"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type Guarnicao = {
  id: number;
  nome: string;
  comandante_id: number | null;
  viatura_id: number | null;
  ativa: boolean;
  tipo_guarnicao: string | null;
  area_atuacao: string | null;
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
    : null;

const municipioId = usuarioLogado?.municipio_id;

  async function carregarDados() {
if (!municipioId) {
  alert("Município não identificado.");
  setCarregando(false);
  return;
}

    setCarregando(true);

    const { data: guarnicoesData } = await supabase
  .from("guarnicoes")
  .select("*")
  .eq("municipio_id", municipioId)
  .order("id");

    const { data: guardasData } = await supabase
      .from("guardas")
      .select("id, nome, matricula, cargo, status")
      .eq("municipio_id", municipioId)
      .order("nome");

    const { data: viaturasData } = await supabase
  .from("viaturas")
  .select("id, prefixo, modelo, status")
  .eq("municipio_id", municipioId)
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
  .eq("guardas.municipio_id", municipioId);

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
    campo:
  | "comandante_id"
  | "viatura_id"
  | "tipo_guarnicao"
  | "area_atuacao",
    valor: string
  ) {

    if (!municipioId) {
  alert("Município não identificado.");
  return;
}
    const valorFinal =
  campo === "comandante_id" || campo === "viatura_id"
    ? valor
      ? Number(valor)
      : null
    : valor;

    const { error } = await supabase
      .from("guarnicoes")
      .update({ [campo]: valorFinal })
      .eq("id", id)
.eq("municipio_id", municipioId);

    if (error) {
      console.error(error);
      alert("Erro ao atualizar guarnição.");
      return;
    }

    await carregarDados();
  }

  async function atualizarStatusGuarnicao(
  id: number,
  status: string
) {
  if (!municipioId) {
    alert("Município não identificado.");
    return;
  }

  const { error } = await supabase
    .from("guarnicoes")
    .update({ status_operacional: status })
    .eq("id", id)
    .eq("municipio_id", municipioId);

  if (error) {
    console.error(error);
    alert("Erro ao atualizar status da guarnição.");
    return;
  }

  await carregarDados();
}

  async function adicionarMembro(guarnicaoId: number, guardaId: string) {
    if (!municipioId) {
  alert("Município não identificado.");
  return;
}
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
  municipio_id: municipioId,
},
    ]);

    if (error) {
      console.error(error);
      alert("Erro ao adicionar guarda.");
      return;
    }

    await carregarDados();
  }

  async function removerMembro(id: number) {
    if (!municipioId) {
  alert("Município não identificado.");
  return;
}
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

    await carregarDados();
  }

  async function atualizarFuncaoMembro(
  membroId: number,
  funcao: string
) {
  if (!municipioId) {
    alert("Município não identificado.");
    return;
  }

  const { error } = await supabase
    .from("guarnicao_membros")
    .update({ funcao })
    .eq("id", membroId);

  if (error) {
    console.error(error);
    alert("Erro ao atualizar função do membro.");
    return;
  }

  await carregarDados();
}

  useEffect(() => {
    void carregarDados();
  }, []);

  if (carregando) {
    return (
      <div className="min-h-screen bg-[#07152E] p-3 md:p-6 pb-24 text-white">
        <div className="card">Carregando guarnições...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#07152E] p-3 md:p-6 pb-24 text-white">
      <header className="border-b border-[#C9A227] pb-5 mb-6">
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
            <div
  key={guarnicao.id}
  className="rounded-xl border border-[#C9A227] bg-[#0D1B34] p-5 space-y-5"
>
              <div>
  <h2 className="text-2xl font-bold text-[#C9A227]">
    {guarnicao.nome}
  </h2>

  <p className="text-slate-400">
    {membrosDaGuarnicao.length} guarda(s) vinculado(s)
  </p>

  <div className="mt-5 border-t border-[#C9A227]/40 pt-5">
    <h3 className="text-lg font-bold text-[#C9A227] mb-4">
      Informações da Guarnição
    </h3>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <label className="label">Tipo da Guarnição</label>

        <select
          className="input"
          value={guarnicao.tipo_guarnicao || "Operacional"}
          onChange={(e) =>
            atualizarGuarnicao(
              guarnicao.id,
              "tipo_guarnicao",
              e.target.value
            )
          }
        >
          <option value="Operacional">Operacional</option>
          <option value="ROMU">ROMU</option>
          <option value="Patrulha Escolar">Patrulha Escolar</option>
          <option value="Maria da Penha">Maria da Penha</option>
          <option value="Ambiental">Ambiental</option>
          <option value="Trânsito">Trânsito</option>
          <option value="Canil">Canil</option>
          <option value="Motopatrulha">Motopatrulha</option>
          <option value="Ciclopatrulha">Ciclopatrulha</option>
          <option value="Administrativa">Administrativa</option>
          <option value="Defesa Civil">Defesa Civil</option>
          <option value="Apoio">Apoio</option>
          <option value="Outra">Outra</option>
        </select>
      </div>

      <div>
        <label className="label">Área de Atuação</label>

        <select
          className="input"
          value={guarnicao.area_atuacao || "Toda cidade"}
          onChange={(e) =>
            atualizarGuarnicao(
              guarnicao.id,
              "area_atuacao",
              e.target.value
            )
          }
        >
          <option value="Toda cidade">Toda cidade</option>
          <option value="Centro">Centro</option>
          <option value="Zona Norte">Zona Norte</option>
          <option value="Zona Sul">Zona Sul</option>
          <option value="Zona Leste">Zona Leste</option>
          <option value="Zona Oeste">Zona Oeste</option>
          <option value="Zona Rural">Zona Rural</option>
          <option value="Distritos">Distritos</option>
          <option value="Povoados">Povoados</option>
          <option value="Personalizada">Personalizada</option>
        </select>
      </div>
    </div>
  </div>
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
                <h3 className="text-lg font-bold text-[#C9A227] mb-3">Membros</h3>

                {membrosDaGuarnicao.length === 0 ? (
                  <p className="text-slate-400">
                    Nenhum guarda vinculado.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {membrosDaGuarnicao.map((membro) => (
                      <div
                        key={membro.id}
                        className="rounded-xl border border-[#C9A227]/50 bg-[#07152E] p-4 flex justify-between gap-4"
                      >
                        <div>
                          <p className="font-bold">
                            {membro.guardas?.nome || "Guarda não encontrado"}
                          </p>

                          <p className="text-sm text-slate-400">
                            {membro.guardas?.matricula || "-"} •{" "}
                            {membro.guardas?.cargo || "-"}
                          </p>

                          <select
  className="mt-2 rounded-lg border border-[#C9A227] bg-[#07152E] px-3 py-2 text-xs text-white"
  value={membro.funcao || "Patrulheiro"}
  onChange={(e) =>
    atualizarFuncaoMembro(membro.id, e.target.value)
  }
>
  <option value="Comandante">Comandante</option>
  <option value="Motorista">Motorista</option>
  <option value="Patrulheiro">Patrulheiro</option>
  <option value="Apoio">Apoio</option>
  <option value="Extra">Extra</option>
  <option value="Supervisor">Supervisor</option>
  <option value="Inspetor">Inspetor</option>
</select>
                        </div>

                        <button
                          type="button"
                          onClick={() => removerMembro(membro.id)}
                          className="flex h-8 w-8 items-center justify-center rounded-lg border border-red-500 text-red-400 hover:bg-red-950/40"
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
