import { ACCENTS, EYES, LIGHTS, LINE } from './palette';

/**
 * Shared gradients (art direction § 8.2 rule 6), mounted once at the App root. Sprites reference
 * them by these stable ids (`fill={artUrl('irisBrown')}`) instead of each defining its own, which
 * keeps sprites small and ids unique.
 *
 * All gradients use `objectBoundingBox` units, so one definition fits any ellipse it fills.
 */
export const ART_DEFS = {
  /** Brown iris, dark top → mid → warm bottom (§ 2.5) */
  irisBrown: 'art-iris-brown',
  /** Cat iris, green-gold */
  irisCat: 'art-iris-cat',
  /** Blush: a soft radial falloff */
  blush: 'art-blush',
  /** Contact shadow under a figure */
  contact: 'art-contact',
  /** Lamp bloom: core → mid → transparent */
  bloom: 'art-bloom',
} as const;

export type ArtDefName = keyof typeof ART_DEFS;

/** `url(#…)` for a shared gradient. */
export const artUrl = (name: ArtDefName): string => `url(#${ART_DEFS[name]})`;

/**
 * The shared `<defs>`. A 0×0 absolutely positioned SVG, **not** `display: none`: browsers skip
 * gradients inside an undisplayed SVG, and every sprite that points at them would paint nothing.
 */
export const ArtDefs = () => (
  <svg aria-hidden="true" focusable="false" width="0" height="0" style={{ position: 'absolute', width: 0, height: 0, overflow: 'hidden' }} data-art-defs="">
    <defs>
      <linearGradient id={ART_DEFS.irisBrown} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor={EYES.brown[0]} />
        <stop offset="0.45" stopColor={EYES.brown[1]} />
        <stop offset="1" stopColor={EYES.brown[2]} />
      </linearGradient>
      <linearGradient id={ART_DEFS.irisCat} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor={EYES.cat[0]} />
        <stop offset="0.45" stopColor={EYES.cat[1]} />
        <stop offset="1" stopColor={EYES.cat[2]} />
      </linearGradient>
      <radialGradient id={ART_DEFS.blush} cx="0.5" cy="0.5" r="0.5">
        <stop offset="0" stopColor={ACCENTS.blush} stopOpacity="0.6" />
        <stop offset="1" stopColor={ACCENTS.blush} stopOpacity="0" />
      </radialGradient>
      <radialGradient id={ART_DEFS.contact} cx="0.5" cy="0.5" r="0.5">
        <stop offset="0" stopColor={LINE.contactShadow} stopOpacity="0.45" />
        <stop offset="1" stopColor={LINE.contactShadow} stopOpacity="0" />
      </radialGradient>
      <radialGradient id={ART_DEFS.bloom} cx="0.5" cy="0.5" r="0.5">
        <stop offset="0" stopColor={LIGHTS.lampCore} stopOpacity="0.9" />
        <stop offset="0.45" stopColor={LIGHTS.lampMid} stopOpacity="0.45" />
        <stop offset="1" stopColor={LIGHTS.lampMid} stopOpacity="0" />
      </radialGradient>
    </defs>
  </svg>
);
