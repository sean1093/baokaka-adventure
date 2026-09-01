import type { Sprite } from '../sprite';
import { C } from '../palette';

export const MochaCat: Sprite = () => (
  <svg viewBox="0 0 100 100" className="h-full w-full" aria-hidden="true">
    {/* tail, curling up from the right */}
    <path
      d="M64,86 C90,86 98,60 88,42 C82,32 68,30 62,40 C58,47 64,52 70,50 C78,47 82,55 78,64 C74,74 66,78 58,76 Z"
      fill={C.mocha}
      stroke={C.ink}
      strokeWidth={4}
      strokeLinejoin="round"
    />
    <path d="M84,78 L92,66" stroke={C.mochaDeep} strokeWidth={5} strokeLinecap="round" fill="none" />
    <path d="M90,52 L80,40" stroke={C.mochaDeep} strokeWidth={5} strokeLinecap="round" fill="none" />
    <path d="M72,35 L62,44" stroke={C.mochaDeep} strokeWidth={5} strokeLinecap="round" fill="none" />

    {/* haunches, sitting */}
    <path
      d="M22,90 C18,74 18,64 34,59 C40,56 60,56 66,59 C82,64 82,74 78,90 Z"
      fill={C.mocha}
      stroke={C.ink}
      strokeWidth={4}
      strokeLinejoin="round"
    />
    <ellipse cx={50} cy={76} rx={13} ry={14} fill={C.cream} stroke={C.ink} strokeWidth={3} />
    <ellipse cx={39} cy={89} rx={9} ry={7} fill={C.mocha} stroke={C.ink} strokeWidth={4} />
    <ellipse cx={61} cy={89} rx={9} ry={7} fill={C.mocha} stroke={C.ink} strokeWidth={4} />

    {/* ears peek out from behind the round head */}
    <polygon points="20,3 46,30 26,38" fill={C.mocha} stroke={C.ink} strokeWidth={4} strokeLinejoin="round" />
    <polygon points="80,3 54,30 74,38" fill={C.mocha} stroke={C.ink} strokeWidth={4} strokeLinejoin="round" />
    <circle cx={50} cy={42} r={27} fill={C.mocha} stroke={C.ink} strokeWidth={4} />
    <path d="M40,20 Q36,26 34,32" stroke={C.mochaDeep} strokeWidth={5} strokeLinecap="round" fill="none" />
    <path d="M60,20 Q64,26 66,32" stroke={C.mochaDeep} strokeWidth={5} strokeLinecap="round" fill="none" />
    <ellipse cx={50} cy={54} rx={16} ry={11} fill={C.cream} stroke={C.ink} strokeWidth={3} />

    {/* big friendly eyes */}
    <circle cx={38} cy={36} r={10} fill={C.white} stroke={C.ink} strokeWidth={4} />
    <circle cx={62} cy={36} r={10} fill={C.white} stroke={C.ink} strokeWidth={4} />
    <circle cx={39} cy={38} r={5.5} fill={C.ink} />
    <circle cx={61} cy={38} r={5.5} fill={C.ink} />
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
