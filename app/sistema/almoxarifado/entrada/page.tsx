"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { registrarAuditoria } from "@/lib/auditoria";

const itensRapidos = [
  "Papel A4",
  "Caneta azul",
  "Caneta preta",
  "Pasta suspensa",
  "Pasta catálogo",
  "Envelope",
  "Grampeador",
  "Grampo",
  "Clips",
  "Toner",
  "Cartucho",
  "Uniforme",
  "Camisa operacional",
  "Calça operacional",
  "Coturno",
  "Boné",
  "Cinto",
  "Luva",
  "Máscara",
  "Álcool 70%",
  "Colete refletivo",
  "Cone",
  "Fita zebrada",
  "Lanterna",
  "Pilha",
  "Bateria",
  "Material de limpeza",
  "Detergente",
  "Desinfetante",
  "Saco de lixo",
  "Água mineral",
];

const fornecedoresRapidos = [
  "Prefeitura Municipal",
  "Secretaria de Administração",
  "Secretaria de Segurança",
  "Doação",
  "Compra direta",
  "Licitação",
  "Almoxarifado Central",
];

const locaisRapidos = [
  "ALMOXARIFADO",
  "BASE GCM",
  "SALA DO COMANDO",
  "SETOR ADMINISTRATIVO",
  "DEPÓSITO",
  "GARAGEM",
  "GUARNIÇÃO",
];

const observacoesRapidas = [
  "Material recebido em bom estado.",
  "Entrada realizada para reposição de estoque.",
  "Material destinado ao uso operacional.",
  "Material destinado ao setor administrativo.",
  "Recebido conforme documento informado.",
  "Necessário conferência posterior.",
  "Material recebido parcialmente.",
  "Aguardando distribuição.",
];

