"use client";

import Link from "next/link";

export default function MobileActionCard({
  href,
  icon: Icone,
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
  const classe =
    color === "red"
      ? "border-red-400/30 bg-red-600"
      : "border-blue-400/30 bg-blue-600";

  return (
    <Link
      href={href}
      className={`min-h-28 rounded-3xl border p-5 text-white shadow-xl active:scale-[0.99] ${classe}`}
    >
      <Icone className="h-9 w-9" />
      <p className="mt-3 text-xl font-black">{title}</p>
      <p className="mt-1 text-sm text-white/75">{subtitle}</p>
    </Link>
  );
}
