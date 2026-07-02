import ExportadorModulo from "@/components/exportacao/ExportadorModulo";

export default function Page() {
  return (
    <ExportadorModulo
      titulo="Exportação de Patrulhamentos"
      subtitulo="Exportar patrulhamentos em JSON."
      tabela="patrulhamentos"
      arquivo="patrulhamentos.json"
      acao="EXPORTAR_PATRULHAMENTOS"
    />
  );
}