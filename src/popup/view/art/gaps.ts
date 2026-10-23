import type { PageDef } from '../../core/types';
import type { EnvManifest } from '../../env/manifest';
import { pageArt } from '../../env/report';
import { stageOf } from '../stage';
import { hasCarriageArt } from './carriages';
import { hasCreatureArt, isPlaceholder } from './registry';

/**
 * The release's art-gap gate (#138; supersedes the RPG's "placeholder warnings become errors" of
 * #58/#11/D-28): an art key a page names that would draw a stand-in instead of its own art.
 *
 * The payload report (`env/report.ts`) lists every key without a **bitmap**, which is wider than a
 * gap: some keys are drawn live on purpose —
 * - **pull tabs whose drawing is the kit's tab** (the seal, ridges and arrow are the affordance
 *   itself, bible § 4.2; #108 kept them live): `KIT_TABS`;
 * - **carriages** (the card a tab moves that Baokaka rides) drawn by `carriages.ts`; their tab is
 *   the kit's pull tab.
 *
 * Everything else without its own art is a gap: a backdrop on the placeholder stage, a part on its
 * preset's stand-in, a cut-out that draws nothing, a creature on the origami bird, a carriage on the
 * placeholder card. `env.test.ts` holds every registered page at zero, and `npm run art:report`
 * exits 1 on one.
 */
export const KIT_TABS: ReadonlySet<string> = new Set(['c0/crib-rail', 'c1/sway']);

export interface ArtGap {
  readonly page: string;
  readonly kind: 'backdrop' | 'part' | 'cutout' | 'creature' | 'carriage';
  readonly key: string;
}

/** The art gaps on one page (empty when every key it names draws its own art). */
export function artGaps(def: PageDef, m: EnvManifest): ArtGap[] {
  const gaps: ArtGap[] = [];
  const partKeys = new Set(def.parts.map((p) => p.art));
  const carriageKeys = new Set(stageOf(def).carriages.map((c) => def.parts.find((p) => p.id === c.part)?.art ?? ''));
  for (const key of pageArt(def, m).placeholders) {
    if (key === def.backdrop) gaps.push({ page: def.id, kind: 'backdrop', key });
    else if (partKeys.has(key)) {
      if (isPlaceholder(key) && !KIT_TABS.has(key) && !hasCarriageArt(key)) gaps.push({ page: def.id, kind: 'part', key });
    } else gaps.push({ page: def.id, kind: 'cutout', key });
  }
  for (const key of carriageKeys) {
    // A carriage drawn by its baked part needs no carriage drawing of its own
    if (!hasCarriageArt(key) && m.parts[key] === undefined) gaps.push({ page: def.id, kind: 'carriage', key });
  }
  for (const c of def.creatures) if (!hasCreatureArt(c.art)) gaps.push({ page: def.id, kind: 'creature', key: c.art });
  return gaps;
}
