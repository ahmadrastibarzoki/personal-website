"""Read-only batch preview tests using only made-up data and built-in unittest."""
import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from batch_preview import MAX_BATCH_SIZE, preview_batch
from demo import PreviewDenied, TASKS


def item(task_id="DEMO-101", decision="approve", role="reviewer",
         team="demo-design", **extra):
    return {"task_id": task_id, "decision": decision,
            "role": role, "team": team, **extra}


class BatchPreviewTests(unittest.TestCase):
    def assert_denied(self, inputs, reason):
        with self.assertRaisesRegex(PreviewDenied, reason):
            preview_batch(inputs)

    def test_two_valid_preview_items_never_enable_writes(self):
        result = preview_batch([
            item(), item("DEMO-103", "reject", team="demo-support", reason=" Needs revision ")
        ])
        self.assertEqual(result["count"], 2)
        self.assertEqual(result["status"], "PREVIEW_ONLY")
        self.assertIs(result["write_enabled"], False)
        self.assertEqual(result["items"][1]["reason"], "Needs revision")
        self.assertTrue(all(i["write_enabled"] is False for i in result["items"]))

    def test_one_valid_item(self):
        self.assertEqual(preview_batch([item()])["count"], 1)

    def test_empty_batch_denied(self):
        self.assert_denied([], "invalid_batch_size")

    def test_oversized_batch_denied(self):
        self.assert_denied([item()] * (MAX_BATCH_SIZE + 1), "invalid_batch_size")

    def test_non_list_denied(self):
        self.assert_denied((item(),), "invalid_batch_size")

    def test_null_item_denied(self):
        self.assert_denied([None], "item_0:invalid_request")

    def test_missing_field_denied(self):
        d = item()
        del d["role"]
        self.assert_denied([d], "item_0:invalid_fields")

    def test_extra_field_denied(self):
        self.assert_denied([item(write_enabled=True)], "item_0:invalid_fields")

    def test_non_string_field_denied(self):
        self.assert_denied([item(role=None)], "item_0:invalid_role_type")

    def test_non_string_reason_denied(self):
        self.assert_denied([item(reason=None)], "item_0:invalid_reason_type")

    def test_duplicate_task_denied(self):
        self.assert_denied([item(), item(decision="reject", reason="different")], "item_1:duplicate_task_id")

    def test_invalid_second_item_denies_entire_batch(self):
        self.assert_denied([item(), item("DEMO-103", team="demo-design")], "item_1:team_out_of_scope")

    def test_open_task_denied(self):
        self.assert_denied([item("DEMO-102")], "item_0:task_not_completed")

    def test_reject_without_reason_denied(self):
        self.assert_denied([item(decision="reject", reason="  ")], "item_0:rejection_requires_reason")

    def test_wrong_role_denied(self):
        self.assert_denied([item(role="observer")], "item_0:role_not_authorized")

    def test_bad_task_id_denied(self):
        self.assert_denied([item(task_id="../../../etc")], "item_0:invalid_task_id")

    def test_unknown_task_denied(self):
        self.assert_denied([item(task_id="DEMO-999")], "item_0:task_not_found")

    def test_unsupported_decision_denied(self):
        self.assert_denied([item(decision="delete")], "item_0:unsupported_decision")

    def test_input_and_demo_records_are_unchanged(self):
        rows = [item(), item("DEMO-103", team="demo-support")]
        expected = [dict(i) for i in rows]
        before = dict(TASKS)
        preview_batch(rows)
        self.assertEqual(rows, expected)
        self.assertEqual(TASKS, before)


if __name__ == "__main__":
    unittest.main()
