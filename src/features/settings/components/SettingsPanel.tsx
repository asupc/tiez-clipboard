
import { memo, useState, useEffect, useRef, type ReactNode } from "react";
import type { ClickPasteMode } from "../../../shared/lib/clickPaste";
import { getVersion } from "@tauri-apps/api/app";
import {
    Clipboard,
    Database,
    Info,
    Palette,
    Settings2,
    type LucideIcon
} from "lucide-react";
import GeneralSettingsGroup from "./groups/GeneralSettingsGroup";
import ClipboardSettingsGroup from "./groups/ClipboardSettingsGroup";
import AppearanceSettingsGroup from "./groups/AppearanceSettingsGroup";
import DataSettingsGroup from "./groups/DataSettingsGroup";
import SettingsFooter from "./SettingsFooter";
import { LabelWithHint, SettingsHintProvider } from "./SettingsHint";
import { useWideWindow } from "../../../shared/hooks/useWideWindow";
import { usePaneWidth } from "../../../shared/hooks/usePaneWidth";
import PaneDivider from "../../../shared/components/PaneDivider";
import { getReleaseBuildInfo, type ReleaseBuildInfo } from "../../../shared/lib/releaseBuild";

interface SettingsPanelProps {
    t: (key: string) => string;
    theme: string;
    nativePalette: string;
    nativeCustomColor?: string;
    setNativePalette: (val: string) => void;
    colorMode: string;
    showAppBorder: boolean;
    setShowAppBorder: (val: boolean) => void;
    showSourceAppIcon: boolean;
    setShowSourceAppIcon: (val: boolean) => void;
    hideUnselectedItemActions: boolean;
    setHideUnselectedItemActions: (val: boolean) => void;
    clipboardItemFontSize: number;
    setClipboardItemFontSize: (val: number) => void;

    // State
    collapsedGroups: Record<string, boolean>;
    autoStart: boolean;
    elevatedAutostart: boolean;
    silentStart: boolean;
    persistent: boolean;
    persistentLimitEnabled: boolean;
    persistentLimit: number;
    deduplicate: boolean;
    captureFiles: boolean;
    captureRichText: boolean;
    richTextSnapshotPreview: boolean;
    deleteAfterPaste: boolean;
    moveToTopAfterPaste: boolean;
    clickCopyOnly: boolean;
    clickPasteMode: ClickPasteMode;
    pasteMethod: string;
    setPasteMethod: (val: string) => void;
    registryWinVEnabled: boolean;
    setRegistryWinVEnabled: (val: boolean) => void;
    sequentialMode: boolean;
    sequentialHotkey: string;
    isRecordingSequential: boolean;
    plainPasteHotkey: string;
    isRecordingPlain: boolean;
    searchHotkey: string;
    isRecordingSearch: boolean;
    quickPasteModifier: "disabled" | "ctrl" | "alt" | "shift" | "win";
    setQuickPasteModifier: (val: "disabled" | "ctrl" | "alt" | "shift" | "win") => void;
    privacyProtection: boolean;
    privacyProtectionKinds: string[];
    setPrivacyProtectionKinds: (val: string[]) => void;
    privacyProtectionCustomRules: string;
    setPrivacyProtectionCustomRules: (val: string) => void;
    sensitiveMaskPrefixVisible: number;
    setSensitiveMaskPrefixVisible: (val: number) => void;
    sensitiveMaskSuffixVisible: number;
    setSensitiveMaskSuffixVisible: (val: number) => void;
    sensitiveMaskEmailDomain: boolean;
    setSensitiveMaskEmailDomain: (val: boolean) => void;
    hotkey: string;
    showHotkeyHint: boolean;
    showSearchBox: boolean;
    setShowSearchBox: (val: boolean) => void;
    searchBoxPinned: boolean;
    setSearchBoxPinned: (val: boolean) => void;
    scrollTopButtonEnabled: boolean;
    setScrollTopButtonEnabled: (val: boolean) => void;
    emojiPanelEnabled: boolean;
    setEmojiPanelEnabled: (val: boolean) => void;
    arrowKeySelection: boolean;
    setArrowKeySelection: (val: boolean) => void;
    lightModeEnabled: boolean;
    setLightModeEnabled: (val: boolean) => void;
    lightModeIdleMinutes: number;
    setLightModeIdleMinutes: (val: number) => void;


