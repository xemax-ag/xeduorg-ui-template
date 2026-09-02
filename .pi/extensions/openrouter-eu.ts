/**
 * openrouter-eu.ts — Route OpenRouter through the EU endpoint (EU data residency).
 *
 * Registers an "openrouter-eu" provider backed by https://eu.openrouter.ai/api/v1
 * and discovers its model catalog live at startup (async factory, so the models
 * are available to `pi --list-models` and the /model picker immediately).
 *
 * If the EU catalog is unreachable, falls back to a small static model list so
 * pi still starts.
 *
 * Installed at .pi/extensions/ (auto-discovered, /reload-able).
 *
 * Usage:
 *   pi --model openrouter-eu/anthropic/claude-sonnet-4.5
 *
 * Requires the OPENROUTER_API_KEY environment variable (same key as the
 * global OpenRouter endpoint).
 *
 * Tip: the full OpenRouter catalog is large. To keep the /model picker tidy,
 * scope it in settings.json, e.g.:
 *   "enabledModels": ["openrouter-eu/anthropic/*", "openrouter-eu/google/gemini-2.5-pro"]
 */

import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";

const EU_BASE_URL = "https://eu.openrouter.ai/api/v1";

/** Subset of the OpenRouter /models response we care about. */
interface OpenRouterModel {
  id: string;
  name?: string;
  context_length?: number;
  max_completion_tokens?: number;
  top_provider?: {
    context_length?: number;
    max_completion_tokens?: number;
  };
  architecture?: {
    /** e.g. "text->text", "text+image->text" */
    modality?: string;
    /** e.g. ["text", "image"] */
    input_modalities?: string[];
  };
  /** e.g. ["tools", "reasoning", "structured_outputs"] */
  supported_parameters?: string[];
  pricing?: {
    /** USD per token */
    prompt?: string;
    completion?: string;
    input_cache_read?: string;
    input_cache_write?: string;
  };
}

/** USD-per-token string -> USD per million tokens, clamped to >= 0. */
function perMillion(value: string | undefined): number {
  const n = Number.parseFloat(value ?? "0");
  if (!Number.isFinite(n) || n < 0) return 0; // "-1" means "pricing unknown"
  return n * 1_000_000;
}

/** Map an OpenRouter model entry to a pi model config. */
function toModel(m: OpenRouterModel) {
  const contextWindow =
    m.top_provider?.context_length ?? m.context_length ?? 128_000;
  const maxTokens =
    m.top_provider?.max_completion_tokens ??
    m.max_completion_tokens ??
    8_192;

  // Input modalities: prefer the explicit array, fall back to parsing modality.
  let input: Array<"text" | "image"> =
    (m.architecture?.input_modalities ?? [])
      .map((x) => x.trim())
      .filter((x): x is "text" | "image" => x === "text" || x === "image");
  if (input.length === 0) {
    const lhs = m.architecture?.modality?.split("->")[0] ?? "text";
    input = lhs
      .split("+")
      .map((x) => x.trim())
      .filter((x): x is "text" | "image" => x === "text" || x === "image");
  }
  if (input.length === 0) input = ["text"];

  return {
    id: m.id,
    name: m.name ?? m.id,
    reasoning: m.supported_parameters?.includes("reasoning") ?? false,
    input,
    cost: {
      input: perMillion(m.pricing?.prompt),
      output: perMillion(m.pricing?.completion),
      cacheRead: perMillion(m.pricing?.input_cache_read),
      cacheWrite: perMillion(m.pricing?.input_cache_write),
    },
    contextWindow,
    maxTokens: Math.min(maxTokens, contextWindow),
  };
}

/** Minimal catalog used when the EU endpoint is unreachable at startup. */
const FALLBACK_MODELS: OpenRouterModel[] = [
  {
    id: "anthropic/claude-sonnet-4.5",
    name: "Claude Sonnet 4.5",
    context_length: 200_000,
    supported_parameters: ["reasoning", "tools"],
    architecture: { input_modalities: ["text", "image"] },
  },
  {
    id: "google/gemini-2.5-pro",
    name: "Gemini 2.5 Pro",
    context_length: 1_047_576,
    supported_parameters: ["reasoning", "tools"],
    architecture: { input_modalities: ["text", "image"] },
  },
  {
    id: "openai/gpt-4.1",
    name: "GPT-4.1",
    context_length: 1_047_576,
    supported_parameters: ["tools"],
    architecture: { input_modalities: ["text", "image"] },
  },
];

export default async function (pi: ExtensionAPI) {
  let models = FALLBACK_MODELS;
  let discovered = false;

  try {
    const response = await fetch(`${EU_BASE_URL}/models`);
    if (response.ok) {
      const payload = (await response.json()) as { data?: OpenRouterModel[] };
      if (payload.data && payload.data.length > 0) {
        models = payload.data;
        discovered = true;
      }
    }
  } catch {
    // Offline or EU endpoint unreachable — fall back below.
  }

  pi.registerProvider("openrouter-eu", {
    name: "OpenRouter (EU)",
    baseUrl: EU_BASE_URL,
    apiKey: "$OPENROUTER_API_KEY",
    api: "openai-completions",
    models: models.map(toModel),
  });

  pi.on("session_start", (_event, ctx) => {
    if (discovered) {
      ctx.ui.notify(
        `openrouter-eu: ${models.length} models loaded from the EU catalog`,
        "info",
      );
    } else {
      ctx.ui.notify(
        "openrouter-eu: EU catalog unreachable, using fallback model list",
        "error",
      );
    }
  });
}
