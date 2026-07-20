"use client";

import { useEffect, useState } from "react";
import "./formulario-premium.css";
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
import ProtecaoModulo from "@/components/ProtecaoModulo";
import AlertaIntermunicipalVeiculo, {
  type AlertaIntermunicipalVeiculoDados,
} from "@/components/veiculos/AlertaIntermunicipalVeiculo";
import AlertaIntermunicipalPessoa, {
  type AlertaIntermunicipalPessoaDados,
} from "@/components/pessoas/AlertaIntermunicipalPessoa";
import {
  montarUrlComMunicipioContexto,
} from "@/lib/contextoMunicipio";
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

type UsuarioLogado = {
  id: string;
  nome?: string;
  perfil: string;
  municipio_id: number;
};

type ContextoNovaOcorrencia = {
  usuario_id: number;
  usuario_nome: string | null;
  perfil: string;
  municipio_id: number;
  pode_criar: boolean;
};

type GuarnicaoSugerida = {
  guarnicao_id: number;
  comandante_id: number | null;
  viatura_id: number | null;
  viatura_prefixo: string | null;
  membros_nomes: string[];
};

type ChamadoOrigem = {
  id: number | string;
  municipio_id: number;
  protocolo: string | null;
  tipo: string | null;
  local: string | null;
  bairro: string | null;
  numero: string | null;
  referencia: string | null;
  prioridade: string | null;
  observacao: string | null;
  solicitante: string | null;
  telefone: string | null;
};

type RespostaDadosNovaOcorrencia = {
  ok?: boolean;
  erro?: string;
  contexto?: ContextoNovaOcorrencia;
  guardas?: Array<{
    id: number;
    matricula: string | null;
    nome: string;
    cargo: string | null;
    status: string | null;
  }>;
  viaturas?: Array<{
    id: number;
    prefixo: string;
    modelo: string | null;
    placa: string | null;
    status: string | null;
  }>;
  locais?: Array<{
    id: number;
    nome: string;
    tipo: string | null;
  }>;
  guarnicoes?: GuarnicaoCompleta[];
  guarnicao_sugerida?: GuarnicaoSugerida | null;
  chamado?: ChamadoOrigem | null;
};


type RespostaCriarOcorrencia = {
  ok?: boolean;
  erro?: string;
  mensagem?: string;
  criado?: boolean;
  ocorrencia?: {
    id: number;
    protocolo: string;
    municipio_id: number;
  };
  avisos?: string[];
};


type RegistroHistoricoOcorrencia = {
  id: number;
  protocolo: string | null;
  data: string | null;
  status: string | null;
};

type RespostaHistoricoOcorrencia = {
  ok?: boolean;
  erro?: string;
  registros?: RegistroHistoricoOcorrencia[];
};


type PessoaConsultaOperacional = {
  id: number;
  nome: string | null;
  tipo_documento: string | null;
  documento: string | null;
  telefone: string | null;
  endereco: string | null;
  observacao: string | null;
};

type VeiculoConsultaOperacional = {
  id: number;
  placa: string | null;
  tipo_especie: string | null;
  marca: string | null;
  modelo: string | null;
  ano: string | null;
  cor: string | null;
  renavam: string | null;
  chassi: string | null;
  proprietario: string | null;
  cpf_proprietario: string | null;
  telefone_proprietario: string | null;
  condutor: string | null;
  tipo_documento_condutor: string | null;
  documento_condutor: string | null;
  situacao: string | null;
  observacao: string | null;
};

type RespostaConsultaOperacional<T> = {
  ok?: boolean;
  erro?: string;
  encontrado?: boolean;
  registro?: T | null;
};


type UploadFotoPreparado = {
  indice: number;
  nome_original: string;
  path: string;
  token: string;
  public_url: string;
  content_type: string;
  tamanho: number;
};

type RespostaPrepararFotos = {
  ok?: boolean;
  erro?: string;
  bucket?: string;
  uploads?: UploadFotoPreparado[];
};

function normalizarPlacaRedeFormulario(
  valor: string
) {
  return valor
    .trim()
    .toUpperCase()
    .replace(
      /[^A-Z0-9]/g,
      ""
    );
}

function normalizarDocumentoAlerta(
  valor: string
) {
  return valor
    .trim()
    .toUpperCase()
    .replace(
      /[^A-Z0-9]/g,
      ""
    );
}

function documentoPessoaValidoParaAlerta(
  tipoDocumento: string,
  documento: string
) {
  const tipo =
    String(
      tipoDocumento || ""
    ).toUpperCase();

  const normalizado =
    normalizarDocumentoAlerta(
      documento
    );

  if (
    tipo === "CPF" ||
    tipo === "CNH"
  ) {
    return normalizado.length ===
      11;
  }

  if (tipo === "RG") {
    return normalizado.length >=
      5;
  }

  return normalizado.length >=
    5;
}

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
  const [formaAcionamento, setFormaAcionamento] = useState("");
  const [relatoInicial, setRelatoInicial] = useState("");
  const [constatacaoEquipe, setConstatacaoEquipe] = useState("");
  const [providenciasAdotadas, setProvidenciasAdotadas] = useState("");
  const [desfechoOcorrencia, setDesfechoOcorrencia] = useState("");
  const [fotos, setFotos] = useState<File[]>([]);
  const [salvando, setSalvando] = useState(false);
  const [carregandoInicial, setCarregandoInicial] = useState(true);
  const [erroInicial, setErroInicial] = useState("");
  const [municipioId, setMunicipioId] = useState<number | null>(null);
  const [usuarioAtual, setUsuarioAtual] = useState<UsuarioLogado | null>(null);
  const [locais, setLocais] = useState<LocalCadastrado[]>([]);
  const [guarnicoes, setGuarnicoes] = useState<GuarnicaoCompleta[]>([]);
  const [guarnicaoId, setGuarnicaoId] = useState("");
  const [viaturaEmpenhada, setViaturaEmpenhada] = useState("");
  const [viaturaId, setViaturaId] = useState("");
  const [abrirVeiculos, setAbrirVeiculos] = useState(true);
  const [historicoVeiculo, setHistoricoVeiculo] = useState<any[]>([]);
  const [historicoEnvolvido, setHistoricoEnvolvido] = useState<any[]>([]);
  const [
    alertasIntermunicipais,
    setAlertasIntermunicipais,
  ] = useState<
    Record<
      number,
      AlertaIntermunicipalVeiculoDados | null
    >
  >({});
  const [
    consultandoAlertasIntermunicipais,
    setConsultandoAlertasIntermunicipais,
  ] = useState<Record<number, boolean>>({});
  const [
    confirmacoesAlertasIntermunicipaisVeiculos,
    setConfirmacoesAlertasIntermunicipaisVeiculos,
  ] = useState<Record<number, boolean>>({});
  const [
    alertasIntermunicipaisPessoas,
    setAlertasIntermunicipaisPessoas,
  ] = useState<
    Record<
      number,
      AlertaIntermunicipalPessoaDados | null
    >
  >({});
  const [
    consultandoAlertasIntermunicipaisPessoas,
    setConsultandoAlertasIntermunicipaisPessoas,
  ] = useState<Record<number, boolean>>({});
  const [
    confirmacoesAlertasIntermunicipaisPessoas,
    setConfirmacoesAlertasIntermunicipaisPessoas,
  ] = useState<Record<number, boolean>>({});
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

useEffect(() => {
  const narrativaSIGIA =
    sessionStorage.getItem("sigia_ocorrencia");

  if (!narrativaSIGIA) {
    return;
  }

  setDescricao(narrativaSIGIA);

  setMostrarVeiculos(
  /placa|veículo|automóvel|moto|caminhão/i.test(narrativaSIGIA)
);

setMostrarObjetos(
  /arma|droga|entorpecente|celular|objeto|faca|revólver|pistola/i.test(
    narrativaSIGIA
  )
);

  const texto =
    narrativaSIGIA.toLowerCase();

  if (texto.includes("furto")) {
    setTipo("Furto");
  } else if (texto.includes("roubo")) {
    setTipo("Roubo");
  } else if (texto.includes("ameaça")) {
    setTipo("Ameaça");
  } else if (texto.includes("lesão")) {
    setTipo("Lesão Corporal");
  } else if (
    texto.includes(
      "violência doméstica"
    )
  ) {
    setTipo(
      "Violência Doméstica"
    );
  } else if (
    texto.includes("tráfico") ||
    texto.includes("entorpecente")
  ) {
    setTipo("Entorpecentes");
  } else if (
    texto.includes("arma")
  ) {
    setTipo("Porte de Arma");
  } else if (
    texto.includes("dano")
  ) {
    setTipo(
      "Dano ao Patrimônio"
    );
  }

  const bairroMatch =
    narrativaSIGIA.match(
      /bairro[:\s]+([^\n,.]+)/i
    );

  if (bairroMatch) {
    setBairro(
      bairroMatch[1].trim()
    );
  }

  const localMatch =
    narrativaSIGIA.match(
      /local[:\s]+([^\n]+)/i
    );

  if (localMatch) {
    setLocal(
      localMatch[1].trim()
    );
  }

  const numeroMatch =
    narrativaSIGIA.match(
      /n[ºo°]?\s*[:\-]?\s*(\d+)/i
    );

  if (numeroMatch) {
    setNumero(numeroMatch[1]);
  }

  const placaMatch =
    narrativaSIGIA.match(
      /\b[A-Z]{3}[0-9][A-Z0-9][0-9]{2}\b/i
    );

  if (placaMatch) {
    const marcaMatch =
      narrativaSIGIA.match(
        /marca[:\s]+([^\n,]+)/i
      );

    const modeloMatch =
      narrativaSIGIA.match(
        /modelo[:\s]+([^\n,]+)/i
      );

    const corMatch =
      narrativaSIGIA.match(
        /cor[:\s]+([^\n,]+)/i
      );

    const anoMatch =
      narrativaSIGIA.match(
        /ano[:\s]+(\d{4})/i
      );

    setMostrarVeiculos(true);

    setVeiculosEnvolvidos(
      (lista) => {
        const copia = [...lista];

        copia[0] = {
          ...copia[0],
          placa:
            placaMatch[0].toUpperCase(),
          marca:
            marcaMatch?.[1]?.trim() ||
            copia[0].marca,
          modelo:
            modeloMatch?.[1]?.trim() ||
            copia[0].modelo,
          cor:
            corMatch?.[1]?.trim() ||
            copia[0].cor,
          ano:
            anoMatch?.[1] ||
            copia[0].ano,
        };

        return copia;
      }
    );
  }

  const cpfMatch =
    narrativaSIGIA.match(
      /\d{3}\.?\d{3}\.?\d{3}\-?\d{2}/
    );

  const nomeMatch =
    narrativaSIGIA.match(
      /nome[:\s]+([^\n]+)/i
    );

const tipoEnvolvidoMatch =
  narrativaSIGIA.match(
    /(?:tipo|qualificação)[:\s]+([^\n,.;]+)/i
  );

  const telefoneMatch =
    narrativaSIGIA.match(
      /\(?\d{2}\)?\s?9?\d{4}\-?\d{4}/
    );

  const enderecoMatch =
    narrativaSIGIA.match(
      /endereço[:\s]+([^\n]+)/i
    );

  if (
    cpfMatch ||
    nomeMatch ||
    telefoneMatch ||
    enderecoMatch
  ) {
    setEnvolvidos((lista) => {
      const copia = [...lista];

copia[0] = {
  ...copia[0],

  nome:
    nomeMatch?.[1]?.trim() ||
    copia[0].nome,

  documento:
    cpfMatch?.[0] ||
    copia[0].documento,

  telefone:
    telefoneMatch?.[0] ||
    copia[0].telefone,

  endereco:
    enderecoMatch?.[1]?.trim() ||
    copia[0].endereco,

  tipo:
    tipoEnvolvidoMatch?.[1]?.trim() ||
    copia[0].tipo,
};

      return copia;
    });
  }

  sessionStorage.removeItem(
    "sigia_ocorrencia"
  );
}, []);

