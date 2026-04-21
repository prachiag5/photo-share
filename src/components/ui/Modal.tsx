"use client";

/**
 * Modal
 *
 * A production-grade, accessible modal primitive.
 *
 * Features:
 *  - React Portal: renders into document.body, escapes any overflow:hidden parents
 *  - Focus trap: Tab/Shift+Tab cycle stays inside the modal
 *  - Focus restore: returns focus to trigger element on close
 *  - Scroll lock: prevents body scroll while open
 *  - Keyboard: Escape closes the modal
 *  - Backdrop click: closes on outside click (configurable)
 *  - ARIA: role="dialog", aria-modal, aria-labelledby, aria-describedby
 *  - Animation: smooth scale + fade in/out
 *  - Size variants: sm | md | lg | xl | full
 *
 * Usage:
 *   <Modal
 *     isOpen={isOpen}
 *     onClose={() => setIsOpen(false)}
 *     title="Edit post"
 *   >
 *     <p>Modal content here</p>
 *   </Modal>
 */

import {
  useEffect,
  useRef,
  useCallback,
  useId,
  type ReactNode,
  type KeyboardEvent,
} from "react";
import { createPortal } from "react-dom";

// ─── Types ────────────────────────────────────────────────────────────────────

export type ModalSize = "sm" | "md" | "lg" | "xl" | "full";

export interface ModalProps {
  /** Controls visibility */
  isOpen: boolean;

  /** Called when modal should close (Escape, backdrop click, close button) */
  onClose: () => void;

  /** Rendered in the modal header. Also sets aria-labelledby. */
  title?: ReactNode;

  /** Rendered below the title in muted style */
  description?: ReactNode;

  /** Modal body content */
  children: ReactNode;

  /** Rendered in the footer area. Typically action buttons. */
  footer?: ReactNode;

  /** Controls the max-width of the modal panel */
  size?: ModalSize;

  /**
   * If true, clicking the backdrop does NOT close the modal.
   * Useful for forms with unsaved state.
   */
  closeOnBackdrop?: boolean;

  /** Show or hide the built-in close (×) button in the header */
  showCloseButton?: boolean;

  /** Extra class on the modal panel */
  className?: string;
}

// ─── Focus trap helpers ───────────────────────────────────────────────────────

const FOCUSABLE_SELECTORS = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  '[tabindex]:not([tabindex="-1"])',
].join(", ");

function getFocusableElements(container: HTMLElement): HTMLElement[] {
  return Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTORS));
}

// ─── Size map ─────────────────────────────────────────────────────────────────

const SIZE_STYLES: Record<ModalSize, string> = {
  sm:   "max-width: 400px;",
  md:   "max-width: 560px;",
  lg:   "max-width: 720px;",
  xl:   "max-width: 960px;",
  full: "max-width: calc(100vw - 48px); height: calc(100vh - 48px);",
};

// ─── Component ────────────────────────────────────────────────────────────────

