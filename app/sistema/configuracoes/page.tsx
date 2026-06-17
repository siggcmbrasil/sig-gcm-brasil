"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import ProtecaoPerfil from "@/components/ProtecaoPerfil";
import Link from "next/link";
import ProtecaoModulo from "@/components/ProtecaoModulo";

type Municipio = {
  id: number;
  nome: string;
  estado: string;
  ativo: boolean;
};

type ConfiguracaoSistema = {
  id: number;
  municipio_padrao_id: number | null;
};

type Aviso = {
  id: number;
  titulo: string;
  descricao: string;
  criado_em: string;
};

export default function Configuracoes() {
  const [avisos, setAvisos] = useState<Aviso[]>([]);
  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [carregando, setCarregando] = useState(true);
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

  async function carregarAvisos() {
    setCarregando(true);

    const { data, error } = await supabase
      .from("avisos")
      .select("*")
      .order("id", { ascending: false });

    if (error) {
      console.error(error);
      alert("Erro ao carregar avisos.");
      setCarregando(false);
      return;
    }

    setAvisos(data || []);
    setCarregando(false);
  }

  async function salvarAviso() {
    if (!titulo || !descricao) {
      alert("Preencha título e descrição.");
      return;
    }

    const { error } = await supabase.from("avisos").insert([
      {
        titulo,
        descricao,
      },
    ]);

    if (error) {
      console.error(error);
      alert("Erro ao salvar aviso.");
      return;
    }

    alert("Aviso cadastrado com sucesso!");

    setTitulo("");
    setDescricao("");
    carregarAvisos();
  }

  async function excluirAviso(id: number) {
    const confirmar = confirm("Tem certeza que deseja excluir este aviso?");

    if (!confirmar) return;

    const { error } = await supabase
      .from("avisos")
      .delete()
      .eq("id", id);

    if (error) {
      console.error(error);
      alert("Erro ao excluir aviso.");
      return;
    }

    alert("Aviso excluído com sucesso.");
    carregarAvisos();
  }

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
  setMunicipioPadraoId(configData?.municipio_padrao_id?.toString() || "");
}

