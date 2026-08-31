export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#131A2B', bone: '#F2EFE6', brass: '#E8B84B',
        slate: '#5B8C9E', haze: '#8A93A8', rust: '#C1543A',
      },
      fontFamily: {
        display: ['"Bricolage Grotesque"', 'Georgia', 'sans-serif'],
        body: ['"Source Serif 4"', 'Georgia', 'serif'],
        mono: ['"IBM Plex Mono"', 'ui-monospace', 'monospace'],
      },
    },
  },
}
