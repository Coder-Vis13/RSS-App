//redundant in v4. use index.css


import colors from "tailwindcss/colors"

/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],

  safelist: [
    {
      pattern:
        /(bg|text)-(red|blue|green|yellow|rose|purple|orange|amber|lime|emerald|teal|cyan|sky|indigo|violet|pink)-(100|200|300|400|500|600|700|800|900)/,
    },
  ],

  theme: {
    extend: {
      colors: {
        secondary: {
          DEFAULT: colors.neutral[200],
          hover: colors.neutral[300],
          border: colors.neutral[400],
          text: colors.neutral[500],
          dark: colors.neutral[800],
          ["dark-hover"]: colors.neutral[900],
        },
      },
    },
  },

  plugins: [],
};






// import colors from "tailwindcss/colors"

// /** @type {import('tailwindcss').Config} */
// export default {
// content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
//   theme: {
//     extend: {
//       colors: {
//         secondary: {
//           DEFAULT:colors.neutral[200],
//           hover:colors.neutral[300],
//           border:colors.neutral[400],
//           text:colors.neutral[500],
//           dark:colors.neutral[800],
//           ["dark-hover"]:colors.neutral[900],
//         },
//       },
//     },
//   },
//   plugins: [],
// }





















// import colors from "tailwindcss/colors"

// /** @type {import ('tailwindcss').Config} */

// export default {
//     content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
//     theme: {
//         extend: {
//             colors: {
//                 secondary: {
//                     DEFAULT: colors.neutral[200],
//                     hover: colors.neutral[300],
//                     border: colors.neutral[400],
//                     text: colors.neutral[500],
//                     dark: colors.neutral[800],
//                 ["dark-hover"]: colors.neutral[900]                
//                 }
//             }
//         }
//     },
//     plugin: [],
// }