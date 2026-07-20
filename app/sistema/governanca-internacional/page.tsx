import ModuloEstrategico from "@/components/ModuloEstrategico";
import {
  BadgeCheck,
  BookOpenCheck,
  DatabaseZap,
  FileCheck2,
  Globe2,
  Languages,
  LockKeyhole,
  Network,
  Scale,
  ShieldCheck,
  Workflow,
} from "lucide-react";

export default function GovernancaInternacionalPage() {
  return (
    <ModuloEstrategico
      titulo="Governança Internacional"
      subtitulo="Confiança, conformidade e interoperabilidade"
      descricao="Camada executiva para políticas institucionais, proteção de dados, continuidade operacional, interoperabilidade, qualidade, transparência e expansão internacional do ecossistema SIG-GCM Brasil."
      icone={Globe2}
      nivel="Governança corporativa"
      indicadores={[
        { rotulo: "Segurança", valor: "Zero Trust", descricao: "acesso mínimo necessário" },
        { rotulo: "Dados", valor: "LGPD Ready", descricao: "privacidade por desenho" },
        { rotulo: "Operação", valor: "24×7", descricao: "continuidade preparada" },
        { rotulo: "Integração", valor: "API First", descricao: "interoperabilidade institucional" },
      ]}
      recursos={[
        { titulo: "Políticas de Segurança", descricao: "Matriz de acesso, segregação de funções, autenticação, sessões e resposta a incidentes.", icone: ShieldCheck, status: "ATIVO", categoria: "Segurança" },
        { titulo: "Privacidade e LGPD", descricao: "Finalidades, bases legais, retenção, anonimização e atendimento aos direitos do titular.", icone: Scale, status: "ATIVO", categoria: "Conformidade" },
        { titulo: "Gestão de Riscos", descricao: "Catálogo de riscos, controles, responsáveis, evidências, impacto e planos de tratamento.", icone: LockKeyhole, status: "NOVO", categoria: "Governança" },
        { titulo: "Continuidade Operacional", descricao: "Planos de contingência, recuperação, comunicação de crise e testes periódicos.", icone: Workflow, status: "NOVO", categoria: "Resiliência" },
        { titulo: "Interoperabilidade", descricao: "Padrões de API, integrações seguras, contratos de dados e comunicação entre órgãos.", icone: Network, status: "NOVO", categoria: "Integração" },
        { titulo: "Qualidade de Dados", descricao: "Validação, completude, consistência, linhagem, catalogação e responsabilidade pelo dado.", icone: DatabaseZap, status: "NOVO", categoria: "Dados" },
        { titulo: "Auditoria e Evidências", descricao: "Trilhas imutáveis, relatórios executivos, evidências de controle e prestação de contas.", icone: FileCheck2, status: "ATIVO", categoria: "Auditoria" },
        { titulo: "Gestão Documental", descricao: "Classificação, temporalidade, versões, assinatura, autenticidade e descarte seguro.", icone: BookOpenCheck, status: "NOVO", categoria: "Informação" },
        { titulo: "Idiomas e Localização", descricao: "Preparação para português, espanhol e inglês, datas, formatos e terminologia regional.", icone: Languages, status: "NOVO", categoria: "Expansão" },
        { titulo: "Certificação e Maturidade", descricao: "Checklist de controles, indicadores de maturidade e prontidão para avaliações externas.", icone: BadgeCheck, status: "NOVO", categoria: "Excelência" },
      ]}
    />
  );
}
