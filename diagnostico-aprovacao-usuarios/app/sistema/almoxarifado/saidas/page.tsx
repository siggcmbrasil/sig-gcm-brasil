"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import { registrarAuditoria } from "@/lib/auditoria";

const destinosRapidos = [
  "Guarnição de serviço",
  "Base GCM",
  "Sala do Comando",
  "Setor Administrativo",
  "Viatura",
  "Evento público",
  "Ronda escolar",
  "Operação especial",
  "Servidor",
];

const observacoesRapidas = [
  "Material entregue em bom estado.",
  "Entrega para uso operacional.",
  "Entrega para reposição de material.",
  "Entrega vinculada ao serviço do dia.",
  "Servidor recebeu o material.",
  "Material entregue para evento/ação externa.",
  "Saída autorizada pelo comando.",
  "Necessário reposição futura.",
];

const quantidadesRapidas = ["1", "2", "5", "10", "20", "50", "100"];

export default function SaidaAlmoxarifadoPage() {
  const [entradas, setEntradas] = useState<any[]>([]);
  const [saidas, setSaidas] = useState<any[]>([]);
  const [guardas, setGuardas] = useState<any[]>([]);
  const [salvando, setSalvando] = useState(false);

  const [itemSelecionado, setItemSelecionado] = useState("");
  const [quantidade, setQuantidade] = useState("");
  const [destino, setDestino] = useState("");
  const [responsavel, setResponsavel] = useState("");
  const [finalidade, setFinalidade] = useState("USO_OPERACIONAL");
  const [observacao, setObservacao] = useState("");

  const [usuario, setUsuario] = useState<any>(null);
const [carregando, setCarregando] = useState(true);

useEffect(() => {
  const dados = JSON.parse(
    localStorage.getItem("usuarioLogado") || "{}"
  );

  if (!dados?.id || !dados?.municipio_id) {
    alert("Sessão inválida.");
    setCarregando(false);
    return;
  }

  setUsuario(dados);

  registrarAuditoria({
    modulo: "Almoxarifado",
    acao: "ACESSO",
    descricao: "Acessou a tela de saída do almoxarifado.",
    tabela: "almoxarifado_saidas",
  });
}, []);

  async function carregar() {
    setCarregando(true);
    if (!usuario?.municipio_id) return;

    const { data: listaEntradas } = await supabase
      .from("almoxarifado_entradas")
      .select(`
  id,
  item,
  categoria,
  quantidade,
  unidade,
  local
`)
.limit(500)
      .eq("municipio_id", usuario.municipio_id)
      .order("item");

    const { data: listaSaidas } = await supabase
      .from("almoxarifado_saidas")
      .select(`
  id,
  item,
  categoria,
  quantidade,
  unidade,
  destino,
  responsavel,
  finalidade,
  observacao,
  criado_em
`)
.limit(100)
      .eq("municipio_id", usuario.municipio_id)
      .order("criado_em", { ascending: false });

    const { data: listaGuardas } = await supabase
      .from("guardas")
      .select("id, nome, matricula, status")
      .eq("municipio_id", usuario.municipio_id)
      .order("nome");

    setCarregando(false);
    setEntradas(listaEntradas || []);
    setSaidas(listaSaidas || []);
    setGuardas(listaGuardas || []);
  }

  useEffect(() => {
  if (usuario?.municipio_id) {
    carregar();
  }
}, [usuario]);

  const estoque = useMemo(() => {
    const mapa = new Map<string, any>();

    entradas.forEach((entrada) => {
      const chave = `${entrada.item}-${entrada.categoria}-${entrada.unidade}`;

      if (!mapa.has(chave)) {
        mapa.set(chave, {
          item: entrada.item,
          categoria: entrada.categoria,
          unidade: entrada.unidade,
          quantidade: 0,
          local: entrada.local,
        });
      }

      const atual = mapa.get(chave);
      atual.quantidade += Number(entrada.quantidade || 0);
      mapa.set(chave, atual);
    });

    saidas.forEach((saida) => {
      const chave = `${saida.item}-${saida.categoria}-${saida.unidade}`;

      if (mapa.has(chave)) {
        const atual = mapa.get(chave);
        atual.quantidade -= Number(saida.quantidade || 0);
        mapa.set(chave, atual);
      }
    });

    return Array.from(mapa.values()).filter((item) => item.quantidade > 0);
  }, [entradas, saidas]);

  const itemAtual = estoque.find((item) => {
    const chave = `${item.item}-${item.categoria}-${item.unidade}`;
    return chave === itemSelecionado;
  });

  function adicionarObservacao(texto: string) {
    setObservacao((atual) => (atual ? `${atual}\n${texto}` : texto));
  }

  async function registrarSaida() {
    if (!usuario?.municipio_id) {
  return alert("Município não identificado.");
}

if (!usuario?.id) {
  return alert("Sessão inválida.");
}

if (destino.length > 200) {
  return alert("Destino muito grande.");
}

if (observacao.length > 1000) {
  return alert("Observação muito grande.");
}
    if (!itemAtual) return alert("Selecione o material.");
    if (!quantidade || Number(quantidade) <= 0) return alert("Informe a quantidade.");

    if (Number(quantidade) > Number(itemAtual.quantidade)) {
      return alert("Quantidade maior que o estoque disponível.");
    }

    setSalvando(true);

    const dadosSaida = {
  municipio_id: usuario.municipio_id,
  criado_por: usuario.id,
  item: itemAtual.item,
  categoria: itemAtual.categoria,
  quantidade: Number(quantidade),
  unidade: itemAtual.unidade,
  destino: destino.trim() || null,
  responsavel: responsavel || null,
  finalidade,
  observacao: observacao.trim() || null,
};

const { data, error } = await supabase
  .from("almoxarifado_saidas")
  .insert([dadosSaida])
  .select("id")
  .single();

    setSalvando(false);

if (error) {
  setSalvando(false);

  await registrarAuditoria({
    modulo: "Almoxarifado",
    acao: "ERRO",
    descricao: "Erro ao registrar saída.",
    tabela: "almoxarifado_saidas",
    detalhes: {
      erro: error.message,
      dados: dadosSaida,
    },
  });

  return alert(error.message);
}

await registrarAuditoria({
  modulo: "Almoxarifado",
  acao: "CRIAR",
  descricao: `Registrou saída de ${quantidade} ${itemAtual.unidade} de ${itemAtual.item}.`,
  tabela: "almoxarifado_saidas",
  registro_id: data?.id,
  detalhes: dadosSaida,
});

setItemSelecionado("");
    setQuantidade("");
    setDestino("");
    setResponsavel("");
    setFinalidade("USO_OPERACIONAL");
    setObservacao("");

    carregar();
    alert("Saída registrada com sucesso.");
  }

  function nomeCategoria(valor: string) {
    const nomes: Record<string, string> = {
      MATERIAL_CONSUMO: "Material de consumo",
      EPI: "EPI",
      UNIFORME: "Uniforme",
      EXPEDIENTE: "Material de expediente",
      LIMPEZA: "Material de limpeza",
      OPERACIONAL: "Material operacional",
      INFORMATICA: "Informática",
      ALIMENTACAO: "Alimentação",
      MANUTENCAO: "Manutenção",
      OUTRO: "Outro",
    };

    return nomes[valor] || valor;
  }

  function nomeFinalidade(valor: string) {
    const nomes: Record<string, string> = {
      USO_OPERACIONAL: "Uso operacional",
      ENTREGA_SERVIDOR: "Entrega ao servidor",
      MANUTENCAO: "Manutenção",
      EVENTO: "Evento",
      RONDA: "Ronda",
      OPERACAO: "Operação",
      REPOSICAO: "Reposição",
      OUTRO: "Outro",
    };

    return nomes[valor] || valor;
  }

  return (
    <div className="p-4 md:p-6 pb-24 space-y-6">
      <div className="painel-premium p-6">
        <h1 className="text-2xl md:text-3xl font-black text-white">
          📤 Saída de Almoxarifado
        </h1>

        <p className="text-slate-400 mt-2">
          Registre entregas de materiais, uniformes, EPIs e suprimentos com preenchimento rápido.
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="painel-premium p-6 lg:col-span-1">
          <h2 className="text-xl font-black text-white">Nova Saída</h2>

          <div className="space-y-4 mt-5">
            <div>
              <label className="label">Material</label>
              <select
                className="input"
                value={itemSelecionado}
                onChange={(e) => setItemSelecionado(e.target.value)}
              >
                <option value="">Selecione o material</option>

                {estoque.map((item) => {
                  const chave = `${item.item}-${item.categoria}-${item.unidade}`;

                  return (
                    <option key={chave} value={chave}>
                      {item.item} • Disponível: {item.quantidade} {item.unidade}
                    </option>
                  );
                })}
              </select>
            </div>

            {itemAtual && (
              <div className="rounded-2xl bg-slate-900/70 border border-slate-800 p-4">
                <p className="text-slate-400 text-sm">Disponível</p>
                <p className="text-2xl font-black text-white">
                  {itemAtual.quantidade} {itemAtual.unidade}
                </p>
              </div>
            )}

            <Campo
              label="Quantidade"
              valor={quantidade}
              setValor={setQuantidade}
              placeholder="Ex: 2"
              type="number"
            />

            <div>
              <label className="label">Quantidades rápidas</label>
              <div className="flex flex-wrap gap-2 mt-2">
                {quantidadesRapidas.map((qtd) => (
                  <button
                    key={qtd}
                    type="button"
                    onClick={() => setQuantidade(qtd)}
                    className="rounded-xl bg-slate-900 border border-slate-700 px-3 py-2 text-xs text-slate-200 hover:border-yellow-500"
                  >
                    {qtd}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="label">Finalidade</label>
              <select
                className="input"
                value={finalidade}
                onChange={(e) => setFinalidade(e.target.value)}
              >
                <option value="USO_OPERACIONAL">Uso operacional</option>
                <option value="ENTREGA_SERVIDOR">Entrega ao servidor</option>
                <option value="MANUTENCAO">Manutenção</option>
                <option value="EVENTO">Evento</option>
                <option value="RONDA">Ronda</option>
                <option value="OPERACAO">Operação</option>
                <option value="REPOSICAO">Reposição</option>
                <option value="OUTRO">Outro</option>
              </select>
            </div>

            <div>
              <label className="label">Responsável / Servidor</label>
              <select
                className="input"
                value={responsavel}
                onChange={(e) => setResponsavel(e.target.value)}
              >
                <option value="">Sem responsável definido</option>

                {guardas.map((g) => (
                  <option key={g.id} value={g.nome}>
                    {g.nome} • {g.matricula}
                  </option>
                ))}
              </select>
            </div>

            <Campo
              label="Destino"
              valor={destino}
              setValor={setDestino}
              placeholder="Ex: Guarnição, base, setor..."
            />

            <div>
              <label className="label">Destinos rápidos</label>
              <div className="flex flex-wrap gap-2 mt-2">
                {destinosRapidos.map((nome) => (
                  <button
                    key={nome}
                    type="button"
                    onClick={() => setDestino(nome)}
                    className="rounded-xl bg-slate-900 border border-slate-700 px-3 py-2 text-xs text-slate-200 hover:border-yellow-500"
                  >
                    {nome}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="label">Observação</label>
              <textarea
                className="input min-h-[120px]"
                value={observacao}
                onChange={(e) => setObservacao(e.target.value)}
                placeholder="Detalhes da entrega..."
              />
            </div>

            <div>
              <label className="label">Observações rápidas</label>
              <div className="flex flex-wrap gap-2 mt-2">
                {observacoesRapidas.map((texto) => (
                  <button
                    key={texto}
                    type="button"
                    onClick={() => adicionarObservacao(texto)}
                    className="rounded-xl bg-slate-900 border border-slate-700 px-3 py-2 text-xs text-slate-200 hover:border-yellow-500"
                  >
                    {texto}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={registrarSaida}
              disabled={salvando}
              className="sig-btn-gold w-full disabled:opacity-50"
            >
              {salvando ? "Registrando..." : "Registrar Saída"}
            </button>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-4">
          <div className="painel-premium p-6">
            <h2 className="text-xl font-black text-white">
              Histórico de Saídas
            </h2>

            <p className="text-slate-400 text-sm">
              Últimas entregas registradas no almoxarifado.
            </p>
          </div>

          {carregando ? (
  <div className="painel-premium p-10 text-center">
    <p className="text-slate-400">
      Carregando saídas...
    </p>
  </div>
) : saidas.length === 0 ? (
            <div className="painel-premium p-10 text-center">
              <p className="text-6xl mb-3">📤</p>

              <h2 className="text-white text-xl font-black">
                Nenhuma saída registrada
              </h2>

              <p className="text-slate-400 text-sm mt-2">
                As saídas aparecerão aqui após o primeiro registro.
              </p>
            </div>
          ) : (
            <div className="grid xl:grid-cols-2 gap-4">
              {saidas.map((saida) => (
                <div
                  key={saida.id}
                  className="rounded-3xl border border-slate-800 bg-slate-950/70 p-5 shadow-xl"
                >
                  <div className="flex justify-between gap-3">
                    <div>
                      <p className="text-slate-400 text-sm">
                        {nomeCategoria(saida.categoria)}
                      </p>

                      <h3 className="text-xl font-black text-white">
                        📤 {saida.item}
                      </h3>

                      <p className="text-slate-500 text-sm">
                        Responsável: {saida.responsavel || "N/I"}
                      </p>
                    </div>

                    <span className="h-fit rounded-full bg-red-950 text-red-300 border border-red-800 px-3 py-1 text-xs font-bold">
                      SAÍDA
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mt-4">
                    <Info
                      titulo="Quantidade"
                      valor={`${saida.quantidade || 0} ${saida.unidade || ""}`}
                    />

                    <Info
                      titulo="Finalidade"
                      valor={nomeFinalidade(saida.finalidade)}
                    />

                    <Info titulo="Destino" valor={saida.destino || "N/I"} />

                    <Info
                      titulo="Data"
                      valor={
                        saida.criado_em
                          ? new Date(saida.criado_em).toLocaleDateString("pt-BR")
                          : "N/I"
                      }
                    />
                  </div>

                  {saida.observacao && (
                    <p className="text-slate-300 text-sm mt-4 whitespace-pre-wrap">
                      {saida.observacao}
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

function Campo({
  label,
  valor,
  setValor,
  placeholder,
  type = "text",
}: {
  label: string;
  valor: string;
  setValor: (valor: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <div>
      <label className="label">{label}</label>

      <input
        type={type}
        className="input"
        value={valor}
        onChange={(e) => setValor(e.target.value)}
        placeholder={placeholder}
      />
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