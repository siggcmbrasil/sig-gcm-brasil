"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { ArrowLeft, ClipboardCheck, Loader2 } from "lucide-react";

import ProtecaoModulo from "@/components/ProtecaoModulo";
import {
  formatarDataSeguranca,
  formatarSeguranca,
  lerUsuarioSeguranca,
} from "@/lib/segurancaTrabalho";
import { supabase } from "@/lib/supabase";

type Inspecao = {
  id: number;
  titulo: string;
  local_setor: string | null;
  data_inspecao: string;
  responsavel_nome: string | null;
  total_nao_conformidades: number;
  status: string;
};

export default function InspecoesSegurancaPage() {
  const [usuario] = useState(() => lerUsuarioSeguranca());
  const [itens, setItens] = useState<Inspecao[]>([]);
  const [carregando, setCarregando] = useState(true);

  const carregar = useCallback(async () => {
    if (!usuario?.municipio_id) return;
    const { data } = await supabase
      .from("seguranca_trabalho_inspecoes")
      .select(
        "id,titulo,local_setor,data_inspecao,responsavel_nome,total_nao_conformidades,status"
      )
      .eq("municipio_id", usuario.municipio_id)
      .order("data_inspecao", { ascending: false });

    setItens((data as Inspecao[] | null) || []);
    setCarregando(false);
  }, [usuario]);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  return (
    <ProtecaoModulo modulo="guardas">
      <main className="min-h-screen bg-[#020b1c] px-4 py-5 text-white lg:px-7">
        <div className="mx-auto max-w-6xl space-y-5">
          <header className="rounded-3xl border border-cyan-400/15 bg-[#061326] p-5 lg:p-7">
            <Link
              href="/sistema/seguranca-trabalho"
              className="inline-flex items-center gap-2 text-sm font-black text-cyan-300"
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar
            </Link>
            <h1 className="mt-4 text-2xl font-black">Inspeções de segurança</h1>
          </header>

          {carregando ? (
            <div className="flex min-h-[300px] items-center justify-center">
              <Loader2 className="h-9 w-9 animate-spin text-cyan-300" />
            </div>
          ) : (
            <section className="grid gap-4 md:grid-cols-2">
              {itens.map((item) => (
                <article
                  key={item.id}
                  className="rounded-2xl border border-slate-800 bg-[#061326] p-5"
                >
                  <ClipboardCheck className="h-6 w-6 text-cyan-300" />
                  <h2 className="mt-4 text-lg font-black">{item.titulo}</h2>
                  <p className="mt-1 text-sm text-slate-500">
                    {item.local_setor || "Local não informado"}
                  </p>
                  <div className="mt-4 grid grid-cols-3 gap-3">
                    <Info titulo="Data" valor={formatarDataSeguranca(item.data_inspecao)} />
                    <Info titulo="Pendências" valor={String(item.total_nao_conformidades)} />
                    <Info titulo="Status" valor={formatarSeguranca(item.status)} />
                  </div>
                </article>
              ))}
              {!itens.length ? (
                <div className="rounded-2xl border border-slate-800 bg-[#061326] p-12 text-center text-slate-500 md:col-span-2">
                  Nenhuma inspeção cadastrada.
                </div>
              ) : null}
            </section>
          )}
        </div>
      </main>
    </ProtecaoModulo>
  );
}

function Info({ titulo, valor }: { titulo: string; valor: string }) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-950/30 p-3 text-center">
      <p className="text-[10px] font-black uppercase text-slate-500">{titulo}</p>
      <p className="mt-1 font-black">{valor}</p>
    </div>
  );
}
