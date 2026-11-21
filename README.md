# ha-sports-card

[![Marketplace](https://img.shields.io/badge/Marketplace-Custom-41BDF5.svg)](https://www.home-assistant.io/integrations/marketplace/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://github.com/juju35/ha-sports-card/blob/main/LICENSE)
[![Buy Me a Coffee](https://img.shields.io/badge/Buy%20Me%20a%20Coffee-FFDD00?logo=buymeacoffee&logoColor=black)](https://buymeacoffee.com/julienstep9)

<p align="center"><img src="https://raw.githubusercontent.com/juju35/ha-sports-card/main/images/icon.svg" alt="Sports Card" width="120"></p>

<p align="center">
  <img src="https://raw.githubusercontent.com/juju35/ha-sports-card/main/images/teamtracker.png" alt="TeamTracker" height="24">
</p>

A Lovelace card for **your teams**: the live score, the next games with their kick-off time and channel, and the last results.

> [!NOTE]
> This card is being designed: there is no release yet. Watch the repository to know when the first version is out.

| Card | Type | What it shows |
|---|---|---|
| Sports | `custom:sports-card` | Your teams' live score, the next games and the last results. |
| Sports mini | `custom:sports-mini-card` | The live or next game on two lines, with a zoom to the full card. |

## Supported integrations

The card reads the sensors of this integration:

| | Integration | What the cards show |
|:---:|---|---|
| <img src="https://raw.githubusercontent.com/juju35/ha-sports-card/main/images/teamtracker.png" alt="TeamTracker" height="16"> | [TeamTracker](https://github.com/vasqued2/ha-teamtracker) (Marketplace) | Live scores and schedules from ESPN: football, rugby, basketball, American football, hockey… |

## Installation

### Via the Marketplace (recommended)

Click the button below to add the repository directly:

[![Add to the Marketplace](https://my.home-assistant.io/badges/hacs_repository.svg)](https://my.home-assistant.io/redirect/marketplace_repository/?owner=juju35&repository=ha-sports-card&category=plugin)

Or manually:

1. Open **Settings → Marketplace → Add from link** (top right; this needs a GitHub account connected)
2. Add `https://github.com/juju35/ha-sports-card` — Type: **Dashboard**
3. Open **Sports Card** and click **Install**
4. Clear your browser cache and refresh

The Marketplace registers the dashboard resource for you.

### Manual

1. Download `ha-sports-card.js` and the `ha-sports-card.i18n.*.js` translation files from the [latest release](https://github.com/juju35/ha-sports-card/releases/latest)
2. Copy them all to `/config/www/` (without the translation files, the cards show in English)
3. Go to **Settings → Dashboards → Resources** → Add resource:
   - URL: `/local/ha-sports-card.js`
   - Type: **JavaScript Module**
4. Clear your browser cache and refresh

## License

[MIT](https://github.com/juju35/ha-sports-card/blob/main/LICENSE)

## Support

If you find this project useful, you can support its development:

<a href="https://buymeacoffee.com/julienstep9"><img src="https://cdn.buymeacoffee.com/buttons/v2/default-yellow.png" alt="Buy Me a Coffee" height="50"></a>
