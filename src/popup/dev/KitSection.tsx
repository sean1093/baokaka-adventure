import { useMemo } from 'react';
import { POPUP } from '../../art/palette';
import { useSvgIds } from '../../art/useSvgIds';
import { PART_PRESETS, PRESET_ART, kitCtx, presetSvg, swatchSheet, type PartArtOptions, type PartPreset } from '../art';
import proofD from '../../../docs/art/popup/proof-d-swatches.png?url';
import mochaSit from '../../../docs/art/v2/baked/mocha-sit@3x.webp?url';
import crawl from '../../../docs/art/v2/baked/poses/baokaka-crawl-0@3x.webp?url';

/**
 * PageLab `section=kit` (#139): proof D rebuilt from the TS kit port next to the artist's proof,
 * then every GDD part preset's default kit art in its idle state, with filters (the PageLab and
 * bake look) and without (what the game draws until baked bitmaps land, GDD § 3.9).
 */

/** A raw kit SVG string in an `<svg>` of the given size. */
function KitSvg({ svg, width, height, label }: { svg: string; width: number; height: number; label: string }) {
  // Scales down with its container (375-wide phones), never up
  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      style={{ width: '100%', maxWidth: width, height: 'auto' }}
      role="img"
      aria-label={label}
      className="block font-body"
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}

/** Extra states shown beside the idle look, where a single bitmap differs (flap open, light on…). */
const ALT_STATES: Partial<Record<PartPreset, PartArtOptions>> = {
  flap: { state: 'open', states: ['closed', 'open'] },
  gate: { state: 'open', states: ['closed', 'open'] },
  button: { state: 'down', states: ['up', 'down'] },
  light: { state: 'on', states: ['off', 'on'] },
};

/** The idle state of each preset (its first state; GDD § 2.1). */
const IDLE: Record<PartPreset, PartArtOptions> = {
  tab: { state: 'stop0', states: ['stop0', 'stop1', 'stop2'] },
  slider: { state: 'stop0', states: ['stop0', 'stop1', 'stop2'] },
  wheel: { state: '0', states: ['0', '1', '2', '3'] },
  flap: { state: 'closed', states: ['closed', 'open'] },
  section: { state: '0', states: ['0', '1', '2', '3'] },
  gate: { state: 'closed', states: ['closed', 'open'] },
  button: { state: 'up', states: ['up', 'down'] },
  lift: { state: 'floor0', states: ['floor0', 'floor1'] },
  loop: { state: '0', states: ['0', '1', '2', '3'], touchable: true },
  pushable: { state: 'onPerch', states: ['onPerch', 'falling', 'landed'] },
  light: { state: 'off', states: ['off', 'on'] },
  blowable: { state: '0', states: ['0', '1', '2'] },
  carrier: { state: 'idle', states: ['idle', 'carrying@0', 'done'] },
  prop: { state: 'a', states: ['a', 'b', 'c'] },
};

const CELL = { w: 178, h: 118 };

function PresetCell({ preset, filters, scope }: { preset: PartPreset; filters: boolean; scope: string }) {
  const art = PRESET_ART[preset];
  const { box } = art;
  const alt = ALT_STATES[preset];
  const draw = (opts: PartArtOptions, key: string) => presetSvg(kitCtx(`${scope}-${preset}-${key}`, { filters }), preset, opts);
  // Fit the drawing (and its alternate state, side by side) into the cell with a margin
  const pad = 10;
  const span = alt ? box.w * 2 + 16 : box.w;
  const scale = Math.min(1, (CELL.w - 2 * pad) / span, (CELL.h - 34 - 2 * pad) / box.h);
  const body = `<g transform="translate(${pad + ((CELL.w - 2 * pad) - span * scale) / 2} ${pad + 4}) scale(${scale.toFixed(3)})">`
    + `<g transform="translate(${-box.x} ${-box.y})">${draw(IDLE[preset], 'idle')}</g>`
    + (alt ? `<g transform="translate(${box.w + 16 - box.x} ${-box.y})">${draw(alt, 'alt')}</g>` : '')
    + `</g>`;
  return (
    <figure className="m-0 overflow-hidden rounded" style={{ background: POPUP.nightCardDeep }} data-kit-preset={preset} data-kit-filters={filters ? '1' : '0'}>
      <KitSvg svg={body} width={CELL.w} height={CELL.h - 30} label={`${preset} default art`} />
      <figcaption className="px-2 pb-2 text-caption" style={{ color: POPUP.chalk }}>
        {preset}
        {art.verb && art.touchable ? ` · ${art.verb}` : ''}
        {alt ? ` · ${IDLE[preset].state} / ${alt.state}` : ''}
      </figcaption>
    </figure>
  );
}

export function KitSection() {
  const id = useSvgIds('kit');
  const sheet = useMemo(() => swatchSheet(kitCtx(id('sheet'), { filters: true }), { mochaSit, crawl }), [id]);
  return (
    <div className="flex flex-col items-center gap-4" data-pagelab-kit>
      <section className="w-full max-w-[390px]" aria-label="TS kit swatch sheet" data-kit-sheet>
        <KitSvg svg={sheet} width={390} height={844} label="proof D rebuilt from the TS kit" />
      </section>
      <section className="w-full max-w-[390px] px-3" aria-label="part presets">
        <h2 className="font-serif text-heading">零件預設 · part presets</h2>
        <p className="text-caption" style={{ color: POPUP.inkSoft }}>
          Default kit art for every GDD § 2.1 preset, idle (and the one alternate state a bitmap needs).
        </p>
        <h3 className="mt-2 text-label">PageLab / bake (filters)</h3>
        <div className="mt-1 grid grid-cols-2 gap-2">
          {PART_PRESETS.map((preset) => (
            <PresetCell key={preset} preset={preset} filters scope={id('f')} />
          ))}
        </div>
        <h3 className="mt-3 text-label">In game until baked (no filters)</h3>
        <div className="mt-1 grid grid-cols-2 gap-2" data-kit-live>
          {PART_PRESETS.map((preset) => (
            <PresetCell key={preset} preset={preset} filters={false} scope={id('l')} />
          ))}
        </div>
      </section>
      <section className="w-full max-w-[390px] px-3 pb-6" aria-label="kit.js proof D">
        <h2 className="font-serif text-heading">kit.js proof D (reference)</h2>
        <img src={proofD} width={390} height={844} alt="proof D swatch sheet rendered from kit.js" className="mt-1 block h-auto w-full" />
      </section>
    </div>
  );
}
