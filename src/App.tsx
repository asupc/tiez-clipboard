import { useEffect, useMemo, useRef, useCallback, useState, useDeferredValue } from "react";
import { pasteKeepsFormat } from "./shared/lib/clickPaste";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import ToastContainer from "./shared/components/ToastContainer";
import ConfirmDialog from "./shared/components/ConfirmDialog";

import { translations } from "./locales";
import AppHeader from "./features/app/components/AppHeader";
import AppMainContent from "./features/app/components/AppMainContent";
import { useAppState } from "./features/app/hooks/useAppState";
import { useSettingsPanelProps } from "./features/settings/hooks/useSettingsPanelProps";
import { useDebounce } from "./shared/hooks/useDebounce";
import { useHistoryFetch } from "./shared/hooks/useHistoryFetch";
import { useHotkeyConfig } from "./shared/hooks/useHotkeyConfig";
import { useFocusCoordinator } from "./shared/hooks/useFocusCoordinator";
import { focusClipboardWindow } from "./shared/lib/focus";
import { useSearchScroll } from "./shared/hooks/useSearchScroll";
import { useSettingsApply } from "./shared/hooks/useSettingsApply";
import { useSettingsInit } from "./shared/hooks/useSettingsInit";
import { useSettingsPostInit } from "./shared/hooks/useSettingsPostInit";
import { useSettingsSync } from "./shared/hooks/useSettingsSync";
import { useClipboardEvents } from "./shared/hooks/useClipboardEvents";
import { useClipboardActions } from "./shared/hooks/useClipboardActions";
import { useWindowPinnedListener } from "./shared/hooks/useWindowPinnedListener";
import { useToastListener } from "./shared/hooks/useToastListener";
import { useTrayMenuEvents } from "./shared/hooks/useTrayMenuEvents";
import { useAppBootstrap } from "./shared/hooks/useAppBootstrap";
import { useAppActions } from "./shared/hooks/useAppActions";
import { useNavigationSync } from "./shared/hooks/useNavigationSync";
import { useContextMenuBlock } from "./shared/hooks/useContextMenuBlock";
import { useSettingsPanelReset } from "./shared/hooks/useSettingsPanelReset";
import { matchesHotkey } from "./shared/hooks/useHotkeyMatching";
import { useFilteredHistory } from "./shared/hooks/useFilteredHistory";
import { useKeyboardNavigation } from "./shared/hooks/useKeyboardNavigation";
import { cycleTypeFilter } from "./shared/lib/typeFilters";
import { hasSensitiveTag } from "./shared/lib/sensitiveTags";
import { useListSelectionReset } from "./shared/hooks/useListSelectionReset";
import { useSearchFetchTrigger } from "./shared/hooks/useSearchFetchTrigger";
import { useScrollToSelection } from "./shared/hooks/useScrollToSelection";
import { useClipboardItemRenderer } from "./shared/hooks/useClipboardItemRenderer";
import { AnnouncementSystem } from "./shared/components/Announcement";
import { useAnnouncements } from "./shared/hooks/useAnnouncements";
import { useOverlays } from "./shared/hooks/useOverlays";
import type { ClipboardEntry } from "./shared/types";
import type { QuickPasteHint, VirtualClipboardListHandle } from "./features/clipboard/types";

import type { ClipboardSortMode, QuickPasteModifier } from "./features/app/types";
import {
  forceHideCompactPreviewWindow,
  isCompactPreviewWindowSupported,
  isCompactPreviewWarmupSupported,
  noteCompactPreviewClipboardShown,
  warmupCompactPreviewWindow
} from "./features/clipboard/lib/compactPreviewControls";
import { searchTopHitId } from "./features/clipboard/lib/itemInteraction";
import { isMacPlatform } from "./shared/lib/platform";
import { getHotkeyDisplayTokens } from "./shared/lib/hotkeyDisplay";
import { isTauriRuntime } from "./shared/lib/tauriRuntime";
import { getCurrentWindow } from "@tauri-apps/api/window";
import ClipboardDetailPane from "./features/clipboard/components/ClipboardDetailPane";
import { useSplitView } from "./features/app/hooks/useSplitView";
import { notePointerPick } from "./shared/lib/pointerPick";
import { useDetailPaneActions } from "./features/app/hooks/useDetailPaneActions";
import { useRevealReset } from "./features/app/hooks/useRevealReset";
import { usePaneWidth } from "./shared/hooks/usePaneWidth";
import PaneDivider from "./shared/components/PaneDivider";
import { quickPasteOrder } from "./shared/lib/quickPasteOrder";


