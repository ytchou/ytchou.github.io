#!/usr/bin/env python3
"""Parse Track A, B, and C JSON outputs into a unified pandas DataFrame / CSV."""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[3]))

import pandas as pd

from utils.metrics import parse_run_directory


def main():
    project_dir = Path(__file__).parent.parent
    rows = []

    for track, dirname in [("A", "track_a"), ("B", "track_b"), ("C", "track_c")]:
        run_dir = project_dir / "outputs" / "runs" / dirname
        results = parse_run_directory(run_dir)
        for record, raw in results:
            meta = raw.get("_meta", {})
            wall_clock = meta.get("wall_clock_sec") or raw.get("wall_clock_sec") or 0
            rows.append({
                "run_id": Path(raw.get("_file", "")).stem,
                "track": track,
                "task": meta.get("task", Path(raw.get("_file", "")).stem.rsplit("_", 2)[0]),
                "condition": meta.get("condition", "unknown"),
                "run_num": meta.get("run_num", 0),
                **record.to_dict(),
                "wall_clock_sec": wall_clock,
                "file": raw.get("_file", ""),
            })

    if not rows:
        print("No data to process.", file=sys.stderr)
        sys.exit(1)

    df = pd.DataFrame(rows)

    csv_path = project_dir / "outputs" / "results.csv"
    df.to_csv(csv_path, index=False)
    print(f"Wrote {len(df)} rows to {csv_path}")

    print("\n=== Summary ===")
    print(f"Tracks: {df['track'].unique().tolist()}")
    print(f"Tasks: {df['task'].unique().tolist()}")
    print(f"Conditions: {df['condition'].unique().tolist()}")
    print(f"Total runs: {len(df)}")
    print()

    summary = df.groupby(["track", "task", "condition"]).agg(
        n=("run_id", "count"),
        mean_output_tokens=("output_tokens", "mean"),
        std_output_tokens=("output_tokens", "std"),
        mean_input_tokens=("total_input_tokens", "mean"),
        mean_cost=("cost_usd", "mean"),
        mean_duration_ms=("duration_ms", "mean"),
        mean_result_length=("result_length", "mean"),
    ).round(2)

    print(summary.to_string())
    print()


if __name__ == "__main__":
    main()
