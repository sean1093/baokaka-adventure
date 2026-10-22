#!/usr/bin/env node
/**
 * Plays pages of 翻翻台北 to completion through real pointer input (issue #90; GDD § 2.6), with a
 * mouse and with touch emulation, at 390×844 and 375×667. Each scenario drives the page the way a
 * player would — drags along tab tracks, taps on perches — and passes when the page reports
 * `data-done`. It also checks that a finger down pauses the world (the tick stops) and that no
 * console errors appear.
 *
 *   node scripts/play-check.mjs [--serve] [--url <base>] [--shots <dir>] [--only <ids>]
 *
 *   --serve    start a Vite dev server for the run
 *   --url      base URL of a server you started yourself (default http://localhost:5173/baokaka-adventure/)
 *   --shots    write a PNG per step into this directory
 *   --only     run only these scenarios (comma-separated ids)
 *
 * It also fails when a registered page (listed at `#/pagelab?section=fixtures`) has no scenario:
 * add one with every new page. A scenario can also play a PageLab stage through a live fixture
 * (`SCENARIO_URLS`): `c1p3` plays 1-3's word flow end to end (#99, #107) — the 「要！」 poke, Mocha's
 * push, the learn beat and its word card, the tutorial, the word ring and 嗶！;
 * `hints-c1p2` plays 1-2 with 提示 alone (#100: where, how, then show me until done);
 * `stickers-c1p2` earns all three of 1-2's stickers in the game shell (#101: four rides for the 淘氣,
 * the board flipped and the 土地公 tapped, the solve, the sticker card, then 1-3);
 * `photo-spread` plays 1-6 in the shell (#103, #107: the photo moment, the album, a retake, the
 * chapter-end lines, the tray's first coin, the sticker card, chapter 2's card, into 2-1); since #114
 * `photo-spread-c2` plays 2-6 the same way into chapter 3's card and 3-1 (#116), `photo-spread-c3`
 * plays 3-6 into chapter 4's card and 4-1 (#118), `photo-spread-c4` plays 4-6 into chapter 5's card
 * and 5-1 (#121), `photo-spread-c5` plays 5-6 into chapter 6's card and 6-1 (#123),
 * `photo-spread-c6` plays 6-6 into chapter 7's card and 7-1 (#125), `photo-spread-c7` plays 7-6 into
 * chapter 8's card and 8-1 (#129), `photo-spread-c8` plays 8-6 into chapter 9's card and 9-1 (#131),
 * `photo-spread-c9` plays 9-6 into chapter 10's card and 10-1 (#133), and `photo-spread-c10` plays
 * 10-6 (一起, the first steps, the hug) through the album and the four end lines, the 05:30 scene and
 * page E's card into page E (#135); `ending` plays page E in the shell through his first words, the
 * 抓周 photo, the credits and the post-credits to the cover.
 * A `drag` through more than two points follows them in turn (1-4's turntable is turned on its rim).
 * `{ heard: [cues] }` checks the shell played those sounds (#105; the dev build lists them in
 * `window.__popupSounds`): `prologue-card` hears the board drop, flip, lift and the pop-ups land.
 * `talk-anywhere-c1p1` reads lines away with taps off the bubbles (one on a touchable that must not
 * move), `c0p4-curtain-first` plays 0-4 in its other order, `nope-c1p5` taps a perch Mocha can't
 * reach and `tutorial-c1p5` waits for 1-5's nudge (#183). The M2 toy pages (#112) play live from
 * their fixtures: `m2-moon-no` learns 不要！ from the goose (beat and card) and refuses the moon
 * decoy through the ring; `m2-squirrel-bye` says 掰掰 to the herded squirrel, which drops the bead.
 * Exits 1 on any failure. Part of `npm run qa` (#92) with the visual
 * and UI checks.
 */
import { mkdir } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';
import { listPopupFixtures } from './popup-checks.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const { values: args } = parseArgs({
  options: { serve: { type: 'boolean' }, url: { type: 'string' }, shots: { type: 'string' }, only: { type: 'string' } },
});

/** Points on an arc round `c` of radius `r`, from `a0` to `a1` degrees (clockwise on screen is positive). */
const arc = ([cx, cy], r, a0, a1, n = 8) =>
  Array.from({ length: n + 1 }, (_, i) => {
    const a = ((a0 + ((a1 - a0) * i) / n) * Math.PI) / 180;
    return [Math.round(cx + r * Math.cos(a)), Math.round(cy + r * Math.sin(a))];
  });

