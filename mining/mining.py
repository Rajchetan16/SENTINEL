import pandas as pd
import numpy as np
from pathlib import Path

from sklearn.preprocessing import StandardScaler
from sklearn.cluster import KMeans, DBSCAN
from sklearn.metrics import silhouette_score

from mlxtend.frequent_patterns import apriori, association_rules

# ── Paths ─────────────────────────────────────────────────────────────────────
BASE_DIR    = Path(__file__).parent.parent / "data" / "processed"
INPUT_FILE  = BASE_DIR / "cicids_clean.csv"
RESULTS_DIR = BASE_DIR / "results"
RESULTS_DIR.mkdir(parents=True, exist_ok=True)

# ─────────────────────────────────────────────────────────────────────────────
# 1. Load
# ─────────────────────────────────────────────────────────────────────────────
print("=" * 60)
print("Loading cleaned dataset...")
df = pd.read_csv(INPUT_FILE, low_memory=False)
print(f"  Loaded: {df.shape[0]:,} rows × {df.shape[1]} columns")

# Separate features from label
label_col = "Label"
feature_cols = [c for c in df.columns if c != label_col]

X_full  = df[feature_cols].copy()
y_full  = df[label_col].copy()

# ─────────────────────────────────────────────────────────────────────────────
# 2. Shared 50 000-row sample for K-Means and DBSCAN
# ─────────────────────────────────────────────────────────────────────────────
SAMPLE_N = 50_000
print(f"\nSampling {SAMPLE_N:,} rows (random_state=42) for clustering...")
sample_df = df.sample(n=SAMPLE_N, random_state=42).reset_index(drop=True)

X_sample = sample_df[feature_cols].copy()
y_sample = sample_df[label_col].copy()

# Replace any residual non-finite values with the column median
X_sample.replace([np.inf, -np.inf], np.nan, inplace=True)
X_sample.fillna(X_sample.median(numeric_only=True), inplace=True)

# Standardize
print("Standardizing features...")
scaler  = StandardScaler()
X_scaled = scaler.fit_transform(X_sample)

# ─────────────────────────────────────────────────────────────────────────────
# 3. K-Means
# ─────────────────────────────────────────────────────────────────────────────
print("\n" + "=" * 60)
print("Running K-Means (k=5)...")

kmeans = KMeans(n_clusters=5, random_state=42, n_init="auto")
kmeans_labels = kmeans.fit_predict(X_scaled)

sil = silhouette_score(X_scaled, kmeans_labels, sample_size=10_000, random_state=42)

print(f"\nK-Means results:")
print(f"  Inertia          : {kmeans.inertia_:,.2f}")
print(f"  Silhouette score : {sil:.4f}")
print(f"  Cluster sizes:")
unique, counts = np.unique(kmeans_labels, return_counts=True)
for cid, cnt in zip(unique, counts):
    print(f"    Cluster {cid}: {cnt:,}")

kmeans_out = sample_df.copy()
kmeans_out["KMeans_Cluster"] = kmeans_labels
kmeans_out.to_csv(RESULTS_DIR / "kmeans_results.csv", index=False)
print(f"\n  Saved → results/kmeans_results.csv")

# ─────────────────────────────────────────────────────────────────────────────
# 4. DBSCAN
# ─────────────────────────────────────────────────────────────────────────────
print("\n" + "=" * 60)
print("Running DBSCAN (eps=3, min_samples=10)...")

dbscan = DBSCAN(eps=3, min_samples=10, n_jobs=-1)
dbscan_labels = dbscan.fit_predict(X_scaled)

n_clusters  = len(set(dbscan_labels)) - (1 if -1 in dbscan_labels else 0)
n_noise     = int(np.sum(dbscan_labels == -1))
pct_noise   = n_noise / len(dbscan_labels) * 100

print(f"\nDBSCAN results:")
print(f"  Clusters discovered (excl. noise) : {n_clusters}")
print(f"  Noise points                      : {n_noise:,}")
print(f"  Noise percentage                  : {pct_noise:.2f}%")

dbscan_out = sample_df.copy()
dbscan_out["DBSCAN_Cluster"] = dbscan_labels
dbscan_out.to_csv(RESULTS_DIR / "dbscan_results.csv", index=False)
print(f"\n  Saved → results/dbscan_results.csv")

