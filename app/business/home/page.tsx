import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  ACCOUNT_TYPE_LABELS,
  LOOKING_FOR_OPTIONS,
  isBusinessAccountType,
} from "@/lib/business-registration";
import BusinessEditForm from "./edit-form";
import MarketStrip from "./MarketStrip";
import type { BusinessFormValues } from "../business-fields";

export const dynamic = "force-dynamic";

/** Business home — where a registered Brand / Agency account lands.
 *
 *  Self-guarded (the route is deliberately NOT in the subscription
 *  gate's GATED_PREFIXES — business accounts hold no subscription):
 *    - no session            → /login?next=/business/home
 *    - creator account       → /today (their app; the gate there
 *                              applies as usual)
 *    - brand / agency        → this page
 *  The page shows the registration exactly as recorded, an edit
 *  form for the same fields, and an honest status block. Since
 *  2026-11-24 the page also carries the local-gigs preview tools
 *  (Campaigns / Creators / Customers, on-device with sample data);
 *  the status block says exactly what those are and are not — no
 *  live matching and no messaging is promised, because none is
 *  live. */

type BusinessProfileRow = {
  account_type: string;
  company_name: string;
  website: string;
  contact_name: string;
  contact_email: string;
  category: string;
  city: string;
  country: string;
  company_size: string;
  looking_for: string[] | null;
  description: string | null;
};

const cardStyle: React.CSSProperties = {
  border: "1px solid #3d2a6e",
  background: "#1b123d",
  borderRadius: 12,
  padding: 22,
  marginTop: 24,
};

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt style={{ color: "#b3a6e0", fontSize: 13 }}>{label}</dt>
      <dd style={{ margin: "2px 0 0", fontWeight: 600 }}>{value}</dd>
    </div>
  );
}

export default async function BusinessHomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect(`/login?next=${encodeURIComponent("/business/home")}`);
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("account_type")
    .eq("id", user.id)
    .maybeSingle();
  const accountType = (profile as { account_type?: string } | null)
    ?.account_type;
  if (!isBusinessAccountType(accountType)) {
    // A creator (or a profile read that predates the migration)
    // belongs in the creator app, not here.
    redirect("/today");
  }

  const { data: business } = await supabase
    .from("business_profiles")
    .select(
      "account_type, company_name, website, contact_name, contact_email, category, city, country, company_size, looking_for, description"
    )
    .eq("user_id", user.id)
    .maybeSingle();
  const row = business as BusinessProfileRow | null;

  const storedLookingFor = row?.looking_for ?? [];
  const allowedOptions = LOOKING_FOR_OPTIONS[accountType];
  const initial: BusinessFormValues = {
    companyName: row?.company_name ?? "",
    website: row?.website ?? "",
    contactName: row?.contact_name ?? "",
    category: row?.category ?? "",
    city: row?.city ?? "",
    country: row?.country ?? "",
    companySize: row?.company_size ?? "",
    lookingFor: storedLookingFor.filter((s) => allowedOptions.includes(s)),
    lookingForFreeText: storedLookingFor
      .filter((s) => !allowedOptions.includes(s))
      .join(", "),
    description: row?.description ?? "",
  };

  return (
    <div style={{ maxWidth: 640, margin: "0 auto" }}>
      <p
        style={{
          display: "inline-block",
          background: "#2e1a5e",
          color: "#c084fc",
          borderRadius: 999,
          padding: "4px 14px",
          fontSize: 13,
          fontWeight: 700,
          letterSpacing: 2,
          margin: 0,
        }}
      >
        {ACCOUNT_TYPE_LABELS[accountType].toUpperCase()}
      </p>
      <h1 style={{ marginBottom: 4 }}>
        {row?.company_name ?? "Your business"}
      </h1>
      <p style={{ color: "#ddd0ff", marginTop: 0 }}>
        Signed in as {row?.contact_email ?? user.email}
      </p>

      <section style={cardStyle}>
        <h2 style={{ marginTop: 0 }}>Your registration</h2>
        {row ? (
          <dl
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: 14,
              margin: 0,
            }}
          >
            <Fact label="Company" value={row.company_name} />
            <Fact label="Website" value={row.website} />
            <Fact label="Contact person" value={row.contact_name} />
            <Fact label="Category" value={row.category} />
            <Fact
              label="Location"
              value={`${row.city}, ${row.country}`}
            />
            <Fact label="Company size" value={`${row.company_size} people`} />
            <Fact
              label="Looking for"
              value={storedLookingFor.join(" · ") || "—"}
            />
            <Fact label="Description" value={row.description || "—"} />
          </dl>
        ) : (
          <p>
            Your business profile row is missing. Please contact
            support so we can complete your registration.
          </p>
        )}
        <p style={{ color: "#b3a6e0", fontSize: 14, marginBottom: 0 }}>
          This information is exactly what you entered — stated by
          you, not verified by UltraVestra.
        </p>
      </section>

      <MarketStrip />

      <section style={cardStyle}>
        <h2 style={{ marginTop: 0 }}>Where things stand</h2>
        <p>
          Your registration is recorded — your business is on file
          with UltraVestra as a{" "}
          {accountType === "brand" ? "brand" : "agency"}.
        </p>
        <p>
          New from this page: Campaigns, Creators and Customers.
          They are an on-device preview of the local-gigs tools,
          running on sample data stored only in this browser — post
          an opportunity, invite creators and draft customer
          follow-ups to see exactly how they work.
        </p>
        <p style={{ marginBottom: 0 }}>
          What is not live, so not promised here: nothing in the
          preview is matched with real creators, no application or
          invite reaches a real person, and no messages are sent.
          Today, creators discover brands through the UltraVestra
          brand directory inside the creator app, and business
          accounts don&rsquo;t get creator-app access. When the live
          tools open up, this page is where they will appear.
        </p>
      </section>

      {row && (
        <section style={cardStyle}>
          <h2 style={{ marginTop: 0 }}>Edit your business profile</h2>
          <BusinessEditForm accountType={accountType} initial={initial} />
        </section>
      )}
    </div>
  );
}
