import TransitoCrud from "@/components/transito/TransitoCrud";

export default function Page() {
  return (
    <TransitoCrud
      config={{
        titulo: "Autos de Infração",
        descricao: "Talonário eletrônico, enquadramento, veículo, condutor, agente, evidências, impressão e acompanhamento.",
        tabela: "transito_autos_infracao",
        campoTitulo: "numero",
        campoStatus: "status",
        statusOpcoes: ["RASCUNHO", "LAVRADO", "NOTIFICADO", "PAGO", "CANCELADO"],
        campos: [{"nome": "numero", "rotulo": "Número do auto", "tipo": "text", "obrigatorio": true, "colunaLista": true}, {"nome": "placa", "rotulo": "Placa", "tipo": "text", "obrigatorio": true, "colunaLista": true}, {"nome": "enquadramento", "rotulo": "Enquadramento CTB", "tipo": "text", "obrigatorio": true, "colunaLista": true}, {"nome": "descricao_infracao", "rotulo": "Descrição da infração", "tipo": "textarea", "obrigatorio": true, "colunaLista": false}, {"nome": "local", "rotulo": "Local", "tipo": "text", "obrigatorio": true, "colunaLista": true}, {"nome": "data_hora", "rotulo": "Data e hora", "tipo": "datetime-local", "obrigatorio": true, "colunaLista": true}, {"nome": "valor_multa", "rotulo": "Valor da multa", "tipo": "number", "obrigatorio": false, "colunaLista": false}, {"nome": "pontos", "rotulo": "Pontos", "tipo": "number", "obrigatorio": false, "colunaLista": false}, {"nome": "status", "rotulo": "Status", "tipo": "select", "obrigatorio": true, "colunaLista": true, "opcoes": ["RASCUNHO", "LAVRADO", "NOTIFICADO", "PAGO", "CANCELADO"]}, {"nome": "observacoes", "rotulo": "Observações", "tipo": "textarea", "obrigatorio": false, "colunaLista": false}]
      }}
    />
  );
}
