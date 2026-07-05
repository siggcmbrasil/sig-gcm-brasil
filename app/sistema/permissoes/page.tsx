"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CheckCircle,
  Eye,
  LockKeyhole,
  Pencil,
  PlusCircle,
  Search,
  ShieldCheck,
  Trash2,
  UserCog,
} from "lucide-react";

import { supabase } from "@/lib/supabase";
import { registrarAuditoria } from "@/lib/auditoria";
import ProtecaoModulo from "@/components/ProtecaoModulo";
import SigCard from "@/components/sig/SigCard";
import SigPageHeader from "@/components/sig/SigPageHeader";

const perfis = [
  "ADMIN",
  "COMANDANTE",
  "DIRETOR",
  "CMT_GUARNICAO",
  "PLANTONISTA",
  "GUARDA",
  "CONSULTA",
];

const gruposModulos = [
  {
    titulo: "Centro de Comando",
    descricao: "Acesso principal, painel e visão operacional.",
    modulos: ["dashboard", "operacional", "mapa_operacional", "mancha_criminal"],
  },
  {
    titulo: "Ocorrências e Atendimento",
    descricao: "Ocorrências, chamados, abordagens e registros de campo.",
    modulos: [
      "ocorrencias",
      "ocorrencias_nova",
      "ocorrencias_editar",
      "ocorrencias_pdf",
      "chamados",
      "pessoas_abordadas",
      "veiculos_abordados",
    ],
  },
  {
    titulo: "Patrulhamento",
    descricao: "Rondas, rotas, visitas, apoios e operações.",
    modulos: [
      "patrulhamento",
      "rondas",
      "visitas",
      "apoios",
      "eventos",
      "operacoes",
      "locais",
    ],
  },
  {
    titulo: "Efetivo e Escalas",
    descricao: "Guardas, guarnições, escalas e gestão de equipe.",
    modulos: [
      "guardas",
      "dossie_guarda",
      "documentos",
      "escalas",
      "guarnicoes",
      "permutas",
      "ferias_licencas",
      "registro_ponto",
    ],
  },
  {
    titulo: "Frota, Equipamentos e Patrimônio",
    descricao: "Viaturas, armamentos, equipamentos e bens patrimoniais.",
    modulos: [
      "viaturas",
      "abastecimentos",
      "manutencoes",
      "checklist_viatura",
      "equipamentos",
      "armamentos",
      "patrimonio",
      "almoxarifado",
    ],
  },
  {
    titulo: "Documentos e Relatórios",
    descricao: "Ofícios, legislação, livro de parte e exportações.",
    modulos: [
      "oficios",
      "legislacao",
      "documentos_institucionais",
      "livro_parte",
      "relatorios",
      "relatorio_diario",
      "relatorio_semanal",
      "relatorio_quinzenal",
      "relatorio_mensal",
      "relatorio_bimestral",
      "relatorio_trimestral",
      "relatorio_semestral",
      "relatorio_anual",
      "relatorio_personalizado",
      "exportar_pdf",
      "exportar_excel",
    ],
  },
  {
    titulo: "SIGIA e Inteligência",
    descricao: "IA operacional, jurídica, legislação e créditos.",
    modulos: [
      "ia",
      "ia_operacional",
      "ia_juridica",
      "ia_legislacao",
      "sigia_documentos",
      "sigia_conhecimento",
      "sigia_creditos",
    ],
  },
  {
    titulo: "Comunicação",
    descricao: "Avisos, notificações, mensagens e feed interno.",
    modulos: [
      "avisos",
      "notificacoes",
      "feed_sig",
      "blog_operacional",
      "mensagens",
      "push",
    ],
  },
  {
    titulo: "Administração e Segurança",
    descricao: "Usuários, permissões, auditoria, backup e configurações.",
    modulos: [
      "usuarios",
      "municipios",
      "administracao",
      "configuracoes",
      "permissoes",
      "auditoria",
      "backup",
      "restauracao",
      "planos",
      "assinaturas",
      "financeiro",
    ],
  },
  {
    titulo: "Integrações e Futuro",
    descricao: "APIs, consultas globais, portal cidadão e módulos futuros.",
    modulos: [
      "api_publica",
      "integracoes",
      "consulta_global",
      "consulta_cpf",
      "consulta_placa",
      "importador_dados",
      "exportador_dados",
      "migracao_dados",
      "portal_cidadao",
      "ouvidoria",
      "corregedoria",
      "defesa_civil",
      "transito",
      "ambiental",
      "escolar",
      "projetos",
      "desenvolvedor",
    ],
  },
];

