import type { MouseEvent, ReactNode } from "react";
import type { DragControls } from "framer-motion";
import type { ClipboardEntry } from "../../shared/types";

export interface QuickPasteHint {
  slot: number;
  combo: string;
}

export interface ClipboardItemProps {
  item: ClipboardEntry;
  /** Current position in the combined pinned + history list. */
  navigationIndex: number;
  isSelected: boolean;
  /** Shown in the wide layout's detail pane, whose action bar targets it. */
  isDetailFocused?: boolean;
  windowPinned: boolean;
  isSensitiveHidden: boolean;
  isRevealed: boolean;
  /** Offers show / hide: a sensitive entry while 隐藏隐私 is on. */
  canReveal: boolean;
  theme: string;
  t: (key: string) => string;
  richTextSnapshotPreview?: boolean;
  showSourceAppIcon?: boolean;
  sensitiveMaskPrefixVisible?: number;
  sensitiveMaskSuffixVisible?: number;
  sensitiveMaskEmailDomain?: boolean;
  quickPasteHint?: QuickPasteHint;

  onSelect: () => void;
  onCopy: (withFormat?: boolean) => void;
  onToggleReveal: (e: MouseEvent) => void;
  onDelete: (e: MouseEvent) => void;
  dragControls?: DragControls;
  id?: string;
  disableLayout?: boolean;
}

export type ClipboardRenderItem = (
  item: ClipboardEntry,
  index: number,
  isFirst: boolean
) => ReactNode;

export interface VirtualClipboardListProps {
  items: ClipboardEntry[];
  renderItem: ClipboardRenderItem;
  onLoadMore?: () => void;
  hasMore: boolean;
  isLoading: boolean;
  selectedIndex: number;
  isKeyboardMode: boolean;
  onScroll?: (offset: number) => void;
  compactMode: boolean;
  header?: ReactNode;
  loadingLabel: string;
  loadMoreLabel: string;
}

export interface VirtualClipboardListHandle {
  scrollToItem: (index: number) => void;
  scrollToTop: () => void;
  resetAfterIndex: (index: number) => void;
}
