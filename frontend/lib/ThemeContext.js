import React, { createContext, useContext, useEffect, useState } from 'react'

const ThemeContext = createContext({
  darkMode: false,
  toggleTheme: () => {}
})

export function ThemeProvider({ children }) {
  const [darkMode, setDarkMode] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem('medequip_theme')
    if (saved === 'dark') {
      setDarkMode(true)
    } else if (saved === 'light') {
      setDarkMode(false)
    } else {
      // Default to light mode
      setDarkMode(false)
    }
  }, [])

  function toggleTheme() {
    setDarkMode(prev => {
      const next = !prev
      localStorage.setItem('medequip_theme', next ? 'dark' : 'light')
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
