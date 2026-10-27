// Shared helpers for the URL-hash routes (#/chat/2, #/login).
// A hash (not a path) is used because the panel is hosted as static files on
// GitHub Pages, which cannot rewrite /login to index.html.

export function subscribeToUrl(onChange: () => void) {
  // hashchange: Back/Forward, links and typing in the address bar; popstate: navigate() below
  window.addEventListener('hashchange', onChange)
  window.addEventListener('popstate', onChange)
  return () => {
    window.removeEventListener('hashchange', onChange)
    window.removeEventListener('popstate', onChange)
  }
}

// Go to a hash route ('#/login'), or to the chat list with null.
// pushState keeps a history entry (Back works) and, unlike `location.hash = ''`,
// leaves no dangling "#" in the URL. replace: overwrite the current entry instead,
// so Back skips a page that makes no sense to return to (the used login form).
export function navigate(hash: string | null, { replace = false } = {}) {
  const url = hash ?? window.location.pathname + window.location.search
  if (replace) window.history.replaceState(null, '', url)
  else window.history.pushState(null, '', url)
  // pushState fires no event by itself; tell the subscribers
  window.dispatchEvent(new PopStateEvent('popstate'))
}

export const LOGIN_HASH = '#/login'

// Where the user was going before being sent to the login form (e.g. "#/chat/2"),
// so a shared chat link still opens that chat after logging in.
let returnTo: string | null = null

// replace: the page they were sent away from shows nothing without a login, so
// Back should not lead to it.
export function redirectToLogin() {
  if (window.location.hash === LOGIN_HASH) return
  returnTo = window.location.hash || null
  navigate(LOGIN_HASH, { replace: true })
}

// After login: back to the remembered page, or the chat list.
export function leaveLogin() {
  const target = returnTo
  returnTo = null
  navigate(target, { replace: true })
}
