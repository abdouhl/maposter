import { createPortal } from "react-dom";
import {
  PRINT_SIZE_OPTIONS,
  PRINT_FRAME_OPTIONS,
  assessPrintQuality,
} from "../domain/constants";
import { usePrintOrder } from "../application/usePrintOrder";
import type { PrintFrameColor, PrintSize } from "../domain/types";

interface BuyPosterModalProps {
  onClose: () => void;
  getExportBlob: () => Promise<Blob>;
  canvasWidthPx: number;
  canvasHeightPx: number;
  posterTitle: string;
}

// ── Quality badge ─────────────────────────────────────────────────────────────
function QualityBadge({ score, message }: { score: string; message: string }) {
  return (
    <div className={`buy-quality-badge buy-quality-badge--${score}`}>
      <span className="buy-quality-icon" aria-hidden="true">
        {{ excellent: "✦", good: "●", fair: "◐", poor: "○" }[score] ?? "●"}
      </span>
      <span className="buy-quality-text">{message}</span>
    </div>
  );
}

// ── Size card ─────────────────────────────────────────────────────────────────
function SizeCard({
  option,
  isSelected,
  qualityScore,
  onClick,
}: {
  option: (typeof PRINT_SIZE_OPTIONS)[number];
  isSelected: boolean;
  qualityScore?: string;
  onClick: () => void;
}) {
  const dotColor: Record<string, string> = {
    excellent: "#4ade80",
    good: "#facc15",
    fair: "#fb923c",
    poor: "#f87171",
  };
  return (
    <button
      type="button"
      className={`buy-size-card${isSelected ? " is-selected" : ""}`}
      onClick={onClick}
    >
      {qualityScore && (
        <span
          className="buy-size-quality-dot"
          style={{ background: dotColor[qualityScore] }}
          title={`Print quality: ${qualityScore}`}
        />
      )}
      <span className="buy-size-label">{option.label}</span>
      <span className="buy-size-dims">
        {option.widthCm} × {option.heightCm} cm
      </span>
      <span className="buy-size-price">${option.priceUsd.toFixed(2)}</span>
    </button>
  );
}

// ── Frame color picker ────────────────────────────────────────────────────────
function FramePicker({
  selectedFrame,
  onSelect,
}: {
  selectedFrame: PrintFrameColor;
  onSelect: (id: PrintFrameColor) => void;
}) {
  return (
    <section className="buy-section">
      <h3 className="buy-section-title">
        <span className="buy-step-num">02</span> Frame Color
      </h3>
      <div className="buy-frame-grid">
        {PRINT_FRAME_OPTIONS.map((opt) => (
          <button
            key={opt.id}
            type="button"
            className={`buy-frame-card${selectedFrame === opt.id ? " is-selected" : ""}`}
            onClick={() => onSelect(opt.id as PrintFrameColor)}
          >
            <span
              className="buy-frame-swatch"
              style={{ background: opt.swatchHex }}
              aria-hidden="true"
            />
            <span className="buy-frame-label">{opt.label}</span>
          </button>
        ))}
      </div>
    </section>
  );
}

// ── Spinner ───────────────────────────────────────────────────────────────────
function Spinner({ label }: { label: string }) {
  return (
    <div className="buy-spinner-wrap">
      <div className="buy-spinner" aria-hidden="true" />
      <p className="buy-spinner-label">{label}</p>
    </div>
  );
}

