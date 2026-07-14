"use client";

import Link from "next/link";
import {
  Archive,
  Boxes,
  ClipboardList,
  Package,
  Radio,
  RefreshCw,
  ShieldCheck,
  Warehouse,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import ProtecaoModulo from "@/components/ProtecaoModulo";
import SigActionCard from "@/components/sig/SigActionCard";
import SigButton from "@/components/sig/SigButton";
import SigCard from "@/components/sig/SigCard";
import SigPageHeader from "@/components/sig/SigPageHeader";
import SigStatCard from "@/components/sig/SigStatCard";

import {
  lerMunicipioContextoLocal,
  obterMunicipioIdEfetivo,
} from "@/lib/contextoMunicipio";
import { supabase } from "@/lib/supabase";

type UsuarioLocal = {
  perfil?: string;
  municipio_id?: number;
};

type TotaisPatrimonio = {
  equipamentos: number;
  patrimonio: number;
  almoxarifado: number;
  inventario: number;
};

const cards = [
  {
    titulo: "Equipamentos",
    icone: Radio,
    href: "/sistema/equipamentos",
    descricao:
      "Controle de rádios, coletes, cones, lanternas e materiais operacionais.",
    detalhe: "Gerenciar equipamentos",
  },
  {
    titulo: "Patrimônio",
    icone: Package,
    href: "/sistema/patrimonio",
    descricao:
      "Gestão dos bens patrimoniais e bens tombados da instituição.",
    detalhe: "Abrir patrimônio",
  },
  {
    titulo: "Almoxarifado",
    icone: Warehouse,
    href: "/sistema/almoxarifado",
    descricao:
      "Controle de entradas, saídas e estoque de materiais.",
    detalhe: "Abrir almoxarifado",
  },
  {
    titulo: "Inventário",
    icone: ClipboardList,
    href: "/sistema/inventario",
    descricao:
      "Inventário físico, conferência e situação dos bens da Guarda.",
    detalhe: "Abrir inventário",
  },
];

function obterUsuarioLocal(): UsuarioLocal | null {
  if (typeof window === "undefined") return null;

  try {
    return JSON.parse(
      localStorage.getItem("usuarioLogado") || "null"
    ) as UsuarioLocal | null;
  } catch {
    return null;
  }
}

export default function CentralPatrimonioPage() {
  const [totais, setTotais] = useState<TotaisPatrimonio>({
    equipamentos: 0,
    patrimonio: 0,
    almoxarifado: 0,
    inventario: 0,
  });

  const [municipioNome, setMunicipioNome] =
    useState("Município");
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  async function carregar() {
    setCarregando(true);
    setErro("");

    try {
      const usuario = obterUsuarioLocal();

      if (!usuario?.perfil) {
        throw new Error("Usuário não identificado.");
      }

      const contexto = lerMunicipioContextoLocal();

      const municipioId = obterMunicipioIdEfetivo({
        perfil: usuario.perfil,
        municipioIdUsuario: usuario.municipio_id,
      });

      if (!municipioId) {
        throw new Error("Município não identificado.");
      }

      const [
        municipioResposta,
        equipamentosResposta,
        patrimonioResposta,
        almoxarifadoResposta,
        inventarioResposta,
      ] = await Promise.all([
        supabase
          .from("municipios")
          .select("nome")
          .eq("id", municipioId)
          .maybeSingle(),

        supabase
          .from("equipamentos")
          .select("id", {
            count: "exact",
            head: true,
          })
          .eq("municipio_id", municipioId),

        supabase
          .from("patrimonio")
          .select("id", {
            count: "exact",
            head: true,
          })
          .eq("municipio_id", municipioId),

        supabase
          .from("almoxarifado")
          .select("id", {
            count: "exact",
            head: true,
          })
          .eq("municipio_id", municipioId),

        supabase
          .from("inventario")
          .select("id", {
            count: "exact",
            head: true,
          })
          .eq("municipio_id", municipioId),
      ]);

      if (municipioResposta.error) {
        console.warn(
          "Falha parcial em municipios:",
          municipioResposta.error.message
        );
      }

      const falhas = [
        {
          origem: "equipamentos",
          erro: equipamentosResposta.error,
        },
        {
          origem: "patrimonio",
          erro: patrimonioResposta.error,
        },
        {
          origem: "almoxarifado",
          erro: almoxarifadoResposta.error,
        },
        {
          origem: "inventario",
          erro: inventarioResposta.error,
        },
      ].filter((item) => Boolean(item.erro));

      for (const falha of falhas) {
        console.warn(
          `Falha parcial em ${falha.origem}:`,
          falha.erro?.message
        );
      }

      setMunicipioNome(
        String(
          municipioResposta.data?.nome ||
            contexto?.nome ||
            "Município"
        )
      );

      setTotais({
        equipamentos: equipamentosResposta.count || 0,
        patrimonio: patrimonioResposta.count || 0,
        almoxarifado: almoxarifadoResposta.count || 0,
        inventario: inventarioResposta.count || 0,
      });
    } catch (error) {
      console.error(
        "Erro ao carregar Central de Patrimônio:",
        error
      );

      setErro(
        error instanceof Error
          ? error.message
          : "Não foi possível carregar a Central de Patrimônio."
      );
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    void carregar();
  }, []);

  const totalControlado = useMemo(
    () =>
      totais.equipamentos +
      totais.patrimonio +
      totais.almoxarifado +
      totais.inventario,
    [totais]
  );

  return (
    <ProtecaoModulo modulo="patrimonio">
      <main className="sig-page">
        <div className="sig-page-content">
          <SigPageHeader
            titulo="Central de Patrimônio"
            subtitulo={`${municipioNome} • Equipamentos, bens, almoxarifado, inventário e controle patrimonial.`}
            detalhe="Gestão patrimonial"
            icone={Boxes}
            acoes={
              <>
                <Link href="/sistema/patrimonio">
                  <SigButton
                    type="primary"
                    icon={Package}
                    size="sm"
                  >
                    Abrir patrimônio
                  </SigButton>
                </Link>

                <SigButton
                  type="cyan"
                  icon={RefreshCw}
                  size="sm"
                  loading={carregando}
                  onClick={() => void carregar()}
                >
                  Atualizar
                </SigButton>
              </>
            }
          />

          {erro ? <div className="sig-error">{erro}</div> : null}

          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
            <SigStatCard
              titulo="Equipamentos"
              valor={totais.equipamentos}
              subtitulo="Itens operacionais"
              icone={Radio}
              destaque="cyan"
            />

            <SigStatCard
              titulo="Bens patrimoniais"
              valor={totais.patrimonio}
              subtitulo="Registros cadastrados"
              icone={Package}
              destaque="green"
            />

            <SigStatCard
              titulo="Almoxarifado"
              valor={totais.almoxarifado}
              subtitulo="Itens em estoque"
              icone={Warehouse}
              destaque="blue"
            />

            <SigStatCard
              titulo="Inventário"
              valor={totais.inventario}
              subtitulo="Conferências registradas"
              icone={ClipboardList}
              destaque="amber"
            />

            <SigStatCard
              titulo="Base controlada"
              valor={totalControlado}
              subtitulo="Registros integrados"
              icone={Archive}
              destaque="slate"
            />
          </section>

          {carregando ? (
            <div className="sig-loading">
              <div>
                <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-slate-700 border-t-cyan-400" />

                <p className="mt-4 text-slate-400">
                  Carregando dados patrimoniais...
                </p>
              </div>
            </div>
          ) : (
            <>
              <section className="grid gap-4 xl:grid-cols-12">
                <SigCard className="xl:col-span-7">
                  <CabecalhoSecao
                    titulo="Cobertura patrimonial"
                    subtitulo="Áreas integradas à gestão de bens"
                    icone={Boxes}
                  />

                  <div className="mt-5 grid gap-3 md:grid-cols-2">
                    <Painel
                      titulo="Equipamentos operacionais"
                      descricao="Rádios, coletes, lanternas, cones e materiais de uso diário."
                    />

                    <Painel
                      titulo="Bens tombados"
                      descricao="Cadastro patrimonial, situação, localização e responsável."
                    />

                    <Painel
                      titulo="Almoxarifado"
                      descricao="Entrada, saída, saldo, movimentação e controle de estoque."
                    />

                    <Painel
                      titulo="Inventário físico"
                      descricao="Conferência, divergências e histórico dos bens da instituição."
                    />
                  </div>
                </SigCard>

                <SigCard className="xl:col-span-5" destaque>
                  <CabecalhoSecao
                    titulo="Controle e segurança"
                    subtitulo="Regras essenciais do patrimônio"
                    icone={ShieldCheck}
                  />

                  <div className="mt-5 space-y-3">
                    <Regra texto="Todo bem deve permanecer vinculado ao município ativo." />
                    <Regra texto="Movimentações devem registrar origem, destino e responsável." />
                    <Regra texto="Baixas e transferências devem manter histórico e auditoria." />
                    <Regra texto="Inventários devem registrar divergências e conferência." />
                  </div>
                </SigCard>
              </section>

              <section>
                <div className="mb-4">
                  <h2 className="text-2xl font-black text-white">
                    Ferramentas de Patrimônio
                  </h2>

                  <p className="mt-1 text-sm text-slate-400">
                    Acesse os recursos de controle patrimonial e estoque.
                  </p>
                </div>

                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                  {cards.map((card) => (
                    <SigActionCard
                      key={card.href}
                      titulo={card.titulo}
                      descricao={card.descricao}
                      href={card.href}
                      icone={card.icone}
                      detalhe={card.detalhe}
                    />
                  ))}
                </div>
              </section>
            </>
          )}
        </div>
      </main>
    </ProtecaoModulo>
  );
}

function CabecalhoSecao({
  titulo,
  subtitulo,
  icone: Icone,
}: {
  titulo: string;
  subtitulo: string;
  icone: typeof Boxes;
}) {
  return (
    <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-cyan-400/20 bg-cyan-400/[0.07] text-cyan-300">
        <Icone className="h-5 w-5" />
      </div>

      <div>
        <h2 className="font-black text-white">
          {titulo}
        </h2>

        <p className="mt-0.5 text-xs text-slate-500">
          {subtitulo}
        </p>
      </div>
    </div>
  );
}

function Painel({
  titulo,
  descricao,
}: {
  titulo: string;
  descricao: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-950/45 p-4">
      <h3 className="font-black text-white">
        {titulo}
      </h3>

      <p className="mt-2 text-sm leading-6 text-slate-400">
        {descricao}
      </p>
    </div>
  );
}

function Regra({ texto }: { texto: string }) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-cyan-400/15 bg-cyan-400/[0.04] p-3">
      <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-cyan-300" />
      <span className="text-sm text-slate-300">
        {texto}
      </span>
    </div>
  );
}
