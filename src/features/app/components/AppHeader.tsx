import { useEffect, useRef, useState } from "react";
import type { MouseEvent, RefObject } from "react";
import {
  ArrowUpDown,
  Check,
  ChevronLeft,
  Pin,
  PinOff,
  Search,
  Settings as SettingsIcon,
  Smile,
  Trash2,
  X
} from "lucide-react";
import { invoke } from "@tauri-apps/api/core";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { isMacPlatform } from "../../../shared/lib/platform";
import { TYPE_FILTERS } from "../../../shared/lib/typeFilters";
import type { ClipboardSortMode } from "../types";

interface AppHeaderProps {
  t: (key: string) => string;
  showSettings: boolean;
  setShowSettings: (val: boolean) => void;
  showEmojiPanel: boolean;
  setShowEmojiPanel: (val: boolean) => void;
  emojiPanelEnabled: boolean;
  isWindowPinned: boolean;
  setIsWindowPinned: (val: boolean) => void;
  clearHistory: () => void;
  showSearchBox: boolean;
  search: string;
  setSearch: (val: string) => void;
  setIsComposing: (val: boolean) => void;
  searchInputRef: RefObject<HTMLInputElement | null>;
  setSearchIsFocused: (val: boolean) => void;
  theme: string;
  colorMode: string;
  settingsTitle: string;
  typeFilter: string | null;
  setTypeFilter: (val: string | null) => void;
  clipboardSortMode: ClipboardSortMode;
  onClipboardSortModeChange: (val: ClipboardSortMode) => void;
  onBack: () => void;
}

