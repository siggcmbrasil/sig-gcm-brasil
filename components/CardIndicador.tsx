

export default function CardIndicador({
  titulo,
  valor,
  icone,
  cor = "blue",
}: {
  titulo: string;
  valor: number | string;
  icone: string;
  cor?: "blue" | "green" | "yellow" | "purple" | "red";
}) {
  const cores = {
    blue: "border-blue-700/70 bg-blue-950/30",
    green: "border-green-700/70 bg-green-950/30",
    yellow: "border-yellow-700/70 bg-yellow-950/30",
    purple: "border-purple-700/70 bg-purple-950/30",
    red: "border-red-700/70 bg-red-950/30",
  };

  return (
    <div
      className={`${cores[cor]} rounded-2xl border p-3 min-h-24 shadow-lg flex flex-col justify-between`}
    >
      <div className="w-10 h-10 rounded-xl bg-slate-900/70 flex items-center justify-center text-xl">
        {icone}
      </div>

      <div>
        <p className="text-slate-400 text-sm">{titulo}</p>
        <h2 className="text-3xl font-bold leading-none mt-1">{valor}</h2>
      </div>
    </div>
  );
}