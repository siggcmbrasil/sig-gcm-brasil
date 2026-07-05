"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import CardIndicador from "@/components/CardIndicador";
import BotaoAcao from "@/components/BotaoAcao";
import { registrarAuditoria } from "@/lib/auditoria";
import { buscarModulosPermitidos, moduloLiberado, } from "@/lib/permissoesMenu";

import {
  Eye,
  Pencil,
  Play,
  Check,
  Trash2,
} from "lucide-react";

type Chamado = {
  id: number;
  protocolo: string;
  solicitante: string;
  telefone: string | null;
  tipo: string;
  local: string;
  bairro: string | null;
  numero: string | null;
  referencia: string | null;
  tipo_local: string | null;
  prioridade: string;
  status: string;
  observacao: string | null;
  descricao: string | null;
  atendido_por: string | null;
  finalizado_por: string | null;
  data_atendimento: string | null;
  finalizado_em: string | null;
  observacao_finalizacao: string | null;
};

export default function Chamados() {
  const router = useRouter();
  
  const [chamados, setChamados] = useState<Chamado[]>([]);
  const [busca, setBusca] = useState("");

  const [solicitante, setSolicitante] = useState("");
  const [telefone, setTelefone] = useState("");
  const [tipo, setTipo] = useState("");
  const [local, setLocal] = useState("");
  const [bairro, setBairro] = useState("");
  const [numero, setNumero] = useState("");
  const [referencia, setReferencia] = useState("");
  const [prioridade, setPrioridade] = useState("Normal");
  const [tipoLocal, setTipoLocal] = useState("Bairro");
  const [status, setStatus] = useState("Aberto");
  const [observacao, setObservacao] = useState("");
  const [locais, setLocais] = useState<any[]>([]);
  const [localId, setLocalId] = useState("");

  const [editandoId, setEditandoId] = useState<number | null>(null);

  const [carregando, setCarregando] = useState(true);
  const usuarioLogado =
  typeof window !== "undefined"
    ? JSON.parse(localStorage.getItem("usuarioLogado") || "{}")
    : {};

const perfilUsuario = usuarioLogado?.perfil || "CONSULTA";

const [modulosPermitidos, setModulosPermitidos] =
  useState<string[]>([]);

  const ehDesenvolvedor =
  perfilUsuario === "DESENVOLVEDOR";

function pode(modulo: string) {
  if (ehDesenvolvedor) return true;

  return moduloLiberado(
    modulosPermitidos,
    modulo
  );
}

const podeVerChamados =
  pode("CHAMADOS");

const podeCriarChamado =
  pode("CHAMADOS_CRIAR");

const podeEditarChamado =
  pode("CHAMADOS_EDITAR");

const podeAtenderChamado =
  pode("CHAMADOS_ATENDER");

const podeFinalizarChamado =
  pode("CHAMADOS_FINALIZAR");

const podeExcluirChamado =
  pode("CHAMADOS_EXCLUIR");

const podeGerarOcorrencia =
  pode("CHAMADOS_GERAR_OCORRENCIA");

  async function carregarChamados() {

if (!usuarioLogado.municipio_id) {
  alert("Município não identificado.");
  return;
}

    setCarregando(true);

    const { data, error } = await supabase
  .from("chamados")
  .select("*")
  .eq("municipio_id", usuarioLogado.municipio_id)
  .order("id", { ascending: false });

    if (error) {
      console.error(error);
      alert("Erro ao carregar chamados.");
      setCarregando(false);
      return;
    }

    setChamados(data || []);
    setCarregando(false);
  }

  async function salvarChamado() {

if (!usuarioLogado.municipio_id) {
  alert("Município não identificado.");
  return;
}

  if (editandoId && !podeEditarChamado) {
  alert("Você não possui permissão para editar chamados.");
  return;
}

if (!editandoId && !podeCriarChamado) {
  alert("Você não possui permissão para registrar chamados.");
  return;
}

    const protocolo = "CH-" + Date.now();

    if (editandoId) {
  const { error } = await supabase
    .from("chamados")
    .update({
      solicitante,
      telefone,
      tipo,
      local,
      bairro,
      numero,
      referencia,
      tipo_local: tipoLocal,
      prioridade,
      status,
      observacao,
    })
    .eq("id", editandoId)
    .eq("municipio_id", usuarioLogado.municipio_id);

  if (error) {
    console.error(error);
    alert("Erro ao atualizar chamado.");
    return;
  }

  const chamado = chamados.find(
  (c) => c.id === editandoId
);

await registrarAuditoria({
  modulo: "Chamados",
  acao: "EDITAR",
  descricao: `Atualizou o chamado ${
    chamado?.protocolo || editandoId
  }.`,
});

  alert("Chamado atualizado com sucesso!");

  setEditandoId(null);
  setSolicitante("");
  setTelefone("");
  setTipo("");
  setLocal("");
  setBairro("");
  setNumero("");
  setReferencia("");
  setTipoLocal("Bairro");
  setPrioridade("Normal");
  setStatus("Aberto");
  setObservacao("");

  carregarChamados();
  return;
}

    const { error } = await supabase.from("chamados").insert([
  {
  municipio_id: usuarioLogado.municipio_id,
  protocolo,
  solicitante,
  telefone,
  tipo,
  local,
  bairro,
  numero,
  referencia,
  tipo_local: tipoLocal,
  prioridade,
  status,
  observacao,
},
]);

    if (error) {
      console.error(error);
      alert("Erro ao salvar chamado.");
      return;
    }

    await registrarAuditoria({
  modulo: "Chamados",
  acao: "CRIAR",
  descricao: `Registrou o chamado ${protocolo}.`,
});

    alert("Chamado registrado com sucesso!");

    setSolicitante("");
setTelefone("");
setTipo("");
setLocal("");
setBairro("");
setNumero("");
setReferencia("");
setTipoLocal("Bairro");
setPrioridade("Normal");
setStatus("Aberto");
setObservacao("");

    carregarChamados();
  }

  function editarChamado(chamado: Chamado) {
  setEditandoId(chamado.id);
  setSolicitante(chamado.solicitante || "");
  setTelefone(chamado.telefone || "");
  setTipo(chamado.tipo || "");
  setLocal(chamado.local || "");
  setBairro(chamado.bairro || "");
setNumero(chamado.numero || "");
setReferencia(chamado.referencia || "");
setTipoLocal(chamado.tipo_local || "Bairro");
  setPrioridade(chamado.prioridade || "Normal");
  setStatus(chamado.status || "Aberto");
  setObservacao(chamado.observacao || "");
}

async function atenderChamado(id: number) {
  if (!podeAtenderChamado) {
    alert("Você não possui permissão.");
    return;
  }

  const { data, error } = await supabase
    .from("chamados")
    .update({
      status: "Em Atendimento",
      atendido_por:
        usuarioLogado?.nome ||
        usuarioLogado?.email ||
        "Sistema",
      data_atendimento: new Date().toISOString(),
    })
    .eq("id", id)
.eq("municipio_id", usuarioLogado.municipio_id)
.select()
.single();

  if (error) {
    console.error(error);
    alert(JSON.stringify(error));
    return;
  }

  if (!data) {
    alert("Nenhum chamado foi atualizado. Verifique o município_id.");
    return;
  }

  await registrarAuditoria({
    modulo: "Chamados",
    acao: "ATENDER",
    descricao: `Iniciou atendimento do chamado ${
      data.protocolo || id
    }.`,
  });

  alert("Chamado colocado em atendimento.");

  setChamados((lista) =>
    lista.map((item) =>
      item.id === id
        ? {
            ...item,
            status: "Em Atendimento",
            atendido_por:
              usuarioLogado?.nome ||
              usuarioLogado?.email ||
              "Sistema",
            data_atendimento: new Date().toISOString(),
          }
        : item
    )
  );

  await carregarChamados();
}

async function finalizarChamado(id: number) {
  if (!podeFinalizarChamado) {
    alert("Você não possui permissão.");
    return;
  }

  const observacaoFinal =
  prompt("Observação de finalização:") || "";

console.log("Finalizando chamado:", id);
console.log("Observação:", observacaoFinal);

  const { error } = await supabase
    .from("chamados")
    .update({
  status: "Finalizado",
  finalizado_em: new Date().toISOString(),
  finalizado_por:
    usuarioLogado?.nome ||
    usuarioLogado?.email ||
    "Sistema",
  observacao_finalizacao: observacaoFinal || "",
})
    .eq("id", id)
    .eq("municipio_id", usuarioLogado.municipio_id);

    console.log("Resultado finalizar:", error);

  if (error) {
  console.error(error);
  alert(JSON.stringify(error));
  return;
}

const chamado = chamados.find(
  (c) => c.id === id
);

await registrarAuditoria({
  modulo: "Chamados",
  acao: "FINALIZAR",
  descricao: `Finalizou o chamado ${
    chamado?.protocolo || id
  }.`,
});

 alert("Chamado finalizado com sucesso.");
await carregarChamados();
}

  async function excluirChamado(id: number) {

if (!usuarioLogado.municipio_id) {
  alert("Município não identificado.");
  return;
}

  if (!podeExcluirChamado) {
    alert("Você não possui permissão para excluir chamados.");
    return;
  }
    const chamado = chamados.find((c) => c.id === id);

if (chamado?.status === "Finalizado") {
  alert("Chamados finalizados não podem ser excluídos.");
  return;
}

const confirmar = confirm(
  `Deseja excluir o chamado ${chamado?.protocolo}?`
);

if (!confirmar) return;

const { error } = await supabase
  .from("chamados")
  .delete()
  .eq("id", id)
  .eq("municipio_id", usuarioLogado.municipio_id);

if (error) {
  console.error(error);
  alert("Erro ao excluir chamado.");
  return;
}

await registrarAuditoria({
  modulo: "Chamados",
  acao: "EXCLUIR",
  descricao: `Excluiu o chamado ${
    chamado?.protocolo || id
  }.`,
});

carregarChamados();

  }

  async function carregarLocais() {
  const { data, error } = await supabase
    .from("locais")
    .select("id, nome, tipo")
    .eq("municipio_id", usuarioLogado.municipio_id)
    .eq("ativo", true)
    .order("nome");

  if (error) {
    console.error(error);
    alert("Erro ao carregar locais.");
    return;
  }

  setLocais(data || []);
}

 useEffect(() => {
  async function iniciar() {
    const permissoes =
      await buscarModulosPermitidos(
        perfilUsuario
      );

    setModulosPermitidos(
      permissoes || []
    );

    await carregarChamados();
    await carregarLocais();
  }

  void iniciar();
}, []);

 const chamadosFiltrados = chamados.filter((chamado) => {
  const texto = `
    ${chamado.protocolo || ""}
    ${chamado.solicitante || ""}
    ${chamado.telefone || ""}
    ${chamado.tipo || ""}
    ${chamado.local || ""}
    ${chamado.bairro || ""}
    ${chamado.numero || ""}
    ${chamado.referencia || ""}
    ${chamado.prioridade || ""}
    ${chamado.status || ""}
    ${chamado.descricao || ""}
  `.toLowerCase();

  return texto.includes(busca.toLowerCase());
});

if (!usuarioLogado?.municipio_id) {
  return (
    <div className="p-6">
      Município não identificado.
    </div>
  );
}

  return (
    <div className="p-3 md:p-6 pb-24">
      <header className="mb-6">
  <div className="flex flex-col gap-4 border-b border-slate-800 pb-5">

    <div>
      <h1 className="text-3xl md:text-5xl font-bold tracking-tight">
        Chamados
      </h1>

      <p className="text-slate-400 text-base md:text-lg mt-1">
        Atendimento e controle dos chamados recebidos pela GCM.
      </p>
    </div>

  </div>
</header>

      <section className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">

  <CardIndicador
    titulo="Total"
    valor={chamados.length}
    icone="📞"
    cor="blue"
  />

  <CardIndicador
    titulo="Abertos"
    valor={
      chamados.filter(
        (c) => c.status === "Aberto"
      ).length
    }
    icone="🚨"
    cor="yellow"
  />

  <CardIndicador
    titulo="Em Atendimento"
    valor={
      chamados.filter(
        (c) => c.status === "Em Atendimento"
      ).length
    }
    icone="🚔"
    cor="purple"
  />

  <CardIndicador
    titulo="Finalizados"
    valor={
      chamados.filter(
        (c) => c.status === "Finalizado"
      ).length
    }
    icone="✅"
    cor="green"
  />

  <CardIndicador
  titulo="Urgentes"
  valor={
    chamados.filter(
      (c) => c.prioridade === "Urgente"
    ).length
  }
  icone="🔥"
  cor="red"
/>

</section>

      <section className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {podeCriarChamado && (
  <div className="card h-fit">
    <h2 className="text-xl md:text-2xl font-bold mb-4">
      Novo Chamado
    </h2>

          <div className="space-y-4">
            <div>
              <label className="label">Solicitante</label>
              <input
                className="input"
                placeholder="Nome do solicitante"
                value={solicitante}
                onChange={(e) => setSolicitante(e.target.value)}
              />
            </div>

            <div>
              <label className="label">Telefone</label>
<input
  className="input"
  placeholder="(75) 99999-9999"
  maxLength={15}
  value={telefone}
  onChange={(e) => {
    let valor = e.target.value
      .replace(/\D/g, "")
      .slice(0, 11);

    valor = valor
      .replace(/^(\d{2})(\d)/, "($1) $2")
      .replace(/(\d{5})(\d)/, "$1-$2");

    setTelefone(valor);
  }}
/>
            </div>

            <div>
              <label className="label">Tipo do chamado</label>
              <select
                className="input"
                value={tipo}
                onChange={(e) => setTipo(e.target.value)}
              >
                <option value="">Selecione</option>
                <option value="Apoio ao SAMU">Apoio ao SAMU</option>
                <option value="Perturbação do sossego">Perturbação do sossego</option>
                <option value="Apoio ao cidadão">Apoio ao cidadão</option>
                <option value="Fiscalização">Fiscalização</option>
                <option value="Ronda preventiva">Ronda preventiva</option>
                <option value="Acidente">Acidente</option>
                <option value="Conselho Tutelar">Conselho Tutelar</option>
                <option value="CAPS">CAPS</option>
                <option value="Apoio em evento esportivo">Apoio em evento esportivo</option>
                <option value="Apoio em evento cultural">Apoio em evento cultural</option>
                <option value="Apoio em evento religioso">Apoio em evento religioso</option>
                <option value="Apoio à saúde">Apoio à saúde</option>
                <option value="Averiguação de denúncia">Averiguação de denúncia</option>
                <option value="Outro">Outro</option>
              </select>
            
  <label className="label">Local Cadastrado</label>

  <select
    className="input"
    value={localId}
    onChange={(e) => {
  const id = e.target.value;
  setLocalId(id);

  const localSelecionado = locais.find(
    (l) => String(l.id) === id
  );

 if (localSelecionado) {
  setLocal(localSelecionado.nome || "");
  setBairro(localSelecionado.nome || "");
}
}}
  >
    <option value="">Selecione um local</option>

    {locais.map((l) => (
      <option key={l.id} value={l.id}>
        {l.nome}
      </option>
    ))}
  </select>
</div>

    <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
  <div className="md:col-span-3">
    <label className="label">Tipo de local</label>
    <select
      className="input"
      value={tipoLocal}
      onChange={(e) => setTipoLocal(e.target.value)}
    >
      <option value="Bairro">Bairro</option>
      <option value="Zona Rural">Zona Rural</option>
      <option value="Povoado">Povoado</option>
      <option value="Distrito">Distrito</option>
      <option value="Rodovia">Rodovia</option>
      <option value="Outro">Outro</option>
    </select>
  </div>

  <div className="md:col-span-3">
    <label className="label">Bairro / Localidade</label>
    <input
      className="input"
      placeholder={`Informe ${tipoLocal.toLowerCase()}`}
      value={bairro}
      onChange={(e) => setBairro(e.target.value)}
    />
  </div>

  <div className="md:col-span-2">
    <label className="label">Número</label>
    <input
      className="input"
      placeholder="S/N"
      value={numero}
      onChange={(e) => setNumero(e.target.value)}
    />
  </div>

  <div className="md:col-span-4">
    <label className="label">Referência</label>
    <input
      className="input"
      placeholder="Ponto de referência"
      value={referencia}
      onChange={(e) => setReferencia(e.target.value)}
    />
  </div>
</div>

            <div>
              <label className="label">Prioridade</label>
              <select
                className="input"
                value={prioridade}
                onChange={(e) => setPrioridade(e.target.value)}
              >
                <option>Baixa</option>
                <option>Normal</option>
                <option>Urgente</option>
              </select>
            </div>

            <div>
              <label className="label">Status</label>
              <select
                className="input"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                <option>Aberto</option>
                <option>Em Atendimento</option>
                <option>Finalizado</option>
              </select>
            </div>

            <div>
              <label className="label">Observação</label>
              <textarea
                className="input h-32 resize-none"
                placeholder="Detalhes do chamado"
                value={observacao}
                onChange={(e) => setObservacao(e.target.value)}
              />
            </div>

            <button
              type="button"
              onClick={salvarChamado}
              className="btn-primary w-full text-lg"
            >
              {editandoId ? "Atualizar Chamado" : "Registrar Chamado"}
            </button>
          </div>
          </div>
)}

        <div className="card xl:col-span-2">
          <h2 className="text-xl md:text-2xl font-bold mb-4">
            Chamados Registrados
          </h2>

          <div className="mb-5">
            <label className="label">Buscar chamado</label>
            <input
              className="input"
              placeholder="Buscar por protocolo, solicitante, tipo, local..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
            />
          </div>

          {carregando ? (
            <p className="text-slate-400">Carregando chamados...</p>
          ) : chamadosFiltrados.length === 0 ? (
            <p className="text-slate-400">Nenhum chamado encontrado.</p>
          ) : (
            <>
              <div className="md:hidden space-y-4">
                {chamadosFiltrados.map((chamado) => (
                  <div
                    key={chamado.id}
                    className="bg-slate-950/40 border border-slate-700 rounded-2xl p-4 shadow-lg"
                  >
                    <div className="flex justify-between gap-3 items-start">
                      <div>
                        <p className="text-blue-400 font-semibold">
                          {chamado.protocolo}
                        </p>

                        <h3 className="text-xl font-bold">
                          {chamado.tipo}
                        </h3>
                      </div>

                      <Prioridade prioridade={chamado.prioridade} />
                    </div>

                    <div className="text-slate-300 space-y-1">
                      <p>
                        <span className="text-slate-500">Solicitante: </span>
                        {chamado.solicitante}
                      </p>

                      <p>
                        <span className="text-slate-500">Telefone: </span>
                        {chamado.telefone || "-"}
                      </p>

                      <p>
                        <span className="text-slate-500">Local: </span>
                        {chamado.local}
                      </p>

                      {chamado.bairro && (
  <p>
    <span className="text-slate-500">
      Bairro:
    </span>{" "}
    {chamado.bairro}
  </p>
)}

{chamado.numero && (
  <p>
    <span className="text-slate-500">
      Número:
    </span>{" "}
    {chamado.numero}
  </p>
)}

{chamado.referencia && (
  <p>
    <span className="text-slate-500">
      Referência:
    </span>{" "}
    {chamado.referencia}
  </p>
)}

                      <p>
                        <span className="text-slate-500">Status: </span>
                        <Status status={chamado.status} />
                      </p>

                      {chamado.observacao && (
                        <p className="pt-2 text-slate-400">
                          {chamado.observacao}
                        </p>
                      )}

{chamado.atendido_por && (
  <p>
    <span className="text-slate-500">
      Atendido por:
    </span>{" "}
    {chamado.atendido_por}
  </p>
)}

{chamado.finalizado_por && (
  <p>
    <span className="text-slate-500">
      Finalizado por:
    </span>{" "}
    {chamado.finalizado_por}
  </p>
)}

                    </div>

{podeGerarOcorrencia && (
  <button
    type="button"
    onClick={() =>
      router.push(
        `/sistema/ocorrencias/nova?chamado=${chamado.id}`
      )
    }
    className="w-full bg-green-700 hover:bg-green-800 text-white px-4 py-3 rounded-xl font-semibold mb-2"
  >
    Gerar Ocorrência
  </button>
)}

{podeEditarChamado && (
  <button
    type="button"
    onClick={() => {
  if (chamado.status === "Finalizado") {
    alert("Chamado finalizado não pode ser editado.");
    return;
  }

  editarChamado(chamado);
}}
    className="bg-blue-700 hover:bg-blue-800 text-white w-10 h-10 flex items-center justify-center rounded-lg text-xs mr-2"
  >
    <Pencil className="w-4 h-4" />
  </button>
)}

{podeAtenderChamado &&
  chamado.status === "Aberto" && (
  <button
    type="button"
    onClick={() => atenderChamado(chamado.id)}
    className="bg-yellow-700 hover:bg-yellow-800 text-white w-10 h-10 flex items-center justify-center rounded-lg text-xs mr-2"
  >
    <Play className="w-4 h-4" />
  </button>
)}

{podeFinalizarChamado &&
  chamado.status === "Em Atendimento" && (
  <button
    type="button"
    onClick={() => finalizarChamado(chamado.id)}
    className="bg-green-700 hover:bg-green-800 text-white w-10 h-10 flex items-center justify-center rounded-lg text-xs mr-2"
  >
    <Check className="w-4 h-4" />
  </button>
)}

{podeExcluirChamado && (
  <button
    type="button"
    onClick={() => excluirChamado(chamado.id)}
    className="bg-red-700 hover:bg-red-800 text-white w-10 h-10 flex items-center justify-center rounded-lg text-xs"
  >
    <Trash2 className="w-4 h-4" />
  </button>
)}
                  </div>
                ))}
              </div>

              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b border-slate-700 text-slate-400">
                    <tr>
                      <th className="text-left py-3">Protocolo</th>
                      <th className="text-left py-3">Solicitante</th>
                      <th className="text-left py-3">Tipo</th>
                      <th className="text-left py-3">Prioridade</th>
                      <th className="text-left py-3">Status</th>
                      <th className="text-center py-3 min-w-[420px]">
  Ações
</th>
                    </tr>
                  </thead>

                  <tbody>
                    {chamadosFiltrados.map((chamado) => (
                      <tr key={chamado.id} className="border-b border-slate-800">
                        <td className="py-4 text-blue-400 font-semibold">
                          {chamado.protocolo}
                        </td>

                        <td>{chamado.solicitante}</td>
                        <td className="text-slate-400">{chamado.tipo}</td>

                        <td>
                          <Prioridade prioridade={chamado.prioridade} />
                        </td>

                        <td>
                          <Status status={chamado.status} />
                        </td>

                        <td className="text-center">
  <div className="flex items-center justify-center gap-3 flex-wrap">

    {podeGerarOcorrencia && (
  <BotaoAcao
    title="Gerar Ocorrência"
    cor="green"
    onClick={() =>
      router.push(
        `/sistema/ocorrencias/nova?chamado=${chamado.id}`
      )
    }
  >
    <Eye size={18} />
  </BotaoAcao>
)}

    {podeEditarChamado && (
  <BotaoAcao
    title="Editar"
    cor="blue"
    onClick={() => {
      if (chamado.status === "Finalizado") {
        alert("Chamado finalizado não pode ser editado.");
        return;
      }

      editarChamado(chamado);
    }}
  >
    <Pencil size={18} />
  </BotaoAcao>
)}

    {podeAtenderChamado &&
  chamado.status === "Aberto" && (
        <BotaoAcao
  title="Atender"
  cor="yellow"
  onClick={() => {
    console.log("CHAMADO:", chamado);
    atenderChamado(chamado.id);
  }}
>
  <Play size={18} />
</BotaoAcao>
      )}

    {podeFinalizarChamado &&
  chamado.status === "Em Atendimento" && (
      <BotaoAcao
        title="Finalizar"
        cor="green"
        onClick={() => finalizarChamado(chamado.id)}
      >
        <Check size={18} />
      </BotaoAcao>
    )}

    {podeExcluirChamado && (
      <BotaoAcao
        title="Excluir"
        cor="red"
        onClick={() => excluirChamado(chamado.id)}
      >
        <Trash2 size={18} />
      </BotaoAcao>
    )}

  </div>
</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </section>
    </div>
  );
}


function Prioridade({ prioridade }: { prioridade: string }) {
  let cor = "bg-blue-700 text-blue-100";

  if (prioridade === "Baixa") cor = "bg-slate-700 text-slate-100";
  if (prioridade === "Normal") cor = "bg-blue-700 text-blue-100";
  if (prioridade === "Urgente") cor = "bg-red-700 text-red-100";

  return (
    <span className={`${cor} px-3 py-2 rounded text-xs inline-block`}>
      {prioridade}
    </span>
  );
}

function Status({ status }: { status: string }) {
  let cor = "bg-yellow-600 text-yellow-100";

  if (status === "Aberto") cor = "bg-yellow-600 text-yellow-100";
  if (status === "Em Atendimento") cor = "bg-blue-700 text-blue-100";
  if (status === "Finalizado") cor = "bg-green-700 text-green-100";

  return (
    <span className={`${cor} px-3 py-2 rounded text-xs inline-block`}>
      {status}
    </span>
  );
}