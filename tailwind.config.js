/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        jay: {
          bg: "#0b1020",
          panel: "#141a2e",
          border: "#222a44",
          up: "#22c55e",
          down: "#ef4444",
          accent: "#facc15",
        },
      },
      fontFamily: {
        mono: ["ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
      },
    },
  },
  plugins: [],
};