type CampoPermissao =
  | "pode_ver"
  | "pode_criar"
  | "pode_editar"
  | "pode_excluir";

type Permissao = {
  id: number;
  perfil: string;
  modulo: string;
  pode_ver: boolean;
  pode_criar: boolean;
  pode_editar: boolean;
  pode_excluir: boolean;
};

type UsuarioLogado = {
  id: string;
  perfil: string;
  municipio_id?: number;
};

const campos: {
  campo: CampoPermissao;
  titulo: string;
  icone: React.ReactNode;
  cor: string;
}[] = [
  {
    campo: "pode_ver",
    titulo: "Ver",
    icone: <Eye className="w-4 h-4" />,
    cor: "text-yellow-400",
  },
  {
    campo: "pode_criar",
    titulo: "Criar",
    icone: <PlusCircle className="w-4 h-4" />,
    cor: "text-emerald-400",
  },
  {
    campo: "pode_editar",
    titulo: "Editar",
    icone: <Pencil className="w-4 h-4" />,
    cor: "text-blue-400",
  },
  {
    campo: "pode_excluir",
    titulo: "Excluir",
    icone: <Trash2 className="w-4 h-4" />,
    cor: "text-red-400",
  },
];

function obterUsuarioLogado(): UsuarioLogado | null {
  try {
    const salvo = localStorage.getItem("usuarioLogado");

    if (!salvo) return null;

    const usuario = JSON.parse(salvo);

    if (!usuario?.id || !usuario?.perfil) {
      return null;
    }

    return {
      id: String(usuario.id),
      perfil: String(usuario.perfil),
      municipio_id: usuario.municipio_id
        ? Number(usuario.municipio_id)
        : undefined,
    };
  } catch {
    return null;
  }
}

function nomeModulo(modulo: string) {
  return modulo
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letra) => letra.toUpperCase());
}

