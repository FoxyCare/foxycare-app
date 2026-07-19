import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        cream: "#FDF3EA",
        brand: {
          50: "#FDF3EA",
          100: "#FBE5D0",
          200: "#F6C89E",
          300: "#F0AC7D",
          400: "#EA8D54",
          500: "#DD7A3A",
          600: "#C86A2E",
          700: "#B13801",
          800: "#8A2C01",
          900: "#632000",
        },
      },
    },
  },
  plugins: [],
};
export default config;
