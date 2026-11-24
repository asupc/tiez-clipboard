import { lazy, Suspense, useCallback, type ComponentProps, type RefObject, type ReactNode } from "react";
import { motion } from "framer-motion";
import type { DragControls } from "framer-motion";
import { ArrowUp, Clipboard } from "lucide-react";
import { VirtualClipboardList } from "../../clipboard/components/VirtualClipboardList";
import type { ClipboardEntry } from "../../../shared/types";
import type { VirtualClipboardListHandle } from "../../clipboard/types";

// Settings and the emoji catalog are only opened on demand; keeping them out
// of the startup chunk cuts parse work and memory for the common case.
const SettingsPanel = lazy(() => import("../../settings/components/SettingsPanel"));
const EmojiPanel = lazy(() => import("../../emoji/components/EmojiPanel"));

type SettingsPanelProps = ComponentProps<typeof SettingsPanel>;
type RenderItem = (
  item: ClipboardEntry,
  index: number,
  dragControls?: DragControls,
  disableLayout?: boolean
) => ReactNode;

interface AppMainContentProps {
  t: (key: string) => string;
  showSettings: boolean;
  showEmojiPanel: boolean;
  settingsPanelProps: SettingsPanelProps;
  emojiFavorites: string[];
  setEmojiFavorites: (val: string[] | ((prev: string[]) => string[])) => void;
  emojiPanelTab: "emoji" | "favorites";
  setEmojiPanelTab: (val: "emoji" | "favorites") => void;
  saveSetting: (key: string, val: string) => void;
  filteredHistory: ClipboardEntry[];
  search: string;
  /** A content-type tab other than "All" is active. */
  typeFiltered: boolean;
  onClearTypeFilter: () => void;
  /** How the open-window hotkey reads on this platform; empty if none is set. */
  openHotkeyLabel: string;
  compactMode: boolean;
  selectedIndex: number;
  isKeyboardMode: boolean;
  virtualListRef: RefObject<VirtualClipboardListHandle | null>;
  renderItemContent: RenderItem;
  loadMoreHistory: () => void;
  handleListScroll: (offset: number) => void;
  hasMore: boolean;
  isLoadingMore: boolean;
  showScrollTop: boolean;
  onScrollTop: () => void;
}

const AppMainContent = ({
  t,
  showSettings,
  showEmojiPanel,
  settingsPanelProps,
  emojiFavorites,
  setEmojiFavorites,
  emojiPanelTab,
  setEmojiPanelTab,
  saveSetting,
  filteredHistory,
  search,
  typeFiltered,
  onClearTypeFilter,
  openHotkeyLabel,
  compactMode,
  selectedIndex,
  isKeyboardMode,
  virtualListRef,
  renderItemContent,
  loadMoreHistory,
  handleListScroll,
  hasMore,
  isLoadingMore,
  showScrollTop,
  onScrollTop
}: AppMainContentProps) => {
  // Hooks must run before the view-specific early returns below.
  // Same wrapper for every row so the top card does not remount when a new
  // copy pushes it down to index 1.
  const renderVirtualItem = useCallback((item: ClipboardEntry, index: number, isFirst?: boolean) => {
    const el = renderItemContent(item, index, undefined, true);
    const first = isFirst;
    return (
      <div
        className={first ? "first-virtual-item" : undefined}
        style={first ? { height: "100%", paddingTop: "4px" } : undefined}
      >
        {el}
      </div>
    );
  }, [renderItemContent]);

  if (showEmojiPanel) {
    return (
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        style={{ height: "100%", overflow: "hidden" }}
      >
        <Suspense fallback={null}>
          <EmojiPanel
            t={t}
            favorites={emojiFavorites}
            setFavorites={setEmojiFavorites}
            activeTab={emojiPanelTab}
            setActiveTab={setEmojiPanelTab}
            saveSetting={saveSetting}
          />
        </Suspense>
      </motion.div>
    );
  }

  if (showSettings) {
    return (
      <div className="settings-view">
        <Suspense fallback={null}>
          <SettingsPanel {...settingsPanelProps} />
        </Suspense>
      </div>
    );
  }

  if (filteredHistory.length === 0) {
    return (
      <div className="empty-state">
        <Clipboard size={40} opacity={0.2} style={{ marginBottom: "12px" }} />
        {search ? (
          <p>{t("no_records")}</p>
        ) : typeFiltered ? (
          <>
            <p>{t("no_records_of_type")}</p>
            <button type="button" className="settings-link-button" onClick={onClearTypeFilter}>
              {t("clear_filter")}
            </button>
          </>
        ) : (
          <>
            <p
              style={{
                fontSize: 'var(--font-size-lg)',
                fontWeight: "bold",
                color: "var(--text-primary)",
                marginBottom: "4px"
              }}
            >
              {t("empty_title")}
            </p>
            <p style={{ fontSize: 'var(--font-size-sm)', opacity: 0.6 }}>{t("empty_desc")}</p>
            {openHotkeyLabel && (
              <p style={{ fontSize: 'var(--font-size-sm)', opacity: 0.6 }}>
                {t("empty_hotkey_hint").replace("{hotkey}", openHotkeyLabel)}
              </p>
            )}
          </>
        )}
      </div>
    );
  }

  return (
    <>
      {filteredHistory.length > 0 && (
        <div className="history-list-container">
          <VirtualClipboardList
            ref={virtualListRef}
            items={filteredHistory}
            compactMode={compactMode}
            selectedIndex={selectedIndex}
            isKeyboardMode={isKeyboardMode}
            renderItem={renderVirtualItem}
            onLoadMore={loadMoreHistory}
            onScroll={handleListScroll}
            hasMore={hasMore}
            isLoading={isLoadingMore}
            loadingLabel={t("loading")}
            loadMoreLabel={t("load_more")}
          />
          {showScrollTop && (
            <button
              type="button"
              className="btn-icon scroll-top-button"
              onPointerDown={(event) => event.stopPropagation()}
              onClick={(event) => {
                event.stopPropagation();
                onScrollTop();
              }}
              aria-label={t("scroll_to_top")}
              title={t("scroll_to_top")}
            >
              <ArrowUp size={16} />
            </button>
          )}
        </div>
      )}
    </>
  );
};

export default AppMainContent;
