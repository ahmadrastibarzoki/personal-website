---
title: "Practical Data Validation for AI-Ready Pipelines: Freshness, Duplicates and Reconciliation"
description: "A hands-on Python and SQL guide to checking freshness, duplicate keys and independent count-and-total reconciliation before data reaches analytics or AI."
summary: "A pipeline can run on time yet deliver an incomplete or misleading dataset. Learn how to validate per-source freshness, duplicate business keys and reconciled amounts, using reproducible synthetic Python and SQLite examples."
category: "Data Engineering & Applied AI"
datePublished: 2026-11-09
dateModified: 2026-11-09
keywords:
  - "Data Engineering"
  - "Data Quality"
  - "Data Validation"
  - "AI-ready pipelines"
  - "Data Freshness"
  - "Duplicate Records"
  - "Reconciliation"
  - "Python"
  - "SQL"
image: "/images/ai-ready-data-validation-gates.svg"
imageAlt: "Original vector illustration showing two fictional sources passing through freshness, duplicate-key and reconciliation checks before downstream AI use"
draft: false
sources:
  - title: "dbt — Freshness configuration"
    url: "https://docs.getdbt.com/reference/resource-configs/freshness"
  - title: "dbt — Data tests"
    url: "https://docs.getdbt.com/docs/build/data-tests"
  - title: "Great Expectations — Validate uniqueness"
    url: "https://docs.greatexpectations.io/docs/reference/learn/data_quality_use_cases/uniqueness/"
  - title: "SQLite — Aggregate functions"
    url: "https://www.sqlite.org/lang_aggfunc.html"
  - title: "Python — sqlite3 documentation"
    url: "https://docs.python.org/3/library/sqlite3.html"
---

## A successful pipeline run does not prove data quality

A scheduler says *success*. An API returns HTTP 200. An ingestion job finishes on time. Does that mean its output is complete and safe to feed into an AI application? Not necessarily.

Operational monitoring asks, **“Did the job run?”** Data validation asks a different question: **“Did the expected information arrive, without conflicting keys, and does it agree with independent controls?”** The second question can fail while the first succeeds.

This article is a practical, reproducible tutorial, **not a claim about a production system or internal business results**. All records, names, amounts and timestamps are fictional.

![Synthetic data passes freshness, uniqueness and reconciliation gates before use](/images/ai-ready-data-validation-gates.svg)

We will implement three gates—freshness, duplicates and reconciliation—and define the downstream behavior when one fails.

## 1. Establish an independently verifiable contract

Imagine two fictional transaction sources called `north` and `south`, for a **closed reporting window**. Each record has `source`, `transaction_id`, `loaded_at` (UTC ingestion time) and `amount_cents` (integer cents).

An **independent manifest** describes the expected data:

| Source | Expected records | Expected amount (cents) |
| --- | ---: | ---: |
| north | 2 | 2,000 |
| south | 1 | 2,000 |
| **Total** | **3** | **4,000** |

The valid batch contains the following three records:

| Source | ID | Loaded UTC | Amount (cents) |
| --- | --- | --- | ---: |
| north | N-100 | 07:50 | 1,250 |
| north | N-101 | 07:50 | 750 |
| south | S-200 | 07:54 | 2,000 |

Assume the evaluation time is **2026-11-09 08:00 UTC** and the maximum ingestion age is **30 minutes**. These are illustrative thresholds, not a universal SLA.

Two assumptions matter. First, the manifest must be obtained independently of the batch being checked; otherwise, comparing a table against its own counts proves very little. Second, “complete” must refer to a specified window or partition. A live, still-arriving window needs an explicit watermark or allowed-lateness policy.

## 2. Freshness: verify every required source

A useful ingestion freshness check compares the latest `loaded_at` for **each** required source with the evaluation time. Here `north` is 10 minutes old and `south` is 6 minutes old: both pass. If `south` disappears, the fresh `north` rows must not make the overall batch pass. If `north` last loaded at 07:00, it fails the 30-minute threshold.

This is **ingestion-time freshness**, not event-time freshness or completeness. A recently ingested record could describe an old event. A source's newest record could arrive while older partitions remain missing. Check event timestamps and expected coverage separately when the use case requires them.

