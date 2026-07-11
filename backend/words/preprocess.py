"""
Preprocess dataset.csv to strip administrative-level suffixes
(市, 町, 村, 区) from name_kanji, name_kana, and name_romaji.

Adds new columns:
  - name_kanji_base   : name_kanji with the suffix kanji removed
  - name_kana_base    : name_kana with the suffix kana removed
  - name_romaji_base  : name_romaji with the suffix romaji removed
  - suffix_stripped   : the kanji suffix that was removed
  - suffix_romaji     : the romaji form of the removed suffix

Output: dataset_stripped.csv (same directory as input)
"""

import re
import sys
from collections import Counter
from pathlib import Path

import cutlet
import pandas as pd

INPUT_FILE = Path(__file__).parent / "municipalities.csv"
OUTPUT_FILE = Path(__file__).parent / "dataset.csv"

# All administrative suffix variants (grouped by kanji so we can skip kanji-only matches)
_SUFFIX_VARIANTS = [
    ("町", "ちょう", "chou"),
    ("町", "まち", "machi"),
    ("市", "し", "shi"),
    ("村", "むら", "mura"),
    ("村", "そん", "son"),
    ("区", "く", "ku"),
]


def strip_suffix(kanji: str, kana: str, romaji: str):
    """
    Detect the administrative suffix by matching all three forms simultaneously.
    Returns (kanji_base, kana_base, romaji_base, suffix_label, suffix_romaji).
    Only considers a variant valid if all three strings end with their suffix form.
    """
    for kanji_sfx, kana_sfx, romaji_sfx in _SUFFIX_VARIANTS:
        if (
            kanji.endswith(kanji_sfx)
            and kana.endswith(kana_sfx)
            and romaji.endswith(romaji_sfx)
        ):
            kanji_base = kanji.removesuffix(kanji_sfx)
            kana_base = kana.removesuffix(kana_sfx)
            romaji_base = romaji.removesuffix(romaji_sfx)
            return kanji_base, kana_base, romaji_base, kanji_sfx, kana_sfx

    # No recognized suffix — return as-is
    return kanji, kana, romaji, None, None


def fix_romaji(df):
    # Re-romanize dataset
    roman = cutlet.Cutlet()
    roman.use_foreign_spelling = False
    df = df.dropna(subset=["name_kana"])
    df["name_romaji"] = df["name_kana"].map(lambda x: roman.map_kana(x) if x else None)
    df["name_romaji"] = df["name_romaji"].str.replace(" ", "").str.lower()
    df["name_romaji"] = df["name_romaji"].apply(
        lambda x: re.sub(r"[^a-zA-Z]", "", x).strip()
    )
    return df


def main():
    if not INPUT_FILE.exists():
        sys.exit(f"Input file not found: {INPUT_FILE}")

    df = pd.read_csv(INPUT_FILE)
    df = fix_romaji(df)
    # Apply strip_suffix row-wise and expand the result into new columns
    base_data = df.apply(
        lambda row: strip_suffix(
            row["name_kanji"], row["name_kana"], row["name_romaji"]
        ),
        axis=1,
        result_type="expand",
    )
    base_data.columns = [
        "name_kanji_base",
        "name_kana_base",
        "name_romaji_base",
        "suffix_stripped",
        "suffix_kana",
    ]
    df = pd.concat([df, base_data], axis=1)
    df["suffix_stripped"] = df["suffix_stripped"].fillna("")
    df["suffix_kana"] = df["suffix_kana"].fillna("")

    df.to_csv(OUTPUT_FILE, index=False)

    # Summary
    suffix_counts = Counter(zip(df["suffix_stripped"], df["suffix_kana"]))
    print(f"Wrote {len(df)} rows → {OUTPUT_FILE}")
    print("Suffix breakdown:")
    for (sfx, sfx_r), count in suffix_counts.most_common():
        print(f"  {sfx or '(none)':<6} / {sfx_r or '(none)':<6} : {count}")


if __name__ == "__main__":
    main()
