"use client";

import {
  CalendarDays,
  Save,
} from "lucide-react";
import {
  useEffect,
  useState,
} from "react";
import { useRouter } from "next/navigation";

import { supabase } from "@/lib/supabase";
import SigCard from "@/components/sig/SigCard";
import SigPageHeader from "@/components/sig/SigPageHeader";
import { registrarAuditoria } from "@/lib/auditoria";
import ProtecaoModulo from "@/components/ProtecaoModulo";

export default function NovaFeriasPage() {
  const router = useRouter();

  const [guardas, setGuardas] =
    useState<any[]>([]);

  const [guardaId, setGuardaId] =
    useState("");

  const [tipo, setTipo] =
    useState("FÉRIAS");

  const [dataInicio, setDataInicio] =
    useState("");

  const [dataFim, setDataFim] =
    useState("");

  const [observacao, setObservacao] =
    useState("");

  useEffect(() => {
    carregarGuardas();
  }, []);

  async function carregarGuardas() {
    const usuario = JSON.parse(
  localStorage.getItem(
    "usuarioLogado"
  ) || "{}"
);

if (!usuario?.municipio_id) return;

if (!usuario?.id || !usuario?.municipio_id) {
  alert("Sessão inválida.");
  return;
}

if (!guardaId || !dataInicio || !dataFim) {
  alert("Preencha guarda, data inicial e data final.");
  return;
}

    const { data } = await supabase
      .from("guardas")
      .select("id,nome")
      .eq(
        "municipio_id",
        usuario.municipio_id
      )
      .order("nome");

    setGuardas(data || []);
  }

  async function salvar() {
    const usuario = JSON.parse(
      localStorage.getItem(
        "usuarioLogado"
      ) || "{}"
    );

    const { error } =
      await supabase
        .from("ferias_licencas")
        .insert({
          municipio_id:
            usuario.municipio_id,
          guarda_id: Number(guardaId),
status: "ATIVO",
          tipo,
          data_inicio: dataInicio,
          data_fim: dataFim,
          observacao: observacao.trim() || null,
        });

    if (error) {
      alert(error.message);
      return;
    }

    const guarda = guardas.find(
  (g) => String(g.id) === String(guardaId)
);

await registrarAuditoria({
  modulo: "Férias e Licenças",
  acao: "CRIAR",
  descricao: `Registrou ${tipo} para ${guarda?.nome || "guarda"}.`,
});

    alert("Registro salvo.");
    router.push(
      "/sistema/ferias-licencas"
    );
  }

  return (
  <ProtecaoModulo modulo="ferias_licencas">
    <div className="p-4 md:p-6 space-y-6">
      <SigPageHeader
        titulo="Nova Solicitação"
        subtitulo="Férias ou licença."
        icone={CalendarDays}
      />

      <SigCard>
        <div className="space-y-4">
          <select
            className="input"
            value={guardaId}
            onChange={(e) =>
              setGuardaId(
                e.target.value
              )
            }
          >
            <option value="">
              Selecione o guarda
            </option>

            {guardas.map((g) => (
              <option
                key={g.id}
                value={g.id}
              >
                {g.nome}
              </option>
            ))}
          </select>

          <select
            className="input"
            value={tipo}
            onChange={(e) =>
              setTipo(
                e.target.value
              )
            }
          >
            <option>
              FÉRIAS
            </option>
            <option>
              LICENÇA MÉDICA
            </option>
            <option>
              LICENÇA PRÊMIO
            </option>
            <option>
              AFASTAMENTO
            </option>
            <option>
              CURSO
            </option>
            <option>
              OUTROS
            </option>
          </select>

          <input
            type="date"
            className="input"
            value={dataInicio}
            onChange={(e) =>
              setDataInicio(
                e.target.value
              )
            }
          />

          <input
            type="date"
            className="input"
            value={dataFim}
            onChange={(e) =>
              setDataFim(
                e.target.value
              )
            }
          />

          <textarea
            className="input min-h-32"
            placeholder="Observações"
            value={observacao}
            onChange={(e) =>
              setObservacao(
                e.target.value
              )
            }
          />

          <button
            onClick={salvar}
            className="btn-primary inline-flex items-center gap-2"
          >
            <Save size={18} />
            Salvar
          </button>
        </div>
      </SigCard>
        </div>
  </ProtecaoModulo>
);
}