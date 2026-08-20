import { useCallback, useEffect, useState } from 'react'

export type Theme = 'light' | 'dark'

const STORAGE_KEY = 'counselflow-theme'

function systemTheme(): Theme {
  return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark'
}

function storedTheme(): Theme | null {
  try {
    const value = localStorage.getItem(STORAGE_KEY)
    return value === 'light' || value === 'dark' ? value : null
  } catch {
    return null
  }
}

function initialTheme(): Theme {
  const attr = document.documentElement.getAttribute('data-theme')
  if (attr === 'light' || attr === 'dark') return attr
  return storedTheme() ?? systemTheme()
}

function applyTheme(next: Theme) {
  const root = document.documentElement
  if (root.getAttribute('data-theme') === next) return
  root.classList.add('theme-switching')
  root.setAttribute('data-theme', next)
  void root.offsetHeight
  root.classList.remove('theme-switching')
}

export function useTheme(): { theme: Theme; toggleTheme: () => void } {
  const [theme, setTheme] = useState<Theme>(initialTheme)

  useEffect(() => {
    applyTheme(theme)
  }, [theme])

  useEffect(() => {
    const query = window.matchMedia('(prefers-color-scheme: light)')
    function onChange(event: MediaQueryListEvent) {
      if (storedTheme() != null) return
      setTheme(event.matches ? 'light' : 'dark')
    }
    query.addEventListener('change', onChange)
    return () => query.removeEventListener('change', onChange)
  }, [])

  const toggleTheme = useCallback(() => {
    setTheme((current) => {
      const next: Theme = current === 'dark' ? 'light' : 'dark'
      try {
        localStorage.setItem(STORAGE_KEY, next)
      } catch {
        return next
      }
      return next
    })
  }, [])

  return { theme, toggleTheme }
}
