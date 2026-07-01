import { timingSafeEqual } from "crypto";

interface CallbackVerificationInput {
  headers: Record<string, string>;
  callbackSecret?: string | null;
}

export function verifyCallback({
  headers,
  callbackSecret,
}: CallbackVerificationInput): boolean {
  const expectedSecret = process.env.MPESA_CALLBACK_SECRET;

  // Fail closed: an unconfigured secret must reject, not allow, callbacks.
  if (!expectedSecret) {
    return false;
  }

  const receivedSecret =
    headers["x-melaki-callback-secret"] ||
    headers["x-callback-secret"] ||
    callbackSecret;

  if (!receivedSecret) {
    return false;
  }

  const expected = Buffer.from(expectedSecret);
  const received = Buffer.from(receivedSecret);
  if (expected.length !== received.length) {
    return false;
  }

  return timingSafeEqual(expected, received);
}
