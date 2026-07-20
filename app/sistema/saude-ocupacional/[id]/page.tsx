"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  CalendarDays,
  FileText,
  HeartPulse,
  Loader2,
  LockKeyhole,
  Printer,
  ShieldAlert,
  Stethoscope,
} from "lucide-react";

import ProtecaoModulo from "@/components/ProtecaoModulo";
import { registrarAuditoria } from "@/lib/auditoria";
import {
  formatarDataSaude,
  formatarSaude,
  lerUsuarioSaude,
  podeVerDadosSigilosos,
} from "@/lib/saudeOcupacional";
import { supabase } from "@/lib/supabase";

type Prontuario = {
  id: number;
  guarda_nome: string;
  matricula: string | null;
  situacao_aptidao: string;
  data_ultima_avaliacao: string | null;
  data_proxima_avaliacao: string | null;
  possui_restricao: boolean;
  readaptado: boolean;
  afastado: boolean;
  observacao_funcional: string | null;
  status: string;
};

type Exame = {
  id: number;
  tipo_exame: string;
  data_exame: string;
  validade_ate: string | null;
  resultado_aptidao: string;
  aso_numero: string | null;
  profissional_nome: string | null;
  status: string;
};

type Restricao = {
  id: number;
  descricao_funcional: string;
  data_inicio: string;
  data_fim: string | null;
  impede_atividade_armada: boolean;
  impede_atividade_operacional: boolean;
  status: string;
};

