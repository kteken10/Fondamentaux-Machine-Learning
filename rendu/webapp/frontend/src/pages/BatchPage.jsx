import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { UploadCloud, FileSpreadsheet } from "lucide-react";
import { fraudApi } from "../api/client";
import { PageHeader } from "../components/PageHeader";
import { Card, CardContent, Badge, EmptyState, Spinner } from "../components/ui";
import { formatError, num } from "../lib/format";

const BAND_STATUS = { "RISQUE ELEVE": "eleve", "RISQUE MODERE": "modere", "RISQUE FAIBLE": "faible" };
const tone = (lvl) => (lvl === "RISQUE ELEVE" ? "danger" : lvl === "RISQUE MODERE" ? "warning" : "neutral");

export default function BatchPage() {
  const [result, setResult] = useState(null);
  const mutation = useMutation({
    mutationFn: (file) => fraudApi.batch(file),
    onSuccess: (data) => {
      setResult(data);
      toast.success(`${data.n} demandes analysées - ${data.n_high} à risque élevé.`);
    },
    onError: (err) => toast.error(formatError(err)),
  });

  const onFile = (e) => {
    const f = e.target.files?.[0];
    if (f) mutation.mutate(f);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Analyse par lot"
        description="Importez un fichier CSV (colonnes V1..V28 et Amount) pour scorer un lot de demandes et prioriser les contrôles."
      />

      <Card>
        <CardContent className="py-8">
          <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-200 bg-slate-50/50 py-10 text-center transition-colors hover:border-accent-300">
            {mutation.isPending ? (
              <Spinner className="h-6 w-6 text-accent-500" />
            ) : (
              <UploadCloud className="h-8 w-8 text-slate-400" />
            )}
            <span className="mt-3 text-sm font-medium text-slate-700">
              {mutation.isPending ? "Analyse en cours…" : "Cliquez pour importer un fichier CSV"}
            </span>
            <span className="mt-1 text-xs text-slate-500">
              Hour et Amount_log sont dérivés automatiquement côté serveur.
            </span>
            <input type="file" accept=".csv" className="hidden" onChange={onFile} disabled={mutation.isPending} />
          </label>
        </CardContent>
      </Card>

      {result && (
        result.n === 0 ? (
          <EmptyState icon={FileSpreadsheet} title="Aucune ligne" description="Le fichier ne contient pas de données exploitables." />
        ) : (
          <>
            <div className="flex items-center gap-2 flex-wrap">
              <Badge tone="neutral">{num(result.n)} demandes analysées</Badge>
              <Badge tone="danger">{result.n_high} à risque élevé</Badge>
            </div>
            <Card className="overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="px-5 py-3 text-left font-semibold">Montant (€)</th>
                    <th className="px-5 py-3 text-right font-semibold">Probabilité</th>
                    <th className="px-5 py-3 text-right font-semibold">Score /100</th>
                    <th className="px-5 py-3 text-left font-semibold">Niveau</th>
                  </tr>
                </thead>
                <tbody>
                  {result.rows.map((r, i) => (
                    <tr key={i} className="border-t border-slate-100 hover:bg-slate-50">
                      <td className="px-5 py-2.5 tabular-nums text-slate-700">{r.amount ?? "-"}</td>
                      <td className="px-5 py-2.5 text-right tabular-nums text-slate-600">{r.proba}</td>
                      <td className="px-5 py-2.5 text-right font-semibold tabular-nums text-slate-900">{r.score}</td>
                      <td className="px-5 py-2.5">
                        <Badge tone={tone(r.level)}>{r.level.replace("RISQUE ", "")}</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
            <p className="text-xs text-slate-500">Affichage limité aux 500 premières lignes (triées par score décroissant).</p>
          </>
        )
      )}
    </div>
  );
}
