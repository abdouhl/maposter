import { useCallback, useState } from "react";
import { printfulAdapter } from "../infrastructure/printfulAdapter";
import type {
  PrintFrameColor,
  PrintPaperType,
  PrintSize,
  PrintfulMockupResult,
  PrintQualityAssessment,
} from "../domain/types";
import {
  DEFAULT_FRAME_COLOR,
  DEFAULT_PAPER_TYPE,
  DEFAULT_PRINT_SIZE,
  PRINT_SIZE_OPTIONS,
  assessPrintQuality,
  getVariantId,
} from "../domain/constants";

export type BuyFlowStep =
  | "configure"
  | "generating"
  | "preview"
  | "ordering"
  | "error";

interface UsePrintOrderOptions {
  getExportBlob: () => Promise<Blob>;
  canvasWidthPx: number;
  canvasHeightPx: number;
  posterTitle: string;
}

export function usePrintOrder({
  getExportBlob,
  canvasWidthPx,
  canvasHeightPx,
  posterTitle,
}: UsePrintOrderOptions) {
  const [step, setStep] = useState<BuyFlowStep>("configure");
  const [selectedSize, setSelectedSize] = useState<PrintSize>(DEFAULT_PRINT_SIZE);
  const [selectedFrame, setSelectedFrame] = useState<PrintFrameColor>(DEFAULT_FRAME_COLOR);
  const [selectedPaper] = useState<PrintPaperType>(DEFAULT_PAPER_TYPE);
  const [mockupResult, setMockupResult] = useState<PrintfulMockupResult | null>(null);
  const [errorMessage, setErrorMessage] = useState("");

  const selectedSizeOption = PRINT_SIZE_OPTIONS.find((s) => s.id === selectedSize)!;

  const qualityAssessment: PrintQualityAssessment | null =
    canvasWidthPx > 0 && canvasHeightPx > 0
      ? assessPrintQuality(
          canvasWidthPx,
          canvasHeightPx,
          selectedSizeOption.widthCm,
          selectedSizeOption.heightCm,
        )
      : null;

  // Resolve the real Printful variant ID from size + frame color
  const variantId = getVariantId(selectedSizeOption.sizeKey, selectedFrame);

  const handleGenerateMockup = useCallback(async () => {
    setStep("generating");
    setErrorMessage("");
    try {
      const blob = await getExportBlob();
      const result = await printfulAdapter.generateMockup(blob, variantId);
      setMockupResult(result);
      setStep("preview");
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : "Failed to generate mockup.",
      );
      setStep("error");
    }
  }, [getExportBlob, variantId]);

  const handleConfirmOrder = useCallback(async () => {
    setStep("ordering");
    setErrorMessage("");
    try {
      const blob = await getExportBlob();
      const result = await printfulAdapter.createOrder({
        imageBlob: blob,
        sizeId: selectedSize,
        frameColor: selectedFrame,
        paperType: selectedPaper,
        posterTitle,
        variantId,
      });
      window.open(result.checkoutUrl, "_blank", "noopener,noreferrer");
      setStep("configure");
      setMockupResult(null);
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : "Failed to create order.",
      );
      setStep("error");
    }
  }, [getExportBlob, selectedSize, selectedFrame, selectedPaper, posterTitle, variantId]);

  const handleReset = useCallback(() => {
    setStep("configure");
    setMockupResult(null);
    setErrorMessage("");
  }, []);

  return {
    step,
    selectedSize,
    selectedFrame,
    selectedPaper,
    selectedSizeOption,
    qualityAssessment,
    variantId,
    mockupResult,
    errorMessage,
    setSelectedSize,
    setSelectedFrame,
    handleGenerateMockup,
    handleConfirmOrder,
    handleReset,
  };
}