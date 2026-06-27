"use client";

import { ReactNode } from "react";

type Props = {
  title: string;
  cor?:
    | "blue"
    | "green"
    | "yellow"
    | "red"
    | "purple"
    | "gray";
  onClick?: () => void;
  children: ReactNode;
  disabled?: boolean;
};

export default function BotaoAcao({
  title,
  cor = "gray",
  onClick,
  children,
  disabled = false,
}: Props) {
  const cores = {
    blue: "bg-blue-900/40 hover:bg-blue-800 text-blue-300",
    green: "bg-green-900/40 hover:bg-green-800 text-green-300",
    yellow: "bg-yellow-900/40 hover:bg-yellow-800 text-yellow-300",
    red: "bg-red-900/40 hover:bg-red-800 text-red-300",
    purple: "bg-purple-900/40 hover:bg-purple-800 text-purple-300",
    gray: "bg-slate-800 hover:bg-slate-700 text-slate-300",
  };

  return (
    <button
      type="button"
      title={title}
      disabled={disabled}
      onClick={onClick}
      className={`
        w-10 h-10
        rounded-xl
        flex items-center justify-center
        transition-all duration-200
        border border-white/5
        ${cores[cor]}
        ${disabled ? "opacity-40 cursor-not-allowed" : ""}
      `}
    >
      {children}
    </button>
  );
}