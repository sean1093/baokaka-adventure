import { POPUP, PAGELAB } from '../../art/palette';
import { SpriteAnim, spriteDef, useSpritesPreload, type SpriteId } from '../sprites';
import { FRAME_REPORT, frameStatus, type FrameNeed, type FrameStatus } from '../view/actors';

/**
 * The missing-frame report (#95), `#/pagelab?section=sprites`: every frame GDD § 3.9 asks of the
 * character artist, against what is baked (Art v2 § 5 coverage), ✓ / ✗ / later, with the delivered
 * frames drawn and the fallback the game shows meanwhile. `later` rows (M3/M4: climb,
 * stand-cruise, walk, carried, Mocha's linked walk) are not required for M1. The rows are
 * `FRAME_REPORT` in `view/actors/animMap.ts`; #141 turns the ✗ rows green.
 */

const STATUS: Record<FrameStatus, { mark: string; color: string; text: string }> = {
  ok: { mark: '✓', color: PAGELAB.badgeOk, text: 'done' },
  missing: { mark: '✗', color: PAGELAB.badgeBad, text: 'missing' },
  later: { mark: '…', color: PAGELAB.badgePending, text: 'later (M3/M4)' },
};

const THUMB_H = 64;

/** One delivered frame, held, in its own box (the frame's full size, scaled to the row). */
function Thumb({ sprite, frame }: { sprite: SpriteId; frame: number }) {
  const def = spriteDef(sprite);
  const [w, h] = def.size;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} width={(THUMB_H * w) / h} height={THUMB_H} aria-label={`${sprite} ${frame + 1}`} role="img" data-thumb={`${sprite}:${frame}`}>
      <SpriteAnim sprite={sprite} x={def.anchor[0]} y={def.anchor[1]} frame={frame} playing={false} floor={false} />
    </svg>
  );
}

function Row({ need }: { need: FrameNeed }) {
  const status = frameStatus(need);
  const s = STATUS[status];
  const have = need.delivered.reduce((n, d) => n + d.frames.length, 0);
  return (
    <li className="flex flex-col gap-1 rounded-md p-2" style={{ background: POPUP.coverLight }} data-frame-need={`${need.char}.${need.id}`} data-status={status}>
      <div className="flex flex-wrap items-baseline gap-x-3">
        <span className="inline-flex h-7 w-7 items-center justify-center rounded-full text-[18px] font-bold" style={{ background: s.color, color: POPUP.chalk }} aria-label={s.text}>
          {s.mark}
        </span>
        <strong className="text-[18px]">{need.label}</strong>
        <span className="text-[15px]" style={{ color: POPUP.stickerLabel }}>
          {have}/{need.frames} frames · {need.delivered.length > 0 ? need.delivered.map((d) => d.sprite.split('.')[1]).join(' + ') : 'not drawn'}
        </span>
      </div>
      {need.delivered.length > 0 && (
        <div className="flex flex-wrap items-end gap-1">
          {need.delivered.flatMap((d) => d.frames.map((f) => <Thumb key={`${d.sprite}:${f}`} sprite={d.sprite} frame={f} />))}
        </div>
      )}
      {need.fallback !== undefined && status !== 'ok' && (
        <span className="text-[15px]" style={{ color: POPUP.stickerLabel }}>
          {status === 'missing' ? 'Meanwhile: ' : 'Until then: '}
          {need.fallback}
        </span>
      )}
    </li>
  );
}

const SPRITES = [...new Set(FRAME_REPORT.flatMap((r) => r.delivered.map((d) => d.sprite)))];

export function SpriteReport() {
  const ready = useSpritesPreload(SPRITES);
  const m1 = FRAME_REPORT.filter((r) => r.when === 'M1');
  const missing = m1.filter((r) => frameStatus(r) === 'missing');
  return (
    <section className="flex flex-col gap-4 px-4 pb-10" data-pagelab-sprites="" data-sprites={ready ? 'ready' : 'loading'}>
      <p className="max-w-[60ch] text-[16px]">
        GDD § 3.9 sprite needs against the baked poses (Art v2 § 5). M1: {m1.length - missing.length} of {m1.length} done
        {missing.length > 0 ? `; missing (#141): ${missing.map((r) => `${r.char === 'mocha' ? '摩卡' : '寶咖咖'} ${r.label}`).join(', ')}` : ''}. Cycles are 8 frames.
      </p>
      {(['baokaka', 'mocha'] as const).map((char) => (
        <div key={char} className="flex flex-col gap-2">
          <h2 className="font-serif text-[22px]">{char === 'baokaka' ? '寶咖咖 Baokaka' : '摩卡 Mocha'}</h2>
          <ul className="flex flex-col gap-2">
            {FRAME_REPORT.filter((r) => r.char === char).map((r) => (
              <Row key={r.id} need={r} />
            ))}
          </ul>
        </div>
      ))}
    </section>
  );
}