/** Page-unit gesture scripts per page (data from src/popup/pages/). */
const SCENARIOS = {
  c0p1: [
    // The prologue's lines open the page (#102): read them away, a tap a beat (on a small phone they can cover the tab)
    { readTalk: true },
    // Pull the crib-rail tab down along its track (150,480 → 150,540)
    { drag: [[150, 480], [150, 545]] },
  ],
  // 0-2 「沙發山」 (#106): he watches the TV until the cushion shows the bead, then crawls back for it
  c0p2: [
    { wait: 'watching' },
    { tap: [63, 447] },
  ],
  // 0-3 「摩卡起床」: Mocha's join lines, then the table's paw print — he pushes the bead off
  c0p3: [
    { readTalk: true },
    { wait: 'reaching' },
    { tap: [262, 366] },
  ],
  // 0-4 「窗外的月亮線」: Mocha into the laundry basket, nothing to want, he cries — the door opens,
  // the train wakes (廣播姊姊) — then the curtain open and he crawls out to the train's step
  c0p4: [
    { wait: 'cuddling' },
    { tap: [34, 414] },
    { wait: 'crying' },
    { expect: '[data-subtitle]', timeout: 6_000 },
    { readTalk: true },
    { tap: [300, 263] },
  ],
  // The prologue's scripted tutorials (#106, first play; `tutorial=1`): 0-1's ghost hand pulls the
  // rail after 4 s of reaching, 0-2's bubble wears its spotlight, 0-3's hand taps the table
  'tutorial-c0p1': [
    { readTalk: true },
    { wait: 'reaching' },
    { absent: '[data-hint-hand]' },
    { expect: '[data-hint-hand="drag"]', timeout: 9_000 },
    { drag: [[150, 480], [150, 545]] },
  ],
  'tutorial-c0p2': [
    { wait: 'watching' },
    { expect: '[data-bubble-spotlight]', timeout: 5_000 },
    { tap: [63, 447] },
    { expect: '[data-bubble-spotlight]', timeout: 3_000 },
  ],
  'tutorial-c0p3': [
    { readTalk: true },
    { wait: 'reaching' },
    { absent: '[data-hint-hand]' },
    { expect: '[data-hint-hand="tap"]', timeout: 9_000 },
    { tap: [262, 366] },
  ],
  c1p2: [
    { wait: 'reaching' },
    // The train tab out → half (stops at x 80 / 140 / 200 on y 610)
    { drag: [[80, 610], [142, 610]] },
    { settle: 1500 },
    // Mocha to the pillar: the pigeon flees the track
    { tap: [280, 234] },
    { settle: 2500 },
    // half → full
    { drag: [[140, 610], [205, 610]] },
  ],
  // 1-1 「月亮線，出發！」 (#107): 廣播姊姊's lines, then the rack's paw print — Mocha strap-hops over and
  // pushes the map onto the sleeping backpacker, who wakes (his line, Mocha's translation) and tucks in
  c1p1: [
    { readTalk: true },
    { wait: 'reaching' },
    { tap: [286, 280] },
    { expect: '[data-subtitle]', timeout: 6_000 },
    { readTalk: true },
  ],
  // 1-3's words (#99, #107): elements are tapped where they are drawn (`tapEl`)
  c1p3: [
    // Poke him: no word yet, so 「要！」 and no ring
    { wait: 'reaching' },
    { tapEl: '[data-actor="baby"]' },
    { expect: '[data-bark-kind="want"]', absent: '[data-word-ring]' },
    { settle: 600 },
    // Mocha to the counter: the card hits the reader, gate A opens, he learns 嗶！
    { tap: [100, 294] },
    { tapEl: '[data-subtitle]' },
    { tapEl: '[data-word-card]', paused: true },
    { wait: 'reaching' },
    { expect: '[data-glow]' },
    { tapEl: '[data-actor="baby"]' },
    { tapEl: '[data-word="beep"]', paused: true },
  ],
  // 1-4 「大廳的棋盤」 (#107): turn the floor east–west (a quarter back round its rim), he crawls to the
  // centre; 嗶！ opens gate N; turn it north–south again with him on it, and he crawls through
  c1p4: [
    { wait: 'reaching' },
    { drag: arc([195, 495], 76, 0, -90) },
    { settle: 1500 },
    { wait: 'reaching' },
    { tapEl: '[data-actor="baby"]' },
    { tapEl: '[data-word="beep"]', paused: true },
    { settle: 1200 },
    { drag: arc([195, 495], 76, 180, 270) },
  ],
  // 1-5 「便當店的電梯」 (#107): Mocha into the car (it goes down, he crawls in), then tap Mocha to press again
  c1p5: [
    { wait: 'reaching' },
    { tap: [244, 242] },
    { settle: 2500 },
    { wait: 'reaching' },
    { tapEl: '[data-actor="mocha"]' },
  ],
  // 1-6 「台鐵便當」 (#107): the lid open (the pigeon swoops onto the cart), 嗶！ at the gate, the cart to
  // the platform, Mocha onto its awning (the pigeon flees) — the photo moment, 咔嚓, the grab
  c1p6: [
    { wait: 'cuddling' },
    { tap: [322, 456] },
    { wait: 'reaching' },
    { tapEl: '[data-actor="baby"]' },
    { tapEl: '[data-word="beep"]', paused: true },
    { settle: 1500 },
    { drag: [[304, 604], [260, 604]] },
    { settle: 1200 },
    // Mocha's translation of 嗶！ is still up: a tap reads it away first (#183; the drag played under it)
    { readTalk: true },
    { tap: [270, 386] },
    // No line is left up under the camera (#183: one was stranded under the HUD)
    { expect: '[data-photo-moment][data-photo-mocha]', absent: '[data-subtitle], [data-narration]', timeout: 10_000 },
    { tapEl: '[data-shutter]', paused: true },
  ],
  // Chapter 2 「會揮手的公園」 (#114). 2-1 「信義線」: 廣播姊姊's line, then 嗶！ at the doors and Mocha to the
  // bench, where he knocks the umbrella across the gap
  c2p1: [
    { readTalk: true },
    { wait: 'reaching' },
    { tapEl: '[data-actor="baby"]' },
    { tapEl: '[data-word="beep"]', paused: true },
    { settle: 1200 },
    // The first 嗶！ on a page plays Mocha's translation: read it away (#183)
    { readTalk: true },
    { tap: [272, 366] },
  ],
  // 2-2 「露天音樂台」: Mocha into the 店員小哥's crate (the cameo), then the spotlight one step round
  // (a tap: lawn → trap door); the plate raises the curtain
  c2p2: [
    { wait: 'cuddling' },
    { tap: [186, 366] },
    { expect: '[data-subtitle]', timeout: 6_000 },
    { readTalk: true },
    { tap: [176, 540] },
  ],
  // 2-3 「跑步的阿姨」: Mocha to the railing — the jogger waves 掰掰 and jogs off, he learns it (the beat
  // and its card) — then 掰掰 to the dog curled round the bead
  c2p3: [
    { wait: 'cuddling' },
    { tap: [206, 384] },
    { tapEl: '[data-subtitle]' },
    { tapEl: '[data-word-card]', paused: true },
    { wait: 'cuddling' },
    { tapEl: '[data-actor="baby"]' },
    { tapEl: '[data-word="bye"]', paused: true },
  ],
  // 2-4 「松鼠的樹」: Mocha to the east fork, then the west fork (the squirrel is herded down), then 掰掰
  c2p4: [
    { wait: 'reaching' },
    { tap: [248, 244] },
    { settle: 1500 },
    { tap: [162, 264] },
    { settle: 1500 },
    { wait: 'reaching' },
    { tapEl: '[data-actor="baby"]' },
    { tapEl: '[data-word="bye"]', paused: true },
  ],
  // 2-5 「生態池」: 掰掰 to the egret on the lily pad, then turn the pad to the near shore (a quarter back
  // round its rim), he crawls aboard, and half a turn on to the far shore (dragged round its bottom,
  // under him, so the drag doesn't start on him)
  c2p5: [
    { wait: 'reaching' },
    { tapEl: '[data-actor="baby"]' },
    { tapEl: '[data-word="bye"]', paused: true },
    { settle: 1200 },
    { readTalk: true },
    { drag: arc([206, 478], 68, -90, -180) },
    { settle: 1500 },
    { wait: 'reaching' },
    { drag: arc([206, 478], 68, 140, -20, 12) },
  ],
  // 2-6 「畫畫的阿伯」: the canvas's bridge and branch flaps, Mocha to the parasol (the squirrel flees),
  // 掰掰 — the painter drops the 畫筆 — the photo moment, 咔嚓, the grab
  c2p6: [
    { wait: 'reaching' },
    { tap: [148, 472] },
    { tap: [224, 290] },
    { settle: 1200 },
    { tap: [300, 314] },
    { settle: 1500 },
    { wait: 'reaching' },
    { tapEl: '[data-actor="baby"]' },
    { tapEl: '[data-word="bye"]', paused: true },
    { expect: '[data-photo-moment][data-photo-mocha]', timeout: 10_000 },
    { tapEl: '[data-shutter]', paused: true },
  ],
  // Chapter 3 「醉月湖的鵝」 (#116). 3-1 「綠線」: 廣播姊姊's line, 掰掰 to the dozing backpacker (he sits
  // up and asks for 101; Mocha translates), then 嗶！ at the doors
  c3p1: [
    { readTalk: true },
    { wait: 'reaching' },
    { tapEl: '[data-actor="baby"]' },
    { tapEl: '[data-word="bye"]', paused: true },
    { settle: 1200 },
    { readTalk: true },
    { wait: 'reaching' },
    { tapEl: '[data-actor="baby"]' },
    { tapEl: '[data-word="beep"]', paused: true },
    { settle: 1200 },
    { readTalk: true },
  ],
  // 3-2 「椰林大道」: Mocha onto the delivery bike's seat (the 店員小哥 cameo), then both outer bikes
  // back into the rack (a tap on each knob: one stop)
  c3p2: [
    { wait: 'reaching' },
    { tap: [190, 380] },
    { expect: '[data-subtitle]', timeout: 6_000 },
    { readTalk: true },
    { tap: [86, 500] },
    { settle: 800 },
    { tap: [296, 500] },
  ],
  // 3-3 「醉月湖」: Mocha to the rock — the goose honks and he learns 不要！ (the beat and its card) — then
  // 不要！ to the moon
  c3p3: [
    { wait: 'reaching' },
    { tap: [330, 372] },
    { tapEl: '[data-subtitle]' },
    { tapEl: '[data-word-card]', paused: true },
    { wait: 'reaching' },
    { tapEl: '[data-actor="baby"]' },
    { tapEl: '[data-word="no"]', paused: true },
  ],
  // 3-4 「傅鐘」: pull the bell-rope (the pigeons scatter), Mocha to the gate's pillar, 不要！ to the bell
  c3p4: [
    { wait: 'reaching' },
    { drag: [[108, 300], [108, 380]] },
    { settle: 800 },
    { tap: [318, 346] },
    { settle: 1500 },
    { wait: 'reaching' },
    { tapEl: '[data-actor="baby"]' },
    { tapEl: '[data-word="no"]', paused: true },
  ],
  // 3-5 「總圖書館」: crank D east (Mocha holds C), crank A east (B rolls too), Mocha across onto B,
  // crank A back west: aisles 1 and 3 open
  c3p5: [
    { wait: 'reaching' },
    { tap: [246, 544] },
    { settle: 800 },
    { tap: [66, 544] },
    { settle: 800 },
    { tap: [150, 264] },
    { settle: 1500 },
    { drag: [[90, 544], [66, 544]] },
  ],
  // 3-6 「藍教授的書」: the bookmark page, 不要！ to the glasses (he crawls back off the page), the page
  // turned, Mocha beside 藍教授 — she flaps off — the photo moment, 咔嚓, the grab
  c3p6: [
    { wait: 'reaching' },
    { tap: [294, 476] },
    { tapEl: '[data-actor="baby"]' },
    { tapEl: '[data-word="no"]', paused: true },
    { settle: 2500 },
    { readTalk: true },
    { wait: 'reaching' },
    { tap: [226, 412] },
    { settle: 800 },
    { tap: [296, 376] },
    { expect: '[data-photo-moment][data-photo-mocha]', timeout: 10_000 },
    { tapEl: '[data-shutter]', paused: true },
  ],
  // Chapter 4 「霓虹燈睡著了」 (#118). 4-1 「板南線往西門」: 廣播姊姊's line, Mocha onto the header over the
  // doors, 不要！ to the ad screen (he crawls to the doors), then 嗶！
  c4p1: [
    { readTalk: true },
    { wait: 'reaching' },
    { tap: [250, 330] },
    { settle: 1200 },
    { tapEl: '[data-actor="baby"]' },
    { tapEl: '[data-word="no"]', paused: true },
    { settle: 2500 },
    { readTalk: true },
    { wait: 'reaching' },
    { tapEl: '[data-actor="baby"]' },
    { tapEl: '[data-word="beep"]', paused: true },
  ],
  // 4-2 「紅樓」: turn 紅樓 four steps (its roof window to the lamp), Mocha through the window to the
  // eave (the lantern drops on the button: the shutter rolls up), two more steps (the doorways align)
  c4p2: [
    { wait: 'reaching' },
    { tap: [176, 380] },
    { settle: 500 },
    { tap: [176, 380] },
    { settle: 500 },
    { tap: [176, 380] },
    { settle: 500 },
    { tap: [176, 380] },
    { settle: 800 },
    { tap: [262, 300] },
    { settle: 3000 },
    { tap: [176, 380] },
    { settle: 500 },
    { tap: [176, 380] },
  ],
  // 4-3 「霓虹燈睡著了」: he cries in the dark and the first sign flickers awake — he learns 哇！ (the
  // beat and its card) — then 哇！ twice down the trail of lights
  c4p3: [
    { wait: 'watching' },
    { readTalk: true },
    { tapEl: '[data-word-card]', paused: true },
    { wait: 'watching' },
    { tapEl: '[data-actor="baby"]' },
    { tapEl: '[data-word="wow"]', paused: true },
    { settle: 1500 },
    { wait: 'watching' },
    { tapEl: '[data-actor="baby"]' },
    { tapEl: '[data-word="wow"]', paused: true },
  ],
  // 4-4 「夾娃娃機」: Mocha onto the coin slot (the 店員小哥 cameo), the claw's cart over to him, the
  // drop lever down: the claw grabs him and carries him home over the chute
  c4p4: [
    { wait: 'reaching' },
    { tap: [352, 300] },
    { expect: '[data-subtitle]', timeout: 6_000 },
    { readTalk: true },
    { drag: [[290, 150], [140, 150]] },
    { settle: 800 },
    { drag: [[178, 484], [178, 536]] },
  ],
  // 4-5 「街頭藝人」: Mocha onto the amp crate (he follows), 哇！ (the boombox plays, the dancers freeze
  // into an arch, the boombox is a decoy), Mocha over the arch to the bus-stop sign, 不要！ to the music
  c4p5: [
    { wait: 'cuddling' },
    { tap: [76, 396] },
    { settle: 1500 },
    { wait: 'cuddling' },
    { tapEl: '[data-actor="baby"]' },
    { tapEl: '[data-word="wow"]', paused: true },
    { settle: 1200 },
    { readTalk: true },
    { tap: [300, 300] },
    { settle: 1500 },
    { wait: 'reaching' },
    { tapEl: '[data-actor="baby"]' },
    { tapEl: '[data-word="no"]', paused: true },
  ],
  // 4-6 「走音天王」: the shutter rolled up (the disco ball: he crawls back under it), Mocha onto the amp,
  // 不要！ to the disco ball (he crawls up to the stage front), 哇！ — the king sings, the lift rises —
  // the photo moment, 咔嚓, the grab
  c4p6: [
    { wait: 'cuddling' },
    { tap: [232, 366] },
    { settle: 1500 },
    { tap: [312, 370] },
    { settle: 1500 },
    { wait: 'reaching' },
    { tapEl: '[data-actor="baby"]' },
    { tapEl: '[data-word="no"]', paused: true },
    { settle: 2500 },
    { readTalk: true },
    { wait: 'reaching' },
    { tapEl: '[data-actor="baby"]' },
    { tapEl: '[data-word="wow"]', paused: true },
    { expect: '[data-photo-moment][data-photo-mocha]', timeout: 10_000 },
    { tapEl: '[data-shutter]', paused: true },
  ],
  // Chapter 5 「夜市抱抱」 (#121). 5-1 「往劍潭」: 廣播姊姊's line, Mocha onto the luggage rack, 不要！ to the
  // glowing phone (he crawls to the end of the car), then 哇！: the lights come on and the bead shows
  c5p1: [
    { readTalk: true },
    { wait: 'reaching' },
    { tap: [318, 270] },
    { settle: 1200 },
    { tapEl: '[data-actor="baby"]' },
    { tapEl: '[data-word="no"]', paused: true },
    { settle: 3000 },
    { readTalk: true },
    { wait: 'reaching' },
    { tapEl: '[data-actor="baby"]' },
    { tapEl: '[data-word="wow"]', paused: true },
  ],
  // 5-2 「射氣球攤」: Mocha into the balloon basket (it sinks; the 店員小哥 cameo), he crawls in after him,
  // Mocha out onto the awning (the basket floats up with him), 哇！ to the bulbs over the prize shelf
  c5p2: [
    { wait: 'cuddling' },
    { tap: [214, 290] },
    { expect: '[data-subtitle]', timeout: 6_000 },
    { readTalk: true },
    { wait: 'cuddling' },
    { tap: [290, 214] },
    { settle: 1500 },
    { wait: 'cuddling' },
    { tapEl: '[data-actor="baby"]' },
    { tapEl: '[data-word="wow"]', paused: true },
  ],
  // 5-3 「抱抱」: beside the 夜市阿姨 he learns 抱抱 (the beat and its card), 抱抱 — she carries him over
  // the crowd's legs — Mocha onto the counter's bell (the 雞排老闆 comes out), 抱抱 him over the counter
  c5p3: [
    { wait: 'reaching' },
    { readTalk: true },
    { tapEl: '[data-word-card]', paused: true },
    { wait: 'reaching' },
    { tapEl: '[data-actor="baby"]' },
    { tapEl: '[data-word="hug"]', paused: true },
    { settle: 2500 },
    { readTalk: true },
    { wait: 'reaching' },
    { tap: [296, 404] },
    { expect: '[data-subtitle]', timeout: 6_000 },
    { readTalk: true },
    { tapEl: '[data-actor="baby"]' },
    { tapEl: '[data-word="hug"]', paused: true },
  ],
  // 5-4 「彈珠台」: both flippers to the left (a tap each), Mocha onto the launch knob: the ball runs
  // down the left lane into the tray at his side
  c5p4: [
    { wait: 'reaching' },
    { tap: [276, 190] },
    { settle: 600 },
    { tap: [196, 340] },
    { settle: 600 },
    { tap: [330, 412] },
  ],
  // 5-5 「按摩椅」: Mocha knocks a coin into each chair's slot (they recline into steps), 掰掰 to the dog
  // napping on the second chair, then 抱抱: the 阿伯 carries him up the chairs to the bead
  c5p5: [
    { wait: 'reaching' },
    { tap: [236, 330] },
    { settle: 2500 },
    { tap: [290, 270] },
    { settle: 2500 },
    { tapEl: '[data-actor="baby"]' },
    { tapEl: '[data-word="bye"]', paused: true },
    { settle: 1500 },
    { readTalk: true },
    { wait: 'reaching' },
    { tapEl: '[data-actor="baby"]' },
    { tapEl: '[data-word="hug"]', paused: true },
  ],
  // 5-6 「蔥抓餅」: Mocha onto the stall's sign, 不要！ to the griddle (he crawls along the counter to the
  // vendor), 抱抱 — she lifts him over the counter — Mocha onto the tray stack (it sinks: the 蔥),
  // the photo moment, 咔嚓, the grab
  c5p6: [
    { wait: 'reaching' },
    { tap: [54, 226] },
    { settle: 1200 },
    { tapEl: '[data-actor="baby"]' },
    { tapEl: '[data-word="no"]', paused: true },
    { settle: 3000 },
    { readTalk: true },
    { wait: 'reaching' },
    { tapEl: '[data-actor="baby"]' },
    { tapEl: '[data-word="hug"]', paused: true },
    { settle: 2500 },
    { readTalk: true },
    { wait: 'reaching' },
    { tap: [346, 204] },
    { expect: '[data-photo-moment][data-photo-mocha]', timeout: 10_000 },
    { tapEl: '[data-shutter]', paused: true },
  ],
  // Chapter 6 「飛機睡著的時候」 (#123). 6-1 「文湖線前窗」: 廣播姊姊's line, Mocha onto the dashboard (he
  // crawls to the front window), the switch to the airport, 嗶！ (the train runs in), 抱抱 the 姊姊
  c6p1: [
    { readTalk: true },
    { wait: 'cuddling' },
    { tap: [70, 372] },
    { settle: 1500 },
    { wait: 'cuddling' },
    { tap: [105, 532] },
    { settle: 600 },
    { tapEl: '[data-actor="baby"]' },
    { tapEl: '[data-word="beep"]', paused: true },
    { settle: 1500 },
    { readTalk: true },
    { wait: 'reaching' },
    { tapEl: '[data-actor="baby"]' },
    { tapEl: '[data-word="hug"]', paused: true },
    { settle: 1500 },
    { readTalk: true },
  ],
  // 6-2 「行李轉盤」: Mocha squeezes behind the rubber curtain onto the start button (the 店員小哥
  // cameo), two turns of the belt bring the suitcase to him, one more carries him to the bead
  c6p2: [
    { wait: 'reaching' },
    { tap: [344, 392] },
    { expect: '[data-subtitle]', timeout: 6_000 },
    { readTalk: true },
    { tap: [214, 473] },
    { settle: 600 },
    { tap: [214, 473] },
    { settle: 1500 },
    { wait: 'reaching' },
    { tap: [214, 473] },
  ],
  // 6-3 「看飛機」: Mocha onto the window rail, he crawls to the glass and learns 飛機！ (the beat and its
  // card), 飛機！: the pigeons lift off the gate's button and it opens
  c6p3: [
    { wait: 'cuddling' },
    { tap: [176, 372] },
    { settle: 1500 },
    { readTalk: true },
    { tapEl: '[data-word-card]', paused: true },
    { wait: 'cuddling' },
    { tapEl: '[data-actor="baby"]' },
    { tapEl: '[data-word="plane"]', paused: true },
  ],
  // 6-4 「空橋」: the bridge out (a tap on its tab), 飛機！ (the birds fly, the cab swings free), the cab
  // to the A321 (a tap on its wheel), 飛機！ again (the birds tip the plank onto the sill)
  c6p4: [
    { wait: 'reaching' },
    { tap: [120, 532] },
    { settle: 1500 },
    { wait: 'reaching' },
    { tapEl: '[data-actor="baby"]' },
    { tapEl: '[data-word="plane"]', paused: true },
    { settle: 1200 },
    { readTalk: true },
    { tap: [300, 528] },
    { settle: 1200 },
    { tapEl: '[data-actor="baby"]' },
    { tapEl: '[data-word="plane"]', paused: true },
  ],
  // 6-5 「塔台」: 飛機！ (the pigeons lift off the catwalk), Mocha into the crate, the searchlight turned
  // twice to the far end (he follows its pool), 哇！ the runway lights
  c6p5: [
    { wait: 'cuddling' },
    { tapEl: '[data-actor="baby"]' },
    { tapEl: '[data-word="plane"]', paused: true },
    { settle: 1500 },
    { readTalk: true },
    { tap: [176, 414] },
    { settle: 1500 },
    { tap: [190, 528] },
    { settle: 600 },
    { tap: [190, 528] },
    { settle: 2500 },
    { wait: 'reaching' },
    { tapEl: '[data-actor="baby"]' },
    { tapEl: '[data-word="wow"]', paused: true },
  ],
  // 6-6 「海關的印章」: 飛機！ (the pigeons fly out of the tray, he climbs in), 嗶！ (the scanner wakes),
  // two turns of the belt (through the X-ray tunnel: Mocha's line), Mocha onto the counter (he pushes
  // the 印章 off), the photo moment, 咔嚓, the grab
  c6p6: [
    { wait: 'reaching' },
    { tapEl: '[data-actor="baby"]' },
    { tapEl: '[data-word="plane"]', paused: true },
    { settle: 2500 },
    { readTalk: true },
    { wait: 'reaching' },
    { tapEl: '[data-actor="baby"]' },
    { tapEl: '[data-word="beep"]', paused: true },
    { settle: 1500 },
    { readTalk: true },
    { tap: [200, 520] },
    { settle: 1200 },
    { readTalk: true },
    { tap: [200, 520] },
    { settle: 2500 },
    { wait: 'reaching' },
    { tap: [334, 318] },
    { expect: '[data-photo-moment][data-photo-mocha]', timeout: 10_000 },
    { tapEl: '[data-shutter]', paused: true },
  ],
  // Chapter 7 「纜車上的月亮」 (#125). 7-1 「往動物園」: 廣播姊姊's line, Mocha down onto the plaza's
  // lamp post, 不要！ to the panda sign (he crawls to the top of the stairs), 抱抱 the keeper (he
  // carries him down), 飛機！ (the herons lift off the path)
  c7p1: [
    { readTalk: true },
    { wait: 'reaching' },
    { tap: [286, 380] },
    { settle: 1500 },
    { tapEl: '[data-actor="baby"]' },
    { tapEl: '[data-word="no"]', paused: true },
    { settle: 2500 },
    { readTalk: true },
    { wait: 'reaching' },
    { tapEl: '[data-actor="baby"]' },
    { tapEl: '[data-word="hug"]', paused: true },
    { settle: 2000 },
    { readTalk: true },
    { wait: 'reaching' },
    { tapEl: '[data-actor="baby"]' },
    { tapEl: '[data-word="plane"]', paused: true },
  ],
  // 7-2 「纜車站」: two turns of the bullwheel take the glass cabin (and him) up and bring the shop
  // cabin down, Mocha jumps in (the 店員小哥's cameo), two more turns dock it at the top: the 店員小哥
  // opens the turnstile
  c7p2: [
    { wait: 'reaching' },
    { tap: [236, 524] },
    { settle: 600 },
    { tap: [236, 524] },
    { settle: 2000 },
    { wait: 'reaching' },
    { tap: [150, 426] },
    { expect: '[data-subtitle]', timeout: 6_000 },
    { readTalk: true },
    { tap: [236, 524] },
    { settle: 600 },
    { tap: [236, 524] },
    { settle: 1200 },
    { readTalk: true },
  ],
  // 7-3 「茶園階梯」: Mocha up to the tea shed, 掰掰 the farmer (he climbs up the terrace; Baokaka
  // learns 爬樓梯: the beat and its card), then up the terraces to the bead
  c7p3: [
    { wait: 'cuddling' },
    { tap: [344, 340] },
    { settle: 1500 },
    { wait: 'reaching' },
    { tapEl: '[data-actor="baby"]' },
    { tapEl: '[data-word="bye"]', paused: true },
    { settle: 1200 },
    // The farmer's line, the learn beat and its card (on a small phone a tap on the beat may read the card away too)
    { readTalk: true },
    { tapEl: '[data-word-card]', paused: true, optional: true },
  ],
  // 7-4 「水晶車廂」: the right cloud aside (the 珍奶 draws him to the right end of the glass), 哇！ the
  // reading lamp (the bead on the rack), the seat tapped down
  c7p4: [
    { wait: 'watching' },
    { tap: [286, 528] },
    { settle: 2500 },
    { wait: 'reaching' },
    { tapEl: '[data-actor="baby"]' },
    { tapEl: '[data-word="wow"]', paused: true },
    { settle: 1200 },
    { readTalk: true },
    { tap: [330, 434] },
  ],
  // 7-5 「大茶壺」: the teapot set upright (the pool drains), Mocha across the dry cups to the tea tins,
  // the teapot tilted half way (he climbs across the cups), then pouring (his cup lifts him to the terrace)
  c7p5: [
    { wait: 'cuddling' },
    { tap: [204, 300] },
    { settle: 600 },
    { tap: [352, 352] },
    { settle: 1500 },
    { wait: 'reaching' },
    { tap: [204, 300] },
    { settle: 3000 },
    { wait: 'reaching' },
    { tap: [204, 300] },
  ],
  // 7-6 「菜園的芹菜」: Mocha into the bamboo basket, 不要！ to the moon in the barrel (he cries: 黑糖
  // wakes), 抱抱 the bear up the walls, Mocha onto the fence post (the gate opens), the photo moment,
  // 咔嚓, the grab
  c7p6: [
    { wait: 'reaching' },
    { tap: [118, 446] },
    { settle: 1500 },
    { tapEl: '[data-actor="baby"]' },
    { tapEl: '[data-word="no"]', paused: true },
    { settle: 3000 },
    { readTalk: true },
    { wait: 'reaching' },
    { tapEl: '[data-actor="baby"]' },
    { tapEl: '[data-word="hug"]', paused: true },
    { settle: 3000 },
    { readTalk: true },
    { wait: 'reaching' },
    { tap: [356, 334] },
    { expect: '[data-photo-moment][data-photo-mocha]', timeout: 10_000 },
    { tapEl: '[data-shutter]', paused: true },
  ],
  // Chapter 8 「熱呼呼的煙」 (#129). 8-1 「新北投支線」: 廣播姊姊's line, Mocha onto the far luggage
  // rack, 不要！ to the stained-glass window (he climbs down to the bucket), 抱抱 the 阿伯 (he lifts
  // him over it), and he climbs onto the far seat to the bead
  c8p1: [
    { readTalk: true },
    { wait: 'reaching' },
    { tap: [330, 374] },
    { settle: 1500 },
    { tapEl: '[data-actor="baby"]' },
    { tapEl: '[data-word="no"]', paused: true },
    { settle: 3000 },
    { readTalk: true },
    { wait: 'reaching' },
    { tapEl: '[data-actor="baby"]' },
    { tapEl: '[data-word="hug"]', paused: true },
    { settle: 1500 },
    { readTalk: true },
  ],
  // 8-2 「地熱谷」: the far vent off (its cloud sinks), Mocha onto its rock, the near vent on (he
  // crawls onto its cloud), the far vent back on (the steam lifts Mocha's cloud: he climbs across)
  c8p2: [
    { wait: 'cuddling' },
    { tap: [204, 530] },
    { settle: 600 },
    { tap: [278, 464] },
    { settle: 1500 },
    { wait: 'reaching' },
    { tap: [120, 530] },
    { settle: 1500 },
    { wait: 'reaching' },
    { tap: [204, 530] },
  ],
  // 8-3 「呼呼」: Mocha onto the rock past the steam (he crawls to its edge and learns 咻——: the
  // 阿嬤's line, the beat and its card), then 咻—— (the steam clears)
  c8p3: [
    { wait: 'cuddling' },
    { tap: [344, 406] },
    { settle: 1500 },
    { readTalk: true },
    { tapEl: '[data-word-card]', paused: true, optional: true },
    { wait: 'reaching' },
    { tapEl: '[data-actor="baby"]' },
    { tapEl: '[data-word="whoosh"]', paused: true },
  ],
  // 8-4 「北投圖書館」: Mocha onto the balcony rail (he climbs onto the book tray, facing the
  // pinwheel), the window open, 咻—— twice (the pinwheel turns the belt: up to the reading room)
  c8p4: [
    { wait: 'cuddling' },
    { tap: [40, 256] },
    { settle: 1500 },
    { tap: [48, 452] },
    { settle: 600 },
    { wait: 'reaching' },
    { tapEl: '[data-actor="baby"]' },
    { tapEl: '[data-word="whoosh"]', paused: true },
    { settle: 1200 },
    { readTalk: true },
    { wait: 'reaching' },
    { tapEl: '[data-actor="baby"]' },
    { tapEl: '[data-word="whoosh"]', paused: true },
  ],
  // 8-5 「大浴池」: the tap turned to drained (it wraps from full), Mocha across the dry stepping
  // stone to the shop counter (the 店員小哥's cameo), half full (the near tub comes: he climbs in),
  // full (it drifts out beside the far tub: he crawls across), then round to half full again by way
  // of drained (the far tub sinks with him and floats up by the far step)
  c8p5: [
    { wait: 'cuddling' },
    { tap: [72, 290] },
    { settle: 600 },
    { tap: [352, 376] },
    { expect: '[data-subtitle]', timeout: 6_000 },
    { readTalk: true },
    { wait: 'reaching' },
    { tap: [72, 290] },
    { settle: 2500 },
    { wait: 'reaching' },
    { tap: [72, 290] },
    { settle: 2500 },
    { wait: 'reaching' },
    { tap: [72, 290] },
    { settle: 2000 },
    { tap: [72, 290] },
  ],
  // 8-6 「澡堂的算盤」: the rods tapped into a staircase (bottom left, middle in the middle, top right:
  // he climbs), 咻—— the steam off the counter, Mocha onto the bell (the 番台's window opens), the
  // photo moment, 咔嚓, the grab
  c8p6: [
    { wait: 'reaching' },
    { tap: [124, 532] },
    { settle: 600 },
    { tap: [204, 532] },
    { settle: 600 },
    { tap: [284, 532] },
    { settle: 400 },
    { tap: [284, 532] },
    { settle: 3000 },
    { wait: 'reaching' },
    { tapEl: '[data-actor="baby"]' },
    { tapEl: '[data-word="whoosh"]', paused: true },
    { settle: 1200 },
    { readTalk: true },
    { tap: [340, 312] },
    { expect: '[data-photo-moment][data-photo-mocha]', timeout: 10_000 },
    { tapEl: '[data-shutter]', paused: true },
  ],
  // Chapter 9 「河的盡頭是海」 (#131). 9-1 「往淡水」: 廣播姊姊's line, Mocha along the racks to the
  // window seat (he climbs onto it, facing the blind), 咻—— (the blind up: the bead on the sill under
  // the sparrows), 飛機！ (they fly out), and he climbs onto the sill to the bead
  c9p1: [
    { readTalk: true },
    { wait: 'cuddling' },
    { tap: [270, 384] },
    { settle: 3000 },
    { wait: 'cuddling' },
    { tapEl: '[data-actor="baby"]' },
    { tapEl: '[data-word="whoosh"]', paused: true },
    { settle: 1500 },
    { readTalk: true },
    { wait: 'reaching' },
    { tapEl: '[data-actor="baby"]' },
    { tapEl: '[data-word="plane"]', paused: true },
    { settle: 1200 },
    { readTalk: true },
  ],
  // 9-2 「淡水老街」: Mocha onto the 鐵蛋 shop's signboard (he sets off and sees the 招財貓), the 阿給
  // shop's shutter down (he turns back to Mocha: the 背包客 in the way), 掰掰 (the 背包客's question),
  // the 鐵蛋 shop's shutter up (the bead on the counter), 抱抱 (the 阿婆 lifts him up)
  c9p2: [
    { wait: 'cuddling' },
    { tap: [262, 352] },
    { settle: 1500 },
    { wait: 'reaching' },
    { tap: [178, 328] },
    { settle: 1200 },
    { wait: 'reaching' },
    { tapEl: '[data-actor="baby"]' },
    { tapEl: '[data-word="bye"]', paused: true },
    { expect: '[data-subtitle]', timeout: 6_000 },
    { readTalk: true },
    { wait: 'cuddling' },
    { tap: [362, 368] },
    { settle: 800 },
    { wait: 'reaching' },
    { tapEl: '[data-actor="baby"]' },
    { tapEl: '[data-word="hug"]', paused: true },
    { settle: 1500 },
    { readTalk: true },
  ],
  // 9-3 「渡輪」: 嗶！ the pier's gate (he crawls aboard to the rope), Mocha onto the railing over him
  // (he stands: the learn beat and its card), then he cruises past the rope and takes the bead
  c9p3: [
    { wait: 'reaching' },
    { tapEl: '[data-actor="baby"]' },
    { tapEl: '[data-word="beep"]', paused: true },
    { settle: 2500 },
    { readTalk: true },
    { wait: 'reaching' },
    { tap: [258, 404] },
    { settle: 1500 },
    { readTalk: true },
    { tapEl: '[data-word-card]', paused: true, optional: true },
    { readTalk: true },
  ],
  // 9-4 「漁人碼頭」: the sun dial tapped round to dawn (by way of sunset: the empty dinghy drifts
  // across and back), Mocha over the stepping stone to the kiosk (the 店員小哥's cameo; he cruises
  // the railing to the boardwalk's end), noon (the dinghy comes: he climbs in), sunset (across)
  c9p4: [
    { wait: 'cuddling' },
    { tap: [112, 286] },
    { settle: 600 },
    { tap: [112, 286] },
    { settle: 600 },
    { tap: [340, 352] },
    { expect: '[data-subtitle]', timeout: 6_000 },
    { readTalk: true },
    { wait: 'reaching' },
    { tap: [112, 286] },
    { settle: 2500 },
    { wait: 'reaching' },
    { tap: [112, 286] },
  ],
  // 9-5 「淡江大橋」: 飛機！ (the gulls off the cables), Sol, Sol, La (the platform comes down), and
  // across on the tower's base the 咻咻 beat, each line holding the world; then on to the bead
  c9p5: [
    { wait: 'reaching' },
    { tapEl: '[data-actor="baby"]' },
    { tapEl: '[data-word="plane"]', paused: true },
    { settle: 1200 },
    { readTalk: true },
    { tap: [90, 278] },
    { settle: 500 },
    { tap: [90, 278] },
    { settle: 500 },
    { tap: [162, 244] },
    { expect: '[data-subtitle], [data-narration]', timeout: 8_000 },
    { readTalk: true },
  ],
  // 9-6 「碼頭的聽診器」: Mocha into the net basket (he crawls in after him, facing the sail), 咻——
  // twice (onto the deck), Mocha onto the wheelhouse, 飛機！ (the gulls off the rail), the photo
  // moment, 咔嚓, the grab
  c9p6: [
    { wait: 'cuddling' },
    { tap: [196, 420] },
    { settle: 2500 },
    { wait: 'cuddling' },
    { tapEl: '[data-actor="baby"]' },
    { tapEl: '[data-word="whoosh"]', paused: true },
    { settle: 1200 },
    { readTalk: true },
    { tapEl: '[data-actor="baby"]' },
    { tapEl: '[data-word="whoosh"]', paused: true },
    { settle: 1500 },
    { readTalk: true },
    { tap: [366, 344] },
    { settle: 2000 },
    { wait: 'reaching' },
    { tapEl: '[data-actor="baby"]' },
    { tapEl: '[data-word="plane"]', paused: true },
    { expect: '[data-photo-moment][data-photo-mocha]', timeout: 10_000 },
    { tapEl: '[data-shutter]', paused: true },
  ],
  // Chapter 10 「離天空最近的地方」 (#133). 10-1 「信義線」: 廣播姊姊's line, Mocha along the racks to the
  // front (he stops at the door between the cars), 嗶！ (it opens), 掰掰 (the sleeper's legs tucked
  // up), and under the front window 咻—— (the balloons up: 101 and 「ㄅㄚ！」), the bead off the sill
  c10p1: [
    { readTalk: true },
    { wait: 'cuddling' },
    { tap: [300, 372] },
    { settle: 1500 },
    { wait: 'reaching' },
    { tapEl: '[data-actor="baby"]' },
    { tapEl: '[data-word="beep"]', paused: true },
    { settle: 1500 },
    { readTalk: true },
    { wait: 'reaching' },
    { tapEl: '[data-actor="baby"]' },
    { tapEl: '[data-word="bye"]', paused: true },
    { settle: 1500 },
    { readTalk: true },
    { wait: 'cuddling' },
    { tapEl: '[data-actor="baby"]' },
    { tapEl: '[data-word="whoosh"]', paused: true },
    { expect: '[data-subtitle], [data-narration]', timeout: 6_000 },
    { readTalk: true },
  ],
  // 10-2 「37秒電梯」: Mocha into the car at 89F (it takes him down; Baokaka crawls in), a tap on Mocha
  // (up: the 37 seconds and the 店員小哥 at 89F), then 抱抱 (the 清潔阿伯 carries him to the window)
  c10p2: [
    { wait: 'reaching' },
    { tap: [236, 198] },
    { settle: 2500 },
    { wait: 'cuddling' },
    { tapEl: '[data-actor="mocha"]' },
    { expect: '[data-subtitle], [data-narration]', timeout: 6_000 },
    { readTalk: true },
    { wait: 'reaching' },
    { tapEl: '[data-actor="baby"]' },
    { tapEl: '[data-word="hug"]', paused: true },
    { settle: 1500 },
    { readTalk: true },
  ],
  // 10-3 「八節」: the crank tapped round twice (all three sections turn), Mocha onto the top rim, the
  // crank once (the bottom comes with it), Mocha onto the bottom rim, the crank once (the top comes
  // with it): the ledges in line, and he climbs to the bead
  c10p3: [
    { wait: 'reaching' },
    { tap: [66, 374] },
    { settle: 500 },
    { tap: [66, 374] },
    { settle: 500 },
    { tap: [344, 300] },
    { settle: 1500 },
    { tap: [66, 374] },
    { settle: 500 },
    { tap: [344, 420] },
    { settle: 1500 },
    { tap: [66, 374] },
  ],
  // 10-4 「阻尼球」: Mocha onto the sphere, then 咻—— four times: out with the cat, back to him (he
  // climbs on), the centre, out to the far side (he climbs off to the bead)
  c10p4: [
    { wait: 'reaching' },
    { tap: [218, 432] },
    { settle: 2000 },
    { tapEl: '[data-actor="baby"]' },
    { tapEl: '[data-word="whoosh"]', paused: true },
    { settle: 1200 },
    { readTalk: true },
    { tapEl: '[data-actor="baby"]' },
    { tapEl: '[data-word="whoosh"]', paused: true },
    { settle: 2500 },
    { readTalk: true },
    { wait: 'reaching' },
    { tapEl: '[data-actor="baby"]' },
    { tapEl: '[data-word="whoosh"]', paused: true },
    { settle: 1200 },
    { readTalk: true },
    { tapEl: '[data-actor="baby"]' },
    { tapEl: '[data-word="whoosh"]', paused: true },
  ],
  // 10-5 「咻咻的派對」: the party's lines, 不要！ to Mocha (he cries: the learn beat and 一起's card),
  // 一起 (Mocha hops down), the puddle tapped (Mocha walks through it for him; 咻咻 comes down), 抱抱
  c10p5: [
    { readTalk: true },
    { wait: 'cuddling' },
    { tapEl: '[data-actor="baby"]' },
    { tapEl: '[data-word="no"]', paused: true },
    { settle: 1200 },
    { readTalk: true },
    { expect: '[data-word-card], [data-subtitle], [data-narration]', timeout: 15_000 },
    { readTalk: true },
    { tapEl: '[data-word-card]', paused: true, optional: true },
    { readTalk: true },
    { tapEl: '[data-actor="baby"]' },
    { tapEl: '[data-word="together"]', paused: true },
    { settle: 1500 },
    { readTalk: true },
    { tap: [160, 486] },
    { settle: 2500 },
    { tapEl: '[data-actor="baby"]' },
    { tapEl: '[data-word="hug"]', paused: true },
    { settle: 1500 },
    { readTalk: true },
  ],
  // 10-6 「離天空最近的地方」: to the rail's end, 一起, the deck's far side tapped (Mocha waits there;
  // the first steps, each line holding the world), 抱抱 (咻咻 lets go of the 金鎖片), the photo
  // moment, 咔嚓, the grab
  c10p6: [
    { wait: 'reaching' },
    { tapEl: '[data-actor="baby"]' },
    { tapEl: '[data-word="together"]', paused: true },
    { settle: 1500 },
    { readTalk: true },
    { tap: [298, 480] },
    { expect: '[data-subtitle], [data-narration]', timeout: 8_000 },
    { readTalk: true },
    { settle: 1500 },
    { readTalk: true },
    { settle: 1500 },
    { readTalk: true },
    { settle: 1500 },
    { readTalk: true },
    // The photo of the first steps: Mocha beside him, 咻咻 and the 金鎖片 in the frame (three held steps first)
    { expect: '[data-photo-moment][data-photo-mocha]', timeout: 20_000 },
    { tapEl: '[data-shutter]', paused: true },
    { settle: 1500 },
    { readTalk: true },
    { settle: 1500 },
    { readTalk: true },
    { settle: 1500 },
    { readTalk: true },
    { tapEl: '[data-actor="baby"]' },
    { tapEl: '[data-word="hug"]', paused: true },
    // 咻咻 lets go: its lines hold the world until read, then he picks up the 金鎖片
    { expect: '[data-subtitle], [data-narration]', timeout: 6_000 },
    { readTalk: true },
  ],
  // A tap anywhere reads the lines on (#183): 1-1's opening announcements, cleared by a tap on the
  // sway tab — which must not move it — then the map's punchline cleared by a tap on empty floor
  'talk-anywhere-c1p1': [
    { expect: '[data-subtitle]' },
    { tap: [150, 610] },
    { settle: 400 },
    { absent: '[data-subtitle]' },
    { expect: 'svg[data-page][data-parts*="sway=level"]' },
    { wait: 'reaching' },
    { tap: [286, 280] },
    { expect: '[data-subtitle]', timeout: 6_000 },
    { tap: [40, 520] },
    { settle: 400 },
    { tap: [40, 520] },
    { settle: 400 },
    { absent: '[data-subtitle]' },
  ],
  // 0-4 in the other order (#183, the AI playtest's order trap): the curtain first shows a dark
  // train and no bead; hide Mocha, he cries, the train lights and he crawls out
  'c0p4-curtain-first': [
    { wait: 'cuddling' },
    { tap: [300, 263] },
    { settle: 1500 },
    { absent: '[data-attractor="bead"]' },
    { wait: 'cuddling' },
    { tap: [34, 414] },
    // He cries (the curtain is open, so the lit train's bead sets him off at once): 廣播姊姊 announces it
    { expect: '[data-subtitle]', timeout: 9_000 },
    { readTalk: true },
  ],
  // 1-5 (#183): a tap on the counter's paw from B1 — Mocha can't get there: his 「喵？」
  'nope-c1p5': [
    { wait: 'reaching' },
    { tap: [244, 242] },
    { settle: 2500 },
    { wait: 'reaching' },
    { tap: [330, 220] },
    { expect: '[data-bark-kind="nope"]' },
    { tapEl: '[data-actor="mocha"]' },
  ],
  // 1-5's first-play nudge (#183): the car down, Mocha taps his paw on the panel and shimmers once
  'tutorial-c1p5': [
    { wait: 'reaching' },
    { tap: [244, 242] },
    { settle: 2500 },
    { wait: 'reaching' },
    { expect: '[data-hint-halo="nudge"]', timeout: 9_000 },
    { tapEl: '[data-actor="mocha"]' },
  ],
  // The hint ladder (#100, GDD § 2.7) on 1-2: 提示 shows where (the halo), then how (the ghost hand),
  // then "show me" plays the solver's next step for real — pressed again and again, it finishes the page
  // The M2 toy pages (#112), live from their PageLab fixtures: learn 不要！ from the goose and refuse the moon decoy
  'm2-moon-no': [
    { wait: 'reaching' },
    // Mocha to the rock: the goose honks and he learns 不要！ (the learn beat, then its card)
    { tap: [330, 350] },
    { tapEl: '[data-subtitle]' },
    { tapEl: '[data-word-card]', paused: true },
    { wait: 'reaching' },
    { tapEl: '[data-actor="baby"]' },
    { tapEl: '[data-word="no"]', paused: true },
  ],
  // Herded down, the squirrel sits on the bead: 掰掰 makes it drop the bead
  'm2-squirrel-bye': [
    { wait: 'reaching' },
    { tapEl: '[data-actor="baby"]' },
    { tapEl: '[data-word="bye"]', paused: true },
  ],
  'hints-c1p2': [
    { wait: 'reaching' },
    { tapEl: '[data-bar="hint"]' },
    { expect: '[data-hint-halo]' },
    // The answer came from the worker's solver, not the fallback
    { expect: '[data-hint-source="solver"]' },
    { tapEl: '[data-bar="hint"]' },
    { expect: '[data-hint-hand]' },
    { showMe: 30 },
  ],
  // Stickers (#101, GDD § 2.8) on 1-2 in the game shell: 淘氣 for riding back and forth twice, the
  // 土地公 behind the flipped board, then the solve and the sticker card with all three
  'stickers-c1p2': [
    { wait: 'reaching' },
    { drag: [[80, 610], [142, 610]] },
    { settle: 1500 },
    { drag: [[140, 610], [76, 610]] },
    { settle: 700 },
    { drag: [[80, 610], [142, 610]] },
    { settle: 700 },
    { drag: [[140, 610], [76, 610]] },
    { settle: 700 },
    { drag: [[80, 610], [142, 610]] },
    { expect: '[data-sticker-pop="mischief"]' },
    { expect: '[data-sticker="淘氣"][data-earned]' },
    { tap: [140, 72] },
    { settle: 900 },
    { tap: [236, 98] },
    { expect: '[data-sticker-pop="tudigong"]' },
    { expect: '[data-sticker="土地公"][data-earned]' },
    { expect: '[data-subtitle]' },
    { settle: 800 },
    // His 「呵呵，囡仔，慢慢仔來。」 is up: a tap reads it away first (#183)
    { readTalk: true },
    { tap: [280, 234] },
    { settle: 2500 },
    { drag: [[140, 610], [205, 610]] },
    { expect: 'svg[data-page][data-done]', timeout: 20_000 },
    { expect: '[data-sticker-card="111"]', timeout: 5_000 },
    // The card, then the page turns on to 1-3 (#107)
    { expect: '[data-popup-page="c1p3"]', timeout: 8_000 },
  ],
  // The prologue's chapter card (#102, GDD § 2.13 / § 5.2 P) in the game shell, from a fresh save:
  // 「開始」 drops the card over the book on the quilt, its lines play a tap a beat (the world held),
  // then the card lifts, the camera comes in and 0-1 opens on the rest of the prologue
  'prologue-card': [
    { fresh: true },
    { tapEl: '[data-button="start"]' },
    { expect: '[data-chapter-board="0"]' },
    // Sound (#105): the board thunks as it drops and rattles its split-flap row
    { heard: ['cardDrop', 'flaps'] },
    { expect: '[data-card-talk="1"] [data-card-line="nar"]', timeout: 6_000 },
    { absent: '[data-subtitle], [data-narration]' },
    { tapEl: '[data-card-next]' },
    { expect: '[data-card-talk="2"] [data-card-line="grandma"]' },
    { tapEl: '[data-card-next]' },
    { expect: '[data-popup-page="c0p1"] [data-narration]', timeout: 6_000 },
    { absent: '[data-chapter-board]' },
    // … swishes away, and the pop-ups land with a fwump
    { heard: ['cardLift', 'fwump'] },
  ],
  // The chapter spread (#103, #107, GDD § 2.9) in the game shell: 1-6 played up to Mocha on the
  // awning (in the frame) — 2 edges from the 雞腿 the world holds under the camera; 咔嚓, the grab, the
  // album with its four notes; 再拍一次, 咔嚓 again, the first shot chosen back, 放進相簿; then the
  // chapter's end — its lines a tap a beat, the tray's first coin, the sticker card, chapter 2's card
  // with 「未完待續」 and its line — and the 目錄
  'photo-spread': [
    { wait: 'cuddling' },
    { tap: [322, 456] },
    { wait: 'reaching' },
    { tapEl: '[data-actor="baby"]' },
    { tapEl: '[data-word="beep"]', paused: true },
    { settle: 1500 },
    { drag: [[304, 604], [260, 604]] },
    { settle: 1200 },
    // Mocha's translation of 嗶！ is still up: a tap reads it away first (#183; the drag played under it)
    { readTalk: true },
    { tap: [270, 386] },
    { expect: '[data-photo-moment][data-photo-mocha]', timeout: 10_000 },
    { tapEl: '[data-shutter]', paused: true },
    { expect: '[data-screen="album"] [data-album-note="mocha"]', timeout: 10_000 },
    { expect: '[data-album-note="grandma"]', absent: '[data-album-choice]' },
    { tapEl: '[data-button="retake"]' },
    { expect: '[data-photo-moment]' },
    { tapEl: '[data-shutter]' },
    { expect: '[data-album-choice="1"][data-chosen]', timeout: 5_000 },
    { tapEl: '[data-album-choice="0"]' },
    { expect: '[data-album-choice="0"][data-chosen]' },
    { tapEl: '[data-button="keep"]' },
    { expect: '[data-end-layer] [data-card-line="nar"]', timeout: 5_000 },
    { expect: '[data-slot="hud"] [data-tray="0"]', absent: '[data-sticker-card]' },
    { tapEl: '[data-end-next]' },
    { expect: '[data-end-layer] [data-card-line="mocha"]' },
    { tapEl: '[data-end-next]' },
    { expect: '[data-tray-fill="1"]', timeout: 3_000 },
    { heard: ['dropCoin'] },
    { expect: '[data-sticker-card]', timeout: 5_000 },
    // Chapter 2 is built (#114): its card, 廣播姊姊 first, then 2-1 opens
    { expect: '[data-chapter-board="2"]', absent: '[data-card-soon]', timeout: 8_000 },
    { expect: '[data-card-talk] [data-card-line="pa"]', timeout: 6_000 },
    { tapEl: '[data-card-next]' },
  ],
  // Chapter 2's spread (#114) in the game shell: 2-6 played up to 掰掰 with Mocha on the parasol (in
  // the frame); 咔嚓, the album, 放進相簿, the end lines, the tray's second coin, the sticker card,
  // chapter 3's card with 「未完待續」, the 目錄
  'photo-spread-c2': [
    { wait: 'reaching' },
    { tap: [148, 472] },
    { tap: [224, 290] },
    { settle: 1200 },
    { tap: [300, 314] },
    { settle: 1500 },
    { wait: 'reaching' },
    { tapEl: '[data-actor="baby"]' },
    { tapEl: '[data-word="bye"]', paused: true },
    { expect: '[data-photo-moment][data-photo-mocha]', timeout: 10_000 },
    { tapEl: '[data-shutter]', paused: true },
    { expect: '[data-screen="album"] [data-album-note="mocha"]', timeout: 10_000 },
    { tapEl: '[data-button="keep"]' },
    // Chapter 2's two end lines are one beat
    { expect: '[data-end-layer] [data-card-line="nar"] ~ [data-card-line="mocha"]', timeout: 5_000 },
    { tapEl: '[data-end-next]' },
    { expect: '[data-tray-fill="2"]', timeout: 3_000 },
    { expect: '[data-sticker-card]', timeout: 5_000 },
    // Chapter 3 is built (#116): its card, 廣播姊姊 first, then 3-1 opens
    { expect: '[data-chapter-board="3"]', absent: '[data-card-soon]', timeout: 8_000 },
    { expect: '[data-card-talk] [data-card-line="pa"]', timeout: 6_000 },
    { tapEl: '[data-card-next]' },
  ],
  // Chapter 3's spread (#116) in the game shell: 3-6 played up to Mocha beside 藍教授 (in the frame);
  // 咔嚓, the album, 放進相簿, the end line, the tray's third coin, the sticker card, chapter 4's card
  // with 「未完待續」, the 目錄
  'photo-spread-c3': [
    { wait: 'reaching' },
    { tap: [294, 476] },
    { tapEl: '[data-actor="baby"]' },
    { tapEl: '[data-word="no"]', paused: true },
    { settle: 2500 },
    { readTalk: true },
    { wait: 'reaching' },
    { tap: [226, 412] },
    { settle: 800 },
    { tap: [296, 376] },
    { expect: '[data-photo-moment][data-photo-mocha]', timeout: 10_000 },
    { tapEl: '[data-shutter]', paused: true },
    { expect: '[data-screen="album"] [data-album-note="mocha"]', timeout: 10_000 },
    { tapEl: '[data-button="keep"]' },
    { expect: '[data-end-layer] [data-card-line="nar"]', timeout: 5_000 },
    { tapEl: '[data-end-next]' },
    { expect: '[data-tray-fill="3"]', timeout: 3_000 },
    { expect: '[data-sticker-card]', timeout: 5_000 },
    // Chapter 4 is built (#118): its card, 廣播姊姊 first, then 4-1 opens
    { expect: '[data-chapter-board="4"]', absent: '[data-card-soon]', timeout: 8_000 },
    { expect: '[data-card-talk] [data-card-line="pa"]', timeout: 6_000 },
    { tapEl: '[data-card-next]' },
  ],
  // Chapter 4's spread (#118) in the game shell: 4-6 played up to 哇！ with Mocha on the amp (in the
  // frame); 咔嚓, the album, 放進相簿, the end line, the tray's fourth coin, the sticker card, chapter
  // 5's card with 「未完待續」, the 目錄
  'photo-spread-c4': [
    { wait: 'cuddling' },
    { tap: [232, 366] },
    { settle: 1500 },
    { tap: [312, 370] },
    { settle: 1500 },
    { wait: 'reaching' },
    { tapEl: '[data-actor="baby"]' },
    { tapEl: '[data-word="no"]', paused: true },
    { settle: 2500 },
    { readTalk: true },
    { wait: 'reaching' },
    { tapEl: '[data-actor="baby"]' },
    { tapEl: '[data-word="wow"]', paused: true },
    { expect: '[data-photo-moment][data-photo-mocha]', timeout: 10_000 },
    { tapEl: '[data-shutter]', paused: true },
    { expect: '[data-screen="album"] [data-album-note="mocha"]', timeout: 10_000 },
    { tapEl: '[data-button="keep"]' },
    { expect: '[data-end-layer] [data-card-line="nar"]', timeout: 5_000 },
    { tapEl: '[data-end-next]' },
    { expect: '[data-tray-fill="4"]', timeout: 3_000 },
    { expect: '[data-sticker-card]', timeout: 5_000 },
    // Chapter 5 is built (#121): its card, 廣播姊姊 first, then 5-1 opens
    { expect: '[data-chapter-board="5"]', absent: '[data-card-soon]', timeout: 8_000 },
    { expect: '[data-card-talk] [data-card-line="pa"]', timeout: 6_000 },
    { tapEl: '[data-card-next]' },
  ],
  // Chapter 5's spread (#121) in the game shell: 5-6 played up to Mocha on the tray stack (in the
  // frame); 咔嚓, the album, 放進相簿, the two end lines (one beat), the tray's fifth coin, the sticker
  // card, chapter 6's card with 「未完待續」, the 目錄
  'photo-spread-c5': [
    { wait: 'reaching' },
    { tap: [54, 226] },
    { settle: 1200 },
    { tapEl: '[data-actor="baby"]' },
    { tapEl: '[data-word="no"]', paused: true },
    { settle: 3000 },
    { readTalk: true },
    { wait: 'reaching' },
    { tapEl: '[data-actor="baby"]' },
    { tapEl: '[data-word="hug"]', paused: true },
    { settle: 2500 },
    { readTalk: true },
    { wait: 'reaching' },
    { tap: [346, 204] },
    { expect: '[data-photo-moment][data-photo-mocha]', timeout: 10_000 },
    { tapEl: '[data-shutter]', paused: true },
    { expect: '[data-screen="album"] [data-album-note="mocha"]', timeout: 10_000 },
    { tapEl: '[data-button="keep"]' },
    { expect: '[data-end-layer] [data-card-line="nar"] ~ [data-card-line="mocha"]', timeout: 5_000 },
    { tapEl: '[data-end-next]' },
    { expect: '[data-tray-fill="5"]', timeout: 3_000 },
    { expect: '[data-sticker-card]', timeout: 5_000 },
    // Chapter 6 is built (#123): its card, 廣播姊姊 first, then 6-1 opens
    { expect: '[data-chapter-board="6"]', absent: '[data-card-soon]', timeout: 8_000 },
    { expect: '[data-card-talk] [data-card-line="pa"]', timeout: 6_000 },
    { tapEl: '[data-card-next]' },
  ],
  // Chapter 6's spread (#123) in the game shell: 6-6 played up to Mocha on the counter (in the frame);
  // 咔嚓, the album, 放進相簿, the end line, the tray's sixth coin, the sticker card, chapter 7's card
  // (since #125), into 7-1
  'photo-spread-c6': [
    { wait: 'reaching' },
    { tapEl: '[data-actor="baby"]' },
    { tapEl: '[data-word="plane"]', paused: true },
    { settle: 2500 },
    { readTalk: true },
    { wait: 'reaching' },
    { tapEl: '[data-actor="baby"]' },
    { tapEl: '[data-word="beep"]', paused: true },
    { settle: 1500 },
    { readTalk: true },
    { tap: [200, 520] },
    { settle: 1200 },
    { readTalk: true },
    { tap: [200, 520] },
    { settle: 2500 },
    { wait: 'reaching' },
    { tap: [334, 318] },
    { expect: '[data-photo-moment][data-photo-mocha]', timeout: 10_000 },
    { tapEl: '[data-shutter]', paused: true },
    { expect: '[data-screen="album"] [data-album-note="mocha"]', timeout: 10_000 },
    { tapEl: '[data-button="keep"]' },
    { expect: '[data-end-layer] [data-card-line="nar"]', timeout: 5_000 },
    { tapEl: '[data-end-next]' },
    { expect: '[data-tray-fill="6"]', timeout: 3_000 },
    { expect: '[data-sticker-card]', timeout: 5_000 },
    // Chapter 7 is built (#125): its card, 廣播姊姊 first, then 7-1 opens
    { expect: '[data-chapter-board="7"]', absent: '[data-card-soon]', timeout: 8_000 },
    { expect: '[data-card-talk] [data-card-line="pa"]', timeout: 6_000 },
    { tapEl: '[data-card-next]' },
  ],
  // Chapter 7's spread (#125) in the game shell: 7-6 played up to Mocha on the fence post (in the
  // frame); 咔嚓, the album, 放進相簿, the end line, the tray's seventh coin, the sticker card, chapter
  // 8's card (since #129), into 8-1
  'photo-spread-c7': [
    { wait: 'reaching' },
    { tap: [118, 446] },
    { settle: 1500 },
    { tapEl: '[data-actor="baby"]' },
    { tapEl: '[data-word="no"]', paused: true },
    { settle: 3000 },
    { readTalk: true },
    { wait: 'reaching' },
    { tapEl: '[data-actor="baby"]' },
    { tapEl: '[data-word="hug"]', paused: true },
    { settle: 3000 },
    { readTalk: true },
    { wait: 'reaching' },
    { tap: [356, 334] },
    { expect: '[data-photo-moment][data-photo-mocha]', timeout: 10_000 },
    { tapEl: '[data-shutter]', paused: true },
    { expect: '[data-screen="album"] [data-album-note="mocha"]', timeout: 10_000 },
    { tapEl: '[data-button="keep"]' },
    { expect: '[data-end-layer] [data-card-line="nar"]', timeout: 5_000 },
    { tapEl: '[data-end-next]' },
    { expect: '[data-tray-fill="7"]', timeout: 3_000 },
    { expect: '[data-sticker-card]', timeout: 5_000 },
    // Chapter 8 is built (#129): its card, 廣播姊姊 first, then 8-1 opens
    { expect: '[data-chapter-board="8"]', absent: '[data-card-soon]', timeout: 8_000 },
    { expect: '[data-card-talk] [data-card-line="pa"]', timeout: 6_000 },
    { tapEl: '[data-card-next]' },
  ],
  // Chapter 8's spread (#129) in the game shell: 8-6 played up to Mocha on the bell (in the frame);
  // 咔嚓, the album, 放進相簿, the end line, the tray's eighth coin, the sticker card, chapter 9's card
  // (since #131), into 9-1
  'photo-spread-c8': [
    { wait: 'reaching' },
    { tap: [124, 532] },
    { settle: 600 },
    { tap: [204, 532] },
    { settle: 600 },
    { tap: [284, 532] },
    { settle: 400 },
    { tap: [284, 532] },
    { settle: 3000 },
    { wait: 'reaching' },
    { tapEl: '[data-actor="baby"]' },
    { tapEl: '[data-word="whoosh"]', paused: true },
    { settle: 1200 },
    { readTalk: true },
    { tap: [340, 312] },
    { expect: '[data-photo-moment][data-photo-mocha]', timeout: 10_000 },
    { tapEl: '[data-shutter]', paused: true },
    { expect: '[data-screen="album"] [data-album-note="mocha"]', timeout: 10_000 },
    { tapEl: '[data-button="keep"]' },
    { expect: '[data-end-layer] [data-card-line="nar"]', timeout: 5_000 },
    { tapEl: '[data-end-next]' },
    { expect: '[data-tray-fill="8"]', timeout: 3_000 },
    { expect: '[data-sticker-card]', timeout: 5_000 },
    // Chapter 9 is built (#131): its card, 廣播姊姊 first, then 9-1 opens
    { expect: '[data-chapter-board="9"]', absent: '[data-card-soon]', timeout: 8_000 },
    { expect: '[data-card-talk] [data-card-line="pa"]', timeout: 6_000 },
    { tapEl: '[data-card-next]' },
  ],
  // Chapter 9's spread (#131) in the game shell: 9-6 played up to Mocha on the wheelhouse (in the
  // frame); 咔嚓, the album, 放進相簿, the end line, the tray's ninth coin, the sticker card, chapter
  // 10's card with 「未完待續」, the 目錄
  'photo-spread-c9': [
    { wait: 'cuddling' },
    { tap: [196, 420] },
    { settle: 2500 },
    { wait: 'cuddling' },
    { tapEl: '[data-actor="baby"]' },
    { tapEl: '[data-word="whoosh"]', paused: true },
    { settle: 1200 },
    { readTalk: true },
    { tapEl: '[data-actor="baby"]' },
    { tapEl: '[data-word="whoosh"]', paused: true },
    { settle: 1500 },
    { readTalk: true },
    { tap: [366, 344] },
    { settle: 2000 },
    { wait: 'reaching' },
    { tapEl: '[data-actor="baby"]' },
    { tapEl: '[data-word="plane"]', paused: true },
    { expect: '[data-photo-moment][data-photo-mocha]', timeout: 10_000 },
    { tapEl: '[data-shutter]', paused: true },
    { expect: '[data-screen="album"] [data-album-note="mocha"]', timeout: 10_000 },
    { tapEl: '[data-button="keep"]' },
    { expect: '[data-end-layer] [data-card-line="nar"]', timeout: 5_000 },
    { tapEl: '[data-end-next]' },
    { expect: '[data-tray-fill="9"]', timeout: 3_000 },
    { expect: '[data-sticker-card]', timeout: 5_000 },
    // Chapter 10 is built (#133): its card, 廣播姊姊 first, then 10-1 opens
    { expect: '[data-chapter-board="10"]', absent: '[data-card-soon]', timeout: 8_000 },
    { expect: '[data-card-talk] [data-card-line="pa"]', timeout: 6_000 },
    { tapEl: '[data-card-next]' },
  ],
  // Chapter 10's spread (#133) in the game shell: 10-6 played through the first steps (the photo moment
  // frames them, Mocha beside him; 咔嚓), the hug, the album, 放進相簿, the four end lines, the sticker
  // card, the 目錄 (no chapter after 10: page E is #135's; the tray's nine coins are full already)
  'photo-spread-c10': [
    { wait: 'reaching' },
    { tapEl: '[data-actor="baby"]' },
    { tapEl: '[data-word="together"]', paused: true },
    { settle: 1500 },
    { readTalk: true },
    { tap: [298, 480] },
    { expect: '[data-subtitle], [data-narration]', timeout: 8_000 },
    { readTalk: true },
    { settle: 1500 },
    { readTalk: true },
    { settle: 1500 },
    { readTalk: true },
    { settle: 1500 },
    { readTalk: true },
    // The photo of the first steps: Mocha beside him, 咻咻 and the 金鎖片 in the frame (three held steps first)
    { expect: '[data-photo-moment][data-photo-mocha]', timeout: 20_000 },
    { tapEl: '[data-shutter]', paused: true },
    { settle: 1500 },
    { readTalk: true },
    { settle: 1500 },
    { readTalk: true },
    { settle: 1500 },
    { readTalk: true },
    { tapEl: '[data-actor="baby"]' },
    { tapEl: '[data-word="hug"]', paused: true },
    { expect: '[data-subtitle], [data-narration]', timeout: 6_000 },
    { readTalk: true },
    { expect: '[data-screen="album"] [data-album-note="mocha"]', timeout: 10_000 },
    { tapEl: '[data-button="keep"]' },
    // 「一起。」「他說：『一起過生日。』」, then the sun and 廣播姊姊's 「本列車直達：寶咖咖的家。」
    { expect: '[data-end-layer] [data-card-line="baby"]', timeout: 5_000 },
    { tapEl: '[data-end-next]' },
    { expect: '[data-end-layer] [data-card-line="pa"]', timeout: 5_000 },
    { tapEl: '[data-end-next]' },
    // The 抓周 tray's nine coins are chapters 1–9's treasures (`treasuresFound`): the 金鎖片 adds none
    { expect: '[data-sticker-card]', absent: '[data-tray-fill]', timeout: 5_000 },
    // 05:30, home (#135): 阿嬤 up, Mocha asleep on the full tray — two beats — then page E's card and page E
    { expect: '[data-screen="dawn-scene"][data-screen-ready]', timeout: 8_000 },
    { tapEl: '[data-story-next]' },
    { tapEl: '[data-story-next]' },
  ],
  // 尾聲 in the shell (#135): page E — the cheers, Mocha to the sunny sill, he crawls past the
  // treasures (each line held), the photo moment, the tail; his first word and his second; the 抓周
  // photo into the album; the sticker card; the credits (skipped); the 土地公; the cover
  ending: [
    { readTalk: true },
    { tap: [300, 258] },
    { settle: 1200 },
    { readTalk: true },
    { expect: '[data-photo-moment]', timeout: 15_000 },
    { tapEl: '[data-shutter]', paused: true },
    { settle: 1500 },
    { readTalk: true },
    { settle: 1500 },
    { readTalk: true },
    { expect: '[data-end-layer] [data-card-line="baby"]', timeout: 8_000 },
    { tapEl: '[data-end-next]' },
    { tapEl: '[data-end-next]' },
    { tapEl: '[data-end-next]' },
    { tapEl: '[data-end-next]' },
    { tapEl: '[data-end-next]' },
    { expect: '[data-end-layer] [data-card-line="nar"]', timeout: 3_000 },
    { tapEl: '[data-end-next]' },
    { expect: '[data-screen="album"] [data-album-note="mocha"]', timeout: 10_000 },
    { expect: '[data-album-word="first"]' },
    { tapEl: '[data-button="keep"]' },
    { expect: '[data-sticker-card]', timeout: 5_000 },
    { expect: '[data-screen="credits"][data-screen-ready]', timeout: 10_000 },
    { tapEl: '[data-credits-next]' },
    { expect: '[data-credits-print]', timeout: 3_000 },
    { tapEl: '[data-button="skip"]' },
    { expect: '[data-screen="shrine-scene"][data-screen-ready]', timeout: 8_000 },
    { tapEl: '[data-story-next]' },
    { tapEl: '[data-story-next]' },
    { tapEl: '[data-story-next]' },
    { tapEl: '[data-story-next]' },
  ],
  // The bonus page 「象山的日出」 (#135): on the leaf, 咻—— (咻咻's breeze) twice blows it across the gully;
  // he crawls off and climbs to the bead
  c12p1: [
    { readTalk: true },
    { wait: 'reaching' },
    { tapEl: '[data-actor="baby"]' },
    { tapEl: '[data-word="whoosh"]', paused: true },
    { settle: 1200 },
    { readTalk: true },
    { tapEl: '[data-actor="baby"]' },
    { tapEl: '[data-word="whoosh"]', paused: true },
    { settle: 1200 },
    { readTalk: true },
  ],
  // The bonus page from the 目錄 (#135): every 土地公 found, the 「象山的日出」 postcard, its card, the page
  'bonus-open': [
    { tapEl: '[data-button="bonus"]' },
    { expect: '[data-panel="bonus"] [data-page-card="c12p1"]:not([disabled])', timeout: 3_000 },
    { tapEl: '[data-page-card="c12p1"]' },
    // 番外's card (象山 · 05:30), its two lines; then the page: 咻—— twice, the bead
    { expect: '[data-card-next]', timeout: 8_000 },
    { tapEl: '[data-card-next]' },
    { tapEl: '[data-card-next]', optional: true },
    { wait: 'reaching' },
    { tapEl: '[data-actor="baby"]' },
    { tapEl: '[data-word="whoosh"]', paused: true },
    { settle: 1200 },
    { readTalk: true },
    { tapEl: '[data-actor="baby"]' },
    { tapEl: '[data-word="whoosh"]', paused: true },
    // The 土地公 stamps the card: 「呵呵，囡仔，慢慢仔大。」, then 「台北走透透」; the sticker card; the 目錄 at the postcard
    { expect: '[data-end-layer] [data-card-line="uncle"]', timeout: 10_000 },
    { tapEl: '[data-end-next]' },
    { expect: '[data-sticker-card]', timeout: 5_000 },
  ],
  // Page E 「抓周」 (#135): trivially solvable — the cheers held, then with no input he crawls past the
  // treasures (爸爸's and 阿嬤's lines held) to Mocha on the sofa's arm: the photo moment, the tail
  c11p1: [
    { readTalk: true },
    { settle: 900 },
    { readTalk: true },
    { expect: '[data-photo-moment]', timeout: 15_000 },
    { tapEl: '[data-shutter]', paused: true },
    { settle: 1000 },
    { readTalk: true },
    { settle: 1000 },
    { readTalk: true },
    { settle: 1000 },
    { readTalk: true },
  ],
  // The whole album (#113, GDD § 2.9 album screen), live from the cover's 相簿 at chapter 2: the page
  // arrows turn a leaf at a time (3 with its photo, 4 a placeholder), a one-finger swipe across the
  // leaf turns it either way, a mostly vertical move does not; back to the cover, where ‹ stops
  'album-flip': [
    { expect: '[data-screen="album"][data-album-chapter="2"][data-album-photo="A+M"]' },
    { tapEl: '[data-button="next"]' },
    { expect: '[data-album-chapter="3"][data-album-photo="B"]' },
    { tapEl: '[data-button="next"]' },
    { expect: '[data-album-chapter="4"] [data-leaf-state="locked"] [data-locked-line]' },
    // The finger pulls the page to the right: the previous leaf; to the left: the next
    { swipe: [[90, 420], [300, 430]] },
    { expect: '[data-album-chapter="3"]' },
    { swipe: [[300, 420], [80, 410]] },
    { expect: '[data-album-chapter="4"]' },
    // Mostly down: the leaf's scroll, not a turn
    { swipe: [[200, 520], [240, 300]] },
    { settle: 500 },
    { expect: '[data-album-chapter="4"]' },
    { tapEl: '[data-button="prev"]' },
    { tapEl: '[data-button="prev"]' },
    { tapEl: '[data-button="prev"]' },
    { expect: '[data-album-chapter="1"]' },
    { tapEl: '[data-button="prev"]' },
    { expect: '[data-album-cover="plain"]', absent: '[data-button="prev"]:not([disabled])' },
  ],
};

