import type {
  PrintPaperOption,
  PrintQualityAssessment,
  PrintSizeOption,
  PrintFrameOption,
} from "./types";

// ── Catalog variant IDs from Printful public catalog (product ID: 2)
// Enhanced Matte Paper Framed Poster (in)
// Source: GET https://api.printful.com/products/2

// Black frame catalog variant IDs
const BLACK_VARIANTS: Record<string, number> = {
  "8x10":  4651,
  "11x14": 14292,
  "12x16": 1350,
  "12x18": 4398,
  "16x20": 4399,
  "18x24": 3,
  "24x36": 4,
};

// Red Oak frame catalog variant IDs
const RED_OAK_VARIANTS: Record<string, number> = {
  "8x10":  15021,
  "11x14": 15023,
  "12x16": 15025,
  "12x18": 15026,
  "16x20": 15029,
  "18x24": 15031,
  "24x36": 15032,
};

// White frame catalog variant IDs
const WHITE_VARIANTS: Record<string, number> = {
  "8x10":  10754,
  "11x14": 14293,
  "12x16": 10751,
  "12x18": 10752,
  "16x20": 10753,
  "18x24": 10749,
  "24x36": 10750,
};

export const FRAME_VARIANT_MAP: Record<string, Record<string, number>> = {
  black:   BLACK_VARIANTS,
  red_oak: RED_OAK_VARIANTS,
  white:   WHITE_VARIANTS,
};

export function getVariantId(sizeKey: string, frameColor: string): number {
  const map = FRAME_VARIANT_MAP[frameColor] ?? BLACK_VARIANTS;
  return map[sizeKey] ?? BLACK_VARIANTS["11x14"]!;
}

export const PRINT_SIZE_OPTIONS: PrintSizeOption[] = [
  { id: "8x10",  label: '8" × 10"',  widthCm: 20.3, heightCm: 25.4, sizeKey: "8x10",  priceUsd: 20.35 },
  { id: "11x14", label: '11" × 14"', widthCm: 27.9, heightCm: 35.6, sizeKey: "11x14", priceUsd: 30.09 },
  { id: "12x16", label: '12" × 16"', widthCm: 30.5, heightCm: 40.6, sizeKey: "12x16", priceUsd: 31.57 },
  { id: "16x20", label: '16" × 20"', widthCm: 40.6, heightCm: 50.8, sizeKey: "16x20", priceUsd: 41.77 },
  { id: "18x24", label: '18" × 24"', widthCm: 45.7, heightCm: 61.0, sizeKey: "18x24", priceUsd: 45.39 },
  { id: "24x36", label: '24" × 36"', widthCm: 61.0, heightCm: 91.4, sizeKey: "24x36", priceUsd: 74.41 },
];

export const PRINT_FRAME_OPTIONS: PrintFrameOption[] = [
  { id: "black",   label: "Black",    swatchHex: "#1a1a1a", priceModifierUsd: 0 },
  { id: "white",   label: "White",    swatchHex: "#f0f0f0", priceModifierUsd: 0 },
  { id: "red_oak", label: "Red Oak",  swatchHex: "#D4A489", priceModifierUsd: 0 },
];

export const PRINT_PAPER_OPTIONS: PrintPaperOption[] = [
  { id: "luster", label: "Matte Paper", description: "Enhanced matte finish. Sharp detail, no glare.", priceModifierUsd: 0 },
];

export const DEFAULT_PRINT_SIZE = "11x14";
export const DEFAULT_FRAME_COLOR = "black";
export const DEFAULT_PAPER_TYPE = "luster";

export function assessPrintQuality(
  canvasWidthPx: number,
  canvasHeightPx: number,
  printWidthCm: number,
  printHeightCm: number,
): PrintQualityAssessment {
  const CM_PER_INCH = 2.54;
  const dpiW = canvasWidthPx / (printWidthCm / CM_PER_INCH);
  const dpiH = canvasHeightPx / (printHeightCm / CM_PER_INCH);
  const dpi = Math.round(Math.min(dpiW, dpiH));

  if (dpi >= 250) return { score: "excellent", dpi, message: `${dpi} DPI — sharp and crisp.`, canPrint: true };
  if (dpi >= 150) return { score: "good",      dpi, message: `${dpi} DPI — good quality. Slightly soft up close.`, canPrint: true };
  if (dpi >= 100) return { score: "fair",      dpi, message: `${dpi} DPI — fair quality. Consider a smaller size.`, canPrint: true };
  return               { score: "poor",      dpi, message: `${dpi} DPI — too low. Choose a smaller format.`, canPrint: false };
}