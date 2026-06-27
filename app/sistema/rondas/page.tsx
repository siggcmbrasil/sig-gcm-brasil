"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import {
  ShieldCheck,
  FileText,
  QrCode,
  MapPinned,
  Play,
  Trash2,
  Save,
} from "lucide-react";

export default function RondasPage() {
  const [planos, setPlanos] = useState<any[]>([]);
  const [nome, setNome] = useState("");
  const [descricao, setDescricao] = useState("");
  const [carregando, setCarregando] = useState(true);

  function pegarUsuario() {
    return JSON.parse(localStorage.getItem("usuarioLogado") || "{}");
  }

  async function carregarPlanos() {
    setCarregando(true);

    const usuario = pegarUsuario();
    const municipioId = usuario?.municipio_id;

    if (!municipioId) {
      alert("Município do usuário não identificado.");
      setCarregando(false);
      return;
    }

    const { data, error } = await supabase
      .from("planos_ronda")
      .select("*")
      .eq("municipio_id", municipioId)
      .order("id", { ascending: false });

    if (error) {
      console.error(error);
      alert("Erro ao carregar planos de ronda.");
      setCarregando(false);
      return;
    }

    setPlanos(data || []);
    setCarregando(false);
  }

  useEffect(() => {
    carregarPlanos();
  }, []);

  async function salvarPlano() {
    if (!nome.trim()) {
      alert("Informe o nome do plano.");
      return;
    }

    const usuario = pegarUsuario();
    const municipioId = usuario?.municipio_id;

    if (!municipioId) {
      alert("Município do usuário não identificado.");
      return;
    }

    const { error } = await supabase.from("planos_ronda").insert({
      municipio_id: municipioId,
      nome: nome.trim(),
      descricao: descricao.trim(),
      ativo: true,
    });

    if (error) {
      console.error("ERRO SUPABASE:", error);
      alert(error.message);
      return;
    }

    setNome("");
    setDescricao("");
    carregarPlanos();
  }

  async function excluirPlano(id: number) {
    const confirmar = confirm("Deseja realmente excluir este plano de ronda?");
    if (!confirmar) return;

    const usuario = pegarUsuario();
    const municipioId = usuario?.municipio_id;

    if (!municipioId) {
      alert("Município do usuário não identificado.");
      return;
    }

    const { error } = await supabase
      .from("planos_ronda")
      .delete()
      .eq("id", id)
      .eq("municipio_id", municipioId);

    if (error) {
      console.error(error);
      alert("Erro ao excluir plano.");
      return;
    }

    alert("Plano excluído com sucesso.");
    carregarPlanos();
  }

  return (
    <div className="p-6 text-white space-y-6">
      <div>
        <h1 className="text-3xl font-black flex items-center gap-3">
          <ShieldCheck className="text-blue-400" size={34} />
          Plano de Rondas
        </h1>

        <p className="text-slate-400 mt-1">
          Cadastre planos, pontos e execute rondas operacionais.
        </p>
      </div>

      <div className="flex flex-wrap gap-3">
        <Link
          href="/sistema/rondas/relatorio"
          className="bg-blue-700 hover:bg-blue-800 px-4 py-3 rounded-xl font-bold flex items-center gap-2"
        >
          <FileText size={18} />
          Relatório de Rondas
        </Link>

        <Link
          href="/sistema/rondas/ler-qrcode"
          className="bg-green-700 hover:bg-green-800 px-4 py-3 rounded-xl font-bold flex items-center gap-2"
        >
          <QrCode size={18} />
          Ler QR Code
        </Link>
      </div>

      <div className="painel-premium p-6 space-y-4">
        <input
          className="input"
          placeholder="Nome do plano. Ex: Ronda Escolar"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
        />

        <textarea
          className="input h-28"
          placeholder="Descrição do plano de ronda"
          value={descricao}
          onChange={(e) => setDescricao(e.target.value)}
        />

        <button
          onClick={salvarPlano}
          className="btn-primary flex items-center justify-center gap-2"
        >
          <Save size={18} />
          Salvar Plano
        </button>
      </div>

      {carregando ? (
        <div className="painel-premium p-5 text-slate-400">
          Carregando planos...
        </div>
      ) : planos.length === 0 ? (
        <div className="painel-premium p-5 text-slate-400">
          Nenhum plano de ronda cadastrado.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {planos.map((plano) => (
            <div key={plano.id} className="painel-premium p-5">
              <h2 className="text-xl font-black flex items-center gap-2">
                <ShieldCheck className="text-blue-400" size={22} />
                {plano.nome}
              </h2>

              <p className="text-slate-400 mt-2">
                {plano.descricao || "Sem descrição."}
              </p>

              <div className="flex flex-wrap gap-2 mt-4">
                <Link
                  href={`/sistema/rondas/${plano.id}`}
                  className="bg-blue-700 hover:bg-blue-800 px-3 py-2 rounded-lg font-bold text-sm flex items-center gap-2"
                >
                  <MapPinned size={16} />
                  Pontos
                </Link>

                <Link
                  href={`/sistema/rondas/execucao/${plano.id}`}
                  className="bg-green-700 hover:bg-green-800 px-3 py-2 rounded-lg font-bold text-sm flex items-center gap-2"
                >
                  <Play size={16} />
                  Executar
                </Link>

                <button
                  type="button"
                  onClick={() => excluirPlano(plano.id)}
                  className="bg-red-700 hover:bg-red-800 px-3 py-2 rounded-lg font-bold text-sm flex items-center gap-2"
                >
                  <Trash2 size={16} />
                  Excluir
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}