"use client";

import { useEffect, useMemo, useState } from "react";
import { Clock, Lock, Trash2 } from "lucide-react";

import { supabase } from "@/lib/supabase";
import { registrarAuditoria } from "@/lib/auditoria";
import ProtecaoModulo from "@/components/ProtecaoModulo";

type UsuarioLogado = {
  id: number;
  perfil?: string;
  municipio_id: number;
};

type Guarda = {
  id: number;
  nome: string;
  matricula: string | null;
};

type BancoHoras = {
  id: number;
  municipio_id: number;
  guarda_id: number;
  data_movimento: string;
  tipo: string;
  horas: number;
  motivo: string | null;
  observacao: string | null;
  criado_em?: string | null;
};

export default function BancoHorasPage() {
  const [usuario, setUsuario] = useState<UsuarioLogado | null>(null);
  const [guardas, setGuardas] = useState<Guarda[]>([]);
  const [movimentos, setMovimentos] = useState<BancoHoras[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [bloqueado, setBloqueado] = useState(false);

  const [guardaId, setGuardaId] = useState("");
  const [dataMovimento, setDataMovimento] = useState("");
  const [tipo, setTipo] = useState("CREDITO");
  const [horas, setHoras] = useState("");
  const [motivo, setMotivo] = useState("");
  const [observacao, setObservacao] = useState("");

  useEffect(() => {
    async function iniciar() {
      const dados = JSON.parse(
        localStorage.getItem("usuarioLogado") || "{}"
      ) as UsuarioLogado;

      if (!dados?.id || !dados?.municipio_id) {
        alert("Sessão inválida.");
        setBloqueado(true);
        setCarregando(false);
        return;
      }

      if (
        ![
          "ADMIN",
          "COMANDANTE",
          "DIRETOR",
          "DESENVOLVEDOR",
        ].includes(dados.perfil || "")
      ) {
        await registrarAuditoria({
          modulo: "Banco de Horas",
          acao: "ACESSO_NEGADO",
          descricao: "Tentativa de acesso ao Banco de Horas sem permissão.",
          tabela: "banco_horas",
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
        modulo: "Banco de Horas",
        acao: "ACESSO",
        descricao: "Acessou o módulo Banco de Horas.",
        tabela: "banco_horas",
        detalhes: {
          usuario_id: dados.id,
          municipio_id: dados.municipio_id,
        },
      });

      await carregarSistema(dados);
    }

    iniciar();
  }, []);

  async function carregarSistema(usuarioAtual: UsuarioLogado) {
    setCarregando(true);

    const {
      data: guardasData,
      error: erroGuardas,
    } = await supabase
      .from("guardas")
      .select("id, nome, matricula")
      .eq("municipio_id", usuarioAtual.municipio_id)
      .order("nome", { ascending: true })
      .range(0, 499);

    const {
      data: movimentosData,
      error: erroMovimentos,
    } = await supabase
      .from("banco_horas")
      .select(
        "id, municipio_id, guarda_id, data_movimento, tipo, horas, motivo, observacao, criado_em"
      )
      .eq("municipio_id", usuarioAtual.municipio_id)
      .order("data_movimento", { ascending: false })
      .range(0, 499);

    setCarregando(false);

    if (erroGuardas || erroMovimentos) {
      await registrarAuditoria({
        modulo: "Banco de Horas",
        acao: "ERRO",
        descricao: "Erro ao carregar Banco de Horas.",
        tabela: "banco_horas",
        detalhes: {
          erro_guardas: erroGuardas?.message,
          erro_movimentos: erroMovimentos?.message,
          municipio_id: usuarioAtual.municipio_id,
        },
      });

      alert("Erro ao carregar banco de horas.");
      return;
    }

    setGuardas(guardasData || []);
    setMovimentos(movimentosData || []);
  }

  function nomeGuarda(id: number) {
    return guardas.find((guarda) => guarda.id === id)?.nome || `ID ${id}`;
  }

  function formatarData(data: string) {
    if (!data) return "-";

    const [ano, mes, dia] = data.split("-");
    return `${dia}/${mes}/${ano}`;
  }

  const resumo = useMemo(() => {
    const creditos = movimentos
      .filter((item) => item.tipo === "CREDITO")
      .reduce((total, item) => total + Number(item.horas || 0), 0);

    const debitos = movimentos
      .filter((item) => item.tipo === "DEBITO")
      .reduce((total, item) => total + Number(item.horas || 0), 0);

    return {
      lancamentos: movimentos.length,
      creditos,
      debitos,
      saldo: creditos - debitos,
      guardas: new Set(movimentos.map((item) => item.guarda_id)).size,
    };
  }, [movimentos]);

  async function salvarMovimento() {
    if (!usuario?.id || !usuario?.municipio_id) {
      alert("Sessão inválida.");
      return;
    }

    if (!guardaId || !dataMovimento || !horas || !motivo) {
      alert("Preencha guarda, data, horas e motivo.");
      return;
    }

    if (Number(horas) <= 0) {
      alert("Informe uma quantidade de horas válida.");
      return;
    }

    if (Number(horas) > 1000) {
      alert("Quantidade de horas muito alta.");
      return;
    }

    if (observacao.length > 3000) {
      alert("Observação muito grande.");
      return;
    }

    setSalvando(true);

    const dadosMovimento = {
      municipio_id: usuario.municipio_id,
      guarda_id: Number(guardaId),
      data_movimento: dataMovimento,
      tipo,
      horas: Number(horas),
      motivo,
      observacao: observacao.trim() || null,
      criado_por: usuario.id,
    };

    const { data, error } = await supabase
      .from("banco_horas")
      .insert([dadosMovimento])
      .select("id")
      .single();

    setSalvando(false);

    if (error) {
      await registrarAuditoria({
        modulo: "Banco de Horas",
        acao: "ERRO",
        descricao: "Erro ao criar lançamento no banco de horas.",
        tabela: "banco_horas",
        detalhes: {
          erro: error.message,
          dados: dadosMovimento,
        },
      });

      alert("Erro ao salvar lançamento.");
      return;
    }

    const guarda = guardas.find(
      (item) => String(item.id) === String(guardaId)
    );

    await registrarAuditoria({
      modulo: "Banco de Horas",
      acao: "CRIAR",
      descricao: `Criou lançamento de ${horas}h no banco de horas para ${
        guarda?.nome || "guarda não informado"
      }.`,
      tabela: "banco_horas",
      registro_id: data?.id,
      detalhes: dadosMovimento,
    });

    alert("Lançamento salvo com sucesso.");

    setGuardaId("");
    setDataMovimento("");
    setTipo("CREDITO");
    setHoras("");
    setMotivo("");
    setObservacao("");

    await carregarSistema(usuario);
  }

  async function excluirMovimento(id: number) {
    if (!usuario?.id || !usuario?.municipio_id) {
      alert("Sessão inválida.");
      return;
    }

    const movimento = movimentos.find((item) => item.id === id);

    const motivoExclusao = prompt("Informe o motivo da exclusão:");

    if (!motivoExclusao?.trim()) {
      alert("Informe o motivo da exclusão.");
      return;
    }

    const { error } = await supabase
      .from("banco_horas")
      .delete()
      .eq("id", id)
      .eq("municipio_id", usuario.municipio_id);

    if (error) {
      await registrarAuditoria({
        modulo: "Banco de Horas",
        acao: "ERRO",
        descricao: "Erro ao excluir lançamento do banco de horas.",
        tabela: "banco_horas",
        registro_id: id,
        detalhes: {
          erro: error.message,
          motivo: motivoExclusao,
          movimento,
        },
      });

      alert("Erro ao excluir lançamento.");
      return;
    }

    await registrarAuditoria({
      modulo: "Banco de Horas",
      acao: "EXCLUIR",
      descricao: `Excluiu lançamento ID ${id} do banco de horas.`,
      tabela: "banco_horas",
      registro_id: id,
      detalhes: {
        motivo: motivoExclusao,
        movimento,
      },
    });

    alert("Lançamento excluído com sucesso.");
    await carregarSistema(usuario);
  }

  if (carregando) {
    return (
      <ProtecaoModulo modulo="banco_horas">
        <div className="p-4 md:p-6">
          <div className="painel-premium p-10 text-center">
            <p className="text-slate-400">Carregando banco de horas...</p>
          </div>
        </div>
      </ProtecaoModulo>
    );
  }

  if (bloqueado) {
    return (
      <ProtecaoModulo modulo="banco_horas">
        <div className="p-4 md:p-6">
          <div className="painel-premium p-10 text-center">
            <Lock className="w-16 h-16 mx-auto text-red-400 mb-4" />

            <h2 className="text-2xl font-black text-white">
              Acesso Restrito
            </h2>

            <p className="text-slate-400 mt-2">
              Você não possui permissão para acessar o Banco de Horas.
            </p>
          </div>
        </div>
      </ProtecaoModulo>
    );
  }

  return (
    <ProtecaoModulo modulo="banco_horas">
      <div className="p-4 md:p-6 pb-24 space-y-6">
        <header className="painel-premium p-6">
          <div className="flex items-center gap-3">
            <Clock className="w-8 h-8 text-yellow-400" />

            <div>
              <h1 className="text-2xl md:text-3xl font-black text-white">
                Banco de Horas
              </h1>

              <p className="text-slate-400 mt-1">
                Controle manual de créditos, débitos e saldo de horas dos guardas.
              </p>
            </div>
          </div>
        </header>

        <section className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card titulo="Lançamentos" valor={movimentos.length} />
          <Card titulo="Créditos" valor={`${resumo.creditos.toFixed(2)}h`} />
          <Card titulo="Débitos" valor={`${resumo.debitos.toFixed(2)}h`} />
          <Card titulo="Saldo Geral" valor={`${resumo.saldo.toFixed(2)}h`} />
          <Card titulo="Guardas" valor={resumo.guardas} />
        </section>

        <section className="grid grid-cols-1 xl:grid-cols-3 gap-4">
          <div className="painel-premium p-6">
            <h2 className="text-xl font-black text-white mb-4">
              Novo Lançamento
            </h2>

            <div className="space-y-4">
              <div>
                <label className="label">Guarda</label>
                <select
                  className="input"
                  value={guardaId}
                  onChange={(e) => setGuardaId(e.target.value)}
                >
                  <option value="">Selecione</option>

                  {guardas.map((guarda) => (
                    <option key={guarda.id} value={guarda.id}>
                      {guarda.nome} • {guarda.matricula || "Sem matrícula"}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="label">Data</label>
                <input
                  type="date"
                  className="input"
                  value={dataMovimento}
                  onChange={(e) => setDataMovimento(e.target.value)}
                />
              </div>

              <div>
                <label className="label">Tipo</label>
                <select
                  className="input"
                  value={tipo}
                  onChange={(e) => setTipo(e.target.value)}
                >
                  <option value="CREDITO">Crédito de Horas</option>
                  <option value="DEBITO">Débito / Compensação</option>
                </select>
              </div>

              <div>
                <label className="label">Horas</label>
                <input
                  type="number"
                  step="0.5"
                  className="input"
                  value={horas}
                  onChange={(e) => setHoras(e.target.value)}
                  placeholder="Ex: 8"
                />
              </div>

              <div>
                <label className="label">Motivo</label>
                <select
                  className="input"
                  value={motivo}
                  onChange={(e) => setMotivo(e.target.value)}
                >
                  <option value="">Selecione</option>
                  <option value="SERVICO_EXTRA">Serviço Extra</option>
                  <option value="OPERACAO">Operação</option>
                  <option value="EVENTO">Evento</option>
                  <option value="COMPENSACAO">Compensação</option>
                  <option value="FOLGA">Folga</option>
                </select>
              </div>

              <div>
                <label className="label">Observação</label>
                <textarea
                  className="input min-h-24 resize-none"
                  value={observacao}
                  onChange={(e) => setObservacao(e.target.value)}
                />
              </div>

              <button
                type="button"
                onClick={salvarMovimento}
                disabled={salvando}
                className="sig-btn-gold w-full disabled:opacity-50"
              >
                {salvando ? "Salvando..." : "Salvar Lançamento"}
              </button>
            </div>
          </div>

          <div className="painel-premium p-6 xl:col-span-2">
            <h2 className="text-xl font-black text-white mb-4">
              Histórico
            </h2>

            {movimentos.length === 0 ? (
              <p className="text-slate-400">Nenhum lançamento encontrado.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b border-slate-700 text-slate-400">
                    <tr>
                      <th className="text-left py-3 pr-4">Data</th>
                      <th className="text-left py-3 pr-4">Guarda</th>
                      <th className="text-left py-3 pr-4">Tipo</th>
                      <th className="text-left py-3 pr-4">Horas</th>
                      <th className="text-left py-3 pr-4">Motivo</th>
                      <th className="text-right py-3 pr-4">Ações</th>
                    </tr>
                  </thead>

                  <tbody>
                    {movimentos.map((item) => (
                      <tr
                        key={item.id}
                        className="border-b border-slate-800 text-slate-300"
                      >
                        <td className="py-4 pr-4 text-blue-400 font-semibold">
                          {formatarData(item.data_movimento)}
                        </td>

                        <td className="pr-4">{nomeGuarda(item.guarda_id)}</td>

                        <td className="pr-4">
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-bold ${
                              item.tipo === "CREDITO"
                                ? "bg-green-900/40 text-green-400"
                                : "bg-red-900/40 text-red-400"
                            }`}
                          >
                            {item.tipo === "CREDITO" ? "+ Crédito" : "- Débito"}
                          </span>
                        </td>

                        <td className="font-bold pr-4">
                          {Number(item.horas).toFixed(2)}h
                        </td>

                        <td className="pr-4">{item.motivo || "-"}</td>

                        <td className="text-right pr-4">
                          <button
                            type="button"
                            onClick={() => excluirMovimento(item.id)}
                            className="inline-flex items-center gap-2 rounded-xl bg-red-950/70 border border-red-900 px-3 py-2 text-xs font-bold text-red-300 hover:bg-red-900"
                          >
                            <Trash2 className="w-4 h-4" />
                            Excluir
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>
      </div>
    </ProtecaoModulo>
  );
}

function Card({ titulo, valor }: { titulo: string; valor: number | string }) {
  return (
    <div className="painel-premium min-h-28 flex flex-col justify-center p-5">
      <p className="text-slate-400">{titulo}</p>
      <h2 className="text-3xl md:text-4xl font-black text-white">{valor}</h2>
    </div>
  );
}