export default function ProntuarioOcupacionalPage() {
  const params = useParams<{ id: string }>();
  const id = Number(params.id);
  const [usuario] = useState(() => lerUsuarioSaude());
  const [prontuario, setProntuario] = useState<Prontuario | null>(null);
  const [exames, setExames] = useState<Exame[]>([]);
  const [restricoes, setRestricoes] = useState<Restricao[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  const sigiloso = usuario ? podeVerDadosSigilosos(usuario.perfil) : false;

  const carregar = useCallback(async () => {
    if (!usuario?.municipio_id || !id) return;

    const [prontuarioResp, examesResp, restricoesResp] = await Promise.all([
      supabase
        .from("saude_ocupacional_prontuarios")
        .select("*")
        .eq("id", id)
        .eq("municipio_id", usuario.municipio_id)
        .single(),
      supabase
        .from("saude_ocupacional_exames")
        .select("id,tipo_exame,data_exame,validade_ate,resultado_aptidao,aso_numero,profissional_nome,status")
        .eq("prontuario_id", id)
        .eq("municipio_id", usuario.municipio_id)
        .order("data_exame", { ascending: false }),
      supabase
        .from("saude_ocupacional_restricoes")
        .select("id,descricao_funcional,data_inicio,data_fim,impede_atividade_armada,impede_atividade_operacional,status")
        .eq("prontuario_id", id)
        .eq("municipio_id", usuario.municipio_id)
        .order("data_inicio", { ascending: false }),
    ]);

    if (prontuarioResp.error) setErro(prontuarioResp.error.message);
    setProntuario((prontuarioResp.data as Prontuario | null) || null);
    setExames((examesResp.data as Exame[] | null) || []);
    setRestricoes((restricoesResp.data as Restricao[] | null) || []);
    setCarregando(false);
  }, [id, usuario]);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  const restricoesAtivas = useMemo(
    () => restricoes.filter((item) => item.status === "ATIVA"),
    [restricoes]
  );

  async function imprimir() {
    await registrarAuditoria({
      modulo: "RH",
      acao: "IMPRIMIR",
      tabela: "saude_ocupacional_prontuarios",
      registro_id: id,
      descricao: "Impressão do prontuário funcional ocupacional.",
    });
    window.print();
  }

  if (carregando) {
    return <div className="flex min-h-screen items-center justify-center bg-[#020b1c]"><Loader2 className="h-9 w-9 animate-spin text-cyan-300" /></div>;
  }

  return (
    <ProtecaoModulo modulo="guardas">
      <main className="min-h-screen bg-[#020b1c] px-4 py-5 text-white print:bg-white print:text-black lg:px-7">
        <div className="mx-auto max-w-[1500px] space-y-5">
          <header className="rounded-3xl border border-cyan-400/15 bg-[#061326] p-5 print:border-black print:bg-white lg:p-7">
            <div className="flex items-center justify-between gap-4">
              <Link href="/sistema/saude-ocupacional" className="inline-flex items-center gap-2 text-sm font-black text-cyan-300 print:hidden">
                <ArrowLeft className="h-4 w-4" /> Voltar
              </Link>
              <button onClick={() => void imprimir()} className="inline-flex items-center gap-2 rounded-xl border border-cyan-400/25 px-4 py-3 text-sm font-black text-cyan-300 print:hidden">
                <Printer className="h-4 w-4" /> Imprimir/PDF
              </button>
            </div>

            {prontuario ? (
              <div className="mt-5">
                <p className="text-xs font-black uppercase text-cyan-300 print:text-black">{prontuario.matricula || "Sem matrícula"}</p>
                <h1 className="mt-1 text-2xl font-black">{prontuario.guarda_nome}</h1>
                <p className="mt-2 text-sm text-slate-400 print:text-black">
                  Situação funcional: {formatarSaude(prontuario.situacao_aptidao)}
                </p>
              </div>
            ) : null}
          </header>

          {erro ? <div className="rounded-2xl border border-rose-400/25 bg-rose-400/10 p-4 text-rose-200">{erro}</div> : null}

          {prontuario ? (
            <>
              <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <Card titulo="Aptidão" valor={formatarSaude(prontuario.situacao_aptidao)} icone={HeartPulse} />
                <Card titulo="Última avaliação" valor={formatarDataSaude(prontuario.data_ultima_avaliacao)} icone={CalendarDays} />
                <Card titulo="Próxima avaliação" valor={formatarDataSaude(prontuario.data_proxima_avaliacao)} icone={Stethoscope} />
                <Card titulo="Restrições ativas" valor={String(restricoesAtivas.length)} icone={ShieldAlert} />
              </section>

              {prontuario.observacao_funcional ? (
                <section className="rounded-2xl border border-amber-400/20 bg-amber-400/[0.06] p-5 print:border-black print:bg-white">
                  <h2 className="font-black">Orientação funcional</h2>
                  <p className="mt-2 text-sm text-amber-100 print:text-black">{prontuario.observacao_funcional}</p>
                </section>
              ) : null}

              <section className="grid gap-5 xl:grid-cols-2">
                <div className="rounded-2xl border border-slate-800 bg-[#061326] p-5 print:border-black print:bg-white">
                  <h2 className="font-black">Exames ocupacionais e ASO</h2>
                  <div className="mt-4 space-y-3">
                    {exames.map((item) => (
                      <article key={item.id} className="rounded-xl border border-slate-800 bg-slate-950/30 p-4 print:border-black print:bg-white">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-black">{formatarSaude(item.tipo_exame)}</p>
                            <p className="mt-1 text-xs text-slate-500 print:text-black">
                              {formatarDataSaude(item.data_exame)} • ASO {item.aso_numero || "não informado"}
                            </p>
                          </div>
                          <span className="rounded-lg border border-cyan-400/20 bg-cyan-400/10 px-3 py-2 text-[10px] font-black uppercase text-cyan-300 print:text-black">
                            {formatarSaude(item.resultado_aptidao)}
                          </span>
                        </div>
                        <p className="mt-3 text-xs text-slate-500 print:text-black">
                          Validade: {formatarDataSaude(item.validade_ate)} • Profissional: {item.profissional_nome || "não informado"}
                        </p>
                      </article>
                    ))}
                    {!exames.length ? <p className="py-10 text-center text-slate-500">Nenhum exame registrado.</p> : null}
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-800 bg-[#061326] p-5 print:border-black print:bg-white">
                  <h2 className="font-black">Restrições funcionais</h2>
                  <div className="mt-4 space-y-3">
                    {restricoes.map((item) => (
                      <article key={item.id} className="rounded-xl border border-slate-800 bg-slate-950/30 p-4 print:border-black print:bg-white">
                        <div className="flex items-start justify-between gap-3">
                          <p className="font-black">{item.descricao_funcional}</p>
                          <span className="rounded-lg border border-amber-400/20 bg-amber-400/10 px-3 py-2 text-[10px] font-black uppercase text-amber-200 print:text-black">
                            {formatarSaude(item.status)}
                          </span>
                        </div>
                        <p className="mt-2 text-xs text-slate-500 print:text-black">
                          {formatarDataSaude(item.data_inicio)} até {formatarDataSaude(item.data_fim)}
                        </p>
                        <div className="mt-3 flex flex-wrap gap-2 text-[10px] font-black uppercase">
                          {item.impede_atividade_armada ? <span className="rounded-lg border border-rose-400/20 px-2 py-1 text-rose-200 print:text-black">Sem atividade armada</span> : null}
                          {item.impede_atividade_operacional ? <span className="rounded-lg border border-rose-400/20 px-2 py-1 text-rose-200 print:text-black">Sem atividade operacional</span> : null}
                        </div>
                      </article>
                    ))}
                    {!restricoes.length ? <p className="py-10 text-center text-slate-500">Nenhuma restrição registrada.</p> : null}
                  </div>
                </div>
              </section>

              <section className="rounded-2xl border border-slate-800 bg-[#061326] p-5 print:border-black print:bg-white">
                <div className="flex items-start gap-3">
                  <LockKeyhole className="mt-0.5 h-5 w-5 text-cyan-300 print:text-black" />
                  <div>
                    <h2 className="font-black">Área clínica sigilosa</h2>
                    <p className="mt-1 text-sm text-slate-400 print:text-black">
                      {sigiloso
                        ? "Perfil autorizado. Registros clínicos, CID e pareceres médicos devem ser acessados somente quando indispensáveis."
                        : "Seu perfil não possui autorização para visualizar diagnósticos, CID ou pareceres clínicos."}
                    </p>
                  </div>
                </div>
              </section>
            </>
          ) : null}
        </div>
      </main>
    </ProtecaoModulo>
  );
}

function Card({ titulo, valor, icone: Icone }: { titulo: string; valor: string; icone: typeof HeartPulse }) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-[#061326] p-5 print:border-black print:bg-white">
      <Icone className="h-5 w-5 text-cyan-300 print:text-black" />
      <p className="mt-3 text-[10px] font-black uppercase text-slate-500 print:text-black">{titulo}</p>
      <p className="mt-1 font-black">{valor}</p>
    </div>
  );
}
