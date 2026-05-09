import type { IPrintfulPort } from "../domain/ports";
import type {
  PrintfulMockupResult,
  PrintfulOrderResult,
  PrintOrderOptions,
} from "../domain/types";
import { PRINT_SIZE_OPTIONS, PRINT_FRAME_OPTIONS } from "../domain/constants";

const PROXY_BASE = (import.meta as any).env?.VITE_PRINTFUL_PROXY_URL ?? "";

async function uploadImageToProxy(imageBlob: Blob): Promise<string> {
  if (!PROXY_BASE) throw new Error("VITE_PRINTFUL_PROXY_URL is not configured.");

  const fileBase64 = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("Failed to read image blob"));
    reader.readAsDataURL(imageBlob);
  });

  const response = await fetch(`${PROXY_BASE}/api/printful/upload`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ fileBase64 }),
  });

  if (!response.ok) {
    const error = await response.text().catch(() => "Unknown upload error");
    throw new Error(`Image upload failed: ${error}`);
  }
  const data = await response.json();
  return String(data.fileUrl ?? data.url ?? "");
}

export const printfulAdapter: IPrintfulPort = {
  async generateMockup(imageBlob, variantId): Promise<PrintfulMockupResult> {
    if (!PROXY_BASE) throw new Error("VITE_PRINTFUL_PROXY_URL is not configured.");
    const fileUrl = await uploadImageToProxy(imageBlob);
    const response = await fetch(`${PROXY_BASE}/api/printful/mockup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ variantId, fileUrl }),
    });
    if (!response.ok) {
      const error = await response.text().catch(() => "Mockup error");
      throw new Error(`Mockup generation failed: ${error}`);
    }
    const data = await response.json();
    return {
      mockupUrl: String(data.mockupUrl ?? ""),
      taskKey: String(data.taskKey ?? ""),
    };
  },

  async createOrder(options: PrintOrderOptions): Promise<PrintfulOrderResult> {
    if (!PROXY_BASE) throw new Error("VITE_PRINTFUL_PROXY_URL is not configured.");
    const sizeOption = PRINT_SIZE_OPTIONS.find((s) => s.id === options.sizeId);
    const frameOption = PRINT_FRAME_OPTIONS.find((f) => f.id === options.frameColor);
    if (!sizeOption) throw new Error(`Unknown print size: ${options.sizeId}`);
    const fileUrl = await uploadImageToProxy(options.imageBlob);
    const response = await fetch(`${PROXY_BASE}/api/printful/order`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fileUrl,
        variantId: options.variantId,
        posterTitle: options.posterTitle,
        sizeName: sizeOption.label,
        frameName: frameOption?.label ?? options.frameColor,
      }),
    });
    if (!response.ok) {
      const error = await response.text().catch(() => "Order error");
      throw new Error(`Order creation failed: ${error}`);
    }
    const data = await response.json();
    return {
      checkoutUrl: String(data.checkoutUrl ?? ""),
      orderId: String(data.orderId ?? ""),
    };
  },
};