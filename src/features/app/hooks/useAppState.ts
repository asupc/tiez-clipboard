import { useState } from "react";
import { DEFAULT_CLICK_PASTE_MODE, type ClickPasteMode } from "../../../shared/lib/clickPaste";
import { DEFAULT_THEME } from "../../../shared/config/themes";
import type { ClipboardEntry } from "../../../shared/types";
import type {
  AppState,
  ClipboardSortMode,
  QuickPasteModifier
} from "../types";
import { DEFAULT_COLLAPSED_GROUPS } from "../../settings/types";

export const useAppState = (): AppState => {
  const [showSettings, setShowSettings] = useState(false);
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>(DEFAULT_COLLAPSED_GROUPS);
  const [history, setHistory] = useState<ClipboardEntry[]>([]);
  const [clipboardSortMode, setClipboardSortMode] =
    useState<ClipboardSortMode>("activity");
  const [search, setSearch] = useState("");
  const [isComposing, setIsComposing] = useState(false);
  const [searchIsFocused, setSearchIsFocused] = useState(false);
  const [showEmojiPanel, setShowEmojiPanel] = useState(false);
  const [emojiFavorites, setEmojiFavorites] = useState<string[]>([]);
  const [revealedIds, setRevealedIds] = useState<Set<number>>(new Set());
  const [autoStart, setAutoStart] = useState(true);
  const [elevatedAutostart, setElevatedAutostart] = useState(false);
  const [deduplicate, setDeduplicate] = useState(true);
  const [persistent, setPersistent] = useState(true);
  const [persistentLimitEnabled, setPersistentLimitEnabled] = useState(true);
  const [persistentLimit, setPersistentLimit] = useState<number>(1000);
  const [appSettings, setAppSettings] = useState<Record<string, string>>({});
  const [dataPath, setDataPath] = useState<string>("");
  const [hotkey, setHotkey] = useState<string>("Alt+C");
  const [sequentialHotkey, setSequentialHotkey] = useState<string>("Alt+V");
  const [plainPasteHotkey, setPlainPasteHotkey] = useState<string>("Alt+Shift+V");
  const [searchHotkey, setSearchHotkey] = useState<string>("Alt+F");
  const [quickPasteModifier, setQuickPasteModifier] =
    useState<QuickPasteModifier>("disabled");
  const [sequentialMode, setSequentialModeState] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isRecordingSequential, setIsRecordingSequential] = useState(false);
  const [isRecordingPlain, setIsRecordingPlain] = useState(false);
  const [isRecordingSearch, setIsRecordingSearch] = useState(false);
  const [deleteAfterPaste, setDeleteAfterPaste] = useState(false);
  const [moveToTopAfterPaste, setMoveToTopAfterPaste] = useState(false);
  const [clickCopyOnly, setClickCopyOnly] = useState(false);
  const [clickPasteMode, setClickPasteMode] = useState<ClickPasteMode>(DEFAULT_CLICK_PASTE_MODE);
  const [privacyProtection, setPrivacyProtection] = useState(false);
  const [privacyProtectionKinds, setPrivacyProtectionKinds] = useState<string[]>([
    "phone",
    "idcard",
    "email",
    "secret"
  ]);
  const [privacyProtectionCustomRules, setPrivacyProtectionCustomRules] = useState<string>("");
  const [sensitiveMaskPrefixVisible, setSensitiveMaskPrefixVisible] = useState(3);
  const [sensitiveMaskSuffixVisible, setSensitiveMaskSuffixVisible] = useState(3);
  const [sensitiveMaskEmailDomain, setSensitiveMaskEmailDomain] = useState(false);
  const [captureFiles, setCaptureFiles] = useState(true);
  const [captureRichText, setCaptureRichText] = useState(false);
  const [richTextSnapshotPreview, setRichTextSnapshotPreview] = useState(false);
  const [silentStart, setSilentStart] = useState(true);
  const [followMouse, setFollowMouse] = useState(false);
  const [showAppBorder, setShowAppBorder] = useState(false);
  const [registryWinVEnabled, setRegistryWinVEnabled] = useState(false);
  const [pasteMethod, setPasteMethod] = useState("auto");
  const [theme, setTheme] = useState(DEFAULT_THEME);
  const [nativePalette, setNativePalette] = useState("default");
  const [colorMode, setColorMode] = useState("system");
  const [showSourceAppIcon, setShowSourceAppIcon] = useState(true);
  const [hideUnselectedItemActions, setHideUnselectedItemActions] = useState(false);

  const [compactMode, setCompactMode] = useState(false);
  const [compactShowTime, setCompactShowTime] = useState(false);
  const [splitViewEnabled, setSplitViewEnabled] = useState(true);
  const [clipboardItemFontSize, setClipboardItemFontSize] = useState(13);
  const [emojiPanelEnabled, setEmojiPanelEnabled] = useState(false);
  const [emojiPanelTab, setEmojiPanelTab] = useState<"emoji" | "favorites">("emoji");
  const [showHotkeyHint, setShowHotkeyHint] = useState(false);
  const [settingsLoaded, setSettingsLoaded] = useState(false);
  const [isWindowPinned, setIsWindowPinned] = useState(false);
  /** Persistent preference: search bar always visible (settings toggle). */
  const [searchBoxPinned, setSearchBoxPinned] = useState(true);
  /** Transient UI visibility (may temporarily differ from pinned via scroll reveal). */
  const [showSearchBox, setShowSearchBox] = useState(true);
  const [scrollTopButtonEnabled, setScrollTopButtonEnabled] = useState(true);
  const [arrowKeySelection, setArrowKeySelection] = useState(true);
  const [lightModeEnabled, setLightModeEnabled] = useState(false);
  const [lightModeIdleMinutes, setLightModeIdleMinutes] = useState(15);
  const [hideTrayIcon, setHideTrayIcon] = useState(false);
  const [edgeDocking, setEdgeDocking] = useState(false);
  const [surfaceOpacity, setSurfaceOpacity] = useState(50);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [selectedItemId, setSelectedItemId] = useState<number | null>(null);
  const [isKeyboardMode, setIsKeyboardMode] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [currentOffset, setCurrentOffset] = useState(0);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [pasteSoundEnabled, setPasteSoundEnabled] = useState(true);
  const [soundVolume, setSoundVolume] = useState(1.0);
  const [typeFilter, setTypeFilter] = useState<string | null>(null);

  return {
    showSettings,
    setShowSettings,
    collapsedGroups,
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
    autoStart,
    setAutoStart,
    elevatedAutostart,
    setElevatedAutostart,
    deduplicate,
    setDeduplicate,
    persistent,
    setPersistent,
    persistentLimitEnabled,
    setPersistentLimitEnabled,
    persistentLimit,
    setPersistentLimit,
    appSettings,
    setAppSettings,
    dataPath,
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
    privacyProtectionKinds,
    setPrivacyProtectionKinds,
    privacyProtectionCustomRules,
    setPrivacyProtectionCustomRules,
    sensitiveMaskPrefixVisible,
    setSensitiveMaskPrefixVisible,
    sensitiveMaskSuffixVisible,
    setSensitiveMaskSuffixVisible,
    sensitiveMaskEmailDomain,
    setSensitiveMaskEmailDomain,
    captureFiles,
    setCaptureFiles,
    captureRichText,
    setCaptureRichText,
    richTextSnapshotPreview,
    setRichTextSnapshotPreview,
    silentStart,
    setSilentStart,
    followMouse,
    setFollowMouse,
    showAppBorder,
    setShowAppBorder,
    registryWinVEnabled,
    setRegistryWinVEnabled,
    pasteMethod,
    setPasteMethod,
    theme,
    setTheme,
    nativePalette,
    setNativePalette,
    colorMode,
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
    showHotkeyHint,
    setShowHotkeyHint,
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
    lightModeEnabled,
    setLightModeEnabled,
    lightModeIdleMinutes,
    setLightModeIdleMinutes,
    hideTrayIcon,
    setHideTrayIcon,
    edgeDocking,
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
    soundEnabled,
    setSoundEnabled,
    pasteSoundEnabled,
    setPasteSoundEnabled,
    soundVolume,
    setSoundVolume,
    typeFilter,
    setTypeFilter
  };
};
