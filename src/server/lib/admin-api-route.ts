import { NextResponse } from "next/server";

/**
 * Protects dangerous admin-style API routes.
 * - Production: disabled unless OPSFLOW_ADMIN_API_SECRET is set; then requires matching header.
 * - Development: allowed unless OPSFLOW_ADMIN_API_SECRET is set (then header required).
 */
export function guardAdminApiRoute(request: Request): NextResponse | null {
  const secret = process.env.OPSFLOW_ADMIN_API_SECRET;
  const isProd = process.env.NODE_ENV === "production";

  if (isProd && !secret) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (secret) {
    const header = request.headers.get("x-opsflow-admin-secret");
    if (header !== secret) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  return null;
}