# ─────────────────────────────────────────────────────────────────────────────
# 5. Apriori association-rule mining
# ─────────────────────────────────────────────────────────────────────────────
print("\n" + "=" * 60)
print("Preparing Apriori sample (20,000 rows, random_state=42)...")

APRIORI_N = 20_000
ap_df = df.sample(n=APRIORI_N, random_state=42).reset_index(drop=True)

# ── Build transaction items ────────────────────────────────────────────────
# Traffic indicators chosen for their security relevance in CICIDS2017.
# Each is binarised to True/False so mlxtend can treat it as a basket item.

ap = pd.DataFrame()

# 1. Attack label as item (one column per unique label)
for lbl in ap_df[label_col].unique():
    safe = lbl.replace(" ", "_").replace("/", "_").replace("\\", "_")
    ap[f"Label={safe}"] = (ap_df[label_col] == lbl)

# 2. High flow duration  (> median)
med_dur = ap_df["Flow Duration"].median()
ap["HighFlowDuration"] = ap_df["Flow Duration"] > med_dur

# 3. High forward bytes  (> median)
med_fwd = ap_df["Total Length of Fwd Packets"].median()
ap["HighFwdBytes"] = ap_df["Total Length of Fwd Packets"] > med_fwd

# 4. High backward bytes (> median)
med_bwd = ap_df["Total Length of Bwd Packets"].median()
ap["HighBwdBytes"] = ap_df["Total Length of Bwd Packets"] > med_bwd

# 5. High packet rate  — Flow Packets/s > median (guard against inf)
fps = ap_df["Flow Packets/s"].replace([np.inf, -np.inf], np.nan).fillna(0)
ap["HighPacketRate"] = fps > fps.median()

# 6. High byte rate  — Flow Bytes/s > median
fbs = ap_df["Flow Bytes/s"].replace([np.inf, -np.inf], np.nan).fillna(0)
ap["HighByteRate"] = fbs > fbs.median()

# 7. Common attack port  — dst port in {21,22,23,25,80,443,445,3389,8080}
common_ports = {21, 22, 23, 25, 80, 443, 445, 3389, 8080}
ap["CommonAttackPort"] = ap_df["Destination Port"].isin(common_ports)

# 8. Small average packet size  (possible scanning/SYN-flood)
avg_pkt = (ap_df["Total Length of Fwd Packets"] + ap_df["Total Length of Bwd Packets"]) / \
          (ap_df["Total Fwd Packets"] + ap_df["Total Backward Packets"]).replace(0, np.nan)
avg_pkt = avg_pkt.fillna(0)
ap["SmallAvgPacket"] = avg_pkt < avg_pkt.quantile(0.25)

# ── Ensure boolean dtype throughout ───────────────────────────────────────
ap = ap.astype(bool)

print(f"  Transaction matrix: {ap.shape[0]:,} rows × {ap.shape[1]} items")
print(f"  Items: {list(ap.columns)}")

# ── Frequent itemsets ─────────────────────────────────────────────────────
print("\nMining frequent itemsets (min_support=0.01)...")
freq_items = apriori(ap, min_support=0.01, use_colnames=True, verbose=0)
print(f"  Frequent itemsets found: {len(freq_items):,}")

# ── Association rules ──────────────────────────────────────────────────────
print("Generating association rules (confidence >= 0.5)...")
rules = association_rules(freq_items, metric="confidence", min_threshold=0.5)
rules.sort_values("lift", ascending=False, inplace=True)
rules.reset_index(drop=True, inplace=True)

print(f"  Rules generated: {len(rules):,}")
print(f"\nTop 20 rules (sorted by lift):")
print("-" * 60)

display_cols = ["antecedents", "consequents", "support", "confidence", "lift"]
pd.set_option("display.max_colwidth", 50)
pd.set_option("display.width", 120)
print(rules[display_cols].head(20).to_string(index=True))

# ── Save ───────────────────────────────────────────────────────────────────
rules_out = rules.copy()
rules_out["antecedents"] = rules_out["antecedents"].apply(lambda x: ", ".join(sorted(x)))
rules_out["consequents"] = rules_out["consequents"].apply(lambda x: ", ".join(sorted(x)))
rules_out.to_csv(RESULTS_DIR / "apriori_rules.csv", index=False)
print(f"\n  Saved → results/apriori_rules.csv")

# ─────────────────────────────────────────────────────────────────────────────
print("\n" + "=" * 60)
print("All mining tasks complete.")
print(f"Results saved to: {RESULTS_DIR}")
