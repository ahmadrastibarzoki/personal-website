"""Synthetic, zero-network policy preview; no ChatGPT, MCP or real task integration.

This is a clean-room educational example and must not be deployed as a real
authorization service.
"""
from __future__ import annotations

import json
import re
from dataclasses import dataclass


@dataclass(frozen=True)
class DemoTask:
    identifier: str
    team: str
    title: str
    state: str


# Entirely invented records. No external file or connection is read.
TASKS: dict[str, DemoTask] = {
    "DEMO-101": DemoTask("DEMO-101", "demo-design", "Review sample layout", "completed"),
    "DEMO-102": DemoTask("DEMO-102", "demo-design", "Write fictional checklist", "open"),
    "DEMO-103": DemoTask("DEMO-103", "demo-support", "Review synthetic FAQ", "completed"),
}


class PreviewDenied(ValueError):
    """Expected fail-closed denial from the example policy."""


def preview_decision(
    task_id: str,
    decision: str,
    *,
    role: str,
    team: str,
    reason: str = "",
) -> dict[str, object]:
    """Return a NON-EXECUTABLE preview or reject the request.

    A "reviewer" role is toy data, not independent identity verification.
    All returned proposals explicitly disable writes.
    """
    if not isinstance(task_id, str) or not re.fullmatch(r"DEMO-[0-9]{3}", task_id):
        raise PreviewDenied("invalid_task_id")

    if decision not in ("approve", "reject"):
        raise PreviewDenied("unsupported_decision")

    if role != "reviewer":
        raise PreviewDenied("role_not_authorized")

    task = TASKS.get(task_id)
    if task is None:
        raise PreviewDenied("task_not_found")

    if team != task.team:
        raise PreviewDenied("team_out_of_scope")

    if task.state != "completed":
        raise PreviewDenied("task_not_completed")

    if decision == "reject" and not reason.strip():
        raise PreviewDenied("rejection_requires_reason")

    return {
        "status": "PREVIEW_ONLY",
        "write_enabled": False,
        "task_id": task.identifier,
        "team": task.team,
        "task_title": task.title,
        "decision": decision,
        "reason": reason.strip() if decision == "reject" else None,
        "next_step": "Manual review in a separately secured application; no action here.",
    }


if __name__ == "__main__":
    sample = preview_decision(
        "DEMO-101", "approve", role="reviewer", team="demo-design"
    )
    print(json.dumps(sample, ensure_ascii=False, indent=2))
