import { useEffect, useMemo, useReducer, type CSSProperties, type ReactNode } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { C, skyAt } from '../art/palette';
import { SPRITES } from '../art/sprites';
import type { SpriteName } from '../art/types';
import { spriteMeta, type Lod } from '../art/sprite';
import { questReducer } from '../quest/engine/quest';
import { QuestScreens } from '../quest/QuestScreens';
import { hashParams } from '../shared/route';
import { ARTLAB_FIXTURES, type ArtLabFixture } from './fixtures';
import { FxSection } from './FxSection';
import { HeroesSection } from './HeroesSection';
import { MapSection } from './MapSection';
import { RigSection } from './RigSection';
import { StageSection } from './StageSection';
import { TokensSection } from './TokensSection';
import { UiKitSection } from './UiKitSection';
import './artlab.css';
// The characters only the dev tools print get their own font slice (#68, D-105)
import '../fonts/dev.css';

/**
 * The art lab, `#/artlab` (dev builds only; App never loads this chunk in production). A dev tool:
 * ugly but useful. Everything is driven by registries (SPRITES, ARTLAB_FIXTURES, the tables
 * below), so later issues add entries rather than code. URL parameters, all optional:
 *
 *   section  tokens | rig | heroes | ui | map | stage | fx | sprites | fixtures     (default: fixtures and sprites)
 *   only     comma list: sprite names, or one fixture name to show that screen alone
 *   bg       comma list of BACKGROUNDS keys  (default: all)
 *   size     comma list of pixel sizes       (default: SIZES)
 *   still=1  freeze animations for deterministic screenshots
 *
 * e.g. `#/artlab?section=sprites&bg=night&size=124&only=baokaka`
 */

/** Map, battle-small, battle and portrait sizes. */
export const SIZES: readonly number[] = [48, 64, 124, 300];

/** The LOD an option D sprite is drawn at for a cell size (§ 8.3); legacy sprites ignore it. */
export const lodForSize = (size: number): Lod => (size <= 50 ? 'icon' : size <= 90 ? 'map' : size <= 220 ? 'battle' : 'portrait');

/**
 * What a sprite is checked against: light (the old cream), the 01:00 night sky, and a busy warm
 * wall (a dev-only swatch, deliberately not a token).
 */
const NIGHT = skyAt('01:00');
const BACKGROUNDS = {
  light: { label: 'light', style: { background: C.cream, color: C.ink } },
  night: { label: 'night', style: { background: `linear-gradient(180deg, ${NIGHT.top} 0%, ${NIGHT.mid} 100%)`, color: C.cream } },
  brick: {
    label: 'brick',
    style: {
      // One 32px tile: two courses of brick, the second offset by half a brick
      background: `#9C4A32 url("data:image/svg+xml,${encodeURIComponent(
        '<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32"><path d="M0 1H32M0 17H32M1 0V16M17 16V32" stroke="#6E2F1F" stroke-width="2"/></svg>',
      )}")`,
      color: '#FFF7E8',
    },
  },
  silhouette: { label: 'silhouette', style: { background: '#FFFFFF' } },
} satisfies Record<string, { label: string; style: CSSProperties }>;

type Background = keyof typeof BACKGROUNDS;

const SPRITE_NAMES = Object.keys(SPRITES) as SpriteName[];

const list = (value: string | null): string[] => (value ? value.split(',').map((entry) => entry.trim()).filter(Boolean) : []);

/**
 * The sprite as a standalone SVG document, for use as a CSS mask. Cached: markup never changes.
 * Only the first `<svg>` is kept (a placeholder wraps it in a span with its label; an option D
 * sprite at the map LOD stacks its two walk frames, the first being the standing pose).
 */
