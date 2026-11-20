/** Shared types mirroring supabase/schema.sql (subset used by the MVP pages).
 *  Regenerate with `supabase gen types` later if desired. */

export interface Category {
  id: string;
  name: string;
  slug: string;
}

export interface Brand {
  id: string;
  name: string;
  website: string | null;
  description: string | null;
  country: string | null;
  logo_url: string | null;
  status: "researching" | "in_review" | "published" | "archived";
  created_at: string;
  updated_at: string;
}

export interface BrandContact {
  id: string;
  brand_id: string;
  contact_name: string | null;
  job_title: string | null;
  email: string | null;
  contact_url: string | null;
  contact_type: string | null;
  verification_status: string;
  source_url: string | null;
  last_verified_at: string | null;
}

export interface BrandEvidence {
  id: string;
  brand_id: string;
  source_url: string;
  source_type: string | null;
  evidence_type: string | null;
  evidence_summary: string | null;
  observed_at: string;
  last_checked_at: string | null;
  confidence: "verified" | "publicly_reported" | "needs_review" | "expired";
}

export interface BrandScore {
  id: string;
  brand_id: string;
  niche_fit: number; // /30
  ugc_evidence: number; // /20
  compensation: number; // /20
  contact_access: number; // /15
  opportunity_availability: number; // /10
  credibility: number; // /5
  total_score: number; // /100, generated column
  explanation: Record<string, string>;
  scored_at: string;
}

export interface CompensationReport {
  id: string;
  brand_id: string | null;
  content_type: string | null;
  amount: number | null;
  currency: string;
  payment_type: string | null;
  source_url: string | null;
  source_date: string | null;
  verified: boolean;
}

export interface Plan {
  id: string;
  name: string;
  slug: string;
  price_monthly: number;
  price_yearly: number | null;
  currency: string;
  features: string[];
  is_active: boolean;
}
