# eduxept · Strategy App

Related documentation:

- [CLAUDE.md](CLAUDE.md) — project-specific instructions for AI coding agents and developers who work on the source
  code.
- [TECHNOLOGY_DESCRIPTION.md](TECHNOLOGY_DESCRIPTION.md) — a non-technical explanation of the main technologies used in
  this project.
- [MVC.md](MVC.md) — a short explanation of the Model-View-Controller pattern used to structure the application.

> **Tip:** Rendered HTML versions of this and other documentation files are available in the **`docs/`** folder.
> Open them in any web browser for easier reading.

## Installation

> **Windows vs. Mac / Linux:** The `win_*.bat` files in the project root are Windows shortcuts — double-click them in
> Explorer to run the corresponding script. On **Mac or Linux**, open a terminal in the project folder and run the
> Python command shown in each section directly (e.g. `python core/webserver/webserver.py …`). All other steps are
> identical on both platforms.

Follow these steps once before using the app. No prior technical knowledge is required.

### Step 1 — Install Python

Python is the program that runs the app's tools on your computer.

1. Open this link in your web browser:
   https://apps.microsoft.com/detail/9pnrbtzxmb4z?hl=en-US&gl=CH&ocid=pdpshare
2. The Microsoft Store opens on the Python page. Click the blue **Download** (or **View in Store**) button.
3. Wait until the download finishes and the button changes to **Open**. Python is now installed — you can close the
   Microsoft Store.

### Step 2 — Install the required Python modules

The app needs a few add-on packages ("modules"). A ready-made script installs them all for you.

1. Open the project folder in the Windows Explorer (the folder that contains this README file).
2. Double-click the file **`win_install_python_modules.bat`**.
3. A black window opens and text scrolls by while the modules are downloaded and installed. This can take a minute.
4. When you see the message **`Press any key to continue . . .`**, the installation is complete. Press any key to close
   the window.

> **Note:** If Windows shows a security warning ("Windows protected your PC"), click **More info → Run anyway**. The
> script only installs the packages listed in `core/requirements.txt`.

You only need to do this once. After that, you can start the app with `win_webserver.bat`.

### Step 3 — Create the environment file

The app needs a few private settings before it can connect to the API: the server address, the access role, and
secret keys or tokens. These values are loaded by `core/config.py` from an environment file. The default file name on
Windows and Mac is **`xeduorg_ui_template.env`**.

Do **not** write credentials directly into source files such as `.py`, `.js`, or `.html` files. Source files are often
shared, copied, uploaded, committed to Git, or sent to code agents. If a token is hard-coded there, it can leak by
accident and is harder to replace later. Keeping credentials in a separate environment file means the code can stay the
same while every computer uses its own private settings.

On Windows and Mac, place the environment file **one folder above** the project folder, at the same level as the project
folder:

```text
Parent folder
|-- xeduorg_ui_template.env
`-- xeduorg-ui-template/
    |-- README.md
    `-- core/
        `-- config.py
```

Create `xeduorg_ui_template.env` with this structure:

```env
API_BASE_URL=https://abc.xemax.ch
ROLE=role
AUTH_TOKEN=token
DEEPL_AUTH_KEY=key
```

Allowed `ROLE` values are `read`, `write`, `project`, `admin`, and `dev`. Use the role value you received for your
access.

`DEEPL_AUTH_KEY` is optional. It is only needed for the automatic translation sync with DeepL; if you do not use that
tool, you can leave the value empty or remove the line.

Replace `api`, `role`, `token` and `key` with the real values you received. Save the file, then start the app with
`win_webserver.bat`.

### Step 4 (optional) — Install a code editor (IDE)

You can run and use the app with just the steps above. But if you plan to **look at or change the app's files**,
a proper code editor — an **IDE** (Integrated Development Environment) — makes this much easier and safer than a plain
text editor like Notepad.

Two recommended, free options:

- **Visual Studio Code** — https://code.visualstudio.com
- **PyCharm** — https://www.jetbrains.com/de-de/pycharm

To install, open one of the links, download the installer, and follow the on-screen steps. Then open the project folder
(the folder containing this README) from within the editor.

**Why an IDE is recommended:**

- **Syntax highlighting** — code is shown in colors, so it's much easier to read and to spot where something is wrong.
- **Error checking** — the editor warns you about typos and mistakes *before* you run anything.
- **Search across all files** — quickly find where something is defined or used throughout the whole project.
- **Correct file handling** — files are saved in the right format and encoding, avoiding subtle problems that a simple
  editor can introduce.
- **Built-in terminal** — you can run the project's scripts directly inside the editor instead of switching windows.

## Development Workflow

You can download the template from https://github.com/xemax-ag/xeduorg-ui-template.

This chapter explains the everyday routine: starting the app on your own computer, making changes, and publishing a
finished version. No prior technical knowledge is required.

### Start the local web server

1. In the project folder, double-click **`win_webserver.bat`**.
2. A black window opens and stays open — leave it running. This is the small web server that serves the wrapper.
3. Your web browser opens automatically at the wrapper start page (`wrapper.html`). If it doesn't, open your browser
   and go to **http://127.0.0.1:8002/wrapper.html**.
4. When you're finished, close the black window to stop the server.

> **Port:** The local server uses port `8002` by default. If that port is already used on your computer, change the
> `--port 8002` value in `win_webserver.bat` on Windows, or in `mac_webserver.sh` / `linux_webserver.sh` on Mac or
> Linux. Use the same port in the browser address, for example `http://127.0.0.1:5500/wrapper.html`.

