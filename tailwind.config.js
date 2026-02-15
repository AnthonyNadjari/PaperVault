/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      colors: {
        surface: '#fafafa',
        border: '#e5e5e5',
        muted: '#737373',
        ink: '#171717',
      },
      borderRadius: {
        card: '12px',
        input: '10px',
        button: '10px',
      },
      spacing: {
        safe: 'env(safe-area-inset-bottom, 0px)',
      },
      maxWidth: {
        content: '680px',
      },
    },
  },
  plugins: [],
}
