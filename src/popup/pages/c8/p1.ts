import { definePage } from '../../core/define';

/**
 * GDD § 4.4, page 8-1 「新北投支線」 (the 新北投 branch line's hot-spring car) · difficulty 3 · par 3.
 * The chapter's ride page: one stop on the little branch line, in its themed car — wooden benches,
 * a stained-glass window, a hot-spring mural. Three seats, each a 22-unit step up off the floor
 * (climbs: 爬樓梯 is his since 7-3): the left bench at the end of the car, the middle seat (the aisle
 * beside it is full of bath bags, so the way along the car goes up over it) and the far seat. Further
 * along a 泡湯阿伯 dozes on his feet by his big wooden bath bucket, which fills the aisle: too
 * tall for him (a grown-up's step: `cruise`).
 *
 * The stained-glass window over the middle seat glitters (a **decoy**): Baokaka climbs onto the seat
 * under it and reaches 「要！要！」. Mocha onto the far luggage rack, past the bucket: he is out of
 * reach there, so once Baokaka refuses the window (不要！) he climbs down to the bucket and reaches for
 * Mocha — never arriving, so the refusal holds. 抱抱: the 阿伯 wakes and lifts him over the bucket
 * (「嗯……要去泡湯喔？阿伯抱你過去。」). Past it the window is out of sight and the bead shines on the
 * far seat: he climbs up to it. The 淘氣: climb onto every seat — each seat's cushion keeps the dent he
 * leaves; the left bench takes a detour (不要！ to the window while Mocha is still on the rack over it).
 *
 * ```
 *   rack1 (Mocha, over the left bench) ─────────────jump───────────── rack2 (Mocha, past the bucket)
 *                    window (decoy, over the middle seat; seen from the near end)
 *   S1 (bench) ═climb═ F1 (start) ═climb═ S2 (seat) ═climb═ F2 ── F3 (the 阿伯) ═(bucket: cruise)═ F4 ═climb═ S3 (seat: bead)
 *   uncle: F3 → F4 (抱抱)
 * ```
 */
const FAR = ['F4', 'S3'];
const PAST_BUCKET = { any: FAR.map((id) => ({ babyAt: id })) };
const DENTED = (cushion: string) => ({ part: cushion, in: ['down'] });
/** A seat's cushion: it keeps his dent once he has climbed onto the seat (the 淘氣's memory). */
const cushion = (id: string, seat: string, x: number, y: number) => ({
  id, preset: 'button' as const, hit: { x: x - 28, y: y - 28, w: 56, h: 56 }, art: 'c8/seat-cushion',
  react: [{ on: { type: 'babyEnter' as const, id: seat }, to: 'down' }],
});

export default definePage({
  id: 'c8p1', chapter: 8, index: 1, title: '新北投支線', difficulty: 3, backdrop: 'c8/hot-spring-train',
  nodes: [
    // The car, left to right: the left bench, the floor, the middle seat, the floor up to the 阿伯 by the bucket
    { id: 'S1', x: 32, y: 464, height: 1 }, { id: 'F1', x: 84, y: 486, height: 0 },
    { id: 'S2', x: 136, y: 464, height: 1 }, { id: 'F2', x: 184, y: 486, height: 0 },
    { id: 'F3', x: 230, y: 486, height: 0 },
    // Past the bucket: the floor, and the far seat
    { id: 'F4', x: 296, y: 486, height: 0 }, { id: 'S3', x: 358, y: 464, height: 1 },
    // Unconnected: the stained-glass window over the middle seat
    { id: 'windowAt', x: 140, y: 350, height: 2 },
    // Mocha's perches: the luggage rack over the left bench, the far luggage rack
    { id: 'rack1Top', x: 44, y: 384, height: 2 }, { id: 'rack2Top', x: 330, y: 380, height: 2 },
  ],
  edges: [
    { a: 'S1', b: 'F1', kind: 'climb' }, { a: 'F1', b: 'S2', kind: 'climb' }, { a: 'S2', b: 'F2', kind: 'climb' },
    { a: 'F2', b: 'F3', kind: 'crawl' },
    // Over the 阿伯's wooden bath bucket: a grown-up's step
    { a: 'F3', b: 'F4', kind: 'cruise' },
    { a: 'F4', b: 'S3', kind: 'climb' },
    { a: 'rack1Top', b: 'rack2Top', kind: 'jump' },
  ],
  parts: [
    // The 泡湯阿伯 dozing by his bath bucket: 抱抱, and he lifts him over it
    { id: 'uncle', preset: 'carrier', route: ['F3', 'F4'], hit: { x: 202, y: 382, w: 56, h: 104 }, art: 'c8/bath-uncle' },
    // The seats' cushions: each keeps the dent he leaves
    cushion('cushion1', 'S1', 32, 466), cushion('cushion2', 'S2', 136, 466), cushion('cushion3', 'S3', 358, 466),
  ],
  perches: [
    { id: 'rack1', node: 'rack1Top', reachNode: 'S1' },
    // Past the bucket: from the near end he can only reach for him from the bucket
    { id: 'rack2', node: 'rack2Top', reachNode: 'S3' },
  ],
  creatures: [],
  attractors: [
    // The stained-glass window: a decoy, seen from the near end of the car only
    { id: 'window', kind: 'shiny', node: 'windowAt', decoy: true, art: 'c8/stained-glass', visibleWhen: { not: PAST_BUCKET } },
    // The bead on the far seat, seen past the bucket only
    { id: 'bead', kind: 'shiny', node: 'S3', goal: true, visibleWhen: PAST_BUCKET },
  ],
  baby: { start: 'F1', facing: 'l' },
  mocha: { start: 'rack1' },
  // Every seat's cushion dented
  mischief: { text: '每個座位都爬上去', when: { type: 'babyEnter', when: { all: [DENTED('cushion1'), DENTED('cushion2'), DENTED('cushion3')] } } },
  // On the far luggage rack, seen once Mocha jumps up beside him
  tudigong: { x: 296, y: 372, visibleWhen: { mochaAt: 'rack2' }, hat: '毛巾' },
  solution: [{ mocha: 'rack2' }, { wait: 'settle' }, { say: 'no' }, { wait: 'settle' }, { say: 'hug' }, { wait: 'goal' }],
  lines: {
    // 廣播姊姊's next ride line (§ 5.3, cycling on from 7-1's)
    intro: ['rec.pa.ride.3'],
    // The 阿伯 wakes to 抱抱 and lifts him over the bucket
    onEvent: [{ when: { type: 'partEnter', id: 'uncle', when: { part: 'uncle', in: ['carrying@0'] } }, line: 'c8p1.uncle.1' }],
  },
});
