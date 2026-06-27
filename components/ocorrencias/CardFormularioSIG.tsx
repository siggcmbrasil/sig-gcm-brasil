import type { ReactNode } from "react";

export default function CardFormularioSIG({
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
    <section className="border-t border-[#d6a93b] pt-5">
      <h2 className="text-lg font-bold text-[#c8951d]">
        {titulo}
      </h2>

      {descricao && (
        <p className="mt-1 mb-5 text-sm text-slate-500">
          {descricao}
        </p>
      )}

      <div className="space-y-5">
        {children}
      </div>
    </section>
  );
}