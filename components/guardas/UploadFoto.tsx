"use client";

import {
  Camera,
  ImagePlus,
  Loader2,
  Trash2,
  ZoomIn,
} from "lucide-react";
import {
  useEffect,
  useRef,
  useState,
} from "react";

import { supabase } from "@/lib/supabase";

import AvatarGuarda from "./AvatarGuarda";
import VisualizarFoto from "./VisualizarFoto";
import {
  adicionarVersaoFoto,
  caminhoFotoGuarda,
  criarPreviewFoto,
  liberarPreviewFoto,
  prepararFotoGuarda,
} from "./utils";

type UploadFotoProps = {
  municipioId: number;
  guardaId: number;
  nome: string;
  matricula?: string | null;
  graduacao?: string | null;
  fotoUrlInicial?: string | null;
  onFotoSalva?: (
    fotoUrl: string | null
  ) => void;
};

export default function UploadFoto({
  municipioId,
  guardaId,
  nome,
  matricula,
  graduacao,
  fotoUrlInicial,
  onFotoSalva,
}: UploadFotoProps) {
  const inputGaleriaRef =
    useRef<HTMLInputElement | null>(null);

  const inputCameraRef =
    useRef<HTMLInputElement | null>(null);

  const [fotoUrl, setFotoUrl] =
    useState(fotoUrlInicial || "");

  const [preview, setPreview] =
    useState("");

  const [arquivo, setArquivo] =
    useState<File | null>(null);

  const [processando, setProcessando] =
    useState(false);

  const [salvando, setSalvando] =
    useState(false);

  const [visualizando, setVisualizando] =
    useState(false);

  const [versao, setVersao] =
    useState(Date.now());

  useEffect(() => {
    setFotoUrl(fotoUrlInicial || "");
  }, [fotoUrlInicial]);

  useEffect(() => {
    return () => {
      liberarPreviewFoto(preview);
    };
  }, [preview]);

  async function selecionarArquivo(
    arquivoOriginal?: File
  ) {
    if (!arquivoOriginal) {
      return;
    }

    setProcessando(true);

    try {
      const preparada =
        await prepararFotoGuarda(
          arquivoOriginal
        );

      liberarPreviewFoto(preview);

      const novaPreview =
        criarPreviewFoto(preparada);

      setArquivo(preparada);
      setPreview(novaPreview);
    } catch (error) {
      alert(
        error instanceof Error
          ? error.message
          : "Não foi possível processar a foto."
      );
    } finally {
      setProcessando(false);
    }
  }

  async function salvarFoto() {
    if (!arquivo) {
      alert("Selecione uma foto.");
      return;
    }

    if (
      !Number.isSafeInteger(municipioId) ||
      municipioId <= 0 ||
      !Number.isSafeInteger(guardaId) ||
      guardaId <= 0
    ) {
      alert(
        "Município ou guarda inválido."
      );
      return;
    }

    setSalvando(true);

    try {
      const caminho =
        caminhoFotoGuarda({
          municipioId,
          guardaId,
        });

      const { error: uploadError } =
        await supabase.storage
          .from("fotos-guardas")
          .upload(
            caminho,
            arquivo,
            {
              upsert: true,
              cacheControl: "3600",
              contentType:
                "image/webp",
            }
          );

      if (uploadError) {
        throw new Error(
          uploadError.message
        );
      }

      const { data: urlData } =
        supabase.storage
          .from("fotos-guardas")
          .getPublicUrl(caminho);

      const novaUrl =
        urlData.publicUrl;

      const { error: updateError } =
        await supabase
          .from("guardas")
          .update({
            foto_url: novaUrl,
          })
          .eq("id", guardaId)
          .eq(
            "municipio_id",
            municipioId
          );

      if (updateError) {
        throw new Error(
          updateError.message
        );
      }

      liberarPreviewFoto(preview);

      setArquivo(null);
      setPreview("");
      setFotoUrl(novaUrl);
      setVersao(Date.now());

      onFotoSalva?.(novaUrl);

      alert(
        "Foto atualizada com sucesso."
      );
    } catch (error) {
      alert(
        error instanceof Error
          ? error.message
          : "Erro ao salvar a foto."
      );
    } finally {
      setSalvando(false);
    }
  }

  async function removerFoto() {
    if (
      !confirm(
        "Deseja remover a foto deste guarda?"
      )
    ) {
      return;
    }

    setSalvando(true);

    try {
      const caminho =
        caminhoFotoGuarda({
          municipioId,
          guardaId,
        });

      const { error: storageError } =
        await supabase.storage
          .from("fotos-guardas")
          .remove([caminho]);

      if (
        storageError &&
        !storageError.message
          .toLowerCase()
          .includes("not found")
      ) {
        throw new Error(
          storageError.message
        );
      }

      const { error: updateError } =
        await supabase
          .from("guardas")
          .update({
            foto_url: null,
          })
          .eq("id", guardaId)
          .eq(
            "municipio_id",
            municipioId
          );

      if (updateError) {
        throw new Error(
          updateError.message
        );
      }

      liberarPreviewFoto(preview);

      setArquivo(null);
      setPreview("");
      setFotoUrl("");
      setVersao(Date.now());

      onFotoSalva?.(null);

      alert(
        "Foto removida com sucesso."
      );
    } catch (error) {
      alert(
        error instanceof Error
          ? error.message
          : "Erro ao remover a foto."
      );
    } finally {
      setSalvando(false);
    }
  }

  const imagemAtual =
    preview ||
    adicionarVersaoFoto(
      fotoUrl,
      versao
    );

  return (
    <>
      <section className="rounded-3xl border border-cyan-500/20 bg-slate-950/70 p-5">
        <div className="flex flex-col gap-6 md:flex-row md:items-center">
          <button
            type="button"
            onClick={() => {
              if (imagemAtual) {
                setVisualizando(true);
              }
            }}
            className="relative mx-auto shrink-0 md:mx-0"
          >
            {imagemAtual ? (
              <img
                src={imagemAtual}
                alt={`Foto de ${nome}`}
                className="h-36 w-36 rounded-full border-4 border-cyan-500/30 object-cover shadow-xl"
              />
            ) : (
              <AvatarGuarda
                nome={nome}
                tamanho="xl"
                className="h-36 w-36"
              />
            )}

            {imagemAtual && (
              <span className="absolute bottom-1 right-1 rounded-full bg-cyan-500 p-2 text-slate-950">
                <ZoomIn className="h-4 w-4" />
              </span>
            )}
          </button>

          <div className="min-w-0 flex-1">
            <h3 className="text-xl font-black text-white">
              Foto funcional
            </h3>

            <p className="mt-1 text-sm leading-6 text-slate-400">
              A imagem será comprimida,
              convertida para WebP e
              armazenada em um único
              arquivo por guarda.
            </p>

            {arquivo && (
              <p className="mt-3 text-sm font-bold text-emerald-300">
                Foto pronta para salvar.
              </p>
            )}

            <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <button
                type="button"
                onClick={() =>
                  inputGaleriaRef.current?.click()
                }
                disabled={
                  processando ||
                  salvando
                }
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-cyan-500/25 bg-cyan-500/10 px-4 py-3 font-bold text-cyan-200 disabled:opacity-50"
              >
                {processando ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <ImagePlus className="h-5 w-5" />
                )}

                Escolher foto
              </button>

              <button
                type="button"
                onClick={() =>
                  inputCameraRef.current?.click()
                }
                disabled={
                  processando ||
                  salvando
                }
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-blue-500/25 bg-blue-500/10 px-4 py-3 font-bold text-blue-200 disabled:opacity-50"
              >
                <Camera className="h-5 w-5" />
                Abrir câmera
              </button>

              <button
                type="button"
                onClick={() =>
                  void salvarFoto()
                }
                disabled={
                  !arquivo ||
                  processando ||
                  salvando
                }
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-500 px-4 py-3 font-black text-slate-950 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {salvando ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <ImagePlus className="h-5 w-5" />
                )}

                Salvar foto
              </button>

              <button
                type="button"
                onClick={() =>
                  void removerFoto()
                }
                disabled={
                  !fotoUrl ||
                  salvando
                }
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-red-500/25 bg-red-500/10 px-4 py-3 font-bold text-red-200 disabled:opacity-50"
              >
                <Trash2 className="h-5 w-5" />
                Remover
              </button>
            </div>
          </div>
        </div>

        <input
          ref={inputGaleriaRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(event) => {
            void selecionarArquivo(
              event.target.files?.[0]
            );

            event.currentTarget.value =
              "";
          }}
        />

        <input
          ref={inputCameraRef}
          type="file"
          accept="image/*"
          capture="user"
          className="hidden"
          onChange={(event) => {
            void selecionarArquivo(
              event.target.files?.[0]
            );

            event.currentTarget.value =
              "";
          }}
        />
      </section>

      <VisualizarFoto
        aberto={visualizando}
        nome={nome}
        matricula={matricula}
        graduacao={graduacao}
        fotoUrl={
          preview || fotoUrl
        }
        versao={versao}
        onClose={() =>
          setVisualizando(false)
        }
      />
    </>
  );
}