/** Scenarios that end somewhere other than their page done (the shell moved on). */
const SCENARIO_ENDS = { 'album-flip': '[data-album-cover]', 'photo-spread': '[data-popup-page="c2p1"]', 'photo-spread-c2': '[data-popup-page="c3p1"]', 'photo-spread-c3': '[data-popup-page="c4p1"]', 'photo-spread-c4': '[data-popup-page="c5p1"]', 'photo-spread-c5': '[data-popup-page="c6p1"]', 'photo-spread-c6': '[data-popup-page="c7p1"]', 'photo-spread-c7': '[data-popup-page="c8p1"]', 'photo-spread-c8': '[data-popup-page="c9p1"]', 'photo-spread-c9': '[data-popup-page="c10p1"]', 'photo-spread-c10': '[data-popup-page="c11p1"]', ending: '[data-screen="cover"]', 'bonus-open': '[data-screen="contents"] [data-panel="bonus"] [data-page-card="c12p1"][data-solved]', 'stickers-c1p2': '[data-popup-page="c1p3"]', 'prologue-card': '[data-popup-page="c0p1"] [data-narration]' };
/** Scenarios that start on a screen other than a page (the cover). */
const SCENARIO_READY = { 'bonus-open': '[data-screen="contents"][data-screen-ready]', 'prologue-card': '[data-screen="cover"][data-screen-ready]', 'album-flip': '[data-screen="album"][data-screen-ready]' };

