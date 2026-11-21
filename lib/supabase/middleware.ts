import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/** Refreshes the Supabase auth session on every request so server
 *  components and route handlers always see a valid user. Standard
 *  @supabase/ssr middleware pattern: cookies are read from the request
 *  and written to both the request and the response. */
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Root cause of MIDDLEWARE_INVOCATION_FAILED: this middleware runs on
  // every route, and it used to throw in two situations — (1) the Supabase
  // env vars missing from the deployment, which made createServerClient
  // throw, and (2) the auth endpoint being briefly unreachable, which made
  // getUser() reject. Either one took the whole site down with a
  // middleware invocation error. The fix keeps the security model intact:
  // session refresh is best-effort here because every page and API route
  // still enforces auth itself (server-side getUser + database RLS). If
  // refresh is skipped for one request, the worst case is a stale session
  // cookie — never open data.
  if (!url || !anonKey) {
    console.error("middleware: Supabase env vars missing — session refresh skipped for this request");
    return supabaseResponse;
  }

  const supabase = createServerClient(
    url,
    anonKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(
          cookiesToSet: { name: string; value: string; options: CookieOptions }[]
        ) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // IMPORTANT: getUser() revalidates the session with Supabase Auth and
  // triggers the cookie refresh above. Do not remove it. It is wrapped so
  // a transient auth-service failure degrades to "no refresh this
  // request" instead of failing the middleware invocation site-wide.
  try {
    await supabase.auth.getUser();
  } catch (err) {
    console.error("middleware: session refresh failed, continuing without it", err);
  }

  return supabaseResponse;
}
