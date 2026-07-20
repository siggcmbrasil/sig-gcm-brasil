import TransitoCrud from "@/components/transito/TransitoCrud";

export default function Page() {
  return (
    <TransitoCrud
      config={{
        titulo: "Configurações do SIG Trânsito",
        descricao: "Órgão autuador, código, talonário, autoridade, integrações e parâmetros institucionais.",
        tabela: "transito_configuracoes",
        campoTitulo: "orgao_nome",
        campoStatus: "status",
        statusOpcoes: ["ATIVO", "INATIVO"],
        campos: [{"nome": "orgao_nome", "rotulo": "Nome do órgão", "tipo": "text", "obrigatorio": true, "colunaLista": true}, {"nome": "orgao_codigo", "rotulo": "Código do órgão", "tipo": "text", "obrigatorio": true, "colunaLista": true}, {"nome": "autoridade_transito", "rotulo": "Autoridade de trânsito", "tipo": "text", "obrigatorio": false, "colunaLista": true}, {"nome": "prefixo_auto", "rotulo": "Prefixo do auto", "tipo": "text", "obrigatorio": false, "colunaLista": true}, {"nome": "ultimo_numero_auto", "rotulo": "Último número", "tipo": "number", "obrigatorio": false, "colunaLista": true}, {"nome": "status", "rotulo": "Status", "tipo": "select", "obrigatorio": true, "colunaLista": true, "opcoes": ["ATIVO", "INATIVO"]}, {"nome": "endereco", "rotulo": "Endereço institucional", "tipo": "text", "obrigatorio": false, "colunaLista": false}, {"nome": "observacoes", "rotulo": "Observações", "tipo": "textarea", "obrigatorio": false, "colunaLista": false}]
      }}
    />
  );
}
