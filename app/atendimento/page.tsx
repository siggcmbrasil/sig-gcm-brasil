import {
  Headphones,
  MessageCircle,
  Send,
} from "lucide-react";

import LandingHeader from "@/components/landing/LandingHeader";
import LandingFooter from "@/components/landing/LandingFooter";

const WHATSAPP = "5575983232198";
const TELEGRAM = "https://t.me/siggcmbrasil";

export default function AtendimentoPage() {
  const whatsapp = `https://wa.me/${WHATSAPP}?text=Olá,%20gostaria%20de%20agendar%20uma%20demonstração%20do%20SIG-GCM%20Brasil`;

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
            Atendimento
          </h1>

          <p
            style={{
              marginTop: 18,
              maxWidth: 760,
              color: "#CBD5E1",
              fontSize: 20,
              lineHeight: 1.7,
            }}
          >
            Nossa equipe acompanha todo o processo de implantação do SIG-GCM
            Brasil, desde a demonstração até o treinamento dos usuários.
          </p>
        </div>
      </section>

      <section style={{ maxWidth: 1280, margin: "60px auto", padding: "0 24px" }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1.2fr .8fr",
            gap: 30,
          }}
        >
          <div
            style={{
              background: "#07111f",
              borderRadius: 28,
              padding: 45,
              border: "1px solid rgba(255,255,255,.1)",
            }}
          >
            <Headphones size={65} color="#22c55e" />

            <h2
              style={{
                marginTop: 25,
                fontSize: 38,
                fontWeight: 900,
              }}
            >
              Solicite uma demonstração
            </h2>

            <p
              style={{
                marginTop: 20,
                color: "#CBD5E1",
                lineHeight: 1.9,
                fontSize: 18,
              }}
            >
              Conheça todas as funcionalidades do sistema, tire dúvidas e veja
              como o SIG-GCM Brasil pode transformar a gestão da sua Guarda
              Municipal.
            </p>

            <div
              style={{
                marginTop: 35,
                display: "flex",
                gap: 20,
              }}
            >
              <a
                href={whatsapp}
                target="_blank"
                style={{
                  background: "#22c55e",
                  color: "#000",
                  padding: "16px 30px",
                  borderRadius: 15,
                  fontWeight: 900,
                  textDecoration: "none",
                }}
              >
                <MessageCircle size={20} />
                WhatsApp
              </a>

              <a
                href={TELEGRAM}
                target="_blank"
                style={{
                  border: "1px solid #38bdf8",
                  color: "#38bdf8",
                  padding: "16px 30px",
                  borderRadius: 15,
                  textDecoration: "none",
                  fontWeight: 900,
                }}
              >
                <Send size={20} />
                Telegram
              </a>
            </div>
          </div>

          <div
            style={{
              background: "#07111f",
              borderRadius: 28,
              padding: 35,
              border: "1px solid rgba(255,255,255,.1)",
            }}
          >
            <h3
              style={{
                fontSize: 30,
                fontWeight: 900,
              }}
            >
              Como funciona?
            </h3>

            <div
              style={{
                marginTop: 25,
                display: "grid",
                gap: 22,
                color: "#CBD5E1",
                fontSize: 17,
                lineHeight: 1.8,
              }}
            >
              <div>① Agendamento da demonstração.</div>

              <div>② Apresentação completa do sistema.</div>

              <div>③ Definição da implantação.</div>

              <div>④ Treinamento da equipe.</div>

              <div>⑤ Suporte durante toda a utilização.</div>
            </div>
          </div>
        </div>
      </section>

      <LandingFooter />
    </main>
  );
}