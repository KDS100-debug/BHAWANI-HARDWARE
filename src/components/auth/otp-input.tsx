"use client";

import { type ClipboardEvent, type KeyboardEvent, useRef } from "react";

export function OtpInput({ value, onChange, disabled = false }: { value: string; onChange: (value: string) => void; disabled?: boolean }) {
  const refs = useRef<Array<HTMLInputElement | null>>([]);
  const digits = Array.from({ length: 6 }, (_, index) => value[index] ?? "");

  function setDigit(index: number, next: string) {
    const digit = next.replace(/\D/g, "").slice(-1);
    const values = [...digits];
    values[index] = digit;
    onChange(values.join("").slice(0, 6));
    if (digit && index < 5) refs.current[index + 1]?.focus();
  }

  function handleKeyDown(index: number, event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Backspace" && !digits[index] && index > 0) refs.current[index - 1]?.focus();
    if (event.key === "ArrowLeft" && index > 0) refs.current[index - 1]?.focus();
    if (event.key === "ArrowRight" && index < 5) refs.current[index + 1]?.focus();
  }

  function handlePaste(event: ClipboardEvent<HTMLDivElement>) {
    const pasted = event.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!pasted) return;
    event.preventDefault();
    onChange(pasted);
    refs.current[Math.min(pasted.length, 6) - 1]?.focus();
  }

  return (
    <div className="otp-inputs" role="group" aria-label="Six digit OTP" onPaste={handlePaste}>
      {digits.map((digit, index) => (
        <input
          aria-label={`OTP digit ${index + 1}`}
          autoComplete={index === 0 ? "one-time-code" : "off"}
          disabled={disabled}
          inputMode="numeric"
          key={index}
          maxLength={1}
          onChange={(event) => setDigit(index, event.target.value)}
          onFocus={(event) => event.currentTarget.select()}
          onKeyDown={(event) => handleKeyDown(index, event)}
          pattern="[0-9]"
          ref={(element) => { refs.current[index] = element; }}
          value={digit}
        />
      ))}
    </div>
  );
}
