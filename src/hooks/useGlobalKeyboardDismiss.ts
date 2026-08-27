import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { isTextInputElement, dismissKeyboard } from "../utils/keyboard";

export function useGlobalKeyboardDismiss() {
  const location = useLocation();

  // Dismiss keyboard on route changes
  useEffect(() => {
    dismissKeyboard();
  }, [location.pathname]);

  useEffect(() => {
    if (typeof window === "undefined" || typeof document === "undefined") return;

    // Tapping outside focused text fields
    const handleClick = (e: MouseEvent | TouchEvent) => {
      const active = document.activeElement;
      if (!isTextInputElement(active)) return;

      const target = e.target as HTMLElement | null;
      if (!target) return;

      // If clicked inside the active input itself, do nothing
      if (active === target || active.contains(target)) return;

      // If the user tapped inside any form, modal, bottom sheet, or interactive element, do not blur
      const interactiveEl = target.closest?.(
        'form, .form-bottom-sheet, [role="dialog"], button, a, input, textarea, select, label, [role="button"], [tabindex]:not([tabindex="-1"]), [data-interactive="true"]'
      );
      if (interactiveEl) {
        return;
      }

      // User tapped on empty background outside any form
      (active as HTMLElement).blur();
    };

    window.addEventListener("click", handleClick, { passive: true });

    return () => {
      window.removeEventListener("click", handleClick);
    };
  }, []);
}

