remark-mahjong-tiles
==

This is a remark plugin for representing mahjong tiles.

## Installation

```shell
npm install @tkzwhr/remark-mahjong-tiles
```

## Usage

Say we have the following file `example.md`:

```md
::mahjong-tiles{src="123s"}

This is :mahjong-tiles{src="1s"}.
```

…and our module `example.js` looks as follows:

```js
import rehypeFormat from 'rehype-format'
import rehypeStringify from 'rehype-stringify'
import remarkDirective from 'remark-directive'
import remarkParse from 'remark-parse'
import remarkRehype from 'remark-rehype'
import {read} from 'to-vfile'
import {unified} from 'unified'
import {visit} from 'unist-util-visit'
import remarkMahjongTiles from '@tkzwhr/remark-mahjong-tiles'

const file = await unified()
  .use(remarkParse)
  .use(remarkDirective)
  .use(remarkMahjongTiles)
  .use(remarkRehype)
  .use(rehypeFormat)
  .use(rehypeStringify)
  .process(await read('example.md'))

console.log(String(file))
```

…then running `node example.js` yields:

```html
<div class="mahjong-tiles-wrapper">
  <svg><!-- the content of '1s' --></svg>
  <svg><!-- the content of '2s' --></svg>
  <svg><!-- the content of '3s' --></svg>
</div>

This is <span class="mahjong-tiles-wrapper">
  <svg><!-- the content of '1s' --></svg>
</span>
.
```
