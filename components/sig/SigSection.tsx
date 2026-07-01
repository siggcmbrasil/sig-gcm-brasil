"use client";

type Props = {
  titulo: string;
  descricao?: string;
  children: React.ReactNode;
};

export default function SigSection({
  titulo,
  descricao,
  children,
}: Props) {
  return (
    <div className="painel-premium p-6">
      <h2 className="text-xl font-black text-white">
        {titulo}
      </h2>

      {descricao && (
        <p className="text-slate-400 mt-1 mb-5">
          {descricao}
        </p>
      )}

      {children}
    </div>
  );
}