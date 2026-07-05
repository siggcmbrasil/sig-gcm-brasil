import ProtecaoModulo from "@/components/ProtecaoModulo";
import ExportadorModulo from "@/components/exportacao/ExportadorModulo";

export default function Page() {
  return (
    <ProtecaoModulo modulo="exportador_dados">
      <ExportadorModulo
        titulo="Exportação de Viaturas"
        subtitulo="Exportar viaturas em JSON."
        tabela="viaturas"
        arquivo="viaturas.json"
        acao="EXPORTAR_VIATURAS"
      />
    </ProtecaoModulo>
  );
}