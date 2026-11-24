import { useCallback } from "react";
import type { Dispatch, SetStateAction, MouseEvent, ReactNode } from "react";
import type { DragControls } from "framer-motion";
import ClipboardItem from "../../features/clipboard/components/ClipboardItem";
import { isKeyboardSelectedItem } from "../../features/clipboard/lib/itemInteraction";
import { hasSensitiveTag } from "../lib/sensitiveTags";
import type { QuickPasteHint } from "../../features/clipboard/types";
import type { ClipboardEntry } from "../types";

interface UseClipboardItemRendererOptions {
  privacyProtection: boolean;
  revealedIds: Set<number>;
  isKeyboardMode: boolean;
  selectedItemId: number | null;
  /** First search result, shown as selected until a row is picked. */
  searchTopHitId: number | null;
  /** Entry shown in the wide layout's detail pane, if any. */
  detailFocusedId: number | null;
  isWindowPinned: boolean;
  theme: string;
  t: (key: string) => string;
  showSourceAppIcon: boolean;
  compactMode: boolean;
  richTextSnapshotPreview: boolean;
  sensitiveMaskPrefixVisible: number;
  sensitiveMaskSuffixVisible: number;
  sensitiveMaskEmailDomain: boolean;
  quickPasteHintsById: Record<number, QuickPasteHint>;
  copyToClipboard: (
    id: number,
    content: string,
    contentType: string,
    pasteWithFormat?: boolean,
    isPinned?: boolean,
    tags?: string[]
  ) => Promise<void>;
  selectItemByIndex: (index: number) => void;
  setRevealedIds: Dispatch<SetStateAction<Set<number>>>;
  deleteEntry: (event: MouseEvent, id: number) => void;
}

type RenderItemContent = (
  item: ClipboardEntry,
  index: number,
  dragControls?: DragControls,
  disableLayout?: boolean
) => ReactNode;

export const useClipboardItemRenderer = ({
  privacyProtection,
  revealedIds,
  isKeyboardMode,
  selectedItemId,
  searchTopHitId,
  detailFocusedId,
  isWindowPinned,
  theme,
  t,
  showSourceAppIcon,
  compactMode,
  richTextSnapshotPreview,
  sensitiveMaskPrefixVisible,
  sensitiveMaskSuffixVisible,
  sensitiveMaskEmailDomain,
  quickPasteHintsById,
  copyToClipboard,
  selectItemByIndex,
  setRevealedIds,
  deleteEntry
}: UseClipboardItemRendererOptions): { renderItemContent: RenderItemContent } => {
  const renderItemContent = useCallback(
    (item: ClipboardEntry, index: number, dragControls?: DragControls, disableLayout?: boolean) => {
      // With 隐藏隐私 off nothing is hidden, so there is nothing to reveal.
      const canReveal = privacyProtection && hasSensitiveTag(item.tags);
      const isSensitiveHidden = canReveal && !revealedIds.has(item.id);

      return (
        <ClipboardItem
          id={`clipboard-item-${item.id}`}
          key={item.id}
          item={item}
          navigationIndex={index}
          isSelected={isKeyboardSelectedItem(item.id, selectedItemId, isKeyboardMode) || item.id === searchTopHitId}
          isDetailFocused={detailFocusedId === item.id}
          windowPinned={isWindowPinned}
          isSensitiveHidden={!!isSensitiveHidden}
          isRevealed={revealedIds.has(item.id)}
          canReveal={canReveal}
          theme={theme}
          t={t}
          showSourceAppIcon={showSourceAppIcon}
          compactMode={compactMode}
          richTextSnapshotPreview={richTextSnapshotPreview}
          sensitiveMaskPrefixVisible={sensitiveMaskPrefixVisible}
          sensitiveMaskSuffixVisible={sensitiveMaskSuffixVisible}
          sensitiveMaskEmailDomain={sensitiveMaskEmailDomain}
          quickPasteHint={quickPasteHintsById[item.id]}
          onSelect={() => selectItemByIndex(index)}
          onCopy={(withFormat) =>
            copyToClipboard(item.id, item.content, item.content_type, withFormat, item.is_pinned, item.tags || [])
          }
          onToggleReveal={(e) => {
            e.stopPropagation();
            setRevealedIds((prev) => {
              const next = new Set(prev);
              if (next.has(item.id)) next.delete(item.id);
              else next.add(item.id);
              return next;
            });
          }}
          onDelete={(e) => deleteEntry(e, item.id)}
          dragControls={dragControls}
          disableLayout={disableLayout}
        />
      );
    },
    [
      privacyProtection,
      revealedIds,
      selectedItemId,
      searchTopHitId,
      detailFocusedId,
      isKeyboardMode,
      isWindowPinned,
      theme,
      t,
      showSourceAppIcon,
      compactMode,
      richTextSnapshotPreview,
      sensitiveMaskPrefixVisible,
      sensitiveMaskSuffixVisible,
      sensitiveMaskEmailDomain,
      quickPasteHintsById,
      copyToClipboard,
      selectItemByIndex,
      setRevealedIds,
      deleteEntry
    ]
  );

  return { renderItemContent };
};