useEffect(() => {
  if (
    !municipioId ||
    !usuarioAtual?.perfil
  ) {
    return;
  }

  const timers =
    envolvidos.map(
      (pessoa, index) => {
        if (
          !documentoPessoaValidoParaAlerta(
            pessoa.tipo_documento,
            pessoa.documento
          )
        ) {
          return null;
        }

        return window.setTimeout(
          () => {
            void consultarAlertaPessoaIntermunicipal(
              index,
              pessoa.tipo_documento,
              pessoa.documento
            );
          },
          700
        );
      }
    );

  return () => {
    for (const timer of timers) {
      if (timer !== null) {
        window.clearTimeout(
          timer
        );
      }
    }
  };
}, [
  municipioId,
  usuarioAtual?.perfil,
  envolvidos
    .map(
      (pessoa) =>
        `${pessoa.tipo_documento}:${pessoa.documento}`
    )
    .join("|"),
]);

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

    if (
      campo === "documento" ||
      campo === "tipo_documento"
    ) {
      setAlertasIntermunicipaisPessoas(
        (atual) => ({
          ...atual,
          [index]: null,
        })
      );

      setConfirmacoesAlertasIntermunicipaisPessoas(
        (atual) => ({
          ...atual,
          [index]: false,
        })
      );
    }
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

    setEnvolvidos(
      envolvidos.filter(
        (_, i) =>
          i !== index
      )
    );

    setAlertasIntermunicipaisPessoas({});
    setConsultandoAlertasIntermunicipaisPessoas({});
    setConfirmacoesAlertasIntermunicipaisPessoas({});
  }

  async function salvarOcorrencia(
    statusPersonalizado?: string
  ) {
    if (salvando) {
      return;
    }

    if (
      !tipo.trim() ||
      !localId ||
      !descricao.trim()
    ) {
      alert(
        "Preencha tipo, local e descrição."
      );
      return;
    }

    if (!municipioId || !usuarioAtual) {
      alert(
        "Sessão ou município inválido. Entre novamente."
      );
      return;
    }

    const veiculoSemConsultaIntermunicipal =
      veiculosEnvolvidos.some(
        (
          veiculo,
          index
        ) =>
          normalizarPlacaRedeFormulario(
            veiculo.placa
          ).length === 7 &&
          !alertasIntermunicipais[
            index
          ]
      );

    if (
      veiculoSemConsultaIntermunicipal
    ) {
      alert(
        "Aguarde a consulta intermunicipal dos veículos antes de salvar."
      );
      return;
    }

    const pessoaSemConsultaIntermunicipal =
      envolvidos.some(
        (
          pessoa,
          index
        ) =>
          documentoPessoaValidoParaAlerta(
            pessoa.tipo_documento,
            pessoa.documento
          ) &&
          !alertasIntermunicipaisPessoas[
            index
          ]
      );

    if (
      pessoaSemConsultaIntermunicipal
    ) {
      alert(
        "Aguarde a consulta intermunicipal das pessoas antes de salvar."
      );
      return;
    }

    const veiculoComAlertaPendente =
      Object.entries(
        alertasIntermunicipais
      ).some(
        ([indice, alerta]) =>
          Boolean(
            alerta?.alerta
          ) &&
          !confirmacoesAlertasIntermunicipaisVeiculos[
            Number(indice)
          ]
      );

    if (
      veiculoComAlertaPendente
    ) {
      alert(
        "Confirme a ciência dos alertas intermunicipais dos veículos."
      );
      return;
    }

    const pessoaComAlertaPendente =
      Object.entries(
        alertasIntermunicipaisPessoas
      ).some(
        ([indice, alerta]) =>
          Boolean(
            alerta?.alerta
          ) &&
          !confirmacoesAlertasIntermunicipaisPessoas[
            Number(indice)
          ]
      );

    if (
      pessoaComAlertaPendente
    ) {
      alert(
        "Confirme a ciência dos alertas intermunicipais das pessoas."
      );
      return;
    }

    setSalvando(true);

    try {
      const accessToken =
        await obterAccessToken();

      const fotosUrls: string[] = [];

      if (fotos.length > 0) {
        if (fotos.length > 10) {
          throw new Error(
            "Envie no máximo 10 imagens."
          );
        }

        const formatosPermitidos =
          new Set([
            "image/jpeg",
            "image/png",
            "image/webp",
          ]);

        for (const foto of fotos) {
          if (
            foto.size <= 0 ||
            foto.size >
              5 * 1024 * 1024
          ) {
            throw new Error(
              `A imagem "${foto.name}" deve ter no máximo 5MB.`
            );
          }

          if (
            !formatosPermitidos.has(
              foto.type
            )
          ) {
            throw new Error(
              `A imagem "${foto.name}" possui formato inválido. Use JPG, PNG ou WEBP.`
            );
          }
        }

        const respostaPreparacao =
          await fetch(
            "/api/ocorrencias/nova/fotos",
            {
              method: "POST",
              headers: {
                Authorization:
                  `Bearer ${accessToken}`,
                "Content-Type":
                  "application/json",
              },
              cache: "no-store",
              body: JSON.stringify({
                municipio_id:
                  municipioId,
                arquivos: fotos.map(
                  (foto) => ({
                    nome: foto.name,
                    tamanho:
                      foto.size,
                    tipo: foto.type,
                  })
                ),
              }),
            }
          );

        const dadosPreparacao =
          (await respostaPreparacao
            .json()
            .catch(
              () => null
            )) as RespostaPrepararFotos | null;

        if (
          respostaPreparacao.status ===
          401
        ) {
          localStorage.removeItem(
            "usuarioLogado"
          );
          router.replace("/login");
          return;
        }

        if (
          !respostaPreparacao.ok ||
          !dadosPreparacao?.ok ||
          !dadosPreparacao.bucket ||
          !Array.isArray(
            dadosPreparacao.uploads
          )
        ) {
          throw new Error(
            dadosPreparacao?.erro ||
              "Não foi possível preparar o envio das fotos."
          );
        }

        if (
          dadosPreparacao.uploads.length !==
          fotos.length
        ) {
          throw new Error(
            "A preparação das fotos retornou uma quantidade inválida."
          );
        }

        const uploadsOrdenados = [
          ...dadosPreparacao.uploads,
        ].sort(
          (a, b) =>
            a.indice - b.indice
        );

        for (const upload of uploadsOrdenados) {
          const foto =
            fotos[upload.indice];

          if (!foto) {
            throw new Error(
              "Uma das fotos preparadas não foi encontrada."
            );
          }

          const {
            error: uploadError,
          } = await supabase.storage
            .from(
              dadosPreparacao.bucket
            )
            .uploadToSignedUrl(
              upload.path,
              upload.token,
              foto,
              {
                cacheControl:
                  "3600",
                contentType:
                  foto.type,
              }
            );

          if (uploadError) {
            console.error(
              "Erro no upload assinado da foto:",
              {
                mensagem:
                  uploadError.message,
                arquivo:
                  foto.name,
                path:
                  upload.path,
              }
            );

            throw new Error(
              `Não foi possível enviar a imagem "${foto.name}".`
            );
          }

          if (
            upload.public_url
          ) {
            fotosUrls.push(
              upload.public_url
            );
          }
        }
      }

      const envolvidosValidos =
        envolvidos.filter(
          (pessoa) =>
            pessoa.nome ||
            pessoa.documento ||
            pessoa.telefone ||
            pessoa.endereco ||
            pessoa.observacao
        );

      const equipeEmpenhada =
        guardasSelecionados.join(
          "\n"
        );

      const resposta = await fetch(
        "/api/ocorrencias/nova",
        {
          method: "POST",
          headers: {
            Authorization:
              `Bearer ${accessToken}`,
            "Content-Type":
              "application/json",
          },
          cache: "no-store",
          body: JSON.stringify({
            municipio_id:
              municipioId,
            guarnicao_id:
              guarnicaoId ||
              null,
            viatura_id:
              viaturaId ||
              null,
            guarda_responsavel_id:
              guardaResponsavelId ||
              null,
            tipo: tipo.trim(),
            status:
              statusPersonalizado ||
              status,
            prioridade,
            bairro:
              bairro.trim(),
            local:
              local.trim(),
            local_id:
              localId,
            numero:
              numero.trim(),
            envolvidos:
              envolvidosValidos,
            ciencia_alertas_pessoas:
              !Object.values(
                alertasIntermunicipaisPessoas
              ).some(
                (alerta) =>
                  Boolean(
                    alerta?.alerta
                  )
              ) ||
              Object.entries(
                alertasIntermunicipaisPessoas
              ).every(
                ([indice, alerta]) =>
                  !alerta?.alerta ||
                  Boolean(
                    confirmacoesAlertasIntermunicipaisPessoas[
                      Number(indice)
                    ]
                  )
              ),
            veiculos_envolvidos:
              veiculosEnvolvidos,
            ciencia_alertas_veiculos:
              !Object.values(
                alertasIntermunicipais
              ).some(
                (alerta) =>
                  Boolean(
                    alerta?.alerta
                  )
              ) ||
              Object.entries(
                alertasIntermunicipais
              ).every(
                ([indice, alerta]) =>
                  !alerta?.alerta ||
                  Boolean(
                    confirmacoesAlertasIntermunicipaisVeiculos[
                      Number(indice)
                    ]
                  )
              ),
            armas_objetos:
              itensOcorrencia,
            descricao:
              descricao.trim(),
            fotos_urls:
              fotosUrls,
            viatura_empenhada:
              viaturaEmpenhada,
            equipe_empenhada:
              equipeEmpenhada,
          }),
        }
      );

      const dados = (await resposta
        .json()
        .catch(
          () => null
        )) as RespostaCriarOcorrencia | null;

      if (
        resposta.status === 401
      ) {
        localStorage.removeItem(
          "usuarioLogado"
        );
        router.replace("/login");
        return;
      }

      if (
        !resposta.ok ||
        !dados?.ok ||
        !dados.ocorrencia
      ) {
        throw new Error(
          dados?.erro ||
            "Não foi possível registrar a ocorrência."
        );
      }

      const avisos = Array.isArray(
        dados.avisos
      )
        ? dados.avisos
        : [];

      alert(
        avisos.length > 0
          ? `Ocorrência salva com sucesso.\n\nAvisos: ${avisos.join(
              "; "
            )}`
          : dados.mensagem ||
              "Ocorrência salva com sucesso."
      );

      router.push(
        `/sistema/ocorrencias/${dados.ocorrencia.id}`
      );
      router.refresh();
    } catch (error) {
      const mensagem =
        error instanceof Error
          ? error.message
          : "Erro ao salvar ocorrência.";

      console.error(
        "Erro ao salvar nova ocorrência:",
        {
          mensagem,
          error,
        }
      );

      alert(mensagem);
    } finally {
      setSalvando(false);
    }
  }

async function obterAccessToken() {
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();

  if (error || !session?.access_token) {
    throw new Error(
      "Sua sessão expirou. Entre novamente no sistema."
    );
  }

  return session.access_token;
}

