import { useEffect, useState, type CSSProperties, type ReactNode } from 'react';
import { MIN_CONTRAST, TEXT_PAIRS, contrastRatio } from '../art/contrast';
import {
  EYES,
  LIGHTS,
  LINE,
  MATERIALS,
  MRT,
  RIM,
  UI,
  WORLD,
  characterGrade,
  gradeCharacter,
  gradeTokens,
  skyAt,
  worldGrade,
  type Sky,
} from '../art/palette';

/**
 * The art lab's Tokens section (`#/artlab?section=tokens`): every palette token as a swatch, the
 * night clock's sky at the § 3.2 times with the graded world and characters under each, the three
 * web fonts with their load state, and the UI text contrast table. Dev-only.
 */

/** The § 3.2 strip: the table's keys plus the midnight-to-sunrise beats engineers check by eye. */
export const SKY_STRIP = ['00:00', '01:00', '02:00', '03:00', '04:00', '04:30', '05:00', '05:15', '05:29'] as const;

/** The families § 7.1 loads, with the string the art lab checks each one against. */
export const FONT_CHECKS = [
  { family: 'Chiron GoRound TC', css: '21px "Chiron GoRound TC"', sample: '寶咖咖抓周大冒險 · 點一下繼續', className: 'font-body' },
  { family: 'Noto Serif TC', css: '900 21px "Noto Serif TC"', sample: '第 2 章 · 攻擊 才藝 道具 防禦', className: 'font-serif' },
  { family: 'Fredoka', css: '600 21px Fredoka', sample: 'HP 84/100 · 05:29 · Taipei', className: 'font-num' },
] as const;

const Group = ({ title, note, children }: { title: string; note?: string; children: ReactNode }) => (
  <section className="flex flex-col gap-2">
    <h3 className="font-serif text-heading text-gold-light">
      {title}
      {note && <span className="ml-2 font-body text-caption text-mutedOnDark">{note}</span>}
    </h3>
    {children}
  </section>
);

