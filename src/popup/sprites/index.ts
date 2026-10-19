/**
 * Character sprites (#94): the baked standee frames, their manifest, the loader and the player.
 * Bake with `npm run sync:sprites` (`scripts/sync-sprites.ts`); see D-56.
 */
export { SpriteAnim, spriteHead, FLOOR_NUDGE, type SpriteAnimProps } from './SpriteAnim';
export { eventsBetween, frameAt, frameOfStep, manualClock, rafClock, spriteClock, stepAt, type SpriteClock } from './clock';
export { deviceScale, floorUrl, frameUrl, groupSprites, pageSprites, payloadBytes, spriteDef, spriteLoader, spriteUrls, useFramesReady, usePagePreload, useSpritesPreload, SpriteLoader } from './loader';
export { fromAnchor, framePoint, isMirrored, pickScale, spriteTransform, toPage, validateManifest, type Facing, type Scale, type SpriteDef, type SpriteManifest } from './manifest';
export { SPRITE_IDS, SPRITE_MANIFEST, type SpriteId } from './sprites.gen';
