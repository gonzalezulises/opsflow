import OpenAI from "openai";

export type AiProviderKind = "primary" | "backup";

export type AiProvider = {
  kind: AiProviderKind;
  client: OpenAI;
  model: string;
  label: string;
};

const OPENCODE_ZEN_BASE_URL = "https://opencode.ai/zen/v1";
const DEFAULT_OPENCODE_MODEL = "deepseek-v4-flash";

let _primary: OpenAI | null = null;
let _backup: OpenAI | null = null;

function trimEnv(name: string): string | undefined {
  const value = process.env[name]?.trim();
  return value ? value : undefined;
}

/** Spark / OpenAI-compatible primary endpoint (OPENAI_BASE_URL). */
function getPrimaryBaseUrl(): string | undefined {
  return trimEnv("OPENAI_BASE_URL");
}

/** Bearer for Spark Caddy, or cloud key when no base URL. */
function getPrimaryApiKey(): string | undefined {
  return trimEnv("OPENAI_API_KEY");
}

/** OpenCode Zen (or other OpenAI-compatible) backup key. */
function getBackupApiKey(): string | undefined {
  return trimEnv("OPENAI_BACKUP_API_KEY") || trimEnv("OPENCODE_API_KEY");
}

function getBackupBaseUrl(): string {
  return trimEnv("OPENAI_BACKUP_BASE_URL") || OPENCODE_ZEN_BASE_URL;
}

export function getPrimaryModel(): string {
  const explicit = trimEnv("OPENAI_MODEL");
  if (explicit) return explicit;
  if (getPrimaryBaseUrl()) return "gemma4";
  return "gpt-4o";
}

export function getBackupModel(): string {
  return (
    trimEnv("OPENAI_BACKUP_MODEL") ||
    trimEnv("OPENCODE_MODEL") ||
    DEFAULT_OPENCODE_MODEL
  );
}

/** @deprecated Prefer getPrimaryModel / resolve providers; kept for call sites. */
export function getModel(): string {
  return getPrimaryModel();
}

/** True when Spark primary and/or OpenCode backup is configured. */
export function isAiConfigured(): boolean {
  return Boolean(getPrimaryBaseUrl() || getPrimaryApiKey() || getBackupApiKey());
}

export function getOpenAIClient(): OpenAI {
  return getPrimaryClient();
}

function getPrimaryClient(): OpenAI {
  if (!_primary) {
    const baseURL = getPrimaryBaseUrl();
    const apiKey =
      getPrimaryApiKey() ||
      // vLLM / OpenAI-compatible local servers often ignore the key but the SDK requires one.
      (baseURL ? "local" : undefined);

    _primary = new OpenAI({
      apiKey,
      ...(baseURL ? { baseURL } : {}),
    });
  }
  return _primary;
}

function getBackupClient(): OpenAI | null {
  const apiKey = getBackupApiKey();
  if (!apiKey) return null;
  if (!_backup) {
    // Explicit base URL: SDK would otherwise inherit process.env.OPENAI_BASE_URL (Spark).
    _backup = new OpenAI({
      apiKey,
      baseURL: getBackupBaseUrl(),
    });
  }
  return _backup;
}

/**
 * Ordered providers: Spark (primary) first, then OpenCode Zen backup.
 */
export function getAiProviders(): AiProvider[] {
  const providers: AiProvider[] = [];
  const primaryBase = getPrimaryBaseUrl();
  const primaryKey = getPrimaryApiKey();

  if (primaryBase || primaryKey) {
    providers.push({
      kind: "primary",
      client: getPrimaryClient(),
      model: getPrimaryModel(),
      label: primaryBase ? `spark:${getPrimaryModel()}` : `openai:${getPrimaryModel()}`,
    });
  }

  const backup = getBackupClient();
  if (backup) {
    providers.push({
      kind: "backup",
      client: backup,
      model: getBackupModel(),
      label: `opencode:${getBackupModel()}`,
    });
  }

  return providers;
}
