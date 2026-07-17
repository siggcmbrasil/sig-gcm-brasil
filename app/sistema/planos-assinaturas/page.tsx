"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  BarChart3,
  Building2,
  Check,
  CheckCircle2,
  CircleDollarSign,
  CreditCard,
  Crown,
  Plus,
  Save,
  Search,
  Settings2,
  ShieldCheck,
  Trash2,
  Users,
  X,
} from "lucide-react";

import { MODULOS_SISTEMA } from "@/lib/config/modulosSistema";
import { supabase } from "@/lib/supabase";

type Aba = "geral" | "planos" | "assinaturas" | "comparador";

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

type PlanoModulo = {
  id: number;
  plano_id: string;
  modulo: string;
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

type PlanoForm = {
  nome: string;
  descricao: string;
  valor_mensal: string;
  valor_implantacao: string;
  limite_usuarios: string;
};

type AssinaturaForm = {
  municipio_id: string;
  plano_id: string;
  status: string;
  data_vencimento: string;
  valor_mensal: string;
  observacoes: string;
};

const STATUS_CLASSES: Record<string, string> = {
  ATIVA: "border-emerald-500/30 bg-emerald-500/15 text-emerald-300",
  PENDENTE: "border-amber-500/30 bg-amber-500/15 text-amber-300",
  VENCIDA: "border-red-500/30 bg-red-500/15 text-red-300",
  CANCELADA: "border-slate-500/30 bg-slate-500/15 text-slate-300",
};

const PLANO_VAZIO: PlanoForm = {
  nome: "",
  descricao: "",
  valor_mensal: "",
  valor_implantacao: "",
  limite_usuarios: "",
};

const ASSINATURA_VAZIA: AssinaturaForm = {
  municipio_id: "",
  plano_id: "",
  status: "ATIVA",
  data_vencimento: "",
  valor_mensal: "",
  observacoes: "",
};

function todosOsModulos() {
  return MODULOS_SISTEMA.flatMap((categoria) =>
    categoria.itens.map((item) => item.slug),
  );
}

function corPlano(plano: Plano, indice: number) {
  const nome = plano.nome.toLowerCase();

  if (nome.includes("premium")) {
    return {
      borda: "border-violet-500/30",
      fundo: "from-violet-500/15 via-[#10271f] to-[#0b1f17]",
      destaque: "text-violet-300",
      botao: "bg-violet-400 text-violet-950 hover:bg-violet-300",
    };
  }

  if (nome.includes("profissional") || nome.includes("pro")) {
    return {
      borda: "border-cyan-500/30",
      fundo: "from-cyan-500/15 via-[#10271f] to-[#0b1f17]",
      destaque: "text-cyan-300",
      botao: "bg-cyan-400 text-cyan-950 hover:bg-cyan-300",
    };
  }

  if (indice % 3 === 1) {
    return {
      borda: "border-blue-500/30",
      fundo: "from-blue-500/15 via-[#10271f] to-[#0b1f17]",
      destaque: "text-blue-300",
      botao: "bg-blue-400 text-blue-950 hover:bg-blue-300",
    };
  }

  return {
    borda: "border-emerald-500/30",
    fundo: "from-emerald-500/15 via-[#10271f] to-[#0b1f17]",
    destaque: "text-emerald-300",
    botao: "bg-emerald-400 text-[#062015] hover:bg-emerald-300",
  };
}

export default function PlanosAssinaturasPage() {
  const [planos, setPlanos] = useState<Plano[]>([]);
  const [municipios, setMunicipios] = useState<Municipio[]>([]);
  const [assinaturas, setAssinaturas] = useState<Assinatura[]>([]);
  const [modulosPlano, setModulosPlano] = useState<PlanoModulo[]>([]);
  const [modulosSelecionados, setModulosSelecionados] = useState<string[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [salvandoPlano, setSalvandoPlano] = useState(false);
  const [salvandoAssinatura, setSalvandoAssinatura] = useState(false);

  const [aba, setAba] = useState<Aba>("geral");
  const [busca, setBusca] = useState("");
  const [statusFiltro, setStatusFiltro] = useState("TODOS");

  const [modalPlano, setModalPlano] = useState(false);
  const [modalAssinatura, setModalAssinatura] = useState(false);
  const [editandoPlanoId, setEditandoPlanoId] = useState<string | null>(null);

  const [planoForm, setPlanoForm] = useState<PlanoForm>(PLANO_VAZIO);
  const [assinaturaForm, setAssinaturaForm] =
    useState<AssinaturaForm>(ASSINATURA_VAZIA);

  useEffect(() => {
    void carregarDados();
  }, []);

  async function carregarDados() {
    setCarregando(true);

    try {
      const [
        planosResposta,
        municipiosResposta,
        modulosResposta,
        assinaturasResposta,
      ] = await Promise.all([
        supabase
          .from("planos_sistema")
          .select("*")
          .order("valor_mensal", { ascending: true }),
        supabase.from("municipios").select("id,nome").order("nome"),
        supabase.from("planos_modulos").select("id,plano_id,modulo,ativo"),
        supabase
          .from("assinaturas_municipios")
          .select(`*, municipios(id,nome), planos_sistema(*)`)
          .order("criado_em", { ascending: false }),
      ]);

      if (planosResposta.error) throw planosResposta.error;
      if (municipiosResposta.error) throw municipiosResposta.error;
      if (modulosResposta.error) throw modulosResposta.error;
      if (assinaturasResposta.error) throw assinaturasResposta.error;

      setPlanos((planosResposta.data || []) as Plano[]);
      setMunicipios((municipiosResposta.data || []) as Municipio[]);
      setModulosPlano((modulosResposta.data || []) as PlanoModulo[]);
      setAssinaturas((assinaturasResposta.data || []) as Assinatura[]);
    } catch (error) {
      console.error("Erro ao carregar planos e assinaturas:", error);
      alert("Não foi possível carregar os planos e assinaturas.");
    } finally {
      setCarregando(false);
    }
  }

  function moeda(valor: number | null | undefined) {
    return Number(valor || 0).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  }

  function dataBR(data: string | null) {
    if (!data) return "Sem vencimento";
    return new Date(`${data}T12:00:00`).toLocaleDateString("pt-BR");
  }

  function quantidadeModulos(planoId: string) {
    return modulosPlano.filter(
      (item) => item.plano_id === planoId && item.ativo,
    ).length;
  }

  function nomesModulos(planoId: string) {
    const slugs = new Set(
      modulosPlano
        .filter((item) => item.plano_id === planoId && item.ativo)
        .map((item) => item.modulo),
    );

    return MODULOS_SISTEMA.flatMap((categoria) => categoria.itens)
      .filter((item) => slugs.has(item.slug))
      .map((item) => item.nome);
  }

  const assinaturasAtivas = useMemo(
    () => assinaturas.filter((item) => item.status === "ATIVA"),
    [assinaturas],
  );

  const receitaMensal = useMemo(
    () =>
      assinaturasAtivas.reduce(
        (total, item) => total + Number(item.valor_mensal || 0),
        0,
      ),
    [assinaturasAtivas],
  );

  const receitaAnual = receitaMensal * 12;
  const ticketMedio = assinaturasAtivas.length
    ? receitaMensal / assinaturasAtivas.length
    : 0;

  const vencendoEm7Dias = useMemo(() => {
    const hoje = new Date();
    const limite = new Date();
    limite.setDate(limite.getDate() + 7);

    return assinaturas.filter((item) => {
      if (!item.data_vencimento || item.status !== "ATIVA") return false;
      const vencimento = new Date(`${item.data_vencimento}T12:00:00`);
      return vencimento >= hoje && vencimento <= limite;
    }).length;
  }, [assinaturas]);

  const assinaturasFiltradas = useMemo(() => {
    const termo = busca.trim().toLowerCase();

    return assinaturas.filter((item) => {
      const municipio = item.municipios?.nome?.toLowerCase() || "";
      const plano = item.planos_sistema?.nome?.toLowerCase() || "";
      const bateBusca =
        !termo || municipio.includes(termo) || plano.includes(termo);
      const bateStatus =
        statusFiltro === "TODOS" || item.status === statusFiltro;

      return bateBusca && bateStatus;
    });
  }, [assinaturas, busca, statusFiltro]);

  function limparPlano() {
    setEditandoPlanoId(null);
    setPlanoForm(PLANO_VAZIO);
    setModulosSelecionados([]);
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
    });
    setModulosSelecionados(
      modulosPlano
        .filter((item) => item.plano_id === plano.id && item.ativo)
        .map((item) => item.modulo),
    );
    setModalPlano(true);
  }

  async function salvarPlano() {
    if (!planoForm.nome.trim() || !planoForm.valor_mensal) {
      alert("Informe o nome e o valor mensal do plano.");
      return;
    }

    setSalvandoPlano(true);

    try {
      const payload = {
        nome: planoForm.nome.trim(),
        descricao: planoForm.descricao.trim(),
        valor_mensal: Number(planoForm.valor_mensal),
        valor_implantacao: Number(planoForm.valor_implantacao || 0),
        limite_usuarios: planoForm.limite_usuarios
          ? Number(planoForm.limite_usuarios)
          : null,
        recursos: [],
      };

      let planoId = editandoPlanoId;

      if (planoId) {
        const { error } = await supabase
          .from("planos_sistema")
          .update(payload)
          .eq("id", planoId);
        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from("planos_sistema")
          .insert(payload)
          .select("id")
          .single();
        if (error) throw error;
        planoId = data?.id || null;
      }

      if (!planoId)
        throw new Error("Plano não identificado após o salvamento.");

      const { error: excluirError } = await supabase
        .from("planos_modulos")
        .delete()
        .eq("plano_id", planoId);
      if (excluirError) throw excluirError;

      if (modulosSelecionados.length > 0) {
        const { error: modulosError } = await supabase
          .from("planos_modulos")
          .insert(
            Array.from(new Set(modulosSelecionados)).map((modulo) => ({
              plano_id: planoId,
              modulo,
              ativo: true,
            })),
          );
        if (modulosError) throw modulosError;
      }

      setModalPlano(false);
      limparPlano();
      await carregarDados();
    } catch (error) {
      console.error("Erro ao salvar plano:", error);
      alert(error instanceof Error ? error.message : "Erro ao salvar o plano.");
    } finally {
      setSalvandoPlano(false);
    }
  }

  async function alternarPlano(plano: Plano) {
    const { error } = await supabase
      .from("planos_sistema")
      .update({ ativo: !plano.ativo })
      .eq("id", plano.id);

    if (error) {
      alert(`Erro ao atualizar plano: ${error.message}`);
      return;
    }

    await carregarDados();
  }

  async function excluirPlano(plano: Plano) {
    if (!confirm(`Deseja realmente excluir o plano "${plano.nome}"?`)) return;

    const { data: vinculadas, error: consultaError } = await supabase
      .from("assinaturas_municipios")
      .select("id")
      .eq("plano_id", plano.id)
      .limit(1);

    if (consultaError) {
      alert(consultaError.message);
      return;
    }

    if (vinculadas?.length) {
      alert("Este plano possui assinatura vinculada.");
      return;
    }

    const { error } = await supabase
      .from("planos_sistema")
      .delete()
      .eq("id", plano.id);

    if (error) {
      alert(`Erro ao excluir plano: ${error.message}`);
      return;
    }

    await carregarDados();
  }

  function abrirNovaAssinatura() {
    setAssinaturaForm(ASSINATURA_VAZIA);
    setModalAssinatura(true);
  }

  async function salvarAssinatura() {
    if (!assinaturaForm.municipio_id || !assinaturaForm.plano_id) {
      alert("Selecione o município e o plano.");
      return;
    }

    setSalvandoAssinatura(true);

    try {
      const plano = planos.find((item) => item.id === assinaturaForm.plano_id);

      const { error } = await supabase.from("assinaturas_municipios").insert({
        municipio_id: Number(assinaturaForm.municipio_id),
        plano_id: assinaturaForm.plano_id,
        status: assinaturaForm.status,
        data_vencimento: assinaturaForm.data_vencimento || null,
        valor_mensal: assinaturaForm.valor_mensal
          ? Number(assinaturaForm.valor_mensal)
          : plano?.valor_mensal || 0,
        observacoes: assinaturaForm.observacoes.trim(),
      });

      if (error) throw error;

      setModalAssinatura(false);
      await carregarDados();
    } catch (error) {
      console.error("Erro ao criar assinatura:", error);
      alert(
        error instanceof Error ? error.message : "Erro ao criar assinatura.",
      );
    } finally {
      setSalvandoAssinatura(false);
    }
  }

  async function atualizarStatus(id: string, status: string) {
    const { error } = await supabase
      .from("assinaturas_municipios")
      .update({ status })
      .eq("id", id);

    if (error) {
      alert(error.message);
      return;
    }

    await carregarDados();
  }

  async function excluirAssinatura(id: string) {
    if (!confirm("Deseja excluir esta assinatura?")) return;

    const { error } = await supabase
      .from("assinaturas_municipios")
      .delete()
      .eq("id", id);

    if (error) {
      alert(error.message);
      return;
    }

    await carregarDados();
  }

  return (
    <main className="min-h-screen bg-[#06130d] p-3 pb-24 text-white md:p-6">
      <div className="space-y-5">
        <header className="overflow-hidden rounded-[28px] border border-emerald-500/20 bg-gradient-to-r from-[#07150f] via-[#0b2a1e] to-[#047857] shadow-2xl">
          <div className="relative p-5 md:p-8">
            <div className="absolute right-0 top-0 h-56 w-56 rounded-full bg-emerald-400/20 blur-3xl" />
            <div className="relative flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">
              <div>
                <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-4 py-2 text-sm font-black text-emerald-300">
                  <ShieldCheck size={17} /> SIG-GCM Brasil
                </div>
                <h1 className="text-3xl font-black tracking-tight md:text-6xl">
                  Planos e Assinaturas
                </h1>
                <p className="mt-3 max-w-4xl text-sm text-emerald-50/80 md:text-lg">
                  Controle comercial, licenciamento por módulos e assinaturas
                  municipais.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <button
                  onClick={abrirNovoPlano}
                  className="btn-topo-secundario"
                >
                  <Plus size={20} /> Novo Plano
                </button>
                <button
                  onClick={abrirNovaAssinatura}
                  className="btn-topo-principal"
                >
                  <CreditCard size={20} /> Nova Assinatura
                </button>
              </div>
            </div>
          </div>
        </header>

        <section className="grid grid-cols-2 gap-3 xl:grid-cols-4">
          <CardResumo
            titulo="Receita mensal"
            valor={moeda(receitaMensal)}
            texto="Receita recorrente ativa"
            icone={<CircleDollarSign />}
          />
          <CardResumo
            titulo="Receita anual"
            valor={moeda(receitaAnual)}
            texto="Projeção das assinaturas"
            icone={<BarChart3 />}
          />
          <CardResumo
            titulo="Municípios ativos"
            valor={String(assinaturasAtivas.length)}
            texto="Assinaturas com acesso"
            icone={<Building2 />}
          />
          <CardResumo
            titulo="Ticket médio"
            valor={moeda(ticketMedio)}
            texto={`${vencendoEm7Dias} vencendo em 7 dias`}
            icone={<CreditCard />}
          />
        </section>

        <section className="overflow-hidden rounded-[28px] border border-emerald-500/20 bg-[#0d2419] shadow-2xl">
          <nav className="flex gap-2 overflow-x-auto border-b border-emerald-500/20 bg-[#0a1c14] p-3">
            <AbaBotao
              ativo={aba === "geral"}
              onClick={() => setAba("geral")}
              icone={<BarChart3 size={18} />}
              texto="Dashboard"
            />
            <AbaBotao
              ativo={aba === "planos"}
              onClick={() => setAba("planos")}
              icone={<Crown size={18} />}
              texto="Planos"
            />
            <AbaBotao
              ativo={aba === "assinaturas"}
              onClick={() => setAba("assinaturas")}
              icone={<CreditCard size={18} />}
              texto="Assinaturas"
            />
            <AbaBotao
              ativo={aba === "comparador"}
              onClick={() => setAba("comparador")}
              icone={<Settings2 size={18} />}
              texto="Comparador"
            />
          </nav>

          {aba === "geral" && (
            <div className="grid gap-5 p-4 xl:grid-cols-[1fr_360px] xl:p-6">
              <section className="rounded-3xl border border-emerald-500/20 bg-[#102b20] p-5">
                <h2 className="text-2xl font-black">Distribuição por plano</h2>
                <p className="mt-1 text-sm text-emerald-100/60">
                  Municípios vinculados a cada plano.
                </p>
                <div className="mt-5 grid gap-4 md:grid-cols-3">
                  {planos.map((plano, indice) => {
                    const total = assinaturas.filter(
                      (item) => item.plano_id === plano.id,
                    ).length;
                    const cor = corPlano(plano, indice);
                    return (
                      <div
                        key={plano.id}
                        className={`rounded-3xl border bg-gradient-to-br p-5 ${cor.borda} ${cor.fundo}`}
                      >
                        <p className={`font-black ${cor.destaque}`}>
                          {plano.nome}
                        </p>
                        <p className="mt-2 text-5xl font-black">{total}</p>
                        <p className="text-sm text-emerald-100/60">
                          município(s)
                        </p>
                        <div className="mt-4 flex items-center justify-between text-xs text-emerald-100/60">
                          <span>{quantidadeModulos(plano.id)} módulos</span>
                          <span>{plano.limite_usuarios || "∞"} usuários</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>

              <aside className="space-y-4 rounded-3xl border border-emerald-500/20 bg-[#102b20] p-5">
                <h2 className="text-2xl font-black">Resumo comercial</h2>
                <ResumoLinha
                  titulo="Planos cadastrados"
                  valor={String(planos.length)}
                />
                <ResumoLinha
                  titulo="Municípios no sistema"
                  valor={String(municipios.length)}
                />
                <ResumoLinha
                  titulo="Assinaturas pendentes"
                  valor={String(
                    assinaturas.filter((item) => item.status === "PENDENTE")
                      .length,
                  )}
                />
                <ResumoLinha
                  titulo="Assinaturas vencidas"
                  valor={String(
                    assinaturas.filter((item) => item.status === "VENCIDA")
                      .length,
                  )}
                  destaque="text-red-300"
                />
              </aside>
            </div>
          )}

          {aba === "planos" && (
            <div className="p-4 xl:p-6">
              <div className="mb-5 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <h2 className="text-3xl font-black">Planos comerciais</h2>
                  <p className="text-emerald-100/60">
                    Valores, limites e módulos liberados.
                  </p>
                </div>
                <button onClick={abrirNovoPlano} className="btn-topo-principal">
                  <Plus size={20} /> Novo Plano
                </button>
              </div>

              {carregando ? (
                <Carregando />
              ) : planos.length === 0 ? (
                <Vazio
                  icone={<Crown size={72} />}
                  titulo="Nenhum plano cadastrado"
                  texto="Crie o primeiro plano comercial do SIG-GCM Brasil."
                />
              ) : (
                <div className="grid gap-5 lg:grid-cols-2 2xl:grid-cols-3">
                  {planos.map((plano, indice) => {
                    const cor = corPlano(plano, indice);
                    const modulos = nomesModulos(plano.id);
                    const municipiosPlano = assinaturas.filter(
                      (item) => item.plano_id === plano.id,
                    ).length;
                    return (
                      <article
                        key={plano.id}
                        className={`overflow-hidden rounded-3xl border bg-gradient-to-br shadow-xl ${cor.borda} ${cor.fundo}`}
                      >
                        <div className="p-5">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p
                                className={`text-sm font-black uppercase tracking-wider ${cor.destaque}`}
                              >
                                Plano
                              </p>
                              <h3 className="mt-1 text-3xl font-black">
                                {plano.nome}
                              </h3>
                              <p className="mt-2 min-h-10 text-sm text-emerald-100/60">
                                {plano.descricao || "Sem descrição cadastrada."}
                              </p>
                            </div>
                            <span
                              className={`rounded-full border px-3 py-1 text-xs font-black ${plano.ativo ? "border-emerald-500/30 bg-emerald-500/15 text-emerald-300" : "border-red-500/30 bg-red-500/15 text-red-300"}`}
                            >
                              {plano.ativo ? "ATIVO" : "INATIVO"}
                            </span>
                          </div>

                          <div className="mt-5 rounded-2xl border border-white/10 bg-black/20 p-4">
                            <p className="text-sm text-emerald-100/60">
                              Mensalidade
                            </p>
                            <p
                              className={`text-4xl font-black ${cor.destaque}`}
                            >
                              {moeda(plano.valor_mensal)}
                            </p>
                          </div>

                          <div className="mt-4 grid grid-cols-3 gap-2">
                            <MiniInfo
                              titulo="Módulos"
                              valor={String(modulos.length)}
                            />
                            <MiniInfo
                              titulo="Usuários"
                              valor={
                                plano.limite_usuarios
                                  ? String(plano.limite_usuarios)
                                  : "∞"
                              }
                            />
                            <MiniInfo
                              titulo="Municípios"
                              valor={String(municipiosPlano)}
                            />
                          </div>

                          <div className="mt-5 space-y-2">
                            {modulos.slice(0, 5).map((modulo) => (
                              <p
                                key={modulo}
                                className="flex items-center gap-2 text-sm text-emerald-50/80"
                              >
                                <CheckCircle2
                                  size={16}
                                  className={cor.destaque}
                                />{" "}
                                {modulo}
                              </p>
                            ))}
                            {modulos.length > 5 && (
                              <p
                                className={`text-sm font-black ${cor.destaque}`}
                              >
                                + {modulos.length - 5} módulos
                              </p>
                            )}
                            {modulos.length === 0 && (
                              <p className="text-sm text-amber-300">
                                Nenhum módulo configurado.
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="grid grid-cols-3 gap-2 border-t border-white/10 bg-black/10 p-4">
                          <button
                            onClick={() => editarPlano(plano)}
                            className="acao-card"
                          >
                            Editar
                          </button>
                          <button
                            onClick={() => void alternarPlano(plano)}
                            className={`${cor.botao} rounded-2xl px-3 py-3 text-sm font-black`}
                          >
                            {plano.ativo ? "Desativar" : "Ativar"}
                          </button>
                          <button
                            onClick={() => void excluirPlano(plano)}
                            className="rounded-2xl border border-red-500/30 bg-red-500/10 px-3 py-3 text-sm font-black text-red-300 hover:bg-red-500/20"
                          >
                            Apagar
                          </button>
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {aba === "assinaturas" && (
            <div className="p-4 xl:p-6">
              <div className="mb-5 flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                <div>
                  <h2 className="text-3xl font-black">
                    Assinaturas municipais
                  </h2>
                  <p className="text-emerald-100/60">
                    Plano, vencimento, valor e situação comercial.
                  </p>
                </div>
                <div className="flex flex-col gap-3 md:flex-row">
                  <div className="relative">
                    <Search
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-100/40"
                      size={20}
                    />
                    <input
                      value={busca}
                      onChange={(event) => setBusca(event.target.value)}
                      placeholder="Buscar município ou plano..."
                      className="campo pl-12 md:w-[340px]"
                    />
                  </div>
                  <select
                    value={statusFiltro}
                    onChange={(event) => setStatusFiltro(event.target.value)}
                    className="campo md:w-44"
                  >
                    <option value="TODOS">Todos</option>
                    <option value="ATIVA">Ativas</option>
                    <option value="PENDENTE">Pendentes</option>
                    <option value="VENCIDA">Vencidas</option>
                    <option value="CANCELADA">Canceladas</option>
                  </select>
                  <button
                    onClick={abrirNovaAssinatura}
                    className="btn-topo-principal"
                  >
                    <Plus size={20} /> Nova Assinatura
                  </button>
                </div>
              </div>

              {carregando ? (
                <Carregando />
              ) : assinaturasFiltradas.length === 0 ? (
                <Vazio
                  icone={<CreditCard size={72} />}
                  titulo="Nenhuma assinatura encontrada"
                  texto="Vincule um município a um plano comercial."
                />
              ) : (
                <>
                  <div className="grid gap-4 md:hidden">
                    {assinaturasFiltradas.map((assinatura) => (
                      <article
                        key={assinatura.id}
                        className="rounded-3xl border border-emerald-500/20 bg-[#102b20] p-4"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <h3 className="text-xl font-black">
                              {assinatura.municipios?.nome || "Município"}
                            </h3>
                            <p className="text-sm text-emerald-300">
                              {assinatura.planos_sistema?.nome ||
                                "Plano não encontrado"}
                            </p>
                          </div>
                          <Status status={assinatura.status} />
                        </div>
                        <div className="mt-4 grid grid-cols-2 gap-2">
                          <MiniInfo
                            titulo="Valor"
                            valor={moeda(assinatura.valor_mensal)}
                          />
                          <MiniInfo
                            titulo="Vencimento"
                            valor={dataBR(assinatura.data_vencimento)}
                          />
                        </div>
                        <div className="mt-4 grid grid-cols-[1fr_auto] gap-2">
                          <select
                            value={assinatura.status}
                            onChange={(event) =>
                              void atualizarStatus(
                                assinatura.id,
                                event.target.value,
                              )
                            }
                            className="campo"
                          >
                            <option value="ATIVA">ATIVA</option>
                            <option value="PENDENTE">PENDENTE</option>
                            <option value="VENCIDA">VENCIDA</option>
                            <option value="CANCELADA">CANCELADA</option>
                          </select>
                          <button
                            onClick={() =>
                              void excluirAssinatura(assinatura.id)
                            }
                            className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-red-300"
                          >
                            <Trash2 size={20} />
                          </button>
                        </div>
                      </article>
                    ))}
                  </div>

                  <div className="hidden overflow-x-auto rounded-3xl border border-emerald-500/20 md:block">
                    <table className="w-full text-sm">
                      <thead className="bg-[#07150f] text-emerald-100/60">
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
                        {assinaturasFiltradas.map((assinatura) => (
                          <tr
                            key={assinatura.id}
                            className="hover:bg-white/[0.03]"
                          >
                            <td className="p-5 font-black">
                              {assinatura.municipios?.nome ||
                                "Município não encontrado"}
                            </td>
                            <td className="p-5 text-emerald-100/80">
                              {assinatura.planos_sistema?.nome ||
                                "Plano não encontrado"}
                            </td>
                            <td className="p-5 font-black text-emerald-300">
                              {moeda(assinatura.valor_mensal)}
                            </td>
                            <td className="p-5 text-emerald-100/80">
                              {dataBR(assinatura.data_vencimento)}
                            </td>
                            <td className="p-5">
                              <select
                                value={assinatura.status}
                                onChange={(event) =>
                                  void atualizarStatus(
                                    assinatura.id,
                                    event.target.value,
                                  )
                                }
                                className={`rounded-full border px-4 py-3 text-xs font-black outline-none ${STATUS_CLASSES[assinatura.status] || STATUS_CLASSES.PENDENTE}`}
                              >
                                <option value="ATIVA">ATIVA</option>
                                <option value="PENDENTE">PENDENTE</option>
                                <option value="VENCIDA">VENCIDA</option>
                                <option value="CANCELADA">CANCELADA</option>
                              </select>
                            </td>
                            <td className="p-5 text-right">
                              <button
                                onClick={() =>
                                  void excluirAssinatura(assinatura.id)
                                }
                                className="inline-flex items-center gap-2 rounded-2xl border border-red-500/30 bg-red-500/10 px-5 py-3 font-bold text-red-300 hover:bg-red-500/20"
                              >
                                <Trash2 size={18} /> Excluir
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>
          )}

          {aba === "comparador" && (
            <div className="p-4 xl:p-6">
              <div className="mb-5">
                <h2 className="text-3xl font-black">Comparador de planos</h2>
                <p className="text-emerald-100/60">
                  Veja rapidamente quais módulos pertencem a cada plano.
                </p>
              </div>

              {planos.length === 0 ? (
                <Vazio
                  icone={<Settings2 size={72} />}
                  titulo="Sem planos para comparar"
                  texto="Cadastre os planos e selecione seus módulos."
                />
              ) : (
                <div className="overflow-x-auto rounded-3xl border border-emerald-500/20">
                  <table className="min-w-[900px] w-full text-sm">
                    <thead className="bg-[#07150f]">
                      <tr>
                        <th className="sticky left-0 z-10 bg-[#07150f] p-4 text-left">
                          Módulo
                        </th>
                        {planos.map((plano) => (
                          <th
                            key={plano.id}
                            className="min-w-44 p-4 text-center"
                          >
                            <p className="font-black">{plano.nome}</p>
                            <p className="text-xs text-emerald-300">
                              {moeda(plano.valor_mensal)}
                            </p>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-emerald-500/10 bg-[#0d2419]">
                      {MODULOS_SISTEMA.flatMap((categoria) =>
                        categoria.itens.map((item) => (
                          <tr key={item.slug}>
                            <td className="sticky left-0 z-10 bg-[#0d2419] p-4 font-bold">
                              {item.nome}
                            </td>
                            {planos.map((plano) => {
                              const possui = modulosPlano.some(
                                (modulo) =>
                                  modulo.plano_id === plano.id &&
                                  modulo.modulo === item.slug &&
                                  modulo.ativo,
                              );
                              return (
                                <td key={plano.id} className="p-4 text-center">
                                  {possui ? (
                                    <CheckCircle2
                                      className="mx-auto text-emerald-300"
                                      size={22}
                                    />
                                  ) : (
                                    <X
                                      className="mx-auto text-slate-600"
                                      size={20}
                                    />
                                  )}
                                </td>
                              );
                            })}
                          </tr>
                        )),
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </section>
      </div>

      {modalPlano && (
        <Modal
          titulo={editandoPlanoId ? "Editar plano" : "Novo plano"}
          onClose={() => setModalPlano(false)}
          maximo="max-w-6xl"
        >
          <div className="space-y-5">
            <section className="grid gap-4 md:grid-cols-2">
              <input
                className="campo"
                placeholder="Nome do plano"
                value={planoForm.nome}
                onChange={(event) =>
                  setPlanoForm((atual) => ({
                    ...atual,
                    nome: event.target.value,
                  }))
                }
              />
              <input
                className="campo"
                type="number"
                placeholder="Valor mensal"
                value={planoForm.valor_mensal}
                onChange={(event) =>
                  setPlanoForm((atual) => ({
                    ...atual,
                    valor_mensal: event.target.value,
                  }))
                }
              />
              <textarea
                className="campo min-h-24 md:col-span-2"
                placeholder="Descrição do plano"
                value={planoForm.descricao}
                onChange={(event) =>
                  setPlanoForm((atual) => ({
                    ...atual,
                    descricao: event.target.value,
                  }))
                }
              />
              <input
                className="campo"
                type="number"
                placeholder="Valor de implantação"
                value={planoForm.valor_implantacao}
                onChange={(event) =>
                  setPlanoForm((atual) => ({
                    ...atual,
                    valor_implantacao: event.target.value,
                  }))
                }
              />
              <input
                className="campo"
                type="number"
                placeholder="Limite de usuários"
                value={planoForm.limite_usuarios}
                onChange={(event) =>
                  setPlanoForm((atual) => ({
                    ...atual,
                    limite_usuarios: event.target.value,
                  }))
                }
              />
            </section>

            <section className="overflow-hidden rounded-3xl border border-emerald-500/20 bg-[#07150f]">
              <div className="flex flex-col gap-4 border-b border-emerald-500/20 p-5 md:flex-row md:items-center md:justify-between">
                <div>
                  <h3 className="text-xl font-black">Módulos liberados</h3>
                  <p className="text-sm text-emerald-100/60">
                    {modulosSelecionados.length} selecionado(s)
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setModulosSelecionados(todosOsModulos())}
                    className="rounded-xl bg-emerald-400 px-4 py-2 text-sm font-black text-[#062015]"
                  >
                    Marcar todos
                  </button>
                  <button
                    type="button"
                    onClick={() => setModulosSelecionados([])}
                    className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-bold"
                  >
                    Limpar
                  </button>
                </div>
              </div>

              <div className="space-y-4 p-4 md:p-5">
                {MODULOS_SISTEMA.map((categoria) => {
                  const slugs = categoria.itens.map((item) => item.slug);
                  const todosMarcados = slugs.every((slug) =>
                    modulosSelecionados.includes(slug),
                  );
                  return (
                    <div
                      key={categoria.categoria}
                      className="rounded-2xl border border-emerald-500/15 bg-[#0d2419] p-4"
                    >
                      <div className="mb-3 flex items-center justify-between gap-3">
                        <h4 className="font-black text-emerald-300">
                          {categoria.categoria}
                        </h4>
                        <button
                          type="button"
                          onClick={() =>
                            setModulosSelecionados((atuais) =>
                              todosMarcados
                                ? atuais.filter((slug) => !slugs.includes(slug))
                                : Array.from(new Set([...atuais, ...slugs])),
                            )
                          }
                          className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-xs font-black text-emerald-300"
                        >
                          {todosMarcados ? "Desmarcar" : "Marcar categoria"}
                        </button>
                      </div>
                      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                        {categoria.itens.map((item) => {
                          const selecionado = modulosSelecionados.includes(
                            item.slug,
                          );
                          return (
                            <label
                              key={item.slug}
                              className={`flex cursor-pointer items-center gap-3 rounded-2xl border p-3 transition ${selecionado ? "border-emerald-400/40 bg-emerald-400/10" : "border-white/10 bg-white/[0.03] hover:border-emerald-400/25"}`}
                            >
                              <input
                                type="checkbox"
                                checked={selecionado}
                                onChange={(event) =>
                                  setModulosSelecionados((atuais) =>
                                    event.target.checked
                                      ? Array.from(
                                          new Set([...atuais, item.slug]),
                                        )
                                      : atuais.filter(
                                          (slug) => slug !== item.slug,
                                        ),
                                  )
                                }
                                className="h-5 w-5 accent-emerald-400"
                              />
                              <span className="text-sm font-bold">
                                {item.nome}
                              </span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            <button
              disabled={salvandoPlano}
              onClick={() => void salvarPlano()}
              className="sticky bottom-0 flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-400 px-5 py-4 text-lg font-black text-[#062015] shadow-2xl disabled:opacity-50"
            >
              <Save size={19} />{" "}
              {salvandoPlano ? "Salvando..." : "Salvar plano"}
            </button>
          </div>
        </Modal>
      )}

      {modalAssinatura && (
        <Modal
          titulo="Nova assinatura"
          onClose={() => setModalAssinatura(false)}
        >
          <div className="space-y-4">
            <select
              className="campo"
              value={assinaturaForm.municipio_id}
              onChange={(event) =>
                setAssinaturaForm((atual) => ({
                  ...atual,
                  municipio_id: event.target.value,
                }))
              }
            >
              <option value="">Selecione o município</option>
              {municipios.map((municipio) => (
                <option key={municipio.id} value={municipio.id}>
                  {municipio.nome}
                </option>
              ))}
            </select>
            <select
              className="campo"
              value={assinaturaForm.plano_id}
              onChange={(event) => {
                const planoId = event.target.value;
                const plano = planos.find((item) => item.id === planoId);
                setAssinaturaForm((atual) => ({
                  ...atual,
                  plano_id: planoId,
                  valor_mensal: plano
                    ? String(plano.valor_mensal)
                    : atual.valor_mensal,
                }));
              }}
            >
              <option value="">Selecione o plano</option>
              {planos
                .filter((plano) => plano.ativo)
                .map((plano) => (
                  <option key={plano.id} value={plano.id}>
                    {plano.nome} — {moeda(plano.valor_mensal)}
                  </option>
                ))}
            </select>
            <div className="grid gap-4 md:grid-cols-3">
              <select
                className="campo"
                value={assinaturaForm.status}
                onChange={(event) =>
                  setAssinaturaForm((atual) => ({
                    ...atual,
                    status: event.target.value,
                  }))
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
                onChange={(event) =>
                  setAssinaturaForm((atual) => ({
                    ...atual,
                    data_vencimento: event.target.value,
                  }))
                }
              />
              <input
                type="number"
                className="campo"
                placeholder="Valor mensal"
                value={assinaturaForm.valor_mensal}
                onChange={(event) =>
                  setAssinaturaForm((atual) => ({
                    ...atual,
                    valor_mensal: event.target.value,
                  }))
                }
              />
            </div>
            <textarea
              className="campo min-h-24"
              placeholder="Observações"
              value={assinaturaForm.observacoes}
              onChange={(event) =>
                setAssinaturaForm((atual) => ({
                  ...atual,
                  observacoes: event.target.value,
                }))
              }
            />
            <button
              disabled={salvandoAssinatura}
              onClick={() => void salvarAssinatura()}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-400 px-5 py-4 font-black text-[#062015] disabled:opacity-50"
            >
              <Save size={18} />{" "}
              {salvandoAssinatura ? "Criando..." : "Criar assinatura"}
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
          color: rgba(209, 250, 229, 0.42);
        }
        .campo:focus {
          border-color: #34d399;
          box-shadow: 0 0 0 3px rgba(52, 211, 153, 0.14);
        }
        .btn-topo-principal {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 0.65rem;
          border-radius: 1rem;
          background: #34d399;
          padding: 0.9rem 1.4rem;
          font-weight: 900;
          color: #062015;
        }
        .btn-topo-secundario {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 0.65rem;
          border-radius: 1rem;
          border: 1px solid rgba(52, 211, 153, 0.3);
          background: rgba(255, 255, 255, 0.08);
          padding: 0.9rem 1.4rem;
          font-weight: 900;
          color: white;
        }
        .acao-card {
          border-radius: 1rem;
          border: 1px solid rgba(255, 255, 255, 0.1);
          background: rgba(255, 255, 255, 0.06);
          padding: 0.75rem;
          font-size: 0.875rem;
          font-weight: 900;
          color: white;
        }
        option {
          background: #07150f;
          color: white;
        }
      `}</style>
    </main>
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
  icone: ReactNode;
}) {
  return (
    <div className="rounded-3xl border border-emerald-500/20 bg-[#0d2419] p-4 shadow-lg md:p-6">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-emerald-400/30 bg-emerald-500/15 text-emerald-300 md:h-14 md:w-14">
        {icone}
      </div>
      <p className="text-xs font-black uppercase tracking-wide text-emerald-100/60 md:text-sm">
        {titulo}
      </p>
      <p className="mt-1 text-2xl font-black md:text-4xl">{valor}</p>
      <p className="mt-2 text-xs text-emerald-100/50 md:text-sm">{texto}</p>
    </div>
  );
}

function AbaBotao({
  ativo,
  onClick,
  icone,
  texto,
}: {
  ativo: boolean;
  onClick: () => void;
  icone: ReactNode;
  texto: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex shrink-0 items-center gap-2 rounded-2xl px-5 py-3 text-sm font-black transition ${ativo ? "bg-emerald-400 text-[#062015]" : "text-emerald-100/65 hover:bg-white/10 hover:text-white"}`}
    >
      {icone}
      {texto}
    </button>
  );
}

function MiniInfo({ titulo, valor }: { titulo: string; valor: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/15 p-3 text-center">
      <p className="text-[10px] font-black uppercase text-emerald-100/45">
        {titulo}
      </p>
      <p className="mt-1 truncate font-black">{valor}</p>
    </div>
  );
}

function ResumoLinha({
  titulo,
  valor,
  destaque = "text-white",
}: {
  titulo: string;
  valor: string;
  destaque?: string;
}) {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/15 p-4">
      <span className="text-sm text-emerald-100/60">{titulo}</span>
      <span className={`text-xl font-black ${destaque}`}>{valor}</span>
    </div>
  );
}

function Status({ status }: { status: string }) {
  return (
    <span
      className={`rounded-full border px-3 py-1 text-[10px] font-black ${STATUS_CLASSES[status] || STATUS_CLASSES.PENDENTE}`}
    >
      {status}
    </span>
  );
}

function Carregando() {
  return (
    <div className="grid min-h-80 place-items-center text-emerald-100/60">
      Carregando...
    </div>
  );
}

function Vazio({
  icone,
  titulo,
  texto,
}: {
  icone: ReactNode;
  titulo: string;
  texto: string;
}) {
  return (
    <div className="grid min-h-96 place-items-center rounded-3xl border border-dashed border-emerald-500/20 bg-[#07150f] p-8 text-center">
      <div>
        <div className="mx-auto flex justify-center text-emerald-400">
          {icone}
        </div>
        <h3 className="mt-5 text-2xl font-black">{titulo}</h3>
        <p className="mt-2 text-emerald-100/60">{texto}</p>
      </div>
    </div>
  );
}

function Modal({
  titulo,
  children,
  onClose,
  maximo = "max-w-3xl",
}: {
  titulo: string;
  children: ReactNode;
  onClose: () => void;
  maximo?: string;
}) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/75 p-3 backdrop-blur-sm">
      <div
        className={`flex max-h-[94dvh] w-full flex-col overflow-hidden rounded-3xl border border-emerald-500/20 bg-[#0f241b] shadow-2xl ${maximo}`}
      >
        <div className="flex shrink-0 items-center justify-between border-b border-emerald-500/20 px-5 py-4 md:px-6">
          <h2 className="text-2xl font-black">{titulo}</h2>
          <button
            onClick={onClose}
            className="rounded-2xl border border-white/10 bg-white/10 p-3 hover:bg-white/15"
          >
            <X size={20} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 md:p-6">{children}</div>
      </div>
    </div>
  );
}