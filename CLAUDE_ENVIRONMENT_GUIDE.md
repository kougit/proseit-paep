# Using the IB0-WP01 Pack in Claude Environments

## Claude Code — recommended

(i) Extract the pack into the directory that will become the PAEP repository root.

(ii) Open a terminal in that directory and start Claude Code.

(iii) Use the short starter instruction in `work-packages/IB0-WP01/prompts/00_QUICK_START.txt`, or ask Claude to execute `01_EXECUTE.md`.

(iv) Keep the root `CLAUDE.md` in place. It is the repository execution contract for the current work package.

(v) After the implementation session reports technical PASS, start a fresh session where practical and use `02_INDEPENDENT_QA.md`.

## Claude Code on the web / repository-connected environment

(i) Put the unpacked files in the repository before starting the task so the controlled prompt and `CLAUDE.md` are available to the agent.

(ii) Direct the agent to `work-packages/IB0-WP01/prompts/01_EXECUTE.md` rather than pasting the entire controlled corpus into chat.

(iii) Ensure the environment permits Node/npm commands and writing evidence files.

## Claude Agent SDK

If you invoke Claude programmatically, configure the agent to load project settings/instructions so the repository `CLAUDE.md` is included. Keep filesystem/project instructions version-controlled and exclude local user settings for deterministic CI-style execution.

## Claude.ai chat without a coding environment

The pack may be uploaded for review, planning or QA discussion, but IB0-WP01 requires an environment that can create files and run Node/npm commands. Do not treat a chat-only narrative review as technical PASS.
