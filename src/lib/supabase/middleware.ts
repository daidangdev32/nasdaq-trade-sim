import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Refreshes the Supabase session cookie on every request and exposes the
 * current user on `response`. Called from `src/middleware.ts`.
 */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request: { headers: request.headers } });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({ name, value, ...options });
          response = NextResponse.next({ request: { headers: request.headers } });
          response.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({ name, value: "", ...options });
          response = NextResponse.next({ request: { headers: request.headers } });
          response.cookies.set({ name, value: "", ...options });
        },
      },
    },
  );

  // IMPORTANT: this getUser() call refreshes the cookie if needed. Don't remove it.
  const { data } = await supabase.auth.getUser();

  // Gate /dashboard behind auth.
  const url = request.nextUrl;
  const isDashboard = url.pathname.startsWith("/dashboard");
  const isAuth = url.pathname.startsWith("/auth");

  if (isDashboard && !data.user) {
    const redirect = url.clone();
    redirect.pathname = "/auth/login";
    redirect.searchParams.set("next", url.pathname);
    return NextResponse.redirect(redirect);
  }

  if (isAuth && data.user && (url.pathname === "/auth/login" || url.pathname === "/auth/signup")) {
    const redirect = url.clone();
    redirect.pathname = "/dashboard";
    redirect.search = "";
    return NextResponse.redirect(redirect);
  }

  return response;
}
