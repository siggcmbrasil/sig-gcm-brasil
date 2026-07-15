"use client";

import {
  BatteryCharging,
  Cloud,
  CloudOff,
  Crosshair,
  RefreshCw,
  Wifi,
  WifiOff,
} from "lucide-react";
import { useEffect, useState } from "react";

type BatteryManagerLike = {
  charging: boolean;
  level: number;
  addEventListener: (event: string, listener: () => void) => void;
  removeEventListener: (event: string, listener: () => void) => void;
};

export default function MobileStatusBar({
  online,
  gpsAtivo,
  sincronizando = false,
}: {
  online: boolean;
  gpsAtivo: boolean;
  sincronizando?: boolean;
}) {
  const [bateria, setBateria] = useState<number | null>(null);
  const [carregandoBateria, setCarregandoBateria] = useState(false);

  useEffect(() => {
    let battery: BatteryManagerLike | null = null;

    async function carregarBateria() {
      try {
        const navegador = navigator as Navigator & {
          getBattery?: () => Promise<BatteryManagerLike>;
        };

        if (!navegador.getBattery) return;

        battery = await navegador.getBattery();

        const atualizar = () => {
          if (!battery) return;
          setBateria(Math.round(battery.level * 100));
          setCarregandoBateria(Boolean(battery.charging));
        };

        atualizar();
        battery.addEventListener("levelchange", atualizar);
        battery.addEventListener("chargingchange", atualizar);
      } catch {
        setBateria(null);
      }
    }

    void carregarBateria();

    return () => {
      if (!battery) return;
    };
  }, []);

  return (
    <section className="grid grid-cols-4 gap-2">
      <Status
        ativo={online}
        icone={online ? Wifi : WifiOff}
        titulo={online ? "Online" : "Offline"}
      />

      <Status
        ativo={gpsAtivo}
        icone={Crosshair}
        titulo={gpsAtivo ? "GPS ativo" : "GPS parado"}
      />

      <Status
        ativo={!sincronizando}
        icone={sincronizando ? RefreshCw : online ? Cloud : CloudOff}
        titulo={sincronizando ? "Sincronizando" : "Sincronizado"}
        girando={sincronizando}
      />

      <Status
        ativo={(bateria || 0) > 20 || carregandoBateria}
        icone={BatteryCharging}
        titulo={
          bateria === null
            ? "Bateria"
            : `${bateria}%${carregandoBateria ? " ⚡" : ""}`
        }
      />
    </section>
  );
}

function Status({
  ativo,
  icone: Icone,
  titulo,
  girando = false,
}: {
  ativo: boolean;
  icone: typeof Wifi;
  titulo: string;
  girando?: boolean;
}) {
  return (
    <div className="flex min-h-16 flex-col items-center justify-center rounded-2xl border border-slate-800 bg-slate-900/85 px-2 text-center shadow-lg">
      <Icone
        className={`h-4 w-4 ${
          girando ? "animate-spin" : ""
        } ${ativo ? "text-emerald-300" : "text-amber-300"}`}
      />

      <span className="mt-2 text-[9px] font-black uppercase tracking-wide text-slate-400">
        {titulo}
      </span>
    </div>
  );
}
