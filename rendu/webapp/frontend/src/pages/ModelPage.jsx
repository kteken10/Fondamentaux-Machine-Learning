import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, ShieldCheck, Activity, AlertTriangle } from "lucide-react";
import { fraudApi } from "../api/client";
import { PageHeader } from "../components/PageHeader";
import {
  Card, CardHeader, CardTitle, CardContent, Badge, PageLoader,
  Tabs, TabsList, TabsTrigger, TabsContent,
} from "../components/ui";
import { dec, pct, num } from "../lib/format";

const KPI = [
  { key: "AUC-PR", label: "AUC-PR", fmt: (m) => dec(m["AUC-PR"], 3), target: "> 0,80" },
  { key: "AUC-ROC", label: "AUC-ROC", fmt: (m) => dec(m["AUC-ROC"], 3), target: "> 0,95" },
  { key: "Recall", label: "Recall (test)", fmt: (m) => pct(m.Recall), target: "≥ 80 %" },
  { key: "Precision", label: "Précision (test)", fmt: (m) => pct(m.Precision), target: "-" },
];

const GOV = [
  { article: "RGPD Art. 22", label: "Décision non entièrement automatisée", value: "Décision finale humaine" },
  { article: "AI Act Art. 9", label: "Gestion des risques", value: "Roadmap gouvernance 12 mois" },
  { article: "AI Act Art. 13", label: "Transparence", value: "Documentation + SHAP" },
  { article: "AI Act Art. 14", label: "Supervision humaine", value: "L'agent valide chaque alerte" },
  { article: "AI Act Art. 17", label: "Management qualité", value: "Audit interne / 6 mois" },
  { article: "RGPD Art. 15-17", label: "Droit d'accès / rectification", value: "Procédure de recours" },
];

