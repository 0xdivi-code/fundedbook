import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { SUPABASE_ANON_KEY, SUPABASE_URL } from "@/lib/supabase/env";

/**
 * Next.js 16 proxy (formerly `middleware.ts`).
 *
 * 1. Refreshes the Supabase auth session cookie on every request.
 * 2. Optimistic route protection: unauthenticated visitors are redirected to
 *    /login, signed-in users are bounced away from /login and /signup.
 *
 * NOTE: Supabase must be configured (see SUPABASE_SETUP.md). When the env
 * vars are missing we pass through so the app can render a setup hint
 * instead of crashing.
 */

const AUTH_PAGES = ["/login", "/signup"];
const PUBLIC_PAGES = ["/auth/confirm"];

export async function proxy(request: NextRequest) {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    return NextResponse.next();
  }

  let response = NextResponse.next({ request });

  const supabase = createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value)
        );
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options)
        );
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  const isAuthPage = AUTH_PAGES.some((p) => pathname.startsWith(p));
  const isPublicPage = PUBLIC_PAGES.some((p) => pathname.startsWith(p));

  if (!user && !isAuthPage && !isPublicPage) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  if (user && isAuthPage) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Run on everything except:
     *  - _next/static, _next/image (framework assets)
     *  - static files in /public (favicon, screenshots, images)
     *  - files with common static extensions
     */
    "/((?!_next/static|_next/image|favicon.ico|screenshots|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|txt|xml)$).*)",
  ],
};
