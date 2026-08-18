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
const AI_GATEWAY_BASE_URL = "https://ai-gateway.vercel.sh/v1";

let _primary: OpenAI | null = null;
let _backup: OpenAI | null = null;

function trimEnv(name: string): string | undefined {
  const value = process.env[name]?.trim();
  return value ? value : undefined;
}

/** AI Gateway API key (routes through Vercel AI Gateway when set). */
function getAiGatewayApiKey(): string | undefined {
  return trimEnv("AI_GATEWAY_API_KEY");
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
    const gatewayKey = getAiGatewayApiKey();
    const baseURL = gatewayKey ? AI_GATEWAY_BASE_URL : getPrimaryBaseUrl();
    const apiKey =
      gatewayKey ||
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
    const gatewayKey = getAiGatewayApiKey();
    // When using AI Gateway, route backup through it; otherwise explicit base URL.
    const baseURL = gatewayKey ? AI_GATEWAY_BASE_URL : getBackupBaseUrl();
    const effectiveKey = gatewayKey || apiKey;
    
    _backup = new OpenAI({
      apiKey: effectiveKey,
      baseURL,
    });
  }
  return _backup;
}

/**
 * Ordered providers: Spark (primary) first, then OpenCode Zen backup.
 * When AI_GATEWAY_API_KEY is set, routes all calls through Vercel AI Gateway.
 */
export function getAiProviders(): AiProvider[] {
  const providers: AiProvider[] = [];
  const primaryBase = getPrimaryBaseUrl();
  const primaryKey = getPrimaryApiKey();
  const gatewayKey = getAiGatewayApiKey();

  if (gatewayKey || primaryBase || primaryKey) {
    providers.push({
      kind: "primary",
      client: getPrimaryClient(),
      model: getPrimaryModel(),
      label: gatewayKey
        ? `gateway:${getPrimaryModel()}`
        : primaryBase
          ? `spark:${getPrimaryModel()}`
          : `openai:${getPrimaryModel()}`,
    });
  }

  const backup = getBackupClient();
  if (backup) {
    providers.push({
      kind: "backup",
      client: backup,
      model: getBackupModel(),
      label: gatewayKey ? `gateway:${getBackupModel()}` : `opencode:${getBackupModel()}`,
    });
  }

  return providers;
}
