"""Regression tests for the fictional read-only validator."""
import copy
import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from demo import AS_OF, MANIFEST, clean_rows, validate_batch


class ValidationTests(unittest.TestCase):
    def check(self, rows=None, manifest=None, **kwargs):
        return validate_batch(
            clean_rows() if rows is None else rows,
            MANIFEST if manifest is None else manifest,
            as_of=kwargs.pop("as_of", AS_OF), **kwargs)

    def assert_issue(self, report, expected):
        self.assertEqual(report["status"], "FAIL")
        self.assertTrue(any(i.startswith(expected) for i in report["issues"]), report)

    def test_clean_pass(self):
        self.assertEqual(self.check()["status"], "PASS")

    def test_duplicate_key_and_amount(self):
        rows = clean_rows()
        rows.append(dict(rows[1]))
        report = self.check(rows)
        self.assert_issue(report, "duplicate_key:north/N-101")
        self.assert_issue(report, "sum_mismatch:north")

    def test_missing_source(self):
        self.assert_issue(self.check(clean_rows()[:2]), "missing_source:south")

    def test_stale_source(self):
        rows = clean_rows()
        for r in rows[:2]:
            r["loaded_at"] = "2026-11-09T07:00:00Z"
        self.assert_issue(self.check(rows), "stale_source:north")

    def test_fresh_but_incomplete(self):
        rows = clean_rows()
        rows.pop(0)
        self.assert_issue(self.check(rows), "count_mismatch:north")

    def test_future_timestamp(self):
        rows = clean_rows()
        rows[0]["loaded_at"] = "2026-11-09T08:01:00Z"
        self.assert_issue(self.check(rows), "future_loaded_at:0")

    def test_naive_timestamp(self):
        rows = clean_rows()
        rows[0]["loaded_at"] = "2026-11-09T07:50:00"
        self.assert_issue(self.check(rows), "invalid_loaded_at:0")

    def test_float_amount(self):
        rows = clean_rows()
        rows[0]["amount_cents"] = 12.3
        self.assert_issue(self.check(rows), "invalid_amount:0")

    def test_boolean_amount(self):
        rows = clean_rows()
        rows[0]["amount_cents"] = True
        self.assert_issue(self.check(rows), "invalid_amount:0")

    def test_unexpected_source(self):
        rows = clean_rows()
        rows.append(dict(source="other", transaction_id="X-1",
                         loaded_at="2026-11-09T07:55:00Z", amount_cents=1))
        self.assert_issue(self.check(rows), "unexpected_source:other")

    def test_bad_schema(self):
        rows = clean_rows()
        del rows[0]["source"]
        self.assert_issue(self.check(rows), "invalid_schema:0")

    def test_inputs_not_modified(self):
        rows = clean_rows()
        old = copy.deepcopy(rows)
        manifest = dict(MANIFEST)
        self.check(rows, manifest=manifest)
        self.assertEqual(rows, old)
        self.assertEqual(manifest, MANIFEST)

    def test_empty_batch(self):
        self.assert_issue(self.check([]), "missing_source:north")

    def test_negative_freshness_rejected(self):
        with self.assertRaises(ValueError):
            self.check(max_age_minutes=-1)

    def test_bad_manifest_rejected(self):
        with self.assertRaises(ValueError):
            self.check(manifest={"north": ("2", 2000)})

    def test_naive_as_of_rejected(self):
        with self.assertRaises(ValueError):
            self.check(as_of=AS_OF.replace(tzinfo=None))


if __name__ == "__main__":
    unittest.main()
