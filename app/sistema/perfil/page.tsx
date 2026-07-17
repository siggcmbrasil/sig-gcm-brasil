"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { registrarAuditoria } from "@/lib/auditoria";
import { ativarPushMobile } from "@/lib/push-mobile";
import {
  adicionarVersaoFoto,
  prepararFotoGuarda,
} from "@/components/guardas";

export default function PerfilPage() {
  const [usuario, setUsuario] = useState<any>(null);
  const [foto, setFoto] = useState<File | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [versaoFoto, setVersaoFoto] = useState(Date.now());


  useEffect(() => {
    const dados = localStorage.getItem("usuarioLogado");

    if (dados) {
      setUsuario(JSON.parse(dados));
    }
  }, []);

  async function salvarFoto() {
  if (!usuario?.id || !usuario?.municipio_id) {
    alert(
      "Usuário inválido ou sem município. Faça login novamente."
    );
    return;
  }

  if (!foto) {
    alert("Selecione uma foto primeiro.");
    return;
  }

  setSalvando(true);

  try {
    const fotoPreparada =
      await prepararFotoGuarda(foto);

    const caminhoUsuario =
      `${usuario.municipio_id}/usuarios/${usuario.id}.webp`;

    const { error: uploadError } =
      await supabase.storage
        .from("usuarios-fotos")
        .upload(
          caminhoUsuario,
          fotoPreparada,
          {
            upsert: true,
            cacheControl: "0",
            contentType: "image/webp",
          }
        );

    if (uploadError) {
      throw new Error(
        `Erro ao enviar foto: ${uploadError.message}`
      );
    }

    const { data: urlData } =
      supabase.storage
        .from("usuarios-fotos")
        .getPublicUrl(caminhoUsuario);

    const novaFotoUrl =
      urlData.publicUrl;

  const {
  data: resultadoFoto,
  error: fotoRpcError,
} = await supabase.rpc(
  "atualizar_minha_foto",
  {
    p_foto_url: novaFotoUrl,
  }
);

if (fotoRpcError) {
  throw new Error(
    `Erro ao atualizar foto: ${fotoRpcError.message}`
  );
}

if (!resultadoFoto?.ok) {
  throw new Error(
    "A foto foi enviada, mas não foi vinculada ao perfil."
  );
}

const usuarioAtualizadoBanco = {
  id: resultadoFoto.usuario_id,
  municipio_id: resultadoFoto.municipio_id,
  foto_url: resultadoFoto.foto_url,
};

const guardaVinculado = {
  id: resultadoFoto.guarda_id ?? null,
};

    const usuarioSalvo =
      JSON.parse(
        localStorage.getItem(
          "usuarioLogado"
        ) || "{}"
      );

    const usuarioAtualizado = {
      ...usuarioSalvo,
      ...usuario,
      ...usuarioAtualizadoBanco,
      foto_url: novaFotoUrl,
      municipio_nome:
        usuarioSalvo?.municipio_nome ||
        usuario?.municipio_nome ||
        "",
    };

    localStorage.setItem(
      "usuarioLogado",
      JSON.stringify(
        usuarioAtualizado
      )
    );

    await registrarAuditoria({
      modulo: "PERFIL",
      acao: "ATUALIZAR_FOTO",
      descricao:
        "Atualizou a foto do perfil e sincronizou com o cadastro funcional.",
      registro_id: String(
        usuario.id
      ),
      detalhes: {
        foto_url: novaFotoUrl,
        guarda_id:
          guardaVinculado?.id ||
          null,
      },
    });

    setUsuario(
      usuarioAtualizado
    );

    setFoto(null);
    setVersaoFoto(
      Date.now()
    );

    alert(
      guardaVinculado?.id
        ? "Foto atualizada e sincronizada com o dossiê!"
        : "Foto atualizada. Nenhum guarda está vinculado a este usuário."
    );
  } catch (error) {
    console.error(
      "Erro ao atualizar foto:",
      error
    );

    alert(
      error instanceof Error
        ? error.message
        : "Não foi possível atualizar a foto."
    );
  } finally {
    setSalvando(false);
  }
}

async function ativarNotificacoes() {
  if (!("serviceWorker" in navigator)) {
    alert("Este navegador não suporta notificações.");
    return;
  }

  if (!usuario?.id || !usuario?.municipio_id) {
  alert("Usuário inválido ou sem município. Faça login novamente.");
  return;
}

  const permissao = await Notification.requestPermission();

  if (permissao !== "granted") {
    alert("Permissão de notificação negada.");
    return;
  }

await navigator.serviceWorker.register("/sw.js");
await navigator.serviceWorker.ready;

  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

  if (!publicKey) {
    alert("Chave pública VAPID não configurada.");
    return;
  }

  const registration = await navigator.serviceWorker.ready;

  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(publicKey),
  });

