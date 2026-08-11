import { z } from "zod";
import { zodResponseFormat } from "openai/helpers/zod";
import { getAiProviders, type AiProvider } from "./client";
import { SYSTEM_PROMPT } from "./prompts";

const MAX_INPUT_LENGTH = 10000;

function sanitizeInput(input: string): string {
  return input
    .replace(/\{?\{?system\}?\}?/gi, "")
    .replace(/\{?\{?ignore\}?\}?/gi, "")
    .replace(/\bignore previous instructions\b/gi, "")
    .slice(0, MAX_INPUT_LENGTH);
}

export type GenerateStructuredResult<T> = {
  data: T | null;
  error: string | null;
  tokensUsed: number;
  modelUsed: string;
  usedFallback: boolean;
};

async function parseWithProvider<T extends z.ZodType>(
  provider: AiProvider,
  sanitized: string,
  schema: T,
  schemaName: string,
): Promise<GenerateStructuredResult<z.infer<T>>> {
  const completion = await provider.client.chat.completions.parse({
    model: provider.model,
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: sanitized },
    ],
    response_format: zodResponseFormat(schema, schemaName),
    temperature: 0.3,
    max_tokens: 2000,
  });

  const message = completion.choices[0]?.message;
  const tokensUsed = completion.usage?.total_tokens ?? 0;

  if (message?.refusal) {
    return {
      data: null,
      error: message.refusal,
      tokensUsed,
      modelUsed: provider.label,
      usedFallback: provider.kind === "backup",
    };
  }

  const parsed = message?.parsed;
  if (!parsed) {
    return {
      data: null,
      error: "No structured output returned",
      tokensUsed,
      modelUsed: provider.label,
      usedFallback: provider.kind === "backup",
    };
  }

  return {
    data: parsed as z.infer<T>,
    error: null,
    tokensUsed,
    modelUsed: provider.label,
    usedFallback: provider.kind === "backup",
  };
}

export async function generateStructured<T extends z.ZodType>(
  userPrompt: string,
  schema: T,
  schemaName: string,
): Promise<GenerateStructuredResult<z.infer<T>>> {
  const providers = getAiProviders();
  if (providers.length === 0) {
    return {
      data: null,
      error: "IA no configurada (OPENAI_BASE_URL / OPENAI_API_KEY / OPENAI_BACKUP_API_KEY)",
      tokensUsed: 0,
      modelUsed: "",
      usedFallback: false,
    };
  }

  const sanitized = sanitizeInput(userPrompt);
  let lastFailure: GenerateStructuredResult<z.infer<T>> | null = null;

  for (const provider of providers) {
    try {
      const result = await parseWithProvider(provider, sanitized, schema, schemaName);
      if (!result.error && result.data != null) {
        return result;
      }
      lastFailure = result;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown AI error";
      lastFailure = {
        data: null,
        error: message,
        tokensUsed: 0,
        modelUsed: provider.label,
        usedFallback: provider.kind === "backup",
      };
    }
  }

  return (
    lastFailure ?? {
      data: null,
      error: "Unknown AI error",
      tokensUsed: 0,
      modelUsed: "",
      usedFallback: false,
    }
  );
}
