"use client";

import { useEffect, useMemo, useState } from "react";
import { registrarAuditoria } from "@/lib/auditoria";
import { supabase } from "@/lib/supabase";
import {
  Archive,
  ClipboardList,
  FileText,
  Lock,
  Package,
  Shield,
  Wrench,
} from "lucide-react";

export default function RelatoriosArmamentoPage() {
  const [usuario, setUsuario] = useState<any>(null);
  const [carregando, setCarregando] = useState(true);
  const [bloqueado, setBloqueado] = useState(false);

  const [armamentos, setArmamentos] = useState<any[]>([]);
  const [cautelas, setCautelas] = useState<any[]>([]);
  const [manutencoes, setManutencoes] = useState<any[]>([]);
  const [municoes, setMunicoes] = useState<any[]>([]);
  const [inventarios, setInventarios] = useState<any[]>([]);

  useEffect(() => {
    async function iniciar() {
      const dados = JSON.parse(localStorage.getItem("usuarioLogado") || "{}");

      if (!dados?.id || !dados?.municipio_id) {
        setBloqueado(true);
        setCarregando(false);
        return;
      }

      if (!["ADMIN", "COMANDANTE", "DIRETOR", "DESENVOLVEDOR"].includes(dados.perfil || "")) {
        await registrarAuditoria({
          modulo: "Armamentos",
          acao: "ACESSO_NEGADO",
          descricao: "Tentativa de acesso aos relatórios de armamento.",
          tabela: "armamentos",
          detalhes: {
            usuario_id: dados.id,
            perfil: dados.perfil,
            municipio_id: dados.municipio_id,
          },
        });

        setBloqueado(true);
        setCarregando(false);
        return;
      }

      setUsuario(dados);

      await registrarAuditoria({
        modulo: "Armamentos",
        acao: "ACESSO",
        descricao: "Acessou os relatórios de armamento.",
        tabela: "armamentos",
        detalhes: {
          usuario_id: dados.id,
          municipio_id: dados.municipio_id,
        },
      });

      await carregar(dados);
    }

    iniciar();
  }, []);

  async function carregar(usuarioAtual: any) {
    setCarregando(true);

    const { data: listaArmamentos, error: erroArmamentos } = await supabase
      .from("armamentos")
      .select("id, tipo, marca, modelo, numero_serie, calibre, status")
      .eq("municipio_id", usuarioAtual.municipio_id)
      .range(0, 499);

    const { data: listaCautelas, error: erroCautelas } = await supabase
      .from("cautelas_armamento")
      .select("id, armamento_id, guarda_id, tipo, quantidade_municao, criado_em")
      .eq("municipio_id", usuarioAtual.municipio_id)
      .order("criado_em", { ascending: false })
      .range(0, 499);

    const { data: listaManutencoes, error: erroManutencoes } = await supabase
      .from("manutencoes_armamento")
      .select("id, armamento_id, tipo, status, descricao, criado_em")
      .eq("municipio_id", usuarioAtual.municipio_id)
      .order("criado_em", { ascending: false })
      .range(0, 499);

    const { data: listaMunicoes, error: erroMunicoes } = await supabase
      .from("municoes_armamento")
      .select("id, tipo_movimento, calibre, quantidade, lote, criado_em")
      .eq("municipio_id", usuarioAtual.municipio_id)
      .order("criado_em", { ascending: false })
      .range(0, 499);

    const { data: listaInventarios, error: erroInventarios } = await supabase
      .from("inventario_armamento")
      .select("id, armamento_id, status_conferencia, criado_em")
      .eq("municipio_id", usuarioAtual.municipio_id)
      .order("criado_em", { ascending: false })
      .range(0, 499);

    setCarregando(false);

    if (
      erroArmamentos ||
      erroCautelas ||
      erroManutencoes ||
      erroMunicoes ||
      erroInventarios
    ) {
      await registrarAuditoria({
        modulo: "Armamentos",
        acao: "ERRO",
        descricao: "Erro ao carregar relatório geral de armamentos.",
        tabela: "armamentos",
        detalhes: {
          erro_armamentos: erroArmamentos?.message,
          erro_cautelas: erroCautelas?.message,
          erro_manutencoes: erroManutencoes?.message,
          erro_municoes: erroMunicoes?.message,
          erro_inventarios: erroInventarios?.message,
        },
      });

      alert("Erro ao carregar relatório.");
      return;
    }

    setArmamentos(listaArmamentos || []);
    setCautelas(listaCautelas || []);
    setManutencoes(listaManutencoes || []);
    setMunicoes(listaMunicoes || []);
    setInventarios(listaInventarios || []);
  }

  const resumo = useMemo(() => {
    const entradasMunicao = municoes
      .filter((m) => m.tipo_movimento === "ENTRADA")
      .reduce((acc, m) => acc + Number(m.quantidade || 0), 0);

    const saidasMunicao = municoes
      .filter((m) => m.tipo_movimento === "SAIDA")
      .reduce((acc, m) => acc + Number(m.quantidade || 0), 0);

    return {
      armamentos: armamentos.length,
      disponiveis: armamentos.filter((a) => a.status === "DISPONIVEL").length,
      cautelados: armamentos.filter((a) => a.status === "CAUTELADA").length,
      manutencao: armamentos.filter((a) => a.status === "MANUTENCAO").length,
      cautelas: cautelas.length,
      inventarios: inventarios.length,
      manutencoes: manutencoes.length,
      saldoMunicao: entradasMunicao - saidasMunicao,
    };
  }, [armamentos, cautelas, inventarios, manutencoes, municoes]);

  async function imprimir() {
    if (!usuario?.id || !usuario?.municipio_id) {
      alert("Sessão inválida.");
      return;
    }

    await registrarAuditoria({
      modulo: "Armamentos",
      acao: "EXPORTAR",
      descricao: "Imprimiu o relatório geral de armamentos.",
      tabela: "armamentos",
      detalhes: {
        usuario_id: usuario.id,
        municipio_id: usuario.municipio_id,
        resumo,
      },
    });

    window.print();
  }

  if (carregando) {
    return (
      <div className="p-4 md:p-6">
        <div className="painel-premium p-10 text-center">
          <p className="text-slate-400">Carregando relatório de armamentos...</p>
        </div>
      </div>
    );
  }

  if (bloqueado) {
    return (
      <div className="p-4 md:p-6">
        <div className="painel-premium p-10 text-center">
          <Lock className="w-16 h-16 mx-auto text-red-400 mb-4" />
          <h2 className="text-2xl font-black text-white">Acesso Restrito</h2>
          <p className="text-slate-400 mt-2">
            Você não possui permissão para acessar os relatórios de armamento.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 pb-24 space-y-6">
      <div className="painel-premium p-6 no-print">
        <h1 className="text-2xl md:text-3xl font-black text-white">
          📊 Relatórios de Armamento
        </h1>

        <p className="text-slate-400 mt-2">
          Resumo administrativo da armaria, cautelas, inventário, manutenção e munições.
        </p>

        <button onClick={imprimir} className="sig-btn-gold mt-4">
          Imprimir Relatório
        </button>
      </div>

      <div className="painel-premium p-6">
        <div className="flex items-center gap-3 mb-6">
          <FileText className="w-8 h-8 text-yellow-400" />
          <div>
            <h2 className="text-2xl font-black text-white">
              Relatório Geral da Armaria
            </h2>
            <p className="text-slate-400 text-sm">
              Gerado em {new Date().toLocaleString("pt-BR")}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card titulo="Armamentos" valor={String(resumo.armamentos)} icone={Shield} />
          <Card titulo="Disponíveis" valor={String(resumo.disponiveis)} icone={Shield} />
          <Card titulo="Cautelados" valor={String(resumo.cautelados)} icone={ClipboardList} />
          <Card titulo="Manutenção" valor={String(resumo.manutencao)} icone={Wrench} />
          <Card titulo="Cautelas" valor={String(resumo.cautelas)} icone={ClipboardList} />
          <Card titulo="Inventários" valor={String(resumo.inventarios)} icone={Archive} />
          <Card titulo="Manutenções" valor={String(resumo.manutencoes)} icone={Wrench} />
          <Card titulo="Saldo Munições" valor={String(resumo.saldoMunicao)} icone={Package} />
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Bloco titulo="Armamentos cadastrados">
          {armamentos.length === 0 ? (
            <Vazio texto="Nenhum armamento cadastrado." />
          ) : (
            armamentos.map((a) => (
              <Linha
                key={a.id}
                titulo={`${a.tipo || ""} ${a.marca || ""} ${a.modelo || ""}`}
                texto={`Série: ${a.numero_serie || "N/I"} • Calibre: ${
                  a.calibre || "N/I"
                } • Status: ${a.status || "N/I"}`}
              />
            ))
          )}
        </Bloco>

        <Bloco titulo="Últimas cautelas">
          {cautelas.length === 0 ? (
            <Vazio texto="Nenhuma cautela registrada." />
          ) : (
            cautelas.slice(0, 10).map((c) => (
              <Linha
                key={c.id}
                titulo={c.tipo || "Cautela"}
                texto={`Armamento #${c.armamento_id} • Guarda #${
                  c.guarda_id
                } • Munições: ${c.quantidade_municao || 0}`}
              />
            ))
          )}
        </Bloco>

        <Bloco titulo="Manutenções">
          {manutencoes.length === 0 ? (
            <Vazio texto="Nenhuma manutenção registrada." />
          ) : (
            manutencoes.slice(0, 10).map((m) => (
              <Linha
                key={m.id}
                titulo={`${m.tipo || "Manutenção"} • ${m.status || "N/I"}`}
                texto={`Armamento #${m.armamento_id} • ${
                  m.descricao || "Sem descrição"
                }`}
              />
            ))
          )}
        </Bloco>

        <Bloco titulo="Munições">
          {municoes.length === 0 ? (
            <Vazio texto="Nenhuma movimentação de munição registrada." />
          ) : (
            municoes.slice(0, 10).map((m) => (
              <Linha
                key={m.id}
                titulo={`${m.tipo_movimento || "Movimento"} • ${m.calibre || "N/I"}`}
                texto={`Quantidade: ${m.quantidade || 0} • Lote: ${
                  m.lote || "N/I"
                }`}
              />
            ))
          )}
        </Bloco>
      </div>

      <style jsx global>{`
        @media print {
          body {
            background: white !important;
          }

          .no-print {
            display: none !important;
          }

          .painel-premium {
            background: white !important;
            color: black !important;
            border: 1px solid #ddd !important;
            box-shadow: none !important;
          }

          .text-white,
          .text-slate-400,
          .text-slate-300,
          .text-slate-500 {
            color: black !important;
          }
        }
      `}</style>
    </div>
  );
}

function Card({ titulo, valor, icone: Icone }: { titulo: string; valor: string; icone: any }) {
  return (
    <div className="rounded-2xl bg-slate-900/70 border border-slate-800 p-4">
      <div className="flex justify-between items-center">
        <div>
          <p className="text-slate-400 text-sm">{titulo}</p>
          <h2 className="text-2xl font-black text-white">{valor}</h2>
        </div>
        <Icone className="w-6 h-6 text-yellow-400" />
      </div>
    </div>
  );
}

function Bloco({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <div className="painel-premium p-6">
      <h2 className="text-xl font-black text-white mb-4">{titulo}</h2>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function Linha({ titulo, texto }: { titulo: string; texto: string }) {
  return (
    <div className="rounded-xl bg-slate-900/70 border border-slate-800 p-3">
      <p className="text-white font-bold">{titulo}</p>
      <p className="text-slate-400 text-sm">{texto}</p>
    </div>
  );
}

function Vazio({ texto }: { texto: string }) {
  return <p className="text-slate-400 text-sm">{texto}</p>;
}