"use client";

import { useEffect, useState } from "react";
import ProtecaoModulo from "@/components/ProtecaoModulo";
import { supabase } from "@/lib/supabase";
import { registrarAuditoria } from "@/lib/auditoria";

export default function InstitucionalPage() {
  const [nomeGuarda, setNomeGuarda] = useState("");
  const [comandante, setComandante] = useState("");
  const [brasaoPrefeitura, setBrasaoPrefeitura] = useState("");
  const [brasaoGcm, setBrasaoGcm] = useState("");
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);

  const usuario =
    typeof window !== "undefined"
      ? JSON.parse(localStorage.getItem("usuarioLogado") || "{}")
      : {};

  useEffect(() => {
    carregarDadosMunicipio();
  }, []);

  async function carregarDadosMunicipio() {
    if (!usuario?.municipio_id) {
      alert("Município não identificado.");
      setCarregando(false);
      return;
    }

    const { data, error } = await supabase
      .from("municipios")
      .select(`
        id,
        nome,
        estado,
        nome_guarda,
        comandante,
        brasao_prefeitura,
        brasao_gcm
      `)
      .eq("id", usuario.municipio_id)
      .single();

    if (error || !data) {
      console.error(error);
      alert("Erro ao carregar dados institucionais.");
      setCarregando(false);
      return;
    }

    setNomeGuarda(data.nome_guarda || "");
    setComandante(data.comandante || "");
    setBrasaoPrefeitura(data.brasao_prefeitura || "");
    setBrasaoGcm(data.brasao_gcm || "");
    setCarregando(false);
  }

  async function salvarDadosInstitucionais() {
    if (!usuario?.municipio_id) {
      alert("Município não identificado.");
      return;
    }

    if (!nomeGuarda.trim()) {
      alert("Informe o nome da Guarda.");
      return;
    }

    if (!comandante.trim()) {
      alert("Informe o nome do comandante.");
      return;
    }

    setSalvando(true);

    const dados = {
      nome_guarda: nomeGuarda.trim(),
      comandante: comandante.trim(),
      brasao_prefeitura: brasaoPrefeitura.trim(),
      brasao_gcm: brasaoGcm.trim(),
    };

    const { error } = await supabase
      .from("municipios")
      .update(dados)
      .eq("id", usuario.municipio_id);

    if (error) {
      console.error(error);
      alert("Erro ao salvar dados institucionais.");
      setSalvando(false);
      return;
    }

    await registrarAuditoria({
      modulo: "Institucional",
      acao: "EDITAR_DADOS_INSTITUCIONAIS",
      descricao: "Atualizou os dados institucionais do município.",
      tabela: "municipios",
      registro_id: usuario.municipio_id,
      detalhes: dados,
    });

    setSalvando(false);
    alert("Dados institucionais salvos com sucesso.");
  }

  return (
    <ProtecaoModulo modulo="administracao">
      <section className="p-4 md:p-6 pb-24 space-y-6">
        <div className="painel-premium p-6">
          <p className="text-xs uppercase tracking-[0.25em] text-cyan-400 font-black">
            Gestão Local
          </p>

          <h1 className="text-3xl md:text-4xl font-black text-white mt-2">
            🏛️ Dados Institucionais
          </h1>

          <p className="text-slate-400 mt-2 max-w-4xl">
            Configure o nome da Guarda, comandante e brasões oficiais do seu município.
          </p>
        </div>

        {carregando ? (
          <div className="painel-premium p-6">
            <p className="text-slate-400">Carregando dados institucionais...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <section className="painel-premium p-6">
              <h2 className="text-2xl font-black text-white mb-4">
                Informações Oficiais
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="label">Nome da Guarda</label>
                  <input
                    className="input"
                    value={nomeGuarda}
                    onChange={(e) => setNomeGuarda(e.target.value)}
                    placeholder="Ex: Guarda Civil Municipal de Biritinga"
                  />
                </div>

                <div>
                  <label className="label">Comandante</label>
                  <input
                    className="input"
                    value={comandante}
                    onChange={(e) => setComandante(e.target.value)}
                    placeholder="Nome do comandante"
                  />
                </div>

                <div>
                  <label className="label">Brasão da Prefeitura</label>
                  <input
                    className="input"
                    value={brasaoPrefeitura}
                    onChange={(e) => setBrasaoPrefeitura(e.target.value)}
                    placeholder="/brasoes/biritinga-prefeitura.png"
                  />
                </div>

                <div>
                  <label className="label">Brasão da GCM</label>
                  <input
                    className="input"
                    value={brasaoGcm}
                    onChange={(e) => setBrasaoGcm(e.target.value)}
                    placeholder="/brasoes/biritinga-gcm.png"
                  />
                </div>

                <button
                  type="button"
                  onClick={salvarDadosInstitucionais}
                  disabled={salvando}
                  className="btn-primary w-full disabled:opacity-60"
                >
                  {salvando ? "Salvando..." : "Salvar Dados Institucionais"}
                </button>
              </div>
            </section>

            <section className="painel-premium p-6">
              <h2 className="text-2xl font-black text-white mb-4">
                Pré-visualização
              </h2>

              <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-5 space-y-5">
                <div className="flex items-center justify-between gap-4">
                  <div className="w-24 h-24 rounded-2xl border border-slate-700 bg-slate-900 flex items-center justify-center overflow-hidden">
                    {brasaoPrefeitura ? (
                      <img
                        src={brasaoPrefeitura}
                        alt="Brasão da Prefeitura"
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <span className="text-xs text-slate-500 text-center">
                        Prefeitura
                      </span>
                    )}
                  </div>

                  <div className="text-center flex-1">
                    <h3 className="text-xl font-black text-white">
                      {nomeGuarda || "Nome da Guarda"}
                    </h3>

                    <p className="text-slate-400 text-sm mt-1">
                      Comandante: {comandante || "Não informado"}
                    </p>
                  </div>

                  <div className="w-24 h-24 rounded-2xl border border-slate-700 bg-slate-900 flex items-center justify-center overflow-hidden">
                    {brasaoGcm ? (
                      <img
                        src={brasaoGcm}
                        alt="Brasão da GCM"
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <span className="text-xs text-slate-500 text-center">
                        GCM
                      </span>
                    )}
                  </div>
                </div>

                <p className="text-xs text-slate-500">
                  Estes dados serão usados em relatórios, PDFs, ofícios e documentos oficiais.
                </p>
              </div>
            </section>
          </div>
        )}
      </section>
    </ProtecaoModulo>
  );
}