const insertHistoryItem = (list: ClipboardEntry[], item: ClipboardEntry) => {
  const next = list.slice();
  const isPinned = !!item.is_pinned;
  let insertIndex = 0;

  if (isPinned) {
    while (insertIndex < next.length) {
      const current = next[insertIndex];
      if (!current.is_pinned) break;
      if ((current.sort_at || current.timestamp) < (item.sort_at || item.timestamp)) break;
      insertIndex++;
    }
  } else {
    while (insertIndex < next.length && next[insertIndex].is_pinned) {
      insertIndex++;
    }
    while (insertIndex < next.length) {
      const current = next[insertIndex];
      if (current.is_pinned) {
        insertIndex++;
        continue;
      }
      if ((current.sort_at || current.timestamp) < (item.sort_at || item.timestamp)) break;
      insertIndex++;
    }
  }

  next.splice(insertIndex, 0, item);
  return next;
};

const QUICK_PASTE_KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0"] as const;

const buildQuickPasteHintsById = (
  items: ClipboardEntry[],
  quickPasteModifier: QuickPasteModifier,
  listIsFiltered: boolean
): Record<number, QuickPasteHint> => {
  if (quickPasteModifier === "disabled") {
    return {};
  }

  const modifierLabels: Record<Exclude<QuickPasteModifier, "disabled">, string> = isMacPlatform()
    ? {
        ctrl: "⌃",
        alt: "⌥",
        shift: "⇧",
        win: "⌘"
      }
    : {
        ctrl: "Ctrl+",
        alt: "Alt+",
        shift: "Shift+",
        win: "Win+"
      };
  const pinnedItems = quickPasteOrder(items, listIsFiltered, QUICK_PASTE_KEYS.length);

  return pinnedItems.reduce<Record<number, QuickPasteHint>>((acc, item, index) => {
    acc[item.id] = {
      slot: index + 1,
      combo: `${modifierLabels[quickPasteModifier]}${QUICK_PASTE_KEYS[index]}`
    };
    return acc;
  }, {});
};

