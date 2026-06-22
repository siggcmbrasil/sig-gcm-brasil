"use client";

import Link from "next/link";
import ProtecaoModulo from "@/components/ProtecaoModulo";
import { User, Bell, Info } from "lucide-react";

export default function Configuracoes() {
  return (
    <ProtecaoModulo modulo="configuracoes">
      <div className="p-6 space-y-6">
        <header className="painel-premium p-6">
          <h1 className="text-4xl font-black text-white">
            ⚙️ Central de Configurações
          </h1>

          <p className="text-slate-400 mt-2">
            Preferências do usuário, notificações e informações do sistema.
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          <CardConfig
            href="/sistema/perfil"
            titulo="Meu Perfil"
            descricao="Gerencie seus dados pessoais e foto de perfil."
            icone={User}
          />

          <CardConfig
            href="/sistema/notificacoes"
            titulo="Notificações"
            descricao="Configure alertas, avisos e notificações push."
            icone={Bell}
          />

          <CardConfig
            href="/sistema/sobre"
            titulo="Sobre o Sistema"
            descricao="Informações sobre o SIG-GCM Brasil."
            icone={Info}
          />
        </div>
      </div>
    </ProtecaoModulo>
  );
}

function CardConfig({
  href,
  titulo,
  descricao,
  icone: Icone,
}: any) {
  return (
    <Link
      href={href}
      className="painel-premium p-6 hover:scale-[1.02] hover:border-blue-500/40 transition-all duration-300"
    >
      <div className="flex items-center justify-between mb-5">
        <div className="w-16 h-16 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
          <Icone className="w-9 h-9 text-cyan-400" />
        </div>

        <span className="text-green-400 text-xs font-black">
          CONFIG
        </span>
      </div>

      <h2 className="text-2xl font-black text-white">
        {titulo}
      </h2>

      <p className="text-slate-400 text-sm mt-2">
        {descricao}
      </p>
    </Link>
  );
}