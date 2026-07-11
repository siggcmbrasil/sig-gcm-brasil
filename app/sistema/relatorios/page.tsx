"use client";

import { useEffect, useMemo, useState } from "react";
import ProtecaoModulo from "@/components/ProtecaoModulo";
import { supabase } from "@/lib/supabase";
import { BarChart3, FileDown, Search } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

type Modulo = "ocorrencias" | "patrulhamentos" | "chamados" | "viaturas" | "guardas";

const modulos: Record<Modulo, { nome: string; tabela: string; campoData: string }> = {
  ocorrencias: { nome: "Ocorrências", tabela: "ocorrencias", campoData: "data" },
  patrulhamentos: { nome: "Patrulhamentos", tabela: "patrulhamentos", campoData: "data" },
  chamados: { nome: "Chamados", tabela: "chamados", campoData: "criado_em" },
  viaturas: { nome: "Viaturas", tabela: "viaturas", campoData: "criado_em" },
  guardas: { nome: "Guardas", tabela: "guardas", campoData: "criado_em" },
};

export default function RelatoriosPage() {
  const [modulo, setModulo] = useState<Modulo>("ocorrencias");
  const [periodo, setPeriodo] = useState("mensal");
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");

  const [status, setStatus] = useState("");
  const [tipo, setTipo] = useState("");
  const [local, setLocal] = useState("");
  const [guarda, setGuarda] = useState("");
  const [guarnicao, setGuarnicao] = useState("");
  const [viatura, setViatura] = useState("");
  const [busca, setBusca] = useState("");

  const [registros, setRegistros] = useState<any[]>([]);
  const [carregando, setCarregando] = useState(false);

  const usuario =
    typeof window !== "undefined"
      ? JSON.parse(localStorage.getItem("usuarioLogado") || "{}")
      : {};

  useEffect(() => {
    definirPeriodo("mensal");
  }, []);

  function dataBR(valor: string | null | undefined) {
    if (!valor) return "-";
    return new Date(valor).toLocaleDateString("pt-BR");
  }

  function definirPeriodo(valor: string) {
    setPeriodo(valor);

    const hoje = new Date();
    const inicio = new Date();

    if (valor === "diario") inicio.setDate(hoje.getDate());
    if (valor === "semanal") inicio.setDate(hoje.getDate() - 7);
    if (valor === "quinzenal") inicio.setDate(hoje.getDate() - 15);
    if (valor === "mensal") inicio.setMonth(hoje.getMonth() - 1);
    if (valor === "trimestral") inicio.setMonth(hoje.getMonth() - 3);
    if (valor === "semestral") inicio.setMonth(hoje.getMonth() - 6);
    if (valor === "anual") inicio.setFullYear(hoje.getFullYear() - 1);

    if (valor !== "personalizado") {
      setDataInicio(inicio.toISOString().split("T")[0]);
      setDataFim(hoje.toISOString().split("T")[0]);
    }
  }

  async function buscarRelatorio() {
    if (!usuario?.municipio_id) {
      alert("Município não identificado.");
      return;
    }

    setCarregando(true);

    const config = modulos[modulo];

    let query = supabase
      .from(config.tabela)
      .select("*")
      .eq("municipio_id", usuario.municipio_id)
      .limit(1000);

    if (dataInicio) {
      query = query.gte(
        config.campoData,
        config.campoData === "data" ? dataInicio : `${dataInicio}T00:00:00`
      );
    }

    if (dataFim) {
      query = query.lte(
        config.campoData,
        config.campoData === "data" ? dataFim : `${dataFim}T23:59:59`
      );
    }

    const { data, error } = await query;

    setCarregando(false);

    if (error) {
      console.error(error);
      alert(error.message || "Erro ao gerar relatório.");
      return;
    }

    setRegistros(data || []);
  }

  const filtrados = useMemo(() => {
    return registros.filter((item) => {
      const texto = JSON.stringify(item).toLowerCase();

      if (status && String(item.status || "").toLowerCase() !== status.toLowerCase()) return false;
      if (tipo && !texto.includes(tipo.toLowerCase())) return false;
      if (local && !texto.includes(local.toLowerCase())) return false;
      if (guarda && !texto.includes(guarda.toLowerCase())) return false;
      if (guarnicao && !texto.includes(guarnicao.toLowerCase())) return false;
      if (viatura && !texto.includes(viatura.toLowerCase())) return false;
      if (busca && !texto.includes(busca.toLowerCase())) return false;

      return true;
    });
  }, [registros, status, tipo, local, guarda, guarnicao, viatura, busca]);

  const resumo = useMemo(() => {
    return {
      total: filtrados.length,
      abertos: filtrados.filter((r) => String(r.status || "").toUpperCase() === "ABERTA").length,
      finalizados: filtrados.filter((r) => String(r.status || "").toUpperCase() === "FINALIZADO").length,
      cancelados: filtrados.filter((r) => String(r.status || "").toUpperCase() === "CANCELADO").length,
    };
  }, [filtrados]);

  async function gerarPDF() {
    if (filtrados.length === 0) {
      alert("Nenhum registro para gerar PDF.");
      return;
    }

    const jsPDF = (await import("jspdf")).default;
    await import("jspdf-autotable");

    const doc = new jsPDF();

    doc.setFontSize(16);
    doc.text("SIG-GCM Brasil", 14, 15);

    doc.setFontSize(12);
    doc.text(`Relatório de ${modulos[modulo].nome}`, 14, 25);
    doc.text(`Período: ${dataInicio || "-"} até ${dataFim || "-"}`, 14, 32);
    doc.text(`Total: ${filtrados.length}`, 14, 39);

    const linhas = filtrados.map((item) => [
      item.id || "-",
      item.data || item.criado_em || "-",
      item.tipo || item.status || item.nome || "-",
      item.guarda || item.guarda_responsavel || item.viatura || item.prefixo || "-",
      item.local || item.bairro || item.descricao || "-",
    ]);

    autoTable(doc, {
      startY: 48,
      head: [["ID", "Data", "Tipo/Status", "Guarda/Viatura", "Local/Descrição"]],
      body: linhas,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [7, 21, 46] },
    });

    doc.save(`relatorio-${modulo}-${Date.now()}.pdf`);
  }

  return (
    <ProtecaoModulo modulo="relatorios">
      <main className="p-4 md:p-6 pb-24 space-y-6">
        <section className="painel-premium p-6">
          <div className="flex items-center gap-3">
            <BarChart3 className="w-10 h-10 text-cyan-400" />
            <div>
              <h1 className="text-3xl md:text-4xl font-black text-white">
                Central de Relatórios
              </h1>
              <p className="text-slate-400 mt-1">
                Filtre, visualize e gere PDF sem mostrar dados técnicos brutos.
              </p>
            </div>
          </div>
        </section>

        <section className="painel-premium p-6 space-y-4">
          <h2 className="text-2xl font-black text-white">Filtros</h2>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Campo label="Módulo">
              <select className="input" value={modulo} onChange={(e) => setModulo(e.target.value as Modulo)}>
                <option value="ocorrencias">Ocorrências</option>
                <option value="patrulhamentos">Patrulhamentos</option>
                <option value="chamados">Chamados</option>
                <option value="viaturas">Viaturas</option>
                <option value="guardas">Guardas</option>
              </select>
            </Campo>

            <Campo label="Período">
              <select className="input" value={periodo} onChange={(e) => definirPeriodo(e.target.value)}>
                <option value="diario">Diário</option>
                <option value="semanal">Semanal</option>
                <option value="quinzenal">Quinzenal</option>
                <option value="mensal">Mensal</option>
                <option value="trimestral">Trimestral</option>
                <option value="semestral">Semestral</option>
                <option value="anual">Anual</option>
                <option value="personalizado">Personalizado</option>
              </select>
            </Campo>

            <Campo label="Data inicial">
              <input className="input" type="date" value={dataInicio} onChange={(e) => setDataInicio(e.target.value)} />
            </Campo>

            <Campo label="Data final">
              <input className="input" type="date" value={dataFim} onChange={(e) => setDataFim(e.target.value)} />
            </Campo>

            <Campo label="Status">
              <select className="input" value={status} onChange={(e) => setStatus(e.target.value)}>
                <option value="">Todos</option>
                <option value="ABERTA">Aberta</option>
                <option value="EM_ANDAMENTO">Em andamento</option>
                <option value="FINALIZADO">Finalizado</option>
                <option value="CANCELADO">Cancelado</option>
              </select>
            </Campo>

            <Campo label="Tipo">
              <input className="input" value={tipo} onChange={(e) => setTipo(e.target.value)} placeholder="Perturbação, apoio..." />
            </Campo>

            <Campo label="Guarda">
              <input className="input" value={guarda} onChange={(e) => setGuarda(e.target.value)} placeholder="Nome do guarda" />
            </Campo>

            <Campo label="Guarnição">
              <input className="input" value={guarnicao} onChange={(e) => setGuarnicao(e.target.value)} placeholder="Delta, Alfa..." />
            </Campo>

            <Campo label="Viatura">
              <input className="input" value={viatura} onChange={(e) => setViatura(e.target.value)} placeholder="VTR-01" />
            </Campo>

            <Campo label="Local / Bairro">
              <input className="input" value={local} onChange={(e) => setLocal(e.target.value)} placeholder="Centro, bairro..." />
            </Campo>

            <Campo label="Busca geral">
              <input className="input" value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Busca livre" />
            </Campo>
          </div>

          <div className="flex flex-col md:flex-row gap-3">
            <button onClick={buscarRelatorio} disabled={carregando} className="btn-primary flex items-center justify-center gap-2">
              <Search className="w-5 h-5" />
              {carregando ? "Buscando..." : "Buscar"}
            </button>

            <button onClick={gerarPDF} className="btn-secondary flex items-center justify-center gap-2">
              <FileDown className="w-5 h-5" />
              Gerar PDF
            </button>
          </div>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Resumo titulo="Registros" valor={String(resumo.total)} />
          <Resumo titulo="Abertos" valor={String(resumo.abertos)} />
          <Resumo titulo="Finalizados" valor={String(resumo.finalizados)} />
          <Resumo titulo="Cancelados" valor={String(resumo.cancelados)} />
        </section>

        <section className="painel-premium p-6">
          <h2 className="text-2xl font-black text-white mb-4">Resultado</h2>

          {filtrados.length === 0 ? (
            <p className="text-slate-400">
              Nenhum registro encontrado. Ajuste os filtros e clique em Buscar.
            </p>
          ) : (
            <div className="space-y-3">
              {filtrados.map((item, index) => (
                <RegistroCard key={item.id || index} item={item} modulo={modulo} />
              ))}
            </div>
          )}
        </section>
      </main>
    </ProtecaoModulo>
  );
}

