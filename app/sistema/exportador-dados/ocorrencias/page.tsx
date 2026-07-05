import ProtecaoModulo from "@/components/ProtecaoModulo";
import ExportadorModulo from "@/components/exportacao/ExportadorModulo";

export default function Page() {
  return (
    <ProtecaoModulo modulo="exportador_dados">
      <ExportadorModulo
        titulo="Exportação de Ocorrências"
        subtitulo="Exportar ocorrências em JSON."
        tabela="ocorrencias"
        arquivo="ocorrencias.json"
        acao="EXPORTAR_OCORRENCIAS"
      />
    </ProtecaoModulo>
  );
}