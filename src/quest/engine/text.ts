import { currentStation, type Station } from './mrt';
import type { Run } from './types';

/** The placeholders a script line may use, and the station field each one reads. */
export const STATION_PLACEHOLDERS: Readonly<Record<string, keyof Pick<Station, 'name' | 'nameTw' | 'nameEn'>>> = {
  '{station}': 'name',
  '{stationTw}': 'nameTw',
  '{stationEn}': 'nameEn',
};

const PLACEHOLDER = /\{station(?:Tw|En)?\}/g;

/** Fills the station placeholders from one station (validate.ts uses it with the longest names). */
export function fillStation(text: string, station: Pick<Station, 'name' | 'nameTw' | 'nameEn'>): string {
  return text.replace(PLACEHOLDER, (token) => station[STATION_PLACEHOLDERS[token]]);
}

/**
 * Fills placeholders in a script line before it is shown. Every `Line.text` (and a choice's
 * prompt) passes through here in `runScene`. `{station}`, `{stationTw}` and `{stationEn}` name
 * the 月亮線 station the ride is heading to while in a car (`run.rideTo`), else the station of
 * the current map. With no station to name, the text is left as written. Pure.
 */
export function substitute(text: string, run: Pick<Run, 'map' | 'rideTo'>): string {
  if (!text.includes('{station')) return text;
  const station = currentStation(run);
  return station ? fillStation(text, station) : text;
}
