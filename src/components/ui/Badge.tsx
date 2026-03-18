const stageColors: Record<string, string> = {
  ny: "bg-blue-100 text-blue-700",
  kontaktet: "bg-amber-100 text-amber-700",
  kvalifisert: "bg-purple-100 text-purple-700",
  kunde: "bg-emerald-100 text-emerald-700",
  idle: "bg-gray-100 text-gray-600",
  running: "bg-blue-100 text-blue-700",
  success: "bg-emerald-100 text-emerald-700",
  failed: "bg-red-100 text-red-700",
};

export function Badge({ label, className = "" }: { label: string; className?: string }) {
  const color = stageColors[label] ?? "bg-gray-100 text-gray-600";
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${color} ${className}`}>
      {label}
    </span>
  );
}
