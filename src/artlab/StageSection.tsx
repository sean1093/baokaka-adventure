import type { ReactNode } from 'react';
import { BossFrame } from '../art/backdrops/BossFrame';
import { STAGE_H, STAGE_VIEW, STAGE_W, Stage } from '../art/backdrops/Stage';
import { useBackdrop } from '../art/backdrops';
import { BACKDROP_CHAPTER, GENERIC_BACKDROPS } from '../art/backdrops/keys';

/**
 * The art lab's Stage section (`#/artlab?section=stage`, issue #14; art direction § 8.6 "every
 * backdrop"): each battle backdrop over its whole painted width with the 390×500 frame marked,
 * the generic stages at three clock times, and the two 布袋戲 frames. Dev-only.
 */

const KEYS = [...GENERIC_BACKDROPS, ...Object.keys(BACKDROP_CHAPTER)];
const TIMES = ['00:00', '03:00', '05:15'] as const;
const SCALE = 0.6;

const Group = ({ title, note, children }: { title: string; note?: string; children: ReactNode }) => (
  <section className="flex flex-col gap-2">
    <h3 className="font-serif text-heading text-gold-light">
      {title}
      {note && <span className="ml-2 font-body text-caption text-mutedOnDark">{note}</span>}
    </h3>
    {children}
  </section>
);

/** One backdrop over its whole painted area, the 390-wide frame outlined. */
const Wide = ({ name, time }: { name: string; time: string }) => {
  const config = useBackdrop(name, name === 'genericRoom');
  const frameLeft = ((0 - STAGE_VIEW.x) / STAGE_VIEW.w) * 100;
  return (
    <figure className="flex flex-col gap-1" data-stage-card={name} data-stage-time={time} data-stage-ready={config.key === name ? '' : undefined}>
      <div className="relative overflow-hidden rounded border border-gold/30" style={{ width: STAGE_VIEW.w * SCALE, height: STAGE_H * SCALE }}>
        <Stage config={config} time={time} />
        <span className="pointer-events-none absolute inset-y-0 border-x border-dashed border-gold-light/70" style={{ left: `${frameLeft}%`, width: `${(STAGE_W / STAGE_VIEW.w) * 100}%` }} />
      </div>
      <figcaption className="text-caption text-mutedOnDark">
        {config.label} · {config.time ?? time}
      </figcaption>
    </figure>
  );
};

/** The 大安 template inside a 390×500 frame, with a 布袋戲 frame over it. */
const Framed = ({ variant }: { variant: 'boss' | 'final' }) => {
  const config = useBackdrop('daan');
  return (
    <figure className="flex flex-col gap-1">
      <div className="relative overflow-hidden rounded border border-gold/30" style={{ width: STAGE_W * SCALE, height: STAGE_H * SCALE }}>
        <Stage config={config} time="00:20" />
        <BossFrame variant={variant} left={0} right={STAGE_W} />
      </div>
      <figcaption className="text-caption text-mutedOnDark">frame: {variant}</figcaption>
    </figure>
  );
};

export const StageSection = () => (
  <div className="flex flex-col gap-6" data-artlab-stage="">
    <Group title="Battle backdrops" note="each over its painted width (−110…500); dashed: the 390×500 frame">
      <div className="flex flex-wrap gap-4">
        {KEYS.map((name) => (
          <Wide key={name} name={name} time="00:00" />
        ))}
      </div>
    </Group>
    <Group title="Generic stages across the night" note="they take the map's clock">
      <div className="flex flex-wrap gap-4">
        {GENERIC_BACKDROPS.flatMap((name) => TIMES.map((time) => <Wide key={`${name}${time}`} name={name} time={time} />))}
      </div>
    </Group>
    <Group title="布袋戲 frames" note="boss: the valance; final: the full proscenium (D-31)">
      <div className="flex flex-wrap gap-4">
        <Framed variant="boss" />
        <Framed variant="final" />
      </div>
    </Group>
  </div>
);
