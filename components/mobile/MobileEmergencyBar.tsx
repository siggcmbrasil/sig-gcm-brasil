"use client";
import Link from "next/link";
export default function MobileEmergencyBar(){
 return (
  <div className="fixed bottom-24 left-1/2 -translate-x-1/2 flex gap-2 z-50">
   <Link href="/sistema/ocorrencias/expressa">🚨</Link>
   <Link href="/sistema/central-sos">🆘</Link>
   <Link href="/sistema/chamados">📞</Link>
   <Link href="/sistema/mapa-operacional">📍</Link>
   <Link href="/sistema/visitas/ler-qrcode">📷</Link>
  </div>
 );
}
