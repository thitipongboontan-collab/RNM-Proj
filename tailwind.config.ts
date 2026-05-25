import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          primary: "#4D5CAD",
          dark: "#25324B",
          muted: "#778097",
          footer: "#252F65",
        },
      },
      fontFamily: {
        thai: ["var(--font-noto-sans-thai)", "sans-serif"],
        jakarta: ["var(--font-plus-jakarta)", "sans-serif"],
        inter: ["var(--font-inter)", "sans-serif"],
      },
      boxShadow: {
        "ai-bar": "0px 4px 20px 0px rgba(171, 205, 255, 1)",
      },
      backgroundImage: {
        "hero-page": "linear-gradient(135deg, #E9EAF6 0%, #DDEDF5 100%)",
        "hero-pill": "linear-gradient(90deg, #D2D8EC 0%, #C1DFED 100%)",
        "text-funding": "linear-gradient(90deg, #4765B0 0%, #00CACC 100%)",
        "text-matching":
          "linear-gradient(90deg, #4F67B4 0%, #60CBF2 35%, #07CCD0 55%, #998FDE 89%)",
        "ai-border": "linear-gradient(90deg, #4D5CAD 0%, #00CACC 100%)",
        "footer-main": "linear-gradient(90deg, #354185 0%, #006691 100%)",
        "icon-badge": "linear-gradient(180deg, #4D5CAD 0%, #12B2C5 100%)",
      },
    },
  },
  plugins: [],
};

export default config;
