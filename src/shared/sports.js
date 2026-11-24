// ── Sports ───────────────────────────────────────────────────────────────────
// A team is a TeamTracker sensor: its state is the game's (PRE before, IN during, POST after, BYE, NOT_FOUND), its
// attributes the game itself: the two teams (name, abbreviation, logo, colours, score, record, winner), the clock and
// the period, the league, the venue, the TV network, the date, the last play. One sensor follows one team; several
// sensors (`entities`) are several teams, one tab each.
export const ST_PLATFORM = "teamtracker";
export const ST_STATES = ["PRE", "IN", "POST", "BYE", "NOT_FOUND"];

// The TeamTracker sensors of the home, in registry order.
export const stSensors = (hass) =>
  Object.keys(hass.entities || {}).filter((id) => id.startsWith("sensor.") && hass.entities[id].platform === ST_PLATFORM);

export const stNum = (v) => (v == null || v === "" || !Number.isFinite(Number(v)) ? null : Number(v));

// The sport, brought down to the families the card knows (their periods and the icon).
export const stSport = (s) => {
  const n = String(s || "").toLowerCase();
  if (/soccer|football \(soccer\)/.test(n)) return "soccer";
  if (/basketball/.test(n)) return "basketball";
  if (/hockey/.test(n)) return "hockey";
  if (/baseball|softball/.test(n)) return "baseball";
  if (/football/.test(n)) return "football";
  for (const k of ["tennis", "golf", "racing", "mma", "volleyball", "cricket", "rugby"]) if (n.includes(k)) return k;
  return "other";
};

// How far the game has gone (0–1) from its clock and period: football's soccer minutes ("67'", "45'+2'") against 90,
// the quarters or periods of the other team sports with their clock counting down; null when unknown.
export const ST_PERIODS = { football: [4, 15], basketball: [4, 12], hockey: [3, 20], rugby: [2, 40] };
export const stProgress = (sport, clock, period) => {
  const c = String(clock ?? "");
  if (sport === "soccer") {
    const m = c.match(/^(\d+)/);
    return m ? Math.min(1, Number(m[1]) / 90) : null;
  }
  const p = ST_PERIODS[sport];
  const q = stNum(period);
  if (!p || q == null) return null;
  const t = c.match(/^(\d+):(\d+)/);
  const left = t ? Math.min(1, (Number(t[1]) + Number(t[2]) / 60) / p[1]) : 0.5;
  return Math.min(1, Math.max(0, (Math.min(q, p[0]) - left) / p[0]));
};

// The game of a TeamTracker sensor.
export const stGame = (st) => {
  const a = st?.attributes || {};
  const side = (k) => ({
    name: a[`${k}_name`] || a[`${k}_long_name`] || a[`${k}_abbr`] || "",
    long: a[`${k}_long_name`] || a[`${k}_name`] || a[`${k}_abbr`] || "",
    abbr: a[`${k}_abbr`] || "",
    logo: a[`${k}_logo`] || "",
    colors: Array.isArray(a[`${k}_colors`]) ? a[`${k}_colors`] : [],
    score: a[`${k}_score`] ?? null,
    record: a[`${k}_record`] || "",
    rank: a[`${k}_rank`] ?? null,
    winner: a[`${k}_winner`] ?? null,
    home: a[`${k}_homeaway`] === "home",
    prob: stNum(a[`${k}_win_probability`]),
  });
  const sport = stSport(a.sport);
  const date = a.date ? new Date(a.date) : null;
  return {
    id: st?.entity_id,
    state: !st || ["unavailable", "unknown"].includes(st.state) ? "offline" : ST_STATES.includes(st.state) ? st.state : "offline",
    sport,
    league: a.league || "",
    event: a.event_name || "",
    team: side("team"),
    opp: side("opponent"),
    clock: a.clock ?? "",
    period: a.quarter ?? null,
    progress: st?.state === "IN" ? stProgress(sport, a.clock, a.quarter) : null,
    date: date && !Number.isNaN(date.getTime()) ? date : null,
    kickoff: a.kickoff_in || "",
    venue: a.venue || "",
    location: a.location || "",
    tv: a.tv_network || "",
    odds: a.odds || "",
    last: a.last_play || "",
    series: a.series_summary || "",
  };
};

// The tab shown first among several teams: a live game, else the next one to start, else the first.
export const stDefaultTab = (games) => {
  const live = games.findIndex((g) => g.state === "IN");
  if (live >= 0) return live;
  let best = -1;
  games.forEach((g, i) => {
    if (g.state === "PRE" && g.date && (best < 0 || g.date < games[best].date)) best = i;
  });
  return Math.max(best, 0);
};

// The Intl formats, made once per language and options.
export const stIntlCache = new Map();
export const stIntl = (Kind, lang, opts) => {
  const key = `${Kind.name}|${lang}|${JSON.stringify(opts)}`;
  if (!stIntlCache.has(key)) stIntlCache.set(key, new Kind(lang, opts));
  return stIntlCache.get(key);
};
