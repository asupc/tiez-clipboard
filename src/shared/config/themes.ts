import { getNativePaletteStyle, normalizeNativePalette } from "./nativePalettes";
export { normalizeNativePalette } from "./nativePalettes";

export interface ThemeDefinition {
  id: string;
  labelKey: string;
  supportsSurfaceOpacity?: boolean;
}

/** TieZ ships with a single Windows 11 Mica-style theme. */
export const THEME_ID = "mica";

export const getDefaultTheme = (): string => THEME_ID;

export const DEFAULT_THEME = THEME_ID;

export const getSelectableThemes = (): ThemeDefinition[] => THEMES;

export const THEMES: ThemeDefinition[] = [
  {
    id: THEME_ID,
    labelKey: "theme_name_mica",
    supportsSurfaceOpacity: true
  }
];

// Older builds shipped other theme ids. Keep the class names so a stale
// localStorage value or an old window cannot leave one behind.
const RETIRED_THEME_CLASS_NAMES = [
  "theme-macos",
  "theme-acrylic",
  "theme-retro",
  "theme-sticky-note",
  "theme-paper",
  "theme-terminal",
  "theme-receipt",
  "theme-ink",
  "theme-sakura"
];

export const THEME_CLASS_NAMES = [`theme-${THEME_ID}`, ...RETIRED_THEME_CLASS_NAMES];

export const getThemeDefinition = (): ThemeDefinition => THEMES[0];

export const normalizeThemeId = (): string => THEME_ID;

export const supportsNativePalette = (): boolean => true;

export const resolveThemeAppearance = (palette?: string) => ({
  theme: THEME_ID,
  nativePalette: normalizeNativePalette(palette)
});

export const applyNativePalette = (
  palette: string | undefined,
  ...targets: Array<Element | null | undefined>
) => {
  const appearance = resolveThemeAppearance(palette);
  const styles = getNativePaletteStyle(appearance.nativePalette);
  for (const target of targets) {
    if (!target) continue;
    target.classList.toggle("native-palette-sakura", appearance.nativePalette === "sakura");
    target.classList.toggle("native-palette-color", Object.keys(styles).length > 0);
    target.setAttribute("data-native-palette", appearance.nativePalette);
    const style = (target as HTMLElement).style;
    if (!style) continue;
    for (let index = style.length - 1; index >= 0; index--) {
      const name = style.item(index);
      if (name.startsWith("--native-palette-")) style.removeProperty(name);
    }
    for (const [name, value] of Object.entries(styles)) style.setProperty(name, value);
  }
};

export const getAppliedNativePalette = (target: Element): string =>
  normalizeNativePalette(target.getAttribute("data-native-palette") ||
    (target.classList.contains("native-palette-sakura") ? "sakura" : "default"));

export const getThemeLabel = (t: (key: string) => string): string =>
  t(getThemeDefinition().labelKey);

export const supportsSurfaceOpacity = (): boolean =>
  Boolean(getThemeDefinition().supportsSurfaceOpacity);

export const clearThemeClasses = (...targets: Array<Element | null | undefined>) => {
  for (const target of targets) {
    if (!target) continue;
    target.classList.remove(...THEME_CLASS_NAMES);
    const toRemove = [...target.classList].filter((c) => c.startsWith("theme-store-"));
    if (toRemove.length > 0) target.classList.remove(...toRemove);
  }
};

export const applyThemeClasses = (
  ...targets: Array<Element | null | undefined>
) => {
  clearThemeClasses(...targets);
  for (const target of targets) {
    if (!target) continue;
    target.classList.add(`theme-${THEME_ID}`);
  }
};
