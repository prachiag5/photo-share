"use client";

/**
 * ConfirmDialog
 *
 * A confirmation dialog built on top of <Modal>.
 * Does NOT re-implement portal, focus trap, or keyboard handling —
 * all of that is inherited from Modal.
 *
 * Two usage patterns:
 *
 * Pattern A — Controlled (JSX):
 *   <ConfirmDialog
 *     isOpen={isOpen}
 *     onClose={() => setIsOpen(false)}
 *     onConfirm={handleDelete}
 *     title="Delete post?"
 *     description="This cannot be undone."
 *     variant="danger"
 *   />
 *
 * Pattern B — Imperative (hook):
 *   const confirm = useConfirmDialog();
 *   const dialog = confirm.dialog; // render this in JSX
 *
 *   await confirm.open({
 *     title: "Delete post?",
 *     description: "This cannot be undone.",
 *     variant: "danger",
 *   });
 *   // resolves true if confirmed, false if cancelled
 */

import { useState, useCallback, useRef, type ReactNode } from "react";
import { Modal } from "./Modal";

// ─── Types ────────────────────────────────────────────────────────────────────

export type ConfirmVariant = "danger" | "warning" | "default";

export interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;

  /**
   * Called when user clicks the confirm button.
   * Can be async — loading spinner shown while it resolves.
   */
  onConfirm: () => void | Promise<void>;

  title: string;
  description?: ReactNode;

  /** Controls color of the confirm button */
  variant?: ConfirmVariant;

  /** Label for the confirm button. Defaults to "Confirm". */
  confirmLabel?: string;

  /** Label for the cancel button. Defaults to "Cancel". */
  cancelLabel?: string;

  /** Extra content (e.g. a warning note or input) rendered above the buttons */
  children?: ReactNode;
}

// ─── Variant styles ───────────────────────────────────────────────────────────

const CONFIRM_BTN_STYLES: Record<ConfirmVariant, React.CSSProperties> = {
  danger: {
    background: "var(--color-background-danger)",
    color: "var(--color-text-danger)",
    border: "1px solid var(--color-border-danger)",
  },
  warning: {
    background: "var(--color-background-warning)",
    color: "var(--color-text-warning)",
    border: "1px solid var(--color-border-warning)",
  },
  default: {
    background: "var(--color-text-primary)",
    color: "var(--color-background-primary)",
    border: "none",
  },
};

const VARIANT_ICONS: Record<ConfirmVariant, ReactNode> = {
  danger: (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden>
      <path
        d="M10 2L18.66 17H1.34L10 2z"
        stroke="var(--color-text-danger)"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path
        d="M10 8v4M10 14.5v.5"
        stroke="var(--color-text-danger)"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  ),
  warning: (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden>
      <circle cx="10" cy="10" r="8" stroke="var(--color-text-warning)" strokeWidth="1.5" />
      <path
        d="M10 6v5M10 13.5v.5"
        stroke="var(--color-text-warning)"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  ),
  default: null,
};

// ─── Shared button base style ─────────────────────────────────────────────────

const baseBtnStyle: React.CSSProperties = {
  padding: "8px 18px",
  borderRadius: 8,
  fontSize: 13,
  fontWeight: 500,
  cursor: "pointer",
  fontFamily: "inherit",
  transition: "opacity 0.15s",
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
  minWidth: 80,
  justifyContent: "center",
};

