import ModuloEstrategico from "@/components/ModuloEstrategico";
import { BarChart3, CarFront, FileText, GraduationCap, MapPinned, Ruler, Scale, Search, Settings, ShieldCheck, Siren, TrafficCone, Warehouse } from "lucide-react";

export default function SigTransitoPage() {
  return <ModuloEstrategico titulo="SIG Trânsito" subtitulo="Módulo exclusivo de mobilidade e fiscalização" descricao="Plataforma integrada de mobilidade urbana e fiscalização, preparada para operação em campo, gestão administrativa, inteligência viária, transparência e integração institucional." icone={TrafficCone} nivel="Suite de mobilidade urbana" indicadores={[
    { rotulo: "Operação", valor: "13 áreas", descricao: "ciclo completo de trânsito" },
    { rotulo: "Campo", valor: "Mobile First", descricao: "fiscalização georreferenciada" },
    { rotulo: "Dados", valor: "Inteligência", descricao: "indicadores e pontos críticos" },
    { rotulo: "Segurança", valor: "RLS", descricao: "isolamento por município" },
  ]} recursos={[
    { titulo: "Fiscalização em Campo", categoria: "Operação", descricao: "Abordagens, enquadramentos, fotos, geolocalização e operação móvel.", href: "/sistema/transito/fiscalizacao", icone: ShieldCheck, status: "NOVO" },
    { titulo: "Autos de Infração", categoria: "Fiscalização", descricao: "Lavratura, numeração, impressão, assinatura e acompanhamento de autos.", href: "/sistema/transito/autos-infracao", icone: FileText, status: "NOVO" },
    { titulo: "Acidentes de Trânsito", categoria: "Segurança viária", descricao: "Registro técnico, envolvidos, veículos, croqui, fotos e vítimas.", href: "/sistema/transito/acidentes", icone: CarFront, status: "NOVO" },
    { titulo: "Operações Viárias", categoria: "Operação", descricao: "Blitz, bloqueios, apoio a eventos, interdições e fiscalização planejada.", href: "/sistema/transito/operacoes", icone: Siren, status: "NOVO" },
    { titulo: "Sinalização Viária", categoria: "Infraestrutura", descricao: "Inventário de placas, semáforos, pintura, defeitos e ordens de manutenção.", href: "/sistema/transito/sinalizacao", icone: TrafficCone, status: "NOVO" },
    { titulo: "Engenharia de Tráfego", categoria: "Planejamento", descricao: "Estudos, contagens, pontos críticos, projetos e intervenções urbanas.", href: "/sistema/transito/engenharia", icone: Ruler, status: "NOVO" },
    { titulo: "Educação para o Trânsito", categoria: "Prevenção", descricao: "Campanhas, palestras, escolas, calendário e indicadores educativos.", href: "/sistema/transito/educacao", icone: GraduationCap, status: "NOVO" },
    { titulo: "Pátio e Remoções", categoria: "Custódia", descricao: "Entrada, vistoria, custódia, liberação, taxas e leilões de veículos.", href: "/sistema/transito/patio", icone: Warehouse, status: "NOVO" },
    { titulo: "Recursos e JARI", categoria: "Processos", descricao: "Defesas, recursos, prazos, sessões, decisões e histórico processual.", href: "/sistema/transito/jari", icone: Scale, status: "NOVO" },
    { titulo: "Veículos e Condutores", categoria: "Consultas", descricao: "Consultas internas, histórico de abordagens e alertas municipais.", href: "/sistema/transito/consultas", icone: Search, status: "NOVO" },
    { titulo: "Mapa de Trânsito", categoria: "Inteligência", descricao: "Acidentes, infrações, congestionamentos, bloqueios e pontos críticos.", href: "/sistema/transito/mapa", icone: MapPinned, status: "NOVO" },
    { titulo: "Relatórios e Indicadores", categoria: "Gestão", descricao: "Produtividade, infrações, acidentes, arrecadação e séries históricas.", href: "/sistema/transito/relatorios", icone: BarChart3, status: "NOVO" },
    { titulo: "Configurações", categoria: "Administração", descricao: "Órgão autuador, agentes, talonários, enquadramentos e integrações.", href: "/sistema/transito/configuracoes", icone: Settings, status: "NOVO" },
  ]} />;
}
