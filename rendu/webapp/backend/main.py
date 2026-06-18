"""
FraudAI - Backend API (FastAPI)
Charge le pipeline du notebook (fraudai_model.pkl) et expose le scoring.
Le score renvoyé est STRICTEMENT identique a celui du notebook (meme modele,
meme scaler, memes seuils t_low/t_high).

Lancement :  uvicorn main:app --reload --port 8000
Pre-requis :  fraudai_model.pkl a la racine du projet (genere par le notebook)
"""
from pathlib import Path
from typing import Dict, List, Optional
import io

import numpy as np
import pandas as pd
import joblib
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel

# ---------------------------------------------------------------------------
# Chargement du pipeline (modele + scaler + seuils derives du notebook)
# ---------------------------------------------------------------------------
PKL_PATH = Path(__file__).resolve().parents[2] / "fraudai_model.pkl"
FRONTEND_DIST = Path(__file__).resolve().parents[1] / "frontend" / "dist"
PIPE = joblib.load(PKL_PATH)
MODEL = PIPE["model"]
SCALER = PIPE["scaler"]
FEATURES: List[str] = list(PIPE["features"])
THR = float(PIPE.get("threshold", 0.5))
T_LOW = float(PIPE.get("t_low", THR * 0.3))
T_HIGH = float(PIPE.get("t_high", THR))
THR_F1 = float(PIPE.get("threshold_f1", THR))
METRICS: Dict = PIPE.get("metrics", {})
CHAMPION = PIPE.get("champion_name", "modele")

# SHAP (explicabilite) - initialise une fois au demarrage si disponible
EXPLAINER = None
try:
    import shap
    EXPLAINER = shap.TreeExplainer(MODEL)
except Exception:
    EXPLAINER = None

# Les 6 variables V les plus discriminantes (importances du modele)
def _top_v(k: int = 6) -> List[str]:
    imp = getattr(MODEL, "feature_importances_", None)
    if imp is None:
        return ["V14", "V10", "V12", "V4", "V17", "V11"]
    s = pd.Series(imp, index=FEATURES)
    vs = [f for f in s.sort_values(ascending=False).index if f.startswith("V")]
    return vs[:k]

TOP_V = _top_v(6)

# ---------------------------------------------------------------------------
# Logique de score (identique au notebook)
# ---------------------------------------------------------------------------
def proba_to_score(p: float) -> float:
    p = float(p)
    if p < T_LOW:
        s = 30 * p / max(T_LOW, 1e-9)
    elif p < T_HIGH:
        s = 30 + 40 * (p - T_LOW) / max(T_HIGH - T_LOW, 1e-9)
    else:
        s = 70 + 30 * (p - T_HIGH) / max(1 - T_HIGH, 1e-9)
    return float(np.clip(s, 0, 100))


def band_of(score: float):
    if score <= 30:
        return ("RISQUE FAIBLE", "#1e8449", "Traitement standard automatique", "Non prioritaire")
    if score <= 70:
        return ("RISQUE MODERE", "#d68910", "File de controle selon les ressources", "Surveillance")
    return ("RISQUE ELEVE", "#c0392b", "Controle prioritaire immediat par un agent", "Prioritaire")


def build_row(amount: float, hour: int, v_inputs: Dict[str, float]) -> pd.DataFrame:
    row = {f: 0.0 for f in FEATURES}
    if "Amount" in row:
        row["Amount"] = amount
    if "Hour" in row:
        row["Hour"] = hour
    if "Amount_log" in row:
        row["Amount_log"] = float(np.log1p(amount))
    for k, val in v_inputs.items():
        if k in row:
            row[k] = float(val)
    return pd.DataFrame([row])[FEATURES]


def local_factors(X_scaled: np.ndarray, k: int = 6):
    if EXPLAINER is not None:
        sv = np.array(EXPLAINER.shap_values(pd.DataFrame(X_scaled, columns=FEATURES)))[0]
        s = pd.Series(sv, index=FEATURES)
        s = s.reindex(s.abs().sort_values(ascending=False).index).head(k)
        return [{"feature": f, "contribution": round(float(v), 3),
                 "direction": "augmente" if v >= 0 else "reduit"} for f, v in s.items()], True
    imp = getattr(MODEL, "feature_importances_", None)
    if imp is not None:
        s = pd.Series(imp, index=FEATURES).sort_values(ascending=False).head(k)
        return [{"feature": f, "contribution": round(float(v), 3), "direction": "augmente"}
                for f, v in s.items()], False
    return [], False


def score_dataframe(X: pd.DataFrame):
    Xs = SCALER.transform(X[FEATURES])
    proba = MODEL.predict_proba(Xs)[:, 1]
    return proba, Xs

# ---------------------------------------------------------------------------
# API
# ---------------------------------------------------------------------------
app = FastAPI(title="FraudAI API", version="2.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # même origine en prod ; large en dev/conteneur
    allow_methods=["*"], allow_headers=["*"],
)


class ScoreRequest(BaseModel):
    amount: float = 100.0
    hour: int = 12
    v: Dict[str, float] = {}


@app.get("/api/meta")
def meta():
    return {
        "champion": CHAMPION,
        "metrics": METRICS,
        "threshold": THR,
        "threshold_f1": THR_F1,
        "t_low": T_LOW,
        "t_high": T_HIGH,
        "features": FEATURES,
        "top_v": TOP_V,
        "shap_available": EXPLAINER is not None,
    }


