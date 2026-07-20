"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  BadgeCheck,
  CalendarDays,
  CarFront,
  CheckCircle2,
  Clock3,
  FileText,
  ClipboardList,
  History,
  Loader2,
  LogIn,
  LogOut,
  MapPin,
  PhoneCall,
  RefreshCw,
  Shield,
  Users,
} from "lucide-react";

import { supabase } from "@/lib/supabase";
import { registrarAuditoria } from "@/lib/auditoria";
import {
  lerMunicipioContextoLocal,
  obterMunicipioIdEfetivo,
} from "@/lib/contextoMunicipio";

type UsuarioLocal = {
  id: string | number;
  nome: string;
  email?: string;
  matricula?: string;
  perfil: string;
  municipio_id?: number;
};

type Guarda = {
  id: number;
  nome: string;
  matricula: string | null;
};

type Escala = {
  id: number;
  data_servico: string;
  guarda_id: number | null;
  guarda_nome: string;
  matricula: string | null;
  turno: string | null;
  equipe: string | null;
  viatura: string | null;
  funcao: string | null;
  observacao: string | null;
};

type Chamado = {
  id: number;
  protocolo: string | null;
  tipo: string | null;
  local: string | null;
  prioridade: string | null;
  status: string | null;
  atendido_por: string | null;
  criado_em: string | null;
};

type Ocorrencia = {
  id: number;
  protocolo: string | null;
  tipo: string | null;
  local: string | null;
  status: string | null;
  data: string | null;
  hora: string | null;
};

type OrdemPlantao = {
  id: number;
  numero: string;
  titulo: string;
  missao: string;
  prioridade: string;
  status: string;
  data_inicio: string;
  hora_inicio: string | null;
  local: string | null;
  equipe: string | null;
  ciencia_status: string | null;
};

type RegistroPlantao = {
  id: number;
  tipo: "CHECK_IN" | "CHECK_OUT";
  registrado_em: string;
  latitude: number | null;
  longitude: number | null;
  observacao: string | null;
};

type EstadoPagina = {
  guarda: Guarda | null;
  escalaHoje: Escala | null;
  equipe: Escala[];
  chamados: Chamado[];
  ocorrencias: Ocorrencia[];
  registros: RegistroPlantao[];
  ordens: OrdemPlantao[];
};

const ESTADO_INICIAL: EstadoPagina = {
  guarda: null,
  escalaHoje: null,
  equipe: [],
  chamados: [],
  ocorrencias: [],
  registros: [],
  ordens: [],
};

function dataBahia() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Bahia",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

function normalizar(valor: unknown) {
  return String(valor || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toUpperCase();
}

function lerUsuario(): UsuarioLocal | null {
  if (typeof window === "undefined") return null;

  try {
    const salvo = localStorage.getItem("usuarioLogado");
    if (!salvo) return null;

    const usuario = JSON.parse(salvo) as UsuarioLocal;
    const municipioId = obterMunicipioIdEfetivo({
      perfil: usuario.perfil,
      municipioIdUsuario: usuario.municipio_id,
    });

    if (!usuario.id || !municipioId) return null;

    return {
      ...usuario,
      municipio_id: municipioId,
      perfil: normalizar(usuario.perfil),
    };
  } catch {
    return null;
  }
}

function formatarDataHora(valor: string | null | undefined) {
  if (!valor) return "--";
  const data = new Date(valor);
  if (Number.isNaN(data.getTime())) return valor;

  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Bahia",
    dateStyle: "short",
    timeStyle: "short",
  }).format(data);
}

