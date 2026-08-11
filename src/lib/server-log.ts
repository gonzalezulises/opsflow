import { headers } from "next/headers";

type LogLevel = "info" | "warn" | "error";

/**
 * One-line JSON logs for Vercel/hosting aggregators. Includes `requestId` when
 * the request was tagged by `src/lib/supabase/middleware.ts` (proxy).
 */
export async function logServerJson(
  level: LogLevel,
  event: string,
  fields: Record<string, unknown> = {},
): Promise<void> {
  let requestId: string | undefined;
  try {
    const h = await headers();
    requestId = h.get("x-request-id") ?? undefined;
  } catch {
    // Outside a request (e.g. seed script, one-off task)
  }

  const line = JSON.stringify({
    ts: new Date().toISOString(),
    level,
    event,
    ...(requestId ? { requestId } : {}),
    ...fields,
  });

  if (level === "error") {
    console.error(line);
  } else if (level === "warn") {
    console.warn(line);
  } else {
    console.log(line);
  }
}
