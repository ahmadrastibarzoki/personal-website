---
title: "From ChatGPT to an AI Task-Management Portal: MCP, APIs and Approval Gates"
description: "An evidence-aware engineering case study of a developing AI task-management portal: read-only tool access, preview decisions, validation boundaries and human approvals."
summary: "A natural-language command becomes useful only when the surrounding system can explain its source, validate permissions and stop unsafe actions. This in-development case study separates working read-only previews from the stronger controls still required for authorized production writes."
category: "Applied AI Engineering"
datePublished: 2026-10-14
dateModified: 2026-10-14
keywords:
  - "Applied AI Engineering"
  - "MCP"
  - "Model Context Protocol"
  - "AI task management"
  - "human in the loop"
  - "Python"
  - "API security"
  - "approval workflow"
image: "/images/ai-task-portal-approval-gates.svg"
imageAlt: "Conceptual and synthetic AI task management flow with read-only tool calls, validation, a human approval gate and a blocked production write"
draft: false
sources:
  - title: "Model Context Protocol — introduction"
    url: "https://modelcontextprotocol.io/introduction"
  - title: "OWASP — Top 10 for LLM Applications"
    url: "https://genai.owasp.org/llm-top-10/"
  - title: "NIST AI Risk Management Framework"
    url: "https://www.nist.gov/itl/ai-risk-management-framework"
---

## An AI command is not the same as an authorized business action

“Approve this completed task” sounds like a simple request. A conversational model can parse the words and identify the intended action. But in a real organization, approval has consequences: the request needs a verified identity, the correct task, the right permissions, a fresh status check, and a durable record of what happened.

That gap between *understanding an instruction* and *safely executing it* is what I have been exploring while developing an AI-assisted management portal.

This article describes a **work in progress**, not a production launch. To avoid exposing proprietary company information, its diagrams, example task names, identifiers and workflow scenarios are **synthetic**. The implementation statuses below are based on a dated technical checkpoint, not a claim that the entire system works end to end.

![Conceptual, synthetic AI task portal architecture with explicit human approval and a blocked production writer](/images/ai-task-portal-approval-gates.svg)

## Start with the workflow, not the model

The proposed experience is straightforward: a manager states an intention in natural language, and an assistant helps find the relevant task or prepare a structured proposal. The risky part comes later, when the application must determine whether an action can actually be executed.

I divide that journey into four separate concerns:

1. **Interpretation:** understand what the person is asking and ask for missing fields instead of inventing them.
2. **Retrieval:** collect relevant task state through tightly scoped, read-only tools.
3. **Decision preparation:** validate the intended change, its target, permissions and business rules; show a human-readable preview.
4. **Execution and reconciliation:** only after authenticated human approval and further policy checks, submit an allowed change through a restricted writer and record a verifiable receipt.

These stages have different levels of trust. A model's suggestion is not proof that a person is authorized to act, and an attractive button is not a security boundary.

## What MCP contributes—and what it doesn't

Model Context Protocol (MCP) can standardize how an assistant discovers or invokes tools exposed by a connected service. This makes it useful for a system that needs controlled access to task data.

However, **MCP is an interface protocol, not an automatic authorization system**. An MCP tool can be read-only, or it can expose a privileged operation; the surrounding architecture must decide which is appropriate. Authentication, task-level authorization, input validation and auditing still belong in the trusted application and integration layers.

In my current experimental workflow, the relevant progress has been on the *read-only* side: retrieving a task, comparing it with its expected project and board, and preparing a decision preview. That is valuable engineering progress, but it does not establish permission to approve or reject real tasks automatically.

## A developing portal: verified versus proposed

The latest dated technical checkpoint I used for this article records an **isolated preview environment**, role-oriented UI tests, and an operational command-line read-only preflight. That checkpoint is a record of previous VM observations—not a live production audit.

| Capability | Evidence-aware status |
|---|---|
| Isolated management preview and role-specific decision-preview buttons | Demonstrated in a test environment |
| Read-only task and board retrieval | Checked in a dated read-only sweep |
| Command-line preflight for task identity and expected state, with a local audit record | Demonstrated in testing |
| Wiring that preflight into the portal's decision endpoint | Not yet established in the checkpoint |
| Independent CEO identity, production-grade authorization and stronger session controls | Still required |
| Durable task-global idempotency, restricted write service and post-write reconciliation | Not established |
| General production approval/rejection by conversational command | **Not enabled or claimed** |

The distinction matters. A successful read or preview means the system can *prepare a decision*. It does not mean a chatbot is already allowed to make decisions in the company's system of record.

## Three engineering lessons from the process

### 1. Read-only access is a meaningful first milestone

It's tempting to demo the most impressive action first. I prefer starting with questions the system can answer safely: Does this task exist? Is it in the expected board? Is it actually marked complete? Does the retrieved state match what the reviewer expects?

This is also where *data provenance* becomes important. A summary based on an old snapshot should not look identical to a freshly checked task state. The application needs to expose where the information came from and when it was checked.

Read-only access is not risk-free—it still needs authentication, data scoping and privacy controls—but it limits the impact of mistakes while the system is being developed.

### 2. Validation must be outside the language model

The assistant can help fill a structured proposal, but deterministic checks should decide whether it is admissible. Examples include verifying task identifiers, roles, expected workflow status, request shape and approval scope.

For a write-capable system, a safe proposal might contain a task reference, requested decision, reason if required and an expected version. The server—not the model—must check those fields against trusted current data.

A preview or a conversational “yes” is not enough unless it is bound to an authenticated decision maker, an exact operation and a fresh state.

### 3. “Try again” is not a reliable transaction strategy

Network timeouts introduce a subtle problem: after a request fails to return, did the underlying task change happen or not?

A future write gateway needs a durable idempotency policy tied to the actual task and decision, explicit handling for **unknown outcomes**, and independent reconciliation against the system of record. Otherwise a model or UI retry could submit an unintended duplicate operation.

The current checkpoint demonstrates some request-ID repeat protection in an isolated preflight, but it does **not** demonstrate robust task-global idempotency across different request IDs. That is an open requirement, not a solved feature.

## A conceptual trust boundary

For a synthetic example, the intended architecture can be written as:

```text
Person → Natural-language request
        ↓
Assistant → Structured proposal (untrusted)
        ↓
Authenticated API → Input + scope checks
        ↓
Read-only task retrieval → State verification
        ↓
Human-visible preview → Explicit human approval
        ↓
Future restricted writer → Receipt + reconciliation
```

The **restricted writer** at the end is deliberately a future component in this example. It should not be inferred from the existence of the upstream stages.

The approach also creates clearer test boundaries: malformed requests must fail; a reviewer must not see unauthorized tasks; stale decisions must not proceed; duplicate or unknown outcomes must be reconciled rather than assumed successful.

## What comes next

The immediate engineering task is to connect the demonstrated read-only preflight to the isolated portal preview through a narrow, carefully reviewed gateway, without introducing general write authority. Beyond that are independent authentication, authorization and session safeguards, task-level idempotency, a narrowly scoped writer and reliable audit/reconciliation.

I consider the larger lesson more important than any individual library: **a useful AI system is built as much from permission boundaries, evidence and failure handling as from natural-language capability**.

Connecting a model to tools is a starting point. Building software people can trust to use those tools is the engineering challenge.

## Related

- [Projects](/projects)
- [Research](/research)
- [Open-source ChatHandoffKit](https://github.com/ahmadrastibarzoki/ChatHandoffKit)
