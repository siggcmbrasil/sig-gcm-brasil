"use client";

import { Search } from "lucide-react";

type Props = {
  value: string;
  onChange: (valor: string) => void;
  placeholder?: string;
};

export default function SigSearch({
  value,
  onChange,
  placeholder = "Pesquisar...",
}: Props) {
  return (
    <div className="relative">
      <Search className="w-5 h-5 text-slate-400 absolute left-4 top-3" />

      <input
        className="input pl-12"
        value={value}
        onChange={(e) =>
          onChange(e.target.value)
        }
        placeholder={placeholder}
      />
    </div>
  );
}