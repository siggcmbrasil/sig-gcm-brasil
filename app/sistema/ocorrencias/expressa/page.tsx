"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";
import { useRouter } from "next/navigation";

import {
  AlertTriangle,
  ArrowLeft,
  Camera,
  CheckCircle2,
  Clock3,
  Crosshair,
  FileText,
  ImagePlus,
  Loader2,
  MapPin,
  Navigation,
  Save,
  ShieldAlert,
  Sparkles,
  Trash2,
  XCircle,
} from "lucide-react";

import { supabase } from "@/lib/supabase";
import ProtecaoModulo from "@/components/ProtecaoModulo";

type ContextoExpressa = {
  usuario_id: number;
  usuario_nome: string | null;
  perfil: string;
  municipio_id: number;
  pode_criar: boolean;
};

type RespostaContexto = {
  ok?: boolean;
  erro?: string;
  contexto?: ContextoExpressa;
};

type UploadPreparado = {
  indice: number;
  nome_original: string;
  path: string;
  token: string;
  public_url: string;
  content_type: string;
  tamanho: number;
};

type RespostaFotos = {
  ok?: boolean;
  erro?: string;
  bucket?: string;
  uploads?: UploadPreparado[];
};

type RespostaCriacao = {
  ok?: boolean;
  erro?: string;
  mensagem?: string;
  ocorrencia?: {
    id: number;
    protocolo: string;
    municipio_id: number;
  };
};

const TIPOS_RAPIDOS = [
  "Averiguação de denúncia",
  "Apoio ao SAMU",
  "Perturbação do sossego",
  "Violência doméstica",
  "Acidente de trânsito",
  "Pessoa em atitude suspeita",
  "Dano ao patrimônio",
  "Desentendimento",
  "Apoio a órgão público",
  "Outros",
];

const PRIORIDADES = [
  {
    valor: "BAIXA",
    titulo: "Baixa",
    texto: "Sem risco imediato",
    classe:
      "border-emerald-500/30 bg-emerald-500/10 text-emerald-200",
  },
  {
    valor: "MEDIA",
    titulo: "Média",
    texto: "Requer atendimento",
    classe:
      "border-amber-500/30 bg-amber-500/10 text-amber-200",
  },
  {
    valor: "ALTA",
    titulo: "Alta",
    texto: "Risco ou urgência",
    classe:
      "border-red-500/30 bg-red-500/10 text-red-200",
  },
] as const;

function formatarTamanho(bytes: number) {
  if (bytes < 1024 * 1024) {
    return `${Math.max(
      1,
      Math.round(bytes / 1024)
    )} KB`;
  }

  return `${(
    bytes /
    1024 /
    1024
  ).toFixed(1)} MB`;
}

