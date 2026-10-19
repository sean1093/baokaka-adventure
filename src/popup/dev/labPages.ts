import type { Id, PageDef } from '../core/types';
import { PAGES, pageById } from '../pages';

/**
 * The pages PageLab lists: every registered page, then lab-only fixtures that are deliberately
 * wrong, so the solver panel's red paths (dead ends, loading one) can be tried on real data.
 * Fixtures never enter the registry, `pages.test.ts` or the game.
 */

const c1p2 = pageById('c1p2');

/**
 * 1-2 broken on purpose (#91's testing plan): the train tab locks for good once the pigeon has
 * flown while the train is still `out`. Sending Mocha to the pillar first is a dead end; moving the
 * train to `half` first still solves it.
 */
const brokenC1p2: PageDef[] =
  c1p2 === undefined
    ? []
    : [
        {
          ...c1p2,
          id: 'c1p2-broken',
          title: '月台的縫（壞）',
          parts: c1p2.parts.map((p) =>
            p.id === 'train' ? { ...p, lockedWhen: { all: [{ creature: 'pigeon', at: 'away' }, { part: 'train', in: ['out'] }] } } : p,
          ),
        },
      ];

const c0p1 = pageById('c0p1');

/**
 * Character states the registered M1 pages can't reach yet (#95's visual fixtures; #106 builds
 * the prologue pages that do: 0-3's push, 0-4's cry). Not broken, just borrowed stages:
 * - `lab-push`: 1-2 with a cup on the pillar perch (C3): sent there, Mocha makes eye contact with
 *   the camera for a tick, then pushes the cup down beside 寶咖咖's side of the gap.
 * - `lab-cry`: 0-1 with the bead hidden until the mobile spins: nothing to want, he looks, then
 *   cries (GDD § 2.2.5).
 * - `lab-lamp`: the same, with a night light on the mattress's far end: he crawls to it and
 *   watches it, swaying (0-2's TV, #141's watch-sway frames).
 * - `lab-box`: 1-2 with the bench as a box perch (C9, 0-4's laundry basket): Mocha shows only his
 *   head and paws over the rim (#141's in-box frame).
 */
const characterStages: PageDef[] = [
  ...(c1p2 === undefined
    ? []
    : [
        {
          ...c1p2,
          id: 'lab-push',
          title: '月台的杯子',
          parts: [
            ...c1p2.parts,
            { id: 'cup', preset: 'pushable' as const, fall: { path: [[306, 238], [306, 330], [300, 420]] as [number, number][], fallTo: 'R1' }, hit: { cx: 306, cy: 230, r: 18 }, art: 'lab/cup' },
          ],
          perches: c1p2.perches.map((p) => (p.id === 'pillar' ? { ...p, push: 'cup' } : p)),
        },
      ]),
  ...(c0p1 === undefined
    ? []
    : [
        {
          ...c0p1,
          id: 'lab-cry',
          title: '找不到',
          attractors: c0p1.attractors.map((a) => ({ ...a, visibleWhen: { part: 'mobile', in: ['spin'] } })),
          solution: [{ set: 'crib-rail', to: 'down' }, { tap: 'mobile' }, { wait: 'goal' as const }],
        },
        {
          ...c0p1,
          id: 'lab-lamp',
          title: '小夜燈',
          attractors: [
            ...c0p1.attractors.map((a) => ({ ...a, visibleWhen: { part: 'mobile', in: ['spin'] } })),
            { id: 'nightlight', kind: 'light' as const, node: 'crib2' },
          ],
          solution: [{ set: 'crib-rail', to: 'down' }, { tap: 'mobile' }, { wait: 'goal' as const }],
        },
      ]),
  ...(c1p2 === undefined
    ? []
    : [
        {
          ...c1p2,
          id: 'lab-box',
          title: '箱子裡的貓',
          perches: c1p2.perches.map((p) => (p.id === 'bench' ? { ...p, hidesMocha: true } : p)),
        },
      ]),
];

/** Lab-only fixture pages (not in the registry). */
export const LAB_FIXTURES: readonly PageDef[] = [...brokenC1p2, ...characterStages];

/** Every page the lab lists, registered pages first. */
export const LAB_PAGES: readonly PageDef[] = [...PAGES, ...LAB_FIXTURES];

/** A registered page or a lab fixture by id. */
export function labPageById(id: Id): PageDef | undefined {
  return pageById(id) ?? LAB_FIXTURES.find((p) => p.id === id);
}
