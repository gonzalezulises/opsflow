import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

function isPublicPath(pathname: string): boolean {
  if (pathname === "/") return true;
  if (pathname.startsWith("/login")) return true;
  if (pathname.startsWith("/auth/callback")) return true;
  if (pathname.startsWith("/auth/confirm")) return true;
  // Route handlers validate their own admin secrets / env
  if (pathname.startsWith("/api/")) return true;
  return false;
}

function nextWithRequestId(request: NextRequest, requestId: string) {
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-request-id", requestId);
  const res = NextResponse.next({
    request: { headers: requestHeaders },
  });
  res.headers.set("x-request-id", requestId);
  return res;
}

export async function updateSession(request: NextRequest) {
  const requestId = globalThis.crypto.randomUUID();
  let supabaseResponse = nextWithRequestId(request, requestId);

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = nextWithRequestId(request, requestId);
          cookiesToSet.forEach(({ name, value, options: opts }) =>
            supabaseResponse.cookies.set(name, value, opts),
          );
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;
  if (!user && !isPublicPath(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", `${pathname}${request.nextUrl.search}`);
    const redirectResponse = NextResponse.redirect(url);
    redirectResponse.headers.set("x-request-id", requestId);
    return redirectResponse;
  }

  return supabaseResponse;
}
