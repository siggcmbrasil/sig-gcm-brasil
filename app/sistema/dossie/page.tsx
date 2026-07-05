"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import {
  User,
  FileText,
  TriangleAlert,
  Award,
  GraduationCap,
  CalendarDays,
  Shield,
  ClipboardList,
  History,
  Phone,
  BadgeInfo,
  BarChart3,
} from "lucide-react";

type Guarda = {
  id: number;
  nome: string;
  matricula: string;
  telefone?: string;
  email?: string;
  status?: string;
  cargo?: string;
};

export default function DossiePage() {
  const [guardas, setGuardas] = useState<Guarda[]>([]);
  const [guardaId, setGuardaId] = useState("");
  const [guarda, setGuarda] = useState<Guarda | null>(null);
  const [carregando, setCarregando] = useState(false);
  const usuario =
  typeof window !== "undefined"
    ? JSON.parse(localStorage.getItem("usuarioLogado") || "{}")
    : {};

  useEffect(() => {
    carregarGuardas();
  }, []);

  async function carregarGuardas() {
    if (!usuario?.municipio_id) {
  alert("Município não identificado.");
  return;
}

const { data, error } = await supabase
  .from("guardas")
  .select("id, nome, matricula")
  .eq("municipio_id", usuario.municipio_id)
  .order("nome");

    if (error) {
      alert(error.message);
      return;
    }

    setGuardas(data || []);
  }

  async function buscarDossie(id: string) {
    if (!id) {
      setGuarda(null);
      return;
    }

    setCarregando(true);
    setGuarda(null);

    const { data, error } = await supabase
      .from("guardas")
      .select("*")
      .eq("id", Number(id))
.eq("municipio_id", usuario.municipio_id)
.single();

    setCarregando(false);

    if (error) {
      alert(error.message);
      return;
    }

    setGuarda(data);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black">Dossiê do Guarda</h1>
        <p className="text-slate-400">Consulta completa do servidor.</p>
      </div>

      <select
        value={guardaId}
        onChange={(e) => {
          setGuardaId(e.target.value);
          buscarDossie(e.target.value);
        }}
        className="w-full rounded-xl border border-slate-700 bg-slate-900 p-3 text-white"
      >
        <option className="bg-white text-black" value="">
          Selecione o Guarda
        </option>

        {guardas.map((g) => (
          <option className="bg-white text-black" key={g.id} value={g.id}>
            {g.nome} - {g.matricula}
          </option>
        ))}
      </select>

      {carregando && <p className="text-slate-400">Carregando dossiê...</p>}

      {guarda && (
        <>
          <div className="painel-premium p-6 space-y-4">
            <div className="flex items-center gap-3">
              <User className="w-6 h-6 text-blue-400" />
              <h2 className="text-2xl font-bold">{guarda.nome}</h2>
            </div>

            <div className="grid md:grid-cols-2 gap-3 text-slate-300">
              <p><BadgeInfo className="inline w-4 h-4 mr-2" />Matrícula: {guarda.matricula || "-"}</p>
              <p><Phone className="inline w-4 h-4 mr-2" />Telefone: {guarda.telefone || "-"}</p>
              <p>Email: {guarda.email || "-"}</p>
              <p>Status: {guarda.status || "-"}</p>
              <p>Cargo: {guarda.cargo || "-"}</p>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            <CardDossie icone={<FileText />} titulo="Documentos" />
            <CardDossie icone={<TriangleAlert />} titulo="Advertências" />
            <CardDossie icone={<Award />} titulo="Elogios" />
            <CardDossie icone={<GraduationCap />} titulo="Cursos" />
            <CardDossie icone={<CalendarDays />} titulo="Escalas" />
            <CardDossie icone={<Shield />} titulo="Patrulhamentos" />
            <CardDossie icone={<ClipboardList />} titulo="Ocorrências" />
            <CardDossie icone={<History />} titulo="Histórico" />
            <CardDossie icone={<BarChart3 />} titulo="Estatísticas" />
          </div>
        </>
      )}
    </div>
  );
}

function CardDossie({
  icone,
  titulo,
}: {
  icone: React.ReactNode;
  titulo: string;
}) {
  return (
    <div className="painel-premium p-4 flex items-center gap-3">
      <div className="text-blue-400">{icone}</div>
      <span className="font-bold">{titulo}</span>
    </div>
  );
}