"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  validateBusinessFields,
  type BusinessAccountType,
  type FieldErrors,
} from "@/lib/business-registration";
import BusinessFields, {
  type BusinessFormValues,
} from "../business-fields";

/** Edit form on the business home — the same fields as registration,
 *  saved through PATCH /api/business-registration as the signed-in
 *  user (the row's own-row RLS update policy is the enforcement).
 *  Stored "looking for" entries that are not one of the fixed
 *  options came from the free-text box at registration; they are
 *  shown back in that box so nothing silently disappears. */
export default function BusinessEditForm({
  accountType,
  initial,
}: {
  accountType: BusinessAccountType;
  initial: BusinessFormValues;
}) {
  const router = useRouter();
  const [values, setValues] = useState<BusinessFormValues>(initial);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    setSaved(false);
    const local = validateBusinessFields(accountType, values);
    if (!local.ok) {
      setErrors(local.errors);
      return;
    }
    setErrors({});
    setSubmitting(true);
    let res: Response;
    try {
      res = await fetch("/api/business-registration", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
    } catch {
      setSubmitting(false);
      setFormError("Something went wrong. Please try again.");
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
    setSubmitting(false);
    setSaved(true);
    router.refresh();
  }

  return (
    <form
      onSubmit={onSubmit}
      style={{ display: "flex", flexDirection: "column", gap: 12 }}
    >
      <BusinessFields
        accountType={accountType}
        values={values}
        errors={errors}
        onChange={setValues}
      />
      {formError && <p style={{ color: "crimson" }}>{formError}</p>}
      {saved && <p style={{ color: "#4ade80" }}>Saved — your business profile is up to date.</p>}
      <button type="submit" disabled={submitting}>
        {submitting ? "Saving…" : "Save changes"}
      </button>
    </form>
  );
}
