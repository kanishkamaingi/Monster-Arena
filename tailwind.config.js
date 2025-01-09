/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./views/**/*.ejs'], // content
  daisyui: {
    themes: ['dark'],
  },
  theme: {
    extend: {},
  },
  plugins: [require('@tailwindcss/typography'), require('daisyui')], // modules
}