async function carregarSistema() {
  setCarregandoInicial(true);
  setErroInicial("");

  try {
    const accessToken = await obterAccessToken();
    const parametros = new URLSearchParams();

    if (chamadoId) {
      parametros.set("chamado", chamadoId);
    }

    const consulta = parametros.toString();
    const urlBase = consulta
      ? `/api/ocorrencias/nova/dados?${consulta}`
      : "/api/ocorrencias/nova/dados";

    let usuarioCache: {
      perfil?: string;
      municipio_id?: number;
    } | null = null;

    try {
      const salvo =
        localStorage.getItem(
          "usuarioLogado"
        );

      usuarioCache = salvo
        ? JSON.parse(salvo)
        : null;
    } catch {
      usuarioCache = null;
    }

    const url =
      montarUrlComMunicipioContexto({
        url: urlBase,
        perfil:
          usuarioCache?.perfil,
        municipioIdUsuario:
          usuarioCache?.municipio_id,
      });

    const resposta = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      cache: "no-store",
    });

    const dados = (await resposta
      .json()
      .catch(() => null)) as RespostaDadosNovaOcorrencia | null;

if (!resposta.ok || !dados?.ok || !dados.contexto) {
  if (resposta.status === 401) {
    localStorage.removeItem("usuarioLogado");
    router.replace("/login");
    return;
  }

  if (resposta.status === 403) {
    setErroInicial(
      dados?.erro ||
        "Seu perfil não possui permissão para registrar ocorrências."
    );
    return;
  }

  throw new Error(
    dados?.erro ||
      "Não foi possível preparar a nova ocorrência."
  );
}

    const contexto = dados.contexto;

    const guardasNormalizados: Guarda[] = (
      dados.guardas || []
    ).map((guarda) => ({
      id: guarda.id,
      matricula: guarda.matricula || "",
      nome: guarda.nome,
      cargo: guarda.cargo || "",
      status: guarda.status || "",
    }));

    const viaturasNormalizadas: Viatura[] = (
      dados.viaturas || []
    ).map((viatura) => ({
      id: viatura.id,
      prefixo: viatura.prefixo,
      modelo: viatura.modelo || "",
      placa: viatura.placa || "",
      status: viatura.status || "",
    }));

    const locaisNormalizados: LocalCadastrado[] = (
      dados.locais || []
    ).map((item) => ({
      id: item.id,
      nome: item.nome,
      tipo: item.tipo || "",
    }));

    setUsuarioAtual({
      id: String(contexto.usuario_id),
      nome: contexto.usuario_nome || undefined,
      perfil: contexto.perfil,
      municipio_id: contexto.municipio_id,
    });

    setMunicipioId(contexto.municipio_id);
    setGuardas(guardasNormalizados);
    setViaturas(viaturasNormalizadas);
    setLocais(locaisNormalizados);
    setGuarnicoes(dados.guarnicoes || []);

    const sugestao = dados.guarnicao_sugerida;

    if (sugestao) {
      setGuarnicaoId(String(sugestao.guarnicao_id));
      setGuardasSelecionados(
        Array.isArray(sugestao.membros_nomes)
          ? sugestao.membros_nomes
          : []
      );

      if (sugestao.comandante_id) {
        setGuardaResponsavelId(
          String(sugestao.comandante_id)
        );
      }

      if (sugestao.viatura_id) {
        setViaturaId(
          String(sugestao.viatura_id)
        );
      }

      setViaturaEmpenhada(
        sugestao.viatura_prefixo || ""
      );
    }

    const chamado = dados.chamado;

    if (chamado) {
      setTipo(chamado.tipo || "");
      setLocal(chamado.local || "");
      setBairro(chamado.bairro || "");
      setNumero(chamado.numero || "");

      if (chamado.prioridade) {
        setPrioridade(chamado.prioridade);
      }

      const localCorrespondente =
        locaisNormalizados.find(
          (item) =>
            item.nome.trim().toLowerCase() ===
            String(chamado.local || "")
              .trim()
              .toLowerCase()
        );

      if (localCorrespondente) {
        setLocalId(
          String(localCorrespondente.id)
        );
      }

      setDescricao(
        `Ocorrência gerada a partir do chamado ${
          chamado.protocolo || chamado.id
        }.

Solicitante: ${chamado.solicitante || "-"}
Telefone: ${chamado.telefone || "-"}
Local: ${chamado.local || "-"}
Bairro: ${chamado.bairro || "-"}
Número: ${chamado.numero || "S/N"}
Referência: ${chamado.referencia || "-"}
Prioridade: ${chamado.prioridade || "-"}
Observação: ${chamado.observacao || "-"}`
      );

      setEnvolvidos([
        {
          nome: chamado.solicitante || "",
          tipo_documento: "CPF",
          documento: "",
          telefone: chamado.telefone || "",
          endereco: chamado.local || "",
          tipo: "Solicitante",
          observacao:
            chamado.observacao || "",
        },
      ]);
    }
  } catch (error) {
    const mensagem =
      error instanceof Error
        ? error.message
        : "Erro ao preparar a nova ocorrência.";

console.warn(
  "Falha ao preparar a nova ocorrência:",
  mensagem
);

    setErroInicial(mensagem);
  } finally {
    setCarregandoInicial(false);
  }
}

