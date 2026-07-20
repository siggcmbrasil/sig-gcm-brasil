import TransitoCrud from "@/components/transito/TransitoCrud";

export default function Page() {
  return (
    <TransitoCrud
      config={{
        titulo: "Pátio e Remoções",
        descricao: "Entrada, vistoria, custódia, taxas, liberação e histórico de veículos removidos.",
        tabela: "transito_patio_veiculos",
        campoTitulo: "placa",
        campoStatus: "status",
        statusOpcoes: ["CUSTODIADO", "AGUARDANDO_LIBERACAO", "LIBERADO", "LEILAO"],
        campos: [{"nome": "placa", "rotulo": "Placa", "tipo": "text", "obrigatorio": true, "colunaLista": true}, {"nome": "chassi", "rotulo": "Chassi", "tipo": "text", "obrigatorio": false, "colunaLista": true}, {"nome": "marca_modelo", "rotulo": "Marca/Modelo", "tipo": "text", "obrigatorio": true, "colunaLista": true}, {"nome": "motivo_remocao", "rotulo": "Motivo da remoção", "tipo": "text", "obrigatorio": true, "colunaLista": true}, {"nome": "entrada_em", "rotulo": "Entrada", "tipo": "datetime-local", "obrigatorio": true, "colunaLista": true}, {"nome": "saida_em", "rotulo": "Saída", "tipo": "datetime-local", "obrigatorio": false, "colunaLista": false}, {"nome": "status", "rotulo": "Status", "tipo": "select", "obrigatorio": true, "colunaLista": true, "opcoes": ["CUSTODIADO", "AGUARDANDO_LIBERACAO", "LIBERADO", "LEILAO"]}, {"nome": "valor_taxas", "rotulo": "Taxas", "tipo": "number", "obrigatorio": false, "colunaLista": false}, {"nome": "observacoes", "rotulo": "Observações", "tipo": "textarea", "obrigatorio": false, "colunaLista": false}]
      }}
    />
  );
}
