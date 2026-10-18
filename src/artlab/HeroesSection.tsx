import { useMemo, type CSSProperties, type ReactElement, type ReactNode } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { Baokaka, BAOKAKA_POSE_NAMES } from '../art/characters/baokaka/Baokaka';
import { BAOKAKA_EXPRS } from '../art/characters/baokaka/Head';
import { BAOKAKA_BONES, BAOKAKA_SKELETONS, type BaokakaPose } from '../art/characters/baokaka/skeleton';
import { MOCHA_EXPRS } from '../art/characters/mocha/Head';
import { Mocha, MOCHA_TAILS, type MochaProps } from '../art/characters/mocha/Mocha';
import { MOCHA_BONES, MOCHA_POSES, MOCHA_SKELETONS, type MochaPose } from '../art/characters/mocha/skeleton';
import { SkeletonOverlay } from '../art/Fig';
import { LINE, skyAt, STAGE, TILES } from '../art/palette';
import { LODS, SPRITE_BUDGETS, type Bones, type Lod, type Skeleton, type SpriteState } from '../art/sprite';
import { countElements, markupBytes } from '../art/spriteStats';

/**
 * The art lab's Heroes section (`#/artlab?section=heroes`, #16): 寶咖咖 and 摩卡貓 at the four LODs
 * on light, night and a chapter floor (大安's brick walk and the battle stage floor), their 48px
 * silhouettes and map sprites on night floors, every pose with its skeleton, every expression,
 * Mocha's tail moods, the rig states, and the § 8.2 budget per pose. `skeleton=1` overlays the
 * joints on the LOD rows too.
 */

const LOD_SIZE: Record<Lod, number> = { portrait: 300, battle: 180, map: 60, icon: 48 };

const NIGHT = skyAt('01:00');
const BG = {
  light: { background: LINE.parchment, color: LINE.ink },
  night: { background: `linear-gradient(180deg, ${NIGHT.top} 0%, ${NIGHT.mid} 70%, ${NIGHT.horizon} 100%)` },
  brick: { background: `repeating-linear-gradient(153deg, ${TILES.brickWalk.base} 0 14px, ${TILES.brickWalk.line} 14px 15px, ${TILES.brickWalk.alt} 15px 29px, ${TILES.brickWalk.line} 29px 30px)` },
  stage: { background: `linear-gradient(180deg, ${STAGE.paveTop} 0%, ${STAGE.paveMid} 55%, ${STAGE.paveBottom} 100%)` },
} satisfies Record<string, CSSProperties>;
type Bg = keyof typeof BG;
const FLOORS: readonly Bg[] = ['light', 'night', 'brick'];

const HEROES = {
  baokaka: {
    name: '寶咖咖',
    Art: Baokaka,
    poses: BAOKAKA_POSE_NAMES as readonly string[],
    exprs: BAOKAKA_EXPRS as readonly string[],
    skeleton: (pose: string) => BAOKAKA_SKELETONS[(pose === 'throw' ? 'sit' : pose === 'firstStep' ? 'stand' : pose) as BaokakaPose] as Skeleton,
    bones: BAOKAKA_BONES as Bones,
    map: 'crawl',
  },
  mocha: {
    name: '摩卡貓',
    Art: Mocha,
    poses: MOCHA_POSES as readonly string[],
    exprs: MOCHA_EXPRS as readonly string[],
    skeleton: (pose: string) => MOCHA_SKELETONS[pose as MochaPose] as Skeleton,
    bones: MOCHA_BONES as Bones,
    map: 'walk',
  },
} as const;
type HeroKey = keyof typeof HEROES;

/** Mocha with his own props (`tail`); the registry types sprites by the shared `SpriteProps`. */
const MochaArt: (props: MochaProps) => ReactElement | null = Mocha;

const STATES: readonly SpriteState[] = ['idle', 'attack', 'hurt', 'ko', 'victory', 'walk'];

const Row = ({ title, note, children }: { title: string; note?: string; children: ReactNode }) => (
  <section className="flex flex-col gap-2">
    <h3 className="font-serif text-heading text-gold-light">
      {title}
      {note && <span className="ml-2 font-body text-caption text-mutedOnDark">{note}</span>}
    </h3>
    {children}
  </section>
);

