import { cn } from "../../lib/cn";

export function Spinner({ className }) {
  return (
    <span
      className={cn(
        "inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-r-transparent",
        className
      )}
    />
  );
}

export function PageLoader() {
  return (
    <div className="flex items-center justify-center py-24 text-slate-400">
      <Spinner className="h-6 w-6" />
    </div>
  );
}

export function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      {Icon && (
        <div className="bg-slate-100 p-4 rounded-2xl text-slate-500">
          <Icon className="w-8 h-8" />
        </div>
      )}
      <h3 className="mt-4 text-lg font-semibold text-slate-900">{title}</h3>
      {description && <p className="mt-1 text-sm text-slate-500 max-w-sm">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
