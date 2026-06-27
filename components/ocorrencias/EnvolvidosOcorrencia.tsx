import SecaoRecolhivel from "./SecaoRecolhivel";
import { TIPOS_ENVOLVIDO } from "@/lib/modelosOcorrencia";
import {
  formatarCPF,
  formatarRG,
  formatarCNH,
} from "@/lib/formatadores";

type GuardaHistorico = {
  id: number;
  protocolo: string;
  data: string;
  status: string;
};

type Envolvido = {
  nome: string;
  tipo_documento: string;
  documento: string;
  telefone: string;
  endereco: string;
  tipo: string;
  observacao: string;
};

export default function EnvolvidosOcorrencia({
  envolvidos,
  adicionarEnvolvido,
  removerEnvolvido,
  atualizarEnvolvido,
  preencherPessoa,
  consultarHistoricoEnvolvido,
  historicoEnvolvido,
}: {
  envolvidos: Envolvido[];
  adicionarEnvolvido: () => void;
  removerEnvolvido: (index: number) => void;
  atualizarEnvolvido: (index: number, campo: keyof Envolvido, valor: string) => void;
  preencherPessoa: (
  index: number,
  documento: string
) => Promise<void>;
  consultarHistoricoEnvolvido: (valor: string) => void;
  historicoEnvolvido: GuardaHistorico[];
}) {
  return (
    <SecaoRecolhivel
  icone="👥"
  titulo="Envolvidos"
  contador={envolvidos.length}
  descricao="Cadastre as pessoas relacionadas à ocorrência."
>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4">
        <button
          type="button"
          onClick={adicionarEnvolvido}
          className="rounded-lg border border-[#C9A227] px-5 py-2 font-semibold text-white hover:bg-[#C9A227]/10 transition"
        >
          Adicionar envolvido
        </button>
      </div>

      <div className="space-y-5">
        {envolvidos.map((pessoa, index) => (
          <div
            key={index}
            className="rounded-xl border border-[#C9A227] bg-[#07152E] p-5 space-y-5"
          >
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-bold text-[#C9A227]">
  Envolvido {index + 1}
</h3>

              <button
                type="button"
                onClick={() => removerEnvolvido(index)}
                className="rounded-lg border border-red-500 px-3 py-2 text-sm font-semibold text-red-400 hover:bg-red-950/40"
              >
                Remover
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
              <div className="md:col-span-4">
                <CampoLocal
                  label="Nome completo"
                  valor={pessoa.nome}
                  setValor={(valor) =>
                    atualizarEnvolvido(index, "nome", valor)
                  }
                  placeholder="Nome do envolvido"
                />
              </div>

              <div className="md:col-span-2">
  <label className="label">Tipo do Documento</label>

  <select
    className="input"
    value={pessoa.tipo_documento || "CPF"}
    onChange={(e) =>
      atualizarEnvolvido(index, "tipo_documento", e.target.value)
    }
  >
    <option value="CPF">CPF</option>
    <option value="RG">RG</option>
    <option value="CNH">CNH</option>
    <option value="PASSAPORTE">Passaporte</option>
    <option value="OUTRO">Outro</option>
  </select>
</div>

<div className="md:col-span-2">
  <label className="label">Documento</label>

  <input
  className="input"
  value={pessoa.documento}
  maxLength={
    pessoa.tipo_documento === "CPF"
      ? 14
      : pessoa.tipo_documento === "CNH"
      ? 11
      : pessoa.tipo_documento === "RG"
      ? 12
      : 20
  }
  placeholder={
    pessoa.tipo_documento === "CPF"
      ? "000.000.000-00"
      : pessoa.tipo_documento === "CNH"
      ? "Número da CNH"
      : pessoa.tipo_documento === "RG"
      ? "Número do RG"
      : "Número do documento"
  }
  onChange={async (e) => {
  let valor = e.target.value;

  if (pessoa.tipo_documento === "CPF") {
    valor = formatarCPF(valor);
  } else if (pessoa.tipo_documento === "RG") {
    valor = formatarRG(valor);
  } else if (pessoa.tipo_documento === "CNH") {
    valor = formatarCNH(valor);
  }

  atualizarEnvolvido(index, "documento", valor);

  if (
    (pessoa.tipo_documento === "CPF" && valor.length === 14) ||
    (pessoa.tipo_documento === "CNH" && valor.length === 11) ||
    (pessoa.tipo_documento === "RG" && valor.length >= 7)
  ) {
    await preencherPessoa(index, valor);
await consultarHistoricoEnvolvido(valor);
  }
}}
/>
</div>

              <div className="md:col-span-2">
                <div className="md:col-span-2">
  <label className="label">Telefone</label>

  <input
    className="input"
    value={pessoa.telefone}
    maxLength={15}
    placeholder="(75) 99999-9999"
    onChange={(e) => {
      let valor = e.target.value
        .replace(/\D/g, "")
        .slice(0, 11);

      valor = valor
        .replace(/^(\d{2})(\d)/, "($1) $2")
        .replace(/(\d{5})(\d)/, "$1-$2");

      atualizarEnvolvido(index, "telefone", valor);
    }}
  />
</div>
              </div>

              <div className="md:col-span-2">
                <label className="label">Tipo</label>
                <select
                  className="input"
                  value={pessoa.tipo}
                  onChange={(e) =>
                    atualizarEnvolvido(index, "tipo", e.target.value)
                  }
                >
                  <option value="">Selecione</option>

                  {TIPOS_ENVOLVIDO.map((tipo) => (
                    <option key={tipo} value={tipo}>
                      {tipo}
                    </option>
                  ))}
                </select>
              </div>

              {historicoEnvolvido.length > 0 && pessoa.documento && (
                <div className="md:col-span-12 bg-purple-950/30 border border-purple-700 rounded-xl p-4">
                  <p className="font-bold text-purple-400">
                    👤 Histórico encontrado para este envolvido
                  </p>

                  <p className="text-sm text-slate-300 mt-1">
                    {historicoEnvolvido.length} ocorrência(s) relacionada(s).
                  </p>

                  <div className="mt-3 space-y-2">
                    {historicoEnvolvido.slice(0, 3).map((oc) => (
                      <div
                        key={oc.id}
                        className="bg-slate-950/50 border border-slate-700 rounded-lg p-3 text-sm"
                      >
                        <p className="font-semibold">{oc.protocolo}</p>
                        <p className="text-slate-400">
                          Data: {oc.data} • Status: {oc.status}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="md:col-span-6">
                <CampoLocal
                  label="Endereço"
                  valor={pessoa.endereco}
                  setValor={(valor) =>
                    atualizarEnvolvido(index, "endereco", valor)
                  }
                  placeholder="Endereço do envolvido"
                />
              </div>

              <div className="md:col-span-6">
                <label className="label">Observação</label>
                <textarea
                  className="input h-24 resize-none"
                  value={pessoa.observacao}
                  onChange={(e) =>
                    atualizarEnvolvido(index, "observacao", e.target.value)
                  }
                  placeholder="Informações adicionais sobre este envolvido"
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </SecaoRecolhivel>
  );
}

function CampoLocal({
  label,
  valor,
  setValor,
  placeholder,
}: {
  label: string;
  valor: string;
  setValor: (valor: string) => void;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="label">{label}</label>
      <input
        className="input"
        placeholder={placeholder}
        value={valor}
        onChange={(e) => setValor(e.target.value)}
      />
    </div>
  );
}