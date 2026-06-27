import CardFormularioSIG from "./CardFormularioSIG";

export default function DadosOcorrencia({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <CardFormularioSIG
      icone="🚨"
      titulo="Dados da Ocorrência"
      descricao="Informações iniciais do atendimento."
    >
      {children}
    </CardFormularioSIG>
  );
}