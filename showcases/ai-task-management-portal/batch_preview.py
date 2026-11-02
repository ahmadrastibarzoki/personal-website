"""All-or-nothing NON-EXECUTABLE preview for fictional task decisions.

This module imports only the local educational sample. It has no integrations,
network traffic, persistence, authentication, or executable approval pathway.
A successful preview MUST NOT be treated as authority to write.
"""
from __future__ import annotations

import json
from collections.abc import Mapping

from demo import PreviewDenied, preview_decision

MAX_BATCH_SIZE = 10
_REQUIRED_FIELDS = frozenset({"task_id", "decision", "role", "team"})
_ALLOWED_FIELDS = _REQUIRED_FIELDS | {"reason"}


def preview_batch(requests: object) -> dict[str, object]:
    """Validate every request before returning a read-only batch preview.

    Never returns partially approved output: one invalid item denies the entire
    preview. This is an *output* guarantee, not transactional write semantics.
    This toy example does not authenticate reviewers or bind human approval.
    """
    if not isinstance(requests, list) or not 1 <= len(requests) <= MAX_BATCH_SIZE:
        raise PreviewDenied("invalid_batch_size")

    seen: set[str] = set()
    previews: list[dict[str, object]] = []
    for index, request in enumerate(requests):
        if not isinstance(request, Mapping):
            raise PreviewDenied(f"item_{index}:invalid_request")

        keys = set(request.keys())
        if keys != _REQUIRED_FIELDS and keys != _ALLOWED_FIELDS:
            raise PreviewDenied(f"item_{index}:invalid_fields")

        for key in _REQUIRED_FIELDS:
            if not isinstance(request[key], str):
                raise PreviewDenied(f"item_{index}:invalid_{key}_type")
        reason = request.get("reason", "")
        if not isinstance(reason, str):
            raise PreviewDenied(f"item_{index}:invalid_reason_type")

        task_id = request["task_id"]
        if task_id in seen:
            raise PreviewDenied(f"item_{index}:duplicate_task_id")
        seen.add(task_id)

        try:
            candidate = preview_decision(
                task_id,
                request["decision"],
                role=request["role"],
                team=request["team"],
                reason=reason,
            )
        except PreviewDenied as error:
            raise PreviewDenied(f"item_{index}:{error}") from error
        previews.append(candidate)

    return {
        "status": "PREVIEW_ONLY",
        "write_enabled": False,
        "count": len(previews),
        "items": previews,
        "next_step": "Review each proposal in a separate trusted system; no action here.",
    }


if __name__ == "__main__":
    demo = preview_batch([
        {"task_id": "DEMO-101", "decision": "approve", "role": "reviewer", "team": "demo-design"},
        {"task_id": "DEMO-103", "decision": "reject", "role": "reviewer", "team": "demo-support", "reason": "Example correction"},
    ])
    print(json.dumps(demo, ensure_ascii=False, indent=2))
