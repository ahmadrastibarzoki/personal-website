# AI Task-Management Portal — Clean-room Safety Showcase

**Status:** Standalone educational **mock**, NOT the proprietary project, NOT a deployment and NOT a production-ready assistant.

This small Python sample demonstrates a trust boundary that matters when connecting a natural-language assistant to a task-management system: **an AI-generated proposal is not authority to mutate a task.**

The demonstration uses only invented task IDs, teams and titles. It has no model/API integration, MCP server, authentication backend, organization-specific logic, network requests, secrets, business data or real task writes.

## What you can run

Requires Python 3.10+; no third-party packages.

```bash
python showcases/ai-task-management-portal/demo.py
python -m unittest discover -s showcases/ai-task-management-portal/tests -v
```

Run from the repository root. `demo.py` prints a synthetic approval **preview** whose `write_enabled` flag is always `false`. No approve/reject execution function exists.

### The example workflow

```text
Natural-language instruction (not processed here)
    ↓
Untrusted structured proposal
    ↓
Deterministic policy checks (this demo)
    ↓
Read-only synthetic task lookup (this demo)
    ↓
Human-visible proposal — NO WRITE (this demo)
    ↓
[future separate trusted application: real identity, human authorization,
 idempotent restricted writer, audit receipt and reconciliation]
```

The tests demonstrate allow/deny paths for missing tasks, invalid IDs, wrong team/role, inappropriate task status and missing rejection reasons. These are **unit tests of toy policy logic**, not a security audit or evidence that a real integration is operational.

## Scope boundaries

| Item | This public showcase | Real application (not included) |
|---|---|---|
| Task records | invented in-memory examples | private operational data |
| Role/team checks | simplified deterministic rules | independent trusted authentication + detailed authorization |
| Review decision | preview-only object | approved, scoped action gateway needed |
| MCP / tool calling | not implemented | separate integration and verification |
| Read/write network/API | none | requires separate security review |
| Deployment / transactions | none | robust controls and reconciliation needed |

**No proprietary implementation has been copied here.** Please don't send production tokens, company screenshots or real task exports in issues or pull requests.

## Further reading

- [English website article](https://ahmadrastibarzoki.ir/insights/ai-task-management-portal-mcp-approval-gates)
- [Persian website article](https://ahmadrastibarzoki.ir/fa/insights/ai-task-management-portal-mcp-approval-gates)
- [Architecture and threat boundaries](ARCHITECTURE.md)

This educational example illustrates an engineering approach, not a claim that a deployed ChatGPT/MCP portal exists.
