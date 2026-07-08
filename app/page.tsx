import Link from "next/link";
import { MessageCircle, Send } from "lucide-react";
import LandingHeader from "@/components/landing/LandingHeader";
import LandingFooter from "@/components/landing/LandingFooter";

const WHATSAPP = "5575983232198";
const TELEGRAM = "https://t.me/+oeTuWMIk-u4wMzcx";

export default function HomePage() {
  const linkWhatsapp = `https://wa.me/${WHATSAPP}?text=Olá,%20gostaria%20de%20conhecer%20o%20SIG-GCM%20Brasil.`;

  return (
    <main className="min-h-screen bg-[#020817] text-white">
      <LandingHeader />

      <section className="relative flex min-h-screen items-center overflow-hidden pt-20">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_25%,rgba(37,99,235,0.35),transparent_30%),radial-gradient(circle_at_80%_70%,rgba(16,185,129,0.25),transparent_35%)]" />
        <div className="absolute inset-0 bg-gradient-to-br from-[#071534] via-[#020817] to-[#06251f]" />

        <div className="relative mx-auto grid w-full max-w-7xl items-center gap-12 px-5 py-12 lg:grid-cols-2">
          <div>
            <span className="inline-flex rounded-full border border-yellow-500/40 bg-yellow-500/10 px-4 py-2 text-xs font-black uppercase tracking-wide text-yellow-400">
              Sistema inteligente para Guardas Municipais
            </span>

            <h2 className="mt-7 max-w-3xl text-4xl font-black leading-[1.05] md:text-6xl lg:text-7xl">
              Tecnologia para uma
              <span className="block text-yellow-400">
                Guarda mais forte
              </span>
            </h2>

            <p className="mt-5 text-xl font-black text-slate-100 md:text-2xl">
              Inteligência, Gestão e Segurança em uma única plataforma.
            </p>

            <p className="mt-4 max-w-2xl text-base leading-relaxed text-slate-300 md:text-lg">
              O SIG-GCM Brasil centraliza ocorrências, escalas, patrulhamentos,
              viaturas, guardas, documentos, relatórios e inteligência artificial.
            </p>

            <div className="mt-8 flex flex-wrap gap-4">
              <a
                href={linkWhatsapp}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-xl bg-yellow-500 px-7 py-4 font-black text-black hover:bg-yellow-400"
              >
                <MessageCircle size={21} />
                Solicitar demonstração
              </a>

              <a
                href={TELEGRAM}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-xl border border-sky-400/40 bg-sky-500/10 px-7 py-4 font-bold text-sky-300 hover:bg-sky-500/20"
              >
                <Send size={21} />
                Telegram
              </a>

              <Link
                href="/login"
                className="rounded-xl border border-white/20 bg-white/5 px-7 py-4 font-bold hover:bg-white/10"
              >
                Acessar sistema
              </Link>
            </div>
          </div>

          <div className="relative hidden justify-center lg:flex">
            <div className="absolute bottom-16 h-8 w-[470px] rounded-full border border-yellow-400/70 bg-yellow-400/20 shadow-[0_0_50px_rgba(234,179,8,0.5)]" />
            <img
              src="/logo-sig.png"
              alt="SIG-GCM Brasil"
              className="relative z-10 w-full max-w-[700px] object-contain drop-shadow-2xl"
            />
          </div>
        </div>
      </section>

      <LandingFooter />
    </main>
  );
}