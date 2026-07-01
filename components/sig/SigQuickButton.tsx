"use client";

type Props = {
  texto: string;
  onClick: () => void;
};

export default function SigQuickButton({
  texto,
  onClick,
}: Props) {
  return (
    <button
      onClick={onClick}
      className="
        rounded-xl
        bg-slate-900
        border
        border-slate-700
        px-3
        py-2
        text-xs
        text-slate-200
        hover:border-yellow-500
        transition
      "
    >
      {texto}
    </button>
  );
}