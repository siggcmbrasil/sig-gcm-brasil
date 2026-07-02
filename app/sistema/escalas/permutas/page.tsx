"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import { registrarAuditoria } from "@/lib/auditoria";

type Guarda = {
  id: number;
  nome: string;
  matricula: string | null;
};

type Permuta = {
  id: number;
  municipio_id: number;
  tipo_solicitacao: string | null;
  data_original: string;
  data_troca: string;
  guarda_solicitante_id: number;
  guarda_substituto_id: number;
  motivo: string | null;
  status: string;
  criado_em: string;
  aprovado_por: string | null;
  data_aprovacao: string | null;
};

const tiposSolicitacao = [
  { valor: "PERMUTA", nome: "Permuta / Troca de Serviço", icone: "🔄" },
  { valor: "COBERTURA", nome: "Cobertura de Plantão", icone: "👮" },
  { valor: "EXTRA", nome: "Serviço Extra", icone: "⭐" },
  { valor: "ADMINISTRATIVO", nome: "Administrativo", icone: "🏢" },
];

export default function PermutasPage() {
  const [guardas, setGuardas] = useState<Guarda[]>([]);
  const [permutas, setPermutas] = useState<Permuta[]>([]);
  const [municipioId, setMunicipioId] = useState<number>(1);
  const [carregando, setCarregando] = useState(true);
  const [busca, setBusca] = useState("");

  const [tipoSolicitacao, setTipoSolicitacao] = useState("PERMUTA");
  const [dataOriginal, setDataOriginal] = useState("");
  const [dataTroca, setDataTroca] = useState("");
  const [guardaSolicitanteId, setGuardaSolicitanteId] = useState("");
  const [guardaSubstitutoId, setGuardaSubstitutoId] = useState("");
  const [motivo, setMotivo] = useState("");

  useEffect(() => {
    carregarSistema();
  }, []);

  async function carregarSistema() {
    setCarregando(true);

    const usuarioLogado = JSON.parse(
  localStorage.getItem("usuarioLogado") || "{}"
);

const id = usuarioLogado.municipio_id;

if (!id) {
  alert("Município não identificado.");
  return;
}
    setMunicipioId(id);
    await Promise.all([carregarGuardas(id), carregarPermutas(id)]);
    setCarregando(false);
  }

  async function carregarGuardas(municipio: number) {
    const { data, error } = await supabase
      .from("guardas")
      .select("id, nome, matricula")
      .eq("municipio_id", municipio)
      .order("nome", { ascending: true });

    if (error) {
      alert("Erro ao carregar guardas.");
      console.error(error);
      return;
    }

    setGuardas(data || []);
  }

  async function carregarPermutas(municipio: number) {
    const { data, error } = await supabase
      .from("permutas_plantao")
      .select("*")
      .eq("municipio_id", municipio)
      .order("id", { ascending: false });

    if (error) {
      alert("Erro ao carregar permutas.");
      console.error(error);
      return;
    }

    setPermutas((data as Permuta[]) || []);
  }

  function nomeGuarda(id: number) {
    const guarda = guardas.find((item) => item.id === id);
    return guarda ? `${guarda.nome}${guarda.matricula ? ` • ${guarda.matricula}` : ""}` : `ID ${id}`;
  }

  function formatarData(data: string) {
    if (!data) return "-";
    const [ano, mes, dia] = data.split("-");
    return `${dia}/${mes}/${ano}`;
  }

  function nomeTipo(tipo?: string | null) {
    return tiposSolicitacao.find((t) => t.valor === tipo)?.nome || "Permuta / Troca de Serviço";
  }

  function iconeTipo(tipo?: string | null) {
    return tiposSolicitacao.find((t) => t.valor === tipo)?.icone || "🔄";
  }

  function corStatus(status: string) {
    if (status === "PENDENTE") return "bg-yellow-500/15 text-yellow-300 border-yellow-500/40";
    if (status === "ACEITA") return "bg-blue-500/15 text-blue-300 border-blue-500/40";
    if (status === "APROVADA") return "bg-green-500/15 text-green-300 border-green-500/40";
    if (status === "NEGADA") return "bg-red-500/15 text-red-300 border-red-500/40";
    return "bg-slate-500/15 text-slate-300 border-slate-500/40";
  }

  const permutasFiltradas = useMemo(() => {
    const termo = busca.toLowerCase();

    return permutas.filter((p) => {
      const texto = `
        ${nomeTipo(p.tipo_solicitacao)}
        ${nomeGuarda(p.guarda_solicitante_id)}
        ${nomeGuarda(p.guarda_substituto_id)}
        ${p.status}
        ${p.motivo || ""}
        ${p.data_original}
        ${p.data_troca}
      `.toLowerCase();

      return texto.includes(termo);
    });
  }, [busca, permutas, guardas]);

  const totalPendente = permutas.filter((p) => p.status === "PENDENTE").length;
  const totalAprovada = permutas.filter((p) => p.status === "APROVADA").length;
  const totalAceita = permutas.filter((p) => p.status === "ACEITA").length;
  const totalNegada = permutas.filter((p) => p.status === "NEGADA").length;

  async function salvarPermuta() {
    if (!dataOriginal || !dataTroca || !guardaSolicitanteId || !guardaSubstitutoId) {
      alert("Preencha todos os campos obrigatórios.");
      return;
    }

    if (guardaSolicitanteId === guardaSubstitutoId) {
      alert("O solicitante e o substituto não podem ser o mesmo guarda.");
      return;
    }

    const { error } = await supabase.from("permutas_plantao").insert([
      {
        municipio_id: municipioId,
        tipo_solicitacao: tipoSolicitacao,
        data_original: dataOriginal,
        data_troca: dataTroca,
        guarda_solicitante_id: Number(guardaSolicitanteId),
        guarda_substituto_id: Number(guardaSubstitutoId),
        motivo,
        status: "PENDENTE",
      },
    ]);

    if (error) {
      console.error("ERRO AO SALVAR PERMUTA:", error);
      alert(error.message);
      return;
    }

    await registrarAuditoria({
  modulo: "Permutas",
  acao: "CRIAR",
  descricao: `Criou solicitação de ${nomeTipo(tipoSolicitacao)}.`,
});

    alert("Solicitação cadastrada com sucesso!");

    setTipoSolicitacao("PERMUTA");
    setDataOriginal("");
    setDataTroca("");
    setGuardaSolicitanteId("");
    setGuardaSubstitutoId("");
    setMotivo("");

    carregarPermutas(municipioId);
  }

  async function atualizarStatus(id: number, status: string) {
    const usuario = JSON.parse(localStorage.getItem("usuarioLogado") || "{}");

    const atualizacao: any = { status };

    if (status === "APROVADA" || status === "NEGADA") {
      atualizacao.aprovado_por = usuario.nome || "ADMIN";
      atualizacao.data_aprovacao = new Date().toISOString();
    }

    const { error } = await supabase
  .from("permutas_plantao")
  .update(atualizacao)
  .eq("id", id)
  .eq("municipio_id", municipioId);

    if (error) {
      alert("Erro ao atualizar solicitação.");
      console.error(error);
      return;
    }

    await registrarAuditoria({
  modulo: "Permutas",
  acao: status,
  descricao: `Alterou a solicitação #${id} para ${status}.`,
});

    carregarPermutas(municipioId);
  }

  async function excluirPermuta(id: number) {
    const confirmar = confirm("Deseja realmente excluir esta solicitação?");
    if (!confirmar) return;

    const permuta = permutas.find((p) => p.id === id);

    const { error } = await supabase
  .from("permutas_plantao")
  .delete()
  .eq("id", id)
  .eq("municipio_id", municipioId);

    if (error) {
      alert("Erro ao excluir solicitação.");
      console.error(error);
      return;
    }

    await registrarAuditoria({
  modulo: "Permutas",
  acao: "EXCLUIR",
  descricao: `Excluiu solicitação de ${nomeTipo(
    permuta?.tipo_solicitacao
  )}.`,
});

    carregarPermutas(municipioId);
  }

  return (
    <div className="p-3 md:p-6 pb-24 space-y-6">
      <header className="border-b border-slate-800 pb-5">
        <h1 className="text-2xl md:text-3xl font-bold">🔄 Permutas e Coberturas</h1>
        <p className="text-slate-400 text-sm md:text-base">
          Controle operacional de permutas, coberturas de plantão, serviços extras e administrativo.
        </p>
      </header>

      <section className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card titulo="Pendentes" valor={totalPendente} icone="🟡" />
        <Card titulo="Aceitas" valor={totalAceita} icone="🔵" />
        <Card titulo="Aprovadas" valor={totalAprovada} icone="🟢" />
        <Card titulo="Negadas" valor={totalNegada} icone="🔴" />
      </section>

      <section className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="card xl:col-span-1">
          <h2 className="text-xl md:text-2xl font-bold mb-4">Nova Solicitação</h2>

          <div className="space-y-4">
            <div>
              <label className="label">Tipo de Solicitação</label>
              <select
                value={tipoSolicitacao}
                onChange={(e) => setTipoSolicitacao(e.target.value)}
                className="input"
              >
                {tiposSolicitacao.map((tipo) => (
                  <option key={tipo.valor} value={tipo.valor}>
                    {tipo.icone} {tipo.nome}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="label">Data original</label>
                <input
                  type="date"
                  value={dataOriginal}
                  onChange={(e) => setDataOriginal(e.target.value)}
                  className="input"
                />
              </div>

              <div>
                <label className="label">Data da troca/cobertura</label>
                <input
                  type="date"
                  value={dataTroca}
                  onChange={(e) => setDataTroca(e.target.value)}
                  className="input"
                />
              </div>
            </div>

            <div>
              <label className="label">Guarda solicitante</label>
              <select
                value={guardaSolicitanteId}
                onChange={(e) => setGuardaSolicitanteId(e.target.value)}
                className="input"
              >
                <option value="">Selecione</option>
                {guardas.map((guarda) => (
                  <option key={guarda.id} value={guarda.id}>
                    {guarda.nome} {guarda.matricula ? `• ${guarda.matricula}` : ""}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="label">Guarda que assume/substitui</label>
              <select
                value={guardaSubstitutoId}
                onChange={(e) => setGuardaSubstitutoId(e.target.value)}
                className="input"
              >
                <option value="">Selecione</option>
                {guardas.map((guarda) => (
                  <option key={guarda.id} value={guarda.id}>
                    {guarda.nome} {guarda.matricula ? `• ${guarda.matricula}` : ""}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="label">Motivo / Observação</label>
              <textarea
                value={motivo}
                onChange={(e) => setMotivo(e.target.value)}
                placeholder="Ex: necessidade particular, cobertura autorizada, serviço extra convocado..."
                className="input h-28 resize-none"
              />
            </div>

            <button onClick={salvarPermuta} className="btn-primary w-full text-lg">
              Salvar Solicitação
            </button>
          </div>
        </div>

        <div className="card xl:col-span-2">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-5">
            <div>
              <h2 className="text-xl md:text-2xl font-bold">Solicitações Cadastradas</h2>
              <p className="text-slate-400 text-sm">Acompanhe aprovação, aceite e histórico operacional.</p>
            </div>

            <input
              className="input md:max-w-xs"
              placeholder="Buscar por guarda, tipo, status..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
            />
          </div>

          {carregando ? (
            <p className="text-slate-400">Carregando solicitações...</p>
          ) : permutasFiltradas.length === 0 ? (
            <div className="bg-slate-950/40 border border-slate-700 rounded-xl p-8 text-center">
              <p className="text-slate-400">Nenhuma solicitação encontrada.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {permutasFiltradas.map((permuta) => (
                <div
                  key={permuta.id}
                  className="bg-slate-950/40 border border-slate-700 rounded-2xl p-4 space-y-4"
                >
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
                    <div>
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <span className="text-2xl">{iconeTipo(permuta.tipo_solicitacao)}</span>
                        <h3 className="text-xl font-bold text-white">{nomeTipo(permuta.tipo_solicitacao)}</h3>
                      </div>

                      <p className="text-slate-400 text-sm">
                        Criado em: {permuta.criado_em ? new Date(permuta.criado_em).toLocaleString("pt-BR") : "-"}
                      </p>
                    </div>

                    <span className={`border px-3 py-1 rounded-full text-sm font-bold ${corStatus(permuta.status)}`}>
                      {permuta.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <Info label="Data original" valor={formatarData(permuta.data_original)} />
                    <Info label="Data troca/cobertura" valor={formatarData(permuta.data_troca)} />
                    <Info label="Solicitante" valor={nomeGuarda(permuta.guarda_solicitante_id)} />
                    <Info label="Assume/Substitui" valor={nomeGuarda(permuta.guarda_substituto_id)} />
                  </div>

                  {permuta.motivo && (
                    <div className="bg-slate-900/70 border border-slate-700 rounded-xl p-3">
                      <p className="text-slate-400 text-sm">Motivo / Observação</p>
                      <p className="text-white">{permuta.motivo}</p>
                    </div>
                  )}

                  {(permuta.aprovado_por || permuta.data_aprovacao) && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <Info label="Aprovado/negado por" valor={permuta.aprovado_por || "-"} />
                      <Info
                        label="Data da decisão"
                        valor={
                          permuta.data_aprovacao
                            ? new Date(permuta.data_aprovacao).toLocaleString("pt-BR")
                            : "-"
                        }
                      />
                    </div>
                  )}

                  <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-800">
                    {permuta.status === "PENDENTE" && (
                      <button
                        onClick={() => atualizarStatus(permuta.id, "ACEITA")}
                        className="bg-green-700 hover:bg-green-800 text-white px-4 py-2 rounded-xl font-semibold"
                      >
                        Aceitar
                      </button>
                    )}

                    {permuta.status === "ACEITA" && (
                      <>
                        <button
                          onClick={() => atualizarStatus(permuta.id, "APROVADA")}
                          className="bg-blue-700 hover:bg-blue-800 text-white px-4 py-2 rounded-xl font-semibold"
                        >
                          Aprovar
                        </button>

                        <button
                          onClick={() => atualizarStatus(permuta.id, "NEGADA")}
                          className="bg-red-700 hover:bg-red-800 text-white px-4 py-2 rounded-xl font-semibold"
                        >
                          Negar
                        </button>
                      </>
                    )}

                    <button
                      onClick={() => excluirPermuta(permuta.id)}
                      className="bg-slate-800 hover:bg-red-900 text-white px-4 py-2 rounded-xl font-semibold"
                    >
                      Excluir
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

function Card({ titulo, valor, icone }: { titulo: string; valor: number; icone: string }) {
  return (
    <div className="card min-h-28 flex items-center justify-between">
      <div>
        <p className="text-slate-400 text-sm">{titulo}</p>
        <h2 className="text-4xl font-bold">{valor}</h2>
      </div>
      <p className="text-4xl">{icone}</p>
    </div>
  );
}

function Info({ label, valor }: { label: string; valor: string }) {
  return (
    <div className="bg-slate-900/70 border border-slate-700 rounded-xl p-3">
      <p className="text-slate-400 text-xs uppercase tracking-wide">{label}</p>
      <p className="font-semibold text-white mt-1">{valor}</p>
    </div>
  );
}
