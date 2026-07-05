import Link from "next/link";
import {
  Bot,
  CalendarDays,
  Car,
  FileText,
  Headphones,
  MapPinned,
  MessageCircle,
  ShieldCheck,
  Smartphone,
  Users,
} from "lucide-react";

const WHATSAPP = "5575983232198";

export default function HomePage() {
  const linkWhatsapp = `https://wa.me/${WHATSAPP}?text=Olá,%20gostaria%20de%20conhecer%20o%20SIG-GCM%20Brasil.`;

  const modulos = [
    { titulo: "Ocorrências", texto: "Registro e controle operacional.", icon: ShieldCheck },
    { titulo: "Escalas", texto: "Plantões, guarnições e permutas.", icon: CalendarDays },
    { titulo: "Patrulhamento", texto: "GPS, rondas e histórico.", icon: MapPinned },
    { titulo: "Viaturas", texto: "Frota, checklist e manutenção.", icon: Car },
    { titulo: "Guardas", texto: "Efetivo, documentos e histórico.", icon: Users },
    { titulo: "SIGIA", texto: "Inteligência artificial integrada.", icon: Bot },
    { titulo: "Ofícios", texto: "Documentos oficiais e controle.", icon: FileText },
    { titulo: "Mobile", texto: "Operação pelo celular.", icon: Smartphone },
  ];

  return (
    <main className="min-h-screen bg-[#020817] text-white">
      <header className="sticky top-0 z-50 border-b border-white/10 bg-[#020817]/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <img src="/logo-sig.png" alt="SIG-GCM Brasil" className="h-12 w-12 object-contain" />
            <div>
              <h1 className="text-xl font-black">SIG-GCM Brasil</h1>
              <p className="text-xs text-slate-400">Gestão inteligente para Guardas Municipais</p>
            </div>
          </div>

          <nav className="hidden items-center gap-8 text-sm font-bold md:flex">
            <a href="#modulos" className="hover:text-yellow-400">Módulos</a>
            <a href="#solucoes" className="hover:text-yellow-400">Soluções</a>
            <a href="#atendimento" className="hover:text-yellow-400">Atendimento</a>
            <Link href="/login" className="rounded-full border border-yellow-500 px-5 py-2 text-yellow-400">
              Acessar Sistema
            </Link>
          </nav>
        </div>
      </header>

      <section className="relative overflow-hidden border-b border-white/10">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-950 via-[#020817] to-emerald-950 opacity-80" />

        <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-6 py-24 lg:grid-cols-2">
          <div>
            <span className="inline-block rounded-full border border-yellow-500/50 px-5 py-2 text-sm font-black text-yellow-400">
              SISTEMA INTELIGENTE PARA GUARDAS MUNICIPAIS
            </span>

            <h2 className="mt-8 text-6xl font-black leading-tight md:text-8xl">
              SIG-GCM
              <span className="block text-yellow-400">Brasil</span>
            </h2>

            <p className="mt-6 max-w-xl text-2xl font-bold">
              Inteligência, Gestão e Segurança para Guardas Municipais.
            </p>

            <p className="mt-5 max-w-xl text-lg text-slate-300">
              Plataforma completa para gestão operacional, administrativa,
              documental e estratégica da Guarda Municipal.
            </p>

            <div className="mt-10 flex flex-wrap gap-4">
              <a
                href={linkWhatsapp}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-xl bg-yellow-500 px-8 py-4 font-black text-black hover:bg-yellow-400"
              >
                Solicitar demonstração
              </a>

              <Link
                href="/login"
                className="rounded-xl border border-white/20 px-8 py-4 font-bold hover:bg-white/10"
              >
                Acessar sistema
              </Link>
            </div>
          </div>

          <div className="flex justify-center">
            <img
              src="/logo-sig.png"
              alt="Emblema SIG-GCM Brasil"
              className="w-full max-w-[460px] drop-shadow-2xl"
            />
          </div>
        </div>
      </section>

      <section className="bg-slate-950 py-10">
        <div className="mx-auto grid max-w-7xl gap-4 px-6 md:grid-cols-4">
          <div className="rounded-2xl border border-white/10 bg-[#020817] p-6">
            <Smartphone className="mb-3 text-emerald-400" />
            <h3 className="font-black">Web e Mobile</h3>
            <p className="text-sm text-slate-400">Acesso no computador e celular.</p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-[#020817] p-6">
            <ShieldCheck className="mb-3 text-emerald-400" />
            <h3 className="font-black">Multi-município</h3>
            <p className="text-sm text-slate-400">Dados separados por município.</p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-[#020817] p-6">
            <Bot className="mb-3 text-emerald-400" />
            <h3 className="font-black">SIGIA</h3>
            <p className="text-sm text-slate-400">Apoio inteligente à operação.</p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-[#020817] p-6">
            <Headphones className="mb-3 text-emerald-400" />
            <h3 className="font-black">Atendimento 24h</h3>
            <p className="text-sm text-slate-400">Suporte e implantação assistida.</p>
          </div>
        </div>
      </section>

      <section id="modulos" className="py-24">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mb-14 text-center">
            <h2 className="text-4xl font-black">Módulos do Sistema</h2>
            <p className="mt-4 text-slate-400">
              Tudo organizado por área para facilitar a rotina da Guarda Municipal.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {modulos.map((item) => {
              const Icon = item.icon;

              return (
                <div
                  key={item.titulo}
                  className="rounded-2xl border border-white/10 bg-slate-950 p-7 transition hover:-translate-y-1 hover:border-yellow-500/50"
                >
                  <Icon className="mb-5 text-yellow-400" size={36} />
                  <h3 className="text-xl font-black">{item.titulo}</h3>
                  <p className="mt-3 text-sm text-slate-400">{item.texto}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section id="solucoes" className="bg-slate-950 py-24">
        <div className="mx-auto grid max-w-7xl gap-12 px-6 lg:grid-cols-2">
          <div>
            <h2 className="text-4xl font-black">
              Organização, controle e tecnologia em uma única plataforma.
            </h2>

            <p className="mt-6 text-slate-300">
              O SIG-GCM Brasil ajuda a Guarda Municipal a centralizar registros,
              acompanhar operações, gerar relatórios, organizar documentos e
              melhorar a comunicação interna.
            </p>
          </div>

          <div className="grid gap-4">
            {[
              "Reduz papel e retrabalho administrativo",
              "Facilita o controle de ocorrências e patrulhamentos",
              "Organiza escalas, guarnições e efetivo",
              "Apoia decisões com relatórios e inteligência artificial",
            ].map((item) => (
              <div key={item} className="rounded-xl border border-white/10 bg-[#020817] p-5 font-semibold">
                {item}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="atendimento" className="py-24">
        <div className="mx-auto max-w-5xl px-6 text-center">
          <MessageCircle size={56} className="mx-auto mb-6 text-emerald-400" />

          <h2 className="text-4xl font-black">Solicite uma demonstração</h2>

          <p className="mx-auto mt-5 max-w-2xl text-slate-300">
            Fale com o atendimento do SIG-GCM Brasil e conheça a melhor forma
            de implantação para o seu município.
          </p>

          <a
            href={linkWhatsapp}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-10 inline-block rounded-xl bg-emerald-500 px-10 py-4 font-black text-black hover:bg-emerald-400"
          >
            Chamar no WhatsApp
          </a>
        </div>
      </section>

      <footer className="border-t border-white/10 bg-slate-950 py-8 text-center text-sm text-slate-400">
        © {new Date().getFullYear()} SIG-GCM Brasil — Inteligência, Gestão e Segurança para Guardas Municipais.
      </footer>
    </main>
  );
}