import assert from "node:assert/strict";
import { test } from "node:test";
import { makeHass, st } from "./hass.mjs";
import { fakeNode, load } from "./load.mjs";

const NOW = new Date(2026, 10, 22, 21, 15).getTime();
const sp = load({ now: NOW });
const { cards } = sp;
const json = (v) => JSON.parse(JSON.stringify(v));

// A card whose shadow root answers every selector with nodes recording their click listeners.
const make = (tag, config, hass = makeHass()) => {
  const card = new cards[tag]();
  card.attachShadow();
  const nodes = {};
  card.shadowRoot.querySelector = (s) => (nodes[s] ||= fakeNode());
  card._nodes = nodes;
  card.setConfig({ type: `custom:${tag}`, ...config });
  card.hass = hass;
  return card;
};
const TEAM = { entity: "sensor.harbor_city" };

test("both cards are registered, with their editors and a picker entry", () => {
  for (const tag of ["sports-card", "sports-mini-card"]) {
    assert.ok(sp.customElements.get(tag), tag);
    assert.ok(sp.customElements.get(`${tag}-editor`), `${tag}-editor`);
  }
  assert.deepEqual(json(sp.window.customCards.map((c) => c.type)), ["sports-card", "sports-mini-card"]);
});

test("discovery: the TeamTracker sensors of the home; the first one as the stub", () => {
  const h = makeHass();
  assert.deepEqual(json(sp.stSensors(h)), ["sensor.harbor_city", "sensor.lakeshore_comets", "sensor.frostport_huskies"]);
  assert.deepEqual(json(cards["sports-card"].getStubConfig(h)), TEAM);
});

test("sport and progress: soccer minutes, quarters and periods counting down", () => {
  assert.equal(sp.stSport("soccer"), "soccer");
  assert.equal(sp.stSport("Football"), "football");
  assert.equal(sp.stSport("basketball"), "basketball");
  assert.equal(sp.stSport("ice hockey"), "hockey");
  assert.equal(sp.stProgress("soccer", "45'+2'", 1), 0.5);
  assert.equal(sp.stProgress("soccer", "120'", 2), 1);
  assert.equal(sp.stProgress("basketball", "6:00", 2), 0.375, "half of Q2: 1.5 quarters of 4");
  assert.equal(sp.stProgress("hockey", "20:00", 1), 0, "a period not started");
  assert.equal(sp.stProgress("golf", "", 1), null);
});

test("the game of a sensor: both sides, the clock, the date; the default tab", () => {
  const g = sp.stGame(makeHass().states["sensor.harbor_city"]);
  assert.equal(g.state, "IN");
  assert.equal(g.team.long, "Harbor City FC");
  assert.equal(g.opp.abbr, "NSR");
  assert.equal(g.team.score, "2");
  assert.ok(Math.abs(g.progress - 67 / 90) < 1e-9);
  assert.equal(sp.stGame(st("sensor.x", "unavailable")).state, "offline");
  const games = ["POST", "PRE", "PRE"].map((s, i) => ({ state: s, date: new Date(NOW + (3 - i) * 3.6e6) }));
  assert.equal(sp.stDefaultTab(games), 2, "the next game to start");
  assert.equal(sp.stDefaultTab([{ state: "PRE" }, { state: "IN" }]), 1, "a live game first");
});

