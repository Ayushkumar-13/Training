import { Html, Head, Main, NextScript } from 'next/document'

export default function Document() {
  const themeScript = `
    (function() {
      try {
        var theme = localStorage.getItem('medequip_theme');
        var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        if (theme === 'dark' || (!theme && prefersDark) || theme !== 'light') {
          document.documentElement.classList.add('dark');
          document.documentElement.classList.remove('light');
          document.documentElement.style.backgroundColor = '#090d16';
        } else {
          document.documentElement.classList.remove('dark');
          document.documentElement.classList.add('light');
          document.documentElement.style.backgroundColor = '#f8fafc';
        }
      } catch (e) {}
    })();
  `

  return (
    <Html lang="en" className="dark" style={{ backgroundColor: '#090d16' }}>
      <Head />
      <body className="bg-[#090d16] text-slate-100 transition-colors duration-200" style={{ backgroundColor: '#090d16' }}>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <Main />
        <NextScript />
      </body>
    </Html>
  )
}
