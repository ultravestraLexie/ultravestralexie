/** Business registration — Brand & Agency accounts (v1, 2026-11-24).
 *
 *  The owner's order: "business registration system with two account
 *  types: Brand account, Agency account." This module is the pure,
 *  shared source of truth for that system: the account-type
 *  vocabulary, the fixed option lists the form offers, and the
 *  validation every write path runs (the register API route, the
 *  profile-edit API route, and — for instant feedback — the form
 *  itself). It imports nothing server-side so fixtures and client
 *  components can use it directly.
 *
 *  ACCOUNT MODEL: public.profiles.account_type is the authority —
 *  'creator' (every pre-existing account; the column defaults to it),
 *  'brand', or 'agency'. The business facts themselves live in
 *  public.business_profiles (see
 *  supabase/migrations/2026-11-24-business-accounts.sql). Business
 *  accounts are FREE in v1: no Stripe object, no checkout, no row in
 *  public.subscriptions — so the subscription gate never admits
 *  them to the creator app, and the middleware + business home route
 *  them to /business/home instead.
 *
 *  HONESTY RULES (binding):
 *  - Every value is business-entered. Nothing is verified, synced or
 *    inferred, and the UI says so.
 *  - Validation never invents a value: an invalid field is an error,
 *    never a silent default. The only normalization is trimming,
 *    email lower-casing, and adding https:// to a bare-domain
 *    website the registrant typed without a scheme. */

export const ACCOUNT_TYPES = ["creator", "brand", "agency"] as const;
export type AccountType = (typeof ACCOUNT_TYPES)[number];

export const BUSINESS_ACCOUNT_TYPES = ["brand", "agency"] as const;
export type BusinessAccountType = (typeof BUSINESS_ACCOUNT_TYPES)[number];

export function isBusinessAccountType(
  value: unknown
): value is BusinessAccountType {
  return value === "brand" || value === "agency";
}

/** Resolve a profiles.account_type value (possibly null/garbage from
 *  a pre-migration read) to the vocabulary. Anything that is not a
 *  business type is a creator — the safe direction: creators keep
 *  exactly the access they have always had. */
export function resolveAccountType(value: unknown): AccountType {
  return isBusinessAccountType(value) ? value : "creator";
}

/** Resolve a ?type= link parameter (the landing page's role cards
 *  link to /business/register?type=brand|agency) to a Step-1
 *  preselection. Only an exact business type preselects; anything
 *  else — absent, "creator", garbage, a repeated parameter — means
 *  no preselect and the current behavior stands. */
export function businessTypeFromParam(
  value: unknown
): BusinessAccountType | null {
  return isBusinessAccountType(value) ? value : null;
}

export const ACCOUNT_TYPE_LABELS: Record<BusinessAccountType, string> = {
  brand: "Brand account",
  agency: "Agency account",
};

export const ACCOUNT_TYPE_BLURBS: Record<BusinessAccountType, string> = {
  brand:
    "For a company that sells products or services and wants to work with creators.",
  agency:
    "For a company that represents creators or runs campaigns for brand clients.",
};

/** Fixed business-category list offered at registration. Kept broad
 *  and short on purpose — the registrant picks the closest fit. */
export const BUSINESS_CATEGORIES = [
  "Beauty & Skincare",
  "Fashion & Apparel",
  "Health & Wellness",
  "Food & Beverage",
  "Fitness & Sports",
  "Home & Living",
  "Tech & Gadgets",
  "Pets",
  "Travel & Hospitality",
  "Entertainment & Media",
  "Finance & Business Services",
  "Other",
] as const;

export const COMPANY_SIZE_BANDS = [
  "Just me (1)",
  "2–10",
  "11–50",
  "51–200",
  "201–1,000",
  "1,000+",
] as const;

/** "What are you looking for?" — fixed options per account type. A
 *  free-text entry is also accepted and stored alongside the picked
 *  options (see validateBusinessFields). */
export const LOOKING_FOR_OPTIONS: Record<BusinessAccountType, string[]> = {
  brand: [
    "Creators for a campaign",
    "Product launch promotion",
    "Ongoing UGC content",
    "Affiliate / commission program",
    "Brand awareness",
  ],
  agency: [
    "Creators to represent",
    "Brand clients",
    "Campaign partners",
    "Growing our creator roster",
  ],
};

export const DESCRIPTION_MAX_LENGTH = 280;
/** Same floor as the creator pay-first sign-up (Supabase's own
 *  6-character default, kept identical in app/api/auth/signup). */
export const BUSINESS_PASSWORD_MIN_LENGTH = 6;

export type BusinessFields = {
  companyName: string;
  website: string;
  contactName: string;
  category: string;
  city: string;
  country: string;
  companySize: string;
  lookingFor: string[];
  description: string;
};

export type BusinessFieldsInput = {
  companyName?: unknown;
  website?: unknown;
  contactName?: unknown;
  category?: unknown;
  city?: unknown;
  country?: unknown;
  companySize?: unknown;
  lookingFor?: unknown;
  lookingForFreeText?: unknown;
  description?: unknown;
};

export type FieldErrors = Partial<Record<string, string>>;

function asTrimmedString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

/** Minimal email shape: something@something.tld, no whitespace —
 *  the same standard as lib/pay-first.ts's isValidEmailShape. */
