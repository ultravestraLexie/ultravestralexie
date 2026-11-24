"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  ACCOUNT_TYPE_BLURBS,
  ACCOUNT_TYPE_LABELS,
  BUSINESS_ACCOUNT_TYPES,
  validateBusinessRegistration,
  type BusinessAccountType,
  type FieldErrors,
} from "@/lib/business-registration";
import BusinessFields, {
  EMPTY_BUSINESS_FORM,
  type BusinessFormValues,
} from "../business-fields";

/** Business registration form — two steps.
 *
 *  Step 1: choose the account type (Brand or Agency — mutually
 *  exclusive cards). Step 2: the business form + work email +
 *  password. Submission posts to POST /api/business-registration,
 *  which creates the real Supabase auth account and both profile
 *  rows server-side; this form then signs in and lands the new
 *  business on /business/home.
 *
 *  Client-side validation runs the SAME pure module the API route
 *  runs (lib/business-registration.ts), so the errors a registrant
 *  sees here are the errors the server would return — and the
 *  server re-validates everything regardless. */
export default function RegisterForm({
  initialType = null,
}: {
  /** Preselection from the page's ?type= parameter (already
   *  resolved by lib/business-registration's businessTypeFromParam:
   *  an exact "brand"/"agency" or null). The registrant can still
   *  change it on Step 1 before continuing. */
  initialType?: BusinessAccountType | null;
}) {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);
  const [accountType, setAccountType] = useState<BusinessAccountType | null>(
    initialType
  );
  const [values, setValues] = useState<BusinessFormValues>(EMPTY_BUSINESS_FORM);
  const [workEmail, setWorkEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [accountExists, setAccountExists] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    setAccountExists(false);
    if (!accountType) return;

    const payload = {
      accountType,
      workEmail,
      password,
      ...values,
    };
    const local = validateBusinessRegistration(payload);
    if (!local.ok) {
      setErrors(local.errors);
      return;
    }
    setErrors({});
    setSubmitting(true);

    let res: Response;
    try {
      res = await fetch("/api/business-registration", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    } catch {
      setSubmitting(false);
      setFormError("Something went wrong. Please try again.");
      return;
    }
    if (res.status === 409) {
      setSubmitting(false);
      setAccountExists(true);
      setFormError(
        "An account with this email already exists. Log in instead."
      );
      return;
    }
    if (res.status === 429) {
      setSubmitting(false);
      setFormError("Too many attempts. Please wait a bit and try again.");
      return;
    }
    if (res.status === 400) {
      const data = (await res.json().catch(() => null)) as {
        fields?: FieldErrors;
      } | null;
      setSubmitting(false);
      if (data?.fields) setErrors(data.fields);
      setFormError("Please check the highlighted fields and try again.");
      return;
    }
    if (!res.ok) {
      setSubmitting(false);
      setFormError("Something went wrong. Please try again.");
      return;
    }

    const supabase = createClient();
    const { data, error: signInError } =
      await supabase.auth.signInWithPassword({
        email: workEmail.trim().toLowerCase(),
        password,
      });
    if (signInError || !data.session) {
      setSubmitting(false);
      setFormError(
        "Your account was created, but login failed. Please log in."
      );
      return;
    }
    router.push("/business/home");
    router.refresh();
  }

  if (step === 1) {
    return (
      <div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: 16,
          }}
        >
          {BUSINESS_ACCOUNT_TYPES.map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => setAccountType(type)}
              aria-pressed={accountType === type}
              style={{
                textAlign: "left",
                border:
                  accountType === type
                    ? "2px solid #a855f7"
                    : "1px solid #3d2a6e",
                background: "#1b123d",
                borderRadius: 12,
                padding: 22,
                cursor: "pointer",
                color: "inherit",
              }}
            >
              <span style={{ display: "block", fontSize: 20, fontWeight: 700 }}>
                {ACCOUNT_TYPE_LABELS[type]}
              </span>
              <span style={{ display: "block", marginTop: 8, color: "#ddd0ff" }}>
                {ACCOUNT_TYPE_BLURBS[type]}
              </span>
            </button>
          ))}
        </div>
        {errors.accountType && (
          <p style={{ color: "crimson" }}>{errors.accountType}</p>
        )}
        <button
          type="button"
          disabled={!accountType}
          onClick={() => setStep(2)}
          style={{ marginTop: 24 }}
        >
          Continue
        </button>
        <p style={{ marginTop: 16, color: "#b3a6e0", fontSize: 14 }}>
          Registration is free. A business account is separate from a
          creator account — creators join through{" "}
          <Link href="/pricing">Plans</Link> instead.
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={onSubmit}
      style={{ display: "flex", flexDirection: "column", gap: 12 }}
    >
      <p style={{ margin: 0 }}>
        <button type="button" onClick={() => setStep(1)}>
          ← Back
        </button>{" "}
        Registering a <strong>{ACCOUNT_TYPE_LABELS[accountType!]}</strong>
      </p>
      <label>
        Work email
        <input
          type="email"
          required
          autoComplete="email"
          value={workEmail}
          onChange={(e) => setWorkEmail(e.target.value)}
          style={{ width: "100%", marginTop: 6 }}
          placeholder="you@company.com"
        />
        {errors.workEmail && (
          <p style={{ color: "crimson", margin: "4px 0 0" }}>
            {errors.workEmail}
          </p>
        )}
      </label>
      <label>
        Password
        <input
          type="password"
          required
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={{ width: "100%", marginTop: 6 }}
          placeholder="Create a password (6+ characters)"
        />
        {errors.password && (
          <p style={{ color: "crimson", margin: "4px 0 0" }}>
            {errors.password}
          </p>
        )}
      </label>
      <BusinessFields
        accountType={accountType!}
        values={values}
        errors={errors}
        onChange={setValues}
      />
      {formError && <p style={{ color: "crimson" }}>{formError}</p>}
      {accountExists && (
        <p>
          <Link href="/login">Go to log in</Link>
        </p>
      )}
      <button type="submit" disabled={submitting}>
        {submitting ? "Registering…" : "Register your business"}
      </button>
      <p style={{ color: "#b3a6e0", fontSize: 14, margin: 0 }}>
        Everything you enter is your own stated information — it is
        shown back to you exactly as registered and is not verified
        by UltraVestra.
      </p>
    </form>
  );
}
