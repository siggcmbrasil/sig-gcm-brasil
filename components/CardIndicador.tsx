import type { ReactNode } from "react";

export default function CardIndicador({
  titulo,
  valor,
  icone,
  cor = "blue",
  descricao = "Ocorrências",
}: {
  titulo: string;
  valor: number | string;
  icone: ReactNode;
  cor?: "blue" | "green" | "yellow" | "purple" | "red";
  descricao?: string;
}) {
  const cores = {
    blue: "border-blue-700/70 bg-blue-950/30 text-blue-400",
    green: "border-green-700/70 bg-green-950/30 text-green-400",
    yellow: "border-yellow-700/70 bg-yellow-950/30 text-yellow-400",
    purple: "border-purple-700/70 bg-purple-950/30 text-purple-400",
    red: "border-red-700/70 bg-red-950/30 text-red-400",
  };

  return (
    <div
      className={`${cores[cor]} rounded-2xl border p-5 min-h-32 shadow-lg flex items-center gap-5 hover:scale-[1.02] transition-all`}
    >
      <div className="w-16 h-16 rounded-2xl bg-slate-900/70 flex items-center justify-center shrink-0">
        {icone}
      </div>

      <div>
        <p className="text-slate-300 text-sm font-bold">{titulo}</p>

        <h2 className="text-4xl font-black leading-none mt-2 text-white">
          {valor}
        </h2>

        <p className="text-slate-400 text-xs mt-2">{descricao}</p>
      </div>
    </div>
  );
}