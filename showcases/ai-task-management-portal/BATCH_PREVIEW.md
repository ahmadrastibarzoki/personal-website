# Batch decision preview — fictional, read-only extension

This optional example extends the existing single-task \`preview_decision\` example
with a **non-executable multi-request review**. It is an independent educational
mock. Nothing here is connected to any organization, workflow engine, LLM, MCP,
API, customer record, production task, database, or live authentication provider.

## Try it

From repository root, with **Python 3.10+** (standard library only):

\`\`\`bash
python showcases/ai-task-management-portal/batch_preview.py
python -m unittest discover -s showcases/ai-task-management-portal/tests -v
\`\`\`

The output includes \`status="PREVIEW_ONLY"\` and \`write_enabled=false\`, both for
the whole batch and for every item. There is **no confirm/execute operation**.

## Strict toy checks

- Accepts a list of **1–10** request objects; unknown/missing fields are refused.
- Each item needs string \`task_id\`, \`decision\`, \`role\`, \`team\`; optional \`reason\`
  must be a string. Every request is validated using the single-item demo policy.
- Rejects a second request targeting the same fictional task in a batch.
- If any item is invalid, raises \`PreviewDenied\` with the failing index instead
  of returning a partial result. This is not a transaction, because **nothing is
  written** in the first place.
- Preserves the input request list and fictional in-memory tasks.

## Safety boundaries (important)

The role and team values are **supplied by the demo caller**, not verified against
any authenticated identity. This design does **not** establish authorization.
Tests demonstrate toy conditional checks, **not** a security audit, production
readiness, authorization correctness, atomic persistence or concurrency safety.

A real design would additionally need a trusted identity source, scoped
permissions, fresh task revision checks, explicit human confirmation, a
restricted idempotent writer, durable audit/receipt and reconciliation.
Those systems are **not implemented** here. A preview must never grant write
permission.

No genuine project facts, statuses, deadlines, internal endpoints or proprietary
source code are included. All identifiers and examples are synthetic.
