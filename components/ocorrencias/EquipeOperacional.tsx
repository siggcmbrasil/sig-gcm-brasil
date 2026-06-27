import CardFormularioSIG from "./CardFormularioSIG";
type Guarda = {
  id: number;
  matricula: string;
  nome: string;
};

type Viatura = {
  id: number;
  prefixo: string;
  modelo: string;
};

type GuarnicaoCompleta = {
  id: number;
  nome: string;
  comandante_id: number | null;
  viatura_id: number | null;
};

export default function EquipeOperacional({
  guarnicoes,
  guardas,
  viaturas,
  guarnicaoId,
  setGuarnicaoId,
  guardaResponsavelId,
  setGuardaResponsavelId,
  viaturaId,
  setViaturaId,
  setViaturaEmpenhada,
}: {
  guarnicoes: GuarnicaoCompleta[];
  guardas: Guarda[];
  viaturas: Viatura[];
  guarnicaoId: string;
  setGuarnicaoId: (valor: string) => void;
  guardaResponsavelId: string;
  setGuardaResponsavelId: (valor: string) => void;
  viaturaId: string;
  setViaturaId: (valor: string) => void;
  setViaturaEmpenhada: (valor: string) => void;
}) {
  return (
    <CardFormularioSIG
  icone="👮"
  titulo="Equipe Operacional"
  descricao="Selecione a guarnição empenhada no atendimento."
>
  <div className="grid grid-cols-1 gap-4">
    <div>
      <label className="label">Guarnição empenhada</label>

      <select
        className="input"
        value={guarnicaoId}
        onChange={(e) => {
  const id = e.target.value;
  setGuarnicaoId(id);

  const guarnicao = guarnicoes.find(
    (g) => String(g.id) === id
  );

  if (!guarnicao) {
    setGuardaResponsavelId("");
    setViaturaId("");
    setViaturaEmpenhada("");
    return;
  }

  setGuardaResponsavelId(
    guarnicao.comandante_id ? String(guarnicao.comandante_id) : ""
  );

  setViaturaId(
    guarnicao.viatura_id ? String(guarnicao.viatura_id) : ""
  );

  const viatura = viaturas.find(
    (v) => v.id === guarnicao.viatura_id
  );

  setViaturaEmpenhada(viatura?.prefixo || "");
}}
      >
        <option value="">Selecione a guarnição</option>

        {guarnicoes.map((g) => (
          <option key={g.id} value={g.id}>
            {g.nome}
          </option>
        ))}
      </select>
    </div>
  </div>

  {(guardaResponsavelId || viaturaId) && (
    <div className="mt-5 rounded-xl border border-slate-700 bg-slate-950/40 p-4">
      <h3 className="font-bold text-lg mb-4">
        👮 Dados automáticos da guarnição
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <p className="text-slate-400 text-sm">Guarda responsável</p>
          <p className="font-semibold">
            {guardas.find((g) => String(g.id) === guardaResponsavelId)?.nome ||
              "Não definido"}
          </p>
        </div>

        <div>
          <p className="text-slate-400 text-sm">Viatura</p>
          <p className="font-semibold">
            {viaturas.find((v) => String(v.id) === viaturaId)?.prefixo ||
              "Não definida"}
            {viaturas.find((v) => String(v.id) === viaturaId)?.modelo
              ? ` - ${
                  viaturas.find((v) => String(v.id) === viaturaId)?.modelo
                }`
              : ""}
          </p>
        </div>
      </div>
    </div>
  )}
</CardFormularioSIG>
  );
}