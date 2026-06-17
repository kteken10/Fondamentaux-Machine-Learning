import { useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import {
  LayoutDashboard, ScanLine, FileSpreadsheet, Activity, ShieldCheck,
  Menu, X, Search,
} from "lucide-react";
import { cn } from "../lib/cn";

const NAV = [
  {
    label: "Pilotage",
    items: [{ to: "/", icon: LayoutDashboard, label: "Tableau de bord", end: true }],
  },
  {
    label: "Détection",
    items: [
      { to: "/analyse", icon: ScanLine, label: "Analyser un dossier" },
      { to: "/lot", icon: FileSpreadsheet, label: "Analyse par lot" },
    ],
  },
  {
    label: "Modèle",
    items: [{ to: "/modele", icon: Activity, label: "Performance & gouvernance" }],
  },
];

function SidebarLink({ to, icon: Icon, label, end, onClick }) {
  return (
    <NavLink
      to={to}
      end={end}
      onClick={onClick}
      className={({ isActive }) =>
        cn(
          "group relative flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
          isActive
            ? "bg-accent-500 text-white shadow-sm shadow-accent-500/30"
            : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
        )
      }
    >
      <Icon className="w-4 h-4 flex-shrink-0" />
      <span>{label}</span>
    </NavLink>
  );
}

function SidebarContent({ onNavigate }) {
  return (
    <>
      <div className="px-5 py-5 border-b border-slate-200">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900 text-white">
            <Search className="w-4 h-4 text-accent-400" />
          </div>
          <div className="text-lg font-bold text-slate-900">
            Fraud<span className="text-accent-600">AI</span>
          </div>
        </div>
        <p className="mt-1 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
          Centre de détection · CPAM
        </p>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
        {NAV.map((section) => (
          <div key={section.label} className="space-y-1">
            <p className="px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              {section.label}
            </p>
            {section.items.map((it) => (
              <SidebarLink key={it.to} {...it} onClick={onNavigate} />
            ))}
          </div>
        ))}
      </nav>

      <div className="border-t border-slate-200 px-4 py-4">
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <ShieldCheck className="w-4 h-4 text-emerald-500" />
          <span>Outil d'aide à la décision · décision humaine</span>
        </div>
        <p className="mt-1 text-[11px] text-slate-400">RGPD Art. 22 · AI Act Art. 14</p>
      </div>
    </>
  );
}

export default function DashboardLayout() {
  const [open, setOpen] = useState(false);
  return (
    <div className="flex h-screen bg-slate-50">
      <aside className="hidden lg:flex lg:flex-col lg:w-64 bg-white border-r border-slate-200">
        <SidebarContent />
      </aside>

      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
          <aside className="absolute left-0 top-0 flex h-full w-64 flex-col bg-white border-r border-slate-200">
            <button
              onClick={() => setOpen(false)}
              className="absolute right-3 top-4 text-slate-400 hover:text-slate-700"
            >
              <X className="w-5 h-5" />
            </button>
            <SidebarContent onNavigate={() => setOpen(false)} />
          </aside>
        </div>
      )}

      <div className="flex-1 flex flex-col min-w-0">
        <header className="lg:hidden flex items-center gap-3 px-4 py-3 bg-white border-b border-slate-200">
          <button onClick={() => setOpen(true)} className="text-slate-600">
            <Menu className="w-5 h-5" />
          </button>
          <span className="font-bold text-slate-900">
            Fraud<span className="text-accent-600">AI</span>
          </span>
        </header>

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-[1600px] mx-auto w-full">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
