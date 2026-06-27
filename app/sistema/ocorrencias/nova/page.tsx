"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { TIPOS_OCORRENCIA } from "@/lib/modelosOcorrencia";
import { TIPOS_ENVOLVIDO } from "@/lib/modelosOcorrencia";
import { CORES_VEICULO } from "@/lib/bases/cores";
import { MARCAS_MODELOS_VEICULOS } from "@/lib/bases/veiculos";
import SecaoOcorrencia from "@/components/ocorrencias/SecaoOcorrencia";
import ResumoEtapas from "@/components/ocorrencias/ResumoEtapas";
import EquipeOperacional from "@/components/ocorrencias/EquipeOperacional";
import LocalizacaoOcorrencia from "@/components/ocorrencias/LocalizacaoOcorrencia";
import EquipeEmpenhada from "@/components/ocorrencias/EquipeEmpenhada";
import RecursosOcorrencia from "@/components/ocorrencias/RecursosOcorrencia";
import EnvolvidosOcorrencia from "@/components/ocorrencias/EnvolvidosOcorrencia";
import DadosOcorrencia from "@/components/ocorrencias/DadosOcorrencia";
import { VEICULOS_POR_TIPO } from "@/lib/bases/veiculosPorTipo";
import { SITUACOES_VEICULO } from "@/lib/modelosOcorrencia";
import {
  buscarPessoaPorDocumento,
  buscarVeiculoPorPlaca,
  buscarVeiculoPorRenavam,
} from "@/lib/consultas";
import {
  formatarCPF,
  formatarTelefone,
  formatarCEP,
  formatarRG,
  formatarCNH,
  formatarPlaca,
  formatarRenavam,
  formatarChassi,
  formatarDocumentoCondutor,
} from "@/lib/formatadores";
import {
  CATEGORIAS_OBJETO,
  TIPOS_DROGA,
  TIPOS_DOCUMENTO,
  TIPOS_FERRAMENTA,
  TIPOS_ELETRONICO,
  SITUACOES_OBJETO_GERAL,
} from "@/lib/bases/objetos";

import {
  MARCAS_MODELOS_CELULARES,
  CORES_CELULAR,
  SITUACOES_CELULAR,
} from "@/lib/bases/celulares";

import {
  TIPOS_ARMA_FOGO,
  MARCAS_ARMA_FOGO,
  MARCAS_MODELOS_ARMA_FOGO,
  CALIBRES_ARMA_FOGO,
  TIPOS_ARMA_BRANCA,
  SITUACOES_ARMA,
} from "@/lib/bases/armas";

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
  tipo_documento: string;
  documento: string;
  telefone: string;
  endereco: string;
  tipo: string;
  observacao: string;
};

type VeiculoEnvolvido = {
  placa: string;
  tipo_especie: string;
  marca: string;
  modelo: string;
  cor: string;
  ano: string;
  renavam: string;
  chassi: string;
  proprietario: string;
  cpf_proprietario: string;
  telefone_proprietario: string;
email_proprietario: string;
endereco_proprietario: string;
cidade_proprietario: string;
uf_proprietario: string;
cep_proprietario: string;
  condutor: string;
  tipo_documento_condutor: string;
  documento_condutor: string;
  situacao: string;
  observacao: string;
  situacao_consulta: string;
};

