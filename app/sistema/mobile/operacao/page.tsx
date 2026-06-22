import Link from "next/link";

export default function OperacaoMobilePage() {
  return (
    <main className="min-h-screen bg-[#02050c] text-white p-5 pb-24">
      <button
  onClick={() => window.history.back()}
  className="mb-5 bg-slate-900 border border-slate-800 px-4 py-2 rounded-2xl"
>
  ← Voltar
</button>
      <h1 className="text-3xl font-black mb-2">
        🚔 Operação em Campo
      </h1>

      <p className="text-slate-400 mb-6">
        Acesso rápido para uso operacional da guarnição.
      </p>

      <div className="space-y-4">
        <Botao href="/sistema/ocorrencias/expressa" cor="bg-red-700">
          🚨 Ocorrência Expressa
        </Botao>

        <Botao href="/sistema/chamados" cor="bg-green-700">
          📞 Novo Chamado
        </Botao>

        <Botao href="/sistema/rondas" cor="bg-indigo-700">
          🔳 Rondas / QR Code
        </Botao>

        <Botao href="/sistema/localizacao" cor="bg-blue-700">
          📍 Patrulhamento GPS
        </Botao>

        <Botao href="/sistema/mapa-operacional" cor="bg-purple-700">
          🗺️ Mapa Operacional
        </Botao>

        <Botao href="/sistema/ia" cor="bg-cyan-700">
          🤖 IA Operacional
        </Botao>
      </div>
    </main>
  );
}

function Botao({
  href,
  cor,
  children,
}: {
  href: string;
  cor: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={`${cor} block w-full rounded-3xl p-6 text-center text-xl font-black shadow-xl active:scale-95 transition`}
    >
      {children}
    </Link>
  );
}