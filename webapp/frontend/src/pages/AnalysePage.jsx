import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { ScanLine, ArrowUp, ArrowDown, Scale, Info } from "lucide-react";
import { fraudApi } from "../api/client";
import { PageHeader } from "../components/PageHeader";
import {
  Card, CardHeader, CardTitle, CardContent, Button, Input, FormField, Badge, StatusDot, PageLoader,
} from "../components/ui";
import { formatError } from "../lib/format";

const BAND_TONE = { "RISQUE ELEVE": "danger", "RISQUE MODERE": "warning", "RISQUE FAIBLE": "success" };
const BAND_STATUS = { "RISQUE ELEVE": "eleve", "RISQUE MODERE": "modere", "RISQUE FAIBLE": "faible" };

export default function AnalysePage() {
  const meta = useQuery({ queryKey: ["meta"], queryFn: fraudApi.meta });
  const [amount, setAmount] = useState(100);
  const [hour, setHour] = useState(12);
  const [v, setV] = useState({});
  const [res, setRes] = useState(null);

  useEffect(() => {
    if (meta.data?.top_v) setV(Object.fromEntries(meta.data.top_v.map((k) => [k, 0])));
  }, [meta.data]);

  const mutation = useMutation({
    mutationFn: () => fraudApi.score({ amount, hour, v }),
    onSuccess: (data) => {
      setRes(data);
      if (data.level === "RISQUE ELEVE") toast.error("Dossier à risque élevé — contrôle prioritaire.");
      else toast.success("Analyse terminée.");
    },
    onError: (err) => toast.error(formatError(err)),
  });

  if (meta.isLoading) return <PageLoader />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Analyser un dossier"
        description="Saisissez une demande de remboursement ; le score est calculé par le modèle (XGBoost) et expliqué par SHAP."
      />

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Formulaire */}
        <Card>
          <CardHeader>
            <CardTitle>Demande de remboursement</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField label="Montant du remboursement (€)" htmlFor="amount">
              <Input
                id="amount"
                type="number"
                min={0}
                step={1}
                value={amount}
                onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
              />
            </FormField>

            <div>
              <div className="mb-1.5 flex justify-between text-sm font-medium text-slate-700">
                <span>Heure de la demande</span>
                <span className="font-mono text-slate-500">{hour}h</span>
              </div>
              <input
                type="range" min={0} max={23} value={hour}
                onChange={(e) => setHour(parseInt(e.target.value))}
                className="w-full accent-accent-500"
              />
            </div>

            <div>
              <p className="text-sm font-medium text-slate-700">Profil transactionnel anonymisé (ACP)</p>
              <p className="mb-3 text-xs text-slate-500">
                Composantes V issues de l'anonymisation RGPD ; valeurs par défaut neutres (0).
              </p>
              <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                {meta.data.top_v.map((k) => (
                  <div key={k}>
                    <label className="flex justify-between text-xs text-slate-600">
                      <span className="font-mono">{k}</span>
                      <span className="font-mono text-slate-400 tabular-nums">{(v[k] ?? 0).toFixed(1)}</span>
                    </label>
                    <input
                      type="range" min={-5} max={5} step={0.1} value={v[k] ?? 0}
                      onChange={(e) => setV({ ...v, [k]: parseFloat(e.target.value) })}
                      className="w-full accent-accent-500"
                    />
                  </div>
                ))}
              </div>
            </div>

            <Button variant="accent" className="w-full" loading={mutation.isPending} onClick={() => mutation.mutate()}>
              <ScanLine className="w-4 h-4" /> Analyser la demande
            </Button>
          </CardContent>
        </Card>

        {/* Résultat */}
        <Card>
          <CardHeader>
            <CardTitle>Résultat de l'analyse</CardTitle>
          </CardHeader>
          <CardContent>
            {!res ? (
              <div className="py-10 text-center text-sm text-slate-500">
                Renseignez les paramètres puis lancez l'analyse.
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-end gap-2">
                    <span className="text-5xl font-bold tabular-nums" style={{ color: res.color }}>
                      {res.score}
                    </span>
                    <span className="pb-2 text-lg text-slate-400">/100</span>
                  </div>
                  <Badge tone={BAND_TONE[res.level]}>{res.level}</Badge>
                </div>

                <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
                  <div className="h-full rounded-full transition-all" style={{ width: `${res.score}%`, background: res.color }} />
                </div>

                <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Action recommandée</span>
                    <span className="font-medium text-slate-900">{res.action}</span>
                  </div>
                  <div className="mt-1 flex justify-between">
                    <span className="text-slate-500">Priorité agent</span>
                    <StatusDot status={BAND_STATUS[res.level]} label={res.prio} />
                  </div>
                </div>

                <div>
                  <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                    Facteurs explicatifs (SHAP, top 6)
                  </p>
                  <table className="w-full text-sm">
                    <tbody>
                      {res.factors.map((f) => (
                        <tr key={f.feature} className="border-t border-slate-100">
                          <td className="py-1.5 font-mono text-xs text-slate-600">{f.feature}</td>
                          <td className="py-1.5 text-right tabular-nums text-slate-700">{f.contribution}</td>
                          <td className="py-1.5 pl-4">
                            {f.direction === "augmente" ? (
                              <span className="inline-flex items-center gap-1 text-rose-600">
                                <ArrowUp className="w-3 h-3" /> augmente le risque
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-emerald-600">
                                <ArrowDown className="w-3 h-3" /> réduit le risque
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                  <Scale className="mt-0.5 w-4 h-4 flex-shrink-0" />
                  <span>
                    La décision finale appartient à l'agent humain. Ce score est un outil d'aide à la décision
                    (RGPD Art. 22 / AI Act Art. 14).
                  </span>
                </div>
                <p className="flex items-center gap-1.5 text-xs text-slate-400">
                  <Info className="w-3.5 h-3.5" /> Probabilité brute : {res.proba} · seuil de décision : {res.threshold.toFixed(3)}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