type ItemOcorrencia = {
  categoria: string;
  subcategoria: string;
  descricao: string;

  marca: string;
  modelo: string;
  cor: string;
  imei: string;

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
  const [municipioId, setMunicipioId] = useState<number | null>(null);
  const [locais, setLocais] = useState<LocalCadastrado[]>([]);
  const [guarnicoes, setGuarnicoes] = useState<GuarnicaoCompleta[]>([]);
  const [guarnicaoId, setGuarnicaoId] = useState("");
  const [viaturaEmpenhada, setViaturaEmpenhada] = useState("");
  const [viaturaId, setViaturaId] = useState("");
  const [abrirVeiculos, setAbrirVeiculos] = useState(true);
  const [historicoVeiculo, setHistoricoVeiculo] = useState<any[]>([]);
  const [historicoEnvolvido, setHistoricoEnvolvido] = useState<any[]>([]);
  const [abrirObjetos, setAbrirObjetos] = useState(true);
  const [etapaAtual, setEtapaAtual] = useState<number>(1);
  const [gerandoNarrativa, setGerandoNarrativa] = useState(false);
  const [itensOcorrencia, setItensOcorrencia] =
  useState<ItemOcorrencia[]>([
    {
  categoria: "",
  subcategoria: "",
  descricao: "",
  marca: "",
  modelo: "",
  cor: "",
  imei: "",
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
  tipo_documento: "CPF",
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
    tipo_especie: "",
    marca: "",
    modelo: "",
    cor: "",
    ano: "",
    renavam: "",
    chassi: "",
    proprietario: "",
    cpf_proprietario: "",
    telefone_proprietario: "",
email_proprietario: "",
endereco_proprietario: "",
cidade_proprietario: "",
uf_proprietario: "",
cep_proprietario: "",
    condutor: "",
    tipo_documento_condutor: "CPF",
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
        tipo_documento: "CPF",
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

if (!municipioId) {
  alert("Município não identificado.");
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
    guarda_responsavel_id: guardaResponsavelId? Number(guardaResponsavelId): null,
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
    armas_objetos: JSON.stringify(itensOcorrencia),
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

    for (const veiculo of veiculosEnvolvidos) {
  if (!veiculo.placa && !veiculo.renavam) continue;

  const { data: existente } = await supabase
    .from("veiculos_abordados")
    .select("id")
    .eq("municipio_id", municipioId)
    .or(`placa.eq.${veiculo.placa},renavam.eq.${veiculo.renavam}`)
    .maybeSingle();

  if (existente) {
    await supabase
      .from("veiculos_abordados")
      .update({
        placa: veiculo.placa,
        tipo_especie: veiculo.tipo_especie,
        marca: veiculo.marca,
        modelo: veiculo.modelo,
        ano: veiculo.ano,
        cor: veiculo.cor,
        renavam: veiculo.renavam,
        chassi: veiculo.chassi,
        proprietario: veiculo.proprietario,
        cpf_proprietario: veiculo.cpf_proprietario,
        telefone_proprietario: veiculo.telefone_proprietario,
        situacao: veiculo.situacao,
        observacao: veiculo.observacao,
      })
      .eq("id", existente.id);
  } else {
    await supabase.from("veiculos_abordados").insert({
      municipio_id: municipioId,
      placa: veiculo.placa,
      tipo_especie: veiculo.tipo_especie,
      marca: veiculo.marca,
      modelo: veiculo.modelo,
      ano: veiculo.ano,
      cor: veiculo.cor,
      renavam: veiculo.renavam,
      chassi: veiculo.chassi,
      proprietario: veiculo.proprietario,
      cpf_proprietario: veiculo.cpf_proprietario,
      telefone_proprietario: veiculo.telefone_proprietario,
      situacao: veiculo.situacao,
      observacao: veiculo.observacao,
    });
  }
}

for (const pessoa of envolvidosValidos) {
  if (!pessoa.documento) continue;

  const { data: existente } = await supabase
    .from("pessoas_abordadas")
    .select("id")
    .eq("municipio_id", municipioId)
    .eq("documento", pessoa.documento)
    .maybeSingle();

  if (existente) {
    await supabase
      .from("pessoas_abordadas")
      .update({
        nome: pessoa.nome,
        tipo_documento: pessoa.tipo_documento,
        documento: pessoa.documento,
        telefone: pessoa.telefone,
        endereco: pessoa.endereco,
        observacao: pessoa.observacao,
      })
      .eq("id", existente.id);
  } else {
    await supabase.from("pessoas_abordadas").insert({
      municipio_id: municipioId,
      nome: pessoa.nome,
      tipo_documento: pessoa.tipo_documento,
      documento: pessoa.documento,
      telefone: pessoa.telefone,
      endereco: pessoa.endereco,
      local,
      data,
      hora,
      guarda: equipeEmpenhada,
      observacao: pessoa.observacao,
    });
  }
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
setBairro(data.bairro || "");
setNumero(data.numero || "");

setDescricao(
  `Ocorrência gerada a partir do chamado ${data.protocolo}.

Solicitante: ${data.solicitante || "-"}
Telefone: ${data.telefone || "-"}
Local: ${data.local || "-"}
Bairro: ${data.bairro || "-"}
Número: ${data.numero || "S/N"}
Referência: ${data.referencia || "-"}
Prioridade: ${data.prioridade || "-"}
Observação: ${data.observacao || "-"}`
);

setEnvolvidos([
  {
    nome: data.solicitante || "",
    tipo_documento: "CPF",
    documento: "",
    telefone: data.telefone || "",
    endereco: data.local || "",
    tipo: "Solicitante",
    observacao: data.observacao || "",
  },
]);
}

async function carregarSistema() {
  
  const usuarioLogado = JSON.parse(
  localStorage.getItem("usuarioLogado") || "{}"
);

const id = usuarioLogado.municipio_id;

if (!id) {
  alert("Município não identificado.");
  return;
}

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

  await carregarGuardas(id);
await carregarGuarnicoes(id);
await carregarViaturas(id);
await carregarLocais(id);
}

  useEffect(() => {
  void carregarSistema();

  if (chamadoId) {
    void carregarChamadoOrigem(chamadoId);
  }
}, [chamadoId]);

function adicionarVeiculo() {
  setVeiculosEnvolvidos([
    ...veiculosEnvolvidos,
    {
      placa: "",
      tipo_especie: "",
      marca: "",
      modelo: "",
      cor: "",
      ano: "",
      renavam: "",
      chassi: "",
      proprietario: "",
      cpf_proprietario: "",
      telefone_proprietario: "",
email_proprietario: "",
endereco_proprietario: "",
cidade_proprietario: "",
uf_proprietario: "",
cep_proprietario: "",
      condutor: "",
      tipo_documento_condutor: "CPF",
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
  setItensOcorrencia([
    ...itensOcorrencia,
    {
  categoria: "",
  subcategoria: "",
  descricao: "",
  marca: "",
  modelo: "",
  cor: "",
  imei: "",
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
  if (itensOcorrencia.length === 1) {
    alert("É necessário manter pelo menos um item.");
    return;
  }

  setItensOcorrencia(
    itensOcorrencia.filter((_, i) => i !== index)
  );
}

function atualizarItem(
  index: number,
  campo: keyof ItemOcorrencia,
  valor: string
) {
  const lista = [...itensOcorrencia];
  lista[index][campo] = valor;
  setItensOcorrencia(lista);
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

  const objetosTexto = itensOcorrencia
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

async function preencherPessoa(index: number, documento: string) {
  if (!municipioId) return;

  const pessoa = await buscarPessoaPorDocumento(
    municipioId,
    documento
  );

  if (!pessoa) return;

  atualizarEnvolvido(index, "nome", pessoa.nome || "");
  atualizarEnvolvido(index, "telefone", pessoa.telefone || "");
  atualizarEnvolvido(index, "endereco", pessoa.endereco || "");
}

async function preencherVeiculo(index: number, placa: string) {
  if (!municipioId) return;

  const veiculo = await buscarVeiculoPorPlaca(
    municipioId,
    placa
  );

  if (!veiculo) return;

  atualizarVeiculo(index, "marca", veiculo.marca || "");
  atualizarVeiculo(index, "modelo", veiculo.modelo || "");
  atualizarVeiculo(index, "ano", veiculo.ano || "");
  atualizarVeiculo(index, "cor", veiculo.cor || "");
  atualizarVeiculo(index, "renavam", veiculo.renavam || "");
  atualizarVeiculo(index, "chassi", veiculo.chassi || "");
  atualizarVeiculo(index, "proprietario", veiculo.proprietario || "");
  atualizarVeiculo(
    index,
    "cpf_proprietario",
    veiculo.cpf_proprietario || ""
  );
  atualizarVeiculo(
    index,
    "telefone_proprietario",
    veiculo.telefone_proprietario || ""
  );
}

  return (
    <div className="min-h-screen bg-[#07152E] p-6 md:p-8">
<header className="mb-8 border-b border-[#d6a93b] pb-6">
  <h1 className="text-4xl font-black text-white">
    Nova Ocorrência
  </h1>

  <p className="mt-2 text-slate-300">
    Preencha os dados para registrar uma nova ocorrência no sistema.
  </p>
</header>

<form className="w-full max-w-full overflow-hidden rounded-2xl border border-[#C9A227] bg-[#0D1B34] p-8 space-y-8">
        
  <DadosOcorrencia>

<RecursosOcorrencia
  mostrarVeiculos={mostrarVeiculos}
  setMostrarVeiculos={setMostrarVeiculos}
  mostrarObjetos={mostrarObjetos}
  setMostrarObjetos={setMostrarObjetos}
  fotosLength={fotos.length}
/>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="label">Tipo da ocorrência</label>
            <select
  className="input"
  value={tipo}
  onChange={(e) => setTipo(e.target.value)}
>
  <option value="">Selecione</option>

  {TIPOS_OCORRENCIA.map((item) => (
    <option key={item} value={item}>
      {item}
    </option>
  ))}
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
        

</DadosOcorrencia>

  <>
    <EquipeOperacional
      guarnicoes={guarnicoes}
      guardas={guardas}
      viaturas={viaturas}
      guarnicaoId={guarnicaoId}
      setGuarnicaoId={setGuarnicaoId}
      guardaResponsavelId={guardaResponsavelId}
      setGuardaResponsavelId={setGuardaResponsavelId}
      viaturaId={viaturaId}
      setViaturaId={setViaturaId}
      setViaturaEmpenhada={setViaturaEmpenhada}
    />

    <EquipeEmpenhada
      guardas={guardas}
      guardasSelecionados={guardasSelecionados}
      setGuardasSelecionados={setGuardasSelecionados}
    />
  </>
        
  <LocalizacaoOcorrencia
    bairro={bairro}
    setBairro={setBairro}
    numero={numero}
    setNumero={setNumero}
    localId={localId}
    setLocalId={setLocalId}
    setLocal={setLocal}
    locais={locais}
  />

         <EnvolvidosOcorrencia
    envolvidos={envolvidos}
    adicionarEnvolvido={adicionarEnvolvido}
    preencherPessoa={preencherPessoa}
    removerEnvolvido={removerEnvolvido}
    atualizarEnvolvido={atualizarEnvolvido}
    consultarHistoricoEnvolvido={consultarHistoricoEnvolvido}
    historicoEnvolvido={historicoEnvolvido}
  />

       {mostrarVeiculos && (
  <SecaoOcorrencia
    titulo="Veículos"
    descricao="Cadastre os veículos relacionados à ocorrência."
  >
    <div className="flex items-center justify-between mb-5">
      <h3 className="text-lg font-semibold text-slate-700">
        Lista de veículos ({veiculosEnvolvidos.length})
      </h3>

      <button
        type="button"
        onClick={adicionarVeiculo}
        className="rounded-lg bg-[#07152e] px-4 py-2 text-white hover:bg-[#0d2146]"
      >
        Adicionar veículo
      </button>
    </div>

    <div className="space-y-5">
      {veiculosEnvolvidos.map((veiculo, index) => (
        <div
  key={index}
  className="rounded-xl border border-[#C9A227] bg-[#07152E] p-5"
>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-[#C9A227]">
  Veículo {index + 1}
</h3>

            {veiculosEnvolvidos.length > 1 && (
              <button
                type="button"
                onClick={() => removerVeiculo(index)}
                className="rounded-lg border border-red-500 px-3 py-2 text-sm font-semibold text-red-400 hover:bg-red-950/40"
              >
                Remover
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            <div className="md:col-span-2">
              <label className="label">Placa</label>
              <input
  className="input uppercase"
  placeholder="ABC1234"
  maxLength={7}
  value={veiculo.placa}
  onChange={async (e) => {
  const placa = formatarPlaca(e.target.value);

  atualizarVeiculo(index, "placa", placa);

  if (placa.length === 7) {
    await preencherVeiculo(index, placa);
    await consultarHistoricoVeiculo(placa);
  }
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
  <label className="label">Tipo / Espécie</label>

  <select
    className="input"
    value={veiculo.tipo_especie}
    onChange={(e) =>
      atualizarVeiculo(index, "tipo_especie", e.target.value)
    }
  >
    <option value="">Selecione</option>
    <option value="Automóvel">Automóvel</option>
    <option value="Motocicleta">Motocicleta</option>
    <option value="Caminhonete">Caminhonete</option>
    <option value="Camioneta">Camioneta</option>
    <option value="Caminhão">Caminhão</option>
    <option value="Ônibus">Ônibus</option>
    <option value="Micro-ônibus">Micro-ônibus</option>
    <option value="Van">Van</option>
    <option value="Reboque">Reboque</option>
    <option value="Semirreboque">Semirreboque</option>
    <option value="Trator">Trator</option>
    <option value="Bicicleta">Bicicleta</option>
    <option value="Embarcação">Embarcação</option>
    <option value="Outro">Outro</option>
  </select>
</div>

            <div className="md:col-span-3">
  <label className="label">Marca</label>

  <select
    className="input"
    value={veiculo.marca}
    onChange={(e) => {
      atualizarVeiculo(index, "marca", e.target.value);
      atualizarVeiculo(index, "modelo", "");
    }}
  >
    <option value="">Selecione</option>

    {Object.keys(VEICULOS_POR_TIPO[veiculo.tipo_especie] || {}).map((marca) => (
      <option key={marca} value={marca}>
        {marca}
      </option>
    ))}
  </select>
</div>

            <div className="md:col-span-3">
  <label className="label">Modelo</label>

  <select
    className="input"
    value={veiculo.modelo}
    onChange={(e) =>
      atualizarVeiculo(index, "modelo", e.target.value)
    }
    disabled={!veiculo.tipo_especie || !veiculo.marca}
  >
    <option value="">Selecione</option>

    {(VEICULOS_POR_TIPO[veiculo.tipo_especie]?.[veiculo.marca] || []).map((modelo) => (
      <option key={modelo} value={modelo}>
        {modelo}
      </option>
    ))}

    <option value="OUTRO">Outro</option>
  </select>

  {veiculo.modelo === "OUTRO" && (
    <input
      className="input mt-2"
      placeholder="Digite o modelo"
      onChange={(e) =>
        atualizarVeiculo(index, "modelo", e.target.value)
      }
    />
  )}
</div>

            <div className="md:col-span-1">
  <label className="label">Ano</label>

  <select
    className="input"
    value={veiculo.ano}
    onChange={(e) =>
      atualizarVeiculo(index, "ano", e.target.value)
    }
  >
    <option value="">Selecione</option>

    {Array.from(
      { length: new Date().getFullYear() + 2 - 1975 },
      (_, i) => new Date().getFullYear() + 1 - i
    ).map((ano) => (
      <option key={ano} value={String(ano)}>
        {ano}
      </option>
    ))}

    <option value="OUTRO">Outro</option>
  </select>

  {veiculo.ano === "OUTRO" && (
    <input
      className="input mt-2"
      placeholder="Digite o ano"
      maxLength={4}
      onChange={(e) =>
        atualizarVeiculo(
          index,
          "ano",
          e.target.value.replace(/\D/g, "").slice(0, 4)
        )
      }
    />
  )}
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

{CORES_VEICULO.map((cor) => (
  <option key={cor} value={cor}>
    {cor}
  </option>
))}
              </select>
            </div>

            <div className="md:col-span-3">
              <label className="label">Renavam</label>
              <input
  className="input"
  placeholder="00000000000"
  inputMode="numeric"
  maxLength={11}
  value={veiculo.renavam}
  onChange={async (e) => {
  const renavam = formatarRenavam(e.target.value);

  atualizarVeiculo(index, "renavam", renavam);

  if (renavam.length === 11 && municipioId) {
    const veiculo = await buscarVeiculoPorRenavam(
      municipioId,
      renavam
    );

    if (veiculo) {
      atualizarVeiculo(index, "placa", veiculo.placa || "");
      atualizarVeiculo(index, "tipo_especie", veiculo.tipo_especie || "");
      atualizarVeiculo(index, "marca", veiculo.marca || "");
      atualizarVeiculo(index, "modelo", veiculo.modelo || "");
      atualizarVeiculo(index, "ano", veiculo.ano || "");
      atualizarVeiculo(index, "cor", veiculo.cor || "");
      atualizarVeiculo(index, "chassi", veiculo.chassi || "");
      atualizarVeiculo(index, "proprietario", veiculo.proprietario || "");
      atualizarVeiculo(index, "cpf_proprietario", veiculo.cpf_proprietario || "");
      atualizarVeiculo(index, "telefone_proprietario", veiculo.telefone_proprietario || "");
    }
  }
}}
/>
            </div>

            <div className="md:col-span-3">
  <label className="label">Chassi</label>
  <input
    className="input uppercase"
    placeholder="17 caracteres"
    maxLength={17}
    value={veiculo.chassi}
    onChange={(e) =>
  atualizarVeiculo(
    index,
    "chassi",
    formatarChassi(e.target.value)
  )
}
  />
</div>

            <div className="md:col-span-3">
<div className="md:col-span-12 mt-6 border-t border-[#C9A227]/50 pt-5">  <h4 className="text-base font-semibold text-white">
    Condutor
  </h4>
</div>
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

            <div className="md:col-span-2">
  <label className="label">Tipo do Documento</label>

  <select
    className="input"
    value={veiculo.tipo_documento_condutor}
    onChange={(e) =>
      atualizarVeiculo(
        index,
        "tipo_documento_condutor",
        e.target.value
      )
    }
  >
    <option value="CPF">CPF</option>
    <option value="CNH">CNH</option>
    <option value="RG">RG</option>
    <option value="PASSAPORTE">Passaporte</option>
    <option value="OUTRO">Outro</option>
  </select>
</div>

<div className="md:col-span-4">
  <label className="label">Documento do Condutor</label>

  <input
    className="input"
    value={veiculo.documento_condutor}
    placeholder={
      veiculo.tipo_documento_condutor === "CPF"
        ? "000.000.000-00"
        : veiculo.tipo_documento_condutor === "CNH"
        ? "Número da CNH"
        : veiculo.tipo_documento_condutor === "RG"
        ? "Número do RG"
        : "Documento"
    }
    onChange={(e) => {
      let valor = e.target.value;

     valor = formatarDocumentoCondutor(
  veiculo.tipo_documento_condutor,
  valor
);

      atualizarVeiculo(index, "documento_condutor", valor);
    }}
  />
</div>

<div className="md:col-span-12 mt-6 border-t border-[#C9A227]/50 pt-5">  <h4 className="text-lg font-bold text-[#C9A227]">
    Proprietário
  </h4>

  <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
    <div className="md:col-span-4">
      <label className="label">Nome do Proprietário</label>
      <input
        className="input"
        placeholder="Nome completo"
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
        inputMode="numeric"
        maxLength={14}
        value={veiculo.cpf_proprietario}
        onChange={(e) =>
          atualizarVeiculo(
            index,
            "cpf_proprietario",
            formatarCPF(e.target.value)
          )
        }
      />
    </div>

    <div className="md:col-span-3">
      <label className="label">Telefone</label>
      <input
  className="input"
  placeholder="(75) 99999-9999"
  maxLength={15}
  value={veiculo.telefone_proprietario}
  onChange={(e) => {
    let valor = e.target.value
      formatarTelefone(e.target.value)

    valor = valor
      .replace(/^(\d{2})(\d)/, "($1) $2")
      .replace(/(\d{5})(\d)/, "$1-$2");

    atualizarVeiculo(index, "telefone_proprietario", valor);
  }}
/>
    </div>

    <div className="md:col-span-2">
      <label className="label">UF</label>
      <input
        className="input uppercase"
        placeholder="BA"
        maxLength={2}
        value={veiculo.uf_proprietario}
        onChange={(e) =>
          atualizarVeiculo(
            index,
            "uf_proprietario",
            e.target.value.toUpperCase().replace(/[^A-Z]/g, "").slice(0, 2)
          )
        }
      />
    </div>

    <div className="md:col-span-4">
      <label className="label">E-mail</label>
      <input
        className="input"
        placeholder="email@exemplo.com"
        value={veiculo.email_proprietario}
        onChange={(e) =>
          atualizarVeiculo(
            index,
            "email_proprietario",
            e.target.value
          )
        }
      />
    </div>

    <div className="md:col-span-3">
      <label className="label">CEP</label>
      <input
  className="input"
  placeholder="00000-000"
  maxLength={9}
  value={veiculo.cep_proprietario}
  onChange={(e) => {
    let valor = e.target.value
      .replace(/\D/g, "")
      .slice(0, 8);

    valor = valor.replace(/^(\d{5})(\d)/, "$1-$2");

    atualizarVeiculo(index, "cep_proprietario", valor);
  }}
/>
    </div>

    <div className="md:col-span-3">
      <label className="label">Cidade</label>
      <input
        className="input"
        placeholder="Cidade"
        value={veiculo.cidade_proprietario}
        onChange={(e) =>
          atualizarVeiculo(
            index,
            "cidade_proprietario",
            e.target.value
          )
        }
      />
    </div>

    <div className="md:col-span-12">
      <label className="label">Endereço</label>
      <input
        className="input"
        placeholder="Rua, número, bairro"
        value={veiculo.endereco_proprietario}
        onChange={(e) =>
          atualizarVeiculo(
            index,
            "endereco_proprietario",
            e.target.value
          )
        }
      />
    </div>
  </div>
</div>

<div className="md:col-span-12 mt-6 border-t border-[#C9A227]/50 pt-5">  <h4 className="text-lg font-bold text-[#C9A227]">
    Situação
  </h4>
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

{SITUACOES_VEICULO.map((situacao) => (
  <option key={situacao} value={situacao}>
    {situacao}
  </option>
))}
              </select>
            </div>

            <div className="md:col-span-12 mt-6 border-t border-[#C9A227] pt-4">
  <h4 className="text-lg font-bold text-[#C9A227]">
    Condutor
  </h4>
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
  </SecaoOcorrencia>
)}

{mostrarObjetos && (
  <SecaoOcorrencia
    titulo="Itens"
    descricao="Cadastre os objetos relacionados à ocorrência."
  >
    <div className="mb-5 flex items-center justify-between">
      <h3 className="text-lg font-semibold text-white">
        Lista de itens ({itensOcorrencia.length})
      </h3>

      <button
        type="button"
        onClick={adicionarObjeto}
        className="rounded-lg border border-[#C9A227] px-5 py-2 font-semibold text-white hover:bg-[#C9A227]/10 transition"
      >
        Adicionar item
      </button>
    </div>

    <div className="space-y-5">
      {itensOcorrencia.map((item, index) => (
        <div
          key={index}
          className="rounded-xl border border-[#C9A227] bg-[#07152E] p-5"
        >
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-xl font-bold text-[#C9A227]">
              Item {index + 1}
            </h3>

            {itensOcorrencia.length > 1 && (
              <button
                type="button"
                onClick={() => removerObjeto(index)}
                className="rounded-lg border border-red-500 px-3 py-2 text-sm font-semibold text-red-400 hover:bg-red-950/40"
              >
                Remover
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            <div className="md:col-span-12 border-t border-[#C9A227]/50 pt-5">
              <h4 className="text-lg font-bold text-[#C9A227]">
                Dados do item
              </h4>
            </div>

            <div className="md:col-span-3">
              <label className="label">Tipo do Item</label>
              <select
                className="input"
                value={item.categoria}
                onChange={(e) => {
                  atualizarItem(index, "categoria", e.target.value);
                  atualizarItem(index, "subcategoria", "");
                  atualizarItem(index, "marca", "");
                  atualizarItem(index, "modelo", "");
                  atualizarItem(index, "calibre", "");
                  atualizarItem(index, "cor", "");
                  atualizarItem(index, "imei", "");
                  atualizarItem(index, "peso", "");
                  atualizarItem(index, "numeracao", "");
                }}
              >
                <option value="">Selecione</option>

                {CATEGORIAS_OBJETO.map((categoria) => (
                  <option key={categoria} value={categoria}>
                    {categoria}
                  </option>
                ))}
              </select>
            </div>

{item.categoria === "Celular" && (
  <>
    <div className="md:col-span-3">
      <label className="label">Marca</label>
      <select
        className="input"
        value={item.marca}
        onChange={(e) => {
          atualizarItem(index, "marca", e.target.value);
          atualizarItem(index, "modelo", "");
        }}
      >
        <option value="">Selecione</option>
        {Object.keys(MARCAS_MODELOS_CELULARES).map((marca) => (
          <option key={marca} value={marca}>{marca}</option>
        ))}
        <option value="OUTRO">Outra</option>
      </select>
    </div>

    <div className="md:col-span-3">
      <label className="label">Modelo</label>
      <select
        className="input"
        value={item.modelo}
        onChange={(e) => atualizarItem(index, "modelo", e.target.value)}
        disabled={!item.marca}
      >
        <option value="">Selecione</option>
        {(MARCAS_MODELOS_CELULARES[item.marca] || []).map((modelo) => (
          <option key={modelo} value={modelo}>{modelo}</option>
        ))}
        <option value="OUTRO">Outro</option>
      </select>
    </div>

    <div className="md:col-span-2">
      <label className="label">Cor</label>
      <select
        className="input"
        value={item.cor}
        onChange={(e) => atualizarItem(index, "cor", e.target.value)}
      >
        <option value="">Selecione</option>
        {CORES_CELULAR.map((cor) => (
          <option key={cor} value={cor}>{cor}</option>
        ))}
      </select>
    </div>

    <div className="md:col-span-4">
      <label className="label">IMEI</label>
      <input
        className="input"
        placeholder="15 dígitos"
        value={item.imei}
        onChange={(e) =>
          atualizarItem(index, "imei", e.target.value.replace(/\D/g, "").slice(0, 15))
        }
      />
    </div>
  </>
)}

{item.categoria === "Arma de fogo" && (
  <>
    <div className="md:col-span-3">
      <label className="label">Tipo da Arma</label>
      <select
        className="input"
        value={item.subcategoria}
        onChange={(e) => atualizarItem(index, "subcategoria", e.target.value)}
      >
        <option value="">Selecione</option>
        {TIPOS_ARMA_FOGO.map((tipo) => (
          <option key={tipo} value={tipo}>{tipo}</option>
        ))}
      </select>
    </div>

    <div className="md:col-span-3">
      <label className="label">Marca</label>
      <select
        className="input"
        value={item.marca}
        onChange={(e) => {
          atualizarItem(index, "marca", e.target.value);
          atualizarItem(index, "modelo", "");
        }}
      >
        <option value="">Selecione</option>
        {MARCAS_ARMA_FOGO.map((marca) => (
          <option key={marca} value={marca}>{marca}</option>
        ))}
      </select>
    </div>

    <div className="md:col-span-3">
      <label className="label">Modelo</label>
      <select
        className="input"
        value={item.modelo}
        onChange={(e) => atualizarItem(index, "modelo", e.target.value)}
        disabled={!item.marca}
      >
        <option value="">Selecione</option>
        {(MARCAS_MODELOS_ARMA_FOGO[item.marca] || []).map((modelo) => (
          <option key={modelo} value={modelo}>{modelo}</option>
        ))}
      </select>
    </div>

    <div className="md:col-span-3">
      <label className="label">Calibre</label>
      <select
        className="input"
        value={item.calibre}
        onChange={(e) => atualizarItem(index, "calibre", e.target.value)}
      >
        <option value="">Selecione</option>
        {CALIBRES_ARMA_FOGO.map((calibre) => (
          <option key={calibre} value={calibre}>{calibre}</option>
        ))}
      </select>
    </div>

    <div className="md:col-span-3">
      <label className="label">Numeração</label>
      <input
        className="input uppercase"
        value={item.numeracao}
        onChange={(e) =>
          atualizarItem(index, "numeracao", e.target.value.toUpperCase())
        }
      />
    </div>
  </>
)}

{item.categoria === "Arma branca" && (
  <>
    <div className="md:col-span-3">
      <label className="label">Tipo</label>
      <select
        className="input"
        value={item.subcategoria}
        onChange={(e) => atualizarItem(index, "subcategoria", e.target.value)}
      >
        <option value="">Selecione</option>
        {TIPOS_ARMA_BRANCA.map((tipo) => (
          <option key={tipo} value={tipo}>{tipo}</option>
        ))}
      </select>
    </div>

    <div className="md:col-span-3">
      <label className="label">Marca</label>
      <input
        className="input"
        placeholder="Se houver"
        value={item.marca}
        onChange={(e) => atualizarItem(index, "marca", e.target.value)}
      />
    </div>

    <div className="md:col-span-3">
      <label className="label">Tamanho / Medida</label>
      <input
        className="input"
        placeholder="Ex: 20 cm"
        value={item.modelo}
        onChange={(e) => atualizarItem(index, "modelo", e.target.value)}
      />
    </div>
  </>
)}

{item.categoria === "Droga" && (
  <>
    <div className="md:col-span-3">
      <label className="label">Tipo da Droga</label>
      <select
        className="input"
        value={item.subcategoria}
        onChange={(e) => atualizarItem(index, "subcategoria", e.target.value)}
      >
        <option value="">Selecione</option>
        {TIPOS_DROGA.map((tipo) => (
          <option key={tipo} value={tipo}>{tipo}</option>
        ))}
      </select>
    </div>

    <div className="md:col-span-2">
      <label className="label">Peso</label>
      <input
        className="input"
        value={item.peso}
        onChange={(e) => atualizarItem(index, "peso", e.target.value)}
      />
    </div>

    <div className="md:col-span-2">
      <label className="label">Unidade</label>
      <select
        className="input"
        value={item.unidade_peso}
        onChange={(e) => atualizarItem(index, "unidade_peso", e.target.value)}
      >
        <option value="g">Gramas</option>
        <option value="kg">Quilos</option>
        <option value="mg">Miligramas</option>
        <option value="un">Unidades</option>
      </select>
    </div>
  </>
)}

{item.categoria === "Documento" && (
  <>
    <div className="md:col-span-3">
      <label className="label">Tipo do Documento</label>
      <select
        className="input"
        value={item.subcategoria}
        onChange={(e) => atualizarItem(index, "subcategoria", e.target.value)}
      >
        <option value="">Selecione</option>
        {TIPOS_DOCUMENTO.map((tipo) => (
          <option key={tipo} value={tipo}>{tipo}</option>
        ))}
      </select>
    </div>

    <div className="md:col-span-4">
      <label className="label">Número / Identificação</label>
      <input
        className="input"
        value={item.numeracao}
        onChange={(e) => atualizarItem(index, "numeracao", e.target.value)}
      />
    </div>
  </>
)}

{item.categoria === "Dinheiro" && (
  <>
    <div className="md:col-span-3">
      <label className="label">Tipo</label>
      <select
        className="input"
        value={item.subcategoria}
        onChange={(e) => atualizarItem(index, "subcategoria", e.target.value)}
      >
        <option value="">Selecione</option>
        <option value="Espécie">Espécie</option>
        <option value="Moeda">Moeda</option>
        <option value="Cheque">Cheque</option>
      </select>
    </div>

    <div className="md:col-span-3">
      <label className="label">Valor</label>
      <input
        className="input"
        placeholder="R$ 0,00"
        value={item.valor_estimado}
        onChange={(e) => atualizarItem(index, "valor_estimado", e.target.value)}
      />
    </div>
  </>
)}

{item.categoria === "Ferramenta" && (
  <>
    <div className="md:col-span-3">
      <label className="label">Tipo da Ferramenta</label>
      <select
        className="input"
        value={item.subcategoria}
        onChange={(e) => atualizarItem(index, "subcategoria", e.target.value)}
      >
        <option value="">Selecione</option>
        {TIPOS_FERRAMENTA.map((tipo) => (
          <option key={tipo} value={tipo}>{tipo}</option>
        ))}
      </select>
    </div>

    <div className="md:col-span-3">
      <label className="label">Marca</label>
      <input
        className="input"
        value={item.marca}
        onChange={(e) => atualizarItem(index, "marca", e.target.value)}
      />
    </div>
  </>
)}

{item.categoria === "Eletrônico" && (
  <>
    <div className="md:col-span-3">
      <label className="label">Tipo do Eletrônico</label>
      <select
        className="input"
        value={item.subcategoria}
        onChange={(e) => atualizarItem(index, "subcategoria", e.target.value)}
      >
        <option value="">Selecione</option>
        {TIPOS_ELETRONICO.map((tipo) => (
          <option key={tipo} value={tipo}>{tipo}</option>
        ))}
      </select>
    </div>

    <div className="md:col-span-3">
      <label className="label">Marca</label>
      <input
        className="input"
        value={item.marca}
        onChange={(e) => atualizarItem(index, "marca", e.target.value)}
      />
    </div>

    <div className="md:col-span-3">
      <label className="label">Modelo</label>
      <input
        className="input"
        value={item.modelo}
        onChange={(e) => atualizarItem(index, "modelo", e.target.value)}
      />
    </div>

    <div className="md:col-span-3">
      <label className="label">Numeração / Série</label>
      <input
        className="input"
        value={item.numeracao}
        onChange={(e) => atualizarItem(index, "numeracao", e.target.value)}
      />
    </div>
  </>
)}

<div className="md:col-span-2">
  <label className="label">Quantidade</label>
  <input
    className="input"
    value={item.quantidade}
    onChange={(e) =>
      atualizarItem(index, "quantidade", e.target.value.replace(/\D/g, ""))
    }
  />
</div>

<div className="md:col-span-3">
  <label className="label">Procedência</label>
  <select
    className="input"
    value={item.procedencia}
    onChange={(e) => atualizarItem(index, "procedencia", e.target.value)}
  >
    <option value="">Selecione</option>
    <option value="APREENDIDO">Apreendido</option>
    <option value="ENCONTRADO">Encontrado</option>
    <option value="ENTREGUE">Entregue</option>
    <option value="RECOLHIDO">Recolhido</option>
    <option value="RECUPERADO">Recuperado</option>
  </select>
</div>

<div className="md:col-span-3">
  <label className="label">Situação</label>
  <select
    className="input"
    value={item.situacao}
    onChange={(e) => atualizarItem(index, "situacao", e.target.value)}
  >
    <option value="">Selecione</option>
    {SITUACOES_OBJETO_GERAL.map((situacao) => (
      <option key={situacao} value={situacao}>{situacao}</option>
    ))}
  </select>
</div>

<div className="md:col-span-12">
  <label className="label">Descrição / Observação</label>
  <textarea
    className="input h-24 resize-none"
    value={item.observacao}
    onChange={(e) => atualizarItem(index, "observacao", e.target.value)}
  />
</div>
          </div>
        </div>
            ))}
    </div>
  </SecaoOcorrencia>
)}

<SecaoOcorrencia
  titulo="Narrativa"
  descricao="Descreva os fatos ou utilize a IA para gerar automaticamente."
>
  <div className="mb-4 flex justify-end">
    <button
      type="button"
      onClick={gerarNarrativaIA}
      disabled={gerandoNarrativa}
      className="rounded-lg border border-[#C9A227] px-4 py-2 font-semibold text-white hover:bg-[#C9A227]/10 disabled:opacity-50"
    >
      {gerandoNarrativa ? "Gerando narrativa..." : "Gerar narrativa automática"}
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
</SecaoOcorrencia>

<SecaoOcorrencia
  titulo="Fotos"
  descricao="Adicione imagens que auxiliem na comprovação dos fatos."
>
  <input
    type="file"
    accept="image/*"
    multiple
    className="input"
    onChange={(e) => setFotos(Array.from(e.target.files || []))}
  />

  {fotos.length > 0 && (
    <div className="mt-4">
      <p className="mb-3 text-sm text-slate-300">
        {fotos.length} foto(s) selecionada(s)
      </p>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4">
        {fotos.map((foto, index) => (
          <div
            key={index}
            className="overflow-hidden rounded-lg border border-[#C9A227] bg-[#07152E]"
          >
            <div className="flex justify-end p-2">
              <button
                type="button"
                onClick={() => removerFoto(index)}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-red-500 text-red-400 hover:bg-red-950/40"
              >
                ×
              </button>
            </div>

            <img
              src={URL.createObjectURL(foto)}
              alt={`Foto ${index + 1}`}
              className="h-40 w-full object-cover"
            />

            <div className="truncate p-2 text-xs text-slate-300">
              {foto.name}
            </div>
          </div>
        ))}
      </div>
    </div>
  )}
</SecaoOcorrencia>

<div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-t border-[#C9A227] pt-6">
  <button
    type="button"
    onClick={() => router.push("/sistema/ocorrencias")}
    className="rounded-lg border border-[#C9A227] px-6 py-3 font-semibold text-white hover:bg-[#C9A227]/10"
  >
    Cancelar
  </button>

  <div className="flex flex-wrap gap-3">
    <button
      type="button"
      onClick={() => {
        setStatus("RASCUNHO");
        salvarOcorrencia("RASCUNHO");
      }}
      disabled={salvando}
      className="rounded-lg border border-[#C9A227] px-6 py-3 font-semibold text-white hover:bg-[#C9A227]/10 disabled:opacity-50"
    >
      Salvar Rascunho
    </button>

    <button
      type="button"
      onClick={() => salvarOcorrencia()}
      disabled={salvando}
      className="rounded-lg bg-[#C9A227] px-6 py-3 font-bold text-[#07152E] hover:bg-[#D9B64A] disabled:opacity-50"
    >
      {salvando ? "Salvando..." : "Salvar Registro"}
    </button>
  </div>
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