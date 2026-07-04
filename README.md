# eduxept · Strategie-Cockpit

## Installation (Windows)

Follow these two steps once before using the cockpit. No prior technical knowledge is required.

### Step 1 — Install Python

Python is the program that runs the cockpit's tools on your computer.

1. Open this link in your web browser:
   https://apps.microsoft.com/detail/9pnrbtzxmb4z?hl=en-US&gl=CH&ocid=pdpshare
2. The Microsoft Store opens on the Python page. Click the blue **Download** (or **View in Store**) button.
3. Wait until the download finishes and the button changes to **Open**. Python is now installed — you can close the
   Microsoft Store.

### Step 2 — Install the required Python modules

The cockpit needs a few add-on packages ("modules"). A ready-made script installs them all for you.

1. Open the project folder in the Windows Explorer (the folder that contains this README file).
2. Double-click the file **`run_install_python_modules.bat`**.
3. A black window opens and text scrolls by while the modules are downloaded and installed. This can take a minute.
4. When you see the message **`Press any key to continue . . .`**, the installation is complete. Press any key to close
   the window.

> **Note:** If Windows shows a security warning ("Windows protected your PC"), click **More info → Run anyway**. The
> script only installs the packages listed in `core/requirements.txt`.

You only need to do this once. After that, you can start the cockpit with `run_devserver.bat`.

### Step 3 (optional) — Install a code editor (IDE)

You can run and use the cockpit with just the steps above. But if you plan to **look at or change the cockpit's files**,
a proper code editor — an **IDE** (Integrated Development Environment) — makes this much easier and safer than a plain
text editor like Notepad.

Two recommended, free options:

- **PyCharm** — https://www.jetbrains.com/de-de/pycharm
- **Visual Studio Code** — https://code.visualstudio.com/

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

This chapter explains the everyday routine: starting the cockpit on your own computer, making changes, and publishing a
finished version. No prior technical knowledge is required.

### Start the cockpit (local test server)

1. In the project folder, double-click **`run_devserver.bat`**.
2. A black window opens and stays open — leave it running. This is the small web server that shows the cockpit.
3. Your web browser opens automatically at the cockpit's start page (`wrapper.html`). If it doesn't, open your browser
   and go to **http://127.0.0.1:8002/wrapper.html**.
4. When you're finished, close the black window to stop the server.

Everything runs on **your own computer** here — nothing is published to the live platform. This is a safe place to try
things out.

### Automatic reloading

While the server window stays open, it watches the cockpit's files for changes. Whenever a file is edited and saved, the
page in your browser **reloads by itself** — you don't need to press reload. So you can edit a file, switch to the
browser, and immediately see the result.

### Browser caching (when you see an old version)

To load pages faster, browsers sometimes keep an old copy of a file in memory (the "cache"). During development this can
be confusing: you change something, but the browser still shows the **previous** version.

- The test server is set up to tell the browser **not** to cache anything, so this usually doesn't happen.
- If you still see an outdated page, force a fresh load with **Ctrl + F5** (hold Ctrl and press F5). This tells the
  browser to ignore its cache and download everything again.
- If it still looks wrong, close the browser tab completely and open the address again.

### Using code agents (Claude, Codex, local models)

A **code agent** is an AI assistant that can read and change the cockpit's files for you. Instead of editing files by
hand, you describe in plain language what you want ("add a new button", "fix the error on the project screen"), and the
agent proposes or makes the changes. It runs in a terminal, inside your code editor (IDE), or as a desktop app, and
works directly on the files in the project folder.

Common options:

- **Claude Desktop** — Anthropic's desktop chat app (not a terminal). On its own it can't touch your files; you give it
  access by installing the **Filesystem** *Desktop Extension* once via **Settings → Extensions**, then pointing it at
  the project folder using the folder's **full path** (e.g. `...\strategy_cockpit`). Restart the app afterwards.
  From then on you can ask it, in the chat, to read and change the cockpit's files.
- **Claude Code** — Anthropic's command-line agent. Start it from a terminal opened in the project folder by running
  `claude`. It reads the file **`CLAUDE.md`** in this project, which gives it the project-specific rules and background,
  so its changes fit how the cockpit is built.
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

