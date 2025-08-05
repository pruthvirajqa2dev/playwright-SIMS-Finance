import users from "../data/users.json";
import { decryptPassword } from "./encryptor";
import ENV from "../config/env";

export function getCredentials(
    tenant: string,
    schoolId: string,
    userRole: string
): [string, string] {
    const username =
        users[tenant]?.[schoolId]?.[userRole] || users[tenant]?.[userRole];
    const encryptedPassword = ENV.SFDEMOSITE_PASSWORD;

    if (!username || !encryptedPassword) {
        throw new Error(`Missing credentials for ${tenant} ${schoolId}`);
    }

    const password = decryptPassword(encryptedPassword);
    return [username, password];
}
