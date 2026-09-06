import type { Sprite } from '../sprite';
import { C } from '../palette';

/**
 * Mocha Cat, a brown tabby. All three tabby markers are drawn - the forehead M, the
 * flank stripes and the ringed tail - or it just reads as "a brown cat" at small sizes.
 */
export const MochaCat: Sprite = () => (
  <svg viewBox="0 0 100 100" className="h-full w-full" aria-hidden="true">
    {/* Tail, curling up from the right */}
    <path
      d="M64,86 C90,86 98,60 88,42 C82,32 68,30 62,40 C58,47 64,52 70,50 C78,47 82,55 78,64 C74,74 66,78 58,76 Z"
      fill={C.mocha}
      stroke={C.ink}
      strokeWidth={4}
      strokeLinejoin="round"
    />
    {/* Tail rings: perpendicular to the tail, otherwise they read as random slashes */}
    <path d="M76,77 L85,70" stroke={C.mochaDeep} strokeWidth={5} strokeLinecap="round" fill="none" />
    <path d="M79,61 L87,55" stroke={C.mochaDeep} strokeWidth={5} strokeLinecap="round" fill="none" />
    <path d="M73,36 L71,47" stroke={C.mochaDeep} strokeWidth={5} strokeLinecap="round" fill="none" />

    {/* Haunches, sitting */}
    <path
      d="M22,90 C18,74 18,64 34,59 C40,56 60,56 66,59 C82,64 82,74 78,90 Z"
      fill={C.mocha}
      stroke={C.ink}
      strokeWidth={4}
      strokeLinejoin="round"
    />
    {/* Mackerel flank stripes */}
    <path d="M27,64 Q24,72 26,80" stroke={C.mochaDeep} strokeWidth={5} strokeLinecap="round" fill="none" />
    <path d="M35,61 Q32,70 34,78" stroke={C.mochaDeep} strokeWidth={5} strokeLinecap="round" fill="none" />
    <path d="M73,64 Q76,72 74,80" stroke={C.mochaDeep} strokeWidth={5} strokeLinecap="round" fill="none" />
    <path d="M65,61 Q68,70 66,78" stroke={C.mochaDeep} strokeWidth={5} strokeLinecap="round" fill="none" />

    <ellipse cx={50} cy={76} rx={13} ry={14} fill={C.cream} stroke={C.ink} strokeWidth={3} />
    <ellipse cx={39} cy={89} rx={9} ry={7} fill={C.mocha} stroke={C.ink} strokeWidth={4} />
    <ellipse cx={61} cy={89} rx={9} ry={7} fill={C.mocha} stroke={C.ink} strokeWidth={4} />

    {/* Ears peek out from behind the round head */}
    <polygon points="20,3 46,30 26,38" fill={C.mocha} stroke={C.ink} strokeWidth={4} strokeLinejoin="round" />
    <polygon points="80,3 54,30 74,38" fill={C.mocha} stroke={C.ink} strokeWidth={4} strokeLinejoin="round" />
    <circle cx={50} cy={42} r={27} fill={C.mocha} stroke={C.ink} strokeWidth={4} />

    {/* The forehead M: the single most recognisable tabby marking */}
    <path
      d="M39,26 L44,18 L50,25 L56,18 L61,26"
      stroke={C.mochaDeep}
      strokeWidth={5}
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
    <path d="M29,33 L26,41" stroke={C.mochaDeep} strokeWidth={5} strokeLinecap="round" fill="none" />
    <path d="M71,33 L74,41" stroke={C.mochaDeep} strokeWidth={5} strokeLinecap="round" fill="none" />

    <ellipse cx={50} cy={54} rx={16} ry={11} fill={C.cream} stroke={C.ink} strokeWidth={3} />

    {/* Green eyes: the usual colour on a brown tabby, and it brightens the face */}
    <circle cx={38} cy={36} r={10} fill={C.white} stroke={C.ink} strokeWidth={4} />
    <circle cx={62} cy={36} r={10} fill={C.white} stroke={C.ink} strokeWidth={4} />
    <circle cx={39} cy={37} r={6.5} fill={C.leaf} />
    <circle cx={61} cy={37} r={6.5} fill={C.leaf} />
    <circle cx={39} cy={37} r={4} fill={C.ink} />
    <circle cx={61} cy={37} r={4} fill={C.ink} />
    <circle cx={36} cy={34} r={2.2} fill={C.white} />
    <circle cx={58} cy={34} r={2.2} fill={C.white} />

    <polygon points="45,48 55,48 50,55" fill={C.berry} stroke={C.ink} strokeWidth={3} strokeLinejoin="round" />
    <path d="M50,57 Q50,61 44,60 M50,57 Q50,61 56,60" stroke={C.ink} strokeWidth={3} strokeLinecap="round" fill="none" />
    <path d="M26,52 Q16,50 8,53" stroke={C.ink} strokeWidth={3} strokeLinecap="round" fill="none" />
    <path d="M74,52 Q84,50 92,53" stroke={C.ink} strokeWidth={3} strokeLinecap="round" fill="none" />
  </svg>
);

