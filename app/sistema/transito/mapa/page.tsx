import TransitoCrud from "@/components/transito/TransitoCrud";

export default function Page() {
  return (
    <TransitoCrud
      config={{
        titulo: "Mapa e Pontos Críticos",
        descricao: "Cadastro georreferenciado de acidentes, infrações, congestionamentos, bloqueios e riscos viários.",
        tabela: "transito_pontos_mapa",
        campoTitulo: "titulo",
        campoStatus: "status",
        statusOpcoes: ["ATIVO", "MONITORAMENTO", "RESOLVIDO"],
        campos: [{"nome": "titulo", "rotulo": "Título", "tipo": "text", "obrigatorio": true, "colunaLista": true}, {"nome": "tipo", "rotulo": "Tipo", "tipo": "select", "obrigatorio": true, "colunaLista": true, "opcoes": ["ACIDENTE", "INFRACAO", "CONGESTIONAMENTO", "BLOQUEIO", "RISCO", "OBRA"]}, {"nome": "latitude", "rotulo": "Latitude", "tipo": "number", "obrigatorio": true, "colunaLista": true}, {"nome": "longitude", "rotulo": "Longitude", "tipo": "number", "obrigatorio": true, "colunaLista": true}, {"nome": "endereco", "rotulo": "Endereço", "tipo": "text", "obrigatorio": false, "colunaLista": true}, {"nome": "status", "rotulo": "Status", "tipo": "select", "obrigatorio": true, "colunaLista": true, "opcoes": ["ATIVO", "MONITORAMENTO", "RESOLVIDO"]}, {"nome": "nivel_risco", "rotulo": "Nível de risco", "tipo": "select", "obrigatorio": false, "colunaLista": true, "opcoes": ["BAIXO", "MEDIO", "ALTO", "CRITICO"]}, {"nome": "descricao", "rotulo": "Descrição", "tipo": "textarea", "obrigatorio": false, "colunaLista": false}]
      }}
    />
  );
}