Everything runs on **your own computer** here — nothing is published to the live platform. This is a safe place to try
things out.

### Automatic reloading

While the server window stays open, it watches the app's files for changes. Whenever a file is edited and saved, the
page in your browser **reloads by itself** — you don't need to press reload. So you can edit a file, switch to the
browser, and immediately see the result.

### Browser caching (when you see an old version)

To load pages faster, browsers sometimes keep an old copy of a file in memory (the "cache"). During development this can
be confusing: you change something, but the browser still shows the **previous** version.

- The web server is set up to tell the browser **not** to cache anything, so this usually doesn't happen.
- If you still see an outdated page, force a fresh load with **Ctrl + F5** (hold Ctrl and press F5). This tells the
  browser to ignore its cache and download everything again.
- If it still looks wrong, close the browser tab completely and open the address again.

### Using code agents (Claude, Codex, local models)

A **code agent** is an AI assistant that can read and change the app's files for you. Instead of editing files by
hand, you describe in plain language what you want ("add a new button", "fix the error on the project screen"), and the
agent proposes or makes the changes. It runs in a terminal, inside your code editor (IDE), or as a desktop app, and
works directly on the files in the project folder.

Common options:

- **Claude Desktop** — Anthropic's desktop chat app (not a terminal). On its own it can't touch your files; you give it
  access by installing the **Filesystem** *Desktop Extension* once via **Settings → Extensions**, then pointing it at
  the project folder using the folder's **full path** (e.g. `...\xeduorg-ui-template`). Restart the app afterwards.
  From then on you can ask it, in the chat, to read and change the app's files.
- **Claude Code** — Anthropic's command-line agent. Start it from a terminal opened in the project folder by running
  `claude`. It reads the file **`CLAUDE.md`** in this project, which gives it the project-specific rules and background,
  so its changes fit how the app is built.
- **OpenAI Codex** — OpenAI's command-line agent (`codex`). It works the same way: open a terminal in the project
  folder and describe your task.
- **Local model providers** — tools such as **Ollama** or **LM Studio** run an AI model **on your own computer**
  instead of in the cloud. Nothing leaves your machine, which is useful when you don't want project files sent to an
  external service. They are usually slower and less capable than the cloud agents above, but they keep everything
  local.

**Model quality, costs, and code quality — how they connect:**

Every agent is powered by an AI **model** — the "brain" that does the actual work. Models come in different quality
tiers, and the providers charge accordingly: the most capable models cost noticeably more per task (or require a larger
subscription), while smaller models — and the local ones above — are cheap or free. That price difference is not just
marketing; it shows up directly in the source code the agent writes:

- **A stronger model writes better code.** It understands how the app is built, follows the project rules (in
  `CLAUDE.md`), makes fewer mistakes, and its changes usually work on the first or second try.
- **A weaker model produces code that often *looks* fine but isn't.** It is more likely to contain subtle errors,
  ignore the project's conventions, or quietly break something elsewhere. You pay the difference in your own time:
  testing, correcting, and asking again.
- **Code quality accumulates.** The project's files are the foundation that every future change builds on. Sloppy
  changes make each later change slower and riskier (developers call this "technical debt") — and cleaning it up later
  usually costs more than the money saved on the cheaper model.

Besides the model itself, many agents also offer a **"reasoning effort"** setting (sometimes called "thinking"). It
controls how much time the model spends thinking a problem through — checking its own plan, considering side effects —
**before** it writes any code. Higher effort makes each task slower and somewhat more expensive, but the model catches
its own mistakes instead of leaving them for you to find. The same logic as with model quality applies: for real
changes to the app, the extra thinking time is usually cheaper than the debugging it prevents; for quick questions,
a low setting is fine.

