import { eq } from "drizzle-orm";
import { db } from "@/server/db";
import { organizations } from "@/server/db/schema";
import { DEFAULT_ORG_ID } from "@/server/auth/constants";

/**
 * Ensures the default demo organization row exists (idempotent).
 * Used when bootstrapping the first app user and for legacy seeds.
 */
export async function getOrCreateDefaultOrg(): Promise<string> {
  const [existing] = await db
    .select({ id: organizations.id })
    .from(organizations)
    .where(eq(organizations.id, DEFAULT_ORG_ID));

  if (existing) return existing.id;

  const [created] = await db
    .insert(organizations)
    .values({
      id: DEFAULT_ORG_ID,
      name: "OpsFlow Demo",
      slug: "opsflow-demo",
    })
    .returning();

  return created.id;
}
