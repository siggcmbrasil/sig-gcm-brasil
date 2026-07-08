"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import CardIndicador from "@/components/CardIndicador";
import { supabase } from "@/lib/supabase";
import { registrarAuditoria } from "@/lib/auditoria";
import { finalizarPatrulhamentoV2 } from "@/lib/patrulhamento/finalizarPatrulhamento";
import { restaurarPatrulhamentoAtivo } from "@/lib/patrulhamento/restaurarPatrulhamento";

type Patrulhamento = {
  id: number;
  data: string;
  hora: string;
  local: string;
  guarda: string;
  equipe: string | null;
  viatura: string | null;
  latitude: string | null;
  longitude: string | null;
  observacao: string | null;
  status: string | null;
  municipio_id: number;
};

export default function PatrulhamentoPage() {
  const [patrulhamentos, setPatrulhamentos] = useState<Patrulhamento[]>([]);
  const [busca, setBusca] = useState("");
  const [carregando, setCarregando] = useState(true);
  const [finalizandoId, setFinalizandoId] = useState<number | null>(null);
  const [patrulhamentoAtivoId, setPatrulhamentoAtivoId] = useState<number | null>(null);

  const usuarioLogado =
    typeof window !== "undefined"
      ? JSON.parse(localStorage.getItem("usuarioLogado") || "{}")
      : {};

  const perfilUsuario = usuarioLogado?.perfil || "CONSULTA";
  const podeEditar = perfilUsuario !== "CONSULTA";

  if (!usuarioLogado?.municipio_id) {
    return <div className="p-6 text-white">Município não identificado.</div>;
  }

  async function carregarPatrulhamentos() {
    setCarregando(true);

    const { data, error } = await supabase
      .from("patrulhamentos")
      .select(`
        id,
        municipio_id,
        data,
        hora,
        local,
        guarda,
        equipe,
        viatura,
        latitude,
        longitude,
        observacao,
        status
      `)
      .eq("municipio_id", Number(usuarioLogado.municipio_id))
      .order("id", { ascending: false })
      .limit(300);

    if (error) {
      console.error("Erro ao carregar patrulhamentos:", error);
      alert("Erro ao carregar patrulhamentos.");
      setCarregando(false);
      return;
    }

    setPatrulhamentos(data || []);
    setCarregando(false);
  }

  async function finalizar(id: number) {
    if (!podeEditar) {
      alert("Você não possui permissão para finalizar patrulhamento.");
      return;
    }

    const confirmar = confirm("Deseja finalizar este patrulhamento?");
    if (!confirmar) return;

    setFinalizandoId(id);

    try {
      await finalizarPatrulhamentoV2({
        municipio_id: Number(usuarioLogado.municipio_id),
        patrulhamento_id: Number(id),
      });

      await registrarAuditoria({
        modulo: "Patrulhamento",
        acao: "FINALIZAR",
        descricao: `Finalizou o patrulhamento ${id}.`,
        tabela: "patrulhamentos",
        registro_id: id,
        detalhes: {
          municipio_id: Number(usuarioLogado.municipio_id),
          usuario_id: usuarioLogado.id,
        },
      });

      setPatrulhamentoAtivoId(null);
      alert("Patrulhamento finalizado com sucesso.");
      await carregarPatrulhamentos();
    } catch (error: any) {
      console.error("Erro ao finalizar patrulhamento:", error);
      alert(error?.message || "Erro ao finalizar patrulhamento.");
    } finally {
      setFinalizandoId(null);
    }
  }

  async function excluirPatrulhamento(id: number) {
    if (!podeEditar) {
      alert("Você não possui permissão para excluir patrulhamentos.");
      return;
    }

    const motivo = prompt("Informe o motivo da exclusão:");
    if (!motivo?.trim()) {
      alert("Informe o motivo.");
      return;
    }

    const confirmar = confirm("Deseja realmente excluir este patrulhamento?");
    if (!confirmar) return;

    const { error } = await supabase
      .from("patrulhamentos")
      .delete()
      .eq("id", id)
      .eq("municipio_id", Number(usuarioLogado.municipio_id));

    if (error) {
      console.error("Erro ao excluir patrulhamento:", error);
      alert("Erro ao excluir patrulhamento.");
      return;
    }

    await registrarAuditoria({
      modulo: "Patrulhamento",
      acao: "EXCLUIR",
      descricao: `Excluiu o patrulhamento ${id}.`,
      tabela: "patrulhamentos",
      registro_id: id,
      detalhes: {
        motivo,
        municipio_id: Number(usuarioLogado.municipio_id),
        usuario_id: usuarioLogado.id,
      },
    });

    await carregarPatrulhamentos();
  }

  useEffect(() => {
    const ativo = restaurarPatrulhamentoAtivo({
      municipio_id: Number(usuarioLogado.municipio_id),
    });

    if (ativo) {
      setPatrulhamentoAtivoId(ativo);
    }

    void carregarPatrulhamentos();

    void registrarAuditoria({
      modulo: "Patrulhamento",
      acao: "ACESSO",
      descricao: "Acessou a central de patrulhamento.",
      tabela: "patrulhamentos",
      detalhes: {
        municipio_id: Number(usuarioLogado.municipio_id),
        usuario_id: usuarioLogado.id,
      },
    });
  }, []);

  const patrulhamentosFiltrados = patrulhamentos.filter((item) => {
    const texto = `
      ${item.id}
      ${item.data}
      ${item.hora}
      ${item.local}
      ${item.guarda}
      ${item.equipe || ""}
      ${item.viatura || ""}
      ${item.observacao || ""}
      ${item.status || ""}
    `.toLowerCase();

    return texto.includes(busca.toLowerCase());
  });

  const total = patrulhamentos.length;
  const emAndamento = patrulhamentos.filter(
    (p) => p.status !== "FINALIZADO"
  ).length;
  const finalizados = patrulhamentos.filter(
    (p) => p.status === "FINALIZADO"
  ).length;
  const hoje = patrulhamentos.filter(
    (p) => p.data === new Date().toISOString().split("T")[0]
  ).length;

  return (
    <div className="p-3 md:p-6 pb-24">
      <header className="mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-800 pb-5">
          <div>
            <h1 className="text-3xl md:text-5xl font-bold tracking-tight">
              Patrulhamento
            </h1>

            <p className="text-slate-400 text-base md:text-lg mt-1">
              Controle de patrulhamentos, GPS, rotas e finalizações.
            </p>

            {patrulhamentoAtivoId && (
              <p className="mt-3 inline-flex rounded-xl border border-green-500/30 bg-green-500/10 px-3 py-2 text-sm font-bold text-green-300">
                GPS ativo no patrulhamento #{patrulhamentoAtivoId}
              </p>
            )}
          </div>

          {podeEditar && (
            <Link
              href="/sistema/patrulhamento/novo"
              className="btn-primary text-center"
            >
              🚔 Novo Patrulhamento
            </Link>
          )}
        </div>
      </header>

      <section className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <CardIndicador titulo="Total" valor={total} icone="🚔" cor="blue" />
        <CardIndicador titulo="Em andamento" valor={emAndamento} icone="🟡" cor="yellow" />
        <CardIndicador titulo="Finalizados" valor={finalizados} icone="✅" cor="green" />
        <CardIndicador titulo="Hoje" valor={hoje} icone="📍" cor="purple" />
      </section>

      <section className="card">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-5">
          <div>
            <h2 className="text-xl md:text-2xl font-bold">
              Patrulhamentos Registrados
            </h2>
            <p className="text-slate-400 text-sm mt-1">
              Abra a rota para visualizar os pontos GPS registrados.
            </p>
          </div>

          <div className="w-full md:w-96">
            <label className="label">Buscar</label>
            <input
              className="input"
              placeholder="Buscar por ID, data, local, equipe, viatura..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
            />
          </div>
        </div>

        {carregando ? (
          <p className="text-slate-400">Carregando patrulhamentos...</p>
        ) : patrulhamentosFiltrados.length === 0 ? (
          <p className="text-slate-400">Nenhum patrulhamento encontrado.</p>
        ) : (
          <>
            <div className="md:hidden space-y-4">
              {patrulhamentosFiltrados.map((item) => (
                <div
                  key={item.id}
                  className="bg-slate-950/40 border border-slate-700 rounded-xl p-4 space-y-3"
                >
                  <div className="flex justify-between gap-3">
                    <div>
                      <p className="text-blue-400 font-bold">
                        #{item.id} • {item.data} às {item.hora}
                      </p>
                      <h3 className="text-xl font-black">{item.local}</h3>
                    </div>

                    <StatusPatrulhamento status={item.status} />
                  </div>

                  <div className="text-slate-300 space-y-1 text-sm">
                    <p><span className="text-slate-500">Viatura:</span> {item.viatura || "-"}</p>
                    <p><span className="text-slate-500">Guarda:</span> {item.guarda || "-"}</p>

                    {item.equipe && (
                      <div>
                        <p className="text-slate-500">Equipe:</p>
                        <pre className="whitespace-pre-wrap font-sans text-slate-300">
                          {item.equipe}
                        </pre>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 gap-2">
                    <Link
                      href={`/sistema/patrulhamento/${item.id}`}
                      className="bg-blue-700 hover:bg-blue-800 text-white text-center px-4 py-3 rounded-xl font-semibold"
                    >
                      Ver Rota
                    </Link>

                    {podeEditar && item.status !== "FINALIZADO" && (
                      <button
                        type="button"
                        onClick={() => finalizar(item.id)}
                        disabled={finalizandoId === item.id}
                        className="bg-green-700 hover:bg-green-800 text-white px-4 py-3 rounded-xl font-semibold disabled:opacity-60"
                      >
                        {finalizandoId === item.id ? "Finalizando..." : "Finalizar"}
                      </button>
                    )}

                    {podeEditar && (
                      <button
                        type="button"
                        onClick={() => excluirPatrulhamento(item.id)}
                        className="bg-red-700 hover:bg-red-800 text-white px-4 py-3 rounded-xl font-semibold"
                      >
                        Excluir
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-slate-400 border-b border-slate-700">
                  <tr>
                    <th className="text-left py-3">ID</th>
                    <th className="text-left py-3">Data</th>
                    <th className="text-left py-3">Hora</th>
                    <th className="text-left py-3">Local</th>
                    <th className="text-left py-3">Viatura</th>
                    <th className="text-left py-3">Guarda</th>
                    <th className="text-left py-3">Status</th>
                    <th className="text-right py-3">Ações</th>
                  </tr>
                </thead>

                <tbody>
                  {patrulhamentosFiltrados.map((item) => (
                    <tr key={item.id} className="border-b border-slate-800">
                      <td className="py-4 text-blue-400 font-bold">
                        #{item.id}
                      </td>
                      <td>{item.data}</td>
                      <td>{item.hora}</td>
                      <td className="text-slate-300 max-w-[280px] truncate">
                        {item.local}
                      </td>
                      <td>{item.viatura || "-"}</td>
                      <td>{item.guarda || "-"}</td>
                      <td>
                        <StatusPatrulhamento status={item.status} />
                      </td>
                      <td className="text-right">
                        <div className="flex justify-end gap-2">
                          <Link
                            href={`/sistema/patrulhamento/${item.id}`}
                            className="bg-blue-700 hover:bg-blue-800 text-white px-3 py-2 rounded-lg text-xs"
                          >
                            Ver Rota
                          </Link>

                          {podeEditar && item.status !== "FINALIZADO" && (
                            <button
                              type="button"
                              onClick={() => finalizar(item.id)}
                              disabled={finalizandoId === item.id}
                              className="bg-green-700 hover:bg-green-800 text-white px-3 py-2 rounded-lg text-xs disabled:opacity-60"
                            >
                              {finalizandoId === item.id ? "..." : "Finalizar"}
                            </button>
                          )}

                          {podeEditar && (
                            <button
                              type="button"
                              onClick={() => excluirPatrulhamento(item.id)}
                              className="bg-red-700 hover:bg-red-800 text-white px-3 py-2 rounded-lg text-xs"
                            >
                              Excluir
                            </button>
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
      </section>
    </div>
  );
}

function StatusPatrulhamento({ status }: { status: string | null }) {
  if (status === "FINALIZADO") {
    return (
      <span className="bg-green-700 text-green-100 px-3 py-2 rounded text-xs inline-block">
        Finalizado
      </span>
    );
  }

  return (
    <span className="bg-yellow-600 text-yellow-100 px-3 py-2 rounded text-xs inline-block">
      Em andamento
    </span>
  );
}