/** Scenarios that start somewhere other than `#/popup?page=<id>`: a PageLab stage, live. */
const SCENARIO_URLS = {
  'hints-c1p2': '#/popup?page=c1p2&speed=fast',
  'stickers-c1p2': '#/pagelab?fixture=page-hud',
  'photo-spread': '#/pagelab?fixture=spread-shell',
  'photo-spread-c2': '#/pagelab?fixture=spread-shell-c2',
  'photo-spread-c3': '#/pagelab?fixture=spread-shell-c3',
  'photo-spread-c4': '#/pagelab?fixture=spread-shell-c4',
  'photo-spread-c5': '#/pagelab?fixture=spread-shell-c5',
  'photo-spread-c6': '#/pagelab?fixture=spread-shell-c6',
  'photo-spread-c7': '#/pagelab?fixture=spread-shell-c7',
  'photo-spread-c8': '#/pagelab?fixture=spread-shell-c8',
  'photo-spread-c9': '#/pagelab?fixture=spread-shell-c9',
  'photo-spread-c10': '#/pagelab?fixture=spread-shell-c10',
  ending: '#/pagelab?fixture=page-e-shell',
  // A query of its own: a hash-only change from the scenario before would not reload the page
  'bonus-open': '?bonus#/pagelab?fixture=contents-bonus-open',
  'prologue-card': '#/',
  'album-flip': '#/pagelab?fixture=album-multi',
  'tutorial-c0p1': '#/popup?page=c0p1&tutorial=1',
  'tutorial-c0p2': '#/popup?page=c0p2&tutorial=1',
  'tutorial-c0p3': '#/popup?page=c0p3&tutorial=1',
  'talk-anywhere-c1p1': '#/popup?page=c1p1&speed=fast',
  'c0p4-curtain-first': '#/popup?page=c0p4&speed=fast',
  'nope-c1p5': '#/popup?page=c1p5&speed=fast',
  'tutorial-c1p5': '#/popup?page=c1p5&tutorial=1',
  'm2-moon-no': '#/pagelab?fixture=m2-moon-decoy',
  'm2-squirrel-bye': '#/pagelab?fixture=m2-squirrel-herded',
};

