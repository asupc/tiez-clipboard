import { useMemo, type Dispatch, type MouseEvent, type SetStateAction } from "react";
import type { ClipboardEntry } from "../../../shared/types";
import type { DetailPaneActions } from "../../clipboard/components/ClipboardDetailPane";

interface UseDetailPaneActionsOptions {
  /** Entries in display order, to pick the neighbour after a delete. */
  items: ClipboardEntry[];
  focusDetailItem: (id: number) => void;
  copyToClipboard: (
    id: number,
    content: string,
    contentType: string,
    pasteWithFormat?: boolean,
    isPinned?: boolean,
    tags?: string[]
  ) => Promise<void>;
  deleteEntry: (event: MouseEvent, id: number) => void;
  setRevealedIds: Dispatch<SetStateAction<Set<number>>>;
}

/** The detail pane's action bar runs the same operations a list card offers. */
export const useDetailPaneActions = ({
  items,
  focusDetailItem,
  copyToClipboard,
  deleteEntry,
  setRevealedIds
}: UseDetailPaneActionsOptions): DetailPaneActions =>
  useMemo(() => {
    return {
      paste: (item) =>
        void copyToClipboard(item.id, item.content, item.content_type, true, item.is_pinned, item.tags || []),
      toggleReveal: (item) =>
        setRevealedIds((prev) => {
          const next = new Set(prev);
          if (next.has(item.id)) next.delete(item.id);
          else next.add(item.id);
          return next;
        }),
      // Move to the next row first so repeated deletes walk down the list
      // instead of jumping back to the top.
      remove: (event, item) => {
        const index = items.findIndex((entry) => entry.id === item.id);
        const neighbour = index >= 0 ? (items[index + 1] ?? items[index - 1]) : undefined;
        if (neighbour) focusDetailItem(neighbour.id);
        deleteEntry(event, item.id);
      }
    };
  }, [items, focusDetailItem, copyToClipboard, deleteEntry, setRevealedIds]);
