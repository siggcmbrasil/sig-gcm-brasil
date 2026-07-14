// EXEMPLOS DE USO DO COMPONENTE
//
// 1) Em uma ocorrência concluída:
//
// <PublicarNoFeedButton
//   municipioId={ocorrencia.municipio_id}
//   usuarioId={usuario.id}
//   titulo={`Ocorrência ${ocorrencia.numero}`}
//   texto={`Ocorrência atendida em ${ocorrencia.local}. Desfecho: ${ocorrencia.desfecho}.`}
//   modulo="OCORRENCIAS"
//   registroId={ocorrencia.id}
// />
//
// 2) Em um patrulhamento finalizado:
//
// <PublicarNoFeedButton
//   municipioId={patrulhamento.municipio_id}
//   usuarioId={usuario.id}
//   titulo="Patrulhamento finalizado"
//   texto={`A equipe percorreu ${patrulhamento.distancia_km} km e realizou ${patrulhamento.total_visitas} visitas preventivas.`}
//   modulo="PATRULHAMENTO"
//   registroId={patrulhamento.id}
// />
//
// 3) Em uma operação especial:
//
// <PublicarNoFeedButton
//   municipioId={operacao.municipio_id}
//   usuarioId={usuario.id}
//   titulo={operacao.nome}
//   texto={`Operação concluída em ${operacao.local}. Resultado: ${operacao.resultado}.`}
//   modulo="OPERACOES"
//   registroId={operacao.id}
//   imagemUrl={operacao.imagem_url}
// />