const Grid = ({ children, min = 92 }: { children: ReactNode; min?: number }) => (
  <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(auto-fill, minmax(${min}px, 1fr))` }}>
    {children}
  </div>
);

/** One token: a chip of the colour (or gradient) with its name and value under it. */
const Swatch = ({ name, value, fill }: { name: string; value: string; fill?: string }) => (
  <figure data-token={name} className="m-0 overflow-hidden rounded-panel border border-gold/30 bg-panel-solid">
    <div className="h-10" style={{ background: fill ?? value }} />
    <figcaption className="px-1.5 py-1 leading-tight">
      <span className="block truncate text-[12px] font-bold text-inkOnDark" title={name}>
        {name}
      </span>
      <span className="block truncate font-num text-[11px] font-medium text-mutedOnDark" title={value}>
        {value}
      </span>
    </figcaption>
  </figure>
);

const swatches = (prefix: string, tokens: Readonly<Record<string, string>>) =>
  Object.entries(tokens).map(([name, value]) => <Swatch key={name} name={`${prefix}.${name}`} value={value} />);

/** A material ramp as one strip: base, cel, deep, line and any extra tints, left to right. */
const Ramp = ({ name, ramp }: { name: string; ramp: Readonly<Record<string, string | undefined>> }) => {
  const entries = Object.entries(ramp).filter((entry): entry is [string, string] => entry[1] !== undefined);
  return (
    <div data-token={`MATERIALS.${name}`} className="flex flex-col gap-1">
      <span className="text-[12px] font-bold text-inkOnDark">{name}</span>
      <div className="flex overflow-hidden rounded-panel border border-gold/30">
        {entries.map(([field, hex]) => (
          <div key={field} className="flex min-w-0 flex-1 flex-col" title={`${field} ${hex}`}>
            <div className="h-8" style={{ background: hex }} />
            <span className="truncate bg-panel-solid px-1 text-[10px] font-bold leading-4 text-mutedOnDark">{field}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

/** The sky for one time: its gradient, the moon at its height, the dawn glow on the horizon. */
const SkyCard = ({ sky }: { sky: Sky }) => {
  const moonTop = 70 - sky.moon * 52;
  return (
    <div
      className="relative h-[104px] overflow-hidden"
      style={{ background: `linear-gradient(180deg, ${sky.top} 0%, ${sky.mid} 58%, ${sky.horizon} 100%)` }}
    >
      {sky.dawn > 0 && (
        <div
          className="absolute inset-x-0 bottom-0 h-full"
          style={{ background: `radial-gradient(120% 70% at 50% 110%, ${LIGHTS.lampCore}, transparent 70%)`, opacity: sky.dawn * 0.85 }}
        />
      )}
      {sky.moon > 0 && (
        <div
          className="absolute h-3 w-3 rounded-full"
          style={{ left: '62%', top: `${moonTop}%`, background: UI.damage, boxShadow: `0 0 10px 3px ${RIM.moon}` }}
        />
      )}
      {sky.dawn >= 1 && (
        <div
          className="absolute bottom-[-10px] left-1/2 h-6 w-6 -translate-x-1/2 rounded-full"
          style={{ background: MATERIALS.gold.base, boxShadow: `0 0 18px 8px ${RIM.gold}` }}
        />
      )}
    </div>
  );
};

/** Four iso tiles in the graded world colours: the ground a map at this time would paint. */
const GroundPatch = ({ time }: { time: string }) => {
  const g = gradeTokens(time);
  const tile = (x: number, y: number, top: string, side: string) => (
    <g transform={`translate(${x} ${y})`}>
      <path d="M0 0 L18 -9 L36 0 L18 9 Z" fill={top} />
      <path d="M0 0 L18 9 L18 13 L0 4 Z" fill={side} />
      <path d="M36 0 L18 9 L18 13 L36 4 Z" fill={side} opacity={0.7} />
    </g>
  );
  return (
    <svg viewBox="0 0 72 36" className="block w-full" aria-hidden="true">
      {tile(18, 9, g.grass, g.grassAlt)}
      {tile(0, 18, g.brick, g.brickAlt)}
      {tile(36, 18, g.water, g.glassShade)}
      {tile(18, 27, g.asphalt, g.glassShadeLow)}
    </svg>
  );
};

/** A hard-edged cel chip per character material: base on the upper left, cel on the lower right. */
const CelChips = ({ time }: { time: string }) => {
  const m = gradeCharacter(time);
  return (
    <div className="flex justify-center gap-1">
      {(['skin', 'pajama', 'tabby', 'bandana'] as const).map((name) => (
        <span
          key={name}
          title={name}
          className="h-4 w-4 rounded-full"
          style={{ background: `linear-gradient(135deg, ${m[name].base} 58%, ${m[name].cel} 58%)`, boxShadow: `0 0 0 1.5px ${m[name].line}` }}
        />
      ))}
    </div>
  );
};

const fmt = (rgb: readonly number[]) => rgb.map((value) => value.toFixed(2)).join(' ');

const NightClock = () => (
  <div className="grid grid-cols-3 gap-2 min-[700px]:grid-cols-9">
    {SKY_STRIP.map((time) => {
      const sky = skyAt(time);
      return (
        <figure key={time} data-sky={time} className="m-0 overflow-hidden rounded-panel border border-gold/40 bg-panel-solid">
          <SkyCard sky={sky} />
          <div className="px-1 pt-1" style={{ background: sky.horizon }}>
            <GroundPatch time={time} />
          </div>
          <figcaption className="flex flex-col gap-1 px-1.5 py-1.5">
            <div className="flex items-center justify-between">
              <span className="font-num text-[16px] font-semibold text-gold-light">{time}</span>
              <span
                title={`rim ${sky.rim}${sky.localRim ? ' / local' : ''}`}
                className="h-3 w-3 rounded-full"
                style={{ background: sky.rim, boxShadow: sky.localRim ? `0 0 0 2px ${LIGHTS.lampMid}` : undefined }}
              />
            </div>
            <CelChips time={time} />
            <span className="font-num text-[10px] font-medium leading-tight text-mutedOnDark">
              env ×{fmt(worldGrade(time))}
              <br />
              char ×{fmt(characterGrade(time))}
            </span>
          </figcaption>
        </figure>
      );
    })}
  </div>
);

/** Polls `document.fonts.check` until every family is in (the visual check waits on fonts.ready). */
function useFontsLoaded() {
  const [loaded, setLoaded] = useState<Record<string, boolean>>({});
  useEffect(() => {
    let live = true;
    const check = () => {
      if (!live) return;
      setLoaded(Object.fromEntries(FONT_CHECKS.map((font) => [font.family, document.fonts.check(font.css, font.sample)])));
    };
    // Ask for every family explicitly: unicode-range faces only load once something needs them
    Promise.all(FONT_CHECKS.map((font) => document.fonts.load(font.css, font.sample).catch(() => [])))
      .then(() => document.fonts.ready)
      .then(check);
    document.fonts.addEventListener('loadingdone', check);
    return () => {
      live = false;
      document.fonts.removeEventListener('loadingdone', check);
    };
  }, []);
  return loaded;
}

const Fonts = () => {
  const loaded = useFontsLoaded();
  return (
    <div className="flex flex-col gap-2">
      {FONT_CHECKS.map((font) => (
        <div key={font.family} data-font={font.family} data-font-loaded={loaded[font.family] ? 'true' : 'false'} className="rounded-panel border border-gold/30 bg-panel-solid px-3 py-2">
          <div className="flex items-baseline justify-between gap-2">
            <span className="text-caption text-mutedOnDark">{font.family}</span>
            <span className={`font-num text-[12px] font-semibold ${loaded[font.family] ? 'text-hp-to' : 'text-hp-lowTo'}`}>{loaded[font.family] ? 'loaded' : 'loading…'}</span>
          </div>
          <p className={`m-0 ${font.className} text-[21px] font-bold text-inkOnDark`}>{font.sample}</p>
        </div>
      ))}
      <div className="flex flex-col gap-1 rounded-panel border border-gold/30 bg-panel-solid px-3 py-2">
        <span className="font-serif text-logo text-gold-light">寶咖咖</span>
        <span className="font-serif text-chapter text-inkOnDark">台灣大學</span>
        <span className="font-serif text-title text-inkOnDark">title 28</span>
        <span className="font-serif text-heading text-inkOnDark">heading 22</span>
        <span className="font-serif text-button text-inkOnDark">攻擊 button 21</span>
        <span className="text-dialogue text-inkOnDark">風是往這邊吹的。dialogue 21</span>
        <span className="text-body text-inkOnDark">body 18 · 摩卡貓</span>
        <span className="text-label text-inkOnDark">label 16</span>
        <span className="text-caption text-mutedOnDark">caption 14</span>
      </div>
    </div>
  );
};

const Contrast = () => (
  <div className="overflow-hidden rounded-panel border border-gold/30">
    {TEXT_PAIRS.map((pair) => {
      const ratio = contrastRatio(UI[pair.text], UI[pair.on]);
      const ok = ratio >= MIN_CONTRAST[pair.level];
      return (
        <div key={`${pair.text}-${pair.on}`} className="flex items-center gap-2 px-2 py-1.5" style={{ background: UI[pair.on], color: UI[pair.text] }}>
          <span className="min-w-0 flex-1 truncate text-[14px] font-bold">
            {pair.text} on {pair.on}
          </span>
          <span className="font-num text-[14px] font-semibold">
            {ratio.toFixed(1)}:1 {ok ? '✓' : '✗'} {pair.level}
          </span>
        </div>
      );
    })}
  </div>
);

const gradient = (stops: readonly string[]) => `linear-gradient(90deg, ${stops.join(', ')})`;
const panelStyle: CSSProperties = { background: `linear-gradient(180deg, ${UI.panelTopGlass}, ${UI.panelBottomGlass})` };

export const TokensSection = () => (
  <section data-artlab-tokens className="flex flex-col gap-5">
    <h2 className="font-serif text-title text-inkOnDark">Tokens</h2>

    <Group title="Night clock" note="skyAt() · gradeTokens() · gradeCharacter() (half)">
      <NightClock />
    </Group>

    <Group title="UI" note="§ 3.1 UI, § 7.2">
      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1 rounded-panel border border-gold p-3" style={panelStyle}>
          <span className="font-serif text-heading text-gold-light">摩卡貓</span>
          <p className="m-0 text-dialogue text-inkOnDark">風是往這邊吹的。</p>
          <p className="m-0 text-caption text-mutedOnDark">點一下繼續</p>
        </div>
        <div className="flex flex-1 flex-col gap-2">
          <div
            className="flex h-[56px] items-center justify-center rounded-panel font-serif text-button shadow-gold"
            style={{ background: gradient([UI.primaryTop, UI.primaryMid, UI.primaryBottom]).replace('90deg', '180deg'), color: UI.primaryText }}
          >
            攻擊
          </div>
          <div className="flex h-[56px] flex-col items-center justify-center rounded-panel border border-gold/70 bg-gradient-to-b from-command-top to-command-bottom">
            <span className="font-serif text-button leading-none text-inkOnDark">才藝</span>
            <span className="font-num text-[12px] text-mutedOnDark">元氣 3</span>
          </div>
        </div>
      </div>
      <Grid>
        {swatches('UI', Object.fromEntries(Object.entries(UI).filter(([, value]) => !value.startsWith('rgba'))))}
        <Swatch name="UI.panel" value="glass stops" fill={panelStyle.background as string} />
        <Swatch name="UI.hp" value="from → to" fill={gradient([UI.hpFrom, UI.hpTo])} />
        <Swatch name="UI.hpLow" value="from → to" fill={gradient([UI.hpLowFrom, UI.hpLowTo])} />
        <Swatch name="UI.hpCrit" value="from → to" fill={gradient([UI.hpCritFrom, UI.hpCritTo])} />
        <Swatch name="UI.mp" value="from → to" fill={gradient([UI.mpFrom, UI.mpTo])} />
      </Grid>
    </Group>

    <Group title="Contrast" note="§ 3.3: body ≥ 7, muted ≥ 4.5">
      <Contrast />
    </Group>

    <Group title="Fonts" note="§ 7.1">
      <Fonts />
    </Group>

    <Group title="Line and neutrals">
      <Grid>{swatches('LINE', LINE)}</Grid>
    </Group>

    <Group title="Character materials" note="base · cel · deep · line · extras">
      <div className="grid gap-2" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))' }}>
        {Object.entries(MATERIALS).map(([name, ramp]) => (
          <Ramp key={name} name={name} ramp={ramp} />
        ))}
      </div>
      <Grid>
        <Swatch name="EYES.brown" value={EYES.brown.join(' → ')} fill={gradient([...EYES.brown]).replace('90deg', '180deg')} />
        <Swatch name="EYES.cat" value={EYES.cat.join(' → ')} fill={gradient([...EYES.cat]).replace('90deg', '180deg')} />
        {swatches('RIM', RIM)}
      </Grid>
    </Group>

    <Group title="World" note="painted for 00:00; graded by the clock">
      <Grid>{swatches('WORLD', WORLD)}</Grid>
    </Group>

    <Group title="Lights" note="never graded">
      <Grid>
        {swatches('LIGHTS', LIGHTS)}
        <Swatch name="LIGHTS.lampBloom" value="core → mid → 0" fill={`radial-gradient(circle, ${LIGHTS.lampCore}, ${LIGHTS.lampMid} 45%, transparent 75%) ${UI.panelBottom}`} />
      </Grid>
    </Group>

    <Group title="月亮線 lines">
      <Grid>{swatches('MRT', MRT)}</Grid>
    </Group>
  </section>
);
