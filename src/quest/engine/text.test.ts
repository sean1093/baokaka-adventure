import { describe, expect, test } from 'vitest';
import { freshRun } from './quest';
import { runScene } from './scene';
import { fillStation, substitute } from './text';
import type { MapId, Run } from './types';

/** A run on a station's map (or riding to one); the station maps arrive with the chapters, hence the casts. */
const at = (map: string, rideTo: string | null = null): Run => ({ ...freshRun(1), map: map as MapId, rideTo: rideTo as MapId | null });

describe('substitute', () => {
  test('in a ride car, {station} names the station the ride is heading to, in all three languages', () => {
    const riding = at('carRed', 'station');
    expect(substitute('「下一站，{station}。」', riding)).toBe('「下一站，台北車站。」');
    expect(substitute('「下一站，{stationTw}。」', riding)).toBe('「下一站，台北車頭。」');
    expect(substitute('「Next station, {stationEn}.」', riding)).toBe('「Next station, Taipei Main Station.」');
  });

  test('outside a car it names the station of the current map', () => {
    expect(substitute('{station} / {stationTw} / {stationEn}', at('ntu'))).toBe('公館 / 公館 / Gongguan');
    expect(substitute('{station}{station}', at('xinyi'))).toBe('台北101/世貿台北101/世貿');
  });

  test('with no station to name, or no placeholder, the text is left alone', () => {
    expect(substitute('「下一站，{station}」', freshRun(1))).toBe('「下一站，{station}」');
    expect(substitute('', freshRun(1))).toBe('');
    expect(substitute('{stations} {Station}', at('ntu'))).toBe('{stations} {Station}');
  });

  test('fillStation fills from any station-shaped record', () => {
    expect(fillStation('{station}|{stationTw}|{stationEn}', { name: '甲', nameTw: '乙', nameEn: 'C' })).toBe('甲|乙|C');
  });

  test('runScene shows the substituted line and keeps the step itself when nothing changed', () => {
    const line = { who: null, text: '旁白。' };
    const result = runScene(freshRun(1), { steps: [line], at: 0 });
    expect(result.stop).toEqual({ kind: 'line', line });
    if (result.stop.kind === 'line') expect(result.stop.line).toBe(line);

    const filled = runScene(at('carGreen', 'ntu'), { steps: [{ who: null, text: '下一站，{station}。' }], at: 0 });
    expect(filled.stop).toEqual({ kind: 'line', line: { who: null, text: '下一站，公館。' } });
  });
});
