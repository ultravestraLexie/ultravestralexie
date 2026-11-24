"use client";

import {
  BUSINESS_CATEGORIES,
  COMPANY_SIZE_BANDS,
  DESCRIPTION_MAX_LENGTH,
  LOOKING_FOR_OPTIONS,
  type BusinessAccountType,
  type FieldErrors,
} from "@/lib/business-registration";

/** The step-2 business fields, shared by the registration form and
 *  the business-home edit form so both ask exactly the same
 *  questions and validate against the same lists
 *  (lib/business-registration.ts). Controlled: the parent owns the
 *  values and the server-returned field errors. */

export type BusinessFormValues = {
  companyName: string;
  website: string;
  contactName: string;
  category: string;
  city: string;
  country: string;
  companySize: string;
  lookingFor: string[];
  lookingForFreeText: string;
  description: string;
};

export const EMPTY_BUSINESS_FORM: BusinessFormValues = {
  companyName: "",
  website: "",
  contactName: "",
  category: "",
  city: "",
  country: "",
  companySize: "",
  lookingFor: [],
  lookingForFreeText: "",
  description: "",
};

const labelStyle: React.CSSProperties = { display: "block" };
const inputStyle: React.CSSProperties = { width: "100%", marginTop: 6 };
const errorStyle: React.CSSProperties = { color: "crimson", margin: "4px 0 0" };

export default function BusinessFields({
  accountType,
  values,
  errors,
  onChange,
}: {
  accountType: BusinessAccountType;
  values: BusinessFormValues;
  errors: FieldErrors;
  onChange: (values: BusinessFormValues) => void;
}) {
  const set = (patch: Partial<BusinessFormValues>) =>
    onChange({ ...values, ...patch });
  const toggleLookingFor = (option: string) =>
    set({
      lookingFor: values.lookingFor.includes(option)
        ? values.lookingFor.filter((o) => o !== option)
        : [...values.lookingFor, option],
    });

  return (
    <>
      <label style={labelStyle}>
        Company name
        <input
          type="text"
          required
          value={values.companyName}
          onChange={(e) => set({ companyName: e.target.value })}
          style={inputStyle}
          placeholder="Acme Inc."
        />
        {errors.companyName && <p style={errorStyle}>{errors.companyName}</p>}
      </label>
      <label style={labelStyle}>
        Website
        <input
          type="text"
          required
          value={values.website}
          onChange={(e) => set({ website: e.target.value })}
          style={inputStyle}
          placeholder="acme.com"
        />
        {errors.website && <p style={errorStyle}>{errors.website}</p>}
      </label>
      <label style={labelStyle}>
        Contact person — full name
        <input
          type="text"
          required
          autoComplete="name"
          value={values.contactName}
          onChange={(e) => set({ contactName: e.target.value })}
          style={inputStyle}
          placeholder="Your full name"
        />
        {errors.contactName && <p style={errorStyle}>{errors.contactName}</p>}
      </label>
      <label style={labelStyle}>
        Business category
        <select
          required
          value={values.category}
          onChange={(e) => set({ category: e.target.value })}
          style={inputStyle}
        >
          <option value="">Choose a category…</option>
          {BUSINESS_CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        {errors.category && <p style={errorStyle}>{errors.category}</p>}
      </label>
      <div style={{ display: "flex", gap: 12 }}>
        <label style={{ ...labelStyle, flex: 1 }}>
          City
          <input
            type="text"
            required
            value={values.city}
            onChange={(e) => set({ city: e.target.value })}
            style={inputStyle}
          />
          {errors.city && <p style={errorStyle}>{errors.city}</p>}
        </label>
        <label style={{ ...labelStyle, flex: 1 }}>
          Country
          <input
            type="text"
            required
            value={values.country}
            onChange={(e) => set({ country: e.target.value })}
            style={inputStyle}
          />
          {errors.country && <p style={errorStyle}>{errors.country}</p>}
        </label>
      </div>
      <label style={labelStyle}>
        Company size
        <select
          required
          value={values.companySize}
          onChange={(e) => set({ companySize: e.target.value })}
          style={inputStyle}
        >
          <option value="">Choose a size…</option>
          {COMPANY_SIZE_BANDS.map((s) => (
            <option key={s} value={s}>
              {s} people
            </option>
          ))}
        </select>
        {errors.companySize && <p style={errorStyle}>{errors.companySize}</p>}
      </label>
      <fieldset style={{ border: "1px solid #3d2a6e", borderRadius: 12, padding: 16 }}>
        <legend>What are you looking for?</legend>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {LOOKING_FOR_OPTIONS[accountType].map((option) => (
            <label key={option} style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <input
                type="checkbox"
                checked={values.lookingFor.includes(option)}
                onChange={() => toggleLookingFor(option)}
              />
              {option}
            </label>
          ))}
          <label style={labelStyle}>
            Something else? Tell us in your own words
            <input
              type="text"
              value={values.lookingForFreeText}
              onChange={(e) => set({ lookingForFreeText: e.target.value })}
              style={inputStyle}
              placeholder="Optional"
            />
          </label>
        </div>
        {errors.lookingFor && <p style={errorStyle}>{errors.lookingFor}</p>}
      </fieldset>
      <label style={labelStyle}>
        Short description ({DESCRIPTION_MAX_LENGTH} characters max)
        <textarea
          value={values.description}
          onChange={(e) => set({ description: e.target.value })}
          maxLength={DESCRIPTION_MAX_LENGTH + 20}
          rows={3}
          style={inputStyle}
          placeholder="What does your business do, in one or two sentences?"
        />
        <span style={{ fontSize: 13, color: "#b3a6e0" }}>
          {values.description.length}/{DESCRIPTION_MAX_LENGTH}
        </span>
        {errors.description && <p style={errorStyle}>{errors.description}</p>}
      </label>
    </>
  );
}
