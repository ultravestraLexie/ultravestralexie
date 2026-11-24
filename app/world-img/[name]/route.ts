import { B64 as TODAY } from "@/lib/worlds/today";
import { B64 as BRANDS } from "@/lib/worlds/brands";
import { B64 as DEALS } from "@/lib/worlds/deals";
import { B64 as STUDIO } from "@/lib/worlds/studio";
import { B64 as MONEY } from "@/lib/worlds/money";
import { B64 as PASSPORT } from "@/lib/worlds/passport";

/* The six Galaxy world photos ship as base64 strings (lib/worlds/*)
 * because the repo push route is text-only. This handler decodes and
 * serves them as JPEGs with long-lived cache headers — after the
 * first load the browser keeps each world for a year. */

const WORLDS: Record<string, string> = {
  today: TODAY,
  brands: BRANDS,
  deals: DEALS,
  studio: STUDIO,
  money: MONEY,
  passport: PASSPORT,
};

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ name: string }> }
) {
  const { name } = await params;
  const b64 = WORLDS[name];
  if (!b64) return new Response("Not found", { status: 404 });
  const bytes = Buffer.from(b64, "base64");
  return new Response(bytes, {
    headers: {
      "Content-Type": "image/jpeg",
      "Content-Length": String(bytes.length),
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
