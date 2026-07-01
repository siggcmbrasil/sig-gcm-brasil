"use client";

type Props = {
  emoji?: string;
  titulo: string;
  descricao?: string;
};

export default function SigEmpty({
  emoji = "📂",
  titulo,
  descricao,
}: Props) {
  return (
    <div className="painel-premium p-10 text-center">
      <p className="text-6xl mb-4">
        {emoji}
      </p>

      <h2 className="text-xl font-black text-white">
        {titulo}
      </h2>

      {descricao && (
        <p className="text-slate-400 mt-2">
          {descricao}
        </p>
      )}
    </div>
  );
}