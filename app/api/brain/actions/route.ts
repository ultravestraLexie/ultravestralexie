import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

/* Brain action log (owner directive: "Maintain a record of
 * important automated actions"). Every command the Brain routes
 * and every action it takes is written here, per user, and the
 * Brain page reads the log back — the record is real or it
 * doesn't exist. */

const ActionSchema = z.object({
  action: z.string().trim().min(1).max(80),
  detail: z.string().trim().max(300).default(""),
});

export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const parsed = ActionSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Bad request" }, { status: 400 });

  const { error } = await supabase
    .from("brain_actions")
    .insert({ user_id: user.id, action: parsed.data.action, detail: parsed.data.detail });
  if (error) return NextResponse.json({ error: "Could not write the log." }, { status: 500 });
  return NextResponse.json({ ok: true });
}
