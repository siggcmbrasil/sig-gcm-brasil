"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { BadgeCheck, FileWarning, LoaderCircle, ShieldCheck } from "lucide-react";

type Resultado = {
  valido: boolean;
  protocolo?: string | null;
  tipo?: string | null;
  status?: string | null;
  data?: string | null;
  hora?: string | null;
  emitido_em?: string;
  municipio?: string;
  estado?: string | null;
  corporacao?: string;
};

export default function ValidarOcorrenciaPage() {
  const params = useParams();
  const token = typeof params.token === "string" ? params.token : params.token?.[0];
  const [resultado, setResultado] = useState<Resultado | null>(null);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    if (!token) return;
    fetch(`/api/validar-ocorrencia/${encodeURIComponent(token)}`, { cache: "no-store" })
      .then(async (res) => ({ ok: res.ok, body: await res.json() }))
      .then(({ ok, body }) => setResultado(ok ? body : { valido: false }))
      .catch(() => setResultado({ valido: false }))
      .finally(() => setCarregando(false));
  }, [token]);

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-10 text-white">
      <section className="mx-auto max-w-2xl rounded-3xl border border-cyan-400/20 bg-slate-900 p-6 shadow-2xl md:p-10">
        <div className="mb-8 flex items-center gap-3">
          <ShieldCheck className="h-10 w-10 text-cyan-400" />
          <div><p className="text-sm font-semibold tracking-widest text-cyan-300">SIG-GCM BRASIL</p><h1 className="text-2xl font-bold">Validação de documento</h1></div>
        </div>
        {carregando ? (
          <div className="flex items-center gap-3 text-slate-300"><LoaderCircle className="animate-spin" /> Validando documento...</div>
        ) : resultado?.valido ? (
          <div>
            <div className="mb-6 flex items-center gap-3 rounded-2xl border border-emerald-400/30 bg-emerald-500/10 p-4 text-emerald-200"><BadgeCheck className="h-7 w-7" /><strong>Documento autêntico e ativo</strong></div>
            <dl className="grid gap-4 sm:grid-cols-2">
              <Info titulo="Protocolo" valor={resultado.protocolo} />
              <Info titulo="Situação" valor={resultado.status} />
              <Info titulo="Natureza" valor={resultado.tipo} />
              <Info titulo="Data e hora" valor={[resultado.data, resultado.hora].filter(Boolean).join(" às ")} />
              <Info titulo="Município" valor={[resultado.municipio, resultado.estado].filter(Boolean).join(" - ")} />
              <Info titulo="Corporação" valor={resultado.corporacao} />
            </dl>
            <p className="mt-8 text-xs leading-5 text-slate-400">Esta consulta confirma somente a autenticidade do relatório. Dados pessoais, narrativa, envolvidos e anexos permanecem protegidos.</p>
          </div>
        ) : (
          <div className="flex items-center gap-3 rounded-2xl border border-red-400/30 bg-red-500/10 p-4 text-red-200"><FileWarning className="h-7 w-7" /><strong>Documento inválido, inexistente ou revogado.</strong></div>
        )}
      </section>
    </main>
  );
}

function Info({ titulo, valor }: { titulo: string; valor?: string | null }) {
  return <div className="rounded-2xl border border-white/10 bg-white/5 p-4"><dt className="text-xs uppercase tracking-wider text-slate-400">{titulo}</dt><dd className="mt-1 font-semibold">{valor || "Não informado"}</dd></div>;
}
