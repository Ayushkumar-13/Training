import React from 'react'
import { useTheme } from '../lib/ThemeContext'

export default function SkeletonCard() {
  const { darkMode } = useTheme()

  return (
    <div className={`rounded-xl border p-5 animate-pulse flex flex-col justify-between ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
      <div>
        <div className={`h-44 rounded-lg mb-4 ${darkMode ? 'bg-slate-800' : 'bg-slate-200'}`} />
        <div className={`h-3 w-1/3 rounded mb-3 ${darkMode ? 'bg-slate-800' : 'bg-slate-200'}`} />
        <div className={`h-5 w-3/4 rounded mb-2 ${darkMode ? 'bg-slate-800' : 'bg-slate-200'}`} />
        <div className={`h-3 w-full rounded mb-1 ${darkMode ? 'bg-slate-800' : 'bg-slate-200'}`} />
        <div className={`h-3 w-2/3 rounded ${darkMode ? 'bg-slate-800' : 'bg-slate-200'}`} />
      </div>

      <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
        <div className={`h-6 w-20 rounded ${darkMode ? 'bg-slate-800' : 'bg-slate-200'}`} />
        <div className={`h-8 w-24 rounded-lg ${darkMode ? 'bg-slate-800' : 'bg-slate-200'}`} />
      </div>
    </div>
  )
}