test("live: the scoreboard, the clock, the progress bar, the last play and the details", () => {
  const card = make("sports-card", TEAM);
  assert.equal(card._items.level, "live");
  const html = card.shadowRoot.innerHTML;
  assert.match(html, /class="banner"/);
  assert.match(html, /<div class="title">Harbor City FC<\/div><span class="bpill"[^>]*><span class="bdot"><\/span><span class="bpt">Live · 67&#39;<\/span>/);
  assert.match(html, /<div class="subt">Harbor City 2 – 1 Northside Rovers<\/div>/);
  assert.match(html, /<span class="score">2 – 1<\/span>/);
  assert.match(html, /class="bar" role="progressbar" aria-valuenow="74"/);
  assert.match(html, /Win probability 71 %/);
  assert.match(html, /<div class="lp">Goal! Harbor City FC 2/);
  assert.match(html, /<span class="xl">TV<\/span><span class="xv">SportOne<\/span>/);
  assert.match(html, /Records: 8-3-2 · 6-4-3/);
  assert.match(html, />2 - 1<\/text>/, "the stadium's scoreboard");
  assert.doesNotMatch(html, /class="tabs"/, "one team: no tabs");
});

test("before, after, bye, missing", () => {
  const pre = make("sports-card", TEAM, makeHass({ main: "pre" }));
  assert.equal(pre._items.level, "pre");
  assert.match(pre.shadowRoot.innerHTML, /<span class="bpt">Upcoming<\/span>/);
  assert.match(pre.shadowRoot.innerHTML, /class="mid pre"><span class="vs">vs<\/span><span class="ko">[^<]*8:45/);
  assert.match(pre.shadowRoot.innerHTML, /Odds HCF -0\.5/);
  const post = make("sports-card", TEAM, makeHass({ main: "post" }));
  assert.equal(post._items.level, "won");
  assert.match(post.shadowRoot.innerHTML, /<span class="bpt">Won<\/span>/);
  assert.doesNotMatch(post.shadowRoot.innerHTML, /class="bar"/);
  const bye = make("sports-card", TEAM, makeHass({ main: "bye" }));
  assert.equal(bye._items.level, "bye");
  assert.match(bye.shadowRoot.innerHTML, /Bye week/);
  assert.doesNotMatch(bye.shadowRoot.innerHTML, /class="box sb"/);
  const none = make("sports-card", { entity: "sensor.nothing" }, { ...makeHass(), entities: {}, states: {} });
  assert.equal(none._items.level, "none");
  assert.match(none.shadowRoot.innerHTML, /No TeamTracker sensor found/);
});

test("several teams: one tab each, the live one first; a tab shows its team", () => {
  const card = make("sports-card", { entity: "sensor.lakeshore_comets", entities: ["sensor.harbor_city", "sensor.frostport_huskies"] });
  const m = card._items;
  assert.equal(m.games.length, 3);
  assert.equal(m.tab, 1, "the live game");
  const html = card.shadowRoot.innerHTML;
  assert.equal((html.match(/class="tab( on)?"/g) || []).length, 3);
  assert.match(html, /<div class="title">Sports<\/div>/, "several teams: the card's title");
  const tabs = [0, 1, 2].map((i) => ({ dataset: { tab: String(i) }, addEventListener(_t, fn) { this.fn = fn; } }));
  card.shadowRoot.querySelectorAll = (s) => (s === ".tab" ? tabs : []);
  card._bindAfter(card.shadowRoot);
  tabs[2].fn({ stopPropagation() {} });
  assert.equal(card._items.tab, 2);
  assert.equal(card._items.level, "won", "the hockey team's win");
  assert.match(card.shadowRoot.innerHTML, /North Hockey League/);
});

test("the scoreboard opens the sensor's details", () => {
  const card = make("sports-card", TEAM);
  const events = [];
  card.dispatchEvent = (e) => events.push(e.detail?.entityId);
  card._bindAfter(card.shadowRoot);
  card._nodes[".sb"].listeners.click();
  assert.deepEqual(events, ["sensor.harbor_city"]);
});

test("mini card: the state, the game as a chip, the scoreboard over the stadium, the zoom", () => {
  const card = make("sports-mini-card", TEAM);
  const html = card.shadowRoot.innerHTML;
  assert.match(html, /<ha-card class="lvl-live bn">/);
  assert.match(html, /<div class="msb">.*<span>2 – 1<\/span>/s);
  assert.match(html, /Harbor City 2 – 1 Northside Rovers/);
  card._zoomed = true;
  card._sig = null;
  card._render();
  assert.match(card.shadowRoot.innerHTML, /class="box sb"/);
});

test("crests: the integration's logo when given, else a shield in the team's colours", () => {
  const logo = make("sports-card", TEAM, makeHass({ extra: { "sensor.harbor_city": st("sensor.harbor_city", "PRE", { team_abbr: "AAA", team_name: "A", team_logo: "https://example.com/a.png", opponent_abbr: "BBB", opponent_name: "B" }) } }));
  assert.match(logo.shadowRoot.innerHTML, /<img class="crest" src="https:\/\/example\.com\/a\.png"/);
  assert.match(logo.shadowRoot.innerHTML, /<svg class="crest"[^>]*>.*>BBB<\/text>/s);
});

test("the dark theme darkens the header", () => {
  const card = make("sports-card", TEAM, makeHass({ themes: { darkMode: true } }));
  assert.match(card.shadowRoot.innerHTML, /<ha-card class="lvl-live dk">/);
  assert.match(card.shadowRoot.innerHTML, /class="banner night"/);
});

test("translations: every language has every English key", () => {
  const en = Object.keys(sp.ST_I18N.en);
  for (const [lang, table] of Object.entries(sp.ST_I18N)) assert.deepEqual(en.filter((k) => !(k in table)), [], lang);
  assert.equal(Object.keys(sp.ST_I18N).length, 22);
});

test("the editor writes only what differs from the defaults", () => {
  const ed = new (sp.customElements.get("sports-card-editor"))();
  ed.setConfig({ type: "custom:sports-card" });
  ed.hass = makeHass();
  const form = ed.children[0];
  const names = form.schema.flatMap((s) => (s.schema ? s.schema.map((x) => x.name) : [s.name]));
  for (const n of ["entity", "entities", "show_details", "show_last_play", "illustration_theme", "language"]) assert.ok(names.includes(n), n);
  let out;
  ed.dispatchEvent = (e) => (out = e.detail.config);
  form.listeners["value-changed"]({ detail: { value: { type: "custom:sports-card", show_details: true, entity: "sensor.harbor_city" } } });
  assert.deepEqual(json(out), { type: "custom:sports-card", entity: "sensor.harbor_city" });
});
