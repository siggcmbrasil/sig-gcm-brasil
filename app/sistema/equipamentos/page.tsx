"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import { registrarAuditoria } from "@/lib/auditoria";

type Equipamento = {
  id: number;
  patrimonio: string | null;
  tipo: string | null;
  quantidade: number | null;
controle_tipo: "Individual" | "Lote" | null;
  marca: string | null;
  modelo: string | null;
  numero_serie: string | null;
  validade: string | null;
  status: string | null;
  responsavel: string | null;
  observacao: string | null;
};

type Guarda = {
  id: number;
  nome: string;
  matricula: string;
  status: string;
};

const tiposEquipamento = [
  "Colete Balístico",
  "HT Rádio",
  "Tonfa",
  "Algema",
  "Lanterna",
  "BodyCam",
  "Tablet",
  "Celular Funcional",
  "Apito",
  "Capa de Chuva",
  "Cone",
  "Barreira",
  "Bastão Sinalizador",
  "Câmera Fotográfica",
  "Notebook",
  "Impressora",
  "GPS",
  "Drone",
  "Kit Primeiros Socorros",
  "Outro",
];

export default function EquipamentosPage() {
  const [equipamentos, setEquipamentos] = useState<Equipamento[]>([]);
  const [guardas, setGuardas] = useState<Guarda[]>([]);
  const [editando, setEditando] = useState<Equipamento | null>(null);

  const [busca, setBusca] = useState("");
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);

  const [quantidade, setQuantidade] = useState("1");
