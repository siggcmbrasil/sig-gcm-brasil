"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function PerfilPage() {
  const [usuario, setUsuario] = useState<any>(null);
  const [foto, setFoto] = useState<File | null>(null);
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    const dados = localStorage.getItem("usuarioLogado");

    if (dados) {
      setUsuario(JSON.parse(dados));
    }
  }, []);

  async function salvarFoto() {
    if (!usuario) return;

    if (!foto) {
      alert("Selecione uma foto primeiro.");
      return;
    }

    setSalvando(true);

    const nomeArquivo = `${usuario.id}-${Date.now()}-${foto.name}`;

    const { error: uploadError } = await supabase.storage
      .from("fotos-guardas")
      .upload(nomeArquivo, foto);

    if (uploadError) {
      console.error(uploadError);
      alert("Erro ao enviar foto.");
      setSalvando(false);
      return;
    }

    const { data } = supabase.storage
      .from("fotos-guardas")
      .getPublicUrl(nomeArquivo);

    const novaFotoUrl = data.publicUrl;

    const { error } = await supabase
      .from("usuarios")
      .update({ foto_url: novaFotoUrl })
      .eq("email", usuario.email);

    if (error) {
      console.error(error);
      alert("Erro ao salvar foto no perfil.");
      setSalvando(false);
      return;
    }

    const usuarioAtualizado = {
      ...usuario,
      foto_url: novaFotoUrl,
    };

    localStorage.setItem("usuarioLogado", JSON.stringify(usuarioAtualizado));
    setUsuario(usuarioAtualizado);
    setFoto(null);
    setSalvando(false);

    alert("Foto atualizada com sucesso!");
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
                  src={usuario.foto_url}
                  alt={usuario.nome}
                  className="w-full h-full object-cover"
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
                onChange={(e) => setFoto(e.target.files?.[0] || null)}
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
            <button className="bg-blue-600 px-5 py-3 rounded-xl font-bold">
              🔒 Alterar Senha
            </button>

            <button className="bg-yellow-600 px-5 py-3 rounded-xl font-bold">
              📝 Editar Dados
            </button>

            <button
              className="bg-red-600 px-5 py-3 rounded-xl font-bold"
              onClick={() => {
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