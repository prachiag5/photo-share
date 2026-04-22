// components/post/CaptionInput.tsx
"use client";

import { useId } from "react";

interface CaptionInputProps {
  value: string;
  onChange: (value: string) => void;
  maxLength?: number;
  placeholder?: string;
  disabled?: boolean;
  error?: string;
}

export function CaptionInput({
  value,
  onChange,
  maxLength = 2200,
  placeholder = "Write a caption…",
  disabled = false,
  error,
}: CaptionInputProps) {
  const id = useId();
  const remaining = maxLength - value.length;
  const isNearLimit = remaining <= 50;
  const isAtLimit   = remaining <= 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <label
        htmlFor={id}
        style={{
          fontSize: 13,
          fontWeight: 500,
          color: "var(--color-text-primary)",
        }}
      >
        Caption
      </label>

      <div style={{ position: "relative" }}>
        <textarea
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          maxLength={maxLength}
          placeholder={placeholder}
          disabled={disabled}
          rows={4}
          style={{
            width: "100%",
            padding: "11px 14px",
            borderRadius: 10,
            border: `1.5px solid ${
              error
                ? "var(--color-border-danger)"
                : "var(--color-border-secondary)"
            }`,
            background: disabled
              ? "var(--color-background-secondary)"
              : "var(--color-background-primary)",
            color: "var(--color-text-primary)",
            fontSize: 14,
            lineHeight: 1.6,
            fontFamily: "inherit",
            resize: "vertical",
            outline: "none",
            transition: "border-color 0.15s",
            boxSizing: "border-box",
            // Focus ring via CSS — avoids outline flicker from inline style
          }}
          onFocus={(e) => {
            e.target.style.borderColor = error
              ? "var(--color-border-danger)"
              : "var(--color-text-primary)";
          }}
          onBlur={(e) => {
            e.target.style.borderColor = error
              ? "var(--color-border-danger)"
              : "var(--color-border-secondary)";
          }}
          aria-describedby={error ? `${id}-error` : `${id}-count`}
          aria-invalid={!!error}
        />
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: 8,
        }}
      >
        {/* Error message */}
        {error ? (
          <p
            id={`${id}-error`}
            role="alert"
            style={{
              margin: 0,
              fontSize: 12,
              color: "var(--color-text-danger)",
              flex: 1,
            }}
          >
            {error}
          </p>
        ) : (
          <span style={{ flex: 1 }} />
        )}

        {/* Character counter — only shown near the limit */}
        {isNearLimit && (
          <p
            id={`${id}-count`}
            style={{
              margin: 0,
              fontSize: 12,
              fontVariantNumeric: "tabular-nums",
              color: isAtLimit
                ? "var(--color-text-danger)"
                : "var(--color-text-tertiary)",
              flexShrink: 0,
            }}
            aria-live="polite"
          >
            {remaining}
          </p>
        )}
      </div>
    </div>
  );
}