const resposta = await fetch("/api/push/subscribe", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    ...subscription.toJSON(),
    municipio_id: usuario.municipio_id,
    usuario_id: usuario.id,
    perfil: usuario.perfil,
  }),
});

if (!resposta.ok) {
  alert("Erro ao salvar inscrição de notificação.");
  return;
}

  await registrarAuditoria({
  modulo: "PERFIL",
  acao: "ATIVAR_NOTIFICACOES",
  descricao: "Ativou notificações push no dispositivo.",
  registro_id: String(usuario.id),
});

alert("Notificações push ativadas com sucesso!");
}

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - base64String.length % 4) % 4);

  const base64 = (base64String + padding)
    .replace(/-/g, "+")
    .replace(/_/g, "/");

  const rawData = window.atob(base64);

  return Uint8Array.from(
    [...rawData].map((char) => char.charCodeAt(0))
  );
}

  return (
    <main className="min-h-screen bg-[#020b1c] text-white p-6">
      <div className="max-w-4xl mx-auto">
        <div className="painel-premium p-6">
          <h1 className="text-3xl font-black mb-6">👤 Meu Perfil</h1>

          <div className="flex flex-col md:flex-row gap-6 items-center mb-8 bg-slate-950/50 border border-slate-800 rounded-xl p-5">
            <div className="w-28 h-28 rounded-full overflow-hidden border-2 border-blue-500 bg-slate-800 flex items-center justify-center">
              {usuario?.foto_url ? (
              <img
                src={adicionarVersaoFoto(
                  usuario.foto_url,
                  versaoFoto
                )}
                alt={usuario.nome}
                className="h-full w-full object-cover"
                onError={(event) => {
                  console.error(
                    "Erro ao carregar foto:",
                    usuario.foto_url
                  );

                  event.currentTarget.style.display =
                    "none";
                }}
              />
              ) : (
                <span className="text-5xl">👤</span>
              )}
            </div>

            <div className="flex-1 w-full">
              <p className="text-slate-400 mb-2">Foto do Perfil</p>

              <input
                type="file"
                accept="image/*"
                onChange={(event) => {
                  setFoto(
                    event.target.files?.[0] ||
                      null
                  );
                }}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-sm"
              />

              <button
                type="button"
                onClick={salvarFoto}
                disabled={salvando}
                className="mt-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 px-5 py-3 rounded-xl font-bold"
              >
                {salvando ? "Salvando..." : "📸 Salvar Foto"}
              </button>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-slate-950/50 border border-slate-800 rounded-xl p-4">
              <p className="text-slate-400">Nome</p>
              <p className="font-bold text-xl">
                {usuario?.nome || "Não informado"}
              </p>
            </div>

            <div className="bg-slate-950/50 border border-slate-800 rounded-xl p-4">
              <p className="text-slate-400">Matrícula</p>
              <p className="font-bold text-xl">{usuario?.matricula || "-"}</p>
            </div>

            <div className="bg-slate-950/50 border border-slate-800 rounded-xl p-4">
              <p className="text-slate-400">Email</p>
              <p className="font-bold text-xl">{usuario?.email || "-"}</p>
            </div>

            <div className="bg-slate-950/50 border border-slate-800 rounded-xl p-4">
              <p className="text-slate-400">Perfil</p>
              <p className="font-bold text-xl text-green-400">
                {usuario?.perfil || "-"}
              </p>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <button
  type="button"
  onClick={() => ativarPushMobile(usuario)}
  className="bg-green-600 hover:bg-green-700 px-5 py-3 rounded-xl font-bold"
>
  🔔 Ativar Push Celular
</button>

            <button className="bg-blue-600 px-5 py-3 rounded-xl font-bold">
              🔒 Alterar Senha
            </button>

            <button className="bg-yellow-600 px-5 py-3 rounded-xl font-bold">
              📝 Editar Dados
            </button>

<button
  className="bg-red-600 px-5 py-3 rounded-xl font-bold"
  onClick={async () => {
    if (usuario?.id) {
      await registrarAuditoria({
        modulo: "PERFIL",
        acao: "LOGOUT",
        descricao: "Usuário saiu do sistema pelo perfil.",
        registro_id: String(usuario.id),
      });
    }

    localStorage.removeItem("usuarioLogado");
    window.location.href = "/login";
  }}
>
  🚪 Sair do Sistema
</button>
          </div>
        </div>
      </div>
    </main>
  );
}