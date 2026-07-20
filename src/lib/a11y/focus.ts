/**
 * Lightweight focus helpers for modal dialogs — WCAG 2.2 AA focus management.
 * Prefer native <dialog showModal()> when possible; use these for non-native overlays.
 */

const FOCUSABLE_SELECTOR = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "[tabindex]:not([tabindex='-1'])",
].join(", ");

export function getFocusableElements(container: HTMLElement): HTMLElement[] {
  return Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(
    (element) => !element.hasAttribute("disabled") && element.getAttribute("aria-hidden") !== "true",
  );
}

/** Trap Tab / Shift+Tab within a container. Returns a cleanup function. */
export function trapFocus(container: HTMLElement): () => void {
  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key !== "Tab") {
      return;
    }

    const focusable = getFocusableElements(container);
    if (focusable.length === 0) {
      event.preventDefault();
      return;
    }

    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    const active = document.activeElement as HTMLElement | null;

    if (event.shiftKey) {
      if (active === first || !container.contains(active)) {
        event.preventDefault();
        last.focus();
      }
      return;
    }

    if (active === last || !container.contains(active)) {
      event.preventDefault();
      first.focus();
    }
  };

  container.addEventListener("keydown", onKeyDown);
  return () => container.removeEventListener("keydown", onKeyDown);
}

/** Focus the first focusable control inside a container. */
export function focusFirstElement(container: HTMLElement): void {
  const focusable = getFocusableElements(container);
  focusable[0]?.focus();
}

/** Restore focus to a previously stored element if it is still connected. */
export function restoreFocus(element: Element | null): void {
  if (element instanceof HTMLElement && element.isConnected) {
    element.focus();
  }
}

/**
 * Arrow-key roving for role="menu" overlays.
 * Call from a keydown listener while the menu is open.
 */
export function handleMenuKeyNavigation(
  event: KeyboardEvent,
  container: HTMLElement,
  onEscape: () => void,
): void {
  if (event.key === "Escape") {
    event.preventDefault();
    onEscape();
    return;
  }

  const items = Array.from(
    container.querySelectorAll<HTMLElement>('[role="menuitem"]:not([disabled])'),
  ).filter((element) => element.getAttribute("aria-hidden") !== "true");

  if (items.length === 0) {
    return;
  }

  const active = document.activeElement as HTMLElement | null;
  const currentIndex = items.findIndex((item) => item === active || item.contains(active));

  if (event.key === "ArrowDown") {
    event.preventDefault();
    const next = currentIndex < 0 ? 0 : (currentIndex + 1) % items.length;
    items[next]?.focus();
    return;
  }

  if (event.key === "ArrowUp") {
    event.preventDefault();
    const next = currentIndex <= 0 ? items.length - 1 : currentIndex - 1;
    items[next]?.focus();
    return;
  }

  if (event.key === "Home") {
    event.preventDefault();
    items[0]?.focus();
    return;
  }

  if (event.key === "End") {
    event.preventDefault();
    items[items.length - 1]?.focus();
  }
}
