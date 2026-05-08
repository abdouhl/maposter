import type {
  PrintPaperOption,
  PrintQualityAssessment,
  PrintSizeOption,
  PrintFrameOption,
} from "./types";

// ── Real variant IDs from Printful store (product ID: 431618295)
// Framed photo paper poster — sync_variant IDs per size + frame color

const BLACK_VARIANTS: Record<string, number> = {
  "8x10":  5298209263,
  "10x10": 5298209264,
  "11x14": 5298209265,
  "12x12": 5298209266,
  "12x16": 5298209267,
  "12x18": 5298209268,
  "14x14": 5298209270,
  "16x16": 5298209271,
  "16x20": 5298209272,
  "18x18": 5298209273,
  "18x24": 5298209274,
  "24x36": 5298209275,
};

const RED_OAK_VARIANTS: Record<string, number> = {
  "8x10":  5298209276,
  "10x10": 5298209277,
  "11x14": 5298209278,
  "12x12": 5298209279,
  "12x16": 5298209280,
  "12x18": 5298209281,
  "14x14": 5298209282,
  "16x16": 5298209284,
  "16x20": 5298209285,
  "18x18": 5298209286,
  "18x24": 5298209287,
  "24x36": 5298209288,
};

const WHITE_VARIANTS: Record<string, number> = {
  "8x10":  5298209289,
  "10x10": 5298209290,
  "11x14": 5298209291,
  "12x12": 5298209292,
  "12x16": 5298209293,
  "12x18": 5298209294,
  "14x14": 5298209295,
  "16x16": 5298209296,
  "16x20": 5298209298,
  "18x18": 5298209299,
  "18x24": 5298209300,
  "24x36": 5298209301,
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
  { id: "8x10",  label: '8" × 10"',  widthCm: 20.3, heightCm: 25.4, sizeKey: "8x10",  priceUsd: 27.50 },
  { id: "11x14", label: '11" × 14"', widthCm: 27.9, heightCm: 35.6, sizeKey: "11x14", priceUsd: 35.00 },
  { id: "12x16", label: '12" × 16"', widthCm: 30.5, heightCm: 40.6, sizeKey: "12x16", priceUsd: 42.00 },
  { id: "16x20", label: '16" × 20"', widthCm: 40.6, heightCm: 50.8, sizeKey: "16x20", priceUsd: 58.00 },
  { id: "18x24", label: '18" × 24"', widthCm: 45.7, heightCm: 61.0, sizeKey: "18x24", priceUsd: 72.00 },
  { id: "24x36", label: '24" × 36"', widthCm: 61.0, heightCm: 91.4, sizeKey: "24x36", priceUsd: 109.50 },
];

export const PRINT_FRAME_OPTIONS: PrintFrameOption[] = [
  { id: "black",   label: "Black",    swatchHex: "#1a1a1a", priceModifierUsd: 0 },
  { id: "white",   label: "White",    swatchHex: "#f0f0f0", priceModifierUsd: 0 },
  { id: "red_oak", label: "Red Oak",  swatchHex: "#8B4513", priceModifierUsd: 0 },
];

export const PRINT_PAPER_OPTIONS: PrintPaperOption[] = [
  { id: "luster", label: "Luster Paper", description: "Semi-gloss finish. Sharp detail, minimal glare.", priceModifierUsd: 0 },
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