const VIEWPORTS = [
  { width: 390, height: 844 },
  { width: 375, height: 667 },
];

async function startServer() {
  const { createServer } = await import('vite');
  const server = await createServer({ root: ROOT, logLevel: 'warn', server: { port: 5174, strictPort: false } });
  await server.listen();
  const url = server.resolvedUrls?.local[0];
  if (!url) throw new Error('Vite dev server did not report a local URL');
  return { server, url };
}

/** Page units → client px, read off the page SVG's view box and its box on screen. */
async function mapper(page) {
  const m = await page.evaluate(() => {
    const svg = document.querySelector('svg[data-page]');
    const r = svg.getBoundingClientRect();
    const [x, y, w, h] = svg.getAttribute('viewBox').split(/\s+/).map(Number);
    return { left: r.left, top: r.top, sx: r.width / w, sy: r.height / h, x, y };
  });
  return ([u, v]) => [m.left + (u - m.x) * m.sx, m.top + (v - m.y) * m.sy];
}

/** A pointer driver: the mouse, or one finger through CDP touch events (Chromium makes pointer events of them). */
async function driver(page, kind) {
  if (kind === 'mouse') {
    return {
      async down([x, y]) { await page.mouse.move(x, y); await page.mouse.down(); },
      async move([x, y]) { await page.mouse.move(x, y); },
      async up() { await page.mouse.up(); },
    };
  }
  const cdp = await page.context().newCDPSession(page);
  let at = [0, 0];
  const send = (type, points) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints: points });
  return {
    async down(p) { at = p; await send('touchStart', [{ x: p[0], y: p[1], id: 1 }]); },
    async move(p) { at = p; await send('touchMove', [{ x: p[0], y: p[1], id: 1 }]); },
    async up() { await send('touchEnd', []); void at; },
  };
}

