"use client";

import { type ComponentProps, useId } from "react";

type PhoneInputProps = Omit<ComponentProps<"input">, "type" | "inputMode"> & {
  label?: string;
};

export function PhoneInput({ label = "Phone number", id, ...props }: PhoneInputProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  return (
    <label htmlFor={inputId}>
      <span>{label}</span>
      <span className="phone-control">
        <span className="country-prefix" aria-hidden="true">🇮🇳 +91</span>
        <input {...props} id={inputId} type="tel" inputMode="tel" autoComplete={props.autoComplete ?? "tel"} placeholder={props.placeholder ?? "98765 43210"} />
      </span>
      <small className="field-help">Indian mobile numbers are stored securely in +91 E.164 format.</small>
    </label>
  );
}
