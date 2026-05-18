/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#09090b', // zinc-950
        sidebar: '#09090b', 
        card: '#09090b',
        cardBorder: '#27272a', // zinc-800
        primary: '#fafafa', // pure white for primary elements (Untitled UI dark mode)
        primaryForeground: '#09090b',
        success: '#10b981', // emerald-500
        error: '#ef4444', // red-500
        warning: '#f59e0b', // amber-500
        muted: '#18181b', // zinc-900
        mutedForeground: '#a1a1aa', // zinc-400
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      boxShadow: {
        'subtle': '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
      }
    },
  },
  plugins: [],
}
