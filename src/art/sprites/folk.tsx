import type { Sprite } from '../sprite';
import { C } from '../palette';

/**
 * The folk of Baokaka's town: the third party member (Duck) plus the family and
 * neighbours he can talk to. They share Baokaka's chibi skeleton - a head about as
 * tall as the whole body, feet on the bottom edge, facing the viewer - so they line
 * up when a scene puts them side by side, and they still read when flipped.
 *
 * Two tricks recur. Limbs are one fat C.ink stroke with a thinner coloured stroke on
 * the same path, which gives a round, evenly outlined arm for two lines of markup.
 * Hair sits on an elliptical arc that matches the head exactly (A rx,ry 0 0 1), so a
 * fringe can never balloon past the skull and turn into a hood.
 */

/**
 * Duck, the third party member: a rubber duck standing upright in a sailor cap.
 * Everything about it is round and bright so it reads as a hero, not a foe - big
 * Mocha-Cat eyes, a smiling bill, no points anywhere.
 */
export const Duck: Sprite = () => (
  <svg viewBox="0 0 100 100" className="h-full w-full" aria-hidden="true">
    {/* Webbed feet, drawn first so the belly covers where they join */}
    <path d="M40,82 Q20,86 11,96 L44,96 Z" fill={C.sunDeep} stroke={C.ink} strokeWidth={3.5} strokeLinejoin="round" />
    <path d="M60,82 Q80,86 89,96 L56,96 Z" fill={C.sunDeep} stroke={C.ink} strokeWidth={3.5} strokeLinejoin="round" />

    {/* Body: a sunDeep base under a sun overlay, so the shading only shows along the belly edge */}
    <ellipse cx={50} cy={71} rx={34} ry={23} fill={C.sunDeep} stroke={C.ink} strokeWidth={4} />
    <ellipse cx={50} cy={67} rx={31} ry={19} fill={C.sun} />

    {/* Wings folded against both flanks */}
    <path d="M24,56 Q12,68 20,82 Q30,78 30,62 Z" fill={C.sunDeep} stroke={C.ink} strokeWidth={3} strokeLinejoin="round" />
    <path d="M76,56 Q88,68 80,82 Q70,78 70,62 Z" fill={C.sunDeep} stroke={C.ink} strokeWidth={3} strokeLinejoin="round" />

    <circle cx={50} cy={33} r={26} fill={C.sun} stroke={C.ink} strokeWidth={4} />

    {/* Big round eyes: the friendly marker */}
    <circle cx={38} cy={28} r={9} fill={C.white} stroke={C.ink} strokeWidth={4} />
    <circle cx={62} cy={28} r={9} fill={C.white} stroke={C.ink} strokeWidth={4} />
    <circle cx={38.5} cy={29} r={5} fill={C.ink} />
    <circle cx={62.5} cy={29} r={5} fill={C.ink} />
    <circle cx={35.4} cy={25.4} r={2.3} fill={C.white} />
    <circle cx={59.4} cy={25.4} r={2.3} fill={C.white} />

    {/* Wide smiling bill */}
    <path d="M32,41 Q50,33 68,41 Q62,56 50,56 Q38,56 32,41 Z" fill={C.sunDeep} stroke={C.ink} strokeWidth={3} strokeLinejoin="round" />
    <path d="M38,47 Q50,53 62,47" stroke={C.ink} strokeWidth={2.5} strokeLinecap="round" fill="none" />

    {/* White sailor cap with a sky band, worn at a tilt */}
    <g transform="rotate(-12 50 12)">
      <path d="M29,18 Q29,2 50,2 Q71,2 71,18 Z" fill={C.white} stroke={C.ink} strokeWidth={3.5} strokeLinejoin="round" />
      <path d="M30,13 Q50,9 70,13 L71,18 L29,18 Z" fill={C.sky} />
      <path d="M25,18 Q50,14 75,18 Q50,26 25,18 Z" fill={C.white} stroke={C.ink} strokeWidth={3} strokeLinejoin="round" />
    </g>
  </svg>
);

