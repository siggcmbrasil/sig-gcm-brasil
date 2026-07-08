import Link from "next/link";

export default function LandingFooter() {
  return (
    <footer className="relative z-10 mt-20 border-t border-white/10 bg-[#020817] py-8 text-slate-400">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-5 px-6 text-sm md:flex-row">
        <div className="flex flex-wrap justify-center gap-5">
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
        </div>

        <p>
          © {new Date().getFullYear()} SIG-GCM Brasil. Todos os direitos reservados.
        </p>
      </div>
    </footer>
  );
}