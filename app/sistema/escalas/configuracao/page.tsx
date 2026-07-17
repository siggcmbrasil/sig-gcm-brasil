"use client";

import {
  Building2,
  CarFront,
  Plus,
  Save,
  ShieldCheck,
  Trash2,
  Users,
} from "lucide-react";
import {
  useEffect,
  useMemo,
  useState,
} from "react";

import { supabase } from "@/lib/supabase";
import ProtecaoModulo from "@/components/ProtecaoModulo";
import { registrarAuditoria } from "@/lib/auditoria";

type Categoria =
  | "EQUIPE_OPERACIONAL"
  | "POSTO_FIXO"
  | "ADMINISTRATIVO";

type Estrutura = {
  id: number;
  municipio_id: number;
  nome: string;
  categoria: Categoria;
  subtipo: string | null;
  quantidade_unidades: number;
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
  ativa: boolean;
  viatura_id: number | null;
};

type Viatura = {
  id: number;
  municipio_id: number;
  prefixo: string | null;
  placa: string | null;
  modelo: string | null;
  status: string | null;
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

const diasSemana = [
  {
    id: 0,
    nome: "Dom",
  },
  {
    id: 1,
    nome: "Seg",
  },
  {
    id: 2,
    nome: "Ter",
  },
  {
    id: 3,
    nome: "Qua",
  },
  {
    id: 4,
    nome: "Qui",
  },
  {
    id: 5,
    nome: "Sex",
  },
  {
    id: 6,
    nome: "Sáb",
  },
];

function calcularFim(
  inicio: string,
  horas: number | null
) {
  if (!inicio || !horas) {
    return "";
  }

  const [hora, minuto] = inicio
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

export default function ConfiguracaoEscalasPage() {
  const [
    estruturas,
    setEstruturas,
  ] = useState<Estrutura[]>([]);

  const [
    carregando,
    setCarregando,
  ] = useState(true);

  const [
    salvando,
    setSalvando,
  ] = useState(false);

  const [
  viaturas,
  setViaturas,
] = useState<Viatura[]>([]);

const [
  viaturaId,
  setViaturaId,
] = useState("");

  const [categoria, setCategoria] =
    useState<Categoria>(
      "EQUIPE_OPERACIONAL"
    );

  const [nome, setNome] =
    useState("");

  const [subtipo, setSubtipo] =
    useState("VIATURA");

  const [
    quantidadeUnidades,
    setQuantidadeUnidades,
  ] = useState("1");

  const [
    guardasPorUnidade,
    setGuardasPorUnidade,
  ] = useState("4");

  const [
    jornadaTipo,
    setJornadaTipo,
  ] = useState("24H");

  const [
    horarioInicio,
    setHorarioInicio,
  ] = useState("07:00");

  const [
    horarioFim,
    setHorarioFim,
  ] = useState("07:00");

  const [
    diasSelecionados,
    setDiasSelecionados,
  ] = useState<number[]>([
    0,
    1,
    2,
    3,
    4,
    5,
    6,
  ]);

  const [
    exigeComandante,
    setExigeComandante,
  ] = useState(true);

  const [
    exigeMotorista,
    setExigeMotorista,
  ] = useState(true);

  const [
    exigeViatura,
    setExigeViatura,
  ] = useState(true);

  const [
    exigeArmamento,
    setExigeArmamento,
  ] = useState(true);

  const usuario = useMemo(() => {
    if (
      typeof window ===
      "undefined"
    ) {
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
  if (
    categoria === "EQUIPE_OPERACIONAL" &&
    !viaturaId &&
    viaturas.length > 0
  ) {
    const viaturaOperacional =
      viaturas.find(
        (item: Viatura) =>
          String(item.status || "")
            .trim()
            .toUpperCase() ===
          "OPERACIONAL"
      ) || viaturas[0];

    setViaturaId(
      String(viaturaOperacional.id)
    );
  }
}, [
  categoria,
  viaturaId,
  viaturas,
]);

  useEffect(() => {
    const jornada =
      jornadas.find(
        (item) =>
          item.valor ===
          jornadaTipo
      );

    if (
      jornada?.horas &&
      horarioInicio
    ) {
      setHorarioFim(
        calcularFim(
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

const {
  data: viaturasData,
  error: viaturasError,
} = await supabase
  .from("viaturas")
  .select(
    "id,prefixo,modelo,placa,status,municipio_id"
  )
  .eq(
    "municipio_id",
    Number(usuario.municipio_id)
  )
  .order("prefixo", {
    ascending: true,
  });

if (viaturasError) {
  alert(
    `Erro ao carregar viaturas: ${viaturasError.message}`
  );
} else {
setViaturas(
  Array.isArray(viaturasData)
    ? (viaturasData as Viatura[])
    : []
);
}

    const {
      data,
      error,
    } = await supabase
      .from("escala_estruturas")
      .select("*")
      .eq(
        "municipio_id",
        Number(
          usuario.municipio_id
        )
      )
      .order("categoria")
      .order("ordem")
      .order("nome");

    setCarregando(false);

    if (error) {
      alert(error.message);
      return;
    }

    setEstruturas(
      (data || []) as Estrutura[]
    );
  }

  function limparFormulario() {
    setNome("");
    setViaturaId("");
    setQuantidadeUnidades("1");
    setGuardasPorUnidade(
      categoria ===
        "EQUIPE_OPERACIONAL"
        ? "4"
        : "1"
    );
    setJornadaTipo(
      categoria ===
        "EQUIPE_OPERACIONAL"
        ? "24H"
        : "8H"
    );
    setHorarioInicio(
      categoria ===
        "EQUIPE_OPERACIONAL"
        ? "07:00"
        : "08:00"
    );
    setDiasSelecionados(
      categoria ===
        "ADMINISTRATIVO"
        ? [1, 2, 3, 4, 5]
        : [0, 1, 2, 3, 4, 5, 6]
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
        "Informe o nome do serviço."
      );
      return;
    }

    if (
      Number(
        quantidadeUnidades
      ) <= 0
    ) {
      alert(
        "Informe a quantidade de unidades."
      );
      return;
    }

    if (
      Number(
        guardasPorUnidade
      ) <= 0
    ) {
      alert(
        "Informe a quantidade de guardas."
      );
      return;
    }

    if (
      diasSelecionados.length ===
      0
    ) {
      alert(
        "Selecione pelo menos um dia da semana."
      );
      return;
    }

    setSalvando(true);

    const jornada =
      jornadas.find(
        (item) =>
          item.valor ===
          jornadaTipo
      );

    const quantidade =
      Number(
        quantidadeUnidades
      );

    const registros = Array.from(
      {
        length: quantidade,
      },
      (_, indice) => ({
        municipio_id:
          Number(
            usuario.municipio_id
          ),
        nome:
          quantidade > 1
            ? `${nome.trim()} ${String(
                indice + 1
              ).padStart(2, "0")}`
            : nome.trim(),
        categoria,
        subtipo:
          subtipo || null,
          viatura_id:
  categoria === "EQUIPE_OPERACIONAL" &&
  viaturaId
    ? Number(viaturaId)
    : null,
        quantidade_unidades:
          1,
        guardas_por_unidade:
          Number(
            guardasPorUnidade
          ),
        jornada_tipo:
          jornadaTipo,
        carga_horaria:
          jornada?.horas ||
          null,
        horario_inicio:
          horarioInicio,
        horario_fim:
          horarioFim || null,
        dias_semana:
          diasSelecionados,
        exige_comandante:
          categoria ===
            "EQUIPE_OPERACIONAL"
            ? exigeComandante
            : false,
        exige_motorista:
          categoria ===
            "EQUIPE_OPERACIONAL"
            ? exigeMotorista
            : false,
        exige_viatura:
          categoria ===
            "EQUIPE_OPERACIONAL"
            ? exigeViatura
            : false,
        exige_armamento:
          categoria ===
            "EQUIPE_OPERACIONAL"
            ? exigeArmamento
            : false,
        quantidade_comandantes:
          categoria ===
            "EQUIPE_OPERACIONAL" &&
          exigeComandante
            ? 1
            : 0,
        quantidade_motoristas:
          categoria ===
            "EQUIPE_OPERACIONAL" &&
          exigeMotorista
            ? 1
            : 0,
        quantidade_patrulheiros:
          categoria ===
            "EQUIPE_OPERACIONAL"
            ? Math.max(
                Number(
                  guardasPorUnidade
                ) -
                  Number(
                    exigeComandante
                  ) -
                  Number(
                    exigeMotorista
                  ),
                0
              )
            : 0,
        quantidade_apoio: 0,
        ativa: true,
        criado_por:
          Number(usuario.id),
      })
    );

    const { error } =
      await supabase
        .from(
          "escala_estruturas"
        )
        .insert(registros);

    setSalvando(false);

    if (error) {
      alert(error.message);
      return;
    }

    await registrarAuditoria({
      modulo:
        "Escalas",
      acao:
        "CRIAR_ESTRUTURA",
      tabela:
        "escala_estruturas",
      descricao:
        `Criou ${quantidade} estrutura(s) de escala: ${nome.trim()}.`,
      detalhes: {
        categoria,
        quantidade,
        guardas_por_unidade:
          Number(
            guardasPorUnidade
          ),
        jornada:
          jornadaTipo,
      },
    });

    limparFormulario();

    await carregar();

    alert(
      quantidade > 1
        ? `${quantidade} estruturas criadas com sucesso.`
        : "Estrutura criada com sucesso."
    );
  }

  async function excluir(
    item: Estrutura
  ) {
    if (
      !confirm(
        `Excluir ${item.nome}?`
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
        .eq("id", item.id)
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

    await carregar();
  }

  const grupos = {
    EQUIPE_OPERACIONAL:
      estruturas.filter(
        (item) =>
          item.categoria ===
          "EQUIPE_OPERACIONAL"
      ),

    POSTO_FIXO:
      estruturas.filter(
        (item) =>
          item.categoria ===
          "POSTO_FIXO"
      ),

    ADMINISTRATIVO:
      estruturas.filter(
        (item) =>
          item.categoria ===
          "ADMINISTRATIVO"
      ),
  };

  return (
    <ProtecaoModulo modulo="escalas">
      <main className="space-y-6 p-4 pb-24 text-white md:p-6">
        <header className="border-b border-slate-800 pb-5">
<p className="text-xs font-black uppercase tracking-[0.22em] text-cyan-400">
  Configuração institucional
</p>

<h1 className="mt-2 text-3xl font-black md:text-4xl">
  Estrutura Operacional da Guarda
</h1>

<p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400 md:text-base">
  Defina as equipes operacionais, postos fixos e setores
  administrativos existentes no município. Essa estrutura será
  utilizada automaticamente na geração das escalas.
</p>
        </header>

        <section className="rounded-2xl border border-cyan-500/20 bg-cyan-500/5 p-4">
  <p className="font-black text-cyan-300">
    Esta é uma configuração permanente
  </p>

  <p className="mt-1 text-sm leading-6 text-slate-400">
    Cadastre aqui somente os serviços que existem na Guarda.
    Os nomes dos guardas serão definidos depois, na escala diária
    ou mensal. Volte a esta página apenas quando criar, alterar ou
    encerrar uma equipe, posto ou setor.
  </p>
</section>

        <section className="flex gap-2 overflow-x-auto pb-1">
          <BotaoCategoria
            ativo={
              categoria ===
              "EQUIPE_OPERACIONAL"
            }
            texto="Equipes e viaturas"
            icone={CarFront}
            classe="text-blue-300 border-blue-500/30 bg-blue-500/10"
            onClick={() => {
              setCategoria(
                "EQUIPE_OPERACIONAL"
              );
              setSubtipo(
                "VIATURA"
              );
              setGuardasPorUnidade(
                "4"
              );
              setJornadaTipo(
                "24H"
              );
            }}
          />

          <BotaoCategoria
            ativo={
              categoria ===
              "POSTO_FIXO"
            }
            texto="Postos fixos"
            icone={ShieldCheck}
            classe="text-emerald-300 border-emerald-500/30 bg-emerald-500/10"
            onClick={() => {
              setCategoria(
                "POSTO_FIXO"
              );
              setSubtipo(
                "POSTO"
              );
              setGuardasPorUnidade(
                "1"
              );
              setJornadaTipo(
                "12H"
              );
            }}
          />

          <BotaoCategoria
            ativo={
              categoria ===
              "ADMINISTRATIVO"
            }
            texto="Setores administrativos"
            icone={Building2}
            classe="text-violet-300 border-violet-500/30 bg-violet-500/10"
            onClick={() => {
              setCategoria(
                "ADMINISTRATIVO"
              );
              setSubtipo(
                "SETOR"
              );
              setGuardasPorUnidade(
                "1"
              );
              setJornadaTipo(
                "8H"
              );
              setDiasSelecionados([
                1,
                2,
                3,
                4,
                5,
              ]);
            }}
          />
        </section>

        <section className="grid gap-6 xl:grid-cols-[1fr_1.4fr]">
          <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-5">
<h2 className="text-xl font-black">
  Cadastrar estrutura
</h2>

<p className="mt-1 text-sm text-slate-400">
  Cadastre um serviço permanente da Guarda.
</p>

            <div className="mt-5 space-y-4">
              <Campo
                label="Nome"
                valor={nome}
                setValor={setNome}
                placeholder={
                  categoria ===
                  "EQUIPE_OPERACIONAL"
                    ? "Ex.: Patrulhamento Ostensivo"
                    : categoria ===
                        "POSTO_FIXO"
                      ? "Ex.: Escola Central"
                      : "Ex.: Administrativo"
                }
              />

              <div className="grid gap-4 sm:grid-cols-2">
                <Campo
label={
  categoria === "EQUIPE_OPERACIONAL"
    ? "Quantas equipes deste tipo?"
    : categoria === "POSTO_FIXO"
      ? "Quantos postos deste tipo?"
      : "Quantos setores deste tipo?"
}
                  valor={
                    quantidadeUnidades
                  }
                  setValor={(valor) =>
                    setQuantidadeUnidades(
                      valor.replace(
                        /\D/g,
                        ""
                      )
                    )
                  }
                  type="number"
                />

                <Campo
label={
  categoria === "EQUIPE_OPERACIONAL"
    ? "Vagas por equipe"
    : categoria === "POSTO_FIXO"
      ? "Vagas por posto"
      : "Vagas no setor"
}
                  valor={
                    guardasPorUnidade
                  }
                  setValor={(valor) =>
                    setGuardasPorUnidade(
                      valor.replace(
                        /\D/g,
                        ""
                      )
                    )
                  }
                  type="number"
                />
              </div>

              <div>
                <label className="label">
                  Jornada
                </label>

                <select
                  className="input"
                  value={
                    jornadaTipo
                  }
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

              <div className="grid gap-4 sm:grid-cols-2">
                <Campo
                  label="Entrada"
                  valor={
                    horarioInicio
                  }
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

              <div>
                <label className="label">
                  Dias da semana
                </label>

                <div className="mt-2 flex flex-wrap gap-2">
                  {diasSemana.map(
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
                            ? "border-cyan-500/40 bg-cyan-500/15 text-cyan-300"
                            : "border-slate-700 bg-slate-900 text-slate-400"
                        }`}
                      >
                        {dia.nome}
                      </button>
                    )
                  )}
                </div>
              </div>

              {categoria === "EQUIPE_OPERACIONAL" && (
  <div>
    <label className="label">
      Viatura da Frota
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
        Sem viatura definida
      </option>

      {viaturas.map((viatura: Viatura) => (
        <option
          key={viatura.id}
          value={viatura.id}
        >
          {viatura.prefixo ||
            `Viatura ${viatura.id}`}
          {" • "}
          {viatura.modelo || "Modelo não informado"}
          {" • "}
          {viatura.placa ||
            "Sem placa"}
          {" • "}
          {viatura.status ||
            "Status não informado"}
        </option>
      ))}
    </select>

    {viaturas.length === 0 && (
      <p className="mt-2 text-sm text-yellow-300">
        Nenhuma viatura cadastrada na Frota deste município.
      </p>
    )}
  </div>
)}

              {categoria ===
                "EQUIPE_OPERACIONAL" && (
                <div className="space-y-3 rounded-2xl border border-blue-500/20 bg-blue-500/5 p-4">
                  <Opcao
                    texto="Exigir comandante"
                    marcado={
                      exigeComandante
                    }
                    setMarcado={
                      setExigeComandante
                    }
                  />

                  <Opcao
                    texto="Exigir motorista"
                    marcado={
                      exigeMotorista
                    }
                    setMarcado={
                      setExigeMotorista
                    }
                  />

                  <Opcao
                    texto="Usa viatura"
                    marcado={
                      exigeViatura
                    }
                    setMarcado={
                      setExigeViatura
                    }
                  />

                  <Opcao
                    texto="Exige armamento"
                    marcado={
                      exigeArmamento
                    }
                    setMarcado={
                      setExigeArmamento
                    }
                  />
                </div>
              )}

              <button
                type="button"
                onClick={() =>
                  void salvar()
                }
                disabled={salvando}
                className="btn-primary flex w-full items-center justify-center gap-2 disabled:opacity-50"
              >
                <Save className="h-5 w-5" />

{salvando
  ? "Salvando..."
  : "Salvar estrutura"}
              </button>
            </div>
          </div>

          <div className="space-y-5">
            <ListaGrupo
              titulo="Equipes e serviços operacionais"
              cor="blue"
              icone={CarFront}
              itens={
                grupos.EQUIPE_OPERACIONAL
              }
              carregando={carregando}
              viaturas={viaturas}
              onExcluir={excluir}
            />

            <ListaGrupo
              titulo="Postos fixos"
              cor="emerald"
              icone={ShieldCheck}
              itens={
                grupos.POSTO_FIXO
              }
              carregando={carregando}
              viaturas={viaturas}
              onExcluir={excluir}
            />

            <ListaGrupo
              titulo="Setores administrativos"
              cor="violet"
              icone={Building2}
              itens={
                grupos.ADMINISTRATIVO
              }
              carregando={carregando}
              viaturas={viaturas}
              onExcluir={excluir}
            />
          </div>
        </section>
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

function Opcao({
  texto,
  marcado,
  setMarcado,
}: {
  texto: string;
  marcado: boolean;
  setMarcado: (
    valor: boolean
  ) => void;
}) {
  return (
    <label className="flex items-center gap-3">
      <input
        type="checkbox"
        checked={marcado}
        onChange={(event) =>
          setMarcado(
            event.target.checked
          )
        }
      />

      <span className="text-sm font-bold text-slate-300">
        {texto}
      </span>
    </label>
  );
}

function BotaoCategoria({
  ativo,
  texto,
  icone: Icone,
  classe,
  onClick,
}: {
  ativo: boolean;
  texto: string;
  icone: any;
  classe: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex min-w-max items-center gap-2 rounded-xl border px-4 py-3 font-black transition ${classe} ${
        ativo
          ? "ring-2 ring-white/20"
          : "opacity-60"
      }`}
    >
      <Icone className="h-5 w-5" />
      {texto}
    </button>
  );
}

function ListaGrupo({
  titulo,
  icone: Icone,
  itens,
  viaturas,
  carregando,
  onExcluir,
  cor,
}: {
  titulo: string;
  icone: any;
  itens: Estrutura[];
  viaturas: Viatura[];
  carregando: boolean;
  onExcluir: (
    item: Estrutura
  ) => void;
  cor:
    | "blue"
    | "emerald"
    | "violet";
}) {
  const cores = {
    blue:
      "border-blue-500/20 text-blue-300",
    emerald:
      "border-emerald-500/20 text-emerald-300",
    violet:
      "border-violet-500/20 text-violet-300",
  };

  return (
    <div className={`rounded-2xl border bg-slate-950/70 ${cores[cor]}`}>
      <div className="flex items-center gap-3 border-b border-slate-800 px-5 py-4">
        <Icone className="h-6 w-6" />

        <h2 className="text-lg font-black text-white">
          {titulo}
        </h2>

        <span className="ml-auto rounded-full bg-slate-900 px-3 py-1 text-xs font-black text-slate-300">
          {itens.length}
        </span>
      </div>

      {carregando ? (
        <p className="p-5 text-slate-400">
          Carregando...
        </p>
      ) : itens.length === 0 ? (
        <p className="p-5 text-sm text-slate-500">
          Nenhum serviço cadastrado.
        </p>
      ) : (
        <div className="divide-y divide-slate-800">
          {itens.map((item) => (
            <div
              key={item.id}
              className="flex items-center gap-4 px-5 py-4"
            >
              <div className="min-w-0 flex-1">
                <p className="font-black text-white">
                  {item.nome}
                </p>

<p className="mt-1 text-sm text-slate-400">
  {item.guardas_por_unidade} guarda(s)
  {" • "}
  {item.jornada_tipo}
  {" • "}
  {String(
    item.horario_inicio
  ).slice(0, 5)}
  {" às "}
  {item.horario_fim
    ? String(
        item.horario_fim
      ).slice(0, 5)
    : "-"}
</p>

{item.viatura_id && (
  <p className="mt-1 text-xs font-bold text-blue-300">
    Viatura vinculada:{" "}
    {viaturas.find(
      (viatura: Viatura) =>
        Number(viatura.id) ===
        Number(item.viatura_id)
    )?.prefixo ||
      `#${item.viatura_id}`}
  </p>
)}
              </div>

              <button
                type="button"
                onClick={() =>
                  void onExcluir(item)
                }
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-red-500/30 bg-red-500/10 text-red-300 hover:bg-red-500/20"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}