/** Mom: a young mother in a plum dress and cream apron, black hair in a shoulder-length bob. */
export const Mom: Sprite = () => (
  <svg viewBox="0 0 100 100" className="h-full w-full" aria-hidden="true">
    {/* Hair volume behind the head; it stops above the chin so it never reads as a beard */}
    <ellipse cx={50} cy={33} rx={28} ry={25} fill={C.ink} />

    {/* Shoes, drawn before the skirt so the hem covers where they join */}
    <ellipse cx={38} cy={91} rx={8} ry={5.5} fill={C.mochaDeep} stroke={C.ink} strokeWidth={3} />
    <ellipse cx={62} cy={91} rx={8} ry={5.5} fill={C.mochaDeep} stroke={C.ink} strokeWidth={3} />

    {/* Arms at her sides */}
    <path d="M36,66 Q20,72 15,83" stroke={C.ink} strokeWidth={14} strokeLinecap="round" fill="none" />
    <path d="M64,66 Q80,72 85,83" stroke={C.ink} strokeWidth={14} strokeLinecap="round" fill="none" />
    <path d="M36,66 Q20,72 15,83" stroke={C.plum} strokeWidth={8.5} strokeLinecap="round" fill="none" />
    <path d="M64,66 Q80,72 85,83" stroke={C.plum} strokeWidth={8.5} strokeLinecap="round" fill="none" />
    <circle cx={14} cy={86} r={5.5} fill={C.paper} stroke={C.ink} strokeWidth={3} />
    <circle cx={86} cy={86} r={5.5} fill={C.paper} stroke={C.ink} strokeWidth={3} />

    {/* Plum dress, cream apron, apron straps outlined by a fat ink stroke */}
    <path d="M35,61 Q50,57 65,61 L73,85 Q50,90 27,85 Z" fill={C.plum} stroke={C.ink} strokeWidth={4} strokeLinejoin="round" />
    <path d="M44,67 L47,59 M56,67 L53,59" stroke={C.ink} strokeWidth={6.5} strokeLinecap="round" fill="none" />
    <path d="M44,67 L47,59 M56,67 L53,59" stroke={C.cream} strokeWidth={3.5} strokeLinecap="round" fill="none" />
    <path d="M42,66 L58,66 L62,83 Q50,87 38,83 Z" fill={C.cream} stroke={C.ink} strokeWidth={3} strokeLinejoin="round" />

    <ellipse cx={50} cy={37} rx={25} ry={23.5} fill={C.paper} stroke={C.ink} strokeWidth={4} />
    {/* Fringe on the head's own arc, then a lock down each side of the jaw */}
    <path d="M25,37 A25,23.5 0 0 1 75,37 C71,28 62,25 55,27 C52,22 45,22 42,27 C35,25 28,29 25,37 Z" fill={C.ink} />
    <path d="M30,24 Q17,32 18,54 Q19,68 29,68 Q34,52 33,32 Z" fill={C.ink} />
    <path d="M70,24 Q83,32 82,54 Q81,68 71,68 Q66,52 67,32 Z" fill={C.ink} />

    <circle cx={30} cy={48} r={5} fill={C.berry} opacity={0.6} />
    <circle cx={70} cy={48} r={5} fill={C.berry} opacity={0.6} />

    {/* Gentle open eyes under soft brows */}
    <ellipse cx={38} cy={41} rx={5} ry={5.5} fill={C.ink} />
    <ellipse cx={62} cy={41} rx={5} ry={5.5} fill={C.ink} />
    <circle cx={36.2} cy={38.8} r={1.8} fill={C.white} />
    <circle cx={60.2} cy={38.8} r={1.8} fill={C.white} />
    <path d="M32,34 Q38,32 44,34 M56,34 Q62,32 68,34" stroke={C.ink} strokeWidth={2.2} strokeLinecap="round" fill="none" opacity={0.4} />
    <path d="M48.5,47 Q50,48.5 51.5,47" stroke={C.ink} strokeWidth={2} strokeLinecap="round" fill="none" />
    <path d="M44,52 Q50,58 56,52" stroke={C.ink} strokeWidth={2.8} strokeLinecap="round" fill="none" />
  </svg>
);

