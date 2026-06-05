/**
 * Platform-level operators (multi-tenant SaaS), separate from org roles.
 */
export function isStrictTenancy(): boolean {
  return process.env.OPSFLOW_STRICT_TENANCY === "true";
}

export function parsePlatformAdminEmails(): Set<string> {
  const raw = process.env.OPSFLOW_PLATFORM_ADMIN_EMAILS ?? "";
  return new Set(
    raw
      .split(",")
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean),
  );
}

export function isPlatformAdminEmail(email: string): boolean {
  return parsePlatformAdminEmails().has(email.toLowerCase());
}