export function isValidWorkEmailShape(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

/** Normalize a registrant-typed website to a stored URL. A bare
 *  domain ("acme.com") gains https://; an explicit http:// or
 *  https:// is kept as typed. Returns null when the value cannot be
 *  a website at all (no dot in the host, spaces, bad scheme). */
export function normalizeWebsite(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed || /\s/.test(trimmed)) return null;
  const withScheme = /^https?:\/\//i.test(trimmed)
    ? trimmed
    : `https://${trimmed}`;
  let url: URL;
  try {
    url = new URL(withScheme);
  } catch {
    return null;
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") return null;
  if (!url.hostname.includes(".")) return null;
  return withScheme;
}

/** Validate the business fields shared by registration and the
 *  business-home edit form. On success returns the normalized
 *  values to store; on failure, one plain-language error per bad
 *  field. `accountType` decides which looking-for option list the
 *  picks are checked against (free-text entries always pass). */
export function validateBusinessFields(
  accountType: BusinessAccountType,
  input: BusinessFieldsInput
): { ok: true; value: BusinessFields } | { ok: false; errors: FieldErrors } {
  const errors: FieldErrors = {};

  const companyName = asTrimmedString(input.companyName);
  if (!companyName) errors.companyName = "Company name is required.";

  const websiteRaw = asTrimmedString(input.website);
  let website = "";
  if (!websiteRaw) {
    errors.website = "Website is required.";
  } else {
    const normalized = normalizeWebsite(websiteRaw);
    if (!normalized) {
      errors.website = "Enter a website like acme.com or https://acme.com.";
    } else {
      website = normalized;
    }
  }

  const contactName = asTrimmedString(input.contactName);
  if (!contactName) errors.contactName = "Contact person's name is required.";

  const category = asTrimmedString(input.category);
  if (!category) {
    errors.category = "Choose a business category.";
  } else if (!(BUSINESS_CATEGORIES as readonly string[]).includes(category)) {
    errors.category = "Choose a business category from the list.";
  }

  const city = asTrimmedString(input.city);
  if (!city) errors.city = "City is required.";
  const country = asTrimmedString(input.country);
  if (!country) errors.country = "Country is required.";

  const companySize = asTrimmedString(input.companySize);
  if (!companySize) {
    errors.companySize = "Choose a company size.";
  } else if (!(COMPANY_SIZE_BANDS as readonly string[]).includes(companySize)) {
    errors.companySize = "Choose a company size from the list.";
  }

  const picked: string[] = Array.isArray(input.lookingFor)
    ? input.lookingFor
        .filter((v): v is string => typeof v === "string")
        .map((v) => v.trim())
        .filter(Boolean)
    : [];
  const allowed = LOOKING_FOR_OPTIONS[accountType];
  const badPick = picked.find((p) => !allowed.includes(p));
  if (badPick) {
    errors.lookingFor = "Choose from the options for your account type.";
  }
  const freeText = asTrimmedString(input.lookingForFreeText);
  const lookingFor = [...new Set([...picked, ...(freeText ? [freeText] : [])])];
  if (!errors.lookingFor && lookingFor.length === 0) {
    errors.lookingFor = "Pick at least one, or tell us in your own words.";
  }

  const description = asTrimmedString(input.description);
  if (description.length > DESCRIPTION_MAX_LENGTH) {
    errors.description = `Keep the description to ${DESCRIPTION_MAX_LENGTH} characters or fewer.`;
  }

  if (Object.keys(errors).length > 0) return { ok: false, errors };
  return {
    ok: true,
    value: {
      companyName,
      website,
      contactName,
      category,
      city,
      country,
      companySize,
      lookingFor,
      description,
    },
  };
}

export type BusinessRegistrationInput = BusinessFieldsInput & {
  accountType?: unknown;
  workEmail?: unknown;
  password?: unknown;
};

export type BusinessRegistration = BusinessFields & {
  accountType: BusinessAccountType;
  workEmail: string;
  password: string;
};

/** Full registration validation (step 1 account type + step 2 form +
 *  the auth credentials). The password is validated for length only
 *  and passed through untouched — it is never stored by this app,
 *  only handed to Supabase Auth. */
export function validateBusinessRegistration(
  input: BusinessRegistrationInput
): { ok: true; value: BusinessRegistration } | { ok: false; errors: FieldErrors } {
  const errors: FieldErrors = {};

  if (!isBusinessAccountType(input.accountType)) {
    errors.accountType = "Choose a Brand account or an Agency account.";
  }

  const workEmail = asTrimmedString(input.workEmail).toLowerCase();
  if (!workEmail) {
    errors.workEmail = "Work email is required.";
  } else if (!isValidWorkEmailShape(workEmail)) {
    errors.workEmail = "Enter a valid work email.";
  }

  const password = typeof input.password === "string" ? input.password : "";
  if (password.length < BUSINESS_PASSWORD_MIN_LENGTH) {
    errors.password = `Password must be at least ${BUSINESS_PASSWORD_MIN_LENGTH} characters.`;
  }

  if (!isBusinessAccountType(input.accountType)) {
    return { ok: false, errors };
  }
  const fields = validateBusinessFields(input.accountType, input);
  if (!fields.ok) {
    return { ok: false, errors: { ...errors, ...fields.errors } };
  }
  if (Object.keys(errors).length > 0) return { ok: false, errors };
  return {
    ok: true,
    value: {
      accountType: input.accountType,
      workEmail,
      password,
      ...fields.value,
    },
  };
}
