import { useMemo, type ReactNode } from 'react';
import { SkyLayer } from '../art/sky/SkyLayer';
import { Ground } from '../art/tiles/Ground';
import { TILE_MATERIALS } from '../art/tiles/terrain';
import { ACTOR_SIZE, IsoMap, mapActors, type Actor } from '../quest/components/IsoMap';
import { HERO_SPRITE } from '../quest/components/PartyPanel';
import type { GameMap, Material } from '../quest/engine/types';
import { MAP_TIMES, TEST_MAP, swatchMap } from './testMap';

/**
 * The art lab's Map section (`#/artlab?section=map`, issue #13 § 9): the iso test map at three
 * clock times (sky, graded ground, lights, neon, ambient FX), the open sky across the night, and
 * every tile material at 00:00 / 03:00 / 05:15. Dev-only.
 */

/** The night strip for the sky: midnight to sunrise (§ 3.2). */
export const SKY_TIMES = ['00:00', '02:00', '04:00', '05:00', '05:29'] as const;

const MATERIALS = Object.keys(TILE_MATERIALS).filter((name): name is Material => name !== 'door');

const Group = ({ title, note, children }: { title: string; note?: string; children: ReactNode }) => (
  <section className="flex flex-col gap-2">
    <h3 className="font-serif text-heading text-gold-light">
      {title}
      {note && <span className="ml-2 font-body text-caption text-mutedOnDark">{note}</span>}
    </h3>
    {children}
  </section>
);

const VIEW = { w: 366, h: 430 };

/** The test map at one time, framed like the world screen: sky behind, the party on the zebra crossing. */
const TestScene = ({ time }: { time: string }) => {
  const map: GameMap = useMemo(() => ({ ...TEST_MAP, time }), [time]);
  const actors: Actor[] = [
    ...mapActors(map, [], () => undefined),
    { key: 'lead', sprite: HERO_SPRITE.baokaka, c: 3, r: 4, size: ACTOR_SIZE.hero, motion: 'none' },
    { key: 'mocha', sprite: HERO_SPRITE.mocha, c: 4, r: 5, size: ACTOR_SIZE.follower, motion: 'none', flip: true },
  ];
  return (
    <figure data-map-time={time} className="m-0 flex flex-col gap-1">
      <div className="relative overflow-hidden rounded-panel border border-gold/30" style={{ width: VIEW.w, height: VIEW.h }}>
        <SkyLayer time={time} width={VIEW.w} height={VIEW.h} shift={{ x: 0, y: 0 }} />
        <IsoMap map={map} flags={[]} actors={actors} camera={{ c: 4.5, r: 3.5 }} view={VIEW} />
      </div>
      <figcaption className="font-num text-label text-mutedOnDark">{time}</figcaption>
    </figure>
  );
};

/** One material as a 3×2 patch at one time, through the real ground renderer. */
const Swatch = ({ material, time }: { material: Material; time: string }) => {
  const map = useMemo(() => swatchMap(material), [material]);
  return (
    <div className="relative h-[86px] w-[116px] overflow-hidden rounded-panel bg-panel-solid">
      {/* The 3×2 patch's ground box is about 184×106 px around x = 18; shown at 60 % */}
      <div className="absolute" style={{ left: 47, top: 23, transform: 'scale(0.6)', transformOrigin: '0 0' }}>
        <Ground map={map} time={time} />
      </div>
    </div>
  );
};

export const MapSection = () => (
  <section data-artlab-map="" className="flex flex-col gap-5">
    <h2 className="text-heading font-extrabold">Map</h2>
    <Group title="Test map" note="10×8 · lamps, lantern, window, neon (flagged), moon glint · ripples + fireflies">
      <div className="flex flex-wrap gap-3">
        {MAP_TIMES.map((time) => (
          <TestScene key={time} time={time} />
        ))}
      </div>
    </Group>
    <Group title="Sky" note="SkyLayer from midnight to sunrise (§ 3.2)">
      <div className="flex flex-wrap gap-2">
        {SKY_TIMES.map((time) => (
          <figure key={time} data-sky-time={time} className="m-0 flex flex-col gap-1">
            <div className="relative h-[211px] w-[170px] overflow-hidden rounded-panel border border-gold/30">
              {/* A phone-sized sky shown at 50 %, so the skyline keeps its proportions */}
              <div className="absolute left-0 top-0 h-[422px] w-[340px] origin-top-left scale-50">
                <SkyLayer time={time} width={340} height={422} shift={{ x: 0, y: 0 }} />
              </div>
            </div>
            <figcaption className="font-num text-label text-mutedOnDark">{time}</figcaption>
          </figure>
        ))}
        <figure data-sky-time="room" className="m-0 flex flex-col gap-1">
          <div className="relative h-[211px] w-[170px] overflow-hidden rounded-panel border border-gold/30">
            <SkyLayer time="00:00" interior width={170} height={211} shift={{ x: 0, y: 0 }} />
          </div>
          <figcaption className="font-num text-label text-mutedOnDark">interior</figcaption>
        </figure>
      </div>
    </Group>
    <Group title="Materials" note={`${MATERIALS.length} materials at ${MAP_TIMES.join(' / ')} (§ 4.4)`}>
      <div className="grid gap-2" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(370px, 1fr))' }}>
        {MATERIALS.map((material) => (
          <div key={material} data-material={material} className="flex flex-col gap-1">
            <span className="font-mono text-[12px] font-bold">{material}</span>
            <div className="flex gap-1">
              {MAP_TIMES.map((time) => (
                <Swatch key={time} material={material} time={time} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </Group>
  </section>
);
