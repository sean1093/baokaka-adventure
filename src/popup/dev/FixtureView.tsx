import { useMemo } from 'react';
import { POPUP } from '../../art/palette';
import { PAGES } from '../pages';
import { PagePlayer } from '../view/PagePlayer';
import { POPUP_FIXTURES, fixtureFrame, popupFixture } from './fixtures';

/**
 * The visual QA fixtures (#92, `fixtures.ts`) in PageLab.
 *
 * - `FixtureView` (`#/pagelab?fixture=<name>`): the fixture full screen, the game exactly as a
 *   player sees it, with no lab chrome. With `still=1` the clock is held and the frame is drawn at
 *   its tick's end with every animation off (screenshots); without it the page opens playing the
 *   fixture's last tick and runs on from there, so it can be played.
 * - `FixtureIndex` (`#/pagelab?section=fixtures`): every fixture as a link, plus the registered
 *   page ids. `scripts/visual-check.mjs` and `ui-check.mjs` read `[data-popup-fixture]` here, and
 *   `play-check.mjs` reads `[data-popup-page-id]` to insist on a play scenario per page.
 */

export function FixtureView({ name, still }: { name: string; still: boolean }) {
  const fixture = popupFixture(name);
  const frame = useMemo(() => (fixture ? fixtureFrame(fixture) : null), [fixture]);
  if (!fixture || !frame) {
    return (
      <main className="min-h-dvh p-6 font-body text-body" style={{ backgroundColor: POPUP.cover, color: POPUP.goldLight }}>
        <p>No popup fixture named 「{name}」.</p>
        <a href="#/pagelab?section=fixtures" style={{ color: 'inherit' }}>
          All fixtures
        </a>
      </main>
    );
  }
  return (
    <div data-pagelab-fixture={fixture.name}>
      <PagePlayer key={`${fixture.name}-${still}`} def={frame.def} from={frame.state} prev={frame.prev} still={still} />
    </div>
  );
}

export function FixtureIndex() {
  return (
    <section className="flex flex-col gap-4 px-4 pb-10" data-pagelab-fixtures="">
      <p className="max-w-[60ch] text-body">
        Visual QA fixtures (#92): each is a page and a step list replayed through the engine. 「still」 is the screenshot (clock held, no animation); 「live」 opens on the last tick and plays on.
      </p>
      <ul className="flex flex-col gap-3">
        {POPUP_FIXTURES.map((f) => {
          const { state } = fixtureFrame(f);
          return (
            <li key={f.name} data-popup-fixture={f.name} className="flex flex-col gap-1">
              <span className="flex flex-wrap items-center gap-3">
                <code className="text-body">{f.name}</code>
                <a className="inline-flex min-h-[48px] min-w-[48px] items-center" href={`#/pagelab?fixture=${f.name}&still=1`} style={{ color: 'inherit' }}>
                  still
                </a>
                <a className="inline-flex min-h-[48px] min-w-[48px] items-center" href={`#/pagelab?fixture=${f.name}`} style={{ color: 'inherit' }}>
                  live
                </a>
              </span>
              <span className="text-label">
                {f.page} · tick {state.tick} · {state.baby.mode} · {f.note}
              </span>
            </li>
          );
        })}
      </ul>
      <p className="text-label">
        Pages:{' '}
        {PAGES.map((p) => (
          <code key={p.id} data-popup-page-id={p.id} className="mr-2">
            {p.id}
          </code>
        ))}
      </p>
    </section>
  );
}
