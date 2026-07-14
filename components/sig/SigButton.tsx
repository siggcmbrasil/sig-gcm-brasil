"use client";

import type { LucideIcon } from "lucide-react";
import type {
  ButtonHTMLAttributes,
  ReactNode,
} from "react";

type SigButtonType =
  | "gold"
  | "blue"
  | "green"
  | "red"
  | "gray"
  | "cyan"
  | "primary"
  | "secondary"
  | "success"
  | "danger";

type SigButtonProps = {
  children: ReactNode;
  type?: SigButtonType;
  icon?: LucideIcon;
  loading?: boolean;
  fullWidth?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
} & Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  "type"
> & {
  htmlType?: "button" | "submit" | "reset";
};

const cores: Record<SigButtonType, string> = {
  gold:
    "border-blue-500/40 bg-blue-600 text-white hover:bg-blue-500",
  blue:
    "border-blue-500/40 bg-blue-600 text-white hover:bg-blue-500",
  primary:
    "border-blue-500/40 bg-blue-600 text-white hover:bg-blue-500",
  cyan:
    "border-cyan-400/30 bg-cyan-500/15 text-cyan-100 hover:bg-cyan-500/25",
  green:
    "border-emerald-500/35 bg-emerald-600 text-white hover:bg-emerald-500",
  success:
    "border-emerald-500/35 bg-emerald-600 text-white hover:bg-emerald-500",
  red:
    "border-red-500/35 bg-red-500/12 text-red-100 hover:bg-red-500/22",
  danger:
    "border-red-500/35 bg-red-500/12 text-red-100 hover:bg-red-500/22",
  gray:
    "border-slate-700 bg-slate-800 text-white hover:bg-slate-700",
  secondary:
    "border-slate-700 bg-slate-800 text-white hover:bg-slate-700",
};

const tamanhos = {
  sm: "min-h-10 px-3 text-sm",
  md: "min-h-12 px-4 text-sm",
  lg: "min-h-14 px-5 text-base",
};

export default function SigButton({
  children,
  onClick,
  disabled = false,
  type = "primary",
  icon: Icon,
  loading = false,
  fullWidth = false,
  size = "md",
  className = "",
  htmlType = "button",
  ...rest
}: SigButtonProps) {
  return (
    <button
      type={htmlType}
      onClick={onClick}
      disabled={disabled || loading}
      className={`
        inline-flex items-center justify-center gap-2
        rounded-2xl border font-black
        shadow-[0_10px_28px_rgba(0,0,0,.18)]
        transition-all duration-200
        hover:-translate-y-0.5
        active:translate-y-0
        disabled:cursor-not-allowed
        disabled:opacity-45
        disabled:hover:translate-y-0
        ${cores[type]}
        ${tamanhos[size]}
        ${fullWidth ? "w-full" : ""}
        ${className}
      `}
      {...rest}
    >
      {loading ? (
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
      ) : Icon ? (
        <Icon className="h-4 w-4 shrink-0" />
      ) : null}

      <span>{children}</span>
    </button>
  );
}
