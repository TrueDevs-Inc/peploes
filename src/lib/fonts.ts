import { DM_Sans, EB_Garamond, Inter } from "next/font/google";

export const inter = Inter({
  subsets: ["latin"],
  weight: ["300", "400", "700"],
  display: "swap",
  preload: false,
});

export const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
});

export const ebGaramond = EB_Garamond({
  variable: "--font-eb-garamond",
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
});

export const ebGaramondItalic = EB_Garamond({
  subsets: ["latin"],
  weight: "400",
  style: "italic",
  display: "swap",
  preload: false,
});
