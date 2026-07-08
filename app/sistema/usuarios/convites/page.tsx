"use client";

import { useEffect, useState } from "react";
import { Copy, Link2, Plus, RefreshCw } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { registrarAuditoria } from "@/lib/auditoria";

export default function ConvitesUsuariosPage() {
  const [convites, setConvites] = useState<any[]>([]);
  const [perfil, setPerfil] = useState("GUARDA");
  const [emailDestino, setEmailDestino] = useState("");
  const [validadeDias, setValidadeDias] = useState("7");
  const [limiteUso, setLimiteUso] = useState("1");
  const [carregando, setCarregando] = useState(true);

  const usuarioLogado =
    typeof window !== "undefined"
      ? JSON.parse(localStorage.getItem("usuarioLogado") || "{}")
      : {};

  useEffect(() => {
    carregarConvites();
  }, []);

  async function carregarConvites() {
    setCarregando(true);

    const { data, error } = await supabase
      .from("convites_usuarios")
      .select("*")
      .eq("municipio_id", usuarioLogado.municipio_id)
      .order("criado_em", { ascending: false });

    if (error) {
      console.error(error);
      alert("Erro ao carregar convites.");
      setCarregando(false);
      return;
    }

    setConvites(data || []);
    setCarregando(false);
  }

  function gerarToken() {
    return crypto.randomUUID().replaceAll("-", "");
  }

  async function gerarConvite() {
    if (!usuarioLogado?.municipio_id) {
      alert("Município do usuário não identificado.");
      return;
    }

    const token = gerarToken();

    const expiraEm = new Date();
    expiraEm.setDate(expiraEm.getDate() + Number(validadeDias));

    const { error } = await supabase.from("convites_usuarios").insert({
      municipio_id: usuarioLogado.municipio_id,
      token,
      perfil,
      email_destino: emailDestino || null,
      criado_por: usuarioLogado.id,
      expira_em: expiraEm.toISOString(),
      limite_uso: Number(limiteUso),
      usos: 0,
      ativo: true,
    });

    if (error) {
      console.error(error);
      alert("Erro ao gerar convite.");
      return;
    }

    await registrarAuditoria({
      modulo: "Usuários",
      acao: "GERAR_CONVITE",
      descricao: `Gerou convite de usuário com perfil ${perfil}.`,
    });

    setEmailDestino("");
    setPerfil("GUARDA");
    setValidadeDias("7");
    setLimiteUso("1");

    alert("Convite gerado com sucesso.");
    carregarConvites();
  }

  function linkConvite(token: string) {
    return `${window.location.origin}/cadastro?convite=${token}`;
  }

  async function copiar(token: string) {
    await navigator.clipboard.writeText(linkConvite(token));
    alert("Link copiado.");
  }

  async function desativarConvite(id: number) {
    if (!confirm("Deseja desativar este convite?")) return;

    const { error } = await supabase
      .from("convites_usuarios")
      .update({ ativo: false })
      .eq("id", id)
      .eq("municipio_id", usuarioLogado.municipio_id);

    if (error) {
      alert("Erro ao desativar convite.");
      return;
    }

    carregarConvites();
  }

  return (
    <div className="p-4 md:p-6 pb-24 space-y-6">
      <div className="painel-premium p-6">
        <h1 className="text-3xl md:text-4xl font-black text-white flex items-center gap-3">
          <Link2 className="text-cyan-400" />
          Convites por Link
        </h1>

        <p className="text-slate-400 mt-2">
          Gere links seguros para cadastro de novos usuários vinculados ao seu município.
        </p>
      </div>

      <div className="painel-premium p-6 space-y-4">
        <h2 className="text-xl font-black text-white">Novo Convite</h2>

        <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-4">
          <input
            className="input"
            placeholder="E-mail de destino opcional"
            value={emailDestino}
            onChange={(e) => setEmailDestino(e.target.value)}
          />

          <select
            className="input"
            value={perfil}
            onChange={(e) => setPerfil(e.target.value)}
          >
            <option>GUARDA</option>
            <option>CONSULTA</option>
            <option>PLANTONISTA</option>
            <option>CMT_GUARNICAO</option>
            <option>DIRETOR</option>
            <option>COMANDANTE</option>
            <option>ADMIN</option>
          </select>

          <select
            className="input"
            value={validadeDias}
            onChange={(e) => setValidadeDias(e.target.value)}
          >
            <option value="1">Validade: 24 horas</option>
            <option value="2">Validade: 48 horas</option>
            <option value="7">Validade: 7 dias</option>
            <option value="15">Validade: 15 dias</option>
          </select>

          <input
            className="input"
            type="number"
            min="1"
            placeholder="Limite de uso"
            value={limiteUso}
            onChange={(e) => setLimiteUso(e.target.value)}
          />
        </div>

        <button
          type="button"
          onClick={gerarConvite}
          className="bg-green-700 hover:bg-green-800 px-5 py-3 rounded-xl font-bold flex items-center gap-2"
        >
          <Plus size={18} />
          Gerar Convite
        </button>
      </div>

      <div className="painel-premium p-6">
        <div className="flex items-center justify-between gap-3 mb-5">
          <h2 className="text-xl font-black text-white">Convites Gerados</h2>

          <button
            onClick={carregarConvites}
            className="bg-blue-700 hover:bg-blue-800 px-4 py-2 rounded-xl font-bold flex items-center gap-2"
          >
            <RefreshCw size={16} />
            Atualizar
          </button>
        </div>

        {carregando ? (
          <p className="text-slate-400">Carregando convites...</p>
        ) : convites.length === 0 ? (
          <p className="text-slate-400">Nenhum convite gerado.</p>
        ) : (
          <div className="space-y-3">
            {convites.map((convite) => (
              <div
                key={convite.id}
                className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4"
              >
                <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-3">
                  <div>
                    <p className="text-white font-black">
                      Perfil: {convite.perfil}
                    </p>

                    <p className="text-slate-400 text-sm">
                      Usos: {convite.usos}/{convite.limite_uso} • Expira em:{" "}
                      {new Date(convite.expira_em).toLocaleString("pt-BR")}
                    </p>

                    <p className="text-slate-500 text-xs break-all mt-1">
                      {linkConvite(convite.token)}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <span
                      className={`rounded-full px-3 py-2 text-xs font-bold ${
                        convite.ativo
                          ? "bg-green-700 text-green-100"
                          : "bg-red-700 text-red-100"
                      }`}
                    >
                      {convite.ativo ? "ATIVO" : "INATIVO"}
                    </span>

                    <button
                      onClick={() => copiar(convite.token)}
                      className="bg-blue-700 hover:bg-blue-800 px-3 py-2 rounded-lg text-xs font-bold flex items-center gap-1"
                    >
                      <Copy size={14} />
                      Copiar
                    </button>

                    {convite.ativo && (
                      <button
                        onClick={() => desativarConvite(convite.id)}
                        className="bg-red-700 hover:bg-red-800 px-3 py-2 rounded-lg text-xs font-bold"
                      >
                        Desativar
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}