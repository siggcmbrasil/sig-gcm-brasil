"use client";

import {
  Check,
  RotateCcw,
  X,
} from "lucide-react";
import {
  useCallback,
  useState,
} from "react";
import Cropper, {
  type Area,
} from "react-easy-crop";

type CropFotoProps = {
  aberto: boolean;
  imagem: string;
  onCancelar: () => void;
  onConfirmar: (
    areaPixels: Area
  ) => void;
};

export default function CropFoto({
  aberto,
  imagem,
  onCancelar,
  onConfirmar,
}: CropFotoProps) {
  const [crop, setCrop] =
    useState({
      x: 0,
      y: 0,
    });

  const [zoom, setZoom] =
    useState(1);

  const [
    areaRecortada,
    setAreaRecortada,
  ] = useState<Area | null>(null);

  const aoFinalizarRecorte =
    useCallback(
      (
        _area: Area,
        areaPixels: Area
      ) => {
        setAreaRecortada(
          areaPixels
        );
      },
      []
    );

  if (!aberto) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/90 p-4 backdrop-blur-md">
      <div className="flex max-h-[92dvh] w-full max-w-3xl flex-col overflow-hidden rounded-3xl border border-cyan-500/30 bg-slate-950 shadow-2xl">
        <header className="flex items-center justify-between border-b border-white/10 p-5">
          <div>
            <h2 className="text-xl font-black text-white">
              Ajustar foto
            </h2>

            <p className="text-sm text-slate-400">
              Posicione o rosto dentro
              da área circular.
            </p>
          </div>

          <button
            type="button"
            onClick={onCancelar}
            className="rounded-full border border-white/10 bg-white/5 p-3 text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </header>

        <div className="relative h-[55dvh] min-h-[360px] bg-black">
          <Cropper
            image={imagem}
            crop={crop}
            zoom={zoom}
            aspect={1}
            cropShape="round"
            showGrid={false}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={
              aoFinalizarRecorte
            }
          />
        </div>

        <footer className="space-y-4 border-t border-white/10 p-5">
          <div>
            <label className="text-sm font-bold text-slate-300">
              Zoom
            </label>

            <input
              type="range"
              min={1}
              max={3}
              step={0.05}
              value={zoom}
              onChange={(event) =>
                setZoom(
                  Number(
                    event.target.value
                  )
                )
              }
              className="mt-2 w-full accent-cyan-400"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => {
                setCrop({
                  x: 0,
                  y: 0,
                });

                setZoom(1);
              }}
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 font-bold text-white"
            >
              <RotateCcw className="h-5 w-5" />
              Redefinir
            </button>

            <button
              type="button"
              disabled={!areaRecortada}
              onClick={() => {
                if (areaRecortada) {
                  onConfirmar(
                    areaRecortada
                  );
                }
              }}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-cyan-500 px-4 py-3 font-black text-slate-950 disabled:opacity-50"
            >
              <Check className="h-5 w-5" />
              Confirmar
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
}