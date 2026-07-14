"use client";

import { useRef, useState } from "react";
import {
  Camera,
  Crosshair,
  Play,
  Save,
  StopCircle,
  Target,
} from "lucide-react";

type Disparo = {
  id: number;
  x: number;
  y: number;
  pontos: number;
  tempo: string;
};

export default function NovoTreinoTiroPage() {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const [cameraAtiva, setCameraAtiva] = useState(false);
  const [treinoAtivo, setTreinoAtivo] = useState(false);
  const [disparos, setDisparos] = useState<Disparo[]>([]);

  const iniciarCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "environment",
        },
        audio: false,
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      setCameraAtiva(true);
    } catch (error) {
      alert("Não foi possível acessar a câmera.");
      console.error(error);
    }
  };

  const iniciarTreino = () => {
    setDisparos([]);
    setTreinoAtivo(true);
  };

  const finalizarTreino = () => {
    setTreinoAtivo(false);
  };

  const simularDisparo = () => {
    const novo: Disparo = {
      id: Date.now(),
      x: Math.floor(Math.random() * 220) + 40,
      y: Math.floor(Math.random() * 220) + 40,
      pontos: Math.floor(Math.random() * 4) + 7,
      tempo: `${(Math.random() * 2 + 0.4).toFixed(2)}s`,
    };

    setDisparos((atual) => [...atual, novo]);
  };

  const totalPontos = disparos.reduce((total, item) => total + item.pontos, 0);

  return (
    <main className="min-h-screen bg-slate-950 text-white p-4 md:p-6 pb-24">
      <div className="max-w-7xl mx-auto space-y-5">
        <section className="rounded-3xl border border-emerald-500/20 bg-gradient-to-br from-slate-900 to-slate-950 p-5 shadow-2xl">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-2xl bg-emerald-500/10 border border-emerald-400/30 flex items-center justify-center">
              <Target className="text-emerald-400" size={28} />
            </div>

            <div>
              <h1 className="text-2xl md:text-3xl font-bold">Novo Treino</h1>
              <p className="text-sm text-slate-400">
                Treinamento com câmera, alvo e registro dos disparos.
              </p>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 xl:grid-cols-3 gap-5">
          <div className="xl:col-span-1 rounded-3xl border border-white/10 bg-white/[0.03] p-5 space-y-4">
            <h2 className="font-bold text-lg">Dados do Treino</h2>

            <Campo label="Tipo de arma">
              <select className="input-tiro">
                <option>Pistola</option>
                <option>Revólver</option>
                <option>Carabina</option>
                <option>Espingarda</option>
                <option>Fuzil</option>
                <option>Livre</option>
              </select>
            </Campo>

            <Campo label="Modo">
              <select className="input-tiro">
                <option>Precisão</option>
                <option>Velocidade</option>
                <option>Reação</option>
                <option>Tático</option>
                <option>Múltiplos alvos</option>
              </select>
            </Campo>

            <Campo label="Distância">
              <select className="input-tiro">
                <option>2 metros</option>
                <option>3 metros</option>
                <option>5 metros</option>
                <option>7 metros</option>
                <option>10 metros</option>
                <option>15 metros</option>
                <option>25 metros</option>
              </select>
            </Campo>

            <Campo label="Quantidade de disparos">
              <select className="input-tiro">
                <option>5 disparos</option>
                <option>10 disparos</option>
                <option>15 disparos</option>
                <option>20 disparos</option>
                <option>30 disparos</option>
                <option>50 disparos</option>
              </select>
            </Campo>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                onClick={iniciarCamera}
                className="rounded-2xl bg-blue-500 px-4 py-3 font-bold text-white hover:bg-blue-400 transition flex items-center justify-center gap-2"
              >
                <Camera size={18} />
                Câmera
              </button>

              {!treinoAtivo ? (
                <button
                  onClick={iniciarTreino}
                  className="rounded-2xl bg-emerald-500 px-4 py-3 font-bold text-slate-950 hover:bg-emerald-400 transition flex items-center justify-center gap-2"
                >
                  <Play size={18} />
                  Iniciar
                </button>
              ) : (
                <button
                  onClick={finalizarTreino}
                  className="rounded-2xl bg-red-500 px-4 py-3 font-bold text-white hover:bg-red-400 transition flex items-center justify-center gap-2"
                >
                  <StopCircle size={18} />
                  Parar
                </button>
              )}
            </div>

            <button
              onClick={simularDisparo}
              disabled={!treinoAtivo}
              className="w-full rounded-2xl bg-yellow-400 px-4 py-3 font-bold text-slate-950 hover:bg-yellow-300 transition disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <Crosshair size={18} />
              Simular disparo
            </button>

            <button className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 font-bold text-white hover:bg-white/10 transition flex items-center justify-center gap-2">
              <Save size={18} />
              Salvar Treino
            </button>
          </div>

          <div className="xl:col-span-2 rounded-3xl border border-white/10 bg-black overflow-hidden">
            <div className="relative aspect-video bg-slate-900 flex items-center justify-center">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="absolute inset-0 h-full w-full object-cover opacity-60"
              />

              {!cameraAtiva && (
                <div className="absolute text-center text-slate-400">
                  <Camera className="mx-auto mb-2" size={42} />
                  <p>Câmera ainda não iniciada</p>
                </div>
              )}

              <div className="relative h-[300px] w-[300px] rounded-full border-4 border-white/70 flex items-center justify-center">
                <div className="absolute h-[240px] w-[240px] rounded-full border border-white/50" />
                <div className="absolute h-[180px] w-[180px] rounded-full border border-white/50" />
                <div className="absolute h-[120px] w-[120px] rounded-full border border-white/50" />
                <div className="absolute h-[60px] w-[60px] rounded-full border border-emerald-400" />
                <div className="absolute h-3 w-3 rounded-full bg-emerald-400" />

                {disparos.map((d) => (
                  <div
                    key={d.id}
                    className="absolute h-4 w-4 rounded-full bg-red-500 border-2 border-white shadow-lg"
                    style={{
                      left: d.x,
                      top: d.y,
                    }}
                    title={`${d.pontos} pontos`}
                  />
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Indicador titulo="Disparos" valor={String(disparos.length)} />
          <Indicador titulo="Pontuação" valor={String(totalPontos)} />
          <Indicador
            titulo="Média"
            valor={
              disparos.length
                ? `${(totalPontos / disparos.length).toFixed(1)}`
                : "0"
            }
          />
          <Indicador titulo="Status" valor={treinoAtivo ? "ATIVO" : "PARADO"} />
        </section>

        <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
          <h2 className="font-bold text-lg mb-4">Disparos Registrados</h2>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-slate-400 border-b border-white/10">
                <tr>
                  <th className="text-left py-3">#</th>
                  <th className="text-left py-3">Pontos</th>
                  <th className="text-left py-3">Tempo</th>
                  <th className="text-left py-3">Coordenada X</th>
                  <th className="text-left py-3">Coordenada Y</th>
                </tr>
              </thead>

              <tbody>
                {disparos.map((d, index) => (
                  <tr key={d.id} className="border-b border-white/5">
                    <td className="py-3">{index + 1}</td>
                    <td className="py-3 font-bold text-emerald-400">
                      {d.pontos}
                    </td>
                    <td className="py-3">{d.tempo}</td>
                    <td className="py-3">{d.x}</td>
                    <td className="py-3">{d.y}</td>
                  </tr>
                ))}

                {disparos.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-500">
                      Nenhum disparo registrado ainda.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      <style jsx global>{`
        .input-tiro {
          width: 100%;
          border-radius: 1rem;
          border: 1px solid rgba(255, 255, 255, 0.1);
          background: rgba(15, 23, 42, 0.9);
          padding: 0.75rem 1rem;
          color: white;
          outline: none;
        }

        .input-tiro:focus {
          border-color: rgba(52, 211, 153, 0.7);
        }
      `}</style>
    </main>
  );
}

function Campo({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="space-y-2 block">
      <span className="text-sm text-slate-400">{label}</span>
      {children}
    </label>
  );
}

function Indicador({ titulo, valor }: { titulo: string; valor: string }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
      <p className="text-sm text-slate-400">{titulo}</p>
      <strong className="text-2xl font-bold">{valor}</strong>
    </div>
  );
}