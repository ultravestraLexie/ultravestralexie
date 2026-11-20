import Stripe from "stripe";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/** Server-side Stripe client. The secret key lives only in the
 *  STRIPE_SECRET_KEY environment variable — never in the repo. */
export function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY is not set");
  return new Stripe(key);
}

/** Supabase client with the service-role key, for webhook writes that
 *  must bypass RLS (subscriptions / payment_events are backend-write
 *  only by policy). Server-side only — never expose to the browser. */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey)
    throw new Error("Supabase admin environment is not set");
  return createSupabaseClient(url, serviceKey, {
    auth: { persistSession: false },
  });
}
