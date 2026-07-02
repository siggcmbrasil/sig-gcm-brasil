"use client";

import { useEffect, useState } from "react";
import {
  CarFront,
  ShieldCheck,
  Trash2,
  UserPlus,
  Users,
} from "lucide-react";

import { supabase } from "@/lib/supabase";
import SigPageHeader from "@/components/sig/SigPageHeader";
import SigCard from "@/components/sig/SigCard";
import { registrarAuditoria } from "@/lib/auditoria";

type Guarnicao = {
  id: number;
  nome: string;
  comandante_id: number | null;
  viatura_id: number | null;
  ativa: boolean;
  tipo_guarnicao: string | null;
  area_atuacao: string | null;
  status_operacional?: string | null;
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

export default function GuarnicoesPage() {
  const [guarnicoes, setGuarnicoes] = useState<Guarnicao[]>([]);
  const [guardas, setGuardas] = useState<Guarda[]>([]);
  const [viaturas, setViaturas] = useState<Viatura[]>([]);
  const [membros, setMembros] = useState<Membro[]>([]);
  const [selecionados, setSelecionados] = useState<Record<number, string>>({});
  const [carregando, setCarregando] = useState(true);

  const usuarioLogado =
    typeof window !== "undefined"
      ? JSON.parse(localStorage.getItem("usuarioLogado") || "{}")
      : {};

  const municipioId = usuarioLogado?.municipio_id;

  useEffect(() => {
    if (municipioId) {
      carregarDados();
    } else {
      setCarregando(false);
    }
  }, [municipioId]);

  async function carregarDados() {
    setCarregando(true);

    const { data: guarnicoesData, error: erroGuarnicoes } = await supabase
      .from("guarnicoes")
      .select("*")
      .eq("municipio_id", municipioId)
      .order("id", { ascending: true });

    const { data: guardasData, error: erroGuardas } = await supabase
      .from("guardas")
      .select("id, nome, matricula, cargo, status")
      .eq("municipio_id", municipioId)
      .order("nome", { ascending: true });

    const { data: viaturasData, error: erroViaturas } = await supabase
      .from("viaturas")
      .select("id, prefixo, modelo, status")
      .eq("municipio_id", municipioId)
      .order("prefixo", { ascending: true });

    const { data: membrosData, error: erroMembros } = await supabase
      .from("guarnicao_membros")
      .select(`
        id,
        guarnicao_id,
        guarda_id,
        funcao,
        guardas:guarda_id (
          id,
          nome,
          matricula,
          cargo,
          status
        )
      `)
      .eq("municipio_id", municipioId);

    setCarregando(false);

    if (erroGuarnicoes || erroGuardas || erroViaturas || erroMembros) {
      console.error({
        erroGuarnicoes,
        erroGuardas,
        erroViaturas,
        erroMembros,
      });
      alert("Erro ao carregar dados das guarnições.");
      return;
    }

    setGuarnicoes(guarnicoesData || []);
    setGuardas(guardasData || []);
    setViaturas(viaturasData || []);
    setMembros((membrosData as any) || []);
  }

  async function atualizarGuarnicao(
    id: number,
    campo:
      | "comandante_id"
      | "viatura_id"
      | "tipo_guarnicao"
      | "area_atuacao"
      | "status_operacional",
    valor: string
  ) {
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
      alert("Erro ao atualizar guarnição.");
      return;
    }

   const guarnicao = guarnicoes.find((g) => g.id === id);

let descricao = `Atualizou a guarnição ${guarnicao?.nome || id}.`;

if (campo === "comandante_id") {
  descricao = `Alterou o comandante da guarnição ${guarnicao?.nome || id}.`;
}

if (campo === "viatura_id") {
  descricao = `Alterou a viatura da guarnição ${guarnicao?.nome || id}.`;
}

if (campo === "tipo_guarnicao") {
  descricao = `Alterou o tipo da guarnição ${guarnicao?.nome || id} para ${valor}.`;
}

if (campo === "area_atuacao") {
  descricao = `Alterou a área de atuação da guarnição ${guarnicao?.nome || id} para ${valor}.`;
}

if (campo === "status_operacional") {
  descricao = `Alterou o status operacional da guarnição ${guarnicao?.nome || id} para ${valor}.`;
}

await registrarAuditoria({
  modulo: "Guarnições",
  acao: "EDITAR",
  descricao,
});

carregarDados();
  }

  async function adicionarMembro(guarnicaoId: number) {
    const guardaId = selecionados[guarnicaoId];

    if (!guardaId) {
      alert("Selecione um guarda.");
      return;
    }

    const jaExiste = membros.some(
      (m) =>
        m.guarnicao_id === guarnicaoId &&
        m.guarda_id === Number(guardaId)
    );

    if (jaExiste) {
      alert("Este guarda já está nesta guarnição.");
      return;
    }

    const { error } = await supabase.from("guarnicao_membros").insert({
      municipio_id: municipioId,
      guarnicao_id: guarnicaoId,
      guarda_id: Number(guardaId),
      funcao: "Patrulheiro",
    });

    if (error) {
      alert("Erro ao adicionar guarda.");
      return;
    }

    const guarda = guardas.find(
  (g) => g.id === Number(guardaId)
);

const guarnicao = guarnicoes.find(
  (g) => g.id === guarnicaoId
);

await registrarAuditoria({
  modulo: "Guarnições",
  acao: "ADICIONAR_MEMBRO",
  descricao: `Adicionou ${guarda?.nome} na guarnição ${guarnicao?.nome}.`,
});

    setSelecionados((prev) => ({
      ...prev,
      [guarnicaoId]: "",
    }));

    carregarDados();
  }

  async function atualizarFuncaoMembro(membroId: number, funcao: string) {
    const { error } = await supabase
      .from("guarnicao_membros")
      .update({ funcao })
      .eq("id", membroId)
      .eq("municipio_id", municipioId);

    if (error) {
      alert("Erro ao atualizar função.");
      return;
    }

    const membro = membros.find(
  (m) => m.id === membroId
);

await registrarAuditoria({
  modulo: "Guarnições",
  acao: "ALTERAR_FUNCAO",
  descricao: `Alterou a função de ${membro?.guardas?.nome || "guarda"} para ${funcao}.`,
});

    carregarDados();
  }

  async function removerMembro(id: number) {
    if (!confirm("Remover este guarda da guarnição?")) return;

    const membro = membros.find(
  (m) => m.id === id
);

    const { error } = await supabase
      .from("guarnicao_membros")
      .delete()
      .eq("id", id)
      .eq("municipio_id", municipioId);

    if (error) {
      alert("Erro ao remover guarda.");
      return;
    }

await registrarAuditoria({
  modulo: "Guarnições",
  acao: "REMOVER_MEMBRO",
  descricao: `Removeu ${membro?.guardas?.nome || "guarda"} da guarnição.`,
});

    carregarDados();
  }

  if (carregando) {
    return (
      <div className="p-4 md:p-6 pb-24">
        <SigCard>
          <p className="text-slate-400">Carregando guarnições...</p>
        </SigCard>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 pb-24 space-y-6">
      <SigPageHeader
        titulo="Guarnições"
        subtitulo="Gestão das equipes operacionais, membros, funções e viaturas."
        icone={ShieldCheck}
      />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <SigCard>
          <ShieldCheck className="w-8 h-8 text-cyan-400 mb-3" />
          <p className="text-slate-400 text-sm">Guarnições</p>
          <h2 className="text-4xl font-black text-white mt-2">
            {guarnicoes.length}
          </h2>
        </SigCard>

        <SigCard>
          <Users className="w-8 h-8 text-emerald-400 mb-3" />
          <p className="text-slate-400 text-sm">Membros vinculados</p>
          <h2 className="text-4xl font-black text-emerald-400 mt-2">
            {membros.length}
          </h2>
        </SigCard>

        <SigCard>
          <CarFront className="w-8 h-8 text-yellow-400 mb-3" />
          <p className="text-slate-400 text-sm">Viaturas</p>
          <h2 className="text-4xl font-black text-yellow-400 mt-2">
            {viaturas.length}
          </h2>
        </SigCard>

        <SigCard>
          <UserPlus className="w-8 h-8 text-cyan-400 mb-3" />
          <p className="text-slate-400 text-sm">Guardas disponíveis</p>
          <h2 className="text-4xl font-black text-white mt-2">
            {guardas.length}
          </h2>
        </SigCard>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {guarnicoes.map((guarnicao) => {
          const membrosDaGuarnicao = membros.filter(
            (m) => m.guarnicao_id === guarnicao.id
          );

          return (
            <SigCard key={guarnicao.id}>
              <div className="space-y-5">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
                  <div>
                    <h2 className="text-2xl font-black text-white">
                      {guarnicao.nome}
                    </h2>

                    <p className="text-slate-400 mt-1">
                      {membrosDaGuarnicao.length} guarda(s) vinculado(s)
                    </p>
                  </div>

                  <span className="rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-xs font-black text-cyan-400">
                    {guarnicao.status_operacional || "OPERACIONAL"}
                  </span>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <Campo label="Tipo da Guarnição">
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
                      <option>Operacional</option>
                      <option>ROMU</option>
                      <option>Patrulha Escolar</option>
                      <option>Maria da Penha</option>
                      <option>Ambiental</option>
                      <option>Trânsito</option>
                      <option>Canil</option>
                      <option>Motopatrulha</option>
                      <option>Ciclopatrulha</option>
                      <option>Administrativa</option>
                      <option>Defesa Civil</option>
                      <option>Apoio</option>
                      <option>Outra</option>
                    </select>
                  </Campo>

                  <Campo label="Status Operacional">
                    <select
                      className="input"
                      value={guarnicao.status_operacional || "OPERACIONAL"}
                      onChange={(e) =>
                        atualizarGuarnicao(
                          guarnicao.id,
                          "status_operacional",
                          e.target.value
                        )
                      }
                    >
                      <option value="OPERACIONAL">Operacional</option>
                      <option value="EM_PATRULHAMENTO">Em patrulhamento</option>
                      <option value="EM_OCORRENCIA">Em ocorrência</option>
                      <option value="EM_APOIO">Em apoio</option>
                      <option value="INATIVA">Inativa</option>
                    </select>
                  </Campo>

                  <Campo label="Área de Atuação">
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
                      <option>Toda cidade</option>
                      <option>Centro</option>
                      <option>Zona Norte</option>
                      <option>Zona Sul</option>
                      <option>Zona Leste</option>
                      <option>Zona Oeste</option>
                      <option>Zona Rural</option>
                      <option>Distritos</option>
                      <option>Povoados</option>
                      <option>Personalizada</option>
                    </select>
                  </Campo>

                  <Campo label="Comandante da Guarnição">
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
                      <option value="">Selecione</option>
                      {guardas.map((g) => (
                        <option key={g.id} value={g.id}>
                          {g.nome} • {g.matricula}
                        </option>
                      ))}
                    </select>
                  </Campo>

                  <Campo label="Viatura">
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
                  </Campo>
                </div>

                <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
                  <h3 className="text-lg font-black text-white mb-3">
                    Adicionar Guarda
                  </h3>

                  <div className="flex flex-col md:flex-row gap-3">
                    <select
                      className="input flex-1"
                      value={selecionados[guarnicao.id] || ""}
                      onChange={(e) =>
                        setSelecionados((prev) => ({
                          ...prev,
                          [guarnicao.id]: e.target.value,
                        }))
                      }
                    >
                      <option value="">Selecione um guarda</option>
                      {guardas.map((g) => (
                        <option key={g.id} value={g.id}>
                          {g.nome} • {g.matricula} • {g.status}
                        </option>
                      ))}
                    </select>

                    <button
                      type="button"
                      onClick={() => adicionarMembro(guarnicao.id)}
                      className="btn-primary inline-flex items-center justify-center gap-2"
                    >
                      <UserPlus className="w-5 h-5" />
                      Adicionar
                    </button>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-black text-white mb-3">
                    Membros da Guarnição
                  </h3>

                  {membrosDaGuarnicao.length === 0 ? (
                    <p className="text-slate-400">
                      Nenhum guarda vinculado.
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {membrosDaGuarnicao.map((membro) => (
                        <div
                          key={membro.id}
                          className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4"
                        >
                          <div>
                            <p className="font-black text-white">
                              {membro.guardas?.nome || "Guarda não encontrado"}
                            </p>

                            <p className="text-sm text-slate-400">
                              {membro.guardas?.matricula || "-"} •{" "}
                              {membro.guardas?.cargo || "-"}
                            </p>
                          </div>

                          <div className="flex items-center gap-2">
                            <select
                              className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
                              value={membro.funcao || "Patrulheiro"}
                              onChange={(e) =>
                                atualizarFuncaoMembro(
                                  membro.id,
                                  e.target.value
                                )
                              }
                            >
                              <option>Comandante</option>
                              <option>Motorista</option>
                              <option>Patrulheiro</option>
                              <option>Apoio</option>
                              <option>Extra</option>
                              <option>Supervisor</option>
                              <option>Inspetor</option>
                            </select>

                            <button
                              type="button"
                              onClick={() => removerMembro(membro.id)}
                              className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500/20 transition"
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </SigCard>
          );
        })}
      </div>
    </div>
  );
}

function Campo({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="label">{label}</label>
      {children}
    </div>
  );
}