export default function EntradaAlmoxarifadoPage() {
  const [usuario, setUsuario] = useState<any>(null);
  const [entradas, setEntradas] = useState<any[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);

  const [item, setItem] = useState("");
  const [categoria, setCategoria] = useState("MATERIAL_CONSUMO");
  const [quantidade, setQuantidade] = useState("");
  const [unidade, setUnidade] = useState("UN");
  const [fornecedor, setFornecedor] = useState("");
  const [documento, setDocumento] = useState("");
  const [local, setLocal] = useState("ALMOXARIFADO");
  const [observacao, setObservacao] = useState("");

  useEffect(() => {
    const dados = JSON.parse(
      localStorage.getItem("usuarioLogado") || "{}"
    );

    if (!dados?.id || !dados?.municipio_id) {
      alert("Sessão inválida. Faça login novamente.");
      setCarregando(false);
      return;
    }

    setUsuario(dados);
    registrarAcesso(dados);
    carregar(dados);
  }, []);

  async function registrarAcesso(usuarioAtual: any) {
    await registrarAuditoria({
      modulo: "Almoxarifado",
      acao: "ACESSO",
      descricao: "Acessou a tela de entrada do almoxarifado.",
      tabela: "almoxarifado_entradas",
      detalhes: {
        municipio_id: usuarioAtual.municipio_id,
        usuario_id: usuarioAtual.id,
      },
    });
  }

  async function carregar(usuarioAtual = usuario) {
    if (!usuarioAtual?.municipio_id) {
      setCarregando(false);
      return;
    }

    setCarregando(true);

    const { data, error } = await supabase
      .from("almoxarifado_entradas")
      .select(`
        id,
        item,
        categoria,
        quantidade,
        unidade,
        fornecedor,
        documento,
        local,
        observacao,
        criado_em
      `)
      .eq("municipio_id", usuarioAtual.municipio_id)
      .order("criado_em", { ascending: false })
      .limit(100);

    setCarregando(false);

    if (error) {
      await registrarAuditoria({
        modulo: "Almoxarifado",
        acao: "ERRO",
        descricao: "Erro ao carregar entradas do almoxarifado.",
        tabela: "almoxarifado_entradas",
        detalhes: {
          erro: error.message,
          municipio_id: usuarioAtual.municipio_id,
        },
      });

      alert("Erro ao carregar entradas do almoxarifado.");
      return;
    }

    setEntradas(data || []);
  }

  async function registrarEntrada() {
    if (!usuario?.id || !usuario?.municipio_id) {
      alert("Sessão inválida. Faça login novamente.");
      return;
    }

    if (!item.trim()) {
      alert("Informe o item.");
      return;
    }

    if (item.trim().length < 2) {
      alert("Informe um item válido.");
      return;
    }

    if (!quantidade || Number(quantidade) <= 0) {
      alert("Informe a quantidade.");
      return;
    }

    if (Number(quantidade) > 100000) {
      alert("Quantidade muito alta.");
      return;
    }

    if (fornecedor.length > 200) {
      alert("Fornecedor muito grande.");
      return;
    }

    if (documento.length > 100) {
      alert("Documento muito grande.");
      return;
    }

    if (local.length > 100) {
      alert("Local muito grande.");
      return;
    }

    if (observacao.length > 1000) {
      alert("Observação muito grande.");
      return;
    }

    setSalvando(true);

    const dadosEntrada = {
      municipio_id: usuario.municipio_id,
      criado_por: usuario.id,
      item: item.trim(),
      categoria,
      quantidade: Number(quantidade),
      unidade,
      fornecedor: fornecedor.trim() || null,
      documento: documento.trim() || null,
      local: local.trim() || null,
      observacao: observacao.trim() || null,
    };

    const { data, error } = await supabase
      .from("almoxarifado_entradas")
      .insert([dadosEntrada])
      .select("id")
      .single();

    setSalvando(false);

    if (error) {
      await registrarAuditoria({
        modulo: "Almoxarifado",
        acao: "ERRO",
        descricao: "Erro ao registrar entrada no almoxarifado.",
        tabela: "almoxarifado_entradas",
        detalhes: {
          erro: error.message,
          dados: dadosEntrada,
        },
      });

      alert("Erro ao registrar entrada.");
      return;
    }

    await registrarAuditoria({
      modulo: "Almoxarifado",
      acao: "CRIAR",
      descricao: `Registrou entrada de ${quantidade} ${unidade} de ${item}.`,
      tabela: "almoxarifado_entradas",
      registro_id: data?.id,
      detalhes: dadosEntrada,
    });

    setItem("");
    setCategoria("MATERIAL_CONSUMO");
    setQuantidade("");
    setUnidade("UN");
    setFornecedor("");
    setDocumento("");
    setLocal("ALMOXARIFADO");
    setObservacao("");

    await carregar(usuario);

    alert("Entrada registrada com sucesso.");
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

  function adicionarObservacao(texto: string) {
    setObservacao((atual) => (atual ? `${atual}\n${texto}` : texto));
  }

  return (
    <div className="p-4 md:p-6 pb-24 space-y-6">
      <div className="painel-premium p-6">
        <h1 className="text-2xl md:text-3xl font-black text-white">
          📥 Entrada de Almoxarifado
        </h1>

        <p className="text-slate-400 mt-2">
          Registre materiais recebidos com preenchimento rápido e controle por categoria.
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="painel-premium p-6 lg:col-span-1">
          <h2 className="text-xl font-black text-white">Nova Entrada</h2>

          <div className="space-y-4 mt-5">
            <Campo
              label="Item / Material"
              valor={item}
              setValor={setItem}
              placeholder="Ex: Papel A4, Toner, Uniforme..."
            />

            <div>
              <label className="label">Itens rápidos</label>
              <div className="flex flex-wrap gap-2 mt-2">
                {itensRapidos.map((nome) => (
                  <button
                    key={nome}
                    type="button"
                    onClick={() => setItem(nome)}
                    className="rounded-xl bg-slate-900 border border-slate-700 px-3 py-2 text-xs text-slate-200 hover:border-yellow-500"
                  >
                    {nome}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="label">Categoria</label>
              <select
                className="input"
                value={categoria}
                onChange={(e) => setCategoria(e.target.value)}
              >
                <option value="MATERIAL_CONSUMO">Material de consumo</option>
                <option value="EPI">EPI</option>
                <option value="UNIFORME">Uniforme</option>
                <option value="EXPEDIENTE">Material de expediente</option>
                <option value="LIMPEZA">Material de limpeza</option>
                <option value="OPERACIONAL">Material operacional</option>
                <option value="INFORMATICA">Informática</option>
                <option value="ALIMENTACAO">Alimentação</option>
                <option value="MANUTENCAO">Manutenção</option>
                <option value="OUTRO">Outro</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Campo
                label="Quantidade"
                valor={quantidade}
                setValor={setQuantidade}
                placeholder="Ex: 10"
                type="number"
              />

              <div>
                <label className="label">Unidade</label>
                <select
                  className="input"
                  value={unidade}
                  onChange={(e) => setUnidade(e.target.value)}
                >
                  <option value="UN">Unidade</option>
                  <option value="CX">Caixa</option>
                  <option value="PCT">Pacote</option>
                  <option value="PAR">Par</option>
                  <option value="L">Litro</option>
                  <option value="ML">ML</option>
                  <option value="KG">Kg</option>
                  <option value="G">Grama</option>
                  <option value="ROLO">Rolo</option>
                  <option value="FARDO">Fardo</option>
                  <option value="KIT">Kit</option>
                </select>
              </div>
            </div>

            <Campo
              label="Fornecedor / Origem"
              valor={fornecedor}
              setValor={setFornecedor}
              placeholder="Ex: Prefeitura, fornecedor, doação..."
            />

            <div>
              <label className="label">Fornecedores rápidos</label>
              <div className="flex flex-wrap gap-2 mt-2">
                {fornecedoresRapidos.map((nome) => (
                  <button
                    key={nome}
                    type="button"
                    onClick={() => setFornecedor(nome)}
                    className="rounded-xl bg-slate-900 border border-slate-700 px-3 py-2 text-xs text-slate-200 hover:border-yellow-500"
                  >
                    {nome}
                  </button>
                ))}
              </div>
            </div>

            <Campo
              label="Documento"
              valor={documento}
              setValor={setDocumento}
              placeholder="Ex: NF 001, termo de entrega..."
            />

            <Campo
              label="Local"
              valor={local}
              setValor={setLocal}
              placeholder="Ex: Almoxarifado"
            />

            <div>
              <label className="label">Locais rápidos</label>
              <div className="flex flex-wrap gap-2 mt-2">
                {locaisRapidos.map((nome) => (
                  <button
                    key={nome}
                    type="button"
                    onClick={() => setLocal(nome)}
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
                placeholder="Detalhes sobre a entrada..."
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
              onClick={registrarEntrada}
              disabled={salvando}
              className="sig-btn-gold w-full disabled:opacity-50"
            >
              {salvando ? "Registrando..." : "Registrar Entrada"}
            </button>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-4">
          <div className="painel-premium p-6">
            <h2 className="text-xl font-black text-white">
              Histórico de Entradas
            </h2>

            <p className="text-slate-400 text-sm">
              Últimos 100 materiais recebidos no almoxarifado.
            </p>
          </div>

          {carregando ? (
            <div className="painel-premium p-10 text-center">
              <p className="text-slate-400">Carregando entradas...</p>
            </div>
          ) : entradas.length === 0 ? (
            <div className="painel-premium p-10 text-center">
              <p className="text-6xl mb-3">📥</p>
              <h2 className="text-white text-xl font-black">
                Nenhuma entrada registrada
              </h2>
              <p className="text-slate-400 text-sm mt-2">
                As entradas aparecerão aqui após o primeiro registro.
              </p>
            </div>
          ) : (
            <div className="grid xl:grid-cols-2 gap-4">
              {entradas.map((entrada) => (
                <div
                  key={entrada.id}
                  className="rounded-3xl border border-slate-800 bg-slate-950/70 p-5 shadow-xl"
                >
                  <div className="flex justify-between gap-3">
                    <div>
                      <p className="text-slate-400 text-sm">
                        {nomeCategoria(entrada.categoria)}
                      </p>

                      <h3 className="text-xl font-black text-white">
                        📥 {entrada.item}
                      </h3>

                      <p className="text-slate-500 text-sm">
                        Documento: {entrada.documento || "N/I"}
                      </p>
                    </div>

                    <span className="h-fit rounded-full bg-green-950 text-green-300 border border-green-800 px-3 py-1 text-xs font-bold">
                      ENTRADA
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mt-4">
                    <Info
                      titulo="Quantidade"
                      valor={`${entrada.quantidade || 0} ${entrada.unidade || ""}`}
                    />
                    <Info titulo="Fornecedor" valor={entrada.fornecedor || "N/I"} />
                    <Info titulo="Local" valor={entrada.local || "N/I"} />
                    <Info
                      titulo="Data"
                      valor={
                        entrada.criado_em
                          ? new Date(entrada.criado_em).toLocaleDateString("pt-BR")
                          : "N/I"
                      }
                    />
                  </div>

                  {entrada.observacao && (
                    <p className="text-slate-300 text-sm mt-4 whitespace-pre-wrap">
                      {entrada.observacao}
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