@app.post("/api/score")
def score(req: ScoreRequest):
    X = build_row(req.amount, req.hour, req.v)
    proba, Xs = score_dataframe(X)
    p = float(proba[0])
    sc = proba_to_score(p)
    level, color, action, prio = band_of(sc)
    factors, is_shap = local_factors(Xs, 6)
    return {
        "proba": round(p, 4),
        "score": round(sc),
        "level": level, "color": color, "action": action, "prio": prio,
        "threshold": THR,
        "factors": factors, "shap": is_shap,
    }


# Synthese figee issue de l'evaluation du notebook sur le TEST jamais touche
# (split 60/20/20, seuils calibres sur la validation). Coherente avec le rapport.
OVERVIEW = {
    "test": {"n": 56746, "frauds": 95},
    "deployment": {"tp": 76, "fp": 15, "fn": 19, "tn": 56636,
                   "recall": 0.80, "precision": 0.8352, "threshold": 0.0659},
    "f1opt": {"tp": 69, "fp": 4, "fn": 26, "recall": 0.7263, "precision": 0.9452},
    "bands": [
        {"name": "Faible", "key": "faible", "total": 56624, "frauds": 17, "fill": "#94a3b8"},
        {"name": "Modere", "key": "modere", "total": 31, "frauds": 2, "fill": "#f97316"},
        {"name": "Eleve", "key": "eleve", "total": 91, "frauds": 76, "fill": "#0f172a"},
    ],
    "benchmark": [
        {"model": "Regression Logistique", "aucroc": 0.9642, "aucpr": 0.6891,
         "recall": 0.7368, "precision": 0.8861, "f1": 0.8046, "fp": 9, "fn": 25, "champion": False},
        {"model": "Random Forest", "aucroc": 0.9503, "aucpr": 0.7861,
         "recall": 0.7263, "precision": 0.8846, "f1": 0.7977, "fp": 9, "fn": 26, "champion": False},
        {"model": "XGBoost", "aucroc": 0.9727, "aucpr": 0.8349,
         "recall": 0.7263, "precision": 0.9452, "f1": 0.8214, "fp": 4, "fn": 26, "champion": True},
    ],
    "strategies": [
        {"name": "A. Optimisation de seuil (retenue)", "aucpr": 0.8862, "thr": 0.388, "healthy": True},
        {"name": "B. scale_pos_weight seul", "aucpr": 0.8857, "thr": 0.998, "healthy": False},
        {"name": "C. SMOTE seul", "aucpr": 0.8748, "thr": 0.981, "healthy": False},
        {"name": "D. SMOTE + scale_pos_weight", "aucpr": 0.8524, "thr": 0.9998, "healthy": False},
    ],
    "dataset": {"raw": 284807, "dedup": 283726, "duplicates": 1081, "fraud_rate": 0.00167,
                "train": 170235, "val": 56745, "test": 56746},
}


@app.get("/api/overview")
def overview():
    return OVERVIEW


@app.post("/api/batch")
async def batch(file: UploadFile = File(...)):
    raw = await file.read()
    data = pd.read_csv(io.BytesIO(raw))
    if "Time" in data.columns:
        data["Hour"] = (data["Time"] % 86400) // 3600
    if "Hour" not in data.columns:
        data["Hour"] = 12
    if "Amount" in data.columns:
        data["Amount_log"] = np.log1p(data["Amount"])
    for f in FEATURES:
        if f not in data.columns:
            data[f] = 0.0
    proba, _ = score_dataframe(data)
    scores = [round(proba_to_score(p)) for p in proba]
    rows = []
    for i, p in enumerate(proba):
        rows.append({
            "amount": float(data["Amount"].iloc[i]) if "Amount" in data.columns else None,
            "proba": round(float(p), 4),
            "score": scores[i],
            "level": band_of(scores[i])[0],
        })
    rows.sort(key=lambda r: r["score"], reverse=True)
    n_high = sum(1 for s in scores if s > 70)
    return {"n": len(rows), "n_high": n_high, "rows": rows[:500]}


# ---------------------------------------------------------------------------
# Service du frontend builde (mode PRODUCTION / conteneur).
# Si webapp/frontend/dist existe, FastAPI sert l'app React : une seule URL,
# pas de serveur Node ni de CORS. En dev (pas de dist), on garde l'API seule.
# ---------------------------------------------------------------------------
if FRONTEND_DIST.exists():
    app.mount("/assets", StaticFiles(directory=str(FRONTEND_DIST / "assets")), name="assets")

    @app.get("/")
    def serve_index():
        return FileResponse(str(FRONTEND_DIST / "index.html"))

    @app.get("/{full_path:path}")
    def serve_spa(full_path: str):
        if full_path.startswith("api"):
            raise HTTPException(status_code=404, detail="Not found")
        candidate = FRONTEND_DIST / full_path
        if full_path and candidate.is_file():
            return FileResponse(str(candidate))
        return FileResponse(str(FRONTEND_DIST / "index.html"))  # fallback routing SPA
else:
    @app.get("/")
    def root():
        return {"service": "FraudAI API", "model": CHAMPION,
                "endpoints": ["/api/meta", "/api/overview", "/api/score", "/api/batch"]}
