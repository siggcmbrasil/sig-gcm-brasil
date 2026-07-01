"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function PatrimonioPage() {
  const [itens, setItens] = useState<any[]>([]);
  const [salvando, setSalvando] = useState(false);
  const [carregando, setCarregando] = useState(true);
  const [busca, setBusca] = useState("");

  const [nome, setNome] = useState("");
  const [categoria, setCategoria] = useState("EQUIPAMENTO");
  const [patrimonio, setPatrimonio] = useState("");
  const [status, setStatus] = useState("OPERACIONAL");
  const [local, setLocal] = useState("");
  const [observacao, setObservacao] = useState("");

  const usuario =
    typeof window !== "undefined"
      ? JSON.parse(localStorage.getItem("usuarioLogado") || "{}")
      : {};

  async function carregar() {
    if (!usuario?.municipio_id) return;

    setCarregando(true);

    const { data } = await supabase
      .from("patrimonios")
      .select("*")
      .eq("municipio_id", usuario.municipio_id)
      .order("criado_em", { ascending: false });

    setItens(data || []);
    setCarregando(false);
  }

  useEffect(() => {
    carregar();
  }, []);

  const resumo = useMemo(() => {
    return {
      total: itens.length,
      operacionais: itens.filter((i) => i.status === "OPERACIONAL").length,
      manutencao: itens.filter((i) => i.status === "EM_MANUTENCAO").length,
      baixados: itens.filter((i) => i.status === "BAIXADO").length,
    };
  }, [itens]);

  const itensFiltrados = itens.filter((item) => {
    const texto = `
      ${item.nome || ""}
      ${item.categoria || ""}
      ${item.numero_patrimonio || ""}
      ${item.status || ""}
      ${item.local || ""}
      ${item.observacao || ""}
    `.toLowerCase();

    return texto.includes(busca.toLowerCase());
  });

  function limparFormulario() {
    setNome("");
    setCategoria("EQUIPAMENTO");
    setPatrimonio("");
    setStatus("OPERACIONAL");
    setLocal("");
    setObservacao("");
  }

  async function salvar() {
    if (!nome.trim() || !categoria) {
      alert("Preencha nome e categoria.");
      return;
    }

    setSalvando(true);

    const { error } = await supabase.from("patrimonios").insert([
      {
        municipio_id: usuario.municipio_id,
        criado_por: usuario.id,
        nome: nome.trim(),
        categoria,
        numero_patrimonio: patrimonio.trim() || null,
        status,
        local: local.trim() || null,
        observacao: observacao.trim() || null,
      },
    ]);

    setSalvando(false);

    if (error) {
      alert(error.message);
      return;
    }

    limparFormulario();
    carregar();
    alert("Item patrimonial cadastrado com sucesso.");
  }

  function nomeStatus(valor: string) {
    const nomes: Record<string, string> = {
      OPERACIONAL: "Operacional",
      DANIFICADO: "Danificado",
      EM_MANUTENCAO: "Em manutenção",
      BAIXADO: "Baixado",
      EXTRAVIADO: "Extraviado",
    };

    return nomes[valor] || valor;
  }

  function nomeCategoria(valor: string) {
    const nomes: Record<string, string> = {
      EQUIPAMENTO: "Equipamento",
      CELULAR: "Celular",
      COMPUTADOR: "Computador",
      IMPRESSORA: "Impressora",
      TV: "TV",
      RADIO: "Rádio",
      MOBILIARIO: "Mobiliário",
      COZINHA: "Cozinha",
      AR_CONDICIONADO: "Ar-condicionado",
      OUTRO: "Outro",
    };

    return nomes[valor] || valor;
  }

  return (
    <div className="p-4 md:p-6 pb-24 space-y-6">
      <div className="painel-premium p-6">
        <p className="text-sm text-slate-400 font-semibold">
          Controle Patrimonial
        </p>

        <h1 className="text-2xl md:text-3xl font-black text-white">
          🏷️ Patrimônio e Equipamentos
        </h1>

        <p className="text-slate-400 mt-2">
          Controle de equipamentos, móveis, eletrônicos e bens da unidade.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card titulo="Itens" valor={String(resumo.total)} />
        <Card titulo="Operacionais" valor={String(resumo.operacionais)} />
        <Card titulo="Manutenção" valor={String(resumo.manutencao)} />
        <Card titulo="Baixados" valor={String(resumo.baixados)} />
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <Atalho
          href="/sistema/patrimonio/movimentacoes"
          icone="🔁"
          titulo="Movimentações"
          texto="Transferir item entre local, setor ou responsável."
        />

        <Atalho
          href="/sistema/patrimonio/baixas"
          icone="📦"
          titulo="Baixas"
          texto="Registrar baixa, descarte, extravio ou inutilização."
        />

        <Atalho
          href="/sistema/patrimonio/qrcode"
          icone="🔳"
          titulo="QR Code"
          texto="Gerar etiqueta de identificação patrimonial."
        />
      </div>

      <div className="grid xl:grid-cols-3 gap-6">
        <div className="painel-premium p-6 xl:col-span-1">
          <h2 className="text-xl font-black text-white">
            Novo Item
          </h2>

          <p className="text-slate-400 text-sm mb-5">
            Cadastre um bem patrimonial da unidade.
          </p>

          <div className="space-y-4">
            <Campo
              label="Nome do item"
              valor={nome}
              setValor={setNome}
              placeholder="Ex: Notebook Dell, Mesa, Rádio HT..."
            />

            <div>
              <label className="label">Categoria</label>
              <select
                className="input"
                value={categoria}
                onChange={(e) => setCategoria(e.target.value)}
              >
                <option value="EQUIPAMENTO">Equipamento</option>
                <option value="CELULAR">Celular</option>
                <option value="COMPUTADOR">Computador</option>
                <option value="IMPRESSORA">Impressora</option>
                <option value="TV">TV</option>
                <option value="RADIO">Rádio</option>
                <option value="MOBILIARIO">Mobiliário</option>
                <option value="COZINHA">Cozinha</option>
                <option value="AR_CONDICIONADO">Ar-condicionado</option>
                <option value="OUTRO">Outro</option>
              </select>
            </div>

            <Campo
              label="Número de patrimônio"
              valor={patrimonio}
              setValor={setPatrimonio}
              placeholder="Ex: PAT-001"
            />

            <div>
              <label className="label">Status</label>
              <select
                className="input"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                <option value="OPERACIONAL">Operacional</option>
                <option value="DANIFICADO">Danificado</option>
                <option value="EM_MANUTENCAO">Em manutenção</option>
                <option value="BAIXADO">Baixado</option>
                <option value="EXTRAVIADO">Extraviado</option>
              </select>
            </div>

            <Campo
              label="Local onde está"
              valor={local}
              setValor={setLocal}
              placeholder="Ex: Base GCM, Sala do Comando..."
            />

            <div>
              <label className="label">Observações</label>
              <textarea
                className="input min-h-[120px]"
                placeholder="Estado de conservação, detalhes ou observações..."
                value={observacao}
                onChange={(e) => setObservacao(e.target.value)}
              />
            </div>

            <button
              onClick={salvar}
              disabled={salvando}
              className="sig-btn-gold w-full disabled:opacity-50"
            >
              {salvando ? "Salvando..." : "Cadastrar Item"}
            </button>
          </div>
        </div>

        <div className="xl:col-span-2 space-y-4">
          <div className="painel-premium p-6">
            <h2 className="text-xl font-black text-white">
              Itens Patrimoniais
            </h2>

            <p className="text-slate-400 text-sm mb-4">
              Consulte todos os bens cadastrados na unidade.
            </p>

            <input
              className="input"
              placeholder="Buscar por nome, patrimônio, categoria, local ou status..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
            />
          </div>

          {carregando ? (
            <div className="painel-premium p-6 text-slate-400">
              Carregando patrimônio...
            </div>
          ) : itensFiltrados.length === 0 ? (
            <div className="painel-premium p-10 text-center">
              <p className="text-6xl mb-3">🏷️</p>

              <h2 className="text-white font-black text-xl">
                Nenhum item encontrado
              </h2>

              <p className="text-slate-400 text-sm mt-2">
                Cadastre um item ou altere a busca.
              </p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              {itensFiltrados.map((item) => (
                <div
                  key={item.id}
                  className="rounded-3xl border border-slate-800 bg-slate-950/70 p-5 shadow-xl"
                >
                  <div className="flex justify-between gap-3">
                    <div>
                      <p className="text-blue-400 text-sm font-bold">
                        {item.numero_patrimonio || "Sem patrimônio"}
                      </p>

                      <h3 className="text-xl font-black text-white">
                        {iconeCategoria(item.categoria)} {item.nome}
                      </h3>

                      <p className="text-slate-500 text-sm">
                        {nomeCategoria(item.categoria)}
                      </p>
                    </div>

                    <Status status={item.status} />
                  </div>

                  <div className="grid grid-cols-2 gap-3 mt-4">
                    <Info titulo="Local" valor={item.local || "N/I"} />
                    <Info titulo="Status" valor={nomeStatus(item.status)} />
                  </div>

                  {item.observacao && (
                    <p className="text-slate-300 text-sm mt-4 whitespace-pre-wrap">
                      {item.observacao}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function iconeCategoria(categoria: string) {
  const texto = String(categoria || "").toLowerCase();

  if (texto.includes("celular")) return "📱";
  if (texto.includes("computador")) return "💻";
  if (texto.includes("impressora")) return "🖨️";
  if (texto.includes("tv")) return "📺";
  if (texto.includes("radio") || texto.includes("rádio")) return "📻";
  if (texto.includes("mobiliario")) return "🪑";
  if (texto.includes("cozinha")) return "🍽️";
  if (texto.includes("ar_condicionado")) return "❄️";

  return "🏷️";
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

  if (status === "OPERACIONAL") cor = "bg-green-950 text-green-300 border-green-800";
  if (status === "DANIFICADO") cor = "bg-yellow-950 text-yellow-300 border-yellow-800";
  if (status === "EM_MANUTENCAO") cor = "bg-blue-950 text-blue-300 border-blue-800";
  if (status === "BAIXADO") cor = "bg-red-950 text-red-300 border-red-800";
  if (status === "EXTRAVIADO") cor = "bg-red-950 text-red-300 border-red-800";

  return (
    <span className={`h-fit rounded-full border px-3 py-1 text-xs font-bold ${cor}`}>
      {status}
    </span>
  );
}

function Atalho({
  href,
  icone,
  titulo,
  texto,
}: {
  href: string;
  icone: string;
  titulo: string;
  texto: string;
}) {
  return (
    <Link
      href={href}
      className="painel-premium p-5 hover:scale-[1.01] transition block"
    >
      <p className="text-4xl mb-3">{icone}</p>
      <h2 className="text-xl font-black text-white">{titulo}</h2>
      <p className="text-slate-400 text-sm mt-2">{texto}</p>
    </Link>
  );
}