/** Dad: round glasses, sleepy half-closed eyes, one hand up scratching his head. */
export const Dad: Sprite = () => (
  <svg viewBox="0 0 100 100" className="h-full w-full" aria-hidden="true">
    <ellipse cx={40} cy={91.5} rx={8.5} ry={4.8} fill={C.ink} />
    <ellipse cx={60} cy={91.5} rx={8.5} ry={4.8} fill={C.ink} />
    <path
      d="M32,73 L68,73 L65,89 L53,89 L50,80 L47,89 L35,89 Z"
      fill={C.mochaDeep}
      stroke={C.ink}
      strokeWidth={4}
      strokeLinejoin="round"
    />

    {/* Left arm hangs; the right one is drawn last, over the hair */}
    <path d="M34,63 Q18,69 15,82" stroke={C.ink} strokeWidth={14} strokeLinecap="round" fill="none" />
    <path d="M34,63 Q18,69 15,82" stroke={C.sky} strokeWidth={8.5} strokeLinecap="round" fill="none" />
    <circle cx={14} cy={85} r={5.5} fill={C.paper} stroke={C.ink} strokeWidth={3} />

    <path d="M34,59 Q50,55 66,59 L70,77 L30,77 Z" fill={C.sky} stroke={C.ink} strokeWidth={4} strokeLinejoin="round" />
    <line x1={50} y1={59} x2={50} y2={77} stroke={C.ink} strokeWidth={2} opacity={0.35} />

    <ellipse cx={50} cy={37} rx={25} ry={23.5} fill={C.paper} stroke={C.ink} strokeWidth={4} />
    {/* Short flat hair, neatly on the head's own arc */}
    <path d="M25,37 A25,23.5 0 0 1 75,37 C71,29 63,25 50,25 C37,25 29,29 25,37 Z" fill={C.ink} />

    {/* Round glasses: tinted lens, then the sleepy lid inside it, then the rim on top */}
    <circle cx={37} cy={41} r={9.5} fill={C.sky} fillOpacity={0.4} />
    <circle cx={63} cy={41} r={9.5} fill={C.sky} fillOpacity={0.4} />
    <path d="M31,40 L43,40 M57,40 L69,40" stroke={C.ink} strokeWidth={3} strokeLinecap="round" fill="none" />
    <path d="M31.5,40 Q37,46 42.5,40 Z" fill={C.ink} />
    <path d="M57.5,40 Q63,46 68.5,40 Z" fill={C.ink} />
    <circle cx={37} cy={41} r={9.5} fill="none" stroke={C.ink} strokeWidth={3} />
    <circle cx={63} cy={41} r={9.5} fill="none" stroke={C.ink} strokeWidth={3} />
    <path d="M46.5,41 L53.5,41 M27.5,41 L25,42 M72.5,41 L75,42" stroke={C.ink} strokeWidth={3} strokeLinecap="round" fill="none" />
    <path d="M44,53 Q50,58 57,52" stroke={C.ink} strokeWidth={2.8} strokeLinecap="round" fill="none" />

    {/* Raised arm, elbow out, hand resting on his hair */}
    <path d="M66,64 Q86,52 74,26" stroke={C.ink} strokeWidth={14} strokeLinecap="round" fill="none" />
    <path d="M66,64 Q86,52 74,26" stroke={C.sky} strokeWidth={8.5} strokeLinecap="round" fill="none" />
    <circle cx={71} cy={21} r={6.5} fill={C.paper} stroke={C.ink} strokeWidth={3} />
  </svg>
);

