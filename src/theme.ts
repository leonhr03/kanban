import { useEffect, useState } from 'react'

export type ThemeMode = 'system' | 'light' | 'dark'
const KEY = 'kanban-theme'

function readMode(): ThemeMode {
  try {
    const v = localStorage.getItem(KEY)
    if (v === 'light' || v === 'dark') return v
  } catch {
    /* ignorieren */
  }
  return 'system'
}

export function useTheme() {
  const [mode, setMode] = useState<ThemeMode>(readMode)

  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const apply = () => {
      const dark = mode === 'dark' || (mode === 'system' && mq.matches)
      document.documentElement.classList.toggle('dark', dark)
      document.querySelector('meta[name="theme-color"]')?.setAttribute('content', dark ? '#0b0d14' : '#f8fafc')
    }
    apply()
    mq.addEventListener('change', apply)
    try {
      localStorage.setItem(KEY, mode)
    } catch {
      /* ignorieren */
    }
    return () => mq.removeEventListener('change', apply)
  }, [mode])

  return [mode, setMode] as const
}
