import TransitoCrud from "@/components/transito/TransitoCrud";

export default function Page() {
  return (
    <TransitoCrud
      config={{
        titulo: "Fiscalização em Campo",
        descricao: "Abordagens, fiscalização móvel, geolocalização, veículos, condutores, medidas administrativas e evidências.",
        tabela: "transito_fiscalizacoes",
        campoTitulo: "protocolo",
        campoStatus: "status",
        statusOpcoes: ["ABERTA", "EM_ANDAMENTO", "CONCLUIDA", "CANCELADA"],
        campos: [{"nome": "protocolo", "rotulo": "Protocolo", "tipo": "text", "obrigatorio": true, "colunaLista": true}, {"nome": "tipo", "rotulo": "Tipo de fiscalização", "tipo": "select", "obrigatorio": true, "colunaLista": true, "opcoes": ["ABORDAGEM", "BLITZ", "PATRULHAMENTO", "DENUNCIA", "OUTRA"]}, {"nome": "placa", "rotulo": "Placa", "tipo": "text", "obrigatorio": false, "colunaLista": true}, {"nome": "condutor_nome", "rotulo": "Condutor", "tipo": "text", "obrigatorio": false, "colunaLista": true}, {"nome": "local", "rotulo": "Local", "tipo": "text", "obrigatorio": true, "colunaLista": true}, {"nome": "data_hora", "rotulo": "Data e hora", "tipo": "datetime-local", "obrigatorio": true, "colunaLista": true}, {"nome": "status", "rotulo": "Status", "tipo": "select", "obrigatorio": true, "colunaLista": true, "opcoes": ["ABERTA", "EM_ANDAMENTO", "CONCLUIDA", "CANCELADA"]}, {"nome": "medidas_administrativas", "rotulo": "Medidas administrativas", "tipo": "textarea", "obrigatorio": false, "colunaLista": false}, {"nome": "observacoes", "rotulo": "Observações", "tipo": "textarea", "obrigatorio": false, "colunaLista": false}]
      }}
    />
  );
}
