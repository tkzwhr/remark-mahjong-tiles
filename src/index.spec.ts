import rehypeStringify from "rehype-stringify";
import remarkDirective from "remark-directive";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import { unified } from "unified";
import { describe, expect, it, vi } from "vitest";
import remarkMahjongTiles, { dependencies } from "./index";

// Mocks the `getSvg` method of the `dependencies` object.
// When the plugin calls `dependencies.getSvg`, this mock function will be executed.
vi.spyOn(dependencies, "getSvg").mockImplementation((tile: string) => {
  if (tile === "9z") return ""; // Special case for invalid tile in tests
  return `<svg>${tile}</svg>`;
});

describe("remark-mahjong-tiles", () => {
  const process = async (md: string, options?: any) => {
    const file = await unified()
      .use(remarkParse)
      .use(remarkDirective)
      .use(remarkMahjongTiles, options)
      .use(remarkRehype)
      .use(rehypeStringify)
      .process(md);
    return String(file);
  };

  it("単一の牌をデフォルトサイズで正しく変換すること(text)", async () => {
    const input = 'これは :mahjong-tiles{src="1m"} です。';
    const expected =
      '<p>これは <span class="mahjong-tiles-wrapper" style="display: inline-flex; align-items: end;"><svg style="flex-shrink: 0; width: auto; height: 60px;">1m</svg></span> です。</p>';
    expect(await process(input)).toBe(expected);
  });

  it("単一の牌をデフォルトサイズで正しく変換すること(leaf)", async () => {
    const input = '::mahjong-tiles{src="1m"}';
    const expected =
      '<div class="mahjong-tiles-wrapper" style="display: flex; align-items: end;"><svg style="flex-shrink: 0; width: auto; height: 60px;">1m</svg></div>';
    expect(await process(input)).toBe(expected);
  });

  it("複数の牌を正しく変換すること", async () => {
    const input = '::mahjong-tiles{src="1m2p3s"}';
    const expected =
      '<div class="mahjong-tiles-wrapper" style="display: flex; align-items: end;"><svg style="flex-shrink: 0; width: auto; height: 60px;">1m</svg><svg style="flex-shrink: 0; width: auto; height: 60px;">2p</svg><svg style="flex-shrink: 0; width: auto; height: 60px;">3s</svg></div>';
    expect(await process(input)).toBe(expected);
  });

  it("プラグインオプションで指定したサイズを使用すること", async () => {
    const input = '::mahjong-tiles{src="1m"}';
    const expected =
      '<div class="mahjong-tiles-wrapper" style="display: flex; align-items: end;"><svg style="flex-shrink: 0; width: auto; height: 40px;">1m</svg></div>';
    expect(await process(input, { size: "40px" })).toBe(expected);
  });

  it("要素のsize属性で指定したサイズを優先して使用すること", async () => {
    const input = '::mahjong-tiles{src="1m" size="50px"}';
    const expected =
      '<div class="mahjong-tiles-wrapper" style="display: flex; align-items: end;"><svg style="flex-shrink: 0; width: auto; height: 50px;">1m</svg></div>';
    // Verify that element attributes take precedence over plugin options.
    expect(await process(input, { size: "40px" })).toBe(expected);
  });

  it("チーを正しく変換すること（先頭の牌が横になる）", async () => {
    const input = '::mahjong-tiles{src="1-23m"}';
    const expected =
      '<div class="mahjong-tiles-wrapper" style="display: flex; align-items: end;"><svg style="flex-shrink: 0; width: auto; height: calc(60px * 0.75);">y1m</svg><svg style="flex-shrink: 0; width: auto; height: 60px;">2m</svg><svg style="flex-shrink: 0; width: auto; height: 60px;">3m</svg></div>';
    expect(await process(input)).toBe(expected);
  });

  it("ポンを正しく変換すること（指定した位置の牌が横になる）", async () => {
    const input = '::mahjong-tiles{src="11-1m"}'; // 2番目の1mを横にする想定
    const expected =
      '<div class="mahjong-tiles-wrapper" style="display: flex; align-items: end;"><svg style="flex-shrink: 0; width: auto; height: 60px;">1m</svg><svg style="flex-shrink: 0; width: auto; height: calc(60px * 0.75);">y1m</svg><svg style="flex-shrink: 0; width: auto; height: 60px;">1m</svg></div>';
    expect(await process(input)).toBe(expected);
  });

  it("大明槓を正しく変換すること", async () => {
    const input = '::mahjong-tiles{src="111-1m"}'; // 3番目の1mを横にする想定
    const expected =
      '<div class="mahjong-tiles-wrapper" style="display: flex; align-items: end;"><svg style="flex-shrink: 0; width: auto; height: 60px;">1m</svg><svg style="flex-shrink: 0; width: auto; height: 60px;">1m</svg><svg style="flex-shrink: 0; width: auto; height: calc(60px * 0.75);">y1m</svg><svg style="flex-shrink: 0; width: auto; height: 60px;">1m</svg></div>';
    expect(await process(input)).toBe(expected);
  });

  it("加槓を正しく変換すること（牌が縦に重なる）", async () => {
    const input = '::mahjong-tiles{src="11=11m"}'; // 2番目の1mに加槓する想定
    const expected =
      '<div class="mahjong-tiles-wrapper" style="display: flex; align-items: end;"><svg style="flex-shrink: 0; width: auto; height: 60px;">1m</svg><div style="display: flex; flex-direction: column;"><svg style="flex-shrink: 0; width: auto; height: calc(60px * 0.75);">y1m</svg><svg style="flex-shrink: 0; width: auto; height: calc(60px * 0.75);">y1m</svg></div><svg style="flex-shrink: 0; width: auto; height: 60px;">1m</svg></div>';
    expect(await process(input)).toBe(expected);
  });

  it("暗槓を正しく変換すること（両端の牌が裏向き）", async () => {
    const input = '::mahjong-tiles{src="1111+m"}';
    // Due to mocking, face-down tiles (0x) are also output as regular SVGs.
    const expected =
      '<div class="mahjong-tiles-wrapper" style="display: flex; align-items: end;"><svg style="flex-shrink: 0; width: auto; height: 60px;">0x</svg><svg style="flex-shrink: 0; width: auto; height: 60px;">1m</svg><svg style="flex-shrink: 0; width: auto; height: 60px;">1m</svg><svg style="flex-shrink: 0; width: auto; height: 60px;">0x</svg></div>';
    expect(await process(input)).toBe(expected);
  });

  it("スペースを正しい幅のdivに変換すること", async () => {
    const input = '::mahjong-tiles{src="1m,2p"}';
    const expected =
      '<div class="mahjong-tiles-wrapper" style="display: flex; align-items: end;"><svg style="flex-shrink: 0; width: auto; height: 60px;">1m</svg><div style="flex-shrink: 0; width: calc(60px * 0.2);"></div><svg style="flex-shrink: 0; width: auto; height: 60px;">2p</svg></div>';
    expect(await process(input)).toBe(expected);
  });

  it("src属性がない場合は何も出力しないこと", async () => {
    const input = "::mahjong-tiles";
    const expected =
      '<div class="mahjong-tiles-wrapper" style="display: flex; align-items: end;"></div>';
    expect(await process(input)).toBe(expected);
  });

  it("src属性が空文字列の場合は何も出力しないこと", async () => {
    const input = '::mahjong-tiles{src=""}';
    const expected =
      '<div class="mahjong-tiles-wrapper" style="display: flex; align-items: end;"></div>';
    expect(await process(input)).toBe(expected);
  });

  it("無効な牌表記が含まれている場合、有効な部分のみ変換すること", async () => {
    const input = '::mahjong-tiles{src="1m9z2p"}';
    const expected =
      '<div class="mahjong-tiles-wrapper" style="display: flex; align-items: end;"><svg style="flex-shrink: 0; width: auto; height: 60px;">1m</svg><svg style="flex-shrink: 0; width: auto; height: 60px;">2p</svg></div>';
    expect(await process(input)).toBe(expected);
  });
});
