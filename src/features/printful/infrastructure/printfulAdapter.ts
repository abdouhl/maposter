import type { IPrintfulPort } from "../domain/ports";
import type {
  PrintfulMockupResult,
  PrintfulOrderResult,
  PrintOrderOptions,
} from "../domain/types";
import { PRINT_SIZE_OPTIONS, PRINT_FRAME_OPTIONS } from "../domain/constants";

const PROXY_BASE = (import.meta as any).env?.VITE_PRINTFUL_PROXY_URL ?? "";

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("Failed to read image blob"));
    reader.readAsDataURL(blob);
  });
}

async function uploadImageToProxy(imageBlob: Blob): Promise<string> {
  if (!PROXY_BASE) {
    throw new Error(
      "VITE_PRINTFUL_PROXY_URL is not configured. " +
      "Add it to your .env file and restart the dev server."
    );
  }

  const fileBase64 = await blobToBase64(imageBlob);

  const response = await fetch(`${PROXY_BASE}/api/printful/upload`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ fileBase64 }),
  });

  if (!response.ok) {
    let errorText = "Unknown upload error";
    try {
      const errData = await response.json();
      errorText = errData?.error ?? JSON.stringify(errData);
    } catch {
      errorText = await response.text().catch(() => "Unknown upload error");
    }
    throw new Error(`Image upload failed: ${errorText}`);
  }

  const data = await response.json();
  const fileUrl = String(data.fileUrl ?? data.r2Url ?? "");
  if (!fileUrl) throw new Error("Worker did not return a fileUrl");
  return fileUrl;
}

export const printfulAdapter: IPrintfulPort = {
  async generateMockup(imageBlob: Blob, variantId: number): Promise<PrintfulMockupResult> {
    if (!PROXY_BASE) {
      throw new Error("VITE_PRINTFUL_PROXY_URL is not configured.");
    }

    const fileUrl = await uploadImageToProxy(imageBlob);

    // Send variantId directly — Worker will use it as-is.
    // If variantId is 0/invalid, the Worker will return a clear error.
    const response = await fetch(`${PROXY_BASE}/api/printful/mockup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ variantId, fileUrl }),
    });

    if (!response.ok) {
      let errorText = "Mockup error";
      try {
        const errData = await response.json();
        errorText = errData?.error ?? JSON.stringify(errData);
      } catch {
        errorText = await response.text().catch(() => "Mockup error");
      }
      throw new Error(`Mockup generation failed: ${errorText}`);
    }

    const data = await response.json();
    return {
      mockupUrl: String(data.mockupUrl ?? ""),
      taskKey: String(data.taskKey ?? ""),
    };
  },

  async createOrder(options: PrintOrderOptions): Promise<PrintfulOrderResult> {
    if (!PROXY_BASE) {
      throw new Error("VITE_PRINTFUL_PROXY_URL is not configured.");
    }

    const sizeOption = PRINT_SIZE_OPTIONS.find((s) => s.id === options.sizeId);
    const frameOption = PRINT_FRAME_OPTIONS.find((f) => f.id === options.frameColor);
    if (!sizeOption) throw new Error(`Unknown print size: ${options.sizeId}`);

    const fileUrl = await uploadImageToProxy(options.imageBlob);

    // Send sizeKey + frameColor so the Worker resolves the correct variant ID
    // dynamically from the mockup-generator catalog.
    const response = await fetch(`${PROXY_BASE}/api/printful/order`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fileUrl,
        sizeKey: sizeOption.sizeKey,
        frameColor: options.frameColor,
        posterTitle: options.posterTitle,
        sizeName: sizeOption.label,
        frameName: frameOption?.label ?? options.frameColor,
      }),
    });

    if (!response.ok) {
      let errorText = "Order error";
      try {
        const errData = await response.json();
        errorText = errData?.error ?? JSON.stringify(errData);
      } catch {
        errorText = await response.text().catch(() => "Order error");
      }
      throw new Error(`Order creation failed: ${errorText}`);
    }

    const data = await response.json();
    return {
      checkoutUrl: String(data.checkoutUrl ?? ""),
      orderId: String(data.orderId ?? ""),
    };
  },
};