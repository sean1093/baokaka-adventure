import { describe, expect, test } from 'vitest';
import { CRY_RADIUS } from './baby';
import { EVENT_RADIUS, EVENT_TYPES, isSimEvent, UI_EVENT_TYPES, type SimEvent } from './events';
import { e, n, page, part } from './fixtures/toy';
import { initialState } from './state';
import { cascade, CascadeOverflowError, MAX_CASCADE } from './step';
import type { EventType, PageDef, PartDef, SimState } from './types';

/** A two-node page with the given parts and creatures. */
const toy = (parts: PartDef[], more: Partial<PageDef> = {}) => page({ nodes: [n('A', 0), n('B', 100)], edges: [e('A', 'B')], parts, ...more });

const beepAt = (x: number, y: number, within = 120): SimEvent => ({ type: 'beep', at: [x, y], within });

describe('event names (the single list)', () => {
  test('EVENT_TYPES lists every § 3.2 event once', () => {
    expect(new Set(EVENT_TYPES).size).toBe(EVENT_TYPES.length);
    expect(EVENT_TYPES).toHaveLength(17);
  });

  test('UI events are distinct from § 3.2 events', () => {
    for (const t of UI_EVENT_TYPES) expect(isSimEvent(t)).toBe(false);
    for (const t of EVENT_TYPES) expect(isSimEvent(t)).toBe(true);
  });

  test('default radii follow GDD § 2.4 and § 2.2.5', () => {
    expect(EVENT_RADIUS).toEqual({ beep: 120, wave: 160, wow: 160, sky: Infinity, whoosh: 140, cry: 220 });
    expect(EVENT_RADIUS.cry).toBe(CRY_RADIUS);
  });
});