const Cell = ({ label, size, bg = 'night', data, children }: { label: string; size: number; bg?: Bg; data?: string; children: ReactNode }) => (
  <figure data-hero-cell={data} className="m-0 flex flex-col items-center gap-1 rounded-panel p-2" style={BG[bg]}>
    <div className="relative" style={{ width: size, height: size }}>
      {children}
    </div>
    <figcaption className="font-num text-[12px] font-semibold opacity-80">{label}</figcaption>
  </figure>
);

const Bones_ = ({ joints, bones }: { joints: Skeleton; bones: Bones }) => (
  <svg viewBox="0 0 200 200" className="pointer-events-none absolute inset-0 h-full w-full" aria-hidden="true">
    <SkeletonOverlay joints={joints} bones={bones} />
  </svg>
);

/** Black wherever the figure paints (its own markup as a CSS mask, no filter); the contact shadow's gradient doesn't resolve in the mask, so it drops out. */
const Silhouette = ({ art, size, color = '#000000' }: { art: ReactElement; size: number; color?: string }) => {
  const mask = useMemo(() => {
    // The first <svg> only: the map LOD stacks its walk frames, and the first is the standing pose
    const svg = /<svg[\s\S]*?<\/svg>/.exec(renderToStaticMarkup(art))?.[0] ?? '<svg></svg>';
    const markup = svg.replace('<svg ', `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" `);
    return `url("data:image/svg+xml,${encodeURIComponent(markup)}")`;
  }, [art, size]);
  return <div style={{ width: size, height: size, background: color, WebkitMaskImage: mask, maskImage: mask, WebkitMaskSize: '100% 100%', maskSize: '100% 100%' }} />;
};

const HeroBlock = ({ hero, skeleton }: { hero: HeroKey; skeleton: boolean }) => {
  const { name, Art, poses, exprs, map } = HEROES[hero];
  const sk = HEROES[hero];
  return (
    <section data-hero={hero} className="flex flex-col gap-4 rounded-xl border border-gold/30 p-3">
      <h2 className="font-serif text-title">{name}</h2>

      <Row title="Levels of detail" note="§ 8.3 · portrait 300 · battle 180 · map 60 · icon 48 · on parchment, night and 大安's brick walk">
        {FLOORS.map((bg) => (
          <div key={bg} className="flex flex-wrap items-end gap-2">
            {LODS.map((lod) => (
              <Cell key={lod} label={`${lod} · ${bg}`} size={LOD_SIZE[lod]} bg={bg} data={`${hero}-${lod}-${bg}`}>
                <Art lod={lod} />
                {skeleton && lod !== 'icon' && <Bones_ joints={sk.skeleton(lod === 'map' ? map : 'sit')} bones={sk.bones} />}
              </Cell>
            ))}
          </div>
        ))}
      </Row>

      <Row title="Silhouettes and the 48px map test" note="the map sprite at 48px on night floors; black silhouettes at 180 and 48">
        <div className="flex flex-wrap items-end gap-2">
          {(['night', 'brick', 'stage'] as const).map((bg) => (
            <Cell key={bg} label={`48 · ${bg}`} size={48} bg={bg}>
              <Art lod="map" />
            </Cell>
          ))}
          <Cell label="silhouette 180" size={180} bg="light">
            <Silhouette art={<Art lod="battle" />} size={180} />
          </Cell>
          <Cell label="silhouette map 48" size={48} bg="light">
            <Silhouette art={<Art lod="map" />} size={48} />
          </Cell>
          <Cell label="silhouette 48 on night" size={48} bg="night">
            <Silhouette art={<Art lod="map" />} size={48} color={LINE.inkOnDark} />
          </Cell>
        </div>
      </Row>

      <Row title="Poses" note="skeleton → volumes (§ 2.1); joints overlaid, battle LOD">
        <div className="flex flex-wrap items-end gap-2">
          {poses.map((pose) => (
            <Cell key={pose} label={pose} size={180} bg="light" data={`${hero}-pose-${pose}`}>
              <Art lod="battle" pose={pose} />
              <Bones_ joints={sk.skeleton(pose)} bones={sk.bones} />
            </Cell>
          ))}
        </div>
        <div className="flex flex-wrap items-end gap-2">
          {poses.map((pose) => (
            <Cell key={pose} label={pose} size={180} bg="stage" data={`${hero}-stage-${pose}`}>
              <Art lod="battle" pose={pose} />
            </Cell>
          ))}
        </div>
      </Row>

      <Row title="Expressions" note="Head swaps eyes, brows and mouth (§ 2.5) · portrait head crop and battle">
        <div className="flex flex-wrap items-end gap-2">
          {exprs.map((expr) => (
            <Cell key={expr} label={expr} size={140} bg="light" data={`${hero}-expr-${expr}`}>
              <Art lod="icon" expr={expr} />
            </Cell>
          ))}
          {exprs.map((expr) => (
            <Cell key={`b${expr}`} label={expr} size={140} bg="night">
              <Art lod="battle" expr={expr} />
            </Cell>
          ))}
        </div>
      </Row>

      {hero === 'mocha' && (
        <Row title="Tail acting" note="up = happy · puff = surprised · flick = annoyed · wrap = sitting">
          <div className="flex flex-wrap items-end gap-2">
            {MOCHA_TAILS.map((tail) => (
              <Cell key={tail} label={tail} size={140} bg="night">
                <MochaArt lod="battle" tail={tail} expr={tail === 'up' ? 'happy' : tail === 'puff' ? 'surprised' : tail === 'flick' ? 'smug' : 'content'} />
              </Cell>
            ))}
          </div>
        </Row>
      )}

      <Row title="States" note="rig.css § 7.9; attack plays each action pose (frozen with still=1)">
        <div className="flex flex-wrap items-end gap-2">
          {STATES.map((state) => (
            <Cell key={state} label={state} size={120} bg="stage">
              <Art lod={state === 'walk' ? 'map' : 'battle'} state={state} />
            </Cell>
          ))}
          {(hero === 'baokaka' ? ['throw', 'cry', 'clap', 'firstStep'] : ['pounce']).map((pose) => (
            <Cell key={pose} label={`attack · ${pose}`} size={120} bg="stage">
              <Art lod="battle" state="attack" pose={pose} />
            </Cell>
          ))}
        </div>
      </Row>

      <Row title="Budget" note={`§ 8.2 · hero ≤ ${SPRITE_BUDGETS.hero.elements} elements, ≤ ${SPRITE_BUDGETS.hero.bytes} bytes · per drawing (the map LOD stacks two walk frames)`}>
        <Budget hero={hero} />
      </Row>
    </section>
  );
};

