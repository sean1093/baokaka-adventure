import type { ComponentType } from 'react';
import type { PartPreset } from '../../core/types';
import type { PartViewProps } from './common';
import { FlapView } from './FlapView';
import { CarrierView, LiftView, PushableView, type MoverProps } from './MoverView';
import { GateView, LightView, LoopView, PropView, StateArtView } from './StateArtView';
import { TabView } from './TabView';
import { WheelView } from './WheelView';

/**
 * One view per GDD § 2.1 part preset (GDD § 3.5 `view/parts/`). Each draws the registry's art for
 * the part's key (the preset's kit art until baked bitmaps land, #96) and moves it with transforms
 * only. Movers also need the page and both states to find where their state puts them.
 */
export const PART_VIEWS: Readonly<Record<PartPreset, ComponentType<PartViewProps> | ComponentType<MoverProps>>> = {
  tab: TabView,
  slider: TabView,
  wheel: WheelView,
  section: WheelView,
  flap: FlapView,
  gate: GateView,
  button: GateView,
  light: LightView,
  blowable: LightView,
  loop: LoopView,
  prop: PropView,
  lift: LiftView,
  pushable: PushableView,
  carrier: CarrierView,
};

/**
 * The view for a part: its preset's, except a tab or slider nobody drives (`input: 'none'`, 3-2's
 * shoved bike and 3-5's inner shelves, #116), which is printed art per state (no marigold knob:
 * bible § 4, only touchables are marigold).
 */
export function partView(part: { preset: PartPreset; input?: string }): ComponentType<PartViewProps> | ComponentType<MoverProps> {
  return (part.preset === 'tab' || part.preset === 'slider') && part.input === 'none' ? StateArtView : PART_VIEWS[part.preset];
}

/** Presets whose view needs `MoverProps`. */
export const MOVERS: ReadonlySet<PartPreset> = new Set<PartPreset>(['lift', 'pushable', 'carrier']);

export type { PartViewProps } from './common';
export type { MoverProps } from './MoverView';
export { CarriageView } from './CarriageView';
