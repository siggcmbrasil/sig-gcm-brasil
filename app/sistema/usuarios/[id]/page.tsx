"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Clock,
  Globe,
  KeyRound,
  Monitor,
  ShieldCheck,
  User,
} from "lucide-react";

import { supabase } from "@/lib/supabase";

export default function UsuarioDetalhesPage() {
  const { id } = useParams();
  const router = useRouter();

  const [usuario, setUsuario] = useState<any>(null);
  const [municipio, setMunicipio] = useState<any>(null);
  const [logs, setLogs] = useState<any[]>([]);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    carregar();
  }, []);

  async function carregar() {
    setCarregando(true);

    const { data: usuarioData, error } = await supabase
      .from("usuarios")
      .select("*")
      .eq("id", Number(id))
      .single();

    if (error || !usuarioData) {
      alert("Usuário não encontrado.");
      router.push("/sistema/usuarios");
      return;
    }

    setUsuario(usuarioData);

    if (usuarioData.municipio_id) {
      const { data: municipioData } = await supabase
        .from("municipios")
        .select("nome, estado")
        .eq("id", usuarioData.municipio_id)
        .single();

      setMunicipio(municipioData);
    }

    const { data: logsData } = await supabase
      .from("logs_acesso")
      .select("*")
      .eq("usuario_id", Number(id))
      .order("criado_em", { ascending: false })
      .limit(20);

    setLogs(logsData || []);
    setCarregando(false);
  }

  if (carregando) {
    return <div className="p-6 text-white">Carregando usuário...</div>;
  }

  if (!usuario) return null;

  return (
    <div className="p-4 md:p-6 pb-24 space-y-6">
      <button
        type="button"
        onClick={() => router.push("/sistema/usuarios")}
        className="text-cyan-400 hover:text-cyan-300 font-bold flex items-center gap-2"
      >
        <ArrowLeft size={18} />
        Voltar para Usuários
      </button>

      <div className="painel-premium p-6">
        <div className="flex flex-col md:flex-row gap-6 md:items-center">
          {usuario.foto_url ? (
            <img
              src={usuario.foto_url}
              alt={usuario.nome}
              className="w-32 h-32 rounded-full object-cover border-4 border-cyan-500"
            />
          ) : (
            <div className="w-32 h-32 rounded-full bg-slate-800 border-4 border-slate-700 flex items-center justify-center text-5xl font-black text-slate-400">
              {usuario.nome?.charAt(0) || "U"}
            </div>
          )}

          <div className="flex-1">
            <h1 className="text-3xl md:text-4xl font-black text-white flex items-center gap-3">
              <User className="text-cyan-400" />
              {usuario.nome}
            </h1>

            <p className="text-slate-400 mt-2">
              {usuario.email || "-"} • Matrícula: {usuario.matricula || "-"}
            </p>

            <div className="flex flex-wrap gap-2 mt-4">
              <Badge texto={usuario.perfil || "-"} cor="blue" />
              <Badge texto={usuario.status || "-"} cor={corStatus(usuario.status)} />
              <Badge texto={municipio ? `${municipio.nome} - ${municipio.estado}` : "Sem município"} cor="slate" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-4 gap-4">
        <Card titulo="Último Login" valor={formatarData(usuario.ultimo_login)} icone={<Clock />} />
        <Card titulo="Último IP" valor={usuario.ultimo_ip || "-"} icone={<Globe />} />
        <Card titulo="Navegador" valor={usuario.ultimo_navegador || "-"} icone={<Monitor />} />
        <Card titulo="Tentativas" valor={String(usuario.tentativas_login || 0)} icone={<ShieldCheck />} />
      </div>

      <div className="grid xl:grid-cols-2 gap-6">
        <div className="painel-premium p-6">
          <h2 className="text-xl font-black text-white mb-4">
            Dados do Usuário
          </h2>

          <Info nome="Nome" valor={usuario.nome} />
          <Info nome="CPF" valor={usuario.cpf || "-"} />
          <Info nome="Telefone" valor={usuario.telefone || "-"} />
          <Info nome="Cargo" valor={usuario.cargo || "-"} />
          <Info nome="Observação" valor={usuario.observacao || "-"} />
        </div>

        <div className="painel-premium p-6">
          <h2 className="text-xl font-black text-white mb-4">
            Segurança
          </h2>

          <Info nome="Último IP" valor={usuario.ultimo_ip || "-"} />
          <Info nome="Navegador" valor={usuario.ultimo_navegador || "-"} />
          <Info nome="Dispositivo" valor={usuario.ultimo_dispositivo || "-"} />
          <Info nome="Tentativas de login" valor={String(usuario.tentativas_login || 0)} />
        </div>
      </div>

      <div className="painel-premium p-6">
        <h2 className="text-xl font-black text-white mb-4 flex items-center gap-2">
          <KeyRound className="text-cyan-400" />
          Histórico de Acessos
        </h2>

        {logs.length === 0 ? (
          <p className="text-slate-400">Nenhum acesso registrado.</p>
        ) : (
          <div className="space-y-3">
            {logs.map((log) => (
              <div
                key={log.id}
                className="rounded-xl border border-slate-800 bg-slate-950/60 p-4"
              >
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                  <div>
                    <p className="font-bold text-white">
                      {log.acao} • {log.status}
                    </p>

                    <p className="text-slate-400 text-sm">
                      IP: {log.ip || "-"} • Navegador: {log.navegador || "-"}
                    </p>
                  </div>

                  <p className="text-slate-500 text-xs">
                    {formatarData(log.criado_em)}
                  </p>
                </div>

                {log.dispositivo && (
                  <p className="text-slate-500 text-xs mt-2 break-all">
                    {log.dispositivo}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function formatarData(data: string | null) {
  if (!data) return "-";
  return new Date(data).toLocaleString("pt-BR");
}

function corStatus(status: string | null) {
  if (status === "ATIVO") return "green";
  if (status === "PENDENTE") return "yellow";
  if (status === "BLOQUEADO") return "red";
  return "slate";
}

function Card({
  titulo,
  valor,
  icone,
}: {
  titulo: string;
  valor: string;
  icone: React.ReactNode;
}) {
  return (
    <div className="painel-premium p-5">
      <div className="flex items-center gap-2 text-slate-400 text-sm">
        <span className="[&>svg]:w-5 [&>svg]:h-5 text-cyan-400">
          {icone}
        </span>
        {titulo}
      </div>

      <h3 className="text-white font-black text-lg mt-2 break-all">
        {valor}
      </h3>
    </div>
  );
}

function Info({ nome, valor }: { nome: string; valor: string }) {
  return (
    <div className="flex justify-between gap-4 border-b border-slate-800 py-3">
      <span className="text-slate-400">{nome}</span>
      <span className="text-white font-semibold text-right break-all">
        {valor}
      </span>
    </div>
  );
}

function Badge({
  texto,
  cor,
}: {
  texto: string;
  cor: "blue" | "green" | "yellow" | "red" | "slate";
}) {
  const cores = {
    blue: "bg-blue-700 text-blue-100",
    green: "bg-green-700 text-green-100",
    yellow: "bg-yellow-700 text-yellow-100",
    red: "bg-red-700 text-red-100",
    slate: "bg-slate-700 text-slate-100",
  };

  return (
    <span className={`${cores[cor]} px-3 py-2 rounded-full text-xs font-bold`}>
      {texto}
    </span>
  );
}