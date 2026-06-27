import type { ReactNode } from "react";

export default function SecaoOcorrencia({
  titulo,
  descricao,
  children,
}: {
  icone?: string;
  titulo: string;
  descricao?: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-xl border border-[#C9A227] bg-[#0D1B34] p-6">
      <h2 className="text-base font-semibold text-white">
        {titulo}
      </h2>

      {descricao && (
        <p className="mb-4 mt-1 text-xs text-slate-400">
          {descricao}
        </p>
      )}

      {children}
    </section>
  );
}