---
title: "ChatHandoffKit: Portable Project Memory for Long-Running AI Conversations"
description: "Why I built ChatHandoffKit, an open-source Python CLI for durable AI project memory, manual checkpoints, Git versioning, and experimental Google Drive storage."
summary: "A long AI conversation should not be the only place where a project's decisions, constraints and next steps live. ChatHandoffKit keeps reviewed project memory in portable Markdown files, with explicit checkpoints and optional Git or experimental Google Drive storage."
category: "Open Source Engineering"
datePublished: 2026-10-10
dateModified: 2026-10-10
keywords:
  - "ChatHandoffKit"
  - "persistent project memory"
  - "AI conversations"
  - "Python CLI"
  - "Git version control"
  - "Google Drive API"
  - "AI workflow"
  - "open source"
image: "/images/hero-presenting.png"
imageAlt: "Ahmad Rasti Barzoki presenting on stage, the creator of ChatHandoffKit"
draft: false
sources:
  - title: "ChatHandoffKit — source code, README and tests"
    url: "https://github.com/ahmadrastibarzoki/ChatHandoffKit"
  - title: "ChatHandoffKit — experimental Google Drive setup"
    url: "https://github.com/ahmadrastibarzoki/ChatHandoffKit/blob/main/docs/google-drive-setup.md"
  - title: "Google Drive API — OAuth scopes"
    url: "https://developers.google.com/workspace/drive/api/guides/api-specific-auth"
---

## The problem wasn't the AI model. It was losing project context.

When I work on a project with an AI assistant over several days or weeks, the conversation becomes a record of architecture choices, solved problems, failed approaches, constraints and next actions. Eventually, the conversation grows long enough that continuing in a fresh chat becomes difficult.

A new assistant session might understand the overall objective but miss why an implementation was rejected, which bug has already been fixed, or what still needs verification. Repeating that history is inefficient. Reconstructing it incorrectly can be worse.

I wanted a practical answer to a narrow question: **How can a project keep an explicit, reviewable memory outside any one AI conversation?**

The first version of my solution wasn't a software package. It was a workflow I used across multiple long-running projects: structured Markdown files stored in a private GitHub repository, with decisions and checkpoints recorded and committed. That workflow became the starting point for [ChatHandoffKit](https://github.com/ahmadrastibarzoki/ChatHandoffKit), an independent open-source Python CLI.

## A portable memory layer, not automatic chat memory

ChatHandoffKit does not connect to an arbitrary ChatGPT conversation and retrieve everything that has ever been said. Instead, a person—or an assistant that has access to the relevant conversation—prepares and **reviews** a checkpoint before writing it.

The memory lives in ordinary Markdown files. A project includes:

```text
projects/my-project/
├── START_HERE.md
├── PROJECT_CONTEXT.md
├── CURRENT_STATE.md
├── DECISIONS.md
├── PROMPTS.md
├── ERRORS_AND_SOLUTIONS.md
└── SESSION_LOG.md
```

Each file has a distinct responsibility. `CURRENT_STATE.md` describes where the project stands now. `DECISIONS.md` preserves the reasons behind important choices. `SESSION_LOG.md` records successive checkpoints. The other files explain the project, its reusable instructions, and known problems.

This separation matters: **the current answer to “what should we do next?” is not the same thing as the history of how we arrived there.**

## The workflow: initialize, checkpoint, resume

The local-first CLI provides three foundational actions:

1. **Initialize:** create a portable memory workspace and project templates.
2. **Checkpoint:** explicitly update the current state and append a dated history entry after human review.
3. **Resume:** load a bounded set of documents and provide useful context to the next conversation.

A simplified example, using fictional task-management software, looks like this:

```bash
chathandoff init --root my-memory --git
chathandoff create task-manager --title "Task Manager" \
  --objective "Build a fictional task-management app" --root my-memory

chathandoff checkpoint task-manager --root my-memory \
  --state "Initial architecture reviewed" \
  --next "Implement the first task API" \
  --decision "Use SQLite for the local demo"

chathandoff resume task-manager --root my-memory
```

