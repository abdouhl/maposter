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

  const handleGenerateMockup = useCallback(async () => {
    setStep("generating");
    setErrorMessage("");
    try {
      const blob = await getExportBlob();
      // Pass 0 as variantId — the Worker will resolve it from sizeKey + frameColor.
      // We extend the IPrintfulPort.generateMockup signature via the adapter directly.
      const PROXY_BASE = (import.meta as any).env?.VITE_PRINTFUL_PROXY_URL ?? "";
      if (!PROXY_BASE) {
        throw new Error("VITE_PRINTFUL_PROXY_URL is not configured.");
      }

      // Upload image
      const fileBase64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => reject(new Error("Failed to read image blob"));
        reader.readAsDataURL(blob);
      });

      const uploadRes = await fetch(`${PROXY_BASE}/api/printful/upload`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileBase64 }),
      });
      if (!uploadRes.ok) {
        const err = await uploadRes.json().catch(() => ({}));
        throw new Error(`Upload failed: ${err?.error ?? uploadRes.statusText}`);
      }
      const { fileUrl } = await uploadRes.json();

      // Request mockup — send sizeKey + frameColor, Worker resolves variant
      const mockupRes = await fetch(`${PROXY_BASE}/api/printful/mockup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileUrl,
          sizeKey: selectedSizeOption.sizeKey,
          frameColor: selectedFrame,
        }),
      });
      if (!mockupRes.ok) {
        const err = await mockupRes.json().catch(() => ({}));
        throw new Error(`Mockup failed: ${err?.error ?? mockupRes.statusText}`);
      }
      const result = await mockupRes.json();
      setMockupResult({ mockupUrl: result.mockupUrl, taskKey: result.taskKey });
      setStep("preview");
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : "Failed to generate mockup.",
      );
      setStep("error");
    }
  }, [getExportBlob, selectedSizeOption.sizeKey, selectedFrame]);

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
        variantId: 0, // ignored — Worker resolves from sizeKey + frameColor
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
  }, [getExportBlob, selectedSize, selectedFrame, selectedPaper, posterTitle]);

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
    mockupResult,
    errorMessage,
    setSelectedSize,
    setSelectedFrame,
    handleGenerateMockup,
    handleConfirmOrder,
    handleReset,
  };
}