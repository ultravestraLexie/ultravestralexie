import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { HELP_CONFIG, KB } from "@/lib/galaxy/help";
import HelpShell, { ArticleRow, HIcon } from "../helpcenter/HelpUi";

export const dynamic = "force-dynamic";

/* TERMS AND POLICIES — behind Settings (Support & About package,
 * 2026-11-24). The list is the owner's legal protocol
 * (~/workspace/ultravestra-legal-protocol-2026-11-24.md, §2–§17)
 * as articles in lib/galaxy/help — the same corpus Ask Vestra
 * Help answers from. No legal text existed in the app before this
 * build; this page is its first home. */

export default async function TermsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const terms = KB.filter((a) => a.s === "terms");

  return (
    <HelpShell accountEmail={user.email ?? ""}>
      <div className="back-row">
        <Link className="icon-btn" href="/settings" aria-label="Back to Settings">
          <HIcon n="back" />
        </Link>
        <span style={{ font: "700 18px var(--h-display)" }}>Settings</span>
      </div>
      <h2 className="page-title">Terms and Policies</h2>
      <p className="page-sub">
        The rules that keep Ultra Vestra fair and safe for creators and
        brands.
      </p>
      <div className="group-label">Policies</div>
      <nav className="glass list" aria-label="Policies">
        {terms.map((a) => (
          <ArticleRow key={a.id} article={a} sub={a.d} icon="doc" />
        ))}
      </nav>
      <p className="ver">
        Effective {HELP_CONFIG.effectiveDate} · {HELP_CONFIG.company}
      </p>
    </HelpShell>
  );
}