function RegistroCard({ item, modulo }: { item: any; modulo: Modulo }) {
  const titulo =
    item.tipo ||
    item.local ||
    item.nome ||
    item.titulo ||
    item.prefixo ||
    item.status ||
    "Registro";

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-950/50 p-4">
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-2">
        <div>
          <p className="text-sm text-cyan-400 font-bold">
            {modulo.toUpperCase()} #{item.id || "-"}
          </p>

          <h3 className="text-white font-black text-lg mt-1">
            {titulo}
          </h3>
        </div>

        <span className="rounded-xl border border-slate-700 px-3 py-1 text-xs font-bold text-slate-300">
          {item.status || "Sem status"}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-4 text-sm">
        <Info label="Data" valor={item.data || item.criado_em || "-"} />
        <Info label="Local" valor={item.local || item.bairro || "-"} />
        <Info label="Guarda" valor={item.guarda || item.guarda_responsavel || item.nome || "-"} />
        <Info label="Guarnição" valor={item.guarnicao || item.equipe || "-"} />
        <Info label="Viatura" valor={item.viatura || item.prefixo || "-"} />
        <Info label="Descrição" valor={item.descricao || item.observacao || "-"} />
      </div>
    </div>
  );
}

function Campo({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="space-y-2">
      <span className="text-sm font-bold text-slate-300">{label}</span>
      {children}
    </label>
  );
}

function Info({ label, valor }: { label: string; valor: any }) {
  return (
    <div>
      <p className="text-slate-500 text-xs">{label}</p>
      <p className="text-slate-200 font-semibold break-words">
        {String(valor || "-")}
      </p>
    </div>
  );
}

function Resumo({ titulo, valor }: { titulo: string; valor: string }) {
  return (
    <div className="painel-premium p-5">
      <p className="text-slate-400 text-sm">{titulo}</p>
      <h2 className="text-2xl font-black text-white mt-2 break-words">
        {valor}
      </h2>
    </div>
  );
}