import { env } from "cloudflare:workers";
import { getChatGPTUser } from "../app/chatgpt-auth";
export class HttpError extends Error {
    constructor(public status: number, message: string) { super(message); }
}
export async function identity(request?: Request) {
    const user = await getChatGPTUser();
    if (!user)
        throw new HttpError(401, "Please sign in to continue.");
    if (request) {
        const origin = request.headers.get("origin");
        if (origin && origin !== new URL(request.url).origin)
            throw new HttpError(403, "Request origin is not allowed.");
    }
    return user;
}
export function database() { if (!env.DB)
    throw new HttpError(503, "Database is not connected yet."); return env.DB; }
export async function api(fn: () => Promise<Response>) {
    try {
        return await fn();
    }
    catch (e) {
        if (e instanceof HttpError)
            return Response.json({ error: e.message }, { status: e.status });
        if (e && typeof e === 'object' && 'issues' in e)
            return Response.json({ error: "Please check the form fields and try again." }, { status: 400 });
        if (e instanceof SyntaxError)
            return Response.json({ error: "Invalid request body." }, { status: 400 });
        const detail = String(e) + String(e instanceof Error ? e.cause : "");
        if (/UNIQUE constraint failed/i.test(detail))
            return Response.json({ error: "That slot is already taken, or you already have a session at this time. Please refresh and choose another." }, { status: 409 });
        console.error("Slotwise API error", e);
        return Response.json({ error: "Something went wrong. Please try again." }, { status: 500 });
    }
}
export function json(data: unknown, status = 200) { return Response.json(data, { status, headers: { "Cache-Control": "no-store" } }); }
