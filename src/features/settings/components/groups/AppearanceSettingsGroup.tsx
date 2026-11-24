import ColorSwatchSelector from "../ColorSwatchSelector";
import { NATIVE_PALETTES, getCustomPaletteColor, normalizeCustomColor } from "../../../../shared/config/nativePalettes";
import { useEffect, useState, type ComponentType, type ReactNode } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { supportsNativePalette } from "../../../../shared/config/themes";
import { isWindowsPlatform } from "../../../../shared/lib/platform";
import { SettingRange, SettingSwitch } from "../SettingControls";

interface LabelWithHintProps {
    label: string;
    hint?: string | ReactNode;
    hintKey: string;
}

interface AppearanceSettingsGroupProps {
    t: (key: string) => string;
    collapsed: boolean;
    onToggle: () => void;
    LabelWithHint: ComponentType<LabelWithHintProps>;
    nativePalette: string;
    nativeCustomColor?: string;
    setNativePalette: (val: string) => void;
    colorMode: string;
    setColorMode: (val: string) => void;
    showAppBorder: boolean;
    setShowAppBorder: (val: boolean) => void;
    showSourceAppIcon: boolean;
    setShowSourceAppIcon: (val: boolean) => void;
    hideUnselectedItemActions: boolean;
    setHideUnselectedItemActions: (val: boolean) => void;

    compactMode: boolean;
    setCompactMode: (val: boolean) => void;
    compactShowTime: boolean;
    setCompactShowTime: (val: boolean) => void;
    splitViewEnabled: boolean;
    setSplitViewEnabled: (val: boolean) => void;
    clipboardItemFontSize: number;
    setClipboardItemFontSize: (val: number) => void;
    surfaceOpacity: number;
    setSurfaceOpacity: (val: number) => void;
    saveAppSetting: (key: string, val: string) => void;
}

