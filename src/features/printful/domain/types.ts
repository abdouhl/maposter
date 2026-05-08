export type PrintFrameColor = "black" | "white" | "red_oak";
export type PrintPaperType = "luster";
export type PrintSize =
  | "8x10" | "10x10" | "11x14" | "12x12"
  | "12x16" | "12x18" | "14x14" | "16x16"
  | "16x20" | "18x18" | "18x24" | "24x36";

export interface PrintSizeOption {
  id: PrintSize;
  label: string;
  widthCm: number;
  heightCm: number;
  sizeKey: string;
  priceUsd: number;
}

export interface PrintFrameOption {
  id: PrintFrameColor;
  label: string;
  swatchHex: string;
  priceModifierUsd: number;
}

export interface PrintPaperOption {
  id: PrintPaperType;
  label: string;
  description: string;
  priceModifierUsd: number;
}

export interface PrintQualityAssessment {
  score: "excellent" | "good" | "fair" | "poor";
  dpi: number;
  message: string;
  canPrint: boolean;
}

export interface PrintfulMockupResult {
  mockupUrl: string;
  taskKey: string;
}

export interface PrintfulOrderResult {
  checkoutUrl: string;
  orderId: string;
}

export interface PrintOrderOptions {
  imageBlob: Blob;
  sizeId: PrintSize;
  frameColor: PrintFrameColor;
  paperType: PrintPaperType;
  posterTitle: string;
  variantId: number;
}