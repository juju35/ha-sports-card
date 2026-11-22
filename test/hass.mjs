// A mock Home Assistant with TeamTracker sensors for invented teams: the screenshots' games (live, before, after,
// bye, a basketball and a hockey team), and a sensor in a given state for the tests that need one.
import { GAMES } from "../scripts/screenshots/mock.mjs";

export const st = (entity_id, state, attributes = {}) => ({ entity_id, state, attributes, last_changed: "2026-11-22T00:00:00Z" });

export const makeHass = ({ main = "live", extra = {}, ...overrides } = {}) => {
  const states = { "sensor.harbor_city": GAMES[main], "sensor.lakeshore_comets": GAMES.basketball, "sensor.frostport_huskies": GAMES.hockey, ...extra };
  return {
    language: "en",
    locale: { language: "en" },
    themes: { darkMode: false },
    entities: Object.fromEntries(Object.keys(states).map((id) => [id, { platform: "teamtracker" }])),
    states,
    ...overrides,
  };
};
