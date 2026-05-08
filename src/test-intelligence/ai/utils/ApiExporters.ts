/**
 * ApiExporters
 *
 * Deterministic export utilities that convert EndpointProfile[] into:
 *   1. Postman Collection v2.1 JSON — importable into Postman / Newman
 *   2. OpenAPI 3.0 paths block JSON — mergeable into a full spec
 *
 * Both exporters work from the pre-analysed EndpointProfile[] produced by
 * ApiTrafficAnalyzer. They are called by ApiIntelligenceAgent when
 * --postman or --openapi flags are set.
 *
 * ── Design constraints ───────────────────────────────────────────────────────
 *   - Pure functions; no I/O, no external dependencies.
 *   - Exports are "draft" — variable names use SIMS Finance conventions,
 *     but concrete values must be validated before production use.
 *   - Sensitive data is never present in EndpointProfile (masked upstream
 *     by NetworkCapture), so exports are safe to commit to version control.
 */

import type { EndpointProfile } from "../../contracts/ApiTrace";

// ─────────────────────────────────────────────────────────────────────────────
// Postman Collection v2.1
// ─────────────────────────────────────────────────────────────────────────────

interface PostmanCollection {
    info: {
        name: string;
        schema: string;
        description: string;
    };
    variable: Array<{ key: string; value: string; type: string }>;
    item: PostmanFolder[];
}

interface PostmanFolder {
    name: string;
    item: PostmanRequest[];
}

interface PostmanRequest {
    name: string;
    request: {
        method: string;
        header: Array<{ key: string; value: string }>;
        url: {
            raw: string;
            host: string[];
            path: string[];
            query: Array<{ key: string; value: string; disabled?: boolean }>;
        };
        body?: {
            mode: string;
            raw: string;
            options: { raw: { language: string } };
        };
    };
    response: PostmanExampleResponse[];
}

interface PostmanExampleResponse {
    name: string;
    status: string;
    code: number;
    _postman_previewlanguage: string;
    header: [];
    body: string;
}

/**
 * Generate a Postman Collection v2.1 from EndpointProfile[].
 *
 * Requests are grouped by SIMSDomain folder. Each request:
 *   - Uses {{BASE_URL}} and {{AUTH_TOKEN}} environment variables
 *   - Includes a sample body if one was captured
 *   - Includes query params with placeholder values where observed
 *
 * @param profiles   Endpoint profiles from ApiTrafficAnalyzer
 * @param sessionId  Used as the collection name suffix
 */
export function generatePostmanCollection(
    profiles: EndpointProfile[],
    sessionId: string
): PostmanCollection {
    // Group by domain
    const byDomain = new Map<string, EndpointProfile[]>();
    for (const ep of profiles) {
        const key = ep.domain;
        if (!byDomain.has(key)) byDomain.set(key, []);
        byDomain.get(key)!.push(ep);
    }

    const folders: PostmanFolder[] = [];

    for (const [domain, domainEps] of byDomain.entries()) {
        const items: PostmanRequest[] = domainEps.map((ep) => {
            const pathSegments = ep.normalizedPath
                .split("/")
                .filter(Boolean)
                .map((seg) =>
                    seg.startsWith("{") ? `:${seg.slice(1, -1)}` : seg
                );

            const queryItems = ep.observedQueryParams.map((key) => ({
                key,
                value: `{{${domain}_${key.toUpperCase()}}}`,
                disabled: true
            }));

            const url = {
                raw: `{{BASE_URL}}${ep.normalizedPath}${queryItems.length > 0 ? "?" + queryItems.map((q) => `${q.key}=${q.value}`).join("&") : ""}`,
                host: ["{{BASE_URL}}"],
                path: pathSegments,
                query: queryItems
            };

            const headers: Array<{ key: string; value: string }> = [
                { key: "Content-Type", value: "application/json" },
                { key: "Accept", value: "application/json" },
                { key: "Authorization", value: "Bearer {{AUTH_TOKEN}}" }
            ];

            const body =
                ep.sampleRequestBody &&
                ["POST", "PUT", "PATCH"].includes(ep.method)
                    ? {
                          mode: "raw",
                          raw: ep.sampleRequestBody,
                          options: { raw: { language: "json" } }
                      }
                    : undefined;

            // Example responses from observed status codes
            const responses: PostmanExampleResponse[] = Object.entries(
                ep.statusCodes
            ).map(([code, _count]) => ({
                name: `${code} Example`,
                status: httpStatusText(parseInt(code, 10)),
                code: parseInt(code, 10),
                _postman_previewlanguage: "json",
                header: [],
                body:
                    parseInt(code, 10) < 400 && ep.sampleResponseBody
                        ? ep.sampleResponseBody
                        : "{}"
            }));

            return {
                name: `${ep.method} ${ep.normalizedPath}`,
                request: { method: ep.method, header: headers, url, body },
                response: responses
            };
        });

        folders.push({ name: domain, item: items });
    }

    return {
        info: {
            name: `SIMS Finance API — ${sessionId}`,
            schema: "https://schema.getpostman.com/json/collection/v2.1.0/collection.json",
            description:
                "Auto-generated from Playwright network capture. " +
                "Validate endpoints and replace placeholder values before use. " +
                "Generated by ApiIntelligenceAgent."
        },
        variable: [
            {
                key: "BASE_URL",
                value: process.env.URL ?? "https://sims.example.com",
                type: "string"
            },
            { key: "AUTH_TOKEN", value: "", type: "string" }
        ],
        item: folders
    };
}

