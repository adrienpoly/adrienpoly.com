import { Capacitor } from "@capacitor/core";
import { useMessages } from "../i18n/useMessages";

// iOS has no install prompt: the only way in is Share → Add to Home Screen,
// so the app explains it when opened in the browser on an iPhone or iPad.
function shouldShowHint(): boolean {
  if (Capacitor.isNativePlatform()) return false;

  const isIos =
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    // iPadOS identifies as a Mac; touch support tells them apart.
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  const isInstalled =
    window.matchMedia("(display-mode: standalone)").matches ||
    ("standalone" in navigator && navigator.standalone === true);

  return isIos && !isInstalled;
}

export function InstallHint() {
  const t = useMessages();
  if (!shouldShowHint()) return null;

  return <p className="install-hint">{t.pwa.installHint}</p>;
}
