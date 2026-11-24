import { useCallback } from "react";
import { failureText } from "../lib/errorMessage";
import { invoke } from "@tauri-apps/api/core";
import type { Dispatch, SetStateAction } from "react";
import type { MouseEvent as ReactMouseEvent } from "react";
import type { ClipboardEntry } from "../types";

interface UseClipboardActionsOptions {
  t: (key: string) => string;
  pushToast: (msg: string, duration?: number) => number;
  deleteAfterPaste: boolean;
  moveToTopAfterPaste: boolean;
  /** Clicking (or Enter on) an item only copies it; the user pastes (#175). */
  clickCopyOnly: boolean;
  isWindowPinned: boolean;
  setSearch: (val: string) => void;
  setHistory: Dispatch<SetStateAction<ClipboardEntry[]>>;
}

// Files and media are read by id on the backend; sending their content is waste.
const invokeContentFor = (id: number, content: string, contentType: string) =>
  id !== 0 && (contentType === "image" || contentType === "video" || contentType === "file")
    ? ""
    : content;

export const useClipboardActions = ({
  t,
  pushToast,
  deleteAfterPaste,
  moveToTopAfterPaste,
  clickCopyOnly,
  isWindowPinned,
  setSearch,
  setHistory
}: UseClipboardActionsOptions) => {
  const copyToClipboard = useCallback(
    async (
      id: number,
      content: string,
      contentType: string,
      pasteWithFormat = true,
      isPinned = false,
      tags: string[] = []
    ) => {
      try {
        if (document.activeElement instanceof HTMLElement) {
          document.activeElement.blur();
        }

        const invokeContent = invokeContentFor(id, content, contentType);

        if (clickCopyOnly) {
          await invoke("copy_to_clipboard", {
            content: invokeContent,
            contentType,
            paste: false,
            id: id,
            deleteAfterUse: false,
            pasteWithFormat,
            moveToTop: false
          });
          setSearch("");
          // Out of the way so the user can paste where they want; a pinned
          // window stays, so confirm instead.
          if (isWindowPinned) {
            pushToast(t("copied_to_clipboard"), 1500);
          } else {
            await invoke("hide_window_cmd");
          }
          return;
        }

        const shouldDelete = deleteAfterPaste && !isPinned && tags.length === 0;
        await invoke("copy_to_clipboard", {
          content: invokeContent,
          contentType,
          paste: true,
          id: id,
          deleteAfterUse: shouldDelete,
          pasteWithFormat,
          moveToTop: moveToTopAfterPaste
        });

        if (moveToTopAfterPaste && !shouldDelete) {
          const now = Date.now();
          setHistory((prev) =>
            prev.map((item) =>
              item.id === id
                ? { ...item, timestamp: now, sort_at: now, last_used_at: now }
                : item
            )
          );
        }

        setSearch("");
      } catch (err) {
        // The backend event opens the actionable permission dialog.
        if (String(err).includes("accessibility_permission_required")) return;
        const errorMsg = failureText(t("copy_failed"), err);
        pushToast(errorMsg, 3000);
      }
    },
    [clickCopyOnly, deleteAfterPaste, isWindowPinned, moveToTopAfterPaste, pushToast, setHistory, setSearch, t]
  );

  // Shift+Enter: put the entry on the clipboard and keep the window open, so
  // the user can go on browsing (unlike 「点击只复制」, which hides it).
  const copyWithoutPaste = useCallback(
    async ({ id, content, content_type }: ClipboardEntry) => {
      try {
        await invoke("copy_to_clipboard", {
          content: invokeContentFor(id, content, content_type),
          contentType: content_type,
          paste: false,
          id,
          deleteAfterUse: false,
          pasteWithFormat: true,
          moveToTop: false
        });
        pushToast(t("copied_to_clipboard"), 1500);
      } catch (err) {
        pushToast(failureText(t("copy_failed"), err), 3000);
      }
    },
    [pushToast, t]
  );

  const deleteEntryById = useCallback(
    async (id: number): Promise<boolean> => {
      try {
        await invoke("delete_clipboard_entry", { id });
        setHistory((prev) => prev.filter((item) => item.id !== id));
        return true;
      } catch (err) {
        const errorMsg = failureText(t("delete_failed"), err);
        pushToast(errorMsg, 3000);
        return false;
      }
    },
    [pushToast, setHistory, t]
  );

  const deleteEntry = useCallback(
    async (e: ReactMouseEvent, id: number) => {
      e.stopPropagation();
      await deleteEntryById(id);
    },
    [deleteEntryById]
  );

  return {
    copyToClipboard,
    copyWithoutPaste,
    deleteEntry,
    deleteEntryById
  };
};
