"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Award, Plus } from "lucide-react";
import { supabase } from "@/lib/supabase";
import SigPageHeader from "@/components/sig/SigPageHeader";
import SigCard from "@/components/sig/SigCard";
import SigButton from "@/components/sig/SigButton";

export default function MedalhasPage() {
  const params = useParams();
  const guardaId = Number(params.id);

  const [medalhas, setMedalhas] = useState<any[]>([]);
  const [nome, setNome] = useState("");
  const [tipo, setTipo] = useState("");
  const [instituicao, setInstituicao] = useState("");
  const [dataConcessao, setDataConcessao] = useState("");
  const [decreto, setDecreto] = useState("");
  const [descricao, setDescricao] = useState("");

  useEffect(() => {
    carregar();
  }, []);

  async function carregar() {
    const usuario = JSON.parse(
      localStorage.getItem("usuarioLogado") || "{}"
    );

    const { data } = await supabase
      .from("medalhas_guardas")
      .select("*")
      .eq("municipio_id", usuario.municipio_id)
      .eq("guarda_id", guardaId)
      .order("data_concessao", {
        ascending: false,
      });

    setMedalhas(data || []);
  }

  async function salvar() {
    if (!nome) {
      alert("Informe a medalha.");
      return;
    }

    const usuario = JSON.parse(
      localStorage.getItem("usuarioLogado") || "{}"
    );

    const { error } = await supabase
      .from("medalhas_guardas")
      .insert({
        municipio_id: usuario.municipio_id,
        guarda_id: guardaId,
        nome,
        tipo,
        instituicao,
        data_concessao:
          dataConcessao || null,
        decreto: decreto || null,
        descricao:
          descricao || null,
        criado_por: usuario.id,
      });

    if (error) {
      alert(error.message);
      return;
    }

    setNome("");
    setTipo("");
    setInstituicao("");
    setDataConcessao("");
    setDecreto("");
    setDescricao("");

    carregar();

    alert("Medalha cadastrada.");
  }

  async function excluir(id: number) {
    if (
      !confirm(
        "Deseja excluir esta medalha?"
      )
    )
      return;

    const { error } = await supabase
      .from("medalhas_guardas")
      .delete()
      .eq("id", id);

    if (error) {
      alert(error.message);
      return;
    }

    carregar();
  }

  return (
    <div className="p-4 md:p-6 pb-24 space-y-6">
      <SigPageHeader
        titulo="Medalhas"
        subtitulo="Condecorações e honrarias do guarda."
        icone={Award}
      />

      <SigCard>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="label">
              Medalha
            </label>

            <input
              className="input"
              value={nome}
              onChange={(e) =>
                setNome(e.target.value)
              }
            />
          </div>

          <div>
            <label className="label">
              Tipo
            </label>

            <input
              className="input"
              value={tipo}
              onChange={(e) =>
                setTipo(e.target.value)
              }
            />
          </div>

          <div>
            <label className="label">
              Instituição
            </label>

            <input
              className="input"
              value={instituicao}
              onChange={(e) =>
                setInstituicao(
                  e.target.value
                )
              }
            />
          </div>

          <div>
            <label className="label">
              Data
            </label>

            <input
              type="date"
              className="input"
              value={dataConcessao}
              onChange={(e) =>
                setDataConcessao(
                  e.target.value
                )
              }
            />
          </div>

          <div className="md:col-span-2">
            <label className="label">
              Decreto/Portaria
            </label>

            <input
              className="input"
              value={decreto}
              onChange={(e) =>
                setDecreto(
                  e.target.value
                )
              }
            />
          </div>

          <div className="md:col-span-2">
            <label className="label">
              Descrição
            </label>

            <textarea
              className="input h-28"
              value={descricao}
              onChange={(e) =>
                setDescricao(
                  e.target.value
                )
              }
            />
          </div>
        </div>

        <div className="mt-5">
          <SigButton
            type="green"
            onClick={salvar}
          >
            <Plus className="w-4 h-4" />
            Salvar Medalha
          </SigButton>
        </div>
      </SigCard>

      <div className="grid gap-4">
        {medalhas.map((m) => (
          <SigCard key={m.id}>
            <h2 className="text-xl font-black text-white">
              🏅 {m.nome}
            </h2>

            <p className="text-slate-400 mt-2">
              {m.tipo}
            </p>

            <p className="text-slate-400">
              {m.instituicao}
            </p>

            <p className="text-slate-400">
              {m.data_concessao}
            </p>

            {m.decreto && (
              <p className="text-slate-400">
                Decreto: {m.decreto}
              </p>
            )}

            {m.descricao && (
              <p className="text-slate-300 mt-3">
                {m.descricao}
              </p>
            )}

            <button
              onClick={() =>
                excluir(m.id)
              }
              className="mt-4 text-red-400 text-sm font-bold"
            >
              Excluir
            </button>
          </SigCard>
        ))}
      </div>
    </div>
  );
}