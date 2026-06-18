import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import {
  ArrowUpRight, Target, Crosshair, ShieldCheck, AlertTriangle, ScanLine,
  Activity, TrendingUp, Database,
} from "lucide-react";
import { fraudApi } from "../api/client";
import { PageHeader } from "../components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle, PageLoader, Badge } from "../components/ui";
import { pct, dec, num } from "../lib/format";

function MiniStat({ icon: Icon, label, value, accent, to }) {
  const Wrapper = to ? Link : "div";
  return (
    <Wrapper
      to={to}
      className={`group flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 transition-all ${
        to ? "hover:border-slate-300 hover:shadow-sm" : ""
      }`}
    >
      <div className={`p-2 rounded-lg ${accent ? "bg-accent-50 text-accent-700" : "bg-slate-100 text-slate-700"}`}>
        <Icon className="w-4 h-4" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-[11px] text-slate-500 uppercase tracking-wider leading-tight">{label}</div>
        <div className="text-xl font-bold text-slate-900 leading-tight mt-0.5 tabular-nums">{value}</div>
      </div>
      {to && <ArrowUpRight className="w-4 h-4 text-slate-300 group-hover:text-accent-600 transition-colors" />}
    </Wrapper>
  );
}

export default function DashboardPage() {
  const meta = useQuery({ queryKey: ["meta"], queryFn: fraudApi.meta });
  const ov = useQuery({ queryKey: ["overview"], queryFn: fraudApi.overview });

  if (meta.isLoading || ov.isLoading) return <PageLoader />;
  const m = meta.data?.metrics ?? {};
  const o = ov.data;
  const recall = m.Recall ?? 0;
  const coverage = Math.round(recall * 100);
  const donut = o.bands.map((b) => ({ status: b.name, count: b.total, fill: b.fill }));
  const topModels = [...o.benchmark].sort((a, b) => b.aucpr - a.aucpr);
  const maxAucpr = topModels[0].aucpr;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tableau de bord"
        description="Détection de fraude aux remboursements de santé - vue d'ensemble du modèle en production."
      />

      {/* Hero + santé */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2 bg-slate-900 border-slate-900 text-white overflow-hidden relative">
          <div className="absolute -right-10 -top-10 w-48 h-48 rounded-full bg-accent-500/20 blur-2xl" />
          <div className="absolute -left-5 -bottom-5 w-32 h-32 rounded-full bg-accent-500/10 blur-xl" />
          <CardContent className="py-6 relative">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-xs uppercase tracking-wider text-white/50">Taux de détection (recall, test)</div>
                <div className="text-5xl font-bold mt-1 tabular-nums">{pct(recall, 1)}</div>
                <div className="text-sm text-white/70 mt-1">
                  {o.deployment.tp} fraudes détectées / {o.test.frauds} · précision {pct(o.deployment.precision)}
                </div>
              </div>
              <Link
                to="/analyse"
                className="inline-flex items-center gap-1.5 rounded-lg bg-accent-500 hover:bg-accent-600 px-3 py-1.5 text-xs font-medium shadow-sm shadow-accent-500/40"
              >
                Analyser <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            <div className="mt-5">
              <div className="flex justify-between text-[11px] text-white/60 mb-1.5">
                <span>Couverture de la cible institutionnelle (≥ 80 %)</span>
                <span className="font-medium text-white/90 tabular-nums">{coverage}%</span>
              </div>
              <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
                <div className="h-full bg-accent-500 rounded-full transition-all" style={{ width: `${coverage}%` }} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Santé du modèle</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-500">Modèle champion</span>
              <Badge tone="mono">{meta.data.champion}</Badge>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-500">Sélection</span>
              <span className="text-slate-900 font-medium">AUC-PR (validation)</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-500">Anti-fuite</span>
              <Badge tone="success">Split 60/20/20</Badge>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-500">Supervision</span>
              <Badge tone="accent">Décision humaine</Badge>
            </div>
            <div className="pt-1 flex items-center gap-2 text-xs text-slate-500">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" /> Conforme RGPD Art. 22 · AI Act Art. 9/13/14/17
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Mini stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <MiniStat icon={Target} label="AUC-PR" value={dec(m["AUC-PR"], 3)} accent to="/modele" />
        <MiniStat icon={TrendingUp} label="AUC-ROC" value={dec(m["AUC-ROC"], 3)} to="/modele" />
        <MiniStat icon={Crosshair} label="Précision (test)" value={pct(m.Precision)} to="/modele" />
        <MiniStat icon={AlertTriangle} label="Faux positifs (test)" value={num(o.deployment.fp)} to="/modele" />
      </div>

      {/* Alerts strip */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">À surveiller</span>
        <Link
          to="/modele"
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-800 hover:border-amber-300 [&>svg]:text-amber-600"
        >
          <AlertTriangle className="w-3.5 h-3.5" /> {o.deployment.fn} fraudes non détectées (faux négatifs)
        </Link>
        <Link
          to="/modele"
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-800 hover:border-amber-300 [&>svg]:text-amber-600"
        >
          <AlertTriangle className="w-3.5 h-3.5" /> {o.deployment.fp} faux positifs à arbitrer par l'agent
        </Link>
      </div>

      {/* Donut + classement */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Répartition par bande de risque</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-6">
              <ResponsiveContainer width={120} height={120}>
                <PieChart>
                  <Pie data={donut} dataKey="count" innerRadius={34} outerRadius={56} paddingAngle={2}>
                    {donut.map((d, i) => (
                      <Cell key={i} fill={d.fill} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="flex-1 space-y-2">
                {o.bands.map((b) => (
                  <div key={b.key} className="flex items-center gap-2 text-sm">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: b.fill }} />
                    <span className="text-slate-600 flex-1">
                      {b.name} <span className="text-slate-400">· {b.frauds} fraudes</span>
                    </span>
                    <span className="font-medium text-slate-900 tabular-nums">{num(b.total)}</span>
                  </div>
                ))}
                <p className="pt-1 text-xs text-slate-500">
                  Sur {num(o.test.n)} transactions de test ({o.test.frauds} fraudes).
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Classement des modèles</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2.5">
              {topModels.map((mo, i) => (
                <li key={mo.model} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-700 truncate flex items-center gap-1.5">
                      {mo.champion && <Activity className="w-3 h-3 text-accent-600" />}
                      {mo.model}
                    </span>
                    <span className="text-slate-500 tabular-nums">{dec(mo.aucpr, 3)}</span>
                  </div>
                  <div className="h-1 rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className={i === 0 ? "h-full bg-accent-500" : "h-full bg-slate-700"}
                      style={{ width: `${(mo.aucpr / maxAucpr) * 100}%` }}
                    />
                  </div>
                </li>
              ))}
            </ul>
            <p className="mt-3 flex items-center gap-1.5 text-xs text-slate-500">
              <Database className="w-3.5 h-3.5" /> Champion départagé sur l'AUC-PR.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
