# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Working guidelines

Behavioral guidelines to reduce common LLM coding mistakes. Merge with the project-specific instructions below as
needed.

**Tradeoff:** These guidelines bias toward caution over speed. For trivial tasks, use judgment.

### 1. Think Before Coding

**Don't assume. Don't hide confusion. Surface tradeoffs.**

Before implementing:

- State your assumptions explicitly. If uncertain, ask.
- If multiple interpretations exist, present them - don't pick silently.
- If a simpler approach exists, say so. Push back when warranted.
- If something is unclear, stop. Name what's confusing. Ask.

### 2. Simplicity First

**Minimum code that solves the problem. Nothing speculative.**

- No features beyond what was asked.
- No abstractions for single-use code.
- No "flexibility" or "configurability" that wasn't requested.
- No error handling for impossible scenarios.
- If you write 200 lines and it could be 50, rewrite it.

Ask yourself: "Would a senior engineer say this is overcomplicated?" If yes, simplify.

### 3. Surgical Changes

**Touch only what you must. Clean up only your own mess.**

When editing existing code:

- Don't "improve" adjacent code, comments, or formatting.
- Don't refactor things that aren't broken.
- Match existing style, even if you'd do it differently.
- If you notice unrelated dead code, mention it - don't delete it.

When your changes create orphans:

- Remove imports/variables/functions that YOUR changes made unused.
- Don't remove pre-existing dead code unless asked.

The test: Every changed line should trace directly to the user's request.

### 4. Goal-Driven Execution

**Define success criteria. Loop until verified.**

Transform tasks into verifiable goals:

- "Add validation" → "Write tests for invalid inputs, then make them pass"
- "Fix the bug" → "Write a test that reproduces it, then make it pass"
- "Refactor X" → "Ensure tests pass before and after"

For multi-step tasks, state a brief plan:

```
1. [Step] → verify: [check]
2. [Step] → verify: [check]
3. [Step] → verify: [check]
```

Strong success criteria let you loop independently. Weak criteria ("make it work") require constant clarification.

**These guidelines are working if:** fewer unnecessary changes in diffs, fewer rewrites due to overcomplication, and
clarifying questions come before implementation rather than after mistakes.

## What this is

A **Strategie-Cockpit** for the eduxept platform: a browser client that reads and edits a four-level strategy
hierarchy (Vision → Mission → Focus → Action) stored in an external REST backend (`eduxept-api-v1`). This repo contains
**only the frontend client plus Python dev/deploy tooling** — the API is a separate service. There is no local database;
every data operation is an HTTP call to the configured API.

## Commands (Windows / PowerShell; `.bat` launchers at repo root)

- `run_install_python_modules.bat` — `pip install -r core/requirements.txt` (run once).
- `win_webserver.bat` — start the live-reload web server on port 8002, opens `wrapper.html`. Under the hood:
  `python core/webserver/webserver.py --open wrapper.html --port 8002`. Pass-through args: `--port`, `--host`, `--open`,
  `--no-open`.
- `run_upload_app.bat` — deploy the `app/` files to the eduxept file API (`core/upload/upload.py`).
- `core/openapi/update_openapi.bat` — re-download `openapi.json` from the live API.

There is no build step, no linter, and no test suite. Changes to `app/*.{html,js,css}` are picked up instantly by the
web server's live-reload (watchdog + SSE).

## Frontend architecture (`app/`)

**Two-tier, iframe-based.** `wrapper.html`/`wrapper.js` is the connection screen: it resolves the API base URL, bearer
token, and theme, loads the project list, lets the user pick a project, then embeds `app.html` in an `<iframe>`,
forwarding `baseUrl`, `token`, `projectPk`, and `theme` as **URL query parameters**. `app.html` reads those params on
load; if no token is present it redirects back to `wrapper.html`.

**`app.html` is a strict MVC split** (all ES modules, no bundler).

The **Model-View-Controller (MVC)** pattern separates an application into three interconnected
components so each can be reasoned about, changed, and tested in isolation. See [MVC.md](MVC.md) for a more detailed
description.

- **Model** — the application's data and business logic. Manages state, answers queries, and performs updates. Knows
  nothing about the UI.
- **View** — the user interface. Renders data from the Model and forwards user commands (button clicks, form submits)
  onward. Holds no business logic.
- **Controller** — the intermediary. Receives user input from the View, drives the Model to read/modify data, and
  selects which View to render.

Flow: user interacts with the **View** → the **Controller** handles the input and calls the **Model** → the **Model**
updates its state → the **Controller** re-renders the appropriate **View** with the new data. The payoff is separation
of concerns, scalability (many Views over one Model), reusability of Models/Controllers, and testability (each component
in isolation).

How this repo maps onto that pattern:

- `controller.js` (**Controller**) — the only script `app.html` loads. Owns all Preact state (`useState`), wires user
  actions to the Model, selects the active View, and calls `render()`. Views: `tree`, `tiles`, `split`, `mosaic`,
  `graph`, `table`.