async function salvarMunicipioPadrao() {
  if (!municipioPadraoId) {
    alert("Selecione um município.");
    return;
  }

  const { error } = await supabase
    .from("configuracoes_sistema")
    .update({
      municipio_padrao_id: Number(municipioPadraoId),
    })
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
  const { error } = await supabase
    .from("municipios")
    .update({
      nome_guarda: nomeGuarda,
      comandante: comandante,
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

async function ativarNotificacoes() {
  if (!("serviceWorker" in navigator)) {
    alert("Este navegador não suporta notificações.");
    return;
  }

  const permissao = await Notification.requestPermission();

  if (permissao !== "granted") {
    alert("Permissão de notificação negada.");
    return;
  }

  const registro = await navigator.serviceWorker.register("/sw.js");

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

  const usuario = JSON.parse(
    localStorage.getItem("usuarioLogado") || "{}"
  );

  await fetch("/api/push/subscribe", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      ...subscription.toJSON(),
      municipio_id: usuario.municipio_id || 1,
      usuario_id: usuario.id,
      perfil: usuario.perfil,
    }),
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

async function criarMunicipioCompleto() {
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

    const { data } = supabase.storage
      .from("brasoes")
      .getPublicUrl(caminho);

    urlPrefeitura = data.publicUrl;
  }

  if (arquivoGcm) {
    const caminho = `${municipioCriado.id}/brasao-gcm.png`;

    await supabase.storage
      .from("brasoes")
      .upload(caminho, arquivoGcm, { upsert: true });

    const { data } = supabase.storage
      .from("brasoes")
      .getPublicUrl(caminho);

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

  useEffect(() => {
  carregarAvisos();
  carregarConfiguracoes();
}, []);

  return (
  <ProtecaoModulo modulo="configuracoes">
    <div className="p-6">
      <header className="border-b border-slate-800 pb-5 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">

  <Link href="/sistema/perfil" className="card hover:scale-105 transition">
  <div className="text-5xl mb-3">👤</div>
  <h2 className="text-xl font-bold">Meu Perfil</h2>
</Link>

<Link href="/sistema/notificacoes" className="card hover:scale-105 transition">
  <div className="text-5xl mb-3">🔔</div>
  <h2 className="text-xl font-bold">Notificações</h2>
</Link>

<Link href="/sistema/sobre" className="card hover:scale-105 transition">
  <div className="text-5xl mb-3">ℹ️</div>
  <h2 className="text-xl font-bold">Sobre o Sistema</h2>
</Link>

  </div>
        <h1 className="text-3xl font-bold">Configurações</h1>
        <p className="text-slate-400">
          Gerenciamento dos avisos operacionais do dashboard.
        </p>
      </header>

      <section className="card mb-6 max-w-2xl">
  <h2 className="text-xl font-bold mb-4">
    Cadastrar Novo Município
  </h2>

  <div className="space-y-4">
    <input
      className="input"
      placeholder="Nome do Município"
      value={novoMunicipio}
      onChange={(e) => setNovoMunicipio(e.target.value)}
    />

    <input
      className="input"
      placeholder="Estado"
      value={novoEstado}
      onChange={(e) => setNovoEstado(e.target.value)}
    />

    <input
      className="input"
      placeholder="Nome da Guarda"
      value={nomeGuarda}
      onChange={(e) => setNomeGuarda(e.target.value)}
    />

    <input
      className="input"
      placeholder="Nome do Comandante"
      value={comandante}
      onChange={(e) => setComandante(e.target.value)}
    />

    <div>
      <label className="label">Brasão da Prefeitura</label>
      <input
        type="file"
        accept="image/*"
        onChange={(e) =>
          setArquivoPrefeitura(e.target.files?.[0] || null)
        }
      />
    </div>

    <div>
      <label className="label">Brasão da GCM</label>
      <input
        type="file"
        accept="image/*"
        onChange={(e) =>
          setArquivoGcm(e.target.files?.[0] || null)
        }
      />
    </div>

        <button
      type="button"
      onClick={criarMunicipioCompleto}
      className="btn-primary w-full"
    >
      Cadastrar Município
    </button>
  </div>
</section>

      <section className="card mb-6 max-w-2xl">
  <h2 className="text-xl font-bold mb-4">Município Padrão</h2>

  <select
    className="input"
    value={municipioPadraoId}
    onChange={(e) => setMunicipioPadraoId(e.target.value)}
  >
    <option value="">Selecione o município</option>

    {municipios.map((m) => (
      <option key={m.id} value={m.id}>
        {m.nome} - {m.estado}
      </option>
    ))}
  </select>

  <button
    type="button"
    onClick={salvarMunicipioPadrao}
    className="btn-primary mt-4"
  >
    Salvar Município Padrão
  </button>
</section>

<section className="card mb-6 max-w-2xl">
  <h2 className="text-xl font-bold mb-4">
    Dados Institucionais
  </h2>

  <div className="space-y-4">

    <input
      className="input"
      placeholder="Nome da Guarda"
      value={nomeGuarda}
      onChange={(e) => setNomeGuarda(e.target.value)}
    />

    <input
      className="input"
      placeholder="Nome do Comandante"
      value={comandante}
      onChange={(e) => setComandante(e.target.value)}
    />

    <input
      className="input"
      placeholder="/brasoes/brasao-prefeitura.png"
      value={brasaoPrefeitura}
      onChange={(e) => setBrasaoPrefeitura(e.target.value)}
    />

    <input
      className="input"
      placeholder="/brasoes/brasao-gcm.png"
      value={brasaoGcm}
      onChange={(e) => setBrasaoGcm(e.target.value)}
    />

    <button
  type="button"
  onClick={salvarDadosInstitucionais}
  className="btn-primary w-full"
>
  Salvar Dados Institucionais
</button>

  </div>
</section>
            </div>
  </ProtecaoModulo>
  );
}