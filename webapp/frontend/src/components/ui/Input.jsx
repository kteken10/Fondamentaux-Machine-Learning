import { ChevronDown } from "lucide-react";
import { cn } from "../../lib/cn";

export function Input({ className, error, ...props }) {
  return (
    <input
      className={cn(
        "w-full h-10 px-3 rounded-lg border bg-white text-sm placeholder:text-slate-400",
        "focus:outline-none focus:ring-2",
        error
          ? "border-rose-300 focus:border-rose-400 focus:ring-rose-500/30"
          : "border-slate-300 focus:border-slate-400 focus:ring-accent-500/20",
        className
      )}
      {...props}
    />
  );
}

export function Select({ className, children, ...props }) {
  return (
    <div className="relative">
      <select
        className={cn(
          "w-full h-10 pl-3 pr-9 rounded-lg border border-slate-300 bg-white text-sm appearance-none",
          "focus:outline-none focus:ring-2 focus:border-slate-400 focus:ring-accent-500/20",
          className
        )}
        {...props}
      >
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
    </div>
  );
}

export function FormField({ label, error, hint, htmlFor, children }) {
  return (
    <div>
      {label && (
        <label htmlFor={htmlFor} className="mb-1.5 block text-sm font-medium text-slate-700">
          {label}
        </label>
      )}
      {children}
      {error ? (
        <p className="mt-1 text-xs text-rose-600">{error}</p>
      ) : hint ? (
        <p className="mt-1 text-xs text-slate-500">{hint}</p>
      ) : null}
    </div>
  );
}
