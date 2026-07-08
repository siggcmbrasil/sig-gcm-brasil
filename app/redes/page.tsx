import { Camera, MessageCircle, Send } from "lucide-react";
import LandingHeader from "@/components/landing/LandingHeader";
import LandingFooter from "@/components/landing/LandingFooter";

const WHATSAPP = "5575983232198";
const TELEGRAM = "https://t.me/siggcmbrasil";
const INSTAGRAM = "https://instagram.com/siggcmbrasil";

export default function RedesPage() {
  const whatsapp = `https://wa.me/${WHATSAPP}?text=Olá,%20gostaria%20de%20conhecer%20o%20SIG-GCM%20Brasil`;

  const redes = [
    {
      titulo: "WhatsApp",
      texto: "Solicite uma demonstração e fale diretamente com nossa equipe.",
      cor: "#22c55e",
      icon: MessageCircle,
      link: whatsapp,
    },
    {
      titulo: "Telegram",
      texto: "Receba novidades, atualizações e conteúdos exclusivos.",
      cor: "#38bdf8",
      icon: Send,
      link: TELEGRAM,
    },
    {
      titulo: "Instagram",
      texto: "Acompanhe notícias, novidades e projetos do SIG-GCM Brasil.",
      cor: "#ec4899",
      icon: Camera,
      link: INSTAGRAM,
    },
  ];

  return (
    <main style={{ minHeight: "100vh", background: "#020817", color: "#fff" }}>
      <LandingHeader />

      <section
        style={{
          paddingTop: 130,
          paddingBottom: 70,
          background:
            "linear-gradient(135deg,#071534,#020817,#06251f)",
        }}
      >
        <div style={{ maxWidth: 1280, margin: "auto", padding: "0 24px" }}>
          <h1
            style={{
              fontSize: "clamp(42px,5vw,72px)",
              fontWeight: 900,
            }}
          >
            Redes Oficiais
          </h1>

          <p
            style={{
              marginTop: 18,
              maxWidth: 700,
              color: "#CBD5E1",
              fontSize: 20,
              lineHeight: 1.7,
            }}
          >
            Entre em contato com nossa equipe e acompanhe todas as novidades do
            SIG-GCM Brasil.
          </p>
        </div>
      </section>

      <section style={{ maxWidth: 1280, margin: "60px auto", padding: "0 24px" }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3,1fr)",
            gap: 30,
          }}
        >
          {redes.map((rede) => {
            const Icon = rede.icon;

            return (
              <a
                key={rede.titulo}
                href={rede.link}
                target="_blank"
                style={{
                  textDecoration: "none",
                  color: "white",
                }}
              >
                <div
                  style={{
                    background: "#07111f",
                    borderRadius: 28,
                    padding: 35,
                    minHeight: 260,
                    border: "1px solid rgba(255,255,255,.1)",
                  }}
                >
                  <div
                    style={{
                      width: 75,
                      height: 75,
                      borderRadius: 20,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      background: `${rede.cor}22`,
                      color: rede.cor,
                    }}
                  >
                    <Icon size={42} />
                  </div>

                  <h2
                    style={{
                      marginTop: 25,
                      fontSize: 32,
                      fontWeight: 900,
                    }}
                  >
                    {rede.titulo}
                  </h2>

                  <p
                    style={{
                      marginTop: 18,
                      color: "#CBD5E1",
                      lineHeight: 1.8,
                      fontSize: 17,
                    }}
                  >
                    {rede.texto}
                  </p>
                </div>
              </a>
            );
          })}
        </div>
      </section>

      <LandingFooter />
    </main>
  );
}