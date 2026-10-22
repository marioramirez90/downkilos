/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          primary: '#278F39',
          'primary-hover': '#217A30',
          'primary-light': '#E5F5E8',
          dark: '#103A2A',
          bg: '#FFFFFF',
          'bg-secondary': '#F6F8F6',
          text: '#17241D',
          muted: '#627264',
          border: '#E3EBE4',
        }
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        handwriting: ['Caveat', 'cursive'],
      },
      boxShadow: {
        'soft-sm': '0 2px 8px rgba(16, 58, 42, 0.04)',
        'soft': '0 4px 20px -2px rgba(16, 58, 42, 0.08)',
        'soft-lg': '0 10px 25px -3px rgba(16, 58, 42, 0.1), 0 4px 6px -2px rgba(16, 58, 42, 0.05)',
        'button': '0 6px 16px -2px rgba(39, 143, 57, 0.35)',
      },
      borderRadius: {
        '2xl': '1.25rem',
        '3xl': '1.75rem',
      }
    },
  },
  plugins: [],
}

