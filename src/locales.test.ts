import { describe, expect, it } from "vitest";
import { translations } from "./locales";

describe("i18n translations consistency", () => {
  it("provides the Simplified Chinese language pack", () => {
    expect(translations.zh).toBeDefined();
    expect(typeof translations.zh).toBe("object");
  });

  it("contains the full key set", () => {
    const zhKeys = Object.keys(translations.zh);
    expect(zhKeys.length).toBeGreaterThan(500);
  });

  it("contains non-empty translated strings for critical UI controls", () => {
    const criticalKeys: Array<keyof (typeof translations)["zh"]> = [
      "app_name",
      "settings",
      "search_placeholder",
      "clear_history",
      "sequential_paste_mode",
      "settings_section_theme",
      "visual_theme",
    ];

    for (const key of criticalKeys) {
      const val = translations.zh[key];
      expect(val).toBeDefined();
      expect(typeof val).toBe("string");
      expect(val.trim().length).toBeGreaterThan(0);
    }
  });
});
