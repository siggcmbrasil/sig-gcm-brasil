"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { registrarAuditoria } from "@/lib/auditoria";

type UsuarioLogado = {
  id: string;
  perfil: string;
  municipio_id: number;
};

type PatrimonioItem = {
  id: number;
  nome: string;
  numero_patrimonio: string | null;
  categoria: string | null;
  status: string;
};

type BaixaPatrimonio = {
  id: number;
  patrimonio_id: number;
  motivo: string;
  destino: string | null;
  observacao: string | null;
  criado_em: string;
  patrimonios: {
    nome: string;
    numero_patrimonio: string | null;
    categoria: string | null;
  } | null;
};

function obterUsuarioLogado(): UsuarioLogado | null {
  try {
    const salvo = localStorage.getItem("usuarioLogado");

    if (!salvo) return null;

    const usuario = JSON.parse(salvo);

    if (!usuario?.id || !usuario?.perfil || !usuario?.municipio_id) {
      return null;
    }

    return {
      id: String(usuario.id),
      perfil: usuario.perfil,
      municipio_id: Number(usuario.municipio_id),
    };
  } catch {
    return null;
  }
}

export default function BaixasPatrimonioPage() {
  const [itens, setItens] = useState<PatrimonioItem[]>([]);
  const [baixas, setBaixas] = useState<BaixaPatrimonio[]>([]);
  const [salvando, setSalvando] = useState(false);
  const [carregando, setCarregando] = useState(true);

  const [itemId, setItemId] = useState("");
  const [motivo, setMotivo] = useState("DANIFICADO");
  const [destino, setDestino] = useState("");
  const [observacao, setObservacao] = useState("");

  async function carregar() {
    const usuario = obterUsuarioLogado();

    if (!usuario) {
      setItens([]);
      setBaixas([]);
      setCarregando(false);
      return;
    }

    setCarregando(true);

    const { data: listaItens, error: erroItens } = await supabase
      .from("patrimonios")
      .select("id, nome, numero_patrimonio, categoria, status")
      .eq("municipio_id", usuario.municipio_id)
      .neq("status", "BAIXADO")
      .order("nome")
      .limit(200);

    const { data: listaBaixas, error: erroBaixas } = await supabase
      .from("baixas_patrimonio")
      .select(
        "id, patrimonio_id, motivo, destino, observacao, criado_em, patrimonios(nome, numero_patrimonio, categoria)"
      )
      .eq("municipio_id", usuario.municipio_id)
      .order("criado_em", { ascending: false })
      .limit(100);

    if (erroItens || erroBaixas) {
      console.error(erroItens || erroBaixas);

      await registrarAuditoria({
        modulo: "Baixas Patrimoniais",
        acao: "ERRO",
        descricao: "Erro ao carregar baixas patrimoniais.",
        tabela: "baixas_patrimonio",
        detalhes: {
          erro: erroItens?.message || erroBaixas?.message,
          municipio_id: usuario.municipio_id,
        },
      });

      alert("Erro ao carregar dados de baixas patrimoniais.");
      setCarregando(false);
      return;
    }

    setItens(listaItens || []);
    const baixasTratadas: BaixaPatrimonio[] = (listaBaixas || []).map((baixa) => ({
  ...baixa,
  patrimonios: Array.isArray(baixa.patrimonios)
    ? baixa.patrimonios[0] || null
    : baixa.patrimonios,
}));

setBaixas(baixasTratadas);
    setCarregando(false);
  }

  useEffect(() => {
    const usuario = obterUsuarioLogado();

    if (!usuario) {
      setCarregando(false);
      return;
    }

    void registrarAuditoria({
      modulo: "Baixas Patrimoniais",
      acao: "ACESSO",
      descricao: "Acessou o módulo de baixas patrimoniais.",
      tabela: "baixas_patrimonio",
      detalhes: {
        municipio_id: usuario.municipio_id,
        usuario_id: usuario.id,
        perfil: usuario.perfil,
      },
    });

    void carregar();
  }, []);

  async function registrarBaixa() {
    const usuario = obterUsuarioLogado();

    if (!usuario) {
      alert("Sessão inválida.");
      return;
    }

    if (
      ![
        "DESENVOLVEDOR",
        "ADMIN",
        "COMANDANTE",
        "DIRETOR",
      ].includes(usuario.perfil)
    ) {
      alert("Você não possui permissão para registrar baixa patrimonial.");
      return;
    }

    const item = itens.find((i) => String(i.id) === itemId);

    if (!item) {
      alert("Selecione o item patrimonial.");
      return;
    }

    if (!motivo.trim()) {
      alert("Informe o motivo da baixa.");
      return;
    }

    if (observacao.trim().length < 5) {
      alert("Informe uma observação com pelo menos 5 caracteres.");
      return;
    }

    const confirmar = confirm(
      "Confirma a baixa deste patrimônio? Esta ação será auditada."
    );

    if (!confirmar) return;

    setSalvando(true);

    const { data: baixaCriada, error: erroBaixa } = await supabase
      .from("baixas_patrimonio")
      .insert([
        {
          municipio_id: usuario.municipio_id,
          criado_por: usuario.id,
          criado_em: new Date().toISOString(),
          patrimonio_id: item.id,
          motivo,
          destino: destino.trim() || null,
          observacao: observacao.trim(),
        },
      ])
      .select("id")
      .single();

    if (erroBaixa) {
      setSalvando(false);
      console.error(erroBaixa);

      await registrarAuditoria({
        modulo: "Baixas Patrimoniais",
        acao: "ERRO",
        descricao: "Erro ao registrar baixa patrimonial.",
        tabela: "baixas_patrimonio",
        detalhes: {
          erro: erroBaixa.message,
          patrimonio_id: item.id,
          municipio_id: usuario.municipio_id,
        },
      });

      alert("Erro ao registrar baixa patrimonial.");
      return;
    }

    const { error: erroUpdate } = await supabase
      .from("patrimonios")
      .update({
        status: "BAIXADO",
        atualizado_em: new Date().toISOString(),
      })
      .eq("id", item.id)
      .eq("municipio_id", usuario.municipio_id);

    setSalvando(false);

    if (erroUpdate) {
      console.error(erroUpdate);

      await registrarAuditoria({
        modulo: "Baixas Patrimoniais",
        acao: "ERRO",
        descricao: "Baixa criada, mas erro ao atualizar status do patrimônio.",
        tabela: "patrimonios",
        registro_id: item.id,
        detalhes: {
          erro: erroUpdate.message,
          baixa_id: baixaCriada?.id,
          patrimonio_id: item.id,
          municipio_id: usuario.municipio_id,
        },
      });

      alert("Baixa criada, mas erro ao atualizar status do patrimônio.");
      return;
    }

    await registrarAuditoria({
      modulo: "Baixas Patrimoniais",
      acao: "CRIAR",
      descricao: `Registrou baixa patrimonial do item ${item.nome}.`,
      tabela: "baixas_patrimonio",
      registro_id: baixaCriada?.id,
      detalhes: {
        patrimonio_id: item.id,
        nome: item.nome,
        numero_patrimonio: item.numero_patrimonio || null,
        motivo,
        destino: destino.trim() || null,
        municipio_id: usuario.municipio_id,
      },
    });

    setItemId("");
    setMotivo("DANIFICADO");
    setDestino("");
    setObservacao("");

    await carregar();
    alert("Baixa registrada com sucesso.");
  }

  function nomeMotivo(valor: string) {
    const nomes: Record<string, string> = {
      DANIFICADO: "Danificado",
      INSERVIVEL: "Inservível",
      EXTRAVIADO: "Extraviado",
      DOADO: "Doado",
      VENDIDO: "Vendido",
      DESCARTE: "Descarte",
      OUTRO: "Outro",
    };

    return nomes[valor] || valor;
  }

  return (
    <div className="p-4 md:p-6 pb-24 space-y-6">
      <div className="painel-premium p-6">
        <h1 className="text-2xl md:text-3xl font-black text-white">
          📦 Baixas Patrimoniais
        </h1>

        <p className="text-slate-400 mt-2">
          Registre a baixa de bens danificados, extraviados, inservíveis ou
          descartados.
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="painel-premium p-6 lg:col-span-1">
          <h2 className="text-xl font-black text-white">Nova Baixa</h2>

          <p className="text-slate-400 text-sm mb-5">
            Selecione o item e informe o motivo da baixa.
          </p>

          <div className="space-y-4">
            <div>
              <label className="label">Item patrimonial</label>
              <select
                className="input"
                value={itemId}
                onChange={(e) => setItemId(e.target.value)}
              >
                <option value="">Selecione o item</option>

                {itens.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.nome} • {item.numero_patrimonio || "Sem patrimônio"}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="label">Motivo</label>
              <select
                className="input"
                value={motivo}
                onChange={(e) => setMotivo(e.target.value)}
              >
                <option value="DANIFICADO">Danificado</option>
                <option value="INSERVIVEL">Inservível</option>
                <option value="EXTRAVIADO">Extraviado</option>
                <option value="DOADO">Doado</option>
                <option value="VENDIDO">Vendido</option>
                <option value="DESCARTE">Descarte</option>
                <option value="OUTRO">Outro</option>
              </select>
            </div>

            <div>
              <label className="label">Destino</label>
              <input
                className="input"
                value={destino}
                onChange={(e) => setDestino(e.target.value)}
                placeholder="Ex: descarte, doação, almoxarifado..."
              />
            </div>

            <div>
              <label className="label">Observação</label>
              <textarea
                className="input min-h-[120px]"
                value={observacao}
                onChange={(e) => setObservacao(e.target.value)}
                placeholder="Descreva o motivo e detalhes da baixa..."
              />
            </div>

            <button
              type="button"
              onClick={registrarBaixa}
              disabled={salvando}
              className="sig-btn-gold w-full disabled:opacity-50"
            >
              {salvando ? "Registrando..." : "Registrar Baixa"}
            </button>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-4">
          <div className="painel-premium p-6">
            <h2 className="text-xl font-black text-white">
              Histórico de Baixas
            </h2>

            <p className="text-slate-400 text-sm">
              Bens baixados no controle patrimonial.
            </p>
          </div>

          {carregando ? (
            <div className="painel-premium p-10 text-center text-slate-400">
              Carregando baixas patrimoniais...
            </div>
          ) : baixas.length === 0 ? (
            <div className="painel-premium p-10 text-center">
              <p className="text-6xl mb-3">📦</p>

              <h2 className="text-white text-xl font-black">
                Nenhuma baixa registrada
              </h2>

              <p className="text-slate-400 text-sm mt-2">
                As baixas aparecerão aqui após o primeiro registro.
              </p>
            </div>
          ) : (
            <div className="grid xl:grid-cols-2 gap-4">
              {baixas.map((item) => (
                <div
                  key={item.id}
                  className="rounded-3xl border border-slate-800 bg-slate-950/70 p-5 shadow-xl"
                >
                  <div className="flex justify-between gap-3">
                    <div>
                      <p className="text-slate-400 text-sm">
                        {item.patrimonios?.categoria || "Categoria"}
                      </p>

                      <h3 className="text-xl font-black text-white">
                        {item.patrimonios?.nome || "Item patrimonial"}
                      </h3>

                      <p className="text-slate-500 text-sm">
                        Patrimônio:{" "}
                        {item.patrimonios?.numero_patrimonio || "N/I"}
                      </p>
                    </div>

                    <span className="h-fit rounded-full bg-red-950 text-red-300 border border-red-800 px-3 py-1 text-xs font-bold">
                      BAIXADO
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mt-4">
                    <Info titulo="Motivo" valor={nomeMotivo(item.motivo)} />
                    <Info titulo="Destino" valor={item.destino || "N/I"} />
                    <Info
                      titulo="Data"
                      valor={
                        item.criado_em
                          ? new Date(item.criado_em).toLocaleDateString(
                              "pt-BR"
                            )
                          : "N/I"
                      }
                    />
                    <Info titulo="Status" valor="Baixado" />
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

function Info({ titulo, valor }: { titulo: string; valor: string }) {
  return (
    <div className="rounded-xl bg-slate-900/70 p-3">
      <p className="text-slate-500 text-xs">{titulo}</p>
      <p className="text-slate-200 font-bold text-sm">{valor}</p>
    </div>
  );
}