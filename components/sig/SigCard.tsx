"use client";

type Props = {
  children: React.ReactNode;
  className?: string;
};

export default function SigCard({
  children,
  className = "",
}: Props) {
  return (
    <div
      className={`
        painel-premium p-5
        ${className}
      `}
    >
      {children}
    </div>
  );
}