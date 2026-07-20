import ModuloEstrategico from "@/components/ModuloEstrategico";
import { Boxes, CalendarCheck, CalendarDays, CarFront, Cctv, CloudLightning, Dog, Globe2, HeartHandshake, Landmark, Leaf, PanelsTopLeft, Plane, School, Shield, Siren, TrafficCone, UsersRound } from "lucide-react";

export default function Page() {
  return <ModuloEstrategico titulo="Central de Módulos" subtitulo="Ecossistema SIG-GCM Brasil" descricao="Acesso executivo e organizado aos módulos operacionais, administrativos, estratégicos e especializados, preservando os fluxos existentes e preparando o SIG-GCM Brasil para expansão nacional e internacional." icone={Boxes} nivel="Ecossistema corporativo" indicadores={[
    { rotulo: "Ecossistema", valor: "18+", descricao: "domínios institucionais" },
    { rotulo: "Operação", valor: "Tempo real", descricao: "comando e campo" },
    { rotulo: "Arquitetura", valor: "Multi-tenant", descricao: "multi-município" },
    { rotulo: "Governança", valor: "Auditável", descricao: "segurança e conformidade" },
  ]} recursos={[
    { titulo: "Governança Internacional", descricao: "Segurança, privacidade, riscos, continuidade e interoperabilidade.", href: "/sistema/governanca-internacional", icone: Globe2, status: "NOVO", categoria: "Governança" },
    { titulo: "SIG Trânsito", categoria: "Mobilidade", descricao: "Gestão completa de trânsito e mobilidade municipal.", href: "/sistema/transito", icone: TrafficCone, status: "ATIVO" },
    { titulo: "Proteção Ambiental", categoria: "Proteção especializada", descricao: "Fiscalização e operações ambientais.", href: "/sistema/ambiental", icone: Leaf, status: "ATIVO" },
    { titulo: "Ronda Escolar", categoria: "Proteção especializada", descricao: "Proteção escolar e rede preventiva.", href: "/sistema/ronda-escolar", icone: School, status: "ATIVO" },
    { titulo: "Proteção à Mulher", descricao: "Patrulha e acompanhamento de medidas protetivas.", href: "/sistema/violencia-domestica", icone: HeartHandshake, status: "ATIVO" },
    { titulo: "Videomonitoramento", descricao: "Central de câmeras e evidências digitais.", href: "/sistema/videomonitoramento", icone: Cctv, status: "ATIVO" },
    { titulo: "Defesa Civil", descricao: "Riscos, alertas e resposta a desastres.", href: "/sistema/defesa-civil", icone: CloudLightning, status: "ATIVO" },
    { titulo: "Canil Operacional", descricao: "Gestão da unidade K9.", href: "/sistema/canil", icone: Dog, status: "ATIVO" },
    { titulo: "Operações com Drones", descricao: "Missões aéreas e gestão de aeronaves.", href: "/sistema/drones", icone: Plane, status: "ATIVO" },
    { titulo: "Eventos Públicos", descricao: "Planejamento operacional integrado.", href: "/sistema/eventos-publicos", icone: CalendarCheck, status: "ATIVO" },
    { titulo: "Ocorrências Premium", categoria: "Operacional", descricao: "Registro oficial, PDF, QR Code e auditoria.", href: "/sistema/central-ocorrencias", icone: Siren, status: "ATIVO" },
    { titulo: "Central de Comando", categoria: "Comando", descricao: "Painel operacional em tempo real.", href: "/sistema/central-comando", icone: PanelsTopLeft, status: "ATIVO" },
    { titulo: "Escalas e Permutas", descricao: "Plantões, guarnições e fluxo de permutas.", href: "/sistema/escalas", icone: CalendarDays, status: "ATIVO" },
    { titulo: "Recursos Humanos", categoria: "Gestão corporativa", descricao: "Dossiê, carreira, saúde e desenvolvimento.", href: "/sistema/central-rh", icone: UsersRound, status: "ATIVO" },
    { titulo: "Frota", descricao: "Viaturas, manutenção, combustível e pneus.", href: "/sistema/central-frota", icone: CarFront, status: "ATIVO" },
    { titulo: "Armamento", descricao: "Armaria, cautelas, munições e inventário.", href: "/sistema/central-armamentos", icone: Shield, status: "ATIVO" },
    { titulo: "Patrimônio", descricao: "Bens, movimentações, baixas e QR Code.", href: "/sistema/central-patrimonio", icone: Boxes, status: "ATIVO" },
    { titulo: "Portal do Cidadão", descricao: "Serviços, denúncias, protocolos e comunicação.", href: "/sistema/portal-cidadao", icone: Landmark, status: "ATIVO" },
  ]} />;
}
