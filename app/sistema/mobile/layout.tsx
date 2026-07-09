"use client";

import { useEffect, useState } from "react";

export default function MobileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [online, setOnline] = useState(true);

  useEffect(() => {
    setOnline(navigator.onLine);

    function ficarOnline() {
      setOnline(true);
    }

    function ficarOffline() {
      setOnline(false);
    }

    window.addEventListener("online", ficarOnline);
    window.addEventListener("offline", ficarOffline);

    return () => {
      window.removeEventListener("online", ficarOnline);
      window.removeEventListener("offline", ficarOffline);
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#02060f] text-white overflow-x-hidden pt-[calc(env(safe-area-inset-top)+18px)] pb-[calc(env(safe-area-inset-bottom)+88px)]">
      {!online && (
        <div className="bg-red-600 py-2 text-center text-sm font-bold text-white">
          📡 Sem internet - modo offline ativo
        </div>
      )}

      <div className="min-h-screen">{children}</div>
    </div>
  );
}