// The mock home of the screenshots and animations: TeamTracker sensors for invented teams (no real club, league,
// crest or channel): a football (soccer) team live, before its next game and after a win, and a basketball and a
// hockey team for the tabs. The clock is fixed, so that a capture only changes when the card does.
const st = (entity_id, state, attributes = {}) => ({ entity_id, state, attributes, last_changed: "2026-11-22T00:00:00Z" });

const NOW = new Date(2026, 10, 22, 21, 15).getTime();
const at = (days, hour, minute = 0) => new Date(2026, 10, 22 + days, hour, minute).toISOString();

const TEAMS = {
  hcf: { abbr: "HCF", name: "Harbor City", long: "Harbor City FC", colors: ["1c3f94", "f2c94c"] },
  nsr: { abbr: "NSR", name: "Northside Rovers", long: "Northside Rovers", colors: ["b02a37", "ffffff"] },
  ebu: { abbr: "EBU", name: "Eastbay United", long: "Eastbay United", colors: ["2b8a3e", "ffffff"] },
  vat: { abbr: "VAT", name: "Valley Athletic", long: "Valley Athletic", colors: ["5f3dc4", "ffd43b"] },
  lsc: { abbr: "LSC", name: "Comets", long: "Lakeshore Comets", colors: ["e8590c", "1b1b1b"] },
  rvo: { abbr: "RVO", name: "Owls", long: "Ridgeview Owls", colors: ["495057", "fcc419"] },
  fph: { abbr: "FPH", name: "Huskies", long: "Frostport Huskies", colors: ["1971c2", "e7f5ff"] },
  gbb: { abbr: "GBB", name: "Bears", long: "Granite Bay Bears", colors: ["343a40", "ced4da"] },
};
const side = (k, t, extra = {}) => ({
  [`${k}_abbr`]: t.abbr,
  [`${k}_name`]: t.name,
  [`${k}_long_name`]: t.long,
  [`${k}_colors`]: t.colors,
  [`${k}_logo`]: "",
  ...Object.fromEntries(Object.entries(extra).map(([x, v]) => [`${k}_${x}`, v])),
});

const SOCCER = { sport: "soccer", league: "Premier Division", venue: "Harbor Park", location: "Harbor City", tv_network: "SportOne" };
export const GAMES = {
  live: st("sensor.harbor_city", "IN", {
    ...SOCCER,
    event_name: "Northside Rovers at Harbor City FC",
    date: at(0, 20),
    kickoff_in: "1 hour ago",
    clock: "67'",
    quarter: 2,
    last_play: "Goal! Harbor City FC 2, Northside Rovers 1. A. Moreau (Harbor City FC) right footed shot from the centre of the box.",
    ...side("team", TEAMS.hcf, { score: "2", record: "8-3-2", homeaway: "home", win_probability: 0.71 }),
    ...side("opponent", TEAMS.nsr, { score: "1", record: "6-4-3", homeaway: "away", win_probability: 0.11 }),
  }),
  pre: st("sensor.harbor_city", "PRE", {
    ...SOCCER,
    venue: "Eastbay Stadium",
    location: "Eastbay",
    event_name: "Harbor City FC at Eastbay United",
    date: at(2, 20, 45),
    kickoff_in: "in 2 days",
    odds: "HCF -0.5",
    ...side("team", TEAMS.hcf, { record: "9-3-2", homeaway: "away" }),
    ...side("opponent", TEAMS.ebu, { record: "7-5-2", homeaway: "home" }),
  }),
  post: st("sensor.harbor_city", "POST", {
    ...SOCCER,
    event_name: "Valley Athletic at Harbor City FC",
    date: at(0, 18),
    kickoff_in: "3 hours ago",
    ...side("team", TEAMS.hcf, { score: "3", record: "9-3-2", homeaway: "home", winner: true }),
    ...side("opponent", TEAMS.vat, { score: "0", record: "5-6-3", homeaway: "away", winner: false }),
  }),
  bye: st("sensor.harbor_city", "BYE", { ...side("team", TEAMS.hcf), sport: "soccer", league: "Premier Division" }),
  basketball: st("sensor.lakeshore_comets", "PRE", {
    sport: "basketball",
    league: "City League",
    venue: "Lakeshore Arena",
    location: "Lakeshore",
    tv_network: "HoopsTV",
    date: at(1, 19, 30),
    kickoff_in: "tomorrow",
    ...side("team", TEAMS.lsc, { record: "11-4", homeaway: "home" }),
    ...side("opponent", TEAMS.rvo, { record: "9-6", homeaway: "away" }),
  }),
  hockey: st("sensor.frostport_huskies", "POST", {
    sport: "hockey",
    league: "North Hockey League",
    venue: "Frostport Ice Center",
    location: "Frostport",
    date: at(0, 17),
    ...side("team", TEAMS.fph, { score: "4", record: "12-6-1", homeaway: "away", winner: true }),
    ...side("opponent", TEAMS.gbb, { score: "3", record: "8-9-2", homeaway: "home", winner: false }),
  }),
};

// The page's clock, as script source: window.Date fixed at the mock's time.
export const pageScript = `(() => {
  const N = ${NOW};
  const R = Date;
  window.Date = class extends R {
    constructor(...a) { super(...(a.length ? a : [N])); }
    static now() { return N; }
  };
})();`;

// `scene`: live, pre, post, bye (one team), multi (three teams: the football one live, basketball before, hockey after).
export const setup = (s) => {
  const main = { ...GAMES[s.scene === "multi" ? "live" : s.scene] };
  const states = { [main.entity_id]: main, "sensor.lakeshore_comets": GAMES.basketball, "sensor.frostport_huskies": GAMES.hockey };
  const entities = Object.fromEntries(Object.keys(states).map((id) => [id, { entity_id: id, platform: "teamtracker" }]));
  return {
    hass: { language: "en", locale: { language: "en" }, entities, states },
    config: { entity: main.entity_id, ...(s.scene === "multi" ? { entities: ["sensor.lakeshore_comets", "sensor.frostport_huskies"] } : {}), ...s.config },
    open: s.open,
  };
};
