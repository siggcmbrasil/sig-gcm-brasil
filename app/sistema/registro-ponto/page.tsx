"use client";

import { useEffect, useState } from "react";
import { Clock, LogIn, LogOut, TimerReset, Utensils } from "lucide-react";

import { supabase } from "@/lib/supabase";
import { registrarAuditoria } from "@/lib/auditoria";

type UsuarioLogado = {
  id: string;
  nome?: string;
  perfil: string;
  municipio_id: number;
};

type RegistroPonto = {
  id: number;
  tipo: string;
  data_hora: string;
  usuario_id: string;
};

function obterUsuarioLogado(): UsuarioLogado | null {
  try {
    const salvo = localStorage.getItem("usuarioLogado");
    if (!salvo) return null;

    const usuario = JSON.parse(salvo);

    if (!usuario?.id || !usuario?.perfil || !usuario?.municipio_id) {
      return null;
    }

    return {
      id: String(usuario.id),
      nome: usuario.nome,
      perfil: usuario.perfil,
      municipio_id: Number(usuario.municipio_id),
    };
  } catch {
    return null;
  }
}

export default function RegistroPontoPage() {
  const [registros, setRegistros] = useState<RegistroPonto[]>([]);
  const [usuario, setUsuario] = useState<UsuarioLogado | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    const usuarioAtual = obterUsuarioLogado();

    setUsuario(usuarioAtual);

    if (usuarioAtual) {
      void carregar(usuarioAtual);
    } else {
      setCarregando(false);
    }
  }, []);

  async function carregar(usuarioAtual: UsuarioLogado) {
    setCarregando(true);

    const { data, error } = await supabase
      .from("registro_ponto")
      .select("id, tipo, data_hora, usuario_id")
      .eq("municipio_id", usuarioAtual.municipio_id)
      .eq("usuario_id", usuarioAtual.id)
      .order("data_hora", { ascending: false })
      .limit(50);

    setCarregando(false);

    if (error) {
      console.error(error);
      alert("Erro ao carregar registros de ponto.");
      return;
    }

    setRegistros((data || []) as RegistroPonto[]);
  }

  async function registrar(tipo: string) {
    if (!usuario) {
      alert("Sessão inválida.");
      return;
    }

    if (salvando) return;

    const ultimo = registros[0];

    if (ultimo?.tipo === tipo) {
      alert("Você já registrou este tipo como último ponto.");
      return;
    }

    setSalvando(true);

    const { data, error } = await supabase
      .from("registro_ponto")
      .insert({
        municipio_id: usuario.municipio_id,
        usuario_id: usuario.id,
        tipo,
        data_hora: new Date().toISOString(),
        criado_em: new Date().toISOString(),
      })
      .select("id")
      .single();

    setSalvando(false);

    if (error) {
      console.error(error);

      await registrarAuditoria({
        modulo: "Registro de Ponto",
        acao: "ERRO",
        descricao: "Erro ao registrar ponto.",
        tabela: "registro_ponto",
        detalhes: {
          erro: error.message,
          tipo,
          municipio_id: usuario.municipio_id,
          usuario_id: usuario.id,
        },
      });

      alert("Erro ao registrar ponto.");
      return;
    }

    await registrarAuditoria({
      modulo: "Registro de Ponto",
      acao: "CRIAR",
      descricao: `Registrou ponto do tipo ${tipo}.`,
      tabela: "registro_ponto",
      registro_id: data?.id,
      detalhes: {
        tipo,
        municipio_id: usuario.municipio_id,
        usuario_id: usuario.id,
      },
    });

    await carregar(usuario);
  }

  return (
    <div className="p-4 md:p-6 pb-24 space-y-6">
      <div className="painel-premium p-6">
        <div className="flex items-center gap-4">
          <Clock className="w-10 h-10 text-yellow-400" />

          <div>
            <h1 className="text-2xl md:text-3xl font-black">
              Registro de Ponto
            </h1>

            <p className="text-slate-400 mt-1">
              Entrada, saída, intervalo e retorno do servidor logado.
            </p>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-4 gap-4">
        <BotaoPonto
          titulo="Entrada"
          tipo="ENTRADA"
          icone={<LogIn className="w-6 h-6" />}
          onClick={registrar}
          disabled={salvando}
        />

        <BotaoPonto
          titulo="Intervalo"
          tipo="INTERVALO"
          icone={<Utensils className="w-6 h-6" />}
          onClick={registrar}
          disabled={salvando}
        />

        <BotaoPonto
          titulo="Retorno"
          tipo="RETORNO"
          icone={<TimerReset className="w-6 h-6" />}
          onClick={registrar}
          disabled={salvando}
        />

        <BotaoPonto
          titulo="Saída"
          tipo="SAIDA"
          icone={<LogOut className="w-6 h-6" />}
          onClick={registrar}
          disabled={salvando}
        />
      </div>

      <div className="painel-premium p-6">
        <h2 className="text-xl font-black mb-4">
          Meus últimos registros
        </h2>

        {carregando ? (
          <p className="text-slate-400">Carregando registros...</p>
        ) : registros.length === 0 ? (
          <div className="py-12 text-center">
            <Clock className="w-16 h-16 mx-auto text-slate-600 mb-4" />
            <h3 className="text-xl font-black">
              Nenhum ponto registrado
            </h3>
            <p className="text-slate-400 mt-2">
              Seus registros aparecerão aqui após o primeiro ponto.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {registros.map((item) => (
              <div
                key={item.id}
                className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-2"
              >
                <p className="font-black text-white">
                  {nomeTipo(item.tipo)}
                </p>

                <p className="text-slate-400">
                  {new Date(item.data_hora).toLocaleString("pt-BR")}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function BotaoPonto({
  titulo,
  tipo,
  icone,
  onClick,
  disabled,
}: {
  titulo: string;
  tipo: string;
  icone: React.ReactNode;
  onClick: (tipo: string) => void;
  disabled: boolean;
}) {
  return (
    <button
      type="button"
      onClick={() => onClick(tipo)}
      disabled={disabled}
      className="painel-premium p-5 text-left hover:border-yellow-400/40 transition disabled:opacity-50"
    >
      <div className="flex items-center gap-3 text-yellow-400">
        {icone}
        <span className="font-black">{titulo}</span>
      </div>
    </button>
  );
}

function nomeTipo(tipo: string) {
  const nomes: Record<string, string> = {
    ENTRADA: "Entrada",
    INTERVALO: "Intervalo",
    RETORNO: "Retorno",
    SAIDA: "Saída",
  };

  return nomes[tipo] || tipo;
}