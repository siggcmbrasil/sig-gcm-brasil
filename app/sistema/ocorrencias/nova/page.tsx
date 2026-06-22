"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Guarda = {
  id: number;
  matricula: string;
  nome: string;
  cargo: string;
  status: string;
};

type Viatura = {
  id: number;
  prefixo: string;
  modelo: string;
  placa: string;
  status: string;
};

type LocalCadastrado = {
  id: number;
  nome: string;
  tipo: string;
};

type Envolvido = {
  nome: string;
  documento: string;
  telefone: string;
  endereco: string;
  tipo: string;
  observacao: string;
};

type VeiculoEnvolvido = {
  placa: string;
  marca: string;
  modelo: string;
  cor: string;
  ano: string;
  renavam: string;
  proprietario: string;
  cpf_proprietario: string;
  condutor: string;
  documento_condutor: string;
  situacao: string;
  observacao: string;
  situacao_consulta: string;
};

type ObjetoEnvolvido = {
  categoria: string;
  descricao: string;
  marca: string;
  modelo: string;
  calibre: string;
  numeracao: string;
  quantidade: string;
  peso: string;
  unidade_peso: string;
  valor_estimado: string;
  procedencia: string;
  situacao: string;
  observacao: string;
};

type Guarnicao = {
  id: number;
  nome: string;
};

type ConfigEscalaOperacional = {
  id: number;
  data_base: string;
  guarnicao_base_id: number;
  ordem_guarnicoes: number[];
};

type GuarnicaoCompleta = {
  id: number;
  nome: string;
  comandante_id: number | null;
  viatura_id: number | null;
};

type MembroGuarnicao = {
  guarda_id: number;
};

export default function NovaOcorrencia() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const chamadoId = searchParams.get("chamado");
  const [guardas, setGuardas] = useState<Guarda[]>([]);
  const [viaturas, setViaturas] = useState<Viatura[]>([]);
  const [guardasSelecionados, setGuardasSelecionados] = useState<string[]>([]);
  const [tipo, setTipo] = useState("");
  const [guardaResponsavelId, setGuardaResponsavelId] = useState("");
  const [status, setStatus] = useState("Aberta");
  const [prioridade, setPrioridade] = useState("MEDIA");
  const [bairro, setBairro] = useState("");
  const [local, setLocal] = useState("");
  const [localId, setLocalId] = useState("");
  const [numero, setNumero] = useState("");
  const [descricao, setDescricao] = useState("");
  const [fotos, setFotos] = useState<File[]>([]);
  const [salvando, setSalvando] = useState(false);
  const [municipioId, setMunicipioId] = useState<number>(1);
  const [locais, setLocais] = useState<LocalCadastrado[]>([]);
  const [guarnicoes, setGuarnicoes] = useState<GuarnicaoCompleta[]>([]);
  const [guarnicaoId, setGuarnicaoId] = useState("");
  const [viaturaEmpenhada, setViaturaEmpenhada] = useState("");
  const [viaturaId, setViaturaId] = useState("");
  const [abrirVeiculos, setAbrirVeiculos] = useState(true);
  const [historicoVeiculo, setHistoricoVeiculo] = useState<any[]>([]);
  const [historicoEnvolvido, setHistoricoEnvolvido] = useState<any[]>([]);
  const [abrirObjetos, setAbrirObjetos] = useState(true);
  const [gerandoNarrativa, setGerandoNarrativa] = useState(false);
  const [objetosEnvolvidos, setObjetosEnvolvidos] =
  useState<ObjetoEnvolvido[]>([
    {
  categoria: "",
  descricao: "",
  marca: "",
  modelo: "",
  calibre: "",
  numeracao: "",
  quantidade: "1",
  situacao: "",
  observacao: "",
  peso: "",
unidade_peso: "g",
valor_estimado: "",
procedencia: "",
},
  ]);
  const [envolvidos, setEnvolvidos] = useState<Envolvido[]>([
    
    {
      nome: "",
      documento: "",
      telefone: "",
      endereco: "",
      tipo: "Vítima",
      observacao: "",
    },
    
  ]);

  const [mostrarVeiculos, setMostrarVeiculos] = useState(false);
const [mostrarObjetos, setMostrarObjetos] = useState(false);

