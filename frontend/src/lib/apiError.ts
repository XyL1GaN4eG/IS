import { ResponseError } from "@/src/api";

/**
 * Extracts a human-friendly error message from OpenAPI fetch errors.
 */
export async function extractApiErrorMessage(err: unknown, fallback = "Ошибка сервера"): Promise<string> {
    if (err instanceof ResponseError) {
        try {
            const payload = await err.response.text();
            if (!payload) {
                return fallback;
            }

            try {
                const json = JSON.parse(payload);
                if (typeof json.message === "string") {
                    return json.message;
                }
                if (typeof json.error === "string") {
                    return json.error;
                }
            } catch {
                // not JSON, fall back to raw text
                return payload;
            }
            return payload;
        } catch {
            return fallback;
        }
    }

    if (err instanceof Error && err.message) {
        return err.message;
    }

    return fallback;
}
