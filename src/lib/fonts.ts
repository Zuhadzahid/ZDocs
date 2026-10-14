import localFont from "next/font/local";

/**
 * Axiforma is the product typeface. Only the weights the UI actually uses are
 * loaded so the font payload stays small; next/font self-hosts the files and
 * emits a CSS variable consumed by Tailwind's --font-sans.
 */
export const axiforma = localFont({
  variable: "--font-axiforma",
  display: "swap",
  src: [
    { path: "../fonts/axiforma/Axiforma-Light.ttf", weight: "300", style: "normal" },
    { path: "../fonts/axiforma/Axiforma-Regular.ttf", weight: "400", style: "normal" },
    { path: "../fonts/axiforma/Axiforma-Italic.ttf", weight: "400", style: "italic" },
    { path: "../fonts/axiforma/Axiforma-Medium.ttf", weight: "500", style: "normal" },
    { path: "../fonts/axiforma/Axiforma-MediumItalic.ttf", weight: "500", style: "italic" },
    { path: "../fonts/axiforma/Axiforma-SemiBold.ttf", weight: "600", style: "normal" },
    { path: "../fonts/axiforma/Axiforma-Bold.ttf", weight: "700", style: "normal" },
    { path: "../fonts/axiforma/Axiforma-BoldItalic.ttf", weight: "700", style: "italic" },
    { path: "../fonts/axiforma/Axiforma-ExtraBold.ttf", weight: "800", style: "normal" },
  ],
});
