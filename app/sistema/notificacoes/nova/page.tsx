"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import SigPageHeader from "@/components/sig/SigPageHeader";
import SigCard from "@/components/sig/SigCard";

export default function NovaNotificacaoPage() {
  const [titulo, setTitulo] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [tipo, setTipo] = useState("INFO");
  const [link, setLink] = useState("");
  const [perfilDestino, setPerfilDestino] = useState("");
  const [salvando, setSalvando] = useState(false);

  async function salvar() {
    if (!titulo.trim()) {
      alert("Informe o título.");
      return;
    }

    if (!mensagem.trim()) {
      alert("Informe a mensagem.");
      return;
    }

    const usuario = JSON.parse(
      localStorage.getItem("usuarioLogado") || "{}"
    );

    setSalvando(true);

    const { error } = await supabase
      .from("notificacoes")
      .insert({
        municipio_id: usuario.municipio_id,
        titulo,
        mensagem,
        tipo,
        link: link || null,
        perfil_destino:
          perfilDestino || null,
        usuario_id: null,
        lida: false,
      });

    setSalvando(false);

    if (error) {
      console.error(error);
      alert(error.message);
      return;
    }

    alert("Notificação enviada.");

    setTitulo("");
    setMensagem("");
    setTipo("INFO");
    setLink("");
    setPerfilDestino("");
  }

  return (
    <div className="p-4 md:p-6 pb-24 space-y-6">
      <SigPageHeader
        titulo="Nova Notificação"
        subtitulo="Enviar avisos e alertas."
      />

      <SigCard>
        <div className="space-y-4">
          <div>
            <label className="label">
              Título
            </label>

            <input
              className="input"
              value={titulo}
              onChange={(e) =>
                setTitulo(e.target.value)
              }
            />
          </div>

          <div>
            <label className="label">
              Mensagem
            </label>

            <textarea
              className="input h-32"
              value={mensagem}
              onChange={(e) =>
                setMensagem(e.target.value)
              }
            />
          </div>

          <div>
            <label className="label">
              Tipo
            </label>

            <select
              className="input"
              value={tipo}
              onChange={(e) =>
                setTipo(e.target.value)
              }
            >
              <option value="INFO">
                Informação
              </option>

              <option value="ALERTA">
                Alerta
              </option>

              <option value="SUCESSO">
                Sucesso
              </option>
            </select>
          </div>

          <div>
            <label className="label">
              Perfil de destino
            </label>

            <select
              className="input"
              value={perfilDestino}
              onChange={(e) =>
                setPerfilDestino(
                  e.target.value
                )
              }
            >
              <option value="">
                Todos
              </option>

              <option value="GUARDA">
                Guarda
              </option>

              <option value="PLANTONISTA">
                Plantonista
              </option>

              <option value="COMANDANTE">
                Comandante
              </option>

              <option value="ADMIN">
                Admin
              </option>
            </select>
          </div>

          <div>
            <label className="label">
              Link (opcional)
            </label>

            <input
              className="input"
              placeholder="/sistema/ocorrencias"
              value={link}
              onChange={(e) =>
                setLink(e.target.value)
              }
            />
          </div>

          <button
            onClick={salvar}
            disabled={salvando}
            className="sig-btn-gold w-full"
          >
            {salvando
              ? "Enviando..."
              : "Enviar Notificação"}
          </button>
        </div>
      </SigCard>
    </div>
  );
}