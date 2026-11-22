# Changelog

## 1.0.2 - 2026-11-22

### Performance
- Card picker: the previews are back (`preview: true`), and light. Each card's preview is drawn only once it scrolls into view of Home Assistant's card picker, which otherwise builds the preview of every card at once: until then it holds Home Assistant's state (no render, no history request, no animation). On a dashboard or in the card editor the card is drawn as before.

## 1.0.1 - 2026-11-22

### Performance
- Card picker: the cards no longer ask Home Assistant for a live preview (`preview: false` in `window.customCards`). The picker drew every card at once (history requests, animations), which made the list slow to open; it now shows each card's description instead.

## 1.0.0 - 2026-11-22

### Features
- First release: `sports-card` and `sports-mini-card` for TeamTracker. The live game as a scoreboard (both crests, the score, the clock and period, a bar of how far the game has gone, the win probability and the last play), the next game before kick-off, the result after; when, where and on which channel, the records and the odds; one tab per team when several are followed; an illustrated header with a stadium whose scoreboard shows the score and whose floodlights shine while the game is live.
