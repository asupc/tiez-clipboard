import { useEffect, useRef } from "react";
import { listen } from "@tauri-apps/api/event";
import { isTauriRuntime } from "../lib/tauriRuntime";

// Sent by the tray menu (src-tauri/src/app/tray.rs) after it has opened the window.
const OPEN_SETTINGS_EVENT = "tray-open-settings";

interface UseTrayMenuEventsOptions {
  openSettings: () => void;
}

/** "Settings…" in the tray shows the settings page. */
export const useTrayMenuEvents = ({ openSettings }: UseTrayMenuEventsOptions) => {
  const latest = useRef({ openSettings });
  latest.current = { openSettings };

  useEffect(() => {
    if (!isTauriRuntime()) return;

    const unlistenSettings = listen(OPEN_SETTINGS_EVENT, () => latest.current.openSettings());
    return () => {
      unlistenSettings.then((f) => f()).catch(() => {});
    };
  }, []);
};
