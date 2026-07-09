"use client";

import Link from "next/link";

export default function MobileActionCard({
  href,
  icon: Icon,
  title,
  subtitle,
  color,
}: {
  href: string;
  icon: any;
  title: string;
  subtitle: string;
  color: "red" | "blue";
}) {
  const classes =
    color === "red"
      ? "border-red-400/30 bg-red-600 text-red-50"
      : "border-blue-400/30 bg-blue-600 text-blue-50";

  return (
    <Link
      href={href}
      className={`h-24 rounded-3xl border p-4 shadow-xl active:scale-95 ${classes}`}
    >
      <Icon className="mb-2 h-8 w-8" />
      <p className="text-base font-black leading-tight">{title}</p>
      <p className="mt-0.5 text-[11px] opacity-90">{subtitle}</p>
    </Link>
  );
}