A simple rule of thumb: for changes that will be **kept and published**, use the best model available to you — with a
generous reasoning-effort setting. Cheaper or local models and low effort are fine for questions, experiments, and
throwaway drafts.

Practical advice when working with any agent:

- **Keep the web server running** (`win_webserver.bat`) while you work. Because the page reloads by itself, you see the
  agent's changes in the browser right away and can judge whether they are correct.
- **Review before you publish.** An agent can make mistakes. Always check the result in the local web server before you
  run `win_upload_app.bat` to put a version live.
- **Describe one change at a time.** Small, clear requests give better results than one large, vague instruction.

### Settings: server address and access token

The app needs to know **which server to talk to** (the address) and **an access token** (a kind of password that
proves you're allowed in). These two settings are **not** stored inside the program's code. They live in a separate
settings file named **`xeduorg_ui_template.env`**, located **one folder above** the project folder on Windows and Mac.
This keeps the secret token out of the project itself.

You normally don't touch this file by hand — it is prepared once. What's useful to understand:

- When you start the web server, it reads these settings and **passes them automatically to the wrapper** by attaching
  them to the web address (as so-called URL parameters). The wrapper then forwards them to the app. That's why you
  don't have to type an address or token into the wrapper yourself.
- Developer computers can use a second file, `xeduorg_ui_template_dev.env`, so that testing points at a different (
  development) server than the live one. The program picks the right file automatically based on which computer it runs
  on.

If the app reports that it can't connect or has no token, the `xeduorg_ui_template.env` file is usually the place to
check.

### Publish a version to the hosting platform

When your changes are ready and tested locally, you can upload them to the live platform so others can use them.

1. Make sure your changes look correct in the local web server first.
2. In the project folder, double-click **`win_upload_app.bat`**.
3. A black window opens and lists each file as it is uploaded. Lines marked **`[OK]`** were sent successfully; *
   *`[FAIL]`** means a file could not be uploaded.
4. When it finishes, press any key to close the window.

After a successful upload, the new version is live on the hosting platform.

## API

The app itself stores no data. Everything you see lives on a separate
server and is fetched and saved over the network. This chapter explains how that works and why the file `openapi.json`
matters.

### What a REST API is

An **API** (Application Programming Interface) is a set of web addresses that a program can call to read or change data,
much like a web browser calls a web address to load a page. The eduxept backend offers a **REST API**: a common style
of API built on the same building blocks as the web.

The key ideas:

- Every piece of data has its own **address** (URL), for example the list of all projects.
- The app sends a **request** to such an address and gets a **response** back, usually as **JSON** — a plain-text
  format that both computers and humans can read.
- The type of request states the intent, following standard web verbs: **read** existing data (POST `.../read`),
  **create** new data, **update** an existing entry, or **delete** one.
- Each request carries the **access token** described above, so the server knows the caller is allowed in.

In short: when you open a project or edit an action in the app, the browser is quietly sending REST requests to the
backend and showing you the answers.

### Why `openapi.json` matters

An API is only useful if you know exactly which addresses exist, what data they expect, and what they return. That
description is written down in a single file called **`openapi.json`** (an **OpenAPI specification**). Think of it as the
API's complete, machine-readable instruction manual.

The file lives at `app/openapi.json` and serves as the **checked-in contract** for the backend: it documents
every endpoint the app relies on. Keeping a local copy means you can look up how an endpoint behaves without
guessing, and it makes changes on the server visible when the file is refreshed.

### Download the OpenAPI specification (`win_update_openapi.bat`)

The backend publishes its current `openapi.json` at its own address. To refresh the local copy so it matches the live
server, use the ready-made script:

1. In the project folder, double-click **`win_update_openapi.bat`**.
   *(Mac / Linux: open a terminal and run `python core/openapi/build_openapi_models_js.py` and
   `python core/openapi/build_openapi_models_python.py` separately.)*
2. A black window opens. It downloads the specification from the server (using the address from your settings file), checks
   that the file is valid, and then replaces the local `openapi.json` with the fresh version. You'll see a `Downloading ...`
   line followed by a `Saved ...` confirmation with the file size.
3. When you see **`Press any key to continue . . .`**, the update is complete. Press any key to close the window.

Run this whenever the backend has changed and you want the local contract to reflect the latest state of the API.

### Convert `openapi.json` to model classes

Once `openapi.json` is up to date, two scripts re-generate the model classes the rest of the code depends on:

- **`app/openapi.js`** — a single ES module imported by the browser front-end. It contains one JavaScript class per
  API model, with field names, types, and enum values taken directly from
  the spec. The front-end constructs and validates API payloads using these classes instead of maintaining the field
  list by hand.
- **`core/openapi/openapi.py`** — equivalent Pydantic model classes for the Python tooling in `core/`. It gives
  scripts type-safe access to API data and lets your IDE catch field-name typos before they reach the server.

Both files are **auto-generated — do not edit them by hand**; any manual change is overwritten the next time the
script runs.

**When to re-generate:** after refreshing `openapi.json` and the API's models have changed (new fields, renamed enums,
added endpoints). If only front-end logic changed and the API is the same, you can skip this step.

