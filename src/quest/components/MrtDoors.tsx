import { MRT, UI } from '../../art/palette';

/**
 * Map → battle (art direction § 7.9): two navy MRT door panels with the line's colour stripe and
 * a window slide shut over the map (280ms), the door-chime light flashes (120ms), then they slide
 * open on the battle (320ms). Transforms and opacity only. QuestScreens runs the phases and skips
 * the doors entirely under reduced motion (the battle's own 200ms fade-in remains).
 */

export const DOOR_CLOSE_MS = 280;
export const DOOR_CHIME_MS = 120;
export const DOOR_OPEN_MS = 320;

type Props = { phase: 'closing' | 'opening'; stripe?: string };

const Panel = ({ side, phase, stripe }: { side: 'l' | 'r'; phase: Props['phase']; stripe: string }) => (
  <div
    aria-hidden="true"
    className={`absolute inset-y-0 w-1/2 overflow-hidden ${side === 'l' ? 'left-0' : 'right-0'} ${phase === 'closing' ? `mrt-door-close-${side}` : `mrt-door-open-${side}`}`}
    style={{ background: `linear-gradient(180deg, ${UI.commandTop}, ${UI.commandBottom} 55%, ${UI.panelBottom})` }}
  >
    {/* Window: dark glass with a moonlit streak */}
    <div
      className={`absolute top-[18%] h-[26%] w-[56%] rounded-[14px] border-[3px] ${side === 'l' ? 'right-[16%]' : 'left-[16%]'}`}
      style={{ borderColor: UI.gold, background: `linear-gradient(160deg, ${UI.commandTop}, ${UI.panelBottom} 60%)`, boxShadow: `inset 0 0 0 3px ${UI.panelBottom}` }}
    >
      <div className="absolute left-[18%] top-[10%] h-[80%] w-[12%] -skew-x-12 rounded-full opacity-25" style={{ background: UI.inkOnDark }} />
    </div>
    {/* The line's colour stripe, with a gold hairline on each side */}
    <div className="absolute inset-x-0 top-[56%] h-[22px]" style={{ background: stripe, boxShadow: `0 -2px 0 ${UI.gold}, 0 2px 0 ${UI.gold}` }} />
    {/* The rubber seal where the two doors meet */}
    <div className={`absolute inset-y-0 w-[6px] ${side === 'l' ? 'right-0' : 'left-0'}`} style={{ background: UI.panelBottom }} />
    <div className={`absolute inset-y-0 w-px ${side === 'l' ? 'right-[6px]' : 'left-[6px]'}`} style={{ background: UI.gold, opacity: 0.6 }} />
  </div>
);

export const MrtDoors = ({ phase, stripe = MRT.red }: Props) => (
  <div className="pointer-events-none fixed inset-0 z-[1000]" data-mrt-doors={phase}>
    <Panel side="l" phase={phase} stripe={stripe} />
    <Panel side="r" phase={phase} stripe={stripe} />
    {phase === 'closing' && (
      <>
        {/* The door-chime light over the doorway, and its flash on the closed doors (≤ 0.35, § 7.10) */}
        <div className="mrt-chime absolute left-1/2 top-[6%] h-3 w-24 -translate-x-1/2 rounded-full" style={{ background: UI.amber, boxShadow: `0 0 24px 8px ${UI.amber}` }} />
        <div className="absolute inset-0 opacity-35">
          <div className="mrt-chime absolute inset-0" style={{ background: `radial-gradient(60% 40% at 50% 10%, ${UI.goldLight}, transparent 70%)` }} />
        </div>
      </>
    )}
  </div>
);
