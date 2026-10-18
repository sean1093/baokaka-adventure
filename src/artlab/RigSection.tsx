import { useMemo, type CSSProperties, type ReactNode } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { ART_DEFS, artUrl, type ArtDefName } from '../art/defs';
import { DEMO_BONES, DEMO_EXPRS, DEMO_SKELETON, RigDemo } from '../art/demo/RigDemo';
import { SkeletonOverlay } from '../art/Fig';
import { LINE, skyAt } from '../art/palette';
import { Placeholder, type PlaceholderKind } from '../art/placeholder';
import { LODS, SPRITE_BUDGETS, type Lod, type SpriteState } from '../art/sprite';
import { countElements, markupBytes } from '../art/spriteStats';

/**
 * The art lab's Rig section (`#/artlab?section=rig`): the option D rig test figure (`RigDemo`)
 * at every LOD with an optional skeleton overlay, its silhouettes, expressions and rig states,
 * the shared gradients from `<ArtDefs/>`, the placeholder sprite per kind, and the § 8.2 budget
 * numbers. Dev-only. Parameters: `skeleton=1` overlays the joints, `state=` plays one state on
 * the LOD row.
 */

/** Where each LOD is drawn (§ 8.3 sizes). */
const LOD_SIZE: Record<Lod, number> = { portrait: 300, battle: 180, map: 60, icon: 48 };

const STATES: readonly SpriteState[] = ['idle', 'attack', 'hurt', 'ko', 'victory', 'walk'];

const PLACEHOLDERS: readonly { kind: PlaceholderKind; label: string }[] = [
  { kind: 'npc', label: '阿伯' },
  { kind: 'foe', label: '咕咕' },
  { kind: 'boss', label: '鵝霸' },
  { kind: 'prop', label: '郵筒' },
];

const NIGHT = skyAt('01:00');
const NIGHT_BG: CSSProperties = { background: `linear-gradient(180deg, ${NIGHT.top} 0%, ${NIGHT.mid} 70%, ${NIGHT.horizon} 100%)` };
const PARCHMENT_BG: CSSProperties = { background: LINE.parchment, color: LINE.ink };

const Row = ({ title, note, children }: { title: string; note?: string; children: ReactNode }) => (
  <section className="flex flex-col gap-2">
    <h3 className="font-serif text-heading text-gold-light">
      {title}
      {note && <span className="ml-2 font-body text-caption text-mutedOnDark">{note}</span>}
    </h3>
    {children}
  </section>
);

const Cell = ({ label, size, style, children }: { label: string; size: number; style?: CSSProperties; children: ReactNode }) => (
  <figure className="m-0 flex flex-col items-center gap-1 rounded-panel p-2" style={style}>
    <div className="relative" style={{ width: size, height: size }}>
      {children}
    </div>
    <figcaption className="font-num text-[12px] font-semibold opacity-80">{label}</figcaption>
  </figure>
);

/** The demo's skeleton over it, in the same 200u box. */
const Skeleton = () => (
  <svg viewBox="0 0 200 200" className="pointer-events-none absolute inset-0 h-full w-full" aria-hidden="true">
    <SkeletonOverlay joints={DEMO_SKELETON} bones={DEMO_BONES} />
  </svg>
);

/** Black wherever the figure paints: the sprite's own markup as a CSS mask, no filter. */
const Silhouette = ({ lod, size }: { lod: Lod; size: number }) => {
  const mask = useMemo(() => {
    const markup = renderToStaticMarkup(<RigDemo lod={lod} />).replace('<svg ', `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" `);
    return `url("data:image/svg+xml,${encodeURIComponent(markup)}")`;
  }, [lod, size]);
  return <div style={{ width: size, height: size, background: '#000000', WebkitMaskImage: mask, maskImage: mask, WebkitMaskSize: '100% 100%', maskSize: '100% 100%' }} />;
};

/** One shared gradient, painted on a shape it is meant for. */
const DefSwatch = ({ name }: { name: ArtDefName }) => (
  <figure data-art-def={ART_DEFS[name]} className="m-0 flex flex-col items-center gap-1 rounded-panel p-2" style={NIGHT_BG}>
    <svg viewBox="0 0 60 40" width={90} height={60} aria-hidden="true">
      {name === 'irisBrown' || name === 'irisCat' ? (
        <ellipse cx={30} cy={20} rx={11} ry={15} fill={artUrl(name)} />
      ) : name === 'contact' ? (
        <>
          <rect width={60} height={40} fill={LINE.parchment} />
          <ellipse cx={30} cy={26} rx={26} ry={7} fill={artUrl(name)} />
        </>
      ) : name === 'blush' ? (
        <>
          <rect width={60} height={40} fill={LINE.parchment} />
          <ellipse cx={30} cy={20} rx={22} ry={12} fill={artUrl(name)} />
        </>
      ) : (
        <circle cx={30} cy={20} r={20} fill={artUrl(name)} />
      )}
    </svg>
    <figcaption className="font-num text-[12px] font-semibold text-mutedOnDark">{name}</figcaption>
  </figure>
);

