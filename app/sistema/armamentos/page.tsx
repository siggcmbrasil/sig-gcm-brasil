"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  Archive,
  BadgeCheck,
  Building2,
  ClipboardList,
  FileCheck,
  FileText,
  Package,
  PackageCheck,
  Shield,
  ShieldCheck,
  Wrench,
  AlertTriangle,
} from "lucide-react";

import { supabase } from "@/lib/supabase";

export default function ArmamentosPage() {
  const [armamentos, setArmamentos] = useState<any[]>([]);

  const usuario =
    typeof window !== "undefined"
      ? JSON.parse(localStorage.getItem("usuarioLogado") || "{}")
      : {};

  useEffect(() => {
    carregar();
  }, []);

  async function carregar() {
    if (!usuario?.municipio_id) return;

    const { data, error } = await supabase
      .from("armamentos")
      .select("*")
      .eq("municipio_id", usuario.municipio_id)
      .order("id", { ascending: false });

    if (error) {
      alert(error.message);
      return;
    }

    setArmamentos(data || []);
  }

  const resumo = useMemo(() => {
    return {
      total: armamentos.length,
      disponiveis: armamentos.filter((a) => a.status === "DISPONIVEL").length,
      cautelados: armamentos.filter((a) => a.status === "CAUTELADA").length,
      manutencao: armamentos.filter((a) => a.status === "MANUTENCAO").length,
      baixados: armamentos.filter((a) => a.status === "BAIXADA").length,
      extraviados: armamentos.filter((a) => a.status === "EXTRAVIADA").length,
    };
  }, [armamentos]);

  return (
    <div className="p-4 md:p-6 pb-24 space-y-6">
      <div className="painel-premium p-6">
        <p className="text-sm text-blue-400 font-bold uppercase">
          Controle Administrativo Restrito
        </p>

        <h1 className="text-2xl md:text-3xl font-black text-white mt-1">
          Central de Armamentos
        </h1>

        <p className="text-slate-400 mt-2">
          Armaria, cadastro, cautelas, inventário, manutenção, munições,
          documentos e relatórios.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
        <ResumoCard titulo="Armamentos" valor={resumo.total} icone={ShieldCheck} cor="azul" />
        <ResumoCard titulo="Disponíveis" valor={resumo.disponiveis} icone={BadgeCheck} cor="verde" />
        <ResumoCard titulo="Cautelados" valor={resumo.cautelados} icone={PackageCheck} cor="amarelo" />
        <ResumoCard titulo="Manutenção" valor={resumo.manutencao} icone={Wrench} cor="amarelo" />
        <ResumoCard titulo="Baixados" valor={resumo.baixados} icone={Archive} cor="vermelho" />
        <ResumoCard titulo="Extraviados" valor={resumo.extraviados} icone={AlertTriangle} cor="vermelho" />
      </div>

      <div className="painel-premium p-6">
        <h2 className="text-xl font-black text-white">
          Módulos da Central
        </h2>
        <p className="text-slate-400 text-sm mt-1">
          Acesse cada setor da gestão de armamentos da corporação.
        </p>
      </div>

      <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-4">
        <Atalho href="/sistema/armamentos/cadastro" icone={Shield} titulo="Cadastro" texto="Cadastro e gerenciamento de armamentos." cor="azul" />
        <Atalho href="/sistema/armamentos/armaria" icone={Building2} titulo="Armaria" texto="Visão geral da armaria." cor="verde" />
        <Atalho href="/sistema/armamentos/cautelas" icone={ClipboardList} titulo="Cautelas" texto="Retirada, devolução e responsabilidade." cor="amarelo" />
        <Atalho href="/sistema/armamentos/inventario" icone={Archive} titulo="Inventário" texto="Conferência administrativa." cor="azul" />
        <Atalho href="/sistema/armamentos/manutencao" icone={Wrench} titulo="Manutenção" texto="Manutenção, baixa e avaliação." cor="amarelo" />
        <Atalho href="/sistema/armamentos/municoes" icone={Package} titulo="Munições" texto="Controle administrativo de munições." cor="vermelho" />
        <Atalho href="/sistema/armamentos/documentos" icone={FileCheck} titulo="Documentos" texto="Documentos, registros e anexos." cor="verde" />
        <Atalho href="/sistema/armamentos/relatorios" icone={FileText} titulo="Relatórios" texto="Relatórios da armaria." cor="azul" />
      </div>
    </div>
  );
}

function ResumoCard({ titulo, valor, icone: Icone, cor }: any) {
  const cores: any = {
    azul: "text-blue-400 border-blue-900/50 bg-blue-950/30",
    verde: "text-green-400 border-green-900/50 bg-green-950/30",
    amarelo: "text-yellow-400 border-yellow-900/50 bg-yellow-950/30",
    vermelho: "text-red-400 border-red-900/50 bg-red-950/30",
  };

  return (
    <div className="painel-premium p-5">
      <div className="flex items-center gap-3">
        <div className={`rounded-2xl border p-3 ${cores[cor]}`}>
          <Icone size={22} />
        </div>

        <div>
          <p className="text-slate-400 text-sm">{titulo}</p>
          <h2 className="text-2xl md:text-3xl font-black text-white">
            {valor}
          </h2>
        </div>
      </div>
    </div>
  );
}

function Atalho({ href, icone: Icone, titulo, texto, cor }: any) {
  const cores: any = {
    azul: "text-blue-400 border-blue-900/50 bg-blue-950/30",
    verde: "text-green-400 border-green-900/50 bg-green-950/30",
    amarelo: "text-yellow-400 border-yellow-900/50 bg-yellow-950/30",
    vermelho: "text-red-400 border-red-900/50 bg-red-950/30",
  };

  return (
    <Link href={href} className="painel-premium p-5 hover:scale-[1.02] transition block">
      <div className={`w-12 h-12 rounded-2xl border flex items-center justify-center mb-4 ${cores[cor]}`}>
        <Icone size={26} />
      </div>

      <h2 className="text-xl font-black text-white">{titulo}</h2>

      <p className="text-slate-400 text-sm mt-2 leading-relaxed">
        {texto}
      </p>

      <p className="text-xs text-blue-400 font-bold mt-4">
        Acessar módulo →
      </p>
    </Link>
  );
}