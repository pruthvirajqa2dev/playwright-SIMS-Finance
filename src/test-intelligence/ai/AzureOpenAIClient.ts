/**
 * AzureOpenAIClient.ts
 *
 * Singleton wrapper around the Azure OpenAI SDK.
 * Credentials are read exclusively from environment variables — never
 * hard-coded — so the file is safe to commit.
 *
 * Required environment variables (add to src/config/.env, gitignored):
 *   AZURE_OPENAI_ENDPOINT   — e.g. https://<resource>.openai.azure.com
 *   AZURE_OPENAI_API_KEY    — your AI Foundry resource key
 *   AZURE_OPENAI_DEPLOYMENT — deployment name, e.g. gpt-4o
 */

import path from "path";
import { config as dotenvConfig } from "dotenv";
import { AzureOpenAI } from "openai";

// Load src/config/.env when agents are run directly via ts-node
// (playwright.config.ts handles this for test runs, but not for standalone agent scripts).
// dotenv silently skips if variables are already set (e.g. in CI), so this is safe.
dotenvConfig({ path: path.resolve(__dirname, "../../config/.env") });

let _client: AzureOpenAI | null = null;

export function getAzureOpenAIClient(): AzureOpenAI {
    if (_client) return _client;

    const endpoint = process.env.AZURE_OPENAI_ENDPOINT;
    const apiKey = process.env.AZURE_OPENAI_API_KEY;

    if (!endpoint || !apiKey) {
        throw new Error(
            "Missing Azure OpenAI credentials.\n" +
                "Set AZURE_OPENAI_ENDPOINT and AZURE_OPENAI_API_KEY in your .env file."
        );
    }

    _client = new AzureOpenAI({
        endpoint,
        apiKey,
        apiVersion: "2025-01-01-preview"
    });

    return _client;
}

/** Deployment name used for chat completions */
export function getDeployment(): string {
    return process.env.AZURE_OPENAI_DEPLOYMENT ?? "gpt-4o";
}
