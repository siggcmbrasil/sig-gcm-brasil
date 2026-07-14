"use client";

import type { ReactNode } from "react";

type Props = {
  children: ReactNode;
  className?: string;
  padding?: "none" | "sm" | "md" | "lg";
  destaque?: boolean;
};

const paddingClasses = {
  none: "",
  sm: "p-4",
  md: "p-5 md:p-6",
  lg: "p-6 md:p-8",
};

export default function SigCard({
  children,
  className = "",
  padding = "md",
  destaque = false,
}: Props) {
  return (
    <section
      className={`
        rounded-[24px]
        border
        ${
          destaque
            ? "border-cyan-400/30 bg-cyan-400/[0.06]"
            : "border-slate-800/90 bg-[#07162b]/90"
        }
        shadow-[0_18px_55px_rgba(0,0,0,.22)]
        backdrop-blur-xl
        ${paddingClasses[padding]}
        ${className}
      `}
    >
      {children}
    </section>
  );
}
