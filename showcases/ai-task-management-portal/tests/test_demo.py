"""Tests cover this synthetic preview, not a real backend or security service."""
import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from demo import TASKS, PreviewDenied, preview_decision


class PreviewDecisionTests(unittest.TestCase):
    def test_approved_preview_is_never_an_execution(self):
        result = preview_decision("DEMO-101", "approve", role="reviewer", team="demo-design")
        self.assertEqual(result["status"], "PREVIEW_ONLY")
        self.assertIs(result["write_enabled"], False)

    def test_rejection_requires_reason(self):
        with self.assertRaisesRegex(PreviewDenied, "rejection_requires_reason"):
            preview_decision("DEMO-101", "reject", role="reviewer", team="demo-design")

    def test_rejection_preview_preserves_reason(self):
        result = preview_decision("DEMO-101", "reject", role="reviewer",
                                  team="demo-design", reason="  Demo reason  ")
        self.assertEqual(result["reason"], "Demo reason")
        self.assertIs(result["write_enabled"], False)

    def test_invalid_task_id_denied(self):
        with self.assertRaisesRegex(PreviewDenied, "invalid_task_id"):
            preview_decision("../../etc/passwd", "approve", role="reviewer", team="demo-design")

    def test_unknown_task_denied(self):
        with self.assertRaisesRegex(PreviewDenied, "task_not_found"):
            preview_decision("DEMO-999", "approve", role="reviewer", team="demo-design")

    def test_team_boundary_denied(self):
        with self.assertRaisesRegex(PreviewDenied, "team_out_of_scope"):
            preview_decision("DEMO-103", "approve", role="reviewer", team="demo-design")

    def test_role_boundary_denied(self):
        with self.assertRaisesRegex(PreviewDenied, "role_not_authorized"):
            preview_decision("DEMO-101", "approve", role="observer", team="demo-design")

    def test_open_task_denied(self):
        with self.assertRaisesRegex(PreviewDenied, "task_not_completed"):
            preview_decision("DEMO-102", "approve", role="reviewer", team="demo-design")

    def test_unrecognized_action_denied(self):
        with self.assertRaisesRegex(PreviewDenied, "unsupported_decision"):
            preview_decision("DEMO-101", "delete", role="reviewer", team="demo-design")

    def test_no_state_mutation(self):
        before = dict(TASKS)
        preview_decision("DEMO-101", "approve", role="reviewer", team="demo-design")
        self.assertEqual(TASKS, before)


if __name__ == "__main__":
    unittest.main()
