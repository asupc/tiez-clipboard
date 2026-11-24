import { useEffect } from "react";
import type { Dispatch, SetStateAction } from "react";
import { invoke } from "@tauri-apps/api/core";
import { isTauriRuntime } from "../lib/tauriRuntime";

interface UseAppBootstrapOptions {
  setDataPath: Dispatch<SetStateAction<string>>;
  setAutoStart: Dispatch<SetStateAction<boolean>>;
  setElevatedAutostart: Dispatch<SetStateAction<boolean>>;
}

export const useAppBootstrap = ({
  setDataPath,
  setAutoStart,
  setElevatedAutostart
}: UseAppBootstrapOptions) => {
  useEffect(() => {
    if (!isTauriRuntime()) return;

    invoke<string>("get_data_path").then(setDataPath).catch(console.error);

    invoke<boolean>("is_autostart_enabled").then(setAutoStart).catch(console.error);
    invoke<boolean>("is_elevated_autostart_enabled")
      .then(setElevatedAutostart)
      .catch(console.error);
  }, [setAutoStart, setDataPath, setElevatedAutostart]);
};
