import {
  Bot,
  CalendarDays,
  Car,
  FileText,
  MapPinned,
  ShieldCheck,
  Smartphone,
  Users,
} from "lucide-react";

import LandingHeader from "@/components/landing/LandingHeader";
import LandingFooter from "@/components/landing/LandingFooter";

export default function ModulosPage() {
  const cards = [
    { titulo: "Ocorrências", texto: "Registro completo de ocorrências, envolvidos, veículos, objetos e relatórios.", icon: ShieldCheck },
    { titulo: "Escalas", texto: "Plantões, guarnições, permutas e organização operacional.", icon: CalendarDays },
    { titulo: "Patrulhamento", texto: "Rondas, GPS, pontos registrados e acompanhamento em campo.", icon: MapPinned },
    { titulo: "Viaturas", texto: "Frota, checklist, manutenção, abastecimento e situação operacional.", icon: Car },
    { titulo: "Guardas", texto: "Cadastro do efetivo, documentos, dossiê e histórico funcional.", icon: Users },
    { titulo: "SIGIA", texto: "Inteligência artificial integrada para apoio operacional e administrativo.", icon: Bot },
    { titulo: "Ofícios", texto: "Controle de documentos oficiais, numeração, status e geração de PDF.", icon: FileText },
    { titulo: "Mobile", texto: "Operação rápida pelo celular para uso em campo pela guarnição.", icon: Smartphone },
  ];

  return (
    <main style={{ minHeight: "100vh", background: "#020817", color: "white" }}>
      <LandingHeader />

      <section
        style={{
          paddingTop: 130,
          paddingBottom: 60,
          background:
            "linear-gradient(135deg, #071534 0%, #020817 55%, #06251f 100%)",
          borderBottom: "1px solid rgba(255,255,255,0.10)",
        }}
      >
        <div style={{ maxWidth: 1280, margin: "0 auto", padding: "0 24px" }}>
          <span
            style={{
              display: "inline-block",
              padding: "10px 18px",
              borderRadius: 999,
              border: "1px solid rgba(234,179,8,0.45)",
              background: "rgba(234,179,8,0.10)",
              color: "#facc15",
              fontWeight: 900,
              fontSize: 13,
              textTransform: "uppercase",
            }}
          >
            Módulos integrados
          </span>

          <h1
            style={{
              marginTop: 28,
              fontSize: "clamp(42px, 5vw, 72px)",
              lineHeight: 1.05,
              fontWeight: 950,
              letterSpacing: "-0.04em",
            }}
          >
            Módulos do Sistema
          </h1>

          <p
            style={{
              marginTop: 20,
              maxWidth: 800,
              color: "#cbd5e1",
              fontSize: 20,
              lineHeight: 1.6,
            }}
          >
            Estrutura completa para gestão operacional, administrativa e
            estratégica da Guarda Municipal.
          </p>

          <div
            style={{
              marginTop: 34,
              display: "grid",
              gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
              gap: 16,
              maxWidth: 650,
            }}
          >
            {[
              ["30+", "Módulos", "#facc15"],
              ["100+", "Funções", "#34d399"],
              ["24h", "Operação", "#38bdf8"],
            ].map(([numero, texto, cor]) => (
              <div
                key={texto}
                style={{
                  borderRadius: 22,
                  padding: 22,
                  textAlign: "center",
                  background: "rgba(255,255,255,0.045)",
                  border: "1px solid rgba(255,255,255,0.12)",
                }}
              >
                <strong style={{ display: "block", fontSize: 38, color: cor }}>
                  {numero}
                </strong>
                <span style={{ color: "#94a3b8", fontSize: 14 }}>{texto}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section style={{ maxWidth: 1280, margin: "0 auto", padding: "70px 24px" }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
            gap: 24,
          }}
        >
          {cards.map((item) => {
            const Icon = item.icon;

            return (
              <div
                key={item.titulo}
                style={{
                  minHeight: 270,
                  borderRadius: 28,
                  padding: 30,
                  background:
                    "linear-gradient(145deg, rgba(15,23,42,0.98), rgba(7,21,38,0.98))",
                  border: "1px solid rgba(255,255,255,0.11)",
                  boxShadow: "0 20px 70px rgba(0,0,0,0.25)",
                }}
              >
                <div
                  style={{
                    width: 72,
                    height: 72,
                    borderRadius: 22,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#facc15",
                    background: "rgba(234,179,8,0.12)",
                    marginBottom: 26,
                  }}
                >
                  <Icon size={42} />
                </div>

                <h2
                  style={{
                    fontSize: 27,
                    lineHeight: 1.1,
                    fontWeight: 950,
                  }}
                >
                  {item.titulo}
                </h2>

                <p
                  style={{
                    marginTop: 14,
                    color: "#cbd5e1",
                    fontSize: 16,
                    lineHeight: 1.7,
                  }}
                >
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