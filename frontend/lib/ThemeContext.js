import React, { createContext, useContext, useEffect, useState } from 'react'

const ThemeContext = createContext({
  darkMode: true,
  toggleTheme: () => {}
})

export function ThemeProvider({ children }) {
  const [darkMode, setDarkMode] = useState(true)

  useEffect(() => {
    const saved = localStorage.getItem('medequip_theme')
    let isDark = true

    if (saved === 'light') {
      isDark = false
    } else if (saved === 'dark') {
      isDark = true
    } else {
      isDark = true // Default to dark mode
    }

    setDarkMode(isDark)
    applyTheme(isDark)
  }, [])

  function applyTheme(isDark) {
    if (typeof document === 'undefined') return
    if (isDark) {
      document.documentElement.classList.add('dark')
      document.documentElement.classList.remove('light')
      document.documentElement.style.backgroundColor = '#090d16'
    } else {
      document.documentElement.classList.remove('dark')
      document.documentElement.classList.add('light')
      document.documentElement.style.backgroundColor = '#f8fafc'
    }
  }

  function toggleTheme() {
    setDarkMode(prev => {
      const next = !prev
      localStorage.setItem('medequip_theme', next ? 'dark' : 'light')
      applyTheme(next)
      return next
    })
  }

  return (
    <ThemeContext.Provider value={{ darkMode, toggleTheme }}>
      <div className={darkMode ? 'dark' : ''}>
        {children}
      </div>
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  return useContext(ThemeContext)
}
