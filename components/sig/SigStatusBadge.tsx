"use client";

type SigStatusBadgeProps = {
  status: string;
};

export default function SigStatusBadge({
  status,
}: SigStatusBadgeProps) {
  let cor = "bg-slate-900 text-slate-300 border-slate-700";

  if (
    status === "DISPONIVEL" ||
    status === "CONFERIDO" ||
    status === "FINALIZADA" ||
    status === "OK"
  ) {
    cor = "bg-green-950 text-green-300 border-green-800";
  }

  if (
    status === "CAUTELADA" ||
    status === "BAIXO" ||
    status === "PENDENTE" ||
    status === "ABERTA"
  ) {
    cor = "bg-yellow-950 text-yellow-300 border-yellow-800";
  }

  if (
    status === "MANUTENCAO" ||
    status === "EM_ANDAMENTO"
  ) {
    cor = "bg-blue-950 text-blue-300 border-blue-800";
  }

  if (
    status === "BAIXADA" ||
    status === "EXTRAVIADA" ||
    status === "ZERADO" ||
    status === "DIVERGENTE" ||
    status === "CANCELADA"
  ) {
    cor = "bg-red-950 text-red-300 border-red-800";
  }

  return (
    <span
      className={`h-fit rounded-full border px-3 py-1 text-xs font-bold ${cor}`}
    >
      {status || "N/I"}
    </span>
  );
}