/**
 * Shared by the sports cards (its names are used by the other src/ files): the TeamTracker sensors and games, i18n helpers,
 * the base card (header, tiles, tap / hold), the mini card, the visual editor and the common styles. Same base as ha-room-card.
 * https://github.com/juju35/ha-sports-card
 */
const RC_VERSION = "__VERSION__";

const RC_HOLD_MS = 500;
const RC_MOVE_PX = 8;
// A held arrow key repeats some 30 times a second: one brightness step every RC_REPEAT_MS at most.
const RC_REPEAT_MS = 150;

// ── Overviews ────────────────────────────────────────────────────────────────
// Shared by room-overview-card and room-environment-overview-card.

// The zoom / detail button: the same icons on the overviews and the mini cards.
const rcZoomIcon = (card) => (card._zoomed ? "mdi:arrow-collapse" : "mdi:arrow-expand");

// Back to the compact view (mini card, or overview showing the rooms needing a look), when zoomed in.
const rcUnzoom = (card) => {
  if (!card._zoomed) return;
  card._zoomed = false;
  card._sig = null;
  card._render();
};

// True for a click outside `card` that is not in a dialog opened from it (more-info, say): it folds the card back.
const rcOutside = (card, ev) => !ev.composedPath().includes(card) && !rcInDialog(ev);

// "A click elsewhere" is caught on the pointer, not only on the click event: on iOS (Safari and the companion app)
// a tap on something that is not clickable (the background, an empty spot, a card with no action) sends no click to
// the page. The handler runs when the press and the release are both outside the card (a slider dragged out of the
// card does not count), and a scroll does not count (the browser cancels the pointer); keyboard clicks still go
// through the click event. The handler keeps its own checks (outside of the card, not in a dialog).
const watchOutside = (card, handler) => {
  let downOutside = false;
  const onDown = (ev) => {
    downOutside = !ev.composedPath().includes(card);
  };
  const onUp = (ev) => {
    if (downOutside) handler(ev);
    downOutside = false;
  };
  const onClick = (ev) => {
    if (ev.detail === 0) handler(ev);
  };
  return {
    on() {
      document.addEventListener("pointerdown", onDown, true);
      document.addEventListener("pointerup", onUp, true);
      document.addEventListener("click", onClick, true);
    },
    off() {
      document.removeEventListener("pointerdown", onDown, true);
      document.removeEventListener("pointerup", onUp, true);
      document.removeEventListener("click", onClick, true);
    },
    // A tap (press and release at the same spot), for the tests.
    tap(ev) {
      onDown(ev);
      onUp(ev);
    },
  };
};

// A click on the detail button: every room, or back to the rooms needing a look. True when handled.
const rcZoomClick = (card, ev) => {
  if (!ev.target.closest?.(".zoom")) return false;
  ev.stopPropagation();
  card._zoomed = !card._zoomed;
  card._sig = null;
  card._render();
  if (ev.detail === 0) card.shadowRoot.querySelector(".zoom")?.focus({ preventScroll: true });
  return true;
};

// ── i18n ─────────────────────────────────────────────────────────────────────
// Strings shared by the cards; a card's own dictionary wins over these.
const RC_I18N = {
  en: {
    unavailable: "Unavailable",
    turn_all_off: "Turn everything off",
    ed_title: "Title",
    ed_show_title: "Show title",
    ed_advanced: "Advanced",
    ed_language: "Language",
    ed_language_helper: "Empty: the Home Assistant language",
    ed_language_auto: "Automatic",
    ed_navigation_path: "Navigation path",
    err_config: "Set `area` or `entities`",
    zoom_in: "Show the full card",
    zoom_out: "Back to the compact view",
    ed_zoom: "Zoom button",
    ed_zoom_helper: "Switches the mini card to the full card and back",
  },
  fr: {
    unavailable: "Indisponible",
    turn_all_off: "Tout éteindre",
    ed_title: "Titre",
    ed_show_title: "Afficher le titre",
    ed_advanced: "Avancé",
    ed_language: "Langue",
    ed_language_helper: "Vide : la langue de Home Assistant",
    ed_language_auto: "Automatique",
    ed_navigation_path: "Chemin de navigation",
    err_config: "Définis `area` ou `entities`",
    zoom_in: "Afficher la carte complète",
    zoom_out: "Revenir à la vue compacte",
    ed_zoom: "Bouton zoom",
    ed_zoom_helper: "Bascule la mini-carte en carte complète, et inversement",
  },
  de: {
    unavailable: "Nicht verfügbar",
    turn_all_off: "Alles ausschalten",
    ed_title: "Titel",
    ed_show_title: "Titel anzeigen",
    ed_advanced: "Erweitert",
    ed_language: "Sprache",
    ed_language_helper: "Leer: die Sprache von Home Assistant",
    ed_language_auto: "Automatisch",
    ed_navigation_path: "Navigationspfad",
    err_config: "Lege `area` oder `entities` fest",
    zoom_in: "Vollständige Karte anzeigen",
    zoom_out: "Zurück zur kompakten Ansicht",
    ed_zoom: "Zoom-Schaltfläche",
    ed_zoom_helper: "Wechselt von der Mini-Karte zur vollständigen Karte und zurück",
  },
  es: {
    unavailable: "No disponible",
    turn_all_off: "Apagar todo",
    ed_title: "Título",
    ed_show_title: "Mostrar el título",
    ed_advanced: "Avanzado",
    ed_language: "Idioma",
    ed_language_helper: "Vacío: el idioma de Home Assistant",
    ed_language_auto: "Automático",
    ed_navigation_path: "Ruta de navegación",
    err_config: "Define `area` o `entities`",
    zoom_in: "Mostrar la tarjeta completa",
    zoom_out: "Volver a la vista compacta",
    ed_zoom: "Botón de zoom",
    ed_zoom_helper: "Cambia de la minitarjeta a la tarjeta completa y viceversa",
  },
  sr: {
    unavailable: "Недоступно",
    turn_all_off: "Искључи све",
    ed_title: "Наслов",
    ed_show_title: "Прикажи наслов",
    ed_advanced: "Напредно",
    ed_language: "Језик",
    ed_language_helper: "Празно: језик Home Assistant-а",
    ed_language_auto: "Аутоматски",
    ed_navigation_path: "Путања за навигацију",
    err_config: "Подесите `area` или `entities`",
    zoom_in: "Прикажи целу картицу",
    zoom_out: "Назад на компактни приказ",
    ed_zoom: "Дугме за увећање",
    ed_zoom_helper: "Пребацује мини картицу на пун приказ и назад",
  },
  "sr-Latn": {
    unavailable: "Nedostupno",
    turn_all_off: "Isključi sve",
    ed_title: "Naslov",
    ed_show_title: "Prikaži naslov",
    ed_advanced: "Napredno",
    ed_language: "Jezik",
    ed_language_helper: "Prazno: jezik Home Assistant-a",
    ed_language_auto: "Automatski",
    ed_navigation_path: "Putanja za navigaciju",
    err_config: "Podesite `area` ili `entities`",
    zoom_in: "Prikaži celu karticu",
    zoom_out: "Nazad na kompaktni prikaz",
    ed_zoom: "Dugme za uvećanje",
    ed_zoom_helper: "Prebacuje mini karticu na pun prikaz i nazad",
  },
  it: {
    unavailable: "Non disponibile",
    turn_all_off: "Spegni tutto",
    ed_title: "Titolo",
    ed_show_title: "Mostra il titolo",
    ed_advanced: "Avanzate",
    ed_language: "Lingua",
    ed_language_helper: "Vuoto: la lingua di Home Assistant",
    ed_language_auto: "Automatica",
    ed_navigation_path: "Percorso di navigazione",
    err_config: "Imposta `area` o `entities`",
    zoom_in: "Mostra la scheda completa",
    zoom_out: "Torna alla vista compatta",
    ed_zoom: "Pulsante zoom",
    ed_zoom_helper: "Passa dalla mini scheda alla scheda completa e viceversa",
  },
  nl: {
    unavailable: "Niet beschikbaar",
    turn_all_off: "Alles uitschakelen",
    ed_title: "Titel",
    ed_show_title: "Titel tonen",
    ed_advanced: "Geavanceerd",
    ed_language: "Taal",
    ed_language_helper: "Leeg: de taal van Home Assistant",
    ed_language_auto: "Automatisch",
    ed_navigation_path: "Navigatiepad",
    err_config: "Stel `area` of `entities` in",
    zoom_in: "Volledige kaart tonen",
    zoom_out: "Terug naar de compacte weergave",
    ed_zoom: "Zoomknop",
    ed_zoom_helper: "Schakelt de minikaart naar de volledige kaart en terug",
  },
  pt: {
    unavailable: "Indisponível",
    turn_all_off: "Desligar tudo",
    ed_title: "Título",
    ed_show_title: "Mostrar o título",
    ed_advanced: "Avançado",
    ed_language: "Idioma",
    ed_language_helper: "Vazio: o idioma do Home Assistant",
    ed_language_auto: "Automático",
    ed_navigation_path: "Caminho de navegação",
    err_config: "Defina `area` ou `entities`",
    zoom_in: "Mostrar o cartão completo",
    zoom_out: "Voltar à vista compacta",
    ed_zoom: "Botão de zoom",
    ed_zoom_helper: "Alterna entre o minicartão e o cartão completo",
  },
  pl: {
    unavailable: "Niedostępne",
    turn_all_off: "Wyłącz wszystko",
    ed_title: "Tytuł",
    ed_show_title: "Pokaż tytuł",
    ed_advanced: "Zaawansowane",
    ed_language: "Język",
    ed_language_helper: "Puste: język Home Assistanta",
    ed_language_auto: "Automatyczny",
    ed_navigation_path: "Ścieżka nawigacji",
    err_config: "Ustaw `area` lub `entities`",
    zoom_in: "Pokaż pełną kartę",
    zoom_out: "Wróć do widoku kompaktowego",
    ed_zoom: "Przycisk powiększenia",
    ed_zoom_helper: "Przełącza minikartę na pełną kartę i z powrotem",
  },
  ro: {
    unavailable: "Indisponibil",
    turn_all_off: "Oprește tot",
    ed_title: "Titlu",
    ed_show_title: "Afișează titlul",
    ed_advanced: "Avansat",
    ed_language: "Limbă",
    ed_language_helper: "Gol: limba Home Assistant",
    ed_language_auto: "Automată",
    ed_navigation_path: "Cale de navigare",
    err_config: "Setează `area` sau `entities`",
    zoom_in: "Afișează cardul complet",
    zoom_out: "Înapoi la vizualizarea compactă",
    ed_zoom: "Buton de zoom",
    ed_zoom_helper: "Comută între mini-card și cardul complet",
  },
  da: {
    unavailable: "Utilgængelig",
    turn_all_off: "Sluk alt",
    ed_title: "Titel",
    ed_show_title: "Vis titel",
    ed_advanced: "Avanceret",
    ed_language: "Sprog",
    ed_language_helper: "Tomt: Home Assistants sprog",
    ed_language_auto: "Automatisk",
    ed_navigation_path: "Navigationssti",
    err_config: "Angiv `area` eller `entities`",
    zoom_in: "Vis hele kortet",
    zoom_out: "Tilbage til den kompakte visning",
    ed_zoom: "Zoomknap",
    ed_zoom_helper: "Skifter fra minikortet til hele kortet og tilbage",
  },
  sv: {
    unavailable: "Ej tillgänglig",
    turn_all_off: "Stäng av allt",
    ed_title: "Titel",
    ed_show_title: "Visa rubrik",
    ed_advanced: "Avancerat",
    ed_language: "Språk",
    ed_language_helper: "Tomt: Home Assistants språk",
    ed_language_auto: "Automatiskt",
    ed_navigation_path: "Navigeringssökväg",
    err_config: "Ange `area` eller `entities`",
    zoom_in: "Visa hela kortet",
    zoom_out: "Tillbaka till kompakt vy",
    ed_zoom: "Zoomknapp",
    ed_zoom_helper: "Växlar mellan minikortet och hela kortet",
  },
  bg: {
    unavailable: "Недостъпно",
    turn_all_off: "Изключи всичко",
    ed_title: "Заглавие",
    ed_show_title: "Показване на заглавието",
    ed_advanced: "Разширени",
    ed_language: "Език",
    ed_language_helper: "Празно: езикът на Home Assistant",
    ed_language_auto: "Автоматично",
    ed_navigation_path: "Път за навигация",
    err_config: "Задайте `area` или `entities`",
    zoom_in: "Покажи пълната карта",
    zoom_out: "Обратно към компактния изглед",
    ed_zoom: "Бутон за увеличение",
    ed_zoom_helper: "Превключва от мини картата към пълната карта и обратно",
  },
  ru: {
    unavailable: "Недоступно",
    turn_all_off: "Выключить всё",
    ed_title: "Заголовок",
    ed_show_title: "Показывать заголовок",
    ed_advanced: "Дополнительно",
    ed_language: "Язык",
    ed_language_helper: "Пусто: язык Home Assistant",
    ed_language_auto: "Автоматически",
    ed_navigation_path: "Путь навигации",
    err_config: "Укажите `area` или `entities`",
    zoom_in: "Показать полную карточку",
    zoom_out: "Вернуться к компактному виду",
    ed_zoom: "Кнопка масштаба",
    ed_zoom_helper: "Переключает мини-карточку на полную карточку и обратно",
  },
  uk: {
    unavailable: "Недоступно",
    turn_all_off: "Вимкнути все",
    ed_title: "Заголовок",
    ed_show_title: "Показувати заголовок",
    ed_advanced: "Додатково",
    ed_language: "Мова",
    ed_language_helper: "Порожньо: мова Home Assistant",
    ed_language_auto: "Автоматично",
    ed_navigation_path: "Шлях навігації",
    err_config: "Вкажіть `area` або `entities`",
    zoom_in: "Показати повну картку",
    zoom_out: "Повернутися до компактного вигляду",
    ed_zoom: "Кнопка масштабу",
    ed_zoom_helper: "Перемикає міні-картку на повну картку й назад",
  },
  hu: {
    unavailable: "Nem elérhető",
    turn_all_off: "Minden kikapcsolása",
    ed_title: "Cím",
    ed_show_title: "Cím megjelenítése",
    ed_advanced: "Speciális",
    ed_language: "Nyelv",
    ed_language_helper: "Üres: a Home Assistant nyelve",
    ed_language_auto: "Automatikus",
    ed_navigation_path: "Navigációs útvonal",
    err_config: "Állítsd be az `area` vagy az `entities` értékét",
    zoom_in: "A teljes kártya megjelenítése",
    zoom_out: "Vissza a kompakt nézethez",
    ed_zoom: "Nagyítás gomb",
    ed_zoom_helper: "Vált a mini kártya és a teljes kártya között",
  },
  sk: {
    unavailable: "Nedostupné",
    turn_all_off: "Vypnúť všetko",
    ed_title: "Názov",
    ed_show_title: "Zobraziť názov",
    ed_advanced: "Rozšírené",
    ed_language: "Jazyk",
    ed_language_helper: "Prázdne: jazyk Home Assistanta",
    ed_language_auto: "Automaticky",
    ed_navigation_path: "Navigačná cesta",
    err_config: "Nastavte `area` alebo `entities`",
    zoom_in: "Zobraziť celú kartu",
    zoom_out: "Späť na kompaktné zobrazenie",
    ed_zoom: "Tlačidlo priblíženia",
    ed_zoom_helper: "Prepína minikartu na celú kartu a späť",
  },
  cs: {
    unavailable: "Nedostupné",
    turn_all_off: "Vypnout vše",
    ed_title: "Název",
    ed_show_title: "Zobrazit název",
    ed_advanced: "Pokročilé",
    ed_language: "Jazyk",
    ed_language_helper: "Prázdné: jazyk Home Assistanta",
    ed_language_auto: "Automaticky",
    ed_navigation_path: "Navigační cesta",
    err_config: "Nastavte `area` nebo `entities`",
    zoom_in: "Zobrazit celou kartu",
    zoom_out: "Zpět na kompaktní zobrazení",
    ed_zoom: "Tlačítko přiblížení",
    ed_zoom_helper: "Přepíná minikartu na celou kartu a zpět",
  },
  sl: {
    unavailable: "Ni na voljo",
    turn_all_off: "Izklopi vse",
    ed_title: "Naslov",
    ed_show_title: "Prikaži naslov",
    ed_advanced: "Napredno",
    ed_language: "Jezik",
    ed_language_helper: "Prazno: jezik Home Assistanta",
    ed_language_auto: "Samodejno",
    ed_navigation_path: "Navigacijska pot",
    err_config: "Nastavite `area` ali `entities`",
    zoom_in: "Prikaži celotno kartico",
    zoom_out: "Nazaj na strnjen pogled",
    ed_zoom: "Gumb za povečavo",
    ed_zoom_helper: "Preklopi mini kartico v celotno kartico in nazaj",
  },
  lv: {
    unavailable: "Nav pieejams",
    turn_all_off: "Izslēgt visu",
    ed_title: "Virsraksts",
    ed_show_title: "Rādīt virsrakstu",
    ed_advanced: "Papildu",
    ed_language: "Valoda",
    ed_language_helper: "Tukšs: Home Assistant valoda",
    ed_language_auto: "Automātiski",
    ed_navigation_path: "Navigācijas ceļš",
    err_config: "Iestatiet `area` vai `entities`",
    zoom_in: "Rādīt pilno karti",
    zoom_out: "Atpakaļ uz kompakto skatu",
    ed_zoom: "Tālummaiņas poga",
    ed_zoom_helper: "Pārslēdz mini karti uz pilno karti un atpakaļ",
  },
  el: {
    unavailable: "Μη διαθέσιμο",
    turn_all_off: "Απενεργοποίηση όλων",
    ed_title: "Τίτλος",
    ed_show_title: "Εμφάνιση τίτλου",
    ed_advanced: "Για προχωρημένους",
    ed_language: "Γλώσσα",
    ed_language_helper: "Κενό: η γλώσσα του Home Assistant",
    ed_language_auto: "Αυτόματα",
    ed_navigation_path: "Διαδρομή πλοήγησης",
    err_config: "Ορίστε `area` ή `entities`",
    zoom_in: "Εμφάνιση της πλήρους κάρτας",
    zoom_out: "Επιστροφή στη συμπαγή προβολή",
    ed_zoom: "Κουμπί ζουμ",
    ed_zoom_helper: "Εναλλάσσει τη μίνι κάρτα με την πλήρη κάρτα",
  },
};

