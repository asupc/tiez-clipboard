import { expect, test } from "vitest";
import {
  applyNativePalette,
  applyThemeClasses,
  getAppliedNativePalette,
  getSelectableThemes,
  normalizeThemeId,
  resolveThemeAppearance,
} from "./themes";

const classTarget = (initial: string[] = []) => {
  const classes = new Set(initial);
  const attributes = new Map<string, string>();
  const styles = new Map<string, string>();
  const target = {
    classList: {
      add: (...names: string[]) => names.forEach((name) => classes.add(name)),
      remove: (...names: string[]) => names.forEach((name) => classes.delete(name)),
      toggle: (name: string, force: boolean) => (force ? classes.add(name) : classes.delete(name)),
      contains: (name: string) => classes.has(name),
      [Symbol.iterator]: () => classes.values(),
    },
    setAttribute: (name: string, value: string) => attributes.set(name, value),
    getAttribute: (name: string) => attributes.get(name),
    style: {
      get length() { return styles.size; },
      item: (index: number) => [...styles.keys()][index],
      setProperty: (name: string, value: string) => styles.set(name, value),
      removeProperty: (name: string) => styles.delete(name),
    },
  } as unknown as Element;
  return { target, classes, styles };
};

test("only the Mica theme is selectable", () => {
  expect(getSelectableThemes().map((theme) => theme.id)).toEqual(["mica"]);
  expect(normalizeThemeId()).toBe("mica");
  expect(resolveThemeAppearance("sakura")).toEqual({ theme: "mica", nativePalette: "sakura" });
  expect(resolveThemeAppearance("unknown").nativePalette).toBe("default");
});

test("applying the theme clears retired classes without affecting dark mode", () => {
  const { target, classes } = classTarget(["theme-paper", "theme-macos", "dark-mode"]);
  applyThemeClasses(target);
  expect([...classes].sort()).toEqual(["dark-mode", "theme-mica"]);
});

test("custom palette styles are cleared on switching away and preview data stays exact", () => {
  const { target, classes, styles } = classTarget();
  styles.set("--other-setting", "42");
  applyNativePalette("custom:#12abef", target);
  expect(getAppliedNativePalette(target)).toBe("custom:#12abef");
  expect(classes.has("native-palette-color")).toBe(true);
  expect(styles.has("--native-palette-dark-accent")).toBe(true);
  applyNativePalette("sakura", target);
  expect(classes.has("native-palette-color")).toBe(false);
  expect([...styles]).toEqual([["--other-setting", "42"]]);
});
