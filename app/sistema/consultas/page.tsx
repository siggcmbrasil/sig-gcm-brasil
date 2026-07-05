"use client";

import { useEffect, useState } from "react";
import {
  Car,
  CheckCircle,
  FileSearch,
  Hash,
  Phone,
  Search,
  ShieldAlert,
  User,
} from "lucide-react";

import { supabase } from "@/lib/supabase";
import { registrarAuditoria } from "@/lib/auditoria";
import SigPageHeader from "@/components/sig/SigPageHeader";
import SigCard from "@/components/sig/SigCard";

const tiposConsulta = [
  { tipo: "CPF", titulo: "CPF", descricao: "Pessoa abordada", icone: User, placeholder: "Digite o CPF" },
  { tipo: "PLACA", titulo: "Placa", descricao: "Veículo abordado", icone: Car, placeholder: "Digite a placa" },
  { tipo: "RENAVAM", titulo: "RENAVAM", descricao: "Registro do veículo", icone: Hash, placeholder: "Digite o RENAVAM" },
  { tipo: "TELEFONE", titulo: "Telefone", descricao: "Contato relacionado", icone: Phone, placeholder: "Digite o telefone" },
];

export default function ConsultasPage() {
  const [tipo, setTipo] = useState("CPF");
  const [valor, setValor] = useState("");
  const [motivo, setMotivo] = useState("");
  const [resultado, setResultado] = useState<any>(null);
  const [historico, setHistorico] = useState<any[]>([]);
  const [salvando, setSalvando] = useState(false);

  const usuarioLogado =
    typeof window !== "undefined"
      ? JSON.parse(localStorage.getItem("usuarioLogado") || "{}")
      : {};

  const tipoAtual = tiposConsulta.find((item) => item.tipo === tipo) || tiposConsulta[0];

  useEffect(() => {
    carregarHistorico();
  }, []);

  function aplicarMascara(valorDigitado: string) {
    const limpo = valorDigitado.toUpperCase().replace(/[^A-Z0-9]/g, "");

    if (tipo === "CPF") {
      const n = limpo.replace(/\D/g, "").slice(0, 11);
      return n
        .replace(/^(\d{3})(\d)/, "$1.$2")
        .replace(/^(\d{3})\.(\d{3})(\d)/, "$1.$2.$3")
        .replace(/\.(\d{3})(\d)/, ".$1-$2");
    }

    if (tipo === "TELEFONE") {
      const n = limpo.replace(/\D/g, "").slice(0, 11);
      if (n.length <= 10) {
        return n
          .replace(/^(\d{2})(\d)/, "($1) $2")
          .replace(/(\d{4})(\d)/, "$1-$2");
      }
      return n
        .replace(/^(\d{2})(\d)/, "($1) $2")
        .replace(/(\d{5})(\d)/, "$1-$2");
    }

    if (tipo === "PLACA") {
      return limpo.slice(0, 7);
    }

    if (tipo === "RENAVAM") {
      return limpo.replace(/\D/g, "").slice(0, 11);
    }

    return valorDigitado;
  }

  async function carregarHistorico() {
    if (!usuarioLogado?.municipio_id) return;

    const { data } = await supabase
      .from("consultas_operacionais")
      .select("id, tipo, consulta, motivo, resultado, criado_em")
      .eq("municipio_id", usuarioLogado.municipio_id)
      .order("id", { ascending: false })
      .limit(5);

    setHistorico(data || []);
  }

  async function consultar() {
    if (!valor.trim() || !motivo.trim()) {
      alert("Informe o dado da consulta e o motivo.");
      return;
    }

    if (!usuarioLogado?.id || !usuarioLogado?.municipio_id) {
  alert("Sessão inválida.");
  return;
}

if (motivo.trim().length < 10) {
  alert("Informe um motivo mais detalhado para a consulta.");
  return;
}

if (motivo.length > 500) {
  alert("Motivo muito grande.");
  return;
}

if (valor.length > 30) {
  alert("Consulta muito grande.");
  return;
}

    setSalvando(true);

    const valorNormalizado = valor.trim().toUpperCase();

    const payload = {
      municipio_id: usuarioLogado.municipio_id,
      usuario_id: String(usuarioLogado?.id || ""),
      tipo,
      consulta: valorNormalizado,
      motivo: motivo.trim(),
      resultado: "EM_DESENVOLVIMENTO",
    };

    const { data, error } = await supabase
  .from("consultas_operacionais")
  .insert([payload])
  .select("id")
  .single();

    setSalvando(false);

if (error) {
  await registrarAuditoria({
    modulo: "Consultas Operacionais",
    acao: "ERRO",
    descricao: "Erro ao registrar consulta operacional.",
    tabela: "consultas_operacionais",
    detalhes: {
      erro: error.message,
      tipo,
      consulta: valorNormalizado,
    },
  });

  alert(`Erro ao registrar consulta: ${error.message}`);
  return;
}

await registrarAuditoria({
  modulo: "Consultas Operacionais",
  acao: "CONSULTAR",
  descricao: `Registrou consulta operacional do tipo ${tipo}.`,
  tabela: "consultas_operacionais",
  registro_id: data?.id,
  detalhes: {
    tipo,
    consulta: valorNormalizado,
    motivo: motivo.trim(),
  },
});

    setResultado({
      tipo,
      consulta: valorNormalizado,
      status: "REGISTRADA",
      mensagem: "Consulta registrada para auditoria.",
    });

    setMotivo("");
    await carregarHistorico();
  }

  return (
    <main className="p-4 md:p-6 pb-24 space-y-6 text-white">
      <SigPageHeader
        titulo="Consultas Operacionais"
        subtitulo="Consulta controlada de CPF, placa, RENAVAM e registros da rede SIG-GCM Brasil."
        icone={FileSearch}
      />

      <SigCard>
        <div className="flex items-start gap-4">
          <div className="rounded-2xl bg-cyan-500/10 border border-cyan-500/30 p-4">
            <ShieldAlert className="w-9 h-9 text-cyan-400" />
          </div>

          <div>
            <h2 className="text-xl font-black text-white">Consulta com auditoria</h2>
            <p className="text-slate-400 mt-2 leading-relaxed">
              Toda consulta exige motivo e fica registrada com município e usuário responsável.
            </p>
          </div>
        </div>
      </SigCard>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {tiposConsulta.map((item) => {
          const Icone = item.icone;
          const ativo = tipo === item.tipo;

          return (
            <button
              key={item.tipo}
              type="button"
              onClick={() => {
                setTipo(item.tipo);
                setValor("");
                setResultado(null);
              }}
              className={`rounded-2xl border p-5 text-left transition ${
                ativo
                  ? "border-cyan-400 bg-cyan-500/10 shadow-[0_0_20px_rgba(34,211,238,0.15)]"
                  : "border-slate-800 bg-slate-950/70 hover:border-cyan-500/40"
              }`}
            >
              <Icone className={`w-8 h-8 mb-4 ${ativo ? "text-cyan-400" : "text-slate-400"}`} />
              <h3 className="text-lg font-black text-white">{item.titulo}</h3>
              <p className="text-sm text-slate-400 mt-1">{item.descricao}</p>
            </button>
          );
        })}
      </div>

      <div className="grid xl:grid-cols-3 gap-6">
        <SigCard className="xl:col-span-2">
          <h2 className="text-xl font-black text-white mb-5">Nova consulta</h2>

          <div className="space-y-4">
            <div>
              <label className="label">Tipo selecionado</label>
              <input className="input" value={tipoAtual.titulo} disabled />
            </div>

            <div>
              <label className="label">Dado para consulta</label>
              <input
                value={valor}
                onChange={(e) => {
                  setValor(aplicarMascara(e.target.value));
                  setResultado(null);
                }}
                placeholder={tipoAtual.placeholder}
                className="input uppercase"
              />
            </div>

            <div>
              <label className="label">Motivo da consulta</label>
              <textarea
                value={motivo}
                onChange={(e) => setMotivo(e.target.value)}
                placeholder="Ex: abordagem, ocorrência, averiguação operacional..."
                className="input min-h-28 resize-none"
              />
            </div>

            <button
              type="button"
              onClick={consultar}
              disabled={salvando}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-cyan-500 px-6 py-3 text-sm font-black text-slate-950 hover:bg-cyan-400 transition disabled:opacity-50"
            >
              <Search className="w-5 h-5" />
              {salvando ? "Registrando..." : "Registrar Consulta"}
            </button>
          </div>
        </SigCard>

        <SigCard>
          <h2 className="text-xl font-black text-white mb-4">Resultado</h2>

          {!resultado ? (
            <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-5 text-slate-400">
              Informe o dado, registre o motivo e clique em consultar.
            </div>
          ) : (
            <div className="rounded-2xl border border-cyan-500/30 bg-cyan-500/10 p-5">
              <CheckCircle className="w-10 h-10 text-cyan-400 mb-3" />

              <h3 className="text-lg font-black text-white">Consulta registrada</h3>

              <p className="text-sm text-slate-300 mt-3">
                <strong>Tipo:</strong> {resultado.tipo}
              </p>

              <p className="text-sm text-slate-300">
                <strong>Consulta:</strong> {resultado.consulta}
              </p>

              <p className="text-sm text-cyan-400 mt-4 font-bold">
                {resultado.mensagem}
              </p>
            </div>
          )}

          <div className="mt-5">
            <h3 className="font-black text-white mb-3">Últimas consultas</h3>

            <div className="space-y-2">
              {historico.length === 0 ? (
                <p className="text-sm text-slate-500">Nenhuma consulta recente.</p>
              ) : (
                historico.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-xl border border-slate-800 bg-slate-950/70 p-3"
                  >
                    <p className="text-sm font-black text-white">
                      {item.tipo} • {item.consulta}
                    </p>
                    <p className="text-xs text-slate-500">
                      {item.resultado || "Registrada"}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        </SigCard>
      </div>
    </main>
  );
}