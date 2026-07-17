"use client";

import Link from "next/link";

import {
  CarFront,
  Check,
  Clock3,
  Edit3,
  Eye,
  MapPin,
  Plus,
  Save,
  Shield,
  Trash2,
  Users,
  X,
} from "lucide-react";
import {
  useEffect,
  useMemo,
  useState,
} from "react";

import ProtecaoModulo from "@/components/ProtecaoModulo";
import { registrarAuditoria } from "@/lib/auditoria";
import { supabase } from "@/lib/supabase";

type Viatura = {
  id: number;
  prefixo: string | null;
  modelo: string | null;
  placa: string | null;
  status: string | null;
};

type Guarnicao = {
  id: number;
  municipio_id: number;
  nome: string;
  categoria: string;
  subtipo: string | null;
  guardas_por_unidade: number;
  jornada_tipo: string;
  carga_horaria: number | null;
  horario_inicio: string;
  horario_fim: string | null;
  dias_semana: number[];
  exige_comandante: boolean;
  exige_motorista: boolean;
  exige_viatura: boolean;
  exige_armamento: boolean;
  quantidade_comandantes: number;
  quantidade_motoristas: number;
  quantidade_patrulheiros: number;
  quantidade_apoio: number;
  viatura_id: number | null;
  observacao: string | null;
  ativa: boolean;
};

const jornadas = [
  {
    valor: "6H",
    nome: "6 horas",
    horas: 6,
  },
  {
    valor: "8H",
    nome: "8 horas",
    horas: 8,
  },
  {
    valor: "12H",
    nome: "12 horas",
    horas: 12,
  },
  {
    valor: "24H",
    nome: "24 horas",
    horas: 24,
  },
  {
    valor: "12X36",
    nome: "12x36",
    horas: 12,
  },
  {
    valor: "24X72",
    nome: "24x72",
    horas: 24,
  },
  {
    valor: "24X96",
    nome: "24x96",
    horas: 24,
  },
  {
    valor: "48X144",
    nome: "48x144",
    horas: 48,
  },
  {
    valor: "PERSONALIZADA",
    nome: "Personalizada",
    horas: null,
  },
];

const dias = [
  { id: 0, nome: "Dom" },
  { id: 1, nome: "Seg" },
  { id: 2, nome: "Ter" },
  { id: 3, nome: "Qua" },
  { id: 4, nome: "Qui" },
  { id: 5, nome: "Sex" },
  { id: 6, nome: "Sáb" },
];

function calcularHorarioFim(
  horarioInicio: string,
  horas: number | null
) {
  if (!horarioInicio || !horas) {
    return "";
  }

  const [hora, minuto] = horarioInicio
    .split(":")
    .map(Number);

  const data = new Date();

  data.setHours(
    hora,
    minuto,
    0,
    0
  );

  data.setHours(
    data.getHours() + horas
  );

  return `${String(
    data.getHours()
  ).padStart(2, "0")}:${String(
    data.getMinutes()
  ).padStart(2, "0")}`;
}

