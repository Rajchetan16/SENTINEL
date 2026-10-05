import pandas as pd
from pathlib import Path

DATA_DIR = Path("../data/raw/MachineLearningCSV/MachineLearningCVE")

csv_files = list(DATA_DIR.glob("*.csv"))

print(f"\nFound {len(csv_files)} CSV files:\n")

for file in csv_files:
    print(f"→ {file.name}")

print("\n" + "=" * 70)

for file in csv_files:
    print(f"\nFILE: {file.name}")

    df = pd.read_csv(file, low_memory=False)

    print(f"Rows: {len(df):,}")
    print(f"Columns: {len(df.columns)}")

    print("\nColumns:")
    print(list(df.columns))

    print("\nMissing values:")
    print(df.isnull().sum().sum())

    print("\nDuplicate rows:")
    print(df.duplicated().sum())

    if " Label" in df.columns:
        print("\nLabel distribution:")
        print(df[" Label"].value_counts())
    elif "Label" in df.columns:
        print("\nLabel distribution:")
        print(df["Label"].value_counts())

    print("\n" + "-" * 70)