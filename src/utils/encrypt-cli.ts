import { encryptPassword } from "./encryptor";

const password: string = process.argv[2];
if (!password) {
    console.error("Usage: ts-node encrypt-cli.ts <password>");
    process.exit(1);
}
console.log("Encrypting password:", password);
const encrypted = encryptPassword(password);
console.log("Encrypted password:", encrypted);
