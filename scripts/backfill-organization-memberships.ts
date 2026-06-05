/**
 * Backfill organization_members from users.organization_id (legacy).
 * Usage: npm run db:backfill-memberships
 */
import "dotenv/config";
import { drizzle } from "drizzle-orm/postgres-js";
import { and, eq, isNull, isNotNull } from "drizzle-orm";
import postgres from "postgres";
import * as schema from "../src/server/db/schema";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("DATABASE_URL is required");
  process.exit(1);
}

const client = postgres(connectionString, { prepare: false });
const db = drizzle(client, { schema });

async function main() {
  const usersWithOrg = await db
    .select({
      id: schema.users.id,
      organizationId: schema.users.organizationId,
      role: schema.users.role,
    })
    .from(schema.users)
    .where(and(isNull(schema.users.deletedAt), isNotNull(schema.users.organizationId)));

  let inserted = 0;
  for (const u of usersWithOrg) {
    if (!u.organizationId) continue;
    const [existing] = await db
      .select({ id: schema.organizationMembers.id })
      .from(schema.organizationMembers)
      .where(
        and(
          eq(schema.organizationMembers.userId, u.id),
          eq(schema.organizationMembers.organizationId, u.organizationId),
        ),
      )
      .limit(1);
    if (existing) continue;
    await db.insert(schema.organizationMembers).values({
      organizationId: u.organizationId,
      userId: u.id,
      role: u.role,
    });
    inserted += 1;
  }

  console.log(`Backfill complete. Inserted ${inserted} organization_members row(s).`);
  await client.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