// ── Sports ───────────────────────────────────────────────────────────────────
// A team is a TeamTracker sensor: its state is the game's (PRE before, IN during, POST after, BYE, NOT_FOUND), its
// attributes the game itself: the two teams (name, abbreviation, logo, colours, score, record, winner), the clock and
// the period, the league, the venue, the TV network, the date, the last play. One sensor follows one team; several
// sensors (`entities`) are several teams, one tab each.
const ST_PLATFORM = "teamtracker";
const ST_STATES = ["PRE", "IN", "POST", "BYE", "NOT_FOUND"];

// The TeamTracker sensors of the home, in registry order.
const stSensors = (hass) =>
  Object.keys(hass.entities || {}).filter((id) => id.startsWith("sensor.") && hass.entities[id].platform === ST_PLATFORM);

const stNum = (v) => (v == null || v === "" || !Number.isFinite(Number(v)) ? null : Number(v));

// The sport, brought down to the families the card knows (their periods and the icon).
const stSport = (s) => {
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
const ST_PERIODS = { football: [4, 15], basketball: [4, 12], hockey: [3, 20], rugby: [2, 40] };
const stProgress = (sport, clock, period) => {
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
const stGame = (st) => {
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
const stDefaultTab = (games) => {
  const live = games.findIndex((g) => g.state === "IN");
  if (live >= 0) return live;
  let best = -1;
  games.forEach((g, i) => {
    if (g.state === "PRE" && g.date && (best < 0 || g.date < games[best].date)) best = i;
  });
  return Math.max(best, 0);
};

// The Intl formats, made once per language and options.
const stIntlCache = new Map();
const stIntl = (Kind, lang, opts) => {
  const key = `${Kind.name}|${lang}|${JSON.stringify(opts)}`;
  if (!stIntlCache.has(key)) stIntlCache.set(key, new Kind(lang, opts));
  return stIntlCache.get(key);
};

// Strings of the sports cards; the shared ones above (editor basics) complete them.
const ST_I18N = {
  en: {
    title: "Sports",
    st_live: "Live",
    st_pre: "Upcoming",
    st_won: "Won",
    st_lost: "Lost",
    st_draw: "Draw",
    st_final: "Final",
    st_bye: "Bye",
    st_none: "No game",
    st_offline: "Unavailable",
    vs: "vs",
    sub_bye: "Bye week",
    sub_none: "No game scheduled",
    quarter: "Q{n}",
    period: "P{n}",
    half: "H{n}",
    t_when: "When",
    t_where: "Where",
    t_tv: "TV",
    records: "Records: {v}",
    odds: "Odds {v}",
    win_prob: "Win probability {p} %",
    no_team: "No TeamTracker sensor found",
    ed_entity: "Team",
    ed_entity_helper: "A TeamTracker sensor",
    ed_entities: "More teams",
    ed_entities_helper: "Other TeamTracker sensors: one tab per team",
    ed_show_details: "Details (when, where, TV)",
    ed_show_last_play: "Last play",
    ed_show_subtitle: "Show subtitle",
    ed_illustration: "Illustrated header",
    ed_illustration_theme: "Header theme",
    ed_theme_auto: "Automatic (follows the theme)",
    ed_theme_day: "Day",
    ed_theme_night: "Night",
    ed_animations: "Animations",
    ed_title_helper: "Empty: the team's name",
  },
  fr: {
    title: "Sports",
    st_live: "En direct",
    st_pre: "À venir",
    st_won: "Victoire",
    st_lost: "Défaite",
    st_draw: "Nul",
    st_final: "Terminé",
    st_bye: "Exempt",
    st_none: "Pas de match",
    st_offline: "Indisponible",
    vs: "contre",
    sub_bye: "Semaine sans match",
    sub_none: "Aucun match prévu",
    quarter: "QT{n}",
    period: "P{n}",
    half: "MT{n}",
    t_when: "Quand",
    t_where: "Où",
    t_tv: "TV",
    records: "Bilans : {v}",
    odds: "Cote {v}",
    win_prob: "Chances de victoire {p} %",
    no_team: "Aucun capteur TeamTracker trouvé",
    ed_entity: "Équipe",
    ed_entity_helper: "Un capteur TeamTracker",
    ed_entities: "Autres équipes",
    ed_entities_helper: "D'autres capteurs TeamTracker : un onglet par équipe",
    ed_show_details: "Détails (quand, où, TV)",
    ed_show_last_play: "Dernière action",
    ed_show_subtitle: "Afficher le sous-titre",
    ed_illustration: "En-tête illustré",
    ed_illustration_theme: "Thème de l'en-tête",
    ed_theme_auto: "Automatique (suit le thème)",
    ed_theme_day: "Jour",
    ed_theme_night: "Nuit",
    ed_animations: "Animations",
    ed_title_helper: "Vide : le nom de l'équipe",
  },
  de: {
    title: "Sport",
    st_live: "Live",
    st_pre: "Demnächst",
    st_won: "Sieg",
    st_lost: "Niederlage",
    st_draw: "Unentschieden",
    st_final: "Beendet",
    st_bye: "Spielfrei",
    st_none: "Kein Spiel",
    st_offline: "Nicht verfügbar",
    vs: "gegen",
    sub_bye: "Spielfreie Woche",
    sub_none: "Kein Spiel geplant",
    quarter: "V{n}",
    period: "D{n}",
    half: "H{n}",
    t_when: "Wann",
    t_where: "Wo",
    t_tv: "TV",
    records: "Bilanzen: {v}",
    odds: "Quote {v}",
    win_prob: "Siegchance {p} %",
    no_team: "Kein TeamTracker-Sensor gefunden",
    ed_entity: "Team",
    ed_entity_helper: "Ein TeamTracker-Sensor",
    ed_entities: "Weitere Teams",
    ed_entities_helper: "Weitere TeamTracker-Sensoren: ein Tab pro Team",
    ed_show_details: "Details (wann, wo, TV)",
    ed_show_last_play: "Letzter Spielzug",
    ed_show_subtitle: "Untertitel anzeigen",
    ed_illustration: "Illustrierte Kopfzeile",
    ed_illustration_theme: "Design der Kopfzeile",
    ed_theme_auto: "Automatisch (folgt dem Design)",
    ed_theme_day: "Tag",
    ed_theme_night: "Nacht",
    ed_animations: "Animationen",
    ed_title_helper: "Leer: der Name des Teams",
  },
  es: {
    title: "Deportes",
    st_live: "En directo",
    st_pre: "Próximo",
    st_won: "Victoria",
    st_lost: "Derrota",
    st_draw: "Empate",
    st_final: "Finalizado",
    st_bye: "Descanso",
    st_none: "Sin partido",
    st_offline: "No disponible",
    vs: "contra",
    sub_bye: "Semana sin partido",
    sub_none: "Ningún partido previsto",
    quarter: "C{n}",
    period: "P{n}",
    half: "T{n}",
    t_when: "Cuándo",
    t_where: "Dónde",
    t_tv: "TV",
    records: "Balances: {v}",
    odds: "Cuota {v}",
    win_prob: "Probabilidad de victoria {p} %",
    no_team: "No se encontró ningún sensor TeamTracker",
    ed_entity: "Equipo",
    ed_entity_helper: "Un sensor TeamTracker",
    ed_entities: "Más equipos",
    ed_entities_helper: "Otros sensores TeamTracker: una pestaña por equipo",
    ed_show_details: "Detalles (cuándo, dónde, TV)",
    ed_show_last_play: "Última jugada",
    ed_show_subtitle: "Mostrar subtítulo",
    ed_illustration: "Encabezado ilustrado",
    ed_illustration_theme: "Tema del encabezado",
    ed_theme_auto: "Automático (sigue el tema)",
    ed_theme_day: "Día",
    ed_theme_night: "Noche",
    ed_animations: "Animaciones",
    ed_title_helper: "Vacío: el nombre del equipo",
  },
  sr: {
    title: "Спорт",
    st_live: "Уживо",
    st_pre: "Предстоји",
    st_won: "Победа",
    st_lost: "Пораз",
    st_draw: "Нерешено",
    st_final: "Завршено",
    st_bye: "Слободни",
    st_none: "Нема утакмице",
    st_offline: "Недоступно",
    vs: "против",
    sub_bye: "Слободна недеља",
    sub_none: "Нема заказане утакмице",
    quarter: "Ч{n}",
    period: "Т{n}",
    half: "П{n}",
    t_when: "Када",
    t_where: "Где",
    t_tv: "ТВ",
    records: "Учинак: {v}",
    odds: "Квота {v}",
    win_prob: "Шанса за победу {p} %",
    no_team: "Није пронађен TeamTracker сензор",
    ed_entity: "Тим",
    ed_entity_helper: "TeamTracker сензор",
    ed_entities: "Још тимова",
    ed_entities_helper: "Други TeamTracker сензори: једна картица по тиму",
    ed_show_details: "Детаљи (када, где, ТВ)",
    ed_show_last_play: "Последња акција",
    ed_show_subtitle: "Прикажи поднаслов",
    ed_illustration: "Илустровано заглавље",
    ed_illustration_theme: "Тема заглавља",
    ed_theme_auto: "Аутоматски (прати тему)",
    ed_theme_day: "Дан",
    ed_theme_night: "Ноћ",
    ed_animations: "Анимације",
    ed_title_helper: "Празно: име тима",
  },
  "sr-Latn": {
    title: "Sport",
    st_live: "Uživo",
    st_pre: "Predstoji",
    st_won: "Pobeda",
    st_lost: "Poraz",
    st_draw: "Nerešeno",
    st_final: "Završeno",
    st_bye: "Slobodni",
    st_none: "Nema utakmice",
    st_offline: "Nedostupno",
    vs: "protiv",
    sub_bye: "Slobodna nedelja",
    sub_none: "Nema zakazane utakmice",
    quarter: "Č{n}",
    period: "T{n}",
    half: "P{n}",
    t_when: "Kada",
    t_where: "Gde",
    t_tv: "TV",
    records: "Učinak: {v}",
    odds: "Kvota {v}",
    win_prob: "Šansa za pobedu {p} %",
    no_team: "Nije pronađen TeamTracker senzor",
    ed_entity: "Tim",
    ed_entity_helper: "TeamTracker senzor",
    ed_entities: "Još timova",
    ed_entities_helper: "Drugi TeamTracker senzori: jedna kartica po timu",
    ed_show_details: "Detalji (kada, gde, TV)",
    ed_show_last_play: "Poslednja akcija",
    ed_show_subtitle: "Prikaži podnaslov",
    ed_illustration: "Ilustrovano zaglavlje",
    ed_illustration_theme: "Tema zaglavlja",
    ed_theme_auto: "Automatski (prati temu)",
    ed_theme_day: "Dan",
    ed_theme_night: "Noć",
    ed_animations: "Animacije",
    ed_title_helper: "Prazno: ime tima",
  },
  it: {
    title: "Sport",
    st_live: "In diretta",
    st_pre: "In arrivo",
    st_won: "Vittoria",
    st_lost: "Sconfitta",
    st_draw: "Pareggio",
    st_final: "Terminata",
    st_bye: "Riposo",
    st_none: "Nessuna partita",
    st_offline: "Non disponibile",
    vs: "contro",
    sub_bye: "Settimana di riposo",
    sub_none: "Nessuna partita in programma",
    quarter: "Q{n}",
    period: "P{n}",
    half: "T{n}",
    t_when: "Quando",
    t_where: "Dove",
    t_tv: "TV",
    records: "Bilanci: {v}",
    odds: "Quota {v}",
    win_prob: "Probabilità di vittoria {p} %",
    no_team: "Nessun sensore TeamTracker trovato",
    ed_entity: "Squadra",
    ed_entity_helper: "Un sensore TeamTracker",
    ed_entities: "Altre squadre",
    ed_entities_helper: "Altri sensori TeamTracker: una scheda per squadra",
    ed_show_details: "Dettagli (quando, dove, TV)",
    ed_show_last_play: "Ultima azione",
    ed_show_subtitle: "Mostra sottotitolo",
    ed_illustration: "Intestazione illustrata",
    ed_illustration_theme: "Tema dell'intestazione",
    ed_theme_auto: "Automatico (segue il tema)",
    ed_theme_day: "Giorno",
    ed_theme_night: "Notte",
    ed_animations: "Animazioni",
    ed_title_helper: "Vuoto: il nome della squadra",
  },
  nl: {
    title: "Sport",
    st_live: "Live",
    st_pre: "Binnenkort",
    st_won: "Winst",
    st_lost: "Verlies",
    st_draw: "Gelijkspel",
    st_final: "Afgelopen",
    st_bye: "Vrij",
    st_none: "Geen wedstrijd",
    st_offline: "Niet beschikbaar",
    vs: "tegen",
    sub_bye: "Vrije week",
    sub_none: "Geen wedstrijd gepland",
    quarter: "K{n}",
    period: "P{n}",
    half: "H{n}",
    t_when: "Wanneer",
    t_where: "Waar",
    t_tv: "TV",
    records: "Balansen: {v}",
    odds: "Odds {v}",
    win_prob: "Winkans {p} %",
    no_team: "Geen TeamTracker-sensor gevonden",
    ed_entity: "Team",
    ed_entity_helper: "Een TeamTracker-sensor",
    ed_entities: "Meer teams",
    ed_entities_helper: "Andere TeamTracker-sensoren: één tabblad per team",
    ed_show_details: "Details (wanneer, waar, tv)",
    ed_show_last_play: "Laatste actie",
    ed_show_subtitle: "Ondertitel tonen",
    ed_illustration: "Geïllustreerde koptekst",
    ed_illustration_theme: "Thema van de koptekst",
    ed_theme_auto: "Automatisch (volgt het thema)",
    ed_theme_day: "Dag",
    ed_theme_night: "Nacht",
    ed_animations: "Animaties",
    ed_title_helper: "Leeg: de naam van het team",
  },
  pt: {
    title: "Desporto",
    st_live: "Em direto",
    st_pre: "Próximo",
    st_won: "Vitória",
    st_lost: "Derrota",
    st_draw: "Empate",
    st_final: "Terminado",
    st_bye: "Folga",
    st_none: "Sem jogo",
    st_offline: "Indisponível",
    vs: "contra",
    sub_bye: "Semana de folga",
    sub_none: "Nenhum jogo previsto",
    quarter: "P{n}",
    period: "P{n}",
    half: "P{n}",
    t_when: "Quando",
    t_where: "Onde",
    t_tv: "TV",
    records: "Registos: {v}",
    odds: "Odds {v}",
    win_prob: "Probabilidade de vitória {p} %",
    no_team: "Nenhum sensor TeamTracker encontrado",
    ed_entity: "Equipa",
    ed_entity_helper: "Um sensor TeamTracker",
    ed_entities: "Mais equipas",
    ed_entities_helper: "Outros sensores TeamTracker: um separador por equipa",
    ed_show_details: "Detalhes (quando, onde, TV)",
    ed_show_last_play: "Última jogada",
    ed_show_subtitle: "Mostrar subtítulo",
    ed_illustration: "Cabeçalho ilustrado",
    ed_illustration_theme: "Tema do cabeçalho",
    ed_theme_auto: "Automático (segue o tema)",
    ed_theme_day: "Dia",
    ed_theme_night: "Noite",
    ed_animations: "Animações",
    ed_title_helper: "Vazio: o nome da equipa",
  },
  pl: {
    title: "Sport",
    st_live: "Na żywo",
    st_pre: "Nadchodzący",
    st_won: "Wygrana",
    st_lost: "Porażka",
    st_draw: "Remis",
    st_final: "Zakończony",
    st_bye: "Pauza",
    st_none: "Brak meczu",
    st_offline: "Niedostępne",
    vs: "vs",
    sub_bye: "Tydzień pauzy",
    sub_none: "Brak zaplanowanego meczu",
    quarter: "K{n}",
    period: "T{n}",
    half: "P{n}",
    t_when: "Kiedy",
    t_where: "Gdzie",
    t_tv: "TV",
    records: "Bilanse: {v}",
    odds: "Kurs {v}",
    win_prob: "Szansa na wygraną {p} %",
    no_team: "Nie znaleziono czujnika TeamTracker",
    ed_entity: "Drużyna",
    ed_entity_helper: "Czujnik TeamTracker",
    ed_entities: "Więcej drużyn",
    ed_entities_helper: "Inne czujniki TeamTracker: jedna karta na drużynę",
    ed_show_details: "Szczegóły (kiedy, gdzie, TV)",
    ed_show_last_play: "Ostatnia akcja",
    ed_show_subtitle: "Pokaż podtytuł",
    ed_illustration: "Ilustrowany nagłówek",
    ed_illustration_theme: "Motyw nagłówka",
    ed_theme_auto: "Automatycznie (zgodnie z motywem)",
    ed_theme_day: "Dzień",
    ed_theme_night: "Noc",
    ed_animations: "Animacje",
    ed_title_helper: "Puste: nazwa drużyny",
  },
  ro: {
    title: "Sport",
    st_live: "În direct",
    st_pre: "Urmează",
    st_won: "Victorie",
    st_lost: "Înfrângere",
    st_draw: "Egal",
    st_final: "Încheiat",
    st_bye: "Liber",
    st_none: "Niciun meci",
    st_offline: "Indisponibil",
    vs: "vs",
    sub_bye: "Săptămână liberă",
    sub_none: "Niciun meci programat",
    quarter: "S{n}",
    period: "R{n}",
    half: "R{n}",
    t_when: "Când",
    t_where: "Unde",
    t_tv: "TV",
    records: "Bilanțuri: {v}",
    odds: "Cotă {v}",
    win_prob: "Șanse de victorie {p} %",
    no_team: "Nu s-a găsit niciun senzor TeamTracker",
    ed_entity: "Echipă",
    ed_entity_helper: "Un senzor TeamTracker",
    ed_entities: "Mai multe echipe",
    ed_entities_helper: "Alți senzori TeamTracker: o filă pe echipă",
    ed_show_details: "Detalii (când, unde, TV)",
    ed_show_last_play: "Ultima fază",
    ed_show_subtitle: "Afișează subtitlul",
    ed_illustration: "Antet ilustrat",
    ed_illustration_theme: "Tema antetului",
    ed_theme_auto: "Automat (urmează tema)",
    ed_theme_day: "Zi",
    ed_theme_night: "Noapte",
    ed_animations: "Animații",
    ed_title_helper: "Gol: numele echipei",
  },
  da: {
    title: "Sport",
    st_live: "Live",
    st_pre: "Kommende",
    st_won: "Sejr",
    st_lost: "Nederlag",
    st_draw: "Uafgjort",
    st_final: "Slut",
    st_bye: "Fri",
    st_none: "Ingen kamp",
    st_offline: "Utilgængelig",
    vs: "mod",
    sub_bye: "Kampfri uge",
    sub_none: "Ingen kamp planlagt",
    quarter: "K{n}",
    period: "P{n}",
    half: "H{n}",
    t_when: "Hvornår",
    t_where: "Hvor",
    t_tv: "TV",
    records: "Statistik: {v}",
    odds: "Odds {v}",
    win_prob: "Vinderchance {p} %",
    no_team: "Ingen TeamTracker-sensor fundet",
    ed_entity: "Hold",
    ed_entity_helper: "En TeamTracker-sensor",
    ed_entities: "Flere hold",
    ed_entities_helper: "Andre TeamTracker-sensorer: én fane pr. hold",
    ed_show_details: "Detaljer (hvornår, hvor, TV)",
    ed_show_last_play: "Seneste aktion",
    ed_show_subtitle: "Vis undertitel",
    ed_illustration: "Illustreret overskrift",
    ed_illustration_theme: "Overskriftens tema",
    ed_theme_auto: "Automatisk (følger temaet)",
    ed_theme_day: "Dag",
    ed_theme_night: "Nat",
    ed_animations: "Animationer",
    ed_title_helper: "Tom: holdets navn",
  },
  sv: {
    title: "Sport",
    st_live: "Live",
    st_pre: "Kommande",
    st_won: "Vinst",
    st_lost: "Förlust",
    st_draw: "Oavgjort",
    st_final: "Slut",
    st_bye: "Ledig",
    st_none: "Ingen match",
    st_offline: "Otillgänglig",
    vs: "mot",
    sub_bye: "Matchfri vecka",
    sub_none: "Ingen match planerad",
    quarter: "K{n}",
    period: "P{n}",
    half: "H{n}",
    t_when: "När",
    t_where: "Var",
    t_tv: "TV",
    records: "Statistik: {v}",
    odds: "Odds {v}",
    win_prob: "Vinstchans {p} %",
    no_team: "Ingen TeamTracker-sensor hittades",
    ed_entity: "Lag",
    ed_entity_helper: "En TeamTracker-sensor",
    ed_entities: "Fler lag",
    ed_entities_helper: "Andra TeamTracker-sensorer: en flik per lag",
    ed_show_details: "Detaljer (när, var, TV)",
    ed_show_last_play: "Senaste händelse",
    ed_show_subtitle: "Visa underrubrik",
    ed_illustration: "Illustrerad rubrik",
    ed_illustration_theme: "Rubrikens tema",
    ed_theme_auto: "Automatiskt (följer temat)",
    ed_theme_day: "Dag",
    ed_theme_night: "Natt",
    ed_animations: "Animationer",
    ed_title_helper: "Tom: lagets namn",
  },
  bg: {
    title: "Спорт",
    st_live: "На живо",
    st_pre: "Предстои",
    st_won: "Победа",
    st_lost: "Загуба",
    st_draw: "Равен",
    st_final: "Край",
    st_bye: "Почивка",
    st_none: "Няма мач",
    st_offline: "Недостъпно",
    vs: "срещу",
    sub_bye: "Седмица без мач",
    sub_none: "Няма насрочен мач",
    quarter: "Ч{n}",
    period: "П{n}",
    half: "П{n}",
    t_when: "Кога",
    t_where: "Къде",
    t_tv: "ТВ",
    records: "Резултати: {v}",
    odds: "Коефициент {v}",
    win_prob: "Шанс за победа {p} %",
    no_team: "Не е намерен сензор TeamTracker",
    ed_entity: "Отбор",
    ed_entity_helper: "Сензор TeamTracker",
    ed_entities: "Още отбори",
    ed_entities_helper: "Други сензори TeamTracker: по един раздел за отбор",
    ed_show_details: "Подробности (кога, къде, ТВ)",
    ed_show_last_play: "Последно действие",
    ed_show_subtitle: "Показване на подзаглавие",
    ed_illustration: "Илюстрирано заглавие",
    ed_illustration_theme: "Тема на заглавието",
    ed_theme_auto: "Автоматично (следва темата)",
    ed_theme_day: "Ден",
    ed_theme_night: "Нощ",
    ed_animations: "Анимации",
    ed_title_helper: "Празно: името на отбора",
  },
  ru: {
    title: "Спорт",
    st_live: "В эфире",
    st_pre: "Скоро",
    st_won: "Победа",
    st_lost: "Поражение",
    st_draw: "Ничья",
    st_final: "Завершён",
    st_bye: "Выходной",
    st_none: "Нет матча",
    st_offline: "Недоступно",
    vs: "против",
    sub_bye: "Неделя без матча",
    sub_none: "Матч не запланирован",
    quarter: "Ч{n}",
    period: "П{n}",
    half: "Т{n}",
    t_when: "Когда",
    t_where: "Где",
    t_tv: "ТВ",
    records: "Статистика: {v}",
    odds: "Коэффициент {v}",
    win_prob: "Шанс на победу {p} %",
    no_team: "Датчик TeamTracker не найден",
    ed_entity: "Команда",
    ed_entity_helper: "Датчик TeamTracker",
    ed_entities: "Другие команды",
    ed_entities_helper: "Другие датчики TeamTracker: по вкладке на команду",
    ed_show_details: "Подробности (когда, где, ТВ)",
    ed_show_last_play: "Последний эпизод",
    ed_show_subtitle: "Показывать подзаголовок",
    ed_illustration: "Иллюстрированный заголовок",
    ed_illustration_theme: "Тема заголовка",
    ed_theme_auto: "Автоматически (по теме)",
    ed_theme_day: "День",
    ed_theme_night: "Ночь",
    ed_animations: "Анимации",
    ed_title_helper: "Пусто: название команды",
  },
  uk: {
    title: "Спорт",
    st_live: "Наживо",
    st_pre: "Незабаром",
    st_won: "Перемога",
    st_lost: "Поразка",
    st_draw: "Нічия",
    st_final: "Завершено",
    st_bye: "Вихідний",
    st_none: "Немає матчу",
    st_offline: "Недоступно",
    vs: "проти",
    sub_bye: "Тиждень без матчу",
    sub_none: "Матч не заплановано",
    quarter: "Ч{n}",
    period: "П{n}",
    half: "Т{n}",
    t_when: "Коли",
    t_where: "Де",
    t_tv: "ТБ",
    records: "Статистика: {v}",
    odds: "Коефіцієнт {v}",
    win_prob: "Шанс на перемогу {p} %",
    no_team: "Датчик TeamTracker не знайдено",
    ed_entity: "Команда",
    ed_entity_helper: "Датчик TeamTracker",
    ed_entities: "Інші команди",
    ed_entities_helper: "Інші датчики TeamTracker: по вкладці на команду",
    ed_show_details: "Подробиці (коли, де, ТБ)",
    ed_show_last_play: "Останній епізод",
    ed_show_subtitle: "Показувати підзаголовок",
    ed_illustration: "Ілюстрований заголовок",
    ed_illustration_theme: "Тема заголовка",
    ed_theme_auto: "Автоматично (за темою)",
    ed_theme_day: "День",
    ed_theme_night: "Ніч",
    ed_animations: "Анімації",
    ed_title_helper: "Порожньо: назва команди",
  },
  hu: {
    title: "Sport",
    st_live: "Élő",
    st_pre: "Közelgő",
    st_won: "Győzelem",
    st_lost: "Vereség",
    st_draw: "Döntetlen",
    st_final: "Vége",
    st_bye: "Szabadnap",
    st_none: "Nincs meccs",
    st_offline: "Nem elérhető",
    vs: "ellen",
    sub_bye: "Meccs nélküli hét",
    sub_none: "Nincs tervezett meccs",
    quarter: "N{n}",
    period: "H{n}",
    half: "F{n}",
    t_when: "Mikor",
    t_where: "Hol",
    t_tv: "TV",
    records: "Mérleg: {v}",
    odds: "Szorzó {v}",
    win_prob: "Győzelmi esély {p} %",
    no_team: "Nem található TeamTracker-érzékelő",
    ed_entity: "Csapat",
    ed_entity_helper: "Egy TeamTracker-érzékelő",
    ed_entities: "További csapatok",
    ed_entities_helper: "Más TeamTracker-érzékelők: csapatonként egy lap",
    ed_show_details: "Részletek (mikor, hol, TV)",
    ed_show_last_play: "Utolsó játékszituáció",
    ed_show_subtitle: "Alcím megjelenítése",
    ed_illustration: "Illusztrált fejléc",
    ed_illustration_theme: "Fejléc témája",
    ed_theme_auto: "Automatikus (követi a témát)",
    ed_theme_day: "Nappal",
    ed_theme_night: "Éjszaka",
    ed_animations: "Animációk",
    ed_title_helper: "Üres: a csapat neve",
  },
  sk: {
    title: "Šport",
    st_live: "Naživo",
    st_pre: "Nadchádzajúci",
    st_won: "Výhra",
    st_lost: "Prehra",
    st_draw: "Remíza",
    st_final: "Skončené",
    st_bye: "Voľno",
    st_none: "Žiadny zápas",
    st_offline: "Nedostupné",
    vs: "proti",
    sub_bye: "Týždeň bez zápasu",
    sub_none: "Žiadny naplánovaný zápas",
    quarter: "Š{n}",
    period: "T{n}",
    half: "P{n}",
    t_when: "Kedy",
    t_where: "Kde",
    t_tv: "TV",
    records: "Bilancie: {v}",
    odds: "Kurz {v}",
    win_prob: "Šanca na výhru {p} %",
    no_team: "Nenašiel sa žiadny senzor TeamTracker",
    ed_entity: "Tím",
    ed_entity_helper: "Senzor TeamTracker",
    ed_entities: "Ďalšie tímy",
    ed_entities_helper: "Ďalšie senzory TeamTracker: jedna karta na tím",
    ed_show_details: "Podrobnosti (kedy, kde, TV)",
    ed_show_last_play: "Posledná akcia",
    ed_show_subtitle: "Zobraziť podnadpis",
    ed_illustration: "Ilustrovaná hlavička",
    ed_illustration_theme: "Téma hlavičky",
    ed_theme_auto: "Automaticky (podľa témy)",
    ed_theme_day: "Deň",
    ed_theme_night: "Noc",
    ed_animations: "Animácie",
    ed_title_helper: "Prázdne: názov tímu",
  },
  cs: {
    title: "Sport",
    st_live: "Živě",
    st_pre: "Nadcházející",
    st_won: "Výhra",
    st_lost: "Prohra",
    st_draw: "Remíza",
    st_final: "Skončeno",
    st_bye: "Volno",
    st_none: "Žádný zápas",
    st_offline: "Nedostupné",
    vs: "proti",
    sub_bye: "Týden bez zápasu",
    sub_none: "Žádný naplánovaný zápas",
    quarter: "Č{n}",
    period: "T{n}",
    half: "P{n}",
    t_when: "Kdy",
    t_where: "Kde",
    t_tv: "TV",
    records: "Bilance: {v}",
    odds: "Kurz {v}",
    win_prob: "Šance na výhru {p} %",
    no_team: "Nebyl nalezen žádný senzor TeamTracker",
    ed_entity: "Tým",
    ed_entity_helper: "Senzor TeamTracker",
    ed_entities: "Další týmy",
    ed_entities_helper: "Další senzory TeamTracker: jedna karta na tým",
    ed_show_details: "Podrobnosti (kdy, kde, TV)",
    ed_show_last_play: "Poslední akce",
    ed_show_subtitle: "Zobrazit podtitul",
    ed_illustration: "Ilustrovaná hlavička",
    ed_illustration_theme: "Motiv hlavičky",
    ed_theme_auto: "Automaticky (podle motivu)",
    ed_theme_day: "Den",
    ed_theme_night: "Noc",
    ed_animations: "Animace",
    ed_title_helper: "Prázdné: název týmu",
  },
  sl: {
    title: "Šport",
    st_live: "V živo",
    st_pre: "Prihaja",
    st_won: "Zmaga",
    st_lost: "Poraz",
    st_draw: "Neodločeno",
    st_final: "Končano",
    st_bye: "Prosto",
    st_none: "Ni tekme",
    st_offline: "Ni na voljo",
    vs: "proti",
    sub_bye: "Teden brez tekme",
    sub_none: "Ni načrtovane tekme",
    quarter: "Č{n}",
    period: "T{n}",
    half: "P{n}",
    t_when: "Kdaj",
    t_where: "Kje",
    t_tv: "TV",
    records: "Izkupički: {v}",
    odds: "Kvota {v}",
    win_prob: "Možnost zmage {p} %",
    no_team: "Senzor TeamTracker ni bil najden",
    ed_entity: "Ekipa",
    ed_entity_helper: "Senzor TeamTracker",
    ed_entities: "Več ekip",
    ed_entities_helper: "Drugi senzorji TeamTracker: en zavihek na ekipo",
    ed_show_details: "Podrobnosti (kdaj, kje, TV)",
    ed_show_last_play: "Zadnja akcija",
    ed_show_subtitle: "Prikaži podnaslov",
    ed_illustration: "Ilustrirana glava",
    ed_illustration_theme: "Tema glave",
    ed_theme_auto: "Samodejno (sledi temi)",
    ed_theme_day: "Dan",
    ed_theme_night: "Noč",
    ed_animations: "Animacije",
    ed_title_helper: "Prazno: ime ekipe",
  },
  lv: {
    title: "Sports",
    st_live: "Tiešraidē",
    st_pre: "Gaidāms",
    st_won: "Uzvara",
    st_lost: "Zaudējums",
    st_draw: "Neizšķirts",
    st_final: "Beidzies",
    st_bye: "Brīvs",
    st_none: "Nav spēles",
    st_offline: "Nav pieejams",
    vs: "pret",
    sub_bye: "Nedēļa bez spēles",
    sub_none: "Nav ieplānotas spēles",
    quarter: "C{n}",
    period: "P{n}",
    half: "P{n}",
    t_when: "Kad",
    t_where: "Kur",
    t_tv: "TV",
    records: "Bilances: {v}",
    odds: "Koeficients {v}",
    win_prob: "Uzvaras iespēja {p} %",
    no_team: "TeamTracker sensors nav atrasts",
    ed_entity: "Komanda",
    ed_entity_helper: "TeamTracker sensors",
    ed_entities: "Vēl komandas",
    ed_entities_helper: "Citi TeamTracker sensori: viena cilne katrai komandai",
    ed_show_details: "Sīkāk (kad, kur, TV)",
    ed_show_last_play: "Pēdējā darbība",
    ed_show_subtitle: "Rādīt apakšvirsrakstu",
    ed_illustration: "Ilustrēta galvene",
    ed_illustration_theme: "Galvenes motīvs",
    ed_theme_auto: "Automātiski (pēc motīva)",
    ed_theme_day: "Diena",
    ed_theme_night: "Nakts",
    ed_animations: "Animācijas",
    ed_title_helper: "Tukšs: komandas nosaukums",
  },
  el: {
    title: "Αθλήματα",
    st_live: "Ζωντανά",
    st_pre: "Επερχόμενος",
    st_won: "Νίκη",
    st_lost: "Ήττα",
    st_draw: "Ισοπαλία",
    st_final: "Τέλος",
    st_bye: "Ρεπό",
    st_none: "Κανένας αγώνας",
    st_offline: "Μη διαθέσιμο",
    vs: "εναντίον",
    sub_bye: "Εβδομάδα χωρίς αγώνα",
    sub_none: "Δεν έχει προγραμματιστεί αγώνας",
    quarter: "Π{n}",
    period: "Π{n}",
    half: "Η{n}",
    t_when: "Πότε",
    t_where: "Πού",
    t_tv: "TV",
    records: "Απολογισμοί: {v}",
    odds: "Απόδοση {v}",
    win_prob: "Πιθανότητα νίκης {p} %",
    no_team: "Δεν βρέθηκε αισθητήρας TeamTracker",
    ed_entity: "Ομάδα",
    ed_entity_helper: "Ένας αισθητήρας TeamTracker",
    ed_entities: "Περισσότερες ομάδες",
    ed_entities_helper: "Άλλοι αισθητήρες TeamTracker: μία καρτέλα ανά ομάδα",
    ed_show_details: "Λεπτομέρειες (πότε, πού, TV)",
    ed_show_last_play: "Τελευταία φάση",
    ed_show_subtitle: "Εμφάνιση υπότιτλου",
    ed_illustration: "Εικονογραφημένη κεφαλίδα",
    ed_illustration_theme: "Θέμα κεφαλίδας",
    ed_theme_auto: "Αυτόματο (ακολουθεί το θέμα)",
    ed_theme_day: "Ημέρα",
    ed_theme_night: "Νύχτα",
    ed_animations: "Κινούμενα σχέδια",
    ed_title_helper: "Κενό: το όνομα της ομάδας",
  },
};

// ── Helpers ──────────────────────────────────────────────────────────────────
const rcLang = (i18n, hass, config) => {
  // The full tag when the card has it (sr-Latn), else its base language (fr-FR → fr, pt-BR → pt), else English.
  const l = config?.language || hass?.locale?.language || hass?.language || "en";
  const base = l.split("-")[0];
  return i18n[l] ? l : i18n[base] ? base : "en";
};

const rcT = (i18n, lang, key, vars = {}) => {
  const s = i18n[lang]?.[key] ?? RC_I18N[lang]?.[key] ?? i18n.en[key] ?? RC_I18N.en[key] ?? key;
  return s.replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? "");
};

const rcEsc = (s) =>
  String(s ?? "").replace(
    /[&<>"']/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c],
  );

const rcMoreInfo = (node, entityId) => {
  const ev = new Event("hass-more-info", { bubbles: true, composed: true });
  ev.detail = { entityId };
  node.dispatchEvent(ev);
};

const rcNavigate = (path) => {
  history.pushState(null, "", path);
  window.dispatchEvent(new CustomEvent("location-changed", { detail: { replace: false } }));
};

// Wires a card header to its `navigation_path`: click, and Enter on the header itself.
const rcBindNav = (head, path) => {
  head.addEventListener("click", () => rcNavigate(path));
  head.addEventListener("keydown", (ev) => {
    if (ev.key === "Enter" && ev.target === head) rcNavigate(path);
  });
};

// HA's callService already shows a toast when the call fails, then rejects: the rejection is only swallowed here
// so that it does not end up as "Uncaught (in promise)".
const rcCall = (hass, domain, service, data) => Promise.resolve(hass.callService(domain, service, data)).catch(() => {});

// A click inside a dialog (more-info opened from the card, say) is not a click outside the card.
const rcInDialog = (ev) => ev.composedPath().some((n) => ["ha-more-info-dialog", "ha-dialog", "dialog"].includes(n.localName));

// `fn()`, computed again only when one of `deps` is no longer the same object (or value) as last time.
const rcMemo = (store, key, deps, fn) => {
  const hit = store[key];
  if (hit && hit.deps.length === deps.length && hit.deps.every((d, i) => d === deps[i])) return hit.value;
  const value = fn();
  store[key] = { deps, value };
  return value;
};

// ── Base card ────────────────────────────────────────────────────────────────
class RcCard extends HTMLElement {
  static getStubConfig(hass) {
    const areas = Object.keys(hass?.areas ?? {});
    return { area: areas[0] ?? "" };
  }

  // Subclasses set: static i18n, static defaults, static tag, static styles.
  static getConfigElement() {
    // biome-ignore lint/complexity/noThisInStatic: each subclass opens its own editor.
    return document.createElement(`${this.tag}-editor`);
  }

  setConfig(config) {
    if (this.constructor.needsArea && !config.area && !config.entities?.length && !config.include?.length) {
      throw new Error(rcT(this.constructor.i18n, rcLang(this.constructor.i18n, this._hass, config), "err_config"));
    }
    this._config = { ...this.constructor.defaults, ...config };
    // show_title: the header's title, hidden by the stylesheet
    this.toggleAttribute?.("hide-title", config.show_title === false);
    if (!this.shadowRoot) this._attach();
    this._sig = null;
    this._render();
  }

  // The shadow root, and no rewrite of the card between a press anywhere in it and the end of the click: Home
  // Assistant updates the card several times a second, and a rewrite under the pointer replaces the element pressed,
  // so that the click lands on the card itself and does nothing (the tiles already hold it, see _bindPress; this
  // covers the rest: header button, detail button, rows, popup). The pending update is rendered once released.
  _attach() {
    const root = this.attachShadow({ mode: "open" });
    this._onPressEnd = () => {
      window.removeEventListener("pointerup", this._onPressEnd, true);
      window.removeEventListener("pointercancel", this._onPressEnd, true);
      // After the click, which comes in the same task as the release.
      setTimeout(() => {
        if (this._pressing) this._released();
      }, 0);
    };
    root.addEventListener("pointerdown", (ev) => {
      this._byPointer = true;
      if (ev.button !== 0) return;
      this._pressing = true;
      window.addEventListener("pointerup", this._onPressEnd, true);
      window.addEventListener("pointercancel", this._onPressEnd, true);
    });
    // The focus is kept across rewrites for the keyboard only (no focus ring after a mouse click or a tap).
    root.addEventListener("keydown", () => {
      this._byPointer = false;
    });
  }

  disconnectedCallback() {
    super.disconnectedCallback?.();
    window.removeEventListener("pointerup", this._onPressEnd, true);
    window.removeEventListener("pointercancel", this._onPressEnd, true);
    // A press cut short by the detach never gets its release: rendered now, and the next updates too.
    if (this._pressing) this._released();
  }

  set hass(hass) {
    this._hass = hass;
    // No re-render during a drag or a press: it would replace the tile under the finger.
    if (this._dragging || this._pressing) this._deferred = true;
    else this._render();
  }

  // The tiles actually shown (`only_on` / `only_alerts` applied), nothing when the card is hidden.
  getCardSize() {
    if (this.style.display === "none") return 0;
    const n = this._shown ?? this._items?.length ?? 0;
    if (!n || !this._config) return 1;
    // A row of large tiles (`layout: tiles`) is about one and a half rows of compact ones.
    const rows = Math.ceil(n / this._cols());
    return 1 + (this._tiles() ? Math.ceil(rows * 1.5) : rows);
  }

  getGridOptions() {
    return { columns: 12, min_columns: 6, rows: "auto" };
  }

  _lang() {
    return rcLang(this.constructor.i18n, this._hass, this._config);
  }

  _t(key, vars) {
    return rcT(this.constructor.i18n, this._lang(), key, vars);
  }

  _areaName() {
    const c = this._config;
    return c.area ? (this._hass.areas?.[c.area]?.name ?? c.area) : "";
  }

  // Re-render only when something visible changed.
  _changed(parts) {
    const sig = JSON.stringify([this._config, this._lang(), parts]);
    if (sig === this._sig) return false;
    this._sig = sig;
    return true;
  }

  // Subclasses implement `_collect()` (the tiles) and `_draw(items)`.
  _render() {
    if (!this._config || !this._hass || !this.shadowRoot) return;
    this._items = this._collect();
    this._draw(this._items);
  }

  _cols() {
    return Math.min(4, Math.max(1, Number(this._config.columns) || 2));
  }

  // `layout: tiles`: one large tile per entity, the size of Home Assistant's Tile card (easier to tap on a phone).
  _tiles() {
    return this._config?.layout === "tiles";
  }

  _paint(level, head, tiles, extraClass = "") {
    // The tile or control with the keyboard focus keeps it through the redraw (a toggle, a step or a two-tap
    // confirmation from the keyboard): tiles by their data-id, controls by their data-k.
    const active = this._byPointer ? null : this.shadowRoot.activeElement;
    const focused = active?.dataset?.id;
    const focusKey = active?.dataset?.k;
    this.shadowRoot.innerHTML = `
      <style>${RC_BASE_STYLES}${this.constructor.styles}</style>
      <ha-card class="lvl-${level}${extraClass}${this._tiles() ? " layout-tiles" : ""}">
        ${head}
        ${tiles ? `<div class="grid" style="--cols:${this._cols()}">${tiles}</div>` : ""}
        ${this._afterGrid()}
      </ha-card>`;
    const root = this.shadowRoot;
    root.querySelector(".pill.action")?.addEventListener("click", (ev) => this._allOff(ev));
    if (this._config.navigation_path) rcBindNav(root.querySelector(".head"), this._config.navigation_path);
    for (const el of root.querySelectorAll(".tile")) {
      this._bindTile(el, (this._items || []).find((i) => i.id === el.dataset.id));
      if (focused && el.dataset.id === focused) el.focus({ preventScroll: true });
    }
    this._bindAfter(root);
    if (focusKey) root.querySelector(`[data-k="${focusKey}"]`)?.focus({ preventScroll: true });
  }

  // What a card adds under its tiles (the Lights card's scenes), and its event wiring.
  _afterGrid() {
    return "";
  }

  _bindAfter() {}

  // The "turn everything off" button of the header (full card) or of the status (mini card).
  _allOff(ev) {
    ev.stopPropagation();
    const ids = (this._items || []).filter((i) => i.on).map((i) => i.id);
    if (!ids.length) return;
    // A host card may ask first (the Overview confirms before turning plugs off); otherwise off at once.
    if (this._confirmOff) this._confirmOff(ids);
    else rcCall(this._hass, "homeassistant", "turn_off", { entity_id: ids });
  }

  // Tap, hold for more-info, and an optional horizontal drag ({ move(x), end(x), step(delta), flush() }). From the
  // keyboard: Enter / Space tap, Shift+Enter or the context-menu key open the details, ←/→ step the drag by ∓/±10
  // (a held key at most every RC_REPEAT_MS), and releasing the arrow calls `flush`.
  _bindPress(el, { onTap, onHold, drag }) {
    let start = null;
    let mode = null; // null | "hold" | "drag"
    let timer = null;
    let lastStep = 0;
    el.addEventListener("pointerdown", (ev) => {
      if (ev.button !== 0) return;
      start = { x: ev.clientX, y: ev.clientY };
      mode = null;
      this._pressing = true;
      clearTimeout(timer);
      timer = setTimeout(() => {
        // The card may have been detached mid-press (nothing else clears this timer): no hold on a dead node.
        if (mode || !this.isConnected) return;
        mode = "hold";
        // The press is settled (no tap): the details may open over the tile, so its pointerup may never come.
        this._released();
        onHold();
      }, RC_HOLD_MS);
    });
    el.addEventListener("pointermove", (ev) => {
      if (!start || mode === "hold") return;
      const dx = ev.clientX - start.x;
      const dy = ev.clientY - start.y;
      if (!mode && drag && Math.abs(dx) > RC_MOVE_PX && Math.abs(dx) > Math.abs(dy)) {
        mode = "drag";
        clearTimeout(timer);
        this._dragging = true;
        el.setPointerCapture(ev.pointerId);
        el.classList.add("dragging");
      } else if (!mode && (Math.abs(dx) > RC_MOVE_PX || Math.abs(dy) > RC_MOVE_PX)) {
        clearTimeout(timer); // scrolling, or dragging what cannot be dragged: not a tap
        start = null;
        this._released();
      }
      if (mode === "drag") drag.move(ev.clientX);
    });
    const end = (ev, cancelled) => {
      clearTimeout(timer);
      if (!start) return;
      const wasDrag = mode === "drag";
      if (wasDrag) {
        this._dragging = false;
        el.classList.remove("dragging");
        if (!cancelled) drag.end(ev.clientX);
        this._sig = null;
      } else if (!mode && !cancelled) {
        onTap();
      }
      start = null;
      mode = null;
      // After a drag, the next update redraws (the bar keeps the new level until the light reports it).
      this._released(!wasDrag);
    };
    // The mouse leaving the tile mid-press (no capture outside a drag) cancels it: neither a tap nor a hold.
    el.addEventListener("pointerleave", () => {
      if (!start || mode) return;
      clearTimeout(timer);
      start = null;
      this._released();
    });
    el.addEventListener("pointerup", (ev) => end(ev, false));
    el.addEventListener("pointercancel", (ev) => end(ev, true));
    el.addEventListener("contextmenu", (ev) => ev.preventDefault());
    el.addEventListener("keydown", (ev) => {
      if ((ev.key === "Enter" && ev.shiftKey) || ev.key === "ContextMenu") {
        ev.preventDefault();
        if (!ev.repeat) onHold();
      } else if (ev.key === "Enter" || ev.key === " ") {
        ev.preventDefault();
        if (!ev.repeat) onTap();
      } else if (drag?.step && (ev.key === "ArrowLeft" || ev.key === "ArrowRight")) {
        ev.preventDefault();
        if (ev.repeat && ev.timeStamp - lastStep < RC_REPEAT_MS) return;
        lastStep = ev.timeStamp;
        drag.step(ev.key === "ArrowRight" ? 10 : -10);
      }
    });
    // The arrow released: the stepped level goes out now rather than after the pause.
    el.addEventListener("keyup", (ev) => {
      if (ev.key === "ArrowLeft" || ev.key === "ArrowRight") drag?.flush?.();
    });
  }

  // End of a press: renders now what an update brought during it.
  _released(flush = true) {
    this._pressing = false;
    if (!this._deferred || this._dragging) return;
    this._deferred = false;
    if (flush) this._render();
  }

  // Default tile: tap toggles, hold opens the details.
  _bindTile(el, item) {
    this._bindPress(el, {
      onTap: () => !item?.unavailable && rcCall(this._hass, "homeassistant", "toggle", { entity_id: el.dataset.id }),
      onHold: () => rcMoreInfo(this, el.dataset.id),
    });
  }
}

// ── Mini cards ───────────────────────────────────────────────────────────────
// A mini card shows what its full card (`Base`) shows on two lines: the room badge, title and status, then one chip
// per entity. Its zoom button (top right, `zoom: false` removes it) switches it to the full card and back; a click
// anywhere else brings it back too.
// The subclass implements `_drawMini(items)`, which builds the chips and calls `_paintMini`.
// Zoomed in, everything is shown (`only_alerts` and `hide_when_clear` only apply to the compact view). With
// `alertsOnly`, the compact view always shows only what needs a look (no `only_alerts` option then): quiet entities
// show once zoomed in.
const rcMini = (Base, tag, styles, { alertsOnly = false } = {}) =>
  class extends Base {
    static tag = tag;
    static defaults = (({ only_alerts, ...rest }) => ({ ...rest, ...(alertsOnly ? {} : { only_alerts }), zoom: true }))(
      Base.defaults,
    );
    static styles = `${Base.styles}${RC_MINI_STYLES}${styles}`;

    constructor() {
      super();
      // A click anywhere else brings the card back to its compact view.
      this._onUnzoom = (ev) => {
        if (rcOutside(this, ev)) rcUnzoom(this);
      };
    }

    connectedCallback() {
      super.connectedCallback?.();
      this._unzoom ??= watchOutside(this, this._onUnzoom);
      this._unzoom.on();
    }

    disconnectedCallback() {
      super.disconnectedCallback?.();
      this._unzoom?.off();
      // Left (another dashboard view, a conditional card hidden): back to the compact view.
      rcUnzoom(this);
    }

    getCardSize() {
      if (this._zoomed) return super.getCardSize();
      return this.style.display === "none" ? 0 : 1;
    }

    getGridOptions() {
      return { columns: 12, min_columns: 6, rows: "auto" };
    }

    _draw(items) {
      const config = this._config;
      // The base card's own filter does the work: off zoomed in, always on in an `alertsOnly` compact view.
      if (this._zoomed) this._config = { ...config, only_alerts: false, hide_when_clear: false };
      else if (alertsOnly) this._config = { ...config, only_alerts: true };
      try {
        if (this._zoomed) super._draw(items);
        else this._drawMini(items);
      } finally {
        this._config = config;
      }
      this._addZoom();
    }

    _paintMini({ level, icon, status, chips, cls = "", allOff = false }) {
      const c = this._config;
      const nav = c.navigation_path;
      // With `allOff` the status is the "turn everything off" button, like the full card's pill.
      const st = allOff
        ? `<button class="st action" title="${rcEsc(this._t("turn_all_off"))}"><ha-icon icon="mdi:power"></ha-icon><span class="pt">${rcEsc(status)}</span></button>`
        : `<span class="st" title="${rcEsc(status)}"><span class="pt">${rcEsc(status)}</span></span>`;
      this.shadowRoot.innerHTML = `
        <style>${RC_BASE_STYLES}${this.constructor.styles}</style>
        <ha-card class="lvl-${level}${cls}">
          <div class="mini">
            <div class="badge" title="${rcEsc(status)}"><ha-icon icon="${rcEsc(icon)}"></ha-icon></div>
            <div class="body">
              <div class="head${nav ? " nav" : ""}"${nav ? ' role="link" tabindex="0"' : ""}>
                <div class="title">${rcEsc(c.title || this._areaName() || this._t("title"))}</div>
                ${st}
              </div>
              <div class="rs">${chips}</div>
            </div>
          </div>
        </ha-card>`;
      const root = this.shadowRoot;
      if (nav) rcBindNav(root.querySelector(".head"), nav);
      root.querySelector(".st.action")?.addEventListener("click", (ev) => this._allOff(ev));
      for (const el of root.querySelectorAll(".r")) el.addEventListener("click", () => rcMoreInfo(this, el.dataset.id));
    }

    // Zoom button at the end of the header, top right in both views, added once per render.
    // Its click is the overviews' (rcZoomClick): stop the tap on the title (navigation_path), toggle, keep the
    // keyboard focus (Enter / Space: no click count) on the button that replaced this one.
    _addZoom() {
      const head = this._config.zoom && this.shadowRoot.querySelector(".head");
      if (!head || head.querySelector(".zoom")) return;
      const button = document.createElement("button");
      button.className = "zoom";
      button.title = this._t(this._zoomed ? "zoom_out" : "zoom_in");
      button.innerHTML = `<ha-icon icon="${rcZoomIcon(this)}"></ha-icon>`;
      button.addEventListener("click", (ev) => rcZoomClick(this, ev));
      head.appendChild(button);
    }
  };

const rcBooleans = (...names) => names.map((name) => ({ name, selector: { boolean: {} } }));

const rcAdvanced = (i18n, lang, ...names) => [
  {
    name: "advanced",
    type: "expandable",
    flatten: true,
    schema: names.map((name) =>
      name === "language"
        ? {
            name,
            selector: {
              select: {
                mode: "dropdown",
                options: [
                  { value: "", label: rcT(i18n, lang, "ed_language_auto") },
                  { value: "en", label: "English" },
                  { value: "fr", label: "Français" },
                  { value: "de", label: "Deutsch" },
                  { value: "es", label: "Español" },
                  { value: "sr", label: "Српски" },
                  { value: "sr-Latn", label: "Srpski (latinica)" },
                  { value: "it", label: "Italiano" },
                  { value: "nl", label: "Nederlands" },
                  { value: "pt", label: "Português (Portugal)" },
                  { value: "pl", label: "Polski" },
                  { value: "ro", label: "Română" },
                  { value: "da", label: "Dansk" },
                  { value: "sv", label: "Svenska" },
                  { value: "bg", label: "Български" },
                  { value: "ru", label: "Русский" },
                  { value: "uk", label: "Українська" },
                  { value: "hu", label: "Magyar" },
                  { value: "sk", label: "Slovenčina" },
                  { value: "cs", label: "Čeština" },
                  { value: "sl", label: "Slovenščina" },
                  { value: "lv", label: "Latviešu" },
                  { value: "el", label: "Ελληνικά" },
                ],
              },
            },
          }
        : { name, selector: { object: {} } },
    ),
  },
];
// `schema(lang, hass, config)` lists the fields; options left at the card's default are not written to the YAML
// (list defaults such as `exclude: []` are not shown in the form: an empty list is never written anyway).
// `autos` maps an option to its default worked out from the config (`(hass, config) => value`): shown in the form
// while unset, and kept out of the YAML when left at it.
// Entity lists the form edits with an entity picker (ids only): an item written `{ entity, name, icon }` in YAML shows as its entity,
// and gets its name and icon back when the form changes the list (ha-room-card#77).
const RC_ENTITY_LISTS = ["include"];
const rcListIds = (list) => (Array.isArray(list) ? list.map((e) => (typeof e === "string" ? e : e?.entity)).filter(Boolean) : list);
const rcListKeep = (ids, before) =>
  Array.isArray(ids) ? ids.map((id) => (Array.isArray(before) ? before.find((e) => typeof e === "object" && e?.entity === id) : undefined) ?? id) : ids;

const rcEditor = ({ card, helpers, schema, autos = {} }) => {
  const i18n = card.i18n;
  const defaults = { show_title: true, ...Object.fromEntries(Object.entries(card.defaults).filter(([, v]) => !Array.isArray(v))) };
  return class extends HTMLElement {
    setConfig(config) {
      this._config = config;
      this._update();
    }

    set hass(hass) {
      this._hass = hass;
      this._update();
    }

    _update() {
      if (!this._hass || !this._config) return;
      const lang = rcLang(i18n, this._hass, this._config);
      // Read by the label and helper callbacks, set once on the form: a language change must reach them too.
      this._lang = lang;
      if (!this._form) {
        this._form = document.createElement("ha-form");
        this._form.computeLabel = (s) => rcT(i18n, this._lang, `ed_${s.name}`);
        this._form.computeHelper = (s) =>
          helpers.includes(s.name) ? rcT(i18n, this._lang, `ed_${s.name}_helper`) : undefined;
        this._form.addEventListener("value-changed", (ev) => {
          const config = { ...ev.detail.value };
          for (const k of RC_ENTITY_LISTS) if (k in config) config[k] = rcListKeep(config[k], this._config[k]);
          for (const k of Object.keys(config)) {
            const v = config[k];
            if (v === "" || v == null || (Array.isArray(v) && !v.length) || defaults[k] === v) delete config[k];
          }
          for (const [k, auto] of Object.entries(autos)) {
            const untouched = this._config[k] === undefined && config[k] === auto(this._hass, this._config);
            if (untouched || config[k] === auto(this._hass, config)) delete config[k];
          }
          this.dispatchEvent(new CustomEvent("config-changed", { detail: { config }, bubbles: true, composed: true }));
        });
        this.appendChild(this._form);
      }
      this._form.hass = this._hass;
      // A new data or schema object re-renders the whole form, and the schema runs the card's discovery:
      // both only change with the config, the language or the registries.
      const memo = (this._memo ||= {});
      const h = this._hass;
      this._form.data = rcMemo(memo, "data", [this._config, h.areas], () => {
        const data = { ...defaults, ...this._config };
        for (const k of RC_ENTITY_LISTS) if (k in data) data[k] = rcListIds(data[k]);
        for (const [k, auto] of Object.entries(autos)) data[k] ??= auto(h, this._config);
        return data;
      });
      this._form.schema = rcMemo(memo, "schema", [lang, this._config, h.entities, h.devices, h.areas], () =>
        schema(lang, h, this._config),
      );
    }
  };
};

const rcRegister = (card, editor, name, description) => {
  if (customElements.get(card.tag)) return;
  customElements.define(card.tag, card);
  customElements.define(`${card.tag}-editor`, editor);
  window.customCards = window.customCards || [];
  window.customCards.push({
    type: card.tag,
    name,
    description,
    preview: true,
    documentationURL: "https://github.com/juju35/ha-sports-card",
  });
};

if (!customElements.get("sports-card")) {
  console.info(`%c HA-SPORTS-CARD %c v${RC_VERSION} `, "background:#1098ad;color:#fff;font-weight:700", "");
}

// ── Common styles ────────────────────────────────────────────────────────────
const RC_BASE_STYLES = `
  :host {
    --rc-ok: var(--success-color, #43a047);
    --rc-warn: var(--warning-color, #ffa600);
    --rc-alert: var(--error-color, #db4437);
    --rc-info: var(--info-color, #039be5);
    --rc-light: var(--state-light-active-color, #ffb300);
    --rc-plug: var(--state-switch-on-color, var(--primary-color, #03a9f4));
    --rc-idle: var(--secondary-text-color, #9e9e9e);
    --rc-na: var(--disabled-color, #9e9e9e);
    display: block;
    min-width: 0;
  }
  /* The card answers its own width (container queries). That containment drops its content from its natural width: in
     a wrapper sized by its content (inline-block, a grid's auto column, a flex row: layout-card, button-card…) it would
     shrink to its padding. The empty grid below (no height) gives the host a natural width of 344 px there, as a
     preferred width only: its column is minmax(0, …), so the card still shrinks to its column in a grid card, a
     horizontal stack or a 1fr column, even wrapped in a <div> (hui-card in layout-card). contain-intrinsic-inline-size
     or a min-width in px would be a minimum there, and the card would overflow. */
  :host::before { content: ""; display: grid; grid-template-columns: minmax(0, 344px); height: 0; }
  ha-card { padding: 12px; overflow: hidden; container-type: inline-size; }
  ha-card.lvl-alert { box-shadow: 0 0 0 1px color-mix(in srgb, var(--rc-alert) 45%, transparent), var(--ha-card-box-shadow, none); }

  .head { display: flex; align-items: center; gap: 10px; }
  .head.nav { cursor: pointer; }
  .head.nav:focus-visible { outline: 2px solid var(--primary-color); outline-offset: 2px; border-radius: 4px; }
  .badge { flex: none; width: 40px; height: 40px; border-radius: 50%; display: grid; place-items: center;
           background: color-mix(in srgb, var(--c) 16%, transparent); color: var(--c); }
  .badge ha-icon { --mdc-icon-size: 24px; }
  .lvl-alert .badge { animation: rc-pulse 1.6s ease-in-out infinite; }
  /* Narrow header: the title keeps a few letters (never 0 px), the status pill shrinks and ellipsises, the icon buttons
     (zoom, power) never shrink; under 200 px the pill is only its coloured dot, its text kept for screen readers. */
  .title { flex: 1 1 0; min-width: 5ch; font-size: 16px; font-weight: 500; color: var(--primary-text-color);
           white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
           /* show_title: false keeps the title's room (the pill and buttons stay in place) */
  :host([hide-title]) .head > .title { visibility: hidden; }
  .pill { all: unset; flex: 0 1 auto; min-width: 0; box-sizing: border-box; position: relative;
          display: inline-flex; align-items: center; gap: 3px; font-size: 11px; font-weight: 500;
          padding: 1px 8px; border-radius: 999px; background: color-mix(in srgb, var(--c) 14%, transparent);
          /* Coloured text is half the accent, half the text colour: 4.5:1 on its tint in light and dark themes, where
             the bare accent (amber above all) is not. */
          color: color-mix(in srgb, var(--c) 50%, var(--primary-text-color, #212121)); }
  .pt { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .pill ha-icon { flex: none; }
  /* A card this narrow (6 columns of the Sections view on a phone): the title is at its few letters already, so the
     status pill goes to a line of its own under it, where its whole label fits, rather than end with "…". */
  @container (max-width: 260px) {
    .head { flex-wrap: wrap; row-gap: 4px; }
    .head::after { content: ""; order: 1; flex: 1 0 100%; }
    .head > .pill { order: 2; margin-left: 50px; max-width: calc(100% - 50px); }
  }
  @container (max-width: 200px) {
    /* Under 200 px the pill is only its dot again: back on the title's line. */
    .head { flex-wrap: nowrap; }
    .head::after { content: none; }
    .head > .pill { order: 0; margin-left: 0; max-width: none; }
    .head > .pill .pt, .st .pt { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); }
    .head > .pill:not(.action), .st { flex: none; padding: 0; width: 18px; height: 18px; justify-content: center; background: none; }
    .head > .pill:not(.action)::before, .st::before { content: ""; width: 8px; height: 8px; border-radius: 50%; background: var(--c); }
    .head > .pill.action { padding: 1px 4px; }
    /* A full card this narrow (6 columns of the Sections view on a phone): a smaller badge, no side chip in the header. */
    .head { gap: 6px; }
    .head > .badge { width: 32px; height: 32px; }
    .head > .badge ha-icon { --mdc-icon-size: 20px; }
    .head > .chip { display: none; }
  }
  .pill.action { cursor: pointer; }
  .pill.action:hover { background: color-mix(in srgb, var(--c) 24%, transparent); }
  .pill.action:focus-visible { outline: 2px solid var(--primary-color); outline-offset: 2px; }
  .pill ha-icon { --mdc-icon-size: 12px; margin-left: -2px; }

  .grid { display: grid; grid-template-columns: repeat(var(--cols), minmax(0, 1fr)); gap: 6px; margin-top: 8px; }
  .tile { all: unset; position: relative; overflow: hidden; box-sizing: border-box; cursor: pointer; min-width: 0;
          display: flex; align-items: center; gap: 8px; padding: 5px 8px 5px 5px; border-radius: 10px;
          touch-action: pan-y; user-select: none; -webkit-user-select: none; -webkit-touch-callout: none;
          background: color-mix(in srgb, var(--t) 9%, var(--secondary-background-color, transparent));
          border: 1px solid color-mix(in srgb, var(--t) 22%, transparent); transition: background .2s, border-color .2s; }
  .tile.off, .tile.na { background: var(--secondary-background-color, transparent); border-color: transparent; }
  .tile.na { --t: var(--rc-na); opacity: .7; }
  .tile:hover { background: color-mix(in srgb, var(--t) 15%, var(--secondary-background-color, transparent)); }
  .tile:focus-visible { outline: 2px solid var(--primary-color); outline-offset: 2px; }
  .ic, .txt { position: relative; }
  .ic { flex: none; width: 28px; height: 28px; border-radius: 50%; display: grid; place-items: center;
        color: var(--t); background: color-mix(in srgb, var(--t) 20%, transparent); }
  .ic ha-icon { --mdc-icon-size: 16px; }
  .txt { display: flex; flex-direction: column; min-width: 0; }
  .name { font-size: 13px; font-weight: 500; line-height: 1.2; color: var(--primary-text-color);
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  /* A reading is never cut: on a narrow tile it goes on to a second line (the name, a label, keeps its ellipsis). */
  .state { font-size: 11px; line-height: 1.2; color: var(--secondary-text-color); overflow-wrap: break-word; }
  /* A card this narrow (a phone, 6 columns of the Sections view): one tile per row, whatever the columns option. */
  @container (max-width: 260px) { .grid { grid-template-columns: minmax(0, 1fr); } }
  /* layout: tiles — the size of Home Assistant's Tile card — 56 px high, a 40 px icon, the name over the state. */
  .layout-tiles .grid { gap: 8px; }
  .layout-tiles .tile { min-height: 56px; gap: 10px; padding: 8px 10px 8px 8px; border-radius: 12px; }
  .layout-tiles .ic { width: 40px; height: 40px; }
  .layout-tiles .ic ha-icon { --mdc-icon-size: 24px; }
  .layout-tiles .txt { gap: 2px; }
  .layout-tiles .name { font-size: 14px; line-height: 1.25; }
  .layout-tiles .state { font-size: 12px; line-height: 1.25; }

  @keyframes rc-blink { 0%, 100% { opacity: 1 } 50% { opacity: .35 } }
  @keyframes rc-pulse { 0%, 100% { box-shadow: 0 0 0 0 color-mix(in srgb, var(--c) 45%, transparent) }
                        50% { box-shadow: 0 0 0 7px transparent } }
  @media (prefers-reduced-motion: reduce) { .tile, .lvl-alert .badge { animation: none; transition: none; } }
`;

// Mini cards: layout, chips and zoom button. A chip is plain (icon and text) until it needs a look: then a tinted pill.
// The zoom / detail button of the mini cards and the overviews.
const RC_ZOOM_STYLES = `
  /* 40 px to tap, laid out as the 24 px it looks (the negative margins). */
  .zoom { all: unset; flex: none; cursor: pointer; width: 40px; height: 40px; margin: -12px -12px -12px -8px; border-radius: 50%;
          display: grid; place-items: center; color: var(--secondary-text-color); }
  .zoom ha-icon { --mdc-icon-size: 16px; }
  .zoom:hover { background: color-mix(in srgb, var(--rc-idle) 16%, transparent); color: var(--primary-text-color); }
  .zoom:focus-visible { outline: 2px solid var(--primary-color); outline-offset: 1px; }
`;

const RC_MINI_STYLES = `${RC_ZOOM_STYLES}
  /* The badge sits 12px from the card's top-left corner, like the other ha-* cards, beside the title and the readings. */
  ha-card:has(.mini) { padding: 12px; }
  .mini { display: flex; align-items: flex-start; gap: 10px; }
  /* The badge keeps the full card's size (40 px, icon 24 px): the body is at least as tall, a lone title line centred
     beside it. */
  .body { flex: 1; min-width: 0; min-height: 40px; display: flex; flex-direction: column; justify-content: center; gap: 4px; }
  .mini .head { gap: 8px; }
  .mini .title { line-height: 1.25; }
  .st { flex: 0 1 auto; min-width: 0; position: relative; display: inline-flex; align-items: center;
        margin-left: auto; font-size: 11px; font-weight: 500; color: var(--c); }
  .rs { display: flex; flex-wrap: wrap; gap: 2px 4px; margin-left: -4px; }
  .rs:empty { display: none; }
  /* A chip never runs past the card: a long name ends with an ellipsis. */
  .r { all: unset; cursor: pointer; display: inline-flex; align-items: baseline; gap: 1px; padding: 0 5px 0 4px;
       box-sizing: border-box; min-width: 0; max-width: 100%; overflow: hidden;
       border-radius: 999px; font-size: 12px; font-weight: 500; line-height: 24px; white-space: nowrap; --t: var(--rc-ok);
       color: var(--primary-text-color); }
  .r ha-icon { --mdc-icon-size: 13px; flex: none; color: var(--t); align-self: center; margin-right: 2px; }
  .r > span { min-width: 0; overflow: hidden; text-overflow: ellipsis; }
  .r.pill { color: color-mix(in srgb, var(--t) 50%, var(--primary-text-color, #212121)); background: color-mix(in srgb, var(--t) 14%, transparent); }
  .r:hover { background: color-mix(in srgb, var(--t) 20%, var(--secondary-background-color, transparent)); }
  .r:focus-visible { outline: 2px solid var(--primary-color); outline-offset: 2px; }
`;
