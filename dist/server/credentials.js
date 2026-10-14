import { createCipheriv, createDecipheriv, randomBytes, } from "node:crypto";
function getEncryptionKey() {
    const value = process.env.SSH_ENCRYPTION_KEY;
    if (!value || !/^[0-9a-fA-F]{64}$/.test(value)) {
        throw new Error("SSH_ENCRYPTION_KEY must be a 32-byte key encoded as 64 hex characters");
    }
    return Buffer.from(value, "hex");
}
export function encryptSecret(plaintext) {
    const key = getEncryptionKey();
    const iv = randomBytes(12);
    const cipher = createCipheriv("aes-256-gcm", key, iv);
    const ciphertext = Buffer.concat([
        cipher.update(plaintext, "utf8"),
        cipher.final(),
    ]);
    const authTag = cipher.getAuthTag();
    return [
        iv.toString("base64"),
        authTag.toString("base64"),
        ciphertext.toString("base64"),
    ].join(".");
}
export function decryptSecret(encrypted) {
    const parts = encrypted.split(".");
    if (parts.length !== 3) {
        throw new Error("Invalid encrypted credential format");
    }
    const [ivEncoded, tagEncoded, ciphertextEncoded] = parts;
    const key = getEncryptionKey();
    const iv = Buffer.from(ivEncoded, "base64");
    const authTag = Buffer.from(tagEncoded, "base64");
    const ciphertext = Buffer.from(ciphertextEncoded, "base64");
    if (iv.length !== 12 || authTag.length !== 16) {
        throw new Error("Invalid encrypted credential data");
    }
    const decipher = createDecipheriv("aes-256-gcm", key, iv);
    decipher.setAuthTag(authTag);
    const plaintext = Buffer.concat([
        decipher.update(ciphertext),
        decipher.final(),
    ]);
    return plaintext.toString("utf8");
}
