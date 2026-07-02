import ExportadorModulo from "@/components/exportacao/ExportadorModulo";

export default function Page() {
  return (
    <ExportadorModulo
      titulo="Exportação de Guardas"
      subtitulo="Exportar cadastro de guardas em JSON."
      tabela="guardas"
      arquivo="guardas.json"
      acao="EXPORTAR_GUARDAS"
    />
  );
}