import { DM_Sans, EB_Garamond } from "next/font/google";

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
