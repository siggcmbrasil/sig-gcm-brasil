"use client";

import Link from "next/link";

export default function NotificacoesPage() {
  async function ativarNotificacoes() {
    alert("As notificações já foram configuradas no sistema.");
  }

  return (
    <div className="p-6 text-white">
      <Link href="/sistema/configuracoes" className="text-blue-400 font-bold">
        ← Voltar para Configurações
      </Link>

      <div className="card mt-6 max-w-2xl">
        <h1 className="text-3xl font-black mb-3">🔔 Notificações</h1>

        <p className="text-slate-400 mb-6">
          Gerencie notificações push, alertas operacionais e avisos do sistema.
        </p>

        <button
          type="button"
          onClick={ativarNotificacoes}
          className="btn-primary"
        >
          🔔 Ativar Notificações
        </button>
      </div>
    </div>
  );
}