describe('cascade (§ 3.3 phase 2)', () => {
  test('an event triggers a matching reaction within the radius, measured from the event origin', () => {
    const gate = (id: string, x: number) => part(id, 'gate', x, 0, { react: [{ on: 'beep', to: 'open' }] });
    const def = toy([gate('near', 100), gate('edge', 120), gate('far', 121)]);
    const r = cascade(def, initialState(def), [beepAt(0, 0)]);
    expect(r.state.parts).toEqual({ near: 'open', edge: 'open', far: 'closed' });
    expect(r.events.map((ev) => ev.type)).toEqual(['beep', 'partEnter', 'partEnter']);
    expect(r.events[1]).toEqual({ type: 'partEnter', id: 'near', state: 'open', at: [100, 0] });
  });

  test("a reaction's own `within` replaces the event's radius", () => {
    const def = toy([part('wide', 'gate', 300, 0, { react: [{ on: { type: 'beep', within: 400 }, to: 'open' }] }), part('narrow', 'gate', 50, 0, { react: [{ on: { type: 'beep', within: 40 }, to: 'open' }] })]);
    expect(cascade(def, initialState(def), [beepAt(0, 0)]).state.parts).toEqual({ wide: 'open', narrow: 'closed' });
  });

  test('`id` and `state` narrow which events a reaction hears', () => {
    const lift = part('lift', 'lift', 0, 0, { states: ['B1', '1F'], react: [{ on: { type: 'partEnter', id: 'panel', state: 'down' }, to: 'toggle' }] });
    const def = toy([part('panel', 'button', 0, 0), part('other', 'button', 0, 0), lift]);
    const s = initialState(def);
    expect(cascade(def, s, [{ type: 'partEnter', id: 'other', state: 'down' }]).state.parts.lift).toBe('B1');
    expect(cascade(def, s, [{ type: 'partEnter', id: 'panel', state: 'up' }]).state.parts.lift).toBe('B1');
    expect(cascade(def, s, [{ type: 'partEnter', id: 'panel', state: 'down' }]).state.parts.lift).toBe('1F');
  });

  test('only the first matching reaction of a part fires, and `when` reads the state before the event', () => {
    // A toggling flap written as two reactions: without "state before", the second would undo the first.
    const flap = part('flap', 'flap', 0, 0, {
      react: [
        { on: 'wow', when: { part: 'flap', in: ['closed'] }, to: 'open' },
        { on: 'wow', when: { part: 'flap', in: ['open'] }, to: 'closed' },
      ],
    });
    const def = toy([flap]);
    const once = cascade(def, initialState(def), [{ type: 'wow' }]).state;
    expect(once.parts.flap).toBe('open');
    expect(cascade(def, once, [{ type: 'wow' }]).state.parts.flap).toBe('closed');
  });

  test('`next`, `prev` and `toggle` step through the states, wrapping', () => {
    const lift = (to: string) => part('lift', 'lift', 0, 0, { states: ['f0', 'f1', 'f2'], react: [{ on: 'sky', to }] });
    const run = (to: string, from: string) => {
      const def = toy([lift(to)]);
      const s = initialState(def);
      return cascade(def, { ...s, parts: { lift: from } }, [{ type: 'sky' }]).state.parts.lift;
    };
    expect(run('next', 'f0')).toBe('f1');
    expect(run('next', 'f2')).toBe('f0');
    expect(run('prev', 'f0')).toBe('f2');
    expect(run('prev', 'f2')).toBe('f1');
    expect(run('toggle', 'f0')).toBe('f1');
    expect(run('toggle', 'f2')).toBe('f0');
    expect(run('f2', 'f0')).toBe('f2');
    expect(run('nowhere', 'f0')).toBe('f0');
  });

  test('a part entering a state queues its `emit` events from its origin, with the default radius', () => {
    const reader = part('reader', 'button', 100, 0, { emit: [{ onEnter: 'down', event: 'beep' }, { onEnter: 'up', event: 'wow' }] });
    const gate = part('gate', 'gate', 200, 0, { react: [{ on: 'beep', to: 'open' }] });
    const def = toy([reader, gate]);
    const r = cascade(def, initialState(def), [{ type: 'partEnter', id: 'reader', state: 'down' }]);
    expect(r.events).toEqual([
      { type: 'partEnter', id: 'reader', state: 'down' },
      { type: 'beep', id: 'reader', at: [100, 0], within: 120 },
      { type: 'partEnter', id: 'gate', state: 'open', at: [200, 0] },
    ]);
    expect(r.state.parts.gate).toBe('open');
  });

  test('an emitted event without a default radius reaches the whole page', () => {
    const def = toy([part('bell', 'prop', 0, 0, { states: ['still', 'ring'], emit: [{ onEnter: 'ring', event: 'land' }] }), part('far', 'gate', 5000, 0, { react: [{ on: 'land', to: 'open' }] })]);
    const r = cascade(def, initialState(def), [{ type: 'partEnter', id: 'bell', state: 'ring' }]);
    expect(r.events[1]).toEqual({ type: 'land', id: 'bell', at: [0, 0] });
    expect(r.state.parts.far).toBe('open');
  });

  test('no `partEnter` when a reaction leaves the part where it is; `setFlag` still sets once', () => {
    const def = toy([part('gate', 'gate', 0, 0, { initial: 'open', react: [{ on: 'beep', to: 'open', setFlag: 'beeped' }] })]);
    const r = cascade(def, initialState(def), [beepAt(0, 0), beepAt(0, 0)]);
    expect(r.events.map((ev) => ev.type)).toEqual(['beep', 'beep']);
    expect(r.state.flags).toEqual(['beeped']);
  });

  test('`lockedWhen` and `stateWhen` stop reactions too', () => {
    const def = toy([
      part('locked', 'gate', 0, 0, { lockedWhen: { flag: 'stuck' }, react: [{ on: 'beep', to: 'open' }] }),
      part('jammed', 'gate', 0, 0, { stateWhen: { open: { flag: 'oiled' } }, react: [{ on: 'beep', to: 'open' }] }),
    ]);
    const s = { ...initialState(def), flags: ['stuck'] };
    expect(cascade(def, s, [beepAt(0, 0)]).state.parts).toEqual({ locked: 'closed', jammed: 'closed' });
    expect(cascade(def, { ...s, flags: ['oiled'] }, [beepAt(0, 0)]).state.parts).toEqual({ locked: 'open', jammed: 'open' });
  });

  test("a reaction can put a landed pushable back on its perch (lint rule 7's reversible landing)", () => {
    const def = toy([part('coin', 'pushable', 0, 0, { fall: { path: [], fallTo: 'B' }, react: [{ on: { type: 'catArrive', id: 'shelf' }, when: { landed: 'coin' }, to: 'onPerch' }] })]);
    const s: SimState = { ...initialState(def), pushables: { coin: 'landed' } };
    const r = cascade(def, s, [{ type: 'catArrive', id: 'shelf' }]);
    expect(r.state.pushables.coin).toBe('onPerch');
    expect(r.state.parts).toEqual({});
  });

  test('events without `at` take their subject as the origin: a perch, a part, a creature, a node', () => {
    const near = (id: string, x: number, type: EventType) => part(id, 'gate', x, 0, { react: [{ on: { type, within: 10 }, to: 'open' }] });
    const def = page({
      nodes: [n('A', 0), n('B', 100), n('P', 300), n('C', 400)],
      edges: [],
      parts: [near('byPerch', 300, 'catArrive'), near('byPart', 500, 'partEnter'), near('byCreature', 400, 'wave'), near('byNode', 100, 'babyEnter'), part('src', 'prop', 500, 0, { states: ['a', 'b'] })],
      perches: [{ id: 'perch', node: 'P' }],
      creatures: [{ id: 'crow', positions: { here: 'C' }, initial: 'here', art: 'crow' }],
    });
    const r = cascade(def, initialState(def), [
      { type: 'catArrive', id: 'perch' },
      { type: 'partEnter', id: 'src', state: 'b' },
      { type: 'wave', id: 'crow' },
      { type: 'babyEnter', id: 'B' },
    ]);
    expect(r.state.parts).toEqual({ byPerch: 'open', byPart: 'open', byCreature: 'open', byNode: 'open', src: 'a' });
  });

  test('an event with no origin reaches only reactions without a radius', () => {
    const def = toy([part('anywhere', 'gate', 900, 0, { react: [{ on: 'cry', to: 'open' }] }), part('nearby', 'gate', 0, 0, { react: [{ on: { type: 'cry', within: 50 }, to: 'open' }] })]);
    expect(cascade(def, initialState(def), [{ type: 'cry' }]).state.parts).toEqual({ anywhere: 'open', nearby: 'closed' });
  });

  test('UI events pass through to the log and react with nothing', () => {
    const def = toy([part('gate', 'gate', 0, 0, { react: [{ on: 'beep', to: 'open' }] })]);
    const ui: SimEvent[] = Array.from({ length: MAX_CASCADE + 5 }, () => ({ type: 'bark', bark: 'want' }));
    const r = cascade(def, initialState(def), ui);
    expect(r.events).toHaveLength(MAX_CASCADE + 5);
    expect(r.state.parts.gate).toBe('closed');
  });

  test('more than 32 events throws, naming the page and the looping parts', () => {
    const ping = part('ping', 'prop', 0, 0, { states: ['a', 'b'], react: [{ on: { type: 'partEnter', id: 'pong' }, to: 'next' }] });
    const pong = part('pong', 'prop', 0, 0, { states: ['a', 'b'], react: [{ on: { type: 'partEnter', id: 'ping' }, to: 'next' }] });
    const calm = part('calm', 'gate', 0, 0, { react: [{ on: { type: 'partEnter', id: 'ping', state: 'b' }, to: 'open' }] });
    const def = toy([ping, pong, calm], { id: 'c9p9' });
    const run = () => cascade(def, initialState(def), [{ type: 'partEnter', id: 'ping', state: 'a' }]);
    expect(run).toThrow(CascadeOverflowError);
    expect(run).toThrow("cascade overflow on page 'c9p9': more than 32 events in one cascade; looping parts: ping, pong");
    try {
      run();
    } catch (err) {
      expect((err as CascadeOverflowError).page).toBe('c9p9');
      expect((err as CascadeOverflowError).parts).toEqual(['ping', 'pong']);
    }
  });

  test('looping parts with equal counts are named in id order', () => {
    const zed = part('zed', 'prop', 0, 0, { states: ['a', 'b'], react: [{ on: { type: 'partEnter', id: 'abe' }, to: 'next' }] });
    const abe = part('abe', 'prop', 0, 0, { states: ['a', 'b'], react: [{ on: { type: 'partEnter', id: 'zed' }, to: 'next' }] });
    const def = toy([zed, abe]);
    expect(() => cascade(def, initialState(def), [{ type: 'partEnter', id: 'zed', state: 'a' }, { type: 'partEnter', id: 'abe', state: 'a' }])).toThrow(/looping parts: abe, zed$/);
  });

  test('a reaction on a part with no state in a hand-made state is skipped; built-ins step aside for `{ type }` reactions', () => {
    const def = toy([
      part('gate', 'gate', 0, 0, { react: [{ on: 'beep', to: 'open' }] }),
      part('mill', 'blowable', 0, 0, { states: ['0', '1'], react: [{ on: { type: 'whoosh', id: 'fan' }, to: '1' }] }),
    ]);
    const s = { ...initialState(def), parts: { mill: '0' } };
    const r = cascade(def, s, [beepAt(0, 0), { type: 'whoosh', at: [0, 0], within: 140, facing: 'r' }]);
    expect(r.state.parts).toEqual({ mill: '0' });
  });

  test('exactly 32 events is fine; an overflow with no part looping says so', () => {
    const def = toy([]);
    const beeps = (k: number) => Array.from({ length: k }, () => beepAt(0, 0));
    expect(cascade(def, initialState(def), beeps(MAX_CASCADE)).events).toHaveLength(MAX_CASCADE);
    expect(() => cascade(def, initialState(def), beeps(MAX_CASCADE + 1))).toThrow("cascade overflow on page 'toy': more than 32 events in one cascade; no part changed (a creature or event loop)");
  });

  test('when no part entered a state twice, every part that did is named', () => {
    const chain = Array.from({ length: 40 }, (_, i) =>
      part(`p${String(i).padStart(2, '0')}`, 'gate', 0, 0, i === 0 ? {} : { react: [{ on: { type: 'partEnter', id: `p${String(i - 1).padStart(2, '0')}` }, to: 'open' }] }),
    );
    const def = toy(chain);
    expect(() => cascade(def, initialState(def), [{ type: 'partEnter', id: 'p00', state: 'open' }])).toThrow(/looping parts: p00, p01, .*, p31$/);
  });
});
