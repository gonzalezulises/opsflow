import { z } from "zod";
import { zodResponseFormat } from "openai/helpers/zod";
import { getOpenAIClient, getModel } from "./client";
import { SYSTEM_PROMPT } from "./prompts";

const MAX_INPUT_LENGTH = 10000;

function sanitizeInput(input: string): string {
  return input
    .replace(/\{?\{?system\}?\}?/gi, "")
    .replace(/\{?\{?ignore\}?\}?/gi, "")
    .replace(/\bignore previous instructions\b/gi, "")
    .slice(0, MAX_INPUT_LENGTH);
}

export async function generateStructured<T extends z.ZodType>(
  userPrompt: string,
  schema: T,
  schemaName: string
): Promise<{ data: z.infer<T> | null; error: string | null; tokensUsed: number }> {
  try {
    const client = getOpenAIClient();
    const sanitized = sanitizeInput(userPrompt);

    const completion = await client.chat.completions.parse({
      model: getModel(),
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
      return { data: null, error: message.refusal, tokensUsed };
    }

    const parsed = message?.parsed;
    if (!parsed) {
      return { data: null, error: "No structured output returned", tokensUsed };
    }

    return { data: parsed as z.infer<T>, error: null, tokensUsed };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown AI error";
    return { data: null, error: message, tokensUsed: 0 };
  }
}