const tickOf = (page) => page.evaluate(() => Number(document.querySelector('svg[data-page]').getAttribute('data-tick')));

async function run(page, base, id, kind, viewport, shots) {
  await page.setViewportSize(viewport);
  // The dev build hands every sound the shell plays to this list (#105, `view/sound.ts`)
  await page.addInitScript(() => {
    window.__popupSounds = [];
  });
  await page.goto(`${base}${SCENARIO_URLS[id] ?? `#/popup?page=${id}&speed=fast`}`);
  await page.waitForSelector(SCENARIO_READY[id] ?? 'svg[data-page]');
  await page.evaluate(() => document.fonts.ready);
  const toClient = SCENARIO_READY[id] ? null : await mapper(page);
  const input = await driver(page, kind);
  let n = 0;
  const shot = async (label) => {
    if (!shots) return;
    await page.screenshot({ path: join(shots, `${id}-${kind}-${viewport.width}-${String(++n).padStart(2, '0')}-${label}.png`) });
  };
  await shot('start');
  let pauseChecked = false;
  for (const stepDef of SCENARIOS[id]) {
    if (stepDef.wait) {
      await page.waitForSelector(`[data-actor="baby"][data-mode="${stepDef.wait}"]`, { timeout: 10_000 });
    } else if (stepDef.settle) {
      await page.waitForTimeout(stepDef.settle);
    } else if (stepDef.tapEl) {
      // Tap an element where it is drawn (a character, a subtitle, an overlay button); an `optional`
      // one only if it is there (a word card a tap on its beat may already have read away)
      if (stepDef.optional && !(await page.waitForSelector(stepDef.tapEl, { timeout: 1_500 }).catch(() => null))) continue;
      const el = await page.waitForSelector(stepDef.tapEl, { timeout: 15_000 });
      await page.waitForTimeout(400);
      if (stepDef.paused) {
        // The word ring and the word card hold the world while they are up (GDD § 2.4)
        const before = await tickOf(page);
        await page.waitForTimeout(900);
        if ((await tickOf(page)) !== before) throw new Error(`the world ticked under ${stepDef.tapEl}`);
      }
      const box = await el.boundingBox();
      if (!box) throw new Error(`${stepDef.tapEl} has no box`);
      await input.down([box.x + box.width / 2, box.y + box.height / 2]);
      await page.waitForTimeout(60);
      await input.up();
      await shot('tap');
    } else if (stepDef.fresh) {
      // A first launch: no save
      await page.evaluate(() => localStorage.clear());
      await page.reload();
      await page.waitForSelector(SCENARIO_READY[id] ?? 'svg[data-page]');
      await page.evaluate(() => document.fonts.ready);
    } else if (stepDef.heard) {
      // These cues were played (in the shell: its SoundContext is live)
      await page
        .waitForFunction((cues) => cues.every((c) => window.__popupSounds.some((s) => s.cue === c)), stepDef.heard, { timeout: 5_000 })
        .catch(async () => {
          const got = await page.evaluate(() => window.__popupSounds.map((s) => s.cue ?? s.word ?? 'voice').join(' '));
          throw new Error(`expected the sounds ${stepDef.heard.join(', ')}; heard: ${got || 'nothing'}`);
        });
    } else if (stepDef.absent && !stepDef.expect) {
      if (await page.$(stepDef.absent)) throw new Error(`${stepDef.absent} should not be there`);
    } else if (stepDef.readTalk) {
      // Tap the subtitle beat on the page until none is left (a tap on a bubble or the strip is the next beat).
      // A line the world holds for can follow the one just read a tick later (page E's cheers, then 「……經過了書。」,
      // #135): a bubble back after the pause is read on too, a few times at most
      for (let pass = 0, i = 0; pass < 3; pass++) {
        for (; i < 8 * (pass + 1); i++) {
          const bubble = await page.$('[data-subtitle], [data-narration]');
          if (!bubble) break;
          await page.waitForTimeout(350);
          // On its words (a bubble's box also spans its spring)
          const el = (await bubble.$('text')) ?? bubble;
          const box = await el.boundingBox();
          if (!box) break;
          await input.down([box.x + box.width / 2, box.y + box.height / 2]);
          await page.waitForTimeout(60);
          await input.up();
        }
        await page.waitForTimeout(300);
        if (!(await page.$('[data-subtitle], [data-narration]'))) break;
      }
      if (await page.$('[data-subtitle], [data-narration]')) throw new Error('the page\'s lines did not clear');
      await shot('read');
    } else if (stepDef.showMe) {
      // 提示 at level 3, pressed until the page is done (each press: the hand, then the step played)
      const button = await page.waitForSelector('[data-bar="hint"]');
      for (let i = 0; i < stepDef.showMe && !(await page.$('svg[data-page][data-done]')); i++) {
        const box = await button.boundingBox();
        await input.down([box.x + box.width / 2, box.y + box.height / 2]);
        await page.waitForTimeout(60);
        await input.up();
        await page.waitForTimeout(1700);
      }
      if ((await page.getAttribute('[data-popup-page]', 'data-hint-level')) === null) throw new Error('no hint ladder on the page');
      await shot('show-me');
    } else if (stepDef.expect) {
      await page.waitForSelector(stepDef.expect, { timeout: stepDef.timeout ?? 5_000 });
      if (stepDef.absent && (await page.$(stepDef.absent))) throw new Error(`${stepDef.absent} should not be there`);
    } else if (stepDef.tap) {
      await input.down(toClient(stepDef.tap));
      await page.waitForTimeout(60);
      await input.up();
      await shot('tap');
    } else if (stepDef.swipe) {
      // A one-finger swipe in screen pixels (a screen, not a page: no world to hold)
      const [a, b] = stepDef.swipe;
      await page.waitForTimeout(350);
      await input.down(a);
      for (let i = 1; i <= 8; i++) {
        await input.move([a[0] + ((b[0] - a[0]) * i) / 8, a[1] + ((b[1] - a[1]) * i) / 8]);
        await page.waitForTimeout(16);
      }
      await input.up();
      await shot('swipe');
    } else if (stepDef.drag) {
      // Through every point in turn (a straight drag has two; a turn on a rim, an arc of them)
      const points = stepDef.drag;
      await input.down(toClient(points[0]));
      const per = Math.max(2, Math.round(12 / (points.length - 1)));
      for (let k = 1; k < points.length; k++) {
        const [a, b] = [points[k - 1], points[k]];
        for (let i = 1; i <= per; i++) {
          const t = i / per;
          await input.move(toClient([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]));
          await page.waitForTimeout(16);
        }
      }
      if (!pauseChecked) {
        // Touch pauses the world: no tick runs while the finger is down
        const before = await tickOf(page);
        await page.waitForTimeout(900);
        const after = await tickOf(page);
        if (after !== before) throw new Error(`the world ticked while a finger was down (${before} → ${after})`);
        const dragging = await page.$('[data-dragging]');
        if (!dragging) throw new Error('no part flagged data-dragging during a drag');
        pauseChecked = true;
      }
      await shot('drag');
      await input.up();
    }
  }
  await page.waitForSelector(SCENARIO_ENDS[id] ?? 'svg[data-page][data-done]', { timeout: 20_000 });
  await page.waitForTimeout(400);
  await shot('done');
}

async function main() {
  const { chromium } = await import('playwright');
  const started = args.url ? null : args.serve ? await startServer() : null;
  const base = args.url ?? started?.url ?? 'http://localhost:5173/baokaka-adventure/';
  if (args.shots) await mkdir(args.shots, { recursive: true });
  const browser = await chromium.launch();
  let failures = 0;
  try {
    // Every registered page needs a scenario (PageLab lists the registry)
    const index = await browser.newPage();
    const listed = await listPopupFixtures(index, base);
    await index.close();
    if (!listed) {
      failures++;
      console.log('FAIL could not read the page list at #/pagelab?section=fixtures (a dev server is needed)');
    } else {
      const missing = listed.pages.filter((id) => !SCENARIOS[id]);
      if (missing.length > 0) {
        failures++;
        console.log(`FAIL pages without a play scenario in SCENARIOS: ${missing.join(', ')}`);
      } else console.log(`ok   every registered page has a scenario (${listed.pages.join(', ')})`);
    }
    for (const kind of ['mouse', 'touch']) {
      for (const viewport of VIEWPORTS) {
        const context = await browser.newContext({ viewport, deviceScaleFactor: 2, hasTouch: kind === 'touch', isMobile: kind === 'touch' });
        for (const id of Object.keys(SCENARIOS).filter((k) => !args.only || args.only.split(',').includes(k))) {
          const page = await context.newPage();
          const errors = [];
          page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
          page.on('pageerror', (e) => errors.push(String(e)));
          const label = `${id} · ${kind} · ${viewport.width}×${viewport.height}`;
          try {
            await run(page, base, id, kind, viewport, args.shots);
            if (errors.length) throw new Error(`console errors: ${errors.join(' | ')}`);
            console.log(`ok   ${label}`);
          } catch (e) {
            failures++;
            console.log(`FAIL ${label}: ${e.message.split('\n')[0]}`);
          }
          await page.close();
        }
        await context.close();
      }
    }
  } finally {
    await browser.close();
    await started?.server.close();
  }
  process.exit(failures ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
