import crypto from "crypto";

const encryptionKeyHex = process.env.ENCRYPTION_KEY;

if (!encryptionKeyHex) {
  throw new Error("Encryption key is not defined in environment variables.");
}

const encryptionKey = Buffer.from(encryptionKeyHex, "hex");

// Helper to create cipher
const createCipher = () => {
  const iv = crypto.randomBytes(16); // 16 bytes for AES-256-GCM
  const cipher = crypto.createCipheriv("aes-256-gcm", encryptionKey, iv);
  return { cipher, iv };
};

// Helper to create decipher
const createDecipher = (iv: Buffer, authTag: Buffer) => {
  const decipher = crypto.createDecipheriv("aes-256-gcm", encryptionKey, iv);
  decipher.setAuthTag(authTag);
  return decipher;
};

export const encryptToken = (token: string): string => {
  console.log("Encrypting token...");
  const { cipher, iv } = createCipher();

  const encrypted = Buffer.concat([
    cipher.update(token, "utf8"),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();

  console.log("✅ Token encrypted successfully.");
  return `${iv.toString("hex")}:${encrypted.toString("hex")}:${authTag.toString("hex")}`;
};

export const decryptToken = (encryptedToken: string): string => {
  console.log("Decrypting token...");
  const [ivHex, encryptedHex, authTagHex] = encryptedToken.split(":");

  if (!ivHex || !encryptedHex || !authTagHex) {
    throw new Error("Invalid token format.");
  }

  const iv = Buffer.from(ivHex, "hex");
  const encrypted = Buffer.from(encryptedHex, "hex");
  const authTag = Buffer.from(authTagHex, "hex");

  const decipher = createDecipher(iv, authTag);

  const decrypted = Buffer.concat([
    decipher.update(encrypted),
    decipher.final(),
  ]);

  console.log("✅ Token decrypted successfully.");
  return decrypted.toString("utf8");
};