const Budget = ({ hero }: { hero: HeroKey }) => {
  const { Art, poses } = HEROES[hero];
  const rows = poses.map((pose) => ({
    pose,
    cells: LODS.map((lod) => {
      const markup = renderToStaticMarkup(<Art lod={lod} pose={pose} />);
      // The map LOD stacks its two walk frames; the budget is per drawing
      const frames = Math.max(1, (markup.match(/<svg[\s>]/g) ?? []).length);
      return { lod, elements: Math.round(countElements(markup) / frames), bytes: markupBytes(markup) / frames };
    }),
  }));
  return (
    <table className="w-full max-w-[560px] border-collapse font-num text-[12px] text-inkOnDark">
      <thead>
        <tr className="text-left text-mutedOnDark">
          <th className="py-1 pr-2">pose</th>
          {LODS.map((lod) => (
            <th key={lod} className="py-1 pr-2">
              {lod}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.pose} data-budget={`${hero}-${row.pose}`} className="border-t border-gold/20">
            <td className="py-1 pr-2">{row.pose}</td>
            {row.cells.map((cell) => (
              <td key={cell.lod} className="py-1 pr-2">
                {cell.elements} · {(cell.bytes / 1000).toFixed(1)}K
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export const HeroesSection = ({ params }: { params: URLSearchParams }) => {
  const skeleton = params.get('skeleton') === '1';
  const only = params.get('only');
  const heroes = (Object.keys(HEROES) as HeroKey[]).filter((hero) => !only || only === hero);
  return (
    <section data-artlab-heroes className="flex flex-col gap-5 text-inkOnDark">
      <header className="flex flex-wrap items-center gap-2">
        <h2 className="mr-2 font-serif text-title">Heroes</h2>
        <a className="rounded-full bg-white/10 px-3 py-1 font-mono text-[13px] font-bold" href={`#/artlab?section=heroes${skeleton ? '' : '&skeleton=1'}`}>
          skeleton {skeleton ? 'off' : 'on'}
        </a>
      </header>
      {heroes.map((hero) => (
        <HeroBlock key={hero} hero={hero} skeleton={skeleton} />
      ))}
    </section>
  );
};