export default function MeuPlantaoPage() {
  const [usuario] = useState<UsuarioLocal | null>(() => lerUsuario());
  const [dados, setDados] = useState<EstadoPagina>(ESTADO_INICIAL);
  const [carregando, setCarregando] = useState(true);
  const [atualizando, setAtualizando] = useState(false);
  const [registrando, setRegistrando] = useState(false);
  const [erro, setErro] = useState("");

  const municipioId = usuario?.municipio_id;
  const hoje = dataBahia();

  const carregar = useCallback(async (silencioso = false) => {
    if (!usuario || !municipioId) {
      setErro("Sessão ou município não identificado.");
      setCarregando(false);
      return;
    }

    silencioso ? setAtualizando(true) : setCarregando(true);
    setErro("");

    try {
      let guarda: Guarda | null = null;

      if (usuario.matricula) {
        const resposta = await supabase
          .from("guardas")
          .select("id,nome,matricula")
          .eq("municipio_id", municipioId)
          .eq("matricula", usuario.matricula)
          .maybeSingle();
        guarda = (resposta.data as Guarda | null) || null;
      }

      if (!guarda) {
        const resposta = await supabase
          .from("guardas")
          .select("id,nome,matricula")
          .eq("municipio_id", municipioId)
          .ilike("nome", usuario.nome)
          .maybeSingle();
        guarda = (resposta.data as Guarda | null) || null;
      }

      let escalaHoje: Escala | null = null;
      if (guarda) {
        const resposta = await supabase
          .from("escalas_servico")
          .select("id,data_servico,guarda_id,guarda_nome,matricula,turno,equipe,viatura,funcao,observacao")
          .eq("municipio_id", municipioId)
          .eq("data_servico", hoje)
          .eq("guarda_id", guarda.id)
          .maybeSingle();
        escalaHoje = (resposta.data as Escala | null) || null;
      }

      if (!escalaHoje) {
        let consulta = supabase
          .from("escalas_servico")
          .select("id,data_servico,guarda_id,guarda_nome,matricula,turno,equipe,viatura,funcao,observacao")
          .eq("municipio_id", municipioId)
          .eq("data_servico", hoje);

        consulta = usuario.matricula
          ? consulta.eq("matricula", usuario.matricula)
          : consulta.ilike("guarda_nome", usuario.nome);

        const resposta = await consulta.maybeSingle();
        escalaHoje = (resposta.data as Escala | null) || null;
      }

      const [equipeResposta, chamadosResposta, ocorrenciasResposta, registrosResposta] =
        await Promise.all([
          escalaHoje?.equipe
            ? supabase
                .from("escalas_servico")
                .select("id,data_servico,guarda_id,guarda_nome,matricula,turno,equipe,viatura,funcao,observacao")
                .eq("municipio_id", municipioId)
                .eq("data_servico", hoje)
                .eq("equipe", escalaHoje.equipe)
                .order("funcao")
            : Promise.resolve({ data: [], error: null }),

          supabase
            .from("chamados")
            .select("id,protocolo,tipo,local,prioridade,status,atendido_por,criado_em")
            .eq("municipio_id", municipioId)
            .or(`atendido_por.ilike.%${usuario.nome}%,status.eq.Aberto,status.eq.Em Atendimento`)
            .order("id", { ascending: false })
            .limit(8),

          supabase
            .from("ocorrencias")
            .select("id,protocolo,tipo,local,status,data,hora")
            .eq("municipio_id", municipioId)
            .eq("data", hoje)
            .order("id", { ascending: false })
            .limit(8),

          supabase
            .from("meu_plantao_registros")
            .select("id,tipo,registrado_em,latitude,longitude,observacao")
            .eq("municipio_id", municipioId)
            .eq("usuario_id", Number(usuario.id))
            .eq("data_servico", hoje)
            .order("registrado_em", { ascending: false }),
        ]);

      if (registrosResposta.error && registrosResposta.error.code !== "42P01") {
        console.error("Erro nos registros de plantão:", registrosResposta.error);
      }

      let ordens: OrdemPlantao[] = [];
      if (guarda?.id) {
        const designadosResposta = await supabase
          .from("ordens_servico_designados")
          .select("ordem_servico_id,ciencia_status")
          .eq("municipio_id", municipioId)
          .eq("guarda_id", guarda.id);

        if (!designadosResposta.error && designadosResposta.data?.length) {
          const ids = designadosResposta.data.map((item) => item.ordem_servico_id);
          const ciencias = new Map(
            designadosResposta.data.map((item) => [item.ordem_servico_id, item.ciencia_status])
          );

          const ordensResposta = await supabase
            .from("ordens_servico")
            .select("id,numero,titulo,missao,prioridade,status,data_inicio,hora_inicio,local,equipe")
            .eq("municipio_id", municipioId)
            .in("id", ids)
            .in("status", ["PUBLICADA", "EM_ANDAMENTO"])
            .order("data_inicio", { ascending: true });

          if (!ordensResposta.error) {
            ordens = ((ordensResposta.data as Omit<OrdemPlantao, "ciencia_status">[] | null) || []).map(
              (item) => ({ ...item, ciencia_status: ciencias.get(item.id) || "PENDENTE" })
            );
          }
        }
      }

      setDados({
        guarda,
        escalaHoje,
        equipe: (equipeResposta.data as Escala[] | null) || [],
        chamados: (chamadosResposta.data as Chamado[] | null) || [],
        ocorrencias: (ocorrenciasResposta.data as Ocorrencia[] | null) || [],
        registros:
          registrosResposta.error?.code === "42P01"
            ? []
            : ((registrosResposta.data as RegistroPlantao[] | null) || []),
        ordens,
      });
    } catch (error) {
      console.error(error);
      setErro(error instanceof Error ? error.message : "Não foi possível carregar seu plantão.");
    } finally {
      setCarregando(false);
      setAtualizando(false);
    }
  }, [hoje, municipioId, usuario]);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  const ultimoCheckIn = useMemo(
    () => dados.registros.find((item) => item.tipo === "CHECK_IN"),
    [dados.registros]
  );

  const ultimoCheckOut = useMemo(
    () => dados.registros.find((item) => item.tipo === "CHECK_OUT"),
    [dados.registros]
  );

  const emServico = Boolean(ultimoCheckIn) && !ultimoCheckOut;

  async function registrar(tipo: "CHECK_IN" | "CHECK_OUT") {
    if (!usuario || !municipioId) return;
    if (!dados.escalaHoje) {
      alert("Não existe plantão cadastrado para você hoje.");
      return;
    }

    setRegistrando(true);

    try {
      let latitude: number | null = null;
      let longitude: number | null = null;

      if (navigator.geolocation) {
        try {
          const posicao = await new Promise<GeolocationPosition>((resolve, reject) =>
            navigator.geolocation.getCurrentPosition(resolve, reject, {
              enableHighAccuracy: true,
              timeout: 10000,
              maximumAge: 30000,
            })
          );
          latitude = posicao.coords.latitude;
          longitude = posicao.coords.longitude;
        } catch {
          // O registro continua permitido sem GPS quando o navegador não autoriza.
        }
      }

      const { error } = await supabase.from("meu_plantao_registros").insert({
        municipio_id: municipioId,
        usuario_id: Number(usuario.id),
        guarda_id: dados.guarda?.id || dados.escalaHoje.guarda_id,
        escala_id: dados.escalaHoje.id,
        data_servico: hoje,
        tipo,
        latitude,
        longitude,
      });

      if (error) {
        if (error.code === "42P01") {
          throw new Error("Execute primeiro o arquivo SQL incluído no pacote.");
        }
        throw error;
      }

      await registrarAuditoria({
        modulo: "Meu Plantão",
        acao: tipo,
        descricao: `${tipo === "CHECK_IN" ? "Iniciou" : "Encerrou"} o plantão de ${hoje}.`,
        tabela: "meu_plantao_registros",
        detalhes: {
          escala_id: dados.escalaHoje.id,
          guarda_id: dados.guarda?.id || dados.escalaHoje.guarda_id,
          latitude,
          longitude,
        },
      });

      await carregar(true);
    } catch (error) {
      alert(error instanceof Error ? error.message : "Erro ao registrar movimentação.");
    } finally {
      setRegistrando(false);
    }
  }

  if (carregando) {
    return (
      <main className="flex min-h-[70vh] items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto h-10 w-10 animate-spin text-cyan-300" />
          <p className="mt-4 text-slate-400">Carregando seu plantão...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#020b1c] px-4 py-5 text-white lg:px-7 lg:py-7">
      <div className="mx-auto w-full max-w-[1700px] space-y-5">
        <header className="rounded-3xl border border-cyan-400/15 bg-gradient-to-br from-[#07182f] to-[#020b1c] p-5 lg:p-7">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex items-start gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-cyan-400/25 bg-cyan-400/10 text-cyan-300">
                <Shield className="h-7 w-7" />
              </div>
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.22em] text-cyan-300">Central do Guarda</p>
                <h1 className="mt-1 text-2xl font-black lg:text-3xl">Meu Plantão</h1>
                <p className="mt-2 text-sm text-slate-400">
                  {usuario?.nome || "Guarda"} • {new Date(`${hoje}T12:00:00`).toLocaleDateString("pt-BR", { dateStyle: "full" })}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => void carregar(true)}
                disabled={atualizando}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-950/50 px-4 py-3 text-sm font-black text-slate-200 hover:border-cyan-400/30"
              >
                <RefreshCw className={`h-4 w-4 ${atualizando ? "animate-spin" : ""}`} />
                Atualizar
              </button>

              {!emServico ? (
                <button
                  onClick={() => void registrar("CHECK_IN")}
                  disabled={registrando || !dados.escalaHoje}
                  className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-3 text-sm font-black text-slate-950 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <LogIn className="h-4 w-4" />
                  Iniciar plantão
                </button>
              ) : (
                <button
                  onClick={() => void registrar("CHECK_OUT")}
                  disabled={registrando}
                  className="inline-flex items-center gap-2 rounded-xl bg-rose-500 px-4 py-3 text-sm font-black text-white disabled:opacity-50"
                >
                  <LogOut className="h-4 w-4" />
                  Encerrar plantão
                </button>
              )}
            </div>
          </div>
        </header>

        {erro ? <div className="rounded-2xl border border-rose-400/25 bg-rose-400/10 p-4 text-sm text-rose-200">{erro}</div> : null}

        {!dados.escalaHoje ? (
          <section className="rounded-3xl border border-dashed border-slate-700 bg-slate-950/35 p-10 text-center">
            <CalendarDays className="mx-auto h-12 w-12 text-slate-600" />
            <h2 className="mt-4 text-xl font-black">Nenhum plantão encontrado hoje</h2>
            <p className="mt-2 text-sm text-slate-500">Confira sua escala ou solicite a verificação ao comando.</p>
            <Link href="/sistema/escalas/permutas" className="mt-5 inline-flex items-center gap-2 rounded-xl border border-cyan-400/25 bg-cyan-400/10 px-4 py-3 text-sm font-black text-cyan-200">
              Abrir permutas <ArrowRight className="h-4 w-4" />
            </Link>
          </section>
        ) : (
          <>
            <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <InfoCard titulo="Horário" valor={dados.escalaHoje.turno || "Não informado"} icone={Clock3} />
              <InfoCard titulo="Guarnição" valor={dados.escalaHoje.equipe || "Não informada"} icone={Users} />
              <InfoCard titulo="Função" valor={dados.escalaHoje.funcao || "Não informada"} icone={BadgeCheck} />
              <InfoCard titulo="Viatura" valor={dados.escalaHoje.viatura || "Não vinculada"} icone={CarFront} />
            </section>

            <section className={`rounded-2xl border p-5 ${emServico ? "border-emerald-400/20 bg-emerald-400/[0.06]" : "border-amber-400/20 bg-amber-400/[0.06]"}`}>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs font-black uppercase tracking-wider text-slate-500">Situação pessoal</p>
                  <p className={`mt-1 text-lg font-black ${emServico ? "text-emerald-300" : "text-amber-300"}`}>
                    {emServico ? "EM SERVIÇO" : ultimoCheckOut ? "PLANTÃO ENCERRADO" : "AGUARDANDO CHECK-IN"}
                  </p>
                </div>
                <div className="text-sm text-slate-400">
                  {ultimoCheckIn ? `Entrada: ${formatarDataHora(ultimoCheckIn.registrado_em)}` : "Entrada ainda não registrada"}
                  {ultimoCheckOut ? ` • Saída: ${formatarDataHora(ultimoCheckOut.registrado_em)}` : ""}
                </div>
              </div>
            </section>

            <section className="grid items-start gap-4 xl:grid-cols-12">
              <Painel className="xl:col-span-7" titulo="Minha guarnição" subtitulo={`${dados.equipe.length} integrante(s) escalado(s)`} icone={Users}>
                <div className="grid gap-3 sm:grid-cols-2">
                  {dados.equipe.map((membro) => (
                    <div key={membro.id} className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4">
                      <p className="font-black text-white">{membro.guarda_nome}</p>
                      <p className="mt-1 text-sm text-cyan-300">{membro.funcao || "Sem função"}</p>
                      <p className="mt-2 text-xs text-slate-500">Matrícula: {membro.matricula || "Não informada"}</p>
                    </div>
                  ))}
                </div>
              </Painel>

              <Painel className="xl:col-span-5" titulo="Ordem do plantão" subtitulo="Orientação registrada na escala" icone={FileText}>
                <div className="min-h-[120px] rounded-2xl border border-slate-800 bg-slate-950/40 p-4 text-sm leading-relaxed text-slate-300">
                  {dados.escalaHoje.observacao || "Nenhuma orientação específica registrada para este plantão."}
                </div>
              </Painel>
            </section>

            <Painel titulo="Ordens de serviço" subtitulo="Missões publicadas ou em andamento designadas para você" icone={ClipboardList}>
              <ListaVaziaOuItens vazio={dados.ordens.length === 0} mensagem="Nenhuma ordem de serviço ativa foi designada para você.">
                {dados.ordens.map((ordem) => (
                  <Link
                    key={ordem.id}
                    href={`/sistema/ordens-servico/${ordem.id}`}
                    className="block rounded-2xl border border-slate-800 bg-slate-950/40 p-4 hover:border-cyan-400/25"
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <p className="text-xs font-black uppercase tracking-wider text-cyan-300">{ordem.numero}</p>
                        <p className="mt-1 font-black text-white">{ordem.titulo}</p>
                        <p className="mt-2 line-clamp-2 text-sm text-slate-400">{ordem.missao}</p>
                        <p className="mt-2 text-xs text-slate-500">{ordem.local || "Local não informado"} • {ordem.data_inicio} {ordem.hora_inicio?.slice(0, 5) || ""}</p>
                      </div>
                      <span className={`shrink-0 rounded-full border px-2.5 py-1 text-[10px] font-black ${
                        ordem.ciencia_status === "CIENTE"
                          ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-300"
                          : "border-amber-400/20 bg-amber-400/10 text-amber-300"
                      }`}>
                        {ordem.ciencia_status === "CIENTE" ? "CIENTE" : "CIÊNCIA PENDENTE"}
                      </span>
                    </div>
                  </Link>
                ))}
              </ListaVaziaOuItens>
            </Painel>

            <section className="grid items-start gap-4 xl:grid-cols-12">
              <Painel className="xl:col-span-6" titulo="Chamados do serviço" subtitulo="Abertos, em atendimento ou vinculados ao guarda" icone={PhoneCall}>
                <ListaVaziaOuItens vazio={dados.chamados.length === 0} mensagem="Nenhum chamado disponível neste momento.">
                  {dados.chamados.map((item) => (
                    <Link href="/sistema/chamados" key={item.id} className="block rounded-2xl border border-slate-800 bg-slate-950/40 p-4 hover:border-cyan-400/25">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-black text-white">{item.tipo || "Chamado operacional"}</p>
                          <p className="mt-1 truncate text-sm text-slate-400"><MapPin className="mr-1 inline h-3.5 w-3.5" />{item.local || "Local não informado"}</p>
                        </div>
                        <span className="shrink-0 rounded-full border border-amber-400/20 bg-amber-400/10 px-2 py-1 text-[10px] font-black text-amber-200">{item.status || "ABERTO"}</span>
                      </div>
                    </Link>
                  ))}
                </ListaVaziaOuItens>
              </Painel>

              <Painel className="xl:col-span-6" titulo="Ocorrências de hoje" subtitulo="Últimos registros operacionais do município" icone={Activity}>
                <ListaVaziaOuItens vazio={dados.ocorrencias.length === 0} mensagem="Nenhuma ocorrência registrada hoje.">
                  {dados.ocorrencias.map((item) => (
                    <Link href={`/sistema/ocorrencias/${item.id}`} key={item.id} className="block rounded-2xl border border-slate-800 bg-slate-950/40 p-4 hover:border-cyan-400/25">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-black text-white">{item.tipo || "Ocorrência"}</p>
                          <p className="mt-1 truncate text-sm text-slate-400">{item.local || "Local não informado"}</p>
                        </div>
                        <span className="shrink-0 text-xs font-bold text-cyan-300">{item.hora || "--:--"}</span>
                      </div>
                    </Link>
                  ))}
                </ListaVaziaOuItens>
              </Painel>
            </section>

            <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <Atalho href="/sistema/patrulhamento" titulo="Iniciar patrulhamento" icone={MapPin} />
              <Atalho href="/sistema/visitas" titulo="Registrar visita" icone={CheckCircle2} />
              <Atalho href="/sistema/escalas/permutas" titulo="Minhas permutas" icone={CalendarDays} />
              <Atalho href="/sistema/ordens-servico" titulo="Ordens de serviço" icone={ClipboardList} />
            </section>

            <Painel titulo="Histórico de registros" subtitulo="Entradas e saídas do plantão atual" icone={History}>
              <ListaVaziaOuItens vazio={dados.registros.length === 0} mensagem="Nenhum check-in ou check-out registrado hoje.">
                {dados.registros.map((registro) => (
                  <div key={registro.id} className="flex items-center justify-between gap-4 rounded-xl border border-slate-800 bg-slate-950/40 p-4">
                    <div className="flex items-center gap-3">
                      <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${registro.tipo === "CHECK_IN" ? "bg-emerald-400/10 text-emerald-300" : "bg-rose-400/10 text-rose-300"}`}>
                        {registro.tipo === "CHECK_IN" ? <LogIn className="h-5 w-5" /> : <LogOut className="h-5 w-5" />}
                      </div>
                      <div>
                        <p className="font-black text-white">{registro.tipo === "CHECK_IN" ? "Início do plantão" : "Encerramento do plantão"}</p>
                        <p className="mt-1 text-xs text-slate-500">{registro.latitude && registro.longitude ? "Localização registrada" : "Sem localização"}</p>
                      </div>
                    </div>
                    <span className="text-sm text-slate-400">{formatarDataHora(registro.registrado_em)}</span>
                  </div>
                ))}
              </ListaVaziaOuItens>
            </Painel>
          </>
        )}
      </div>
    </main>
  );
}

function InfoCard({ titulo, valor, icone: Icone }: { titulo: string; valor: string; icone: typeof Shield }) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-[#061326] p-5">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-cyan-400/20 bg-cyan-400/[0.07] text-cyan-300"><Icone className="h-5 w-5" /></div>
      <p className="mt-4 text-xs font-black uppercase tracking-wider text-slate-500">{titulo}</p>
      <p className="mt-1 text-lg font-black text-white">{valor}</p>
    </div>
  );
}

function Painel({ titulo, subtitulo, icone: Icone, className = "", children }: { titulo: string; subtitulo: string; icone: typeof Shield; className?: string; children: React.ReactNode }) {
  return (
    <section className={`rounded-2xl border border-slate-800 bg-[#061326] p-5 ${className}`}>
      <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-cyan-400/20 bg-cyan-400/[0.07] text-cyan-300"><Icone className="h-5 w-5" /></div>
        <div><h2 className="font-black text-white">{titulo}</h2><p className="mt-1 text-xs text-slate-500">{subtitulo}</p></div>
      </div>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function ListaVaziaOuItens({ vazio, mensagem, children }: { vazio: boolean; mensagem: string; children: React.ReactNode }) {
  return vazio ? <div className="rounded-2xl border border-dashed border-slate-700 p-8 text-center text-sm text-slate-500">{mensagem}</div> : <div className="space-y-3">{children}</div>;
}

function Atalho({ href, titulo, icone: Icone }: { href: string; titulo: string; icone: typeof Shield }) {
  return (
    <Link href={href} className="group flex items-center gap-3 rounded-2xl border border-slate-800 bg-[#061326] p-4 hover:border-cyan-400/30">
      <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-cyan-400/20 bg-cyan-400/[0.07] text-cyan-300"><Icone className="h-5 w-5" /></div>
      <span className="flex-1 font-black text-white">{titulo}</span>
      <ArrowRight className="h-4 w-4 text-slate-600 transition group-hover:translate-x-1 group-hover:text-cyan-300" />
    </Link>
  );
}
