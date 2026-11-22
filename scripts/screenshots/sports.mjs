// Renders the sports cards with mock TeamTracker sensors and saves the README screenshots.
// Usage: npm install && npm run build && node scripts/screenshots/sports.mjs
import { pair, shoot } from "./harness.mjs";
import { pageScript, setup } from "./mock.mjs";

// Stills: animations: false stops the live dot and the scoreboard's glow, so a capture only changes when the card does.
const still = (file, s) => pair(file, { ...s, config: { animations: false, ...s.config } });
const scenes = ["live", "pre", "post", "bye", "multi"].flatMap((scene) => still(scene, { scene }));
await shoot({ prefix: "sp", tag: "sports-card", shots: [...scenes, ...still("narrow", { scene: "live", width: 300 })], setup, ws: pageScript });
await shoot({
  prefix: "sp-mini",
  tag: "sports-mini-card",
  shots: [...still("live", { scene: "live" }), ...still("pre", { scene: "pre" }), ...still("zoom", { scene: "multi", open: ".zoom" })],
  setup,
  ws: pageScript,
});
