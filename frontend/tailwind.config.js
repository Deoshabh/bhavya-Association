/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#1a56db',
        secondary: '#e02424',
      },
      fontFamily: {
        sans: ['Poppins', 'sans-serif'],
      },
      textShadow: {
        'default': '0 2px 4px rgba(0, 0, 0, 0.5)',
      }
    },
  },
  plugins: [
    function ({ addUtilities }) {
      const newUtilities = {
        '.shadow-text': {
          textShadow: '0 2px 4px rgba(0, 0, 0, 0.5)',
        },
      }
      addUtilities(newUtilities)
    }
  ],
}
