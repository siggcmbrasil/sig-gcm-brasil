"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  Loader2,
  Plus,
  Save,
  XCircle,
} from "lucide-react";

import ProtecaoModulo from "@/components/ProtecaoModulo";
import { registrarAuditoria } from "@/lib/auditoria";
import {
  STATUS_MOVIMENTACAO,
  TIPOS_MOVIMENTACAO,
  formatarLotacao,
  lerUsuarioLotacao,
  podeGerenciarLotacao,
} from "@/lib/lotacaoEfetivo";
import { supabase } from "@/lib/supabase";

type Guarda = {
  id: number;
  nome: string;
  matricula: string | null;
};

type Movimentacao = {
  id: number;
  guarda_id: number;
  guarda_nome: string;
  matricula: string | null;
  tipo: string;
  unidade_origem: string | null;
  setor_origem: string | null;
  unidade_destino: string | null;
  setor_destino: string | null;
  motivo: string;
  status: string;
  solicitado_em: string;
};

export default function MovimentacoesEfetivoPage() {
  const [usuario] = useState(() => lerUsuarioLotacao());
  const [guardas, setGuardas] = useState<Guarda[]>([]);
  const [movimentacoes, setMovimentacoes] = useState<Movimentacao[]>([]);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [guardaId, setGuardaId] = useState("");
  const [tipo, setTipo] = useState("TRANSFERENCIA_INTERNA");
  const [unidadeOrigem, setUnidadeOrigem] = useState("");
  const [setorOrigem, setSetorOrigem] = useState("");
  const [unidadeDestino, setUnidadeDestino] = useState("");
  const [setorDestino, setSetorDestino] = useState("");
  const [motivo, setMotivo] = useState("");
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");

  const podeGerenciar = usuario ? podeGerenciarLotacao(usuario.perfil) : false;

  const carregar = useCallback(async () => {
    if (!usuario?.municipio_id) return;

    setCarregando(true);

    const [guardasResp, movimentosResp] = await Promise.all([
      supabase
        .from("guardas")
        .select("id,nome,matricula")
        .eq("municipio_id", usuario.municipio_id)
        .order("nome"),
      supabase
        .from("movimentacoes_efetivo")
        .select("*")
        .eq("municipio_id", usuario.municipio_id)
        .order("solicitado_em", { ascending: false }),
    ]);

    if (guardasResp.error || movimentosResp.error) {
      setErro((guardasResp.error || movimentosResp.error)?.message || "");
    }

    setGuardas((guardasResp.data as Guarda[] | null) || []);
    setMovimentacoes((movimentosResp.data as Movimentacao[] | null) || []);
    setCarregando(false);
  }, [usuario]);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  async function salvar() {
    if (!usuario?.municipio_id || !guardaId || !motivo.trim()) {
      setErro("Selecione o guarda e informe o motivo.");
      return;
    }

    const guarda = guardas.find((item) => String(item.id) === guardaId);
    if (!guarda) return;

    setSalvando(true);
    setErro("");

    const { data, error } = await supabase
      .from("movimentacoes_efetivo")
      .insert({
        municipio_id: usuario.municipio_id,
        guarda_id: guarda.id,
        guarda_nome: guarda.nome,
        matricula: guarda.matricula,
        tipo,
        unidade_origem: unidadeOrigem.trim() || null,
        setor_origem: setorOrigem.trim() || null,
        unidade_destino: unidadeDestino.trim() || null,
        setor_destino: setorDestino.trim() || null,
        motivo: motivo.trim(),
        status: "PENDENTE",
        solicitado_por_id: String(usuario.id),
        solicitado_por_nome: usuario.nome,
      })
      .select("id")
      .single();

    if (error) {
      setErro(error.message);
      setSalvando(false);
      return;
    }

    await registrarAuditoria({
      modulo: "RH",
      acao: "SOLICITAR_MOVIMENTACAO",
      tabela: "movimentacoes_efetivo",
      registro_id: data.id,
      descricao: `${formatarLotacao(tipo)} solicitada para ${guarda.nome}.`,
    });

    setMostrarFormulario(false);
    setGuardaId("");
    setMotivo("");
    setUnidadeOrigem("");
    setSetorOrigem("");
    setUnidadeDestino("");
    setSetorDestino("");
    await carregar();
    setSalvando(false);
  }

  async function decidir(item: Movimentacao, aprovar: boolean) {
    if (!usuario || !podeGerenciar) return;

    const novoStatus = aprovar ? "APROVADA" : "NEGADA";

    const { error } = await supabase
      .from("movimentacoes_efetivo")
      .update({
        status: novoStatus,
        decidido_por_id: String(usuario.id),
        decidido_por_nome: usuario.nome,
        decidido_em: new Date().toISOString(),
        atualizado_em: new Date().toISOString(),
      })
      .eq("id", item.id)
      .eq("municipio_id", usuario.municipio_id);

    if (error) {
      setErro(error.message);
      return;
    }

    if (aprovar) {
      await supabase
        .from("lotacoes_efetivo")
        .update({
          ativo: false,
          data_fim: new Date().toISOString().slice(0, 10),
          atualizado_em: new Date().toISOString(),
        })
        .eq("municipio_id", usuario.municipio_id)
        .eq("guarda_id", item.guarda_id)
        .eq("ativo", true);

      await supabase.from("lotacoes_efetivo").insert({
        municipio_id: usuario.municipio_id,
        guarda_id: item.guarda_id,
        guarda_nome: item.guarda_nome,
        matricula: item.matricula,
        unidade: item.unidade_destino || "Não informada",
        setor: item.setor_destino,
        cargo: null,
        tipo_lotacao: item.tipo,
        data_inicio: new Date().toISOString().slice(0, 10),
        movimentacao_id: item.id,
        ativo: true,
        criado_por_id: String(usuario.id),
        criado_por_nome: usuario.nome,
      });

      await supabase
        .from("movimentacoes_efetivo")
        .update({
          status: "CONCLUIDA",
          concluido_em: new Date().toISOString(),
        })
        .eq("id", item.id);
    }

    await registrarAuditoria({
      modulo: "RH",
      acao: aprovar ? "APROVAR_MOVIMENTACAO" : "NEGAR_MOVIMENTACAO",
      tabela: "movimentacoes_efetivo",
      registro_id: item.id,
      descricao: `${formatarLotacao(item.tipo)} ${novoStatus.toLowerCase()} para ${item.guarda_nome}.`,
    });

    await carregar();
  }

  return (
    <ProtecaoModulo modulo="guardas">
      <main className="min-h-screen bg-[#020b1c] px-4 py-5 text-white lg:px-7">
        <div className="mx-auto max-w-[1500px] space-y-5">
          <header className="rounded-3xl border border-cyan-400/15 bg-[#061326] p-5 lg:p-7">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <Link
                  href="/sistema/quadro-vagas"
                  className="inline-flex items-center gap-2 text-sm font-black text-cyan-300"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Voltar
                </Link>
                <h1 className="mt-4 text-2xl font-black">Movimentações do Efetivo</h1>
              </div>

              <button
                onClick={() => setMostrarFormulario((valor) => !valor)}
                className="inline-flex items-center gap-2 self-start rounded-xl bg-cyan-300 px-4 py-3 font-black text-slate-950"
              >
                <Plus className="h-4 w-4" />
                Nova movimentação
              </button>
            </div>
          </header>

          {erro ? (
            <div className="rounded-2xl border border-rose-400/25 bg-rose-400/10 p-4 text-sm text-rose-200">
              {erro}
            </div>
          ) : null}

          {mostrarFormulario ? (
            <section className="grid gap-4 rounded-2xl border border-slate-800 bg-[#061326] p-5 md:grid-cols-2">
              <Campo titulo="Guarda">
                <select
                  value={guardaId}
                  onChange={(event) => setGuardaId(event.target.value)}
                  className="h-12 w-full rounded-xl border border-slate-700 bg-slate-950/60 px-4"
                >
                  <option value="">Selecione...</option>
                  {guardas.map((guarda) => (
                    <option key={guarda.id} value={guarda.id}>
                      {guarda.nome} — {guarda.matricula || "sem matrícula"}
                    </option>
                  ))}
                </select>
              </Campo>

              <Campo titulo="Tipo">
                <select
                  value={tipo}
                  onChange={(event) => setTipo(event.target.value)}
                  className="h-12 w-full rounded-xl border border-slate-700 bg-slate-950/60 px-4"
                >
                  {TIPOS_MOVIMENTACAO.map((item) => (
                    <option key={item} value={item}>
                      {formatarLotacao(item)}
                    </option>
                  ))}
                </select>
              </Campo>

              <Campo titulo="Unidade de origem">
                <input
                  value={unidadeOrigem}
                  onChange={(event) => setUnidadeOrigem(event.target.value)}
                  className="h-12 w-full rounded-xl border border-slate-700 bg-slate-950/60 px-4"
                />
              </Campo>

              <Campo titulo="Setor de origem">
                <input
                  value={setorOrigem}
                  onChange={(event) => setSetorOrigem(event.target.value)}
                  className="h-12 w-full rounded-xl border border-slate-700 bg-slate-950/60 px-4"
                />
              </Campo>

              <Campo titulo="Unidade de destino">
                <input
                  value={unidadeDestino}
                  onChange={(event) => setUnidadeDestino(event.target.value)}
                  className="h-12 w-full rounded-xl border border-slate-700 bg-slate-950/60 px-4"
                />
              </Campo>

              <Campo titulo="Setor de destino">
                <input
                  value={setorDestino}
                  onChange={(event) => setSetorDestino(event.target.value)}
                  className="h-12 w-full rounded-xl border border-slate-700 bg-slate-950/60 px-4"
                />
              </Campo>

              <div className="md:col-span-2">
                <Campo titulo="Motivo">
                  <textarea
                    value={motivo}
                    onChange={(event) => setMotivo(event.target.value)}
                    rows={4}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950/60 p-4"
                  />
                </Campo>
              </div>

              <div className="flex justify-end md:col-span-2">
                <button
                  disabled={salvando}
                  onClick={() => void salvar()}
                  className="inline-flex items-center gap-2 rounded-xl bg-cyan-300 px-5 py-3 font-black text-slate-950 disabled:opacity-50"
                >
                  {salvando ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  Registrar solicitação
                </button>
              </div>
            </section>
          ) : null}

          {carregando ? (
            <div className="flex min-h-[300px] items-center justify-center">
              <Loader2 className="h-9 w-9 animate-spin text-cyan-300" />
            </div>
          ) : (
            <section className="space-y-4">
              {movimentacoes.map((item) => (
                <div
                  key={item.id}
                  className="rounded-2xl border border-slate-800 bg-[#061326] p-5"
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                      <h2 className="font-black">{item.guarda_nome}</h2>
                      <p className="mt-1 text-sm text-slate-400">
                        {formatarLotacao(item.tipo)} •{" "}
                        {item.unidade_origem || "Sem origem"} →{" "}
                        {item.unidade_destino || "Sem destino"}
                      </p>
                      <p className="mt-2 text-xs text-slate-500">
                        {item.motivo}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                      <span className="rounded-xl border border-cyan-400/20 px-3 py-2 text-xs font-black text-cyan-300">
                        {formatarLotacao(item.status)}
                      </span>

                      {podeGerenciar && item.status === "PENDENTE" ? (
                        <>
                          <button
                            onClick={() => void decidir(item, true)}
                            className="inline-flex items-center gap-2 rounded-xl bg-emerald-400 px-4 py-3 font-black text-slate-950"
                          >
                            <CheckCircle2 className="h-4 w-4" />
                            Aprovar
                          </button>
                          <button
                            onClick={() => void decidir(item, false)}
                            className="inline-flex items-center gap-2 rounded-xl bg-rose-400 px-4 py-3 font-black text-slate-950"
                          >
                            <XCircle className="h-4 w-4" />
                            Negar
                          </button>
                        </>
                      ) : null}
                    </div>
                  </div>
                </div>
              ))}

              {!movimentacoes.length ? (
                <div className="rounded-2xl border border-slate-800 bg-[#061326] p-16 text-center text-slate-500">
                  Nenhuma movimentação registrada.
                </div>
              ) : null}
            </section>
          )}
        </div>
      </main>
    </ProtecaoModulo>
  );
}

function Campo({
  titulo,
  children,
}: {
  titulo: string;
  children: React.ReactNode;
}) {
  return (
    <label className="space-y-2">
      <span className="text-xs font-black uppercase tracking-wider text-slate-400">
        {titulo}
      </span>
      {children}
    </label>
  );
}