export function Modal({
  isOpen,
  onClose,
  title,
  description,
  children,
  footer,
  size = "md",
  closeOnBackdrop = true,
  showCloseButton = true,
  className,
}: ModalProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  // Unique IDs for ARIA
  const titleId = useId();
  const descId = useId();

  // ── On open: lock scroll, save focus, move focus into modal ────────────────
  useEffect(() => {
    if (!isOpen) return;

    // Save the currently focused element so we can restore it on close
    previousFocusRef.current = document.activeElement as HTMLElement;

    // Scroll lock — save current scrollbar width to prevent layout shift
    const scrollbarWidth =
      window.innerWidth - document.documentElement.clientWidth;
    document.body.style.overflow = "hidden";
    document.body.style.paddingRight = `${scrollbarWidth}px`;

    // Move focus into the modal — first focusable element, or the panel itself
    requestAnimationFrame(() => {
      const focusable = getFocusableElements(panelRef.current!);
      (focusable[0] ?? panelRef.current)?.focus();
    });

    return () => {
      // Restore scroll
      document.body.style.overflow = "";
      document.body.style.paddingRight = "";

      // Restore focus to the element that triggered the modal
      previousFocusRef.current?.focus();
    };
  }, [isOpen]);

  // ── Keyboard: Escape + focus trap ──────────────────────────────────────────
  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLDivElement>) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose();
        return;
      }

      if (e.key === "Tab") {
        const focusable = getFocusableElements(panelRef.current!);
        if (focusable.length === 0) { e.preventDefault(); return; }

        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (e.shiftKey) {
          // Shift+Tab: if at first element, wrap to last
          if (document.activeElement === first) {
            e.preventDefault();
            last.focus();
          }
        } else {
          // Tab: if at last element, wrap to first
          if (document.activeElement === last) {
            e.preventDefault();
            first.focus();
          }
        }
      }
    },
    [onClose]
  );

  // ── Backdrop click ──────────────────────────────────────────────────────────
  const handleBackdropClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      // Only close if the click landed on the backdrop itself — not the panel
      if (closeOnBackdrop && e.target === e.currentTarget) {
        onClose();
      }
    },
    [closeOnBackdrop, onClose]
  );

  // ── Don't render anything when closed ──────────────────────────────────────
  if (!isOpen) return null;

  // ── Portal renders outside the component tree into document.body ───────────
  return createPortal(
    <>
      {/* ── Styles (scoped via class prefix) ─────────────────────────── */}
      <style>{`
        .modal-backdrop {
          position: fixed;
          inset: 0;
          z-index: 9999;
          background: rgba(0, 0, 0, 0.5);
          backdrop-filter: blur(2px);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px;
          animation: modal-backdrop-in 0.2s ease forwards;
        }
        @keyframes modal-backdrop-in {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        .modal-panel {
          position: relative;
          width: 100%;
          background: var(--color-background-primary);
          border: 1px solid var(--color-border-tertiary);
          border-radius: 16px;
          display: flex;
          flex-direction: column;
          max-height: calc(100vh - 48px);
          outline: none;
          animation: modal-panel-in 0.22s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        @keyframes modal-panel-in {
          from { opacity: 0; transform: scale(0.96) translateY(8px); }
          to   { opacity: 1; transform: scale(1)    translateY(0);   }
        }
        .modal-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 16px;
          padding: 20px 24px 0;
          flex-shrink: 0;
        }
        .modal-title {
          font-size: 16px;
          font-weight: 600;
          color: var(--color-text-primary);
          line-height: 1.3;
          margin: 0;
        }
        .modal-description {
          font-size: 13px;
          color: var(--color-text-secondary);
          margin: 4px 0 0;
          line-height: 1.5;
        }
        .modal-close-btn {
          flex-shrink: 0;
          width: 28px;
          height: 28px;
          border-radius: 6px;
          border: none;
          background: transparent;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--color-text-secondary);
          transition: background 0.15s, color 0.15s;
          padding: 0;
        }
        .modal-close-btn:hover {
          background: var(--color-background-secondary);
          color: var(--color-text-primary);
        }
        .modal-body {
          flex: 1;
          overflow-y: auto;
          padding: 20px 24px;
          overscroll-behavior: contain;
        }
        .modal-footer {
          flex-shrink: 0;
          padding: 0 24px 20px;
          display: flex;
          align-items: center;
          justify-content: flex-end;
          gap: 8px;
          border-top: 1px solid var(--color-border-tertiary);
          padding-top: 16px;
          margin-top: 4px;
        }
        @media (prefers-reduced-motion: reduce) {
          .modal-backdrop { animation: none; }
          .modal-panel    { animation: none; }
        }
      `}</style>

      {/* ── Backdrop ────────────────────────────────────────────────────── */}
      <div
        className="modal-backdrop"
        onClick={handleBackdropClick}
        aria-hidden // Backdrop itself is not interactive for AT
      >
        {/* ── Panel ───────────────────────────────────────────────────── */}
        <div
          ref={panelRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby={title ? titleId : undefined}
          aria-describedby={description ? descId : undefined}
          tabIndex={-1} // Makes panel focusable as a fallback
          onKeyDown={handleKeyDown}
          className={`modal-panel ${className ?? ""}`}
          style={{ cssText: SIZE_STYLES[size] } as React.CSSProperties}
          // Stop click propagation so panel clicks don't hit backdrop handler
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          {(title || showCloseButton) && (
            <div className="modal-header">
              <div>
                {title && (
                  <h2 id={titleId} className="modal-title">
                    {title}
                  </h2>
                )}
                {description && (
                  <p id={descId} className="modal-description">
                    {description}
                  </p>
                )}
              </div>
              {showCloseButton && (
                <button
                  className="modal-close-btn"
                  onClick={onClose}
                  aria-label="Close modal"
                >
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
                    <path
                      d="M3 3l10 10M13 3L3 13"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                    />
                  </svg>
                </button>
              )}
            </div>
          )}

          {/* Body */}
          <div className="modal-body">{children}</div>

          {/* Footer */}
          {footer && <div className="modal-footer">{footer}</div>}
        </div>
      </div>
    </>,
    document.body
  );
}