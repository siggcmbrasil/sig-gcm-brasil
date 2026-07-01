"use client";

type Props = {
  titulo: string;
  valor: string;
};

export default function SigInfo({
  titulo,
  valor,
}: Props) {
  return (
    <div className="rounded-xl bg-slate-900/70 p-3">
      <p className="text-slate-500 text-xs">
        {titulo}
      </p>

      <p className="text-slate-200 font-bold text-sm">
        {valor}
      </p>
    </div>
  );
}