const [veiculosEnvolvidos, setVeiculosEnvolvidos] = useState<VeiculoEnvolvido[]>([
  {
    placa: "",
    marca: "",
    modelo: "",
    cor: "",
    ano: "",
    renavam: "",
    proprietario: "",
    cpf_proprietario: "",
    condutor: "",
    documento_condutor: "",
    situacao: "",
    observacao: "",
    situacao_consulta: "",
  },
]);
  async function carregarLocais(municipio: number) {
  const { data, error } = await supabase
  .from("locais")
  .select("id,nome,tipo")
  .eq("municipio_id", municipio)
  .eq("ativo", true)
  .order("nome");

  if (error) {
    console.error(error);
    return;
  }

  setLocais(data || []);
}

  async function carregarGuardas(municipio: number) {
    const { data, error } = await supabase
  .from("guardas")
  .select("id, matricula, nome, cargo, status")
  .eq("municipio_id", municipio)
  .order("nome", { ascending: true });

    if (error) {
      console.error(error);
      alert("Erro ao carregar guardas.");
      return;
    }

    setGuardas(data || []);
  }

  async function carregarGuarnicoes(municipio: number) {
  const { data, error } = await supabase
    .from("guarnicoes")
    .select("id, nome, comandante_id, viatura_id")
    .eq("municipio_id", municipio)
    .eq("ativa", true)
    .order("nome");

  if (error) {
    console.error(error);
    alert("Erro ao carregar guarnições.");
    return;
  }

  setGuarnicoes(data || []);
}

  async function carregarViaturas(municipio: number) {
  const { data, error } = await supabase
    .from("viaturas")
    .select("id, prefixo, modelo, placa, status")
    .eq("municipio_id", municipio)
    .in("status", ["Operacional", "Reserva"])
    .order("prefixo", { ascending: true });

  if (error) {
    console.error(error);
    alert("Erro ao carregar viaturas.");
    return;
  }

  setViaturas(data || []);
}

  function selecionarGuarda(nome: string) {
    if (guardasSelecionados.includes(nome)) {
      setGuardasSelecionados(
        guardasSelecionados.filter((item) => item !== nome)
      );
      return;
    }

    setGuardasSelecionados([...guardasSelecionados, nome]);
  }

  function atualizarEnvolvido(
    index: number,
    campo: keyof Envolvido,
    valor: string
  ) {
    const novaLista = [...envolvidos];
    novaLista[index][campo] = valor;
    setEnvolvidos(novaLista);
  }

  function adicionarEnvolvido() {
    setEnvolvidos([
      ...envolvidos,
      {
        nome: "",
        documento: "",
        telefone: "",
        endereco: "",
        tipo: "Vítima",
        observacao: "",
      },
    ]);
  }

  function removerEnvolvido(index: number) {
    if (envolvidos.length === 1) {
      alert("É necessário manter pelo menos um campo de envolvido.");
      return;
    }

    setEnvolvidos(envolvidos.filter((_, i) => i !== index));
  }

  async function salvarOcorrencia(
  statusPersonalizado?: string
) {
    if (!tipo || !localId || !descricao) {
  alert("Preencha tipo, local e descrição.");
  return;
}

    setSalvando(true);

   const agora = new Date();
const protocolo = "OC-" + Date.now();

const data = agora.toLocaleDateString("en-CA", {
  timeZone: "America/Bahia",
});

const hora = agora.toLocaleTimeString("pt-BR", {
  timeZone: "America/Bahia",
  hour12: false,
});

    const fotosUrls: string[] = [];

    if (fotos.length > 0) {
      for (const foto of fotos) {
        const nomeArquivo = `${protocolo}-${Date.now()}-${foto.name}`;

        const { error: uploadError } = await supabase.storage
          .from("fotos-ocorrencias")
          .upload(nomeArquivo, foto);

        if (uploadError) {
          console.error(uploadError);
          alert("Erro ao enviar uma das fotos.");
          setSalvando(false);
          return;
        }

        const { data: urlData } = supabase.storage
          .from("fotos-ocorrencias")
          .getPublicUrl(nomeArquivo);

        fotosUrls.push(urlData.publicUrl);
      }
    }

    const envolvidosValidos = envolvidos.filter(
      (pessoa) =>
        pessoa.nome ||
        pessoa.documento ||
        pessoa.telefone ||
        pessoa.endereco ||
        pessoa.observacao
    );

    const equipeEmpenhada = guardasSelecionados.join("\n");

    const { error } = await supabase.from("ocorrencias").insert([
  {
    municipio_id: municipioId,
    guarnicao_id: guarnicaoId ? Number(guarnicaoId) : null,
    viatura_id: viaturaId ? Number(viaturaId) : null,
    guarda_responsavel_id: guardaResponsavelId
  ? Number(guardaResponsavelId)
  : null,
    protocolo,
    tipo,
    status: statusPersonalizado || status,
    prioridade,
    data,
    hora,
    bairro,
    local,
    local_id: localId ? Number(localId) : null,
    numero,
    envolvidos: JSON.stringify(envolvidosValidos),
    veiculos_envolvidos: JSON.stringify(veiculosEnvolvidos),
    armas_objetos: JSON.stringify(objetosEnvolvidos),
    descricao,
    foto_url: fotosUrls[0] || "",
    fotos_urls: JSON.stringify(fotosUrls),
    viatura_empenhada: viaturaEmpenhada,
    equipe_empenhada: equipeEmpenhada,
  },
]);

    setSalvando(false);

    if (error) {
      console.error(error);
      alert("Erro ao salvar ocorrência.");
      return;
    }

    alert("Ocorrência salva com sucesso!");
    router.push("/sistema/ocorrencias");
  }

  const usuarioLogado =
  typeof window !== "undefined"
    ? JSON.parse(localStorage.getItem("usuarioLogado") || "{}")
    : {};

async function carregarMembrosGuarnicao(
  guarnicaoId: number
) {
  const { data: membros } = await supabase
    .from("guarnicao_membros")
    .select("guarda_id")
    .eq("guarnicao_id", guarnicaoId);

  if (!membros) return;

  const ids = membros.map(
    (m: MembroGuarnicao) => m.guarda_id
  );

  const { data: guardasData } = await supabase
    .from("guardas")
    .select("id,nome")
    .eq("municipio_id", usuarioLogado.municipio_id)
    .in("id", ids);

  if (!guardasData) return;

  setGuardasSelecionados(
    guardasData.map((g) => g.nome)
  );
}
async function carregarChamadoOrigem(id: string) {
  const { data, error } = await supabase
    .from("chamados")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !data) {
    console.error(error);
    return;
  }

  setTipo(data.tipo || "");
  setLocal(data.local || "");
  setDescricao(
    `Ocorrência gerada a partir do chamado ${data.protocolo}.

Solicitante: ${data.solicitante || "-"}
Telefone: ${data.telefone || "-"}
Prioridade: ${data.prioridade || "-"}
Observação: ${data.observacao || "-"}`
  );

  setEnvolvidos([
    {
      nome: data.solicitante || "",
      documento: "",
      telefone: data.telefone || "",
      endereco: "",
      tipo: "Solicitante",
      observacao: data.observacao || "",
    },
  ]);
}

