/// <reference types="mdast-util-directive" />

import parse from "@tkzwhr/mpsz-parse";
import type { Element } from "hast";
import { h } from "hastscript";
import type { Root } from "mdast";
import { parse as parseSvg } from "svg-parser";
import type { Plugin } from "unified";
import { visit } from "unist-util-visit";

const svgTilesData = import.meta.glob<string>("./tiles/*.svg", {
  query: "?raw",
  import: "default",
  eager: true,
});

// Group dependencies into an object for easier mocking in tests
/* v8 ignore start */
export const dependencies = {
  getSvg: (tile: string): string | undefined => {
    const svgPath = `./tiles/${tile}.svg`;
    return svgTilesData[svgPath];
  },
};
/* v8 ignore stop */

// Constants
const DEFAULT_TILE_SIZE = "60px";
const ROTATED_TILE_HEIGHT_FACTOR = 0.75;
const SPACER_WIDTH_FACTOR = 0.2;
const WRAPPER_CLASS = "mahjong-tiles-wrapper";
const WRAPPER_STYLE = (display: string) =>
  `display: ${display}; align-items: end;`;
const JIA_GANG_STACK_STYLE = "display: flex; flex-direction: column;";

const createSvgElement = (
  tileName: string,
  tileSize: string,
  shouldRotate?: boolean,
): Element | null => {
  const svgTileName = shouldRotate ? `y${tileName}` : tileName;
  const svgString = dependencies.getSvg(svgTileName);
  if (!svgString) return null;

  const svgAst = parseSvg(svgString);
  const el = svgAst.children[0] as Element;
  el.properties.style = `flex-shrink: 0; width: auto; height: ${
    shouldRotate
      ? `calc(${tileSize} * ${ROTATED_TILE_HEIGHT_FACTOR});`
      : `${tileSize};`
  }`;

  return el;
};

type MahjongTilesOptions = {
  size?: string;
};

const remarkMahjongTiles: Plugin<[MahjongTilesOptions?], Root> = (
  options = {},
) => {
  return (tree) => {
    visit(tree, (node) => {
      if (node.type !== "leafDirective" && node.type !== "textDirective")
        return;
      if (node.name !== "mahjong-tiles") return;

      const attr = node.attributes;
      if (!attr) return;

      const srcAttr = attr.src;
      const tilesData = typeof srcAttr === "string" ? parse(srcAttr) : [];
      const currentSize = attr.size ?? options.size ?? DEFAULT_TILE_SIZE;

      const tileElements: Element[] = [];
      for (const tileGroup of tilesData) {
        if (tileGroup.type === "single" || tileGroup.type === "an-gang") {
          const parsedTiles =
            tileGroup.type === "single" ? [tileGroup.tile] : tileGroup.tiles;
          for (const tile of parsedTiles) {
            const el = createSvgElement(tile, currentSize);
            if (el) tileElements.push(el);
          }
        } else if (
          tileGroup.type === "chi" ||
          tileGroup.type === "peng" ||
          tileGroup.type === "da-ming-gang" ||
          tileGroup.type === "jia-gang"
        ) {
          const rotationPos = tileGroup.type === "chi" ? 0 : tileGroup.pos;
          for (let i = 0; i < tileGroup.tiles.length; i += 1) {
            const el = createSvgElement(
              tileGroup.tiles[i],
              currentSize,
              i === rotationPos,
            );
            if (el) {
              if (tileGroup.type === "jia-gang" && i === rotationPos) {
                // biome-ignore lint/style/noNonNullAssertion: precondition
                const lastTile = tileGroup.tiles.pop()!;
                const el2 = createSvgElement(lastTile, currentSize, true);
                if (el2) {
                  tileElements.push(
                    h("div", { style: JIA_GANG_STACK_STYLE }, [el2, el]),
                  );
                }
              } else {
                tileElements.push(el);
              }
            }
          }
        } else if (tileGroup.type === "spacer") {
          tileElements.push(
            h("div", {
              style: `flex-shrink: 0; width: calc(${currentSize} * ${SPACER_WIDTH_FACTOR});`,
            }),
          );
        }
      }

      node.data = {
        hName: node.type === "leafDirective" ? "div" : "span",
        hProperties: {
          class: WRAPPER_CLASS,
          style: WRAPPER_STYLE(
            node.type === "leafDirective" ? "flex" : "inline-flex",
          ),
        },
        hChildren: tileElements,
      };
    });
  };
};

export default remarkMahjongTiles;
