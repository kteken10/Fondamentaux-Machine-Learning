import { cn } from "../../lib/cn";

// Tons alignés sur la palette : élevé = noir, modéré = orange, faible = slate.
const STATUS = {
  eleve: { color: "bg-slate-900", label: "Risque élevé" },
  modere: { color: "bg-accent-500", label: "Risque modéré" },
  faible: { color: "bg-slate-300", label: "Risque faible" },
  success: { color: "bg-emerald-500", label: "OK" },
  danger: { color: "bg-rose-500", label: "Critique" },
};

export function StatusDot({ status = "faible", label, className }) {
  const s = STATUS[status] || STATUS.faible;
  return (
    <span className={cn("inline-flex items-center gap-2 text-sm text-slate-700", className)}>
      <span className={cn("w-2 h-2 rounded-full", s.color)} />
      {label ?? s.label}
    </span>
  );
}