export default function PermissoesPage() {
  const [perfilSelecionado, setPerfilSelecionado] = useState("GUARDA");
  const [permissoes, setPermissoes] = useState<Permissao[]>([]);
  const [carregando, setCarregando] = useState(false);
  const [busca, setBusca] = useState("");
  const [salvandoChave, setSalvandoChave] = useState("");

  const todosModulos = useMemo(
    () => gruposModulos.flatMap((grupo) => grupo.modulos),
    []
  );

  useEffect(() => {
    void carregarPermissoes();
  }, [perfilSelecionado]);

  async function carregarPermissoes() {
    setCarregando(true);

    const { data, error } = await supabase
      .from("permissoes_perfis")
      .select(
        "id, perfil, modulo, pode_ver, pode_criar, pode_editar, pode_excluir"
      )
      .eq("perfil", perfilSelecionado)
      .order("modulo");

    if (error) {
      console.error(error);
      alert("Erro ao carregar permissões.");
      setCarregando(false);
      return;
    }

    setPermissoes((data || []) as Permissao[]);
    setCarregando(false);
  }

  function valorPermissao(modulo: string, campo: CampoPermissao) {
    const item = permissoes.find((p) => p.modulo === modulo);
    return Boolean(item?.[campo]);
  }

  async function alterarPermissao(
    modulo: string,
    campo: CampoPermissao,
    valor: boolean
  ) {
    const usuario = obterUsuarioLogado();

    if (!usuario) {
      alert("Sessão inválida.");
      return;
    }

    if (!["DESENVOLVEDOR", "ADMIN", "COMANDANTE"].includes(usuario.perfil)) {
      alert("Você não possui permissão para alterar permissões.");
      return;
    }

    const chave = `${modulo}-${campo}`;
    setSalvandoChave(chave);

    const existente = permissoes.find((p) => p.modulo === modulo);

    if (existente) {
      const { error } = await supabase
        .from("permissoes_perfis")
        .update({
          [campo]: valor,
          atualizado_em: new Date().toISOString(),
        })
        .eq("id", existente.id)
        .eq("perfil", perfilSelecionado)
        .eq("modulo", modulo);

      if (error) {
        console.error(error);
        setSalvandoChave("");
        alert("Erro ao alterar permissão.");
        return;
      }
    } else {
      const { error } = await supabase.from("permissoes_perfis").insert({
        perfil: perfilSelecionado,
        modulo,
        pode_ver: campo === "pode_ver" ? valor : false,
        pode_criar: campo === "pode_criar" ? valor : false,
        pode_editar: campo === "pode_editar" ? valor : false,
        pode_excluir: campo === "pode_excluir" ? valor : false,
        criado_em: new Date().toISOString(),
        atualizado_em: new Date().toISOString(),
      });

      if (error) {
        console.error(error);
        setSalvandoChave("");
        alert("Erro ao criar permissão.");
        return;
      }
    }

    await registrarAuditoria({
      modulo: "Permissões",
      acao: "ALTERAR_PERMISSAO",
      descricao: `Alterou ${campo} do módulo ${modulo} para o perfil ${perfilSelecionado}.`,
      tabela: "permissoes_perfis",
      detalhes: {
        perfil_alterado: perfilSelecionado,
        modulo,
        campo,
        valor,
        usuario_id: usuario.id,
        municipio_id: usuario.municipio_id || null,
      },
    });

    await carregarPermissoes();
    setSalvandoChave("");
  }

  const gruposFiltrados = gruposModulos
    .map((grupo) => ({
      ...grupo,
      modulos: grupo.modulos.filter((modulo) =>
        `${grupo.titulo} ${grupo.descricao} ${modulo} ${nomeModulo(modulo)}`
          .toLowerCase()
          .includes(busca.trim().toLowerCase())
      ),
    }))
    .filter((grupo) => grupo.modulos.length > 0);

  const totalMarcadas = permissoes.reduce((total, item) => {
    return (
      total +
      Number(item.pode_ver) +
      Number(item.pode_criar) +
      Number(item.pode_editar) +
      Number(item.pode_excluir)
    );
  }, 0);

  const modulosLiberados = permissoes.filter((p) => p.pode_ver).length;

  return (
    <ProtecaoModulo modulo="permissoes">
      <div className="p-4 md:p-6 pb-24 space-y-6">
        <SigPageHeader
          titulo="Permissões de Acesso"
          subtitulo="Controle visual e seguro do que cada perfil pode acessar no SIG-GCM Brasil."
          icone={LockKeyhole}
        />

        <div className="grid xl:grid-cols-4 gap-4">
          <div className="xl:col-span-2">
            <SigCard>
              <div className="flex flex-col md:flex-row md:items-center gap-5">
                <div className="w-16 h-16 rounded-3xl bg-yellow-500/10 border border-yellow-500/30 flex items-center justify-center">
                  <UserCog className="w-9 h-9 text-yellow-400" />
                </div>

                <div>
                  <p className="text-xs uppercase tracking-[0.25em] text-yellow-400 font-black">
                    Central de Segurança
                  </p>

                  <h2 className="text-2xl md:text-3xl font-black text-white mt-1">
                    Matriz de Permissões
                  </h2>

                  <p className="text-slate-400 mt-2 leading-relaxed">
                    Escolha um perfil, pesquise o módulo e marque exatamente o
                    que ele pode visualizar, criar, editar ou excluir.
                  </p>
                </div>
              </div>
            </SigCard>
          </div>

          <ResumoCard
            titulo="Módulos com acesso"
            valor={modulosLiberados}
            detalhe={`${todosModulos.length} módulos mapeados`}
            cor="text-cyan-400"
          />

          <ResumoCard
            titulo="Permissões ativas"
            valor={totalMarcadas}
            detalhe="Ver, criar, editar e excluir"
            cor="text-emerald-400"
          />
        </div>

        <SigCard>
          <div className="grid lg:grid-cols-3 gap-4 items-end">
            <div>
              <label className="label">Perfil</label>
              <select
                className="input"
                value={perfilSelecionado}
                onChange={(e) => setPerfilSelecionado(e.target.value)}
              >
                {perfis.map((perfil) => (
                  <option key={perfil} value={perfil}>
                    {perfil}
                  </option>
                ))}
              </select>
            </div>

            <div className="lg:col-span-2">
              <label className="label">Pesquisar módulo</label>
              <div className="relative">
                <Search className="w-5 h-5 text-slate-500 absolute left-4 top-1/2 -translate-y-1/2" />
                <input
                  className="input pl-12"
                  placeholder="Digite ocorrência, patrulhamento, IA, relatórios..."
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                />
              </div>
            </div>
          </div>
        </SigCard>

        <div className="grid md:grid-cols-4 gap-4">
          {campos.map((item) => (
            <SigCard key={item.campo}>
              <div className="flex items-center gap-3">
                <div className={`${item.cor}`}>{item.icone}</div>
                <div>
                  <h3 className="text-lg font-black text-white">
                    {item.titulo}
                  </h3>
                  <p className="text-sm text-slate-400">
                    Permissão de {item.titulo.toLowerCase()}.
                  </p>
                </div>
              </div>
            </SigCard>
          ))}
        </div>

        {carregando ? (
          <SigCard>
            <div className="py-16 text-center text-slate-400">
              Carregando permissões...
            </div>
          </SigCard>
        ) : (
          <div className="space-y-5">
            {gruposFiltrados.map((grupo) => (
              <SigCard key={grupo.titulo}>
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-5">
                  <div>
                    <h3 className="text-xl font-black text-white">
                      {grupo.titulo}
                    </h3>
                    <p className="text-slate-400 text-sm mt-1">
                      {grupo.descricao}
                    </p>
                  </div>

                  <span className="rounded-full border border-slate-700 bg-slate-950/60 px-4 py-2 text-xs font-bold text-slate-300">
                    {grupo.modulos.length} módulo(s)
                  </span>
                </div>

                <div className="grid gap-3">
                  {grupo.modulos.map((modulo) => (
                    <div
                      key={modulo}
                      className="rounded-2xl border border-slate-800 bg-slate-950/50 p-4 hover:border-yellow-500/40 transition"
                    >
                      <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">
                        <div>
                          <p className="text-yellow-400 font-black">
                            {nomeModulo(modulo)}
                          </p>
                          <p className="text-xs text-slate-500 mt-1">
                            chave: {modulo}
                          </p>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                          {campos.map((item) => {
                            const chave = `${modulo}-${item.campo}`;
                            const checked = valorPermissao(
                              modulo,
                              item.campo
                            );

                            return (
                              <label
                                key={item.campo}
                                className="flex items-center justify-between gap-3 rounded-xl border border-slate-800 bg-slate-900/60 px-4 py-3 cursor-pointer"
                              >
                                <span className="flex items-center gap-2 text-sm font-bold text-slate-300">
                                  <span className={item.cor}>
                                    {item.icone}
                                  </span>
                                  {item.titulo}
                                </span>

                                <input
                                  type="checkbox"
                                  checked={checked}
                                  disabled={salvandoChave === chave}
                                  onChange={(e) =>
                                    alterarPermissao(
                                      modulo,
                                      item.campo,
                                      e.target.checked
                                    )
                                  }
                                  className="h-5 w-5 accent-yellow-500"
                                />
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </SigCard>
            ))}
          </div>
        )}

        <SigCard>
          <div className="flex items-start gap-4">
            <CheckCircle className="w-8 h-8 text-emerald-400 shrink-0" />

            <div>
              <h3 className="text-lg font-black text-white">
                Salvamento automático com auditoria
              </h3>

              <p className="text-slate-400 mt-1">
                Cada alteração é salva imediatamente e registrada na auditoria
                do SIG-GCM Brasil.
              </p>
            </div>
          </div>
        </SigCard>
      </div>
    </ProtecaoModulo>
  );
}

function ResumoCard({
  titulo,
  valor,
  detalhe,
  cor,
}: {
  titulo: string;
  valor: number;
  detalhe: string;
  cor: string;
}) {
  return (
    <SigCard>
      <ShieldCheck className={`w-8 h-8 mb-3 ${cor}`} />
      <p className="text-slate-400 text-sm">{titulo}</p>
      <h2 className={`text-4xl font-black mt-1 ${cor}`}>{valor}</h2>
      <p className="text-slate-500 text-xs mt-2">{detalhe}</p>
    </SigCard>
  );
}