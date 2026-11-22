// @ts-nocheck
function escapeHtml(text) {
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function formatDate(dateValue) {
  const parsed = new Date(dateValue);
  if (Number.isNaN(parsed.getTime())) return escapeHtml(dateValue);
  return parsed.toLocaleString("en-US", {
    year: "numeric", month: "numeric", day: "numeric",
    hour: "numeric", minute: "2-digit", second: "2-digit",
  });
}

function renderMessageRow(m) {
  const isBot = m.from === "@ClearExchangeBot";
  return `<div class="row">
    <span class="badge${isBot ? " bot" : ""}">${escapeHtml(m.from)}</span>
    <div class="bubble${isBot ? " bot" : ""}">
      <p class="text">${escapeHtml(m.text)}</p>
      <time class="time">${formatDate(m.date)}</time>
    </div>
  </div>`;
}

export function renderMessagesHtml(messages, basePath) {
  const rows = messages.slice().reverse().map(renderMessageRow).join("");
  const emptyState = '<div class="empty">No messages yet — send the bot a currency query to see it here.</div>';

  return `<!doctype html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>ExRateFX — Messages</title>
<style>
  :root {
    --bg: #f5f6fa;
    --surface: #ffffff;
    --ink: #12162a;
    --ink-2: #5a6178;
    --border: #e2e5ee;
    --accent: #2f6fed;
    --user-badge-bg: #eef1fb;
    --user-badge-ink: #33409e;
    --bot-badge-bg: #e4ebfb;
    --bot-badge-ink: #1d4fb0;
    --bubble-bg: #f0f1f6;
    --bubble-bot-bg: #eaf0ff;
  }

  @media (prefers-color-scheme: dark) {
    :root {
      --bg: #0c0f1c;
      --surface: #131729;
      --ink: #e8eaf4;
      --ink-2: #97a0bd;
      --border: #262d47;
      --accent: #7fa0ff;
      --user-badge-bg: #1b2140;
      --user-badge-ink: #b7c2ff;
      --bot-badge-bg: #1b2547;
      --bot-badge-ink: #9db8ff;
      --bubble-bg: #1a1f36;
      --bubble-bot-bg: #16203f;
    }
  }

  * { box-sizing: border-box; }

  body {
    margin: 0;
    padding: 40px 20px 64px;
    background: var(--bg);
    color: var(--ink);
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  }

  main {
    max-width: 640px;
    margin: 0 auto;
  }

  header {
    margin-bottom: 20px;
  }

  h1 {
    font-size: 22px;
    margin: 0;
  }

  .subtitle {
    color: var(--ink-2);
    font-size: 13px;
    margin: 4px 0 0;
  }

  .log {
    display: flex;
    flex-direction: column;
    gap: 14px;
  }

  .row {
    display: flex;
    flex-direction: column;
    gap: 4px;
    align-items: flex-start;
  }

  .badge {
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.02em;
    padding: 2px 8px;
    border-radius: 999px;
    background: var(--user-badge-bg);
    color: var(--user-badge-ink);
  }

  .badge.bot {
    background: var(--bot-badge-bg);
    color: var(--bot-badge-ink);
  }

  .bubble {
    background: var(--bubble-bg);
    border-radius: 12px;
    padding: 10px 14px;
    max-width: 100%;
  }

  .bubble.bot { background: var(--bubble-bot-bg); }

  .text {
    margin: 0;
    font-size: 14.5px;
    line-height: 1.5;
    word-break: break-word;
    white-space: pre-wrap;
  }

  .time {
    display: block;
    margin-top: 4px;
    font-size: 11.5px;
    color: var(--ink-2);
    font-variant-numeric: tabular-nums;
  }

  .empty {
    color: var(--ink-2);
    text-align: center;
    padding: 40px 16px;
    font-size: 14px;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 12px;
  }
</style>
</head>
<body>
<main>
  <header>
    <h1>Messages</h1>
    <p class="subtitle">Live log of bot conversations, newest first</p>
  </header>
  <div class="log" id="messages">${rows || emptyState}</div>
</main>
<script>
  function escapeHtml(text) {
    return String(text)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function formatDate(dateValue) {
    var parsed = new Date(dateValue);
    if (isNaN(parsed.getTime())) return escapeHtml(dateValue);
    return parsed.toLocaleString('en-US', {
      year: 'numeric', month: 'numeric', day: 'numeric',
      hour: 'numeric', minute: '2-digit', second: '2-digit',
    });
  }

  function renderRow(m) {
    var isBot = m.from === '@ClearExchangeBot';
    return '<div class="row">' +
      '<span class="badge' + (isBot ? ' bot' : '') + '">' + escapeHtml(m.from) + '</span>' +
      '<div class="bubble' + (isBot ? ' bot' : '') + '">' +
        '<p class="text">' + escapeHtml(m.text) + '</p>' +
        '<time class="time">' + formatDate(m.date) + '</time>' +
      '</div>' +
    '</div>';
  }

  var BASE_PATH = ${JSON.stringify(basePath)};

  async function refreshMessages() {
    try {
      const res = await fetch(BASE_PATH + '/messages.json');
      const messages = await res.json();
      const container = document.getElementById('messages');
      container.innerHTML = messages.length
        ? messages.map(renderRow).join('')
        : '<div class="empty">No messages yet — send the bot a currency query to see it here.</div>';
    } catch (err) {
      console.error('Failed to refresh messages:', err);
    }
  }

  refreshMessages();
  setInterval(refreshMessages, 3000);
</script>
</body>
</html>`;
}
