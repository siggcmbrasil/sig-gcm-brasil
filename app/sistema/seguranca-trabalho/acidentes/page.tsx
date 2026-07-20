"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { ArrowLeft, Loader2, TriangleAlert } from "lucide-react";

import ProtecaoModulo from "@/components/ProtecaoModulo";
import {
  formatarDataSeguranca,
  formatarSeguranca,
  lerUsuarioSeguranca,
} from "@/lib/segurancaTrabalho";
import { supabase } from "@/lib/supabase";

type Acidente = {
  id: number;
  guarda_nome: string | null;
  tipo_evento: string;
  data_evento: string;
  local_evento: string | null;
  houve_afastamento: boolean;
  cat_emitida: boolean;
  gravidade: string;
  status_investigacao: string;
};

export default function AcidentesTrabalhoPage() {
  const [usuario] = useState(() => lerUsuarioSeguranca());
  const [itens, setItens] = useState<Acidente[]>([]);
  const [carregando, setCarregando] = useState(true);

  const carregar = useCallback(async () => {
    if (!usuario?.municipio_id) return;
    const { data } = await supabase
      .from("seguranca_trabalho_acidentes")
      .select(
        "id,guarda_nome,tipo_evento,data_evento,local_evento,houve_afastamento,cat_emitida,gravidade,status_investigacao"
      )
      .eq("municipio_id", usuario.municipio_id)
      .order("data_evento", { ascending: false });

    setItens((data as Acidente[] | null) || []);
    setCarregando(false);
  }, [usuario]);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  return (
    <ProtecaoModulo modulo="guardas">
      <main className="min-h-screen bg-[#020b1c] px-4 py-5 text-white lg:px-7">
        <div className="mx-auto max-w-6xl space-y-5">
          <header className="rounded-3xl border border-rose-400/15 bg-[#061326] p-5 lg:p-7">
            <Link
              href="/sistema/seguranca-trabalho"
              className="inline-flex items-center gap-2 text-sm font-black text-cyan-300"
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar
            </Link>
            <h1 className="mt-4 text-2xl font-black">Acidentes, incidentes e CAT</h1>
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
                  <TriangleAlert className="h-6 w-6 text-rose-300" />
                  <h2 className="mt-4 text-lg font-black">
                    {item.guarda_nome || "Servidor não informado"}
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    {formatarSeguranca(item.tipo_evento)} •{" "}
                    {formatarDataSeguranca(item.data_evento)}
                  </p>
                  <div className="mt-4 grid grid-cols-2 gap-3">
                    <Info titulo="Gravidade" valor={formatarSeguranca(item.gravidade)} />
                    <Info titulo="CAT" valor={item.cat_emitida ? "Emitida" : "Pendente"} />
                    <Info titulo="Afastamento" valor={item.houve_afastamento ? "Sim" : "Não"} />
                    <Info
                      titulo="Investigação"
                      valor={formatarSeguranca(item.status_investigacao)}
                    />
                  </div>
                </article>
              ))}
              {!itens.length ? (
                <div className="rounded-2xl border border-slate-800 bg-[#061326] p-12 text-center text-slate-500 md:col-span-2">
                  Nenhum acidente ou incidente registrado.
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