**How to run** (open a terminal in the project folder):

Generate `app/openapi.js` using [OpenAPI Generator](https://openapi-generator.tech):

```
python core/openapi/build_openapi_models_js.py
```

Generate `core/openapi/openapi.py` using
[datamodel-code-generator](https://koxudaxi.github.io/datamodel-code-generator/):

```
python core/openapi/build_openapi_models_python.py
```

Both scripts also re-download `openapi.json` at the start (same as `win_update_openapi.bat`), so running them is
sufficient — you do not need to run the download step separately. They invoke `uv run` internally for the generator
tools, so `uv` must be available on your system alongside the Python dependencies from Step 2.

On Windows, double-clicking **`win_update_openapi.bat`** in the project root runs both scripts in one step and is the
recommended shortcut — you do not need to open a terminal at all.

## Translation

### What i18n is

**i18n** is shorthand for **internationalisation** — the "i", the next 18 letters, and the "n". It describes the
practice of building software so that all user-visible text is stored separately from the code, and can be swapped out
at runtime for a different language. Instead of writing `"No project loaded."` directly inside a component, the code
refers to a symbolic key (`"no_project_loaded"`), and a small i18n library replaces that key with the correct string
for whatever language the user has selected. The result: the same codebase speaks German, English, French, or Italian
without any code changes — only the locale files differ.

The app uses a lightweight custom i18n approach: locale files are plain JSON objects loaded once on startup, and a
`t(key)` helper resolves any key to the active language's string (falling back to German if a translation is missing).
Some strings contain **interpolation placeholders** such as `{{status}}` or `{{path}}` — these are filled in at runtime
with actual values and must survive translation verbatim.

### Locale files

All locale files live in **`app/locales/`**:

| File | Role |
|---|---|
| `de.json` | **Canonical German base** — the single source of truth. Every key and every German string lives here. Edit this file first when adding or changing text. |
| `en.json` | English translations. |
| `fr.json` | French translations. |
| `it.json` | Italian translations. |

Every file is a flat JSON object: string keys map to translated string values. Example entry:

```json
{
  "no_project_loaded": "No project loaded.",
  "http_error": "HTTP {{status}} at {{method}} {{path}}"
}
```

The same keys must exist in every locale file:

```json
{
  "no_project_loaded": "No project loaded.",
  "http_error": "HTTP {{status}} at {{method}} {{path}}"
}
```

Keys are shared across all files — every language file must contain exactly the same set of keys as `de.json`. Missing
keys fall back to German at runtime; surplus keys (present in a target file but not in `de.json`) are ignored and
removed on the next sync.

If a locale file does not exist yet, or is completely empty, the sync script creates it automatically with an empty
object (`{}`).

### Adding or changing a translation entry

1. **Open `app/locales/de.json`** in your editor.
2. **Add or edit the German entry.** Use a descriptive, lowercase, underscore-separated key:
   ```json
   "save_changes": "Save changes"
   ```
   For strings that embed dynamic values, use `{{placeholder_name}}` syntax:
   ```json
   "items_selected": "{{count}} entries selected"
   ```
3. **Use the key in the code.** Inside a Preact component call `t("save_changes")` (or whatever the helper is named in
   the file that sets up i18n). The key is resolved at runtime to the active language.
4. **Sync the target languages** — see the next section.

Never add a key to only one locale file — always start from `de.json` and propagate to the others. This keeps `de.json`
as the only place a developer needs to look when searching for where a string originates.

### Syncing translations

**Base language: German (`de`).** `sync_translations.py` always treats `de.json` as the authoritative source.
Every other locale is derived from it — never the other way around. If you need to correct a translation, fix the
German string in `de.json` first; the sync script then picks up the change and re-translates the affected key in all
target languages.

After editing `de.json`, the three target files (`en.json`, `fr.json`, `it.json`) are out of date. There are two ways
to bring them back in sync:

#### Option A — Automatic sync with DeepL (requires a paid API key)

`core/i18n/sync_translations.py` automates the entire sync:

- **Adds** keys that are in `de.json` but missing from a target file (translates them via DeepL).
- **Re-translates** keys whose German value has changed since the last run.
- **Keeps** existing translations whose German source has not changed (no unnecessary API calls).
- **Removes** keys that are no longer in `de.json`.

The script detects changes by comparing the current `de.json` against a snapshot stored in
**`app/locales/cmp/de_cmp.json`** (see below). At the end of each successful run the snapshot is updated, so the next
run only re-translates what actually changed.

**Prerequisites:**

- A **paid DeepL API key**. Free-tier accounts do not support the API. The key is stored in the settings file
  (`.env`) as `DEEPL_AUTH_KEY`. Without it the script exits with an authentication error.
- Python dependencies installed (`win_install_python_modules.bat`).

**Run from a terminal in the project root:**

```
python core/i18n/sync_translations.py
```

Add `--dry-run` to see what would change without writing anything:

```
python core/i18n/sync_translations.py --dry-run
```

**Windows shortcut:** double-click **`win_update_translations_i18n.bat`** in the project root — it runs the script
without opening a terminal manually.

**Placeholder protection:** The script wraps each `{{...}}` token in private-use sentinel characters before sending the
text to DeepL, then restores them afterwards. If DeepL drops or duplicates a placeholder the script raises an error
rather than writing a broken string to disk.

#### Option B — Manual sync (no API key needed)

Open each target locale file (`en.json`, `fr.json`, `it.json`) and add or update the missing keys by hand, or paste
the changed keys into an LLM and ask it to translate them. Keep the same key names and preserve any `{{placeholder}}`
tokens verbatim. This is the recommended approach when no DeepL key is available, or when only one or two strings
changed.

### The comparison snapshot (`app/locales/cmp/de_cmp.json`)

`de_cmp.json` is a **machine-managed snapshot** of `de.json` as it was at the end of the last `sync_translations.py`
run. The script compares the current `de.json` against this snapshot to identify which keys were added, removed, or
had their German value changed — and therefore which translations need to be (re-)generated. This avoids re-translating
strings that are already correct, saving both API cost and time.

You do not edit `de_cmp.json` by hand. It is updated automatically by the sync script. If you delete it, the next run
treats every key as new and re-translates everything — harmless, but wasteful if you have a large number of keys.

Commit `de_cmp.json` alongside the locale files so every team member's sync run starts from the same baseline.

## Working with Linux / WSL2

> **For advanced users.** This chapter is only needed if you want to work from a Linux terminal. If the Windows
> `win_*.bat` shortcuts cover your needs, you can skip it.

**WSL2** (Windows Subsystem for Linux 2) lets you run Linux directly inside Windows. This is useful for this project
because the `Makefile` and the `uv` Python package manager work there in the same way as on Linux or Mac.

Install WSL2 once from a Windows PowerShell opened as administrator:

```
wsl --install
```

After the installation, restart Windows if asked, open the **Ubuntu** app, and go to the project folder. Windows drives
are available below `/mnt/`, for example:

```
cd /mnt/c/Users/you/xeduorg-ui-template
```

### Install uv

`uv` installs the Python dependencies and runs project scripts inside the correct environment. You do not need to
activate `.venv` manually.

```
curl -LsSf https://astral.sh/uv/install.sh | sh
```

Restart the terminal afterwards, or run `source ~/.bashrc`, so the `uv` command is available.

### Important Make Commands

The `Makefile` contains shortcuts for common development tasks. The most important ones are:

| Command | What it does |
|---|---|
| `make venv_build` | Creates a fresh `.venv` and installs the Python dependencies. |
| `make md_to_html` | Converts Markdown documentation files to HTML files in `docs/`. |
| `make sync_translations` | Updates translated locale files from the German base file. Requires a DeepL API key. |
| `make update_openapi` | Refreshes the OpenAPI models used by the frontend and Python tooling. |
| `make zone` | Removes Windows `Zone.Identifier` metadata files that can appear in WSL2 folders. |

Typical first-time setup:

```bash
make venv_build
make update_openapi
```

Typical day-to-day commands:

```bash
make md_to_html          # after editing any *.md documentation file
make sync_translations   # after editing de.json
make update_openapi      # after the backend API changes
```