- **A stronger model writes better code.** It understands how the cockpit is built, follows the project rules (in
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
changes to the cockpit, the extra thinking time is usually cheaper than the debugging it prevents; for quick questions,
a low setting is fine.

A simple rule of thumb: for changes that will be **kept and published**, use the best model available to you — with a
generous reasoning-effort setting. Cheaper or local models and low effort are fine for questions, experiments, and
throwaway drafts.

Practical advice when working with any agent:

- **Keep the test server running** (`run_devserver.bat`) while you work. Because the page reloads by itself, you see the
  agent's changes in the browser right away and can judge whether they are correct.
- **Review before you publish.** An agent can make mistakes. Always check the result in the local test server before you
  run `run_upload_app.bat` to put a version live.
- **Describe one change at a time.** Small, clear requests give better results than one large, vague instruction.

### Settings: server address and access token

The cockpit needs to know **which server to talk to** (the address) and **an access token** (a kind of password that
proves you're allowed in). These two settings are **not** stored inside the program's code. They live in a separate
settings file named **`strategy_cockpit.env`**, located **one folder above** the project folder. This keeps the secret
token out of the project itself.

You normally don't touch this file by hand — it is prepared once. What's useful to understand:

- When you start the test server, it reads these settings and **passes them automatically to the cockpit** by attaching
  them to the web address (as so-called URL parameters). That's why you don't have to type an address or token into the
  cockpit yourself.
- Developer computers can use a second file, `strategy_cockpit_dev.env`, so that testing points at a different (
  development) server than the live one. The program picks the right file automatically based on which computer it runs
  on.

If the cockpit reports that it can't connect or has no token, the `strategy_cockpit.env` file is usually the place to
check.

### Publish a version to the hosting platform

When your changes are ready and tested locally, you can upload them to the live platform so others can use them.

1. Make sure your changes look correct in the local test server first.
2. In the project folder, double-click **`run_upload_app.bat`**.
3. A black window opens and lists each file as it is uploaded. Lines marked **`[OK]`** were sent successfully; *
   *`[FAIL]`** means a file could not be uploaded.
4. When it finishes, press any key to close the window.

After a successful upload, the new version is live on the hosting platform.

## API

The cockpit itself stores no data. Everything you see — visions, missions, focuses, and actions — lives on a separate
server and is fetched and saved over the network. This chapter explains how that works and why the file `openapi.json`
matters.

### What a REST API is

An **API** (Application Programming Interface) is a set of web addresses that a program can call to read or change data,
much like a web browser calls a web address to load a page. The eduxept backend offers a **REST API**: a common style
of API built on the same building blocks as the web.

The key ideas:

- Every piece of data has its own **address** (URL), for example the list of all projects.
- The cockpit sends a **request** to such an address and gets a **response** back, usually as **JSON** — a plain-text
  format that both computers and humans can read.
- The type of request states the intent, following standard web verbs: **read** existing data (POST `.../read`),
  **create** new data, **update** an existing entry, or **delete** one.
- Each request carries the **access token** described above, so the server knows the caller is allowed in.

In short: when you open a project or edit an action in the cockpit, the browser is quietly sending REST requests to the
backend and showing you the answers.

### Why `openapi.json` matters

An API is only useful if you know exactly which addresses exist, what data they expect, and what they return. That
description is written down in a single file called **`openapi.json`** (an **OpenAPI specification**). Think of it as the
API's complete, machine-readable instruction manual.

The file lives at `core/openapi/openapi.json` and serves as the **checked-in contract** for the backend: it documents
every endpoint the cockpit relies on. Keeping a local copy means you can look up how an endpoint behaves without
guessing, and it makes changes on the server visible when the file is refreshed.

### Download the OpenAPI specification (`run_update_openapi.bat`)

The backend publishes its current `openapi.json` at its own address. To refresh the local copy so it matches the live
server, use the ready-made script:

1. Open the folder **`core/openapi`** inside the project folder in the Windows Explorer.
2. Double-click the file **`run_update_openapi.bat`**.
3. A black window opens. It downloads the specification from the server (using the address from your settings file), checks
   that the file is valid, and then replaces the local `openapi.json` with the fresh version. You'll see a `Downloading ...`
   line followed by a `Saved ...` confirmation with the file size.
4. When you see **`Press any key to continue . . .`**, the update is complete. Press any key to close the window.

Run this whenever the backend has changed and you want the local contract to reflect the latest state of the API.