// ─────────────────────────────────────────────────────────────────────────────
// OpenAPI 3.0 paths block
// ─────────────────────────────────────────────────────────────────────────────

type OpenApiMethod =
    | "get"
    | "post"
    | "put"
    | "patch"
    | "delete"
    | "head"
    | "options";

interface OpenApiPaths {
    [path: string]: {
        [method in OpenApiMethod]?: OpenApiOperation;
    };
}

interface OpenApiOperation {
    summary: string;
    tags: string[];
    parameters: OpenApiParameter[];
    requestBody?: {
        required: boolean;
        content: {
            "application/json": { schema: { type: string; example?: unknown } };
        };
    };
    responses: Record<
        string,
        {
            description: string;
            content?: { "application/json": { schema: { type: string } } };
        }
    >;
    "x-sims-domain": string;
    "x-observed-calls": number;
    "x-auto-generated": boolean;
}

interface OpenApiParameter {
    name: string;
    in: "path" | "query" | "header";
    required: boolean;
    schema: { type: string };
    description?: string;
}

/**
 * Generate an OpenAPI 3.0 paths block from EndpointProfile[].
 *
 * The output is a partial OpenAPI spec (paths only). It can be merged
 * into a full openapi.yaml by a developer:
 *   - Path parameters are inferred from {param} placeholders
 *   - Query parameters are listed with names observed in traffic
 *   - Request body schema is stubbed when a sample body was captured
 *   - Responses are listed from observed status codes
 *   - x-sims-domain and x-auto-generated extensions are added
 *
 * @param profiles  Endpoint profiles from ApiTrafficAnalyzer
 */
export function generateOpenApiPaths(
    profiles: EndpointProfile[]
): OpenApiPaths {
    const paths: OpenApiPaths = {};

    for (const ep of profiles) {
        // Convert normalized path to OpenAPI style: {id} stays as-is, {uuid} → {uuid}
        const openApiPath = ep.normalizedPath
            .replace(/\{uuid\}/g, "{uuid}")
            .replace(/\{date\}/g, "{date}");

        if (!paths[openApiPath]) paths[openApiPath] = {};

        const method = ep.method.toLowerCase() as OpenApiMethod;

        // Path parameters from placeholders
        const pathParams: OpenApiParameter[] = (
            openApiPath.match(/\{[^}]+\}/g) ?? []
        ).map((match) => ({
            name: match.slice(1, -1),
            in: "path",
            required: true,
            schema: { type: "string" },
            description: `Path parameter inferred from observed URL patterns`
        }));

        // Query parameters from observed keys
        const queryParams: OpenApiParameter[] = ep.observedQueryParams.map(
            (key) => ({
                name: key,
                in: "query",
                required: false,
                schema: { type: "string" }
            })
        );

        // Request body (POST/PUT/PATCH)
        const requestBody =
            ep.sampleRequestBody && ["post", "put", "patch"].includes(method)
                ? {
                      required: true,
                      content: {
                          "application/json": {
                              schema: {
                                  type: "object",
                                  example: tryParseJson(ep.sampleRequestBody)
                              }
                          }
                      }
                  }
                : undefined;

        // Responses from observed status codes
        const responses: Record<
            string,
            {
                description: string;
                content?: { "application/json": { schema: { type: string } } };
            }
        > = {};
        for (const [code] of Object.entries(ep.statusCodes)) {
            const intCode = parseInt(code, 10);
            responses[code] = {
                description: httpStatusText(intCode),
                ...(intCode < 400
                    ? {
                          content: {
                              "application/json": { schema: { type: "object" } }
                          }
                      }
                    : {})
            };
        }

        if (Object.keys(responses).length === 0) {
            responses["200"] = {
                description: "OK",
                content: { "application/json": { schema: { type: "object" } } }
            };
        }

        paths[openApiPath][method] = {
            summary: `${ep.method} ${openApiPath}`,
            tags: [ep.domain],
            parameters: [...pathParams, ...queryParams],
            ...(requestBody ? { requestBody } : {}),
            responses,
            "x-sims-domain": ep.domain,
            "x-observed-calls": ep.callCount,
            "x-auto-generated": true
        };
    }

    return paths;
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function httpStatusText(code: number): string {
    const map: Record<number, string> = {
        200: "OK",
        201: "Created",
        204: "No Content",
        400: "Bad Request",
        401: "Unauthorized",
        403: "Forbidden",
        404: "Not Found",
        409: "Conflict",
        422: "Unprocessable Entity",
        429: "Too Many Requests",
        500: "Internal Server Error",
        502: "Bad Gateway",
        503: "Service Unavailable"
    };
    return map[code] ?? `HTTP ${code}`;
}

function tryParseJson(raw: string): unknown {
    try {
        return JSON.parse(raw);
    } catch {
        return raw;
    }
}
