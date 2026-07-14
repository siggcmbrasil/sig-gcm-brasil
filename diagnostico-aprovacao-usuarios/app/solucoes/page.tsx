import { CheckCircle2 } from "lucide-react";
import LandingHeader from "@/components/landing/LandingHeader";
import LandingFooter from "@/components/landing/LandingFooter";

export default function SolucoesPage() {
  const cards = [
    "Reduz papel, retrabalho e perda de informações",
    "Centraliza ocorrências, patrulhamentos e chamados",
    "Organiza escalas, guarnições e efetivo",
    "Melhora o controle de viaturas e documentos",
    "Gera relatórios operacionais e administrativos",
    "Apoia decisões com inteligência artificial",
    "Aumenta a segurança dos dados por município",
    "Facilita a rotina do comando e da guarnição",
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
            Soluções SIG-GCM Brasil
          </span>

          <h1 style={{
            marginTop: 28,
            fontSize: "clamp(42px, 5vw, 72px)",
            lineHeight: 1.05,
            fontWeight: 950,
          }}>
            Soluções para modernizar a Guarda Municipal
          </h1>

          <p style={{
            marginTop: 20,
            maxWidth: 850,
            color: "#cbd5e1",
            fontSize: 20,
            lineHeight: 1.6,
          }}>
            Organização, controle e tecnologia para reduzir retrabalho,
            fortalecer a gestão e melhorar a rotina operacional.
          </p>
        </div>
      </section>

      <section style={{ maxWidth: 1280, margin: "0 auto", padding: "70px 24px" }}>
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
          gap: 24,
        }}>
          {cards.map((item) => (
            <div key={item} style={{
              minHeight: 210,
              borderRadius: 28,
              padding: 30,
              background: "linear-gradient(145deg, rgba(15,23,42,0.98), rgba(7,21,38,0.98))",
              border: "1px solid rgba(255,255,255,0.11)",
              boxShadow: "0 20px 70px rgba(0,0,0,0.25)",
            }}>
              <div style={{
                width: 64,
                height: 64,
                borderRadius: 20,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#34d399",
                background: "rgba(52,211,153,0.12)",
                marginBottom: 24,
              }}>
                <CheckCircle2 size={38} />
              </div>

              <p style={{
                color: "#e2e8f0",
                fontSize: 18,
                lineHeight: 1.6,
                fontWeight: 800,
              }}>
                {item}
              </p>
            </div>
          ))}
        </div>
      </section>

      <LandingFooter />
    </main>
  );
}