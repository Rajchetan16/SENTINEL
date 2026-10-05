import pandas as pd
import numpy as np
from pathlib import Path

# ── Paths ────────────────────────────────────────────────────────────────────
RAW_DIR = Path(__file__).parent.parent / "data" / "raw" / "MachineLearningCSV" / "MachineLearningCVE"
OUT_DIR = Path(__file__).parent.parent / "data" / "processed"
OUT_FILE = OUT_DIR / "cicids_clean.csv"

CSV_FILES = [
    "Monday-WorkingHours.pcap_ISCX.csv",
    "Tuesday-WorkingHours.pcap_ISCX.csv",
    "Wednesday-workingHours.pcap_ISCX.csv",
    "Thursday-WorkingHours-Morning-WebAttacks.pcap_ISCX.csv",
    "Thursday-WorkingHours-Afternoon-Infilteration.pcap_ISCX.csv",
    "Friday-WorkingHours-Morning.pcap_ISCX.csv",
    "Friday-WorkingHours-Afternoon-PortScan.pcap_ISCX.csv",
    "Friday-WorkingHours-Afternoon-DDos.pcap_ISCX.csv",
]

# ── Load ─────────────────────────────────────────────────────────────────────
print("Loading CSV files...")
frames = []
for name in CSV_FILES:
    path = RAW_DIR / name
    df = pd.read_csv(path, low_memory=False)
    print(f"  {name}: {len(df):,} rows")
    frames.append(df)

df = pd.concat(frames, ignore_index=True)
original_rows = len(df)
print(f"\nOriginal total rows : {original_rows:,}")

# ── Strip column names ────────────────────────────────────────────────────────
df.columns = df.columns.str.strip()

# ── Strip string values ───────────────────────────────────────────────────────
str_cols = df.select_dtypes(include="object").columns
df[str_cols] = df[str_cols].apply(lambda col: col.str.strip())

# ── Normalize Label column ────────────────────────────────────────────────────
df["Label"] = (
    df["Label"]
    .astype(str)
    .str.strip()
    .str.replace("\ufffd", "-", regex=False)   # replace malformed replacement char
)

# ── Replace ±inf with NaN ─────────────────────────────────────────────────────
df.replace([np.inf, -np.inf], np.nan, inplace=True)

# ── Drop NaN rows ─────────────────────────────────────────────────────────────
rows_before_nan = len(df)
df.dropna(inplace=True)
nan_rows_removed = rows_before_nan - len(df)

# ── Drop duplicates ───────────────────────────────────────────────────────────
rows_before_dup = len(df)
df.drop_duplicates(inplace=True)
duplicates_removed = rows_before_dup - len(df)

# ── Keep numerical features + Label ──────────────────────────────────────────
num_cols = df.select_dtypes(include=[np.number]).columns.tolist()
df = df[num_cols + ["Label"]]

num_features = len(num_cols)

# ── Save ──────────────────────────────────────────────────────────────────────
OUT_DIR.mkdir(parents=True, exist_ok=True)
df.to_csv(OUT_FILE, index=False)

# ── Report ────────────────────────────────────────────────────────────────────
print(f"Rows after cleaning          : {len(df):,}")
print(f"Number of features           : {num_features}")
print(f"Duplicates removed           : {duplicates_removed:,}")
print(f"Rows removed (NaN/inf)       : {nan_rows_removed:,}")
print(f"\nFinal label distribution:")
print(df["Label"].value_counts().to_string())
print(f"\nFinal dataset shape          : {df.shape}")
print(f"\nSaved to: {OUT_FILE}")
