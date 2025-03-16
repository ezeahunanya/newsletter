import crypto from "crypto";

if (!process.env.ENCRYPTION_KEY) {
  throw new Error("Encryption key is not defined in environment variables.");
}

const encryptionKeySecret = process.env.ENCRYPTION_KEY!;

// Encrypt function using AES-256-GCM
export const encryptToken = async (token: string) => {
  console.log("Encrypting token...");
  const encryptionKey = Buffer.from(encryptionKeySecret, "hex"); // 32-byte key
  const iv = crypto.randomBytes(16); // Generate random IV (16 bytes for AES-256-GCM)
  const cipher = crypto.createCipheriv("aes-256-gcm", encryptionKey, iv);

  let encrypted = cipher.update(token, "utf8", "hex");
  encrypted += cipher.final("hex");
  const authTag = cipher.getAuthTag().toString("hex");

  // Return the IV, encrypted token, and auth tag concatenated with ':' separator
  console.log("✅ Token encrypted successfully.");
  return `${iv.toString("hex")}:${encrypted}:${authTag}`;
};

// Decrypt function using AES-256-GCM
export const decryptToken = async (encryptedToken: string) => {
  console.log("Decrypting token...");
  const encryptionKey = Buffer.from(encryptionKeySecret, "hex");

  const [ivHex, encryptedData, authTagHex] = encryptedToken.split(":");
  const iv = Buffer.from(ivHex, "hex");
  const encrypted = Buffer.from(encryptedData, "hex");
  const authTag = Buffer.from(authTagHex, "hex");

  const decipher = crypto.createDecipheriv("aes-256-gcm", encryptionKey, iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(encrypted).toString("utf8");
  decrypted += decipher.final("utf8");

  console.log("✅ Token decrypted successfully.");
  return decrypted;
};
