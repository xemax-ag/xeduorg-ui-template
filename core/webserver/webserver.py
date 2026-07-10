#!/usr/bin/env python3
"""
Local web server with live-reload for the app.

File watching via *watchdog* (OS events, no polling); serving and browser
reload via the Python standard library (http.server + SSE).

Requirement:
    pip install watchdog

What it does:
  * Serves the ./source subdirectory over HTTP (default port 8000).
  * watchdog reports changes to .html / .css / .js instantly (OS filesystem events).
  * The browser then reloads automatically via Server-Sent Events (SSE):
    a tiny <script> is injected into every served HTML page that opens an
    SSE connection to /__livereload and calls location.reload().

Usage:
    python webserver.py                 # port 8000, opens app.html
    python webserver.py --port 5500
    python webserver.py --open app.html
    python webserver.py --no-open       # alias: --noload
"""

import argparse
import os
import threading
import time
import webbrowser
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import urlsplit, urlencode, parse_qs, unquote
import posixpath
from watchdog.events import FileSystemEventHandler
from watchdog.observers import Observer
import pathlib
import sys

__cwd__ = str(pathlib.Path(__file__).parents[2]).replace('\\', '/')
sys.path.append(__cwd__)

from core.config import config

# File extensions whose change triggers a reload.
WATCH_EXTS = (".html", ".css", ".js")

# Static assets served from this script's ./static folder, mounted at /static/.
# The web root is ./app (see main), so these files live outside it and are
# routed explicitly by Handler.translate_path.
STATIC_URL_PREFIX = "/static/"
STATIC_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "static")

# Incremented on every detected change; clients poll this value via SSE.
_version = 0
_version_lock = threading.Lock()
_last_change = 0.0  # for simple debouncing (editors often fire multiple events)

# Reload snippet injected into every HTML response.
_LIVERELOAD_SNIPPET = b"""
<script>
(function () {
  if (!window.EventSource) return;
  var es = new EventSource("/__livereload");
  var current = null;
  es.onmessage = function (e) {
    if (current === null) { current = e.data; return; }
    if (e.data !== current) { es.close(); location.reload(); }
  };
})();
</script>
"""


class ReloadHandler(FileSystemEventHandler):
    """watchdog handler: increments _version on relevant file events."""

    def _trigger(self, path):
        global _version, _last_change
        if not path or not path.lower().endswith(WATCH_EXTS):
            return
        now = time.monotonic()
        with _version_lock:
            # Debounce: multiple events within 150 ms count as a single change.
            if now - _last_change < 0.15:
                _last_change = now
                return
            _last_change = now
            _version += 1
            v = _version
        print(f"  changed: {os.path.basename(path)}  -> reload (v{v})")

    def on_modified(self, event):
        if not event.is_directory:
            self._trigger(event.src_path)

    def on_created(self, event):
        if not event.is_directory:
            self._trigger(event.src_path)

    def on_moved(self, event):
        if not event.is_directory:
            self._trigger(getattr(event, "dest_path", None))


