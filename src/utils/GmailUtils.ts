import { google, gmail_v1 } from "googleapis";
import fs from "fs";
import path from "path";

const TOKEN_PATH = path.resolve(__dirname, "gmail-token.json");

/* ============================================================
   🔐 Load OAuth credentials from file
   ============================================================ */
function loadGmailToken() {
    if (!fs.existsSync(TOKEN_PATH)) {
        throw new Error(
            [
                "GMAIL TOKEN FILE MISSING",
                `❌ File not found: ${TOKEN_PATH}`,
                "👉 Action required:",
                "   1. Generate Gmail OAuth token",
                "   2. Save it as gmail-token.json",
                "   3. Ensure the file is gitignored"
            ].join("\n")
        );
    }

    return JSON.parse(fs.readFileSync(TOKEN_PATH, "utf-8"));
}

/* ============================================================
   🔐 PREFLIGHT: Validate Gmail OAuth
   ============================================================ */
export async function validateGmailAuth(): Promise<void> {
    try {
        const token = loadGmailToken();

        const oAuth2Client = new google.auth.OAuth2(
            token.client_id,
            token.client_secret,
            token.redirect_uri
        );

        oAuth2Client.setCredentials({
            refresh_token: token.refresh_token
        });

        const gmail = google.gmail({ version: "v1", auth: oAuth2Client });

        // Lightweight validation
        await gmail.users.labels.list({ userId: "me" });
    } catch (error: any) {
        if (
            error?.response?.data?.error === "invalid_grant" ||
            error?.message?.includes("invalid_grant")
        ) {
            throw new Error(
                [
                    "GMAIL AUTHENTICATION ERROR",
                    "❌ Refresh token is invalid or expired.",
                    "👉 Action required:",
                    "   1. Re-generate gmail-token.json",
                    "   2. Replace local token file",
                    "   3. Re-run the test"
                ].join("\n")
            );
        }

        throw new Error(`GMAIL PREFLIGHT FAILURE: ${error.message}`);
    }
}

/* ============================================================
   📩 WAIT FOR EMAIL (Precise Time)
   ============================================================ */
export async function waitForEmailWithPreciseTime(
    fromEmail: string,
    subject: string,
    timeoutInSeconds: number,
    pollIntervalInSeconds: number,
    actionTime: Date
): Promise<gmail_v1.Schema$Message> {
    console.log(
        `[GMAIL] Waiting for email\n` +
            `        From   : ${fromEmail}\n` +
            `        Subject: "${subject}"\n` +
            `        After  : ${actionTime.toISOString()}`
    );

    await validateGmailAuth();
    console.log("[GMAIL] Auth validated successfully");

    const token = loadGmailToken();
    const oAuth2Client = new google.auth.OAuth2(
        token.client_id,
        token.client_secret,
        token.redirect_uri
    );

    oAuth2Client.setCredentials({ refresh_token: token.refresh_token });
    const gmail = google.gmail({ version: "v1", auth: oAuth2Client });

    const timeoutMs = timeoutInSeconds * 1000;
    const pollIntervalMs = pollIntervalInSeconds * 1000;
    const afterEpochSeconds = Math.floor(actionTime.getTime() / 1000);

    const query = `from:${fromEmail} subject:(${subject}) after:${afterEpochSeconds}`;
    const start = Date.now();
    let attempt = 1;

    while (Date.now() - start < timeoutMs) {
        console.log(`[GMAIL][POLL] Attempt ${attempt}`);

        const res = await gmail.users.messages.list({
            userId: "me",
            q: query,
            maxResults: 5
        });

        const messages = res.data.messages ?? [];
        console.log(
            `[GMAIL][POLL] Found ${messages.length} candidate email(s)`
        );

        for (const msg of messages) {
            const full = await gmail.users.messages.get({
                userId: "me",
                id: msg.id!,
                format: "metadata",
                metadataHeaders: ["Date", "Subject", "From"]
            });

            const headers = full.data.payload?.headers ?? [];
            const date = headers.find((h) => h.name === "Date")?.value;
            const emailDate = date ? new Date(date) : null;

            console.log(
                `[GMAIL][CHECK] Checking email received at: ${
                    emailDate?.toISOString() ?? "unknown"
                }`
            );

            if (emailDate && emailDate >= actionTime) {
                console.log("[GMAIL][OK] Matching email received ✔");
                return full.data;
            } else {
                console.log("[GMAIL][CHECK] Ignored (older than action time)");
            }
        }

        console.log(
            `[GMAIL][WAIT] No valid email yet. Waiting ${pollIntervalInSeconds}s before retry`
        );

        await new Promise((res) => setTimeout(res, pollIntervalMs));
        attempt++;
    }

    throw new Error(
        [
            "EMAIL NOT RECEIVED",
            `❌ Timeout after ${timeoutInSeconds}s`,
            `From   : ${fromEmail}`,
            `Subject: ${subject}`,
            `After  : ${actionTime.toISOString()}`
        ].join("\n")
    );
}
