"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  CalendarClock,
  Loader2,
  MapPin,
  Save,
  ShieldCheck,
  Users,
} from "lucide-react";

import ProtecaoModulo from "@/components/ProtecaoModulo";
import { registrarAuditoria } from "@/lib/auditoria";
import { supabase } from "@/lib/supabase";
import {
  lerUsuarioEscalaExtra,
  podeGerenciarEscalaExtra,
} from "@/lib/escalaExtraordinaria";

type Guarda = {
  id: number;
  nome: string;
  matricula: string | null;
};

type Viatura = {
  id: number;
  prefixo: string | null;
  placa: string | null;
  modelo: string | null;
};

function hoje() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Bahia",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

export default function NovaEscalaExtraPage() {
  const router = useRouter();
  const [usuario] = useState(() => lerUsuarioEscalaExtra());
  const [guardas, setGuardas] = useState<Guarda[]>([]);
  const [viaturas, setViaturas] = useState<Viatura[]>([]);
  const [selecionados, setSelecionados] = useState<number[]>([]);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");
  const [form, setForm] = useState({
    titulo: "",
    descricao: "",
    tipo: "EVENTO",
    local: "",
    endereco: "",
    data: hoje(),
    hora_inicio: "18:00",
    hora_fim: "22:00",
    efetivo_necessario: "4",
    comandante_id: "",
    viatura_id: "",
    observacao: "",
    contabilizar_banco_horas: true,
  });

  const gerencia = usuario ? podeGerenciarEscalaExtra(usuario.perfil) : false;

  useEffect(() => {
    async function carregar() {
      if (!usuario?.municipio_id) return;

      const [guardasResposta, viaturasResposta] = await Promise.all([
        supabase
          .from("guardas")
          .select("id,nome,matricula")
          .eq("municipio_id", usuario.municipio_id)
          .order("nome"),
        supabase
          .from("viaturas")
          .select("id,prefixo,placa,modelo")
          .eq("municipio_id", usuario.municipio_id)
          .order("prefixo"),
      ]);

      if (guardasResposta.error) setErro(guardasResposta.error.message);
      setGuardas((guardasResposta.data as Guarda[] | null) || []);
      setViaturas((viaturasResposta.data as Viatura[] | null) || []);
    }

    void carregar();
  }, [usuario]);

  const comandante = useMemo(
    () => guardas.find((item) => String(item.id) === form.comandante_id),
    [form.comandante_id, guardas]
  );

  function alternarGuarda(id: number) {
    setSelecionados((atual) =>
      atual.includes(id)
        ? atual.filter((item) => item !== id)
        : [...atual, id]
    );
  }

  async function salvar(status: "RASCUNHO" | "PUBLICADO") {
    if (!usuario?.municipio_id || !gerencia) return;

    if (
      !form.titulo.trim() ||
      !form.local.trim() ||
      !form.data ||
      !form.hora_inicio ||
      !form.hora_fim
    ) {
      setErro("Preencha título, local, data e horários.");
      return;
    }

    setSalvando(true);
    setErro("");

    try {
      const viatura = viaturas.find(
        (item) => String(item.id) === form.viatura_id
      );

      const { data, error } = await supabase
        .from("escalas_extras")
        .insert({
          municipio_id: usuario.municipio_id,
          titulo: form.titulo.trim(),
          descricao: form.descricao.trim() || null,
          tipo: form.tipo,
          local: form.local.trim(),
          endereco: form.endereco.trim() || null,
          data: form.data,
          hora_inicio: form.hora_inicio,
          hora_fim: form.hora_fim,
          efetivo_necessario: Number(form.efetivo_necessario) || 1,
          comandante_id: comandante?.id || null,
          comandante_nome: comandante?.nome || null,
          viatura_id: viatura?.id || null,
          viatura_prefixo:
            viatura?.prefixo ||
            viatura?.placa ||
            viatura?.modelo ||
            null,
          status,
          observacao: form.observacao.trim() || null,
          contabilizar_banco_horas: form.contabilizar_banco_horas,
          criado_por: Number(usuario.id),
          criado_por_nome: usuario.nome,
        })
        .select("id")
        .single();

      if (error) throw error;

      const idsConvocados = Array.from(
        new Set([
          ...selecionados,
          ...(comandante?.id ? [comandante.id] : []),
        ])
      );

      if (idsConvocados.length > 0) {
        const convocados = idsConvocados.map((id) => {
          const guarda = guardas.find((item) => item.id === id)!;
          return {
            municipio_id: usuario.municipio_id,
            escala_extra_id: data.id,
            guarda_id: guarda.id,
            guarda_nome: guarda.nome,
            matricula: guarda.matricula,
            funcao:
              comandante?.id === guarda.id
                ? "COMANDANTE"
                : "PATRULHEIRO",
            status_convocacao: "CONVOCADO",
          };
        });

        const { error: erroConvocados } = await supabase
          .from("escalas_extras_convocados")
          .insert(convocados);

        if (erroConvocados) throw erroConvocados;
      }

      await supabase.from("escalas_extras_historico").insert({
        municipio_id: usuario.municipio_id,
        escala_extra_id: data.id,
        usuario_id: Number(usuario.id),
        usuario_nome: usuario.nome,
        acao: status === "PUBLICADO" ? "PUBLICADO" : "RASCUNHO_CRIADO",
        descricao: `${form.titulo.trim()} com ${idsConvocados.length} convocado(s).`,
      });

      await registrarAuditoria({
        modulo: "Escala Extraordinária",
        acao: status === "PUBLICADO" ? "PUBLICAR" : "CRIAR_RASCUNHO",
        tabela: "escalas_extras",
        registro_id: data.id,
        descricao: `Criou ${form.titulo.trim()}.`,
        detalhes: {
          convocados: idsConvocados.length,
          data: form.data,
          local: form.local.trim(),
        },
      });

      router.push(`/sistema/escalas/extras/${data.id}`);
    } catch (error) {
      setErro(
        error instanceof Error
          ? error.message
          : "Não foi possível criar a escala extraordinária."
      );
    } finally {
      setSalvando(false);
    }
  }

  if (!gerencia) {
    return (
      <main className="min-h-screen bg-[#020b1c] p-8 text-white">
        Acesso restrito ao comando.
      </main>
    );
  }

  return (
    <ProtecaoModulo modulo="escalas">
      <main className="min-h-screen bg-[#020b1c] px-4 py-5 text-white lg:px-7">
        <div className="mx-auto max-w-[1500px] space-y-5">
          <header className="rounded-3xl border border-cyan-400/15 bg-gradient-to-br from-[#07182f] to-[#020b1c] p-5 lg:p-7">
            <button
              onClick={() => router.back()}
              className="mb-4 inline-flex items-center gap-2 text-sm font-black text-slate-400"
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar
            </button>

            <p className="text-xs font-black uppercase tracking-[0.22em] text-cyan-300">
              Escala extraordinária
            </p>
            <h1 className="mt-1 text-2xl font-black lg:text-3xl">
              Novo Evento Operacional
            </h1>
          </header>

          {erro ? (
            <div className="rounded-2xl border border-rose-400/25 bg-rose-400/10 p-4 text-sm text-rose-200">
              {erro}
            </div>
          ) : null}

          <section className="rounded-2xl border border-slate-800 bg-[#061326] p-5">
            <h2 className="flex items-center gap-2 font-black">
              <CalendarClock className="h-5 w-5 text-cyan-300" />
              Dados do evento
            </h2>

            <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <Campo
                label="Título"
                value={form.titulo}
                onChange={(valor) =>
                  setForm((atual) => ({ ...atual, titulo: valor }))
                }
                className="xl:col-span-2"
              />

              <Select
                label="Tipo"
                value={form.tipo}
                onChange={(valor) =>
                  setForm((atual) => ({ ...atual, tipo: valor }))
                }
                options={[
                  "EVENTO",
                  "OPERACAO_ESPECIAL",
                  "REFORCO_OPERACIONAL",
                  "CONVOCACAO",
                  "BLITZ",
                  "APOIO",
                  "PATRULHAMENTO_ESPECIAL",
                ]}
              />

              <Campo
                label="Efetivo necessário"
                type="number"
                value={form.efetivo_necessario}
                onChange={(valor) =>
                  setForm((atual) => ({
                    ...atual,
                    efetivo_necessario: valor,
                  }))
                }
              />

              <Campo
                label="Local"
                value={form.local}
                onChange={(valor) =>
                  setForm((atual) => ({ ...atual, local: valor }))
                }
              />

              <Campo
                label="Endereço"
                value={form.endereco}
                onChange={(valor) =>
                  setForm((atual) => ({ ...atual, endereco: valor }))
                }
              />

              <Campo
                label="Data"
                type="date"
                value={form.data}
                onChange={(valor) =>
                  setForm((atual) => ({ ...atual, data: valor }))
                }
              />

              <div className="grid grid-cols-2 gap-3">
                <Campo
                  label="Início"
                  type="time"
                  value={form.hora_inicio}
                  onChange={(valor) =>
                    setForm((atual) => ({
                      ...atual,
                      hora_inicio: valor,
                    }))
                  }
                />
                <Campo
                  label="Término"
                  type="time"
                  value={form.hora_fim}
                  onChange={(valor) =>
                    setForm((atual) => ({ ...atual, hora_fim: valor }))
                  }
                />
              </div>

              <label>
                <span className="mb-2 block text-xs font-black uppercase tracking-wider text-slate-500">
                  Comandante responsável
                </span>
                <select
                  value={form.comandante_id}
                  onChange={(event) =>
                    setForm((atual) => ({
                      ...atual,
                      comandante_id: event.target.value,
                    }))
                  }
                  className="h-12 w-full rounded-xl border border-slate-700 bg-slate-950/60 px-4 outline-none"
                >
                  <option value="">Selecione</option>
                  {guardas.map((guarda) => (
                    <option key={guarda.id} value={guarda.id}>
                      {guarda.nome}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                <span className="mb-2 block text-xs font-black uppercase tracking-wider text-slate-500">
                  Viatura
                </span>
                <select
                  value={form.viatura_id}
                  onChange={(event) =>
                    setForm((atual) => ({
                      ...atual,
                      viatura_id: event.target.value,
                    }))
                  }
                  className="h-12 w-full rounded-xl border border-slate-700 bg-slate-950/60 px-4 outline-none"
                >
                  <option value="">Sem viatura vinculada</option>
                  {viaturas.map((viatura) => (
                    <option key={viatura.id} value={viatura.id}>
                      {viatura.prefixo ||
                        viatura.placa ||
                        viatura.modelo ||
                        `Viatura ${viatura.id}`}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <label className="mt-4 block">
              <span className="mb-2 block text-xs font-black uppercase tracking-wider text-slate-500">
                Descrição
              </span>
              <textarea
                rows={4}
                value={form.descricao}
                onChange={(event) =>
                  setForm((atual) => ({
                    ...atual,
                    descricao: event.target.value,
                  }))
                }
                className="w-full rounded-xl border border-slate-700 bg-slate-950/60 p-4 outline-none"
              />
            </label>

            <label className="mt-4 flex items-center gap-3 text-sm text-slate-300">
              <input
                type="checkbox"
                checked={form.contabilizar_banco_horas}
                onChange={(event) =>
                  setForm((atual) => ({
                    ...atual,
                    contabilizar_banco_horas: event.target.checked,
                  }))
                }
              />
              Lançar horas dos presentes no Banco de Horas ao finalizar
            </label>
          </section>

          <section className="rounded-2xl border border-slate-800 bg-[#061326] p-5">
            <h2 className="flex items-center gap-2 font-black">
              <Users className="h-5 w-5 text-cyan-300" />
              Convocar efetivo
            </h2>

            <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {guardas.map((guarda) => {
                const ativo =
                  selecionados.includes(guarda.id) ||
                  comandante?.id === guarda.id;

                return (
                  <button
                    key={guarda.id}
                    type="button"
                    onClick={() => alternarGuarda(guarda.id)}
                    className={`rounded-xl border p-4 text-left ${
                      ativo
                        ? "border-cyan-400/30 bg-cyan-400/10"
                        : "border-slate-800 bg-slate-950/40"
                    }`}
                  >
                    <p className="font-black">{guarda.nome}</p>
                    <p className="mt-1 text-xs text-slate-500">
                      {guarda.matricula || "Sem matrícula"}
                      {comandante?.id === guarda.id ? " • COMANDANTE" : ""}
                    </p>
                  </button>
                );
              })}
            </div>
          </section>

          <div className="flex flex-wrap justify-end gap-3">
            <button
              onClick={() => void salvar("RASCUNHO")}
              disabled={salvando}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-700 px-5 py-3 font-black"
            >
              Salvar rascunho
            </button>

            <button
              onClick={() => void salvar("PUBLICADO")}
              disabled={salvando}
              className="inline-flex items-center gap-2 rounded-xl bg-cyan-400 px-5 py-3 font-black text-slate-950 disabled:opacity-50"
            >
              {salvando ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Save className="h-5 w-5" />
              )}
              Publicar e convocar
            </button>
          </div>
        </div>
      </main>
    </ProtecaoModulo>
  );
}

function Campo({
  label,
  value,
  onChange,
  type = "text",
  className = "",
}: {
  label: string;
  value: string;
  onChange: (valor: string) => void;
  type?: string;
  className?: string;
}) {
  return (
    <label className={className}>
      <span className="mb-2 block text-xs font-black uppercase tracking-wider text-slate-500">
        {label}
      </span>
      <input
        type={type}
        min={type === "number" ? "1" : undefined}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-12 w-full rounded-xl border border-slate-700 bg-slate-950/60 px-4 outline-none"
      />
    </label>
  );
}

function Select({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (valor: string) => void;
  options: string[];
}) {
  return (
    <label>
      <span className="mb-2 block text-xs font-black uppercase tracking-wider text-slate-500">
        {label}
      </span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-12 w-full rounded-xl border border-slate-700 bg-slate-950/60 px-4 outline-none"
      >
        {options.map((item) => (
          <option key={item} value={item}>
            {item.replaceAll("_", " ")}
          </option>
        ))}
      </select>
    </label>
  );
}
