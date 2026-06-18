export const pct = (x, d = 1) => (x == null ? "-" : `${(x * 100).toFixed(d)} %`);
export const num = (x) => (x == null ? "-" : x.toLocaleString("fr-FR"));
export const dec = (x, d = 3) => (x == null ? "-" : x.toFixed(d).replace(".", ","));

export function formatError(err) {
  if (err?.response?.data?.detail) {
    const d = err.response.data.detail;
    return typeof d === "string" ? d : JSON.stringify(d);
  }
  return err?.message || "Erreur inattendue.";
}