The real tool also includes `status`, `validate`, optional Git commits and an explicit `sync` command. It does not publish changes merely because a checkpoint was created.

A small but important design decision is that checkpoints edit a marked section of `CURRENT_STATE.md` while leaving unrelated manual notes in place. The session log and decisions remain part of the historical record.

## Why use Git?

Git gives the Markdown memory a useful set of existing engineering properties: readable diffs, commit history, reviewable changes and rollback through normal version-control workflows.

ChatHandoffKit can initialize a local Git repository and, with an explicitly configured remote, push reviewed changes. It stages its managed files instead of blindly including unrelated content. Its Git synchronization rejects divergent remote history rather than force-pushing over another contributor's work.

**GitHub support in the first releases means Git transport—not a dedicated GitHub REST API adapter.** Users still configure their own remote and authentication.

Version control is especially useful for *decisions*: if a project changes direction later, the reasoning can remain visible instead of disappearing under a rewritten summary.

## Version 0.2: experimental Google Drive support

The next question was whether the storage layer could work for people who don't want to use Git. In **v0.2.0**, I added an optional Google Drive adapter for plain Markdown documents.

The adapter implements a desktop OAuth flow using the limited `drive.file` scope. It can create an application-owned folder, upload reviewed files, and pull them into a local workspace. The user triggers transfers explicitly. A local record of SHA-256 hashes helps detect changes made on either side before overwriting a file.

It deliberately does **not** delete remote documents automatically, merge conflicting edits, or continuously synchronize GitHub and Google Drive.

There is an important verification boundary: the adapter's mocked/offline API tests and the project's CI have passed, **but a complete OAuth and transfer cycle against a real Google account had not been acceptance-tested at the time of writing**. I consider the Drive integration experimental until that check is complete.

The goal is to make Markdown the portable source format whether the storage destination is Git or Google Drive—not to claim that both providers are already interchangeable in every environment.

## What the public release actually proves

The public repository contains the CLI implementation, documentation, security notes, reproducible synthetic examples and automated tests. The v0.2 GitHub Actions workflow completed successfully across Python 3.10, 3.11, 3.12 and 3.13.

That establishes a working, tested baseline for local project-memory operations and for the simulated Drive scenarios covered by the test suite. It does **not** prove enterprise readiness, all possible concurrency conditions, or production OAuth compatibility.

Two limitations are worth being explicit about:

- **Memory quality still depends on review.** The software cannot verify whether a claim about a project is factually correct or recover inaccessible messages.
- **Privacy requires deliberate boundaries.** The built-in secret detection is basic; a private GitHub repository is not a secrets vault. The public demo uses synthetic project material, not my private project history.

Even a correct checkpoint is not a fully atomic multi-file transaction. Concurrent editors must reconcile conflicts rather than expecting perfect automatic merging.

## Why I chose to open-source it

The value is not a proprietary memory engine. It is a small, inspectable workflow that others can understand, adapt and improve. A person can read the Markdown directly, move it to another storage system, or use it as context for a different assistant.

For me, ChatHandoffKit is also an engineering exercise in building a tool around real constraints: explicit state, version history, bounded scope, conflict checks and reproducible testing.

The immediate roadmap includes real-account Google Drive acceptance testing, stronger conflict handling, a more formal storage-provider interface and improved safety checks. Optional integrations, including MCP, can be considered later; they are not current features.

If you work on projects that span many AI conversations, I would be interested in how you preserve the decisions that matter.

## Explore the project

- [ChatHandoffKit — public source, setup guide and tests](https://github.com/ahmadrastibarzoki/ChatHandoffKit)
- [Google Drive setup and limitations](https://github.com/ahmadrastibarzoki/ChatHandoffKit/blob/main/docs/google-drive-setup.md)
- [Other public projects](/projects)