/**
 * Baokaka, drawn from the milestone photos: a big round head with full cheeks, thick black
 * hair that sticks up in soft tufts, dark almond eyes looking straight at you with that calm,
 * slightly serious baby stare, a tiny button nose and a small pouty mouth. He wears the teal
 * romper with wooden buttons from the 11-month photo, arms out, chubby bare legs.
 *
 * Deliberately no toy in his hands. This sprite appears as decor in every hidden-object scene,
 * and a bright hand-held object would be mistaken for a target.
 */
export const Baokaka: Sprite = () => (
  <svg viewBox="0 0 100 100" className="h-full w-full" aria-hidden="true">
    {/* Chubby bare legs */}
    <ellipse cx={39} cy={89} rx={10} ry={7.5} fill={C.paper} stroke={C.ink} strokeWidth={4} />
    <ellipse cx={61} cy={89} rx={10} ry={7.5} fill={C.paper} stroke={C.ink} strokeWidth={4} />

    {/* Short sleeves with hands poking out */}
    <ellipse cx={17} cy={63} rx={14} ry={9} fill={C.teal} stroke={C.ink} strokeWidth={4} transform="rotate(-28 17 63)" />
    <ellipse cx={83} cy={63} rx={14} ry={9} fill={C.teal} stroke={C.ink} strokeWidth={4} transform="rotate(28 83 63)" />
    <circle cx={7} cy={70} r={6} fill={C.paper} stroke={C.ink} strokeWidth={4} />
    <circle cx={93} cy={70} r={6} fill={C.paper} stroke={C.ink} strokeWidth={4} />

    {/* Teal romper */}
    <path
      d="M24,92 C20,74 22,60 38,57 C44,55 56,55 62,57 C78,60 80,74 76,92 Z"
      fill={C.teal}
      stroke={C.ink}
      strokeWidth={4}
      strokeLinejoin="round"
    />
    {/* Front placket with the wooden buttons, the giveaway detail of the real romper */}
    <line x1={50} y1={62} x2={50} y2={90} stroke={C.ink} strokeWidth={2} opacity={0.35} />
    <circle cx={50} cy={68} r={3} fill={C.sandDeep} stroke={C.ink} strokeWidth={2} />
    <circle cx={50} cy={77} r={3} fill={C.sandDeep} stroke={C.ink} strokeWidth={2} />
    <circle cx={50} cy={86} r={3} fill={C.sandDeep} stroke={C.ink} strokeWidth={2} />

    {/* Round chubby head, a little wider than tall */}
    <ellipse cx={50} cy={38} rx={28} ry={26} fill={C.paper} stroke={C.ink} strokeWidth={4} />
    {/* Small ears */}
    <ellipse cx={22.5} cy={41} rx={4} ry={5.5} fill={C.paper} stroke={C.ink} strokeWidth={3} />
    <ellipse cx={77.5} cy={41} rx={4} ry={5.5} fill={C.paper} stroke={C.ink} strokeWidth={3} />

    {/* Thick black hair: a big soft mass with tufts sticking up, and a short uneven fringe.
        No outline: the silhouette is already the darkest shape on the sprite. */}
    <path
      d="M22,38 C20,26 25,16 32,13 C33,6 39,3 43,8 C46,1 54,1 57,8 C61,3 68,5 68,13 C75,16 80,26 78,38
         C75,31 71,29 67,31 C64,26 59,28 56,28 C53,24 47,24 44,28 C41,28 36,26 33,31 C29,29 25,31 22,38 Z"
      fill={C.ink}
    />
    {/* A stray tuft on top, the one that never lies flat */}
    <path d="M50,4 C52,0 57,0 58,4 C55,5 52,5 50,4 Z" fill={C.ink} />

    {/* Full cheeks */}
    <circle cx={29} cy={48} r={5.5} fill={C.berry} opacity={0.7} />
    <circle cx={71} cy={48} r={5.5} fill={C.berry} opacity={0.7} />

    {/* Dark round eyes: open, calm, looking right at you */}
    <ellipse cx={37} cy={42} rx={5} ry={5.2} fill={C.ink} />
    <ellipse cx={63} cy={42} rx={5} ry={5.2} fill={C.ink} />
    <circle cx={35.3} cy={40} r={1.7} fill={C.white} />
    <circle cx={61.3} cy={40} r={1.7} fill={C.white} />
    {/* Faint straight baby brows */}
    <path d="M33,34 Q37,32.8 41,34" stroke={C.ink} strokeWidth={2} strokeLinecap="round" fill="none" opacity={0.3} />
    <path d="M59,34 Q63,32.8 67,34" stroke={C.ink} strokeWidth={2} strokeLinecap="round" fill="none" opacity={0.3} />

    {/* Tiny button nose */}
    <path d="M47.5,50 Q50,52.5 52.5,50" stroke={C.ink} strokeWidth={2.5} strokeLinecap="round" fill="none" />

    {/* Small pursed mouth */}
    <ellipse cx={50} cy={57.5} rx={3.8} ry={2.4} fill={C.berryDeep} stroke={C.ink} strokeWidth={2} />
    <path d="M44,56.5 Q46,57.5 47,57.2" stroke={C.ink} strokeWidth={1.8} strokeLinecap="round" fill="none" opacity={0.6} />
    <path d="M56,56.5 Q54,57.5 53,57.2" stroke={C.ink} strokeWidth={1.8} strokeLinecap="round" fill="none" opacity={0.6} />
  </svg>
);
