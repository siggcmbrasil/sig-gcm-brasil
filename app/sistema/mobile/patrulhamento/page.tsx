"use client";

import { useRouter } from "next/navigation";
import MobileBottomNav from "@/components/MobileBottomNav";
import { Route } from "lucide-react";
import Link from "next/link";

export default function PatrulhamentoMobilePage() {
  const router = useRouter();

  return (
    <main className="min-h-screen bg-[#02060f] text-white p-5">
      <button
        onClick={() => router.push("/sistema/mobile")}
        className="mb-5 bg-slate-900 border border-slate-800 px-4 py-2 rounded-2xl"
      >
        ← Voltar
      </button>

      <h1 className="text-3xl font-black mb-4">
        📍 Patrulhamento GPS
      </h1>

      <button
        onClick={() => router.push("/sistema/patrulhamento")}
        className="w-full bg-blue-700 rounded-2xl p-5 font-black"
      >
        Abrir Rastreamento GPS
      </button>

<MobileBottomNav />

    </main>
  );
}