
export default {content: [
  './index.html',
  './src/**/*.{js,ts,jsx,tsx}'
],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"IBM Plex Sans"', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'ui-monospace', 'monospace'],
      },
      colors: {
        ibm: {
          blue: {
            60: '#0f62fe',
            70: '#0353e9',
          },
          gray: {
            100: '#161616',
            80: '#353535',
            70: '#525252',
            50: '#8d8d8d',
            30: '#c6c6c6',
            20: '#e0e0e0',
            10: '#f4f4f4',
          },
          red: {
            60: '#da1e28',
            bg: '#fff1f1',
          },
          green: {
            60: '#198038',
            bg: '#defbe6',
          },
          yellow: {
            30: '#f1c21b',
            bg: '#fdf6dd',
          },
          orange: {
            40: '#ff832b',
            bg: '#fff2e8',
          },
        },
      },
    },
  },
}