class Handler(SimpleHTTPRequestHandler):
    def handle(self):
        # Browsers routinely abort keep-alive / SSE (livereload) connections on
        # navigation or reload. That surfaces as a ConnectionAbortedError /
        # ConnectionResetError from the socket read and would otherwise print a
        # full (harmless) traceback. Swallow it so the console stays clean.
        try:
            super().handle()
        except (ConnectionAbortedError, ConnectionResetError, BrokenPipeError):
            pass

    def log_message(self, fmt, *args):
        if "__livereload" in (self.path or ""):
            return
        super().log_message(fmt, *args)

    def end_headers(self):
        # Web server: never let the browser cache anything. Without this, edited
        # .js/.css survive in the browser cache and stale code runs (e.g. an old
        # index.js referencing DOM elements that have since moved). Applies to
        # every response (static files, 404s, etc.).
        self.send_header("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0")
        super().end_headers()

    def do_GET(self):
        if self.path == "/__livereload":
            return self._serve_sse()
        redirect = self._connection_redirect()
        if redirect:
            self.send_response(302)
            self.send_header("Location", redirect)
            self.end_headers()
            return
        return super().do_GET()

    def _connection_redirect(self):
        """For the wrapper entry page, inject the connection config (api_base_url /
        auth_token from core.config) as URL parameters, so wrapper.js and the
        embedded cockpit receive the dev credentials without a hardcoded token in
        the source. Returns the redirect target, or None when no redirect is needed
        (params already present, or a different path is requested)."""
        parts = urlsplit(self.path)
        if parts.path not in ("/", "/wrapper.html"):
            return None
        # keep_blank_values: an empty config value (token="") must still count as
        # "present" once injected, otherwise the redirect would loop endlessly.
        q = parse_qs(parts.query, keep_blank_values=True)
        if "baseUrl" in q and "token" in q:
            return None  # already carries the connection parameters
        query = urlencode({"baseUrl": config.api_base_url, "token": config.auth_token})
        return f"/wrapper.html?{query}"

    def _serve_sse(self):
        self.send_response(200)
        self.send_header("Content-Type", "text/event-stream")
        self.send_header("Connection", "keep-alive")
        self.end_headers()  # Cache-Control: no-store added by end_headers()
        try:
            while True:
                with _version_lock:
                    v = _version
                self.wfile.write(f"data: {v}\n\n".encode("utf-8"))
                self.wfile.flush()
                time.sleep(0.5)
        except (BrokenPipeError, ConnectionResetError, ConnectionAbortedError):
            pass  # Client left the page / reloaded.

    def translate_path(self, path):
        """Route /static/* to STATIC_DIR (outside the ./app web root); everything
        else is resolved by the stdlib against the current working directory."""
        parts = urlsplit(path)
        if parts.path == STATIC_URL_PREFIX.rstrip("/") or parts.path.startswith(STATIC_URL_PREFIX):
            rel = posixpath.normpath(unquote(parts.path[len(STATIC_URL_PREFIX):]))
            # Drop empty/'.'/'..' segments and any that smuggle in a path
            # separator, so a request can never escape STATIC_DIR.
            words = [w for w in rel.split("/")
                     if w and w not in (".", "..") and os.sep not in w and (os.altsep or "") not in w]
            return os.path.join(STATIC_DIR, *words)
        return super().translate_path(path)

    def send_head(self):
        """HTML is served with the reload snippet injected; everything else unchanged."""
        path = self.translate_path(self.path)
        if os.path.isfile(path) and path.lower().endswith(".html"):
            return self._serve_html(path)
        return super().send_head()

    def _serve_html(self, path):
        try:
            with open(path, "rb") as f:
                body = f.read()
        except OSError:
            self.send_error(404, "File not found")
            return None

        marker = b"</body>"
        idx = body.lower().rfind(marker)
        if idx != -1:
            body = body[:idx] + _LIVERELOAD_SNIPPET + body[idx:]
        else:
            body = body + _LIVERELOAD_SNIPPET

        self.send_response(200)
        self.send_header("Content-Type", "text/html; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()  # Cache-Control: no-store added by end_headers()
        self.wfile.write(body)
        return None  # Response fully written — do_GET will not call copyfile.


def main():
    parser = argparse.ArgumentParser(description="Web server with live-reload (watchdog).")
    parser.add_argument("--port", type=int, default=8000, help="Port (default: 8000)")
    parser.add_argument("--host", default="127.0.0.1", help="Host (default: 127.0.0.1)")
    parser.add_argument("--open", default="wrapper.html",
                        help="File opened in the browser (default: wrapper.html)")
    parser.add_argument("--no-open", "--noload", action="store_true",
                        help="Do not open the browser automatically")
    args = parser.parse_args()

    # This script lives in core/webserver/; the repo root is two levels up.
    repo_root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    src = os.path.join(repo_root, "app")
    if not os.path.isdir(src):
        raise SystemExit(f"Directory not found: {src}")
    os.chdir(src)  # Web root = ./app

    observer = Observer()
    observer.schedule(ReloadHandler(), src, recursive=True)
    observer.start()

    server = ThreadingHTTPServer((args.host, args.port), Handler)
    url = f"http://{args.host}:{args.port}/{args.open}"
    print(f"Web server running at http://{args.host}:{args.port}/  (Ctrl+C to stop)")
    print(f"Watching (watchdog): {', '.join(WATCH_EXTS)}  ->  {url}")

    if not args.no_open:
        threading.Timer(0.5, lambda: webbrowser.open(url)).start()

    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nStopping ...")
    finally:
        observer.stop()
        observer.join()
        server.shutdown()


if __name__ == "__main__":
    main()
