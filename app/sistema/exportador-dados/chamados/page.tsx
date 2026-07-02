import ExportadorModulo from "@/components/exportacao/ExportadorModulo";

export default function Page() {
  return (
    <ExportadorModulo
      titulo="Exportação de Chamados"
      subtitulo="Exportar chamados em JSON."
      tabela="chamados"
      arquivo="chamados.json"
      acao="EXPORTAR_CHAMADOS"
    />
  );
}   