    soundEnabled: boolean;
    setSoundEnabled: (val: boolean) => void;
    pasteSoundEnabled: boolean;
    setPasteSoundEnabled: (val: boolean) => void;
    soundVolume: number;
    setSoundVolume: (val: number) => void;
    hideTrayIcon: boolean;
    setHideTrayIcon: (val: boolean) => void;
    edgeDocking: boolean;
    setEdgeDocking: (val: boolean) => void;
    followMouse: boolean;
    setFollowMouse: (val: boolean) => void;
    surfaceOpacity: number;
    setSurfaceOpacity: (val: number) => void;




    appSettings: Record<string, string>;
    dataPath: string;

    // Setters/Actions
    toggleGroup: (group: string) => void;
    setAutoStart: (val: boolean) => void;
    setElevatedAutostart: (val: boolean) => void;
    setSilentStart: (val: boolean) => void;
    setPersistent: (val: boolean) => void;
    setPersistentLimitEnabled: (val: boolean) => void;
    setPersistentLimit: (val: number) => void;
    setDeduplicate: (val: boolean) => void;
    setCaptureFiles: (val: boolean) => void;
    setCaptureRichText: (val: boolean) => void;
    setRichTextSnapshotPreview: (val: boolean) => void;
    setDeleteAfterPaste: (val: boolean) => void;
    setMoveToTopAfterPaste: (val: boolean) => void;
    setClickCopyOnly: (val: boolean) => void;
    setClickPasteMode: (val: ClickPasteMode) => void;
    saveAppSetting: (key: string, val: string) => void;
    setSequentialModeState: (val: boolean) => void;
    setIsRecordingSequential: (val: boolean) => void;
    updateSequentialHotkey: (key: string) => void;
    setIsRecordingPlain: (val: boolean) => void;
    updatePlainPasteHotkey: (key: string) => void;
    setIsRecordingSearch: (val: boolean) => void;
    updateSearchHotkey: (key: string) => void;
    setPrivacyProtection: (val: boolean) => void;
    setShowHotkeyHint: (val: boolean) => void;
    setIsRecording: (val: boolean) => void;
    isRecording: boolean;
    hotkeyParts: string[];
    updateHotkey: (key: string) => void;

    setColorMode: (val: string) => void;


    compactMode: boolean;
    setCompactMode: (val: boolean) => void;
    compactShowTime: boolean;
    setCompactShowTime: (val: boolean) => void;
    splitViewEnabled: boolean;
    setSplitViewEnabled: (val: boolean) => void;
    checkHotkeyConflict: (newHotkey: string, mode: 'main' | 'sequential' | 'plain' | 'search') => boolean;




    handleResetSettings: () => void;
}

const ABOUT_SECTION = "about";
const noop = () => {};

const SECTION_ICONS: Record<string, LucideIcon> = {
    general: Settings2,
    appearance: Palette,
    clipboard: Clipboard,
    data: Database
};

const NAV_GROUPS: { labelKey: string; ids: string[] }[] = [
    { labelKey: "settings_nav_group_basic", ids: ["general", "appearance"] },
    { labelKey: "settings_nav_group_clipboard", ids: ["clipboard"] },
    { labelKey: "settings_nav_group_data", ids: ["data"] }
];

