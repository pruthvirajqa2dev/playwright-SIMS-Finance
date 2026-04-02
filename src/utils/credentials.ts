// import usersUAT from "../data/users.UAT.json";
import { decryptPassword } from "./encryptor";
import ENV from "../config/env";
import path from "path";
import fs from "fs";
function loadUsers() {
    const env = ENV.TEST_ENV || process.env.TEST_ENV || "uat";

    if (!env) {
        throw new Error("TEST_ENV is not defined");
    }
    console.log(`Loading users for environment: ${env}`);
    const envLower = env.toLowerCase();
    const filePath = path.resolve(__dirname, `../data/users.${envLower}.json`);

    if (!fs.existsSync(filePath)) {
        throw new Error(`Users file not found for environment: ${env}`);
    }

    return JSON.parse(fs.readFileSync(filePath, "utf-8"));
}
export function getCredentials(
    tenant: string,
    schoolId: string,
    userRole: string
): [string, string] {
    const users = loadUsers();
    const username =
        users[tenant]?.[schoolId]?.[userRole] || users[tenant]?.[userRole];
    const encryptedPassword =
        ENV.SFDEMOSITE_PASSWORD ||
        process.env.SFDEMOSITE_PASSWORD ||
        "76bb3182b1ca21278f4772d785bee5d010f8c06bf1eb216bc29a02e57bcf15f3:11d03a22f7c9b09539f2bb4112361514";

    if (!username || !encryptedPassword) {
        throw new Error(`Missing credentials for ${tenant} ${schoolId}`);
    }
    console.log(
        `Retrieved credentials for tenant: ${tenant}, schoolId: ${schoolId}, userRole: ${userRole}`
    );
    const password = decryptPassword(encryptedPassword);
    return [username, password];
}
