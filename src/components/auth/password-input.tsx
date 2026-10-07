"use client";

import { Eye, EyeOff } from "lucide-react";
import { type ComponentProps, useId, useState } from "react";

type PasswordInputProps = Omit<ComponentProps<"input">, "type"> & {
  label: string;
  showRequirements?: boolean;
};

export function PasswordInput({ label, id, showRequirements = false, ...props }: PasswordInputProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const [visible, setVisible] = useState(false);

  return (
    <label htmlFor={inputId}>
      <span>{label}</span>
      <span className="password-control">
        <input {...props} id={inputId} type={visible ? "text" : "password"} />
        <button type="button" onClick={() => setVisible((value) => !value)} aria-label={visible ? `Hide ${label.toLowerCase()}` : `Show ${label.toLowerCase()}`}>
          {visible ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </span>
      {showRequirements && <small className="field-help">At least 8 characters with uppercase, lowercase and a number.</small>}
    </label>
  );
}
