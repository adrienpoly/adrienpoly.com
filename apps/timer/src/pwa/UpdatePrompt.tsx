import { IonToast } from "@ionic/react";
import { useRegisterSW } from "virtual:pwa-register/react";
import { useMessages } from "../i18n/useMessages";

/** Registers the service worker and tells the user when the app is cached or has an update. */
export function UpdatePrompt() {
  const t = useMessages();
  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW();

  return (
    <>
      <IonToast
        isOpen={offlineReady}
        message={t.pwa.offlineReady}
        duration={2500}
        onDidDismiss={() => setOfflineReady(false)}
      />
      <IonToast
        isOpen={needRefresh}
        message={t.pwa.updateAvailable}
        buttons={[
          { text: t.pwa.later, role: "cancel" },
          { text: t.pwa.reload, handler: () => void updateServiceWorker(true) },
        ]}
        onDidDismiss={() => setNeedRefresh(false)}
      />
    </>
  );
}
