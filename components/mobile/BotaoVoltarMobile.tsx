"use client";

import { useRouter } from "next/navigation";

export default function BotaoVoltarMobile() {
  const router = useRouter();

  return (
    <button
      type="button"
      onClick={() => router.push("/sistema/mobile")}
      className="mb-5 inline-flex items-center gap-2 rounded-2xl bg-slate-900 border border-slate-800 px-4 py-3 text-sm font-bold text-slate-200"
    >
      ← Voltar
    </button>
  );
}