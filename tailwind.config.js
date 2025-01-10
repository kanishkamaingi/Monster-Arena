/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./views/**/*.ejs'], // content
  daisyui: {
    themes: ['luxury'],
  },
  theme: {
    extend: {},
  },
  plugins: [require('@tailwindcss/typography'), require('daisyui')], // modules
}

