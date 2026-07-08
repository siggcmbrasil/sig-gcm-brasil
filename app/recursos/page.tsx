import {
  Bot,
  Database,
  FileBarChart,
  Headphones,
  LockKeyhole,
  MonitorSmartphone,
  ShieldCheck,
  Zap,
} from "lucide-react";
import LandingHeader from "@/components/landing/LandingHeader";
import LandingFooter from "@/components/landing/LandingFooter";

export default function RecursosPage() {
  const cards = [
    { titulo: "Web e Mobile", texto: "Acesso pelo computador e celular, com foco em operação em campo.", icon: MonitorSmartphone },
    { titulo: "Multi-município", texto: "Separação de dados por município, respeitando a estrutura de cada Guarda.", icon: ShieldCheck },
    { titulo: "SIGIA", texto: "Inteligência artificial integrada para auxiliar relatórios, análises e decisões.", icon: Bot },
    { titulo: "Relatórios", texto: "Geração de documentos, estatísticas e relatórios operacionais.", icon: FileBarChart },
    { titulo: "Segurança", texto: "Controle de acesso, perfis, permissões e proteção das informações.", icon: LockKeyhole },
    { titulo: "Banco de Dados", texto: "Informações centralizadas, organizadas e preparadas para crescimento.", icon: Database },
    { titulo: "Suporte", texto: "Implantação assistida, treinamento e acompanhamento inicial.", icon: Headphones },
    { titulo: "Performance", texto: "Sistema leve, moderno e preparado para evolução contínua.", icon: Zap },
  ];

  return (
    <main style={{ minHeight: "100vh", background: "#020817", color: "white" }}>
      <LandingHeader />

      <section style={{
        paddingTop: 130,
        paddingBottom: 60,
        background: "linear-gradient(135deg, #071534 0%, #020817 55%, #06251f 100%)",
        borderBottom: "1px solid rgba(255,255,255,0.10)",
      }}>
        <div style={{ maxWidth: 1280, margin: "0 auto", padding: "0 24px" }}>
          <span style={{
            display: "inline-block",
            padding: "10px 18px",
            borderRadius: 999,
            border: "1px solid rgba(234,179,8,0.45)",
            background: "rgba(234,179,8,0.10)",
            color: "#facc15",
            fontWeight: 900,
            fontSize: 13,
            textTransform: "uppercase",
          }}>
            Recursos principais
          </span>

          <h1 style={{
            marginTop: 28,
            fontSize: "clamp(42px, 5vw, 72px)",
            lineHeight: 1.05,
            fontWeight: 950,
          }}>
            Recursos para uma gestão moderna
          </h1>

          <p style={{
            marginTop: 20,
            maxWidth: 850,
            color: "#cbd5e1",
            fontSize: 20,
            lineHeight: 1.6,
          }}>
            Tecnologia, segurança, inteligência artificial, relatórios e suporte
            em uma plataforma preparada para o crescimento.
          </p>
        </div>
      </section>

      <section style={{ maxWidth: 1280, margin: "0 auto", padding: "70px 24px" }}>
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
          gap: 24,
        }}>
          {cards.map((item) => {
            const Icon = item.icon;

            return (
              <div key={item.titulo} style={{
                minHeight: 270,
                borderRadius: 28,
                padding: 30,
                background: "linear-gradient(145deg, rgba(15,23,42,0.98), rgba(7,21,38,0.98))",
                border: "1px solid rgba(255,255,255,0.11)",
                boxShadow: "0 20px 70px rgba(0,0,0,0.25)",
              }}>
                <div style={{
                  width: 72,
                  height: 72,
                  borderRadius: 22,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#38bdf8",
                  background: "rgba(56,189,248,0.12)",
                  marginBottom: 26,
                }}>
                  <Icon size={42} />
                </div>

                <h2 style={{ fontSize: 27, lineHeight: 1.1, fontWeight: 950 }}>
                  {item.titulo}
                </h2>

                <p style={{ marginTop: 14, color: "#cbd5e1", fontSize: 16, lineHeight: 1.7 }}>
                  {item.texto}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      <LandingFooter />
    </main>
  );
}