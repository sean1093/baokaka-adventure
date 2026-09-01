import type { Sprite } from '../sprite';
import { C } from '../palette';

/**
 * 摩卡貓：褐色虎斑貓。虎斑的三個辨識點都畫出來——
 * 額頭的 M 字紋、身側的直條紋、尾巴的環紋——否則在小尺寸下只會像一隻棕色的貓。
 */
export const MochaCat: Sprite = () => (
  <svg viewBox="0 0 100 100" className="h-full w-full" aria-hidden="true">
    {/* 尾巴，從右側捲上來 */}
    <path
      d="M64,86 C90,86 98,60 88,42 C82,32 68,30 62,40 C58,47 64,52 70,50 C78,47 82,55 78,64 C74,74 66,78 58,76 Z"
      fill={C.mocha}
      stroke={C.ink}
      strokeWidth={4}
      strokeLinejoin="round"
    />
    {/* 尾巴環紋：與尾巴走向垂直，才讀得出是「一圈一圈」 */}
    <path d="M76,77 L85,70" stroke={C.mochaDeep} strokeWidth={5} strokeLinecap="round" fill="none" />
    <path d="M79,61 L87,55" stroke={C.mochaDeep} strokeWidth={5} strokeLinecap="round" fill="none" />
    <path d="M73,36 L71,47" stroke={C.mochaDeep} strokeWidth={5} strokeLinecap="round" fill="none" />

    {/* 坐姿的後半身 */}
    <path
      d="M22,90 C18,74 18,64 34,59 C40,56 60,56 66,59 C82,64 82,74 78,90 Z"
      fill={C.mocha}
      stroke={C.ink}
      strokeWidth={4}
      strokeLinejoin="round"
    />
    {/* 身側的鯖魚紋 */}
    <path d="M27,64 Q24,72 26,80" stroke={C.mochaDeep} strokeWidth={5} strokeLinecap="round" fill="none" />
    <path d="M35,61 Q32,70 34,78" stroke={C.mochaDeep} strokeWidth={5} strokeLinecap="round" fill="none" />
    <path d="M73,64 Q76,72 74,80" stroke={C.mochaDeep} strokeWidth={5} strokeLinecap="round" fill="none" />
    <path d="M65,61 Q68,70 66,78" stroke={C.mochaDeep} strokeWidth={5} strokeLinecap="round" fill="none" />

    <ellipse cx={50} cy={76} rx={13} ry={14} fill={C.cream} stroke={C.ink} strokeWidth={3} />
    <ellipse cx={39} cy={89} rx={9} ry={7} fill={C.mocha} stroke={C.ink} strokeWidth={4} />
    <ellipse cx={61} cy={89} rx={9} ry={7} fill={C.mocha} stroke={C.ink} strokeWidth={4} />

    {/* 耳朵從圓頭後面露出來 */}
    <polygon points="20,3 46,30 26,38" fill={C.mocha} stroke={C.ink} strokeWidth={4} strokeLinejoin="round" />
    <polygon points="80,3 54,30 74,38" fill={C.mocha} stroke={C.ink} strokeWidth={4} strokeLinejoin="round" />
    <circle cx={50} cy={42} r={27} fill={C.mocha} stroke={C.ink} strokeWidth={4} />

    {/* 額頭的 M 字紋，虎斑貓最關鍵的辨識特徵 */}
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

    {/* 綠眼睛：褐虎斑最常見的眼色，也讓臉更有精神 */}
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
