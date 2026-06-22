"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import jsPDF from "jspdf";

export default function OficiosPage() {
  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [destinatario, setDestinatario] = useState("");
  const [cargoDestinatario, setCargoDestinatario] = useState("");
  const [assunto, setAssunto] = useState("");
  const [texto, setTexto] = useState("");
  const [oficios, setOficios] = useState<any[]>([]);
  const [numeroEditavel, setNumeroEditavel] = useState("");

  const usuario =
    typeof window !== "undefined"
      ? JSON.parse(localStorage.getItem("usuarioLogado") || "{}")
      : {};

  async function carregarOficios() {
    const { data } = await supabase
      .from("oficios")
      .select("*")
      .order("id", { ascending: false });

    setOficios(data || []);
  }

  useEffect(() => {
    carregarOficios();
  }, []);

  async function excluirOficio(id: number) {
  const confirmar = confirm(
    "Deseja realmente excluir este ofício?"
  );

  if (!confirmar) return;

  await supabase
    .from("oficios")
    .delete()
    .eq("id", id);

  carregarOficios();
}

  async function salvarOficio() {
    if (!destinatario || !assunto || !texto) {
      alert("Preencha destinatário, assunto e texto.");
      return;
    }

    const ano = new Date().getFullYear();

const municipioId = usuario.municipio_id || 1;

const { count } = await supabase
  .from("oficios")
  .select("*", {
    count: "exact",
    head: true,
  })
  .eq("municipio_id", municipioId);

const numero =
  numeroEditavel ||
  `OF-${String((count || 0) + 1).padStart(3, "0")}/${ano}`;

  if (editandoId) {
  const { error } = await supabase
    .from("oficios")
    .update({
      numero: numero,
      destinatario,
      cargo_destinatario: cargoDestinatario,
      assunto,
      texto,
    })
    .eq("id", editandoId);

  if (error) {
    alert("Erro ao atualizar ofício.");
    return;
  }

  alert("Ofício atualizado com sucesso!");

  setEditandoId(null);
  setNumeroEditavel("");
  setDestinatario("");
  setCargoDestinatario("");
  setAssunto("");
  setTexto("");
  carregarOficios();
  return;
}

    const { error } = await supabase.from("oficios").insert([
      {
        municipio_id: municipioId,
        numero,
        tipo: "Ofício",
        destinatario,
        cargo_destinatario: cargoDestinatario,
        assunto,
        texto,
        responsavel: usuario.nome || "",
        status: "EMITIDO",
      },
    ]);

    if (error) {
      alert("Erro ao salvar ofício.");
      return;
    }

    alert("Ofício criado com sucesso!");

setNumeroEditavel("");
setDestinatario("");
setCargoDestinatario("");
setAssunto("");
setTexto("");

carregarOficios();
  }

  async function alterarStatus(
  id: number,
  status: string
) {
  await supabase
    .from("oficios")
    .update({ status })
    .eq("id", id);

  carregarOficios();
}

function editarOficio(oficio: any) {
  setEditandoId(oficio.id);
  setNumeroEditavel(oficio.numero || "");
  setDestinatario(oficio.destinatario || "");
  setCargoDestinatario(oficio.cargo_destinatario || "");
  setAssunto(oficio.assunto || "");
  setTexto(oficio.texto || "");
}

  async function gerarPDF(oficio: any) {
  const doc = new jsPDF();

  const { data: municipio } = await supabase
  .from("municipios")
  .select("*")
  .eq("id", oficio.municipio_id)
  .single();

const nomeGuarda = municipio?.nome_guarda || "GUARDA CIVIL MUNICIPAL";
const nomeMunicipio = municipio?.nome || "";

const brasaoPrefeitura = municipio?.brasao_prefeitura || "";
const brasaoGCM = municipio?.brasao_gcm || "";

const imgPrefeitura = new Image();
imgPrefeitura.src = brasaoPrefeitura;

const imgGCM = new Image();
imgGCM.src = brasaoGCM;

try {
  doc.addImage(imgPrefeitura, "PNG", 10, 5, 22, 22);
  doc.addImage(imgGCM, "PNG", 178, 5, 22, 22);
} catch {}

  const dataEmissao = new Date().toLocaleString("pt-BR");

  doc.setFontSize(18);
  doc.text(nomeGuarda, 105, 15, {
  align: "center",
});

doc.setFontSize(11);
doc.text(`Município de ${nomeMunicipio}`, 105, 22, {
  align: "center",
});

   doc.setFontSize(16);
  doc.text(`OFÍCIO Nº ${oficio.numero}`, 105, 35, {
    align: "center",
  });

  doc.setFontSize(11);

  doc.text(`Data de Emissão: ${dataEmissao}`, 14, 48);
  doc.text(`Assunto: ${oficio.assunto}`, 14, 58);
  doc.text(`Destinatário: ${oficio.destinatario}`, 14, 68);

  if (oficio.cargo_destinatario) {
    doc.text(
      `Cargo: ${oficio.cargo_destinatario}`,
      14,
      78
    );
  }

  const textoQuebrado = doc.splitTextToSize(
    oficio.texto || "",
    180
  );

  doc.text(textoQuebrado, 14, 100);

  doc.text("Atenciosamente,", 14, 220);

  doc.text(
    "__________________________________",
    14,
    245
  );

  doc.text(
    oficio.responsavel || "Responsável",
    25,
    253
  );

  doc.setFontSize(9);

  doc.text(
    "Documento gerado pelo SIG-GCM Brasil",
    105,
    285,
    {
      align: "center",
    }
  );

  doc.save(`${oficio.numero}.pdf`);
}

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold">Ofícios</h1>

      <section className="card max-w-3xl space-y-4">
        <h2 className="text-xl font-bold">Criar Ofício</h2>

<input
  className="input"
  placeholder="Número do Ofício (opcional)"
  value={numeroEditavel}
  onChange={(e) => setNumeroEditavel(e.target.value)}
/>

        <input
          className="input"
          placeholder="Destinatário"
          value={destinatario}
          onChange={(e) => setDestinatario(e.target.value)}
        />

        <input
          className="input"
          placeholder="Cargo do destinatário"
          value={cargoDestinatario}
          onChange={(e) => setCargoDestinatario(e.target.value)}
        />

        <input
          className="input"
          placeholder="Assunto"
          value={assunto}
          onChange={(e) => setAssunto(e.target.value)}
        />

        <textarea
          className="input h-48"
          placeholder="Texto do ofício"
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
        />

        <button onClick={salvarOficio} className="btn-primary">
  {editandoId ? "Atualizar Ofício" : "Salvar Ofício"}
</button>
      </section>

      <section className="card">
        <h2 className="text-xl font-bold mb-4">Ofícios Emitidos</h2>

        {oficios.length === 0 ? (
          <p className="text-slate-400">Nenhum ofício criado.</p>
        ) : (
          <div className="space-y-3">
            {oficios.map((oficio) => (
              <div
                key={oficio.id}
                className="border border-slate-700 rounded-xl p-4 flex justify-between items-center"
              >
                <div>
                  <p className="font-bold">{oficio.numero}</p>
                  <p className="text-slate-400">{oficio.assunto}</p>
                  <p className="text-xs text-green-400">{oficio.status}</p>
                  <p className="text-sm text-slate-500">
                    Para: {oficio.destinatario}
                  </p>
                </div>

                <button
                  onClick={() => gerarPDF(oficio)}
                  className="btn-primary"
                >
                  PDF
                </button>

<button
  onClick={() => alterarStatus(oficio.id, "ARQUIVADO")}
  className="bg-yellow-600 text-white px-3 py-2 rounded-lg"
>
  Arquivar
</button>

<button
  onClick={() => excluirOficio(oficio.id)}
  className="bg-red-700 text-white px-3 py-2 rounded-lg"
>
  Excluir
</button>
                
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}