const [controleTipo, setControleTipo] =
  useState<"Individual" | "Lote">("Individual");

  const [patrimonio, setPatrimonio] = useState("");
  const [tipo, setTipo] = useState("");
  const [marca, setMarca] = useState("");
  const [modelo, setModelo] = useState("");
  const [numeroSerie, setNumeroSerie] = useState("");
  const [validade, setValidade] = useState("");
  const [status, setStatus] = useState("Disponível");
  const [responsavel, setResponsavel] = useState("");
  const [observacao, setObservacao] = useState("");

  const usuario =
    typeof window !== "undefined"
      ? JSON.parse(localStorage.getItem("usuarioLogado") || "{}")
      : {};

  async function carregarEquipamentos() {
    if (!usuario?.municipio_id) return;

    setCarregando(true);

    const { data, error } = await supabase
      .from("equipamentos")
      .select("*")
      .eq("municipio_id", usuario.municipio_id)
      .order("id", { ascending: false });

    if (error) {
      console.error(error);
      alert("Erro ao carregar equipamentos.");
    }

    setEquipamentos(data || []);
    setCarregando(false);
  }

  async function carregarGuardas() {
    if (!usuario?.municipio_id) return;

    const { data } = await supabase
      .from("guardas")
      .select("id, nome, matricula, status")
      .eq("municipio_id", usuario.municipio_id)
      .order("nome", { ascending: true });

    setGuardas(data || []);
  }

  useEffect(() => {
    carregarEquipamentos();
    carregarGuardas();
  }, []);

  const resumo = useMemo(() => {
    return {
      total: equipamentos.reduce(
  (acc, item) =>
    acc +
    (item.controle_tipo === "Lote"
      ? item.quantidade || 0
      : 1),
  0
),
      disponiveis: equipamentos.filter((e) => e.status === "Disponível").length,
      emUso: equipamentos.filter((e) => e.status === "Em uso").length,
      manutencao: equipamentos.filter((e) => e.status === "Manutenção").length,
      baixados: equipamentos.filter(
        (e) => e.status === "Baixado" || e.status === "Extraviado"
      ).length,
    };
  }, [equipamentos]);

  const equipamentosFiltrados = equipamentos.filter((item) => {
    const texto = `
      ${item.patrimonio || ""}
      ${item.tipo || ""}
      ${item.marca || ""}
      ${item.modelo || ""}
      ${item.numero_serie || ""}
      ${item.validade || ""}
      ${item.status || ""}
      ${item.responsavel || ""}
      ${item.observacao || ""}
    `.toLowerCase();

    return texto.includes(busca.toLowerCase());
  });

  function limparFormulario() {
    setEditando(null);
    setPatrimonio("");
    setTipo("");
    setMarca("");
    setModelo("");
    setNumeroSerie("");
    setValidade("");
    setStatus("Disponível");
    setResponsavel("");
    setObservacao("");
    setQuantidade("1");
    setControleTipo("Individual");
  }

  function editarEquipamento(item: Equipamento) {
    setEditando(item);
    setPatrimonio(item.patrimonio || "");
    setTipo(item.tipo || "");
    setMarca(item.marca || "");
    setModelo(item.modelo || "");
    setNumeroSerie(item.numero_serie || "");
    setValidade(item.validade || "");
    setStatus(item.status || "Disponível");
    setResponsavel(item.responsavel || "");
    setObservacao(item.observacao || "");
    setQuantidade(
  String(item.quantidade ?? 1)
);
    setControleTipo(
    (item.controle_tipo as "Individual" | "Lote") ||
    "Individual"
);
  }

  async function salvarEquipamento() {
    if (!usuario?.municipio_id) {
      alert("Município não identificado.");
      return;
    }

    if (
  (controleTipo === "Individual" &&
    !patrimonio.trim()) ||
  !tipo.trim()
) {
      alert("Preencha patrimônio e tipo.");
      return;
    }

    setSalvando(true);

    if (
  controleTipo === "Lote" &&
  Number(quantidade) <= 0
) {
  alert("Informe uma quantidade válida.");
  setSalvando(false);
  return;
}

    const dados = {
  municipio_id: usuario.municipio_id,
  patrimonio:
    controleTipo === "Individual"
      ? patrimonio.trim().toUpperCase()
      : null,
  quantidade:
    controleTipo === "Lote"
      ? Number(quantidade)
      : 1,
  controle_tipo: controleTipo,
  tipo,
  marca: marca.trim() || null,
  modelo: modelo.trim() || null,
  numero_serie: numeroSerie.trim() || null,
  validade: validade || null,
  status,
  responsavel: responsavel || null,
  observacao: observacao.trim() || null,
};

    const { error } = editando
      ? await supabase
          .from("equipamentos")
          .update(dados)
          .eq("id", editando.id)
          .eq("municipio_id", usuario.municipio_id)
      : await supabase.from("equipamentos").insert([dados]);

    setSalvando(false);

    if (error) {
      console.error(error);
      alert("Erro ao salvar equipamento.");
      return;
    }

    await registrarAuditoria({
  modulo: "Equipamentos",
  acao: editando ? "EDITAR" : "CRIAR",
  descricao: editando
    ? `Atualizou o equipamento ${tipo} (${responsavel || "sem responsável"}).`
    : `Cadastrou o equipamento ${tipo}.`,
  detalhes: {
    tipo,
    controle_tipo: controleTipo,
    quantidade: Number(quantidade),
    patrimonio,
    marca,
    modelo,
    numero_serie: numeroSerie,
    status,
    responsavel,
  },
});

    alert(editando ? "Equipamento atualizado com sucesso." : "Equipamento cadastrado com sucesso.");
    limparFormulario();
    carregarEquipamentos();
  }

  async function excluirEquipamento(id: number) {
    if (!confirm("Deseja excluir este equipamento?")) return;

    const equipamento = equipamentos.find(
  (e) => e.id === id
);

    const { error } = await supabase
      .from("equipamentos")
      .delete()
      .eq("id", id)
      .eq("municipio_id", usuario.municipio_id);

    if (error) {
      console.error(error);
      alert("Erro ao excluir equipamento.");
      return;
    }

    await registrarAuditoria({
  modulo: "Equipamentos",
  acao: "EXCLUIR",
  descricao: `Excluiu o equipamento ${
    equipamento?.tipo || id
  }.`,
  detalhes: {
    id: equipamento?.id,
    tipo: equipamento?.tipo,
    patrimonio: equipamento?.patrimonio,
    controle_tipo: equipamento?.controle_tipo,
    quantidade: equipamento?.quantidade,
    responsavel: equipamento?.responsavel,
  },
});

    carregarEquipamentos();
  }

  return (
    <div className="p-4 md:p-6 pb-24 space-y-6">
      <div className="painel-premium p-6">
        <p className="text-sm text-slate-400 font-semibold">
          Controle Patrimonial
        </p>

        <h1 className="text-2xl md:text-3xl font-black text-white">
          🎒 Equipamentos
        </h1>

        <p className="text-slate-400 mt-2">
          Cadastro, controle, responsabilidade e situação dos equipamentos operacionais.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card titulo="Total" valor={String(resumo.total)} />
        <Card titulo="Disponíveis" valor={String(resumo.disponiveis)} />
        <Card titulo="Em uso" valor={String(resumo.emUso)} />
        <Card titulo="Manutenção" valor={String(resumo.manutencao)} />
        <Card titulo="Baixados" valor={String(resumo.baixados)} />
      </div>

<div>
  <label className="label">Tipo de Controle</label>

  <select
    className="input"
    value={controleTipo}
    onChange={(e) =>
      setControleTipo(
        e.target.value as "Individual" | "Lote"
      )
    }
  >
    <option value="Individual">
      Patrimonial Individual
    </option>
    <option value="Lote">
      Controle por Quantidade
    </option>
  </select>
</div>

      <div className="grid xl:grid-cols-3 gap-6">
        <div className="painel-premium p-6 xl:col-span-1">
          <h2 className="text-xl font-black text-white">
            {editando ? "Editar Equipamento" : "Novo Equipamento"}
          </h2>

          <p className="text-slate-400 text-sm mb-5">
            Informe patrimônio, tipo, responsável e situação atual.
          </p>

          <div className="space-y-4">
            {controleTipo === "Individual" && (
  <Campo
    label="Patrimônio"
    valor={patrimonio}
    setValor={setPatrimonio}
    placeholder="Ex: CB-015"
  />
)}

            <div>
              <label className="label">Tipo</label>
              <select
                className="input"
                value={tipo}
                onChange={(e) => setTipo(e.target.value)}
              >
                <option value="">Selecione o tipo</option>

                {tiposEquipamento.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>

{controleTipo === "Lote" && (
  <div>
    <label className="label">Quantidade</label>

    <input
      type="number"
      min={1}
      className="input"
      value={quantidade}
      onChange={(e) => setQuantidade(e.target.value)}
      placeholder="Ex: 10"
    />
  </div>
)}

            <div className="grid grid-cols-2 gap-3">
              <Campo label="Marca" valor={marca} setValor={setMarca} />
              <Campo label="Modelo" valor={modelo} setValor={setModelo} />
            </div>

            <Campo
              label="Número de série"
              valor={numeroSerie}
              setValor={setNumeroSerie}
              placeholder="Ex: SN-2026-001"
            />

            <div>
              <label className="label">Validade</label>
              <input
                type="date"
                className="input"
                value={validade}
                onChange={(e) => setValidade(e.target.value)}
              />
            </div>

            <div>
              <label className="label">Status</label>
              <select
                className="input"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                <option>Disponível</option>
                <option>Em uso</option>
                <option>Manutenção</option>
                <option>Baixado</option>
                <option>Extraviado</option>
              </select>
            </div>

            <div>
              <label className="label">Responsável</label>
              <select
                className="input"
                value={responsavel}
                onChange={(e) => setResponsavel(e.target.value)}
              >
                <option value="">Sem responsável</option>

                {guardas.map((g) => (
                  <option key={g.id} value={g.nome}>
                    {g.nome} • {g.matricula} • {g.status}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="label">Observação</label>
              <textarea
                className="input min-h-[110px]"
                value={observacao}
                onChange={(e) => setObservacao(e.target.value)}
                placeholder="Ex: entregue ao servidor, em bom estado, aguardando manutenção..."
              />
            </div>

            <button
              type="button"
              onClick={salvarEquipamento}
              disabled={salvando}
              className="sig-btn-gold w-full disabled:opacity-50"
            >
              {salvando
                ? "Salvando..."
                : editando
                ? "Atualizar Equipamento"
                : "Salvar Equipamento"}
            </button>

            {editando && (
              <button
                type="button"
                onClick={limparFormulario}
                className="btn-secondary w-full"
              >
                Cancelar edição
              </button>
            )}
          </div>
        </div>

        <div className="xl:col-span-2 space-y-4">
          <div className="painel-premium p-6">
            <h2 className="text-xl font-black text-white">
              Equipamentos Cadastrados
            </h2>

            <p className="text-slate-400 text-sm mb-4">
              Consulte os equipamentos por patrimônio, tipo, responsável ou status.
            </p>

            <input
              className="input"
              placeholder="Buscar por patrimônio, tipo, série, responsável..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
            />
          </div>

          {carregando ? (
            <div className="painel-premium p-6 text-slate-400">
              Carregando equipamentos...
            </div>
          ) : equipamentosFiltrados.length === 0 ? (
            <div className="painel-premium p-10 text-center">
              <p className="text-6xl mb-3">🎒</p>
              <h2 className="text-white font-black text-xl">
                Nenhum equipamento encontrado
              </h2>
              <p className="text-slate-400 text-sm mt-2">
                Cadastre um equipamento ou altere a busca.
              </p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              {equipamentosFiltrados.map((item) => (
                <div
                  key={item.id}
                  className="rounded-3xl border border-slate-800 bg-slate-950/70 p-5 shadow-xl"
                >
                  <div className="flex justify-between gap-3">
                    <div>
                      <p className="text-blue-400 text-sm font-bold">
                        {item.controle_tipo === "Lote"
  ? `Lote (${item.quantidade || 0} unidades)`
  : item.patrimonio || "Sem patrimônio"}
                      </p>

                      <h3 className="text-xl font-black text-white">
                        {iconeTipo(item.tipo || "")} {item.tipo || "Equipamento"}
                      </h3>

                      <p className="text-slate-500 text-sm">
                        {item.marca || "Marca não informada"}{" "}
                        {item.modelo ? `• ${item.modelo}` : ""}
                      </p>
                    </div>

                    <Status status={item.status || "-"} />
                  </div>

                  <div className="grid grid-cols-2 gap-3 mt-4">
  <Info
    titulo="Controle"
    valor={item.controle_tipo || "Individual"}
  />

  {item.controle_tipo === "Lote" && (
    <Info
      titulo="Quantidade"
      valor={String(item.quantidade || 0)}
    />
  )}

  <Info titulo="Série" valor={item.numero_serie || "N/I"} />
  <Info titulo="Validade" valor={item.validade || "N/I"} />
  <Info titulo="Responsável" valor={item.responsavel || "Sem responsável"} />
  <Info titulo="Status" valor={item.status || "-"} />
</div>

                  {item.observacao && (
                    <p className="text-slate-400 text-sm mt-4 whitespace-pre-wrap">
                      {item.observacao}
                    </p>
                  )}

                  <div className="flex gap-3 mt-5">
                    <button
                      type="button"
                      onClick={() => editarEquipamento(item)}
                      className="sig-btn-gold flex-1"
                    >
                      Editar
                    </button>

                    <button
                      type="button"
                      onClick={() => excluirEquipamento(item.id)}
                      className="rounded-xl px-4 py-2 bg-red-950/60 border border-red-900 text-red-300 font-bold"
                    >
                      Excluir
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function iconeTipo(tipo: string) {
  const texto = tipo.toLowerCase();

  if (texto.includes("colete")) return "🦺";
  if (texto.includes("rádio") || texto.includes("ht")) return "📻";
  if (texto.includes("algema")) return "🔗";
  if (texto.includes("lanterna")) return "🔦";
  if (texto.includes("body")) return "📹";
  if (texto.includes("tablet") || texto.includes("celular")) return "📱";
  if (texto.includes("drone")) return "🚁";
  if (texto.includes("cone")) return "🔶";
  if (texto.includes("primeiros")) return "🚑";

  return "🎒";
}

function Campo({
  label,
  valor,
  setValor,
  placeholder,
}: {
  label: string;
  valor: string;
  setValor: (valor: string) => void;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="label">{label}</label>

      <input
        className="input"
        placeholder={placeholder}
        value={valor}
        onChange={(e) => setValor(e.target.value)}
      />
    </div>
  );
}

function Card({ titulo, valor }: { titulo: string; valor: string }) {
  return (
    <div className="painel-premium p-5">
      <p className="text-slate-400 text-sm">{titulo}</p>
      <h2 className="text-2xl md:text-3xl font-black text-white">{valor}</h2>
    </div>
  );
}

function Info({ titulo, valor }: { titulo: string; valor: string }) {
  return (
    <div className="rounded-xl bg-slate-900/70 p-3">
      <p className="text-slate-500 text-xs">{titulo}</p>
      <p className="text-slate-200 font-bold text-sm">{valor}</p>
    </div>
  );
}

function Status({ status }: { status: string }) {
  let cor = "bg-slate-900 text-slate-300 border-slate-700";

  if (status === "Disponível") cor = "bg-green-950 text-green-300 border-green-800";
  if (status === "Em uso") cor = "bg-blue-950 text-blue-300 border-blue-800";
  if (status === "Manutenção") cor = "bg-yellow-950 text-yellow-300 border-yellow-800";
  if (status === "Baixado") cor = "bg-red-950 text-red-300 border-red-800";
  if (status === "Extraviado") cor = "bg-red-950 text-red-300 border-red-800";

  return (
    <span className={`h-fit rounded-full border px-3 py-1 text-xs font-bold ${cor}`}>
      {status}
    </span>
  );
}