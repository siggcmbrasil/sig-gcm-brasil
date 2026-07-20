import ModuloEstrategico from "@/components/ModuloEstrategico";
import { BarChart3, ClipboardPlus, Files, HeartHandshake, LayoutDashboard, MapPinned, RadioTower } from "lucide-react";

export default function Page() {
  return <ModuloEstrategico titulo="Proteção à Mulher" subtitulo="Patrulha de Proteção" descricao="Medidas protetivas, visitas, risco, encaminhamentos e patrulha especializada" icone={HeartHandshake} recursos={[
    { titulo: "Painel e indicadores", descricao: "Visão consolidada do módulo e pendências operacionais.", icone: LayoutDashboard, status: "NOVO" },
    { titulo: "Cadastros", descricao: "Registros estruturados com isolamento por município.", icone: ClipboardPlus, status: "NOVO" },
    { titulo: "Operações", descricao: "Planejamento, execução e acompanhamento em campo.", icone: RadioTower, status: "NOVO" },
    { titulo: "Mapa e localização", descricao: "Camadas geográficas, pontos de interesse e ocorrências.", icone: MapPinned, status: "NOVO" },
    { titulo: "Documentos e anexos", descricao: "Fotos, arquivos, termos, relatórios e auditoria.", icone: Files, status: "NOVO" },
    { titulo: "Relatórios", descricao: "Indicadores, filtros, PDF e exportação de dados.", icone: BarChart3, status: "NOVO" },
  ]} />;
}