async function carregarSistema() {
  const { data } = await supabase
    .from("configuracoes_sistema")
    .select("municipio_padrao_id")
    .limit(1)
    .single();

  const usuarioLogado = JSON.parse(
  localStorage.getItem("usuarioLogado") || "{}"
);

const id = usuarioLogado.municipio_id;

  const { data: configEscala } = await supabase
  .from("escala_operacional_config")
  .select("*")
  .eq("municipio_id", id)
  .eq("ativo", true)
  .single();

const { data: guarnicoesData } = await supabase
  .from("guarnicoes")
  .select("id,nome,comandante_id,viatura_id")
  .eq("municipio_id", id)
  .eq("ativa", true);

if (
  configEscala &&
  guarnicoesData &&
  configEscala.ordem_guarnicoes?.length
) {
  const dataBase = new Date(
    `${configEscala.data_base}T07:00:00`
  );

  const agora = new Date();

  const diasPassados = Math.floor(
    (agora.getTime() - dataBase.getTime()) /
      (1000 * 60 * 60 * 24)
  );

  const ordem = configEscala.ordem_guarnicoes;

  const indiceBase = ordem.findIndex(
    (g: number) =>
      g === configEscala.guarnicao_base_id
  );

  const indiceAtual =
    ((indiceBase + diasPassados) %
      ordem.length +
      ordem.length) %
    ordem.length;

  const guarnicaoAtual =
    guarnicoesData.find(
      (g: any) =>
        g.id === ordem[indiceAtual]
    );

  if (guarnicaoAtual) {
  setGuarnicaoId(String(guarnicaoAtual.id));

  if (guarnicaoAtual.viatura_id) {
    const { data: viaturaAtual } = await supabase
      .from("viaturas")
      .select("prefixo")
      .eq("id", guarnicaoAtual.viatura_id)
      .single();

    if (viaturaAtual) {
      setViaturaEmpenhada(viaturaAtual.prefixo);
    }

    setViaturaId(String(guarnicaoAtual.viatura_id));
  }

  await carregarMembrosGuarnicao(
    guarnicaoAtual.id
  );

  if (guarnicaoAtual.comandante_id) {
    setGuardaResponsavelId(
      String(guarnicaoAtual.comandante_id)
    );
  }
}
}

  setMunicipioId(id);

  carregarGuardas(id);
  carregarGuarnicoes(id);
  carregarViaturas(id);
  carregarLocais(id);
}

  useEffect(() => {
  carregarSistema();

  if (chamadoId) {
    carregarChamadoOrigem(chamadoId);
  }
}, [chamadoId]);

function adicionarVeiculo() {
  setVeiculosEnvolvidos([
    ...veiculosEnvolvidos,
    {
      placa: "",
      marca: "",
      modelo: "",
      cor: "",
      ano: "",
      renavam: "",
      proprietario: "",
      cpf_proprietario: "",
      condutor: "",
      documento_condutor: "",
      situacao: "",
      observacao: "",
      situacao_consulta: "",
    },
  ]);
}

function removerVeiculo(index: number) {
  if (veiculosEnvolvidos.length === 1) {
    alert("É necessário manter pelo menos um veículo.");
    return;
  }

  setVeiculosEnvolvidos(
    veiculosEnvolvidos.filter((_, i) => i !== index)
  );
}

function atualizarVeiculo(
  index: number,
  campo: keyof VeiculoEnvolvido,
  valor: string
) {
  const lista = [...veiculosEnvolvidos];
  lista[index][campo] = valor;
  setVeiculosEnvolvidos(lista);
}

function adicionarObjeto() {
  setObjetosEnvolvidos([
    ...objetosEnvolvidos,
    {
  categoria: "",
  descricao: "",
  marca: "",
  modelo: "",
  calibre: "",
  numeracao: "",
  quantidade: "1",
  situacao: "",
  observacao: "",
  peso: "",
unidade_peso: "g",
valor_estimado: "",
procedencia: "",
},
  ]);
}

function removerObjeto(index: number) {
  if (objetosEnvolvidos.length === 1) {
    alert("É necessário manter pelo menos um item.");
    return;
  }

  setObjetosEnvolvidos(
    objetosEnvolvidos.filter((_, i) => i !== index)
  );
}

function atualizarObjeto(
  index: number,
  campo: keyof ObjetoEnvolvido,
  valor: string
) {
  const lista = [...objetosEnvolvidos];
  lista[index][campo] = valor;
  setObjetosEnvolvidos(lista);
}

async function gerarNarrativaIA() {
  if (!tipo) {
    alert("Selecione o tipo da ocorrência antes de gerar a narrativa.");
    return;
  }

  setGerandoNarrativa(true);

  try {
    const resposta = `
Durante o serviço de patrulhamento, a equipe da Guarda Civil Municipal foi acionada para atendimento de ocorrência do tipo ${tipo}.

A ocorrência foi registrada no local ${local || "não informado"}, bairro ${bairro || "não informado"}, número ${numero || "S/N"}.

A guarnição empenhada foi ${guarnicaoId ? "a guarnição selecionada" : "não informada"}, com apoio da viatura ${viaturaEmpenhada || "não informada"}.

No local, a equipe realizou a verificação da situação, identificou os envolvidos relacionados ao fato e adotou as providências cabíveis, conforme os dados registrados nesta ocorrência.

Após a averiguação, a situação foi registrada no sistema SIG-GCM Brasil para acompanhamento, controle operacional e emissão do relatório oficial.
`;

    setDescricao(resposta.trim());
  } catch (error) {
    console.error(error);
    alert("Erro ao gerar narrativa.");
  } finally {
    setGerandoNarrativa(false);
  }
}

async function consultarHistoricoVeiculo(placa: string) {
  if (!placa || placa.length < 7) {
    setHistoricoVeiculo([]);
    return;
  }

  const { data, error } = await supabase
    .from("ocorrencias")
    .select("id, protocolo, data, status, veiculos_envolvidos")
    .order("data", { ascending: false });

  if (error || !data) return;

  const resultados = data.filter((oc) => {
    try {
      const veiculos = JSON.parse(
        oc.veiculos_envolvidos || "[]"
      );

      return veiculos.some(
        (v: any) =>
          v.placa?.toUpperCase() === placa.toUpperCase()
      );
    } catch {
      return false;
    }
  });

  setHistoricoVeiculo(resultados);
}

async function consultarHistoricoEnvolvido(valor: string) {
  if (!valor || valor.length < 3) {
    setHistoricoEnvolvido([]);
    return;
  }

  const busca = valor.toUpperCase();

  const { data, error } = await supabase
    .from("ocorrencias")
    .select("id, protocolo, data, status, envolvidos")
    .order("data", { ascending: false });

  if (error || !data) return;

  const resultados = data.filter((oc) => {
    try {
      const pessoas = JSON.parse(oc.envolvidos || "[]");

      return pessoas.some((p: any) => {
        const nome = String(p.nome || "").toUpperCase();
        const documento = String(p.documento || "").toUpperCase();

        return nome.includes(busca) || documento.includes(busca);
      });
    } catch {
      return false;
    }
  });

  setHistoricoEnvolvido(resultados);
}

