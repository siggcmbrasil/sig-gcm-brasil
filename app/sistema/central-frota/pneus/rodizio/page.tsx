"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { registrarAuditoria } from "@/lib/auditoria";

type UsuarioLogado = {
  id: string;
  perfil: string;
  municipio_id: number;
};

type Pneu = {
  id: number;
  codigo: string;
  posicao: string;
  viatura_id: number | null;
  viaturas:
    | {
        prefixo: string | null;
        placa: string | null;
      }
    | null;
};

type Historico = {
  id: number;
  posicao_anterior: string | null;
  posicao_nova: string | null;
  km: string | null;
  observacao: string | null;
  criado_em: string;
  pneus_viaturas:
    | {
        codigo: string;
      }
    | null;
  viaturas:
    | {
        prefixo: string | null;
        placa: string | null;
      }
    | null;
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

export default function RodizioPneusPage() {
  const [pneus, setPneus] = useState<Pneu[]>([]);
  const [historico, setHistorico] = useState<Historico[]>([]);
  const [salvando, setSalvando] = useState(false);
  const [carregando, setCarregando] = useState(true);

  const [pneuId, setPneuId] = useState("");
  const [novaPosicao, setNovaPosicao] = useState("DIANTEIRO_DIREITO");
  const [km, setKm] = useState("");
  const [observacao, setObservacao] = useState("");

  async function carregar() {
    const usuario = obterUsuarioLogado();

    if (!usuario) {
      setCarregando(false);
      return;
    }

    setCarregando(true);

    const { data: listaPneus, error: erroPneus } = await supabase
      .from("pneus_viaturas")
      .select("id, codigo, posicao, viatura_id, viaturas(prefixo, placa)")
      .eq("municipio_id", usuario.municipio_id)
      .eq("status", "EM_USO")
      .order("codigo")
      .limit(100);

    const { data: listaHistorico, error: erroHistorico } = await supabase
      .from("historico_pneus")
      .select(
        "id, posicao_anterior, posicao_nova, km, observacao, criado_em, pneus_viaturas(codigo), viaturas(prefixo, placa)"
      )
      .eq("municipio_id", usuario.municipio_id)
      .eq("tipo", "RODIZIO")
      .order("criado_em", { ascending: false })
      .limit(50);

    if (erroPneus || erroHistorico) {
      console.error(erroPneus || erroHistorico);

      await registrarAuditoria({
        modulo: "Rodízio de Pneus",
        acao: "ERRO",
        descricao: "Erro ao carregar rodízios de pneus.",
        tabela: "historico_pneus",
        detalhes: {
          erro: erroPneus?.message || erroHistorico?.message,
          municipio_id: usuario.municipio_id,
          usuario_id: usuario.id,
        },
      });

      alert("Erro ao carregar rodízios.");
      setCarregando(false);
      return;
    }

    const pneusTratados: Pneu[] = (listaPneus || []).map((item: any) => ({
      ...item,
      viaturas: Array.isArray(item.viaturas)
        ? item.viaturas[0] || null
        : item.viaturas,
    }));

    const historicoTratado: Historico[] = (listaHistorico || []).map(
      (item: any) => ({
        ...item,
        pneus_viaturas: Array.isArray(item.pneus_viaturas)
          ? item.pneus_viaturas[0] || null
          : item.pneus_viaturas,
        viaturas: Array.isArray(item.viaturas)
          ? item.viaturas[0] || null
          : item.viaturas,
      })
    );

    setPneus(pneusTratados);
    setHistorico(historicoTratado);
    setCarregando(false);
  }

  useEffect(() => {
    void carregar();
  }, []);

  async function registrarRodizio() {
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
        "PLANTONISTA",
      ].includes(usuario.perfil)
    ) {
      alert("Você não possui permissão.");
      return;
    }

    const pneu = pneus.find((p) => String(p.id) === pneuId);

    if (!pneu) {
      alert("Selecione o pneu.");
      return;
    }

    if (pneu.posicao === novaPosicao) {
      alert("A nova posição não pode ser igual à posição atual.");
      return;
    }

    if (!km || Number(km) <= 0) {
      alert("Informe um KM válido.");
      return;
    }

    setSalvando(true);

    const { data: historicoCriado, error: erroHistorico } = await supabase
      .from("historico_pneus")
      .insert([
        {
          municipio_id: usuario.municipio_id,
          pneu_id: pneu.id,
          viatura_id: pneu.viatura_id,
          tipo: "RODIZIO",
          posicao_anterior: pneu.posicao,
          posicao_nova: novaPosicao,
          km,
          observacao: observacao.trim() || null,
          criado_por: usuario.id,
          criado_em: new Date().toISOString(),
        },
      ])
      .select("id")
      .single();

    if (erroHistorico) {
      setSalvando(false);
      alert(erroHistorico.message);
      return;
    }

    const { error: erroUpdate } = await supabase
      .from("pneus_viaturas")
      .update({
        posicao: novaPosicao,
        atualizado_em: new Date().toISOString(),
      })
      .eq("id", pneu.id)
      .eq("municipio_id", usuario.municipio_id);

    setSalvando(false);

    if (erroUpdate) {
      alert(erroUpdate.message);
      return;
    }

    await registrarAuditoria({
      modulo: "Rodízio de Pneus",
      acao: "CRIAR",
      descricao: `Registrou rodízio do pneu ${pneu.codigo}.`,
      tabela: "historico_pneus",
      registro_id: historicoCriado?.id,
      detalhes: {
        pneu_id: pneu.id,
        codigo: pneu.codigo,
        posicao_anterior: pneu.posicao,
        posicao_nova: novaPosicao,
        km,
        municipio_id: usuario.municipio_id,
      },
    });

    setPneuId("");
    setNovaPosicao("DIANTEIRO_DIREITO");
    setKm("");
    setObservacao("");

    await carregar();
    alert("Rodízio registrado com sucesso.");
  }

  function nomePosicao(valor: string | null) {
    const nomes: Record<string, string> = {
      DIANTEIRO_ESQUERDO: "Dianteiro esquerdo",
      DIANTEIRO_DIREITO: "Dianteiro direito",
      TRASEIRO_ESQUERDO: "Traseiro esquerdo",
      TRASEIRO_DIREITO: "Traseiro direito",
      ESTEPE: "Estepe",
      ESTOQUE: "Estoque",
    };

    return nomes[valor || ""] || valor || "-";
  }

  return (
    <div className="p-4 md:p-6 pb-24 space-y-6">
      <div className="painel-premium p-6">
        <h1 className="text-2xl md:text-3xl font-black text-white">
          🔄 Rodízio de Pneus
        </h1>

        <p className="text-slate-400 mt-2">
          Registre a mudança de posição dos pneus das viaturas.
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="painel-premium p-6 lg:col-span-1">
          <h2 className="text-xl font-black text-white">Novo Rodízio</h2>

          <div className="space-y-4 mt-5">
            <div>
              <label className="label">Pneu</label>
              <select
                className="input"
                value={pneuId}
                onChange={(e) => setPneuId(e.target.value)}
              >
                <option value="">Selecione o pneu</option>
                {pneus.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.codigo} - {p.viaturas?.prefixo || "Sem viatura"} -{" "}
                    {nomePosicao(p.posicao)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="label">Nova posição</label>
              <select
                className="input"
                value={novaPosicao}
                onChange={(e) => setNovaPosicao(e.target.value)}
              >
                <option value="DIANTEIRO_ESQUERDO">Dianteiro esquerdo</option>
                <option value="DIANTEIRO_DIREITO">Dianteiro direito</option>
                <option value="TRASEIRO_ESQUERDO">Traseiro esquerdo</option>
                <option value="TRASEIRO_DIREITO">Traseiro direito</option>
                <option value="ESTEPE">Estepe</option>
              </select>
            </div>

            <div>
              <label className="label">KM do rodízio</label>
              <input
                className="input"
                value={km}
                onChange={(e) => setKm(e.target.value.replace(/\D/g, ""))}
                placeholder="Ex: 30200"
              />
            </div>

            <div>
              <label className="label">Observação</label>
              <textarea
                className="input min-h-[120px]"
                value={observacao}
                onChange={(e) => setObservacao(e.target.value)}
                placeholder="Ex: rodízio preventivo realizado."
              />
            </div>

            <button
              type="button"
              onClick={registrarRodizio}
              disabled={salvando}
              className="sig-btn-gold w-full disabled:opacity-50"
            >
              {salvando ? "Registrando..." : "Registrar Rodízio"}
            </button>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-4">
          <div className="painel-premium p-6">
            <h2 className="text-xl font-black text-white">
              Histórico de Rodízios
            </h2>
          </div>

          {carregando ? (
            <div className="painel-premium p-6 text-slate-400">
              Carregando rodízios...
            </div>
          ) : historico.length === 0 ? (
            <div className="painel-premium p-10 text-center">
              <p className="text-6xl mb-3">🔄</p>
              <h2 className="text-white text-xl font-black">
                Nenhum rodízio registrado
              </h2>
            </div>
          ) : (
            <div className="grid xl:grid-cols-2 gap-4">
              {historico.map((item) => (
                <div
                  key={item.id}
                  className="rounded-3xl border border-slate-800 bg-slate-950/70 p-5 shadow-xl"
                >
                  <h3 className="text-xl font-black text-white">
                    🛞 {item.pneus_viaturas?.codigo || "Pneu"}
                  </h3>

                  <div className="grid grid-cols-2 gap-3 mt-4">
                    <Info titulo="De" valor={nomePosicao(item.posicao_anterior)} />
                    <Info titulo="Para" valor={nomePosicao(item.posicao_nova)} />
                    <Info titulo="KM" valor={item.km || "N/I"} />
                    <Info
                      titulo="Data"
                      valor={
                        item.criado_em
                          ? new Date(item.criado_em).toLocaleDateString("pt-BR")
                          : "N/I"
                      }
                    />
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

function Info({ titulo, valor }: { titulo: string; valor: string }) {
  return (
    <div className="rounded-xl bg-slate-900/70 p-3">
      <p className="text-slate-500 text-xs">{titulo}</p>
      <p className="text-slate-200 font-bold text-sm">{valor}</p>
    </div>
  );
}