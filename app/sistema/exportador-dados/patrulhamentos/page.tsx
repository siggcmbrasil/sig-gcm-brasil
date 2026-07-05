import ProtecaoModulo from "@/components/ProtecaoModulo";
import ExportadorModulo from "@/components/exportacao/ExportadorModulo";

export default function Page() {
  return (
    <ProtecaoModulo modulo="exportador_dados">
      <ExportadorModulo
        titulo="Exportação de Patrulhamentos"
        subtitulo="Exportar patrulhamentos em JSON."
        tabela="patrulhamentos"
        arquivo="patrulhamentos.json"
        acao="EXPORTAR_PATRULHAMENTOS"
      />
    </ProtecaoModulo>
  );
}