useEffect(() => {
  void carregarSistema();
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
function montarRelatorioEstruturado() {
  if (!tipo) {
    alert("Selecione o tipo da ocorrência antes de montar o relatório.");
    return;
  }

  const localCompleto = [
    local || "local não informado",
    numero ? `nº ${numero}` : "S/N",
    bairro ? `bairro ${bairro}` : "",
  ].filter(Boolean).join(", ");

  const equipe = guardasSelecionados.length > 0
    ? guardas
        .filter((guarda) => guardasSelecionados.includes(String(guarda.id)))
        .map((guarda) => `${guarda.nome}${guarda.matricula ? `, matrícula ${guarda.matricula}` : ""}`)
        .join("; ")
    : "equipe de serviço";

  const envolvidosTexto = envolvidos
    .filter((pessoa) => pessoa.nome || pessoa.documento || pessoa.tipo)
    .map((pessoa) => {
      const partes = [
        pessoa.tipo || "Envolvido",
        pessoa.nome || "não identificado",
        pessoa.documento ? `${pessoa.tipo_documento || "documento"} ${pessoa.documento}` : "",
        pessoa.observacao || "",
      ].filter(Boolean);
      return partes.join(", ");
    })
    .join("; ");

  const veiculosTexto = veiculosEnvolvidos
    .filter((veiculo) => veiculo.placa || veiculo.marca || veiculo.modelo)
    .map((veiculo) => [
      veiculo.tipo_especie || "veículo",
      veiculo.marca,
      veiculo.modelo,
      veiculo.cor ? `cor ${veiculo.cor}` : "",
      veiculo.placa ? `placa ${veiculo.placa}` : "",
      veiculo.situacao ? `situação ${veiculo.situacao}` : "",
    ].filter(Boolean).join(", "))
    .join("; ");

  const objetosTexto = itensOcorrencia
    .filter((item) => item.categoria || item.descricao || item.subcategoria)
    .map((item) => [
      item.categoria || "objeto",
      item.subcategoria,
      item.descricao,
      item.quantidade ? `quantidade ${item.quantidade}` : "",
      item.situacao ? `situação ${item.situacao}` : "",
    ].filter(Boolean).join(", "))
    .join("; ");

  const paragrafos = [
    `Na data e horário registrados no sistema, a equipe ${equipe}${viaturaEmpenhada ? `, utilizando a viatura ${viaturaEmpenhada}` : ""}, foi ${formaAcionamento ? formaAcionamento.toLocaleLowerCase("pt-BR") : "acionada"} para atendimento de ocorrência classificada como ${tipo}, em ${localCompleto}.`,
    relatoInicial ? `Segundo as informações iniciais: ${relatoInicial.trim()}` : "",
    constatacaoEquipe ? `No local, a equipe constatou que ${constatacaoEquipe.trim()}` : "",
    envolvidosTexto ? `Foram identificados os seguintes envolvidos: ${envolvidosTexto}.` : "",
    veiculosTexto ? `Veículos relacionados: ${veiculosTexto}.` : "",
    objetosTexto ? `Objetos ou materiais relacionados: ${objetosTexto}.` : "",
    providenciasAdotadas ? `Foram adotadas as seguintes providências: ${providenciasAdotadas.trim()}` : "",
    desfechoOcorrencia ? `Ao final do atendimento: ${desfechoOcorrencia.trim()}` : "",
    "A presente ocorrência foi registrada no SIG-GCM Brasil para controle operacional, acompanhamento e demais providências cabíveis.",
  ].filter(Boolean);

  setDescricao(paragrafos.join("\n\n"));
}

function limparAssistenteRelatorio() {
  setFormaAcionamento("");
  setRelatoInicial("");
  setConstatacaoEquipe("");
  setProvidenciasAdotadas("");
  setDesfechoOcorrencia("");
}

async function gerarNarrativaIA() {
  if (!tipo) {
    alert(
      "Selecione o tipo da ocorrência antes de gerar a narrativa."
    );
    return;
  }

  setGerandoNarrativa(true);

  try {
    const localCompleto = [
      local || "o local informado",
      bairro ? `bairro ${bairro}` : "",
      numero ? `nº ${numero}` : "",
    ]
      .filter(Boolean)
      .join(", ");

    const frases: string[] = [
      `Durante patrulhamento, a equipe da Guarda Civil Municipal recebeu uma solicitação relacionada a ${tipo.toLocaleLowerCase(
        "pt-BR"
      )}.`,
      `A guarnição deslocou-se até ${localCompleto}${
        viaturaEmpenhada
          ? ` com a viatura ${viaturaEmpenhada}`
          : ""
      }.`,
    ];

    const envolvidosInformados = envolvidos.filter(
      (pessoa) =>
        pessoa.nome ||
        pessoa.documento ||
        pessoa.telefone ||
        pessoa.observacao
    );

    if (envolvidosInformados.length > 0) {
      const identificacoes =
        envolvidosInformados
          .map((pessoa) => {
            const nome =
              pessoa.nome ||
              "pessoa não identificada";

            return pessoa.tipo
              ? `${pessoa.tipo.toLocaleLowerCase(
                  "pt-BR"
                )} ${nome}`
              : nome;
          })
          .join(", ");

      frases.push(
        `No local, foram identificados os seguintes envolvidos: ${identificacoes}.`
      );
    }

    frases.push(
      "A equipe realizou as verificações necessárias e adotou as providências cabíveis de acordo com a situação encontrada."
    );

    frases.push(
      "O atendimento foi registrado para acompanhamento."
    );

    setDescricao(frases.join("\n\n"));
  } catch (error) {
    console.error(
      "Erro ao gerar narrativa:",
      error
    );

    alert("Erro ao gerar narrativa.");
  } finally {
    setGerandoNarrativa(false);
  }
}

async function consultarHistorico(
  tipoConsulta: "VEICULO" | "PESSOA",
  valor: string
) {
  if (!municipioId) {
    return [] as RegistroHistoricoOcorrencia[];
  }

  const accessToken =
    await obterAccessToken();

  const parametros =
    new URLSearchParams({
      tipo: tipoConsulta,
      valor,
      municipio_id:
        String(municipioId),
    });

  const resposta = await fetch(
    `/api/ocorrencias/historico?${parametros.toString()}`,
    {
      method: "GET",
      headers: {
        Authorization:
          `Bearer ${accessToken}`,
      },
      cache: "no-store",
    }
  );

  const dados = (await resposta
    .json()
    .catch(
      () => null
    )) as RespostaHistoricoOcorrencia | null;

  if (resposta.status === 401) {
    localStorage.removeItem(
      "usuarioLogado"
    );
    router.replace("/login");

    return [];
  }

  if (!resposta.ok || !dados?.ok) {
    throw new Error(
      dados?.erro ||
        "Não foi possível consultar o histórico."
    );
  }

  return Array.isArray(
    dados.registros
  )
    ? dados.registros
    : [];
}

async function consultarHistoricoVeiculo(
  placa: string
) {
  const placaNormalizada =
    placa
      .trim()
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, "");

  if (
    placaNormalizada.length < 7
  ) {
    setHistoricoVeiculo([]);
    return;
  }

  try {
    const registros =
      await consultarHistorico(
        "VEICULO",
        placaNormalizada
      );

    setHistoricoVeiculo(
      registros
    );
  } catch (error) {
    console.error(
      "Erro ao consultar histórico do veículo:",
      error
    );

    setHistoricoVeiculo([]);
  }
}

async function consultarHistoricoEnvolvido(
  valor: string
) {
  const busca = valor.trim();

  if (busca.length < 3) {
    setHistoricoEnvolvido([]);
    return;
  }

  try {
    const registros =
      await consultarHistorico(
        "PESSOA",
        busca
      );

    setHistoricoEnvolvido(
      registros
    );
  } catch (error) {
    console.error(
      "Erro ao consultar histórico do envolvido:",
      error
    );

    setHistoricoEnvolvido([]);
  }
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

async function consultarCadastroOperacional<T>(
  tipoConsulta: "PESSOA" | "PLACA" | "RENAVAM",
  valor: string
): Promise<T | null> {
  if (!municipioId || !valor.trim()) {
    return null;
  }

  const accessToken =
    await obterAccessToken();

  const parametros =
    new URLSearchParams({
      tipo: tipoConsulta,
      valor,
      municipio_id:
        String(municipioId),
    });

  const resposta = await fetch(
    `/api/ocorrencias/consultas?${parametros.toString()}`,
    {
      method: "GET",
      headers: {
        Authorization:
          `Bearer ${accessToken}`,
      },
      cache: "no-store",
    }
  );

  const dados = (await resposta
    .json()
    .catch(
      () => null
    )) as RespostaConsultaOperacional<T> | null;

  if (resposta.status === 401) {
    localStorage.removeItem(
      "usuarioLogado"
    );
    router.replace("/login");
    return null;
  }

  if (!resposta.ok || !dados?.ok) {
    throw new Error(
      dados?.erro ||
        "Não foi possível realizar a consulta."
    );
  }

  if (
    !dados.encontrado ||
    !dados.registro
  ) {
    return null;
  }

  return dados.registro;
}

async function preencherPessoa(
  index: number,
  documento: string
) {
  const documentoNormalizado =
    documento.trim();

  if (
    !municipioId ||
    documentoNormalizado.length < 5
  ) {
    return;
  }

  try {
    const pessoa =
      await consultarCadastroOperacional<
        PessoaConsultaOperacional
      >(
        "PESSOA",
        documentoNormalizado
      );

    if (!pessoa) {
      return;
    }

    atualizarEnvolvido(
      index,
      "nome",
      pessoa.nome || ""
    );
    atualizarEnvolvido(
      index,
      "tipo_documento",
      pessoa.tipo_documento || ""
    );
    atualizarEnvolvido(
      index,
      "telefone",
      pessoa.telefone || ""
    );
    atualizarEnvolvido(
      index,
      "endereco",
      pessoa.endereco || ""
    );
    atualizarEnvolvido(
      index,
      "observacao",
      pessoa.observacao || ""
    );
  } catch (error) {
    console.error(
      "Erro ao preencher pessoa consultada:",
      error
    );
  }
}

function aplicarVeiculoConsultado(
  index: number,
  veiculo: VeiculoConsultaOperacional
) {
  atualizarVeiculo(index, "placa", veiculo.placa || "");
  atualizarVeiculo(
    index,
    "tipo_especie",
    veiculo.tipo_especie || ""
  );
  atualizarVeiculo(index, "marca", veiculo.marca || "");
  atualizarVeiculo(index, "modelo", veiculo.modelo || "");
  atualizarVeiculo(index, "ano", veiculo.ano || "");
  atualizarVeiculo(index, "cor", veiculo.cor || "");
  atualizarVeiculo(index, "renavam", veiculo.renavam || "");
  atualizarVeiculo(index, "chassi", veiculo.chassi || "");
  atualizarVeiculo(
    index,
    "proprietario",
    veiculo.proprietario || ""
  );
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
  atualizarVeiculo(
    index,
    "condutor",
    veiculo.condutor || ""
  );
  atualizarVeiculo(
    index,
    "tipo_documento_condutor",
    veiculo.tipo_documento_condutor || ""
  );
  atualizarVeiculo(
    index,
    "documento_condutor",
    veiculo.documento_condutor || ""
  );
  atualizarVeiculo(
    index,
    "situacao",
    veiculo.situacao || ""
  );
  atualizarVeiculo(
    index,
    "observacao",
    veiculo.observacao || ""
  );
}

async function consultarAlertaPessoaIntermunicipal(
  index: number,
  tipoDocumento: string,
  documento: string
) {
  const documentoNormalizado =
    normalizarDocumentoAlerta(
      documento
    );

  const tipoNormalizado =
    String(
      tipoDocumento || ""
    )
      .trim()
      .toUpperCase();

  if (
    !municipioId ||
    !documentoPessoaValidoParaAlerta(
      tipoNormalizado,
      documentoNormalizado
    )
  ) {
    setAlertasIntermunicipaisPessoas(
      (atual) => ({
        ...atual,
        [index]: null,
      })
    );

    setConfirmacoesAlertasIntermunicipaisPessoas(
      (atual) => ({
        ...atual,
        [index]: false,
      })
    );

    return;
  }

  setConsultandoAlertasIntermunicipaisPessoas(
    (atual) => ({
      ...atual,
      [index]: true,
    })
  );

  setConfirmacoesAlertasIntermunicipaisPessoas(
    (atual) => ({
      ...atual,
      [index]: false,
    })
  );

  try {
    const accessToken =
      await obterAccessToken();

    const parametros =
      new URLSearchParams({
        tipo_documento:
          tipoNormalizado,
        documento:
          documentoNormalizado,
      });

    const url =
      montarUrlComMunicipioContexto({
        url:
          `/api/pessoas/abordagens?${parametros.toString()}`,
        perfil:
          usuarioAtual?.perfil,
        municipioIdUsuario:
          municipioId,
      });

    const resposta =
      await fetch(
        url,
        {
          method: "GET",
          headers: {
            Authorization:
              `Bearer ${accessToken}`,
          },
          cache: "no-store",
        }
      );

    const retorno =
      (await resposta
        .json()
        .catch(() => ({}))) as {
        ok?: boolean;
        erro?: string;
        alerta?: boolean;
        tipo_documento?: string;
        total_registros?: number;
        total_municipios?: number;
        ultimo_registro?: AlertaIntermunicipalPessoaDados["ultimo_registro"];
        registros?: AlertaIntermunicipalPessoaDados["registros"];
      };

    if (
      !resposta.ok ||
      !retorno.ok
    ) {
      throw new Error(
        retorno.erro ||
        "Não foi possível consultar o alerta intermunicipal da pessoa."
      );
    }

    setAlertasIntermunicipaisPessoas(
      (atual) => ({
        ...atual,
        [index]: {
          alerta:
            Boolean(
              retorno.alerta
            ),
          tipo_documento:
            retorno.tipo_documento,
          total_registros:
            Number(
              retorno.total_registros ||
              0
            ),
          total_municipios:
            Number(
              retorno.total_municipios ||
              0
            ),
          ultimo_registro:
            retorno.ultimo_registro ||
            null,
          registros:
            Array.isArray(
              retorno.registros
            )
              ? retorno.registros
              : [],
        },
      })
    );
  } catch (error) {
    console.error(
      "Erro ao consultar alerta intermunicipal da pessoa:",
      error
    );

    setAlertasIntermunicipaisPessoas(
      (atual) => ({
        ...atual,
        [index]: null,
      })
    );
  } finally {
    setConsultandoAlertasIntermunicipaisPessoas(
      (atual) => ({
        ...atual,
        [index]: false,
      })
    );
  }
}

function placaBrasileiraValida(
  valor: string
) {
  const placa =
    valor
      .trim()
      .toUpperCase()
      .replace(
        /[^A-Z0-9]/g,
        ""
      );

  return /^[A-Z]{3}[0-9][A-Z0-9][0-9]{2}$/.test(
    placa
  );
}

async function consultarAlertaIntermunicipal(
  index: number,
  placa: string
) {
  const placaNormalizada =
    placa
      .trim()
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, "");


  setConfirmacoesAlertasIntermunicipaisVeiculos(
    (atual) => ({
      ...atual,
      [index]: false,
    })
  );

  if (
    !municipioId ||
    !placaBrasileiraValida(
      placaNormalizada
    )
  ) {
    setAlertasIntermunicipais(
      (atual) => ({
        ...atual,
        [index]: null,
      })
    );
    return;
  }

  setConsultandoAlertasIntermunicipais(
    (atual) => ({
      ...atual,
      [index]: true,
    })
  );

  try {
    const accessToken =
      await obterAccessToken();

    const parametros =
      new URLSearchParams({
        placa:
          placaNormalizada,
      });

    const url =
      montarUrlComMunicipioContexto({
        url:
          `/api/veiculos/abordagens?${parametros.toString()}`,
        perfil:
          usuarioAtual?.perfil,
        municipioIdUsuario:
          municipioId,
      });

    const resposta =
      await fetch(
        url,
        {
          method: "GET",
          headers: {
            Authorization:
              `Bearer ${accessToken}`,
          },
          cache: "no-store",
        }
      );

    const retorno =
      (await resposta
        .json()
        .catch(() => ({}))) as {
        ok?: boolean;
        erro?: string;
        alerta?: boolean;
        placa?: string;
        total_registros?: number;
        total_municipios?: number;
        ultimo_registro?: AlertaIntermunicipalVeiculoDados["ultimo_registro"];
        registros?: AlertaIntermunicipalVeiculoDados["registros"];
      };

    if (
      resposta.status === 422 &&
      retorno.erro ===
        "Informe uma placa válida."
    ) {
      setAlertasIntermunicipais(
        (atual) => ({
          ...atual,
          [index]: null,
        })
      );
      return;
    }

    if (
      !resposta.ok ||
      !retorno.ok
    ) {
      throw new Error(
        retorno.erro ||
        "Não foi possível consultar o alerta intermunicipal."
      );
    }

    setAlertasIntermunicipais(
      (atual) => ({
        ...atual,
        [index]: {
          alerta:
            Boolean(
              retorno.alerta
            ),
          placa:
            retorno.placa,
          total_registros:
            Number(
              retorno.total_registros ||
              0
            ),
          total_municipios:
            Number(
              retorno.total_municipios ||
              0
            ),
          ultimo_registro:
            retorno.ultimo_registro ||
            null,
          registros:
            Array.isArray(
              retorno.registros
            )
              ? retorno.registros
              : [],
        },
      })
    );
  } catch (error) {
    console.error(
      "Erro ao consultar alerta intermunicipal do veículo:",
      error
    );

    setAlertasIntermunicipais(
      (atual) => ({
        ...atual,
        [index]: null,
      })
    );
  } finally {
    setConsultandoAlertasIntermunicipais(
      (atual) => ({
        ...atual,
        [index]: false,
      })
    );
  }
}

async function preencherVeiculo(
  index: number,
  placa: string
) {
  const placaNormalizada =
    placa
      .trim()
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, "");

  if (
    !municipioId ||
    !placaBrasileiraValida(
      placaNormalizada
    )
  ) {
    return;
  }

  void consultarAlertaIntermunicipal(
    index,
    placaNormalizada
  );

  try {
    const veiculo =
      await consultarCadastroOperacional<
        VeiculoConsultaOperacional
      >(
        "PLACA",
        placaNormalizada
      );

    if (veiculo) {
      aplicarVeiculoConsultado(
        index,
        veiculo
      );
    }
  } catch (error) {
    console.error(
      "Erro ao preencher veículo pela placa:",
      error
    );
  }
}