- `model.js` (**Model**) — pure data + API. No Preact, no DOM. Holds the level configuration, CRUD payload builders, the
  n:m link index, and delete planning. Exports live bindings (`linkIndex`, `allEntities`, `parentCandidates`) that are
  rebuilt on each project load via `buildLinkIndex()`.
- `view.js` (**View**) — Preact presentational components. Reads Model helpers, receives action callbacks as props,
  delegates mutations back to the Model.

**No build step by design.** Preact, `preact/hooks`, and `htm` are loaded from `esm.sh` via an
`<script type="importmap">` (pinned versions, single Preact instance). Tailwind v4 comes from the Play CDN; the eduxept
color/spacing tokens live in an inline `<style type="text/tailwindcss">` `@theme` block **duplicated in
both `app.html` and `wrapper.html`** — keep them in sync. Dark mode is a class on `<html>` set from the `?theme=`
param before first paint to avoid a flash.

## Domain model & the n:m link index (the non-obvious part)

The hierarchy is **not a tree** — it's four entity tables (`visions`, `missions`, `focuses`, `actions`) joined by *
*junction tables** (`mis-2-vis`, `foc-2-mis`, `act-2-foc`), so the same entity can have multiple parents (shared nodes).
`model.js` centralizes this in lookup maps: `ENT`, `CHILD`, `JUNC`, `PARENTFK`, `SELFFK`, `JUNC_ARR`, `JUNC_CHILD_ARR`,
`PARENT_LEVEL`. When adding/changing a level, update these maps together — the rest of the code is driven by them.

`buildLinkIndex()` walks the nested `/strategies-views/read` response and builds
`linkIndex[level][pk] → [{junctionPk, parentLevel, parentPk, parentObj}]`. Because nodes are shared, **delete is
shared-aware**: `collectDescendant`/`collectSelfDelete` only delete an entity when it has a single parent link;
otherwise they remove just the junction row. Always go through these planners rather than deleting entities directly.

## API access

All calls go through `api(path, body, method)` in `model.js` (and a mirror in `wrapper.js`). Reads are `POST .../read`
with a SQL-ish `{where: '...'}` filter; writes are `create`/`update` (PUT)/`delete` (DELETE) under
`/strategies-tables/{entity}/`. The full hierarchy is fetched from `/strategies-views/read`. `core/openapi/openapi.json`
is the checked-in contract for these endpoints.

**If you hit problems with entity attributes** (missing/renamed/unexpected fields, payload validation errors), sync the
data models against the live spec at <https://eduxept-api-v1.xemax.ch/openapi.json> — the checked-in
`core/openapi/openapi.json` may be stale. Refresh it with `core/openapi/update_openapi.bat` and reconcile `model.js`
against the updated schema.

**Known backend quirks the code deliberately works around** (preserve these unless the API is fixed):

- State/enum fields (`implementation_state`, `validity_state`, `priority_state`, `traffic_light`) are intentionally
  **not** sent on create (server enum-view bug).
- Entity field `update` used to return HTTP 400 (server bug); verified fixed on 2026-07-02 (no-op PUTs return 200 for
  all four entities). `updateEntity` still catches field-update errors and reports them without failing the whole
  operation (link changes are applied independently).
- TLS certificate verification is **disabled everywhere** (`verify=False` in httpx, `_create_unverified_context()` in
  urllib scripts) because the API uses an internal/self-signed cert.

## Configuration (`core/config.py`)

Pydantic-settings `Config` exposes `api_base_url` and `auth_token`, loaded from a `.env` file **one directory above the
repo root** (`parents[2]`) — the token is kept out of the repo. The web server injects these into `wrapper.html` via
query params so no token is hardcoded in the source. `get_computer_id()` reads the Windows `MachineGuid`; if the current
machine is in `COMPUTER_IDS_DEV`, `strategy_cockpit_dev.env` is loaded instead of `strategy_cockpit.env`.

## Python tooling (`core/`)

- `webserver/webserver.py` — stdlib `http.server` + watchdog. Serves `app/` as web root; injects an SSE live-reload
  snippet into every HTML response; sends no-cache headers on everything; routes `/static/*` to
  `core/webserver/static/`; and 302-redirects the wrapper entry page to attach the `baseUrl`/`token` connection params.
- `upload/upload.py` — multipart upload of the `app/` files to `/files/upload` via httpx.
- `openapi/update_openapi.py` — refresh the local OpenAPI spec.
- `toolbox/render_jinja.py` — standalone Jinja2 render helper (not wired into the app).

Every Python entry point appends the repo root (`parents[2]`) to `sys.path` so `from core.config import config` works
when run directly from a `.bat`.

## Language note

The UI, comments, and user-facing strings are in **German** (Vision/Mission/Fokus/Aktion). Entity display labels are
overridable per project and persisted in `localStorage` under `eduxept_cockpit_labels`.
