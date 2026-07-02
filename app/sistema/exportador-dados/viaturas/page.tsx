import ExportadorModulo from "@/components/exportacao/ExportadorModulo";

export default function Page() {
  return (
    <ExportadorModulo
      titulo="Exportação de Viaturas"
      subtitulo="Exportar viaturas em JSON."
      tabela="viaturas"
      arquivo="viaturas.json"
      acao="EXPORTAR_VIATURAS"
    />
  );
}