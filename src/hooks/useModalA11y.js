import { useEffect, useRef } from "react";

const focusableSelector = "button:not([disabled]), a[href], input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex='-1'])";

export default function useModalA11y(onClose, enabled = true) {
  const dialogRef = useRef(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;

  useEffect(() => {
    if (!enabled) return undefined;
    const previousFocus = document.activeElement;
    const dialog = dialogRef.current;
    const focusable = () => [...(dialog?.querySelectorAll(focusableSelector) || [])];
    focusable()[0]?.focus();

    const handleKeyDown = (event) => {
      if (event.key === "Escape") { event.preventDefault(); closeRef.current?.(); return; }
      if (event.key !== "Tab") return;
      const items = focusable();
      if (!items.length) { event.preventDefault(); dialog?.focus(); return; }
      const first = items[0];
      const last = items.at(-1);
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => { document.removeEventListener("keydown", handleKeyDown); previousFocus?.focus?.(); };
  }, [enabled]);

  return dialogRef;
}
