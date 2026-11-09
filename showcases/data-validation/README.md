# Read-only data-validation demo

This standard-library-only Python 3.10+ demo accompanies the
[November 9 bilingual tutorial](https://ahmadrastibarzoki.ir/insights/practical-data-validation-ai-ready-pipelines).

**All records and amounts are invented. There is no network use, database write,
company information, secret, AI integration or production authorization.**

From the repository root:

```bash
python showcases/data-validation/demo.py
python -m unittest discover -s showcases/data-validation/tests -v
```

The first output is `PASS` with 3 records across `north` and `south`
and expected combined total of 4,000 cents. The second adds a copy
of `north / N-101` and reports `FAIL` from duplicate, count and sum checks.

Validation covers: exact schema, nonnegative integer cents, timezone-aware
ingestion timestamps, per-source freshness, duplicate composite keys,
missing/extra sources and independent expected counts/sums. The script
only returns a report. It cannot verify the independent manifest's
provenance or enforce safe downstream behavior.

Before production use, design watermark/event-time policy, trusted manifest
provenance, durable idempotency, revisions, transactions, audit, access
control and fail-closed consumer gates. A synthetic test suite is not an
operational certification.

See the [dbt data tests reference](https://docs.getdbt.com/docs/build/data-tests)
and [Great Expectations uniqueness guide](https://docs.greatexpectations.io/docs/reference/learn/data_quality_use_cases/uniqueness/).
