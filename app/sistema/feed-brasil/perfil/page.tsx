"use client";

import { useEffect, useState } from "react";

import {
  Award,
  Building2,
  CalendarDays,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
  UserCircle,
} from "lucide-react";

import SigCard from "@/components/sig/SigCard";
import SigPageHeader from "@/components/sig/SigPageHeader";

export default function PerfilPage() {
  const [usuario, setUsuario] = useState<any>({});

useEffect(() => {
  const salvo = JSON.parse(localStorage.getItem("usuarioLogado") || "{}");
  setUsuario(salvo);
}, []);

  return (
    <div className="p-4 md:p-6 pb-24 space-y-6">
      <SigPageHeader
        titulo="Perfil"
        subtitulo="Informações do usuário logado no SIG-GCM Brasil."
        icone={UserCircle}
      />

      <SigCard>
        <div className="flex flex-col md:flex-row md:items-center gap-6">
          <div className="flex h-24 w-24 items-center justify-center rounded-3xl border border-yellow-500/30 bg-yellow-500/10">
            <UserCircle className="w-16 h-16 text-yellow-400" />
          </div>

          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-yellow-400 font-bold">
              Perfil do Usuário
            </p>

            <h2 className="text-2xl md:text-4xl font-black text-white mt-1">
              {usuario.nome}
            </h2>

            <p className="text-slate-400 mt-2">
              {usuario.perfil} • {usuario.municipio_nome || `Município ID ${usuario.municipio_id || "-"}`}
            </p>
          </div>
        </div>
      </SigCard>

      <div className="grid md:grid-cols-4 gap-4">
        <SigCard>
          <ShieldCheck className="w-8 h-8 text-yellow-400 mb-3" />
          <h3 className="text-lg font-black text-white">Perfil</h3>
          <p className="text-slate-400 mt-2">{usuario.perfil}</p>
        </SigCard>

        <SigCard>
          <Building2 className="w-8 h-8 text-emerald-400 mb-3" />
          <h3 className="text-lg font-black text-white">Município</h3>
          <p className="text-slate-400 mt-2">{usuario.municipio}</p>
        </SigCard>

        <SigCard>
          <Award className="w-8 h-8 text-blue-400 mb-3" />
          <h3 className="text-lg font-black text-white">Status</h3>
          <p className="text-slate-400 mt-2">{usuario.status || "Ativo"}</p>
        </SigCard>

        <SigCard>
          <CalendarDays className="w-8 h-8 text-orange-400 mb-3" />
          <h3 className="text-lg font-black text-white">Desde</h3>
          <p className="text-slate-400 mt-2">{usuario.created_at ? new Date(usuario.created_at).getFullYear() : "2026"}</p>
        </SigCard>
      </div>

      <SigCard>
        <h3 className="text-xl font-black text-white mb-5">
          Dados do Usuário
        </h3>

        <div className="grid md:grid-cols-2 gap-4">
          <InfoItem icone={ShieldCheck} titulo="Matrícula" valor={usuario.matricula} />
          <InfoItem icone={Mail} titulo="E-mail" valor={usuario.email} />
          <InfoItem icone={Phone} titulo="Telefone" valor={usuario.telefone} />
          <InfoItem icone={MapPin} titulo="Município" valor={usuario.municipio} />
        </div>
      </SigCard>
    </div>
  );
}

function InfoItem({
  icone: Icone,
  titulo,
  valor,
}: {
  icone: any;
  titulo: string;
  valor: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4 flex items-center gap-4">
      <Icone className="w-6 h-6 text-yellow-400" />

      <div>
        <p className="text-sm text-slate-400">{titulo}</p>
        <p className="font-bold text-white">{valor}</p>
      </div>
    </div>
  );
}