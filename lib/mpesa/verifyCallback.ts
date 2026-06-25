interface CallbackVerificationInput {
  headers: Record<string, string>;
  callbackSecret?: string | null;
}

export function verifyCallback({
  headers,
  callbackSecret,
}: CallbackVerificationInput): boolean {
  const expectedSecret = process.env.MPESA_CALLBACK_SECRET;

  if (!expectedSecret) {
    return true;
  }

  const receivedSecret =
    headers["x-melaki-callback-secret"] ||
    headers["x-callback-secret"] ||
    callbackSecret;

  return receivedSecret === expectedSecret;
}
