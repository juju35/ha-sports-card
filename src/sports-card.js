/**
 * sports-card / sports-mini-card: your teams' games from TeamTracker. The live game as a scoreboard (crests, score,
 * clock, how far the game has gone, the last play), the next game before kick-off, the result after; one tab per team.
 * https://github.com/juju35/ha-sports-card
 */

// The badge's icon of each sport.
const ST_ICONS = {
  soccer: "mdi:soccer",
  football: "mdi:football",
  basketball: "mdi:basketball",
  hockey: "mdi:hockey-puck",
  baseball: "mdi:baseball",
  tennis: "mdi:tennis",
  golf: "mdi:golf",
  racing: "mdi:flag-checkered",
  mma: "mdi:boxing-glove",
  volleyball: "mdi:volleyball",
  cricket: "mdi:cricket",
  rugby: "mdi:rugby",
  other: "mdi:scoreboard",
};
// One loop of the live animation (s): the scoreboard's frame glows and the live dot blinks.
const ST_LOOP = 2.4;

// A team's colour: its own (TeamTracker gives two, with or without "#"), else one drawn from its name.
const stColor = (team, i = 0) => {
  const c = team.colors[i];
  if (c && /^#?[0-9a-f]{6}$/i.test(String(c))) return String(c).startsWith("#") ? c : `#${c}`;
  if (i) return "#ffffff";
  let h = 0;
  for (const ch of team.name || team.abbr || "?") h = (h * 31 + ch.charCodeAt(0)) % 360;
  return `hsl(${h} 55% 38%)`;
};

// A team's crest: its logo when the integration gives one, else a shield in its colours with its abbreviation.
const stCrest = (team, size) =>
  team.logo
    ? `<img class="crest" src="${rcEsc(team.logo)}" alt="" width="${size}" height="${size}" loading="lazy" referrerpolicy="no-referrer">`
    : `<svg class="crest" width="${size}" height="${size}" viewBox="0 0 40 40" aria-hidden="true"><path d="M20 2 L35 7 V19 C35 29 28 35 20 38 C12 35 5 29 5 19 V7 Z" fill="${stColor(team)}" stroke="#fff" stroke-width="1.5"/><path d="M5 17 H35 V22 H5 Z" fill="${stColor(team, 1)}" opacity=".9"/><text x="20" y="32" text-anchor="middle" font-family="Roboto,sans-serif" font-size="7.5" font-weight="700" fill="#fff">${rcEsc((team.abbr || team.name).slice(0, 4).toUpperCase())}</text></svg>`;

// ── Banner ───────────────────────────────────────────────────────────────────
// The illustrated header's scene: 200 × 80, drawn to the banner's right edge. A stadium: its stands full of fans, two
// floodlights, the scoreboard over the stands with `sign` (the score, or "vs"), the pitch with its lines. By night
// (the dark theme) the sky darkens; while the game is live the floodlights shine and the scoreboard's frame glows.
const stScene = ({ night, live, sign, animate }) => {
  const stand = night ? "#1d2c42" : "#2f4a6d";
  const fans = ["#ffffff", "#f2c94c", "#74c0fc"];
  const seats = Array.from({ length: 24 }, (_, i) => `<rect x="${30 + i * 6}" y="${40 + (i % 3)}" width="4" height="3" rx="1" fill="${fans[i % 3]}" opacity="${night ? 0.7 : 0.9}"/>`).join("");
  const beam = (x) =>
    `<g><rect x="${x}" y="6" width="2" height="40" fill="#8aa0b8"/><rect x="${x - 6}" y="2" width="14" height="7" rx="1" fill="${live ? "#fffbe6" : "#c9d4e2"}"/>${live ? `<path d="M${x - 6} 9 L${x - 26} 64 L${x + 28} 64 L${x + 8} 9Z" fill="#fff9db" opacity="${night ? 0.16 : 0.1}"/>` : ""}</g>`;
  const glow = live && animate ? `<animate attributeName="stroke-opacity" values="1;.25;1" dur="${ST_LOOP}s" repeatCount="indefinite"/>` : "";
  return `<path d="M20 52 L40 34 H180 L200 52 Z" fill="${stand}"/>${seats}${beam(70)}${beam(182)}
    <rect class="sign" x="86" y="15" width="48" height="19" rx="2" fill="#0b1626" stroke="${live ? "#4dabf7" : "#53627a"}">${glow}</rect>
    <text x="110" y="28.5" text-anchor="middle" font-family="Roboto,sans-serif" font-size="10.5" font-weight="700" fill="#ffd43b">${rcEsc(sign)}</text>
    <path d="M0 60 H200 V80 H0Z" fill="${night ? "#2a6b33" : "#3c9a3c"}"/><path d="M100 60 V80 M56 80 Q100 62 144 80" stroke="#fff" stroke-width="1" fill="none" opacity=".7"/>`;
};

// The status pill's place, decided by measurement after each render and each new width (the same rule on every
// card): on the title row, right after the title, only when the whole title and the pill's whole label fit there;
// otherwise on its own line under the subtitle (clamped to one line). When the label is still cut there, or the text
// block leaves the banner or runs over its ground strip, the pill keeps its dot alone, on the title row (its label
// stays in title and aria-label). A card of 200 px or less shows the dot alone anyway (CSS), beside the title.
const stPlacePill = (head, row, ground) => {
  if (!head) return;
  head.removeAttribute("data-wrap");
  head.removeAttribute("data-dot");
  const pill = row.querySelector(":scope > .bpill, :scope > .pill");
  const text = pill?.querySelector(".bpt, .pt");
  if (!text?.getBoundingClientRect || text.getBoundingClientRect().width <= 1) return;
  const name = row.querySelector(".title");
  const gap = parseFloat(getComputedStyle(row).columnGap) || 0;
  const title = name ? (name.scrollWidth > name.clientWidth ? name.scrollWidth : name.getBoundingClientRect().width) + gap : 0;
  if (title + pill.getBoundingClientRect().width <= row.getBoundingClientRect().width + 0.5) return;
  head.setAttribute("data-wrap", "");
  const box = row.parentElement.getBoundingClientRect();
  const frame = head.getBoundingClientRect();
  const out = ground && (box.bottom > ground.getBoundingClientRect().top + 0.5 || box.top < frame.top - 0.5);
  if (text.scrollWidth > text.clientWidth + 0.5 || out) {
    head.removeAttribute("data-wrap");
    head.setAttribute("data-dot", "");
  }
};

// ── Card ─────────────────────────────────────────────────────────────────────
class SportsCard extends RcCard {
  static tag = "sports-card";
  static i18n = ST_I18N;
  static defaults = { illustration: true, illustration_theme: "auto", show_subtitle: true, show_details: true, show_last_play: true, animations: true };

  // The first team of the home.
  static getStubConfig(hass) {
    const entity = hass ? stSensors(hass)[0] : undefined;
    return entity ? { entity } : {};
  }

  getCardSize() {
    return 6;
  }

  connectedCallback() {
    super.connectedCallback?.();
    // A new width: the status pill is fitted again (in the next frame, and only for a new width).
    if (typeof ResizeObserver !== "function") return;
    this._resize ??= new ResizeObserver((entries) => {
      const w = Math.round(entries.at(-1).contentRect.width);
      if (w === this._fitWidth) return;
      this._fitWidth = w;
      cancelAnimationFrame(this._fitFrame);
      this._fitFrame = requestAnimationFrame(() => this._fitPill());
    });
    this._resize.observe(this);
  }

  disconnectedCallback() {
    super.disconnectedCallback?.();
    this._resize?.disconnect();
    this._fitWidth = undefined;
    if (this._fitFrame) cancelAnimationFrame(this._fitFrame);
  }

  // The teams: `entity` then `entities`, else the first TeamTracker sensor of the home.
  _ids() {
    const c = this._config;
    const list = [c.entity, ...(Array.isArray(c.entities) ? c.entities : [])].map((e) => (typeof e === "string" ? e : e?.entity)).filter(Boolean);
    const ids = [...new Set(list)];
    return ids.length ? ids : stSensors(this._hass).slice(0, 1);
  }

  _collect() {
    const h = this._hass;
    const games = this._ids()
      .filter((id) => h.states[id])
      .map((id) => stGame(h.states[id]));
    if (!games.length) return { none: true, games, state: "none", level: "none", g: null };
    const tab = this._tab != null && this._tab < games.length ? this._tab : stDefaultTab(games);
    const g = games[tab];
    const ts = stNum(g.team.score);
    const os = stNum(g.opp.score);
    const won = g.team.winner === true || (g.team.winner == null && ts != null && os != null && ts > os);
    const lost = g.opp.winner === true || (g.opp.winner == null && ts != null && os != null && ts < os);
    const level = { IN: "live", PRE: "pre", BYE: "bye", NOT_FOUND: "none", offline: "offline" }[g.state] || (won ? "won" : lost ? "lost" : "draw");
    return { none: false, games, tab, g, state: g.state, level };
  }

  _night() {
    const theme = this._config.illustration_theme;
    if (theme === "night" || theme === "day") return theme === "night";
    return this._dark();
  }

  _dark() {
    return !!this._hass.themes?.darkMode;
  }

  _animate() {
    if (this._config.animations === false) return false;
    try {
      return !window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    } catch {
      return true;
    }
  }

  _when(d) {
    if (!d) return "";
    try {
      const now = new Date();
      const today = d.toDateString() === now.toDateString();
      return stIntl(Intl.DateTimeFormat, this._lang(), today ? { hour: "numeric", minute: "2-digit" } : { weekday: "short", day: "numeric", month: "short", hour: "numeric", minute: "2-digit" }).format(d);
    } catch {
      return d.toLocaleString();
    }
  }

  _pct(v) {
    try {
      return stIntl(Intl.NumberFormat, this._lang(), { style: "percent", maximumFractionDigits: 0 }).format(Math.round(v) / 100);
    } catch {
      return `${Math.round(v)}%`;
    }
  }

  // The clock as shown: soccer's minute alone, the quarter or period before the clock of the other team sports.
  _clock(g) {
    const n = stNum(g.period);
    const key = { football: "quarter", basketball: "quarter", hockey: "period", rugby: "half" }[g.sport];
    const q = key && n != null ? this._t(key, { n }) : "";
    return [q, g.clock].filter((x) => x !== "" && x != null).join(" · ");
  }

  _score(g) {
    return `${g.team.score ?? 0} – ${g.opp.score ?? 0}`;
  }

  _status(m) {
    const g = m.g;
    if (!g) return this._t("st_offline");
    if (m.level === "live") {
      const c = this._clock(g);
      return c ? `${this._t("st_live")} · ${c}` : this._t("st_live");
    }
    return this._t({ pre: "st_pre", won: "st_won", lost: "st_lost", draw: g.team.score == null ? "st_final" : "st_draw" }[m.level] || `st_${m.level}`);
  }

  _sub(m) {
    const g = m.g;
    if (!g) return "";
    if (m.level === "bye") return this._t("sub_bye");
    if (m.level === "none" || m.level === "offline") return m.level === "none" ? this._t("sub_none") : "";
    if (m.level === "pre") return [`${this._t("vs")} ${g.opp.name}`, this._when(g.date) || g.kickoff].filter(Boolean).join(" · ");
    return `${g.team.name} ${this._score(g)} ${g.opp.name}`;
  }

  // The illustrated header: the badge (the sport's icon), the title and `sub` on the sky at the left, the stadium at
  // the right, a 10 px pitch strip edge to edge. `extra`: the mini card's scoreboard over the stadium.
  _banner(m, sub, pill, extra = "") {
    const c = this._config;
    const nav = c.navigation_path;
    const night = this._night();
    const g = m.g;
    const sign = g && (m.level === "live" || ["won", "lost", "draw"].includes(m.level)) && g.team.score != null ? `${g.team.score} - ${g.opp.score ?? 0}` : this._t("vs");
    const chip = pill ? `<span class="bpill" title="${rcEsc(pill)}" aria-label="${rcEsc(pill)}"><span class="bdot"></span><span class="bpt">${rcEsc(pill)}</span></span>` : "";
    return `
      <div class="banner${night ? " night" : ""}">
        <div class="head${nav ? " nav" : ""}"${nav ? ' role="link" tabindex="0"' : ""}>
          <div class="badge"><ha-icon icon="${ST_ICONS[g?.sport || "other"]}"></ha-icon></div>
          <div class="tt"><div class="trow"><div class="title">${rcEsc(this._title(m))}</div>${chip}</div>${sub}</div>
        </div>
        <svg class="room" viewBox="0 0 200 80" preserveAspectRatio="xMaxYMax slice" aria-hidden="true">${stScene({ night, live: m.level === "live", sign, animate: this._animate() })}</svg>
        ${extra}
        <div class="ground"></div>
      </div>`;
  }

  _title(m) {
    return this._config.title || (m.games.length > 1 ? this._t("title") : m.g?.team.long) || this._t("title");
  }

  // The status pill's place, on the banner and on the classic header (see stPlacePill).
  _fitPill() {
    for (const row of this.shadowRoot?.querySelectorAll?.(".trow") || []) {
      const banner = row.closest(".banner");
      stPlacePill(banner || row.closest(".head"), row, banner?.querySelector(".ground"));
    }
  }

  // One tab per team, when there are several: the crest, the abbreviation and a red dot while live.
  _tabs(m) {
    if (m.games.length < 2) return "";
    return `<div class="tabs" role="tablist">${m.games
      .map(
        (g, i) =>
          `<button class="tab${i === m.tab ? " on" : ""}" role="tab" aria-selected="${i === m.tab}" data-tab="${i}" data-k="tab-${i}">${stCrest(g.team, 20)}<span>${rcEsc(g.team.abbr || g.team.name)}</span>${g.state === "IN" ? '<span class="ld" aria-hidden="true"></span>' : ""}</button>`,
      )
      .join("")}</div>`;
  }

  // The scoreboard: the league, the state, both crests and names, the score (or the kick-off), how far the game has
  // gone, the win probability and the last play.
  _board(m) {
    const g = m.g;
    const c = this._config;
    const side = (t) => `<div class="tm">${stCrest(t, 56)}<span class="tn">${rcEsc(t.name)}</span>${t.rank ? `<span class="rk">#${rcEsc(t.rank)}</span>` : ""}</div>`;
    const mid =
      m.level === "pre" || g.team.score == null
        ? `<div class="mid pre"><span class="vs">${rcEsc(this._t("vs"))}</span><span class="ko">${rcEsc(this._when(g.date) || g.kickoff)}</span></div>`
        : `<div class="mid"><span class="score">${rcEsc(this._score(g))}</span></div>`;
    const bar = m.level === "live" && g.progress != null ? `<div class="bar" role="progressbar" aria-valuenow="${Math.round(g.progress * 100)}" aria-valuemin="0" aria-valuemax="100"><span style="width:${(g.progress * 100).toFixed(1)}%"></span></div>` : "";
    const prob = m.level === "live" && g.team.prob != null ? `<div class="pb">${rcEsc(this._t("win_prob", { p: this._pct(g.team.prob <= 1 ? g.team.prob * 100 : g.team.prob) }))}</div>` : "";
    const last = m.level === "live" && c.show_last_play !== false && g.last ? `<div class="lp">${rcEsc(g.last)}</div>` : "";
    const head = [g.league, g.event || g.series].filter(Boolean).join(" · ");
    return `<button class="box sb" data-id="${rcEsc(g.id)}">
        <div class="sbh"><span class="lg">${rcEsc(head)}</span><span class="ss">${rcEsc(this._status(m))}</span></div>
        <div class="teams">${side(g.team)}${mid}${side(g.opp)}</div>${bar}${prob}${last}
      </button>`;
  }

  // When, where and on which channel, then the records and the odds.
  _details(m) {
    const g = m.g;
    if (this._config.show_details === false || ["bye", "none", "offline"].includes(m.level)) return "";
    const tile = (label, value) => (value ? `<div class="xt"><span class="xl">${rcEsc(this._t(label))}</span><span class="xv">${rcEsc(value)}</span></div>` : "");
    // Before kick-off the scoreboard shows the date: the tile says how long until then.
    const when = m.level === "pre" ? g.kickoff || this._when(g.date) : this._when(g.date) || g.kickoff;
    const tiles = [tile("t_when", when), tile("t_where", [g.venue, g.location].filter(Boolean).join(" · ")), tile("t_tv", g.tv)].filter(Boolean).join("");
    const rec = g.team.record || g.opp.record ? `<span>${rcEsc(this._t("records", { v: [g.team.record, g.opp.record].filter(Boolean).join(" · ") }))}</span>` : "";
    const odds = m.level === "pre" && g.odds ? `<span>${rcEsc(this._t("odds", { v: g.odds }))}</span>` : "";
    return `${tiles ? `<div class="xs">${tiles}</div>` : ""}${rec || odds ? `<div class="rc">${rec}${odds}</div>` : ""}`;
  }

  _draw(m) {
    const c = this._config;
    const status = this._status(m);
    const parts = [m.level, m.tab, m.games, this._night(), this._dark()];
    if (!this._changed(parts)) return;
    const sub = this._sub(m);
    const subHtml = c.show_subtitle !== false && sub ? `<div class="subt">${rcEsc(sub)}</div>` : "";
    const head =
      c.illustration !== false
        ? this._banner(m, subHtml, m.none ? "" : status)
        : `<div class="head${c.navigation_path ? " nav" : ""}"${c.navigation_path ? ' role="link" tabindex="0"' : ""}>
            <div class="badge"><ha-icon icon="${ST_ICONS[m.g?.sport || "other"]}"></ha-icon></div>
            <div class="tt"><div class="trow"><div class="title">${rcEsc(this._title(m))}</div>${m.none ? "" : `<span class="pill" title="${rcEsc(status)}" aria-label="${rcEsc(status)}"><span class="pt">${rcEsc(status)}</span></span>`}</div>${subHtml}</div>
          </div>`;
    const dk = this._dark() ? " dk" : "";
    if (m.none) {
      this._paint("none", `${head}<div class="box none">${rcEsc(this._t("no_team"))}</div>`, "", dk);
      this._fitPill();
      return;
    }
    const body = ["bye", "none", "offline"].includes(m.level) && !m.g.team.score ? "" : this._board(m);
    const rest = this._tabs(m) + body + this._details(m);
    // Nothing under the banner (a bye week): the card ends on its ground strip, no blank band.
    this._paint(m.level, head + rest, "", `${dk}${rest || c.illustration === false ? "" : " bare"}`);
    this._fitPill();
  }

  _bindAfter(root) {
    root.querySelector(".sb")?.addEventListener("click", () => rcMoreInfo(this, this._items.g.id));
    for (const b of root.querySelectorAll(".tab") || [])
      b.addEventListener("click", (ev) => {
        ev.stopPropagation();
        this._tab = Number(b.dataset.tab);
        this._sig = null;
        this._render();
      });
  }

  static styles = `
    ha-card.lvl-live { --c: #e03131; }
    ha-card.lvl-pre { --c: #1098ad; }
    ha-card.lvl-won { --c: #2f9e44; }
    ha-card.lvl-lost { --c: #c92a2a; }
    ha-card.lvl-draw, ha-card.lvl-bye, ha-card.lvl-none, ha-card.lvl-offline { --c: var(--rc-idle); }
    ha-card.bare { padding-bottom: 0; }
    .tt { flex: 1 1 0; min-width: 5ch; display: flex; flex-direction: column; }
    .tt .title { flex: none; }
    .subt { font-size: 12px; color: var(--secondary-text-color); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    :host([hide-title]) .head .tt { visibility: hidden; }
    .box { display: block; box-sizing: border-box; width: 100%; margin-top: 10px; border-radius: 12px; padding: 12px 14px;
           background: var(--secondary-background-color, rgba(127,127,127,.08)); color: var(--primary-text-color); }
    .none { font-size: 13px; color: var(--secondary-text-color); }
    .sb { all: unset; display: block; box-sizing: border-box; width: 100%; margin-top: 10px; border-radius: 12px; padding: 12px 14px; cursor: pointer;
          background: var(--secondary-background-color, rgba(127,127,127,.08)); color: var(--primary-text-color); }
    .sb:focus-visible { outline: 2px solid var(--primary-color); outline-offset: 2px; }
    .sbh { display: flex; justify-content: space-between; gap: 8px; font-size: 12px; color: var(--secondary-text-color); }
    .sbh .lg { min-width: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .sbh .ss { flex: none; font-weight: 500; color: color-mix(in srgb, var(--c) 70%, var(--primary-text-color, #212121)); }
    .lvl-live .sbh .ss::before { content: ""; display: inline-block; width: 7px; height: 7px; margin-right: 5px; border-radius: 50%; background: var(--c); vertical-align: 1px; }
    .teams { display: grid; grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr); align-items: center; gap: 8px; margin-top: 10px; }
    .tm { display: flex; flex-direction: column; align-items: center; gap: 6px; min-width: 0; }
    .crest { display: block; flex: none; object-fit: contain; }
    .tn { font-size: 14px; font-weight: 500; text-align: center; max-width: 100%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .rk { font-size: 11px; color: var(--secondary-text-color); }
    .mid { display: flex; flex-direction: column; align-items: center; gap: 2px; }
    .score { font-size: 40px; font-weight: 700; letter-spacing: 1px; line-height: 1.1; color: var(--primary-text-color); white-space: nowrap; }
    .mid.pre .vs { font-size: 13px; color: var(--secondary-text-color); }
    .mid.pre .ko { font-size: 15px; font-weight: 500; text-align: center; }
    .bar { height: 6px; margin-top: 12px; border-radius: 3px; overflow: hidden; background: rgba(127,127,127,.22); }
    .bar span { display: block; height: 100%; border-radius: 3px; background: #1098ad; }
    .pb { margin-top: 8px; font-size: 12px; color: var(--secondary-text-color); }
    .lp { margin-top: 8px; font-size: 13px; line-height: 1.35; color: var(--primary-text-color); overflow-wrap: anywhere; }
    .tabs { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 10px; }
    .tab { all: unset; box-sizing: border-box; cursor: pointer; display: inline-flex; align-items: center; gap: 6px; min-height: 36px; padding: 0 12px 0 8px;
           border-radius: 999px; font-size: 13px; font-weight: 500; color: var(--primary-text-color); background: var(--secondary-background-color, rgba(127,127,127,.1)); }
    .tab.on { background: color-mix(in srgb, #1098ad 18%, transparent); color: color-mix(in srgb, #1098ad 55%, var(--primary-text-color, #212121)); }
    .tab:focus-visible { outline: 2px solid var(--primary-color); outline-offset: 2px; }
    .tab .ld { width: 7px; height: 7px; border-radius: 50%; background: #e03131; }
    .xs { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 8px; margin-top: 10px; }
    .xt { min-width: 0; border-radius: 12px; padding: 9px 11px; display: flex; flex-direction: column; gap: 4px; background: var(--secondary-background-color, rgba(127,127,127,.08)); }
    .xl { font-size: 12px; color: var(--secondary-text-color); }
    .xv { font-size: 14px; font-weight: 500; line-height: 1.25; overflow-wrap: anywhere; }
    .rc { display: flex; flex-wrap: wrap; justify-content: space-between; gap: 4px 12px; margin-top: 8px; font-size: 12px; color: var(--secondary-text-color); }
    @container (max-width: 340px) {
      .score { font-size: 32px; }
      .tm .crest { width: 44px; height: 44px; }
      .xs { grid-template-columns: minmax(0, 1fr); }
    }
    /* Illustrated header (banner): 90 px, edge to edge, the title on the sky, the stadium at the right, a 10 px pitch
       strip at the bottom. The badge's icon is in the state's colour, grey when idle, by day and night. */
    .banner { position: relative; display: flex; height: 90px; margin: -12px -12px 0; overflow: hidden;
              background: linear-gradient(180deg, #cfe3f6 0%, #b6d3ee 100%);
              --bt: #0d2a45; --bs: #3b5b78; --ic: color-mix(in srgb, var(--c) 85%, #10283f); --sw: min(200px, 56%); }
    .banner.night { background: linear-gradient(180deg, #1b2b44 0%, #24456b 100%); --bt: #fff; --bs: rgba(255,255,255,.78); --ic: color-mix(in srgb, var(--c) 72%, #fff); }
    .banner .head { position: relative; z-index: 1; flex: 1; min-width: 0; height: 80px; box-sizing: border-box;
                    padding: 0 calc(var(--sw) + 4px) 0 14px; flex-wrap: nowrap; }
    .banner .head::after { content: none; }
    .banner .badge { position: relative; color: var(--ic); background: rgba(255,255,255,.62); box-shadow: inset 0 0 0 1px rgba(13,42,69,.12); }
    .banner.night .badge { background: rgba(255,255,255,.12); box-shadow: inset 0 0 0 1px rgba(255,255,255,.14); }
    .banner .title { color: var(--bt); }
    .banner .subt { color: var(--bs); font-size: 13px; }
    .banner .room { position: absolute; right: 0; bottom: 10px; width: var(--sw); height: calc(80px * var(--sk, 1)); }
    .banner .ground { position: absolute; left: 0; right: 0; bottom: 0; height: 10px; background: repeating-linear-gradient(90deg, #3c9a3c 0 26px, #4cad4c 26px 52px); }
    .banner.night .ground { background: repeating-linear-gradient(90deg, #255e2d 0 26px, #2c6b34 26px 52px); }
    /* The mini card's expand / collapse button: 24 px, frosted, 5 px from the banner's top right corner. */
    .banner .zoom { position: absolute; z-index: 3; top: 5px; right: 5px; width: 24px; height: 24px; margin: 0; color: #33506b;
                    background: rgba(255,255,255,.55); box-shadow: inset 0 0 0 1px rgba(255,255,255,.7); backdrop-filter: blur(4px); }
    .banner.night .zoom { color: #fff; background: rgba(255,255,255,.12); box-shadow: inset 0 0 0 1px rgba(255,255,255,.2); }
    .banner .zoom:hover { background: rgba(255,255,255,.75); color: #33506b; }
    .banner.night .zoom:hover { background: rgba(255,255,255,.22); color: #fff; }
    .banner .tt { min-width: 0; flex: 1 1 auto; }
    /* Status pill right after the title (see stPlacePill). */
    .trow { display: flex; align-items: center; gap: 8px; min-width: 0; }
    .trow > .title { flex: 0 1 auto; min-width: 0; }
    .trow > .bpill, .trow > .pill { flex: none; max-width: none; }
    :host([hide-title]) .trow .title { visibility: hidden; }
    .head:has(.trow) { flex-wrap: nowrap; }
    .head:has(.trow)::after { content: none; }
    .bpill { display: inline-flex; align-items: center; gap: 4px; min-width: 0; box-sizing: border-box; overflow: hidden;
             white-space: nowrap; padding: 1px 8px; border-radius: 12px; font-size: 11px; font-weight: 500; line-height: 16px;
             background: color-mix(in srgb, var(--c) 18%, rgba(255,255,255,.78)); color: color-mix(in srgb, var(--c) 45%, #0d2a45); }
    .banner.night .bpill { background: color-mix(in srgb, var(--c) 30%, rgba(8,18,38,.55)); color: color-mix(in srgb, var(--c) 35%, #ffffff); }
    .bdot { width: 7px; height: 7px; border-radius: 50%; background: var(--c); flex: none; }
    .lvl-live .bdot { animation: rc-blink ${ST_LOOP / 2}s ease-in-out infinite; }
    .bpt { min-width: 0; overflow: hidden; text-overflow: ellipsis; }
    [data-wrap] .trow { display: contents; }
    [data-wrap] .trow > .bpill, [data-wrap] .trow > .pill { order: 9; align-self: flex-start; max-width: 100%; margin-top: 3px; }
    .banner[data-wrap] .trow > .bpill { max-width: calc(100cqw - 80px); }
    [data-wrap] .subt { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    [data-dot] .bpill { padding: 0; background: none; }
    [data-dot] .bpt, [data-dot] .trow > .pill .pt { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); }
    [data-dot] .trow > .pill { padding: 0; width: 18px; height: 18px; justify-content: center; background: none; }
    [data-dot] .trow > .pill::before { content: ""; width: 8px; height: 8px; border-radius: 50%; background: var(--c); }
    @container (max-width: 200px) {
      .bpill { padding: 0; background: none; }
      .bpt, .trow > .pill .pt { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); }
      .trow > .pill { padding: 0; width: 18px; height: 18px; justify-content: center; background: none; }
      .trow > .pill::before { content: ""; width: 8px; height: 8px; border-radius: 50%; background: var(--c); }
    }
    /* The mini card: the banner alone, its readings as chips on the sky, the scoreboard over the stadium. */
    ha-card.bn { padding: 0; }
    ha-card.bn > .banner { margin: 0; --sw: min(200px, 46%); }
    .msb { position: absolute; z-index: 2; right: 36px; top: 22px; display: flex; align-items: center; gap: 5px; padding: 4px 7px; border-radius: 9px;
           background: rgba(11,22,38,.86); color: #ffd43b; font-size: 17px; font-weight: 700; white-space: nowrap; }
    .msb .vs { font-size: 12px; font-weight: 500; color: #dbe4ee; }
    /* Narrower cards: the stadium is drawn smaller (75 %, 62 %, then 50 % of its height, its left part cropped). */
    @container (max-width: 420px) { .banner, ha-card.bn > .banner { --sw: 150px; --sk: .75; } }
    @container (max-width: 340px) { .banner, ha-card.bn > .banner { --sw: 112px; --sk: .62; } .msb { display: none; } }
    @container (max-width: 260px) { .banner, ha-card.bn > .banner { --sw: 70px; --sk: .5; } }
    /* The chips that do not fit wrap to a second line, hidden: never a chip cut to "R…". */
    .banner .rs { display: flex; flex-wrap: wrap; gap: 4px; height: 20px; margin: 3px 0 0 -2px; min-width: 0; overflow: hidden; }
    .banner .r { flex: none; line-height: 20px; padding: 0 7px; color: var(--bt); background: rgba(255,255,255,.62); }
    .banner.night .r { background: rgba(10,20,40,.4); }
    @media (prefers-reduced-motion: reduce) { .lvl-live .bdot { animation: none; } }
  `;
}

// ── Editor ───────────────────────────────────────────────────────────────────
const stSchema = (booleans) => (lang) => [
  { name: "entity", selector: { entity: { domain: "sensor", integration: ST_PLATFORM } } },
  { name: "entities", selector: { entity: { domain: "sensor", integration: ST_PLATFORM, multiple: true } } },
  { name: "title", selector: { text: {} } },
  { name: "navigation_path", selector: { navigation: {} } },
  ...rcBooleans(...booleans),
  {
    name: "illustration_theme",
    selector: { select: { mode: "dropdown", options: ["auto", "day", "night"].map((value) => ({ value, label: rcT(ST_I18N, lang, `ed_theme_${value}`) })) } },
  },
  ...rcAdvanced(ST_I18N, lang, "language"),
];

const ST_HELPERS = ["entity", "entities", "title", "zoom", "language"];

const SportsCardEditor = rcEditor({
  card: SportsCard,
  helpers: ST_HELPERS,
  schema: stSchema(["show_title", "show_subtitle", "illustration", "show_details", "show_last_play", "animations"]),
});

rcRegister(SportsCard, SportsCardEditor, "Sports Card", "Your teams' games from TeamTracker: the live score, the next game and the result, one tab per team");

// ── Mini card ────────────────────────────────────────────────────────────────
// The game on two lines: the sport as the badge, the title and the state, the game as a chip, and a small scoreboard
// (both crests and the score, or "vs" before kick-off) over the stadium; the zoom button opens the full card in place.
class SportsMiniCard extends rcMini(SportsCard, "sports-mini-card", "") {
  getCardSize() {
    return this._zoomed ? super.getCardSize() : 1;
  }

  _drawMini(m) {
    if (!this._changed(["mini", m.level, m.tab, m.games, this._night(), this._dark()])) return;
    const status = this._status(m);
    const sub = m.none ? this._t("no_team") : this._sub(m);
    const chips = sub ? `<div class="rs"><button class="r"${m.g ? ` data-id="${rcEsc(m.g.id)}"` : ""} title="${rcEsc(sub)}"><span>${rcEsc(sub)}</span></button></div>` : "";
    const g = m.g;
    const scored = g && g.team.score != null && ["live", "won", "lost", "draw"].includes(m.level);
    const board = g && ["live", "pre", "won", "lost", "draw"].includes(m.level) ? `<div class="msb">${stCrest(g.team, 24)}${scored ? `<span>${rcEsc(this._score(g))}</span>` : `<span class="vs">${rcEsc(this._t("vs"))}</span>`}${stCrest(g.opp, 24)}</div>` : "";
    const c = this._config;
    this.shadowRoot.innerHTML = `<style>${RC_BASE_STYLES}${this.constructor.styles}</style>
      <ha-card class="lvl-${m.level} bn${this._dark() ? " dk" : ""}">${this._banner(m, chips, m.none ? "" : status, board)}</ha-card>`;
    const root = this.shadowRoot;
    if (c.navigation_path) rcBindNav(root.querySelector(".head"), c.navigation_path);
    for (const el of root.querySelectorAll(".r[data-id]")) el.addEventListener("click", () => rcMoreInfo(this, el.dataset.id));
    this._fitPill();
  }
}

const SportsMiniCardEditor = rcEditor({
  card: SportsMiniCard,
  helpers: ST_HELPERS,
  schema: stSchema(["show_title", "show_subtitle", "illustration", "show_details", "show_last_play", "animations", "zoom"]),
});

rcRegister(SportsMiniCard, SportsMiniCardEditor, "Sports Mini Card", "Your team's game on two lines: the state, the score or the kick-off, with a zoom to the full card");
