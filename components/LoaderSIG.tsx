"use client";

export default function LoaderSIG() {
  return (
    <div className="min-h-screen bg-[#061426] flex flex-col items-center justify-center">

      <img
        src="/brasoes/sig-gcm-logo.png"
        alt="SIG-GCM Brasil"
        className="w-36 h-36 animate-pulse"
      />

      <h1 className="text-4xl font-black text-white mt-6">
        SIG-GCM BRASIL
      </h1>

      <p className="text-yellow-400 mt-2">
        Inicializando módulos...
      </p>

      <div className="w-72 h-2 bg-slate-800 rounded-full mt-8 overflow-hidden">

        <div className="h-full bg-yellow-400 animate-pulse w-2/3 rounded-full" />

      </div>

    </div>
  );
}