const SettingsPanel = (props: SettingsPanelProps) => {
    const {
        t, theme, nativePalette, nativeCustomColor, setNativePalette, colorMode, showAppBorder, setShowAppBorder, showSourceAppIcon, setShowSourceAppIcon, hideUnselectedItemActions, setHideUnselectedItemActions,
        collapsedGroups, autoStart, elevatedAutostart, silentStart, persistent, persistentLimitEnabled, persistentLimit, deduplicate, captureFiles, captureRichText, richTextSnapshotPreview, deleteAfterPaste, moveToTopAfterPaste, clickCopyOnly, clickPasteMode, pasteMethod, setPasteMethod, registryWinVEnabled, setRegistryWinVEnabled,
        sequentialMode, sequentialHotkey, isRecordingSequential,
        plainPasteHotkey, isRecordingPlain, searchHotkey, isRecordingSearch, quickPasteModifier, setQuickPasteModifier,
        privacyProtection, privacyProtectionKinds, setPrivacyProtectionKinds, privacyProtectionCustomRules, setPrivacyProtectionCustomRules, sensitiveMaskPrefixVisible, setSensitiveMaskPrefixVisible, sensitiveMaskSuffixVisible, setSensitiveMaskSuffixVisible, sensitiveMaskEmailDomain, setSensitiveMaskEmailDomain, setShowSearchBox, searchBoxPinned, setSearchBoxPinned, scrollTopButtonEnabled, setScrollTopButtonEnabled, arrowKeySelection, setArrowKeySelection,
        lightModeEnabled, setLightModeEnabled, lightModeIdleMinutes, setLightModeIdleMinutes,
        soundEnabled, setSoundEnabled, pasteSoundEnabled, setPasteSoundEnabled,
        soundVolume, setSoundVolume,
        hideTrayIcon, setHideTrayIcon,
        edgeDocking, setEdgeDocking,
        followMouse, setFollowMouse,
        surfaceOpacity, setSurfaceOpacity,
        appSettings, dataPath,

        toggleGroup, setAutoStart, setElevatedAutostart, setSilentStart, setPersistent, setPersistentLimitEnabled, setPersistentLimit, setDeduplicate, setCaptureFiles, setCaptureRichText, setRichTextSnapshotPreview, setDeleteAfterPaste, setMoveToTopAfterPaste, setClickCopyOnly, setClickPasteMode, saveAppSetting,
        setSequentialModeState, setIsRecordingSequential, updateSequentialHotkey,
        setIsRecordingPlain, updatePlainPasteHotkey,
        setIsRecordingSearch, updateSearchHotkey,
        setPrivacyProtection,
        setIsRecording, isRecording, hotkey, hotkeyParts, updateHotkey,
        setColorMode, compactMode, setCompactMode, compactShowTime, setCompactShowTime, splitViewEnabled, setSplitViewEnabled, checkHotkeyConflict,
        clipboardItemFontSize, setClipboardItemFontSize,
        emojiPanelEnabled, setEmojiPanelEnabled,
        handleResetSettings,
    } = props;

    const [appVersion, setAppVersion] = useState("");
    const [releaseBuildInfo, setReleaseBuildInfo] = useState<ReleaseBuildInfo>({
        channel: "stable",
        portable: false
    });
    // Removed updateModalData
    const [privacyKindsOpen, setPrivacyKindsOpen] = useState(false);
    const [privacyRulesOpen, setPrivacyRulesOpen] = useState(false);
    const isWide = useWideWindow();
    const wideLayout = splitViewEnabled && isWide;
    const [activeSection, setActiveSection] = useState("general");
    const wideRef = useRef<HTMLDivElement | null>(null);
    const navRef = useRef<HTMLElement | null>(null);
    const { value: navWidth, resizing: navResizing, dividerProps: navDividerProps } = usePaneWidth({
        storageKey: "app.pane.settings",
        containerRef: wideRef,
        paneRef: navRef,
        min: 148,
        max: 320,
        minRest: 360
    });

    useEffect(() => {
        getVersion()
            .then(v => setAppVersion(v))
            .catch(err => {
                console.error("Failed to get version:", err);
                setAppVersion("0.2.0");
            });
        getReleaseBuildInfo().then(setReleaseBuildInfo);
    }, []);

    // Narrow windows show an accordion of collapsible groups. Wide ones list the
    // sections on the left and show the selected group, always open, on the right.
    const groupState = (id: string) => wideLayout
        ? { collapsed: false, onToggle: noop }
        : { collapsed: collapsedGroups[id], onToggle: () => toggleGroup(id) };

    const sections: { id: string; label: string; node: ReactNode }[] = [
        {
            id: "general",
            label: t("general_settings"),
            node: (
                <GeneralSettingsGroup
                    t={t}
                    {...groupState('general')}
                    LabelWithHint={LabelWithHint}
                    autoStart={autoStart}
                    setAutoStart={setAutoStart}
                    elevatedAutostart={elevatedAutostart}
                    setElevatedAutostart={setElevatedAutostart}
                    silentStart={silentStart}
                    setSilentStart={setSilentStart}
                    hideTrayIcon={hideTrayIcon}
                    setHideTrayIcon={setHideTrayIcon}
                    edgeDocking={edgeDocking}
                    setEdgeDocking={setEdgeDocking}
                    followMouse={followMouse}
                    setFollowMouse={setFollowMouse}
                    soundEnabled={soundEnabled}
                    setSoundEnabled={setSoundEnabled}
                    pasteSoundEnabled={pasteSoundEnabled}
                    setPasteSoundEnabled={setPasteSoundEnabled}
                    soundVolume={soundVolume}
                    setSoundVolume={setSoundVolume}
                    searchBoxPinned={searchBoxPinned}
                    setSearchBoxPinned={setSearchBoxPinned}
                    setShowSearchBox={setShowSearchBox}
                    scrollTopButtonEnabled={scrollTopButtonEnabled}
                    setScrollTopButtonEnabled={setScrollTopButtonEnabled}
                    emojiPanelEnabled={emojiPanelEnabled}
                    setEmojiPanelEnabled={setEmojiPanelEnabled}
                    arrowKeySelection={arrowKeySelection}
                    setArrowKeySelection={setArrowKeySelection}
                    lightModeEnabled={lightModeEnabled}
                    setLightModeEnabled={setLightModeEnabled}
                    lightModeIdleMinutes={lightModeIdleMinutes}
                    setLightModeIdleMinutes={setLightModeIdleMinutes}
                    saveAppSetting={saveAppSetting}
                />
            )
        },
        {
            id: "clipboard",
            label: t("clipboard_settings"),
            node: (
                <ClipboardSettingsGroup
                    t={t}
                    {...groupState('clipboard')}
                    LabelWithHint={LabelWithHint}
                    persistent={persistent}
                    setPersistent={setPersistent}
                    persistentLimitEnabled={persistentLimitEnabled}
                    setPersistentLimitEnabled={setPersistentLimitEnabled}
                    persistentLimit={persistentLimit}
                    setPersistentLimit={setPersistentLimit}
                    saveAppSetting={saveAppSetting}
                    deduplicate={deduplicate}
                    setDeduplicate={setDeduplicate}
                    captureFiles={captureFiles}
                    setCaptureFiles={setCaptureFiles}
                    captureRichText={captureRichText}
                    setCaptureRichText={setCaptureRichText}
                    richTextSnapshotPreview={richTextSnapshotPreview}
                    setRichTextSnapshotPreview={setRichTextSnapshotPreview}
                    plainPasteHotkey={plainPasteHotkey}
                    isRecordingPlain={isRecordingPlain}
                    setIsRecordingPlain={setIsRecordingPlain}
                    updatePlainPasteHotkey={updatePlainPasteHotkey}
                    searchHotkey={searchHotkey}
                    isRecordingSearch={isRecordingSearch}
                    setIsRecordingSearch={setIsRecordingSearch}
                    updateSearchHotkey={updateSearchHotkey}
                    quickPasteModifier={quickPasteModifier}
                    setQuickPasteModifier={setQuickPasteModifier}
                    deleteAfterPaste={deleteAfterPaste}
                    setDeleteAfterPaste={setDeleteAfterPaste}
                    moveToTopAfterPaste={moveToTopAfterPaste}
                    clickCopyOnly={clickCopyOnly}
                    clickPasteMode={clickPasteMode}
                    setMoveToTopAfterPaste={setMoveToTopAfterPaste}
                    setClickCopyOnly={setClickCopyOnly}
                    setClickPasteMode={setClickPasteMode}
                    pasteMethod={pasteMethod}
                    setPasteMethod={setPasteMethod}
                    registryWinVEnabled={registryWinVEnabled}
                    setRegistryWinVEnabled={setRegistryWinVEnabled}
                    sequentialMode={sequentialMode}
                    setSequentialModeState={setSequentialModeState}
                    sequentialHotkey={sequentialHotkey}
                    isRecordingSequential={isRecordingSequential}
                    setIsRecordingSequential={setIsRecordingSequential}
                    updateSequentialHotkey={updateSequentialHotkey}
                    checkHotkeyConflict={checkHotkeyConflict}
                    privacyProtection={privacyProtection}
                    setPrivacyProtection={setPrivacyProtection}
                    privacyProtectionKinds={privacyProtectionKinds}
                    setPrivacyProtectionKinds={setPrivacyProtectionKinds}
                    privacyProtectionCustomRules={privacyProtectionCustomRules}
                    setPrivacyProtectionCustomRules={setPrivacyProtectionCustomRules}
                    sensitiveMaskPrefixVisible={sensitiveMaskPrefixVisible}
                    setSensitiveMaskPrefixVisible={setSensitiveMaskPrefixVisible}
                    sensitiveMaskSuffixVisible={sensitiveMaskSuffixVisible}
                    setSensitiveMaskSuffixVisible={setSensitiveMaskSuffixVisible}
                    sensitiveMaskEmailDomain={sensitiveMaskEmailDomain}
                    setSensitiveMaskEmailDomain={setSensitiveMaskEmailDomain}
                    privacyKindsOpen={privacyKindsOpen}
                    setPrivacyKindsOpen={setPrivacyKindsOpen}
                    privacyRulesOpen={privacyRulesOpen}
                    setPrivacyRulesOpen={setPrivacyRulesOpen}

                    isRecording={isRecording}
                    setIsRecording={setIsRecording}
                    hotkeyParts={hotkeyParts}
                    updateHotkey={updateHotkey}
                    hotkey={hotkey}
                    appSettings={appSettings}
                    theme={theme}
                    colorMode={colorMode}
                />
            )
        },
        {
            id: "appearance",
            label: t("appearance_settings"),
            node: (
                <AppearanceSettingsGroup
                    t={t}
                    {...groupState('appearance')}
                    LabelWithHint={LabelWithHint}
                    nativePalette={nativePalette}
                    nativeCustomColor={nativeCustomColor}
                    setNativePalette={setNativePalette}
                    colorMode={colorMode}
                    setColorMode={setColorMode}
                    showAppBorder={showAppBorder}
                    setShowAppBorder={setShowAppBorder}
                    showSourceAppIcon={showSourceAppIcon}
                    setShowSourceAppIcon={setShowSourceAppIcon}
                    hideUnselectedItemActions={hideUnselectedItemActions}
                    setHideUnselectedItemActions={setHideUnselectedItemActions}
                    compactMode={compactMode}
                    setCompactMode={setCompactMode}
                    compactShowTime={compactShowTime}
                    setCompactShowTime={setCompactShowTime}
                    splitViewEnabled={splitViewEnabled}
                    setSplitViewEnabled={setSplitViewEnabled}
                    clipboardItemFontSize={clipboardItemFontSize}
                    setClipboardItemFontSize={setClipboardItemFontSize}
                    surfaceOpacity={surfaceOpacity}
                    setSurfaceOpacity={setSurfaceOpacity}
                    saveAppSetting={saveAppSetting}
                />
            )
        },
        {
            id: "data",
            label: t("data_management"),
            node: (
                <DataSettingsGroup
                    t={t}
                    theme={theme}
                    {...groupState('data')}
                    dataPath={dataPath}
                    portable={releaseBuildInfo.portable}
                />
            )
        }
    ];

    // Keep the reader's place when the layout flips (window resized, or the
    // two-column toggle itself switched off from the appearance section).
    const sectionIds = sections.map((section) => section.id).join(" ");
    const wasWideRef = useRef(wideLayout);
    useEffect(() => {
        if (wasWideRef.current === wideLayout) return;
        wasWideRef.current = wideLayout;
        if (wideLayout) {
            const open = sectionIds.split(" ").find((id) => !collapsedGroups[id]);
            if (open) setActiveSection(open);
            return;
        }
        if (activeSection === ABOUT_SECTION || !collapsedGroups[activeSection]) return;
        toggleGroup(activeSection);
        requestAnimationFrame(() => {
            document
                .querySelector(`[data-settings-section="${activeSection}"] > .settings-group`)
                ?.scrollIntoView({ block: "start" });
        });
    }, [wideLayout, sectionIds, collapsedGroups, activeSection, toggleGroup]);

    const footer = (
        <SettingsFooter
            expanded={wideLayout}
            t={t}
            appVersion={appVersion}
            releaseChannel={releaseBuildInfo.channel}
            portable={releaseBuildInfo.portable}
            onResetSettings={handleResetSettings}
        />
    );

    const modals = null;

    const renderNavItem = (id: string, label: string, onClick: () => void, trailing?: ReactNode) => {
        const Icon = SECTION_ICONS[id] ?? Info;
        const active = activeSection === id;
        return (
            <button
                key={id}
                type="button"
                className={`settings-nav-item${active ? " active" : ""}`}
                data-section={id}
                aria-current={active ? "page" : undefined}
                onClick={onClick}
            >
                <Icon className="settings-nav-icon" size={18} strokeWidth={1.75} aria-hidden="true" />
                <span className="settings-nav-label">{label}</span>
                {trailing}
            </button>
        );
    };

    const renderWide = () => {
        const current = sections.find((section) => section.id === activeSection);
        return (
            <div
                ref={wideRef}
                className="settings-wide"
                style={navWidth != null ? { ["--settings-nav-width" as string]: `${navWidth}px` } : undefined}
            >
                <nav ref={navRef} className="settings-nav" aria-label={t("settings")}>
                    {NAV_GROUPS.map((group) => {
                        const items = group.ids.flatMap((id) => {
                            const section = sections.find((item) => item.id === id);
                            return section ? [renderNavItem(
                                section.id,
                                section.label,
                                () => {
                                    setActiveSection(section.id);
                                },
                                undefined
                            )] : [];
                        });
                        if (items.length === 0) return null;
                        return (
                            <div key={group.labelKey} className="settings-nav-group" role="group" aria-label={t(group.labelKey)}>
                                <div className="settings-nav-group-label" aria-hidden="true">{t(group.labelKey)}</div>
                                {items}
                            </div>
                        );
                    })}
                    <div className="settings-nav-footer">
                        {renderNavItem(ABOUT_SECTION, t("settings_about"), () => setActiveSection(ABOUT_SECTION))}
                    </div>
                </nav>
                <PaneDivider active={navResizing} label={t("pane_divider_hint")} {...navDividerProps} />
                {/* Keyed so switching sections starts at the top. */}
                <div className="settings-wide-content" key={activeSection}>
                    <div className="settings-wide-inner">
                        {activeSection === ABOUT_SECTION ? footer : (current ?? sections[0]).node}
                    </div>
                </div>
            </div>
        );
    };

    return (
        <SettingsHintProvider>
            <div className="settings-panel-root">
                {wideLayout ? (
                    renderWide()
                ) : (
                    <>
                        {/* The wide layout's sidebar groups, as an inset list:
                            a flat run of a dozen equal cards was hard to scan. */}
                        {NAV_GROUPS.map((group) => {
                            const items = group.ids.flatMap((id) => {
                                const Icon = SECTION_ICONS[id] ?? Info;
                                const icon = <Icon className="settings-section-icon" size={16} strokeWidth={1.75} aria-hidden="true" />;
                                const section = sections.find((item) => item.id === id);
                                return section
                                    ? [
                                        <div
                                            key={section.id}
                                            className="settings-section"
                                            data-settings-section={section.id}
                                        >
                                            {icon}
                                            {section.node}
                                        </div>
                                    ]
                                    : [];
                            });
                            if (items.length === 0) return null;
                            return (
                                <section key={group.labelKey} className="settings-narrow-group" aria-label={t(group.labelKey)}>
                                    <div className="settings-narrow-group-label" aria-hidden="true">{t(group.labelKey)}</div>
                                    <div className="settings-narrow-group-items">{items}</div>
                                </section>
                            );
                        })}

                        {footer}
                    </>
                )}
                {modals}
            </div>
        </SettingsHintProvider>
    );
};

export default memo(SettingsPanel);