export default function GuarnicoesEscalasPage() {
  const [guarnicoes, setGuarnicoes] =
    useState<Guarnicao[]>([]);

  const [viaturas, setViaturas] =
    useState<Viatura[]>([]);

  const [carregando, setCarregando] =
    useState(true);

  const [salvando, setSalvando] =
    useState(false);

  const [formularioAberto, setFormularioAberto] =
    useState(false);

  const [editandoId, setEditandoId] =
    useState<number | null>(null);

  const [nome, setNome] =
    useState("");

  const [viaturaId, setViaturaId] =
    useState("");

  const [jornadaTipo, setJornadaTipo] =
    useState("24H");

  const [horarioInicio, setHorarioInicio] =
    useState("07:00");

  const [horarioFim, setHorarioFim] =
    useState("07:00");

  const [areaAtuacao, setAreaAtuacao] =
    useState("Toda cidade");

  const [quantidadeComandantes, setQuantidadeComandantes] =
    useState("1");

  const [quantidadeMotoristas, setQuantidadeMotoristas] =
    useState("1");

  const [quantidadePatrulheiros, setQuantidadePatrulheiros] =
    useState("2");

  const [quantidadeApoio, setQuantidadeApoio] =
    useState("0");

  const [exigeArmamento, setExigeArmamento] =
    useState(true);

  const [diasSelecionados, setDiasSelecionados] =
    useState<number[]>([
      0,
      1,
      2,
      3,
      4,
      5,
      6,
    ]);

  const usuario = useMemo(() => {
    if (typeof window === "undefined") {
      return {};
    }

    try {
      return JSON.parse(
        localStorage.getItem(
          "usuarioLogado"
        ) || "{}"
      );
    } catch {
      return {};
    }
  }, []);

  useEffect(() => {
    void carregar();
  }, []);

  useEffect(() => {
    const jornada = jornadas.find(
      (item) =>
        item.valor === jornadaTipo
    );

    if (
      jornada?.horas &&
      horarioInicio
    ) {
      setHorarioFim(
        calcularHorarioFim(
          horarioInicio,
          jornada.horas
        )
      );
    }
  }, [
    jornadaTipo,
    horarioInicio,
  ]);

  async function carregar() {
    if (!usuario?.municipio_id) {
      setCarregando(false);
      return;
    }

    setCarregando(true);

    const [
      respostaGuarnicoes,
      respostaViaturas,
    ] = await Promise.all([
      supabase
        .from("escala_estruturas")
        .select("*")
        .eq(
          "municipio_id",
          Number(
            usuario.municipio_id
          )
        )
        .eq(
          "categoria",
          "EQUIPE_OPERACIONAL"
        )
        .order("nome"),

      supabase
        .from("viaturas")
        .select(`
          id,
          prefixo,
          modelo,
          placa,
          status
        `)
        .eq(
          "municipio_id",
          Number(
            usuario.municipio_id
          )
        )
        .order("prefixo"),
    ]);

    setCarregando(false);

    if (respostaGuarnicoes.error) {
      alert(
        respostaGuarnicoes.error.message
      );
      return;
    }

    if (respostaViaturas.error) {
      alert(
        respostaViaturas.error.message
      );
      return;
    }

    setGuarnicoes(
      (respostaGuarnicoes.data ||
        []) as Guarnicao[]
    );

    setViaturas(
      (respostaViaturas.data ||
        []) as Viatura[]
    );
  }

  function totalVagas() {
    return (
      Number(
        quantidadeComandantes || 0
      ) +
      Number(
        quantidadeMotoristas || 0
      ) +
      Number(
        quantidadePatrulheiros || 0
      ) +
      Number(
        quantidadeApoio || 0
      )
    );
  }

  function alternarDia(
    dia: number
  ) {
    setDiasSelecionados(
      (atual) =>
        atual.includes(dia)
          ? atual.filter(
              (item) =>
                item !== dia
            )
          : [...atual, dia]
    );
  }

  function limpar() {
    setEditandoId(null);
    setNome("");
    setViaturaId("");
    setJornadaTipo("24H");
    setHorarioInicio("07:00");
    setHorarioFim("07:00");
    setAreaAtuacao("Toda cidade");
    setQuantidadeComandantes("1");
    setQuantidadeMotoristas("1");
    setQuantidadePatrulheiros("2");
    setQuantidadeApoio("0");
    setExigeArmamento(true);
    setDiasSelecionados([
      0,
      1,
      2,
      3,
      4,
      5,
      6,
    ]);
  }

  function abrirNova() {
    limpar();
    setFormularioAberto(true);
  }

  function editar(
    item: Guarnicao
  ) {
    setEditandoId(item.id);
    setNome(item.nome);
    setViaturaId(
      item.viatura_id
        ? String(item.viatura_id)
        : ""
    );
    setJornadaTipo(
      item.jornada_tipo
    );
    setHorarioInicio(
      String(
        item.horario_inicio
      ).slice(0, 5)
    );
    setHorarioFim(
      item.horario_fim
        ? String(
            item.horario_fim
          ).slice(0, 5)
        : ""
    );
    setAreaAtuacao(
      item.observacao ||
        "Toda cidade"
    );
    setQuantidadeComandantes(
      String(
        item.quantidade_comandantes ||
          0
      )
    );
    setQuantidadeMotoristas(
      String(
        item.quantidade_motoristas ||
          0
      )
    );
    setQuantidadePatrulheiros(
      String(
        item.quantidade_patrulheiros ||
          0
      )
    );
    setQuantidadeApoio(
      String(
        item.quantidade_apoio ||
          0
      )
    );
    setExigeArmamento(
      item.exige_armamento
    );
    setDiasSelecionados(
      item.dias_semana || []
    );
    setFormularioAberto(true);
  }

  async function salvar() {
    if (
      !usuario?.id ||
      !usuario?.municipio_id
    ) {
      alert("Sessão inválida.");
      return;
    }

    if (!nome.trim()) {
      alert(
        "Informe o nome da guarnição."
      );
      return;
    }

    if (
      totalVagas() <= 0
    ) {
      alert(
        "Informe pelo menos uma vaga."
      );
      return;
    }

    if (
      diasSelecionados.length === 0
    ) {
      alert(
        "Selecione pelo menos um dia."
      );
      return;
    }

    setSalvando(true);

    const jornada = jornadas.find(
      (item) =>
        item.valor === jornadaTipo
    );

    const payload = {
      municipio_id:
        Number(
          usuario.municipio_id
        ),
      nome:
        nome.trim().toUpperCase(),
      categoria:
        "EQUIPE_OPERACIONAL",
      subtipo:
        "GUARNICAO",
      quantidade_unidades: 1,
      guardas_por_unidade:
        totalVagas(),
      jornada_tipo:
        jornadaTipo,
      carga_horaria:
        jornada?.horas || null,
      horario_inicio:
        horarioInicio,
      horario_fim:
        horarioFim || null,
      dias_semana:
        diasSelecionados,
      exige_comandante:
        Number(
          quantidadeComandantes
        ) > 0,
      exige_motorista:
        Number(
          quantidadeMotoristas
        ) > 0,
      exige_viatura:
        Boolean(viaturaId),
      exige_armamento:
        exigeArmamento,
      quantidade_comandantes:
        Number(
          quantidadeComandantes ||
            0
        ),
      quantidade_motoristas:
        Number(
          quantidadeMotoristas ||
            0
        ),
      quantidade_patrulheiros:
        Number(
          quantidadePatrulheiros ||
            0
        ),
      quantidade_apoio:
        Number(
          quantidadeApoio || 0
        ),
      viatura_id:
        viaturaId
          ? Number(viaturaId)
          : null,
      observacao:
        areaAtuacao.trim() ||
        null,
      ativa: true,
      criado_por:
        Number(usuario.id),
    };

    const resposta = editandoId
      ? await supabase
          .from(
            "escala_estruturas"
          )
          .update(payload)
          .eq(
            "id",
            editandoId
          )
          .eq(
            "municipio_id",
            Number(
              usuario.municipio_id
            )
          )
      : await supabase
          .from(
            "escala_estruturas"
          )
          .insert(payload);

    setSalvando(false);

    if (resposta.error) {
      alert(
        resposta.error.message
      );
      return;
    }

    await registrarAuditoria({
      modulo: "Escalas",
      acao: editandoId
        ? "EDITAR_GUARNICAO"
        : "CRIAR_GUARNICAO",
      tabela:
        "escala_estruturas",
      registro_id:
        editandoId
          ? String(editandoId)
          : undefined,
      descricao:
        `${editandoId ? "Editou" : "Criou"} a guarnição ${nome.trim().toUpperCase()}.`,
      detalhes: {
        jornada:
          jornadaTipo,
        vagas:
          totalVagas(),
        viatura_id:
          viaturaId
            ? Number(viaturaId)
            : null,
      },
    });

    setFormularioAberto(false);
    limpar();
    await carregar();

    alert(
      editandoId
        ? "Guarnição atualizada."
        : "Guarnição criada."
    );
  }

  async function excluir(
    item: Guarnicao
  ) {
    if (
      !confirm(
        `Excluir a guarnição ${item.nome}?`
      )
    ) {
      return;
    }

    const { error } =
      await supabase
        .from(
          "escala_estruturas"
        )
        .delete()
        .eq(
          "id",
          item.id
        )
        .eq(
          "municipio_id",
          Number(
            usuario.municipio_id
          )
        );

    if (error) {
      alert(error.message);
      return;
    }

    await registrarAuditoria({
      modulo: "Escalas",
      acao:
        "EXCLUIR_GUARNICAO",
      tabela:
        "escala_estruturas",
      registro_id:
        String(item.id),
      descricao:
        `Excluiu a guarnição ${item.nome}.`,
    });

    await carregar();
  }

  function nomeViatura(
    viaturaId:
      | number
      | null
  ) {
    if (!viaturaId) {
      return "Sem viatura fixa";
    }

    const viatura =
      viaturas.find(
        (item) =>
          Number(item.id) ===
          Number(viaturaId)
      );

    if (!viatura) {
      return `Viatura #${viaturaId}`;
    }

    return `${
      viatura.prefixo ||
      `VTR-${viatura.id}`
    } • ${
      viatura.modelo ||
      "Modelo não informado"
    }`;
  }

  return (
    <ProtecaoModulo modulo="escalas">
      <main className="space-y-6 p-4 pb-24 text-white md:p-6">
        <header className="flex flex-col justify-between gap-4 border-b border-slate-800 pb-5 md:flex-row md:items-center">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.22em] text-emerald-300">
              Estrutura das equipes
            </p>

            <h1 className="mt-2 text-3xl font-black md:text-4xl">
              Guarnições
            </h1>

            <p className="mt-2 text-sm text-slate-400">
              Configure somente jornada, viatura e vagas. Os guardas serão definidos na escala diária.
            </p>
          </div>

          <button
            type="button"
            onClick={abrirNova}
            className="btn-primary inline-flex items-center justify-center gap-2"
          >
            <Plus className="h-5 w-5" />
            Nova guarnição
          </button>
        </header>

        {formularioAberto && (
          <section className="rounded-2xl border border-emerald-500/20 bg-slate-950/80 p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-black">
                  {editandoId
                    ? "Editar guarnição"
                    : "Nova guarnição"}
                </h2>

                <p className="mt-1 text-sm text-slate-400">
                  Nenhum guarda será vinculado nesta tela.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setFormularioAberto(false);
                  limpar();
                }}
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-700 bg-slate-900 text-slate-300"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <Campo
                label="Nome da guarnição"
                valor={nome}
                setValor={setNome}
                placeholder="Ex.: Charlie"
              />

              <div>
                <label className="label">
                  Viatura
                </label>

                <select
                  className="input"
                  value={viaturaId}
                  onChange={(event) =>
                    setViaturaId(
                      event.target.value
                    )
                  }
                >
                  <option value="">
                    Sem viatura fixa
                  </option>

                  {viaturas.map(
                    (viatura) => (
                      <option
                        key={
                          viatura.id
                        }
                        value={
                          viatura.id
                        }
                      >
                        {viatura.prefixo ||
                          `VTR-${viatura.id}`}
                        {" • "}
                        {viatura.modelo ||
                          "Modelo não informado"}
                        {" • "}
                        {viatura.placa ||
                          "Sem placa"}
                        {" • "}
                        {viatura.status ||
                          "Sem status"}
                      </option>
                    )
                  )}
                </select>
              </div>

              <div>
                <label className="label">
                  Jornada
                </label>

                <select
                  className="input"
                  value={jornadaTipo}
                  onChange={(event) =>
                    setJornadaTipo(
                      event.target.value
                    )
                  }
                >
                  {jornadas.map(
                    (item) => (
                      <option
                        key={
                          item.valor
                        }
                        value={
                          item.valor
                        }
                      >
                        {item.nome}
                      </option>
                    )
                  )}
                </select>
              </div>

              <Campo
                label="Área de atuação"
                valor={areaAtuacao}
                setValor={
                  setAreaAtuacao
                }
                placeholder="Ex.: Toda cidade"
              />

              <Campo
                label="Entrada"
                valor={horarioInicio}
                setValor={
                  setHorarioInicio
                }
                type="time"
              />

              <Campo
                label="Saída"
                valor={horarioFim}
                setValor={
                  setHorarioFim
                }
                type="time"
              />
            </div>

            <div className="mt-5">
              <label className="label">
                Vagas da guarnição
              </label>

              <div className="mt-2 grid grid-cols-2 gap-3 md:grid-cols-4">
                <CampoNumero
                  label="Comandantes"
                  valor={
                    quantidadeComandantes
                  }
                  setValor={
                    setQuantidadeComandantes
                  }
                />

                <CampoNumero
                  label="Motoristas"
                  valor={
                    quantidadeMotoristas
                  }
                  setValor={
                    setQuantidadeMotoristas
                  }
                />

                <CampoNumero
                  label="Patrulheiros"
                  valor={
                    quantidadePatrulheiros
                  }
                  setValor={
                    setQuantidadePatrulheiros
                  }
                />

                <CampoNumero
                  label="Apoio"
                  valor={
                    quantidadeApoio
                  }
                  setValor={
                    setQuantidadeApoio
                  }
                />
              </div>
            </div>

            <div className="mt-5">
              <label className="label">
                Dias de funcionamento
              </label>

              <div className="mt-2 flex flex-wrap gap-2">
                {dias.map(
                  (dia) => (
                    <button
                      key={dia.id}
                      type="button"
                      onClick={() =>
                        alternarDia(
                          dia.id
                        )
                      }
                      className={`rounded-xl border px-3 py-2 text-sm font-bold ${
                        diasSelecionados.includes(
                          dia.id
                        )
                          ? "border-emerald-500/40 bg-emerald-500/15 text-emerald-300"
                          : "border-slate-700 bg-slate-900 text-slate-400"
                      }`}
                    >
                      {dia.nome}
                    </button>
                  )
                )}
              </div>
            </div>

            <label className="mt-5 flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-900/60 p-4">
              <input
                type="checkbox"
                checked={
                  exigeArmamento
                }
                onChange={(event) =>
                  setExigeArmamento(
                    event.target.checked
                  )
                }
              />

              <span className="font-bold text-slate-300">
                Esta guarnição exige armamento
              </span>
            </label>

            <div className="mt-5 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={() =>
                  void salvar()
                }
                disabled={salvando}
                className="btn-primary inline-flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Save className="h-5 w-5" />

                {salvando
                  ? "Salvando..."
                  : "Salvar guarnição"}
              </button>

              <button
                type="button"
                onClick={() => {
                  setFormularioAberto(false);
                  limpar();
                }}
                className="btn-secondary"
              >
                Cancelar
              </button>
            </div>
          </section>
        )}

        {carregando ? (
  <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-8 text-center text-slate-400">
    Carregando guarnições...
  </div>
) : guarnicoes.length === 0 ? (
  <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-950/50 p-10 text-center">
    <Shield className="mx-auto h-12 w-12 text-slate-600" />

    <h2 className="mt-4 text-xl font-black">
      Nenhuma guarnição configurada
    </h2>

    <p className="mt-2 text-sm text-slate-400">
      Crie a primeira guarnição para depois gerar a escala.
    </p>
  </div>
) : (
  <section className="grid grid-cols-1 gap-4 xl:grid-cols-2">
    {guarnicoes.map((item) => (
      <article
        key={item.id}
        className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-950/75"
      >
        <div className="flex items-center justify-between gap-4 border-b border-slate-800 bg-slate-900/50 px-5 py-4">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-emerald-500/25 bg-emerald-500/10">
              <Shield className="h-6 w-6 text-emerald-300" />
            </div>

            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="truncate text-xl font-black text-white">
                  {item.nome}
                </h2>

                {item.ativa && (
                  <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-1 text-[10px] font-black text-emerald-300">
                    <Check className="h-3 w-3" />
                    ATIVA
                  </span>
                )}
              </div>

              <p className="mt-1 text-xs text-slate-400">
                Estrutura permanente da equipe
              </p>
            </div>
          </div>

          <span className="rounded-xl border border-cyan-500/20 bg-cyan-500/10 px-3 py-2 text-sm font-black text-cyan-300">
            {item.guardas_por_unidade} vagas
          </span>
        </div>

        <div className="space-y-4 p-5">
          <div className="grid gap-3 sm:grid-cols-2">
            <InformacaoGuarnicao
              icone={CarFront}
              titulo="Viatura"
              valor={nomeViatura(item.viatura_id)}
              classe="text-blue-300"
            />

            <InformacaoGuarnicao
              icone={Clock3}
              titulo="Jornada"
              valor={`${item.jornada_tipo} • ${String(
                item.horario_inicio
              ).slice(0, 5)} às ${
                item.horario_fim
                  ? String(item.horario_fim).slice(0, 5)
                  : "-"
              }`}
              classe="text-cyan-300"
            />

            <InformacaoGuarnicao
              icone={MapPin}
              titulo="Área"
              valor={item.observacao || "Toda cidade"}
              classe="text-yellow-300"
            />

            <InformacaoGuarnicao
              icone={Users}
              titulo="Efetivo"
              valor={`${item.guardas_por_unidade} guarda(s) por plantão`}
              classe="text-emerald-300"
            />
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-4">
            <p className="mb-3 text-xs font-black uppercase tracking-wider text-slate-500">
              Vagas da equipe
            </p>

            <div className="flex flex-wrap gap-2">
              <Vaga
                nome="Comandante"
                quantidade={item.quantidade_comandantes}
                classe="border-cyan-500/30 bg-cyan-500/10 text-cyan-300"
              />

              <Vaga
                nome="Motorista"
                quantidade={item.quantidade_motoristas}
                classe="border-blue-500/30 bg-blue-500/10 text-blue-300"
              />

              <Vaga
                nome="Patrulheiro"
                quantidade={item.quantidade_patrulheiros}
                classe="border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
              />

              <Vaga
                nome="Apoio"
                quantidade={item.quantidade_apoio}
                classe="border-violet-500/30 bg-violet-500/10 text-violet-300"
              />
            </div>
          </div>

          <div className="grid gap-2 border-t border-slate-800 pt-4 sm:grid-cols-2">
            <Link
              href={`/sistema/escalas/escala-diaria?guarnicao_id=${item.id}`}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 font-black text-emerald-300 transition hover:bg-emerald-500/20"
            >
              <Eye className="h-5 w-5" />
              Abrir escala
            </Link>

            <button
              type="button"
              onClick={() => editar(item)}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-blue-500/30 bg-blue-500/10 px-4 py-3 font-black text-blue-300 transition hover:bg-blue-500/20"
            >
              <Edit3 className="h-5 w-5" />
              Editar estrutura
            </button>
          </div>

          <button
            type="button"
            onClick={() => void excluir(item)}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-2 text-sm font-bold text-red-300 transition hover:bg-red-500/15"
          >
            <Trash2 className="h-4 w-4" />
            Excluir guarnição
          </button>
        </div>
      </article>
    ))}
  </section>
)}
      </main>
    </ProtecaoModulo>
  );
}

