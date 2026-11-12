# Project instructions — TAK25 AI Backlog

## 1. Project context
Node.js >=22 ES modules, no external runtime packages. server.js owns HTTP routes and JSON persistence; ai.js owns Groq transport and response schemas; public/domain.js owns criteria/readiness rules; public/app.js and public/index.html own the UI. test/ contains offline AI transport, domain and isolated server integration tests. Critical invariants: AI proposals need explicit confirmation, apply only to the selected story, preserve undo/history, and never expose the API key.

## 2. Actual commands
- Start: npm start (default localhost:3000). Development: npm run dev.
- Full offline suite: npm test. Requires permission to bind a temporary loopback server; it must pass before completion.
- Syntax: run node --check for ai.js, server.js and every JavaScript file in public/, scripts/ and test/.
- No lint, typecheck, formatter or build scripts exist. Do not invent successful results for them. This plain-JavaScript app runs without a build step.
- Live API checks are separate, optional operations using scripts/live-check.js and an isolated DATA_DIR; obtain approval for the exact data sent and account usage first. They are not part of npm test.

## 3. Style and architecture
Follow existing ES module imports, naming and formatting near the change. Keep domain rules out of DOM handlers. Reuse existing helpers. Do not rename routes, persisted fields or proposal types as incidental cleanup. Keep mockups as validated structured components, not executable model-generated HTML.

## 4. Testing and regressions
For a bug fix, add a regression test that fails before the fix and passes after it. Cover new behavior at its relevant boundary. Preserve existing meaningful tests; do not weaken assertions to make failures disappear. Always run the complete suite after code changes. Use disposable DATA_DIR values; do not overwrite student/client projects. Tests do not prove Estonian quality or live-model reliability.

## 5. Branch and review workflow
The upstream default branch is master (not main). Develop on a focused feature branch; never commit directly to master/main. Use small truthful commits and a pull request for review. Check diff and test results before merge. Do not rewrite published history. These instructions guide behavior; only configured protections and required checks can enforce it. Do not claim protections exist without verifying them.

## 6. Scope
Change only files needed for the task. Before touching more than five application files, explain why. Preserve unrelated work and accepted assignment materials. Ask before deleting project data, changing persistence formats or making breaking API/architecture changes. Do not combine unrelated refactors with a fix.

## 7. Security and data
Never commit .env, keys, credentials, data/projects.json or sensitive test output. Do not print secret values. Validate server input and AI output. Keep secrets server-side. Do not disable validation or authentication to satisfy a test. This local prototype lacks production authentication: do not expose it as a public multi-user service. Use synthetic data in demos.

## 8. Dependencies
Prefer Node built-ins and existing code. Explain necessity, maintenance and security implications and obtain approval before adding production dependencies. Do not introduce packages simply to add a quality-check badge. Review lockfile changes when packages are genuinely needed.

## 9. Completion checklist
Review changed files and diff; run npm test and syntax checks; confirm no unrelated files, secrets or real project data are included; state exact results and limitations. Report commands not run and why. Distinguish locally prepared, tested, published, submitted and accepted. Do not fabricate reflection, live API results, recordings, collaboration or student defense.

## 10. Uncertainty and failures
Read the relevant code and tests first. Clarify ambiguous requirements before changing contracts or scope. On a failed check, find the cause or report the blocker; do not claim success. Record useful failure lessons in AI_QUALITY_PLAN.md with test references and dates, never credentials. Ask before new publishing destinations or access changes.