export default function OcorrenciaExpressaPage() {
  const router = useRouter();

  const [contexto, setContexto] =
    useState<ContextoExpressa | null>(null);

  const [carregando, setCarregando] =
    useState(true);

  const [erroInicial, setErroInicial] =
    useState("");

  const [tipo, setTipo] = useState("");
  const [prioridade, setPrioridade] =
    useState<"BAIXA" | "MEDIA" | "ALTA">(
      "MEDIA"
    );

  const [local, setLocal] = useState("");
  const [bairro, setBairro] = useState("");
  const [numero, setNumero] = useState("");
  const [descricao, setDescricao] =
    useState("");

  const [fotos, setFotos] = useState<
    File[]
  >([]);

  const [latitude, setLatitude] =
    useState<number | null>(null);

  const [longitude, setLongitude] =
    useState<number | null>(null);

  const [precisao, setPrecisao] =
    useState<number | null>(null);

  const [capturandoGps, setCapturandoGps] =
    useState(false);

  const [salvando, setSalvando] =
    useState(false);

  const previews = useMemo(
    () =>
      fotos.map((foto) => ({
        arquivo: foto,
        url: URL.createObjectURL(foto),
      })),
    [fotos]
  );

  useEffect(() => {
    return () => {
      previews.forEach((item) =>
        URL.revokeObjectURL(item.url)
      );
    };
  }, [previews]);

  useEffect(() => {
    void carregarContexto();
  }, []);

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

  async function carregarContexto() {
    setCarregando(true);
    setErroInicial("");

    try {
      const accessToken =
        await obterAccessToken();

      const resposta = await fetch(
        "/api/ocorrencias/nova/dados",
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
        )) as RespostaContexto | null;

      if (resposta.status === 401) {
        localStorage.removeItem(
          "usuarioLogado"
        );
        router.replace("/login");
        return;
      }

      if (
  !resposta.ok ||
  !dados?.ok ||
  !dados.contexto
) {
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
      "Não foi possível preparar a ocorrência expressa."
  );
}

      setContexto(dados.contexto);
    } catch (error) {
      const mensagem =
        error instanceof Error
          ? error.message
          : "Erro ao preparar a ocorrência expressa.";

console.warn(
  "Falha ao preparar a ocorrência expressa:",
  mensagem
);

      setErroInicial(mensagem);
    } finally {
      setCarregando(false);
    }
  }

  function obterLocalizacao() {
    if (!navigator.geolocation) {
      alert(
        "Este dispositivo não oferece suporte à localização."
      );
      return;
    }

    setCapturandoGps(true);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLatitude(
          position.coords.latitude
        );
        setLongitude(
          position.coords.longitude
        );
        setPrecisao(
          position.coords.accuracy
        );
        setCapturandoGps(false);
      },
      (error) => {
        console.error(
          "Erro ao capturar GPS:",
          error
        );

        setCapturandoGps(false);

        const mensagem =
          error.code ===
          error.PERMISSION_DENIED
            ? "Permita o acesso à localização para registrar o GPS."
            : "Não foi possível obter a localização agora.";

        alert(mensagem);
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      }
    );
  }

  function limparGps() {
    setLatitude(null);
    setLongitude(null);
    setPrecisao(null);
  }

  function adicionarFotos(
    arquivos: FileList | null
  ) {
    if (!arquivos) {
      return;
    }

    const novas = Array.from(arquivos);

    const formatosPermitidos =
      new Set([
        "image/jpeg",
        "image/png",
        "image/webp",
      ]);

    for (const foto of novas) {
      if (
        !formatosPermitidos.has(
          foto.type
        )
      ) {
        alert(
          `O arquivo "${foto.name}" não é JPG, PNG ou WEBP.`
        );
        return;
      }

      if (
        foto.size >
        5 * 1024 * 1024
      ) {
        alert(
          `A imagem "${foto.name}" ultrapassa 5MB.`
        );
        return;
      }
    }

    if (
      fotos.length + novas.length >
      10
    ) {
      alert(
        "É possível anexar no máximo 10 imagens."
      );
      return;
    }

    setFotos((atuais) => [
      ...atuais,
      ...novas,
    ]);
  }

  function removerFoto(index: number) {
    setFotos((atuais) =>
      atuais.filter(
        (_, atual) => atual !== index
      )
    );
  }

  function gerarRelatoBase() {
    if (!tipo.trim() || !local.trim()) {
      alert(
        "Informe o tipo e o local antes de criar o relato-base."
      );
      return;
    }

    const endereco = [
      local.trim(),
      bairro.trim()
        ? `bairro ${bairro.trim()}`
        : "",
      numero.trim()
        ? `nº ${numero.trim()}`
        : "",
    ]
      .filter(Boolean)
      .join(", ");

    const inicio =
      `Durante patrulhamento, a equipe da Guarda Civil Municipal foi acionada para averiguar uma situação de ${tipo
        .trim()
        .toLocaleLowerCase(
          "pt-BR"
        )} em ${endereco}.`;

    const complemento =
      "No local, a guarnição realizou a averiguação inicial e adotou as providências necessárias conforme os fatos constatados.";

    const finalGps =
      latitude !== null &&
      longitude !== null
        ? " A localização do atendimento foi registrada por GPS."
        : "";

    setDescricao(
      `${inicio}\n\n${complemento}${finalGps}`
    );
  }

  async function prepararEEnviarFotos(
    accessToken: string
  ) {
    if (
      !contexto ||
      fotos.length === 0
    ) {
      return [] as string[];
    }

    const resposta = await fetch(
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
            contexto.municipio_id,
          arquivos: fotos.map(
            (foto) => ({
              nome: foto.name,
              tamanho: foto.size,
              tipo: foto.type,
            })
          ),
        }),
      }
    );

    const dados = (await resposta
      .json()
      .catch(
        () => null
      )) as RespostaFotos | null;

    if (resposta.status === 401) {
      localStorage.removeItem(
        "usuarioLogado"
      );
      router.replace("/login");
      return [];
    }

    if (
      !resposta.ok ||
      !dados?.ok ||
      !dados.bucket ||
      !Array.isArray(dados.uploads)
    ) {
      throw new Error(
        dados?.erro ||
          "Não foi possível preparar as fotos."
      );
    }

    if (
      dados.uploads.length !==
      fotos.length
    ) {
      throw new Error(
        "A preparação das fotos retornou uma quantidade inválida."
      );
    }

    const uploadsOrdenados = [
      ...dados.uploads,
    ].sort(
      (a, b) =>
        a.indice - b.indice
    );

    const caminhos: string[] = [];

    for (const upload of uploadsOrdenados) {
      const foto =
        fotos[upload.indice];

      if (!foto) {
        throw new Error(
          "Uma das fotos preparadas não foi encontrada."
        );
      }

      const { error } =
        await supabase.storage
          .from(dados.bucket)
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

      if (error) {
        console.error(
          "Erro ao enviar foto da ocorrência expressa:",
          {
            mensagem:
              error.message,
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

      caminhos.push(upload.path);
    }

    return caminhos;
  }

  async function salvarExpressa() {
    if (salvando) {
      return;
    }

    if (
      !tipo.trim() ||
      !local.trim() ||
      !descricao.trim()
    ) {
      alert(
        "Preencha tipo, local e descrição."
      );
      return;
    }

    if (!contexto) {
      alert(
        "Sessão ou município não identificado."
      );
      return;
    }

    setSalvando(true);

    try {
      const accessToken =
        await obterAccessToken();

      const fotosPaths =
        await prepararEEnviarFotos(
          accessToken
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
              contexto.municipio_id,
            tipo: tipo.trim(),
            status: "Aberta",
            prioridade,
            bairro:
              bairro.trim(),
            local:
              local.trim(),
            numero:
              numero.trim(),
            descricao:
              descricao.trim(),
            envolvidos: [],
            veiculos_envolvidos:
              [],
            armas_objetos: [],
            fotos_paths:
              fotosPaths,
            latitude,
            longitude,
          }),
        }
      );

      const dados = (await resposta
        .json()
        .catch(
          () => null
        )) as RespostaCriacao | null;

      if (resposta.status === 401) {
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
            "Não foi possível registrar a ocorrência expressa."
        );
      }

      alert(
        dados.mensagem ||
          "Ocorrência expressa registrada com sucesso."
      );

      router.push(
        `/sistema/ocorrencias/${dados.ocorrencia.id}`
      );
      router.refresh();
    } catch (error) {
      const mensagem =
        error instanceof Error
          ? error.message
          : "Erro ao registrar a ocorrência expressa.";

      console.error(
        "Erro ao salvar ocorrência expressa:",
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

  const formularioValido =
    Boolean(
      tipo.trim() &&
        local.trim() &&
        descricao.trim()
    );

  if (carregando) {
    return (
      <ProtecaoModulo modulo="ocorrencias">
        <div className="min-h-[70vh] grid place-items-center p-6">
          <div className="flex items-center gap-3 text-slate-300">
            <Loader2 className="h-5 w-5 animate-spin text-cyan-400" />
            Preparando ocorrência expressa...
          </div>
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
                : "Não foi possível abrir a ocorrência expressa"}
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
                  void carregarContexto()
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
      <main className="min-h-screen bg-slate-950 pb-32 text-white">
        <section className="border-b border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(14,165,233,0.17),transparent_38%),linear-gradient(180deg,#07111f_0%,#020617_100%)]">
          <div className="mx-auto max-w-7xl px-4 py-5 md:px-6 md:py-8">
            <button
              type="button"
              onClick={() =>
                router.back()
              }
              className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-slate-400 transition hover:text-white"
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar
            </button>

            <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
              <div className="flex items-start gap-4">
                <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl border border-cyan-400/30 bg-cyan-400/10 shadow-[0_0_35px_rgba(34,211,238,0.12)]">
                  <ShieldAlert className="h-7 w-7 text-cyan-300" />
                </div>

                <div>
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <span className="rounded-full border border-cyan-400/25 bg-cyan-400/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-cyan-300">
                      Registro rápido
                    </span>

                    <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-400">
                      {contexto?.usuario_nome ||
                        "Usuário autenticado"}
                    </span>
                  </div>

                  <h1 className="text-2xl font-black tracking-tight md:text-4xl">
                    Ocorrência Expressa
                  </h1>

                  <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400 md:text-base">
                    Registre os dados essenciais em campo com GPS, fotos e validação segura.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
                <CheckCircle2 className="h-4 w-4" />
                Município e permissão validados
              </div>
            </div>
          </div>
        </section>

        <div className="mx-auto grid max-w-7xl gap-5 px-4 py-5 md:px-6 lg:grid-cols-[minmax(0,1fr)_340px]">
          <div className="space-y-5">
            <section className="overflow-hidden rounded-3xl border border-white/10 bg-slate-900/70 shadow-2xl shadow-black/20 backdrop-blur">
              <div className="border-b border-white/10 px-5 py-4 md:px-6">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="h-5 w-5 text-cyan-300" />

                  <div>
                    <h2 className="font-bold">
                      Dados essenciais
                    </h2>

                    <p className="text-sm text-slate-500">
                      Preencha somente o necessário para iniciar o registro.
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid gap-5 p-5 md:grid-cols-2 md:p-6">
                <div className="md:col-span-2">
                  <label className="mb-2 block text-sm font-semibold text-slate-200">
                    Tipo da ocorrência *
                  </label>

                  <input
                    type="text"
                    list="tipos-expressos"
                    value={tipo}
                    onChange={(event) =>
                      setTipo(
                        event.target.value
                      )
                    }
                    placeholder="Ex.: Averiguação de denúncia"
                    className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3.5 text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-400/60 focus:ring-4 focus:ring-cyan-400/10"
                  />

                  <datalist id="tipos-expressos">
                    {TIPOS_RAPIDOS.map(
                      (item) => (
                        <option
                          key={item}
                          value={item}
                        />
                      )
                    )}
                  </datalist>

                  <div className="mt-3 flex flex-wrap gap-2">
                    {TIPOS_RAPIDOS.slice(
                      0,
                      5
                    ).map((item) => (
                      <button
                        key={item}
                        type="button"
                        onClick={() =>
                          setTipo(item)
                        }
                        className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-slate-300 transition hover:border-cyan-400/30 hover:bg-cyan-400/10 hover:text-cyan-200"
                      >
                        {item}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="md:col-span-2">
                  <label className="mb-2 block text-sm font-semibold text-slate-200">
                    Prioridade
                  </label>

                  <div className="grid gap-3 sm:grid-cols-3">
                    {PRIORIDADES.map(
                      (item) => {
                        const selecionado =
                          prioridade ===
                          item.valor;

                        return (
                          <button
                            key={
                              item.valor
                            }
                            type="button"
                            onClick={() =>
                              setPrioridade(
                                item.valor
                              )
                            }
                            className={`rounded-2xl border p-4 text-left transition ${
                              selecionado
                                ? `${item.classe} ring-2 ring-white/10`
                                : "border-white/10 bg-white/[0.03] text-slate-400 hover:bg-white/[0.06]"
                            }`}
                          >
                            <div className="font-bold">
                              {
                                item.titulo
                              }
                            </div>

                            <div className="mt-1 text-xs opacity-70">
                              {
                                item.texto
                              }
                            </div>
                          </button>
                        );
                      }
                    )}
                  </div>
                </div>

                <div className="md:col-span-2">
                  <label className="mb-2 block text-sm font-semibold text-slate-200">
                    Local *
                  </label>

                  <div className="relative">
                    <MapPin className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" />

                    <input
                      type="text"
                      value={local}
                      onChange={(event) =>
                        setLocal(
                          event.target.value
                        )
                      }
                      placeholder="Rua, avenida, praça, órgão ou ponto de referência"
                      className="w-full rounded-2xl border border-white/10 bg-slate-950/70 py-3.5 pl-12 pr-4 text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-400/60 focus:ring-4 focus:ring-cyan-400/10"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-200">
                    Bairro ou localidade
                  </label>

                  <input
                    type="text"
                    value={bairro}
                    onChange={(event) =>
                      setBairro(
                        event.target.value
                      )
                    }
                    placeholder="Ex.: Centro"
                    className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3.5 text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-400/60 focus:ring-4 focus:ring-cyan-400/10"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-200">
                    Número
                  </label>

                  <input
                    type="text"
                    value={numero}
                    onChange={(event) =>
                      setNumero(
                        event.target.value
                      )
                    }
                    placeholder="S/N"
                    className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3.5 text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-400/60 focus:ring-4 focus:ring-cyan-400/10"
                  />
                </div>
              </div>
            </section>

            <section className="overflow-hidden rounded-3xl border border-white/10 bg-slate-900/70 shadow-2xl shadow-black/20">
              <div className="flex flex-col gap-3 border-b border-white/10 px-5 py-4 md:flex-row md:items-center md:justify-between md:px-6">
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-cyan-300" />

                  <div>
                    <h2 className="font-bold">
                      Relato da equipe
                    </h2>

                    <p className="text-sm text-slate-500">
                      Escreva de forma objetiva o que ocorreu e quais medidas foram adotadas.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={gerarRelatoBase}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-violet-400/25 bg-violet-400/10 px-4 py-2.5 text-sm font-semibold text-violet-200 transition hover:bg-violet-400/20"
                >
                  <Sparkles className="h-4 w-4" />
                  Criar relato-base
                </button>
              </div>

              <div className="p-5 md:p-6">
                <textarea
                  value={descricao}
                  onChange={(event) =>
                    setDescricao(
                      event.target.value.slice(
                        0,
                        10000
                      )
                    )
                  }
                  rows={8}
                  placeholder="Descreva o acionamento, o que foi constatado no local e as providências adotadas..."
                  className="w-full resize-y rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-4 leading-7 text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-400/60 focus:ring-4 focus:ring-cyan-400/10"
                />

                <div className="mt-2 flex justify-between text-xs text-slate-500">
                  <span>
                    Evite opiniões pessoais e termos vagos.
                  </span>

                  <span>
                    {descricao.length}/10000
                  </span>
                </div>
              </div>
            </section>

            <section className="overflow-hidden rounded-3xl border border-white/10 bg-slate-900/70 shadow-2xl shadow-black/20">
              <div className="border-b border-white/10 px-5 py-4 md:px-6">
                <div className="flex items-center gap-3">
                  <Camera className="h-5 w-5 text-cyan-300" />

                  <div>
                    <h2 className="font-bold">
                      Registro fotográfico
                    </h2>

                    <p className="text-sm text-slate-500">
                      Até 10 imagens em JPG, PNG ou WEBP, com no máximo 5MB cada.
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-5 md:p-6">
                <label className="group flex cursor-pointer flex-col items-center justify-center rounded-3xl border border-dashed border-cyan-400/25 bg-cyan-400/[0.04] px-5 py-9 text-center transition hover:border-cyan-400/50 hover:bg-cyan-400/[0.08]">
                  <div className="grid h-14 w-14 place-items-center rounded-2xl bg-cyan-400/10">
                    <ImagePlus className="h-7 w-7 text-cyan-300" />
                  </div>

                  <div className="mt-4 font-bold">
                    Adicionar fotos
                  </div>

                  <div className="mt-1 text-sm text-slate-500">
                    No celular, escolha a câmera ou a galeria.
                  </div>

                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    multiple
                    capture="environment"
                    onChange={(event) => {
                      adicionarFotos(
                        event.target.files
                      );
                      event.currentTarget.value =
                        "";
                    }}
                    className="sr-only"
                  />
                </label>

                {previews.length > 0 && (
                  <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                    {previews.map(
                      (item, index) => (
                        <div
                          key={`${item.arquivo.name}-${index}`}
                          className="group relative overflow-hidden rounded-2xl border border-white/10 bg-slate-950"
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={item.url}
                            alt={`Foto ${index + 1}`}
                            className="aspect-square w-full object-cover"
                          />

                          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 to-transparent p-2 pt-8">
                            <div className="truncate text-xs font-medium text-white">
                              {
                                item
                                  .arquivo
                                  .name
                              }
                            </div>

                            <div className="text-[11px] text-slate-300">
                              {formatarTamanho(
                                item
                                  .arquivo
                                  .size
                              )}
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() =>
                              removerFoto(
                                index
                              )
                            }
                            aria-label={`Remover foto ${index + 1}`}
                            className="absolute right-2 top-2 grid h-9 w-9 place-items-center rounded-full bg-black/70 text-white opacity-100 backdrop-blur transition hover:bg-red-500 md:opacity-0 md:group-hover:opacity-100"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      )
                    )}
                  </div>
                )}
              </div>
            </section>
          </div>

          <aside className="space-y-5 lg:sticky lg:top-5 lg:self-start">
            <section className="rounded-3xl border border-white/10 bg-slate-900/80 p-5 shadow-2xl shadow-black/20">
              <div className="flex items-center gap-3">
                <Crosshair className="h-5 w-5 text-cyan-300" />

                <div>
                  <h2 className="font-bold">
                    Localização GPS
                  </h2>

                  <p className="text-sm text-slate-500">
                    Opcional, mas recomendada.
                  </p>
                </div>
              </div>

              {latitude !== null &&
              longitude !== null ? (
                <div className="mt-5">
                  <div className="rounded-2xl border border-emerald-500/25 bg-emerald-500/10 p-4">
                    <div className="flex items-center gap-2 font-semibold text-emerald-200">
                      <Navigation className="h-4 w-4" />
                      GPS registrado
                    </div>

                    <div className="mt-3 space-y-1 font-mono text-xs text-emerald-100/75">
                      <div>
                        Lat:{" "}
                        {latitude.toFixed(
                          6
                        )}
                      </div>

                      <div>
                        Long:{" "}
                        {longitude.toFixed(
                          6
                        )}
                      </div>

                      {precisao !==
                        null && (
                        <div>
                          Precisão: ±
                          {Math.round(
                            precisao
                          )}
                          m
                        </div>
                      )}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={limparGps}
                    className="mt-3 w-full rounded-xl border border-white/10 px-4 py-2.5 text-sm font-semibold text-slate-300 transition hover:bg-white/5"
                  >
                    Remover localização
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={obterLocalizacao}
                  disabled={
                    capturandoGps
                  }
                  className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-cyan-500 px-4 py-3.5 font-bold text-slate-950 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {capturandoGps ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Capturando...
                    </>
                  ) : (
                    <>
                      <MapPin className="h-5 w-5" />
                      Capturar GPS
                    </>
                  )}
                </button>
              )}
            </section>

            <section className="rounded-3xl border border-white/10 bg-slate-900/80 p-5 shadow-2xl shadow-black/20">
              <h2 className="font-bold">
                Resumo do registro
              </h2>

              <div className="mt-4 space-y-3 text-sm">
                <div className="flex items-center justify-between gap-4 border-b border-white/10 pb-3">
                  <span className="text-slate-500">
                    Tipo
                  </span>

                  <span className="max-w-[190px] truncate text-right font-medium">
                    {tipo || "Não informado"}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-4 border-b border-white/10 pb-3">
                  <span className="text-slate-500">
                    Prioridade
                  </span>

                  <span className="font-semibold">
                    {
                      PRIORIDADES.find(
                        (item) =>
                          item.valor ===
                          prioridade
                      )?.titulo
                    }
                  </span>
                </div>

                <div className="flex items-center justify-between gap-4 border-b border-white/10 pb-3">
                  <span className="text-slate-500">
                    Fotos
                  </span>

                  <span className="font-semibold">
                    {fotos.length}/10
                  </span>
                </div>

                <div className="flex items-center justify-between gap-4">
                  <span className="text-slate-500">
                    GPS
                  </span>

                  <span
                    className={
                      latitude !==
                        null &&
                      longitude !==
                        null
                        ? "font-semibold text-emerald-300"
                        : "font-semibold text-slate-400"
                    }
                  >
                    {latitude !==
                      null &&
                    longitude !== null
                      ? "Registrado"
                      : "Não capturado"}
                  </span>
                </div>
              </div>
            </section>

            <section className="rounded-3xl border border-amber-500/20 bg-amber-500/[0.07] p-5">
              <div className="flex items-start gap-3">
                <Clock3 className="mt-0.5 h-5 w-5 shrink-0 text-amber-300" />

                <p className="text-sm leading-6 text-amber-100/80">
                  A ocorrência expressa cria o registro inicial. Os demais envolvidos, veículos e objetos podem ser acrescentados depois na edição completa.
                </p>
              </div>
            </section>
          </aside>
        </div>

        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-slate-950/90 p-3 backdrop-blur-xl">
          <div className="mx-auto flex max-w-7xl items-center gap-3">
            <button
              type="button"
              onClick={() =>
                router.back()
              }
              disabled={salvando}
              className="hidden rounded-2xl border border-white/10 px-5 py-3.5 font-semibold text-slate-300 transition hover:bg-white/5 disabled:opacity-50 sm:inline-flex"
            >
              Cancelar
            </button>

            <div className="hidden flex-1 text-sm text-slate-500 md:block">
              {formularioValido
                ? "Dados essenciais preenchidos."
                : "Preencha tipo, local e relato para salvar."}
            </div>

            <button
              type="button"
              onClick={() =>
                void salvarExpressa()
              }
              disabled={
                salvando ||
                !formularioValido
              }
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl bg-cyan-500 px-6 py-3.5 font-black text-slate-950 shadow-lg shadow-cyan-500/20 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:bg-slate-800 disabled:text-slate-500 md:flex-none"
            >
              {salvando ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Registrando...
                </>
              ) : (
                <>
                  <Save className="h-5 w-5" />
                  Registrar ocorrência
                </>
              )}
            </button>
          </div>
        </div>
      </main>
    </ProtecaoModulo>
  );
}