function gerarNarrativaAutomatica() {
  if (!tipo) {
    alert("Selecione o tipo da ocorrência.");
    return;
  }

  setGerandoNarrativa(true);

  const envolvidosTexto = envolvidos
    .filter((p) => p.nome || p.documento || p.tipo)
    .map((p) => `${p.tipo}: ${p.nome || "não informado"}${p.documento ? `, documento ${p.documento}` : ""}`)
    .join("; ");

  const veiculosTexto = veiculosEnvolvidos
    .filter((v) => v.placa || v.modelo || v.condutor)
    .map((v) => `${v.placa ? `placa ${v.placa}` : "veículo sem placa"}${v.marca ? `, marca ${v.marca}` : ""}${v.modelo ? `, modelo ${v.modelo}` : ""}${v.cor ? `, cor ${v.cor}` : ""}${v.condutor ? `, conduzido por ${v.condutor}` : ""}`)
    .join("; ");

  const objetosTexto = objetosEnvolvidos
    .filter((o) => o.categoria || o.descricao || o.quantidade)
    .map((o) => `${o.categoria || "objeto"}${o.descricao ? `: ${o.descricao}` : ""}${o.quantidade ? `, quantidade ${o.quantidade}` : ""}${o.peso ? `, peso ${o.peso} ${o.unidade_peso}` : ""}`)
    .join("; ");

  const texto = `Durante o serviço operacional, a equipe da Guarda Civil Municipal registrou ocorrência do tipo ${tipo}, no local ${local || "não informado"}, bairro ${bairro || "não informado"}, número ${numero || "S/N"}.

A guarnição empenhada realizou a averiguação da situação, adotando as providências cabíveis conforme os dados coletados no local.

${envolvidosTexto ? `Envolvidos identificados: ${envolvidosTexto}.` : ""}

${veiculosTexto ? `Veículos relacionados à ocorrência: ${veiculosTexto}.` : ""}

${objetosTexto ? `Objetos relacionados à ocorrência: ${objetosTexto}.` : ""}

Após o atendimento, a ocorrência foi registrada no SIG-GCM Brasil para controle operacional, acompanhamento administrativo e emissão do relatório oficial.`;

  setDescricao(texto.trim());
  setGerandoNarrativa(false);
}

