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

export const Baokaka: Sprite = () => (
  <svg viewBox="0 0 100 100" className="h-full w-full" aria-hidden="true">
    <ellipse cx={17} cy={60} rx={15} ry={9} fill={C.sky} stroke={C.ink} strokeWidth={4} transform="rotate(-30 17 60)" />
    <ellipse cx={83} cy={60} rx={15} ry={9} fill={C.sky} stroke={C.ink} strokeWidth={4} transform="rotate(30 83 60)" />
    <path
      d="M22,90 C18,72 20,60 38,56 C44,54 56,54 62,56 C80,60 82,72 78,90 Z"
      fill={C.sky}
      stroke={C.ink}
      strokeWidth={4}
      strokeLinejoin="round"
    />
    <ellipse cx={40} cy={90} rx={9} ry={7} fill={C.paper} stroke={C.ink} strokeWidth={4} />
    <ellipse cx={60} cy={90} rx={9} ry={7} fill={C.paper} stroke={C.ink} strokeWidth={4} />

    <circle cx={50} cy={37} r={26} fill={C.paper} stroke={C.ink} strokeWidth={4} />
    <path
      d="M46,15 C41,5 58,1 62,9 C64,15 54,18 46,15 Z"
      fill={C.mochaDeep}
      stroke={C.ink}
      strokeWidth={4}
      strokeLinejoin="round"
    />
    <circle cx={30} cy={44} r={6} fill={C.berry} />
    <circle cx={70} cy={44} r={6} fill={C.berry} />
    <circle cx={40} cy={36} r={5} fill={C.ink} />
    <circle cx={60} cy={36} r={5} fill={C.ink} />
    <path d="M40,48 Q50,56 60,48" stroke={C.ink} strokeWidth={4} strokeLinecap="round" fill="none" />
  </svg>
);
