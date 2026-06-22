"use client";

export default function MobileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#02060f] text-white">
      {children}
    </div>
  );
}