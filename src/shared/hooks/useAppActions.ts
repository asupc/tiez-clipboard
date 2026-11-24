import { useCallback } from "react";
import { failureText } from "../lib/errorMessage";
import { invoke } from "@tauri-apps/api/core";

interface UseAppActionsOptions {
  t: (key: string) => string;
  openConfirm: (opts: { title: string; message: string; danger?: boolean; confirmLabel?: string; onConfirm: () => void }) => void;
  closeConfirm: () => void;
  pushToast: (msg: string, duration?: number) => number;
  fetchHistory: (reset?: boolean) => Promise<void>;
}

export const useAppActions = ({
  t,
  openConfirm,
  closeConfirm,
  pushToast,
  fetchHistory
}: UseAppActionsOptions) => {
  const clearHistory = useCallback(() => {
    openConfirm({
      title: t("clear_confirm_title"),
      message: t("clear_confirm_message"),
      danger: true,
      confirmLabel: t("clear_confirm_action"),
      onConfirm: async () => {
        try {
          await invoke("clear_clipboard_history");
          fetchHistory(true);
        } catch (err) {
          console.error("清空失败", err);
          pushToast(failureText(t("clear_history_failed"), err), 4000);
        }
        closeConfirm();
      }
    });
  }, [closeConfirm, fetchHistory, openConfirm, pushToast, t]);

  const handleResetSettings = useCallback(() => {
    openConfirm({
      title: t("reset_defaults"),
      message: t("reset_confirm"),
      danger: true,
      confirmLabel: t("reset_confirm_action"),
      onConfirm: async () => {
        try {
          await invoke("reset_settings");
          window.location.reload();
        } catch (err) {
          const errorMsg = failureText(t("reset_failed"), err);
          pushToast(errorMsg, 3000);
        }
        closeConfirm();
      }
    });
  }, [closeConfirm, openConfirm, pushToast, t]);

  return { clearHistory, handleResetSettings };
};