const maskCache = new Map<string, string>();
function spriteMask(name: SpriteName, lod: Lod): string {
  const key = `${name}@${lod}`;
  let url = maskCache.get(key);
  if (!url) {
    const Art = SPRITES[name];
    const svg = /<svg[\s\S]*?<\/svg>/.exec(renderToStaticMarkup(<Art lod={lod} />))?.[0] ?? '<svg></svg>';
    const markup = svg.replace('<svg ', '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" ');
    url = `url("data:image/svg+xml,${encodeURIComponent(markup)}")`;
    maskCache.set(key, url);
  }
  return url;
}

/**
 * Black wherever the sprite paints anything: the shape as the eye reads it from across a room.
 * A black box masked by the sprite's own alpha, so no filter is involved.
 */
const Silhouette = ({ name, size }: { name: SpriteName; size: number }) => {
  const mask = spriteMask(name, lodForSize(size));
  return (
    <div
      style={{
        width: size,
        height: size,
        background: '#000000',
        WebkitMaskImage: mask,
        maskImage: mask,
        WebkitMaskSize: '100% 100%',
        maskSize: '100% 100%',
        WebkitMaskRepeat: 'no-repeat',
        maskRepeat: 'no-repeat',
      }}
    />
  );
};

const SpriteCard = ({ name, backgrounds, sizes }: { name: SpriteName; backgrounds: Background[]; sizes: number[] }) => {
  const Art = SPRITES[name];
  const meta = spriteMeta(Art);
  const tag = meta?.placeholder ? 'placeholder' : meta ? meta.kind : 'legacy';
  return (
    <section data-sprite={name} data-sprite-kind={tag} className="rounded-xl border border-gold/30 bg-panel-solid p-2 text-inkOnDark">
      <h3 className="mb-1 w-0 min-w-full truncate font-mono text-[13px] font-bold" title={`${name} (${tag})`}>{name}</h3>
      <div className="flex flex-col gap-1">
        {backgrounds.map((bg) => (
          <div key={bg} className="flex flex-wrap items-end gap-2 rounded-lg p-2" style={BACKGROUNDS[bg].style} title={bg}>
            {sizes.map((size) =>
              bg === 'silhouette' ? (
                <Silhouette key={size} name={name} size={size} />
              ) : (
                <div key={size} style={{ width: size, height: size }}>
                  <Art lod={lodForSize(size)} />
                </div>
              ),
            )}
          </div>
        ))}
      </div>
    </section>
  );
};

const Link = ({ href, children }: { href: string; children: ReactNode }) => (
  <a href={href} className="rounded-full bg-white/10 px-3 py-1 font-mono text-[13px] font-bold underline-offset-2 hover:underline">
    {children}
  </a>
);

const SpritesSection = ({ params }: { params: URLSearchParams }) => {
  const only = list(params.get('only'));
  const unknown = only.filter((name) => !(name in SPRITES));
  const names = only.length > 0 ? SPRITE_NAMES.filter((name) => only.includes(name)) : SPRITE_NAMES;
  const wantedBgs = list(params.get('bg'));
  const backgrounds = (Object.keys(BACKGROUNDS) as Background[]).filter((bg) => wantedBgs.length === 0 || wantedBgs.includes(bg));
  const wantedSizes = list(params.get('size'))
    .map(Number)
    .filter((size) => Number.isInteger(size) && size > 0 && size <= 1000);
  const sizes = wantedSizes.length > 0 ? wantedSizes : [...SIZES];

  return (
    <section className="flex flex-col gap-2">
      <h2 className="text-heading font-extrabold">
        Sprites <span className="text-caption text-mutedOnDark">({names.length} · {backgrounds.join(', ')} · {sizes.join('/')}px)</span>
      </h2>
      {unknown.length > 0 && <p className="font-mono text-[13px] font-bold text-hp-critTo">Unknown sprite: {unknown.join(', ')}</p>}
      <div className="flex flex-wrap items-start gap-2">
        {names.map((name) => (
          <SpriteCard key={name} name={name} backgrounds={backgrounds} sizes={sizes} />
        ))}
      </div>
    </section>
  );
};

