"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { registrarAuditoria } from "@/lib/auditoria";

type UsuarioLogado = {
  id: string;
  perfil: string;
  municipio_id: number;
};

type HistoricoPneu = {
  id: number;
  tipo: string;
  posicao_anterior: string | null;
  posicao_nova: string | null;
  km: string | null;
  observacao: string | null;
  criado_em: string;
  pneus_viaturas:
    | {
        codigo: string;
        marca: string | null;
        modelo: string | null;
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

export default function HistoricoPneusPage() {
  const [historico, setHistorico] = useState<HistoricoPneu[]>([]);
  const [carregando, setCarregando] = useState(true);

  async function carregar() {
    const usuario = obterUsuarioLogado();

    if (!usuario) {
      setCarregando(false);
      return;
    }

    setCarregando(true);

    const { data, error } = await supabase
      .from("historico_pneus")
      .select(`
        id,
        tipo,
        posicao_anterior,
        posicao_nova,
        km,
        observacao,
        criado_em,
        pneus_viaturas(codigo, marca, modelo),
        viaturas(prefixo, placa)
      `)
      .eq("municipio_id", usuario.municipio_id)
      .order("criado_em", { ascending: false })
      .limit(100);

    if (error) {
      console.error(error);

      await registrarAuditoria({
        modulo: "Histórico de Pneus",
        acao: "ERRO",
        descricao: "Erro ao carregar histórico de pneus.",
        tabela: "historico_pneus",
        detalhes: {
          erro: error.message,
          municipio_id: usuario.municipio_id,
          usuario_id: usuario.id,
        },
      });

      alert("Erro ao carregar histórico de pneus.");
      setCarregando(false);
      return;
    }

    await registrarAuditoria({
      modulo: "Histórico de Pneus",
      acao: "ACESSO",
      descricao: "Acessou o histórico de pneus.",
      tabela: "historico_pneus",
      detalhes: {
        municipio_id: usuario.municipio_id,
        usuario_id: usuario.id,
        total_registros: data?.length || 0,
      },
    });

    const historicoTratado: HistoricoPneu[] = (data || []).map((item: any) => ({
  ...item,
  pneus_viaturas: Array.isArray(item.pneus_viaturas)
    ? item.pneus_viaturas[0] || null
    : item.pneus_viaturas,
  viaturas: Array.isArray(item.viaturas)
    ? item.viaturas[0] || null
    : item.viaturas,
}));

setHistorico(historicoTratado);
    setCarregando(false);
  }

  useEffect(() => {
    void carregar();
  }, []);

  return (
    <div className="p-4 md:p-6 pb-24 space-y-6">
      <div className="painel-premium p-6">
        <h1 className="text-2xl md:text-3xl font-black">
          📋 Histórico de Pneus
        </h1>

        <p className="text-slate-400 mt-2">
          Todas as movimentações realizadas nos pneus da frota.
        </p>
      </div>

      {carregando ? (
        <div className="painel-premium p-6 text-slate-400">
          Carregando histórico...
        </div>
      ) : historico.length === 0 ? (
        <div className="painel-premium p-10 text-center">
          <p className="text-6xl mb-3">🛞</p>

          <h2 className="text-xl font-black">
            Nenhuma movimentação encontrada
          </h2>

          <p className="text-slate-400 mt-2">
            O histórico de pneus aparecerá aqui.
          </p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
          {historico.map((item) => (
            <div
              key={item.id}
              className="rounded-3xl border border-slate-800 bg-slate-950/70 p-5"
            >
              <div className="flex justify-between gap-3">
                <div>
                  <p className="text-slate-400 text-sm">
                    {item.viaturas?.prefixo || "Sem viatura"}
                  </p>

                  <h2 className="text-xl font-black">
                    🛞 {item.pneus_viaturas?.codigo || "Pneu não informado"}
                  </h2>

                  <p className="text-slate-500 text-sm">
                    {item.pneus_viaturas?.marca || "Marca N/I"}{" "}
                    {item.pneus_viaturas?.modelo || ""}
                  </p>
                </div>

                <span className="h-fit bg-blue-900 text-blue-300 px-3 py-1 rounded-full text-xs font-bold">
                  {item.tipo}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 mt-4">
                <Info titulo="De" valor={item.posicao_anterior || "-"} />
                <Info titulo="Para" valor={item.posicao_nova || "-"} />
                <Info titulo="KM" valor={item.km || "-"} />
                <Info titulo="Placa" valor={item.viaturas?.placa || "-"} />
              </div>

              {item.observacao && (
                <p className="text-slate-300 text-sm mt-4 whitespace-pre-wrap">
                  {item.observacao}
                </p>
              )}

              <p className="text-xs text-slate-500 mt-4">
                {new Date(item.criado_em).toLocaleString("pt-BR")}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Info({ titulo, valor }: { titulo: string; valor: string }) {
  return (
    <div className="rounded-xl bg-slate-900 p-3">
      <p className="text-slate-500 text-xs">{titulo}</p>
      <p className="font-bold text-sm">{valor}</p>
    </div>
  );
}