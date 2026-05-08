import { lazy, Suspense, useCallback, useState } from "react";
import { usePosterContext } from "@/features/poster/ui/PosterContext";
import { createPngBlob } from "@/core/services";
import { captureMapAsCanvas } from "@/features/export/infrastructure/mapExporter";
import { resolveCanvasSize } from "@/features/poster/infrastructure/renderer/canvas";
import {
  DEFAULT_POSTER_WIDTH_CM,
  DEFAULT_POSTER_HEIGHT_CM,
  CM_PER_INCH,
} from "@/core/config";

const BuyPosterModal = lazy(() => import("./BuyPosterModal"));

interface BuyButtonProps {
  /** Visual variant: fits inside export modal or desktop FAB */
  variant?: "modal-row" | "fab";
}

export default function BuyButton({ variant = "modal-row" }: BuyButtonProps) {
  const { state, mapRef } = usePosterContext();
  const { form } = state;
  const [modalOpen, setModalOpen] = useState(false);
  const [canvasSize, setCanvasSize] = useState({ w: 0, h: 0 });

  const posterTitle =
    [form.displayCity, form.displayCountry].filter(Boolean).join(", ") ||
    form.location ||
    "Map Poster";

  // Lazily capture + encode the poster PNG on demand.
  // We keep the canvas dimensions for the quality assessment.
  const getExportBlob = useCallback(async (): Promise<Blob> => {
    const map = mapRef.current;
    if (!map) throw new Error("Map is not ready.");

    const widthCm = Number(form.width) || DEFAULT_POSTER_WIDTH_CM;
    const heightCm = Number(form.height) || DEFAULT_POSTER_HEIGHT_CM;
    const size = resolveCanvasSize(widthCm / CM_PER_INCH, heightCm / CM_PER_INCH);

    const { canvas } = await captureMapAsCanvas(map, size.width, size.height);
    setCanvasSize({ w: canvas.width, h: canvas.height });
    return createPngBlob(canvas, 300);
  }, [mapRef, form.width, form.height]);

  const handleOpen = useCallback(async () => {
    // Pre-warm canvas size for quality assessment before modal opens.
    // We do a lightweight check without actually encoding the full PNG yet.
    const map = mapRef.current;
    if (map) {
      const widthCm = Number(form.width) || DEFAULT_POSTER_WIDTH_CM;
      const heightCm = Number(form.height) || DEFAULT_POSTER_HEIGHT_CM;
      const size = resolveCanvasSize(widthCm / CM_PER_INCH, heightCm / CM_PER_INCH);
      setCanvasSize({ w: size.width, h: size.height });
    }
    setModalOpen(true);
  }, [mapRef, form.width, form.height]);

  if (variant === "fab") {
    return (
      <>
        <button
          type="button"
          className="desktop-export-btn desktop-export-btn--buy"
          onClick={handleOpen}
          title="Order a physical print"
        >
          <span>🛒</span>
          <span>Buy Print</span>
        </button>
        {modalOpen && (
          <Suspense fallback={null}>
            <BuyPosterModal
              onClose={() => setModalOpen(false)}
              getExportBlob={getExportBlob}
              canvasWidthPx={canvasSize.w}
              canvasHeightPx={canvasSize.h}
              posterTitle={posterTitle}
            />
          </Suspense>
        )}
      </>
    );
  }

  // modal-row variant — sits inside the export modal actions list
  return (
    <>
      <button
        type="button"
        className="buy-trigger-btn"
        onClick={handleOpen}
      >
        <span className="buy-trigger-icon" aria-hidden="true">🛒</span>
        <span>Buy a Print</span>
      </button>
      {modalOpen && (
        <Suspense fallback={null}>
          <BuyPosterModal
            onClose={() => setModalOpen(false)}
            getExportBlob={getExportBlob}
            canvasWidthPx={canvasSize.w}
            canvasHeightPx={canvasSize.h}
            posterTitle={posterTitle}
          />
        </Suspense>
      )}
    </>
  );
}