function Campo({
  label,
  valor,
  setValor,
  placeholder,
  type = "text",
}: {
  label: string;
  valor: string;
  setValor: (
    valor: string
  ) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <div>
      <label className="label">
        {label}
      </label>

      <input
        type={type}
        className="input"
        value={valor}
        placeholder={placeholder}
        onChange={(event) =>
          setValor(
            event.target.value
          )
        }
      />
    </div>
  );
}

function CampoNumero({
  label,
  valor,
  setValor,
}: {
  label: string;
  valor: string;
  setValor: (
    valor: string
  ) => void;
}) {
  return (
    <div>
      <label className="label">
        {label}
      </label>

      <input
        type="number"
        min="0"
        className="input"
        value={valor}
        onChange={(event) =>
          setValor(
            event.target.value.replace(
              /\D/g,
              ""
            )
          )
        }
      />
    </div>
  );
}

function InformacaoGuarnicao({
  icone: Icone,
  titulo,
  valor,
  classe,
}: {
  icone: any;
  titulo: string;
  valor: string;
  classe: string;
}) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4">
      <div className="flex items-center gap-2">
        <Icone className={`h-4 w-4 ${classe}`} />

        <p className="text-xs font-black uppercase tracking-wide text-slate-500">
          {titulo}
        </p>
      </div>

      <p className={`mt-2 text-sm font-black ${classe}`}>
        {valor}
      </p>
    </div>
  );
}

function Vaga({
  nome,
  quantidade,
  classe,
}: {
  nome: string;
  quantidade: number;
  classe: string;
}) {
  if (!quantidade) {
    return null;
  }

  return (
    <span
      className={`rounded-full border px-3 py-1 text-xs font-black ${classe}`}
    >
      {quantidade} {nome}
      {quantidade > 1 ? "s" : ""}
    </span>
  );
}