/** Grandma: grey bun, crinkly closed eyes, leaf cardigan over a paper dress. Shorter and rounder than Mom. */
export const Grandma: Sprite = () => (
  <svg viewBox="0 0 100 100" className="h-full w-full" aria-hidden="true">
    {/* Bun, behind the head; the coil line is what stops it reading as a hat */}
    <circle cx={50} cy={15} r={10} fill={C.grey} stroke={C.ink} strokeWidth={3.5} />
    <path d="M44,17 Q50,9 56,16" stroke={C.ink} strokeWidth={2.2} strokeLinecap="round" fill="none" opacity={0.55} />

    <ellipse cx={38} cy={91.5} rx={8} ry={5} fill={C.mochaDeep} stroke={C.ink} strokeWidth={3} />
    <ellipse cx={62} cy={91.5} rx={8} ry={5} fill={C.mochaDeep} stroke={C.ink} strokeWidth={3} />

    {/* Arms bowed out further than Mom's, which is most of what reads as rounder */}
    <path d="M35,68 Q17,74 14,85" stroke={C.ink} strokeWidth={14} strokeLinecap="round" fill="none" />
    <path d="M65,68 Q83,74 86,85" stroke={C.ink} strokeWidth={14} strokeLinecap="round" fill="none" />
    <path d="M35,68 Q17,74 14,85" stroke={C.leaf} strokeWidth={8.5} strokeLinecap="round" fill="none" />
    <path d="M65,68 Q83,74 86,85" stroke={C.leaf} strokeWidth={8.5} strokeLinecap="round" fill="none" />
    <circle cx={13} cy={87} r={5.5} fill={C.paper} stroke={C.ink} strokeWidth={3} />
    <circle cx={87} cy={87} r={5.5} fill={C.paper} stroke={C.ink} strokeWidth={3} />

    {/* Leaf cardigan with the paper dress showing down the open front */}
    <path d="M35,64 Q50,60 65,64 L76,86 Q50,92 24,86 Z" fill={C.leaf} stroke={C.ink} strokeWidth={4} strokeLinejoin="round" />
    <path d="M43,62 L57,62 L61,88 Q50,90 39,88 Z" fill={C.paper} stroke={C.ink} strokeWidth={3} strokeLinejoin="round" />
    <circle cx={37} cy={72} r={3.6} fill={C.berry} stroke={C.ink} strokeWidth={2} />

    <ellipse cx={50} cy={41} rx={25} ry={23} fill={C.paper} stroke={C.ink} strokeWidth={4} />
    {/* Grey hair swept back; outlined because it is a light colour on a light face */}
    <path
      d="M25,41 A25,23 0 0 1 75,41 C70,32 61,29 50,29 C39,29 30,32 25,41 Z"
      fill={C.grey}
      stroke={C.ink}
      strokeWidth={3}
      strokeLinejoin="round"
    />

    <circle cx={29} cy={53} r={5} fill={C.berry} opacity={0.5} />
    <circle cx={71} cy={53} r={5} fill={C.berry} opacity={0.5} />

    {/* Kind closed eyes, with one laugh crinkle at each outer corner */}
    <path d="M32,47 Q38,40 44,47 M56,47 Q62,40 68,47" stroke={C.ink} strokeWidth={3} strokeLinecap="round" fill="none" />
    <path d="M28,44 L24,42 M72,44 L76,42" stroke={C.ink} strokeWidth={2.2} strokeLinecap="round" fill="none" opacity={0.6} />
    <path d="M48.5,52 Q50,53.5 51.5,52" stroke={C.ink} strokeWidth={2} strokeLinecap="round" fill="none" />
    <path d="M44,57 Q50,63 56,57" stroke={C.ink} strokeWidth={2.8} strokeLinecap="round" fill="none" />
  </svg>
);

