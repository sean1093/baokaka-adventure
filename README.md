# 《翻翻台北》 Pop-Up Taipei

*You can't steer a baby. You can only rearrange the city.* 寶寶不聽指揮——你只能改變台北。

A gentle pop-up-book puzzle game for the whole family, made for 寶咖咖's first birthday (度晬). It runs in the phone's browser, in portrait, in 繁體中文.

**Play it:** <https://sean1093.github.io/baokaka-adventure/>

It's the night before 寶咖咖's first birthday. A baby typhoon named 咻咻 blows the nine 抓周 treasures out of the window and blows open 阿嬤's pop-up book 《台北》. A crawling baby and his guilty big-brother cat 摩卡 ride the paper 月亮線 train through the book's pages (Taipei's landmarks) to bring everything home before 阿嬤 wakes at 05:30.

## How to play

- Each **page** is a small paper diorama. 寶咖咖 crawls **by himself** toward whatever he wants most that he can see (a golden bead, a shiny thing, 摩卡). You can't steer him.
- You change the page around him: **pull tabs** (拉), **turn wheels** (轉), **lift flaps**, and **tap a perch** to send 摩卡 up there. 摩卡 pushes things off, sits on things, and is the thing 寶咖咖 loves most.
- When he reaches the page's 金珠珠 (golden bead), the page folds into the next one.
- He learns a **word** each chapter (嗶！, 掰掰, 不要！, 哇！, 抱抱, 飛機！, 咻——, 一起). Tap him (or 說話) and pick a word.
- **Nothing can go wrong.** He never falls, nothing breaks, there is no timer, and crying is a tool, not a loss. 重來 restarts a page at no cost.
- **提示** helps in three steps: where (a glow), how (a ghost hand), and show me (it plays the move). Hints cost nothing.
- Each page has three stickers: **解開** (solved), **淘氣** (an optional bit of mischief) and **土地公** (a tiny 阿伯 hidden on the page, wearing a different hat in every chapter). Each chapter ends on a photo for **寶咖咖一歲的相簿**, with notes from the family.
- **Size:** a prologue, 10 chapters of 6 pages and an interactive ending (65 pages), about 3–4 hours at 1–3 minutes a page, plus a bonus page once every 土地公 is found.
- **設定:** 長輩模式 (slower, bigger text, quicker hints), 速度, 大字, 自動提示, 音效 and 音樂, 震動, 減少動態, 左手模式, 書本傾斜. Progress saves on the phone after every page; 「繼續」 on the cover resumes where you were.

## Develop

Vite + React 18 + TypeScript + Tailwind, tested with Vitest; Node 20.

```sh
npm ci
npm run dev          # http://localhost:5173/baokaka-adventure/
npm test             # unit tests, plus a solver proof for every page
npm run build        # tsc -b + vite build into dist/
npm run preview      # serve dist/
```

- **Where things are.** The game is `src/popup/`: a pure simulation and solver (`core/`), the pages (`pages/cN/`), the renderer (`view/`), the game shell and save (`game/`, `view/screens/`), content and lines (`content/`), environment art and its bake (`env/`), character sprites (`sprites/`) and the dev tools (`dev/`). `src/quest/` is the retired RPG, kept until the owner signs off on #110 and #111 deletes it.
- **Dev tools (dev builds only).** PageLab at `#/pagelab` (every page, the solver, fixtures for every screen state: `?fixture=<name>&still=1`) and the art lab at `#/artlab`. Any build opens a page directly with `#/?page=<id>` (`&demo=1` plays its solution).
- **Docs.** Start with the project handbook [`docs/project/README.md`](docs/project/README.md) (process, conventions, definition of done). The game design is [`docs/design/gdd.md`](docs/design/gdd.md); the art direction is [`docs/art/v2/README.md`](docs/art/v2/README.md) (characters) and [`docs/art/popup/README.md`](docs/art/popup/README.md) (the pop-up paper world). The plan and status are in [`docs/project/roadmap.md`](docs/project/roadmap.md), the launch status in [`docs/project/launch-readiness.md`](docs/project/launch-readiness.md).
- **Deploy.** Every push to `main` runs `.github/workflows/deploy.yml` (`npm ci && npm test && npm run build`) and publishes `dist/` to GitHub Pages.

## QA commands

| Command | What it checks | Time on the agent container |
|---|---|---|
| `npm test` | Unit tests; lint, solution replay and a complete solve of every page; hints at level 3 finish every page; art budgets and the art-gap gate | ≈ 1.5 min |
| `npm run build` | Types (`tsc -b`) and the production bundle | ≈ 30 s |
| `npm run solve` | The solver table for every page (par, states, dead ends, soft traps, 淘氣 / 土地公 reachable); `-- --curve` for the difficulty curve | ≈ 20 s |
| `npm run art:report` | Each page's art payload against 350 KB, the first load against 2.5 MB, and zero placeholder art keys | seconds |
| `npm run visual` | Screenshots of every fixture at 390×844 and 375×667 against `tests/visual-baseline/` (`--only a,b` for a subset, `visual:update` to accept) | ≈ 55 min |
| `npm run check:ui` / `check:ui:big` | Text size (≥ 20 px, ≥ 24 px with 大字), contrast, 48 px hit areas, named controls, reduced motion and no flashing on every screen (`UI_ONLY=a,b` for a subset) | ≈ 1.5 h each |
| `npm run check:play` | Plays every page and screen flow with mouse and touch at both sizes (`--only a,b`) | ≈ 1 h |
| `npm run check:perf` | ≥ 55 fps and ≤ 150 animated nodes on each chapter's heaviest pages, production build, 4× CPU throttle | ≈ 7 min |
| `npm run check:prod` | Production smoke test, 4G load budgets (first load ≤ 2.5 MB, cover and page 0-1 ≤ 3 s), notch insets, the upright guard | ≈ 2 min |
| `npm run qa` | `visual` + `check:ui` + `check:play` | — |

Playwright's Chromium is needed for the browser checks (`npx playwright install chromium` once; the agent environment has it at `PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers`). The long checks are best run in chunks against one dev server (`--url`, `--only`, `UI_ONLY`); see the handbook § 5.

The art and font pipelines (`npm run sync:sprites`, `bake:popup`, `fonts`) also need Python 3 with Pillow, fonttools and brotli. CI needs none of them: their outputs are committed.

## Credits and licences

- **Made by** 寶咖咖的爸爸 and Claude (Anthropic), for 寶咖咖. The characters are drawn from the family's own photos (see [`docs/art/v2/`](docs/art/v2/README.md)); please don't reuse the character art.
- **Fonts** (self-hosted subsets in `src/fonts/`): [Chiron GoRound TC](https://github.com/chiron-fonts/chiron-go-round-tc), [Noto Serif TC](https://fonts.google.com/noto/specimen/Noto+Serif+TC) and [Fredoka](https://fonts.google.com/specimen/Fredoka), each under the SIL Open Font License 1.1 (texts in [`public/fonts/`](public/fonts/)).
- **Art and sound** are made for this game: the pop-up paper art is drawn in code and baked to WebP by the repo's own scripts; the sound is synthesised in the browser at run time.
- **Code dependencies** (React, Vite, Tailwind, Vitest, Playwright and others) keep their own licences (MIT, Apache-2.0); see `package.json` and `node_modules/*/LICENSE`.