/** Elements and bytes per LOD, against the hero budget. */
const BudgetTable = () => {
  const rows = LODS.map((lod) => {
    const markup = renderToStaticMarkup(<RigDemo lod={lod} />);
    return { lod, elements: countElements(markup), bytes: markupBytes(markup) };
  });
  const budget = SPRITE_BUDGETS.hero;
  return (
    <table className="w-full max-w-[420px] border-collapse font-num text-[13px] text-inkOnDark">
      <thead>
        <tr className="text-left text-mutedOnDark">
          <th className="py-1 pr-2">LOD</th>
          <th className="py-1 pr-2">elements (≤ {budget.elements})</th>
          <th className="py-1">bytes (≤ {budget.bytes})</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.lod} data-budget={row.lod} className="border-t border-gold/20">
            <td className="py-1 pr-2">{row.lod}</td>
            <td className="py-1 pr-2">{row.elements}</td>
            <td className="py-1">{row.bytes}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export const RigSection = ({ params }: { params: URLSearchParams }) => {
  const skeleton = params.get('skeleton') === '1';
  const wanted = params.get('state');
  const state = STATES.find((entry) => entry === wanted) ?? 'idle';
  const link = (next: Record<string, string | null>) => {
    const query = new URLSearchParams(params);
    for (const [key, value] of Object.entries(next)) {
      if (value === null) query.delete(key);
      else query.set(key, value);
    }
    return `#/artlab?${query.toString()}`;
  };

  return (
    <section data-artlab-rig className="flex flex-col gap-5 text-inkOnDark">
      <header className="flex flex-wrap items-center gap-2">
        <h2 className="mr-2 font-serif text-title">Rig</h2>
        <a className="rounded-full bg-white/10 px-3 py-1 font-mono text-[13px] font-bold" href={link({ skeleton: skeleton ? null : '1' })}>
          skeleton {skeleton ? 'off' : 'on'}
        </a>
        {STATES.map((entry) => (
          <a key={entry} className={`rounded-full px-3 py-1 font-mono text-[13px] font-bold ${entry === state ? 'bg-gold/40' : 'bg-white/10'}`} href={link({ state: entry === 'idle' ? null : entry })}>
            {entry}
          </a>
        ))}
      </header>

      <Row title="Levels of detail" note="RigDemo (測試寶寶) · § 8.3 · portrait 300 · battle 180 · map 60 · icon 48">
        <div className="flex flex-wrap items-end gap-2">
          {LODS.map((lod) => (
            <Cell key={lod} label={lod} size={LOD_SIZE[lod]} style={NIGHT_BG}>
              <RigDemo lod={lod} state={state} />
              {skeleton && lod !== 'icon' && <Skeleton />}
            </Cell>
          ))}
        </div>
        <div className="flex flex-wrap items-end gap-2">
          {LODS.filter((lod) => lod !== 'portrait').map((lod) => (
            <Cell key={lod} label={`${lod} · parchment`} size={LOD_SIZE[lod]} style={PARCHMENT_BG}>
              <RigDemo lod={lod} state={state} />
            </Cell>
          ))}
          <Cell label="silhouette 180" size={180} style={{ background: '#FFFFFF', color: LINE.ink }}>
            <Silhouette lod="battle" size={180} />
          </Cell>
          <Cell label="silhouette 60" size={60} style={{ background: '#FFFFFF', color: LINE.ink }}>
            <Silhouette lod="map" size={60} />
          </Cell>
        </div>
      </Row>

      <Row title="Expressions" note="expr: Head swaps eyes, brows and mouth groups">
        <div className="flex flex-wrap gap-2">
          {DEMO_EXPRS.map((expr) => (
            <Cell key={expr} label={expr} size={124} style={NIGHT_BG}>
              <RigDemo lod="battle" expr={expr} />
            </Cell>
          ))}
          <Cell label="facing right" size={124} style={NIGHT_BG}>
            <RigDemo lod="battle" facing="right" />
          </Cell>
        </div>
      </Row>

      <Row title="States" note="rig.css · § 7.9 (frozen with still=1)">
        <div className="flex flex-wrap gap-2">
          {STATES.map((entry) => (
            <Cell key={entry} label={entry} size={96} style={NIGHT_BG}>
              <RigDemo lod="battle" state={entry} />
            </Cell>
          ))}
        </div>
      </Row>

      <Row title="Shared defs" note="<ArtDefs/> at the App root, referenced by id">
        <div className="flex flex-wrap gap-2">
          {(Object.keys(ART_DEFS) as ArtDefName[]).map((name) => (
            <DefSwatch key={name} name={name} />
          ))}
        </div>
      </Row>

      <Row title="Placeholders" note="registerPlaceholder() · D-14 · battle 160 and map 60">
        <div className="flex flex-wrap items-end gap-2">
          {PLACEHOLDERS.map(({ kind, label }) => (
            <Cell key={kind} label={kind} size={160} style={NIGHT_BG}>
              <Placeholder name={`artlab-${kind}`} kind={kind} label={label} lod="battle" />
            </Cell>
          ))}
        </div>
        <div className="flex flex-wrap items-end gap-2">
          {PLACEHOLDERS.map(({ kind, label }) => (
            <Cell key={kind} label={kind} size={60} style={NIGHT_BG}>
              <Placeholder name={`artlab-${kind}`} kind={kind} label={label} lod="map" />
            </Cell>
          ))}
        </div>
      </Row>

      <Row title="Budget" note="§ 8.2 rule 8 (hero)">
        <BudgetTable />
      </Row>
    </section>
  );
};
