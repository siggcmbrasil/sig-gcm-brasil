"use client";

import Link from "next/link";
import { ChangeEvent, useCallback, useEffect, useMemo, useState } from "react";
import {
  Camera,
  CheckCircle2,
  Clock3,
  History,
  Loader2,
  LogIn,
  LogOut,
  MapPin,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";

import ProtecaoModulo from "@/components/ProtecaoModulo";
import { registrarAuditoria } from "@/lib/auditoria";
import { supabase } from "@/lib/supabase";
import {
  formatarDataHoraPonto,
  formatarMinutosPonto,
  hojeBahia,
  lerUsuarioPonto,
  obterLocalizacaoPonto,
  podeGerenciarPonto,
  reduzirFotoPonto,
} from "@/lib/pontoEletronico";

type Guarda = {
  id: number;
  nome: string;
  matricula: string | null;
};

type Registro = {
  id: number;
  data: string;
  entrada_em: string | null;
  saida_em: string | null;
  situacao: string;
  minutos_trabalhados: number | null;
  minutos_atraso: number | null;
  minutos_extras: number | null;
  justificativa: string | null;
  justificativa_status: string | null;
};

type Configuracao = {
  tolerancia_atraso_minutos: number;
  exigir_gps: boolean;
  exigir_foto_entrada: boolean;
  exigir_foto_saida: boolean;
  lancar_banco_horas: boolean;
};

export default function PontoEletronicoPage() {
  const [usuario] = useState(() => lerUsuarioPonto());
  const [guarda, setGuarda] = useState<Guarda | null>(null);
  const [registroAtual, setRegistroAtual] = useState<Registro | null>(null);
  const [historico, setHistorico] = useState<Registro[]>([]);
  const [config, setConfig] = useState<Configuracao>({
    tolerancia_atraso_minutos: 10,
    exigir_gps: true,
    exigir_foto_entrada: false,
    exigir_foto_saida: false,
    lancar_banco_horas: true,
  });
  const [foto, setFoto] = useState("");
  const [observacao, setObservacao] = useState("");
  const [justificativa, setJustificativa] = useState("");
  const [carregando, setCarregando] = useState(true);
  const [registrando, setRegistrando] = useState(false);
  const [erro, setErro] = useState("");
  const [mensagem, setMensagem] = useState("");

  const gerencia = usuario ? podeGerenciarPonto(usuario.perfil) : false;

  const carregar = useCallback(async () => {
    if (!usuario?.municipio_id) {
      setErro("Sessão ou município não identificado.");
      setCarregando(false);
      return;
    }

    setCarregando(true);
    setErro("");

    try {
      const { data: guardaDados, error: guardaErro } = await supabase
        .from("guardas")
        .select("id,nome,matricula")
        .eq("municipio_id", usuario.municipio_id)
        .or(
          `usuario_id.eq.${Number(usuario.id)},matricula.eq.${usuario.matricula || "__SEM__"}`
        )
        .maybeSingle();

      if (guardaErro) throw guardaErro;
      if (!guardaDados) {
        throw new Error("Seu usuário não está vinculado a um cadastro de guarda.");
      }

      setGuarda(guardaDados as Guarda);

      const [pontosResposta, configResposta] = await Promise.all([
        supabase
          .from("ponto_eletronico")
          .select("*")
          .eq("municipio_id", usuario.municipio_id)
          .eq("guarda_id", guardaDados.id)
          .order("data", { ascending: false })
          .order("id", { ascending: false })
          .limit(30),
        supabase
          .from("ponto_eletronico_configuracao")
          .select("*")
          .eq("municipio_id", usuario.municipio_id)
          .maybeSingle(),
      ]);

      if (pontosResposta.error) {
        if (
          pontosResposta.error.code === "42P01" ||
          pontosResposta.error.code === "42703"
        ) {
          throw new Error("Execute primeiro supabase/PONTO_ELETRONICO.sql.");
        }
        throw pontosResposta.error;
      }

      const pontos = (pontosResposta.data as Registro[] | null) || [];
      setHistorico(pontos);
      setRegistroAtual(
        pontos.find(
          (item) => item.data === hojeBahia() && item.situacao === "ABERTO"
        ) || null
      );

      if (configResposta.data) {
        setConfig(configResposta.data as Configuracao);
      }
    } catch (error) {
      setErro(
        error instanceof Error
          ? error.message
          : "Não foi possível carregar o ponto eletrônico."
      );
    } finally {
      setCarregando(false);
    }
  }, [usuario]);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  async function selecionarFoto(evento: ChangeEvent<HTMLInputElement>) {
    const arquivo = evento.target.files?.[0];
    if (!arquivo) return;

    try {
      setFoto(await reduzirFotoPonto(arquivo));
    } catch (error) {
      setErro(error instanceof Error ? error.message : "Foto inválida.");
    }
  }

  async function registrar(tipo: "ENTRADA" | "SAIDA") {
    if (!usuario?.municipio_id || !guarda) return;

    setRegistrando(true);
    setErro("");
    setMensagem("");

    try {
      if (
        tipo === "ENTRADA" &&
        config.exigir_foto_entrada &&
        !foto
      ) {
        throw new Error("A foto é obrigatória para registrar a entrada.");
      }

      if (
        tipo === "SAIDA" &&
        config.exigir_foto_saida &&
        !foto
      ) {
        throw new Error("A foto é obrigatória para registrar a saída.");
      }

      const localizacao = config.exigir_gps
        ? await obterLocalizacaoPonto()
        : null;

      if (tipo === "ENTRADA") {
        if (registroAtual) {
          throw new Error("Já existe uma entrada aberta para hoje.");
        }

        const { data, error } = await supabase
          .from("ponto_eletronico")
          .insert({
            municipio_id: usuario.municipio_id,
            guarda_id: guarda.id,
            guarda_nome: guarda.nome,
            matricula: guarda.matricula,
            data: hojeBahia(),
            entrada_em: new Date().toISOString(),
            entrada_latitude: localizacao?.latitude || null,
            entrada_longitude: localizacao?.longitude || null,
            entrada_precisao_metros: localizacao?.precisao || null,
            entrada_foto: foto || null,
            tolerancia_minutos: config.tolerancia_atraso_minutos,
            situacao: "ABERTO",
            origem: "CELULAR",
            observacao: observacao.trim() || null,
            criado_por: Number(usuario.id),
            criado_por_nome: usuario.nome,
          })
          .select("id")
          .single();

        if (error) throw error;

        await registrarAuditoria({
          modulo: "Ponto Eletrônico",
          acao: "REGISTRAR_ENTRADA",
          tabela: "ponto_eletronico",
          registro_id: data.id,
          descricao: `Entrada registrada por ${guarda.nome}.`,
          detalhes: localizacao,
        });

        setMensagem("Entrada registrada com sucesso.");
      } else {
        if (!registroAtual) {
          throw new Error("Nenhuma entrada aberta para registrar a saída.");
        }

        const { error } = await supabase
          .from("ponto_eletronico")
          .update({
            saida_em: new Date().toISOString(),
            saida_latitude: localizacao?.latitude || null,
            saida_longitude: localizacao?.longitude || null,
            saida_precisao_metros: localizacao?.precisao || null,
            saida_foto: foto || null,
            observacao: observacao.trim() || null,
            situacao: "FECHADO",
          })
          .eq("id", registroAtual.id)
          .eq("municipio_id", usuario.municipio_id);

        if (error) throw error;

        await registrarAuditoria({
          modulo: "Ponto Eletrônico",
          acao: "REGISTRAR_SAIDA",
          tabela: "ponto_eletronico",
          registro_id: registroAtual.id,
          descricao: `Saída registrada por ${guarda.nome}.`,
          detalhes: localizacao,
        });

        setMensagem("Saída registrada com sucesso.");
      }

      setFoto("");
      setObservacao("");
      await carregar();
    } catch (error) {
      setErro(
        error instanceof Error ? error.message : "Não foi possível registrar."
      );
    } finally {
      setRegistrando(false);
    }
  }

  async function enviarJustificativa() {
    if (!usuario?.municipio_id || !registroAtual?.id || !justificativa.trim()) {
      setErro("Informe a justificativa.");
      return;
    }

    const { error } = await supabase
      .from("ponto_eletronico")
      .update({
        justificativa: justificativa.trim(),
        justificativa_status: "PENDENTE",
      })
      .eq("id", registroAtual.id)
      .eq("municipio_id", usuario.municipio_id);

    if (error) {
      setErro(error.message);
      return;
    }

    setJustificativa("");
    setMensagem("Justificativa enviada.");
    await carregar();
  }

  const totalMes = useMemo(
    () =>
      historico.reduce(
        (total, item) => total + Number(item.minutos_trabalhados || 0),
        0
      ),
    [historico]
  );

  if (carregando) {
    return (
      <main className="flex min-h-[70vh] items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-cyan-300" />
      </main>
    );
  }

  return (
    <ProtecaoModulo modulo="guardas">
      <main className="min-h-screen bg-[#020b1c] px-4 py-5 text-white lg:px-7">
        <div className="mx-auto max-w-[1500px] space-y-5">
          <header className="rounded-3xl border border-cyan-400/15 bg-gradient-to-br from-[#07182f] to-[#020b1c] p-5 lg:p-7">
            <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.22em] text-cyan-300">
                  Controle de frequência
                </p>
                <h1 className="mt-1 text-2xl font-black lg:text-3xl">
                  Ponto Eletrônico
                </h1>
                <p className="mt-2 text-sm text-slate-400">
                  {guarda?.nome} • {guarda?.matricula || "Sem matrícula"}
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => void carregar()}
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-700 px-4 py-3 text-sm font-black"
                >
                  <RefreshCw className="h-4 w-4" />
                  Atualizar
                </button>

                {gerencia ? (
                  <Link
                    href="/sistema/ponto-eletronico/gestao"
                    className="inline-flex items-center gap-2 rounded-xl bg-cyan-400 px-4 py-3 text-sm font-black text-slate-950"
                  >
                    <ShieldCheck className="h-4 w-4" />
                    Gestão
                  </Link>
                ) : null}
              </div>
            </div>
          </header>

          {erro ? (
            <div className="rounded-2xl border border-rose-400/25 bg-rose-400/10 p-4 text-sm text-rose-200">
              {erro}
            </div>
          ) : null}

          {mensagem ? (
            <div className="rounded-2xl border border-emerald-400/25 bg-emerald-400/10 p-4 text-sm text-emerald-200">
              {mensagem}
            </div>
          ) : null}

          <section className="grid gap-4 md:grid-cols-3">
            <Metrica
              titulo="Situação atual"
              valor={registroAtual ? "Entrada aberta" : "Sem ponto aberto"}
              icone={Clock3}
            />
            <Metrica
              titulo="Entrada"
              valor={formatarDataHoraPonto(registroAtual?.entrada_em)}
              icone={LogIn}
            />
            <Metrica
              titulo="Total recente"
              valor={formatarMinutosPonto(totalMes)}
              icone={History}
            />
          </section>

          <section className="rounded-3xl border border-slate-800 bg-[#061326] p-5 lg:p-7">
            <div className="grid gap-5 xl:grid-cols-[1fr_380px]">
              <div>
                <h2 className="text-xl font-black">
                  {registroAtual ? "Registrar saída" : "Registrar entrada"}
                </h2>
                <p className="mt-2 text-sm text-slate-400">
                  O sistema registrará data, hora e localização do aparelho.
                </p>

                <label className="mt-5 block">
                  <span className="mb-2 block text-xs font-black uppercase tracking-wider text-slate-500">
                    Observação
                  </span>
                  <textarea
                    rows={4}
                    value={observacao}
                    onChange={(event) => setObservacao(event.target.value)}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950/60 p-4 outline-none"
                  />
                </label>

                <label className="mt-4 inline-flex cursor-pointer items-center gap-3 rounded-xl border border-slate-700 px-4 py-3 text-sm font-black">
                  <Camera className="h-5 w-5 text-cyan-300" />
                  {foto ? "Foto adicionada" : "Adicionar foto opcional"}
                  <input
                    type="file"
                    accept="image/*"
                    capture="user"
                    onChange={selecionarFoto}
                    className="hidden"
                  />
                </label>
              </div>

              <div className="flex flex-col justify-center rounded-2xl border border-cyan-400/20 bg-cyan-400/[0.05] p-5">
                <MapPin className="h-7 w-7 text-cyan-300" />
                <p className="mt-4 text-sm text-slate-300">
                  GPS {config.exigir_gps ? "obrigatório" : "opcional"}.
                  Tolerância de atraso: {config.tolerancia_atraso_minutos} minutos.
                </p>

                <button
                  onClick={() =>
                    void registrar(registroAtual ? "SAIDA" : "ENTRADA")
                  }
                  disabled={registrando}
                  className="mt-5 inline-flex items-center justify-center gap-2 rounded-xl bg-cyan-400 px-5 py-4 font-black text-slate-950 disabled:opacity-50"
                >
                  {registrando ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : registroAtual ? (
                    <LogOut className="h-5 w-5" />
                  ) : (
                    <LogIn className="h-5 w-5" />
                  )}
                  {registroAtual ? "Registrar saída" : "Registrar entrada"}
                </button>
              </div>
            </div>
          </section>

          {registroAtual && Number(registroAtual.minutos_atraso || 0) > 0 ? (
            <section className="rounded-2xl border border-amber-400/25 bg-amber-400/10 p-5">
              <h2 className="font-black text-amber-200">Justificar atraso</h2>
              <div className="mt-4 flex flex-col gap-3 md:flex-row">
                <input
                  value={justificativa}
                  onChange={(event) => setJustificativa(event.target.value)}
                  placeholder="Informe a justificativa..."
                  className="h-12 flex-1 rounded-xl border border-amber-400/20 bg-slate-950/50 px-4 outline-none"
                />
                <button
                  onClick={() => void enviarJustificativa()}
                  className="rounded-xl bg-amber-300 px-5 py-3 font-black text-slate-950"
                >
                  Enviar
                </button>
              </div>
            </section>
          ) : null}

          <section className="rounded-2xl border border-slate-800 bg-[#061326] p-5">
            <h2 className="font-black">Histórico recente</h2>

            <div className="mt-5 space-y-3">
              {historico.length === 0 ? (
                <p className="text-sm text-slate-500">Nenhum registro encontrado.</p>
              ) : (
                historico.map((item) => (
                  <article
                    key={item.id}
                    className="grid gap-4 rounded-xl border border-slate-800 bg-slate-950/40 p-4 md:grid-cols-5"
                  >
                    <Info titulo="Data" valor={item.data.split("-").reverse().join("/")} />
                    <Info titulo="Entrada" valor={formatarDataHoraPonto(item.entrada_em)} />
                    <Info titulo="Saída" valor={formatarDataHoraPonto(item.saida_em)} />
                    <Info titulo="Trabalhado" valor={formatarMinutosPonto(item.minutos_trabalhados)} />
                    <Info titulo="Situação" valor={item.situacao} />
                  </article>
                ))
              )}
            </div>
          </section>
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
  valor: string;
  icone: typeof Clock3;
}) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-[#061326] p-5">
      <Icone className="h-6 w-6 text-cyan-300" />
      <p className="mt-4 text-xs font-black uppercase tracking-wider text-slate-500">
        {titulo}
      </p>
      <p className="mt-1 font-black">{valor}</p>
    </div>
  );
}

function Info({ titulo, valor }: { titulo: string; valor: string }) {
  return (
    <div>
      <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">
        {titulo}
      </p>
      <p className="mt-1 text-sm font-black">{valor}</p>
    </div>
  );
}
