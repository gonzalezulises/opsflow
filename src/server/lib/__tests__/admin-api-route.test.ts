import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { guardAdminApiRoute } from "../admin-api-route";

describe("guardAdminApiRoute", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.unstubAllEnvs();
  });

  it("returns 404 in production when OPSFLOW_ADMIN_API_SECRET is unset", () => {
    vi.stubEnv("NODE_ENV", "production");
    delete process.env.OPSFLOW_ADMIN_API_SECRET;

    const res = guardAdminApiRoute(new Request("http://localhost/api/seed"));
    expect(res?.status).toBe(404);
  });

  it("returns 401 in production when secret header mismatches", () => {
    vi.stubEnv("NODE_ENV", "production");
    process.env.OPSFLOW_ADMIN_API_SECRET = "correct";

    const res = guardAdminApiRoute(
      new Request("http://localhost/api/seed", {
        headers: { "x-opsflow-admin-secret": "wrong" },
      }),
    );
    expect(res?.status).toBe(401);
  });

  it("allows in production when secret matches", () => {
    vi.stubEnv("NODE_ENV", "production");
    process.env.OPSFLOW_ADMIN_API_SECRET = "correct";

    const res = guardAdminApiRoute(
      new Request("http://localhost/api/seed", {
        headers: { "x-opsflow-admin-secret": "correct" },
      }),
    );
    expect(res).toBeNull();
  });

  it("allows in development when OPSFLOW_ADMIN_API_SECRET is unset", () => {
    vi.stubEnv("NODE_ENV", "development");
    delete process.env.OPSFLOW_ADMIN_API_SECRET;

    expect(guardAdminApiRoute(new Request("http://localhost/api/seed"))).toBeNull();
  });
});
