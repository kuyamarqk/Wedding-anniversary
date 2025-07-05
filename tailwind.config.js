module.exports = {
  purge: [],
  darkMode: false, // or 'media' or 'class'
  theme: {
    extend: {
      animation: {
    'fade-in': 'fadeIn 1.2s ease-out both',
  },
  keyframes: {
    fadeIn: {
      '0%': { opacity: 0 },
      '100%': { opacity: 1 },
    },
  },
    },
  },
  variants: {
    extend: {},
  },
  plugins: [],
}
