// @ts-nocheck
export function renderMiniAppHtml(basePath) {
  return `<!doctype html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>ExRateFX Dashboard</title>
<script src="https://telegram.org/js/telegram-web-app.js"></script>
<style>
  :root {
    --bg: var(--tg-theme-bg-color, #ffffff);
    --secondary-bg: var(--tg-theme-secondary-bg-color, #f0f0f5);
    --text: var(--tg-theme-text-color, #1c1c1e);
    --hint: var(--tg-theme-hint-color, #8e8e93);
    --link: var(--tg-theme-link-color, #2f6fed);
    --button: var(--tg-theme-button-color, #2f6fed);
    --button-text: var(--tg-theme-button-text-color, #ffffff);
  }

  * { box-sizing: border-box; }

  body {
    margin: 0;
    padding: 16px;
    background: var(--bg);
    color: var(--text);
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    font-size: 15px;
  }

  h1 {
    font-size: 20px;
    margin: 4px 0 2px;
  }

  .subtitle {
    color: var(--hint);
    font-size: 13px;
    margin: 0 0 16px;
  }

  .tabs {
    display: flex;
    gap: 6px;
    background: var(--secondary-bg);
    padding: 4px;
    border-radius: 10px;
    margin-bottom: 16px;
  }

  .tab {
    flex: 1;
    text-align: center;
    padding: 8px 0;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 500;
    color: var(--text);
    cursor: pointer;
    user-select: none;
  }

  .tab.active {
    background: var(--button);
    color: var(--button-text);
  }

  .panel { display: none; }
  .panel.active { display: block; }

  .rate-row {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 8px 0;
    border-bottom: 1px solid var(--secondary-bg);
  }

  .rate-code {
    width: 46px;
    flex-shrink: 0;
    font-weight: 600;
    font-variant-numeric: tabular-nums;
  }

  .rate-bar-track {
    flex: 1;
    height: 8px;
    background: var(--secondary-bg);
    border-radius: 4px;
    overflow: hidden;
  }

  .rate-bar-fill {
    height: 100%;
    background: var(--link);
    border-radius: 4px;
  }

  .rate-value {
    width: 92px;
    flex-shrink: 0;
    text-align: right;
    font-variant-numeric: tabular-nums;
    color: var(--hint);
    font-size: 13px;
  }

  .rate-section-label {
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    color: var(--hint);
    margin: 16px 0 4px;
  }

  .rate-section-label:first-child { margin-top: 0; }

  .as-of {
    color: var(--hint);
    font-size: 12px;
    margin-top: 10px;
  }

  .log-entry {
    padding: 10px 0;
    border-bottom: 1px solid var(--secondary-bg);
  }

  .log-from {
    font-weight: 600;
    font-size: 13px;
  }

  .log-from.bot { color: var(--link); }

  .log-text {
    margin: 2px 0;
    word-break: break-word;
  }

  .log-date {
    color: var(--hint);
    font-size: 12px;
  }

  .empty-state {
    color: var(--hint);
    text-align: center;
    padding: 32px 12px;
    font-size: 14px;
  }
</style>
</head>
<body>
  <h1>ExRateFX Dashboard</h1>
  <p class="subtitle">Live rates and your query history</p>

  <div class="tabs">
    <div class="tab active" data-panel="rates">Live Rates</div>
    <div class="tab" data-panel="log">My Log</div>
  </div>

  <div id="rates" class="panel active">
    <div id="ratesList"><div class="empty-state">Loading rates…</div></div>
    <div id="ratesAsOf" class="as-of"></div>
  </div>

  <div id="log" class="panel">
    <div id="logList"><div class="empty-state">Loading…</div></div>
  </div>

<script>
  (function () {
    var BASE_PATH = ${JSON.stringify(basePath)};
    var tg = window.Telegram && window.Telegram.WebApp;
    if (tg) {
      tg.ready();
      tg.expand();
    }

    document.querySelectorAll('.tab').forEach(function (tab) {
      tab.addEventListener('click', function () {
        document.querySelectorAll('.tab').forEach(function (t) { t.classList.remove('active'); });
        document.querySelectorAll('.panel').forEach(function (p) { p.classList.remove('active'); });
        tab.classList.add('active');
        document.getElementById(tab.dataset.panel).classList.add('active');
      });
    });

    function escapeHtml(text) {
      return String(text)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
    }

    var CRYPTO_CODES = ['BTC', 'ETH', 'USDT', 'BNB', 'XRP'];

    function renderRateRows(entries) {
      var logs = entries.map(function (entry) { return Math.log10(entry[1]); });
      var minLog = Math.min.apply(null, logs);
      var maxLog = Math.max.apply(null, logs);
      var span = maxLog - minLog || 1;

      return entries.map(function (entry) {
        var code = entry[0], value = entry[1];
        var pct = Math.max(4, ((Math.log10(value) - minLog) / span) * 100);
        return '<div class="rate-row">' +
          '<div class="rate-code">' + escapeHtml(code) + '</div>' +
          '<div class="rate-bar-track"><div class="rate-bar-fill" style="width:' + pct + '%"></div></div>' +
          '<div class="rate-value">' + value.toLocaleString(undefined, { maximumFractionDigits: 4 }) + '</div>' +
        '</div>';
      }).join('');
    }

    async function refreshRates() {
      try {
        const res = await fetch(BASE_PATH + '/rates.json');
        const data = await res.json();
        const known = Object.entries(data.rates).filter(function (entry) { return entry[1] != null; });
        const fiat = known.filter(function (entry) { return CRYPTO_CODES.indexOf(entry[0]) === -1; })
          .sort(function (a, b) { return a[0].localeCompare(b[0]); });
        const crypto = known.filter(function (entry) { return CRYPTO_CODES.indexOf(entry[0]) !== -1; })
          .sort(function (a, b) { return a[0].localeCompare(b[0]); });

        var html = '';
        if (fiat.length) html += '<div class="rate-section-label">Fiat</div>' + renderRateRows(fiat);
        if (crypto.length) html += '<div class="rate-section-label">Crypto</div>' + renderRateRows(crypto);
        document.getElementById('ratesList').innerHTML = html;

        document.getElementById('ratesAsOf').textContent =
          '1 ' + data.base + ' — updated ' + new Date(data.asOf).toLocaleTimeString();
      } catch (err) {
        console.error('Failed to load rates:', err);
      }
    }

    async function refreshLog() {
      const initData = tg && tg.initData;
      if (!initData) {
        document.getElementById('logList').innerHTML =
          '<div class="empty-state">Open this dashboard from the ExRateFX Telegram bot to see your personal query history.</div>';
        return;
      }

      try {
        const res = await fetch(BASE_PATH + '/my-messages.json?initData=' + encodeURIComponent(initData));
        if (!res.ok) throw new Error('request failed: ' + res.status);
        const messages = await res.json();

        if (messages.length === 0) {
          document.getElementById('logList').innerHTML =
            '<div class="empty-state">No queries yet — send the bot a currency query to see it here.</div>';
          return;
        }

        document.getElementById('logList').innerHTML = messages.map(function (m) {
          var isBot = m.from === '@ClearExchangeBot';
          return '<div class="log-entry">' +
            '<div class="log-from' + (isBot ? ' bot' : '') + '">' + escapeHtml(m.from) + '</div>' +
            '<div class="log-text">' + escapeHtml(m.text) + '</div>' +
            '<div class="log-date">' + new Date(m.date).toLocaleString() + '</div>' +
          '</div>';
        }).join('');
      } catch (err) {
        console.error('Failed to load message log:', err);
        document.getElementById('logList').innerHTML =
          '<div class="empty-state">Couldn\\'t load your query history.</div>';
      }
    }

    refreshRates();
    refreshLog();
    setInterval(refreshRates, 15000);
    setInterval(refreshLog, 15000);
  })();
</script>
</body>
</html>`;
}
