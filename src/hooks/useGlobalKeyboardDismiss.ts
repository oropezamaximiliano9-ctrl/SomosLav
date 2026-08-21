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

    let touchStartY = 0;
    let touchStartX = 0;

    // 1. Tapping outside the currently focused text field (on non-interactive elements)
    const handlePointerDown = (e: PointerEvent | TouchEvent | MouseEvent) => {
      const active = document.activeElement;
      if (!isTextInputElement(active)) return;

      const target = e.target as HTMLElement | null;
      if (!target) return;

      // If clicked inside the active input itself, do nothing
      if (active === target || active.contains(target)) return;

      // If the user tapped on a button, link, label, or interactive element,
      // allow that element's click/submit event to proceed without early blur disruption.
      const interactiveEl = target.closest?.(
        'button, a, input, textarea, select, label, [role="button"], [tabindex]:not([tabindex="-1"]), [data-interactive="true"]'
      );
      if (interactiveEl) {
        return;
      }

      // User tapped on blank space, background, text, card container, etc.
      (active as HTMLElement).blur();
    };

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches && e.touches[0]) {
        touchStartY = e.touches[0].clientY;
        touchStartX = e.touches[0].clientX;
      }
      handlePointerDown(e);
    };

    // 2. Scrolling any element or window
    const handleScroll = () => {
      const active = document.activeElement;
      if (isTextInputElement(active)) {
        (active as HTMLElement).blur();
      }
    };

    // 3. User dragging finger to scroll (dismiss once movement threshold exceeded)
    const handleTouchMove = (e: TouchEvent) => {
      if (!e.touches || !e.touches[0]) return;
      const dy = Math.abs(e.touches[0].clientY - touchStartY);
      const dx = Math.abs(e.touches[0].clientX - touchStartX);
      if (dy > 8 || dx > 8) {
        const active = document.activeElement;
        if (isTextInputElement(active)) {
          (active as HTMLElement).blur();
        }
      }
    };

    // 4. Pressing Return / Done (Enter key)
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Enter" || e.keyCode === 13) {
        const active = document.activeElement;
        // If it's a single line input not in a multi-step form that manages focus
        if (active && active.tagName.toLowerCase() === "input") {
          const input = active as HTMLInputElement;
          const form = input.form;
          
          // If input has its own form or submit handler, allow the handler to process
          // and only blur if focus didn't move to another field
          setTimeout(() => {
            if (document.activeElement === active && (!form || !form.querySelector('input:focus, textarea:focus'))) {
              input.blur();
            }
          }, 60);
        }
      }
    };

    window.addEventListener("pointerdown", handlePointerDown, { passive: true });
    window.addEventListener("touchstart", handleTouchStart, { passive: true });
    window.addEventListener("mousedown", handlePointerDown, { passive: true });

    window.addEventListener("scroll", handleScroll, { capture: true, passive: true });
    document.addEventListener("scroll", handleScroll, { capture: true, passive: true });
    window.addEventListener("touchmove", handleTouchMove, { passive: true });

    window.addEventListener("keydown", handleKeyDown, { capture: true });

    return () => {
      window.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("touchstart", handleTouchStart);
      window.removeEventListener("mousedown", handlePointerDown);

      window.removeEventListener("scroll", handleScroll, { capture: true });
      document.removeEventListener("scroll", handleScroll, { capture: true });
      window.removeEventListener("touchmove", handleTouchMove);

      window.removeEventListener("keydown", handleKeyDown, { capture: true });
    };
  }, []);
}
