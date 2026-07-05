import ProtecaoModulo from "@/components/ProtecaoModulo";
import ExportadorModulo from "@/components/exportacao/ExportadorModulo";

export default function Page() {
  return (
    <ProtecaoModulo modulo="exportador_dados">
      <ExportadorModulo
        titulo="Exportação de Chamados"
        subtitulo="Exportar chamados em JSON."
        tabela="chamados"
        arquivo="chamados.json"
        acao="EXPORTAR_CHAMADOS"
      />
    </ProtecaoModulo>
  );
}