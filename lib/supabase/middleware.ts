import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { isGatedPath, SUBSCRIBED_STATUSES } from "@/lib/gate-paths";
import { isBusinessAccountType } from "@/lib/business-registration";

/** Refreshes the Supabase auth session on every request so server
 *  components and route handlers always see a valid user. Standard
 *  @supabase/ssr middleware pattern: cookies are read from the request
 *  and written to both the request and the response.
 *
 *  SUBSCRIPTION GATE: member routes (lib/gate-paths.ts GATED_PREFIXES)
 *  additionally require an active subscription. No session → /login
 *  with ?next= back to the requested page; session without an
 *  'active'/'trialing' row in public.subscriptions → /pricing. The
 *  gate fails CLOSED for gated routes (any check error = not
 *  subscribed) but never breaks public routes. Server components
 *  re-check via lib/gate.ts requireSubscription(), so the gate does
 *  not depend on this middleware alone. */

/** Build a gate response (redirect for pages, JSON for the suggest
 *  API), carrying over any refreshed session cookies. */
function gateResponse(
  request: NextRequest,
  supabaseResponse: NextResponse,
  dest: string | null,
  apiStatus?: number
) {
  const res =
    dest === null
      ? NextResponse.json({ brands: [], categories: [] }, { status: apiStatus ?? 401 })
      : NextResponse.redirect(new URL(dest, request.url));
  supabaseResponse.cookies.getAll().forEach((c) => res.cookies.set({ ...c }));
  return res;
}

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const { pathname } = request.nextUrl;
  const gated = isGatedPath(pathname);
  const isApi = pathname.startsWith("/api/");

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
    // Without env vars no session can be verified, so gated routes
    // fail closed to /login; public routes pass through untouched.
    if (gated) {
      const next = encodeURIComponent(pathname + request.nextUrl.search);
      return gateResponse(request, supabaseResponse, isApi ? null : `/login?next=${next}`, 401);
    }
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
  let user: { id: string } | null = null;
  try {
    const { data } = await supabase.auth.getUser();
    user = data.user;
  } catch (err) {
    console.error("middleware: session refresh failed, continuing without it", err);
  }

  if (!gated) return supabaseResponse;

  // --- Subscription gate (gated routes only) ---------------------------
  // Fail closed: no verified user, a failed subscription lookup, or no
  // active/trialing row all mean "not subscribed".
  const next = encodeURIComponent(pathname + request.nextUrl.search);
  if (!user) {
    return gateResponse(request, supabaseResponse, isApi ? null : `/login?next=${next}`, 401);
  }
  let subscribed = false;
  try {
    const { data } = await supabase
      .from("subscriptions")
      .select("id")
      .eq("user_id", user.id)
      .in("status", [...SUBSCRIBED_STATUSES])
      .limit(1);
    subscribed = (data?.length ?? 0) > 0;
  } catch (err) {
    console.error("middleware: subscription check failed, treating as not subscribed", err);
  }
  if (!subscribed) {
    if (isApi) {
      return gateResponse(request, supabaseResponse, null, 403);
    }
    // Business accounts (Brand / Agency) hold no subscription BY
    // DESIGN — they registered free and their home is
    // /business/home, not the creator pricing page. Send them
    // there instead. A failed lookup (or a pre-migration profile
    // without the column) reads as "not a business account", so
    // creators keep the exact /pricing behavior they have always
    // had; only an explicit brand/agency value takes this branch.
    let businessAccount = false;
    try {
      const { data } = await supabase
        .from("profiles")
        .select("account_type")
        .eq("id", user.id)
        .maybeSingle();
      businessAccount = isBusinessAccountType(
        (data as { account_type?: string } | null)?.account_type
      );
    } catch (err) {
      console.error("middleware: account-type check failed, treating as creator", err);
    }
    return gateResponse(
      request,
      supabaseResponse,
      businessAccount ? "/business/home" : "/pricing",
      403
    );
  }

  return supabaseResponse;
}
