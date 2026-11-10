/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eaf6fc',
          100: '#d5edf9',
          200: '#abdaf3',
          300: '#81c7ed',
          400: '#42ade6',
          500: '#00aff5',
          600: '#0098d6',
          700: '#007bb0',
          800: '#005f8a',
          900: '#004565',
        },
        navy: {
          800: '#0a363e',
          900: '#054752',
          950: '#032c33',
        },
        slateText: '#708c91',
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', '-apple-system', 'sans-serif'],
      },
      boxShadow: {
        'soft-sm': '0 2px 8px -1px rgba(5, 71, 82, 0.06), 0 1px 3px -1px rgba(5, 71, 82, 0.04)',
        'soft-md': '0 8px 24px -3px rgba(5, 71, 82, 0.08), 0 3px 6px -2px rgba(5, 71, 82, 0.04)',
        'soft-lg': '0 16px 36px -4px rgba(5, 71, 82, 0.12), 0 6px 12px -3px rgba(5, 71, 82, 0.06)',
        'soft-xl': '0 24px 48px -6px rgba(5, 71, 82, 0.14), 0 10px 16px -4px rgba(5, 71, 82, 0.08)',
      },
    },
  },
  plugins: [],
};

