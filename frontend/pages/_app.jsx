import '../styles/globals.css'
import Header from '../components/Header'
import { ThemeProvider, useTheme } from '../lib/ThemeContext'

function AppLayout({ Component, pageProps }) {
  const { darkMode } = useTheme()

  return (
    <div className={`min-h-screen font-sans antialiased flex flex-col justify-between transition-colors duration-200 ${darkMode ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'}`}>
      <div>
        <Header />
        <Component {...pageProps} />
      </div>
      <footer className={`text-xs py-8 border-t transition-colors duration-200 mt-20 ${darkMode ? 'bg-slate-900 text-slate-400 border-slate-800' : 'bg-slate-900 text-slate-400 border-slate-800'}`}>
        <div className="max-w-7xl mx-auto px-4 text-center">
          <div className="font-bold text-slate-200 text-sm mb-1">MedEquip Healthcare Platform</div>
          <p>© 2026 MedEquip Systems. Enterprise B2B Medical Equipment & Logistics.</p>
        </div>
      </footer>
    </div>
  )
}

export default function App(props) {
  return (
    <ThemeProvider>
      <AppLayout {...props} />
    </ThemeProvider>
  )
}
