import crypto from "crypto";

// Utility to hash tokens
export const hashToken = (token: string) =>
  crypto.createHash("sha256").update(token).digest("hex");
