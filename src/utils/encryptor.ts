import * as crypto from "crypto";

const ALGORITHM: string = "aes-256-cbc";
const ENCRYPTION_KEY = "12345678901234567890123456789012";

// Encrypt a plain text password
export function encryptPassword(password: string): string {
    const iv = crypto.randomBytes(16);
    console.log("Encryption Key:", ENCRYPTION_KEY);
    const cipher = crypto.createCipheriv(
        ALGORITHM,
        Buffer.from(ENCRYPTION_KEY),
        iv
    );
    let encrypted = cipher.update(password, "utf8", "hex");
    encrypted += cipher.final("hex");
    return `${encrypted}:${iv.toString("hex")}`;
}

// Decrypt an encrypted password
export function decryptPassword(encrypted: string): string {
    const [encryptedText, ivHex] = encrypted.split(":");
    const iv = Buffer.from(ivHex, "hex");
    const decipher = crypto.createDecipheriv(
        ALGORITHM,
        Buffer.from(ENCRYPTION_KEY),
        iv
    );
    let decrypted = decipher.update(encryptedText, "hex", "utf8");
    decrypted += decipher.final("utf8");
    return decrypted;
}