async function preencherVeiculoPorRenavam(
  index: number,
  renavam: string
) {
  const renavamNormalizado =
    renavam.replace(/\D/g, "");

  if (
    !municipioId ||
    renavamNormalizado.length !== 11
  ) {
    return;
  }

  try {
    const veiculo =
      await consultarCadastroOperacional<
        VeiculoConsultaOperacional
      >(
        "RENAVAM",
        renavamNormalizado
      );

    if (veiculo) {
      aplicarVeiculoConsultado(
        index,
        veiculo
      );
    }
  } catch (error) {
    console.error(
      "Erro ao preencher veículo pelo Renavam:",
      error
    );
  }
}

  if (carregandoInicial) {
    return (
      <ProtecaoModulo modulo="ocorrencias">
        <div className="p-6 text-slate-400">
          Carregando dados da nova ocorrência...
        </div>
      </ProtecaoModulo>
    );
  }

if (erroInicial) {
  const semPermissao =
    erroInicial
      .toLowerCase()
      .includes("permissão");

  return (
    <ProtecaoModulo modulo="ocorrencias">
      <main className="sig-page">
        <div
          className={
            semPermissao
              ? "sig-empty"
              : "sig-error"
          }
        >
          <div className="max-w-xl text-center">
            <h1 className="text-2xl font-black text-white">
              {semPermissao
                ? "Acesso restrito"
                : "Não foi possível abrir a página"}
            </h1>

            <p className="mt-3 text-slate-400">
              {erroInicial}
            </p>

            <button
              type="button"
              onClick={() =>
                router.replace(
                  "/sistema/central-ocorrencias"
                )
              }
              className="btn-primary mt-6"
            >
              Voltar para a Central de Ocorrências
            </button>

            {!semPermissao ? (
              <button
                type="button"
                onClick={() =>
                  void carregarSistema()
                }
                className="btn-secondary mt-3"
              >
                Tentar novamente
              </button>
            ) : null}
          </div>
        </div>
      </main>
    </ProtecaoModulo>
  );
}

  return (
  <ProtecaoModulo modulo="ocorrencias">
  <>
    <div className="formularioOcorrenciaPremium hidden min-h-screen bg-[#020817] p-6 md:block md:p-8">
<header className="cabecalhoOcorrenciaPremium">
  <h1 className="text-4xl font-black text-white">
    Nova Ocorrência
  </h1>

  <p className="mt-2 text-slate-300">
    Preencha os dados para registrar uma nova ocorrência no sistema.
  </p>
</header>

<form className="formularioPrincipalOcorrencia w-full max-w-full space-y-8 overflow-hidden">
        
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

  <div className="space-y-3">
    {envolvidos.map(
      (pessoa, index) => (
        <AlertaIntermunicipalPessoa
          key={`alerta-pessoa-${index}`}
          alerta={
            alertasIntermunicipaisPessoas[
              index
            ] || null
          }
          carregando={
            Boolean(
              consultandoAlertasIntermunicipaisPessoas[
                index
              ]
            )
          }
          exigirConfirmacao={
            Boolean(
              alertasIntermunicipaisPessoas[
                index
              ]?.alerta
            )
          }
          confirmado={
            Boolean(
              confirmacoesAlertasIntermunicipaisPessoas[
                index
              ]
            )
          }
          onConfirmar={(valor) =>
            setConfirmacoesAlertasIntermunicipaisPessoas(
              (atual) => ({
                ...atual,
                [index]: valor,
              })
            )
          }
          compacto
        />
      )
    )}
  </div>

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

<div className="md:col-span-12">
  <AlertaIntermunicipalVeiculo
    alerta={
      alertasIntermunicipais[
        index
      ] || null
    }
    carregando={
      Boolean(
        consultandoAlertasIntermunicipais[
          index
        ]
      )
    }
    exigirConfirmacao={
      Boolean(
        alertasIntermunicipais[
          index
        ]?.alerta
      )
    }
    confirmado={
      Boolean(
        confirmacoesAlertasIntermunicipaisVeiculos[
          index
        ]
      )
    }
    onConfirmar={(valor) =>
      setConfirmacoesAlertasIntermunicipaisVeiculos(
        (atual) => ({
          ...atual,
          [index]: valor,
        })
      )
    }
    compacto
  />
</div>

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

  if (renavam.length === 11) {
    await preencherVeiculoPorRenavam(
      index,
      renavam
    );
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
let valor = formatarTelefone(e.target.value);

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
  titulo="Relatório da ocorrência"
  descricao="Preencha os fatos por etapas e monte uma narrativa clara, cronológica e profissional."
>
  <div className="mb-5 rounded-xl border border-blue-500/20 bg-blue-950/30 p-4">
    <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
      <div>
        <h3 className="font-semibold text-white">Assistente de preenchimento</h3>
        <p className="text-sm text-slate-300">Informe somente fatos objetivos. O sistema organiza o texto final.</p>
      </div>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={montarRelatorioEstruturado}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500"
        >
          Montar relatório
        </button>
        <button
          type="button"
          onClick={limparAssistenteRelatorio}
          className="rounded-lg border border-slate-600 px-4 py-2 text-sm font-semibold text-slate-200 hover:bg-slate-800"
        >
          Limpar campos auxiliares
        </button>
      </div>
    </div>

    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      <div>
        <label className="label">Forma de acionamento</label>
        <select className="input" value={formaAcionamento} onChange={(e) => setFormaAcionamento(e.target.value)}>
          <option value="">Selecione</option>
          <option value="acionada pela central de comunicações">Central de comunicações</option>
          <option value="solicitada por cidadão no local">Solicitação de cidadão</option>
          <option value="informada por ligação telefônica">Ligação telefônica</option>
          <option value="informada por aplicativo ou canal digital">Aplicativo / canal digital</option>
          <option value="mobilizada durante patrulhamento preventivo">Flagrante durante patrulhamento</option>
          <option value="acionada por outro órgão público">Outro órgão público</option>
        </select>
      </div>

      <div>
        <label className="label">Informação inicial recebida</label>
        <textarea
          className="input h-24 resize-y"
          placeholder="Ex.: Foi informado que havia uma discussão em via pública..."
          value={relatoInicial}
          onChange={(e) => setRelatoInicial(e.target.value)}
        />
      </div>

      <div>
        <label className="label">O que a equipe constatou</label>
        <textarea
          className="input h-28 resize-y"
          placeholder="Ex.: Ao chegar, a equipe encontrou as partes separadas e sem lesões aparentes..."
          value={constatacaoEquipe}
          onChange={(e) => setConstatacaoEquipe(e.target.value)}
        />
      </div>

      <div>
        <label className="label">Providências adotadas</label>
        <textarea
          className="input h-28 resize-y"
          placeholder="Ex.: As partes foram orientadas, os documentos consultados e o objeto recolhido..."
          value={providenciasAdotadas}
          onChange={(e) => setProvidenciasAdotadas(e.target.value)}
        />
      </div>

      <div className="md:col-span-2">
        <label className="label">Desfecho do atendimento</label>
        <textarea
          className="input h-24 resize-y"
          placeholder="Ex.: A vítima foi encaminhada à unidade de saúde e as partes apresentadas à autoridade competente..."
          value={desfechoOcorrencia}
          onChange={(e) => setDesfechoOcorrencia(e.target.value)}
        />
      </div>
    </div>
  </div>

  <div className="mb-4 flex flex-wrap justify-end gap-2">
    <button
      type="button"
      onClick={gerarNarrativaIA}
      disabled={gerandoNarrativa}
      className="rounded-lg border border-[#C9A227] px-4 py-2 font-semibold text-white hover:bg-[#C9A227]/10 disabled:opacity-50"
    >
      {gerandoNarrativa ? "Gerando narrativa..." : "Gerar narrativa rápida"}
    </button>
  </div>

  <div>
    <div className="mb-2 flex items-center justify-between gap-3">
      <label className="label">Narrativa oficial</label>
      <span className={`text-xs ${descricao.trim().length < 120 ? "text-amber-300" : "text-emerald-300"}`}>
        {descricao.trim().length} caracteres
      </span>
    </div>
    <textarea
      className="input min-h-64 resize-y"
      placeholder="O relatório montado aparecerá aqui. Revise nomes, horários, locais, providências e desfecho antes de salvar."
      value={descricao}
      onChange={(e) => setDescricao(e.target.value)}
    />
    <div className="mt-3 grid grid-cols-1 gap-2 text-xs text-slate-300 sm:grid-cols-2 lg:grid-cols-4">
      <span className={tipo ? "text-emerald-300" : "text-amber-300"}>• Tipo da ocorrência</span>
      <span className={local ? "text-emerald-300" : "text-amber-300"}>• Local do fato</span>
      <span className={constatacaoEquipe || descricao.length >= 120 ? "text-emerald-300" : "text-amber-300"}>• Constatação objetiva</span>
      <span className={providenciasAdotadas || descricao.length >= 200 ? "text-emerald-300" : "text-amber-300"}>• Providências e desfecho</span>
    </div>
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

    <div className="formularioOcorrenciaPremium block md:hidden">
  <main className="min-h-screen bg-[#02060f] text-white p-4 pb-28">
    <header className="mb-5">
      <h1 className="text-3xl font-black">
        Nova Ocorrência
      </h1>

      <p className="text-slate-400 text-sm mt-2">
        Registro rápido usando a mesma base da versão PC.
      </p>
    </header>

    <section className="space-y-4">
      <div className="rounded-3xl bg-slate-900 border border-slate-800 p-4">
        <label className="text-sm text-slate-400 mb-2 block">
          Tipo da ocorrência
        </label>

        <select
          value={tipo}
          onChange={(e) => setTipo(e.target.value)}
          className="w-full bg-transparent outline-none text-white"
        >
          <option value="">Selecione</option>

          {TIPOS_OCORRENCIA.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
      </div>

      <div className="rounded-3xl bg-slate-900 border border-slate-800 p-4">
  <label className="text-sm text-slate-400 mb-2 block">
    Guarnição
  </label>

  <select
    value={guarnicaoId}
    onChange={(e) => setGuarnicaoId(e.target.value)}
    className="w-full bg-transparent outline-none text-white"
  >
    <option value="">Selecione a guarnição</option>

    {guarnicoes.map((g) => (
      <option key={g.id} value={g.id}>
        {g.nome}
      </option>
    ))}
  </select>
</div>

<div className="rounded-3xl bg-slate-900 border border-slate-800 p-4">
  <label className="text-sm text-slate-400 mb-2 block">
    Viatura
  </label>

  <select
    value={viaturaId}
    onChange={(e) => {
      setViaturaId(e.target.value);

      const vtr = viaturas.find(
        (v) => String(v.id) === e.target.value
      );

      setViaturaEmpenhada(vtr?.prefixo || "");
    }}
    className="w-full bg-transparent outline-none text-white"
  >
    <option value="">Selecione a viatura</option>

    {viaturas.map((v) => (
      <option key={v.id} value={v.id}>
        {v.prefixo} {v.modelo ? `- ${v.modelo}` : ""}
      </option>
    ))}
  </select>
</div>

<div className="rounded-3xl bg-slate-900 border border-slate-800 p-4">
  <label className="text-sm text-slate-400 mb-2 block">
    Responsável
  </label>

  <select
    value={guardaResponsavelId}
    onChange={(e) => setGuardaResponsavelId(e.target.value)}
    className="w-full bg-transparent outline-none text-white"
  >
    <option value="">Selecione o responsável</option>

    {guardas.map((g) => (
      <option key={g.id} value={g.id}>
        {g.nome}
      </option>
    ))}
  </select>
</div>

      <div className="rounded-3xl bg-slate-900 border border-slate-800 p-4">
        <label className="text-sm text-slate-400 mb-2 block">
          Local
        </label>

        <select
          value={localId}
          onChange={(e) => {
            setLocalId(e.target.value);

            const selecionado = locais.find(
              (l) => String(l.id) === e.target.value
            );

            setLocal(selecionado?.nome || "");
          }}
          className="w-full bg-transparent outline-none text-white"
        >
          <option value="">Selecione o local</option>

          {locais.map((l) => (
            <option key={l.id} value={l.id}>
              {l.nome}
            </option>
          ))}
        </select>
      </div>

      <div className="rounded-3xl bg-slate-900 border border-slate-800 p-4">
        <label className="text-sm text-slate-400 mb-2 block">
          Bairro
        </label>

        <input
          value={bairro}
          onChange={(e) => setBairro(e.target.value)}
          placeholder="Bairro"
          className="w-full bg-transparent outline-none text-white"
        />
      </div>

      <div className="rounded-3xl bg-slate-900 border border-slate-800 p-4">
        <label className="text-sm text-slate-400 mb-2 block">
          Número
        </label>

        <input
          value={numero}
          onChange={(e) => setNumero(e.target.value)}
          placeholder="Número ou S/N"
          className="w-full bg-transparent outline-none text-white"
        />
      </div>

      <div className="rounded-3xl bg-slate-900 border border-slate-800 p-4 space-y-4">
  <div className="flex items-center justify-between gap-3">
    <div>
      <h2 className="text-lg font-black">
        Envolvidos
      </h2>

      <p className="text-slate-400 text-sm">
        Pessoas relacionadas à ocorrência.
      </p>
    </div>

    <button
      type="button"
      onClick={adicionarEnvolvido}
      className="px-4 py-2 rounded-2xl bg-blue-600 font-bold text-sm"
    >
      +
    </button>
  </div>

  {envolvidos.map((pessoa, index) => (
    <div
      key={index}
      className="rounded-2xl bg-slate-950 border border-slate-800 p-4 space-y-3"
    >
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-blue-300">
          Envolvido {index + 1}
        </h3>

        {envolvidos.length > 1 && (
          <button
            type="button"
            onClick={() => removerEnvolvido(index)}
            className="text-red-400 text-sm font-bold"
          >
            Remover
          </button>
        )}
      </div>

      <input
        value={pessoa.nome}
        onChange={(e) =>
          atualizarEnvolvido(index, "nome", e.target.value)
        }
        placeholder="Nome completo"
        className="w-full rounded-2xl bg-slate-900 border border-slate-800 px-4 py-3 outline-none text-white"
      />

      <select
        value={pessoa.tipo}
        onChange={(e) =>
          atualizarEnvolvido(index, "tipo", e.target.value)
        }
        className="w-full rounded-2xl bg-slate-900 border border-slate-800 px-4 py-3 outline-none text-white"
      >
        <option value="">Tipo do envolvido</option>

        {TIPOS_ENVOLVIDO.map((tipo) => (
          <option key={tipo} value={tipo}>
            {tipo}
          </option>
        ))}
      </select>

      <div className="grid grid-cols-2 gap-3">
        <select
          value={pessoa.tipo_documento || "CPF"}
          onChange={(e) =>
            atualizarEnvolvido(index, "tipo_documento", e.target.value)
          }
          className="rounded-2xl bg-slate-900 border border-slate-800 px-4 py-3 outline-none text-white"
        >
          <option value="CPF">CPF</option>
          <option value="RG">RG</option>
          <option value="CNH">CNH</option>
          <option value="PASSAPORTE">Passaporte</option>
          <option value="OUTRO">Outro</option>
        </select>

        <input
          value={pessoa.documento}
          onChange={async (e) => {
            let valor = e.target.value;

            if (pessoa.tipo_documento === "CPF") {
              valor = formatarCPF(valor);
            } else if (pessoa.tipo_documento === "RG") {
              valor = formatarRG(valor);
            } else if (pessoa.tipo_documento === "CNH") {
              valor = formatarCNH(valor);
            }

            atualizarEnvolvido(index, "documento", valor);

            if (
              (pessoa.tipo_documento === "CPF" && valor.length === 14) ||
              (pessoa.tipo_documento === "CNH" && valor.length === 11) ||
              (pessoa.tipo_documento === "RG" && valor.length >= 7)
            ) {
              await preencherPessoa(index, valor);
              await consultarHistoricoEnvolvido(valor);
            }
          }}
          placeholder="Documento"
          className="rounded-2xl bg-slate-900 border border-slate-800 px-4 py-3 outline-none text-white"
        />
      </div>

      <input
        value={pessoa.telefone}
        onChange={(e) =>
          atualizarEnvolvido(
            index,
            "telefone",
            formatarTelefone(e.target.value)
          )
        }
        placeholder="Telefone"
        className="w-full rounded-2xl bg-slate-900 border border-slate-800 px-4 py-3 outline-none text-white"
      />

      <input
        value={pessoa.endereco}
        onChange={(e) =>
          atualizarEnvolvido(index, "endereco", e.target.value)
        }
        placeholder="Endereço"
        className="w-full rounded-2xl bg-slate-900 border border-slate-800 px-4 py-3 outline-none text-white"
      />

      <textarea
        value={pessoa.observacao}
        onChange={(e) =>
          atualizarEnvolvido(index, "observacao", e.target.value)
        }
        placeholder="Observação"
        className="w-full min-h-24 rounded-2xl bg-slate-900 border border-slate-800 px-4 py-3 outline-none text-white resize-none"
      />

      {historicoEnvolvido.length > 0 && pessoa.documento && (
        <div className="rounded-2xl border border-purple-500/40 bg-purple-950/30 p-3">
          <p className="text-purple-300 font-bold text-sm">
            Histórico encontrado
          </p>

          <p className="text-slate-400 text-xs mt-1">
            {historicoEnvolvido.length} ocorrência(s) relacionada(s).
          </p>
        </div>
      )}
      <AlertaIntermunicipalPessoa
        alerta={
          alertasIntermunicipaisPessoas[
            index
          ] || null
        }
        carregando={
          Boolean(
            consultandoAlertasIntermunicipaisPessoas[
              index
            ]
          )
        }
        exigirConfirmacao={
          Boolean(
            alertasIntermunicipaisPessoas[
              index
            ]?.alerta
          )
        }
        confirmado={
          Boolean(
            confirmacoesAlertasIntermunicipaisPessoas[
              index
            ]
          )
        }
        onConfirmar={(valor) =>
          setConfirmacoesAlertasIntermunicipaisPessoas(
            (atual) => ({
              ...atual,
              [index]: valor,
            })
          )
        }
        compacto
      />
    </div>
  ))}
</div>

<button
  type="button"
  onClick={() => setMostrarVeiculos(!mostrarVeiculos)}
  className="w-full rounded-3xl bg-slate-900 border border-slate-800 p-4 flex items-center justify-between"
>
  <span className="font-black">
    Veículos
  </span>

  <span className="text-blue-400">
    {mostrarVeiculos ? "Ocultar" : "Adicionar"}
  </span>
</button>

{mostrarVeiculos && (
<div className="rounded-3xl bg-slate-900 border border-slate-800 p-4">
  <div className="flex items-center justify-between gap-3">
    <div>
      <h2 className="text-lg font-black">Veículos</h2>
      <p className="text-slate-400 text-sm">
        Veículos relacionados à ocorrência.
      </p>
    </div>

    <button
      type="button"
      onClick={adicionarVeiculo}
      className="px-4 py-2 rounded-2xl bg-blue-600 font-bold text-sm"
    >
      +
    </button>
  </div>

  {veiculosEnvolvidos.map((veiculo, index) => (
    <div
      key={index}
      className="rounded-2xl bg-slate-950 border border-slate-800 p-4 space-y-3"
    >
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-blue-300">
          Veículo {index + 1}
        </h3>

        {veiculosEnvolvidos.length > 1 && (
          <button
            type="button"
            onClick={() => removerVeiculo(index)}
            className="text-red-400 text-sm font-bold"
          >
            Remover
          </button>
        )}
      </div>

      <input
        value={veiculo.placa}
        maxLength={7}
        placeholder="Placa"
        onChange={async (e) => {
          const placa = formatarPlaca(e.target.value);
          atualizarVeiculo(index, "placa", placa);

          if (placa.length === 7) {
            await preencherVeiculo(index, placa);
            await consultarHistoricoVeiculo(placa);
          }
        }}
        className="w-full rounded-2xl bg-slate-900 border border-slate-800 px-4 py-3 outline-none text-white uppercase"
      />

      {historicoVeiculo.length > 0 && veiculo.placa && (
        <div className="rounded-2xl border border-yellow-500/40 bg-yellow-950/30 p-3">
          <p className="text-yellow-300 font-bold text-sm">
            Histórico encontrado
          </p>

          <p className="text-slate-400 text-xs mt-1">
            {historicoVeiculo.length} ocorrência(s) relacionada(s).
          </p>
        </div>
      )}

      <AlertaIntermunicipalVeiculo
        alerta={
          alertasIntermunicipais[
            index
          ] || null
        }
        carregando={
          Boolean(
            consultandoAlertasIntermunicipais[
              index
            ]
          )
        }
        exigirConfirmacao={
          Boolean(
            alertasIntermunicipais[
              index
            ]?.alerta
          )
        }
        confirmado={
          Boolean(
            confirmacoesAlertasIntermunicipaisVeiculos[
              index
            ]
          )
        }
        onConfirmar={(valor) =>
          setConfirmacoesAlertasIntermunicipaisVeiculos(
            (atual) => ({
              ...atual,
              [index]: valor,
            })
          )
        }
        compacto
      />

      <select
        value={veiculo.tipo_especie}
        onChange={(e) => {
          atualizarVeiculo(index, "tipo_especie", e.target.value);
          atualizarVeiculo(index, "marca", "");
          atualizarVeiculo(index, "modelo", "");
        }}
        className="w-full rounded-2xl bg-slate-900 border border-slate-800 px-4 py-3 outline-none text-white"
      >
        <option value="">Tipo / Espécie</option>
        {Object.keys(VEICULOS_POR_TIPO).map((tipo) => (
          <option key={tipo} value={tipo}>
            {tipo}
          </option>
        ))}
      </select>

      <select
        value={veiculo.marca}
        onChange={(e) => {
          atualizarVeiculo(index, "marca", e.target.value);
          atualizarVeiculo(index, "modelo", "");
        }}
        className="w-full rounded-2xl bg-slate-900 border border-slate-800 px-4 py-3 outline-none text-white"
      >
        <option value="">Marca</option>
        {Object.keys(VEICULOS_POR_TIPO[veiculo.tipo_especie] || {}).map(
          (marca) => (
            <option key={marca} value={marca}>
              {marca}
            </option>
          )
        )}
      </select>

      <select
        value={veiculo.modelo}
        onChange={(e) =>
          atualizarVeiculo(index, "modelo", e.target.value)
        }
        disabled={!veiculo.tipo_especie || !veiculo.marca}
        className="w-full rounded-2xl bg-slate-900 border border-slate-800 px-4 py-3 outline-none text-white disabled:opacity-50"
      >
        <option value="">Modelo</option>
        {(VEICULOS_POR_TIPO[veiculo.tipo_especie]?.[veiculo.marca] || []).map(
          (modelo) => (
            <option key={modelo} value={modelo}>
              {modelo}
            </option>
          )
        )}
        <option value="OUTRO">Outro</option>
      </select>

      <div className="grid grid-cols-2 gap-3">
        <select
          value={veiculo.cor}
          onChange={(e) =>
            atualizarVeiculo(index, "cor", e.target.value)
          }
          className="rounded-2xl bg-slate-900 border border-slate-800 px-4 py-3 outline-none text-white"
        >
          <option value="">Cor</option>
          {CORES_VEICULO.map((cor) => (
            <option key={cor} value={cor}>
              {cor}
            </option>
          ))}
        </select>

        <select
          value={veiculo.ano}
          onChange={(e) =>
            atualizarVeiculo(index, "ano", e.target.value)
          }
          className="rounded-2xl bg-slate-900 border border-slate-800 px-4 py-3 outline-none text-white"
        >
          <option value="">Ano</option>
          {Array.from(
            { length: new Date().getFullYear() + 2 - 1975 },
            (_, i) => new Date().getFullYear() + 1 - i
          ).map((ano) => (
            <option key={ano} value={String(ano)}>
              {ano}
            </option>
          ))}
        </select>
      </div>

      <input
        value={veiculo.renavam}
        maxLength={11}
        inputMode="numeric"
        placeholder="Renavam"
        onChange={async (e) => {
          const renavam = formatarRenavam(e.target.value);
          atualizarVeiculo(index, "renavam", renavam);

          if (renavam.length === 11) {
            await preencherVeiculoPorRenavam(
              index,
              renavam
            );
          }
        }}
        className="w-full rounded-2xl bg-slate-900 border border-slate-800 px-4 py-3 outline-none text-white"
      />

      <input
        value={veiculo.chassi}
        maxLength={17}
        placeholder="Chassi"
        onChange={(e) =>
          atualizarVeiculo(index, "chassi", formatarChassi(e.target.value))
        }
        className="w-full rounded-2xl bg-slate-900 border border-slate-800 px-4 py-3 outline-none text-white uppercase"
      />

      <div className="pt-3 border-t border-slate-800">
        <p className="text-sm font-bold text-slate-300 mb-3">
          Condutor
        </p>

        <input
          value={veiculo.condutor}
          placeholder="Nome do condutor"
          onChange={(e) =>
            atualizarVeiculo(index, "condutor", e.target.value)
          }
          className="w-full rounded-2xl bg-slate-900 border border-slate-800 px-4 py-3 outline-none text-white mb-3"
        />

        <div className="grid grid-cols-2 gap-3">
          <select
            value={veiculo.tipo_documento_condutor}
            onChange={(e) =>
              atualizarVeiculo(
                index,
                "tipo_documento_condutor",
                e.target.value
              )
            }
            className="rounded-2xl bg-slate-900 border border-slate-800 px-4 py-3 outline-none text-white"
          >
            <option value="CPF">CPF</option>
            <option value="CNH">CNH</option>
            <option value="RG">RG</option>
            <option value="PASSAPORTE">Passaporte</option>
            <option value="OUTRO">Outro</option>
          </select>

          <input
            value={veiculo.documento_condutor}
            placeholder="Documento"
            onChange={(e) =>
              atualizarVeiculo(
                index,
                "documento_condutor",
                formatarDocumentoCondutor(
                  veiculo.tipo_documento_condutor,
                  e.target.value
                )
              )
            }
            className="rounded-2xl bg-slate-900 border border-slate-800 px-4 py-3 outline-none text-white"
          />
        </div>
      </div>

      <div className="pt-3 border-t border-slate-800">
        <p className="text-sm font-bold text-slate-300 mb-3">
          Proprietário
        </p>

        <input
          value={veiculo.proprietario}
          placeholder="Nome do proprietário"
          onChange={(e) =>
            atualizarVeiculo(index, "proprietario", e.target.value)
          }
          className="w-full rounded-2xl bg-slate-900 border border-slate-800 px-4 py-3 outline-none text-white mb-3"
        />

        <input
          value={veiculo.cpf_proprietario}
          maxLength={14}
          placeholder="CPF do proprietário"
          onChange={(e) =>
            atualizarVeiculo(
              index,
              "cpf_proprietario",
              formatarCPF(e.target.value)
            )
          }
          className="w-full rounded-2xl bg-slate-900 border border-slate-800 px-4 py-3 outline-none text-white mb-3"
        />

        <input
          value={veiculo.telefone_proprietario}
          maxLength={15}
          placeholder="Telefone do proprietário"
          onChange={(e) =>
            atualizarVeiculo(
              index,
              "telefone_proprietario",
              formatarTelefone(e.target.value)
            )
          }
          className="w-full rounded-2xl bg-slate-900 border border-slate-800 px-4 py-3 outline-none text-white mb-3"
        />

        <input
          value={veiculo.email_proprietario}
          placeholder="E-mail"
          onChange={(e) =>
            atualizarVeiculo(index, "email_proprietario", e.target.value)
          }
          className="w-full rounded-2xl bg-slate-900 border border-slate-800 px-4 py-3 outline-none text-white mb-3"
        />

        <div className="grid grid-cols-2 gap-3 mb-3">
          <input
            value={veiculo.cep_proprietario}
            maxLength={9}
            placeholder="CEP"
            onChange={(e) => {
              let valor = e.target.value.replace(/\D/g, "").slice(0, 8);
              valor = valor.replace(/^(\d{5})(\d)/, "$1-$2");
              atualizarVeiculo(index, "cep_proprietario", valor);
            }}
            className="rounded-2xl bg-slate-900 border border-slate-800 px-4 py-3 outline-none text-white"
          />

          <input
            value={veiculo.uf_proprietario}
            maxLength={2}
            placeholder="UF"
            onChange={(e) =>
              atualizarVeiculo(
                index,
                "uf_proprietario",
                e.target.value
                  .toUpperCase()
                  .replace(/[^A-Z]/g, "")
                  .slice(0, 2)
              )
            }
            className="rounded-2xl bg-slate-900 border border-slate-800 px-4 py-3 outline-none text-white uppercase"
          />
        </div>

        <input
          value={veiculo.cidade_proprietario}
          placeholder="Cidade"
          onChange={(e) =>
            atualizarVeiculo(index, "cidade_proprietario", e.target.value)
          }
          className="w-full rounded-2xl bg-slate-900 border border-slate-800 px-4 py-3 outline-none text-white mb-3"
        />

        <input
          value={veiculo.endereco_proprietario}
          placeholder="Endereço"
          onChange={(e) =>
            atualizarVeiculo(index, "endereco_proprietario", e.target.value)
          }
          className="w-full rounded-2xl bg-slate-900 border border-slate-800 px-4 py-3 outline-none text-white"
        />
      </div>

      <div className="pt-3 border-t border-slate-800">
        <p className="text-sm font-bold text-slate-300 mb-3">
          Situação
        </p>

        <select
          value={veiculo.situacao}
          onChange={(e) =>
            atualizarVeiculo(index, "situacao", e.target.value)
          }
          className="w-full rounded-2xl bg-slate-900 border border-slate-800 px-4 py-3 outline-none text-white mb-3"
        >
          <option value="">Situação do veículo</option>
          {SITUACOES_VEICULO.map((situacao) => (
            <option key={situacao} value={situacao}>
              {situacao}
            </option>
          ))}
        </select>

        <select
          value={veiculo.situacao_consulta || ""}
          onChange={(e) =>
            atualizarVeiculo(index, "situacao_consulta", e.target.value)
          }
          className="w-full rounded-2xl bg-slate-900 border border-slate-800 px-4 py-3 outline-none text-white mb-3"
        >
          <option value="">Situação da consulta</option>
          <option value="REGULAR">Regular</option>
          <option value="RESTRICAO_ADMINISTRATIVA">Restrição Administrativa</option>
          <option value="FURTO_ROUBO">Furto/Roubo</option>
          <option value="LICENCIAMENTO_ATRASADO">Licenciamento Atrasado</option>
          <option value="SUSPEITA_CLONAGEM">Suspeita de Clonagem</option>
        </select>

        <textarea
          value={veiculo.observacao}
          onChange={(e) =>
            atualizarVeiculo(index, "observacao", e.target.value)
          }
          placeholder="Observações do veículo"
          className="w-full min-h-24 rounded-2xl bg-slate-900 border border-slate-800 px-4 py-3 outline-none text-white resize-none"
        />
      </div>
    </div>
  ))}
</div>
)}

<button
  type="button"
  onClick={() => setMostrarObjetos(!mostrarObjetos)}
  className="w-full rounded-3xl bg-slate-900 border border-slate-800 p-4 flex justify-between"
>
  <span>Objetos</span>

  <span>
    {mostrarObjetos ? "▲" : "▼"}
  </span>
</button>

{mostrarObjetos && (
<div className="rounded-3xl bg-slate-900 border border-slate-800 p-4 space-y-4">
  <div className="flex items-center justify-between">
    <div>
      <h2 className="text-lg font-black">
        Objetos
      </h2>

      <p className="text-slate-400 text-sm">
        Objetos relacionados à ocorrência.
      </p>
    </div>

    <button
      type="button"
      onClick={adicionarObjeto}
      className="px-4 py-2 rounded-2xl bg-blue-600 font-bold"
    >
      +
    </button>
  </div>

  {itensOcorrencia.map((item, index) => (
    <div
      key={index}
      className="rounded-2xl bg-slate-950 border border-slate-800 p-4 space-y-3"
    >
      <div className="flex justify-between">
        <h3 className="font-bold text-blue-300">
          Item {index + 1}
        </h3>

        {itensOcorrencia.length > 1 && (
          <button
            type="button"
            onClick={() => removerObjeto(index)}
            className="text-red-400 text-sm font-bold"
          >
            Remover
          </button>
        )}
      </div>

      <select
        value={item.categoria}
        onChange={(e) => {
          atualizarItem(index, "categoria", e.target.value);
          atualizarItem(index, "subcategoria", "");
        }}
        className="w-full rounded-2xl bg-slate-900 border border-slate-800 px-4 py-3 text-white"
      >
        <option value="">Categoria</option>

        {CATEGORIAS_OBJETO.map((categoria) => (
          <option key={categoria} value={categoria}>
            {categoria}
          </option>
        ))}
      </select>

      <input
        value={item.descricao}
        onChange={(e) =>
          atualizarItem(index, "descricao", e.target.value)
        }
        placeholder="Descrição"
        className="w-full rounded-2xl bg-slate-900 border border-slate-800 px-4 py-3 text-white"
      />

      {item.categoria === "Celular" && (
  <>
    <select
      value={item.marca}
      onChange={(e) => {
        atualizarItem(index, "marca", e.target.value);
        atualizarItem(index, "modelo", "");
      }}
      className="w-full rounded-2xl bg-slate-900 border border-slate-800 px-4 py-3 text-white"
    >
      <option value="">Marca do celular</option>

      {Object.keys(MARCAS_MODELOS_CELULARES).map((marca) => (
        <option key={marca} value={marca}>
          {marca}
        </option>
      ))}
    </select>

    <select
      value={item.modelo}
      onChange={(e) =>
        atualizarItem(index, "modelo", e.target.value)
      }
      disabled={!item.marca}
      className="w-full rounded-2xl bg-slate-900 border border-slate-800 px-4 py-3 text-white disabled:opacity-50"
    >
      <option value="">Modelo do celular</option>

      {(MARCAS_MODELOS_CELULARES[item.marca] || []).map((modelo) => (
        <option key={modelo} value={modelo}>
          {modelo}
        </option>
      ))}
    </select>

    <select
      value={item.cor}
      onChange={(e) =>
        atualizarItem(index, "cor", e.target.value)
      }
      className="w-full rounded-2xl bg-slate-900 border border-slate-800 px-4 py-3 text-white"
    >
      <option value="">Cor</option>

      {CORES_CELULAR.map((cor) => (
        <option key={cor} value={cor}>
          {cor}
        </option>
      ))}
    </select>

    <input
      value={item.imei}
      maxLength={15}
      inputMode="numeric"
      onChange={(e) =>
        atualizarItem(
          index,
          "imei",
          e.target.value.replace(/\D/g, "").slice(0, 15)
        )
      }
      placeholder="IMEI"
      className="w-full rounded-2xl bg-slate-900 border border-slate-800 px-4 py-3 text-white"
    />
  </>
)}

{item.categoria === "Arma de fogo" && (
  <>
    <select
      value={item.subcategoria}
      onChange={(e) =>
        atualizarItem(index, "subcategoria", e.target.value)
      }
      className="w-full rounded-2xl bg-slate-900 border border-slate-800 px-4 py-3 text-white"
    >
      <option value="">Tipo da arma</option>

      {TIPOS_ARMA_FOGO.map((tipo) => (
        <option key={tipo} value={tipo}>
          {tipo}
        </option>
      ))}
    </select>

    <select
      value={item.marca}
      onChange={(e) => {
        atualizarItem(index, "marca", e.target.value);
        atualizarItem(index, "modelo", "");
      }}
      className="w-full rounded-2xl bg-slate-900 border border-slate-800 px-4 py-3 text-white"
    >
      <option value="">Marca da arma</option>

      {MARCAS_ARMA_FOGO.map((marca) => (
        <option key={marca} value={marca}>
          {marca}
        </option>
      ))}
    </select>

    <select
      value={item.modelo}
      onChange={(e) =>
        atualizarItem(index, "modelo", e.target.value)
      }
      disabled={!item.marca}
      className="w-full rounded-2xl bg-slate-900 border border-slate-800 px-4 py-3 text-white disabled:opacity-50"
    >
      <option value="">Modelo da arma</option>

      {(MARCAS_MODELOS_ARMA_FOGO[item.marca] || []).map((modelo) => (
        <option key={modelo} value={modelo}>
          {modelo}
        </option>
      ))}
    </select>

    <select
      value={item.calibre}
      onChange={(e) =>
        atualizarItem(index, "calibre", e.target.value)
      }
      className="w-full rounded-2xl bg-slate-900 border border-slate-800 px-4 py-3 text-white"
    >
      <option value="">Calibre</option>

      {CALIBRES_ARMA_FOGO.map((calibre) => (
        <option key={calibre} value={calibre}>
          {calibre}
        </option>
      ))}
    </select>

    <input
      value={item.numeracao}
      onChange={(e) =>
        atualizarItem(index, "numeracao", e.target.value.toUpperCase())
      }
      placeholder="Numeração"
      className="w-full rounded-2xl bg-slate-900 border border-slate-800 px-4 py-3 text-white uppercase"
    />
  </>
)}

{item.categoria === "Arma branca" && (
  <>
    <select
      value={item.subcategoria}
      onChange={(e) =>
        atualizarItem(index, "subcategoria", e.target.value)
      }
      className="w-full rounded-2xl bg-slate-900 border border-slate-800 px-4 py-3 text-white"
    >
      <option value="">Tipo da arma branca</option>

      {TIPOS_ARMA_BRANCA.map((tipo) => (
        <option key={tipo} value={tipo}>
          {tipo}
        </option>
      ))}
    </select>

    <input
      value={item.marca}
      onChange={(e) =>
        atualizarItem(index, "marca", e.target.value)
      }
      placeholder="Marca / identificação"
      className="w-full rounded-2xl bg-slate-900 border border-slate-800 px-4 py-3 text-white"
    />

    <input
      value={item.modelo}
      onChange={(e) =>
        atualizarItem(index, "modelo", e.target.value)
      }
      placeholder="Tamanho / medida"
      className="w-full rounded-2xl bg-slate-900 border border-slate-800 px-4 py-3 text-white"
    />
  </>
)}

{item.categoria === "Droga" && (
  <>
    <select
      value={item.subcategoria}
      onChange={(e) =>
        atualizarItem(index, "subcategoria", e.target.value)
      }
      className="w-full rounded-2xl bg-slate-900 border border-slate-800 px-4 py-3 text-white"
    >
      <option value="">Tipo da droga</option>

      {TIPOS_DROGA.map((tipo) => (
        <option key={tipo} value={tipo}>
          {tipo}
        </option>
      ))}
    </select>

    <div className="grid grid-cols-2 gap-3">
      <input
        value={item.peso}
        onChange={(e) =>
          atualizarItem(index, "peso", e.target.value)
        }
        placeholder="Peso"
        className="rounded-2xl bg-slate-900 border border-slate-800 px-4 py-3 text-white"
      />

      <select
        value={item.unidade_peso}
        onChange={(e) =>
          atualizarItem(index, "unidade_peso", e.target.value)
        }
        className="rounded-2xl bg-slate-900 border border-slate-800 px-4 py-3 text-white"
      >
        <option value="g">g</option>
        <option value="kg">kg</option>
        <option value="mg">mg</option>
        <option value="un">un</option>
      </select>
    </div>
  </>
)}

{item.categoria === "Documento" && (
  <>
    <select
      value={item.subcategoria}
      onChange={(e) =>
        atualizarItem(index, "subcategoria", e.target.value)
      }
      className="w-full rounded-2xl bg-slate-900 border border-slate-800 px-4 py-3 text-white"
    >
      <option value="">Tipo de documento</option>

      {TIPOS_DOCUMENTO.map((tipo) => (
        <option key={tipo} value={tipo}>
          {tipo}
        </option>
      ))}
    </select>

    <input
      value={item.numeracao}
      onChange={(e) =>
        atualizarItem(index, "numeracao", e.target.value)
      }
      placeholder="Número / identificação"
      className="w-full rounded-2xl bg-slate-900 border border-slate-800 px-4 py-3 text-white"
    />
  </>
)}

{item.categoria === "Ferramenta" && (
  <>
    <select
      value={item.subcategoria}
      onChange={(e) =>
        atualizarItem(index, "subcategoria", e.target.value)
      }
      className="w-full rounded-2xl bg-slate-900 border border-slate-800 px-4 py-3 text-white"
    >
      <option value="">Tipo da ferramenta</option>

      {TIPOS_FERRAMENTA.map((tipo) => (
        <option key={tipo} value={tipo}>
          {tipo}
        </option>
      ))}
    </select>

    <input
      value={item.marca}
      onChange={(e) =>
        atualizarItem(index, "marca", e.target.value)
      }
      placeholder="Marca"
      className="w-full rounded-2xl bg-slate-900 border border-slate-800 px-4 py-3 text-white"
    />
  </>
)}

{item.categoria === "Eletrônico" && (
  <>
    <select
      value={item.subcategoria}
      onChange={(e) =>
        atualizarItem(index, "subcategoria", e.target.value)
      }
      className="w-full rounded-2xl bg-slate-900 border border-slate-800 px-4 py-3 text-white"
    >
      <option value="">Tipo do eletrônico</option>

      {TIPOS_ELETRONICO.map((tipo) => (
        <option key={tipo} value={tipo}>
          {tipo}
        </option>
      ))}
    </select>

    <input
      value={item.marca}
      onChange={(e) =>
        atualizarItem(index, "marca", e.target.value)
      }
      placeholder="Marca"
      className="w-full rounded-2xl bg-slate-900 border border-slate-800 px-4 py-3 text-white"
    />

    <input
      value={item.modelo}
      onChange={(e) =>
        atualizarItem(index, "modelo", e.target.value)
      }
      placeholder="Modelo"
      className="w-full rounded-2xl bg-slate-900 border border-slate-800 px-4 py-3 text-white"
    />

    <input
      value={item.numeracao}
      onChange={(e) =>
        atualizarItem(index, "numeracao", e.target.value)
      }
      placeholder="Número de série"
      className="w-full rounded-2xl bg-slate-900 border border-slate-800 px-4 py-3 text-white"
    />
  </>
)}

      <div className="grid grid-cols-2 gap-3">
        <input
          value={item.quantidade}
          onChange={(e) =>
            atualizarItem(
              index,
              "quantidade",
              e.target.value
            )
          }
          placeholder="Quantidade"
          className="rounded-2xl bg-slate-900 border border-slate-800 px-4 py-3 text-white"
        />

        <input
          value={item.peso}
          onChange={(e) =>
            atualizarItem(index, "peso", e.target.value)
          }
          placeholder="Peso"
          className="rounded-2xl bg-slate-900 border border-slate-800 px-4 py-3 text-white"
        />
      </div>

      <select
        value={item.situacao}
        onChange={(e) =>
          atualizarItem(index, "situacao", e.target.value)
        }
        className="w-full rounded-2xl bg-slate-900 border border-slate-800 px-4 py-3 text-white"
      >
        <option value="">Situação</option>

        {SITUACOES_OBJETO_GERAL.map((situacao) => (
          <option key={situacao} value={situacao}>
            {situacao}
          </option>
        ))}
      </select>

      <textarea
        value={item.observacao}
        onChange={(e) =>
          atualizarItem(index, "observacao", e.target.value)
        }
        placeholder="Observações"
        className="w-full min-h-24 rounded-2xl bg-slate-900 border border-slate-800 px-4 py-3 text-white resize-none"
      />
    </div>
  ))}
</div>
)}

      <div className="rounded-3xl bg-slate-900 border border-slate-800 p-4">
        <label className="text-sm text-slate-400 mb-2 block">
          Descrição
        </label>

        <textarea
          value={descricao}
          onChange={(e) => setDescricao(e.target.value)}
          placeholder="Descreva resumidamente o fato..."
          className="w-full min-h-32 bg-transparent outline-none text-white resize-none"
        />
      </div>

      <button
        type="button"
        onClick={() => gerarNarrativaAutomatica()}
        className="w-full rounded-3xl bg-slate-900 border border-blue-500/40 p-4 font-bold text-blue-300"
      >
        Gerar Narrativa Automática
      </button>

      <button
        type="button"
        onClick={() => salvarOcorrencia()}
        disabled={salvando}
        className="w-full rounded-3xl bg-blue-600 p-5 font-black disabled:opacity-50"
      >
        {salvando ? "Salvando..." : "Salvar Ocorrência"}
      </button>
    </section>
  </main>
</div>
  </>
  </ProtecaoModulo>
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