const AppearanceSettingsGroup = ({
    t,
    collapsed,
    onToggle,
    LabelWithHint,
    nativePalette,
    nativeCustomColor,
    setNativePalette,
    colorMode,
    setColorMode,
    showAppBorder,
    setShowAppBorder,
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
    surfaceOpacity,
    setSurfaceOpacity,
    saveAppSetting
}: AppearanceSettingsGroupProps) => {
    const [customColor, setCustomColor] = useState(() => getCustomPaletteColor(nativePalette)
        || normalizeCustomColor(nativeCustomColor) || "#8655bb");
    useEffect(() => {
        setCustomColor(getCustomPaletteColor(nativePalette) || normalizeCustomColor(nativeCustomColor) || "#8655bb");
    }, [nativePalette, nativeCustomColor]);
    const choosePalette = (value: string) => {
        setNativePalette(value);
        saveAppSetting('native_palette', value);
    };
    const showSurfaceOpacityControls = true;

    return (
    <div className={`settings-group ${collapsed ? 'collapsed' : ''}`}>
        <button type="button" className="group-header" aria-expanded={!collapsed} onClick={onToggle}>
            <h3>{t('appearance_settings')}</h3>
            {collapsed ? <ChevronRight size={16} /> : <ChevronDown size={16} />}
        </button>
        {!collapsed && (
            <div className="group-content">
                {supportsNativePalette() && (
                    <div className="setting-item">
                        <div className="item-label-group">
                            <span className="item-label">{t('native_palette')}</span>
                        </div>
                        <ColorSwatchSelector
                            label={t('native_palette')}
                            value={nativePalette}
                            options={NATIVE_PALETTES.map(palette => ({ ...palette, label: t(palette.labelKey) }))}
                            customLabel={t('native_palette_custom')}
                            t={t}
                            customColor={customColor}
                            onChange={choosePalette}
                            onCustomColorChange={color => {
                                setCustomColor(color);
                                saveAppSetting('native_custom_color', color);
                                choosePalette(`custom:${color}`);
                            }}
                        />
                    </div>
                )}

                <div className="setting-item">
                    <div className="item-label-group">
                        <span className="item-label">{t('color_mode')}</span>
                    </div>
                    <div className="settings-inline-choice-row" role="group" aria-label={t('color_mode')}>
                        {[
                            { id: 'system', name: t('mode_system') },
                            { id: 'light', name: t('mode_light') },
                            { id: 'dark', name: t('mode_dark') }
                        ].map(modeItem => (
                            <button
                                key={modeItem.id}
                                type="button"
                                aria-pressed={colorMode === modeItem.id}
                                onClick={() => {
                                    console.log('[THEME DEBUG] Saving color_mode:', modeItem.id);
                                    setColorMode(modeItem.id);
                                    saveAppSetting('color_mode', modeItem.id);
                                }}
                                className={`btn-icon settings-inline-choice-btn ${colorMode === modeItem.id ? 'active' : ''}`}
                            >
                                {modeItem.name}
                            </button>
                        ))}
                    </div>
                </div>

                <h4 className="settings-section-title">{t('settings_section_list')}</h4>
                {isWindowsPlatform() && (
                    <div className="setting-item">
                        <LabelWithHint
                            label={t('show_app_border')}
                            hint={t('show_app_border_hint')}
                            hintKey="show_app_border"
                        />
                        <SettingSwitch
                            checked={showAppBorder}
                            onChange={(e) => {
                                const val = e.target.checked;
                                setShowAppBorder(val);
                                saveAppSetting('show_app_border', String(val));
                            }}
                        />
                    </div>
                )}

                <div className="setting-item">
                    <LabelWithHint
                        label={t('show_source_app_icon')}
                        hint={t('show_source_app_icon_hint')}
                        hintKey="show_source_app_icon"
                    />
                    <SettingSwitch
                        checked={showSourceAppIcon}
                        onChange={(e) => {
                            const val = e.target.checked;
                            setShowSourceAppIcon(val);
                            saveAppSetting('show_source_app_icon', String(val));
                        }}
                    />
                </div>

                <div className="setting-item">
                    <LabelWithHint
                        label={t('hide_unselected_item_actions')}
                        hint={t('hide_unselected_item_actions_hint')}
                        hintKey="hide_unselected_item_actions"
                    />
                    <SettingSwitch
                        checked={hideUnselectedItemActions}
                        onChange={(e) => {
                            const val = e.target.checked;
                            setHideUnselectedItemActions(val);
                            saveAppSetting('hide_unselected_item_actions', String(val));
                        }}
                    />
                </div>

                <div className="setting-item">
                    <LabelWithHint
                        label={t('compact_mode')}
                        hint={t('compact_mode_hint')}
                        hintKey="compact_mode"
                    />
                    <SettingSwitch
                        checked={compactMode}
                        onChange={(e) => {
                            const val = e.target.checked;
                            setCompactMode(val);
                            saveAppSetting('compact_mode', String(val));
                        }}
                    />
                </div>

                {compactMode && (
                    <div className="setting-item is-child">
                        <div className="item-label-group">
                            <span className="item-label">{t('compact_show_time')}</span>
                        </div>
                        <SettingSwitch
                            checked={compactShowTime}
                            onChange={(e) => {
                                const val = e.target.checked;
                                setCompactShowTime(val);
                                saveAppSetting('compact_show_time', String(val));
                            }}
                        />
                    </div>
                )}

                <div className="setting-item">
                    <LabelWithHint
                        label={t('split_view')}
                        hint={t('split_view_hint')}
                        hintKey="split_view"
                    />
                    <SettingSwitch
                        aria-label={t('split_view')}
                        checked={splitViewEnabled}
                        onChange={(e) => {
                            const val = e.target.checked;
                            setSplitViewEnabled(val);
                            saveAppSetting('split_view', String(val));
                        }}
                    />
                </div>

                <div className="setting-item">
                    <LabelWithHint
                        label={t('clipboard_item_font_size')}
                        hint={t('clipboard_item_font_size_hint')}
                        hintKey="clipboard_item_font_size"
                    />
                    <SettingRange
                        aria-label={t('clipboard_item_font_size')}
                        min={11}
                        max={18}
                        step={1}
                        value={clipboardItemFontSize}
                        valueLabel={`${clipboardItemFontSize}px`}
                        onChange={(e) => {
                            const val = parseInt(e.target.value);
                            setClipboardItemFontSize(val);
                            saveAppSetting('clipboard_item_font_size', String(val));
                        }}
                    />
                </div>

                {showSurfaceOpacityControls && (
                    <div className="setting-item">
                        <div className="item-label-group">
                            <span className="item-label">{t('surface_opacity')}</span>
                        </div>
                        <SettingRange
                            aria-label={t('surface_opacity')}
                            min={0}
                            max={100}
                            value={surfaceOpacity}
                            valueLabel={`${surfaceOpacity}%`}
                            onChange={(e) => {
                                const val = parseInt(e.target.value);
                                setSurfaceOpacity(val);
                                saveAppSetting('surface_opacity', String(val));
                            }}
                        />
                    </div>
                )}
            </div>
        )}
    </div>
    );
};

export default AppearanceSettingsGroup;
