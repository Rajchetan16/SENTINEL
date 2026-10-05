"""
SENTINEL — FastAPI data backend
================================
Serves the K-Means and DBSCAN mining results to the React frontend.

Endpoints
---------
GET /api/explorer          JSON: random 3 000-row sample (K-Means/DBSCAN/Raw modes)
GET /api/explorer/attack   JSON: stratified 3 000-row sample (Attack Type mode)
GET /api/explorer/meta     JSON: label distribution, cluster counts, feature list
GET /health                JSON: {"status": "ok"}

Design notes
------------
- Both CSVs share the SAME 50 000-row sample (same random_state=42 in mining.py).
  We merge them on row index so every point has both KMeans_Cluster and DBSCAN_Cluster.
- /api/explorer  — uniform random sample; best for K-Means/DBSCAN where label
  imbalance doesn't affect the colour mapping.
- /api/explorer/attack — stratified: caps BENIGN at BENIGN_CAP rows, takes as many
  attack rows as available (up to ATTACK_CAP), so rare attack classes stay visible.
- No database, no auth, no Docker.
"""

from pathlib import Path
import numpy as np
import pandas as pd
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

# ── Paths ─────────────────────────────────────────────────────────────────
BASE_DIR    = Path(__file__).parent.parent
RESULTS_DIR = BASE_DIR / "data" / "processed" / "results"
KMEANS_CSV  = RESULTS_DIR / "kmeans_results.csv"
DBSCAN_CSV  = RESULTS_DIR / "dbscan_results.csv"

# Number of rows sent to the browser (keep ≤ 5 000 for smooth 3D rendering)
SAMPLE_N    = 3_000
RANDOM_SEED = 42

# Stratified sampling caps for the Attack Type endpoint
BENIGN_LABEL = "BENIGN"
BENIGN_CAP   = 800    # enough context without drowning attack points
ATTACK_CAP   = 2_200  # fill remaining budget with attack flows

# ── Load & merge at startup (once) ────────────────────────────────────────

def _load_data() -> pd.DataFrame:
    km = pd.read_csv(KMEANS_CSV)
    db = pd.read_csv(DBSCAN_CSV)[["DBSCAN_Cluster"]]   # only the cluster column needed

    # Both CSVs are the same 50 000-row sample — merge by positional index
    merged = km.copy()
    merged["DBSCAN_Cluster"] = db["DBSCAN_Cluster"].values

    # Replace ±inf that survived into the CSVs, then fill NaN with 0
    merged.replace([np.inf, -np.inf], np.nan, inplace=True)
    merged.fillna(0, inplace=True)

    return merged


try:
    _full_df = _load_data()
    print(f"[SENTINEL] Loaded {len(_full_df):,} rows · "
          f"{len(_full_df.columns)} columns")
except Exception as exc:
    _full_df = None
    print(f"[SENTINEL] WARNING: could not load CSVs — {exc}")


# ── Feature columns (78 numerical, no Label / cluster cols) ───────────────
_META_COLS  = {"Label", "KMeans_Cluster", "DBSCAN_Cluster"}

def _feature_cols(df: pd.DataFrame) -> list[str]:
    return [c for c in df.columns if c not in _META_COLS]


# ── FastAPI app ────────────────────────────────────────────────────────────
app = FastAPI(title="SENTINEL API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_methods=["GET"],
    allow_headers=["*"],
)


@app.get("/health")
def health():
    return {"status": "ok", "rows_loaded": len(_full_df) if _full_df is not None else 0}


@app.get("/api/explorer/meta")
def explorer_meta():
    """Returns feature list, label distribution, and cluster counts — no point data."""
    if _full_df is None:
        raise HTTPException(503, "Data not loaded")

    feat_cols = _feature_cols(_full_df)

    label_dist = (
        _full_df["Label"]
        .value_counts()
        .rename_axis("label")
        .reset_index(name="count")
        .to_dict(orient="records")
    )

    kmeans_dist = (
        _full_df["KMeans_Cluster"]
        .value_counts()
        .sort_index()
        .rename_axis("cluster")
        .reset_index(name="count")
        .to_dict(orient="records")
    )

    dbscan_dist = (
        _full_df["DBSCAN_Cluster"]
        .value_counts()
        .sort_index()
        .rename_axis("cluster")
        .reset_index(name="count")
        .to_dict(orient="records")
    )

    return {
        "total_rows":    len(_full_df),
        "sample_n":      SAMPLE_N,
        "features":      feat_cols,
        "label_dist":    label_dist,
        "kmeans_dist":   kmeans_dist,
        "dbscan_dist":   dbscan_dist,
    }


@app.get("/api/explorer")
def explorer_points():
    """
    Returns a random sub-sample of SAMPLE_N rows.
    Each record contains:
      - all 78 numerical features (float, NaN → 0)
      - Label (string)
      - KMeans_Cluster (int)
      - DBSCAN_Cluster (int, -1 = noise)
    """
    if _full_df is None:
        raise HTTPException(503, "Data not loaded — check that mining.py has been run")

    sample = _full_df.sample(n=min(SAMPLE_N, len(_full_df)), random_state=RANDOM_SEED)

    # Round floats to 4 dp to reduce payload size
    feat_cols = _feature_cols(sample)
    sample = sample.copy()
    sample[feat_cols] = sample[feat_cols].round(4)

    return {
        "count":    len(sample),
        "features": feat_cols,
        "points":   sample.to_dict(orient="records"),
    }


@app.get("/api/explorer/attack")
def explorer_attack_points():
    """
    Stratified sample for the Attack Type visualization mode.

    Allocates BENIGN_CAP rows to BENIGN traffic so it appears as
    background context, then fills the remainder of the 3 000-row
    budget with all available attack flows (sampling if there are more
    than ATTACK_CAP).  This guarantees that even rare attack labels
    (Bot, Heartbleed, Web Attack variants) appear in the response
    whenever they exist in the 50k mining sample.
    """
    if _full_df is None:
        raise HTTPException(503, "Data not loaded — check that mining.py has been run")

    feat_cols = _feature_cols(_full_df)

    # Split BENIGN vs attacks
    benign_df  = _full_df[_full_df["Label"] == BENIGN_LABEL]
    attack_df  = _full_df[_full_df["Label"] != BENIGN_LABEL]

    # Sample each stratum
    n_benign = min(BENIGN_CAP, len(benign_df))
    n_attack = min(ATTACK_CAP, len(attack_df))

    benign_sample = benign_df.sample(n=n_benign, random_state=RANDOM_SEED)
    attack_sample = attack_df.sample(n=n_attack, random_state=RANDOM_SEED)

    sample = (
        pd.concat([benign_sample, attack_sample])
        .sample(frac=1, random_state=RANDOM_SEED)   # shuffle so BENIGN/attack aren't grouped
        .reset_index(drop=True)
        .copy()
    )

    sample[feat_cols] = sample[feat_cols].round(4)

    return {
        "count":    len(sample),
        "features": feat_cols,
        "points":   sample.to_dict(orient="records"),
        # Include per-label counts so the legend can show them
        "label_counts": sample["Label"].value_counts().to_dict(),
    }
