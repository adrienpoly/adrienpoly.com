import { Capacitor } from "@capacitor/core";

/** Chrome and Edge fire this when the app can be installed; `prompt` opens their install dialog. */
interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<unknown>;
}

export interface InstallState {
  /** True inside the installed app (or a native wrapper): there is nothing to offer. */
  installed: boolean;
  /** True when the browser's own install dialog can be opened. */
  canPrompt: boolean;
}

function isInstalled(): boolean {
  return (
    Capacitor.isNativePlatform() ||
    window.matchMedia("(display-mode: standalone)").matches ||
    // Safari on iOS, before it supported the media query.
    ("standalone" in navigator && navigator.standalone === true)
  );
}

let promptEvent: BeforeInstallPromptEvent | null = null;
let state: InstallState = { installed: isInstalled(), canPrompt: false };
const listeners = new Set<() => void>();

function update(next: Partial<InstallState>) {
  state = { ...state, ...next };
  listeners.forEach((listener) => listener());
}

// The browser fires this once, soon after the page loads, possibly before any
// component is mounted: hence a listener at module level.
window.addEventListener("beforeinstallprompt", (event) => {
  // The app shows its own invitation instead of the browser's banner.
  event.preventDefault();
  promptEvent = event as BeforeInstallPromptEvent;
  update({ canPrompt: true });
});

window.addEventListener("appinstalled", () => {
  promptEvent = null;
  update({ installed: true, canPrompt: false });
});

export function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => void listeners.delete(listener);
}

export function getInstallState(): InstallState {
  return state;
}

/**
 * Opens the browser's install dialog. Must be called from a tap. An event can be
 * used once. `onRefused` runs if the browser will not open the dialog, so that
 * the caller can show the steps instead of leaving the tap without effect.
 */
export function promptInstall(onRefused: () => void) {
  const event = promptEvent;
  if (!event) return onRefused();
  promptEvent = null;
  update({ canPrompt: false });
  event.prompt().catch(onRefused);
}