export default function ModelPage() {
  const meta = useQuery({ queryKey: ["meta"], queryFn: fraudApi.meta });
  const ov = useQuery({ queryKey: ["overview"], queryFn: fraudApi.overview });
  if (meta.isLoading || ov.isLoading) return <PageLoader />;
  const m = meta.data.metrics;
  const o = ov.data;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Modèle - performance & gouvernance"
        description="Métriques mesurées sur le jeu de test jamais touché (split 60/20/20) et cadre de conformité."
      />

      <Tabs defaultValue="perf">
        <TabsList>
          <TabsTrigger value="perf">Performance</TabsTrigger>
          <TabsTrigger value="gov">Gouvernance & conformité</TabsTrigger>
        </TabsList>

        {/* PERFORMANCE */}
        <TabsContent value="perf" className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {KPI.map((k) => (
              <Card key={k.key}>
                <CardContent className="py-4">
                  <div className="text-[11px] uppercase tracking-wider text-slate-400">{k.label}</div>
                  <div className="mt-1 text-2xl font-bold text-slate-900 tabular-nums">{k.fmt(m)}</div>
                  <div className="mt-1 text-xs text-slate-500">Cible {k.target}</div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card className="overflow-hidden">
            <CardHeader>
              <CardTitle>Benchmark des modèles (métriques sur le test)</CardTitle>
            </CardHeader>
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-5 py-3 text-left font-semibold">Modèle</th>
                  <th className="px-5 py-3 text-right font-semibold">AUC-ROC</th>
                  <th className="px-5 py-3 text-right font-semibold">AUC-PR</th>
                  <th className="px-5 py-3 text-right font-semibold">Recall</th>
                  <th className="px-5 py-3 text-right font-semibold">Précision</th>
                  <th className="px-5 py-3 text-right font-semibold">F1</th>
                  <th className="px-5 py-3 text-right font-semibold">FP</th>
                  <th className="px-5 py-3 text-right font-semibold">FN</th>
                  <th className="px-5 py-3 text-left font-semibold"></th>
                </tr>
              </thead>
              <tbody>
                {o.benchmark.map((b) => (
                  <tr key={b.model} className="border-t border-slate-100 hover:bg-slate-50">
                    <td className="px-5 py-3 font-medium text-slate-900">{b.model}</td>
                    <td className="px-5 py-3 text-right tabular-nums text-slate-700">{dec(b.aucroc, 3)}</td>
                    <td className="px-5 py-3 text-right tabular-nums font-semibold text-slate-900">{dec(b.aucpr, 3)}</td>
                    <td className="px-5 py-3 text-right tabular-nums text-slate-700">{dec(b.recall, 3)}</td>
                    <td className="px-5 py-3 text-right tabular-nums text-slate-700">{dec(b.precision, 3)}</td>
                    <td className="px-5 py-3 text-right tabular-nums text-slate-700">{dec(b.f1, 3)}</td>
                    <td className="px-5 py-3 text-right tabular-nums text-slate-700">{b.fp}</td>
                    <td className="px-5 py-3 text-right tabular-nums text-slate-700">{b.fn}</td>
                    <td className="px-5 py-3">{b.champion && <Badge tone="accent">Champion</Badge>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card className="overflow-hidden">
              <CardHeader>
                <CardTitle>Stratégies de déséquilibre (validation)</CardTitle>
              </CardHeader>
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="px-5 py-3 text-left font-semibold">Stratégie</th>
                    <th className="px-5 py-3 text-right font-semibold">AUC-PR</th>
                    <th className="px-5 py-3 text-right font-semibold">Seuil</th>
                  </tr>
                </thead>
                <tbody>
                  {o.strategies.map((s) => (
                    <tr key={s.name} className="border-t border-slate-100">
                      <td className="px-5 py-2.5 text-slate-800">{s.name}</td>
                      <td className="px-5 py-2.5 text-right tabular-nums text-slate-700">{dec(s.aucpr, 4)}</td>
                      <td className="px-5 py-2.5 text-right">
                        <Badge tone={s.healthy ? "success" : "danger"}>
                          {dec(s.thr, 3)} {s.healthy ? "· sain" : "· ~1"}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <CardContent>
                <p className="text-xs text-slate-500">
                  La double-correction SMOTE + scale_pos_weight produit un seuil pathologique (~1) : écartée.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Données & points de fonctionnement</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2.5 text-sm">
                <Row label="Dataset (après déduplication)" value={`${num(o.dataset.dedup)} transactions`} />
                <Row label="Split train / val / test" value={`${num(o.dataset.train)} / ${num(o.dataset.val)} / ${num(o.dataset.test)}`} />
                <Row label="Point F1-optimal (test)" value={`Recall ${pct(o.f1opt.recall)} · Préc. ${pct(o.f1opt.precision)} · ${o.f1opt.fp} FP`} />
                <Row label="Point de déploiement (test)" value={`Recall ${pct(o.deployment.recall)} · Préc. ${pct(o.deployment.precision)} · ${o.deployment.fp} FP`} />
                <Row label="Seuil de déploiement" value={dec(o.deployment.threshold, 4)} />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* GOUVERNANCE */}
        <TabsContent value="gov" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Cadre réglementaire (système à haut risque - AI Act Annexe III)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {GOV.map((g) => (
                <div key={g.article} className="flex items-center gap-3 border-b border-slate-100 pb-3 last:border-0 last:pb-0">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                  <Badge tone="neutral" className="font-mono">{g.article}</Badge>
                  <span className="text-sm text-slate-600 flex-1">{g.label}</span>
                  <span className="text-sm font-medium text-slate-900">{g.value}</span>
                </div>
              ))}
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Activity className="w-4 h-4 text-accent-600" /> Monitoring & MLOps</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-slate-600">
                <p>• Monitoring hebdomadaire : distribution des scores, taux FP/FN.</p>
                <p>• Drift : test de Kolmogorov-Smirnov sur V1-V28 et le montant.</p>
                <p>• Alerte : dégradation du recall &gt; 5 % sur 30 jours glissants.</p>
                <p>• Retraining : sur drift détecté ou tous les 3 mois.</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-emerald-500" /> Garde-fous</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-slate-600">
                <p>• Chiffrement AES-256, accès restreint par rôle, journalisation.</p>
                <p>• Supervision humaine obligatoire sur chaque alerte.</p>
                <p>• Procédure de recours citoyen.</p>
                <p className="flex items-center gap-1.5 text-amber-700">
                  <AlertTriangle className="w-3.5 h-3.5" /> Dataset 2013 (proxy) : réentraînement requis avant production CPAM.
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-slate-500">{label}</span>
      <span className="font-medium text-slate-900 tabular-nums">{value}</span>
    </div>
  );
}