const FixtureList = () => (
  <section className="flex flex-col gap-2">
    <h2 className="text-heading font-extrabold">Screens</h2>
    <ul className="flex flex-col gap-1">
      {ARTLAB_FIXTURES.map((fixture) => (
        <li key={fixture.name} data-fixture={fixture.name} className="flex flex-wrap items-center gap-2">
          <Link href={`#/artlab?section=fixtures&only=${fixture.name}`}>{fixture.name}</Link>
          <Link href={`#/artlab?section=fixtures&only=${fixture.name}&still=1`}>still</Link>
          <span className="text-caption text-mutedOnDark">{fixture.label}</span>
        </li>
      ))}
    </ul>
  </section>
);

/** One screen, alone and live: the real QuestScreens over the fixture's state and the real reducer. */
const FixtureView = ({ fixture }: { fixture: ArtLabFixture }) => {
  const [state, dispatch] = useReducer(questReducer, undefined, fixture.state);
  const screens = (
    <QuestScreens state={state} dispatch={dispatch} menuOpen={fixture.menu} followers={fixture.followers} travelHere={fixture.travelHere} battleFrame={fixture.battleFrame} />
  );
  // A phone-sized box: the small-phone layout whatever the viewport (the screen fills the box, not the window)
  if (fixture.phone)
    return (
      <div data-artlab-fixture={fixture.name} className="artlab-phone relative mx-auto overflow-hidden" style={{ width: fixture.phone.width, height: fixture.phone.height }}>
        {screens}
      </div>
    );
  return (
    <div data-artlab-fixture={fixture.name} style={{ display: 'contents' }}>
      {screens}
    </div>
  );
};

const ArtLab = ({ hash }: { hash: string }) => {
  const params = useMemo(() => hashParams(hash), [hash]);
  const still = params.get('still') === '1';
  const section = params.get('section');

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('artlab-still', still);
    return () => root.classList.remove('artlab-still');
  }, [still]);

  if (section === 'fixtures') {
    const only = list(params.get('only'));
    const fixture = only.length === 1 ? ARTLAB_FIXTURES.find((entry) => entry.name === only[0]) : undefined;
    // Keyed by name so switching fixtures restarts the reducer from the new state
    if (fixture) return <FixtureView key={fixture.name} fixture={fixture} />;
  }

  return (
    <main data-artlab="index" className="flex flex-col gap-4 p-3 text-inkOnDark">
      <header className="flex flex-wrap items-center gap-2">
        <h1 className="mr-2 font-serif text-title">Art lab</h1>
        <Link href="#/artlab">all</Link>
        <Link href="#/artlab?section=tokens">tokens</Link>
        <Link href="#/artlab?section=rig">rig</Link>
        <Link href="#/artlab?section=heroes">heroes</Link>
        <Link href="#/artlab?section=ui">ui kit</Link>
        <Link href="#/artlab?section=map">map</Link>
        <Link href="#/artlab?section=stage">stage</Link>
        <Link href="#/artlab?section=fx">fx</Link>
        <Link href="#/artlab?section=sprites">sprites</Link>
        <Link href="#/artlab?section=fixtures">screens</Link>
        {(Object.keys(BACKGROUNDS) as Background[]).map((bg) => (
          <Link key={bg} href={`#/artlab?section=sprites&bg=${bg}`}>
            {bg}
          </Link>
        ))}
        <Link href="#/">game</Link>
      </header>
      {section === 'tokens' && <TokensSection />}
      {section === 'rig' && <RigSection params={params} />}
      {section === 'heroes' && <HeroesSection params={params} />}
      {section === 'ui' && <UiKitSection />}
      {section === 'map' && <MapSection />}
      {section === 'stage' && <StageSection />}
      {section === 'fx' && <FxSection />}
      {(section === null || section === 'fixtures') && <FixtureList />}
      {(section === null || section === 'sprites') && <SpritesSection params={params} />}
    </main>
  );
};

export default ArtLab;