function removerFoto(index: number) {
  setFotos(
    fotos.filter((_, i) => i !== index)
  );
}

  return (
    <div className="p-3 md:p-6 pb-24">
      <header className="border-b border-slate-800 pb-5 mb-6">
        <h1 className="text-3xl font-bold">Nova Ocorrência</h1>
        <p className="text-slate-400">
          Preencha os dados da ocorrência registrada pela GCM.
        </p>
      </header>

      <form className="card space-y-6">
        <h2 className="text-2xl font-bold">
  Dados da Ocorrência
</h2>

<div className="grid grid-cols-1 md:grid-cols-3 gap-3">
  <button
    type="button"
    onClick={() => {
      setMostrarVeiculos(false);
      setMostrarObjetos(false);
    }}
    className={`p-3 rounded-xl border font-semibold ${
      !mostrarVeiculos && !mostrarObjetos
        ? "bg-blue-600 border-blue-500"
        : "bg-slate-900 border-slate-700"
    }`}
  >
    Ocorrência Comum
  </button>

  <button
    type="button"
    onClick={() => setMostrarVeiculos(!mostrarVeiculos)}
    className={`p-3 rounded-xl border font-semibold ${
      mostrarVeiculos
        ? "bg-green-600 border-green-500"
        : "bg-slate-900 border-slate-700"
    }`}
  >
    🚗 Veículos {mostrarVeiculos ? "✓" : ""}
  </button>

  <button
    type="button"
    onClick={() => setMostrarObjetos(!mostrarObjetos)}
    className={`p-3 rounded-xl border font-semibold ${
      mostrarObjetos
        ? "bg-red-600 border-red-500"
        : "bg-slate-900 border-slate-700"
    }`}
  >
    📦 Objetos {mostrarObjetos ? "✓" : ""}
  </button>
</div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="label">Tipo da ocorrência</label>
            <select
  className="input"
  value={tipo}
  onChange={(e) => setTipo(e.target.value)}
>
              <option value="">Selecione</option>
              <option value="Perturbação do sossego">Perturbação do sossego</option>
              <option value="Apoio ao cidadão">Apoio ao cidadão</option>
              <option value="Patrulhamento preventivo">Patrulhamento preventivo</option>
              <option value="Apoio a outro órgão">Apoio a outro órgão</option>
              <option value="Fiscalização">Fiscalização</option>
              <option value="Acidente">Acidente</option>
              <option value="Conselho Tutelar">Conselho Tutelar</option>
              <option value="CAPS">CAPS</option>
              <option value="Apoio em evento esportivo">Apoio em evento esportivo</option>
              <option value="Apoio em evento cultural">Apoio em evento cultural</option>
              <option value="Apoio em evento religioso">Apoio em evento religioso</option>
              <option value="Ronda escolar">Ronda escolar</option>
              <option value="Apoio à escola">Apoio à escola</option>
              <option value="Apoio à saúde">Apoio à saúde</option>
              <option value="Apoio ao CRAS">Apoio ao CRAS</option>
              <option value="Apoio à fiscalização municipal">Apoio à fiscalização municipal</option>
              <option value="Averiguação de denúncia">Averiguação de denúncia</option>
              <option value="Apoio à Polícia Militar">Apoio à Polícia Militar</option>
              <option value="Apoio à Polícia Civil">Apoio à Polícia Civil</option>
              <option value="Orientação ao público">Orientação ao público</option>
              <option value="Outro">Outro</option>
            </select>
          </div>

          <div>
            <label className="label">Status</label>
            <select
              className="input"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="RASCUNHO">📝 Rascunho</option>
              <option value="Aberta">Aberta</option>
              <option value="Em andamento">Em andamento</option>
              <option value="Finalizada">Finalizada</option>
            </select>
          </div>

<div>
  <label className="label">Prioridade</label>

  <select
    className="input"
    value={prioridade}
    onChange={(e) => setPrioridade(e.target.value)}
  >
    <option value="BAIXA">🟢 Baixa</option>
    <option value="MEDIA">🟡 Média</option>
    <option value="ALTA">🔴 Alta</option>
  </select>
</div>

        </div>
        <div className="border-t border-slate-800 pt-6">
  <h2 className="text-2xl font-bold mb-4">
    Equipe Operacional
  </h2>

  <label className="label">Guarnição empenhada</label>

  <select
    className="input"
    value={guarnicaoId}
    onChange={(e) => setGuarnicaoId(e.target.value)}
  >
    <option value="">Selecione a guarnição</option>

    {guarnicoes.map((g) => (
      <option key={g.id} value={g.id}>
        {g.nome}
      </option>
    ))}
  </select>
</div>

<div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
  <div>
    <label className="label">Guarda responsável</label>

    <select
      className="input"
      value={guardaResponsavelId}
      onChange={(e) => setGuardaResponsavelId(e.target.value)}
    >
      <option value="">Selecione o guarda responsável</option>

      {guardas.map((guarda) => (
        <option key={guarda.id} value={guarda.id}>
          {guarda.nome} • {guarda.matricula}
        </option>
      ))}
    </select>
  </div>

  <div>
    <label className="label">Viatura empenhada</label>

    <select
      className="input"
      value={viaturaId}
      onChange={(e) => {
        const id = e.target.value;
        setViaturaId(id);

        const viatura = viaturas.find((v) => String(v.id) === id);
        setViaturaEmpenhada(viatura?.prefixo || "");
      }}
    >
      <option value="">Selecione a viatura</option>

      {viaturas.map((viatura) => (
        <option key={viatura.id} value={viatura.id}>
          {viatura.prefixo} - {viatura.modelo}
        </option>
      ))}
    </select>
  </div>
</div>

        <div className="border-t border-slate-800 pt-6 space-y-4">
          <h2 className="text-2xl font-bold">Equipe Empenhada</h2>

          <div>
  <label className="label">Selecionar guardas</label>

  <select
    className="input"
    onChange={(e) => {
      const nome = e.target.value;

      if (!nome) return;

      if (!guardasSelecionados.includes(nome)) {
        setGuardasSelecionados([
          ...guardasSelecionados,
          nome,
        ]);
      }

      e.target.value = "";
    }}
  >
    <option value="">
      Selecione ou busque guardas para adicionar
    </option>

    {guardas.map((guarda) => (
      <option
        key={guarda.id}
        value={guarda.nome}
      >
        {guarda.nome} • {guarda.cargo}
      </option>
    ))}
  </select>
</div>

<div className="grid grid-cols-1 md:grid-cols-2 gap-3">
  {guardasSelecionados.map((nome) => {
    const guarda = guardas.find(
      (g) => g.nome === nome
    );

    if (!guarda) return null;
    
    return (
      <div
        key={guarda.id}
        className="relative bg-slate-950/40 border border-slate-700 rounded-xl p-4"
      >
        <button
          type="button"
          onClick={() =>
            setGuardasSelecionados(
              guardasSelecionados.filter(
                (g) => g !== guarda.nome
              )
            )
          }
          className="absolute top-2 right-3 text-red-400 text-xl"
        >
          ×
        </button>

        <p className="font-bold">
          {guarda.nome}
        </p>

        <p className="text-sm text-slate-400">
          {guarda.matricula} • {guarda.cargo}
        </p>

        <p className="text-xs text-blue-400">
          {guarda.status}
        </p>
      </div>
    );
  })}
</div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Campo label="Bairro" valor={bairro} setValor={setBairro} placeholder="Ex: Centro" />
          <div>
  <select
  className="input"
  value={localId}
  onChange={(e) => {
    const id = e.target.value;

    setLocalId(id);

    const localSelecionado = locais.find(
      (l) => String(l.id) === id
    );

    setLocal(localSelecionado?.nome || "");
  }}
>
    <option value="">
      Selecione um local cadastrado
    </option>

    {locais.map((item) => (
      <option
  key={item.id}
  value={item.id}
>
  {item.nome} - {item.tipo}
</option>
    ))}
  </select>
</div>
          <Campo label="Número" valor={numero} setValor={setNumero} placeholder="S/N" />
        </div>

        <div className="border-t border-slate-800 pt-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4">
            <div>
              <h2 className="text-2xl font-bold">
  Envolvidos ({envolvidos.length})
</h2>
              <p className="text-slate-400 text-sm">
                Cadastre uma ou mais pessoas relacionadas à ocorrência.
              </p>
            </div>

            <button
              type="button"
              onClick={adicionarEnvolvido}
              className="bg-green-700 hover:bg-green-800 px-5 py-3 rounded-xl font-semibold"
            >
              + Adicionar Envolvido
            </button>
          </div>

          <div className="space-y-5">
            {envolvidos.map((pessoa, index) => (
              <div
                key={index}
                className="bg-slate-950/40 border border-slate-700 rounded-xl p-4 space-y-4"
              >
                <div className="flex justify-between items-center">
                  <h3 className="font-bold text-lg">Envolvido {index + 1}</h3>

                  <button
                    type="button"
                    onClick={() => removerEnvolvido(index)}
                    className="bg-red-700 hover:bg-red-800 px-3 py-2 rounded-lg text-sm"
                  >
                    Remover
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
  <div className="md:col-span-4">
    <Campo
      label="Nome completo"
      valor={pessoa.nome}
      setValor={(valor) => atualizarEnvolvido(index, "nome", valor)}
      placeholder="Nome do envolvido"
    />
  </div>

  <div className="md:col-span-2">
    <Campo
  label="Documento"
  valor={pessoa.documento}
  setValor={(valor) => {
    atualizarEnvolvido(index, "documento", valor);
    consultarHistoricoEnvolvido(valor);
  }}
  placeholder="RG, CPF ou outro"
/>

{historicoEnvolvido.length > 0 && pessoa.documento && (
  <div className="md:col-span-12 bg-purple-950/30 border border-purple-700 rounded-xl p-4">
    <p className="font-bold text-purple-400">
      👤 Histórico encontrado para este envolvido
    </p>

    <p className="text-sm text-slate-300 mt-1">
      {historicoEnvolvido.length} ocorrência(s) relacionada(s).
    </p>

    <div className="mt-3 space-y-2">
      {historicoEnvolvido.slice(0, 3).map((oc) => (
        <div
          key={oc.id}
          className="bg-slate-950/50 border border-slate-700 rounded-lg p-3 text-sm"
        >
          <p className="font-semibold">{oc.protocolo}</p>
          <p className="text-slate-400">
            Data: {oc.data} • Status: {oc.status}
          </p>
        </div>
      ))}
    </div>
  </div>
)}

  </div>

  <div className="md:col-span-2">
    <Campo
      label="Telefone"
      valor={pessoa.telefone}
      setValor={(valor) => atualizarEnvolvido(index, "telefone", valor)}
      placeholder="(75) 99999-9999"
    />
  </div>

  <div className="md:col-span-2">
    <label className="label">Tipo</label>
    <select
      className="input"
      value={pessoa.tipo}
      onChange={(e) =>
        atualizarEnvolvido(index, "tipo", e.target.value)
      }
    >
      <option value="Vítima">Vítima</option>
      <option value="Autor">Autor</option>
      <option value="Testemunha">Testemunha</option>
      <option value="Solicitante">Solicitante</option>
      <option value="Condutor">Condutor</option>
      <option value="Outro">Outro</option>
    </select>
  </div>

  <div className="md:col-span-6">
    <Campo
      label="Endereço"
      valor={pessoa.endereco}
      setValor={(valor) => atualizarEnvolvido(index, "endereco", valor)}
      placeholder="Endereço do envolvido"
    />
  </div>

  <div className="md:col-span-6">
    <label className="label">Observação</label>
    <textarea
      className="input h-24 resize-none"
      value={pessoa.observacao}
      onChange={(e) =>
        atualizarEnvolvido(index, "observacao", e.target.value)
      }
      placeholder="Informações adicionais sobre este envolvido"
    />
  </div>
</div>
              </div>
            ))}
          </div>
        </div>

        {mostrarVeiculos && (
  <div className="border-t border-slate-800 pt-6">
    <div className="flex justify-between items-center mb-4">
      <button
  type="button"
  onClick={() => setAbrirVeiculos(!abrirVeiculos)}
  className="w-full flex justify-between items-center text-2xl font-bold"
>
  <span>
    🚗 Veículos Envolvidos ({veiculosEnvolvidos.length})
  </span>

  <span>
    {abrirVeiculos ? "▼" : "▶"}
  </span>
</button>

      <button
        type="button"
        onClick={adicionarVeiculo}
        className="px-4 py-2 rounded-xl border border-blue-600 text-blue-400 hover:bg-blue-950/40 font-semibold"
      >
        + Adicionar outro veículo
      </button>
    </div>

    {abrirVeiculos && (
  <div className="space-y-5">
    {veiculosEnvolvidos.map((veiculo, index) => (
        <div
          key={index}
          className="border border-slate-700 rounded-2xl p-5 bg-slate-950/30"
        >
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold">
              🚘 Veículo {index + 1}
            </h3>

            {veiculosEnvolvidos.length > 1 && (
              <button
                type="button"
                onClick={() => removerVeiculo(index)}
                className="bg-red-700 hover:bg-red-800 px-3 py-2 rounded-lg text-sm"
              >
                Remover
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            <div className="md:col-span-2">
              <label className="label">Placa</label>
              <input
                className="input"
                placeholder="ABC1D23"
                value={veiculo.placa}
                onChange={(e) => {
  const placa = e.target.value
    .toUpperCase()
    .slice(0, 8);

  atualizarVeiculo(
    index,
    "placa",
    placa
  );

  consultarHistoricoVeiculo(placa);
}}
              />
            </div>

            {historicoVeiculo.length > 0 && (
  <div className="md:col-span-12 bg-yellow-950/30 border border-yellow-700 rounded-xl p-4">
    <p className="font-bold text-yellow-400">
      🚗 Histórico encontrado para esta placa
    </p>

    <p className="text-sm text-slate-300 mt-1">
      {historicoVeiculo.length} ocorrência(s) relacionada(s).
    </p>

    <div className="mt-3 space-y-2">
      {historicoVeiculo.slice(0, 3).map((oc) => (
        <div
          key={oc.id}
          className="bg-slate-950/50 border border-slate-700 rounded-lg p-3 text-sm"
        >
          <p className="font-semibold">{oc.protocolo}</p>
          <p className="text-slate-400">
            Data: {oc.data} • Status: {oc.status}
          </p>
        </div>
      ))}
    </div>
  </div>
)}

            <div className="md:col-span-3">
              <label className="label">Marca</label>
              <input
                className="input"
                placeholder="Ex: Fiat"
                value={veiculo.marca}
                onChange={(e) =>
                  atualizarVeiculo(index, "marca", e.target.value)
                }
              />
            </div>

            <div className="md:col-span-3">
              <label className="label">Modelo</label>
              <input
                className="input"
                placeholder="Ex: Uno"
                value={veiculo.modelo}
                onChange={(e) =>
                  atualizarVeiculo(index, "modelo", e.target.value)
                }
              />
            </div>

            <div className="md:col-span-1">
              <label className="label">Ano</label>
              <input
                className="input"
                placeholder="2024"
                maxLength={4}
                value={veiculo.ano}
                onChange={(e) =>
                  atualizarVeiculo(
                    index,
                    "ano",
                    e.target.value.replace(/\D/g, "").slice(0, 4)
                  )
                }
              />
            </div>

            <div className="md:col-span-3">
              <label className="label">Cor</label>
              <select
                className="input"
                value={veiculo.cor}
                onChange={(e) =>
                  atualizarVeiculo(index, "cor", e.target.value)
                }
              >
                <option value="">Selecione</option>
                <option value="Branco">Branco</option>
                <option value="Preto">Preto</option>
                <option value="Prata">Prata</option>
                <option value="Cinza">Cinza</option>
                <option value="Vermelho">Vermelho</option>
                <option value="Azul">Azul</option>
                <option value="Verde">Verde</option>
                <option value="Amarelo">Amarelo</option>
                <option value="Marrom">Marrom</option>
                <option value="Outro">Outro</option>
              </select>
            </div>

            <div className="md:col-span-3">
              <label className="label">Renavam</label>
              <input
                className="input"
                placeholder="00000000000"
                value={veiculo.renavam}
                onChange={(e) =>
                  atualizarVeiculo(
                    index,
                    "renavam",
                    e.target.value.replace(/\D/g, "").slice(0, 11)
                  )
                }
              />
            </div>

            <div className="md:col-span-3">
              <label className="label">Condutor</label>
              <input
                className="input"
                placeholder="Nome do condutor"
                value={veiculo.condutor}
                onChange={(e) =>
                  atualizarVeiculo(index, "condutor", e.target.value)
                }
              />
            </div>

            <div className="md:col-span-3">
  <label className="label">Documento do Condutor</label>
  <input
    className="input"
    placeholder="RG, CPF ou CNH"
    value={veiculo.documento_condutor || ""}
    onChange={(e) =>
      atualizarVeiculo(
        index,
        "documento_condutor",
        e.target.value
      )
    }
  />
</div>

            <div className="md:col-span-3">
              <label className="label">Proprietário</label>
              <input
                className="input"
                placeholder="Nome do proprietário"
                value={veiculo.proprietario}
                onChange={(e) =>
                  atualizarVeiculo(index, "proprietario", e.target.value)
                }
              />
            </div>

            <div className="md:col-span-3">
              <label className="label">CPF do Proprietário</label>
              <input
                className="input"
                placeholder="000.000.000-00"
                value={veiculo.cpf_proprietario}
                onChange={(e) => {
                  let v = e.target.value.replace(/\D/g, "").slice(0, 11);
                  v = v.replace(/(\d{3})(\d)/, "$1.$2");
                  v = v.replace(/(\d{3})(\d)/, "$1.$2");
                  v = v.replace(/(\d{3})(\d{1,2})$/, "$1-$2");

                  atualizarVeiculo(index, "cpf_proprietario", v);
                }}
              />
            </div>

            <div className="md:col-span-3">
              <label className="label">Situação do Veículo</label>
              <select
                className="input"
                value={veiculo.situacao}
                onChange={(e) =>
                  atualizarVeiculo(index, "situacao", e.target.value)
                }
              >

                <option value="">Selecione</option>
                <option value="ABORDADO">Abordado</option>
                <option value="ACIDENTE">Acidente</option>
                <option value="APREENDIDO">Apreendido</option>
                <option value="RECUPERADO">Recuperado</option>
                <option value="ABANDONADO">Abandonado</option>
                <option value="FURTO_ROUBO">Furto/Roubo</option>
              </select>
            </div>

<div className="md:col-span-3">
  <label className="label">Situação da Consulta</label>

  <select
    className="input"
    value={veiculo.situacao_consulta || ""}
    onChange={(e) =>
      atualizarVeiculo(index, "situacao_consulta", e.target.value)
    }
  >
    <option value="">Sem Consulta</option>
    <option value="REGULAR">Regular</option>
    <option value="RESTRICAO_ADMINISTRATIVA">
      Restrição Administrativa
    </option>
    <option value="FURTO_ROUBO">Furto/Roubo</option>
    <option value="LICENCIAMENTO_ATRASADO">
      Licenciamento Atrasado
    </option>
    <option value="SUSPEITA_CLONAGEM">
      Suspeita de Clonagem
    </option>
  </select>
</div>

            <div className="md:col-span-6">
              <label className="label">Observações do Veículo</label>
              <textarea
                className="input h-24 resize-none"
                placeholder="Detalhes do veículo, danos, remoção, abordagem, apreensão ou outras observações."
                value={veiculo.observacao}
                onChange={(e) =>
                  atualizarVeiculo(index, "observacao", e.target.value)
                }
              />
            </div>
          </div>
        </div>
      ))}
        </div>
  )}
</div>
)}

{mostrarObjetos && (
  <div className="border-t border-slate-800 pt-6">
    <div className="flex justify-between items-center mb-4">
      <button
  type="button"
  onClick={() => setAbrirObjetos(!abrirObjetos)}
  className="w-full flex justify-between items-center text-2xl font-bold"
>
  <span>📦 Objetos Envolvidos ({objetosEnvolvidos.length})</span>
  <span>{abrirObjetos ? "▼" : "▶"}</span>
</button>

      <button
        type="button"
        onClick={adicionarObjeto}
        className="px-4 py-2 rounded-xl border border-red-600 text-red-400 hover:bg-red-950/40 font-semibold"
      >
        + Adicionar item
      </button>
    </div>

    {abrirObjetos && (
  <div className="space-y-5">
    {objetosEnvolvidos.map((item, index) => (
        <div
          key={index}
          className="border border-slate-700 rounded-2xl p-5 bg-slate-950/30"
        >
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold">
              Item {index + 1}
            </h3>

            {objetosEnvolvidos.length > 1 && (
              <button
                type="button"
                onClick={() => removerObjeto(index)}
                className="bg-red-700 hover:bg-red-800 px-3 py-2 rounded-lg text-sm"
              >
                Remover
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            <div className="md:col-span-3">
              <label className="label">Categoria</label>
              <select
                className="input"
                value={item.categoria}
                onChange={(e) =>
                  atualizarObjeto(index, "categoria", e.target.value)
                }
              >
                <option value="">Selecione</option>

<option value="CELULAR">📱 Celular</option>
<option value="DINHEIRO">💰 Dinheiro</option>
<option value="DOCUMENTO">📄 Documento</option>
<option value="BICICLETA">🚲 Bicicleta</option>
<option value="ARMA_BRANCA">🔪 Arma Branca</option>
<option value="ARMA_FOGO">🔫 Arma de Fogo</option>
<option value="ENTORPECENTE">🌿 Entorpecente</option>
<option value="FERRAMENTA">🛠 Ferramenta</option>
<option value="PRODUTO">📦 Produto</option>
<option value="PECA_VEICULAR">🚗 Peça Veicular</option>
<option value="OUTRO">📋 Outro</option>
              </select>
            </div>

            <div className="md:col-span-3">
              <label className="label">Marca</label>
              <input
                className="input"
                value={item.marca}
                onChange={(e) =>
                  atualizarObjeto(index, "marca", e.target.value)
                }
              />
            </div>

            <div className="md:col-span-3">
              <label className="label">Modelo</label>
              <input
                className="input"
                value={item.modelo}
                onChange={(e) =>
                  atualizarObjeto(index, "modelo", e.target.value)
                }
              />
            </div>

            <div className="md:col-span-3">
              <label className="label">Calibre</label>
              <input
                className="input"
                placeholder="Ex: .38, 9mm"
                value={item.calibre}
                onChange={(e) =>
                  atualizarObjeto(index, "calibre", e.target.value)
                }
              />
            </div>

            <div className="md:col-span-3">
              <label className="label">Numeração</label>
              <input
                className="input"
                value={item.numeracao}
                onChange={(e) =>
                  atualizarObjeto(index, "numeracao", e.target.value)
                }
              />
            </div>

            <div className="md:col-span-2">
              <label className="label">Quantidade</label>
              <input
                className="input"
                value={item.quantidade}
                onChange={(e) =>
                  atualizarObjeto(
                    index,
                    "quantidade",
                    e.target.value.replace(/\D/g, "")
                  )
                }
              />
            </div>

            <div className="md:col-span-2">
  <label className="label">Peso</label>
  <input
    className="input"
    value={item.peso}
    onChange={(e) =>
      atualizarObjeto(index, "peso", e.target.value)
    }
  />
</div>

<div className="md:col-span-2">
  <label className="label">Unidade</label>

  <select
    className="input"
    value={item.unidade_peso}
    onChange={(e) =>
      atualizarObjeto(index, "unidade_peso", e.target.value)
    }
  >
    <option value="g">Gramas</option>
    <option value="kg">Quilos</option>
    <option value="mg">Miligramas</option>
    <option value="un">Unidades</option>
  </select>
</div>

<div className="md:col-span-3">
  <label className="label">Valor Estimado</label>

  <input
    className="input"
    placeholder="R$ 0,00"
    value={item.valor_estimado}
    onChange={(e) =>
      atualizarObjeto(index, "valor_estimado", e.target.value)
    }
  />
</div>

<div className="md:col-span-3">
  <label className="label">Procedência</label>

  <select
    className="input"
    value={item.procedencia}
    onChange={(e) =>
      atualizarObjeto(index, "procedencia", e.target.value)
    }
  >
    <option value="">Selecione</option>
    <option value="APREENDIDO">Apreendido</option>
    <option value="ENCONTRADO">Encontrado</option>
    <option value="ENTREGUE">Entregue</option>
    <option value="RECOLHIDO">Recolhido</option>
    <option value="RECUPERADO">Recuperado</option>
  </select>
</div>

            <div className="md:col-span-4">
              <label className="label">Situação</label>
              <select
                className="input"
                value={item.situacao}
                onChange={(e) =>
                  atualizarObjeto(index, "situacao", e.target.value)
                }
              >
                <option value="">Selecione</option>
                <option value="APREENDIDO">Apreendido</option>
                <option value="ENTREGUE">Entregue</option>
                <option value="ENCAMINHADO">Encaminhado</option>
                <option value="ENCONTRADO">Encontrado</option>
                <option value="RECOLHIDO">Recolhido</option>
              </select>
            </div>

            <div className="md:col-span-12">
              <label className="label">Observação</label>
              <textarea
                className="input h-24 resize-none"
                value={item.observacao}
                onChange={(e) =>
                  atualizarObjeto(index, "observacao", e.target.value)
                }
              />
            </div>
          </div>
        </div>
      ))}
        </div>
  )}
</div>
)}

<div className="flex justify-end">
  <button
    type="button"
    onClick={gerarNarrativaIA}
    disabled={gerandoNarrativa}
    className="px-4 py-2 rounded-xl bg-purple-700 hover:bg-purple-800 font-semibold disabled:opacity-50"
  >
    {gerandoNarrativa ? "Gerando narrativa..." : "✨ Gerar Narrativa"}
  </button>
</div>

        <div>

         <label className="label">Descrição da ocorrência</label>
          <textarea
            className="input h-36 resize-none"
            placeholder="Descreva o que aconteceu..."
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
          />
        </div>

        <div>
  <label className="label">Fotos da ocorrência</label>

  <input
    type="file"
    accept="image/*"
    multiple
    className="input"
    onChange={(e) => setFotos(Array.from(e.target.files || []))}
  />

  {fotos.length > 0 && (
    <div className="mt-4">
      <p className="text-sm text-green-400 mb-3">
        {fotos.length} foto(s) selecionada(s)
      </p>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {fotos.map((foto, index) => (
          <div
            key={index}
            className="border border-slate-700 rounded-xl overflow-hidden"
          >
<div className="flex justify-end p-2">
  <button
    type="button"
    onClick={() => removerFoto(index)}
    className="bg-red-700 hover:bg-red-800 w-8 h-8 rounded-lg flex items-center justify-center"
  >
    ❌
  </button>
</div>

            <img
              src={URL.createObjectURL(foto)}
              alt={`Foto ${index + 1}`}
              className="w-full h-40 object-cover"
            />

            <div className="p-2 text-xs text-slate-400 truncate">
              {foto.name}
            </div>
          </div>
        ))}
      </div>
    </div>
  )}
</div>

        <div className="flex flex-col md:flex-row justify-end gap-3 border-t border-slate-800 pt-6">
          <button
            type="button"
            onClick={() => router.push("/sistema/ocorrencias")}
            className="px-5 py-3 rounded-xl bg-slate-700 hover:bg-slate-600"
          >
            Cancelar
          </button>

          <button
  type="button"
  onClick={() => {
    setStatus("RASCUNHO");
    salvarOcorrencia("RASCUNHO");
  }}
  disabled={salvando}
  className="px-5 py-3 rounded-xl bg-yellow-600 hover:bg-yellow-700 font-semibold disabled:opacity-50"
>
  💾 Salvar Rascunho
</button>

          <button
            type="button"
            onClick={() => salvarOcorrencia()}
            disabled={salvando}
            className="px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 font-semibold disabled:opacity-50"
          >
            {salvando ? "Salvando..." : "Salvar Ocorrência"}
          </button>
        </div>
      </form>
    </div>
  );
}

function Campo({
  label,
  valor,
  setValor,
  placeholder,
}: {
  label: string;
  valor: string;
  setValor: (valor: string) => void;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="label">{label}</label>

      <input
        className="input"
        placeholder={placeholder}
        value={valor}
        onChange={(e) => setValor(e.target.value)}
      />
    </div>
  );
}