// ─── ConfirmDialog Component ──────────────────────────────────────────────────

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  variant = "default",
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  children,
}: ConfirmDialogProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleConfirm = useCallback(async () => {
    setIsLoading(true);
    try {
      await onConfirm();
      onClose();
    } catch {
      // If onConfirm throws, keep the dialog open so the user can retry
      // The caller is responsible for showing error state
    } finally {
      setIsLoading(false);
    }
  }, [onConfirm, onClose]);

  const handleClose = useCallback(() => {
    if (isLoading) return; // Prevent closing while async action is in flight
    onClose();
  }, [isLoading, onClose]);

  const icon = VARIANT_ICONS[variant];

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      size="sm"
      showCloseButton={!isLoading}
      closeOnBackdrop={!isLoading}
      // No title prop — we render a custom header inside the body
      // so we can include the variant icon alongside the title
    >
      {/* Custom header with icon */}
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {icon && (
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 10,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background:
                variant === "danger"
                  ? "var(--color-background-danger)"
                  : "var(--color-background-warning)",
              flexShrink: 0,
            }}
          >
            {icon}
          </div>
        )}

        <div>
          <h2
            style={{
              margin: 0,
              fontSize: 16,
              fontWeight: 600,
              color: "var(--color-text-primary)",
              lineHeight: 1.3,
            }}
          >
            {title}
          </h2>
          {description && (
            <p
              style={{
                margin: "6px 0 0",
                fontSize: 14,
                color: "var(--color-text-secondary)",
                lineHeight: 1.6,
              }}
            >
              {description}
            </p>
          )}
        </div>

        {/* Optional extra content — e.g. a type-to-confirm input */}
        {children}

        {/* Action buttons */}
        <div
          style={{
            display: "flex",
            gap: 8,
            justifyContent: "flex-end",
            paddingTop: 4,
          }}
        >
          {/* Cancel */}
          <button
            onClick={handleClose}
            disabled={isLoading}
            style={{
              ...baseBtnStyle,
              background: "transparent",
              color: "var(--color-text-secondary)",
              border: "1px solid var(--color-border-secondary)",
              opacity: isLoading ? 0.5 : 1,
            }}
          >
            {cancelLabel}
          </button>

          {/* Confirm */}
          <button
            onClick={handleConfirm}
            disabled={isLoading}
            style={{
              ...baseBtnStyle,
              ...CONFIRM_BTN_STYLES[variant],
              opacity: isLoading ? 0.7 : 1,
            }}
          >
            {isLoading ? <Spinner /> : null}
            {isLoading ? "Working…" : confirmLabel}
          </button>
        </div>
      </div>
    </Modal>
  );
}

// ─── Inline spinner ───────────────────────────────────────────────────────────

function Spinner() {
  return (
    <>
      <svg
        width="14"
        height="14"
        viewBox="0 0 14 14"
        fill="none"
        aria-hidden
        style={{ animation: "confirmdialog-spin 0.6s linear infinite", flexShrink: 0 }}
      >
        <circle
          cx="7" cy="7" r="5"
          stroke="currentColor"
          strokeWidth="2"
          strokeDasharray="20"
          strokeDashoffset="10"
          strokeLinecap="round"
        />
      </svg>
      <style>{`
        @keyframes confirmdialog-spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </>
  );
}

// ─── useConfirmDialog — imperative API ────────────────────────────────────────

interface OpenOptions
  extends Omit<ConfirmDialogProps, "isOpen" | "onClose" | "onConfirm"> {}

interface UseConfirmDialogReturn {
  /** Render this in your JSX — it's the actual dialog element */
  dialog: ReactNode;

  /**
   * Call this to open the dialog. Returns a Promise<boolean>:
   *   true  = user clicked confirm
   *   false = user cancelled or closed
   *
   * Usage:
   *   const confirmed = await confirm.open({ title: "Delete?", variant: "danger" });
   *   if (confirmed) { ... }
   */
  open: (options: OpenOptions) => Promise<boolean>;
}

export function useConfirmDialog(): UseConfirmDialogReturn {
  const [isOpen, setIsOpen] = useState(false);
  const [options, setOptions] = useState<OpenOptions>({ title: "" });

  // Stores the resolve function of the pending Promise
  const resolveRef = useRef<((value: boolean) => void) | null>(null);

  const open = useCallback((opts: OpenOptions): Promise<boolean> => {
    setOptions(opts);
    setIsOpen(true);

    return new Promise<boolean>((resolve) => {
      resolveRef.current = resolve;
    });
  }, []);

  const handleConfirm = useCallback(async () => {
    resolveRef.current?.(true);
    resolveRef.current = null;
  }, []);

  const handleClose = useCallback(() => {
    setIsOpen(false);
    resolveRef.current?.(false);
    resolveRef.current = null;
  }, []);

  const dialog = (
    <ConfirmDialog
      {...options}
      isOpen={isOpen}
      onClose={handleClose}
      onConfirm={handleConfirm}
    />
  );

  return { dialog, open };
}