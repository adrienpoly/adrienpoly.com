import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { setupIonicReact } from "@ionic/react";

import "@ionic/react/css/core.css";
import "@ionic/react/css/normalize.css";
import "@ionic/react/css/structure.css";
import "@ionic/react/css/typography.css";
import "@ionic/react/css/palettes/dark.always.css";
import "@fontsource-variable/manrope";
import "@fontsource-variable/big-shoulders-display";
import "./theme.css";

import { App } from "./App";

// iOS look and behavior on every platform, including desktop browsers.
setupIonicReact({ mode: "ios" });

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
