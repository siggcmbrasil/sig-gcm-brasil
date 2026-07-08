"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { QRCodeCanvas } from "qrcode.react";
import {
  ArrowLeft,
  Building2,
  MapPin,
  Printer,
  QrCode,
  Save,
  Search,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

type LocalCadastrado = {
  id: number;
  nome: string;
  tipo: string | null;
  endereco: string | null;
  referencia: string | null;
  latitude: number | null;
  longitude: number | null;
  raio_metros: number | null;
};

export default function QrCodeVisitaPage() {
  const [nomeLocal, setNomeLocal] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [pontoId, setPontoId] = useState<number | null>(null);
  const [salvando, setSalvando] = useState(false);

  const [locais, setLocais] = useState<LocalCadastrado[]>([]);
  const [busca, setBusca] = useState("");
  const [carregandoLocais, setCarregandoLocais] = useState(false);
  const [brasaoGuarda, setBrasaoGuarda] = useState("");
  const [brasaoMunicipio, setBrasaoMunicipio] = useState("");

  const usuario =
    typeof window !== "undefined"
      ? JSON.parse(localStorage.getItem("usuarioLogado") || "null")
      : null;

  const url = pontoId
    ? `https://siggcmbrasil.com.br/sistema/patrulhamento/visitas/checkin?ponto=${pontoId}`
    : "";

  const locaisFiltrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();

    if (!termo) return locais.slice(0, 20);

    return locais
      .filter((local) => {
        const texto = [
          local.nome,
          local.tipo,
          local.endereco,
          local.referencia,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        return texto.includes(termo);
      })
      .slice(0, 30);
  }, [busca, locais]);

  async function carregarLocais() {
    if (!usuario?.municipio_id) return;

    setCarregandoLocais(true);

    const { data, error } = await supabase
      .from("locais")
      .select(
        "id, nome, tipo, endereco, referencia, latitude, longitude, raio_metros"
      )
      .eq("municipio_id", Number(usuario.municipio_id))
      .eq("ativo", true)
      .order("nome", { ascending: true });

    setCarregandoLocais(false);

    if (error) {
      console.error("Erro ao carregar locais:", {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint,
      });
      alert("Erro ao carregar locais cadastrados.");
      return;
    }

    setLocais((data || []) as LocalCadastrado[]);
  }

  async function carregarBrasaoGuarda() {
  if (!usuario?.municipio_id) return;

  const { data, error } = await supabase
    .from("municipios")
    .select("brasao_gcm, emblema_url, escudo_gcm, brasao")
    .eq("id", Number(usuario.municipio_id))
    .single();

  if (error) {
    console.error("Erro ao carregar brasão da Guarda:", error);
    return;
  }

  setBrasaoGuarda(
    data?.brasao_gcm ||
      data?.emblema_url ||
      data?.escudo_gcm ||
      data?.brasao ||
      ""
  );
}

 useEffect(() => {
  void carregarLocais();
  void carregarBrasaoGuarda();
}, []);

  useEffect(() => {
  async function carregarBrasao() {
    if (!usuario?.municipio_id) return;

    const { data } = await supabase
      .from("municipios")
      .select("brasao_url")
      .eq("id", usuario.municipio_id)
      .single();

    if (data?.brasao_url) {
      setBrasaoMunicipio(data.brasao_url);
    }
  }

  void carregarBrasao();
}, []);

  function usarLocal(local: LocalCadastrado) {
    setNomeLocal(local.nome || "");
    setLatitude(local.latitude ? String(local.latitude) : "");
    setLongitude(local.longitude ? String(local.longitude) : "");
    setPontoId(null);

    if (!local.latitude || !local.longitude) {
      alert(
        "Este local não possui latitude/longitude cadastrada. Capture a localização antes de gerar o QR Code."
      );
    }
  }

  function pegarLocalizacao() {
    if (!navigator.geolocation) {
      alert("Geolocalização não disponível neste dispositivo.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLatitude(String(pos.coords.latitude));
        setLongitude(String(pos.coords.longitude));
      },
      () => alert("Não foi possível obter a localização."),
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      }
    );
  }

  async function salvarPonto() {
    if (!usuario?.municipio_id) {
      alert("Município não identificado.");
      return;
    }

    if (!nomeLocal || !latitude || !longitude) {
      alert("Informe o nome do local e a localização.");
      return;
    }

    setSalvando(true);

    const { data, error } = await supabase
      .from("pontos_ronda")
      .insert({
        municipio_id: Number(usuario.municipio_id),
        nome_local: nomeLocal,
        latitude: Number(latitude),
        longitude: Number(longitude),
        obrigatorio: true,
        ordem: 1,
        plano_id: null,
      })
      .select("id")
      .single();

    setSalvando(false);

    if (error) {
      console.error("Erro ao salvar ponto:", {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint,
      });
      alert(error.message);
      return;
    }

    setPontoId(data.id);
    alert("Ponto salvo. QR Code gerado.");
  }

  function imprimirQrCode() {
  const canvas = document.querySelector(".qr-preview canvas") as HTMLCanvasElement | null;

  if (!canvas || !pontoId) {
    alert("Gere o QR Code antes de imprimir.");
    return;
  }

  const qrImagem = canvas.toDataURL("image/png");

  const janela = window.open("", "_blank", "width=900,height=1200");

  if (!janela) {
    alert("Permita pop-ups para imprimir o QR Code.");
    return;
  }

  janela.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>QR Code SIG-GCM Brasil</title>
        <style>
          @page {
            size: A4 portrait;
            margin: 0;
          }

          html, body {
            margin: 0;
            padding: 0;
            width: 210mm;
            height: 297mm;
            overflow: hidden;
            background: white;
            font-family: Arial, sans-serif;
          }

          .pagina {
            width: 210mm;
            height: 297mm;
            box-sizing: border-box;
            padding: 18mm;
            display: flex;
            flex-direction: column;
            align-items: center;
            text-align: center;
            position: relative;
            overflow: hidden;
          }

          .marca {
            position: absolute;
            inset: 0;
            display: flex;
            align-items: center;
            justify-content: center;
            opacity: 0.05;
            z-index: 0;
          }

          .marca img {
            width: 115mm;
            height: 115mm;
            object-fit: contain;
          }

          .conteudo {
            position: relative;
            z-index: 2;
          }

          .topo {
            display: flex;
            justify-content: center;
            align-items: center;
            gap: 18px;
            margin-bottom: 8mm;
          }

          .topo img {
            width: 24mm;
            height: 24mm;
            object-fit: contain;
          }

          h1 {
            font-size: 22px;
            margin: 0;
            font-weight: 900;
          }

          h2 {
            font-size: 14px;
            margin: 3mm 0 8mm;
            font-weight: 700;
          }

          .qr {
            width: 95mm;
            height: 95mm;
            object-fit: contain;
          }

          .local {
            margin-top: 8mm;
            font-size: 15px;
            font-weight: 700;
          }

          .url {
            margin-top: 2mm;
            font-size: 8px;
            max-width: 170mm;
            word-break: break-all;
          }
        </style>
      </head>

      <body>
        <div class="pagina">
          <div class="marca">
            <img src="/brasoes/sig-gcm-logo.png" />
          </div>

          <div class="conteudo">
            <div class="topo">
              <img src="/brasoes/sig-gcm-logo.png" />
              ${brasaoGuarda ? `<img src="${brasaoGuarda}" />` : ""}
            </div>

            <h1>SIG-GCM Brasil</h1>
            <h2>QR Code de Check-in de Visita</h2>

            <img class="qr" src="${qrImagem}" />

            <div class="local">${nomeLocal}</div>
            <div class="url">${url}</div>
          </div>
        </div>

        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
            }, 300);
          };
        </script>
      </body>
    </html>
  `);

  janela.document.close();
}

  return (
    <main className="print-page min-h-screen bg-[#07152E] p-4 md:p-8 text-white">
      <div className="mx-auto max-w-6xl space-y-6">
        <Link
          href="/sistema/patrulhamento/visitas"
          className="inline-flex items-center gap-2 text-sm text-slate-300 hover:text-white"
        >
          <ArrowLeft size={18} />
          Voltar para Visitas
        </Link>

        <section className="rounded-2xl border border-[#C9A227]/40 bg-[#0D1B34] p-6">
          <h1 className="flex items-center gap-3 text-3xl font-black">
            <QrCode className="text-[#C9A227]" />
            Cadastrar Ponto e Gerar QR Code
          </h1>

          <p className="mt-2 text-slate-300">
            Pesquise um local cadastrado, use os dados dele e gere o QR Code de
            check-in da visita.
          </p>
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-5">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <h2 className="mb-4 text-xl font-black">
                Locais cadastrados
              </h2>

              <div className="relative mb-4">
                <Search
                  size={18}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  className="w-full rounded-xl border border-[#C9A227]/40 bg-slate-950 py-3 pl-11 pr-4 text-white outline-none placeholder:text-slate-500 focus:border-[#C9A227]"
                  placeholder="Pesquisar escola, órgão, povoado, comércio..."
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                />
              </div>

              {carregandoLocais ? (
                <p className="text-slate-300">Carregando locais...</p>
              ) : locaisFiltrados.length === 0 ? (
                <p className="text-slate-400">
                  Nenhum local encontrado.
                </p>
              ) : (
                <div className="max-h-[520px] space-y-3 overflow-y-auto pr-1">
                  {locaisFiltrados.map((local) => (
                    <button
                      key={local.id}
                      type="button"
                      onClick={() => usarLocal(local)}
                      className="w-full rounded-2xl border border-white/10 bg-slate-950 p-4 text-left transition hover:border-[#C9A227] hover:bg-[#0D1B34]"
                    >
                      <div className="flex items-start gap-3">
                        <div className="rounded-xl bg-[#C9A227]/15 p-2 text-[#C9A227]">
                          <Building2 size={22} />
                        </div>

                        <div className="min-w-0 flex-1">
                          <p className="font-black text-white">
                            {local.nome}
                          </p>

                          <p className="mt-1 text-xs text-slate-400">
                            {local.tipo || "Tipo não informado"}
                          </p>

                          <p className="mt-1 text-sm text-slate-300">
                            {local.endereco || local.referencia || "Sem endereço"}
                          </p>

                          <p className="mt-2 text-xs text-slate-500">
                            Lat: {local.latitude || "-"} • Long:{" "}
                            {local.longitude || "-"} • Raio:{" "}
                            {local.raio_metros || 200}m
                          </p>

                          <p className="mt-2 text-xs font-bold text-[#C9A227]">
                            Usar este local
                          </p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-5">
            <div className="space-y-4 rounded-2xl border border-white/10 bg-white/5 p-5">
              <h2 className="text-xl font-black">
                Dados do ponto de visita
              </h2>

              <div>
                <label className="text-sm font-bold">Nome do local</label>
                <input
                  className="mt-1 w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 outline-none focus:border-[#C9A227]"
                  placeholder="Ex: Escola Municipal João Paulo"
                  value={nomeLocal}
                  onChange={(e) => setNomeLocal(e.target.value)}
                />
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <div>
                  <label className="text-sm font-bold">Latitude</label>
                  <input
                    className="mt-1 w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 outline-none focus:border-[#C9A227]"
                    value={latitude}
                    onChange={(e) => setLatitude(e.target.value)}
                  />
                </div>

                <div>
                  <label className="text-sm font-bold">Longitude</label>
                  <input
                    className="mt-1 w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 outline-none focus:border-[#C9A227]"
                    value={longitude}
                    onChange={(e) => setLongitude(e.target.value)}
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={pegarLocalizacao}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-blue-400 px-4 py-3 font-bold text-blue-200 hover:bg-blue-500/10"
              >
                <MapPin size={18} />
                Usar minha localização atual
              </button>

              <button
                type="button"
                onClick={salvarPonto}
                disabled={salvando}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#C9A227] px-4 py-3 font-black text-black hover:bg-yellow-400 disabled:opacity-50"
              >
                <Save size={18} />
                {salvando ? "Salvando..." : "Salvar ponto e gerar QR Code"}
              </button>
            </div>

            <div className="qr-preview relative overflow-hidden rounded-2xl border border-white/10 bg-white p-5 text-black">
              {!pontoId ? (
                <div className="flex min-h-[360px] flex-col items-center justify-center text-center text-slate-600">
                  <QrCode size={70} />
                  <p className="mt-4 font-bold">
                    Salve um ponto para gerar o QR Code.
                  </p>
                </div>
              ) : (
                <div className="flex flex-col items-center">
                  <div className="flex items-center justify-center gap-6 mb-6">
<img
  src="/brasoes/sig-gcm-logo.png"
  alt="SIG-GCM Brasil"
  className="h-24 w-24 object-contain"
/>

{brasaoGuarda && (
  <img
    src={brasaoGuarda}
    alt="Brasão da Guarda Municipal"
    className="h-24 w-24 object-contain"
  />
)}
</div>
                  
<div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-[0.05]">
 <img
  src="/brasoes/sig-gcm-logo.png"
  alt=""
  className="h-[260px] w-[260px] object-contain"
/>
</div>
                  <h2 className="text-xl font-black">SIG-GCM Brasil</h2>

                  <p className="mb-4 text-sm font-bold">
                    QR Code de Check-in de Visita
                  </p>

                  <QRCodeCanvas value={url} size={220} level="H" includeMargin />

                  <p className="mt-4 text-center text-sm">{nomeLocal}</p>

                  <p className="mt-2 break-all text-center text-xs">{url}</p>

                  <button
  type="button"
  onClick={imprimirQrCode}
  className="mt-5 flex items-center gap-2 rounded-xl bg-black px-5 py-3 font-bold text-white"
>
  <Printer size={18} />
  Imprimir QR Code
</button>

                </div>
              )}
            </div>
          </div>
        </section>
      </div>

    </main>
  );
}