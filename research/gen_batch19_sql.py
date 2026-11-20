#!/usr/bin/env python3
"""Generate batch19-load.sql from batch19-{bq,br,bs,bt}.json, mirroring batch1-load.sql conventions.
Adds commission_cap / creator_saturation into affiliate commission_notes."""
import json, re
from urllib.parse import urlparse

FILES = ["batch19-bq.json", "batch19-br.json", "batch19-bs.json", "batch19-bt.json"]

def q(v):
    if v is None:
        return "null"
    if isinstance(v, (int, float)):
        return str(v)
    return "'" + str(v).replace("'", "''") + "'"

ALLOWED_CT = {"partnerships", "creator_application", "pr", "marketing", "general", "other"}

def norm_ct(raw, email, contact_url):
    ct = (raw or "general").strip()
    if ct in ALLOWED_CT:
        return ct
    low = ct.lower()
    if "pr" == low or "press" in low or low.startswith("pr_") or low.endswith("_pr") or "pr_email" in low:
        return "pr"
    if contact_url and not email:
        return "creator_application"
    if any(k in low for k in ("affiliate", "partner", "collab", "ambassador", "creator")):
        return "partnerships"
    if "market" in low:
        return "marketing"
    return "general"

def domain(url):
    if not url:
        return ""
    d = urlparse(url).netloc.lower()
    return d[4:] if d.startswith("www.") else d

counts = {"brands": 0, "scores": 0, "evidence": 0, "contacts": 0, "opportunities": 0, "affiliates": 0, "socials": 0}
out = ["-- Ultra Vestra directory batch 19: 40 researched brands (2026-11-20).",
       "-- Filter focus: uncapped commissions + low creator saturation, every claim sourced.", ""]

for f in FILES:
    brands = json.load(open(f))
    for b in brands:
        counts["brands"] += 1
        lines = ["do $$", "declare bid uuid;", "begin"]
        lines.append(f"  insert into public.brands (name, website, description, country, status) values ({q(b['name'])}, {q(b.get('website'))}, {q(b.get('description'))}, {q(b.get('country'))}, 'published') returning id into bid;")
        lines.append(f"  insert into public.brand_categories (brand_id, category_id, is_primary) values (bid, (select id from public.categories where slug = {q(b['category_slug'])}), true);")
        bdom = domain(b.get("website"))
        seen_platforms = set()
        for s in b.get("socials") or []:
            url = s.get("url")
            if not url:
                continue
            plat = (s.get("platform") or "").lower()
            if plat in seen_platforms:
                continue  # brand_socials is unique on (brand_id, platform): keep the first/main handle
            seen_platforms.add(plat)
            handle = s.get("handle") or urlparse(url).path.rstrip("/").split("/")[-1].lstrip("@")
            lines.append(f"  insert into public.brand_socials (brand_id, platform, handle, url) values (bid, {q('x' if plat == 'twitter' else plat)}, {q(handle)}, {q(url)});")
            counts["socials"] += 1
        for c in b.get("contacts") or []:
            if not c.get("email") and not c.get("contact_url"):
                continue
            verified = domain(c.get("source_url")) and domain(c.get("source_url")) == bdom
            vs = "verified" if verified else "needs_review"
            lva = "now()" if verified else "null"
            lines.append(f"  insert into public.brand_contacts (brand_id, contact_type, email, contact_url, source_url, verification_status, last_verified_at) values (bid, {q(norm_ct(c.get('contact_type'), c.get('email'), c.get('contact_url')))}, {q(c.get('email'))}, {q(c.get('contact_url'))}, {q(c.get('source_url'))}, '{vs}', {lva});")
            counts["contacts"] += 1
        aff = b.get("affiliate") or {}
        if aff.get("network") or aff.get("commission_rate") is not None or aff.get("application_url") or aff.get("commission_cap"):
            notes_parts = []
            cap = aff.get("commission_cap")
            sat = aff.get("creator_saturation")
            if cap == "uncapped":
                notes_parts.append("Commission cap: UNCAPPED — stated in the program terms (see evidence).")
            elif cap == "capped":
                notes_parts.append("Commission cap: capped (see evidence).")
            elif cap:
                notes_parts.append("Commission cap: not stated in any published source found — needs review.")
            if sat:
                notes_parts.append(f"Creator saturation: {sat} (see evidence).")
            if aff.get("source_url"):
                notes_parts.append(f"Rate as reported by {aff['source_url']}.")
            notes = " ".join(notes_parts) or None
            lines.append(f"  insert into public.affiliate_programs (brand_id, network, commission_rate, commission_notes, application_url, status, last_checked_at) values (bid, {q(aff.get('network'))}, {q(aff.get('commission_rate'))}, {q(notes)}, {q(aff.get('application_url'))}, 'needs_review', now());")
            counts["affiliates"] += 1
        opp = b.get("opportunity")
        if opp and opp.get("title"):
            status = opp.get("status") or "unverified"
            lines.append(f"  insert into public.opportunities (brand_id, title, application_url, source_url, status, opportunity_type) values (bid, {q(opp.get('title'))}, {q(opp.get('application_url'))}, {q(opp.get('source_url'))}, {q(status)}, 'ugc');")
            counts["opportunities"] += 1
        for e in b.get("evidence") or []:
            lines.append(f"  insert into public.brand_evidence (brand_id, source_url, source_type, evidence_type, evidence_summary, confidence, last_checked_at) values (bid, {q(e.get('source_url'))}, {q(e.get('source_type'))}, {q(e.get('evidence_type'))}, {q(e.get('summary'))}, {q(e.get('confidence'))}, now());")
            counts["evidence"] += 1
        s = b.get("score") or {}
        reasons = json.dumps(s.get("reasons") or {}, ensure_ascii=True)
        lines.append(f"  insert into public.brand_scores (brand_id, niche_fit, ugc_evidence, compensation, contact_access, opportunity_availability, credibility, explanation) values (bid, {q(s.get('niche_fit'))}, {q(s.get('ugc_evidence'))}, {q(s.get('compensation'))}, {q(s.get('contact_access'))}, {q(s.get('opportunity_availability'))}, {q(s.get('credibility'))}, {q(reasons)}::jsonb);")
        counts["scores"] += 1
        lines.append("end $$;")
        lines.append("")
        out.extend(lines)

open("batch19-load.sql", "w").write("\n".join(out))
print(counts)
