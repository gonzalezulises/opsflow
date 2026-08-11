import OpenAI from "openai";

export type AiProviderKind = "primary" | "backup";

export type AiProvider = {
  kind: AiProviderKind;
  client: OpenAI;
  model: string;
  label: string;
};

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

/** ChatGPT cloud backup key (api.openai.com). */
function getBackupApiKey(): string | undefined {
  return trimEnv("OPENAI_BACKUP_API_KEY");
}

export function getPrimaryModel(): string {
  if (trimEnv("OPENAI_MODEL")) return trimEnv("OPENAI_MODEL")!;
  if (getPrimaryBaseUrl()) return "gemma4";
  return "gpt-4o";
}

export function getBackupModel(): string {
  return trimEnv("OPENAI_BACKUP_MODEL") || "gpt-4o";
}

/** @deprecated Prefer getPrimaryModel / resolve providers; kept for call sites. */
export function getModel(): string {
  return getPrimaryModel();
}

/** True when Spark primary and/or ChatGPT backup is configured. */
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
    // Force cloud host: the SDK otherwise inherits process.env.OPENAI_BASE_URL (Spark).
    _backup = new OpenAI({
      apiKey,
      baseURL: "https://api.openai.com/v1",
    });
  }
  return _backup;
}

/**
 * Ordered providers: Spark (or primary OpenAI) first, then ChatGPT cloud backup.
 * Backup is skipped when primary already is cloud (no BASE_URL) and uses the same key space.
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
    // Avoid duplicate cloud call when primary is already api.openai.com with no custom base.
    if (primaryBase || !primaryKey) {
      providers.push({
        kind: "backup",
        client: backup,
        model: getBackupModel(),
        label: `openai-backup:${getBackupModel()}`,
      });
    }
  }

  return providers;
}
