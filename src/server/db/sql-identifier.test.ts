import { describe, expect, it } from "vitest";
import { sql } from "drizzle-orm";
import { PgDialect } from "drizzle-orm/pg-core";

describe("PgDialect identifier escaping", () => {
  const dialect = new PgDialect();

  it("keeps an identifier with double quotes inside a single quoted name", () => {
    const query = dialect.sqlToQuery(
      sql`select * from ${sql.identifier('users"; drop table organizations; --')}`,
    );
    expect(query.sql).toBe('select * from "users""; drop table organizations; --"');
  });

  it("leaves a plain identifier unchanged", () => {
    expect(dialect.sqlToQuery(sql`${sql.identifier("organizations")}`).sql).toBe(
      '"organizations"',
    );
  });
});
