import Link from "next/link";

export default function LandingHeader() {
  return (
    <header className="fixed left-0 top-0 z-50 w-full border-b border-white/10 bg-[#020817]/90 backdrop-blur-xl">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-5">
        <Link href="/" className="flex items-center gap-3">
          <img
            src="/logo-sig.png"
            alt="SIG-GCM Brasil"
            className="h-12 w-12 object-contain"
          />

          <div>
            <h1 className="text-xl font-black leading-none text-white">
              SIG-GCM Brasil
            </h1>
            <p className="mt-1 text-xs text-slate-400">
              Gestão inteligente para Guardas Municipais
            </p>
          </div>
        </Link>

        <nav className="hidden items-center gap-7 text-sm font-bold text-white md:flex">
          <Link href="/modulos" className="hover:text-yellow-400">
            Módulos
          </Link>
          <Link href="/solucoes" className="hover:text-yellow-400">
            Soluções
          </Link>
          <Link href="/recursos" className="hover:text-yellow-400">
            Recursos
          </Link>
          <Link href="/redes" className="hover:text-yellow-400">
            Redes
          </Link>
          <Link href="/atendimento" className="hover:text-yellow-400">
            Atendimento
          </Link>

          <Link
            href="/login"
            className="rounded-xl border border-yellow-500 px-5 py-2 text-yellow-400 hover:bg-yellow-500 hover:text-black"
          >
            Acessar Sistema
          </Link>
        </nav>
      </div>
    </header>
  );
}