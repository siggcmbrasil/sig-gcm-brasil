
"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import ProtecaoModulo from "@/components/ProtecaoModulo";

type Municipio = {
  id: number;
  nome: string;
  estado: string;
  ativo: boolean;
};

export default function InstitucionalPage() {
  const [municipios, setMunicipios] = useState<Municipio[]>([]);
  const [municipioPadraoId, setMunicipioPadraoId] = useState("");

  const [nomeGuarda, setNomeGuarda] = useState("");
  const [comandante, setComandante] = useState("");
  const [brasaoPrefeitura, setBrasaoPrefeitura] = useState("");
  const [brasaoGcm, setBrasaoGcm] = useState("");

  const [novoMunicipio, setNovoMunicipio] = useState("");
  const [novoEstado, setNovoEstado] = useState("BA");
  const [arquivoPrefeitura, setArquivoPrefeitura] = useState<File | null>(null);
  const [arquivoGcm, setArquivoGcm] = useState<File | null>(null);

  async function carregarConfiguracoes() {
    const { data: municipiosData } = await supabase
      .from("municipios")
      .select("id, nome, estado, ativo")
      .eq("ativo", true)
      .order("nome");

    const { data: configData } = await supabase
      .from("configuracoes_sistema")
      .select("id, municipio_padrao_id")
      .order("id", { ascending: true })
      .limit(1)
      .single();

    setMunicipios(municipiosData || []);

  setMunicipioPadraoId(
    configData?.municipio_padrao_id?.toString() || ""
  );

  if (configData?.municipio_padrao_id) {
    carregarDadosMunicipio(
      configData.municipio_padrao_id
    );
  }
}


  async function salvarMunicipioPadrao() {
    if (!municipioPadraoId) {
      alert("Selecione um município.");
      return;
    }

    const { error } = await supabase
      .from("configuracoes_sistema")
      .update({ municipio_padrao_id: Number(municipioPadraoId) })
      .eq("id", 1);

    if (error) {
      console.error(error);
      alert("Erro ao salvar município padrão.");
      return;
    }

    alert("Município padrão atualizado com sucesso!");
    carregarConfiguracoes();
  }

  async function salvarDadosInstitucionais() {

if (!municipioPadraoId) {
  alert("Selecione um município.");
  return;
}

    const { error } = await supabase
      .from("municipios")
      .update({
        nome_guarda: nomeGuarda,
        comandante,
        brasao_prefeitura: brasaoPrefeitura,
        brasao_gcm: brasaoGcm,
      })
      .eq("id", Number(municipioPadraoId));

    if (error) {
      console.error(error);
      alert("Erro ao salvar.");
      return;
    }

    alert("Dados institucionais salvos com sucesso!");
  }

  async function criarMunicipioCompleto() {

if (!novoMunicipio.trim()) {
  alert("Informe o município.");
  return;
}

if (!nomeGuarda.trim()) {
  alert("Informe o nome da Guarda.");
  return;
}

    if (!novoMunicipio || !nomeGuarda || !comandante) {
      alert("Preencha município, nome da Guarda e comandante.");
      return;
    }

    const { data: municipioCriado, error: erroMunicipio } = await supabase
      .from("municipios")
      .insert([
        {
          nome: novoMunicipio,
          estado: novoEstado,
          ativo: true,
          nome_guarda: nomeGuarda,
          comandante,
        },
      ])
      .select()
      .single();

    if (erroMunicipio) {
      console.error(erroMunicipio);
      alert("Erro ao criar município.");
      return;
    }

    let urlPrefeitura = "";
    let urlGcm = "";

    if (arquivoPrefeitura) {
      const caminho = `${municipioCriado.id}/brasao-prefeitura.png`;

      await supabase.storage
        .from("brasoes")
        .upload(caminho, arquivoPrefeitura, { upsert: true });

      const { data } = supabase.storage.from("brasoes").getPublicUrl(caminho);
      urlPrefeitura = data.publicUrl;
    }

    if (arquivoGcm) {
      const caminho = `${municipioCriado.id}/brasao-gcm.png`;

      await supabase.storage
        .from("brasoes")
        .upload(caminho, arquivoGcm, { upsert: true });

      const { data } = supabase.storage.from("brasoes").getPublicUrl(caminho);
      urlGcm = data.publicUrl;
    }

    await supabase
      .from("municipios")
      .update({
        brasao_prefeitura: urlPrefeitura,
        brasao_gcm: urlGcm,
      })
      .eq("id", municipioCriado.id);

    alert("Município criado com sucesso!");

    setNovoMunicipio("");
    setNovoEstado("BA");
    setNomeGuarda("");
    setComandante("");
    setArquivoPrefeitura(null);
    setArquivoGcm(null);

    carregarConfiguracoes();
  }

  async function carregarDadosMunicipio(id: number) {
  const { data, error } = await supabase
    .from("municipios")
    .select(`
      nome_guarda,
      comandante,
      brasao_prefeitura,
      brasao_gcm
    `)
    .eq("id", id)
    .single();

  if (error || !data) return;

  setNomeGuarda(data.nome_guarda || "");
  setComandante(data.comandante || "");
  setBrasaoPrefeitura(data.brasao_prefeitura || "");
  setBrasaoGcm(data.brasao_gcm || "");
}

  useEffect(() => {
    carregarConfiguracoes();
  }, []);

  return (
    <ProtecaoModulo modulo="administracao">
      <section className="p-6 space-y-6">
        <div className="painel-premium p-6">
          <h1 className="text-4xl font-black text-white">
            🏛️ Gestão Institucional
          </h1>

          <p className="text-slate-400 mt-2">
            Municípios, brasões, comandante e dados oficiais do SIG-GCM Brasil.
          </p>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <section className="painel-premium p-6">
            <h2 className="text-2xl font-black text-white mb-4">
              Cadastrar Novo Município
            </h2>

            <div className="space-y-4">
              <input className="input" placeholder="Nome do Município" value={novoMunicipio} onChange={(e) => setNovoMunicipio(e.target.value)} />
              <input className="input" placeholder="Estado" value={novoEstado} onChange={(e) => setNovoEstado(e.target.value)} />
              <input className="input" placeholder="Nome da Guarda" value={nomeGuarda} onChange={(e) => setNomeGuarda(e.target.value)} />
              <input className="input" placeholder="Nome do Comandante" value={comandante} onChange={(e) => setComandante(e.target.value)} />

              <label className="label">Brasão da Prefeitura</label>
              <input type="file" accept="image/*" onChange={(e) => setArquivoPrefeitura(e.target.files?.[0] || null)} />

              <label className="label">Brasão da GCM</label>
              <input type="file" accept="image/*" onChange={(e) => setArquivoGcm(e.target.files?.[0] || null)} />

              <button type="button" onClick={criarMunicipioCompleto} className="btn-primary w-full">
                Cadastrar Município
              </button>
            </div>
          </section>

          <div className="space-y-6">
            <section className="painel-premium p-6">
              <h2 className="text-2xl font-black text-white mb-4">
                Município Padrão
              </h2>

              <select className="input" value={municipioPadraoId} onChange={(e) => {
  setMunicipioPadraoId(e.target.value);

  if (e.target.value) {
    carregarDadosMunicipio(Number(e.target.value));
  }
}}>
                <option value="">Selecione o município</option>
                {municipios.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.nome} - {m.estado}
                  </option>
                ))}
              </select>

              <button type="button" onClick={salvarMunicipioPadrao} className="btn-primary mt-4">
                Salvar Município Padrão
              </button>
            </section>

            <section className="painel-premium p-6">
              <h2 className="text-2xl font-black text-white mb-4">
                Dados Institucionais
              </h2>

              <div className="space-y-4">
                <input className="input" placeholder="Nome da Guarda" value={nomeGuarda} onChange={(e) => setNomeGuarda(e.target.value)} />
                <input className="input" placeholder="Nome do Comandante" value={comandante} onChange={(e) => setComandante(e.target.value)} />
                <input className="input" placeholder="/brasoes/brasao-prefeitura.png" value={brasaoPrefeitura} onChange={(e) => setBrasaoPrefeitura(e.target.value)} />
                <input className="input" placeholder="/brasoes/brasao-gcm.png" value={brasaoGcm} onChange={(e) => setBrasaoGcm(e.target.value)} />

                <button type="button" onClick={salvarDadosInstitucionais} className="btn-primary w-full">
                  Salvar Dados Institucionais
                </button>
              </div>
            </section>
          </div>
        </div>
      </section>
    </ProtecaoModulo>
  );
}