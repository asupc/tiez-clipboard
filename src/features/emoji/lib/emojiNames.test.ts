import { describe, expect, it } from "vitest";
import { EMOJI_NAMES } from "./emojiNames";

describe("Emoji Names Catalog", () => {
  it("contains valid simplified Chinese names for emojis", () => {
    const emojis = Object.keys(EMOJI_NAMES);
    expect(emojis.length).toBeGreaterThan(100);

    for (const char of emojis.slice(0, 30)) {
      const entry = EMOJI_NAMES[char];
      expect(entry.zh).toBeDefined();
      expect(entry.zh.length).toBeGreaterThan(0);
    }
  });

  it("translates popular emojis properly", () => {
    expect(EMOJI_NAMES["😀"].zh).toBe("大笑");
    expect(EMOJI_NAMES["😂"].zh).toBe("笑哭");
  });
});
