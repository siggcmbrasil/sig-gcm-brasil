"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowLeft, Loader2, RefreshCw } from "lucide-react";

import ProtecaoModulo from "@/components/ProtecaoModulo";
import { registrarAuditoria } from "@/lib/auditoria";
import {
  lerUsuarioTreinamento,
  podeGerenciarTreinamentos,
} from "@/lib/treinamentosObrigatorios";
import { supabase } from "@/lib/supabase";

type Regra = {
  id: number;
  curso_id: number;
  curso_nome: string;
  cargo: string | null;
  funcao: string | null;
  setor: string | null;
  periodicidade_meses: number;
};

type Guarda = {
  id: number;
  nome: string;
  matricula: string | null;
  cargo?: string | null;
  funcao?: string | null;
  setor?: string | null;
};

type Certificacao = {
  curso_id: number;
  guarda_id: number;
  certificado_emitido_em: string | null;
  validade_certificacao: string | null;
};

export default function MatrizTreinamentosPage() {
  const [usuario] = useState(() => lerUsuarioTreinamento());
  const [processando, setProcessando] = useState(false);
  const [mensagem, setMensagem] = useState("");
  const [erro, setErro] = useState("");

  const podeGerenciar = usuario
    ? podeGerenciarTreinamentos(usuario.perfil)
    : false;

  async function atualizarMatriz() {
    if (!usuario?.municipio_id || !podeGerenciar) return;

    setProcessando(true);
    setErro("");
    setMensagem("");

    const [regrasResp, guardasResp, certificadosResp] = await Promise.all([
      supabase
        .from("treinamentos_obrigatorios_regras")
        .select("*")
        .eq("municipio_id", usuario.municipio_id)
        .eq("ativo", true),
      supabase
        .from("guardas")
        .select("id,nome,matricula,cargo,funcao,setor")
        .eq("municipio_id", usuario.municipio_id),
      supabase
        .from("capacitacoes_matriculas")
        .select("curso_id,guarda_id,certificado_emitido_em,validade_certificacao")
        .eq("municipio_id", usuario.municipio_id)
        .not("certificado_emitido_em", "is", null),
    ]);

    const primeiroErro =
      regrasResp.error || guardasResp.error || certificadosResp.error;

    if (primeiroErro) {
      setErro(primeiroErro.message);
      setProcessando(false);
      return;
    }

    const regras = (regrasResp.data as Regra[] | null) || [];
    const guardas = (guardasResp.data as Guarda[] | null) || [];
    const certificados = (certificadosResp.data as Certificacao[] | null) || [];

    const registros = regras.flatMap((regra) =>
      guardas
        .filter((guarda) => {
          const cargoOk =
            !regra.cargo ||
            String(guarda.cargo || "").toLowerCase() === regra.cargo.toLowerCase();
          const funcaoOk =
            !regra.funcao ||
            String(guarda.funcao || "").toLowerCase() === regra.funcao.toLowerCase();
          const setorOk =
            !regra.setor ||
            String(guarda.setor || "").toLowerCase() === regra.setor.toLowerCase();

          return cargoOk && funcaoOk && setorOk;
        })
        .map((guarda) => {
          const certificacao = certificados
            .filter(
              (item) =>
                item.curso_id === regra.curso_id &&
                item.guarda_id === guarda.id
            )
            .sort((a, b) =>
              String(b.certificado_emitido_em || "").localeCompare(
                String(a.certificado_emitido_em || "")
              )
            )[0];

          return {
            municipio_id: usuario.municipio_id,
            regra_id: regra.id,
            guarda_id: guarda.id,
            guarda_nome: guarda.nome,
            matricula: guarda.matricula,
            ultima_conclusao: certificacao?.certificado_emitido_em
              ? certificacao.certificado_emitido_em.slice(0, 10)
              : null,
            validade: certificacao?.validade_certificacao || null,
            atualizado_em: new Date().toISOString(),
          };
        })
    );

    if (registros.length) {
      const { error } = await supabase
        .from("treinamentos_obrigatorios_situacoes")
        .upsert(registros, {
          onConflict: "municipio_id,regra_id,guarda_id",
        });

      if (error) {
        setErro(error.message);
        setProcessando(false);
        return;
      }
    }

    await registrarAuditoria({
      modulo: "RH",
      acao: "ATUALIZAR_MATRIZ",
      tabela: "treinamentos_obrigatorios_situacoes",
      descricao: "Matriz de treinamentos obrigatórios atualizada.",
      detalhes: {
        regras: regras.length,
        guardas: guardas.length,
        registros: registros.length,
      },
    });

    setMensagem(`${registros.length} situações foram atualizadas.`);
    setProcessando(false);
  }

  useEffect(() => {
    if (podeGerenciar) void atualizarMatriz();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [podeGerenciar]);

  return (
    <ProtecaoModulo modulo="guardas">
      <main className="min-h-screen bg-[#020b1c] px-4 py-5 text-white lg:px-7">
        <div className="mx-auto max-w-4xl space-y-5">
          <header className="rounded-3xl border border-cyan-400/15 bg-[#061326] p-5 lg:p-7">
            <Link
              href="/sistema/treinamentos-obrigatorios"
              className="inline-flex items-center gap-2 text-sm font-black text-cyan-300"
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar
            </Link>
            <h1 className="mt-4 text-2xl font-black">
              Atualização da matriz obrigatória
            </h1>
            <p className="mt-2 text-sm text-slate-400">
              Cruza as exigências com os guardas e certificados já emitidos.
            </p>
          </header>

          {erro ? (
            <div className="rounded-2xl border border-rose-400/25 bg-rose-400/10 p-4 text-sm text-rose-200">
              {erro}
            </div>
          ) : null}

          {mensagem ? (
            <div className="rounded-2xl border border-emerald-400/25 bg-emerald-400/10 p-4 text-sm text-emerald-200">
              {mensagem}
            </div>
          ) : null}

          <section className="rounded-2xl border border-slate-800 bg-[#061326] p-8 text-center">
            {processando ? (
              <>
                <Loader2 className="mx-auto h-12 w-12 animate-spin text-cyan-300" />
                <p className="mt-4 font-black">Atualizando matriz...</p>
              </>
            ) : (
              <>
                <RefreshCw className="mx-auto h-12 w-12 text-cyan-300" />
                <p className="mt-4 font-black">Matriz processada</p>
                <button
                  onClick={() => void atualizarMatriz()}
                  className="mt-5 inline-flex items-center gap-2 rounded-xl bg-cyan-300 px-5 py-3 font-black text-slate-950"
                >
                  <RefreshCw className="h-4 w-4" />
                  Processar novamente
                </button>
              </>
            )}
          </section>
        </div>
      </main>
    </ProtecaoModulo>
  );
}
