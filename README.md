# SENTINEL

### Cyber Threat Behavior Mining & 3D Intelligence Dashboard

SENTINEL is an interactive cybersecurity data-mining and intelligence dashboard built on the [CICIDS2017](https://www.unb.ca/cic/datasets/ids-2017.html) intrusion-detection dataset. It applies three classical unsupervised data-mining techniques — K-Means clustering, DBSCAN density clustering, and Apriori association-rule mining — to discover behavioral structure in real network-flow data and presents the results inside a premium interactive 3D dashboard.

The goal is **behavioral understanding**, not supervised attack classification. SENTINEL shows what patterns and groupings exist in traffic data without being told the labels in advance.

---

## Table of Contents

- [Overview](#overview)
- [Dataset](#dataset)
- [Algorithms](#algorithms)
- [Preprocessing](#preprocessing)
- [Mining Results](#mining-results)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Frontend Features](#frontend-features)
- [Setup & Running](#setup--running)
- [API Endpoints](#api-endpoints)
- [Limitations](#limitations)

---

## Overview

```
Raw CICIDS2017 CSVs
       │
       ▼
  preprocess.py          Strip, normalize, clean → cicids_clean.csv (2.52M rows)
       │
       ▼
   mining.py             K-Means · DBSCAN · Apriori → results CSVs
       │
       ▼
  FastAPI backend         Serves stratified samples via JSON API
       │
       ▼
  React / Three.js        Interactive 3D point cloud + dashboard sections
```

The frontend never loads the full 2.5-million-row dataset into the browser. The backend serves representative samples so the 3D visualization stays performant while the mining algorithms operate on the full 50,000-row samples.

---

## Dataset

| Property | Value |
|---|---|
| Name | CICIDS2017 (Canadian Institute for Cybersecurity) |
| Source | University of New Brunswick |
| Format | CICFlowMeter network-flow CSVs |
| Files | 8 daily captures (Monday – Friday) |
| Raw rows | 2,830,743 |
| Attack categories | DDoS, PortScan, DoS Hulk, DoS GoldenEye, DoS slowloris, DoS Slowhttptest, FTP-Patator, SSH-Patator, Bot, Web Attack (Brute Force / XSS / SQL Injection), Infiltration, Heartbleed, BENIGN |
| Numerical features per row | 78 (CICFlowMeter-derived flow statistics) |

The dataset was downloaded as `MachineLearningCSV.zip` and placed in `data/raw/`.

---

## Algorithms

### K-Means Clustering

K-Means partitions a dataset into **k** groups by iteratively assigning each point to the nearest centroid and moving centroids to the mean of their assigned points. It minimises within-cluster sum of squares (inertia). Because K-Means assumes spherical, equally-sized clusters and requires k to be specified in advance, it is complementary to DBSCAN rather than a replacement for it.

In SENTINEL, K-Means (k=5) reveals five broad behavioral regimes in standardized network flows — a high-volume normal-traffic partition, high-intensity attack-like partitions, and small outlier groups — without ever seeing a label.

### DBSCAN Clustering

DBSCAN (Density-Based Spatial Clustering of Applications with Noise) groups points that are densely connected in feature space. It requires two parameters: `eps` (neighborhood radius) and `min_samples` (minimum points to form a core). Points in sparse regions are labelled **noise (−1)** rather than forced into a cluster.

DBSCAN discovers clusters of arbitrary shape and automatically isolates anomalous flows as noise — making it particularly suited to intrusion detection, where rare attacks appear in low-density regions. In SENTINEL, 47 variable-shape clusters were found alongside 1,197 noise points (2.39 %), which correspond predominantly to rare attack categories.

### Apriori Association-Rule Mining

Apriori mines frequent co-occurrence patterns (itemsets) in a transaction dataset and generates rules of the form:

> **{antecedent} → {consequent}** with *support*, *confidence*, and *lift*

- **Support** — fraction of transactions containing the itemset
- **Confidence** — probability that the consequent appears given the antecedent
- **Lift** — how much more likely the consequent is given the antecedent vs. by chance (lift > 1 indicates a positive association)

In SENTINEL, continuous network-flow features are binarised into traffic indicators (e.g. `HighPacketRate`, `CommonAttackPort`, `SmallAvgPacket`) and combined with attack labels to produce interpretable human-readable rules linking traffic features to attack types.

> ⚠️ **Association rules reveal statistical co-occurrence, not causation.** A rule such as `{HighPacketRate} → {DDoS}` means these items frequently appear together in the same flow — it does not establish that high packet rate *causes* DDoS traffic.

### Why all three together?

| Technique | What it contributes |
|---|---|
| K-Means | Fast global partitioning; reveals dominant behavioral regimes |
| DBSCAN | Finds irregular clusters; isolates rare/anomalous flows as noise |
| Apriori | Produces interpretable if-then rules linking features to labels |

No single method gives the full picture. K-Means misses rare attacks by absorbing them into nearest centroids; DBSCAN surfaces them as noise but gives no feature interpretation; Apriori provides human-readable feature-to-label associations but requires pre-defined discretisation. Together they provide complementary views of the same data.

---

## Preprocessing

`mining/preprocess.py` — executed once before mining.

| Step | Detail |
|---|---|
| Load | 8 CICIDS2017 CSV files concatenated into one DataFrame |
| Strip whitespace | Column names and string cell values |
| Normalize Label | Cast to string, strip whitespace, replace `\ufffd` (malformed Web Attack character) with `-` |
| Replace ±∞ | Replaced with `NaN` |
| Drop NaN rows | Rows with any remaining `NaN` removed |
| Drop duplicates | Exact duplicate rows removed |
| Keep features | All 78 numerical columns + `Label` |
| Save | `data/processed/cicids_clean.csv` |

**Actual preprocessing output:**

| Metric | Value |
|---|---|
| Original rows | 2,830,743 |
| Rows after cleaning | 2,520,798 |
| Numerical features | 78 |
| Duplicates removed | 307,078 |
| Rows removed (NaN/inf) | 2,867 |

---

## Mining Results

`mining/mining.py` — executed after preprocessing.

### K-Means

| Parameter / Metric | Value |
|---|---|
| Sample size | 50,000 rows (random_state=42) |
| Scaler | `StandardScaler` |
| n_clusters | 5 |
| random_state | 42 |
| Inertia (WCSS) | 2,153,115.52 |
| Silhouette score | 0.4326 |

**Cluster sizes:**

| Cluster | Rows | % of sample |
|---|---|---|
| 0 | 41,938 | 83.88% |
| 1 | 2,831 | 5.66% |
| 2 | 2 | 0.00% |
| 3 | 509 | 1.02% |
| 4 | 4,720 | 9.44% |

Result saved to `data/processed/results/kmeans_results.csv`.

### DBSCAN

| Parameter / Metric | Value |
|---|---|
| Sample size | 50,000 rows (same sample as K-Means) |
| Scaler | `StandardScaler` |
| eps | 3 |
| min_samples | 10 |
| Clusters discovered (excl. noise) | 47 |
| Noise points (label = −1) | 1,197 |
| Noise percentage | 2.39% |

Result saved to `data/processed/results/dbscan_results.csv`.

### Apriori

| Parameter / Metric | Value |
|---|---|
| Sample size | 20,000 rows (random_state=42) |
| Transaction matrix | 20,000 × 19 items |
| min_support | 0.01 |
| Confidence threshold | 0.50 |
| Frequent itemsets found | 183 |
| Association rules generated | 771 |
| Top observed lift | ≈ 18.296 |
| Sort metric | Lift (descending) |

**Transaction items used:**

| Item | Description |
|---|---|
| `Label=<attack>` | One boolean column per unique traffic label |
| `HighFlowDuration` | Flow duration > sample median |
| `HighFwdBytes` | Forward bytes > sample median |
| `HighBwdBytes` | Backward bytes > sample median |
| `HighPacketRate` | Flow packets/s > median |
| `HighByteRate` | Flow bytes/s > median |
| `CommonAttackPort` | Destination port ∈ {21,22,23,25,80,443,445,3389,8080} |
| `SmallAvgPacket` | Average packet size < 25th percentile |

Result saved to `data/processed/results/apriori_rules.csv`.

---

## Tech Stack

### Mining

| Library | Version | Role |
|---|---|---|
| pandas | 2.2.3 | Data loading, preprocessing, sampling |
| NumPy | 2.1.3 | Numerical operations, inf/NaN handling |
| scikit-learn | — | `StandardScaler`, `KMeans`, `DBSCAN`, `silhouette_score` |
| mlxtend | — | `apriori`, `association_rules` |

### Backend

| Library | Version | Role |
|---|---|---|
| FastAPI | 0.115.5 | REST API framework |
| Uvicorn | 0.32.1 | ASGI server |
| pandas | 2.2.3 | CSV loading and sampling |
| NumPy | 2.1.3 | NaN/inf cleanup |

### Frontend

| Package | Version | Role |
|---|---|---|
| React | ^18.3.1 | UI framework |
| TypeScript | ^5.6.3 | Type safety |
| Vite | ^6.0.5 | Build tool and dev server |
| Three.js | ^0.171.0 | 3D WebGL rendering |
| React Three Fiber | ^8.17.10 | React renderer for Three.js |
| @react-three/drei | ^9.122.0 | Three.js helpers (OrbitControls, Text, Stars, Html) |
| Framer Motion | ^11.15.0 | Animations and transitions |
| Recharts | ^2.15.0 | 2D charts (cluster bar charts, pie charts) |

---

## Project Structure

```
SENTINEL/
├── data/
│   ├── raw/
│   │   └── MachineLearningCSV/
│   │       └── MachineLearningCVE/    ← 8 CICIDS2017 CSV files (not committed)
│   └── processed/
│       ├── cicids_clean.csv           ← Output of preprocess.py (not committed)
│       └── results/
│           ├── kmeans_results.csv     ← 50k-row K-Means output
│           ├── dbscan_results.csv     ← 50k-row DBSCAN output
│           └── apriori_rules.csv     ← 771 association rules
│
├── mining/
│   ├── preprocess.py                  ← Cleans raw CSVs → cicids_clean.csv
│   ├── mining.py                      ← Runs K-Means, DBSCAN, Apriori
│   └── inspect_dataset.py             ← Exploratory inspection helper
│
├── backend/
│   ├── main.py                        ← FastAPI app; serves /api/explorer endpoints
│   └── requirements.txt              ← Python dependencies
│
├── frontend/
│   ├── index.html
│   ├── vite.config.ts                 ← Proxies /api → localhost:8000
│   ├── package.json
│   ├── tsconfig.json
│   └── src/
│       ├── App.tsx                    ← Root; assembles all sections
│       ├── main.tsx
│       ├── styles/
│       │   └── global.css            ← Design tokens and global styles
│       ├── data/
│       │   ├── cicids2017Features.ts ← All 78 CICIDS2017 feature names + metadata
│       │   ├── explorerApi.ts        ← Typed fetch layer for the backend
│       │   └── demoData.ts           ← Seeded synthetic fallback (kept for reference)
│       └── components/
│           ├── ThreatExplorer3D.tsx  ← Main 3D explorer orchestrator
│           ├── three/
│           │   ├── PointCloud.tsx    ← R3F BufferGeometry point cloud
│           │   ├── SceneAxes.tsx     ← Labeled XYZ axes
│           │   └── HoverTooltip.tsx  ← Drei Html tooltip
│           ├── layout/
│           │   ├── Navbar.tsx
│           │   └── SectionWrapper.tsx
│           ├── sections/
│           │   ├── Hero.tsx
│           │   ├── Overview.tsx
│           │   ├── DatasetIntelligence.tsx
│           │   ├── Explorer3D.tsx
│           │   ├── ClusteringAnalysis.tsx
│           │   ├── AssociationRules.tsx
│           │   └── Insights.tsx
│           └── ui/
│               ├── StatCard.tsx
│               ├── SectionHeader.tsx
│               └── ComingSoonCard.tsx
│
├── .gitignore
└── README.md
```

---

## Frontend Features

### 3D Behavioral Explorer

- Interactive point cloud where each point is a real CICIDS2017 network flow
- Dynamic axis selection — map any of the 78 numerical features to X, Y, or Z
- Point size and color dimension selectors
- Four visualization modes:

| Mode | Description |
|---|---|
| Raw Data | All points in uniform cyan |
| K-Means | Points colored by K-Means cluster (0–4) |
| DBSCAN | Points colored by density cluster; noise points highlighted in red |
| Attack Type | Points colored by real CICIDS2017 traffic label |

- **Attack Type specifics:** uses a stratified backend sample (800 BENIGN + up to 2,200 attack flows) so rare attack categories remain visible; BENIGN points are visually dimmed; an **Attacks Only** toggle filters BENIGN from the scene entirely
- 3D rotate, zoom, pan via OrbitControls
- Hover tooltip showing label, cluster IDs, and axis feature values
- Click to pin a selected-point info panel

### Dashboard Sections

| Section | Content |
|---|---|
| Overview | Project pipeline summary, dataset statistics |
| Dataset Intelligence | Animated label distribution chart, per-file row counts |
| 3D Behavioral Explorer | Interactive Three.js / R3F point cloud (see above) |
| Clustering Analysis | Verified K-Means and DBSCAN metrics, Recharts bar/donut charts, silhouette meter, algorithm comparison table |
| Association Rules | Apriori configuration, transaction items, illustrative rules table |
| Insights | Key findings, algorithm comparison, project road map |

---

## Setup & Running

### Prerequisites

- Python 3.10+
- Node.js 18+
- npm 9+
- CICIDS2017 `MachineLearningCSV.zip` extracted to `data/raw/`

### 1 — Install mining dependencies

```powershell
cd D:\SENTINEL
pip install pandas numpy scikit-learn mlxtend
```

### 2 — Run preprocessing

```powershell
cd D:\SENTINEL\mining
python preprocess.py
```

Output: `data/processed/cicids_clean.csv` (~2.52 million rows).

Expected console output:

```
Loading CSV files...
  Monday-WorkingHours.pcap_ISCX.csv: 529,918 rows
  ...
Original total rows : 2,830,743
Rows after cleaning : 2,520,798
Number of features  : 78
Duplicates removed  : 307,078
Rows removed (NaN/inf): 2,867
```

### 3 — Run mining

```powershell
cd D:\SENTINEL\mining
python mining.py
```

Output files written to `data/processed/results/`:

- `kmeans_results.csv`
- `dbscan_results.csv`
- `apriori_rules.csv`

This step takes several minutes — Apriori on 20,000 rows is the most time-consuming.

### 4 — Install frontend dependencies

```powershell
cd D:\SENTINEL\frontend
npm install
```

### 5 — Start the backend

Open a terminal and keep it running:

```powershell
cd D:\SENTINEL\backend
uvicorn main:app --reload
```

The API starts at `http://127.0.0.1:8000`. Verify with:

```powershell
curl http://127.0.0.1:8000/health
```

Expected: `{"status":"ok","rows_loaded":50000}`

### 6 — Start the frontend

Open a second terminal:

```powershell
cd D:\SENTINEL\frontend
npm run dev
```

Open `http://localhost:5173` in your browser.

> The Vite dev server proxies all `/api` requests to `http://127.0.0.1:8000`, so the frontend and backend communicate automatically.

---

## API Endpoints

All endpoints are read-only. No authentication. No database.

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/health` | Backend status and loaded row count |
| `GET` | `/api/explorer` | Uniform 3,000-row sample — used by RAW / K-Means / DBSCAN modes |
| `GET` | `/api/explorer/attack` | Stratified sample (800 BENIGN + up to 2,200 attacks) — used by Attack Type mode; includes `label_counts` |
| `GET` | `/api/explorer/meta` | Feature list, full label distribution, K-Means and DBSCAN cluster counts |

Each point record contains all 78 numerical feature values plus `Label`, `KMeans_Cluster`, and `DBSCAN_Cluster`.

---

## Limitations

| Limitation | Detail |
|---|---|
| Offline dataset | CICIDS2017 is a static research capture from 2017. It does not represent current attack patterns or live traffic. |
| Sampled mining | K-Means and DBSCAN operate on a 50,000-row sample; Apriori on 20,000 rows. Results reflect sample behavior, not the full 2.52M-row dataset. |
| Browser rendering budget | The 3D explorer renders at most ~3,000 points. This is a visualization constraint, not a data constraint. |
| Clusters ≠ attack categories | Unsupervised clusters partition the feature space — they do not automatically correspond to specific attack types. Cluster 0 dominates because BENIGN traffic dominates the dataset. |
| Associations are not causal | Apriori rules show co-occurrence patterns. A rule such as `{SmallAvgPacket} → {PortScan}` means these items frequently co-occur; it does not establish that small packets cause port-scanning behavior. |
| Class imbalance | BENIGN flows account for approximately 90% of the dataset. This heavily influences cluster sizes, association rule supports, and visual density in all three modes. |

---

## References

- Sharafaldin, I., Lashkari, A. H., & Ghorbani, A. A. (2018). *Toward Generating a New Intrusion Detection Dataset and Intrusion Traffic Characterization.* ICISSP.
- CICIDS2017 dataset: [https://www.unb.ca/cic/datasets/ids-2017.html](https://www.unb.ca/cic/datasets/ids-2017.html)
- Ester, M., et al. (1996). *A Density-Based Algorithm for Discovering Clusters.* KDD.
- Agrawal, R., & Srikant, R. (1994). *Fast Algorithms for Mining Association Rules.* VLDB.

---

*SENTINEL is a student showcase project. It is not a production intrusion-detection system.*