const AppHeader = ({
  t,
  showSettings,
  setShowSettings,
  showEmojiPanel,
  setShowEmojiPanel,
  emojiPanelEnabled,
  isWindowPinned,
  setIsWindowPinned,
  clearHistory,
  showSearchBox,
  search,
  setSearch,
  setIsComposing,
  searchInputRef,
  setSearchIsFocused,
  theme,
  colorMode,
  settingsTitle,
  typeFilter,
  setTypeFilter,
  clipboardSortMode,
  onClipboardSortModeChange,
  onBack
}: AppHeaderProps) => {
  const [sortMenuOpen, setSortMenuOpen] = useState(false);
  const sortMenuRef = useRef<HTMLDivElement | null>(null);

  const getTypeName = (type: string) => {
    switch (type) {
      case "code": return t('type_code');
      case "link":
      case "url": return t('type_url');
      case "file": return t('type_file');
      case "image": return t('type_image');
      case "video": return t('type_video');
      case "rich_text": return t('type_rich_text');
      default: return t('type_text');
    }
  };

  const searchVisible = showSearchBox || search.trim().length > 0;
  const isMac = isMacPlatform();
  const sortOptions: Array<{ value: ClipboardSortMode; label: string }> = [
    { value: "activity", label: t("clipboard_sort_activity") },
    { value: "created", label: t("clipboard_sort_created") },
    { value: "last_used", label: t("clipboard_sort_last_used") },
    { value: "usage", label: t("clipboard_sort_usage") }
  ];
  const activeSortLabel =
    sortOptions.find((option) => option.value === clipboardSortMode)?.label ||
    t("clipboard_sort_activity");

  useEffect(() => {
    if (!sortMenuOpen) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (!sortMenuRef.current?.contains(event.target as Node)) {
        setSortMenuOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setSortMenuOpen(false);
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [sortMenuOpen]);

  useEffect(() => {
    if (!searchVisible) setSortMenuOpen(false);
  }, [searchVisible]);

  // Tab can move to a category scrolled out of the row; bring it into view.
  const typeFiltersRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const row = typeFiltersRef.current;
    const active = row?.querySelector<HTMLElement>(".btn-icon.active");
    if (!row || !active) return;
    const rowBox = row.getBoundingClientRect();
    const box = active.getBoundingClientRect();
    if (box.left < rowBox.left) row.scrollLeft -= rowBox.left - box.left;
    else if (box.right > rowBox.right) row.scrollLeft += box.right - rowBox.right;
  }, [typeFilter]);

  const headerTitle = showEmojiPanel
    ? t('emoji_panel')
    : showSettings
      ? settingsTitle
      : t('app_name');

  const hideWindow = (e: MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    invoke("hide_window_cmd").catch(console.error);
  };

  return (
    <header
      onMouseDown={(e) => {
        // Only drag on left click
        if (e.button !== 0) return;

        // Don't drag if clicking on interactive elements
        const target = e.target as HTMLElement;
        if (target.closest('button, input, select, textarea, [role="button"]')) {
          return;
        }

        // Blur search input if focused
        if (searchInputRef.current && document.activeElement === searchInputRef.current) {
          searchInputRef.current.blur();
        }

        // Prevent default and start dragging
        e.preventDefault();
        getCurrentWindow().startDragging();
      }}
    >
      <div className="header-top">
        <div className="header-leading">
          {isMac && (
            // macOS draws its own close button here (macos_api/window.rs);
            // this keeps its place so the header lays out around it.
            <div className="mac-traffic-lights" aria-hidden="true">
              <span className="traffic-light-space" />
            </div>
          )}
          {(showSettings || showEmojiPanel) && (
            <button className="btn-icon header-back-btn" onClick={onBack} aria-label={t("back")} title={t("back")}>
              <ChevronLeft size={16} />
            </button>
          )}
          {showSettings || showEmojiPanel ? (
            <span className="header-title page-header-title is-page-title">{headerTitle}</span>
          ) : (
            <span className="brand-mark" role="img" aria-label={t("app_name")} />
          )}
        </div>

        <div className="header-drag-region">
          {/* Middle area for dragging */}
        </div>

        <div className="header-actions">
          {/* Pin Button */}
          <button
            className={`btn-icon header-pin-btn ${isWindowPinned ? 'active' : ''}`}
            title={t(isWindowPinned ? 'keep_window_open_on' : 'keep_window_open')}
            aria-label={t('keep_window_open')}
            aria-pressed={isWindowPinned}
            onClick={() => {
              const newVal = !isWindowPinned;
              setIsWindowPinned(newVal);
              invoke("set_window_pinned", { pinned: newVal }).catch(console.error);
            }}
          >
            {isWindowPinned ? <PinOff size={16} /> : <Pin size={16} />}
          </button>

          {!showSettings && !showEmojiPanel && (
            <>
              <button className="btn-icon" title={t('clear_history')} aria-label={t('clear_history')} onClick={clearHistory}>
                <Trash2 size={16} />
              </button>
              {emojiPanelEnabled && (
                <button className="btn-icon" title={t('emoji_panel')} aria-label={t('emoji_panel')} onClick={() => setShowEmojiPanel(true)}>
                  <Smile size={16} />
                </button>
              )}
              <button className="btn-icon" title={t('settings')} aria-label={t('settings')} onClick={() => setShowSettings(true)}>
                <SettingsIcon size={16} />
              </button>
            </>
          )}
          {!isMac && (
            <button
              className="btn-icon windows-close-btn"
              title={t('hide')}
              aria-label={t('hide')}
              onClick={hideWindow}
            >
              <X size={16} strokeWidth={2.2} />
            </button>
          )}
        </div>
      </div>

      {!showSettings && !showEmojiPanel && (
        <div
          className={`search-reveal${searchVisible ? " is-open" : ""}`}
          aria-hidden={!searchVisible}
        >
          <div className="search-reveal-inner">
            <div className="search-container">
                <div className="search-input-wrap">
                  <div className="search-input-row">
                    <span className="search-prompt" aria-hidden="true">
                      {theme === "terminal" ? "➜" : "%"}
                    </span>
                    <Search size={14} className="search-icon" />
                    <input
                    ref={searchInputRef}
                    type="text"
                    className="search-input has-sort-control"
                    placeholder={
                      theme === "terminal"
                        ? t("search_placeholder_terminal")
                        : t('search_placeholder')
                    }
                    value={search}
                    onCompositionStart={() => setIsComposing(true)}
                    onCompositionEnd={(e) => {
                      setIsComposing(false);
                      setSearch((e.target as HTMLInputElement).value);
                    }}
                    onChange={(e) => {
                      setSearch(e.target.value);
                    }}
                    onFocus={() => {
                      // Do not re-invoke activate here: a second focus bounce can
                      // blur the caret right after the user clicks the field.
                      setSortMenuOpen(false);
                      // The tag list opens on click only. The search hotkey
                      // focuses the field too, and the list then covered the
                      // type filters like an empty record (#170, #135).
                      setSearchIsFocused(true);
                    }}
                    onBlur={() => {
                      setTimeout(() => {
                        setSearchIsFocused(false);
                      }, 200);
                    }}
                    style={{ color: colorMode === 'dark' ? '#ffffff' : undefined }}
                  />
                    <div ref={sortMenuRef} className="clipboard-sort-anchor">
                      <button
                        type="button"
                        className={`clipboard-sort-trigger${sortMenuOpen ? " is-open" : ""}${clipboardSortMode !== "activity" ? " has-custom-sort" : ""}`}
                        aria-label={`${t("clipboard_sort")}: ${activeSortLabel}`}
                        aria-haspopup="menu"
                        aria-expanded={sortMenuOpen}
                        title={`${t("clipboard_sort")}: ${activeSortLabel}`}
                        onClick={() => {
                          setSortMenuOpen((open) => !open);
                        }}
                      >
                        <ArrowUpDown size={14} aria-hidden="true" />
                      </button>
                      {sortMenuOpen && (
                        <div className="clipboard-sort-menu" role="menu" aria-label={t("clipboard_sort")}>
                          <div className="clipboard-sort-menu-title">{t("clipboard_sort")}</div>
                          {sortOptions.map((option) => {
                            const selected = option.value === clipboardSortMode;
                            return (
                              <button
                                key={option.value}
                                type="button"
                                role="menuitemradio"
                                aria-checked={selected}
                                className={`clipboard-sort-option${selected ? " is-selected" : ""}`}
                                onClick={() => {
                                  onClipboardSortModeChange(option.value);
                                  setSortMenuOpen(false);
                                }}
                              >
                                <span>{option.label}</span>
                                <Check
                                  size={13}
                                  aria-hidden="true"
                                  className={selected ? undefined : "clipboard-sort-check-placeholder"}
                                />
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <div
                  ref={typeFiltersRef}
                  className="search-type-filters hide-scrollbar"
                  onWheel={(e) => {
                    e.stopPropagation();
                    if (e.deltaY !== 0) {
                      e.currentTarget.scrollLeft += e.deltaY;
                    }
                  }}
                >
                  {TYPE_FILTERS.map(type => (
                    <button
                      key={type ?? 'all'}
                      className={`btn-icon ${typeFilter === type ? 'active' : ''}`}
                      onClick={() => setTypeFilter(type)}
                      style={{
                        width: 'auto',
                        padding: '4px 8px',
                        fontSize: 'var(--font-size-xs)',
                        borderRadius: '4px',
                        whiteSpace: 'nowrap',
                        flexShrink: 0,
                        opacity: typeFilter === type ? 1 : 0.7
                      }}
                      title={type === null ? t('type_all') : getTypeName(type)}
                    >
                      {type === null ? t('type_all') : getTypeName(type)}
                    </button>
                  ))}
                </div>

            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default AppHeader;
