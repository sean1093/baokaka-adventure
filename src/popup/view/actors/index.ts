/**
 * Sprite slots for the characters (GDD § 3.5 `view/actors/`): the baked v2 standee frames
 * (#94, `src/popup/sprites/`), each mode mapped to its animation (#95, `animMap.ts`) and moved as
 * a rigid card (`standee.ts`).
 */
export { Baby, babySprite, flipScale, FLIP_MS, WATCH_TILT } from './Baby';
export { Mocha } from './Mocha';
export { Creature } from './Creature';
export * from './animMap';
export * from './standee';
