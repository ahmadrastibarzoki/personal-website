# Architecture and safety boundary (synthetic)

## Purpose

A language model's output is untrusted until a separate deterministic layer verifies the requested operation against an authenticated principal, permitted scope and fresh business state. The actual organization-specific implementation is not in this repository.

## Read / proposal path in this mock

1. Caller selects an invented task ID and intended decision.
2. `preview_decision` validates ID shape, action type, demo task presence, role/team scope and task state.
3. Reject actions require a nonblank reason.
4. It returns an immutable-style serializable proposal marked `PREVIEW_ONLY`, `write_enabled=false`.
5. No file, database, external API or state is mutated.

## Not implemented

- ChatGPT or MCP connection, agent orchestration or real tool permissions
- User authentication, sessions, organization-scoped authorization, RBAC policy service
- Database transactions, signed approvals or binding actor to proposal
- Expiring revisions or compare-and-swap checks against real task state
- Durable idempotency across requests, write receipts, audits and reconciliation
- Real production writer or deployment

## Potential future design (concept, not source code)

```text
Authenticated request → tool allowlist → scoped read → deterministic validation
        → preview → human confirmation bound to current revision
        → restricted idempotent writer → independent reconciliation
```

Never treat a positive preview as a permission to write. A server-side authorization layer must independently reject stale or out-of-scope operations. Never reuse this mock's hard-coded roles in a real security boundary.

## Privacy / IP

All examples here were written from scratch using fictional team and task names. There are no confidential identifiers, internal network paths, real customer records, actual integrations, proprietary source, or credentials. Real integration work must be reviewed separately by its lawful owner before any disclosure.
