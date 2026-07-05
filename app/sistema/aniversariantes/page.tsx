"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { Cake, CalendarDays, Users } from "lucide-react";

import { supabase } from "@/lib/supabase";
import { registrarAuditoria } from "@/lib/auditoria";
import SigPageHeader from "@/components/sig/SigPageHeader";
import SigCard from "@/components/sig/SigCard";

type UsuarioLogado = {
  id: number;
  municipio_id: number;
  perfil?: string;
  nome?: string;
};

type Guarda = {
  id: number;
  nome: string;
  data_nascimento: string | null;
  foto_url: string | null;
  status: string | null;
};

export default function AniversariantesPage() {
  const [usuario, setUsuario] = useState<UsuarioLogado | null>(null);
  const [guardas, setGuardas] = useState<Guarda[]>([]);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    async function iniciar() {
      const dados = JSON.parse(
        localStorage.getItem("usuarioLogado") || "{}"
      );

      if (!dados?.id || !dados?.municipio_id) {
        alert("Sessão inválida. Faça login novamente.");
        setCarregando(false);
        return;
      }

      setUsuario(dados);

      await registrarAuditoria({
        modulo: "Aniversariantes",
        acao: "ACESSO",
        descricao: "Acessou a tela de aniversariantes.",
        tabela: "guardas",
        detalhes: {
          usuario_id: dados.id,
          municipio_id: dados.municipio_id,
        },
      });

      await carregar(dados);
    }

    iniciar();
  }, []);

  async function carregar(usuarioAtual: UsuarioLogado) {
    if (!usuarioAtual?.municipio_id) {
      alert("Município não identificado.");
      setCarregando(false);
      return;
    }

    setCarregando(true);

    const { data, error } = await supabase
      .from("guardas")
      .select("id, nome, data_nascimento, foto_url, status")
      .eq("municipio_id", usuarioAtual.municipio_id)
      .order("nome")
      .range(0, 299);

    setCarregando(false);

    if (error) {
      await registrarAuditoria({
        modulo: "Aniversariantes",
        acao: "ERRO",
        descricao: "Erro ao carregar aniversariantes.",
        tabela: "guardas",
        detalhes: {
          erro: error.message,
          municipio_id: usuarioAtual.municipio_id,
        },
      });

      alert("Erro ao carregar aniversariantes.");
      return;
    }

    setGuardas(data || []);
  }

  const hoje = new Date();
  const dia = String(hoje.getDate()).padStart(2, "0");
  const mes = String(hoje.getMonth() + 1).padStart(2, "0");

  const aniversariantesHoje = useMemo(() => {
    return guardas.filter((guarda) => {
      if (!guarda.data_nascimento) return false;

      const [, mesNascimento, diaNascimento] =
        guarda.data_nascimento.split("-");

      return diaNascimento === dia && mesNascimento === mes;
    });
  }, [guardas, dia, mes]);

  const totalComNascimento = guardas.filter(
    (guarda) => guarda.data_nascimento
  ).length;

  return (
    <div className="p-4 md:p-6 pb-24 space-y-6">
      <SigPageHeader
        titulo="Aniversariantes"
        subtitulo="Guardas aniversariantes do dia no município logado."
        icone={Cake}
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <SigCard>
          <Cake className="w-8 h-8 text-yellow-400 mb-3" />
          <p className="text-slate-400 text-sm">Aniversariantes hoje</p>
          <h2 className="text-4xl font-black text-white mt-2">
            {carregando ? "..." : aniversariantesHoje.length}
          </h2>
        </SigCard>

        <SigCard>
          <Users className="w-8 h-8 text-cyan-400 mb-3" />
          <p className="text-slate-400 text-sm">Guardas carregados</p>
          <h2 className="text-4xl font-black text-white mt-2">
            {carregando ? "..." : guardas.length}
          </h2>
        </SigCard>

        <SigCard>
          <CalendarDays className="w-8 h-8 text-emerald-400 mb-3" />
          <p className="text-slate-400 text-sm">Com data cadastrada</p>
          <h2 className="text-4xl font-black text-white mt-2">
            {carregando ? "..." : totalComNascimento}
          </h2>
        </SigCard>
      </div>

      <SigCard>
        <h2 className="text-xl font-black text-white">
          Aniversariantes de hoje
        </h2>

        <p className="text-sm text-slate-400 mt-1">
          Data de referência: {dia}/{mes}
        </p>

        {carregando ? (
          <p className="text-slate-400 mt-6">Carregando aniversariantes...</p>
        ) : aniversariantesHoje.length === 0 ? (
          <div className="text-center py-14">
            <Cake className="w-16 h-16 mx-auto text-yellow-400 mb-4" />

            <h3 className="text-2xl font-black text-white">
              Nenhum aniversariante hoje
            </h3>

            <p className="text-slate-400 mt-2">
              Quando houver aniversário de guarda cadastrado, aparecerá aqui.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-6">
            {aniversariantesHoje.map((guarda) => (
              <div
                key={guarda.id}
                className="rounded-3xl border border-slate-800 bg-slate-950/70 p-6 text-center shadow-xl"
              >
                <div className="w-24 h-24 rounded-full mx-auto overflow-hidden border border-yellow-500 bg-slate-800 flex items-center justify-center text-5xl">
                  {guarda.foto_url ? (
                    <Image
                      src={guarda.foto_url}
                      alt={guarda.nome}
                      width={96}
                      height={96}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    "👮"
                  )}
                </div>

                <h2 className="text-xl font-black text-white mt-4">
                  {guarda.nome}
                </h2>

                <p className="text-yellow-400 font-bold mt-2">
                  🎉 Feliz aniversário!
                </p>

                {guarda.status && (
                  <p className="text-xs text-slate-500 mt-2">
                    Status: {guarda.status}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </SigCard>
    </div>
  );
}