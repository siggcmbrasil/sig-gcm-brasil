"use client";

import type { LucideIcon } from "lucide-react";

type SigButtonProps = {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  type?: "gold" | "blue" | "green" | "red" | "gray";
  icon?: LucideIcon;
  className?: string;
};

export default function SigButton({
  children,
  onClick,
  disabled = false,
  type = "gold",
  icon: Icon,
  className = "",
}: SigButtonProps) {
  const cores = {
    gold: "bg-yellow-500 hover:bg-yellow-400 text-black",
    blue: "bg-blue-700 hover:bg-blue-600 text-white",
    green: "bg-green-700 hover:bg-green-600 text-white",
    red: "bg-red-700 hover:bg-red-600 text-white",
    gray: "bg-slate-700 hover:bg-slate-600 text-white",
  };

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`
        inline-flex items-center justify-center gap-2
        rounded-xl px-4 py-2
        font-black text-sm
        transition
        disabled:opacity-50 disabled:cursor-not-allowed
        ${cores[type]}
        ${className}
      `}
    >
      {Icon && <Icon className="w-4 h-4" />}
      {children}
    </button>
  );
}