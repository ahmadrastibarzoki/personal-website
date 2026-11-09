"""Read-only quality checks for invented transaction batches; NOT production code."""
from __future__ import annotations

import json
from collections import Counter
from datetime import datetime, timedelta, timezone

AS_OF = datetime(2026, 11, 9, 8, 0, tzinfo=timezone.utc)
MANIFEST = {"north": (2, 2000), "south": (1, 2000)}
FIELDS = {"source", "transaction_id", "loaded_at", "amount_cents"}


def clean_rows():
    return [
        dict(source="north", transaction_id="N-100", loaded_at="2026-11-09T07:50:00Z", amount_cents=1250),
        dict(source="north", transaction_id="N-101", loaded_at="2026-11-09T07:50:00Z", amount_cents=750),
        dict(source="south", transaction_id="S-200", loaded_at="2026-11-09T07:54:00Z", amount_cents=2000),
    ]


def validate_batch(rows, manifest, *, as_of, max_age_minutes=30):
    """Validate a closed-window batch without modifying, writing or repairing it."""
    if not isinstance(as_of, datetime) or as_of.tzinfo is None:
        raise ValueError("as_of must be timezone-aware")
    if type(max_age_minutes) is not int or max_age_minutes < 0:
        raise ValueError("invalid freshness limit")
    if not isinstance(rows, list) or len(rows) > 10000:
        raise ValueError("invalid rows")
    if not isinstance(manifest, dict) or not manifest:
        raise ValueError("invalid manifest")
    for source, target in manifest.items():
        if not isinstance(source, str) or not source or not isinstance(target, tuple) or len(target) != 2 or any(type(v) is not int or v < 0 for v in target):
            raise ValueError("invalid manifest values")

    now = as_of.astimezone(timezone.utc)
    counts, amounts = Counter(), Counter()
    latest, seen, issues = {}, set(), []

    for i, row in enumerate(rows):
        if not isinstance(row, dict) or set(row) != FIELDS:
            issues.append(f"invalid_schema:{i}")
            continue
        src, key, stamp, amount = (row[n] for n in ("source", "transaction_id", "loaded_at", "amount_cents"))
        if not isinstance(src, str) or not src or not isinstance(key, str) or not key:
            issues.append(f"invalid_key:{i}")
            continue
        if type(amount) is not int or amount < 0:
            issues.append(f"invalid_amount:{i}")
            continue
        try:
            if not isinstance(stamp, str):
                raise ValueError()
            loaded = datetime.fromisoformat(stamp.replace("Z", "+00:00"))
            if loaded.tzinfo is None:
                raise ValueError()
            loaded = loaded.astimezone(timezone.utc)
        except ValueError:
            issues.append(f"invalid_loaded_at:{i}")
            continue

        if src not in manifest:
            issues.append(f"unexpected_source:{src}")
        if (src, key) in seen:
            issues.append(f"duplicate_key:{src}/{key}")
        seen.add((src, key))
        counts[src] += 1  # Raw counts: never silently deduplicate.
        amounts[src] += amount
        if loaded > now:
            issues.append(f"future_loaded_at:{i}")
        latest[src] = max(latest.get(src, loaded), loaded)

    for src, (expected_count, expected_cents) in manifest.items():
        if counts[src] != expected_count:
            issues.append(f"count_mismatch:{src}:expected_{expected_count}:actual_{counts[src]}")
        if amounts[src] != expected_cents:
            issues.append(f"sum_mismatch:{src}:expected_{expected_cents}:actual_{amounts[src]}")
        if src not in latest:
            issues.append(f"missing_source:{src}")
        elif now - latest[src] > timedelta(minutes=max_age_minutes):
            issues.append(f"stale_source:{src}")

    return {"status": "PASS" if not issues else "FAIL", "issues": issues,
            "observed": {src: {"count": counts[src], "cents": amounts[src]}
                         for src in sorted(set(manifest) | set(counts))}}


if __name__ == "__main__":
    print("CLEAN", json.dumps(validate_batch(clean_rows(), MANIFEST, as_of=AS_OF), indent=2))
    rows = clean_rows()
    rows.append(dict(rows[1]))
    print("DUPLICATE", json.dumps(validate_batch(rows, MANIFEST, as_of=AS_OF), indent=2))
