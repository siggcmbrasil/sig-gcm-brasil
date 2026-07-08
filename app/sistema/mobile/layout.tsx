"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { registrarAuditoria } from "@/lib/auditoria";

export default function MobileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [online, setOnline] = useState(true);
  const [enviandoSOS, setEnviandoSOS] = useState(false);

  useEffect(() => {
    setOnline(navigator.onLine);

    function ficarOnline() {
      setOnline(true);
    }

    function ficarOffline() {
      setOnline(false);
    }

    window.addEventListener("online", ficarOnline);
    window.addEventListener("offline", ficarOffline);

    return () => {
      window.removeEventListener("online", ficarOnline);
      window.removeEventListener("offline", ficarOffline);
    };
  }, []);

  async function acionarSOS() {
    if (enviandoSOS) return;

    const confirmar = confirm("Deseja realmente acionar o ALERTA SOS?");
    if (!confirmar) return;

    const salvo = localStorage.getItem("usuarioLogado");

    if (!salvo) {
      alert("Usuário não encontrado.");
      return;
    }

    const usuario = JSON.parse(salvo);

    if (!usuario?.id || !usuario?.municipio_id) {
      alert("Sessão inválida.");
      return;
    }

    if (!navigator.geolocation) {
      alert("GPS não suportado.");
      return;
    }

    setEnviandoSOS(true);

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          if (pos.coords.accuracy > 100) {
            alert(
              `GPS com baixa precisão (${Math.round(
                pos.coords.accuracy
              )} metros). Vá para área aberta e tente novamente.`
            );

            setEnviandoSOS(false);
            return;
          }

          const { error } = await supabase.from("alertas_sos").insert({
            municipio_id: usuario.municipio_id,
            usuario_id: usuario.id,
            nome_usuario: usuario.nome || "Usuário não identificado",
            latitude: String(pos.coords.latitude),
            longitude: String(pos.coords.longitude),
            precisao: String(pos.coords.accuracy),
            status: "ABERTO",
            criado_em: new Date().toISOString(),
          });

          if (error) {
            console.error(error);

            await registrarAuditoria({
              modulo: "SOS",
              acao: "ERRO",
              descricao: `Erro ao acionar SOS mobile global: ${error.message}`,
              registro_id: String(usuario.id),
            });

            alert("Erro ao enviar SOS.");
            setEnviandoSOS(false);
            return;
          }

          await supabase.from("notificacoes").insert({
            municipio_id: usuario.municipio_id,
            titulo: "🚨 ALERTA SOS",
            mensagem: `${usuario.nome || "Um guarda"} acionou o botão SOS.`,
            tipo: "SOS",
            link: "/sistema/central-sos",
            lida: false,
          });

          await registrarAuditoria({
            modulo: "SOS",
            acao: "ACIONAR_GLOBAL_MOBILE",
            descricao: `Alerta SOS acionado pelo mobile por ${
              usuario.nome || "usuário"
            }.`,
            registro_id: String(usuario.id),
          });

          navigator.vibrate?.([500, 200, 500]);

          alert("🚨 SOS enviado com sucesso.");
        } catch (erro) {
          console.error(erro);
          alert("Erro inesperado ao enviar SOS.");
        } finally {
          setEnviandoSOS(false);
        }
      },
      () => {
        alert("Não foi possível obter o GPS.");
        setEnviandoSOS(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 30000,
        maximumAge: 0,
      }
    );
  }

  return (
    <div
      className="
        min-h-screen
        bg-[#02060f]
        text-white
        overflow-x-hidden
        pt-[env(safe-area-inset-top)]
        pb-[env(safe-area-inset-bottom)]
      "
    >
      {!online && (
        <div className="bg-red-600 text-white text-center py-2 text-sm font-bold">
          📡 Sem internet - modo offline ativo
        </div>
      )}

      <div className="min-h-screen">
        {children}
      </div>
    </div>
  );
}