/** Kid: the neighbour girl, a head taller than Baokaka. Pigtails on berry ribbons, freckles, a big grin. */
export const Kid: Sprite = () => (
  <svg viewBox="0 0 100 100" className="h-full w-full" aria-hidden="true">
    {/* Pigtails swing clear of the skull, so they read as two tails and not one helmet */}
    <path d="M30,26 Q12,32 9,48 Q9,60 20,57 Q22,42 32,32 Z" fill={C.ink} />
    <path d="M70,26 Q88,32 91,48 Q91,60 80,57 Q78,42 68,32 Z" fill={C.ink} />

    <ellipse cx={40} cy={91.5} rx={8} ry={5} fill={C.berry} stroke={C.ink} strokeWidth={3} />
    <ellipse cx={60} cy={91.5} rx={8} ry={5} fill={C.berry} stroke={C.ink} strokeWidth={3} />
    <path d="M43,79 L42,89 M57,79 L58,89" stroke={C.ink} strokeWidth={12} strokeLinecap="round" fill="none" />
    <path d="M43,79 L42,89 M57,79 L58,89" stroke={C.paper} strokeWidth={7} strokeLinecap="round" fill="none" />

    <path d="M37,62 Q20,68 15,80" stroke={C.ink} strokeWidth={13} strokeLinecap="round" fill="none" />
    <path d="M63,62 Q80,68 85,80" stroke={C.ink} strokeWidth={13} strokeLinecap="round" fill="none" />
    <path d="M37,62 Q20,68 15,80" stroke={C.paper} strokeWidth={7.5} strokeLinecap="round" fill="none" />
    <path d="M63,62 Q80,68 85,80" stroke={C.paper} strokeWidth={7.5} strokeLinecap="round" fill="none" />
    <circle cx={14} cy={82} r={5} fill={C.paper} stroke={C.ink} strokeWidth={3} />
    <circle cx={86} cy={82} r={5} fill={C.paper} stroke={C.ink} strokeWidth={3} />

    {/* Sun dress with a white collar */}
    <path d="M37,57 Q50,53 63,57 L72,80 Q50,85 28,80 Z" fill={C.sun} stroke={C.ink} strokeWidth={4} strokeLinejoin="round" />
    <path d="M40,57 Q50,65 60,57 Q50,53 40,57 Z" fill={C.white} stroke={C.ink} strokeWidth={2.5} strokeLinejoin="round" />

    <ellipse cx={50} cy={32} rx={25} ry={24} fill={C.paper} stroke={C.ink} strokeWidth={4} />
    {/* Hair with a centre part, and the ribbons over each pigtail root */}
    <path d="M25,32 A25,24 0 0 1 75,32 C71,22 63,18 55,20 C53,13 47,13 45,20 C37,18 29,23 25,32 Z" fill={C.ink} />
    <circle cx={29} cy={27} r={4.5} fill={C.berry} stroke={C.ink} strokeWidth={2.5} />
    <circle cx={71} cy={27} r={4.5} fill={C.berry} stroke={C.ink} strokeWidth={2.5} />

    {/* Big shiny eyes */}
    <circle cx={38} cy={33} r={7.5} fill={C.white} stroke={C.ink} strokeWidth={3.5} />
    <circle cx={62} cy={33} r={7.5} fill={C.white} stroke={C.ink} strokeWidth={3.5} />
    <circle cx={38.5} cy={34} r={4.2} fill={C.ink} />
    <circle cx={62.5} cy={34} r={4.2} fill={C.ink} />
    <circle cx={36} cy={31} r={1.9} fill={C.white} />
    <circle cx={60} cy={31} r={1.9} fill={C.white} />

    {/* Freckles */}
    <circle cx={28.5} cy={41} r={1.5} fill={C.mocha} />
    <circle cx={32} cy={43.5} r={1.5} fill={C.mocha} />
    <circle cx={35} cy={45} r={1.5} fill={C.mocha} />
    <circle cx={65} cy={45} r={1.5} fill={C.mocha} />
    <circle cx={68} cy={43.5} r={1.5} fill={C.mocha} />
    <circle cx={71.5} cy={41} r={1.5} fill={C.mocha} />

    {/* Big grin with a band of top teeth */}
    <path d="M37,43 Q50,62 63,43 Z" fill={C.berryDeep} stroke={C.ink} strokeWidth={3} strokeLinejoin="round" />
    <path d="M40,46 L60,46" stroke={C.white} strokeWidth={4} strokeLinecap="round" fill="none" />
  </svg>
);

