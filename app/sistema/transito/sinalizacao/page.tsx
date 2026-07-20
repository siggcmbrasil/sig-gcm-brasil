import TransitoCrud from "@/components/transito/TransitoCrud";

export default function Page() {
  return (
    <TransitoCrud
      config={{
        titulo: "Sinalização Viária",
        descricao: "Inventário de placas, semáforos, pintura, defensas, defeitos, inspeções e manutenção.",
        tabela: "transito_sinalizacao",
        campoTitulo: "codigo",
        campoStatus: "status",
        statusOpcoes: ["ATIVA", "DANIFICADA", "MANUTENCAO", "REMOVIDA"],
        campos: [{"nome": "codigo", "rotulo": "Código patrimonial", "tipo": "text", "obrigatorio": true, "colunaLista": true}, {"nome": "tipo", "rotulo": "Tipo", "tipo": "select", "obrigatorio": true, "colunaLista": true, "opcoes": ["PLACA", "SEMAFORO", "PINTURA", "DEFENSA", "LOMBADA", "OUTRO"]}, {"nome": "descricao", "rotulo": "Descrição", "tipo": "text", "obrigatorio": true, "colunaLista": true}, {"nome": "endereco", "rotulo": "Endereço", "tipo": "text", "obrigatorio": true, "colunaLista": true}, {"nome": "estado_conservacao", "rotulo": "Conservação", "tipo": "select", "obrigatorio": true, "colunaLista": true, "opcoes": ["OTIMO", "BOM", "REGULAR", "RUIM", "CRITICO"]}, {"nome": "status", "rotulo": "Status", "tipo": "select", "obrigatorio": true, "colunaLista": true, "opcoes": ["ATIVA", "DANIFICADA", "MANUTENCAO", "REMOVIDA"]}, {"nome": "ultima_inspecao", "rotulo": "Última inspeção", "tipo": "date", "obrigatorio": false, "colunaLista": false}, {"nome": "observacoes", "rotulo": "Observações", "tipo": "textarea", "obrigatorio": false, "colunaLista": false}]
      }}
    />
  );
}
