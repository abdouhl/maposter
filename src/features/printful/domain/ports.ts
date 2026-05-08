import type {
  PrintfulMockupResult,
  PrintOrderOptions,
  PrintfulOrderResult,
} from "./types";

export interface IPrintfulPort {
  /**
   * Uploads a poster image blob to Printful and generates a mockup.
   * Returns a mockup image URL and a task key for status polling.
   *
   * NOTE: This must be called from a backend proxy — the Printful API key
   * must NEVER be exposed to client-side code.
   */
  generateMockup(
    imageBlob: Blob,
    variantId: number,
  ): Promise<PrintfulMockupResult>;

  /**
   * Creates a Printful draft order and returns a hosted checkout URL.
   * The user is redirected to Printful's checkout to complete payment.
   */
  createOrder(options: PrintOrderOptions): Promise<PrintfulOrderResult>;
}