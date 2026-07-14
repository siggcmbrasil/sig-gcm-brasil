"use client";

import { useEffect, useMemo, useState } from "react";
import {
  BadgeCheck,
  Building2,
  CheckCircle2,
  CreditCard,
  Crown,
  Plus,
  Save,
  Search,
  ShieldCheck,
  Trash2,
  X,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

type Plano = {
  id: string;
  nome: string;
  descricao: string | null;
  valor_mensal: number;
  valor_implantacao: number;
  limite_usuarios: number | null;
  recursos: string[] | null;
  ativo: boolean;
};

type Municipio = {
  id: number;
  nome: string;
};

type Assinatura = {
  id: string;
  municipio_id: number;
  plano_id: string;
  status: string;
  data_inicio: string | null;
  data_vencimento: string | null;
  valor_mensal: number | null;
  observacoes: string | null;
  municipios?: Municipio;
  planos_sistema?: Plano;
};

const statusClasses: Record<string, string> = {
  ATIVA: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  PENDENTE: "bg-yellow-500/15 text-yellow-300 border-yellow-500/30",
  VENCIDA: "bg-red-500/15 text-red-300 border-red-500/30",
  CANCELADA: "bg-slate-500/15 text-slate-300 border-slate-500/30",
};

export default function PlanosAssinaturasPage() {
  const [planos, setPlanos] = useState<Plano[]>([]);
  const [municipios, setMunicipios] = useState<Municipio[]>([]);
  const [assinaturas, setAssinaturas] = useState<Assinatura[]>([]);
  const [carregando, setCarregando] = useState(true);

  const [aba, setAba] = useState<"geral" | "planos" | "assinaturas">(
    "assinaturas"
  );

  const [busca, setBusca] = useState("");
  const [statusFiltro, setStatusFiltro] = useState("TODOS");

  const [modalPlano, setModalPlano] = useState(false);
  const [modalAssinatura, setModalAssinatura] = useState(false);
  const [editandoPlanoId, setEditandoPlanoId] = useState<string | null>(null);

  const [planoForm, setPlanoForm] = useState({
    nome: "",
    descricao: "",
    valor_mensal: "",
    valor_implantacao: "",
    limite_usuarios: "",
    recursos: "",
  });

  const [assinaturaForm, setAssinaturaForm] = useState({
    municipio_id: "",
    plano_id: "",
    status: "ATIVA",
    data_vencimento: "",
    valor_mensal: "",
    observacoes: "",
  });

  useEffect(() => {
    carregarDados();
  }, []);

  async function carregarDados() {
    setCarregando(true);

    const { data: planosData } = await supabase
      .from("planos_sistema")
      .select("*")
      .order("valor_mensal", { ascending: true });

    const { data: municipiosData } = await supabase
      .from("municipios")
      .select("id, nome")
      .order("nome", { ascending: true });

    const { data: assinaturasData } = await supabase
      .from("assinaturas_municipios")
      .select(
        `
        *,
        municipios(id, nome),
        planos_sistema(*)
      `
      )
      .order("criado_em", { ascending: false });

    setPlanos(planosData || []);
    setMunicipios(municipiosData || []);
    setAssinaturas(assinaturasData || []);
    setCarregando(false);
  }

  function moeda(valor: number | null | undefined) {
    return Number(valor || 0).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  }

  function dataBR(data: string | null) {
    if (!data) return "Sem vencimento";
    return new Date(data + "T00:00:00").toLocaleDateString("pt-BR");
  }

  const receitaMensal = assinaturas
    .filter((a) => a.status === "ATIVA")
    .reduce((total, a) => total + Number(a.valor_mensal || 0), 0);

  const assinaturasAtivas = assinaturas.filter((a) => a.status === "ATIVA");

  const assinaturasFiltradas = useMemo(() => {
    return assinaturas.filter((a) => {
      const texto = busca.toLowerCase();
      const municipio = a.municipios?.nome?.toLowerCase() || "";
      const plano = a.planos_sistema?.nome?.toLowerCase() || "";

      const bateBusca = municipio.includes(texto) || plano.includes(texto);
      const bateStatus =
        statusFiltro === "TODOS" ? true : a.status === statusFiltro;

      return bateBusca && bateStatus;
    });
  }, [assinaturas, busca, statusFiltro]);

  function limparPlano() {
    setEditandoPlanoId(null);
    setPlanoForm({
      nome: "",
      descricao: "",
      valor_mensal: "",
      valor_implantacao: "",
      limite_usuarios: "",
      recursos: "",
    });
  }

  function abrirNovoPlano() {
    limparPlano();
    setModalPlano(true);
  }

  function editarPlano(plano: Plano) {
    setEditandoPlanoId(plano.id);

    setPlanoForm({
      nome: plano.nome || "",
      descricao: plano.descricao || "",
      valor_mensal: String(plano.valor_mensal || ""),
      valor_implantacao: String(plano.valor_implantacao || ""),
      limite_usuarios: String(plano.limite_usuarios || ""),
      recursos: plano.recursos?.join(", ") || "",
    });

    setModalPlano(true);
  }

  async function salvarPlano() {
    if (!planoForm.nome || !planoForm.valor_mensal) {
      alert("Informe o nome e o valor mensal do plano.");
      return;
    }

    const payload = {
      nome: planoForm.nome,
      descricao: planoForm.descricao,
      valor_mensal: Number(planoForm.valor_mensal),
      valor_implantacao: Number(planoForm.valor_implantacao || 0),
      limite_usuarios: planoForm.limite_usuarios
        ? Number(planoForm.limite_usuarios)
        : null,
      recursos: planoForm.recursos
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean),
    };

    if (editandoPlanoId) {
      await supabase
        .from("planos_sistema")
        .update(payload)
        .eq("id", editandoPlanoId);
    } else {
      await supabase.from("planos_sistema").insert(payload);
    }

    setModalPlano(false);
    limparPlano();
    carregarDados();
  }

  async function alternarPlano(plano: Plano) {
    await supabase
      .from("planos_sistema")
      .update({ ativo: !plano.ativo })
      .eq("id", plano.id);

    carregarDados();
  }

  async function excluirPlano(plano: Plano) {
  const confirmar = confirm(
    `Deseja realmente excluir o plano "${plano.nome}"?`
  );

  if (!confirmar) return;

  const { data: assinaturasVinculadas } = await supabase
    .from("assinaturas_municipios")
    .select("id")
    .eq("plano_id", plano.id)
    .limit(1);

  if (assinaturasVinculadas && assinaturasVinculadas.length > 0) {
    alert(
      "Este plano possui assinatura vinculada. Cancele ou exclua as assinaturas antes de apagar o plano."
    );
    return;
  }

  const { error } = await supabase
    .from("planos_sistema")
    .delete()
    .eq("id", plano.id);

  if (error) {
    alert("Erro ao excluir plano: " + error.message);
    return;
  }

  carregarDados();
}

  function abrirNovaAssinatura() {
    setAssinaturaForm({
      municipio_id: "",
      plano_id: "",
      status: "ATIVA",
      data_vencimento: "",
      valor_mensal: "",
      observacoes: "",
    });

    setModalAssinatura(true);
  }

  async function salvarAssinatura() {
    if (!assinaturaForm.municipio_id || !assinaturaForm.plano_id) {
      alert("Selecione o município e o plano.");
      return;
    }

    const plano = planos.find((p) => p.id === assinaturaForm.plano_id);

    await supabase.from("assinaturas_municipios").insert({
      municipio_id: Number(assinaturaForm.municipio_id),
      plano_id: assinaturaForm.plano_id,
      status: assinaturaForm.status,
      data_vencimento: assinaturaForm.data_vencimento || null,
      valor_mensal: assinaturaForm.valor_mensal
        ? Number(assinaturaForm.valor_mensal)
        : plano?.valor_mensal || 0,
      observacoes: assinaturaForm.observacoes,
    });

    setModalAssinatura(false);
    carregarDados();
  }

  async function atualizarStatus(id: string, status: string) {
    await supabase
      .from("assinaturas_municipios")
      .update({ status })
      .eq("id", id);

    carregarDados();
  }

  async function excluirAssinatura(id: string) {
    if (!confirm("Deseja excluir esta assinatura?")) return;

    await supabase.from("assinaturas_municipios").delete().eq("id", id);

    carregarDados();
  }

  return (
    <div className="min-h-screen w-full bg-[#06130d] p-4 md:p-6 pb-24 text-white">
      <div className="w-full space-y-6">
        <header className="w-full overflow-hidden rounded-[28px] border border-emerald-500/20 bg-gradient-to-r from-[#07150f] via-[#0b2a1e] to-[#047857] shadow-2xl">
          <div className="relative p-6 md:p-8">
            <div className="absolute right-0 top-0 h-56 w-56 rounded-full bg-emerald-400/20 blur-3xl" />
            <div className="absolute bottom-0 left-1/2 h-44 w-44 rounded-full bg-green-300/10 blur-3xl" />

            <div className="relative flex flex-col gap-8 xl:flex-row xl:items-center xl:justify-between">
              <div>
                <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-4 py-2 text-sm font-black text-emerald-300">
                  <ShieldCheck size={17} />
                  SIG-GCM Brasil
                </div>

                <h1 className="text-4xl font-black tracking-tight md:text-6xl">
                  Planos e Assinaturas
                </h1>

                <p className="mt-4 max-w-4xl text-lg text-emerald-50/80">
                  Controle os planos comerciais, assinaturas municipais,
                  vencimentos, status e receita recorrente do sistema.
                </p>
              </div>

              <div className="flex flex-col gap-4 sm:flex-row">
                <button
                  onClick={abrirNovoPlano}
                  className="inline-flex min-w-[230px] items-center justify-center gap-3 rounded-2xl border border-emerald-400/30 bg-white/10 px-8 py-4 text-lg font-black text-white hover:bg-white/15"
                >
                  <Plus size={22} />
                  Novo Plano
                </button>

                <button
                  onClick={abrirNovaAssinatura}
                  className="inline-flex min-w-[280px] items-center justify-center gap-3 rounded-2xl bg-emerald-400 px-8 py-4 text-lg font-black text-[#062015] hover:bg-emerald-300"
                >
                  <CreditCard size={22} />
                  Nova Assinatura
                </button>
              </div>
            </div>
          </div>
        </header>

        <section className="grid grid-cols-1 gap-6 md:grid-cols-2 2xl:grid-cols-4">
          <CardResumo
            titulo="Receita Mensal"
            valor={moeda(receitaMensal)}
            texto="Receita recorrente ativa"
            icone={<CreditCard />}
          />

          <CardResumo
            titulo="Assinaturas Ativas"
            valor={String(assinaturasAtivas.length)}
            texto="Municípios com acesso ativo"
            icone={<CheckCircle2 />}
          />

          <CardResumo
            titulo="Planos"
            valor={String(planos.length)}
            texto="Planos comerciais cadastrados"
            icone={<Crown />}
          />

          <CardResumo
            titulo="Municípios"
            valor={String(municipios.length)}
            texto="Municípios no sistema"
            icone={<Building2 />}
          />
        </section>

        <section className="w-full overflow-hidden rounded-[28px] border border-emerald-500/20 bg-[#0d2419] shadow-2xl">
          <nav className="flex flex-wrap gap-2 border-b border-emerald-500/20 bg-[#0a1c14] p-3">
            {[
              ["geral", "Visão Geral"],
              ["planos", "Planos"],
              ["assinaturas", "Assinaturas"],
            ].map(([id, label]) => (
              <button
                key={id}
                onClick={() => setAba(id as any)}
                className={`rounded-2xl px-8 py-4 text-base font-black transition ${
                  aba === id
                    ? "bg-emerald-400 text-[#062015] shadow"
                    : "text-emerald-100/70 hover:bg-white/10 hover:text-white"
                }`}
              >
                {label}
              </button>
            ))}
          </nav>

          {aba === "geral" && (
            <div className="grid grid-cols-1 gap-6 p-6 xl:grid-cols-3">
              <div className="xl:col-span-2 rounded-3xl border border-emerald-500/20 bg-[#102b20] p-6">
                <h2 className="text-3xl font-black text-white">
                  Distribuição por Plano
                </h2>

                <p className="mt-1 text-emerald-100/70">
                  Quantidade de municípios por plano contratado.
                </p>

                <div className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-3">
                  {planos.length === 0 ? (
                    <div className="rounded-3xl border border-dashed border-emerald-500/20 bg-[#07150f] p-10 text-center text-emerald-100/70 md:col-span-3">
                      Nenhum plano cadastrado ainda.
                    </div>
                  ) : (
                    planos.map((plano) => {
                      const total = assinaturas.filter(
                        (a) => a.plano_id === plano.id
                      ).length;

                      const percentual = assinaturas.length
                        ? Math.min((total / assinaturas.length) * 100, 100)
                        : 0;

                      return (
                        <div
                          key={plano.id}
                          className="rounded-3xl border border-emerald-500/20 bg-[#07150f] p-6"
                        >
                          <p className="text-sm font-bold text-emerald-100/70">
                            {plano.nome}
                          </p>

                          <p className="mt-2 text-5xl font-black text-white">
                            {total}
                          </p>

                          <p className="mt-1 text-sm text-emerald-100/60">
                            assinatura(s)
                          </p>

                          <div className="mt-5 h-3 rounded-full bg-black/30">
                            <div
                              className="h-3 rounded-full bg-emerald-400"
                              style={{ width: `${percentual}%` }}
                            />
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              <div className="rounded-3xl border border-emerald-500/20 bg-[#102b20] p-6">
                <h2 className="text-3xl font-black text-white">Alertas</h2>

                <p className="mt-1 mb-6 text-emerald-100/70">
                  Pendências comerciais importantes.
                </p>

                <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-5 text-base font-bold text-emerald-300">
                  Nenhuma assinatura vencida.
                </div>

                <div className="mt-4 rounded-2xl border border-emerald-500/20 bg-[#07150f] p-5 text-base text-emerald-100/80">
                  Receita ativa atual:{" "}
                  <strong className="text-white">{moeda(receitaMensal)}</strong>
                </div>
              </div>
            </div>
          )}

          {aba === "planos" && (
            <div className="p-6">
              <div className="mb-6 flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                <div>
                  <h2 className="text-3xl font-black text-white">
                    Planos Comerciais
                  </h2>

                  <p className="text-emerald-100/70">
                    Cadastre e edite os planos vendidos aos municípios.
                  </p>
                </div>

                <button
                  onClick={abrirNovoPlano}
                  className="inline-flex min-w-[230px] items-center justify-center gap-3 rounded-2xl bg-emerald-400 px-8 py-4 text-lg font-black text-[#062015] hover:bg-emerald-300"
                >
                  <Plus size={22} />
                  Novo Plano
                </button>
              </div>

              <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                {planos.map((plano) => (
                  <div
                    key={plano.id}
                    className="rounded-3xl border border-emerald-500/20 bg-[#102b20] p-6 shadow-lg"
                  >
                    <div className="mb-5 flex items-start justify-between gap-3">
                      <div>
                        <h3 className="text-2xl font-black text-white">
                          {plano.nome}
                        </h3>

                        <p className="mt-1 text-sm text-emerald-100/70">
                          {plano.descricao || "Sem descrição cadastrada."}
                        </p>
                      </div>

                      <span
                        className={`rounded-full border px-3 py-1 text-xs font-black ${
                          plano.ativo
                            ? "border-emerald-500/30 bg-emerald-500/15 text-emerald-300"
                            : "border-red-500/30 bg-red-500/15 text-red-300"
                        }`}
                      >
                        {plano.ativo ? "ATIVO" : "INATIVO"}
                      </span>
                    </div>

                    <div className="mb-5 rounded-2xl border border-emerald-500/20 bg-[#07150f] p-5">
                      <p className="text-sm text-emerald-100/60">
                        Mensalidade
                      </p>

                      <p className="text-4xl font-black text-emerald-300">
                        {moeda(plano.valor_mensal)}
                      </p>
                    </div>

                    <div className="mb-5 grid grid-cols-2 gap-3">
                      <div className="rounded-2xl border border-emerald-500/20 bg-[#0d2419] p-4">
                        <p className="text-xs font-bold text-emerald-100/60">
                          Implantação
                        </p>

                        <p className="font-black text-white">
                          {moeda(plano.valor_implantacao)}
                        </p>
                      </div>

                      <div className="rounded-2xl border border-emerald-500/20 bg-[#0d2419] p-4">
                        <p className="text-xs font-bold text-emerald-100/60">
                          Usuários
                        </p>

                        <p className="font-black text-white">
                          {plano.limite_usuarios || "Ilimitado"}
                        </p>
                      </div>
                    </div>

                    <div className="mb-5 space-y-2">
                      {(plano.recursos || []).slice(0, 6).map((recurso) => (
                        <p
                          key={recurso}
                          className="flex gap-2 text-sm text-emerald-100/80"
                        >
                          <CheckCircle2
                            size={16}
                            className="mt-0.5 shrink-0 text-emerald-300"
                          />
                          {recurso}
                        </p>
                      ))}
                    </div>

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
  <button
    onClick={() => editarPlano(plano)}
    className="rounded-2xl border border-emerald-500/20 bg-white/10 px-4 py-4 font-black text-white hover:bg-white/15"
  >
    Editar
  </button>

  <button
    onClick={() => alternarPlano(plano)}
    className="rounded-2xl bg-emerald-400 px-4 py-4 font-black text-[#062015] hover:bg-emerald-300"
  >
    {plano.ativo ? "Desativar" : "Ativar"}
  </button>

  <button
    onClick={() => excluirPlano(plano)}
    className="inline-flex items-center justify-center gap-2 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-4 font-black text-red-300 hover:bg-red-500/15"
  >
    <Trash2 size={18} />
    Apagar
  </button>
</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {aba === "assinaturas" && (
            <div className="p-6">
              <div className="mb-6 flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-emerald-500/30 bg-emerald-500/15 text-emerald-300">
                    <CreditCard size={34} />
                  </div>

                  <div>
                    <h2 className="text-3xl font-black text-white">
                      Assinaturas Municipais
                    </h2>

                    <p className="text-emerald-100/70">
                      Controle o plano, valor, vencimento e status de cada
                      município.
                    </p>
                  </div>
                </div>

                <div className="flex flex-col gap-4 md:flex-row">
                  <div className="relative">
                    <Search
                      size={22}
                      className="absolute left-4 top-4 text-emerald-100/50"
                    />

                    <input
                      value={busca}
                      onChange={(e) => setBusca(e.target.value)}
                      placeholder="Buscar município ou plano..."
                      className="w-full rounded-2xl border border-emerald-500/20 bg-[#07150f] py-4 pl-12 pr-4 text-white outline-none placeholder:text-emerald-100/40 md:w-[360px]"
                    />
                  </div>

                  <select
                    value={statusFiltro}
                    onChange={(e) => setStatusFiltro(e.target.value)}
                    className="rounded-2xl border border-emerald-500/20 bg-[#07150f] px-6 py-4 text-white outline-none"
                  >
                    <option value="TODOS">Todos</option>
                    <option value="ATIVA">Ativas</option>
                    <option value="PENDENTE">Pendentes</option>
                    <option value="VENCIDA">Vencidas</option>
                    <option value="CANCELADA">Canceladas</option>
                  </select>

                  <button
                    onClick={abrirNovaAssinatura}
                    className="inline-flex min-w-[240px] items-center justify-center gap-3 rounded-2xl bg-emerald-400 px-8 py-4 text-lg font-black text-[#062015] hover:bg-emerald-300"
                  >
                    <Plus size={22} />
                    Nova Assinatura
                  </button>
                </div>
              </div>

              {carregando ? (
                <p className="text-emerald-100/70">Carregando...</p>
              ) : assinaturasFiltradas.length === 0 ? (
                <div className="flex min-h-[440px] flex-col items-center justify-center rounded-3xl border border-dashed border-emerald-500/20 bg-[#07150f] p-10 text-center">
                  <CreditCard size={90} className="mb-6 text-emerald-400" />

                  <h3 className="mb-3 text-3xl font-black text-white">
                    Nenhuma assinatura encontrada
                  </h3>

                  <p className="mb-8 max-w-xl text-lg text-emerald-100/70">
                    Cadastre a primeira assinatura do sistema e vincule um
                    município a um plano comercial.
                  </p>

                  <button
                    onClick={abrirNovaAssinatura}
                    className="rounded-2xl bg-emerald-400 px-10 py-5 text-lg font-black text-[#062015] hover:bg-emerald-300"
                  >
                    + Nova Assinatura
                  </button>
                </div>
              ) : (
                <div className="overflow-hidden rounded-3xl border border-emerald-500/20">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-[#07150f] text-emerald-100/70">
                        <tr>
                          <th className="p-5 text-left">Município</th>
                          <th className="p-5 text-left">Plano</th>
                          <th className="p-5 text-left">Valor</th>
                          <th className="p-5 text-left">Vencimento</th>
                          <th className="p-5 text-left">Status</th>
                          <th className="p-5 text-right">Ações</th>
                        </tr>
                      </thead>

                      <tbody className="divide-y divide-emerald-500/10 bg-[#0d2419]">
                        {assinaturasFiltradas.map((a) => (
                          <tr key={a.id} className="hover:bg-white/[0.03]">
                            <td className="p-5">
                              <div className="flex items-center gap-3">
                                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-400/15 text-emerald-300">
                                  <Building2 size={22} />
                                </div>

                                <div>
                                  <p className="font-black text-white">
                                    {a.municipios?.nome ||
                                      "Município não encontrado"}
                                  </p>

                                  <p className="text-xs text-emerald-100/50">
                                    ID {a.municipio_id}
                                  </p>
                                </div>
                              </div>
                            </td>

                            <td className="p-5 font-bold text-emerald-100/80">
                              {a.planos_sistema?.nome ||
                                "Plano não encontrado"}
                            </td>

                            <td className="p-5 font-black text-emerald-300">
                              {moeda(a.valor_mensal)}
                            </td>

                            <td className="p-5 text-emerald-100/80">
                              {dataBR(a.data_vencimento)}
                            </td>

                            <td className="p-5">
                              <select
                                value={a.status}
                                onChange={(e) =>
                                  atualizarStatus(a.id, e.target.value)
                                }
                                className={`rounded-full border px-4 py-3 text-xs font-black outline-none ${
                                  statusClasses[a.status] ||
                                  statusClasses.PENDENTE
                                }`}
                              >
                                <option value="ATIVA">ATIVA</option>
                                <option value="PENDENTE">PENDENTE</option>
                                <option value="VENCIDA">VENCIDA</option>
                                <option value="CANCELADA">CANCELADA</option>
                              </select>
                            </td>

                            <td className="p-5 text-right">
                              <button
                                onClick={() => excluirAssinatura(a.id)}
                                className="inline-flex items-center gap-2 rounded-2xl border border-red-500/30 bg-red-500/10 px-5 py-3 font-bold text-red-300 hover:bg-red-500/15"
                              >
                                <Trash2 size={18} />
                                Excluir
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </section>
      </div>

      {modalPlano && (
        <Modal
          titulo={editandoPlanoId ? "Editar Plano" : "Novo Plano"}
          onClose={() => setModalPlano(false)}
        >
          <div className="space-y-4">
            <input
              className="campo"
              placeholder="Nome do plano"
              value={planoForm.nome}
              onChange={(e) =>
                setPlanoForm({ ...planoForm, nome: e.target.value })
              }
            />

            <textarea
              className="campo min-h-24"
              placeholder="Descrição do plano"
              value={planoForm.descricao}
              onChange={(e) =>
                setPlanoForm({ ...planoForm, descricao: e.target.value })
              }
            />

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <input
                className="campo"
                type="number"
                placeholder="Valor mensal"
                value={planoForm.valor_mensal}
                onChange={(e) =>
                  setPlanoForm({ ...planoForm, valor_mensal: e.target.value })
                }
              />

              <input
                className="campo"
                type="number"
                placeholder="Implantação"
                value={planoForm.valor_implantacao}
                onChange={(e) =>
                  setPlanoForm({
                    ...planoForm,
                    valor_implantacao: e.target.value,
                  })
                }
              />

              <input
                className="campo"
                type="number"
                placeholder="Limite de usuários"
                value={planoForm.limite_usuarios}
                onChange={(e) =>
                  setPlanoForm({
                    ...planoForm,
                    limite_usuarios: e.target.value,
                  })
                }
              />
            </div>

            <textarea
              className="campo min-h-28"
              placeholder="Recursos separados por vírgula"
              value={planoForm.recursos}
              onChange={(e) =>
                setPlanoForm({ ...planoForm, recursos: e.target.value })
              }
            />

            <button
              onClick={salvarPlano}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-400 px-5 py-4 font-black text-[#062015] hover:bg-emerald-300"
            >
              <Save size={18} />
              Salvar Plano
            </button>
          </div>
        </Modal>
      )}

      {modalAssinatura && (
        <Modal
          titulo="Nova Assinatura"
          onClose={() => setModalAssinatura(false)}
        >
          <div className="space-y-4">
            <select
              className="campo"
              value={assinaturaForm.municipio_id}
              onChange={(e) =>
                setAssinaturaForm({
                  ...assinaturaForm,
                  municipio_id: e.target.value,
                })
              }
            >
              <option value="">Selecione o município</option>
              {municipios.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.nome}
                </option>
              ))}
            </select>

            <select
              className="campo"
              value={assinaturaForm.plano_id}
              onChange={(e) =>
                setAssinaturaForm({
                  ...assinaturaForm,
                  plano_id: e.target.value,
                })
              }
            >
              <option value="">Selecione o plano</option>
              {planos
                .filter((p) => p.ativo)
                .map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nome} - {moeda(p.valor_mensal)}
                  </option>
                ))}
            </select>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <select
                className="campo"
                value={assinaturaForm.status}
                onChange={(e) =>
                  setAssinaturaForm({
                    ...assinaturaForm,
                    status: e.target.value,
                  })
                }
              >
                <option value="ATIVA">ATIVA</option>
                <option value="PENDENTE">PENDENTE</option>
                <option value="VENCIDA">VENCIDA</option>
                <option value="CANCELADA">CANCELADA</option>
              </select>

              <input
                type="date"
                className="campo"
                value={assinaturaForm.data_vencimento}
                onChange={(e) =>
                  setAssinaturaForm({
                    ...assinaturaForm,
                    data_vencimento: e.target.value,
                  })
                }
              />

              <input
                type="number"
                className="campo"
                placeholder="Valor mensal"
                value={assinaturaForm.valor_mensal}
                onChange={(e) =>
                  setAssinaturaForm({
                    ...assinaturaForm,
                    valor_mensal: e.target.value,
                  })
                }
              />
            </div>

            <textarea
              className="campo min-h-24"
              placeholder="Observações"
              value={assinaturaForm.observacoes}
              onChange={(e) =>
                setAssinaturaForm({
                  ...assinaturaForm,
                  observacoes: e.target.value,
                })
              }
            />

            <button
              onClick={salvarAssinatura}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-400 px-5 py-4 font-black text-[#062015] hover:bg-emerald-300"
            >
              <Save size={18} />
              Criar Assinatura
            </button>
          </div>
        </Modal>
      )}

      <style jsx>{`
        .campo {
          width: 100%;
          border-radius: 1rem;
          border: 1px solid rgba(16, 185, 129, 0.25);
          background: #07150f;
          padding: 1rem;
          color: white;
          outline: none;
        }

        .campo::placeholder {
          color: rgba(209, 250, 229, 0.45);
        }

        .campo:focus {
          border-color: #34d399;
          box-shadow: 0 0 0 3px rgba(52, 211, 153, 0.15);
        }

        option {
          background: #07150f;
          color: white;
        }
      `}</style>
    </div>
  );
}

function CardResumo({
  titulo,
  valor,
  texto,
  icone,
}: {
  titulo: string;
  valor: string;
  texto: string;
  icone: React.ReactNode;
}) {
  return (
    <div className="min-h-[180px] rounded-3xl border border-emerald-500/20 bg-[#0d2419] p-7 shadow-lg">
      <div className="mb-5 flex items-center justify-between">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-emerald-400/30 bg-emerald-500/15 text-emerald-300">
          {icone}
        </div>

        <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-black text-emerald-300">
          SIG
        </span>
      </div>

      <p className="text-base font-bold uppercase tracking-wide text-emerald-100/70">
        {titulo}
      </p>

      <p className="mt-2 text-4xl font-black text-white">{valor}</p>

      <p className="mt-3 text-base text-emerald-100/60">{texto}</p>
    </div>
  );
}

function Modal({
  titulo,
  children,
  onClose,
}: {
  titulo: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="w-full max-w-3xl rounded-3xl border border-emerald-500/20 bg-[#0f241b] p-6 shadow-2xl">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-2xl font-black text-white">{titulo}</h2>

          <button
            onClick={onClose}
            className="rounded-2xl border border-white/10 bg-white/10 p-3 text-white hover:bg-white/15"
          >
            <X size={20} />
          </button>
        </div>

        {children}
      </div>
    </div>
  );
}