const App = () => {
  useFocusCoordinator();

  const appState = useAppState();
  const {
    showSettings,
    setShowSettings,
    setCollapsedGroups,
    history,
    setHistory,
    clipboardSortMode,
    setClipboardSortMode,
    search,
    setSearch,
    isComposing,
    setIsComposing,
    searchIsFocused,
    setSearchIsFocused,
    showEmojiPanel,
    setShowEmojiPanel,
    emojiFavorites,
    setEmojiFavorites,
    revealedIds,
    setRevealedIds,
    setAutoStart,
    setElevatedAutostart,
    deduplicate,
    setDeduplicate,
    persistent,
    setPersistent,
    persistentLimitEnabled,
    setPersistentLimitEnabled,
    persistentLimit,
    setPersistentLimit,
    setAppSettings,
    setDataPath,
    hotkey,
    setHotkey,
    sequentialHotkey,
    setSequentialHotkey,
    plainPasteHotkey,
    setPlainPasteHotkey,
    searchHotkey,
    setSearchHotkey,
    quickPasteModifier,
    setQuickPasteModifier,
    sequentialMode,
    setSequentialModeState,
    isRecording,
    setIsRecording,
    isRecordingSequential,
    setIsRecordingSequential,
    isRecordingPlain,
    setIsRecordingPlain,
    isRecordingSearch,
    setIsRecordingSearch,
    deleteAfterPaste,
    setDeleteAfterPaste,
    moveToTopAfterPaste,
    clickCopyOnly,
    clickPasteMode,
    setClickPasteMode,
    setMoveToTopAfterPaste,
    setClickCopyOnly,
    privacyProtection,
    setPrivacyProtection,
    sensitiveMaskPrefixVisible,
    setSensitiveMaskPrefixVisible,
    sensitiveMaskSuffixVisible,
    setSensitiveMaskSuffixVisible,
    sensitiveMaskEmailDomain,
    setSensitiveMaskEmailDomain,
    setPrivacyProtectionKinds,
    setPrivacyProtectionCustomRules,
    captureFiles,
    setCaptureFiles,
    captureRichText,
    setCaptureRichText,
    richTextSnapshotPreview,
    setRichTextSnapshotPreview,
    setSilentStart,
    setFollowMouse,
    showAppBorder,
    setShowAppBorder,
    setRegistryWinVEnabled,
    setPasteMethod,
    theme,
    setTheme,
    setNativePalette,
    colorMode,
    nativePalette,
    setColorMode,
    showSourceAppIcon,
    setShowSourceAppIcon,
    hideUnselectedItemActions,
    setHideUnselectedItemActions,

    compactMode,
    setCompactMode,
    compactShowTime,
    setCompactShowTime,
    splitViewEnabled,
    setSplitViewEnabled,
    clipboardItemFontSize,
    setClipboardItemFontSize,
    emojiPanelEnabled,
    setEmojiPanelEnabled,
    emojiPanelTab,
    setEmojiPanelTab,
    settingsLoaded,
    setSettingsLoaded,
    isWindowPinned,
    setIsWindowPinned,
    searchBoxPinned,
    setSearchBoxPinned,
    showSearchBox,
    setShowSearchBox,
    scrollTopButtonEnabled,
    setScrollTopButtonEnabled,
    arrowKeySelection,
    setArrowKeySelection,
    setLightModeEnabled,
    setLightModeIdleMinutes,
    setHideTrayIcon,
    setEdgeDocking,
    surfaceOpacity,
    setSurfaceOpacity,
    selectedIndex,
    setSelectedIndex,
    selectedItemId,
    setSelectedItemId,
    isKeyboardMode,
    setIsKeyboardMode,
    isLoadingMore,
    setIsLoadingMore,
    hasMore,
    setHasMore,
    currentOffset,
    setCurrentOffset,
    setSoundEnabled,
    setPasteSoundEnabled,
    soundVolume,
    setSoundVolume,
    typeFilter,
    setTypeFilter
  } = appState;

  const effectiveShowEmojiPanel = showEmojiPanel && emojiPanelEnabled;

  const debouncedSearch = useDebounce(search, 200);
  const deferredSearch = useDeferredValue(search);
  const searchInputRef = useRef<HTMLInputElement | null>(null);


  const virtualListRef = useRef<VirtualClipboardListHandle | null>(null);
  const appContainerRef = useRef<HTMLDivElement | null>(null);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const listIsFiltered = typeFilter !== null || debouncedSearch.trim() !== "";
  const quickPasteHintsById = useMemo(
    () => buildQuickPasteHintsById(history, quickPasteModifier, listIsFiltered),
    [history, quickPasteModifier, listIsFiltered]
  );
  const PAGE_SIZE = 80;
  const { fetchHistory, loadMoreHistory } = useHistoryFetch({
    debouncedSearch,
    typeFilter,
    sortMode: clipboardSortMode,
    persistentLimitEnabled,
    persistentLimit,
    pageSize: PAGE_SIZE,
    currentOffset,
    historyLength: history.length,
    setHistory,
    setCurrentOffset,
    setHasMore,
    isLoadingMore,
    hasMore,
    setIsLoadingMore
  });

  const t = useCallback((key: string) => {
    const k = key as keyof typeof translations.zh;
    return translations.zh[k] || key;
  }, []);

  const { handleListScroll: handleSearchScroll } = useSearchScroll({
    containerRef: appContainerRef,
    searchBoxPinned,
    showSearchBox,
    setShowSearchBox,
    search,
    showSettings
  });

  const showScrollTopVisible = showScrollTop && scrollTopButtonEnabled;

  const handleHeaderBack = useCallback(() => {
    if (effectiveShowEmojiPanel) {
      setShowEmojiPanel(false);
      return;
    }
    if (showSettings) {
      setShowSettings(false);
    }
  }, [
    effectiveShowEmojiPanel,
    setShowEmojiPanel,
    setShowSettings,
    showSettings
  ]);

  const handleListScroll = useCallback((offset: number) => {
    handleSearchScroll(offset);
    setShowScrollTop((prev) => {
      const next = offset > 200;
      return prev === next ? prev : next;
    });
  }, [handleSearchScroll]);

  const handleScrollTop = useCallback(() => {
    if (virtualListRef.current?.scrollToTop) {
      virtualListRef.current.scrollToTop();
      return;
    }
    virtualListRef.current?.scrollToItem(0);
  }, []);

  const toggleGroup = (group: string) => {
    setCollapsedGroups(prev => ({
      ...prev,
      [group]: !prev[group],
    }));
  };

  const hotkeyParts = useMemo(
    () => (hotkey || '').split('+').map((part) => part.trim()).filter(Boolean),
    [hotkey]
  );

  useEffect(() => {
    const handleKeydown = (event: KeyboardEvent) => {
      if (isRecording || isRecordingSequential || isRecordingPlain || isRecordingSearch) return;
      if (!hotkey || hotkey === t('not_set')) return;

      const activeEl = document.activeElement as HTMLElement | null;
      const isEditable = !!activeEl && (
        activeEl.tagName === 'INPUT' ||
        activeEl.tagName === 'TEXTAREA' ||
        activeEl.isContentEditable
      );

      if (matchesHotkey(event, hotkey)) {
        event.preventDefault();
        invoke("toggle_window_cmd").catch(console.error);
        return;
      }

      if (!isEditable && hotkey.toUpperCase().includes('WIN') && matchesHotkey(event, hotkey, { ignoreWin: true })) {
        event.preventDefault();
        invoke("toggle_window_cmd").catch(console.error);
      }
    };

    window.addEventListener('keydown', handleKeydown, true);
    return () => window.removeEventListener('keydown', handleKeydown, true);
  }, [hotkey, isRecording, isRecordingSequential, isRecordingPlain, isRecordingSearch, t]);


  const { toasts, pushToast, confirmDialog, openConfirm, closeConfirm } = useOverlays(t);


  const { announcements, dismissAnnouncement } = useAnnouncements();


  const settings = useSettingsInit({
    setAppSettings,
    setHotkey,
    setTheme,
    setNativePalette,
    setColorMode,
    setCompactMode
  });

  // After light mode rebuilds the WebView, Rust shows the window only once this
  // arrives, so the first frame is the themed UI rather than an empty shell.
  // Effects run while the window is still hidden (unlike requestAnimationFrame).
  useEffect(() => {
    if (!settings || !isTauriRuntime()) return;
    invoke("main_ui_ready").catch(() => { /* older backend: it times out instead */ });
  }, [settings]);

  useSettingsPostInit({
    settings,
    setSurfaceOpacity,
    setClipboardItemFontSize,
    setEmojiPanelEnabled,
    setEmojiPanelTab,
    setEmojiFavorites,
    setPersistent,
    setPersistentLimitEnabled,
    setPersistentLimit,
    setClipboardSortMode,
    setDeduplicate,
    setCaptureFiles,
    setCaptureRichText,
    setRichTextSnapshotPreview,
    setPrivacyProtection,
    setPrivacyProtectionKinds,
    setPrivacyProtectionCustomRules,
    setSensitiveMaskPrefixVisible,
    setSensitiveMaskSuffixVisible,
    setSensitiveMaskEmailDomain,
    setSilentStart,
    setFollowMouse,
    setShowAppBorder,
    setRegistryWinVEnabled,
    setPasteMethod,
    setShowSourceAppIcon,
    setHideUnselectedItemActions,
    setCompactShowTime,
    setSplitViewEnabled,

    setDeleteAfterPaste,
    setMoveToTopAfterPaste,
    setClickCopyOnly,
    setClickPasteMode,
    setHideTrayIcon,
    setEdgeDocking,
    setSearchBoxPinned,
    setShowSearchBox,
    setScrollTopButtonEnabled,
    setArrowKeySelection,
    setLightModeEnabled,
    setLightModeIdleMinutes,
    setSequentialHotkey,
    setPlainPasteHotkey,
    setSearchHotkey,
    setQuickPasteModifier,
    setSequentialModeState,
    setSoundEnabled,
    setPasteSoundEnabled,
    setSoundVolume,
    setIsWindowPinned,
    setSettingsLoaded
  });

  const focusSearchBox = useCallback(() => {
    setShowSettings(false);
    setShowEmojiPanel(false);
    setShowSearchBox(true);
    setSearchIsFocused(true);
    focusClipboardWindow()
      .catch(console.error)
      .finally(() => {
        requestAnimationFrame(() => {
          searchInputRef.current?.focus();
        });
      });
  }, [
    setShowSettings,
    setShowEmojiPanel,
    setShowSearchBox,
    setSearchIsFocused,
    searchInputRef
  ]);

  useEffect(() => {
    if (!isTauriRuntime()) return;

    let disposed = false;
    const unlistenPromise = listen("focus-search", () => {
      if (disposed) return;
      focusSearchBox();
    });

    return () => {
      disposed = true;
      unlistenPromise.then((unlisten) => unlisten()).catch(() => { });
    };
  }, [focusSearchBox]);

  useEffect(() => {
    const handleSearchKeydown = (event: KeyboardEvent) => {
      if (isRecording || isRecordingSequential || isRecordingPlain || isRecordingSearch) return;
      if (!searchHotkey || searchHotkey === t('not_set')) return;
      if (matchesHotkey(event, searchHotkey)) {
        event.preventDefault();
        focusSearchBox();
      }
    };

    window.addEventListener('keydown', handleSearchKeydown, true);
    return () => window.removeEventListener('keydown', handleSearchKeydown, true);
  }, [searchHotkey, isRecording, isRecordingSequential, isRecordingPlain, isRecordingSearch, t, focusSearchBox]);

  // Ctrl/Cmd+F → TieZ search (browser find is already blocked globally; this routes it).
  useEffect(() => {
    const onFind = (event: KeyboardEvent) => {
      if (isRecording || isRecordingSequential || isRecordingPlain || isRecordingSearch) return;
      if (showSettings || effectiveShowEmojiPanel) return;

      const key = event.key.toLowerCase();
      const isFind =
        ((event.ctrlKey || event.metaKey) && !event.altKey && !event.shiftKey && key === "f") ||
        (key === "f3" && !event.ctrlKey && !event.metaKey && !event.altKey);
      if (!isFind) return;

      event.preventDefault();
      event.stopPropagation();
      focusSearchBox();
    };

    window.addEventListener("keydown", onFind, true);
    return () => window.removeEventListener("keydown", onFind, true);
  }, [
    isRecording,
    isRecordingSequential,
    isRecordingPlain,
    isRecordingSearch,
    showSettings,
    effectiveShowEmojiPanel,
    focusSearchBox
  ]);

  useEffect(() => {
    if (!emojiPanelEnabled && showEmojiPanel) {
      setShowEmojiPanel(false);
    }
  }, [emojiPanelEnabled, showEmojiPanel, setShowEmojiPanel]);

  useAppBootstrap({
    setDataPath,
    setAutoStart,
    setElevatedAutostart
  });

  useWindowPinnedListener({
    onPinnedChange: setIsWindowPinned
  });

  useContextMenuBlock();

  useSettingsApply({
    theme,
    nativePalette,
    colorMode,

    compactMode,
    compactShowTime,
    hideUnselectedItemActions,
    settingsLoaded,
    clipboardItemFontSize,
    surfaceOpacity,
    showAppBorder
  });

  // Pre-warm compact preview window only where warmup is safe.
  // macOS keeps hover preview enabled but skips warmup to reduce UI stalls.
  useEffect(() => {
    if (!compactMode || !isCompactPreviewWindowSupported() || !isCompactPreviewWarmupSupported()) return;
    const timer = setTimeout(() => {
      warmupCompactPreviewWindow();
    }, 2000); // 2s delay: avoids impacting app startup performance
    return () => clearTimeout(timer);
  }, [compactMode]);

  useEffect(() => {
    if (!isTauriRuntime()) return;
    const unlistenForceHide = listen("force-hide-compact-preview", () => {
      forceHideCompactPreviewWindow();
    });
    // Opening under the cursor synthesizes mouseenter — arm the move gate
    // and hide any preview that may already be mid-flight.
    const onShown = () => {
      noteCompactPreviewClipboardShown();
    };
    // Each opening starts unfiltered: a type filter is for digging out one
    // item, not a mode to keep (#142). A pinned window never reopens, so its
    // filter stays.
    const onClipboardShown = () => {
      onShown();
      setTypeFilter(null);
    };
    const unlistenClipboardShown = listen("clipboard-shown", onClipboardShown);
    const unlistenShow = getCurrentWindow().listen("tauri://show", onShown);
    return () => {
      unlistenForceHide.then((off) => off());
      unlistenClipboardShown.then((off) => off());
      unlistenShow.then((off) => off()).catch(() => {});
    };
  }, [setTypeFilter]);

  useRevealReset(setRevealedIds);

  useClipboardEvents({
    onUpdated: (updatedItem) => {
      setHistory(prev => {
        const withoutItem = prev.filter(item => item.id !== updatedItem.id);
        return insertHistoryItem(withoutItem, updatedItem);
      });
    },
    onRemoved: (id) => {
      setHistory(prev => prev.filter(item => item.id !== id));
    },
    onChanged: () => {
      fetchHistory(true, true);
    }
  });


  useToastListener({ pushToast });

  // Tray menu "Settings…": the window is already open, show the settings page.
  const openSettingsFromTray = useCallback(() => {
    setShowEmojiPanel(false);
    setShowSettings(true);
  }, [setShowEmojiPanel, setShowSettings]);
  useTrayMenuEvents({ openSettings: openSettingsFromTray });

  useSettingsPanelReset({ showSettings, setCollapsedGroups });

  const saveAppSetting = useCallback(async (type: string, path: string) => {
    const key = `app.${type}`;
    console.log(`[THEME DEBUG] saveAppSetting called: key=${key}, value=${path}`);
    setAppSettings(prev => ({ ...prev, [key]: path }));

    // Sync theme-related settings to localStorage for instant startup (prevents flash)
    try {
      if (type === 'native_palette') localStorage.setItem('tiez_native_palette', path);
      if (type === 'theme') localStorage.setItem('tiez_theme', path);
      if (type === 'color_mode') localStorage.setItem('tiez_color_mode', path);
      if (type === 'compact_mode') localStorage.setItem('tiez_compact_mode', path);
      if (type === 'compact_show_time') localStorage.setItem('tiez_compact_show_time', path);
    } catch (e) {
      // Ignore localStorage errors
    }

    try {
      await invoke("save_setting", { key, value: path });
      console.log(`[THEME DEBUG] saveAppSetting success: key=${key}`);
    } catch (err) {
      console.error("保存设置失败", err);
    }
  }, [setAppSettings]);

  const saveSetting = useCallback((key: string, val: string) => {
    invoke("save_setting", { key, value: val }).catch(console.error);
  }, []);

  const updateClipboardSortMode = useCallback(
    (mode: ClipboardSortMode) => {
      setClipboardSortMode(mode);
      saveSetting("app.clipboard_sort_mode", mode);
    },
    [saveSetting, setClipboardSortMode]
  );

  useSettingsSync({
    settingsLoaded,
    deduplicate,
    saveAppSetting,
    captureFiles,
    captureRichText,
    persistent,
    arrowKeySelection,
    soundVolume,
    setIsKeyboardMode,
    setSelectedIndex
  });

  const {
    checkHotkeyConflict,
    updateHotkey,
    updateSequentialHotkey,
    updatePlainPasteHotkey,
    updateSearchHotkey
  } =
    useHotkeyConfig({
      hotkey,
      setHotkey,
      sequentialHotkey,
      setSequentialHotkey,
      plainPasteHotkey,
      setPlainPasteHotkey,
      searchHotkey,
      setSearchHotkey,
      sequentialMode,
      isRecording,
      setIsRecording,
      isRecordingSequential,
      setIsRecordingSequential,
      isRecordingPlain,
      setIsRecordingPlain,
      isRecordingSearch,
      setIsRecordingSearch,
      saveAppSetting,
      t,
      pushToast
    });

  useNavigationSync({
    showSettings,
    showEmojiPanel: effectiveShowEmojiPanel,
    editingInline: false,
    dialogOpen: confirmDialog.show,
    searchInputRef
  });

  const { copyToClipboard, copyWithoutPaste, deleteEntry, deleteEntryById } =
    useClipboardActions({
      t,
      pushToast,
      deleteAfterPaste,
      moveToTopAfterPaste,
      clickCopyOnly,
      isWindowPinned,
      setSearch,
      setHistory
    });

  const { clearHistory, handleResetSettings } = useAppActions({
    t,
    openConfirm,
    closeConfirm,
    pushToast,
    fetchHistory
  });

  // Rows and the detail pane say which action asked for the paste: primary
  // (left click, the Paste button) or secondary (right click). Which of the
  // two keeps the formatting is the user's setting.
  const copyByButton = useCallback(
    (id: number, content: string, contentType: string, primary = true, isPinned?: boolean, tags?: string[]) =>
      copyToClipboard(id, content, contentType, pasteKeepsFormat(clickPasteMode, primary), isPinned, tags),
    [copyToClipboard, clickPasteMode]
  );

  /*
  const updateItemContent = async (id: number, newContent: string) => {
    try {
      await invoke("update_item_content", { id, newContent });
      // Local state will be refreshed by fetchHistory triggered by clipboard-changed event
    } catch (err) {
      console.error("Failed to update item content", err);
    }
  };
  */

  const filteredHistory = useFilteredHistory({
    history,
    search: deferredSearch,
    typeFilter,
    sortMode: clipboardSortMode
  });
  const navigableHistory = filteredHistory;

  const effectiveHasMore = hasMore && filteredHistory.length >= PAGE_SIZE;

  // The mouse and the arrow keys share one selection: a row the pointer moves
  // onto becomes it, and the keys go on from there.
  const selectRowUnderPointer = useCallback((index: number, id: number) => {
    notePointerPick(id);
    setSelectedIndex(index);
    setSelectedItemId(id);
    setIsKeyboardMode(true);
  }, [setSelectedIndex, setSelectedItemId, setIsKeyboardMode]);
  const { splitActive, detailItem, handleListMouseMove, handleListMouseLeave, focusDetailItem } = useSplitView({
    enabled: splitViewEnabled,
    listVisible: !showSettings && !showEmojiPanel,
    items: navigableHistory,
    selectedItemId,
    isKeyboardMode,
    onPointerSelect: arrowKeySelection ? selectRowUnderPointer : undefined
  });
  const mainRef = useRef<HTMLElement | null>(null);
  const splitListRef = useRef<HTMLDivElement | null>(null);
  // Stored as the list's share of the width so the split survives window resizes.
  const { value: splitRatio, resizing: splitResizing, dividerProps: splitDividerProps } = usePaneWidth({
    storageKey: "app.pane.clipboard_split",
    containerRef: mainRef,
    paneRef: splitListRef,
    min: 240,
    minRest: 280,
    unit: "ratio"
  });
  // Show / hide only means something while 隐藏隐私 is on.
  const detailCanReveal = !!detailItem && privacyProtection && hasSensitiveTag(detailItem.tags);
  const detailIsRevealed = !!detailItem && revealedIds.has(detailItem.id);
  const detailActions = useDetailPaneActions({
    items: navigableHistory,
    focusDetailItem,
    copyToClipboard: copyByButton,
    deleteEntry,
    setRevealedIds
  });

  useListSelectionReset({
    filteredHistory: navigableHistory,
    selectedItemId,
    setSelectedIndex,
    setSelectedItemId
  });

  useSearchFetchTrigger({ debouncedSearch, isComposing, typeFilter, sortMode: clipboardSortMode, fetchHistory });

  useScrollToSelection({
    filteredHistory: navigableHistory,
    selectedIndex,
    isKeyboardMode,
    virtualListRef
  });

  const deleteFromKeyboard = useCallback(async (item: ClipboardEntry) => {
    return deleteEntryById(item.id);
  }, [deleteEntryById]);

  const cycleCategory = useCallback((step: 1 | -1) => {
    setTypeFilter((current) => cycleTypeFilter(current, step));
    // The tabs hide with the search box; show them so the change is visible.
    setShowSearchBox(true);
  }, [setTypeFilter, setShowSearchBox]);

  const clearTypeFilter = useCallback(() => setTypeFilter(null), [setTypeFilter]);
  // Shown in the empty list, so a first-time user learns how to come back.
  const openHotkeyLabel = useMemo(() => {
    if (!hotkey || hotkey === t('not_set')) return "";
    const mac = isMacPlatform();
    return getHotkeyDisplayTokens(hotkey, { preferMacSymbols: mac }).map((token) => token.label).join(mac ? "" : " + ");
  }, [hotkey, t]);

  // After a search, Enter pastes the first result; it shows as selected until
  // the arrow keys or the mouse pick a row.
  const topHitId = searchTopHitId({
    searchFocused: searchIsFocused,
    search,
    listIsCurrent: deferredSearch === search && debouncedSearch === search,
    isComposing,
    isKeyboardMode,
    firstItemId: navigableHistory[0]?.id ?? null
  });

  const { selectItemByIndex } = useKeyboardNavigation({
    filteredHistory: navigableHistory,
    selectedIndex,
    selectedItemId,
    setSelectedIndex,
    setSelectedItemId,
    isKeyboardMode,
    setIsKeyboardMode,
    showSettings,
    showEmojiPanel: effectiveShowEmojiPanel,
    arrowKeySelection,
    plainPasteHotkey,
    searchInputRef,
    copyToClipboard,
    copyWithoutPaste,
    cycleCategory,
    setSearch,
    searchTopHitId: topHitId,
    primaryPasteKeepsFormat: pasteKeepsFormat(clickPasteMode, true),
    deleteItem: deleteFromKeyboard
  });


  const { renderItemContent } = useClipboardItemRenderer({
    privacyProtection,
    revealedIds,
    isKeyboardMode,
    selectedItemId,
    searchTopHitId: topHitId,
    detailFocusedId: detailItem?.id ?? null,
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
    copyToClipboard: copyByButton,
    selectItemByIndex,
    setRevealedIds,
    deleteEntry
  });

  const settingsPanelProps = useSettingsPanelProps({
    t,
    theme,
    colorMode,
    hotkeyParts,
    checkHotkeyConflict,
    updateHotkey,
    updateSequentialHotkey,
    updatePlainPasteHotkey,
    updateSearchHotkey,
    saveAppSetting,
    handleResetSettings,
    toggleGroup,
    state: appState
  });

  return (
    <div
      ref={appContainerRef}
      className="app-container"
    >
      <AppHeader
        t={t}
        showSettings={showSettings}
        setShowSettings={setShowSettings}
        showEmojiPanel={effectiveShowEmojiPanel}
        setShowEmojiPanel={setShowEmojiPanel}
        emojiPanelEnabled={emojiPanelEnabled}
        isWindowPinned={isWindowPinned}
        setIsWindowPinned={setIsWindowPinned}
        clearHistory={clearHistory}
        showSearchBox={showSearchBox}
        search={search}
        setSearch={setSearch}
        setIsComposing={setIsComposing}
        searchInputRef={searchInputRef}
        setSearchIsFocused={setSearchIsFocused}
        theme={theme}
        colorMode={colorMode}
        settingsTitle={t("settings")}
        typeFilter={typeFilter}
        setTypeFilter={setTypeFilter}
        clipboardSortMode={clipboardSortMode}
        onClipboardSortModeChange={updateClipboardSortMode}
        onBack={handleHeaderBack}
      />

      <AnnouncementSystem
        closeLabel={t('close')}
        announcements={announcements}
        onDismiss={dismissAnnouncement}
      />

      <main
        ref={mainRef}
        className={`main-content${showSettings ? " settings-mode" : ""}${splitActive ? " is-split" : ""}`}
        style={{
          ...(splitRatio != null
            ? { ["--split-columns" as string]: `minmax(240px, ${splitRatio * 100}fr) minmax(0, ${(1 - splitRatio) * 100}fr)` }
            : {})
        }}
      >
        <div
          ref={splitListRef}
          className="main-split-list"
          onMouseMove={handleListMouseMove}
          onMouseLeave={handleListMouseLeave}
        >
          <AppMainContent
            t={t}
            showSettings={showSettings}
            showEmojiPanel={effectiveShowEmojiPanel}
            settingsPanelProps={settingsPanelProps}
            emojiFavorites={emojiFavorites}
            setEmojiFavorites={setEmojiFavorites}
            emojiPanelTab={emojiPanelTab}
            setEmojiPanelTab={setEmojiPanelTab}
            saveSetting={saveSetting}
            filteredHistory={filteredHistory}
            search={search}
            typeFiltered={typeFilter !== null}
            onClearTypeFilter={clearTypeFilter}
            openHotkeyLabel={openHotkeyLabel}
            compactMode={compactMode}
            selectedIndex={selectedIndex}
            isKeyboardMode={isKeyboardMode}
            virtualListRef={virtualListRef}
            renderItemContent={renderItemContent}
            loadMoreHistory={loadMoreHistory}
            handleListScroll={handleListScroll}
            hasMore={effectiveHasMore}
            isLoadingMore={isLoadingMore}
            showScrollTop={showScrollTopVisible}
            onScrollTop={handleScrollTop}
          />
        </div>
        {/* Always mounted as the grid's second column; content only when wide. */}
        <aside className="main-split-detail" aria-hidden={!splitActive}>
          {splitActive && (
            <PaneDivider overlay active={splitResizing} label={t("pane_divider_hint")} {...splitDividerProps} />
          )}
          {splitActive && (
            <ClipboardDetailPane
              item={detailItem}
              t={t}
              actions={detailActions}
              canReveal={detailCanReveal}
              isSensitiveHidden={detailCanReveal && !detailIsRevealed}
              isRevealed={detailIsRevealed}
              showSourceAppIcon={showSourceAppIcon}
            />
          )}
        </aside>
      </main>

      <ToastContainer toasts={toasts} />

      <ConfirmDialog
        open={confirmDialog.show}
        title={confirmDialog.title}
        message={confirmDialog.message}
        theme={theme}
        danger={confirmDialog.danger}
        confirmLabel={confirmDialog.confirmLabel ?? t('confirm')}
        cancelLabel={t('cancel')}
        onClose={closeConfirm}
        onConfirm={confirmDialog.onConfirm}
      />

    </div >
  );
}

export default App;