/** Dog: a white dog sitting, a mocha patch and mocha ear on one side, berry collar, tongue out, tail up. */
export const Dog: Sprite = () => (
  <svg viewBox="0 0 100 100" className="h-full w-full" aria-hidden="true">
    {/* Tail up, behind the body */}
    <path d="M74,74 Q92,66 88,50" stroke={C.ink} strokeWidth={14} strokeLinecap="round" fill="none" />
    <path d="M74,74 Q92,66 88,50" stroke={C.white} strokeWidth={8} strokeLinecap="round" fill="none" />

    {/* Sitting haunches and front paws */}
    <ellipse cx={50} cy={74} rx={26} ry={21} fill={C.white} stroke={C.ink} strokeWidth={4} />
    <ellipse cx={37} cy={90} rx={9} ry={6} fill={C.white} stroke={C.ink} strokeWidth={4} />
    <ellipse cx={63} cy={90} rx={9} ry={6} fill={C.white} stroke={C.ink} strokeWidth={4} />

    {/* Floppy ears; the mocha one is on the same side as the patch */}
    <path d="M30,20 Q11,25 11,45 Q13,55 25,51 Q20,34 32,25 Z" fill={C.mocha} stroke={C.ink} strokeWidth={3.5} strokeLinejoin="round" />
    <path d="M70,20 Q87,25 86,44 Q84,53 75,50 Q80,34 68,25 Z" fill={C.white} stroke={C.ink} strokeWidth={3.5} strokeLinejoin="round" />

    <circle cx={50} cy={38} r={26} fill={C.white} stroke={C.ink} strokeWidth={4} />
    <ellipse cx={38.5} cy={32.5} rx={12.5} ry={11.5} fill={C.mocha} />

    <circle cx={38} cy={34} r={8.5} fill={C.white} stroke={C.ink} strokeWidth={4} />
    <circle cx={62} cy={34} r={8.5} fill={C.white} stroke={C.ink} strokeWidth={4} />
    <circle cx={38.5} cy={35} r={4.8} fill={C.ink} />
    <circle cx={62.5} cy={35} r={4.8} fill={C.ink} />
    <circle cx={35.4} cy={31.6} r={2.2} fill={C.white} />
    <circle cx={59.4} cy={31.6} r={2.2} fill={C.white} />

    {/* Muzzle, nose, and the tongue hanging past the lip */}
    <ellipse cx={50} cy={52} rx={16} ry={11.5} fill={C.cream} stroke={C.ink} strokeWidth={3} />
    <ellipse cx={50} cy={45} rx={5.5} ry={4} fill={C.ink} />
    <path d="M50,49 Q50,55 43,53 M50,49 Q50,55 57,53" stroke={C.ink} strokeWidth={3} strokeLinecap="round" fill="none" />
    <path d="M45,55 Q50,53 55,55 Q55,67 50,67 Q45,67 45,55 Z" fill={C.berry} stroke={C.ink} strokeWidth={2.5} strokeLinejoin="round" />

    {/* Berry collar with a little tag */}
    <path d="M27,64 Q50,77 73,64" stroke={C.ink} strokeWidth={11} strokeLinecap="round" fill="none" />
    <path d="M27,64 Q50,77 73,64" stroke={C.berry} strokeWidth={6.5} strokeLinecap="round" fill="none" />
    <circle cx={50} cy={75} r={4.2} fill={C.sun} stroke={C.ink} strokeWidth={2} />
  </svg>
);
