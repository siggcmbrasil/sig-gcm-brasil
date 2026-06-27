import CardFormularioSIG from "./CardFormularioSIG";

type LocalCadastrado = {
  id: number;
  nome: string;
  tipo: string;
};

export default function LocalizacaoOcorrencia({
  bairro,
  setBairro,
  numero,
  setNumero,
  localId,
  setLocalId,
  setLocal,
  locais,
}: {
  bairro: string;
  setBairro: (valor: string) => void;
  numero: string;
  setNumero: (valor: string) => void;
  localId: string;
  setLocalId: (valor: string) => void;
  setLocal: (valor: string) => void;
  locais: LocalCadastrado[];
}) {
  return (
    <CardFormularioSIG
      icone="📍"
      titulo="Localização"
      descricao="Informe o bairro, local cadastrado e número da ocorrência."
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="label">Bairro</label>
          <input
            className="input"
            placeholder="Ex: Centro"
            value={bairro}
            onChange={(e) => setBairro(e.target.value)}
          />
        </div>

        <div>
          <label className="label">Local</label>
          <select
            className="input"
            value={localId}
            onChange={(e) => {
              const id = e.target.value;
              setLocalId(id);

              const localSelecionado = locais.find(
                (l) => String(l.id) === id
              );

              setLocal(localSelecionado?.nome || "");
            }}
          >
            <option value="">Selecione um local cadastrado</option>

            {locais.map((item) => (
              <option key={item.id} value={item.id}>
                {item.nome} - {item.tipo}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="label">Número</label>
          <input
            className="input"
            placeholder="S/N"
            value={numero}
            onChange={(e) => setNumero(e.target.value)}
          />
        </div>
      </div>
    </CardFormularioSIG>
  );
}