The [dbt freshness configuration](https://docs.getdbt.com/reference/resource-configs/freshness) supports explicit warning/error thresholds. In the current documentation, `dbt freshness` checks configured source or model freshness. Our demonstration is intentionally smaller and transparent.

## 3. Duplicates: define the business key first

Suppose a retry loads `(north, N-101)` twice. The raw batch now has four rows and a total of **4,750 cents**, even though the independent manifest expects three rows and **4,000 cents**.

For a SQLite table named `staging_events`:

```sql
SELECT source, transaction_id, COUNT(*) AS occurrences
FROM staging_events
GROUP BY source, transaction_id
HAVING COUNT(*) > 1;
```

The check flags `(north, N-101)`. This assumes `(source, transaction_id)` uniquely identifies a transaction; other datasets may require a composite key including a line-item or revision identifier.

**Do not silently drop duplicates before validation.** A retry and an intended correction have different semantics. Preserve both inputs for investigation, define idempotency and revision behavior, and reject ambiguous batches rather than inventing which record wins. The [Great Expectations uniqueness guide](https://docs.greatexpectations.io/docs/reference/learn/data_quality_use_cases/uniqueness/) distinguishes single-column and compound-key validation.

## 4. Reconciliation: compare counts and totals by source

Duplicate checks alone cannot tell whether a source failed to deliver one expected row. Reconcile against an independent manifest, **per source and reporting window**, rather than only comparing grand totals.

This SQLite query produces a diagnostic report:

```sql
WITH manifest(source, expected_rows, expected_cents) AS (
  VALUES ('north', 2, 2000), ('south', 1, 2000)
),
observed AS (
  SELECT source,
         COUNT(*) AS actual_rows,
         COALESCE(SUM(amount_cents), 0) AS actual_cents
  FROM staging_events
  GROUP BY source
)
SELECT m.source, m.expected_rows,
       COALESCE(o.actual_rows, 0) AS actual_rows,
       m.expected_cents,
       COALESCE(o.actual_cents, 0) AS actual_cents
FROM manifest AS m
LEFT JOIN observed AS o ON o.source = m.source;
```

When `N-101` is repeated, the observed north count is **3** instead of **2**, and its amount is **2,750** instead of **2,000**. Both mismatches should fail the batch.

This query is **not a complete safety gate**. It does not by itself reject unexpected sources, invalid types, null amounts, bad timestamps or duplicate keys. SQLite's `COUNT(*)` includes every row, while `SUM` ignores NULL values; missing-value and type checks must be explicit. Currency conversion, refunds and sign conventions also need a declared policy.

## 5. Execute the synthetic Python validator

I included a zero-dependency example and tests in the public website repository:

**[Open the Python source and tests](https://github.com/ahmadrastibarzoki/personal-website/tree/main/showcases/data-validation)**

Run these commands at the repository root with Python 3.10 or newer:

```bash
python showcases/data-validation/demo.py
python -m unittest discover -s showcases/data-validation/tests -v
```

The central interface is:

```python
from datetime import datetime, timezone
from demo import clean_rows, validate_batch

report = validate_batch(
    clean_rows(),
    {"north": (2, 2000), "south": (1, 2000)},
    as_of=datetime(2026, 11, 9, 8, 0, tzinfo=timezone.utc),
)
print(report["status"])  # PASS for the fictional clean batch
```

In the sample, `validate_batch` checks schema and nonnegative integer amounts, timezone-aware timestamps, unexpected or absent sources, duplicate business keys, source-level freshness, expected counts and amount sums. It then returns a diagnostic report with `PASS` or `FAIL`. The demo appends a duplicate record to demonstrate a failed result.

**Scope is deliberately narrow:** this is a read-only checker. It does not write a database, repair rows, guarantee manifest provenance, implement secure access or actually block a model from running. Those controls belong in an independently trusted ingestion and consumption system.

## 6. Make downstream behavior explicit

Validation is useful only if its result changes what happens next. Here is a **design recommendation**:

| Outcome | Pipeline response | AI response |
| --- | --- | --- |
| PASS | Publish the validated, versioned snapshot | Present its time and scope |
| WARN, when allowed by policy | Record an exception and its limitations | Display limitations; restrict high-impact actions |
| FAIL | Quarantine the candidate; preserve last known-good data | Do not treat failed data as verified |
| UNKNOWN | Avoid assuming an unrun check succeeded | Say the evidence is unavailable |

The demonstration implements only `PASS` and `FAIL`, not WARN, UNKNOWN, quarantine, model gating or durable writes.

For production systems, additional work includes retry-safe processing, atomic publication, batch identifiers, verified source controls, audit receipts, protected credentials and event-time policy. A model benchmark score does not replace validation of the underlying data.

## 7. Treat data quality as a layered contract

A useful acceptance checklist asks whether:

1. The reporting window, required sources, timestamp semantics and expected units are documented.
2. The independent manifest cannot be regenerated from the same incomplete batch.
3. Primary or composite keys are unique under a documented revision policy.
4. Each source satisfies its own freshness threshold; missing sources fail explicitly.
5. Counts and sums reconcile at the right granularity without silently dropping rows.
6. Failed or uncertain batches cannot quietly become a successful downstream update.
7. Tests cover good data, missing sources, duplicates, invalid types, stale timestamps and changed totals.

The [dbt data-testing documentation](https://docs.getdbt.com/docs/build/data-tests) describes reusable `unique`, `not_null`, `accepted_values` and `relationships` checks. They are useful building blocks, but an independent reconciliation contract remains domain-specific.

A green CI check on **synthetic fixtures** only establishes that the tested logic behaves as expected for those fixtures. It is not evidence of production correctness or a measured reduction in operational errors.

## The takeaway

An AI application can produce an impressive answer from the wrong dataset. Before asking whether a model is powerful enough, ask whether **the incoming information is complete, current and reconcilable—and whether the system knows when to stop**.

**Related reading:** [From AI prototype to usable product](/insights/from-ai-prototype-to-usable-product) · [Analytics engineering in practice](/insights/retail-analytics-engineering) · [SEO/GEO and trustworthy measurement](/insights/seo-geo-ai-search-foundations)
