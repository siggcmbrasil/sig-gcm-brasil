"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  Clock3,
  Loader2,
  RefreshCw,
  Search,
  Settings,
  UserCheck,
  UserX,
  XCircle,
} from "lucide-react";

import ProtecaoModulo from "@/components/ProtecaoModulo";
import { registrarAuditoria } from "@/lib/auditoria";
import { supabase } from "@/lib/supabase";
import {
  formatarDataHoraPonto,
  formatarMinutosPonto,
  lerUsuarioPonto,
  normalizarPonto,
  podeGerenciarPonto,
} from "@/lib/pontoEletronico";

type Registro = {
  id: number;
  guarda_id: number;
  guarda_nome: string;
  matricula: string | null;
  data: string;
  entrada_em: string | null;
  saida_em: string | null;
  minutos_trabalhados: number | null;
  minutos_atraso: number | null;
  minutos_extras: number | null;
  minutos_debito: number | null;
  situacao: string;
  justificativa: string | null;
  justificativa_status: string | null;
  banco_horas_credito_id: number | null;
  banco_horas_debito_id: number | null;
};

export default function GestaoPontoPage() {
  const [usuario] = useState(() => lerUsuarioPonto());
  const [registros, setRegistros] = useState<Registro[]>([]);
  const [busca, setBusca] = useState("");
  const [filtro, setFiltro] = useState("TODOS");
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");

  const gerencia = usuario ? podeGerenciarPonto(usuario.perfil) : false;

  const carregar = useCallback(async () => {
    if (!usuario?.municipio_id || !gerencia) return;

    setCarregando(true);
    setErro("");

    try {
      const { data, error } = await supabase
        .from("ponto_eletronico")
        .select("*")
        .eq("municipio_id", usuario.municipio_id)
        .order("data", { ascending: false })
        .order("id", { ascending: false })
        .limit(300);

      if (error) throw error;
      setRegistros((data as Registro[] | null) || []);
    } catch (error) {
      setErro(
        error instanceof Error
          ? error.message
          : "Não foi possível carregar a frequência."
      );
    } finally {
      setCarregando(false);
    }
  }, [gerencia, usuario]);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  const metricas = useMemo(
    () => ({
      abertos: registros.filter((item) => item.situacao === "ABERTO").length,
      atrasos: registros.filter((item) => Number(item.minutos_atraso || 0) > 0).length,
      justificativas: registros.filter(
        (item) => normalizarPonto(item.justificativa_status) === "PENDENTE"
      ).length,
      fechados: registros.filter((item) => item.situacao === "FECHADO").length,
    }),
    [registros]
  );

  const filtrados = useMemo(() => {
    const termo = normalizarPonto(busca);
    return registros.filter((item) => {
      const corresponde =
        !termo ||
        normalizarPonto(
          `${item.guarda_nome} ${item.matricula || ""} ${item.data}`
        ).includes(termo);

      const correspondeFiltro =
        filtro === "TODOS" ||
        (filtro === "ATRASOS" && Number(item.minutos_atraso || 0) > 0) ||
        (filtro === "JUSTIFICATIVAS" &&
          normalizarPonto(item.justificativa_status) === "PENDENTE") ||
        item.situacao === filtro;

      return corresponde && correspondeFiltro;
    });
  }, [busca, filtro, registros]);

  async function analisar(
    registro: Registro,
    status: "APROVADO" | "NEGADO"
  ) {
    if (!usuario?.municipio_id) return;

    const observacao =
      window.prompt(
        status === "APROVADO"
          ? "Observação da aprovação:"
          : "Motivo da negativa:"
      ) || "";

    setSalvando(true);
    setErro("");

    try {
      const { error } = await supabase
        .from("ponto_eletronico")
        .update({
          justificativa_status: status,
          justificativa_analisada_por: Number(usuario.id),
          justificativa_analisada_por_nome: usuario.nome,
          justificativa_analisada_em: new Date().toISOString(),
          observacao: observacao || null,
          minutos_atraso: status === "APROVADO" ? 0 : registro.minutos_atraso,
        })
        .eq("id", registro.id)
        .eq("municipio_id", usuario.municipio_id);

      if (error) throw error;

      await registrarAuditoria({
        modulo: "Ponto Eletrônico",
        acao: `JUSTIFICATIVA_${status}`,
        tabela: "ponto_eletronico",
        registro_id: registro.id,
        descricao: `${status}: justificativa de ${registro.guarda_nome}.`,
      });

      await carregar();
    } catch (error) {
      setErro(error instanceof Error ? error.message : "Não foi possível analisar.");
    } finally {
      setSalvando(false);
    }
  }

  async function lancarBancoHoras(registro: Registro) {
    if (!usuario?.municipio_id) return;

    setSalvando(true);
    setErro("");

    try {
      let creditoId = registro.banco_horas_credito_id;
      let debitoId = registro.banco_horas_debito_id;

      if (Number(registro.minutos_extras || 0) > 0 && !creditoId) {
        const { data, error } = await supabase
          .from("banco_horas_guardas")
          .insert({
            municipio_id: usuario.municipio_id,
            guarda_id: registro.guarda_id,
            tipo: "CREDITO",
            categoria: "PONTO_ELETRONICO",
            data: registro.data,
            horas: Number((Number(registro.minutos_extras) / 60).toFixed(2)),
            motivo: "Horas extras apuradas pelo Ponto Eletrônico",
            observacoes: `Registro de ${registro.data}`,
            origem: "PONTO_ELETRONICO",
            referencia_id: registro.id,
            criado_por: Number(usuario.id),
            criado_por_nome: usuario.nome,
          })
          .select("id")
          .single();

        if (error) throw error;
        creditoId = data.id;
      }

      if (
        Number(registro.minutos_debito || 0) > 0 &&
        normalizarPonto(registro.justificativa_status) !== "APROVADO" &&
        !debitoId
      ) {
        const { data, error } = await supabase
          .from("banco_horas_guardas")
          .insert({
            municipio_id: usuario.municipio_id,
            guarda_id: registro.guarda_id,
            tipo: "DEBITO",
            categoria: "PONTO_ELETRONICO",
            data: registro.data,
            horas: Number((Number(registro.minutos_debito) / 60).toFixed(2)),
            motivo: "Débito de jornada apurado pelo Ponto Eletrônico",
            observacoes: `Registro de ${registro.data}`,
            origem: "PONTO_ELETRONICO",
            referencia_id: registro.id,
            criado_por: Number(usuario.id),
            criado_por_nome: usuario.nome,
          })
          .select("id")
          .single();

        if (error) throw error;
        debitoId = data.id;
      }

      const { error } = await supabase
        .from("ponto_eletronico")
        .update({
          banco_horas_credito_id: creditoId || null,
          banco_horas_debito_id: debitoId || null,
        })
        .eq("id", registro.id)
        .eq("municipio_id", usuario.municipio_id);

      if (error) throw error;

      await registrarAuditoria({
        modulo: "Ponto Eletrônico",
        acao: "INTEGRAR_BANCO_HORAS",
        tabela: "ponto_eletronico",
        registro_id: registro.id,
        descricao: `Frequência de ${registro.guarda_nome} integrada ao Banco de Horas.`,
      });

      await carregar();
    } catch (error) {
      setErro(
        error instanceof Error
          ? error.message
          : "Não foi possível lançar no Banco de Horas."
      );
    } finally {
      setSalvando(false);
    }
  }

  if (!gerencia) {
    return (
      <main className="min-h-screen bg-[#020b1c] p-8 text-white">
        Acesso restrito ao comando e à administração.
      </main>
    );
  }

  return (
    <ProtecaoModulo modulo="guardas">
      <main className="min-h-screen bg-[#020b1c] px-4 py-5 text-white lg:px-7">
        <div className="mx-auto max-w-[1700px] space-y-5">
          <header className="rounded-3xl border border-cyan-400/15 bg-gradient-to-br from-[#07182f] to-[#020b1c] p-5 lg:p-7">
            <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.22em] text-cyan-300">
                  Gestão de frequência
                </p>
                <h1 className="mt-1 text-2xl font-black lg:text-3xl">
                  Ponto Eletrônico
                </h1>
                <p className="mt-2 text-sm text-slate-400">
                  Jornada, atrasos, justificativas e integração com Banco de Horas.
                </p>
              </div>

              <button
                onClick={() => void carregar()}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-700 px-4 py-3 text-sm font-black"
              >
                <RefreshCw className="h-4 w-4" />
                Atualizar
              </button>
            </div>
          </header>

          {erro ? (
            <div className="rounded-2xl border border-rose-400/25 bg-rose-400/10 p-4 text-sm text-rose-200">
              {erro}
            </div>
          ) : null}

          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Metrica titulo="Pontos abertos" valor={metricas.abertos} icone={Clock3} />
            <Metrica titulo="Atrasos" valor={metricas.atrasos} icone={UserX} />
            <Metrica titulo="Justificativas" valor={metricas.justificativas} icone={Settings} />
            <Metrica titulo="Fechados" valor={metricas.fechados} icone={UserCheck} />
          </section>

          <section className="rounded-2xl border border-slate-800 bg-[#061326] p-4">
            <div className="grid gap-3 lg:grid-cols-[1fr_auto]">
              <label className="flex items-center gap-3 rounded-xl border border-slate-700 bg-slate-950/50 px-4">
                <Search className="h-4 w-4 text-slate-500" />
                <input
                  value={busca}
                  onChange={(event) => setBusca(event.target.value)}
                  placeholder="Buscar servidor, matrícula ou data..."
                  className="h-12 w-full bg-transparent outline-none"
                />
              </label>

              <div className="flex gap-2 overflow-x-auto">
                {["TODOS", "ABERTO", "FECHADO", "ATRASOS", "JUSTIFICATIVAS"].map(
                  (item) => (
                    <button
                      key={item}
                      onClick={() => setFiltro(item)}
                      className={`whitespace-nowrap rounded-xl border px-3 py-2 text-xs font-black ${
                        filtro === item
                          ? "border-cyan-400/30 bg-cyan-400/10 text-cyan-300"
                          : "border-slate-700 text-slate-400"
                      }`}
                    >
                      {item}
                    </button>
                  )
                )}
              </div>
            </div>
          </section>

          {carregando ? (
            <div className="flex min-h-[320px] items-center justify-center">
              <Loader2 className="h-10 w-10 animate-spin text-cyan-300" />
            </div>
          ) : (
            <section className="space-y-4">
              {filtrados.map((item) => (
                <article
                  key={item.id}
                  className="rounded-2xl border border-slate-800 bg-[#061326] p-5"
                >
                  <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
                    <div>
                      <h2 className="font-black">{item.guarda_nome}</h2>
                      <p className="mt-1 text-xs text-slate-500">
                        {item.matricula || "Sem matrícula"} •{" "}
                        {item.data.split("-").reverse().join("/")}
                      </p>
                    </div>

                    <span className="rounded-full border border-cyan-400/25 bg-cyan-400/10 px-3 py-1 text-xs font-black text-cyan-300">
                      {item.situacao}
                    </span>
                  </div>

                  <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
                    <Info titulo="Entrada" valor={formatarDataHoraPonto(item.entrada_em)} />
                    <Info titulo="Saída" valor={formatarDataHoraPonto(item.saida_em)} />
                    <Info titulo="Trabalhado" valor={formatarMinutosPonto(item.minutos_trabalhados)} />
                    <Info titulo="Atraso" valor={formatarMinutosPonto(item.minutos_atraso)} />
                    <Info titulo="Extras" valor={formatarMinutosPonto(item.minutos_extras)} />
                    <Info titulo="Débito" valor={formatarMinutosPonto(item.minutos_debito)} />
                  </div>

                  {item.justificativa ? (
                    <div className="mt-4 rounded-xl border border-amber-400/20 bg-amber-400/10 p-4">
                      <p className="text-xs font-black uppercase tracking-wider text-amber-300">
                        Justificativa • {item.justificativa_status || "PENDENTE"}
                      </p>
                      <p className="mt-2 text-sm text-slate-200">
                        {item.justificativa}
                      </p>

                      {normalizarPonto(item.justificativa_status) === "PENDENTE" ? (
                        <div className="mt-4 flex gap-3">
                          <button
                            onClick={() => void analisar(item, "APROVADO")}
                            disabled={salvando}
                            className="inline-flex items-center gap-2 rounded-xl bg-emerald-400 px-4 py-2 text-xs font-black text-slate-950"
                          >
                            <CheckCircle2 className="h-4 w-4" />
                            Aprovar
                          </button>
                          <button
                            onClick={() => void analisar(item, "NEGADO")}
                            disabled={salvando}
                            className="inline-flex items-center gap-2 rounded-xl border border-rose-400/25 bg-rose-400/10 px-4 py-2 text-xs font-black text-rose-300"
                          >
                            <XCircle className="h-4 w-4" />
                            Negar
                          </button>
                        </div>
                      ) : null}
                    </div>
                  ) : null}

                  {item.situacao === "FECHADO" ? (
                    <button
                      onClick={() => void lancarBancoHoras(item)}
                      disabled={salvando}
                      className="mt-4 rounded-xl bg-cyan-400 px-4 py-3 text-sm font-black text-slate-950 disabled:opacity-50"
                    >
                      Integrar com Banco de Horas
                    </button>
                  ) : null}
                </article>
              ))}
            </section>
          )}
        </div>
      </main>
    </ProtecaoModulo>
  );
}

function Metrica({
  titulo,
  valor,
  icone: Icone,
}: {
  titulo: string;
  valor: number;
  icone: typeof Clock3;
}) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-[#061326] p-5">
      <Icone className="h-6 w-6 text-cyan-300" />
      <p className="mt-4 text-xs font-black uppercase tracking-wider text-slate-500">
        {titulo}
      </p>
      <p className="mt-1 text-2xl font-black">{valor}</p>
    </div>
  );
}

function Info({ titulo, valor }: { titulo: string; valor: string }) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-3">
      <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">
        {titulo}
      </p>
      <p className="mt-1 text-sm font-black">{valor}</p>
    </div>
  );
}
