import OpenAI from "openai";

let _client: OpenAI | null = null;

/** True when a local/OpenAI-compatible endpoint or cloud API key is configured. */
export function isAiConfigured(): boolean {
  const baseUrl = process.env.OPENAI_BASE_URL?.trim();
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  return Boolean(baseUrl || apiKey);
}

export function getOpenAIClient(): OpenAI {
  if (!_client) {
    const baseURL = process.env.OPENAI_BASE_URL?.trim() || undefined;
    const apiKey =
      process.env.OPENAI_API_KEY?.trim() ||
      // vLLM / OpenAI-compatible local servers often ignore the key but the SDK requires one.
      (baseURL ? "local" : undefined);

    _client = new OpenAI({
      apiKey,
      ...(baseURL ? { baseURL } : {}),
    });
  }
  return _client;
}

export function getModel(): string {
  if (process.env.OPENAI_MODEL?.trim()) {
    return process.env.OPENAI_MODEL.trim();
  }
  // Default to the Spark vLLM served id when using a custom base URL.
  if (process.env.OPENAI_BASE_URL?.trim()) {
    return "gemma4";
  }
  return "gpt-4o";
}
