import { useEffect, useState } from 'react'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'sonner'
import { AppRoutes } from './routes/AppRoutes'

type ThemeMode = 'light' | 'dark'

const THEME_STORAGE_KEY = 'focus-grid-theme'

function App() {
  const [theme, setTheme] = useState<ThemeMode>('light')

  useEffect(() => {
    const savedTheme = window.localStorage.getItem(THEME_STORAGE_KEY)
    if (savedTheme === 'dark' || savedTheme === 'light') {
      setTheme(savedTheme)
    }
  }, [])

  useEffect(() => {
    const root = document.documentElement
    root.classList.toggle('theme-dark', theme === 'dark')
    window.localStorage.setItem(THEME_STORAGE_KEY, theme)
  }, [theme])

  return (
    <>
      <Toaster position="top-right" richColors theme={theme} />
      <BrowserRouter>
        <AppRoutes
          theme={theme}
          onToggleTheme={() => setTheme((current) => (current === 'light' ? 'dark' : 'light'))}
        />
      </BrowserRouter>
    </>
  )
}

export default App
