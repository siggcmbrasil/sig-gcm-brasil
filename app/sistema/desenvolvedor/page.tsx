"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import ProtecaoModulo from "@/components/ProtecaoModulo";
import {
  AlertTriangle,
  Building2,
  CheckCircle,
  Database,
  FileArchive,
  FileInput,
  FileOutput,
  FolderKanban,
  Globe,
  Link2,
  RefreshCcw,
  ShieldCheck,
  Users,
} from "lucide-react";

type ResumoSistema = {
  municipios: number;
  municipiosAtivos: number;
  usuarios: number;
  guardas: number;
  ocorrencias: number;
};

export default function PainelDesenvolvedor() {
  const [resumo, setResumo] = useState<ResumoSistema>({
    municipios: 0,
    municipiosAtivos: 0,
    usuarios: 0,
    guardas: 0,
    ocorrencias: 0,
  });

  const [carregando, setCarregando] = useState(true);

  async function carregarResumo() {
    try {
      setCarregando(true);

      const [
        { count: totalMunicipios },
        { count: municipiosAtivos },
        { count: totalUsuarios },
        { count: totalGuardas },
        { count: totalOcorrencias },
      ] = await Promise.all([
        supabase
          .from("municipios")
          .select("*", { count: "exact", head: true }),

        supabase
          .from("municipios")
          .select("*", { count: "exact", head: true })
          .eq("ativo", true),

        supabase
          .from("usuarios")
          .select("*", { count: "exact", head: true }),

        supabase
          .from("guardas")
          .select("*", { count: "exact", head: true }),

        supabase
          .from("ocorrencias")
          .select("*", { count: "exact", head: true }),
      ]);

      setResumo({
  municipios: totalMunicipios ?? 0,
  municipiosAtivos: municipiosAtivos ?? 0,
  usuarios: totalUsuarios ?? 0,
  guardas: totalGuardas ?? 0,
  ocorrencias: totalOcorrencias ?? 0,
});
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregarResumo();
  }, []);

  return (
    <ProtecaoModulo modulo="desenvolvedor">
      <div className="p-4 md:p-6 pb-24 space-y-8">
        <header className="border-b border-slate-800 pb-5">
          <h1 className="text-3xl md:text-5xl font-black text-white">
            Painel do Desenvolvedor
          </h1>

          <p className="text-slate-400 mt-2">
            Central mestre do SIG-GCM Brasil.
          </p>
        </header>

        {carregando ? (
          <div className="card">
            <p className="text-slate-400">
              Carregando painel mestre...
            </p>
          </div>
        ) : (
          <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4">
            <CardDev
              titulo="Municípios"
              valor={resumo.municipios}
              Icone={Building2}
            />

            <CardDev
              titulo="Municípios Ativos"
              valor={resumo.municipiosAtivos}
              Icone={CheckCircle}
            />

            <CardDev
              titulo="Usuários"
              valor={resumo.usuarios}
              Icone={Users}
            />

            <CardDev
              titulo="Guardas"
              valor={resumo.guardas}
              Icone={ShieldCheck}
            />

            <CardDev
              titulo="Ocorrências"
              valor={resumo.ocorrencias}
              Icone={AlertTriangle}
            />
          </section>
        )}

        <section>
          <h2 className="text-3xl font-black text-white mb-6">
            Ferramentas do Desenvolvedor
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
            <CardFerramenta
              titulo="Auditoria"
              href="/sistema/auditoria"
              Icone={FileArchive}
            />

            <CardFerramenta
              titulo="Backup"
              href="/sistema/backup"
              Icone={Database}
            />

            <CardFerramenta
              titulo="API Pública"
              href="/sistema/api-publica"
              Icone={Globe}
            />

            <CardFerramenta
              titulo="Integrações"
              href="/sistema/integracoes"
              Icone={Link2}
            />

            <CardFerramenta
              titulo="Importador"
              href="/sistema/importador-dados"
              Icone={FileInput}
            />

            <CardFerramenta
              titulo="Exportador"
              href="/sistema/exportador-dados"
              Icone={FileOutput}
            />

            <CardFerramenta
              titulo="Migração"
              href="/sistema/migracao-dados"
              Icone={RefreshCcw}
            />

            <CardFerramenta
              titulo="Projetos"
              href="/sistema/projetos"
              Icone={FolderKanban}
            />
          </div>
        </section>
      </div>
    </ProtecaoModulo>
  );
}

function CardDev({
  titulo,
  valor,
  Icone,
}: {
  titulo: string;
  valor: number;
  Icone: any;
}) {
  return (
    <div className="card">
      <Icone className="w-10 h-10 text-yellow-400 mb-4" />

      <p className="text-sm text-slate-400">
        {titulo}
      </p>

      <h2 className="text-4xl font-black text-white mt-2">
        {valor}
      </h2>
    </div>
  );
}

function CardFerramenta({
  titulo,
  href,
  Icone,
}: {
  titulo: string;
  href: string;
  Icone: any;
}) {
  return (
    <Link
      href={href}
      className="
        card block
        hover:border-yellow-500/40
        hover:-translate-y-1
        transition-all duration-300
      "
    >
      <Icone className="w-10 h-10 text-yellow-400 mb-4" />

      <h3 className="text-xl font-black text-white">
        {titulo}
      </h3>

      <p className="text-sm text-slate-400 mt-2">
        Acessar ferramenta do desenvolvedor.
      </p>
    </Link>
  );
}