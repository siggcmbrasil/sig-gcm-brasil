import TransitoCrud from "@/components/transito/TransitoCrud";

export default function Page() {
  return (
    <TransitoCrud
      config={{
        titulo: "Veículos e Condutores",
        descricao: "Cadastro e histórico municipal de veículos e condutores relacionados às ações de trânsito.",
        tabela: "transito_veiculos_condutores",
        campoTitulo: "identificador",
        campoStatus: "status",
        statusOpcoes: ["REGULAR", "ATENCAO", "RESTRICAO", "BLOQUEADO"],
        campos: [{"nome": "identificador", "rotulo": "Placa/CPF/CNH", "tipo": "text", "obrigatorio": true, "colunaLista": true}, {"nome": "tipo", "rotulo": "Tipo", "tipo": "select", "obrigatorio": true, "colunaLista": true, "opcoes": ["VEICULO", "CONDUTOR"]}, {"nome": "nome", "rotulo": "Nome/Proprietário", "tipo": "text", "obrigatorio": false, "colunaLista": true}, {"nome": "marca_modelo", "rotulo": "Marca/Modelo", "tipo": "text", "obrigatorio": false, "colunaLista": true}, {"nome": "documento", "rotulo": "Documento complementar", "tipo": "text", "obrigatorio": false, "colunaLista": true}, {"nome": "status", "rotulo": "Status", "tipo": "select", "obrigatorio": true, "colunaLista": true, "opcoes": ["REGULAR", "ATENCAO", "RESTRICAO", "BLOQUEADO"]}, {"nome": "alerta", "rotulo": "Alerta", "tipo": "textarea", "obrigatorio": false, "colunaLista": false}, {"nome": "observacoes", "rotulo": "Observações", "tipo": "textarea", "obrigatorio": false, "colunaLista": false}]
      }}
    />
  );
}