// ── Main modal ────────────────────────────────────────────────────────────────
export default function BuyPosterModal({
  onClose,
  getExportBlob,
  canvasWidthPx,
  canvasHeightPx,
  posterTitle,
}: BuyPosterModalProps) {
  const {
    step,
    selectedSize,
    selectedFrame,
    selectedSizeOption,
    qualityAssessment,
    mockupResult,
    errorMessage,
    setSelectedSize,
    setSelectedFrame,
    handleGenerateMockup,
    handleConfirmOrder,
    handleReset,
  } = usePrintOrder({
    getExportBlob,
    canvasWidthPx,
    canvasHeightPx,
    posterTitle,
  });

  const frameLabel =
    PRINT_FRAME_OPTIONS.find((f) => f.id === selectedFrame)?.label ?? selectedFrame;

  const canClose = step === "configure" || step === "error";

  const modal = (
    <div
      className="buy-modal-backdrop"
      role="presentation"
      onClick={canClose ? onClose : undefined}
    >
      <div
        className="buy-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="buy-modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Header ── */}
        <div className="buy-modal-header">
          <div className="buy-modal-header-copy">
            <p className="buy-modal-eyebrow">PRINT ON DEMAND · FRAMED POSTER</p>
            <h2 className="buy-modal-title" id="buy-modal-title">
              Order Your Poster
            </h2>
          </div>
          {canClose && (
            <button
              type="button"
              className="buy-modal-close"
              onClick={onClose}
              aria-label="Close"
            >
              ✕
            </button>
          )}
        </div>

        {/* ── Configure ── */}
        {step === "configure" && (
          <div className="buy-modal-body">
            {/* Size picker */}
            <section className="buy-section">
              <h3 className="buy-section-title">
                <span className="buy-step-num">01</span> Print Size
              </h3>
              <div className="buy-size-grid">
                {PRINT_SIZE_OPTIONS.map((opt) => {
                  const qa =
                    canvasWidthPx > 0
                      ? assessPrintQuality(
                          canvasWidthPx,
                          canvasHeightPx,
                          opt.widthCm,
                          opt.heightCm,
                        )
                      : null;
                  return (
                    <SizeCard
                      key={opt.id}
                      option={opt}
                      isSelected={selectedSize === opt.id}
                      qualityScore={qa?.score}
                      onClick={() => setSelectedSize(opt.id as PrintSize)}
                    />
                  );
                })}
              </div>
            </section>

            {/* Quality badge */}
            {qualityAssessment && (
              <QualityBadge
                score={qualityAssessment.score}
                message={qualityAssessment.message}
              />
            )}

            {/* Frame color picker */}
            <FramePicker
              selectedFrame={selectedFrame}
              onSelect={setSelectedFrame}
            />

            {/* Paper note */}
            <div className="buy-fulfillment-note">
              <span aria-hidden="true">◈</span>
              <span>
                Luster paper · Ships worldwide by{" "}
                <strong>Printful</strong> in 2–5 business days.
              </span>
            </div>

            {/* CTA */}
            <div className="buy-cta-row">
              <div className="buy-total">
                <span className="buy-total-label">From</span>
                <span className="buy-total-price">
                  ${selectedSizeOption.priceUsd.toFixed(2)}
                </span>
              </div>
              <button
                type="button"
                className="buy-cta-btn"
                disabled={qualityAssessment?.canPrint === false}
                onClick={handleGenerateMockup}
              >
                {qualityAssessment?.canPrint === false
                  ? "Resolution too low"
                  : "Preview Mockup →"}
              </button>
            </div>
          </div>
        )}

        {/* ── Generating ── */}
        {step === "generating" && (
          <div className="buy-modal-body buy-modal-body--center">
            <Spinner label="Generating your mockup…" />
            <p className="buy-generating-hint">
              Uploading your poster and rendering a print preview.
              <br />
              This takes about 10–20 seconds.
            </p>
          </div>
        )}

        {/* ── Preview ── */}
        {step === "preview" && mockupResult && (
          <div className="buy-modal-body">
            <div className="buy-mockup-wrap">
              <img
                className="buy-mockup-img"
                src={mockupResult.mockupUrl}
                alt="Print mockup preview"
              />
              <div className="buy-mockup-badge">
                {selectedSizeOption.label} · {frameLabel} frame
              </div>
            </div>
            <p className="buy-preview-hint">
              How your poster will look when printed and framed. Colors may
              vary slightly due to monitor calibration.
            </p>
            <div className="buy-cta-row">
              <button type="button" className="buy-back-btn" onClick={handleReset}>
                ← Back
              </button>
              <div className="buy-total">
                <span className="buy-total-label">Total</span>
                <span className="buy-total-price">
                  ${selectedSizeOption.priceUsd.toFixed(2)}
                </span>
              </div>
              <button
                type="button"
                className="buy-cta-btn"
                onClick={handleConfirmOrder}
              >
                Buy Now →
              </button>
            </div>
          </div>
        )}

        {/* ── Ordering ── */}
        {step === "ordering" && (
          <div className="buy-modal-body buy-modal-body--center">
            <Spinner label="Creating your order…" />
            <p className="buy-generating-hint">
              Redirecting you to Printful's secure checkout.
            </p>
          </div>
        )}

        {/* ── Error ── */}
        {step === "error" && (
          <div className="buy-modal-body buy-modal-body--center">
            <div className="buy-error-icon" aria-hidden="true">⚠</div>
            <p className="buy-error-message">{errorMessage}</p>
            <p className="buy-error-hint">
              Make sure <code>VITE_PRINTFUL_PROXY_URL</code> is set and your
              Cloudflare Worker is deployed and running.
            </p>
            <button type="button" className="buy-cta-btn" onClick={handleReset}>
              Try Again
            </button>
          </div>
        )}
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}