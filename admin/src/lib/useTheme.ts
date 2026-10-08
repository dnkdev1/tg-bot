import { useCallback, useEffect, useSyncExternalStore } from 'react'

// Light / night mode. Until the user flips the switch the panel follows the OS
// setting (and changes live with it); after that their choice is saved in
// localStorage. index.html applies the same logic before the first paint.

export type Theme = 'light' | 'dark'

const STORAGE_KEY = 'tg-admin-theme'
const CHANGE_EVENT = 'tg-admin-theme-change'
const darkQuery = window.matchMedia('(prefers-color-scheme: dark)')

// localStorage can throw (private mode, blocked storage): treat that as "no choice saved"
function readSaved(): Theme | null {
  try {
    const value = localStorage.getItem(STORAGE_KEY)
    return value === 'light' || value === 'dark' ? value : null
  } catch {
    return null
  }
}

function readTheme(): Theme {
  return readSaved() ?? (darkQuery.matches ? 'dark' : 'light')
}

function subscribe(onChange: () => void) {
  darkQuery.addEventListener('change', onChange) // OS switched light/dark
  window.addEventListener(CHANGE_EVENT, onChange) // our own toggle
  return () => {
    darkQuery.removeEventListener('change', onChange)
    window.removeEventListener(CHANGE_EVENT, onChange)
  }
}

export function useTheme() {
  const theme = useSyncExternalStore(subscribe, readTheme)
  const followsSystem = useSyncExternalStore(subscribe, () => readSaved() === null)

  // the CSS tokens switch on <html data-theme="dark">
  useEffect(() => {
    document.documentElement.dataset.theme = theme
  }, [theme])

  const toggleTheme = useCallback(() => {
    try {
      localStorage.setItem(STORAGE_KEY, readTheme() === 'dark' ? 'light' : 'dark')
    } catch {
      // storage blocked: nothing to save, the theme simply will not change
    }
    window.dispatchEvent(new Event(CHANGE_EVENT))
  }, [])

  return { theme, followsSystem, toggleTheme }
}
